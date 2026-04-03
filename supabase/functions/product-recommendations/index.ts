import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SHOPIFY_STORE = "sullenclothing.myshopify.com";
const SHOPIFY_API_VERSION = "2025-07";
const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE}/api/${SHOPIFY_API_VERSION}/graphql.json`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const storefrontToken = Deno.env.get("SHOPIFY_STOREFRONT_ACCESS_TOKEN");

    if (!lovableApiKey || !storefrontToken) {
      throw new Error("Missing required secrets");
    }

    const trendingResponse = async () => {
      const trendingProducts = await fetchTrending(storefrontToken, serviceKey, supabaseUrl);
      return new Response(JSON.stringify({
        recommendations: trendingProducts.length > 0
          ? [{ reason: "Trending this week", products: trendingProducts }]
          : [],
        fallback: true,
      }), { headers: jsonHeaders });
    };

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return await trendingResponse();
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user) {
      return await trendingResponse();
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const [ordersRes, surveyRes, wishlistRes, memberRes] = await Promise.all([
      admin.from("order_history")
        .select("line_items, total_price, order_date")
        .or(`user_id.eq.${user.id},email.ilike.${user.email}`)
        .order("order_date", { ascending: false })
        .limit(10),
      admin.from("customer_surveys")
        .select("answers")
        .eq("user_id", user.id)
        .limit(1)
        .single(),
      anonClient.from("wishlists")
        .select("product_handle, product_title")
        .eq("user_id", user.id)
        .limit(20),
      admin.from("vault_members")
        .select("current_tier")
        .eq("user_id", user.id)
        .single(),
    ]);

    const purchasedProducts: string[] = [];
    for (const order of (ordersRes.data || [])) {
      const items = order.line_items as any[];
      if (Array.isArray(items)) {
        items.forEach((li: any) => {
          if (li.title) purchasedProducts.push(li.title);
        });
      }
    }

    const wishlistItems = (wishlistRes.data || []).map((w: any) => w.product_title);
    const surveyAnswers = surveyRes.data?.answers || {};
    const tier = memberRes.data?.current_tier || "none";

    const uniquePurchased = [...new Set(purchasedProducts)].slice(0, 15);
    const hasSignals = uniquePurchased.length > 0 || wishlistItems.length > 0 || Object.keys(surveyAnswers as Record<string, unknown>).length > 0;

    if (!hasSignals) {
      return await trendingResponse();
    }

    const userProfile = {
      purchased: uniquePurchased,
      wishlisted: wishlistItems.slice(0, 10),
      survey: surveyAnswers,
      tier,
    };

    let queries: Array<{ query: string; reason: string }> = [];

    try {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a product recommendation engine for Sullen Clothing, a tattoo-culture streetwear brand.
Given a customer profile, return exactly 3 Shopify Storefront API search queries that would surface products they'd love.
Consider their purchase history (avoid recommending what they already own), wishlist interests, survey style preferences, and loyalty tier.
Focus on complementary products, new collections they haven't tried, and items matching their style.`,
            },
            {
              role: "user",
              content: JSON.stringify(userProfile),
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "recommend_queries",
                description: "Return Shopify product search queries for personalized recommendations",
                parameters: {
                  type: "object",
                  properties: {
                    queries: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          query: { type: "string", description: "Shopify Storefront API product search query" },
                          reason: { type: "string", description: "Short reason for this recommendation category (shown to user)" },
                        },
                        required: ["query", "reason"],
                        additionalProperties: false,
                      },
                      minItems: 3,
                      maxItems: 3,
                    },
                  },
                  required: ["queries"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "recommend_queries" } },
        }),
      });

      if (!aiRes.ok) {
        const errText = await aiRes.text();
        console.error("AI error:", aiRes.status, errText);
        return await trendingResponse();
      }

      const aiData = await aiRes.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) {
        return await trendingResponse();
      }

      queries = JSON.parse(toolCall.function.arguments)?.queries ?? [];
    } catch (error) {
      console.error("AI recommendation failed, falling back to trending:", error);
      return await trendingResponse();
    }

    const ownedTitles = new Set(purchasedProducts.map((p: string) => p.toLowerCase()));
    const seenHandles = new Set<string>();
    const results: any[] = [];

    for (const { query, reason } of queries) {
      const products = await searchShopify(storefrontToken, query);

      const filtered = products.filter((p: any) => {
        const handle = p.node.handle;
        if (seenHandles.has(handle)) return false;
        if (ownedTitles.has(p.node.title.toLowerCase())) return false;
        seenHandles.add(handle);
        return true;
      }).slice(0, 6);

      if (filtered.length > 0) {
        results.push({ reason, products: filtered });
      }
    }

    if (results.length === 0) {
      return await trendingResponse();
    }

    return new Response(JSON.stringify({ recommendations: results, fallback: false }), {
      headers: jsonHeaders,
    });
  } catch (err) {
    console.error("product-recommendations error:", err);
    return new Response(JSON.stringify({ error: String(err), recommendations: [], fallback: true }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});

const PRODUCT_FRAGMENT = `
  id title handle description
  priceRange { minVariantPrice { amount currencyCode } }
  images(first: 1) { edges { node { url altText } } }
  variants(first: 1) { edges { node { id availableForSale price { amount currencyCode } } } }
`;

async function searchShopify(token: string, query: string) {
  const res = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({
      query: `query($q: String!) { products(first: 10, query: $q) { edges { node { ${PRODUCT_FRAGMENT} } } } }`,
      variables: { q: query },
    }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data?.products?.edges || [];
}

async function fetchTrending(token: string, serviceKey: string, supabaseUrl: string) {
  // Pull top-selling product titles from the last 7 days of orders
  const admin = createClient(supabaseUrl, serviceKey);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: recentOrders } = await admin
    .from("order_history")
    .select("line_items")
    .gte("order_date", sevenDaysAgo)
    .limit(200);

  // Count product occurrences
  const counts: Record<string, number> = {};
  for (const order of (recentOrders || [])) {
    const items = order.line_items as any[];
    if (Array.isArray(items)) {
      for (const li of items) {
        const title = li.title;
        if (title) counts[title] = (counts[title] || 0) + (li.quantity || 1);
      }
    }
  }

  // Sort by frequency and take top product names
  const topTitles = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([title]) => title);

  if (topTitles.length === 0) {
    // Ultimate fallback: just search for newest products
    return await searchShopify(token, "tag:new-arrival");
  }

  // Search Shopify for these products
  const seenHandles = new Set<string>();
  const all: any[] = [];

  for (const title of topTitles) {
    const products = await searchShopify(token, title);
    for (const p of products) {
      if (!seenHandles.has(p.node.handle)) {
        seenHandles.add(p.node.handle);
        all.push(p);
      }
      if (all.length >= 8) break;
    }
    if (all.length >= 8) break;
  }

  return all.slice(0, 8);
}
