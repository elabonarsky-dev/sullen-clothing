import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_OPTIONS: Record<number, number> = { 500: 5, 1000: 10, 2500: 25 };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
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

    // Verify user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await userClient.auth.getUser();
    if (claimsError || !claimsData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.user.id;

    const { points, amount } = await req.json();

    if (!VALID_OPTIONS[points] || VALID_OPTIONS[points] !== amount) {
      return new Response(JSON.stringify({ error: "Invalid redemption option" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for atomic operations
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Rate limit: max 3 redemptions per 15 minutes per user
    const { data: allowed } = await admin.rpc("check_rate_limit", {
      p_key: `redeem:${userId}`,
      p_max_attempts: 3,
      p_window_minutes: 15,
    });

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Too many redemption attempts. Please wait a few minutes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Shopify discount code via GraphQL Admin API
    let shopifyToken = Deno.env.get("SHOPIFY_ACCESS_TOKEN") || "";
    try {
      const { data: tokenSetting } = await admin
        .from("site_settings").select("value").eq("key", "shopify_returns_token").single();
      if (tokenSetting?.value) shopifyToken = tokenSetting.value;
    } catch (_) { /* use env var */ }
    let shopifyToken = Deno.env.get("SHOPIFY_ACCESS_TOKEN") || "";
    try {
      const { data: tokenSetting } = await supabase
        .from("site_settings").select("value").eq("key", "shopify_returns_token").single();
      if (tokenSetting?.value) shopifyToken = tokenSetting.value;
    } catch (_) { /* use env var */ }
    if (!shopifyToken) {
      return new Response(JSON.stringify({ error: "Shopify not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const code = `SKULL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const shopifyDomain = "sullenclothing.myshopify.com";
    const SHOPIFY_ADMIN_API_VERSION = "2026-01";

    // Use GraphQL discountCodeBasicCreate (write_discounts scope)
    const now = new Date().toISOString();
    const graphqlRes = await fetch(
      `https://${shopifyDomain}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": shopifyToken,
        },
        body: JSON.stringify({
          query: `mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
            discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
              codeDiscountNode { id }
              userErrors { field message }
            }
          }`,
          variables: {
            basicCodeDiscount: {
              title: `Skull Points Redemption - ${code}`,
              code,
              startsAt: now,
              usageLimit: 1,
              appliesOncePerCustomer: true,
              customerSelection: { all: true },
              customerGets: {
                value: { discountAmount: { amount: amount.toString(), appliesOnEachItem: false } },
                items: { all: true },
              },
            },
          },
        }),
      }
    );

    if (!graphqlRes.ok) {
      const errBody = await graphqlRes.text();
      console.error("Shopify GraphQL error:", errBody);
      return new Response(
        JSON.stringify({ error: "Failed to create discount" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const graphqlData = await graphqlRes.json();
    const userErrors = graphqlData?.data?.discountCodeBasicCreate?.userErrors;
    if (userErrors && userErrors.length > 0) {
      console.error("Shopify discount userErrors:", JSON.stringify(userErrors));
      return new Response(
        JSON.stringify({ error: userErrors[0].message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Atomic balance check + deduction (prevents race conditions)
    const { data: txId, error: redeemError } = await admin.rpc("atomic_redeem_points", {
      p_user_id: userId,
      p_points: points,
      p_description: `Redeemed for $${amount} discount (${code})`,
      p_reference_id: code,
    });

    if (redeemError) {
      console.error("Atomic redeem error:", redeemError);
      if (redeemError.message?.includes("Insufficient points")) {
        return new Response(JSON.stringify({ error: "Insufficient points" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Failed to record transaction" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Record redemption
    await admin.from("reward_redemptions").insert({
      user_id: userId,
      transaction_id: txId,
      points_spent: points,
      discount_code: code,
      discount_amount: amount,
    });

    return new Response(
      JSON.stringify({ discount_code: code, amount, points_spent: points }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Redeem error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
