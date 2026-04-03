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

function isBirthday(birthday: string | null): boolean {
  if (!birthday) return false;
  const today = new Date();
  const bday = new Date(birthday);
  return today.getMonth() === bday.getMonth() && today.getDate() === bday.getDate();
}

function countDistinctProducts(lineItems: any[]): number {
  const productIds = new Set<string>();
  for (const item of lineItems || []) {
    if (item.product_id) productIds.add(String(item.product_id));
  }
  return productIds.size;
}

// Fetch product images for line items (Admin API first, Storefront API fallback)
async function enrichLineItemImages(lineItems: any[]): Promise<any[]> {
  let adminToken = Deno.env.get("SHOPIFY_ACCESS_TOKEN") || "";
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: tokenSetting } = await sb
      .from("site_settings").select("value").eq("key", "shopify_returns_token").single();
    if (tokenSetting?.value) adminToken = tokenSetting.value;
  } catch (_) { /* use env var */ }
  const storefrontToken = Deno.env.get("SHOPIFY_STOREFRONT_ACCESS_TOKEN");
  const storeDomain = "sullenclothing.myshopify.com";

  const productIds = [...new Set(
    (lineItems || [])
      .filter((li: any) => li.product_id)
      .map((li: any) => String(li.product_id))
  )];

  if (productIds.length === 0) return lineItems;

  const imageMap = new Map<string, string>();

  // 1) Try Admin API first (best source)
  if (adminToken) {
    try {
      const idsParam = productIds.slice(0, 50).join(",");
      const res = await fetch(
        `https://${storeDomain}/admin/api/2025-01/products.json?ids=${idsParam}&fields=id,images`,
        { headers: { "X-Shopify-Access-Token": adminToken } }
      );

      if (res.ok) {
        const data = await res.json();
        for (const product of data.products || []) {
          const src = product.images?.[0]?.src;
          if (src) imageMap.set(String(product.id), src);
        }
      } else {
        const errText = await res.text();
        console.warn("Admin API image fetch skipped:", res.status, errText);
      }
    } catch (err) {
      console.warn("Admin API image fetch failed:", err);
    }
  }

  // 2) Fallback to Storefront API when Admin API is blocked by scope permissions
  if (imageMap.size < productIds.length && storefrontToken) {
    try {
      const missingIds = productIds.filter((id) => !imageMap.has(id));
      const gidIds = missingIds.map((id) => `gid://shopify/Product/${id}`);

      const response = await fetch(`https://${storeDomain}/api/2025-07/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": storefrontToken,
        },
        body: JSON.stringify({
          query: `
            query ProductImages($ids: [ID!]!) {
              nodes(ids: $ids) {
                ... on Product {
                  id
                  featuredImage { url }
                  images(first: 1) { nodes { url } }
                }
              }
            }
          `,
          variables: { ids: gidIds },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        for (const node of data?.data?.nodes || []) {
          if (!node?.id) continue;
          const productId = String(node.id).split("/").pop();
          const imageUrl = node.featuredImage?.url || node.images?.nodes?.[0]?.url;
          if (productId && imageUrl) imageMap.set(productId, imageUrl);
        }
      } else {
        const errText = await response.text();
        console.warn("Storefront API image fetch failed:", response.status, errText);
      }
    } catch (err) {
      console.warn("Storefront API image fetch exception:", err);
    }
  }

  return (lineItems || []).map((li: any) => {
    const pid = li.product_id ? String(li.product_id) : null;
    if (pid && imageMap.has(pid)) {
      return { ...li, image: { src: imageMap.get(pid) } };
    }
    return li;
  });
}

async function findUserIdByEmail(
  admin: ReturnType<typeof createClient>,
  email: string,
): Promise<string | null> {
  const targetEmail = email.trim().toLowerCase();
  const perPage = 1000;

  // Fast path: API-side filter when supported
  const { data: filteredData, error: filteredError } = await admin.auth.admin.listUsers({ filter: targetEmail });
  if (!filteredError) {
    const filteredMatch = (filteredData?.users || []).find((u) => u.email?.toLowerCase() === targetEmail);
    if (filteredMatch) return filteredMatch.id;
  }

  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.warn("Auth lookup failed:", error.message);
      return null;
    }

    const users = data?.users || [];
    const matched = users.find((u) => u.email?.toLowerCase() === targetEmail);
    if (matched) return matched.id;

    if (users.length < perPage) break;
  }

  return null;
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
        ].filter((secret): secret is string => Boolean(secret))
      )
    );
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const rawBody = await req.text();

    // ── HMAC verification (supports either configured Shopify secret) ──
    if (webhookSecrets.length > 0) {
      const hmac = req.headers.get("x-shopify-hmac-sha256");
      if (!hmac) {
        console.error("Missing HMAC header");
        return new Response(JSON.stringify({ error: "Missing HMAC" }), {
          status: 401, headers: { "Content-Type": "application/json" },
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
          status: 401, headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      console.warn("No Shopify webhook secret configured — skipping HMAC verification");
    }

    const order = JSON.parse(rawBody);
    const email = (order.email || order.contact_email || "").toLowerCase().trim();
    const totalPrice = parseFloat(order.total_price || "0");
    const orderId = order.id?.toString() || "";
    const orderNumber = order.order_number?.toString() || order.name || "";

    if (!email) {
      return new Response(JSON.stringify({ skipped: true, reason: "no_email" }), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // ── Send order confirmation email FIRST (no account required) ──
    let pointsEarned = 0;
    let setBonus = 0;
    let tierName = "Apprentice";
    let earnRate = 2;
    let birthdayBonus = false;

    // Always send order confirmation regardless of account status
    if (totalPrice > 0) {
      try {
        // Dedup guard: check if we already sent an order-confirmation for this order
        const dedupKey = `order-confirm-${orderId}`;
        const { data: existingSend } = await admin
          .from("email_send_log")
          .select("id")
          .eq("template_name", "order-confirmation")
          .eq("recipient_email", email)
          .ilike("metadata->>idempotencyKey", dedupKey)
          .limit(1)
          .maybeSingle();

        // Fallback: also check by message timing (same order within 5 min)
        let alreadySent = !!existingSend;
        if (!alreadySent) {
          const { count } = await admin
            .from("email_send_log")
            .select("id", { count: "exact", head: true })
            .eq("template_name", "order-confirmation")
            .eq("recipient_email", email)
            .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());
          alreadySent = (count ?? 0) >= 1;
        }

        if (alreadySent) {
          console.log("Order confirmation already sent for", email, "order", orderNumber, "— skipping duplicate");
        } else {
          // Enrich line items with product images from Shopify Admin API
          const enrichedLineItems = await enrichLineItemImages(order.line_items || []);

          const customerName = [order.customer?.first_name, order.customer?.last_name]
            .filter(Boolean).join(' ');
          const shippingAddr = order.shipping_address || {};
          const lineItemsForEmail = enrichedLineItems.map((li: any) => ({
            title: li.title || '',
            variant: li.variant_title || '',
            quantity: li.quantity || 1,
            price: parseFloat(li.price || '0').toFixed(2),
            image: li.image?.src || '',
          }));

          const { data: emailData, error: emailError } = await admin.functions.invoke("send-transactional-email", {
            body: {
              templateName: "order-confirmation",
              recipientEmail: email,
              idempotencyKey: dedupKey,
              templateData: {
                customerName: customerName || undefined,
                orderName: order.name || `#${orderNumber}`,
                orderDate: order.created_at,
                lineItems: lineItemsForEmail,
                subtotal: parseFloat(order.subtotal_price || '0').toFixed(2),
                shippingCost: parseFloat(order.total_shipping_price_set?.shop_money?.amount || '0').toFixed(2),
                discountAmount: parseFloat(order.total_discounts || '0').toFixed(2),
                totalPrice: totalPrice.toFixed(2),
                currency: order.currency || 'USD',
                shippingAddress: shippingAddr.address1 ? {
                  name: [shippingAddr.first_name, shippingAddr.last_name].filter(Boolean).join(' '),
                  address1: shippingAddr.address1,
                  address2: shippingAddr.address2 || undefined,
                  city: shippingAddr.city,
                  province: shippingAddr.province_code || shippingAddr.province,
                  zip: shippingAddr.zip,
                  country: shippingAddr.country,
                } : undefined,
                skullPointsEarned: 0, // Will be 0 for non-members
                orderNote: order.note || undefined,
                trackingUrl: `https://www.sullenclothing.com/track?order=${encodeURIComponent(order.name || orderNumber)}&email=${encodeURIComponent(email)}`,
              },
            },
          });
          if (emailError) {
            console.error("send-transactional-email invoke error:", emailError);
          } else {
            console.log("Order confirmation email queued for", email, "order", orderNumber, "response:", JSON.stringify(emailData));
          }
        }
      } catch (emailErr) {
        console.error("Failed to send order confirmation email (exception):", emailErr);
      }
    }

    // ── Persist order to order_history (upsert — idempotent) ──
    try {
      const enrichedLineItems = await enrichLineItemImages(order.line_items || []);
      const lineItemsSummary = enrichedLineItems.map((li: any) => ({
        title: li.title || '',
        variant_title: li.variant_title || '',
        quantity: li.quantity || 1,
        price: li.price || '0',
        image: li.image?.src || '',
        product_id: li.product_id?.toString() || '',
        sku: li.sku || '',
      }));

      const shippingAddr = order.shipping_address || {};
      const shippingData = shippingAddr.address1 ? {
        name: [shippingAddr.first_name, shippingAddr.last_name].filter(Boolean).join(' '),
        address1: shippingAddr.address1,
        address2: shippingAddr.address2 || undefined,
        city: shippingAddr.city,
        province: shippingAddr.province_code || shippingAddr.province,
        zip: shippingAddr.zip,
        country: shippingAddr.country,
      } : null;

      // Try to find matching user for user_id linkage
      const matchedUserIdForHistory = await findUserIdByEmail(admin, email);

      await admin.from("order_history").upsert({
        order_id: orderId,
        order_name: order.name || `#${orderNumber}`,
        email,
        user_id: matchedUserIdForHistory,
        order_date: order.created_at || new Date().toISOString(),
        total_price: totalPrice,
        currency: order.currency || 'USD',
        financial_status: order.financial_status || 'paid',
        fulfillment_status: order.fulfillment_status || 'unfulfilled',
        line_items: lineItemsSummary,
        shipping_address: shippingData,
      }, { onConflict: 'order_id' });

      console.log("Order history saved for", email, "order", orderNumber);
    } catch (historyErr) {
      console.error("Failed to save order history:", historyErr);
    }

    // ── Loyalty: requires account ──
    if (totalPrice <= 0) {
      return new Response(JSON.stringify({ success: true, email, orderConfirmationSent: true, skippedLoyalty: "zero_total" }), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    }

    // ── Find user by email ──
    const matchedUserId = await findUserIdByEmail(admin, email);

    if (!matchedUserId) {
      console.warn("Order confirmation sent, but skipping loyalty — no matching account for", email);
      return new Response(
        JSON.stringify({ success: true, email, orderConfirmationSent: true, skippedLoyalty: "user_not_found" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── Duplicate check ──
    const referenceId = "shopify-order-" + orderId;
    const { data: existing } = await admin
      .from("reward_transactions")
      .select("id")
      .eq("user_id", matchedUserId)
      .eq("reference_id", referenceId)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "duplicate", orderId }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── Determine earn rate from VIP tier ──
    const { data: lifetimePoints } = await admin.rpc("get_user_lifetime_points", {
      p_user_id: matchedUserId,
    });

    const { data: tiers } = await admin
      .from("reward_tiers")
      .select("name, earn_rate, min_lifetime_spend")
      .order("min_lifetime_spend", { ascending: false });

    if (tiers && tiers.length > 0) {
      const lifetime = lifetimePoints || 0;
      for (const tier of tiers) {
        if (lifetime >= Number(tier.min_lifetime_spend)) {
          earnRate = Number(tier.earn_rate);
          tierName = tier.name;
          break;
        }
      }
    }

    // ── Check birthday for 3× multiplier ──
    const { data: profile } = await admin
      .from("profiles")
      .select("birthday")
      .eq("user_id", matchedUserId)
      .maybeSingle();

    birthdayBonus = isBirthday(profile?.birthday);
    const finalMultiplier = birthdayBonus ? 3 : 1;
    pointsEarned = Math.floor(totalPrice * earnRate * finalMultiplier);

    if (pointsEarned <= 0) {
      return new Response(
        JSON.stringify({ success: true, orderConfirmationSent: true, skippedLoyalty: "no_points_earned" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── Award base points ──
    const description = birthdayBonus
      ? `Order #${orderNumber} (${tierName} ${earnRate}x · 🎂 Birthday 3×)`
      : `Order #${orderNumber} (${tierName} ${earnRate}x)`;

    const { error: insertError } = await admin.from("reward_transactions").insert({
      user_id: matchedUserId,
      points: pointsEarned,
      type: birthdayBonus ? "birthday_multiplier" : "purchase",
      description,
      reference_id: referenceId,
    });

    if (insertError) {
      console.error("Failed to insert reward transaction:", insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Awarded", pointsEarned, "Skull Points to", email, "for order", orderNumber,
      birthdayBonus ? "(🎂 Birthday 3×)" : "", "(tier:", tierName, ")");

    // ── Update vault_members spend & tier tracking ──
    const { data: vaultMember } = await admin
      .from("vault_members")
      .select("id, lifetime_spend, annual_spend, current_tier, first_name")
      .eq("user_id", matchedUserId)
      .maybeSingle();

    if (vaultMember) {
      const oldTier = vaultMember.current_tier;

      await admin
        .from("vault_members")
        .update({
          lifetime_spend: Number(vaultMember.lifetime_spend || 0) + totalPrice,
          annual_spend: Number(vaultMember.annual_spend || 0) + totalPrice,
          points_last_active: new Date().toISOString().split("T")[0],
          points_frozen: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vaultMember.id);

      // Re-assign tier after spend update
      const { data: newTier } = await admin.rpc("assign_vault_tier", { p_member_id: vaultMember.id });
      console.log("Updated vault_members spend for", email, "— lifetime:", Number(vaultMember.lifetime_spend || 0) + totalPrice);

      // Send tier upgrade email if tier changed (and not apprentice → apprentice)
      if (newTier && newTier !== oldTier && newTier !== 'apprentice') {
        try {
          // Fetch perks and tier details for the new tier
          const { data: tierData } = await admin
            .from("reward_tiers")
            .select("perks, earn_rate, free_shipping_minimum, early_access_hours, pts_per_dollar")
            .eq("slug", newTier)
            .maybeSingle();

          // Fetch next tier info
          const { data: allTiers } = await admin
            .from("reward_tiers")
            .select("name, slug, position, min_lifetime_spend")
            .order("position", { ascending: true });

          const currentTierPos = allTiers?.find(t => t.slug === newTier)?.position ?? 0;
          const nextTierInfo = allTiers?.find(t => t.position > currentTierPos);
          const currentLifetime = Number(vaultMember.lifetime_spend || 0) + totalPrice;
          const spendToNext = nextTierInfo ? Math.max(0, nextTierInfo.min_lifetime_spend - currentLifetime) : null;

          await admin.functions.invoke("send-transactional-email", {
            body: {
              templateName: "vault-tier-upgrade",
              recipientEmail: email,
              idempotencyKey: `tier-upgrade-${matchedUserId}-${newTier}`,
              templateData: {
                name: vaultMember.first_name || undefined,
                newTier,
                perks: tierData?.perks || [],
                pointsMultiplier: tierData?.earn_rate ? `${tierData.earn_rate}x` : '1x',
                freeShippingMin: tierData?.free_shipping_minimum != null ? String(tierData.free_shipping_minimum) : undefined,
                earlyAccessHours: tierData?.early_access_hours || undefined,
                nextTier: nextTierInfo?.name || undefined,
                nextTierSpend: spendToNext != null && spendToNext > 0 ? `$${spendToNext.toFixed(0)}` : undefined,
              },
            },
          });
          console.log("Sent tier upgrade email to", email, "for tier:", newTier);
        } catch (tierEmailErr) {
          console.error("Failed to send tier upgrade email:", tierEmailErr);
        }
      }
    } else {
      console.log("No vault_member found for", email, "— spend not tracked");
    }

    // ── Collect The Set bonus: +500 for 3+ distinct products ──
    const distinctProducts = countDistinctProducts(order.line_items);
    if (distinctProducts >= 3) {
      const setRefId = "shopify-order-set-" + orderId;
      const { data: existingSet } = await admin
        .from("reward_transactions")
        .select("id")
        .eq("user_id", matchedUserId)
        .eq("reference_id", setRefId)
        .limit(1);

      if (!existingSet || existingSet.length === 0) {
        setBonus = 500;
        await admin.from("reward_transactions").insert({
          user_id: matchedUserId,
          points: 500,
          type: "collect_the_set",
          description: `Collect The Set bonus — ${distinctProducts} items in Order #${orderNumber}`,
          reference_id: setRefId,
        });
        console.log("Awarded 500 Collect The Set bonus to", email, "for", distinctProducts, "distinct products");
      }
    }

    // ── Sync enriched order data to Attentive ──
    const ATTENTIVE_API_KEY = Deno.env.get("ATTENTIVE_API_KEY");
    let attentiveResult = "skipped";
    if (ATTENTIVE_API_KEY) {
      try {
        // Get updated points balance
        const { data: newBalance } = await admin.rpc("get_user_points_balance", {
          p_user_id: matchedUserId,
        });

        // Get updated tier
        const updatedMember = vaultMember
          ? await admin
              .from("vault_members")
              .select("current_tier")
              .eq("id", vaultMember.id)
              .maybeSingle()
          : null;

        const currentTier = updatedMember?.data?.current_tier || tierName.toLowerCase();

        const attentivePayload = {
          type: "ce",
          properties: {
            $event_name: "Order Confirmed",
            email,
            orderId,
            orderNumber,
            orderTotal: totalPrice,
            currency: order.currency || "USD",
            skullPointsEarned: pointsEarned + setBonus,
            skullPointsBalance: newBalance || 0,
            vaultTier: currentTier,
            earnRate,
            birthdayBonus: birthdayBonus,
            collectTheSetBonus: setBonus > 0,
            trackingUrl: `https://www.sullenclothing.com/track?order=${orderNumber}&email=${encodeURIComponent(email)}`,
            vaultUrl: "https://www.sullenclothing.com/vault",
            items: (order.line_items || []).map((li: any) => ({
              productId: li.product_id?.toString() || "",
              productName: li.title || "",
              productImage: li.image?.src || "",
              quantity: li.quantity || 1,
              price: { value: parseFloat(li.price || "0"), currency: order.currency || "USD" },
            })),
          },
          user: { email },
        };

        const attRes = await fetch("https://api.attentivemobile.com/v1/events/custom", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ATTENTIVE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(attentivePayload),
        });

        if (attRes.ok) {
          attentiveResult = "sent";
          console.log("Attentive Order Confirmed event sent for", email);
        } else {
          const errText = await attRes.text();
          console.error(`Attentive event error [${attRes.status}]:`, errText);
          attentiveResult = "failed";
        }
      } catch (attErr) {
        console.error("Attentive sync error:", attErr);
        attentiveResult = "error";
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        email,
        pointsEarned,
        setBonus,
        birthdayMultiplier: birthdayBonus,
        tier: tierName,
        earnRate,
        orderTotal: totalPrice,
        orderId,
        attentive: attentiveResult,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
