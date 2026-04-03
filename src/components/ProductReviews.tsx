import { useState, useMemo, useEffect } from "react";
import { Star, SlidersHorizontal, ChevronLeft, ChevronRight, Loader2, X, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNativeReviews, type NativeReview } from "@/hooks/useNativeReviews";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* ─── Props ─── */
interface ProductReviewsProps {
  productHandle: string;
  productTitle: string;
  reviewGroup?: string | null;
}

/* ─── Stars helper ─── */
function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.round(rating) ? "fill-primary text-primary" : "text-muted-foreground/30"}
        />
      ))}
    </div>
  );
}

/* ─── Relative date ─── */
function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
  if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? "s" : ""} ago`;
  return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? "s" : ""} ago`;
}

const REVIEWS_PER_PAGE = 5;

/* ─── AI Summary hook ─── */
function useReviewSummary(groupKey: string | null) {
  return useQuery({
    queryKey: ["review-summary", groupKey],
    queryFn: async () => {
      if (!groupKey) return null;
      
      // Try cache first
      const { data: cached } = await supabase
        .from("review_summaries")
        .select("summary, review_count, avg_rating, updated_at")
        .eq("group_key", groupKey)
        .maybeSingle();

      if (cached) {
        const age = Date.now() - new Date(cached.updated_at).getTime();
        if (age < 7 * 24 * 60 * 60 * 1000) {
          // Trigger background refresh if needed, but return cached
          triggerSummaryGeneration(groupKey);
          return cached.summary as string;
        }
      }

      // Generate fresh
      await triggerSummaryGeneration(groupKey);
      
      // Re-fetch from cache after generation
      const { data: fresh } = await supabase
        .from("review_summaries")
        .select("summary")
        .eq("group_key", groupKey)
        .maybeSingle();

      return (fresh?.summary as string) || null;
    },
    staleTime: 30 * 60 * 1000,
    enabled: !!groupKey,
  });
}

async function triggerSummaryGeneration(groupKey: string) {
  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    await fetch(`https://${projectId}.supabase.co/functions/v1/generate-review-summary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify({ groupKey }),
    });
  } catch {
    // silent fail
  }
}

/* ─── Main component ─── */
export function ProductReviews({ productHandle, productTitle, reviewGroup = null }: ProductReviewsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "highest" | "lowest">("recent");

  const { data, isLoading } = useNativeReviews(productHandle, reviewGroup ?? null);

  const groupLabel = data?.reviewGroup || null;
  const aggregate = data?.aggregate;
  const summaryKey = reviewGroup || (aggregate && aggregate.totalReviews >= 5 ? productHandle : null);
  const { data: aiSummary } = useReviewSummary(summaryKey);

  const sortedReviews = useMemo(() => {
    let reviews = data?.reviews ?? [];
    if (filterRating) reviews = reviews.filter((r) => r.rating === filterRating);
    if (sortBy === "highest") return [...reviews].sort((a, b) => b.rating - a.rating);
    if (sortBy === "lowest") return [...reviews].sort((a, b) => a.rating - b.rating);
    return reviews; // already sorted by recent
  }, [data?.reviews, filterRating, sortBy]);

  if (isLoading) {
    return (
      <section className="py-12 lg:py-16 border-t border-border/40">
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="animate-spin" size={20} />
          <span className="text-sm">Loading reviews…</span>
        </div>
      </section>
    );
  }

  if (!aggregate || aggregate.totalReviews === 0) {
    return null;
  }

  const { totalReviews, avgRating, breakdown } = aggregate;
  const maxCount = Math.max(...breakdown.map((b) => b.count), 1);

  // Pagination
  const totalPages = Math.ceil(sortedReviews.length / REVIEWS_PER_PAGE);
  const paginatedReviews = sortedReviews.slice(
    (currentPage - 1) * REVIEWS_PER_PAGE,
    currentPage * REVIEWS_PER_PAGE
  );

  return (
    <section className="py-12 lg:py-16 border-t border-border/40">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        {/* ─── Header: Rating stats ─── */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 lg:gap-12">
          {/* Left: Rating breakdown */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-display font-bold text-foreground">
                {avgRating.toFixed(1)}
              </span>
              <Stars rating={avgRating} size={20} />
              <span className="text-sm text-muted-foreground">
                Based on {totalReviews.toLocaleString()} reviews
              </span>
            </div>

            {/* Tier badge */}
            {groupLabel && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/60 text-xs font-display uppercase tracking-wider text-muted-foreground">
                <Shield size={12} />
                Reviews across all {groupLabel} products
              </div>
            )}

            <div className="space-y-1.5">
              {breakdown.map((row) => (
                <button
                  key={row.stars}
                  className="flex items-center gap-2 w-full group"
                  onClick={() => {
                    setFilterRating(filterRating === row.stars ? null : row.stars);
                    setCurrentPage(1);
                  }}
                >
                  <span className="text-sm w-3 text-right text-foreground">{row.stars}</span>
                  <Star size={12} className="fill-primary text-primary" />
                  <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-foreground rounded-full transition-all group-hover:bg-primary"
                      style={{ width: `${(row.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {row.count >= 1000
                      ? `${(row.count / 1000).toFixed(1)}k`
                      : row.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Media grid from reviews with images */}
          {(() => {
            const mediaReviews = (data?.reviews ?? [])
              .filter((r) => r.mediaUrls.length > 0)
              .flatMap((r) => r.mediaUrls)
              .slice(0, 12);
            if (mediaReviews.length === 0) return null;
            return (
              <div className="grid grid-cols-4 gap-1.5 max-w-[280px]">
                {mediaReviews.map((url, i) => (
                  <div key={i} className="aspect-square rounded overflow-hidden bg-muted">
                    <img src={url} alt="Customer photo" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* ─── AI Review Summary ─── */}
        {aiSummary && (
          <div className="mt-8 p-5 rounded-lg bg-muted/50 border border-border">
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-foreground flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-primary" />
              Reviews Summary
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {aiSummary}
            </p>
          </div>
        )}

        {/* ─── Action bar ─── */}
        <div className="mt-8 flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-3">
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              className="gap-2 font-display uppercase tracking-wider text-xs"
              onClick={() => setShowFilters((v) => !v)}
            >
              <SlidersHorizontal size={14} />
              Filters
              {filterRating && (
                <span className="ml-1 text-xs bg-primary-foreground text-primary rounded-full w-5 h-5 flex items-center justify-center">
                  {filterRating}★
                </span>
              )}
            </Button>
            <span className="text-sm text-muted-foreground">
              {sortedReviews.length.toLocaleString()} review{sortedReviews.length !== 1 ? "s" : ""}
            </span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as any); setCurrentPage(1); }}
            className="text-xs font-display uppercase tracking-wider bg-transparent border border-border rounded-md px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>

        {/* ─── Filter panel ─── */}
        {showFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mr-1">Rating:</span>
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = breakdown.find((b) => b.stars === stars)?.count ?? 0;
              return (
                <Button
                  key={stars}
                  variant={filterRating === stars ? "default" : "outline"}
                  size="sm"
                  className="h-7 px-2.5 text-xs gap-1 font-display"
                  onClick={() => {
                    setFilterRating(filterRating === stars ? null : stars);
                    setCurrentPage(1);
                  }}
                >
                  {stars} <Star size={10} className="fill-current" /> ({count})
                </Button>
              );
            })}
            {filterRating && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1"
                onClick={() => { setFilterRating(null); setCurrentPage(1); }}
              >
                <X size={12} /> Clear
              </Button>
            )}
          </div>
        )}

        {/* ─── Review cards ─── */}
        <div className="mt-6 space-y-6">
          {paginatedReviews.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No reviews match this filter.
            </p>
          )}
          {paginatedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} showProductName={!!groupLabel} />
          ))}
        </div>

        {/* ─── Pagination ─── */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="h-9 w-9"
            >
              <ChevronLeft size={16} />
            </Button>

            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let page: number;
              if (totalPages <= 7) {
                page = i + 1;
              } else if (currentPage <= 4) {
                page = i + 1;
              } else if (currentPage >= totalPages - 3) {
                page = totalPages - 6 + i;
              } else {
                page = currentPage - 3 + i;
              }
              return (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="h-9 w-9 p-0 font-display text-xs"
                >
                  {page}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="h-9 w-9"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Single review card ─── */
function ReviewCard({ review, showProductName }: { review: NativeReview; showProductName: boolean }) {
  return (
    <div className="flex gap-4 pb-6 border-b border-border/40 last:border-0">
      {/* Left: Avatar + product info */}
      <div className="flex flex-col items-center gap-2 shrink-0">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <span className="text-sm font-bold text-muted-foreground">
            {review.reviewerName.charAt(0).toUpperCase()}
          </span>
        </div>
        {/* Product thumbnail for grouped reviews */}
        {showProductName && review.productImage && (
          <div className="w-12 h-12 rounded border border-border overflow-hidden bg-muted">
            <img
              src={review.productImage}
              alt={review.productTitle}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-foreground">{review.reviewerName}</p>
            {review.verified && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield size={10} className="text-primary" />
                Verified Buyer
              </p>
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {relativeDate(review.createdAt)}
          </span>
        </div>
        <div className="mt-2">
          <Stars rating={review.rating} size={14} />
        </div>
        {review.title && (
          <p className="mt-2 text-sm font-display font-bold text-foreground uppercase">{review.title}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{review.body}</p>

        {/* Show which product this review is for when grouped */}
        {showProductName && (
          <p className="mt-2 text-[11px] font-display uppercase tracking-wider text-muted-foreground/70">
            Reviewing: {review.productTitle}
          </p>
        )}

        {/* Media */}
        {review.mediaUrls.length > 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {review.mediaUrls.slice(0, 4).map((url, i) => (
              <div key={i} className="w-16 h-16 rounded overflow-hidden bg-muted">
                <img src={url} alt="Review media" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
