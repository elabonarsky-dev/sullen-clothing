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

    const { email, phone, dropHandle, dropTitle } = await req.json();

    if (!email && !phone) {
      return new Response(
        JSON.stringify({ success: false, error: "Email or phone is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { subscription?: string; event?: string } = {};

    // 1. Subscribe the user to Attentive marketing list
    if (email) {
      const user: Record<string, unknown> = { email };
      if (phone) {
        user.phone = phone;
      }

      const subBody = {
        user,
        locale: { language: "en", country: "US" },
        subscriptionType: "MARKETING",
      };

      const subRes = await fetch("https://api.attentivemobile.com/v1/subscriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ATTENTIVE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subBody),
      });

      if (subRes.ok) {
        results.subscription = "subscribed";
      } else if (subRes.status === 409) {
        results.subscription = "already_subscribed";
      } else {
        const errText = await subRes.text();
        console.error(`Attentive subscription error [${subRes.status}]:`, errText);
        results.subscription = "failed";
      }
    }

    // 2. Send a custom "Drop Notify" event so Attentive can trigger a journey
    const eventPayload = {
      type: "ce",
      properties: {
        $event_name: "Drop Notify Signup",
        ...(email ? { email } : {}),
        items: [
          {
            productId: dropHandle || "unknown-drop",
            productName: dropTitle || dropHandle || "Upcoming Drop",
            productUrl: `https://www.sullenclothing.com/drops/${dropHandle}`,
          },
        ],
      },
      user: {
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
      },
    };

    const eventRes = await fetch("https://api.attentivemobile.com/v1/events/custom", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ATTENTIVE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventPayload),
    });

    if (eventRes.ok) {
      results.event = "sent";
    } else {
      const errText = await eventRes.text();
      console.error(`Attentive custom event error [${eventRes.status}]:`, errText);
      results.event = "failed";
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Attentive drop notify error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
