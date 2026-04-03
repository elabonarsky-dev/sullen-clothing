import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, TrendingUp, CheckCircle2, Eye, RefreshCw, MessageSquare, Package, Headphones, Bell, Save, Mail, ExternalLink, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

type IssuePattern = {
  id: string;
  category: string;
  title: string;
  description: string | null;
  occurrence_count: number;
  first_seen_at: string;
  last_seen_at: string;
  status: string;
  resolution_notes: string | null;
};

type IssueLog = {
  id: string;
  source: string;
  category: string | null;
  summary: string;
  customer_message: string | null;
  created_at: string;
  session_id: string | null;
  customer_email: string | null;
  order_number: string | null;
};

const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  shipping_delay: { label: "Shipping Delays", icon: "📦", color: "text-amber-400" },
  order_issue: { label: "Order Problems", icon: "🚨", color: "text-red-400" },
  sizing_fit: { label: "Sizing & Fit", icon: "📏", color: "text-blue-400" },
  return_exchange: { label: "Returns", icon: "↩️", color: "text-orange-400" },
  product_defect: { label: "Defects", icon: "🔧", color: "text-red-500" },
  payment_billing: { label: "Payment", icon: "💳", color: "text-green-400" },
  tracking_issue: { label: "Tracking", icon: "🔍", color: "text-purple-400" },
  website_bug: { label: "Website", icon: "🐛", color: "text-yellow-400" },
  product_availability: { label: "Availability", icon: "🏷️", color: "text-teal-400" },
  discount_promo: { label: "Discounts", icon: "💰", color: "text-emerald-400" },
  account_issue: { label: "Account", icon: "👤", color: "text-indigo-400" },
  general_inquiry: { label: "General", icon: "💬", color: "text-muted-foreground" },
};

const SOURCE_ICONS: Record<string, typeof MessageSquare> = {
  concierge: MessageSquare,
  return: Package,
  support: Headphones,
};

const EMAIL_TEMPLATES: Record<string, { subject: string; body: string }> = {
  shipping_delay: {
    subject: "Update on Your Sullen Order",
    body: `Hey there,\n\nWe noticed your order may be experiencing a shipping delay, and we wanted to reach out personally to let you know we're on it.\n\nWe're looking into the status of your shipment right now. If there's anything specific you need, just reply to this email and we'll get back to you ASAP.\n\nThanks for your patience — we appreciate you rocking Sullen.\n\n– The Sullen Team`,
  },
  order_issue: {
    subject: "We're Fixing Your Order Issue",
    body: `Hey there,\n\nWe see there was a problem with your order and we want to make it right. Our team is reviewing the details now.\n\nCould you reply with your order number and a quick description of the issue? We'll prioritize getting this sorted for you.\n\nSorry for the trouble — we've got your back.\n\n– The Sullen Team`,
  },
  sizing_fit: {
    subject: "Need Help With Sizing? We've Got You",
    body: `Hey there,\n\nWe noticed you had a question about sizing or fit. We want to make sure you get the perfect fit!\n\nCheck out our size chart at sullenclothing.com/pages/size-chart, or reply here with what you ordered and we can help you figure out the best size.\n\nIf you need to exchange for a different size, we'll make it easy.\n\n– The Sullen Team`,
  },
  return_exchange: {
    subject: "Your Return/Exchange Request",
    body: `Hey there,\n\nWe got your return request and wanted to follow up personally. We'll process this as quickly as possible.\n\nIf you have any questions about the return process, check our returns portal at sullenclothing.com/returns or just reply here.\n\nWe appreciate your support!\n\n– The Sullen Team`,
  },
  product_defect: {
    subject: "We're Sorry About Your Product Issue",
    body: `Hey there,\n\nWe're really sorry to hear about a quality issue with your Sullen product. That's not the standard we hold ourselves to.\n\nCould you reply with a photo of the issue and your order number? We'll get a replacement or refund sorted right away — no hassle.\n\nThanks for letting us know.\n\n– The Sullen Team`,
  },
  tracking_issue: {
    subject: "Tracking Update for Your Sullen Order",
    body: `Hey there,\n\nWe noticed you may be having trouble tracking your order. Let us help!\n\nYou can track your shipment anytime at sullenclothing.com/track. If the tracking info looks off, reply here with your order number and we'll dig into it for you.\n\n– The Sullen Team`,
  },
  payment_billing: {
    subject: "Regarding Your Payment",
    body: `Hey there,\n\nWe noticed there may have been a billing or payment issue with your order. We want to make sure everything is squared away.\n\nCould you reply with your order number so we can look into this? We'll get it resolved quickly.\n\n– The Sullen Team`,
  },
};

function getContactUrl(log: IssueLog, category: string): string | null {
  const email = log.customer_email;
  if (!email) return null;

  const template = EMAIL_TEMPLATES[category] || {
    subject: "Following Up on Your Sullen Experience",
    body: `Hey there,\n\nWe noticed you reached out and wanted to follow up personally. We're here to help!\n\nReply to this email and let us know how we can assist you.\n\n– The Sullen Team`,
  };

  const orderRef = log.order_number ? `\n\nRe: Order ${log.order_number}` : "";
  const body = template.body + orderRef;

  return `mailto:${email}?subject=${encodeURIComponent(template.subject)}&body=${encodeURIComponent(body)}`;
}

export function IssuesDashboard() {
  const [patterns, setPatterns] = useState<IssuePattern[]>([]);
  const [recentLogs, setRecentLogs] = useState<IssueLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [patternLogs, setPatternLogs] = useState<IssueLog[]>([]);
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [alertEmail, setAlertEmail] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  const getTimeFilter = () => {
    const now = new Date();
    if (timeRange === "24h") return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    if (timeRange === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  };

  const fetchData = async () => {
    setLoading(true);
    const since = getTimeFilter();

    const [patternsRes, logsRes, webhookRes, emailRes] = await Promise.all([
      supabase
        .from("issue_patterns")
        .select("*")
        .gte("last_seen_at", since)
        .order("occurrence_count", { ascending: false }),
      supabase
        .from("issue_logs")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("site_settings").select("value").eq("key", "issue_alert_webhook_url").maybeSingle(),
      supabase.from("site_settings").select("value").eq("key", "issue_alert_email").maybeSingle(),
    ]);

    if (patternsRes.data) setPatterns(patternsRes.data as IssuePattern[]);
    if (logsRes.data) setRecentLogs(logsRes.data as IssueLog[]);
    if (webhookRes.data?.value) setWebhookUrl(webhookRes.data.value);
    if (emailRes.data?.value) setAlertEmail(emailRes.data.value);
    setLoading(false);
  };

  const saveAlertSettings = async () => {
    setSavingSettings(true);
    const upsert = async (key: string, value: string) => {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", key)
        .maybeSingle();
      if (existing) {
        await supabase.from("site_settings").update({ value }).eq("id", existing.id);
      } else {
        await supabase.from("site_settings").insert({ key, value });
      }
    };
    await Promise.all([
      upsert("issue_alert_webhook_url", webhookUrl),
      upsert("issue_alert_email", alertEmail),
    ]);
    toast.success("Alert settings saved!");
    setSavingSettings(false);
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const viewPatternLogs = async (category: string) => {
    if (selectedPattern === category) {
      setSelectedPattern(null);
      return;
    }
    setSelectedPattern(category);
    const since = getTimeFilter();
    const { data } = await supabase
      .from("issue_logs")
      .select("*")
      .eq("category", category)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20);
    setPatternLogs((data || []) as IssueLog[]);
  };

  const updatePatternStatus = async (id: string, status: string) => {
    setUpdatingStatus(id);
    const { error } = await supabase
      .from("issue_patterns")
      .update({ status })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Pattern marked as ${status}`);
      fetchData();
    }
    setUpdatingStatus(null);
  };

  const deletePattern = async (id: string, category: string) => {
    if (!confirm("Delete this resolved pattern and its related logs?")) return;
    setUpdatingStatus(id);
    // Delete related logs first, then the pattern
    await supabase.from("issue_logs").delete().eq("category", category);
    const { error } = await supabase.from("issue_patterns").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Pattern and related logs removed");
      fetchData();
    }
    setUpdatingStatus(null);
  };

  const clearAllResolved = async () => {
    const resolved = patterns.filter((p) => p.status === "resolved");
    if (resolved.length === 0) { toast.info("No resolved patterns to clear"); return; }
    if (!confirm(`Remove ${resolved.length} resolved pattern(s) and their logs?`)) return;
    setLoading(true);
    for (const p of resolved) {
      await supabase.from("issue_logs").delete().eq("category", p.category);
      await supabase.from("issue_patterns").delete().eq("id", p.id);
    }
    toast.success(`Cleared ${resolved.length} resolved pattern(s)`);
    fetchData();
  };

  const totalIssues = recentLogs.length;
  const topCategory = patterns[0];
  const activePatterns = patterns.filter((p) => p.status === "active");
  const identifiedCustomers = recentLogs.filter((l) => l.customer_email || l.order_number).length;

  const sourceBreakdown = recentLogs.reduce<Record<string, number>>((acc, log) => {
    acc[log.source] = (acc[log.source] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl uppercase tracking-wider text-foreground">
            Recurring Issues
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-1">
            AI-classified patterns from concierge chats, returns, and support
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["24h", "7d", "30d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-display uppercase tracking-wider transition-colors ${
                  timeRange === range
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-display uppercase tracking-wider mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Total Issues ({timeRange})
          </div>
          <p className="text-2xl font-display text-foreground">{totalIssues}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-display uppercase tracking-wider mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Active Patterns
          </div>
          <p className="text-2xl font-display text-foreground">{activePatterns.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-display uppercase tracking-wider mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            Top Issue
          </div>
          <p className="text-sm font-body text-foreground">
            {topCategory ? `${CATEGORY_LABELS[topCategory.category]?.icon || "❓"} ${topCategory.title}` : "None yet"}
          </p>
          {topCategory && (
            <p className="text-xs text-muted-foreground mt-0.5">{topCategory.occurrence_count} occurrences</p>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-display uppercase tracking-wider mb-2">
            <Mail className="w-3.5 h-3.5" />
            Identified Customers
          </div>
          <p className="text-2xl font-display text-foreground">{identifiedCustomers}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">with email or order #</p>
        </div>
      </div>

      {/* Patterns Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-display text-sm uppercase tracking-wider text-foreground">
            Issue Patterns
          </h3>
          {patterns.some((p) => p.status === "resolved") && (
            <button
              onClick={clearAllResolved}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display uppercase tracking-wider text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Resolved
            </button>
          )}
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : patterns.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No patterns detected yet. Issues will appear here as customers interact with the concierge, returns portal, and support.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {patterns.map((pattern) => {
              const catInfo = CATEGORY_LABELS[pattern.category] || { label: pattern.category, icon: "❓", color: "text-muted-foreground" };
              const isExpanded = selectedPattern === pattern.category;

              return (
                <div key={pattern.id}>
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors">
                    <span className="text-lg">{catInfo.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display uppercase tracking-wider text-foreground">
                        {pattern.title}
                      </p>
                      {pattern.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{pattern.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className={`text-lg font-display ${pattern.occurrence_count > 10 ? "text-destructive" : "text-foreground"}`}>
                          {pattern.occurrence_count}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">occurrences</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-display uppercase tracking-wider ${
                          pattern.status === "active"
                            ? "bg-destructive/20 text-destructive"
                            : pattern.status === "monitoring"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {pattern.status}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => viewPatternLogs(pattern.category)}
                          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          title="View related issues"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {pattern.status === "active" && (
                          <button
                            onClick={() => updatePatternStatus(pattern.id, "resolved")}
                            disabled={updatingStatus === pattern.id}
                            className="p-1.5 rounded text-muted-foreground hover:text-green-400 hover:bg-secondary transition-colors"
                            title="Mark resolved"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {pattern.status === "resolved" && (
                          <>
                            <button
                              onClick={() => updatePatternStatus(pattern.id, "active")}
                              disabled={updatingStatus === pattern.id}
                              className="p-1.5 rounded text-muted-foreground hover:text-amber-400 hover:bg-secondary transition-colors"
                              title="Reopen"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deletePattern(pattern.id, pattern.category)}
                              disabled={updatingStatus === pattern.id}
                              className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors"
                              title="Delete pattern & logs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="bg-secondary/20 border-t border-border px-4 py-3 space-y-2">
                      <p className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-2">
                        Recent messages in this category
                      </p>
                      {patternLogs.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No logs found.</p>
                      ) : (
                        patternLogs.map((log) => {
                          const contactUrl = getContactUrl(log, pattern.category);
                          return (
                            <div key={log.id} className="flex items-start gap-3 text-xs py-1">
                              <span className="text-muted-foreground shrink-0 w-16 mt-0.5">
                                {new Date(log.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground shrink-0 uppercase text-[10px]">
                                {log.source}
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className="text-foreground truncate block">{log.summary}</span>
                                {(log.order_number || log.customer_email) && (
                                  <div className="flex items-center gap-2 mt-1">
                                    {log.order_number && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-display uppercase">
                                        <Package className="w-2.5 h-2.5" />
                                        {log.order_number}
                                      </span>
                                    )}
                                    {log.customer_email && (
                                      <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                                        {log.customer_email}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              {contactUrl && (
                                <a
                                  href={contactUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[10px] font-display uppercase tracking-wider"
                                  title={`Email ${log.customer_email} with ${CATEGORY_LABELS[pattern.category]?.label || "support"} template`}
                                >
                                  <Mail className="w-3 h-3" />
                                  Contact
                                </a>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Issues Feed */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-display text-sm uppercase tracking-wider text-foreground">
            Recent Issue Log
          </h3>
        </div>
        {recentLogs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No issues logged yet.
          </div>
        ) : (
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {recentLogs.map((log) => {
              const catInfo = CATEGORY_LABELS[log.category || "general_inquiry"] || { label: "Unknown", icon: "❓", color: "text-muted-foreground" };
              const Icon = SOURCE_ICONS[log.source] || MessageSquare;
              const contactUrl = getContactUrl(log, log.category || "general_inquiry");
              return (
                <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                  <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{catInfo.icon}</span>
                      <span className="text-xs font-display uppercase tracking-wider text-foreground">
                        {catInfo.label}
                      </span>
                      {log.order_number && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-display uppercase">
                          <Package className="w-2.5 h-2.5" />
                          {log.order_number}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(log.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {log.summary}
                    </p>
                    {log.customer_email && (
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">
                        {log.customer_email}
                      </p>
                    )}
                  </div>
                  {contactUrl && (
                    <a
                      href={contactUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[10px] font-display uppercase tracking-wider mt-0.5"
                      title="Contact customer with email template"
                    >
                      <Mail className="w-3 h-3" />
                      Contact
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Alert Settings */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-display text-sm uppercase tracking-wider text-foreground">
            Alert Notifications
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-xs text-muted-foreground font-body">
            Get notified when an issue pattern exceeds thresholds (20, 50, 100, 200, 500 occurrences). Configure a webhook URL (e.g. Slack, Discord) and/or email.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-display uppercase tracking-wider text-muted-foreground">
                Webhook URL
              </label>
              <Input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="bg-secondary/30 border-border text-sm"
              />
              <p className="text-[10px] text-muted-foreground">Slack, Discord, or any webhook endpoint</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-display uppercase tracking-wider text-muted-foreground">
                Alert Email
              </label>
              <Input
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                placeholder="team@sullenclothing.com"
                className="bg-secondary/30 border-border text-sm"
              />
              <p className="text-[10px] text-muted-foreground">Receives alert when thresholds are crossed</p>
            </div>
          </div>
          <button
            onClick={saveAlertSettings}
            disabled={savingSettings}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-display uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {savingSettings ? "Saving..." : "Save Alert Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
