import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user with anon client
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { campaign_slug, order_id } = await req.json();
    if (!campaign_slug) {
      return new Response(JSON.stringify({ error: "campaign_slug is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey);

    // Get active campaign
    const { data: campaign, error: campErr } = await admin
      .from("unboxing_campaigns")
      .select("*")
      .eq("slug", campaign_slug)
      .eq("is_active", true)
      .single();

    if (campErr || !campaign) {
      return new Response(JSON.stringify({ error: "Campaign not found or inactive" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already claimed
    const { data: existingClaim } = await admin
      .from("unboxing_claims")
      .select("id, reward_type, reward_value")
      .eq("campaign_id", campaign.id)
      .eq("user_id", user.id)
      .single();

    if (existingClaim) {
      return new Response(JSON.stringify({
        already_claimed: true,
        reward_type: existingClaim.reward_type,
        reward_value: existingClaim.reward_value,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine reward
    let rewardType = campaign.reward_type;
    let rewardValue: string;

    if (rewardType === "points") {
      const min = campaign.reward_points_min || 50;
      const max = campaign.reward_points_max || 200;
      const points = Math.floor(Math.random() * (max - min + 1)) + min;
      rewardValue = String(points);

      // Award points
      await admin.from("reward_transactions").insert({
        user_id: user.id,
        points,
        type: "admin_adjustment",
        description: `🎁 Unboxing reward: ${campaign.title}`,
        reference_id: `unboxing-${campaign.id}`,
        source: "unboxing",
      });
    } else {
      // Discount code — pop one from the array
      const codes: string[] = campaign.reward_discount_codes || [];
      if (codes.length === 0) {
        return new Response(JSON.stringify({ error: "No discount codes remaining" }), {
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      rewardValue = codes[0];
      // Remove used code from the array
      await admin
        .from("unboxing_campaigns")
        .update({ reward_discount_codes: codes.slice(1), updated_at: new Date().toISOString() })
        .eq("id", campaign.id);
    }

    // Record claim
    await admin.from("unboxing_claims").insert({
      campaign_id: campaign.id,
      user_id: user.id,
      order_id: order_id || null,
      reward_type: rewardType,
      reward_value: rewardValue,
    });

    return new Response(JSON.stringify({
      already_claimed: false,
      reward_type: rewardType,
      reward_value: rewardValue,
      campaign_title: campaign.title,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("claim-unboxing-reward error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
