import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SHOPIFY_STORE = "sullenclothing.myshopify.com";
const SHOPIFY_API_VERSION = "2026-01";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  let shopifyToken = Deno.env.get("SHOPIFY_ACCESS_TOKEN") || "";
  try {
    const { data: tokenSetting } = await admin
      .from("site_settings").select("value").eq("key", "shopify_returns_token").single();
    if (tokenSetting?.value) shopifyToken = tokenSetting.value;
  } catch (_) { /* use env var */ }
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const json = { ...corsHeaders, "Content-Type": "application/json" };

  // Verify caller is admin
  const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
  if (authHeader && authHeader !== Deno.env.get("SUPABASE_ANON_KEY")) {
    const { data: { user } } = await admin.auth.getUser(authHeader);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: json });
    }
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: json });
    }
  }

  if (!shopifyToken) {
    return new Response(JSON.stringify({ error: "Shopify access token not set" }), { status: 500, headers: json });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const daysBack = body.days_back || 30;
    const daysOffset = body.days_offset || 0; // skip most recent N days
    const untilDate = new Date(Date.now() - daysOffset * 86400000).toISOString();
    const sinceDate = new Date(Date.now() - daysBack * 86400000).toISOString();

    // 1. Fetch paid orders from Shopify (with date window)
    let allOrders: any[] = [];
    let pageUrl: string | null =
      `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/orders.json?status=any&financial_status=paid&created_at_min=${sinceDate}&created_at_max=${untilDate}&limit=250`;

    while (pageUrl) {
      const res = await fetch(pageUrl, {
        headers: { "X-Shopify-Access-Token": shopifyToken, "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const errText = await res.text();
        return new Response(JSON.stringify({ error: `Shopify ${res.status}: ${errText}` }), { status: 502, headers: json });
      }
      const data = await res.json();
      allOrders = allOrders.concat(data.orders || []);

      const linkHeader = res.headers.get("link");
      const nextMatch = linkHeader?.match(/<([^>]+)>;\s*rel="next"/);
      pageUrl = nextMatch ? nextMatch[1] : null;
    }

    console.log(`Fetched ${allOrders.length} paid orders from last ${daysBack} days`);

    // 2. Build email→user map from vault_members (lightweight, no auth.users scan)
    const emailToUser = new Map<string, { id: string; email: string }>();
    let vmOffset = 0;
    while (true) {
      const { data: members } = await admin
        .from("vault_members")
        .select("user_id, email")
        .not("user_id", "is", null)
        .not("email", "is", null)
        .range(vmOffset, vmOffset + 999);
      if (!members || members.length === 0) break;
      for (const m of members) {
        if (m.email && m.user_id) {
          emailToUser.set(m.email.toLowerCase().trim(), { id: m.user_id, email: m.email.toLowerCase().trim() });
        }
      }
      if (members.length < 1000) break;
      vmOffset += 1000;
    }

    console.log(`Loaded ${emailToUser.size} vault member email→user mappings`);

    // 4. Batch-fetch existing reward_transactions reference_ids to skip duplicates
    const existingRefs = new Set<string>();
    // Fetch in pages of 1000
    let refOffset = 0;
    while (true) {
      const { data: refs } = await admin
        .from("reward_transactions")
        .select("reference_id")
        .like("reference_id", "shopify-order-%")
        .range(refOffset, refOffset + 999);
      if (!refs || refs.length === 0) break;
      for (const r of refs) {
        if (r.reference_id) existingRefs.add(r.reference_id);
      }
      if (refs.length < 1000) break;
      refOffset += 1000;
    }

    console.log(`Found ${existingRefs.size} existing backfill transactions to skip`);

    // 5. Get tiers for earn rate lookup
    const { data: tiers } = await admin
      .from("reward_tiers")
      .select("name, slug, earn_rate, min_lifetime_spend")
      .order("min_lifetime_spend", { ascending: false });

    // 6. Pre-fetch vault members for matched users
    const userIds = [...emailToUser.values()].map((u) => u.id);
    const vaultMemberMap = new Map<string, any>();
    // Fetch in batches of 100 using .in()
    for (let i = 0; i < userIds.length; i += 100) {
      const batch = userIds.slice(i, i + 100);
      const { data: members } = await admin
        .from("vault_members")
        .select("id, user_id, lifetime_spend, annual_spend")
        .in("user_id", batch);
      if (members) {
        for (const m of members) {
          vaultMemberMap.set(m.user_id, m);
        }
      }
    }

    // 7. Process orders — now using pre-fetched data
    let awarded = 0;
    let skipped = 0;
    let noAccount = 0;
    const results: any[] = [];
    const txInserts: any[] = [];
    const vaultUpdates: { memberId: string; addSpend: number; userId: string; email: string }[] = [];

    for (const order of allOrders) {
      const email = (order.email || order.contact_email || "").toLowerCase().trim();
      const totalPrice = parseFloat(order.total_price || "0");
      const orderId = order.id?.toString() || "";
      const orderNumber = order.order_number?.toString() || order.name || "";

      if (!email || totalPrice <= 0) { skipped++; continue; }

      const user = emailToUser.get(email);
      if (!user) { noAccount++; continue; }

      const referenceId = "shopify-order-" + orderId;
      if (existingRefs.has(referenceId)) { skipped++; continue; }

      // Determine earn rate (use default since we don't have per-user lifetime cached perfectly)
      let earnRate = 2;
      let tierName = "Apprentice";
      if (tiers) {
        const vm = vaultMemberMap.get(user.id);
        const lifetime = vm ? Number(vm.lifetime_spend || 0) : 0;
        for (const tier of tiers) {
          if (lifetime >= Number(tier.min_lifetime_spend)) {
            earnRate = Number(tier.earn_rate);
            tierName = tier.name;
            break;
          }
        }
      }

      const pointsEarned = Math.floor(totalPrice * earnRate);
      if (pointsEarned <= 0) { skipped++; continue; }

      // Queue transaction insert
      txInserts.push({
        user_id: user.id,
        points: pointsEarned,
        type: "purchase",
        description: `[Backfill] Order #${orderNumber} (${tierName} ${earnRate}x)`,
        reference_id: referenceId,
      });

      // Mark as existing to prevent dupes within this run
      existingRefs.add(referenceId);

      // Collect The Set bonus
      const distinctProducts = new Set((order.line_items || []).map((li: any) => li.product_id?.toString())).size;
      if (distinctProducts >= 3) {
        const setRefId = "shopify-order-set-" + orderId;
        if (!existingRefs.has(setRefId)) {
          txInserts.push({
            user_id: user.id,
            points: 500,
            type: "collect_the_set",
            description: `[Backfill] Collect The Set — ${distinctProducts} items in Order #${orderNumber}`,
            reference_id: setRefId,
          });
          existingRefs.add(setRefId);
        }
      }

      // Queue vault spend update
      vaultUpdates.push({ memberId: user.id, addSpend: totalPrice, userId: user.id, email });

      awarded++;
      results.push({ email, orderNumber, points: pointsEarned, tier: tierName });
    }

    // 8. Batch insert transactions (chunks of 500)
    let insertErrors = 0;
    for (let i = 0; i < txInserts.length; i += 500) {
      const batch = txInserts.slice(i, i + 500);
      const { error: batchErr } = await admin.from("reward_transactions").insert(batch);
      if (batchErr) {
        console.error(`Batch insert error at offset ${i}:`, batchErr);
        insertErrors++;
      }
    }

    console.log(`Inserted ${txInserts.length} transactions (${insertErrors} batch errors)`);

    // 9. Batch vault member updates — ensure + update spend + assign tier
    const processedVaultUsers = new Set<string>();
    for (const vu of vaultUpdates) {
      if (processedVaultUsers.has(vu.userId)) continue;
      processedVaultUsers.add(vu.userId);

      // Aggregate total spend for this user across all their orders
      const totalAddSpend = vaultUpdates
        .filter((v) => v.userId === vu.userId)
        .reduce((sum, v) => sum + v.addSpend, 0);

      await admin.rpc("ensure_vault_member", { p_user_id: vu.userId, p_email: vu.email });

      const { data: vm } = await admin
        .from("vault_members")
        .select("id, lifetime_spend, annual_spend")
        .eq("user_id", vu.userId)
        .maybeSingle();

      if (vm) {
        await admin
          .from("vault_members")
          .update({
            lifetime_spend: Number(vm.lifetime_spend || 0) + totalAddSpend,
            annual_spend: Number(vm.annual_spend || 0) + totalAddSpend,
            points_last_active: new Date().toISOString().split("T")[0],
            points_frozen: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", vm.id);

        await admin.rpc("assign_vault_tier", { p_member_id: vm.id });
      }
    }

    console.log(`Updated ${processedVaultUsers.size} vault members`);

    // 10. Backfill order_tracking from fulfillment data
    let trackingInserted = 0;
    let trackingSkipped = 0;

    // Get existing order_ids to avoid duplicates
    const existingTrackingIds = new Set<string>();
    let trackingOffset = 0;
    while (true) {
      const { data: trackingRows } = await admin
        .from("order_tracking")
        .select("order_id")
        .range(trackingOffset, trackingOffset + 999);
      if (!trackingRows || trackingRows.length === 0) break;
      for (const r of trackingRows) existingTrackingIds.add(r.order_id);
      if (trackingRows.length < 1000) break;
      trackingOffset += 1000;
    }

    const trackingInserts: any[] = [];

    for (const order of allOrders) {
      const orderId = order.id?.toString() || "";
      const email = (order.email || order.contact_email || "").toLowerCase().trim();
      const orderName = order.name || `#${order.order_number || orderId}`;

      if (!email || !orderId || existingTrackingIds.has(orderId)) {
        trackingSkipped++;
        continue;
      }

      const fulfillments = order.fulfillments || [];
      if (fulfillments.length === 0) {
        trackingSkipped++;
        continue;
      }

      // Use first fulfillment for tracking data
      const f = fulfillments[0];
      const shipmentStatus = (f.shipment_status || "").toLowerCase();
      const fulfillmentStatus = (f.status || "").toLowerCase();

      let status = "confirmed";
      if (shipmentStatus === "delivered") status = "delivered";
      else if (shipmentStatus === "out_for_delivery") status = "out_for_delivery";
      else if (shipmentStatus === "in_transit") status = "in_transit";
      else if (fulfillmentStatus === "success" || fulfillmentStatus === "open") status = "shipped";

      const trackingRecord: any = {
        order_id: orderId,
        order_name: orderName,
        email,
        status,
        tracking_number: f.tracking_number || f.tracking_numbers?.[0] || null,
        tracking_url: f.tracking_url || f.tracking_urls?.[0] || null,
        carrier: f.tracking_company || null,
        shipped_at: f.created_at || null,
        last_shopify_sync: new Date().toISOString(),
      };

      // Set delivered_at if we know it was delivered
      if (status === "delivered" && f.updated_at) {
        trackingRecord.delivered_at = f.updated_at;
      }

      trackingInserts.push(trackingRecord);
      existingTrackingIds.add(orderId);
    }

    // Batch insert tracking records
    for (let i = 0; i < trackingInserts.length; i += 500) {
      const batch = trackingInserts.slice(i, i + 500);
      const { error: trackErr } = await admin.from("order_tracking").insert(batch);
      if (trackErr) {
        console.error(`Tracking batch insert error at offset ${i}:`, trackErr);
      } else {
        trackingInserted += batch.length;
      }
    }

    console.log(`Backfilled ${trackingInserted} order_tracking records (${trackingSkipped} skipped)`);

    return new Response(
      JSON.stringify({
        success: true,
        totalOrders: allOrders.length,
        awarded,
        skipped,
        noAccount,
        transactionsInserted: txInserts.length,
        vaultMembersUpdated: processedVaultUsers.size,
        trackingInserted,
        trackingSkipped,
        details: results.slice(0, 50),
      }),
      { status: 200, headers: json }
    );
  } catch (err) {
    console.error("Backfill error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: json }
    );
  }
});
