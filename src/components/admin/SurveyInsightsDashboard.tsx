import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ClipboardList, Users, TrendingUp, AlertTriangle, Download, Instagram, MessageSquare, Send, Mail } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#6366f1",
  "#f59e0b",
  "#10b981",
];

interface SurveyRow {
  id: string;
  answers: Record<string, string | string[]>;
  created_at: string;
  user_id: string;
  admin_notes: string | null;
}

function aggregateField(surveys: SurveyRow[], field: string): { name: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const s of surveys) {
    const val = s.answers[field];
    if (!val) continue;
    const items = Array.isArray(val) ? val : [val];
    for (const item of items) {
      counts[item] = (counts[item] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="bg-card border border-border/20 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-primary" />
        <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-display text-foreground">{value}</p>
    </div>
  );
}

function BarSection({ title, data }: { title: string; data: { name: string; count: number }[] }) {
  if (!data.length) return null;
  return (
    <div className="bg-card border border-border/20 rounded-lg p-5">
      <h3 className="text-xs font-display uppercase tracking-wider text-foreground mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={data.length * 36 + 20}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
            cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
          />
          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PieSection({ title, data }: { title: string; data: { name: string; count: number }[] }) {
  if (!data.length) return null;
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="bg-card border border-border/20 rounded-lg p-5">
      <h3 className="text-xs font-display uppercase tracking-wider text-foreground mb-4">{title}</h3>
      <div className="flex items-center gap-6">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} strokeWidth={0}>
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-1.5">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2 text-xs font-body">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="text-foreground flex-1 truncate">{d.name}</span>
              <span className="text-muted-foreground">{Math.round((d.count / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SurveyInsightsDashboard() {
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showResponses, setShowResponses] = useState(false);
  const [emailingTo, setEmailingTo] = useState<string | null>(null);
  const [emailBody, setEmailBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const { data: surveys, isLoading } = useQuery({
    queryKey: ["admin-surveys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_surveys" as any)
        .select("id, answers, created_at, user_id, admin_notes")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as SurveyRow[];
    },
  });

  const saveNote = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("customer_surveys" as any)
        .update({ admin_notes: notes } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-surveys"] });
      setReplyingTo(null);
      setReplyText("");
      toast.success("Note saved");
    },
    onError: () => toast.error("Failed to save note"),
  });

  const sendFollowupEmail = async (userId: string, surveyId: string) => {
    if (!emailBody.trim()) return;
    setSendingEmail(true);
    try {
      // Look up customer email from vault_members
      const { data: member } = await supabase
        .from("vault_members")
        .select("email")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (!member?.email) {
        toast.error("No email found for this customer");
        setSendingEmail(false);
        return;
      }

      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "survey-followup",
          recipientEmail: member.email,
          idempotencyKey: `survey-followup-${surveyId}-${Date.now()}`,
          templateData: { message: emailBody },
        },
      });

      if (error) throw error;
      toast.success(`Follow-up email sent to ${member.email}`);
      setEmailingTo(null);
      setEmailBody("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const rows = surveys || [];
  const totalResponses = rows.length;

  // Aggregate all fields
  const frequency = aggregateField(rows, "shopping_frequency");
  const discovery = aggregateField(rows, "discovery");
  const products = aggregateField(rows, "product_interests");
  const style = aggregateField(rows, "style_preference");
  const favTee = aggregateField(rows, "fav_tee");
  const painPoints = aggregateField(rows, "pain_points");
  const content = aggregateField(rows, "content_interest");
  const tattooStyles = aggregateField(rows, "tattoo_styles");
  const earlyDesigns = aggregateField(rows, "early_designs");
  const influencer = aggregateField(rows, "influencer_interest");

  // Influencer prospects: people who said yes/maybe with social handles
  const influencerProspects = rows
    .filter((r) => {
      const interest = r.answers.influencer_interest;
      return interest === "Absolutely — let's do this!" || interest === "Maybe — tell me more";
    })
    .map((r) => ({
      userId: r.user_id,
      handle: (r.answers.social_handle as string) || "",
      interest: r.answers.influencer_interest as string,
      date: r.created_at.slice(0, 10),
    }));

  // Free-text responses
  const improvements = rows
    .map((r) => r.answers.improvement)
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0);

  // Timeline: surveys per day (last 30 days)
  const dayCounts: Record<string, number> = {};
  for (const r of rows) {
    const day = r.created_at.slice(0, 10);
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  }
  const timeline = Object.entries(dayCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([name, count]) => ({ name: name.slice(5), count }));

  const exportCsv = () => {
    if (!rows.length) return;
    const fields = ["shopping_frequency", "discovery", "product_interests", "style_preference", "fav_tee", "tattoo_styles", "early_designs", "influencer_interest", "social_handle", "pain_points", "content_interest", "improvement"];
    const header = ["date", ...fields].join(",");
    const csvRows = rows.map((r) => {
      const date = r.created_at.slice(0, 10);
      const vals = fields.map((f) => {
        const v = r.answers[f];
        if (!v) return "";
        const str = Array.isArray(v) ? v.join("; ") : v;
        return `"${str.replace(/"/g, '""')}"`;
      });
      return [date, ...vals].join(",");
    });
    const csv = [header, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `survey-responses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl uppercase tracking-wider text-foreground">Customer Survey Insights</h2>
          <p className="text-sm text-muted-foreground font-body mt-1">Aggregated responses from customer profile surveys</p>
        </div>
        {totalResponses > 0 && (
          <Button variant="outline" size="sm" onClick={exportCsv} className="font-display text-xs uppercase tracking-wider">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Responses" value={totalResponses} icon={ClipboardList} />
        <StatCard label="Top Interest" value={products[0]?.name || "—"} icon={TrendingUp} />
        <StatCard label="Top Style" value={style[0]?.name || "—"} icon={Users} />
        <StatCard label="#1 Pain Point" value={painPoints[0]?.name || "—"} icon={AlertTriangle} />
      </div>

      {totalResponses === 0 ? (
        <div className="text-center py-16 bg-card border border-border/20 rounded-lg">
          <ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-body text-muted-foreground">No survey responses yet</p>
          <p className="text-xs font-body text-muted-foreground/60 mt-1">Customers earn 75 Skull Points for completing the survey on their profile page</p>
        </div>
      ) : (
        <>
          {/* Timeline */}
          {timeline.length > 1 && (
            <div className="bg-card border border-border/20 rounded-lg p-5">
              <h3 className="text-xs font-display uppercase tracking-wider text-foreground mb-4">Responses Over Time</h3>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={timeline}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Charts grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <PieSection title="Shopping Frequency" data={frequency} />
            <PieSection title="How They Found Us" data={discovery} />
            <BarSection title="Product Interests" data={products} />
            <BarSection title="Content Interests" data={content} />
            <PieSection title="Style Preferences" data={style} />
            <PieSection title="Favorite Tee" data={favTee} />
            <BarSection title="Tattoo Styles" data={tattooStyles} />
            <PieSection title="Early Design Interest" data={earlyDesigns} />
            <PieSection title="Influencer Interest" data={influencer} />
          </div>

          {/* Influencer Prospects Table */}
          {influencerProspects.length > 0 && (
            <div className="bg-card border border-border/20 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Instagram className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-display uppercase tracking-wider text-foreground">
                  Influencer Prospects ({influencerProspects.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-body">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground py-2 pr-4">Social Handle</th>
                      <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground py-2 pr-4">Interest Level</th>
                      <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground py-2 pr-4">User ID</th>
                      <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {influencerProspects.map((p, i) => (
                      <tr key={i} className="border-b border-border/10 last:border-0">
                        <td className="py-2.5 pr-4 text-foreground font-medium">
                          {p.handle || <span className="text-muted-foreground/50 italic">Not provided</span>}
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-display ${
                            p.interest.includes("Absolutely")
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {p.interest.includes("Absolutely") ? "Yes" : "Maybe"}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground text-xs font-mono truncate max-w-[120px]">{p.userId.slice(0, 8)}…</td>
                        <td className="py-2.5 text-muted-foreground">{p.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pain Points — highlighted */}
          <BarSection title="⚠️ Pain Points & Frustrations" data={painPoints} />

          {/* Free-text improvements */}
          {improvements.length > 0 && (
            <div className="bg-card border border-border/20 rounded-lg p-5">
              <h3 className="text-xs font-display uppercase tracking-wider text-foreground mb-4">
                💬 Customer Suggestions ({improvements.length})
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {improvements.map((text, i) => (
                  <div key={i} className="bg-secondary/30 rounded-lg px-4 py-3 text-sm font-body text-foreground">
                    "{text}"
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual Responses with Admin Notes */}
          <div className="bg-card border border-border/20 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-display uppercase tracking-wider text-foreground">
                  Individual Responses ({rows.length})
                </h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResponses(!showResponses)}
                className="font-display text-[10px] uppercase tracking-wider"
              >
                {showResponses ? "Hide" : "Show"} All
              </Button>
            </div>
            {showResponses && (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {rows.map((row) => {
                  const improvement = typeof row.answers.improvement === "string" ? row.answers.improvement : null;
                  const isReplying = replyingTo === row.id;
                  return (
                    <div key={row.id} className="border border-border/20 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">
                          {row.created_at.slice(0, 10)} · {row.user_id.slice(0, 8)}…
                        </span>
                        <span className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">
                          {row.answers.shopping_frequency || "—"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-body">
                        {row.answers.discovery && <p><span className="text-muted-foreground">Found via:</span> {Array.isArray(row.answers.discovery) ? row.answers.discovery.join(", ") : row.answers.discovery}</p>}
                        {row.answers.fav_tee && <p><span className="text-muted-foreground">Fav tee:</span> {row.answers.fav_tee}</p>}
                        {row.answers.style_preference && <p><span className="text-muted-foreground">Style:</span> {row.answers.style_preference}</p>}
                        {row.answers.influencer_interest && <p><span className="text-muted-foreground">Influencer:</span> {row.answers.influencer_interest}</p>}
                      </div>
                      {improvement && (
                        <div className="bg-secondary/30 rounded px-3 py-2 text-sm font-body text-foreground">
                          "{improvement}"
                        </div>
                      )}
                      {/* Admin notes */}
                      {row.admin_notes && !isReplying && (
                        <div className="bg-primary/5 border border-primary/10 rounded px-3 py-2 text-sm font-body text-foreground">
                          <span className="text-[10px] font-display uppercase tracking-wider text-primary block mb-1">Admin Note</span>
                          {row.admin_notes}
                        </div>
                      )}
                      {isReplying ? (
                        <div className="space-y-2">
                          <Textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Add a note about this response..."
                            className="text-sm min-h-[60px]"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => saveNote.mutate({ id: row.id, notes: replyText })}
                              disabled={!replyText.trim() || saveNote.isPending}
                              className="font-display text-[10px] uppercase tracking-wider"
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Save Note
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setReplyingTo(null); setReplyText(""); }}
                              className="font-display text-[10px] uppercase tracking-wider"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : emailingTo === row.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            placeholder="Write your message to the customer..."
                            className="text-sm min-h-[80px]"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => sendFollowupEmail(row.user_id, row.id)}
                              disabled={!emailBody.trim() || sendingEmail}
                              className="font-display text-[10px] uppercase tracking-wider"
                            >
                              {sendingEmail ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Mail className="w-3 h-3 mr-1" />}
                              Send Email
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setEmailingTo(null); setEmailBody(""); }}
                              className="font-display text-[10px] uppercase tracking-wider"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setReplyingTo(row.id); setReplyText(row.admin_notes || ""); }}
                            className="font-display text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            {row.admin_notes ? "Edit Note" : "Add Note"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEmailingTo(row.id)}
                            className="font-display text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                          >
                            <Mail className="w-3 h-3 mr-1" />
                            Email Customer
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
