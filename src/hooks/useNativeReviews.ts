import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Same collection→group mapping used in the backfill edge function
const COLLECTION_GROUP_MAP: Record<string, string> = {
  "1-ton-tees": "1 Ton Tees",
  "1ton-heavyweight-flannels": "1Ton Heavyweight Flannels",
  "premium-tees": "Premium Tees",
  "standard-tees": "Standard Tees",
  "the-solids": "The Solids",
  "boxers": "Boxers",
  "crew-neck-fleece": "Crew Neck Fleece",
  "flannel-jackets": "Flannel Jackets",
  "flannels": "Flannels",
  "hats": "Hats",
  "headwear": "Hats",
  "jackets": "Jackets",
  "lanyards": "Lanyards",
  "lanyards-1": "Lanyards",
  "long-sleeves": "Long Sleeves",
  "pullover-fleece": "Pullover Fleece",
  "socks": "Socks",
  "stickers": "Stickers",
  "sweatpants": "Sweatpants",
  "womens-intimates": "Womens Inktimates & Lounge",
  "intimates": "Womens Inktimates & Lounge",
  "womens-tops": "Womens Tops",
  "youth-tees": "Youth",
  "youth": "Youth",
  "zip-hood-fleece": "Zip Hood Fleece",
  "zip-hoodies": "Zip Hood Fleece",
  "hoodies": "Pullover Fleece",
  "tanks": "Tanks",
  "womens": "Womens Tops",
};

/**
 * Given a product's collection handles (from Shopify), determine its review group.
 */
export function getReviewGroup(collectionHandles: string[]): string | null {
  for (const handle of collectionHandles) {
    const group = COLLECTION_GROUP_MAP[handle.toLowerCase()];
    if (group) return group;
  }
  return null;
}

interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  reviewer_name: string;
  verified_purchase: boolean;
  created_at: string;
  product_handle: string;
  product_title: string;
  product_image: string | null;
  media_urls: string[] | null;
  review_group: string | null;
}

export interface NativeReview {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  reviewerName: string;
  verified: boolean;
  createdAt: string;
  productHandle: string;
  productTitle: string;
  productImage: string | null;
  mediaUrls: string[];
}

export interface NativeReviewAggregate {
  totalReviews: number;
  avgRating: number;
  breakdown: { stars: number; count: number }[];
}

function mapReview(r: ReviewRow): NativeReview {
  return {
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    reviewerName: r.reviewer_name,
    verified: r.verified_purchase,
    createdAt: r.created_at,
    productHandle: r.product_handle,
    productTitle: r.product_title,
    productImage: r.product_image,
    mediaUrls: r.media_urls || [],
  };
}

/**
 * Fetch reviews for a product, grouped by review_group if available.
 * @param productHandle - the current product's handle
 * @param reviewGroup - the review group name (from product's collections)
 */
export function useNativeReviews(productHandle: string, reviewGroup: string | null) {
  const groupKey = reviewGroup || productHandle;

  return useQuery({
    queryKey: ["native-reviews", groupKey, productHandle],
    queryFn: async () => {
      let query = supabase
        .from("reviews_public")
        .select("id, rating, title, body, reviewer_name, verified_purchase, created_at, product_handle, product_title, product_image, media_urls, review_group")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (reviewGroup) {
        // Fetch all reviews in this group
        query = query.eq("review_group", reviewGroup);
      } else {
        // Fallback: just this product
        query = query.eq("product_handle", productHandle);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;

      const allMapped = (data || []).map(mapReview);

      // Prioritize reviews for the exact product, then the rest of the group
      const reviews = reviewGroup
        ? [
            ...allMapped.filter((r) => r.productHandle === productHandle),
            ...allMapped.filter((r) => r.productHandle !== productHandle),
          ]
        : allMapped;

      // Calculate aggregate
      const totalReviews = reviews.length;
      const avgRating = totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;
      const countByStars: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviews.forEach((r) => { countByStars[r.rating] = (countByStars[r.rating] || 0) + 1; });
      const breakdown = [5, 4, 3, 2, 1].map((s) => ({ stars: s, count: countByStars[s] }));

      const aggregate: NativeReviewAggregate = { totalReviews, avgRating, breakdown };

      return { reviews, aggregate, reviewGroup };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!productHandle,
  });
}
