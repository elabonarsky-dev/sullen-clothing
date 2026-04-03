import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const { email, phone } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(
        JSON.stringify({ success: false, error: "Valid email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate phone if provided — must be E.164 format
    if (phone && (typeof phone !== "string" || !/^\+[1-9]\d{6,14}$/.test(phone))) {
      return new Response(
        JSON.stringify({ success: false, error: "Phone must be in E.164 format (e.g. +15551234567)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build user object
    const user: Record<string, unknown> = { email };
    if (phone) {
      user.phone = phone;
    }

    // Use locale (object) + subscriptionType when no signUpSourceId
    const body = {
      user,
      locale: { language: "en", country: "US" },
      subscriptionType: "MARKETING",
    };

    console.log("Sending to Attentive:", JSON.stringify(body));

    const response = await fetch("https://api.attentivemobile.com/v1/subscriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ATTENTIVE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Attentive API error [${response.status}]:`, errorData);
      // 409 = already subscribed, treat as success
      if (response.status === 409) {
        return new Response(
          JSON.stringify({ success: true, message: "Already subscribed" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Attentive API error [${response.status}]: ${errorData}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error subscribing:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});