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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const {
      token,
      product_handle,
      product_title,
      product_image,
      rating,
      title,
      body,
      reviewer_name,
      reviewer_email,
      metadata,
    } = await req.json();

    if (!token || !product_handle || !rating || !body || !reviewer_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the token exists and is valid
    const { data: reviewRequest, error: tokenError } = await supabase
      .from("review_request_tokens")
      .select("id, email, status")
      .eq("token", token)
      .single();

    if (tokenError || !reviewRequest) {
      return new Response(
        JSON.stringify({ error: "Invalid review token" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (reviewRequest.status === "expired") {
      return new Response(
        JSON.stringify({ error: "This review link has expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for duplicate review (same email + product)
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("reviewer_email", reviewRequest.email)
      .eq("product_handle", product_handle)
      .limit(1);

    if (existingReview && existingReview.length > 0) {
      return new Response(
        JSON.stringify({ error: "You've already reviewed this product" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find user by email (if they have an account)
    let userId: string | null = null;
    const { data: userList } = await supabase.auth.admin.listUsers({ filter: reviewer_email });
    const matchedUser = userList?.users?.find(
      (u) => u.email?.toLowerCase() === reviewer_email.toLowerCase()
    );
    if (matchedUser) {
      userId = matchedUser.id;
    }

    // Determine status based on auto-approve logic
    const reviewStatus = rating >= 4 ? "approved" : "pending";

    // Insert the review using service role (bypasses RLS)
    const { error: insertError } = await supabase.from("reviews").insert({
      user_id: userId || "00000000-0000-0000-0000-000000000000",
      product_handle,
      product_title,
      product_image: product_image || null,
      rating,
      title: title || null,
      body,
      reviewer_name,
      reviewer_email: reviewRequest.email,
      verified_purchase: true,
      status: reviewStatus,
      metadata: metadata || {},
    });

    if (insertError) {
      console.error("Failed to insert review:", insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark the review request as completed
    await supabase
      .from("review_request_tokens")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", reviewRequest.id);

    console.log(`Token review submitted for ${product_title} by ${reviewer_name} (${rating}★)`);

    return new Response(
      JSON.stringify({ success: true, status: reviewStatus }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Submit token review error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
