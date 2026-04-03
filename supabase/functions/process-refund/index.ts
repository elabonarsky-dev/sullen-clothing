const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SHOPIFY_STORE = "sullenclothing.myshopify.com";
const SHOPIFY_ADMIN_API_VERSION = "2026-01";
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow calls authenticated with the service role key
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(
      JSON.stringify({ error: "Forbidden" }),
      { status: 403, headers: jsonHeaders }
    );
  }

  try {
    const { order_id, line_items, notify_customer = true, note } = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: "order_id is required" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // Get Shopify access token from site_settings (stored by OAuth callback)
    // Falls back to SHOPIFY_ACCESS_TOKEN env var for backward compat
    let shopifyToken = Deno.env.get("SHOPIFY_ACCESS_TOKEN") || "";

    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: tokenSetting } = await sb
        .from("site_settings")
        .select("value")
        .eq("key", "shopify_returns_token")
        .single();
      if (tokenSetting?.value) {
        shopifyToken = tokenSetting.value;
        console.log("Using OAuth token from site_settings");
      }
    } catch (e) {
      console.warn("Could not read token from site_settings, using env var:", e);
    }

    if (!shopifyToken) {
      console.error("No Shopify access token found");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 500, headers: jsonHeaders }
      );
    }

    // Step 1: Calculate the refund first
    const calcBody: any = {
      refund: {
        notify: notify_customer,
        shipping: { full_refund: false },
      },
    };

    // If specific line items provided, refund those; otherwise refund all
    if (line_items && line_items.length > 0) {
      calcBody.refund.refund_line_items = line_items.map((item: any) => ({
        line_item_id: item.line_item_id,
        quantity: item.quantity,
        restock_type: "no_restock",
      }));
    }

    console.log("Calculating refund for order:", order_id);

    const calcRes = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/orders/${order_id}/refunds/calculate.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": shopifyToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(calcBody),
      }
    );

    if (!calcRes.ok) {
      const body = await calcRes.text();
      console.error("Refund calculation failed:", calcRes.status, body);
      return new Response(
        JSON.stringify({ error: "Failed to calculate refund", details: body }),
        { status: 500, headers: jsonHeaders }
      );
    }

    const calcData = await calcRes.json();
    const calculatedRefund = calcData.refund;

    console.log("Refund calculated, transactions:", calculatedRefund.transactions?.length);

    // Step 2: Create the actual refund using calculated values
    const refundBody: any = {
      refund: {
        notify: notify_customer,
        note: note || "Refund processed via Returns Portal",
        transactions: calculatedRefund.transactions?.map((t: any) => ({
          parent_id: t.parent_id,
          amount: t.amount,
          kind: "refund",
          gateway: t.gateway,
        })) || [],
      },
    };

    if (calculatedRefund.refund_line_items?.length > 0) {
      refundBody.refund.refund_line_items = calculatedRefund.refund_line_items.map((rli: any) => ({
        line_item_id: rli.line_item_id,
        quantity: rli.quantity,
        restock_type: "no_restock",
      }));
    }

    console.log("Creating refund for order:", order_id);

    const refundRes = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/orders/${order_id}/refunds.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": shopifyToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(refundBody),
      }
    );

    if (!refundRes.ok) {
      const body = await refundRes.text();
      console.error("Refund creation failed:", refundRes.status, body);
      return new Response(
        JSON.stringify({ error: "Failed to create refund", details: body }),
        { status: 500, headers: jsonHeaders }
      );
    }

    const refundData = await refundRes.json();

    console.log("Refund created successfully:", refundData.refund?.id);

    return new Response(
      JSON.stringify({
        success: true,
        refund_id: refundData.refund?.id,
        created_at: refundData.refund?.created_at,
      }),
      { headers: jsonHeaders }
    );
  } catch (err) {
    console.error("Process refund error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
