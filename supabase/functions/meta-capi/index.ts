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
    const PIXEL_ID = Deno.env.get("META_PIXEL_ID");
    const ACCESS_TOKEN = Deno.env.get("META_CAPI_ACCESS_TOKEN");

    if (!PIXEL_ID || !ACCESS_TOKEN) {
      console.error("[CAPI] Missing META_PIXEL_ID or META_CAPI_ACCESS_TOKEN");
      return new Response(JSON.stringify({ error: "Not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      event_name,
      event_id,
      event_source_url,
      user_data = {},
      custom_data = {},
    } = body;

    if (!event_name || !event_id) {
      return new Response(
        JSON.stringify({ error: "event_name and event_id are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build the CAPI event payload
    const eventData: Record<string, unknown> = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id,
      event_source_url,
      action_source: "website",
      user_data: {
        client_user_agent: user_data.client_user_agent || "",
        ...(user_data.fbc && { fbc: user_data.fbc }),
        ...(user_data.fbp && { fbp: user_data.fbp }),
        ...(user_data.em && { em: [user_data.em] }),
        ...(user_data.external_id && { external_id: [user_data.external_id] }),
        ...(user_data.client_ip_address && {
          client_ip_address: user_data.client_ip_address,
        }),
      },
    };

    if (Object.keys(custom_data).length > 0) {
      eventData.custom_data = custom_data;
    }

    // Try to get client IP from request headers for better matching
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip");

    if (clientIp) {
      (eventData.user_data as Record<string, unknown>).client_ip_address =
        clientIp;
    }

    const url = `https://graph.facebook.com/v21.0/${PIXEL_ID}/events`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [eventData],
        access_token: ACCESS_TOKEN,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[CAPI] Meta API error:", JSON.stringify(result));
      return new Response(JSON.stringify({ error: result }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(
      `[CAPI] ${event_name} sent successfully (event_id: ${event_id})`
    );

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[CAPI] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
