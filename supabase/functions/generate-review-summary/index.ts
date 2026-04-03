import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { groupKey } = await req.json();
    if (!groupKey) throw new Error("groupKey required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Check cache - refresh if review count changed significantly or > 7 days old
    const { data: cached } = await sb
      .from("review_summaries")
      .select("*")
      .eq("group_key", groupKey)
      .maybeSingle();

    // Fetch current reviews for this group
    let query = sb
      .from("reviews")
      .select("rating, title, body, product_title, review_group")
      .eq("status", "approved");

    // Try as review_group first, fallback to product_handle
    query = query.or(`review_group.eq.${groupKey},product_handle.eq.${groupKey}`);

    const { data: reviews, error: reviewErr } = await query.order("created_at", { ascending: false }).limit(200);
    if (reviewErr) throw reviewErr;
    if (!reviews || reviews.length < 3) {
      return new Response(JSON.stringify({ summary: null }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const currentCount = reviews.length;
    const currentAvg = reviews.reduce((s, r) => s + r.rating, 0) / currentCount;

    // Use cache if fresh enough
    if (cached) {
      const age = Date.now() - new Date(cached.updated_at).getTime();
      const countDiff = Math.abs(currentCount - cached.review_count);
      if (age < 7 * 24 * 60 * 60 * 1000 && countDiff < 10) {
        return new Response(JSON.stringify({ summary: cached.summary, reviewCount: currentCount, avgRating: currentAvg }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Build prompt from review excerpts
    const excerpts = reviews.slice(0, 50).map((r, i) =>
      `${i + 1}. [${r.rating}★] ${r.title ? r.title + " - " : ""}${r.body.slice(0, 200)}`
    ).join("\n");

    const prompt = `You are writing a review summary for the "${groupKey}" product group at Sullen Clothing (tattoo lifestyle brand). Based on these ${currentCount} customer reviews (avg ${currentAvg.toFixed(1)}★), write a concise 2-3 sentence summary of what customers love and any common feedback. Be specific about fabric quality, fit, design, and durability. Do NOT use bullet points. Keep it under 80 words.\n\nReviews:\n${excerpts}`;

    // Call Lovable AI
    const aiRes = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
      }),
    });

    if (!aiRes.ok) {
      console.error("AI error:", await aiRes.text());
      throw new Error("AI generation failed");
    }

    const aiData = await aiRes.json();
    const summary = aiData.choices?.[0]?.message?.content?.trim() || "";

    if (!summary) throw new Error("Empty summary");

    // Upsert cache
    await sb.from("review_summaries").upsert({
      group_key: groupKey,
      summary,
      review_count: currentCount,
      avg_rating: currentAvg,
      updated_at: new Date().toISOString(),
    }, { onConflict: "group_key" });

    return new Response(JSON.stringify({ summary, reviewCount: currentCount, avgRating: currentAvg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
