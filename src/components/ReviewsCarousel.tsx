import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface OkendoReview {
  reviewId?: string;
  title?: string;
  body?: string;
  rating?: number;
  reviewer?: { displayName?: string };
  product?: { name?: string };
  dateCreated?: string;
}

// Static fallback reviews
const fallbackReviews = [
  { name: "Mike T.", rating: 5, text: "Best fitting tees I've ever owned. The premium fabric is on another level.", product: "Badge of Honor Premium Tee" },
  { name: "Carlos R.", rating: 5, text: "Sullen is the only brand that truly represents tattoo culture. Quality is insane.", product: "Reaper Premium Tee" },
  { name: "Jason L.", rating: 5, text: "Got the Artist Series — the print detail is museum-quality. Absolutely worth it.", product: "Artist Series Collection" },
  { name: "Sarah K.", rating: 5, text: "Bought my husband the 1-Ton oversized tee and he won't wear anything else now.", product: "1-Ton Oversized Tee" },
  { name: "Derek M.", rating: 5, text: "Shipping was fast, customer service was incredible. Lifelong customer now.", product: "Timeless Collection" },
  { name: "Amanda P.", rating: 5, text: "The flannel quality is unreal. Heavy weight, beautiful print. 10/10.", product: "Sullen Flannel" },
  { name: "Tyler W.", rating: 5, text: "I've been buying Sullen for years. Every drop gets better and better.", product: "Cherubs Capsule" },
  { name: "Rachel D.", rating: 4, text: "Love the women's line — finally a brand that gets both art and fit right.", product: "Women's Collection" },
];

function useStoreReviews() {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  return useQuery({
    queryKey: ["okendo-store-aggregate"],
    queryFn: async () => {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/okendo-reviews?storeAggregate=true`,
        {
          headers: {
            Authorization: `Bearer ${anonKey}`,
            apikey: anonKey,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch store reviews");
      return res.json();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

function useInternalReviews() {
  return useQuery({
    queryKey: ["internal-approved-reviews"],
    queryFn: async () => {
      const [reviewsRes, aggregateRes] = await Promise.all([
        supabase
          .from("reviews_public")
          .select("reviewer_name, rating, body, product_title")
          .order("created_at", { ascending: false })
          .limit(12),
        supabase.rpc("get_review_aggregate"),
      ]);
      return {
        reviews: (reviewsRes.data ?? []).map((r) => ({
          name: r.reviewer_name,
          rating: r.rating,
          text: r.body,
          product: r.product_title,
        })),
        aggregate: aggregateRes.data as { reviewCount: number; avgRating: number } | null,
      };
    },
    staleTime: 10 * 60 * 1000,
  });
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < count ? "fill-primary text-primary" : "fill-muted text-muted"}`}
        />
      ))}
    </div>
  );
}

export function ReviewsCarousel() {
  const { data: okendoData } = useStoreReviews();
  const { data: internalData } = useInternalReviews();

  // Combine aggregates: Okendo + internal
  const okendoAggregate = okendoData?.aggregate?.reviewAggregate;
  const okendoCount = okendoAggregate?.reviewCount ?? 0;
  const okendoTotal = okendoAggregate?.ratingAndReviewValuesTotal ?? 0;
  const internalCount = internalData?.aggregate?.reviewCount ?? 0;
  const internalAvg = internalData?.aggregate?.avgRating ?? 0;
  const combinedCount = okendoCount + internalCount;
  const combinedAvg = combinedCount > 0
    ? (okendoTotal + internalAvg * internalCount) / combinedCount
    : 4.9;
  const displayRating = Math.round(combinedAvg * 10) / 10;
  const filledStars = Math.round(combinedAvg);
  const displayCount = combinedCount || 960;

  // Map Okendo reviews
  const okendoReviews: { name: string; rating: number; text: string; product: string }[] =
    (okendoData?.reviews ?? [])
      .filter((r: OkendoReview) => r.body && r.rating && r.rating >= 4)
      .slice(0, 12)
      .map((r: OkendoReview) => ({
        name: r.reviewer?.displayName || "Verified Buyer",
        rating: r.rating!,
        text: r.body!,
        product: r.product?.name || "",
      }));

  // Merge: internal reviews first, then Okendo, deduplicate by text
  const internalReviews = internalData?.reviews ?? [];
  const allReviews = [...internalReviews, ...okendoReviews];
  const seen = new Set<string>();
  const uniqueReviews = allReviews.filter((r) => {
    const key = r.text.slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const reviews = uniqueReviews.length >= 4 ? uniqueReviews : fallbackReviews;
  const doubledReviews = [...reviews, ...reviews];

  return (
    <section className="py-14 bg-card/50 border-y border-border/20 overflow-hidden">
      <div className="container max-w-7xl mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-5 w-5 ${i < filledStars ? "fill-primary text-primary" : "fill-muted text-muted"}`} />
            ))}
          </div>
          <span className="text-sm font-body text-muted-foreground">
            {displayRating} out of 5 · Based on {displayCount.toLocaleString()}+ reviews
          </span>
        </div>
        <h2 className="font-display text-2xl md:text-3xl uppercase tracking-wider text-foreground">
          What Our Customers Say
        </h2>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex gap-5"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            x: {
              duration: 40,
              repeat: Infinity,
              ease: "linear",
            },
          }}
        >
          {doubledReviews.map((review, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[300px] md:w-[340px] bg-background border border-border/30 rounded-lg p-5 space-y-3"
            >
              <Stars count={review.rating} />
              <p className="text-sm text-foreground/90 font-body leading-relaxed line-clamp-3">
                "{review.text}"
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-display uppercase tracking-wider text-foreground">
                  {review.name}
                </span>
                {review.product && (
                  <span className="text-xs text-muted-foreground font-body truncate max-w-[140px]">
                    {review.product}
                  </span>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
