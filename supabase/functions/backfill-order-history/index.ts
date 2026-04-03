import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SHOPIFY_STORE = "sullenclothing.myshopify.com";
const SHOPIFY_API_VERSION = "2026-01";
let BATCH_SIZE = 250; // Shopify max per page

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let shopifyToken = Deno.env.get("SHOPIFY_ACCESS_TOKEN") || "";
  try {
    const { data: tokenSetting } = await supabase
      .from("site_settings").select("value").eq("key", "shopify_returns_token").single();
    if (tokenSetting?.value) shopifyToken = tokenSetting.value;
  } catch (_) { /* use env var */ }
  if (!shopifyToken) {
    return new Response(JSON.stringify({ error: "Missing Shopify access token" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Parse optional body params for filtered backfill
  let emailFilter = "";
  let maxOrders = 0;
  try {
    const body = await req.json();
    if (body.email_filter) emailFilter = body.email_filter.toLowerCase();
    if (body.limit) { maxOrders = Number(body.limit); BATCH_SIZE = Math.min(BATCH_SIZE, maxOrders); }
  } catch (_) { /* no body is fine */ }

  // Only backfill orders from the last 3 years
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
  const createdAtMin = threeYearsAgo.toISOString();

  let totalFetched = 0;
  let totalUpserted = 0;
  let totalSkipped = 0;
  let pageInfo: string | null = null;
  let hasNextPage = true;
  let page = 0;

  try {
    while (hasNextPage) {
      if (maxOrders > 0 && totalUpserted >= maxOrders) break;
      page++;
      let url: string;
      if (pageInfo) {
        url = `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/orders.json?limit=${BATCH_SIZE}&status=any&page_info=${pageInfo}`;
      } else {
        let base = `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/orders.json?limit=${BATCH_SIZE}&status=any&created_at_min=${createdAtMin}&fields=id,name,email,created_at,total_price,currency,financial_status,fulfillment_status,line_items,shipping_address`;
        if (emailFilter) base += `&email=${encodeURIComponent(emailFilter)}`;
        url = base;
      }

      console.log(`Fetching page ${page}...`);
      const res = await fetch(url, {
        headers: {
          "X-Shopify-Access-Token": shopifyToken,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`Shopify API error on page ${page}: ${res.status}`, errText);
        break;
      }

      const { orders } = await res.json();
      if (!orders || orders.length === 0) {
        hasNextPage = false;
        break;
      }

      totalFetched += orders.length;
      console.log(`Page ${page}: ${orders.length} orders fetched (total: ${totalFetched})`);

      // Build upsert rows
      const rows = orders
        .filter((o: any) => o.email)
        .map((order: any) => {
          const lineItems = (order.line_items || []).map((li: any) => ({
            title: li.title || "",
            variant_title: li.variant_title || null,
            quantity: li.quantity || 1,
            price: li.price || "0.00",
            image: li.image?.src || null,
            product_id: li.product_id?.toString() || null,
          }));

          // Simplify shipping address
          const sa = order.shipping_address;
          const shippingAddress = sa
            ? {
                city: sa.city || null,
                province: sa.province || null,
                country: sa.country || null,
                zip: sa.zip || null,
              }
            : null;

          return {
            order_id: order.id.toString(),
            order_name: order.name,
            email: order.email.toLowerCase(),
            order_date: order.created_at,
            total_price: parseFloat(order.total_price) || 0,
            currency: order.currency || "USD",
            financial_status: order.financial_status || "paid",
            fulfillment_status: order.fulfillment_status || "unfulfilled",
            line_items: lineItems,
            shipping_address: shippingAddress,
            updated_at: new Date().toISOString(),
          };
        });

      if (rows.length > 0) {
        // Upsert in chunks of 50 to avoid payload limits
        for (let i = 0; i < rows.length; i += 50) {
          const chunk = rows.slice(i, i + 50);
          const { error, count } = await supabase
            .from("order_history")
            .upsert(chunk, { onConflict: "order_id", ignoreDuplicates: false })
            .select("id");

          if (error) {
            console.error(`Upsert error on page ${page}, chunk ${i}:`, error);
            totalSkipped += chunk.length;
          } else {
            totalUpserted += chunk.length;
          }
        }
      }

      // Parse Link header for pagination
      const linkHeader = res.headers.get("link");
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const match = linkHeader.match(/page_info=([^>&]+).*?rel="next"/);
        if (match) {
          pageInfo = match[1];
        } else {
          hasNextPage = false;
        }
      } else {
        hasNextPage = false;
      }

      // Respect Shopify rate limits
      await new Promise((r) => setTimeout(r, 500));
    }

    // ── Link user_ids by email ──
    console.log("Linking user_ids to order_history records...");
    // We can't do a cross-schema UPDATE via the client, so we'll do it row by row
    const { data: orphanRows } = await supabase
      .from("order_history")
      .select("id, email")
      .is("user_id", null)
      .limit(1000);

    let linked = 0;
    if (orphanRows && orphanRows.length > 0) {
      // Get unique emails
      const uniqueEmails = [...new Set(orphanRows.map((r: any) => r.email.toLowerCase()))];

      // For each email, try to find a matching auth user via admin API
      const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const emailToUserId = new Map<string, string>();
      if (users) {
        for (const u of users) {
          if (u.email) emailToUserId.set(u.email.toLowerCase(), u.id);
        }
      }

      for (const row of orphanRows) {
        const userId = emailToUserId.get(row.email.toLowerCase());
        if (userId) {
          await supabase
            .from("order_history")
            .update({ user_id: userId })
            .eq("id", row.id);
          linked++;
        }
      }
    }

    const summary = {
      success: true,
      pages: page,
      totalFetched,
      totalUpserted,
      totalSkipped,
      userIdsLinked: linked,
    };
    console.log("Backfill complete:", summary);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Backfill error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
