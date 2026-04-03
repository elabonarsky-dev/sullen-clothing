import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SHOPIFY_STORE = "sullenclothing.myshopify.com";
const SHOPIFY_ADMIN_API_VERSION = "2026-01";
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

async function shopifyGraphQL(shopifyToken: string, query: string, variables: Record<string, unknown> = {}) {
  const res = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": shopifyToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Shopify GraphQL ${res.status}: ${body}`);
  }
  return res.json();
}

async function shopifyREST(shopifyToken: string, path: string, method = "GET", body?: unknown) {
  const opts: RequestInit = {
    method,
    headers: {
      "X-Shopify-Access-Token": shopifyToken,
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_ADMIN_API_VERSION}${path}`,
    opts
  );
  const text = await res.text();
  if (!res.ok) throw new Error(`Shopify REST ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller (must be admin/cs)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return respond({ error: "Authentication required" }, 401);
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceRoleKey
    );

    // Try to get user from the JWT — if it fails, check if it's a service role call
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callerUser }, error: userError } = await supabase.auth.getUser(token);

    if (callerUser) {
      // Verify caller is admin or customer_service
      const { data: hasRole } = await supabase.rpc("has_any_role", {
        _user_id: callerUser.id,
        _roles: ["admin", "customer_service"],
      });
      if (!hasRole) {
        return respond({ error: "Forbidden" }, 403);
      }
      console.log("Authenticated as user:", callerUser.email);
    } else {
      // If getUser fails, check if this is a service_role JWT by decoding
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.role !== "service_role") {
          console.error("Auth failed — not a user and not service_role:", userError?.message);
          return respond({ error: "Authentication required" }, 401);
        }
        console.log("Authenticated via service role");
      } catch {
        return respond({ error: "Authentication required" }, 401);
      }
    }

    const { return_request_id } = await req.json();
    if (!return_request_id) {
      return respond({ error: "return_request_id is required" }, 400);
    }

    // 1. Fetch the return request
    const { data: returnReq, error: reqErr } = await supabase
      .from("return_requests")
      .select("*")
      .eq("id", return_request_id)
      .single();

    if (reqErr || !returnReq) {
      return respond({ error: "Return request not found" }, 404);
    }

    // Accept both pending and approved status — allows one-click approve+process
    if (!["pending", "approved"].includes(returnReq.status)) {
      return respond({ error: `Return must be 'pending' or 'approved', currently '${returnReq.status}'` }, 400);
    }

    // If pending, move to approved first
    if (returnReq.status === "pending") {
      await supabase
        .from("return_requests")
        .update({ status: "approved" })
        .eq("id", return_request_id);
    }

    // 2. Fetch return items
    const { data: returnItems, error: itemsErr } = await supabase
      .from("return_items")
      .select("*")
      .eq("return_request_id", return_request_id);

    if (itemsErr || !returnItems || returnItems.length === 0) {
      return respond({ error: "No return items found" }, 404);
    }

    // 3. Get Shopify access token from site_settings (stored by OAuth callback)
    //    Falls back to SHOPIFY_ACCESS_TOKEN env var for backward compat
    let shopifyToken = Deno.env.get("SHOPIFY_ACCESS_TOKEN") || "";

    const { data: tokenSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "shopify_returns_token")
      .single();

    if (tokenSetting?.value) {
      shopifyToken = tokenSetting.value;
      console.log("Using OAuth token from site_settings");
    }

    if (!shopifyToken) {
      console.error("No Shopify access token found in site_settings or env");
      return respond({ error: "Service configuration error — Shopify app not yet authorized. Please install the Returns Portal app in Shopify Admin." }, 500);
    }

    const orderUrl = `/orders/${returnReq.order_id}.json?fields=id,line_items,name,fulfillments`;
    console.log(`Fetching Shopify order: ${orderUrl}, token length: ${shopifyToken.length}`);

    const orderData = await shopifyREST(
      shopifyToken,
      orderUrl
    );
    const shopifyOrder = orderData.order;
    if (!shopifyOrder) {
      return respond({ error: "Order not found in Shopify" }, 404);
    }

    // 4. Match return items to Shopify line_item_ids by title + variant
    const matchedLineItems: Array<{ line_item_id: number; quantity: number; fulfillment_line_item_id?: string }> = [];
    const usedLineItemIds = new Set<number>();

    for (const ri of returnItems) {
      const match = shopifyOrder.line_items.find((li: any) => {
        if (usedLineItemIds.has(li.id)) return false;
        const titleMatch = li.title === ri.line_item_title;
        if (ri.line_item_variant) {
          const variantMatch = li.variant_title === ri.line_item_variant ||
            li.name?.includes(ri.line_item_variant);
          return titleMatch && variantMatch;
        }
        return titleMatch;
      });

      if (!match) {
        console.error(`Could not match return item "${ri.line_item_title}" (${ri.line_item_variant}) to Shopify order`);
        return respond({
          error: `Could not match item "${ri.line_item_title}" to the Shopify order. Manual processing may be needed.`,
        }, 400);
      }

      usedLineItemIds.add(match.id);

      // Find the fulfillment_line_item_id from fulfillments
      let fulfillmentLineItemId: string | undefined;
      for (const f of (shopifyOrder.fulfillments || [])) {
        const fli = f.line_items?.find((fli: any) => fli.id === match.id);
        if (fli) {
          fulfillmentLineItemId = fli.id?.toString();
          break;
        }
      }

      matchedLineItems.push({
        line_item_id: match.id,
        quantity: ri.quantity,
        fulfillment_line_item_id: fulfillmentLineItemId,
      });
    }

    console.log(`Matched ${matchedLineItems.length} line items for return ${returnReq.order_name}`);

    // 5. Skip Shopify Return & label creation — write_returns scope not available
    const shopifyReturnId: string | null = returnReq.shopify_return_id || null;
    const returnLabelUrl: string | null = null;

    console.log("Skipping Shopify Return creation (no write_returns scope). Proceeding with resolution processing.");

    // Group items by resolution type
    const refundItems = returnItems.filter((ri: any) => ri.resolution === "refund");
    const storeCreditItems = returnItems.filter((ri: any) => ri.resolution === "store_credit");
    const exchangeItems = returnItems.filter((ri: any) => ri.resolution === "exchange");

    let refundId: string | null = null;
    let refundAmount = 0;
    let giftCardCode: string | null = null;
    let giftCardAmount = 0;
    let exchangeDraftOrderName: string | null = null;
    const notes: string[] = [returnReq.admin_notes].filter(Boolean) as string[];

    // ─── REFUND items: issue Shopify refund to original payment ───
    if (refundItems.length > 0) {
      const refundLineItemIds = refundItems.map((ri: any) => {
        const matched = matchedLineItems.find((m) =>
          shopifyOrder.line_items.find((li: any) => li.id === m.line_item_id && li.title === ri.line_item_title)
        );
        return matched;
      }).filter(Boolean);

      if (refundLineItemIds.length > 0) {
        const calcBody = {
          refund: {
            notify: true,
            shipping: { full_refund: false },
            refund_line_items: refundLineItemIds.map((li: any) => ({
              line_item_id: li.line_item_id,
              quantity: li.quantity,
              restock_type: "no_restock",
            })),
          },
        };

        const calcData = await shopifyREST(shopifyToken, `/orders/${returnReq.order_id}/refunds/calculate.json`, "POST", calcBody);
        const calculatedRefund = calcData.refund;

        const refundBody: any = {
          refund: {
            notify: true,
            note: `Return ${returnReq.order_name} – Refund via Returns Portal`,
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

        const refundData = await shopifyREST(shopifyToken, `/orders/${returnReq.order_id}/refunds.json`, "POST", refundBody);
        refundId = refundData.refund?.id;
        refundAmount = calculatedRefund.transactions?.reduce((sum: number, t: any) => sum + parseFloat(t.amount || "0"), 0) || 0;
        console.log(`Refund ${refundId} created for $${refundAmount}`);
        notes.push(`Refund #${refundId} ($${refundAmount.toFixed(2)}) issued on ${new Date().toLocaleDateString()}`);
      }
    }

    // ─── STORE CREDIT items: create Shopify gift card ───
    if (storeCreditItems.length > 0) {
      giftCardAmount = storeCreditItems.reduce((sum: number, ri: any) => sum + (ri.line_item_price * ri.quantity), 0);

      if (giftCardAmount > 0) {
        try {
          const gcData = await shopifyREST(shopifyToken, `/gift_cards.json`, "POST", {
            gift_card: {
              initial_value: giftCardAmount.toFixed(2),
              note: `Store credit for return ${returnReq.order_name}`,
              template_suffix: null,
            },
          });
          giftCardCode = gcData.gift_card?.code;
          console.log(`Gift card created: $${giftCardAmount.toFixed(2)}, code: ${giftCardCode?.slice(0, 4)}...`);
          notes.push(`Store credit gift card ($${giftCardAmount.toFixed(2)}) created on ${new Date().toLocaleDateString()}`);
        } catch (gcErr) {
          console.error("Gift card creation failed:", gcErr);
          // Do NOT fall back to refund — surface the error so admin can investigate
          notes.push(`⚠️ Store credit gift card creation FAILED for $${giftCardAmount.toFixed(2)}. Error: ${gcErr instanceof Error ? gcErr.message : String(gcErr)}. Manual action required.`);
          
          // Update notes but keep status as approved so admin can retry
          await supabase
            .from("return_requests")
            .update({ 
              status: "approved",
              admin_notes: notes.join("\n"),
            })
            .eq("id", return_request_id);
          
          return respond({ 
            error: `Store credit gift card creation failed. The return has been kept in 'approved' status so you can retry. Error: ${gcErr instanceof Error ? gcErr.message : String(gcErr)}`,
          }, 500);
        }
      }
    }

    // ─── EXCHANGE items: create a draft order for the exchange product ───
    if (exchangeItems.length > 0) {
      for (const ei of exchangeItems) {
        if (!ei.exchange_variant_id) {
          notes.push(`Exchange item "${ei.line_item_title}" has no exchange variant — needs manual processing.`);
          continue;
        }

        try {
          const draftData = await shopifyREST(shopifyToken, `/draft_orders.json`, "POST", {
            draft_order: {
              line_items: [{
                variant_id: parseInt(ei.exchange_variant_id, 10),
                quantity: ei.quantity,
              }],
              email: returnReq.order_email,
              note: `Exchange for return ${returnReq.order_name} — original item: ${ei.line_item_title}`,
              tags: "exchange,returns-portal",
              applied_discount: {
                title: "Exchange Credit",
                value: (ei.line_item_price * ei.quantity).toFixed(2),
                value_type: "fixed_amount",
                amount: (ei.line_item_price * ei.quantity).toFixed(2),
                description: `Credit for returned item: ${ei.line_item_title}`,
              },
            },
          });

          const draftOrder = draftData.draft_order;
          exchangeDraftOrderName = draftOrder?.name;
          console.log(`Exchange draft order created: ${draftOrder?.name}`);
          notes.push(`Exchange draft order ${draftOrder?.name} created for "${ei.exchange_variant_title || ei.line_item_title}" on ${new Date().toLocaleDateString()}`);

          // Auto-complete the draft order (sends invoice to customer)
          try {
            await shopifyREST(shopifyToken, `/draft_orders/${draftOrder.id}/send_invoice.json`, "POST", {
              draft_order_invoice: {
                to: returnReq.order_email,
                subject: `Your exchange order for ${returnReq.order_name}`,
                custom_message: `Your exchange has been approved. Please complete your order for the new item.`,
              },
            });
            notes.push(`Exchange invoice sent to ${returnReq.order_email}`);
          } catch (invoiceErr) {
            console.error("Failed to send exchange invoice:", invoiceErr);
            notes.push(`Exchange draft order created but invoice send failed — customer may need to be contacted manually.`);
          }
        } catch (draftErr) {
          console.error("Exchange draft order creation failed:", draftErr);
          notes.push(`Exchange for "${ei.line_item_title}" failed — needs manual processing.`);
        }
      }
    }

    // 9. Update return status and store notes
    const updatePayload: Record<string, any> = {
      status: "completed",
      admin_notes: notes.join("\n"),
    };

    if (shopifyReturnId) updatePayload.shopify_return_id = shopifyReturnId;
    if (returnLabelUrl) updatePayload.return_label_url = returnLabelUrl;

    await supabase
      .from("return_requests")
      .update(updatePayload)
      .eq("id", return_request_id);

    // 10. Send notification email
    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "return-approved",
          recipientEmail: returnReq.order_email,
          idempotencyKey: `return-processed-${return_request_id}`,
          templateData: {
            orderName: returnReq.order_name,
            items: returnItems.map((i: any) => ({
              title: i.line_item_title,
              variant: i.line_item_variant,
              resolution: i.resolution,
            })),
            reason: returnReq.reason,
            refundAmount: refundAmount > 0 ? refundAmount.toFixed(2) : null,
            storeCreditAmount: giftCardAmount > 0 ? giftCardAmount.toFixed(2) : null,
            giftCardCode: giftCardCode,
            exchangeDraftOrderName: exchangeDraftOrderName,
            returnLabelUrl: returnLabelUrl || null,
          },
        },
      });
    } catch (emailErr) {
      console.error("Failed to send return notification email:", emailErr);
    }

    // Build summary
    const summaryParts: string[] = [];
    if (refundAmount > 0) summaryParts.push(`Refund of $${refundAmount.toFixed(2)} issued`);
    if (giftCardAmount > 0) summaryParts.push(`Store credit of $${giftCardAmount.toFixed(2)} issued${giftCardCode ? ` (code: ${giftCardCode})` : ""}`);
    if (exchangeDraftOrderName) summaryParts.push(`Exchange order ${exchangeDraftOrderName} created`);
    if (summaryParts.length === 0) summaryParts.push("Return processed");

    return respond({
      success: true,
      refund_id: refundId,
      refund_amount: refundAmount > 0 ? refundAmount.toFixed(2) : null,
      store_credit_amount: giftCardAmount > 0 ? giftCardAmount.toFixed(2) : null,
      gift_card_code: giftCardCode,
      exchange_draft_order: exchangeDraftOrderName,
      shopify_return_id: shopifyReturnId,
      return_label_url: returnLabelUrl,
      message: summaryParts.join(". ") + ".",
    });
  } catch (err) {
    console.error("Process approved return error:", err);
    return respond({ error: "Internal server error" }, 500);
  }
});
