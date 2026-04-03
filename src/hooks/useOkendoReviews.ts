import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

interface OkendoAggregate {
  reviewCount: number;
  reviewCountByLevel: Record<string, number>;
  ratingAndReviewValuesTotal: number;
  recommendationCount: number;
  mediaCount: number;
}

function buildUrl(productId: string, nextUrl?: string) {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const params = new URLSearchParams({ productId });
  if (nextUrl) params.set("nextUrl", nextUrl);
  return `https://${projectId}.supabase.co/functions/v1/okendo-reviews?${params}`;
}

async function fetchOkendoData(productId: string, nextUrl?: string) {
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const res = await fetch(buildUrl(productId, nextUrl), {
    headers: {
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch reviews");
  return res.json();
}

export function useOkendoReviews(productId: string) {
  return useQuery({
    queryKey: ["okendo-reviews", productId],
    queryFn: () => fetchOkendoData(productId),
    staleTime: 5 * 60 * 1000,
    enabled: !!productId,
  });
}

/** Fetch more reviews (pagination) */
export function useLoadMoreReviews(productId: string) {
  const queryClient = useQueryClient();

  return useCallback(
    async (nextUrl: string) => {
      const moreData = await fetchOkendoData(productId, nextUrl);
      // Merge into existing cache
      queryClient.setQueryData(["okendo-reviews", productId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          reviews: [...(old.reviews ?? []), ...(moreData.reviews ?? [])],
          nextUrl: moreData.nextUrl ?? null,
        };
      });
    },
    [productId, queryClient]
  );
}

/** Convenience: just the aggregate stats */
export function useOkendoAggregate(productId: string) {
  const query = useOkendoReviews(productId);
  const agg: OkendoAggregate | null = query.data?.aggregate?.reviewAggregate ?? null;

  const reviewCount = agg?.reviewCount ?? 0;
  const avgRating = reviewCount > 0 ? agg!.ratingAndReviewValuesTotal / reviewCount : 0;

  return {
    ...query,
    reviewCount,
    avgRating,
    aggregate: agg,
  };
}
