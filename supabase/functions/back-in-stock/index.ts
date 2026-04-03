import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, variant_id, product_handle, product_title, variant_title } = await req.json();

    // Validate email
    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim()) || email.length > 255) {
      return new Response(
        JSON.stringify({ error: "A valid email address is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    if (!variant_id || typeof variant_id !== "string" || variant_id.length > 255) {
      return new Response(
        JSON.stringify({ error: "Invalid request." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!product_handle || typeof product_handle !== "string" || product_handle.length > 255) {
      return new Response(
        JSON.stringify({ error: "Invalid request." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!product_title || typeof product_title !== "string" || product_title.length > 500) {
      return new Response(
        JSON.stringify({ error: "Invalid request." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Rate limit: 5 requests per email per 60 minutes
    const rateLimitKey = `back_in_stock:${email.trim().toLowerCase()}`;
    const { data: allowed } = await supabase.rpc("check_rate_limit", {
      p_key: rateLimitKey,
      p_max_attempts: 5,
      p_window_minutes: 60,
    });

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert the request
    const { error } = await supabase.from("back_in_stock_requests").insert({
      email: email.trim().toLowerCase(),
      variant_id: variant_id.trim(),
      product_handle: product_handle.trim(),
      product_title: product_title.trim(),
      variant_title: variant_title ? String(variant_title).trim().slice(0, 255) : null,
    });

    if (error) {
      console.error("Insert error:", error);
      return new Response(
        JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send confirmation email
    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "back-in-stock-confirmation",
          recipientEmail: email.trim().toLowerCase(),
          idempotencyKey: `bis-confirm-${variant_id.trim()}-${email.trim().toLowerCase()}`,
          templateData: {
            productTitle: product_title.trim(),
            variantTitle: variant_title ? String(variant_title).trim() : undefined,
            productHandle: product_handle.trim(),
          },
        },
      });
    } catch (emailErr) {
      console.error("Failed to send confirmation email:", emailErr);
      // Don't fail the request if email fails
    }

    // Always return success (avoid email enumeration)
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Back in stock error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
