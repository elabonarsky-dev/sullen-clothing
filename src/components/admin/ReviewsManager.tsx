import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, Check, X, MessageSquare, Clock, Mail, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Review {
  id: string;
  user_id: string;
  product_handle: string;
  product_title: string;
  product_image: string | null;
  rating: number;
  title: string | null;
  body: string;
  reviewer_name: string;
  reviewer_email: string;
  verified_purchase: boolean;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
}

type FilterStatus = "all" | "pending" | "approved" | "rejected";

export function ReviewsManager() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [backfilling, setBackfilling] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    setLoading(true);
    let query = supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;
    if (error) {
      toast.error("Failed to load reviews");
    } else {
      setReviews((data as Review[]) || []);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setUpdatingId(id);
    const { error } = await supabase
      .from("reviews")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update review");
    } else {
      toast.success(`Review ${status}`);
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    }
    setUpdatingId(null);
  };

  const forwardToCS = (review: Review) => {
    const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
    const subject = encodeURIComponent(
      `[Review Mediation] ${review.product_title} — ${stars} by ${review.reviewer_name}`
    );
    const body = encodeURIComponent(
      [
        `Product: ${review.product_title}`,
        `Rating: ${stars} (${review.rating}/5)`,
        `Reviewer: ${review.reviewer_name} (${review.reviewer_email})`,
        `Verified Purchase: ${review.verified_purchase ? "Yes" : "No"}`,
        `Date: ${new Date(review.created_at).toLocaleDateString()}`,
        `Status: ${review.status}`,
        "",
        review.title ? `Title: ${review.title}` : "",
        `Review:`,
        review.body,
        "",
        `— Forwarded from Admin Dashboard`,
      ]
        .filter(Boolean)
        .join("\n")
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    toast.success("Opening email client…");
  };

  const runBackfill = async () => {
    setBackfilling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("backfill-review-groups", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      const d = res.data;
      toast.success(`Backfilled ${d.updated} handles (${d.shopifyLookups} via Shopify, ${d.fallback} fallback, ${d.skipped} skipped)`);
    } catch (err: any) {
      toast.error(err.message || "Backfill failed");
    } finally {
      setBackfilling(false);
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    approved: "bg-green-500/20 text-green-400 border-green-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl uppercase tracking-wider text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Review Moderation
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-1">
            4-5 star reviews are auto-published. Lower ratings require approval.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={runBackfill}
            disabled={backfilling}
            className="gap-1.5 text-xs font-display uppercase tracking-wider"
          >
            {backfilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Backfill Groups
          </Button>
          <div className="flex gap-1">
          {(["pending", "approved", "rejected", "all"] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-display uppercase tracking-wider transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground font-body text-sm">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 border border-border/30 rounded-lg">
          <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-body text-sm">
            No {filter === "all" ? "" : filter} reviews found
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="border border-border/30 rounded-lg p-4 bg-card/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < review.rating
                              ? "fill-primary text-primary"
                              : "fill-muted text-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider font-display px-2 py-0.5 rounded-full border ${statusColors[review.status]}`}>
                      {review.status}
                    </span>
                    {review.verified_purchase && (
                      <span className="text-[10px] uppercase tracking-wider font-display text-green-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>

                  {/* Title & body */}
                  {review.title && (
                    <h4 className="text-sm font-display uppercase tracking-wider text-foreground mb-1">
                      {review.title}
                    </h4>
                  )}
                  <p className="text-sm text-foreground/80 font-body leading-relaxed">
                    {review.body}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-body">
                    <span>{review.reviewer_name}</span>
                    <span className="text-muted-foreground/50">·</span>
                    <span>{review.reviewer_email}</span>
                    <span className="text-muted-foreground/50">·</span>
                    <span>{review.product_title}</span>
                    <span className="text-muted-foreground/50">·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => forwardToCS(review)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/30 transition-colors"
                    title="Forward to CS team via email"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Forward
                  </button>
                  {review.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateStatus(review.id, "approved")}
                        disabled={updatingId === review.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display uppercase tracking-wider bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 transition-colors disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => updateStatus(review.id, "rejected")}
                        disabled={updatingId === review.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display uppercase tracking-wider bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </>
                  )}
                  {review.status === "rejected" && (
                    <button
                      onClick={() => updateStatus(review.id, "approved")}
                      disabled={updatingId === review.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/30 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  )}
                  {review.status === "approved" && (
                    <button
                      onClick={() => updateStatus(review.id, "rejected")}
                      disabled={updatingId === review.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/30 transition-colors disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
