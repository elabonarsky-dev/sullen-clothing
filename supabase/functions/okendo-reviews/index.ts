import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OKENDO_USER_ID = "ad92a7fe-22d5-46ea-9e6c-e3c89606274e";
const OKENDO_BASE = `https://api.okendo.io/v1/stores/${OKENDO_USER_ID}`;
const API_VERSION = "2025-02-01";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");
    const nextUrl = url.searchParams.get("nextUrl");
    const storeAggregate = url.searchParams.get("storeAggregate");

    const headers = { "okendo-api-version": API_VERSION };

    // Store-level aggregate + recent reviews (no productId needed)
    if (storeAggregate === "true") {
      const [aggRes, recentRes] = await Promise.all([
        fetch(`${OKENDO_BASE}/review_aggregate`, { headers }),
        fetch(`${OKENDO_BASE}/reviews?limit=12&orderBy=date%20desc`, { headers }),
      ]);

      const aggData = aggRes.ok ? await aggRes.json() : null;
      const recentData = recentRes.ok ? await recentRes.json() : null;

      return new Response(
        JSON.stringify({
          aggregate: aggData,
          reviews: recentData?.reviews ?? [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!productId) {
      return new Response(
        JSON.stringify({ error: "productId query param required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract numeric ID from Shopify GID (gid://shopify/Product/12345 → 12345)
    const numericId = productId.includes("/")
      ? productId.split("/").pop()
      : productId;

    const productHeaders = { "okendo-api-version": API_VERSION };

    // If nextUrl is provided, only fetch the next page of reviews
    if (nextUrl) {
      const reviewsRes = await fetch(`${OKENDO_BASE}${nextUrl}`, { headers: productHeaders });
      const reviewsData = reviewsRes.ok ? await reviewsRes.json() : null;

      return new Response(
        JSON.stringify({
          reviews: reviewsData?.reviews ?? [],
          nextUrl: reviewsData?.nextUrl ?? null,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initial load: fetch aggregate, reviews, summary, and media in parallel
    const [aggregateRes, reviewsRes, summaryRes, mediaRes, storeMediaRes] = await Promise.all([
      fetch(`${OKENDO_BASE}/products/shopify-${numericId}/review_aggregate`, { headers: productHeaders }),
      fetch(`${OKENDO_BASE}/products/shopify-${numericId}/reviews?limit=10&orderBy=date%20desc`, { headers: productHeaders }),
      fetch(`${OKENDO_BASE}/products/shopify-${numericId}/reviews_summary`, { headers: productHeaders }),
      fetch(`${OKENDO_BASE}/products/shopify-${numericId}/review_media?limit=12`, { headers: productHeaders }),
      fetch(`${OKENDO_BASE}/review_media?limit=12`, { headers: productHeaders }), // store-level fallback
    ]);

    const aggregate = aggregateRes.ok ? await aggregateRes.json() : null;
    const reviewsData = reviewsRes.ok ? await reviewsRes.json() : null;
    const summaryData = summaryRes.ok ? await summaryRes.json() : null;
    const mediaData = mediaRes.ok ? await mediaRes.json() : null;
    const storeMediaData = storeMediaRes.ok ? await storeMediaRes.json() : null;

    // Use product-level media, fallback to store-level
    const media = (mediaData?.reviewMedia?.length > 0)
      ? mediaData.reviewMedia
      : (storeMediaData?.reviewMedia ?? []);

    return new Response(
      JSON.stringify({
        aggregate,
        reviews: reviewsData?.reviews ?? [],
        nextUrl: reviewsData?.nextUrl ?? null,
        summary: summaryData?.reviewsSummary ?? null,
        media,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Okendo proxy error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
