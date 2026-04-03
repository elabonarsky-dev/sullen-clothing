import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, Check, X, Clock, ChevronDown, AlertTriangle, Shield, ShieldAlert, ExternalLink, Loader2, Zap, Tag, Download } from "lucide-react";

type ReturnStatus = "pending" | "approved" | "rejected" | "shipped" | "received" | "completed" | "cancelled";

interface ReturnRequest {
  id: string;
  order_name: string;
  order_email: string;
  status: string;
  reason: string | null;
  admin_notes: string | null;
  created_at: string;
  fraud_score: number;
  fraud_flags: string[];
  shopify_return_id: string | null;
  return_label_url: string | null;
}

interface ReturnItem {
  id: string;
  line_item_title: string;
  line_item_variant: string | null;
  line_item_image: string | null;
  line_item_price: number;
  quantity: number;
  resolution: string;
  exchange_product_handle: string | null;
  exchange_variant_title: string | null;
}

function FraudBadge({ score }: { score: number }) {
  if (score >= 50) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-display uppercase bg-red-500/20 text-red-400">
        <ShieldAlert className="w-3 h-3" />
        High Risk ({score})
      </span>
    );
  }
  if (score >= 30) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-display uppercase bg-yellow-500/20 text-yellow-400">
        <AlertTriangle className="w-3 h-3" />
        Medium Risk ({score})
      </span>
    );
  }
  if (score > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-display uppercase bg-blue-500/20 text-blue-400">
        <Shield className="w-3 h-3" />
        Low Risk ({score})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-display uppercase bg-green-500/20 text-green-400">
      <Shield className="w-3 h-3" />
      Clean
    </span>
  );
}

function FraudFlags({ flags }: { flags: string[] }) {
  if (!flags || flags.length === 0) return null;

  const flagLabels: Record<string, string> = {
    serial_returner: "🚩 Serial Returner",
    frequent_returner: "⚠️ Frequent Returner",
    repeat_returner: "📋 Repeat Returner",
    burst_pattern: "🔥 Burst Pattern",
    very_high_value: "💰 Very High Value",
    high_value: "💵 High Value",
    window_edge: "⏰ Window Edge",
    late_return: "🕐 Late Return",
    full_refund_all_items: "💸 Full Refund All Items",
    bulk_return: "📦 Bulk Return",
  };

  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {flags.map((flag, i) => {
        const [key, detail] = flag.split(":");
        const label = flagLabels[key] || key;
        return (
          <span
            key={i}
            className="inline-block px-2 py-0.5 rounded bg-muted text-[10px] font-body text-muted-foreground"
            title={detail || flag}
          >
            {label}{detail ? ` (${detail.replace(/_/g, " ")})` : ""}
          </span>
        );
      })}
    </div>
  );
}

export function ReturnsManager() {
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [items, setItems] = useState<Record<string, ReturnItem[]>>({});
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | "all">("pending");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmProcessId, setConfirmProcessId] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState<Record<string, string>>({});
  const [savingLabelId, setSavingLabelId] = useState<string | null>(null);
  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    let query = supabase
      .from("return_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter as ReturnStatus);
    }

    const { data, error } = await query;
    if (error) toast.error(error.message);
    else setRequests((data as ReturnRequest[]) || []);
    setLoading(false);
  };

  const fetchItems = async (requestId: string) => {
    if (items[requestId]) return;
    const { data, error } = await supabase
      .from("return_items")
      .select("*")
      .eq("return_request_id", requestId);
    if (error) toast.error(error.message);
    else setItems((prev) => ({ ...prev, [requestId]: (data as ReturnItem[]) || [] }));
  };

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      await fetchItems(id);
    }
  };

  const sendApprovalEmail = async (req: ReturnRequest, returnItems: ReturnItem[]) => {
    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "return-approved",
          recipientEmail: req.order_email,
          idempotencyKey: `return-approved-${req.id}`,
          templateData: {
            orderName: req.order_name,
            items: returnItems.map((i) => ({
              title: i.line_item_title,
              variant: i.line_item_variant,
              resolution: i.resolution,
            })),
            reason: req.reason,
          },
        },
      });
    } catch (e) {
      console.error("Failed to send return approval email", e);
    }
  };

  const updateStatus = async (id: string, status: ReturnStatus) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from("return_requests")
      .update({ status })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Return ${status}`);

      // Send approval email when approving
      if (status === "approved") {
        const req = requests.find((r) => r.id === id);
        if (req) {
          // Ensure items are loaded
          let returnItems = items[id];
          if (!returnItems) {
            const { data } = await supabase
              .from("return_items")
              .select("*")
              .eq("return_request_id", id);
            returnItems = (data as ReturnItem[]) || [];
          }
          sendApprovalEmail(req, returnItems);
          toast.success("Approval email sent to customer");
        }
      }

      setStatusFilter(status);
    }
    setUpdatingId(null);
  };

  const updateNotes = async (id: string, notes: string) => {
    const { error } = await supabase
      .from("return_requests")
      .update({ admin_notes: notes })
      .eq("id", id);
    if (error) toast.error(error.message);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    approved: "bg-green-500/20 text-green-400",
    rejected: "bg-red-500/20 text-red-400",
    shipped: "bg-blue-500/20 text-blue-400",
    received: "bg-purple-500/20 text-purple-400",
    completed: "bg-primary/20 text-primary",
    cancelled: "bg-muted text-muted-foreground",
  };

  const resolutionLabels: Record<string, string> = {
    exchange: "Exchange",
    store_credit: "Store Credit",
    refund: "Refund",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl uppercase tracking-wider text-foreground flex items-center gap-2">
            <Package className="w-5 h-5" />
            Returns & Exchanges
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Review and manage customer return requests
          </p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 flex-wrap">
        {["pending", "approved", "shipped", "received", "completed", "rejected", "all"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s as ReturnStatus | "all")}
            className={`px-3 py-1.5 rounded-sm text-xs font-display uppercase tracking-wider transition-colors ${
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground font-body text-sm">Loading...</p>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground font-body">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No {statusFilter === "all" ? "" : statusFilter} returns found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className={`bg-card border rounded-lg overflow-hidden ${
                req.fraud_score >= 50
                  ? "border-red-500/40"
                  : req.fraud_score >= 30
                  ? "border-yellow-500/40"
                  : "border-border"
              }`}
            >
              <button
                onClick={() => toggleExpand(req.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display text-sm uppercase tracking-wider text-foreground">
                        {req.order_name}
                      </p>
                      <FraudBadge score={req.fraud_score} />
                    </div>
                    <p className="text-xs text-muted-foreground font-body">{req.order_email}</p>
                    <p className="text-[10px] text-muted-foreground font-body mt-0.5">
                      {new Date(req.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-display uppercase ${statusColors[req.status] || "bg-muted text-muted-foreground"}`}>
                    {req.status}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedId === req.id ? "rotate-180" : ""}`} />
                </div>
              </button>

              {expandedId === req.id && (
                <div className="border-t border-border p-4 space-y-4">
                  {/* Fraud details */}
                  {req.fraud_score > 0 && (
                    <div className="bg-background rounded-lg p-3 border border-border">
                      <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-1.5">
                        Fraud Analysis
                      </p>
                      <FraudFlags flags={req.fraud_flags} />
                    </div>
                  )}

                  {/* Items */}
                  {items[req.id]?.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      {item.line_item_image && (
                        <img src={item.line_item_image} alt={item.line_item_title} className="w-10 h-10 object-cover rounded" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-body text-foreground truncate">{item.line_item_title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {item.line_item_variant && <span>{item.line_item_variant}</span>}
                          <span>·</span>
                          <span>Qty: {item.quantity}</span>
                          <span>·</span>
                          <span>${item.line_item_price}</span>
                          <span>·</span>
                          <span className="text-primary font-display uppercase text-[10px]">
                            {resolutionLabels[item.resolution] || item.resolution}
                          </span>
                          {item.exchange_variant_title && (
                            <>
                              <span>→</span>
                              <span>{item.exchange_variant_title}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Return label status */}
                  {req.return_label_url && (
                    <div className="flex items-center gap-2">
                      <a
                        href={req.return_label_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 text-green-400 rounded text-xs font-display uppercase tracking-wider hover:bg-green-600/30 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Return Label
                      </a>
                    </div>
                  )}
                  {["pending", "approved", "shipped"].includes(req.status) && !req.return_label_url && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-yellow-400 text-[10px] font-display uppercase tracking-wider">
                        <Tag className="w-3 h-3" />
                        No auto-label — add label URL manually
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={labelInput[req.id] || ""}
                          onChange={(e) => setLabelInput((prev) => ({ ...prev, [req.id]: e.target.value }))}
                          placeholder="Paste return label URL..."
                          className="flex-1 px-3 py-1.5 bg-background border border-border rounded-sm text-xs text-foreground font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          disabled={!labelInput[req.id]?.trim() || savingLabelId === req.id}
                          onClick={async () => {
                            setSavingLabelId(req.id);
                            const { error } = await supabase
                              .from("return_requests")
                              .update({ return_label_url: labelInput[req.id].trim() })
                              .eq("id", req.id);
                            if (error) toast.error(error.message);
                            else {
                              toast.success("Return label saved");
                              fetchRequests();
                            }
                            setSavingLabelId(null);
                          }}
                          className="px-3 py-1.5 bg-primary text-primary-foreground font-display text-[10px] uppercase tracking-wider rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          {savingLabelId === req.id ? "Saving..." : "Save Label"}
                        </button>
                      </div>
                    </div>
                  )}
                  {(req.status === "received" || req.status === "completed") && !req.return_label_url && (
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-display uppercase tracking-wider">
                      <Tag className="w-3 h-3" />
                      No return label was attached
                    </div>
                  )}
                  {/* Reason */}
                  {req.reason && (
                    <div>
                      <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-1">Reason</p>
                      <p className="text-sm font-body text-foreground">{req.reason}</p>
                    </div>
                  )}

                  {/* Admin notes */}
                  <div>
                    <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-1">Admin Notes</p>
                    <textarea
                      defaultValue={req.admin_notes || ""}
                      onBlur={(e) => updateNotes(req.id, e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-background border border-border rounded-sm text-sm text-foreground font-body focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                      placeholder="Add notes..."
                    />
                  </div>

                  {/* Actions */}
                  {req.status === "pending" && (
                    <div className="space-y-3">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => updateStatus(req.id, "approved")}
                          disabled={updatingId === req.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-display text-xs uppercase tracking-wider rounded-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve Only
                        </button>
                        {confirmProcessId !== req.id ? (
                          <button
                            onClick={() => setConfirmProcessId(req.id)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-muted-foreground font-display text-xs uppercase tracking-wider rounded-sm hover:bg-secondary/80 transition-colors"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            Approve & Process
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-sm">
                            <span className="text-[10px] font-display uppercase tracking-wider text-yellow-400">
                              This will immediately issue refunds/credits. Confirm?
                            </span>
                            <button
                              onClick={async () => {
                                setConfirmProcessId(null);
                                setProcessingId(req.id);
                                try {
                                  const { data, error } = await supabase.functions.invoke("process-approved-return", {
                                    body: { return_request_id: req.id },
                                  });
                                  if (error) {
                                    toast.error(error.message || "Failed to process return");
                                  } else if (data?.error) {
                                    toast.error(data.error);
                                  } else {
                                    toast.success(data.message || "Return approved & processed!");
                                    setStatusFilter("completed");
                                  }
                                } catch (e: any) {
                                  toast.error(e.message || "Failed to process return");
                                } finally {
                                  setProcessingId(null);
                                }
                              }}
                              disabled={processingId === req.id}
                              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white font-display text-[10px] uppercase tracking-wider rounded-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              {processingId === req.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              Yes, Process
                            </button>
                            <button
                              onClick={() => setConfirmProcessId(null)}
                              className="px-2 py-1 text-muted-foreground font-display text-[10px] uppercase tracking-wider hover:text-foreground transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => updateStatus(req.id, "rejected")}
                          disabled={updatingId === req.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-destructive text-destructive-foreground font-display text-xs uppercase tracking-wider rounded-sm hover:bg-destructive/90 transition-colors disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                  {req.status === "approved" && (
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={async () => {
                          setProcessingId(req.id);
                          try {
                            const { data: sessionData } = await supabase.auth.getSession();
                            const token = sessionData?.session?.access_token;
                            if (!token) {
                              toast.error("You must be logged in");
                              return;
                            }
                            const { data, error } = await supabase.functions.invoke("process-approved-return", {
                              body: { return_request_id: req.id },
                            });
                            if (error) {
                              toast.error(error.message || "Failed to process return");
                            } else if (data?.error) {
                              toast.error(data.error);
                            } else {
                              toast.success(data.message || "Return processed successfully");
                              setStatusFilter("completed");
                            }
                          } catch (e: any) {
                            toast.error(e.message || "Failed to process return");
                          } finally {
                            setProcessingId(null);
                          }
                        }}
                        disabled={processingId === req.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white font-display text-xs uppercase tracking-wider rounded-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {processingId === req.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Zap className="w-3.5 h-3.5" />
                        )}
                        {processingId === req.id ? "Processing..." : "Process Return"}
                      </button>
                      <a
                        href={`https://admin.shopify.com/store/sullenclothing/orders?query=${encodeURIComponent(req.order_name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-muted-foreground font-display text-xs uppercase tracking-wider rounded-sm hover:bg-secondary/80 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View in Shopify
                      </a>
                    </div>
                  )}
                  {req.status === "shipped" && (
                    <button
                      onClick={() => updateStatus(req.id, "received")}
                      disabled={updatingId === req.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-display text-xs uppercase tracking-wider rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      Mark as Received
                    </button>
                  )}
                  {req.status === "received" && (
                    <button
                      onClick={() => updateStatus(req.id, "completed")}
                      disabled={updatingId === req.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-display text-xs uppercase tracking-wider rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      Complete Return
                    </button>
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
