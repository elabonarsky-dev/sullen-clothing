import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Backfill review_group on reviews table.
 * For each unique product_handle with no review_group set,
 * looks up the product's collections via Shopify Admin API
 * and picks the best-matching Okendo-style group.
 */

// Priority-ordered collection handles that map to review groups.
// First match wins. More specific collections before broader ones.
const COLLECTION_GROUP_MAP: Record<string, string> = {
  "1-ton-tees": "1 Ton Tees",
  "1ton-heavyweight-flannels": "1Ton Heavyweight Flannels",
  "premium-tees": "Premium Tees",
  "standard-tees": "Standard Tees",
  "the-solids": "The Solids",
  "boxers": "Boxers",
  "crew-neck-fleece": "Crew Neck Fleece",
  "flannel-jackets": "Flannel Jackets",
  "flannels": "Flannels",
  "hats": "Hats",
  "headwear": "Hats",
  "jackets": "Jackets",
  "lanyards": "Lanyards",
  "lanyards-1": "Lanyards",
  "long-sleeves": "Long Sleeves",
  "pullover-fleece": "Pullover Fleece",
  "socks": "Socks",
  "stickers": "Stickers",
  "sweatpants": "Sweatpants",
  "intimates": "Womens Inktimates & Lounge",
  "womens-tops": "Womens Tops",
  "youth-tees": "Youth",
  "youth": "Youth",
  "zip-hood-fleece": "Zip Hood Fleece",
  "zip-hoodies": "Zip Hood Fleece",
  "hoodies": "Pullover Fleece",
  "tanks": "Tanks",
  "womens": "Womens Tops",
};

// Fallback: detect group from the product handle itself
function guessGroupFromHandle(handle: string): string | null {
  const h = handle.toLowerCase();
  if (h.includes("premium")) return "Premium Tees";
  if (h.includes("1-ton") || h.includes("1ton")) return "1 Ton Tees";
  if (h.includes("standard") && !h.includes("socks") && !h.includes("issue-beanie")) return "Standard Tees";
  if (h.includes("flannel") && h.includes("jacket")) return "Flannel Jackets";
  if (h.includes("flannel")) return "Flannels";
  if (h.includes("hoodie") && (h.includes("zip") || h.includes("zip-hood"))) return "Zip Hood Fleece";
  if (h.includes("hoodie") || h.includes("pullover")) return "Pullover Fleece";
  if (h.includes("beanie") || h.includes("snapback") || h.includes("hat") || h.includes("cap")) return "Hats";
  if (h.includes("boxer")) return "Boxers";
  if (h.includes("sock")) return "Socks";
  if (h.includes("lanyard")) return "Lanyards";
  if (h.includes("sticker")) return "Stickers";
  if (h.includes("long-sleeve") || h.includes("longsleeve")) return "Long Sleeves";
  if (h.includes("tank")) return "Tanks";
  if (h.includes("sweatpant") || h.includes("jogger")) return "Sweatpants";
  if (h.includes("jacket")) return "Jackets";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    let shopifyToken = Deno.env.get("SHOPIFY_ACCESS_TOKEN") || "";
    try {
      const adminSb = createClient(supabaseUrl, serviceRoleKey);
      const { data: tokenSetting } = await adminSb
        .from("site_settings").select("value").eq("key", "shopify_returns_token").single();
      if (tokenSetting?.value) shopifyToken = tokenSetting.value;
    } catch (_) { /* use env var */ }

    // Verify admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get unique product handles without review_group
    const { data: handles, error: hErr } = await admin
      .from("reviews")
      .select("product_handle")
      .is("review_group", null)
      .limit(1000);

    if (hErr) throw hErr;

    const uniqueHandles = [...new Set((handles || []).map((r: any) => r.product_handle))];
    console.log(`Found ${uniqueHandles.length} unique handles to backfill`);

    const results = { updated: 0, skipped: 0, shopifyLookups: 0, fallback: 0, errors: [] as string[] };
    const shopifyDomain = "sullenclothing.myshopify.com";

    for (const handle of uniqueHandles) {
      try {
        let group: string | null = null;

        // Try Shopify Admin API to get product's collections
        const shopifyRes = await fetch(
          `https://${shopifyDomain}/admin/api/2026-01/products.json?handle=${encodeURIComponent(handle)}&fields=id`,
          { headers: { "X-Shopify-Access-Token": shopifyToken } }
        );

        if (shopifyRes.ok) {
          const shopifyData = await shopifyRes.json();
          const product = shopifyData.products?.[0];

          if (product) {
            results.shopifyLookups++;

            // Get product's collections
            const collectRes = await fetch(
              `https://${shopifyDomain}/admin/api/2026-01/custom_collections.json?product_id=${product.id}`,
              { headers: { "X-Shopify-Access-Token": shopifyToken } }
            );

            if (collectRes.ok) {
              const collectData = await collectRes.json();
              const collections = collectData.custom_collections || [];

              // Also check smart collections
              const smartRes = await fetch(
                `https://${shopifyDomain}/admin/api/2026-01/smart_collections.json?product_id=${product.id}`,
                { headers: { "X-Shopify-Access-Token": shopifyToken } }
              );

              if (smartRes.ok) {
                const smartData = await smartRes.json();
                collections.push(...(smartData.smart_collections || []));
              }

              // Find the best matching group from collections
              for (const coll of collections) {
                const collHandle = coll.handle?.toLowerCase();
                if (collHandle && COLLECTION_GROUP_MAP[collHandle]) {
                  group = COLLECTION_GROUP_MAP[collHandle];
                  break;
                }
              }
            }
          }
        }

        // Fallback: guess from handle
        if (!group) {
          group = guessGroupFromHandle(handle);
          if (group) results.fallback++;
        }

        if (group) {
          const { error: uErr } = await admin
            .from("reviews")
            .update({ review_group: group })
            .eq("product_handle", handle)
            .is("review_group", null);

          if (uErr) throw uErr;
          results.updated++;
        } else {
          results.skipped++;
        }

        // Rate limit: 2 req/sec to avoid Shopify throttling
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        results.errors.push(`${handle}: ${err instanceof Error ? err.message : "Unknown"}`);
      }
    }

    return new Response(JSON.stringify({ ...results, totalHandles: uniqueHandles.length }), {
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
