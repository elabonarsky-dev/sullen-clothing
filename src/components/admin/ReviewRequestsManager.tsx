import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, CheckCircle2, Clock, Mail, ExternalLink, Star, RefreshCw } from "lucide-react";

interface ReviewRequestToken {
  id: string;
  token: string;
  order_id: string;
  order_name: string;
  email: string;
  customer_name: string;
  line_items: any[];
  status: string;
  created_at: string;
  sent_at: string | null;
  completed_at: string | null;
}

export function ReviewRequestsManager() {
  const [tokens, setTokens] = useState<ReviewRequestToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "sent" | "completed">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchTokens();
  }, [filter]);

  const fetchTokens = async () => {
    setLoading(true);
    let query = supabase
      .from("review_request_tokens")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;
    if (error) {
      toast.error("Failed to load review requests");
    } else {
      setTokens((data as unknown as ReviewRequestToken[]) || []);
    }
    setLoading(false);
  };

  const copyReviewLink = (token: string, id: string) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/write-review/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    toast.success("Review link copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const markAsSent = async (id: string) => {
    const { error } = await supabase
      .from("review_request_tokens")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success("Marked as sent");
      fetchTokens();
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    sent: "bg-blue-500/20 text-blue-400",
    completed: "bg-green-500/20 text-green-400",
    expired: "bg-muted text-muted-foreground",
  };

  const pendingCount = tokens.filter((t) => t.status === "pending").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl uppercase tracking-wider text-foreground">
            Review Requests
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Manage post-purchase review request links. Copy links to send manually or via your email tool.
          </p>
        </div>
        <button
          onClick={fetchTokens}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-display uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6">
        {(["all", "pending", "sent", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-display uppercase tracking-wider transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold leading-none">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground font-body text-sm">
          Loading review requests...
        </div>
      ) : tokens.length === 0 ? (
        <div className="text-center py-12 border border-border/30 rounded-lg">
          <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-body">
            {filter === "all"
              ? "No review requests yet. They're created automatically when orders are marked as delivered."
              : `No ${filter} review requests.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tokens.map((token) => (
            <div
              key={token.id}
              className="border border-border/30 rounded-lg p-4 bg-card/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display text-sm uppercase tracking-wider text-foreground">
                      {token.order_name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        statusColors[token.status] || statusColors.pending
                      }`}
                    >
                      {token.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-body">
                    <span>{token.email}</span>
                    {token.customer_name && (
                      <>
                        <span>·</span>
                        <span>{token.customer_name}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>{new Date(token.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Line items preview */}
                  {token.line_items && token.line_items.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {token.line_items.slice(0, 4).map((item: any, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-secondary rounded text-[10px] font-body text-secondary-foreground truncate max-w-[200px]"
                        >
                          {item.title}
                        </span>
                      ))}
                      {token.line_items.length > 4 && (
                        <span className="px-2 py-0.5 bg-secondary rounded text-[10px] font-body text-muted-foreground">
                          +{token.line_items.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => copyReviewLink(token.token, token.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display uppercase tracking-wider bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    {copiedId === token.id ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Link
                      </>
                    )}
                  </button>

                  {token.status === "pending" && (
                    <button
                      onClick={() => markAsSent(token.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display uppercase tracking-wider bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Mark Sent
                    </button>
                  )}

                  <a
                    href={`/write-review/${token.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    title="Preview review page"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Sent/Completed timestamps */}
              {(token.sent_at || token.completed_at) && (
                <div className="flex gap-4 mt-2 pt-2 border-t border-border/20">
                  {token.sent_at && (
                    <span className="text-[10px] text-muted-foreground font-body flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Sent {new Date(token.sent_at).toLocaleDateString()}
                    </span>
                  )}
                  {token.completed_at && (
                    <span className="text-[10px] text-muted-foreground font-body flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Reviewed {new Date(token.completed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
