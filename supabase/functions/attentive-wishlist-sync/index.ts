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

    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userEmail = user.email as string;
    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "No email found in token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, productHandle, productTitle, productPrice, productImage } = await req.json();

    if (!action || !productHandle) {
      return new Response(
        JSON.stringify({ error: "action and productHandle are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send custom event to Attentive
    const eventType = action === "add" ? "Wishlist Add" : "Wishlist Remove";

    const attentivePayload = {
      type: "ce",
      properties: {
        $event_name: eventType,
        email: userEmail,
        items: [
          {
            productId: productHandle,
            productName: productTitle || productHandle,
            productImage: productImage || "",
            productUrl: `https://www.sullenclothing.com/products/${productHandle}`,
            price: productPrice ? { value: productPrice, currency: "USD" } : undefined,
          },
        ],
      },
      user: {
        email: userEmail,
      },
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
      const errorText = await response.text();
      console.error(`Attentive custom event error [${response.status}]:`, errorText);
      // Non-critical — don't fail the request
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Attentive wishlist sync error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
