import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SHOPIFY_STORE = "sullenclothing.myshopify.com";
const SHOPIFY_ADMIN_API_VERSION = "2026-01";

interface ReturnItem {
  line_item_title: string;
  line_item_variant: string | null;
  line_item_image: string | null;
  line_item_price: number;
  quantity: number;
  resolution: "exchange" | "store_credit" | "refund";
  exchange_product_handle?: string;
  exchange_variant_id?: string;
  exchange_variant_title?: string;
}

interface FraudResult {
  score: number;
  flags: string[];
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";
}

async function calculateFraudScore(
  supabase: any,
  orderEmail: string,
  orderId: string,
  items: ReturnItem[],
  daysSinceOrder: number
): Promise<FraudResult> {
  let score = 0;
  const flags: string[] = [];

  // 1. Check return history for this email (frequent returners)
  const { data: previousReturns } = await supabase
    .from("return_requests")
    .select("id, created_at")
    .eq("order_email", orderEmail)
    .not("status", "in", '("cancelled","rejected")')
    .order("created_at", { ascending: false })
    .limit(20);

  const returnCount = previousReturns?.length || 0;

  if (returnCount >= 5) {
    score += 40;
    flags.push(`serial_returner:${returnCount}_previous_returns`);
  } else if (returnCount >= 3) {
    score += 25;
    flags.push(`frequent_returner:${returnCount}_previous_returns`);
  } else if (returnCount >= 1) {
    score += 10;
    flags.push(`repeat_returner:${returnCount}_previous_returns`);
  }

  // 2. Returns within the last 30 days from same email (burst pattern)
  if (previousReturns && previousReturns.length > 0) {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentReturns = previousReturns.filter(
      (r: any) => new Date(r.created_at).getTime() > thirtyDaysAgo
    );
    if (recentReturns.length >= 2) {
      score += 20;
      flags.push(`burst_pattern:${recentReturns.length}_returns_in_30_days`);
    }
  }

  // 3. High-value return (total > $200)
  const totalValue = items.reduce((sum, i) => sum + i.line_item_price * i.quantity, 0);
  if (totalValue >= 500) {
    score += 30;
    flags.push(`very_high_value:$${totalValue.toFixed(2)}`);
  } else if (totalValue >= 200) {
    score += 15;
    flags.push(`high_value:$${totalValue.toFixed(2)}`);
  }

  // 4. Near end of return window (days 25-30)
  if (daysSinceOrder >= 27) {
    score += 20;
    flags.push(`window_edge:day_${daysSinceOrder}_of_30`);
  } else if (daysSinceOrder >= 25) {
    score += 10;
    flags.push(`late_return:day_${daysSinceOrder}_of_30`);
  }

  // 5. All items requesting refund (no exchange/credit = less loyal intent)
  const allRefunds = items.every((i) => i.resolution === "refund");
  if (allRefunds && items.length > 1) {
    score += 15;
    flags.push("full_refund_all_items");
  }

  // 6. Returning entire order (every line item)
  if (items.length >= 4) {
    score += 10;
    flags.push(`bulk_return:${items.length}_items`);
  }

  // Cap at 100
  score = Math.min(score, 100);

  return { score, flags };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller's JWT to get authentic user ID
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Authentication required to submit a return" }, 401);
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims?.sub) {
      return jsonResponse({ error: "Authentication required to submit a return" }, 401);
    }
    const user_id = claimsData.claims.sub as string;

    const { order_id, order_name, order_email, reason, items } = await req.json();

    if (!order_id || !order_name || !order_email || !items || items.length === 0) {
      return jsonResponse({ error: "Missing required fields" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Rate limiting: 3 submissions per user per 60 minutes
    const clientIP = getClientIP(req);
    const rateLimitKey = `submit-return:${user_id}:${clientIP}`;

    const { data: allowed } = await supabase.rpc("check_rate_limit", {
      p_key: rateLimitKey,
      p_max_attempts: 3,
      p_window_minutes: 60,
    });

    if (allowed === false) {
      return jsonResponse({
        error: "Too many return submissions. Please wait before trying again.",
      }, 429);
    }

    // Prevent duplicate returns
    const { data: existingReturn } = await supabase
      .from("return_requests")
      .select("id, status")
      .eq("order_id", order_id)
      .not("status", "in", '("cancelled","rejected")')
      .limit(1)
      .maybeSingle();

    if (existingReturn) {
      return jsonResponse({
        error: "A return request already exists for this order. Please contact support if you need to modify it.",
      }, 409);
    }

    // Validate quantities against Shopify order — try OAuth token first
    let shopifyToken = Deno.env.get("SHOPIFY_ACCESS_TOKEN") || "";
    try {
      const { data: tokenSetting } = await supabase
        .from("site_settings").select("value").eq("key", "shopify_returns_token").single();
      if (tokenSetting?.value) shopifyToken = tokenSetting.value;
    } catch (_) { /* use env var */ }
    if (!shopifyToken) {
      console.error("No SHOPIFY_ACCESS_TOKEN found");
      return jsonResponse({ error: "Service configuration error" }, 500);
    }

    const orderRes = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/orders/${order_id}.json?fields=id,line_items,created_at`,
      {
        headers: {
          "X-Shopify-Access-Token": shopifyToken,
          "Content-Type": "application/json",
        },
      }
    );

    if (!orderRes.ok) {
      console.error("Failed to fetch order for validation:", orderRes.status);
      return jsonResponse({ error: "Could not verify order details" }, 500);
    }

    const { order: shopifyOrder } = await orderRes.json();
    if (!shopifyOrder) {
      return jsonResponse({ error: "Order not found" }, 404);
    }

    const shopifyItemMap = new Map<string, number>();
    for (const li of shopifyOrder.line_items) {
      const key = li.title;
      shopifyItemMap.set(key, (shopifyItemMap.get(key) || 0) + li.quantity);
    }

    for (const item of items as ReturnItem[]) {
      const maxQty = shopifyItemMap.get(item.line_item_title);
      if (maxQty === undefined) {
        return jsonResponse({
          error: `Item "${item.line_item_title}" was not found in this order`,
        }, 400);
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > maxQty) {
        return jsonResponse({
          error: `Invalid quantity for "${item.line_item_title}". Maximum is ${maxQty}.`,
        }, 400);
      }
    }

    // ── Fraud scoring ──
    const orderDate = new Date(shopifyOrder.created_at);
    const daysSinceOrder = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    const fraud = await calculateFraudScore(supabase, order_email, order_id, items as ReturnItem[], daysSinceOrder);

    console.log(`Fraud score for ${order_name}: ${fraud.score} — flags: ${fraud.flags.join(", ") || "none"}`);

    // Auto-approve logic: exchanges under $100 AND low fraud score
    const totalValue = (items as ReturnItem[]).reduce(
      (sum, i) => sum + i.line_item_price * i.quantity,
      0
    );
    const allExchanges = (items as ReturnItem[]).every((i) => i.resolution === "exchange");
    const autoApprove = allExchanges && totalValue <= 100 && fraud.score < 30;

    const { data: returnRequest, error: reqError } = await supabase
      .from("return_requests")
      .insert({
        user_id,
        order_id,
        order_name,
        order_email,
        reason: reason || null,
        status: autoApprove ? "approved" : "pending",
        fraud_score: fraud.score,
        fraud_flags: fraud.flags,
      })
      .select("id")
      .single();

    if (reqError) {
      return jsonResponse({ error: reqError.message }, 500);
    }

    const returnItems = (items as ReturnItem[]).map((item) => ({
      return_request_id: returnRequest.id,
      line_item_title: item.line_item_title,
      line_item_variant: item.line_item_variant,
      line_item_image: item.line_item_image,
      line_item_price: item.line_item_price,
      quantity: item.quantity,
      resolution: item.resolution,
      exchange_product_handle: item.exchange_product_handle || null,
      exchange_variant_id: item.exchange_variant_id || null,
      exchange_variant_title: item.exchange_variant_title || null,
    }));

    const { error: itemsError } = await supabase
      .from("return_items")
      .insert(returnItems);

    if (itemsError) {
      return jsonResponse({ error: itemsError.message }, 500);
    }

    // Grant exchange bonus if auto-approved
    if (autoApprove) {
      const bonusPoints = Math.round(totalValue * 0.1 * 2);
      if (bonusPoints > 0) {
        await supabase.from("reward_transactions").insert({
          user_id,
          points: bonusPoints,
          type: "admin_adjustment",
          description: `Exchange bonus for return ${order_name}`,
          reference_id: returnRequest.id,
        });
      }
    }

    // Only trigger Shopify refund for auto-approved returns
    if (autoApprove) {
      try {
        const refundUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/process-refund`;
        const refundRes = await fetch(refundUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            order_id,
            notify_customer: true,
            note: `Return ${order_name} – auto-approved exchange via Returns Portal`,
          }),
        });
        const refundData = await refundRes.json();
        if (refundData.success) {
          console.log("Refund processed successfully:", refundData.refund_id);
        } else {
          console.error("Refund processing failed:", refundData.error);
        }
      } catch (refundErr) {
        console.error("Failed to call process-refund:", refundErr);
      }
    }

    return jsonResponse({
      success: true,
      return_id: returnRequest.id,
      status: autoApprove ? "approved" : "pending",
      message: autoApprove
        ? "Your exchange has been approved! You'll receive shipping instructions shortly."
        : "Your return request has been submitted and is under review.",
    });
  } catch (err) {
    console.error("Submit return error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
