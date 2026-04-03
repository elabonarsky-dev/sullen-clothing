import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SHOPIFY_STORE = "sullenclothing.myshopify.com";
const SHOPIFY_ADMIN_API_VERSION = "2026-01";
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
const GENERIC_ERROR = "We couldn't find a matching order. Please check your order number and email address.";

function errorResponse(message: string, status = 200) {
  return new Response(JSON.stringify({ error: message }), { status, headers: jsonHeaders });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_number, email } = await req.json();
    if (!order_number || !email) {
      return errorResponse("Order number and email are required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Rate limit
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { data: allowed } = await supabase.rpc("check_rate_limit", {
      p_key: `track-order:${clientIP}`,
      p_max_attempts: 15,
      p_window_minutes: 15,
    });
    if (allowed === false) {
      return errorResponse("Too many requests. Please wait a few minutes.", 429);
    }

    // Try OAuth token from site_settings first, fallback to env var
    let shopifyToken = Deno.env.get("SHOPIFY_ACCESS_TOKEN") || "";
    try {
      const { data: tokenSetting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "shopify_returns_token")
        .single();
      if (tokenSetting?.value) {
        shopifyToken = tokenSetting.value;
      }
    } catch (_) { /* use env var */ }
    if (!shopifyToken) {
      console.error("No Shopify access token");
      return errorResponse("Service configuration error");
    }

    const cleanNumber = order_number.toString().replace(/^#/, "");

    // Fetch order from Shopify
    const orderRes = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/orders.json?name=%23${cleanNumber}&status=any&limit=1`,
      { headers: { "X-Shopify-Access-Token": shopifyToken, "Content-Type": "application/json" } }
    );

    if (!orderRes.ok) {
      console.error("Shopify error:", orderRes.status);
      return errorResponse("Failed to look up order.");
    }

    const { orders } = await orderRes.json();
    if (!orders?.length || orders[0].email?.toLowerCase() !== email.toLowerCase()) {
      return errorResponse(GENERIC_ERROR);
    }

    const order = orders[0];

    // Fetch fulfillments
    const fulfillRes = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/orders/${order.id}/fulfillments.json`,
      { headers: { "X-Shopify-Access-Token": shopifyToken, "Content-Type": "application/json" } }
    );

    let fulfillments: any[] = [];
    if (fulfillRes.ok) {
      const data = await fulfillRes.json();
      fulfillments = data.fulfillments || [];
    }

    // Build timeline
    const timeline: any[] = [];

    // Order confirmed
    timeline.push({
      status: "confirmed",
      title: "Order Confirmed",
      description: `Order ${order.name} was placed successfully.`,
      occurred_at: order.created_at,
      completed: true,
    });

    // Payment
    if (order.financial_status === "paid" || order.financial_status === "partially_paid") {
      timeline.push({
        status: "payment",
        title: "Payment Confirmed",
        description: "Your payment has been processed.",
        occurred_at: order.created_at,
        completed: true,
      });
    }

    // Processing
    const isProcessing = order.fulfillment_status === null || order.fulfillment_status === "partial";
    const isShipped = order.fulfillment_status === "fulfilled";
    
    timeline.push({
      status: "processing",
      title: "Processing",
      description: isProcessing && !isShipped ? "Your order is being prepared." : "Your order was prepared for shipment.",
      occurred_at: fulfillments.length > 0 ? fulfillments[0].created_at : null,
      completed: fulfillments.length > 0,
    });

    // Shipped
    const primaryFulfillment = fulfillments[0];
    const trackingNumber = primaryFulfillment?.tracking_number || null;
    const trackingUrl = primaryFulfillment?.tracking_url || null;
    const carrier = primaryFulfillment?.tracking_company || null;
    const shippedAt = primaryFulfillment?.created_at || null;

    timeline.push({
      status: "shipped",
      title: "Shipped",
      description: trackingNumber
        ? `Shipped via ${carrier || "carrier"}. Tracking: ${trackingNumber}`
        : "Awaiting shipment.",
      occurred_at: shippedAt,
      completed: !!primaryFulfillment,
      tracking_number: trackingNumber,
      tracking_url: trackingUrl,
      carrier,
    });

    // Delivered (check fulfillment events or shipment_status)
    const isDelivered = primaryFulfillment?.shipment_status === "delivered";
    timeline.push({
      status: "delivered",
      title: "Delivered",
      description: isDelivered ? "Your package has been delivered!" : "Estimated delivery coming soon.",
      occurred_at: isDelivered ? primaryFulfillment?.updated_at : null,
      completed: isDelivered,
    });

    // Current overall status
    let currentStatus = "confirmed";
    if (isDelivered) currentStatus = "delivered";
    else if (primaryFulfillment) currentStatus = "shipped";
    else if (fulfillments.length > 0 || order.fulfillment_status === "partial") currentStatus = "processing";
    else if (order.financial_status === "paid") currentStatus = "processing";

    // Schedule review request on delivery detection
    if (isDelivered) {
      try {
        const lineItemsForReview = order.line_items.map((item: any) => ({
          title: item.title,
          variant_title: item.variant_title,
          quantity: item.quantity,
          price: item.price,
          image: item.image?.src || null,
          product_handle: item.handle || item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        }));

        const customerName = order.shipping_address
          ? `${order.shipping_address.first_name || ""} ${order.shipping_address.last_name || ""}`.trim()
          : "";

        // Check if review request already exists
        const { data: existingRequest } = await supabase
          .from("review_request_tokens")
          .select("id")
          .eq("order_id", order.id.toString())
          .limit(1);

        if (!existingRequest || existingRequest.length === 0) {
          const { data: tokenData } = await supabase
            .from("review_request_tokens")
            .insert({
              order_id: order.id.toString(),
              order_name: order.name,
              email: email.toLowerCase(),
              customer_name: customerName,
              line_items: lineItemsForReview,
              status: "pending",
            })
            .select("token")
            .single();

          if (tokenData) {
            const reviewUrl = `https://www.sullenclothing.com/write-review/${tokenData.token}`;

            // Send review request email
            try {
              await supabase.functions.invoke("send-transactional-email", {
                body: {
                  templateName: "review-request",
                  recipientEmail: email.toLowerCase(),
                  idempotencyKey: `review-request-${order.id}`,
                  templateData: {
                    customerName: customerName || undefined,
                    orderName: order.name,
                    token: tokenData.token,
                    items: lineItemsForReview.map((li: any) => ({
                      title: li.title || '',
                      handle: li.product_handle || '',
                      image: li.image || '',
                    })),
                  },
                },
              });

              await supabase
                .from("review_request_tokens")
                .update({ status: "sent", sent_at: new Date().toISOString() })
                .eq("token", tokenData.token);

              console.log(`Review request email sent for ${order.name} (${email})`);
            } catch (emailErr) {
              console.error("Failed to send review request email:", emailErr);
            }

            // Fire Attentive custom event for SMS journey
            try {
              const ATTENTIVE_API_KEY = Deno.env.get("ATTENTIVE_API_KEY");
              if (ATTENTIVE_API_KEY) {
                const eventPayload = {
                  type: "ce",
                  properties: {
                    $event_name: "Review Request",
                    email: email.toLowerCase(),
                    reviewUrl,
                    customerName: customerName || "",
                    orderName: order.name,
                    items: lineItemsForReview.map((li: any) => ({
                      productId: li.product_handle || li.title || "unknown",
                      productName: li.title || "",
                      productImage: li.image || "",
                      productUrl: li.product_handle
                        ? `https://www.sullenclothing.com/products/${li.product_handle}`
                        : "",
                    })),
                  },
                  user: { email: email.toLowerCase() },
                };

                await fetch("https://api.attentivemobile.com/v1/events/custom", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${ATTENTIVE_API_KEY}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(eventPayload),
                });

                console.log(`Attentive review request event sent for ${email}`);
              }
            } catch (attentiveErr) {
              console.error("Failed to send Attentive event:", attentiveErr);
            }

            console.log(`Review request created for ${order.name}, token: ${tokenData.token}`);
          }
        }
      } catch (reviewErr) {
        // Don't fail the tracking response if review request fails
        console.error("Failed to queue review request:", reviewErr);
      }
    }

    // Line items
    const lineItems = order.line_items.map((item: any) => ({
      title: item.title,
      variant_title: item.variant_title,
      quantity: item.quantity,
      price: item.price,
      image: item.image?.src || null,
    }));

    return new Response(JSON.stringify({
      order_name: order.name,
      email: order.email,
      created_at: order.created_at,
      status: currentStatus,
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      line_items: lineItems,
      timeline,
      tracking: {
        number: trackingNumber,
        url: trackingUrl,
        carrier,
      },
      shipping_address: order.shipping_address ? {
        city: order.shipping_address.city,
        province: order.shipping_address.province,
        country: order.shipping_address.country,
      } : null,
    }), { headers: jsonHeaders });
  } catch (err) {
    console.error("Track order error:", err);
    return errorResponse("Something went wrong. Please try again.");
  }
});
