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
    // Require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Verify caller is an admin
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleCheck } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (!roleCheck) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { order_id, order_name, email, customer_name, line_items } = await req.json();

    if (!order_id || !email) {
      return new Response(
        JSON.stringify({ error: "order_id and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if a review request already exists for this order
    const { data: existing } = await supabase
      .from("review_request_tokens")
      .select("id")
      .eq("order_id", order_id)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "already_exists" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the review request token (admin-triggered = send immediately)
    const { data: tokenData, error } = await supabase
      .from("review_request_tokens")
      .insert({
        order_id: order_id.toString(),
        order_name: order_name || `Order ${order_id}`,
        email: email.toLowerCase().trim(),
        customer_name: customer_name || "",
        line_items: line_items || [],
        status: "pending",
        send_after: new Date().toISOString(), // immediate for admin sends
      })
      .select("token")
      .single();

    if (error) {
      console.error("Failed to create review request:", error);
      return new Response(
        JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const reviewUrl = `https://www.sullenclothing.com/write-review/${tokenData.token}`;

    // Send the review request email
    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "review-request",
          recipientEmail: email.toLowerCase().trim(),
          idempotencyKey: `review-request-${order_id}`,
          templateData: {
            customerName: customer_name || undefined,
            orderName: order_name || `Order ${order_id}`,
            token: tokenData.token,
            items: (line_items || []).map((li: any) => ({
              title: li.title || '',
              handle: li.product_handle || '',
              image: li.image || '',
            })),
          },
        },
      });

      // Mark as sent
      await supabase
        .from("review_request_tokens")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("token", tokenData.token);

      console.log(`Review request email sent for order ${order_name} (${email})`);
    } catch (emailErr) {
      console.error("Failed to send review request email:", emailErr);
    }



    console.log(
      `Review request created for order ${order_name} (${email}), token: ${tokenData.token}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        token: tokenData.token,
        review_url: `/write-review/${tokenData.token}`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Schedule review request error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
