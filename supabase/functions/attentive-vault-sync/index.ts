import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ATTENTIVE_API_KEY = Deno.env.get("ATTENTIVE_API_KEY");
    if (!ATTENTIVE_API_KEY) {
      throw new Error("ATTENTIVE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { event, userId, email, data } = await req.json();

    if (!event || !email) {
      return new Response(
        JSON.stringify({ error: "event and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enrich with current loyalty state
    let pointsBalance = 0;
    let currentTier = "apprentice";

    if (userId) {
      const { data: balance } = await admin.rpc("get_user_points_balance", {
        p_user_id: userId,
      });
      pointsBalance = balance || 0;

      const { data: member } = await admin
        .from("vault_members")
        .select("current_tier")
        .eq("user_id", userId)
        .maybeSingle();
      currentTier = member?.current_tier || "apprentice";
    }

    // Build Attentive custom event
    const attentivePayload = {
      type: "ce",
      properties: {
        $event_name: event,
        email,
        skullPointsBalance: pointsBalance,
        vaultTier: currentTier,
        vaultUrl: "https://www.sullenclothing.com/vault",
        rewardsUrl: "https://www.sullenclothing.com/rewards",
        ...(data || {}),
      },
      user: { email },
    };

    const response = await fetch("https://api.attentivemobile.com/v1/events/custom", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ATTENTIVE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(attentivePayload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Attentive event error [${response.status}]:`, errText);
      return new Response(
        JSON.stringify({ success: false, error: `Attentive API error: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Attentive event "${event}" sent for ${email}`);

    return new Response(
      JSON.stringify({ success: true, event, tier: currentTier, points: pointsBalance }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Attentive vault sync error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
