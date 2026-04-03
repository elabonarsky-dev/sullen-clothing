import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyShopifyHmac(
  body: string,
  hmacHeader: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computed = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return computed === hmacHeader;
}

/** Check if an email was already sent for this template+recipient recently */
async function alreadySent(
  supabase: ReturnType<typeof createClient>,
  templateName: string,
  recipientEmail: string,
  windowMinutes = 10,
): Promise<boolean> {
  const { count } = await supabase
    .from("email_send_log")
    .select("id", { count: "exact", head: true })
    .eq("template_name", templateName)
    .eq("recipient_email", recipientEmail)
    .gte("created_at", new Date(Date.now() - windowMinutes * 60 * 1000).toISOString());
  return (count ?? 0) >= 1;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const webhookSecrets = Array.from(
      new Set(
        [
          Deno.env.get("SHOPIFY_WEBHOOK_SECRET")?.trim(),
          Deno.env.get("SHOPIFY_APP_CLIENT_SECRET")?.trim(),
        ].filter((s): s is string => Boolean(s))
      )
    );

    const rawBody = await req.text();

    // ── HMAC verification ──
    if (webhookSecrets.length > 0) {
      const hmac = req.headers.get("x-shopify-hmac-sha256");
      if (!hmac) {
        console.error("Missing HMAC header");
        return new Response(JSON.stringify({ error: "Missing HMAC" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      let valid = false;
      for (const secret of webhookSecrets) {
        if (await verifyShopifyHmac(rawBody, hmac, secret)) {
          valid = true;
          break;
        }
      }

      if (!valid) {
        console.error("Invalid HMAC signature");
        return new Response(JSON.stringify({ error: "Invalid HMAC" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const fulfillment = JSON.parse(rawBody);

    // Shopify fulfillment statuses: pending, open, success, cancelled, error, failure
    // shipment_status: confirmed, in_transit, out_for_delivery, delivered, failure
    const shipmentStatus = (fulfillment.shipment_status || "").toLowerCase();
    const fulfillmentStatus = (fulfillment.status || "").toLowerCase();
    const email = (fulfillment.email || fulfillment.destination?.email || "").toLowerCase().trim();
    const orderId = fulfillment.order_id?.toString() || "";
    const orderName = fulfillment.name || `#${orderId}`;

    console.log(`Fulfillment webhook: order=${orderName}, status=${fulfillmentStatus}, shipment_status=${shipmentStatus}, email=${email}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Upsert order_tracking on every fulfillment event ──
    if (email && orderId) {
      const trackingNumber = fulfillment.tracking_number || fulfillment.tracking_numbers?.[0] || null;
      const trackingUrl = fulfillment.tracking_url || fulfillment.tracking_urls?.[0] || null;
      const carrier = fulfillment.tracking_company || null;

      // Map shipment status to our tracking status
      let trackingStatus = "confirmed";
      if (shipmentStatus === "in_transit") trackingStatus = "in_transit";
      else if (shipmentStatus === "out_for_delivery") trackingStatus = "out_for_delivery";
      else if (shipmentStatus === "delivered") trackingStatus = "delivered";
      else if (fulfillmentStatus === "success" || fulfillmentStatus === "open") trackingStatus = "shipped";

      // Build upsert payload
      const upsertData: Record<string, any> = {
        order_id: orderId,
        order_name: orderName,
        email,
        status: trackingStatus,
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
        carrier,
        updated_at: new Date().toISOString(),
        last_shopify_sync: new Date().toISOString(),
      };

      // Set shipped_at on first ship event
      if (["shipped", "in_transit", "out_for_delivery", "delivered"].includes(trackingStatus)) {
        // Only set shipped_at if it hasn't been set yet (use created_at from fulfillment)
        const fulfillmentCreatedAt = fulfillment.created_at || new Date().toISOString();
        
        // Check if record already exists with shipped_at
        const { data: existing } = await supabase
          .from("order_tracking")
          .select("id, shipped_at, delivered_at")
          .eq("order_id", orderId)
          .limit(1)
          .maybeSingle();

        if (existing) {
          // Update existing record
          const updateData: Record<string, any> = {
            status: trackingStatus,
            tracking_number: trackingNumber,
            tracking_url: trackingUrl,
            carrier,
            updated_at: new Date().toISOString(),
            last_shopify_sync: new Date().toISOString(),
          };
          if (!existing.shipped_at) {
            updateData.shipped_at = fulfillmentCreatedAt;
          }
          if (trackingStatus === "delivered" && !existing.delivered_at) {
            updateData.delivered_at = new Date().toISOString();
          }
          
          const { error: updateErr } = await supabase
            .from("order_tracking")
            .update(updateData)
            .eq("id", existing.id);
          
          if (updateErr) {
            console.error("Failed to update order_tracking:", updateErr);
          } else {
            console.log(`Updated order_tracking for ${orderName}: ${trackingStatus}`);

            // Send shipping confirmation email on first ship event
            if (trackingStatus === "shipped" && !existing.shipped_at) {
              try {
                if (await alreadySent(supabase, "shipping-confirmation", email)) {
                  console.log(`Shipping confirmation already sent for ${orderName} — skipping duplicate`);
                } else {
                  const customerName = [
                    fulfillment.destination?.first_name,
                    fulfillment.destination?.last_name,
                  ].filter(Boolean).join(' ');
                  const fulfillmentItems = (fulfillment.line_items || []).map((li: any) => ({
                    title: li.title || '',
                    quantity: li.quantity || 1,
                    image: li.image?.src || '',
                  }));

                  await supabase.functions.invoke("send-transactional-email", {
                    body: {
                      templateName: "shipping-confirmation",
                      recipientEmail: email,
                      idempotencyKey: `shipping-confirm-${orderId}`,
                      templateData: {
                        customerName: customerName || undefined,
                        orderName,
                        carrier: carrier || undefined,
                        trackingNumber: trackingNumber || undefined,
                        trackingUrl: `https://www.sullenclothing.com/track?order=${encodeURIComponent(orderName)}&email=${encodeURIComponent(email)}`,
                        items: fulfillmentItems,
                      },
                    },
                  });
                  console.log(`Shipping confirmation email sent for ${orderName}`);
                }
              } catch (shipEmailErr) {
                console.error("Failed to send shipping confirmation email:", shipEmailErr);
              }
            }

            // Send delivery confirmation email
            if (trackingStatus === "delivered" && !existing.delivered_at) {
              try {
                if (await alreadySent(supabase, "delivery-confirmation", email)) {
                  console.log(`Delivery confirmation already sent for ${orderName} — skipping duplicate`);
                } else {
                  const customerName = [
                    fulfillment.destination?.first_name,
                    fulfillment.destination?.last_name,
                  ].filter(Boolean).join(' ');
                  const deliveryItems = (fulfillment.line_items || []).map((li: any) => ({
                    title: li.title || '',
                    image: li.image?.src || '',
                  }));

                  await supabase.functions.invoke("send-transactional-email", {
                    body: {
                      templateName: "delivery-confirmation",
                      recipientEmail: email,
                      idempotencyKey: `delivery-confirm-${orderId}`,
                      templateData: {
                        customerName: customerName || undefined,
                        orderName,
                        deliveredAt: new Date().toISOString(),
                        items: deliveryItems,
                      },
                    },
                  });
                  console.log(`Delivery confirmation email sent for ${orderName}`);
                }
              } catch (delEmailErr) {
                console.error("Failed to send delivery confirmation email:", delEmailErr);
              }
            }
          }
        } else {
          // Insert new record
          upsertData.shipped_at = fulfillmentCreatedAt;
          if (trackingStatus === "delivered") {
            upsertData.delivered_at = new Date().toISOString();
          }
          
          const { error: insertErr } = await supabase
            .from("order_tracking")
            .insert(upsertData);
          
          if (insertErr) {
            console.error("Failed to insert order_tracking:", insertErr);
          } else {
            console.log(`Created order_tracking for ${orderName}: ${trackingStatus}`);

            // Send shipping confirmation for new records
            if (["shipped", "in_transit"].includes(trackingStatus)) {
              try {
                if (await alreadySent(supabase, "shipping-confirmation", email)) {
                  console.log(`Shipping confirmation already sent for ${orderName} — skipping duplicate`);
                } else {
                  const customerName = [
                    fulfillment.destination?.first_name,
                    fulfillment.destination?.last_name,
                  ].filter(Boolean).join(' ');
                  const items = (fulfillment.line_items || []).map((li: any) => ({
                    title: li.title || '',
                    quantity: li.quantity || 1,
                    image: li.image?.src || '',
                  }));

                  await supabase.functions.invoke("send-transactional-email", {
                    body: {
                      templateName: "shipping-confirmation",
                      recipientEmail: email,
                      idempotencyKey: `shipping-confirm-${orderId}`,
                      templateData: {
                        customerName: customerName || undefined,
                        orderName,
                        carrier: carrier || undefined,
                        trackingNumber: trackingNumber || undefined,
                        trackingUrl: `https://www.sullenclothing.com/track?order=${encodeURIComponent(orderName)}&email=${encodeURIComponent(email)}`,
                        items,
                      },
                    },
                  });
                  console.log(`Shipping confirmation email sent for ${orderName}`);
                }
              } catch (shipEmailErr) {
                console.error("Failed to send shipping confirmation email:", shipEmailErr);
              }
            }
          }
        }
      }

      // ── Sync fulfillment_status into order_history ──
      const ohFulfillmentStatus =
        trackingStatus === "delivered" ? "fulfilled"
        : ["shipped", "in_transit", "out_for_delivery"].includes(trackingStatus) ? "partial"
        : null;

      if (ohFulfillmentStatus) {
        const { error: ohErr } = await supabase
          .from("order_history")
          .update({ fulfillment_status: ohFulfillmentStatus, updated_at: new Date().toISOString() })
          .eq("order_id", orderId);

        if (ohErr) {
          console.error("Failed to update order_history fulfillment_status:", ohErr);
        } else {
          console.log(`order_history fulfillment_status updated to ${ohFulfillmentStatus} for order ${orderId}`);
        }
      }
    }

    // ── Review request logic (only on delivery) ──
    if (shipmentStatus !== "delivered") {
      return new Response(
        JSON.stringify({ ok: true, tracking_updated: true, reason: "not_delivered_yet", shipmentStatus }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!email || !orderId) {
      console.warn("Missing email or order_id in fulfillment payload");
      return new Response(
        JSON.stringify({ ok: true, tracking_updated: true, reason: "missing_data_for_review" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── Build line items from fulfillment (enrich with product images & handles) ──
    const storefrontToken = Deno.env.get("SHOPIFY_STOREFRONT_ACCESS_TOKEN");
    const shopifyDomain = "sullenclothing.myshopify.com";

    const rawLineItems = (fulfillment.line_items || []).map((li: any) => ({
      title: li.title || "",
      product_id: li.product_id?.toString() || "",
      product_handle: "", // will be enriched from Storefront API
      image: li.image?.src || "",
      variant_id: li.variant_id?.toString() || "",
    }));

    // Enrich each line item with handle + image from Storefront API
    const lineItems = await Promise.all(
      rawLineItems.map(async (li: any) => {
        if (!li.product_id || !storefrontToken) return li;
        try {
          const gid = `gid://shopify/Product/${li.product_id}`;
          const res = await fetch(
            `https://${shopifyDomain}/api/2025-07/graphql.json`,
            {
              method: "POST",
              headers: {
                "X-Shopify-Storefront-Access-Token": storefrontToken,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                query: `{ product(id: "${gid}") { handle featuredImage { url } } }`,
              }),
            }
          );
          if (res.ok) {
            const json = await res.json();
            const product = json.data?.product;
            if (product) {
              li.product_handle = product.handle || "";
              if (!li.image && product.featuredImage?.url) {
                li.image = product.featuredImage.url;
              }
            }
          } else {
            await res.text(); // consume body
          }
        } catch (e) {
          console.warn(`Failed to enrich product ${li.product_id}:`, e);
        }
        return li;
      })
    );

    // Get customer name from fulfillment destination
    const customerName = [
      fulfillment.destination?.first_name,
      fulfillment.destination?.last_name,
    ]
      .filter(Boolean)
      .join(" ");

    // ── Create review request token with 3-day delay ──
    const sendAfter = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const { data: tokenData, error: insertError } = await supabase
      .from("review_request_tokens")
      .insert({
        order_id: orderId,
        order_name: orderName,
        email,
        customer_name: customerName,
        line_items: lineItems,
        status: "pending",
        send_after: sendAfter,
      })
      .select("token")
      .single();

    if (insertError) {
      // Unique constraint violation = duplicate, not an error
      if (insertError.code === "23505") {
        console.log(`Review request already exists for order ${orderId} (unique constraint)`);
        return new Response(
          JSON.stringify({ ok: true, tracking_updated: true, reason: "review_already_exists" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      console.error("Failed to create review request:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create review request" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Review request email will be sent automatically by the cron processor after 3 days
    console.log(`Review request queued for ${orderName} (${email}), will send after ${sendAfter}`);

    console.log(`Review request created via fulfillment webhook for order ${orderName} (${email})`);
    return new Response(
      JSON.stringify({
        success: true,
        tracking_updated: true,
        token: tokenData.token,
        orderName,
        email,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Fulfillment webhook error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
