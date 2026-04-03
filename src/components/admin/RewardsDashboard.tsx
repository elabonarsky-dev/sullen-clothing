import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Skull, TrendingUp, Users, ArrowDownCircle, ArrowUpCircle, Search, Plus,
  Loader2, DollarSign, Gift, Award, Ticket, CreditCard, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays, subMonths, subYears, startOfDay } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

/* ─── Types ─── */
interface Transaction {
  id: string; user_id: string; points: number; type: string;
  description: string | null; reference_id: string | null;
  created_at: string; source: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  signup_bonus: "Signup Bonus", purchase: "Purchase", review: "Review",
  referral: "Referral", social_follow: "Social Follow", birthday: "Birthday",
  birthday_multiplier: "Birthday 3×", collect_the_set: "Collect The Set",
  redemption: "Redemption", admin_adjustment: "Admin Adjust",
  okendo_import: "Okendo Import", survey: "Survey",
};

const RANGE_OPTIONS = [
  { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days", days: 90 },
  { label: "Past Year", days: 365 },
  { label: "All Time", days: 0 },
] as const;

const TIER_COLORS: Record<string, string> = {
  apprentice: "#6b7280", collector: "#3b82f6", mentor: "#d4940a", master: "#ef4444",
};

/* ─── Helpers ─── */
function rangeStart(days: number): string {
  if (days === 0) return "2020-01-01";
  return startOfDay(subDays(new Date(), days)).toISOString();
}

function groupByWeek(rows: { date: string; value: number }[]): { week: string; value: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const d = new Date(r.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = format(weekStart, "MMM d");
    map.set(key, (map.get(key) || 0) + r.value);
  }
  return Array.from(map, ([week, value]) => ({ week, value }));
}

/* ─── Component ─── */
export function RewardsDashboard() {
  const [activeTab, setActiveTab] = useState("revenue");
  const [rangeDays, setRangeDays] = useState(90);

  /* ── Adjustment & lookup state ── */
  const [adjustEmail, setAdjustEmail] = useState("");
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<{
    email: string; balance: number; tier: string; lifetime_spend: number; transactions: Transaction[];
  } | null>(null);

  const start = rangeStart(rangeDays);

  /* ── Data queries ── */
  const ordersQuery = useQuery({
    queryKey: ["loyalty-orders", start],
    queryFn: async () => {
      // Get all vault member emails
      const { data: members } = await supabase.from("vault_members").select("email, user_id, current_tier, lifetime_spend, created_at, points_last_active");
      const memberEmails = new Set((members || []).map(m => m.email?.toLowerCase()).filter(Boolean));

      // Get orders in range
      const { data: orders } = await supabase
        .from("order_history")
        .select("email, total_price, order_date")
        .gte("order_date", start)
        .order("order_date", { ascending: true });

      // Split enrolled vs non-enrolled
      let enrolledRevenue = 0, nonEnrolledRevenue = 0;
      let enrolledOrders = 0, nonEnrolledOrders = 0;
      const weeklyRevenue: { date: string; enrolled: number; nonEnrolled: number }[] = [];
      const weekMap = new Map<string, { enrolled: number; nonEnrolled: number }>();

      for (const o of orders || []) {
        const isEnrolled = memberEmails.has(o.email?.toLowerCase());
        const d = new Date(o.order_date);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const key = format(weekStart, "MMM d");
        const existing = weekMap.get(key) || { enrolled: 0, nonEnrolled: 0 };
        if (isEnrolled) {
          enrolledRevenue += Number(o.total_price);
          enrolledOrders++;
          existing.enrolled += Number(o.total_price);
        } else {
          nonEnrolledRevenue += Number(o.total_price);
          nonEnrolledOrders++;
          existing.nonEnrolled += Number(o.total_price);
        }
        weekMap.set(key, existing);
      }

      const chartData = Array.from(weekMap, ([week, vals]) => ({ week, ...vals }));

      // AOV by week for comparison chart
      const aovWeekMap = new Map<string, { eRev: number; eOrd: number; nRev: number; nOrd: number }>();
      for (const o of orders || []) {
        const isEnrolled = memberEmails.has(o.email?.toLowerCase());
        const d = new Date(o.order_date);
        const ws = new Date(d); ws.setDate(d.getDate() - d.getDay());
        const key = format(ws, "MMM d");
        const ex = aovWeekMap.get(key) || { eRev: 0, eOrd: 0, nRev: 0, nOrd: 0 };
        if (isEnrolled) { ex.eRev += Number(o.total_price); ex.eOrd++; }
        else { ex.nRev += Number(o.total_price); ex.nOrd++; }
        aovWeekMap.set(key, ex);
      }
      const aovChartData = Array.from(aovWeekMap, ([week, v]) => ({
        week,
        enrolledAOV: v.eOrd > 0 ? Math.round(v.eRev / v.eOrd * 100) / 100 : 0,
        nonEnrolledAOV: v.nOrd > 0 ? Math.round(v.nRev / v.nOrd * 100) / 100 : 0,
      }));

      return {
        enrolledRevenue, nonEnrolledRevenue,
        enrolledOrders, nonEnrolledOrders,
        enrolledAOV: enrolledOrders > 0 ? enrolledRevenue / enrolledOrders : 0,
        nonEnrolledAOV: nonEnrolledOrders > 0 ? nonEnrolledRevenue / nonEnrolledOrders : 0,
        avgOrdersPerMember: (members || []).length > 0 ? enrolledOrders / (members || []).length : 0,
        chartData,
        aovChartData,
        members: members || [],
      };
    },
  });

  const pointsQuery = useQuery({
    queryKey: ["loyalty-points-stats", start],
    queryFn: async () => {
      const { data } = await supabase
        .from("reward_transactions")
        .select("points, type, created_at")
        .gte("created_at", start);

      let totalIssued = 0, totalRedeemed = 0;
      const byType: Record<string, number> = {};
      const weekMap = new Map<string, { issued: number; redeemed: number }>();

      for (const tx of data || []) {
        const t = tx.type || "unknown";
        byType[t] = (byType[t] || 0) + Math.abs(tx.points);
        if (tx.points > 0) totalIssued += tx.points;
        else totalRedeemed += Math.abs(tx.points);

        const d = new Date(tx.created_at);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const key = format(weekStart, "MMM d");
        const existing = weekMap.get(key) || { issued: 0, redeemed: 0 };
        if (tx.points > 0) existing.issued += tx.points;
        else existing.redeemed += Math.abs(tx.points);
        weekMap.set(key, existing);
      }

      const chartData = Array.from(weekMap, ([week, vals]) => ({ week, ...vals }));

      return { totalIssued, totalRedeemed, net: totalIssued - totalRedeemed, byType, chartData };
    },
  });

  const redemptionsQuery = useQuery({
    queryKey: ["loyalty-redemptions", start],
    queryFn: async () => {
      const { data } = await supabase
        .from("reward_redemptions")
        .select("*")
        .gte("created_at", start)
        .order("created_at", { ascending: false });

      const total = (data || []).length;
      const totalValue = (data || []).reduce((s, r) => s + Number(r.discount_amount), 0);
      const totalPoints = (data || []).reduce((s, r) => s + r.points_spent, 0);
      const usedCount = (data || []).filter(r => r.used).length;

      return { total, totalValue, totalPoints, usedCount, redemptions: data || [] };
    },
  });

  const recentQuery = useQuery({
    queryKey: ["admin-recent-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reward_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Transaction[];
    },
  });

  /* ── Tier distribution ── */
  const tierData = useMemo(() => {
    const members = ordersQuery.data?.members || [];
    const counts: Record<string, number> = {};
    for (const m of members) {
      const tier = m.current_tier || "apprentice";
      counts[tier] = (counts[tier] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value, fill: TIER_COLORS[name] || "#888" }));
  }, [ordersQuery.data]);

  /* ── Handlers ── */
  const handleAdjust = async () => {
    if (!adjustEmail || !adjustPoints || !adjustReason) { toast.error("Fill in all fields"); return; }
    setAdjusting(true);
    try {
      const pts = parseInt(adjustPoints, 10);
      if (isNaN(pts) || pts === 0) throw new Error("Points must be a non-zero number");
      const { data: members } = await supabase.from("vault_members").select("user_id").ilike("email", adjustEmail.trim()).limit(1);
      const userId = members?.[0]?.user_id;
      if (!userId) throw new Error("No member found with that email");
      const { error } = await supabase.from("reward_transactions").insert({
        user_id: userId, points: pts, type: "admin_adjustment" as const,
        description: adjustReason.trim(), source: "admin_dashboard",
      });
      if (error) throw error;
      toast.success(`${pts > 0 ? "Credited" : "Deducted"} ${Math.abs(pts)} points`);
      setAdjustEmail(""); setAdjustPoints(""); setAdjustReason(""); setShowAdjust(false);
      recentQuery.refetch(); pointsQuery.refetch();
    } catch (err: any) { toast.error(err.message || "Failed to adjust points"); }
    finally { setAdjusting(false); }
  };

  const handleLookup = async () => {
    if (!lookupEmail.trim()) return;
    setLookupLoading(true); setLookupResult(null);
    try {
      const { data: members } = await supabase.from("vault_members").select("user_id, email, current_tier, lifetime_spend").ilike("email", lookupEmail.trim()).limit(1);
      const member = members?.[0];
      if (!member?.user_id) { toast.error("No member found with that email"); return; }
      const { data: balance } = await supabase.rpc("get_user_points_balance", { p_user_id: member.user_id });
      const { data: txs } = await supabase.from("reward_transactions").select("*").eq("user_id", member.user_id).order("created_at", { ascending: false }).limit(25);
      setLookupResult({
        email: member.email || lookupEmail, balance: balance || 0,
        tier: member.current_tier || "apprentice", lifetime_spend: Number(member.lifetime_spend || 0),
        transactions: (txs || []) as Transaction[],
      });
    } catch (err: any) { toast.error(err.message || "Lookup failed"); }
    finally { setLookupLoading(false); }
  };

  const od = ordersQuery.data;
  const pd = pointsQuery.data;
  const rd = redemptionsQuery.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-display text-xl uppercase tracking-wider text-foreground">Loyalty Program Performance</h2>
          <p className="text-sm text-muted-foreground font-body mt-1">Track revenue, points economy, and member engagement</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setLookupResult(null); setLookupEmail(""); }} className="gap-1.5">
            <Search className="w-3.5 h-3.5" /> Customer Lookup
          </Button>
          <Button size="sm" variant={showAdjust ? "secondary" : "default"} onClick={() => setShowAdjust(!showAdjust)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Manual Adjustment
          </Button>
        </div>
      </div>

      {/* Customer lookup */}
      <div className="border border-border rounded-lg p-4 bg-card/50 space-y-3">
        <h3 className="font-display text-sm uppercase tracking-wider text-foreground">🔍 Customer Points Lookup</h3>
        <div className="flex gap-2">
          <Input placeholder="Customer email address" value={lookupEmail} onChange={(e) => setLookupEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLookup()} className="font-body text-sm max-w-md" />
          <Button size="sm" onClick={handleLookup} disabled={lookupLoading}>
            {lookupLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          </Button>
        </div>
        {lookupResult && (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MiniStat label="Email" value={lookupResult.email} mono={false} />
              <MiniStat label="Balance" value={`${lookupResult.balance.toLocaleString()} pts`} color="text-green-500" />
              <MiniStat label="Tier" value={lookupResult.tier} mono={false} capitalize />
              <MiniStat label="Lifetime Spend" value={`$${lookupResult.lifetime_spend.toFixed(2)}`} />
            </div>
            {lookupResult.transactions.length > 0 && (
              <div className="border border-border/50 rounded-lg overflow-hidden">
                <div className="max-h-[200px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-card/80 sticky top-0">
                      <tr className="text-left text-muted-foreground font-display text-[10px] uppercase tracking-wider">
                        <th className="px-3 py-1.5">Date</th><th className="px-3 py-1.5">Type</th>
                        <th className="px-3 py-1.5">Description</th><th className="px-3 py-1.5 text-right">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {lookupResult.transactions.map((tx) => (
                        <tr key={tx.id} className="font-body text-xs">
                          <td className="px-3 py-1.5 text-muted-foreground whitespace-nowrap">{format(new Date(tx.created_at), "MMM d, yyyy")}</td>
                          <td className="px-3 py-1.5"><TypeBadge type={tx.type} /></td>
                          <td className="px-3 py-1.5 text-muted-foreground truncate max-w-[200px]">{tx.description}</td>
                          <td className={`px-3 py-1.5 text-right font-mono font-bold ${tx.points >= 0 ? "text-green-500" : "text-red-400"}`}>
                            {tx.points >= 0 ? "+" : ""}{tx.points.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual adjustment */}
      {showAdjust && (
        <div className="border border-border rounded-lg p-4 bg-card/50 space-y-3">
          <h3 className="font-display text-sm uppercase tracking-wider text-foreground">Adjust Points</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input placeholder="Member email" value={adjustEmail} onChange={(e) => setAdjustEmail(e.target.value)} className="font-body text-sm" />
            <Input placeholder="Points (negative to deduct)" type="number" value={adjustPoints} onChange={(e) => setAdjustPoints(e.target.value)} className="font-body text-sm" />
            <Input placeholder="Reason" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} className="font-body text-sm" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdjust} disabled={adjusting}>
              {adjusting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />} Submit
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdjust(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="revenue" className="gap-1.5 text-xs font-display uppercase tracking-wider"><DollarSign className="w-3.5 h-3.5" />Revenue</TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5 text-xs font-display uppercase tracking-wider"><Users className="w-3.5 h-3.5" />Members</TabsTrigger>
          <TabsTrigger value="points" className="gap-1.5 text-xs font-display uppercase tracking-wider"><Skull className="w-3.5 h-3.5" />Points</TabsTrigger>
          <TabsTrigger value="redemptions" className="gap-1.5 text-xs font-display uppercase tracking-wider"><Ticket className="w-3.5 h-3.5" />Redemptions</TabsTrigger>
          <TabsTrigger value="tiers" className="gap-1.5 text-xs font-display uppercase tracking-wider"><Award className="w-3.5 h-3.5" />Tiers</TabsTrigger>
        </TabsList>

        {/* Time range selector */}
        <div className="flex items-center gap-1 mt-4 mb-2">
          {RANGE_OPTIONS.map((r) => (
            <Button key={r.days} size="sm" variant={rangeDays === r.days ? "default" : "ghost"}
              className="text-xs font-body h-7 px-3" onClick={() => setRangeDays(r.days)}>
              {r.label}
            </Button>
          ))}
        </div>

        {/* ═══ REVENUE TAB ═══ */}
        <TabsContent value="revenue" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={DollarSign} label="Enrolled Revenue" value={`$${(od?.enrolledRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            <StatCard icon={CreditCard} label="Enrolled AOV" value={`$${(od?.enrolledAOV ?? 0).toFixed(2)}`} />
            <StatCard icon={CreditCard} label="Non-Enrolled AOV" value={`$${(od?.nonEnrolledAOV ?? 0).toFixed(2)}`} />
            <StatCard icon={BarChart3} label="Avg Orders / Member" value={(od?.avgOrdersPerMember ?? 0).toFixed(2)} />
            <StatCard icon={Gift} label="Coupon Value Used" value={`$${(rd?.totalValue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Revenue: Enrolled vs Non-Enrolled">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={od?.chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend />
                  <Area type="monotone" dataKey="enrolled" name="Enrolled" stroke="#3b82f6" fill="#3b82f680" strokeWidth={2} />
                  <Area type="monotone" dataKey="nonEnrolled" name="Non-Enrolled" stroke="#10b981" fill="#10b98140" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="AOV: Enrolled vs Non-Enrolled">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={od?.aovChartData || []} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend />
                  <Bar dataKey="enrolledAOV" name="Enrolled AOV" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="nonEnrolledAOV" name="Non-Enrolled AOV" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </TabsContent>

        {/* ═══ MEMBERS TAB ═══ */}
        <TabsContent value="members" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Members" value={(od?.members.length ?? 0).toLocaleString()} />
            <StatCard icon={Users} label="Linked Members" value={(od?.members.filter(m => m.user_id).length ?? 0).toLocaleString()} />
            <StatCard icon={TrendingUp} label="Enrolled Orders" value={(od?.enrolledOrders ?? 0).toLocaleString()} />
            <StatCard icon={DollarSign} label="Avg Lifetime Spend" value={`$${od?.members.length ? (od.members.reduce((s, m) => s + Number(m.lifetime_spend || 0), 0) / od.members.length).toFixed(2) : "0.00"}`} />
          </div>

          <ChartCard title="Member Growth">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={(() => {
                const members = od?.members || [];
                const weekMap = new Map<string, number>();
                for (const m of members) {
                  if (m.created_at < start) continue;
                  const d = new Date(m.created_at);
                  const ws = new Date(d); ws.setDate(d.getDate() - d.getDay());
                  const key = format(ws, "MMM d");
                  weekMap.set(key, (weekMap.get(key) || 0) + 1);
                }
                return Array.from(weekMap, ([week, count]) => ({ week, count }));
              })()}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" name="New Members" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Retention / Churn */}
          {(() => {
            const members = od?.members || [];
            const total = members.length;
            const now = Date.now();
            const d30 = now - 30 * 86400000;
            const d60 = now - 60 * 86400000;
            const d90 = now - 90 * 86400000;
            const active30 = members.filter(m => m.points_last_active && new Date(m.points_last_active).getTime() >= d30).length;
            const active60 = members.filter(m => m.points_last_active && new Date(m.points_last_active).getTime() >= d60).length;
            const active90 = members.filter(m => m.points_last_active && new Date(m.points_last_active).getTime() >= d90).length;
            const dormant = total - active90;
            const pct = (n: number) => total > 0 ? ((n / total) * 100).toFixed(1) : "0";
            const barData = [
              { period: "30 Days", active: active30, inactive: total - active30 },
              { period: "60 Days", active: active60, inactive: total - active60 },
              { period: "90 Days", active: active90, inactive: total - active90 },
            ];
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={TrendingUp} label="Active (30d)" value={`${active30.toLocaleString()} (${pct(active30)}%)`} color="text-green-500" />
                  <StatCard icon={TrendingUp} label="Active (60d)" value={`${active60.toLocaleString()} (${pct(active60)}%)`} color="text-blue-400" />
                  <StatCard icon={TrendingUp} label="Active (90d)" value={`${active90.toLocaleString()} (${pct(active90)}%)`} />
                  <StatCard icon={Users} label="Dormant (90d+)" value={`${dormant.toLocaleString()} (${pct(dormant)}%)`} color="text-red-400" />
                </div>
                <ChartCard title="Member Retention">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={barData} layout="vertical" barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="period" type="category" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" width={70} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Legend />
                      <Bar dataKey="active" name="Active" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="inactive" name="Inactive" fill="#6b728080" stackId="a" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            );
          })()}
        </TabsContent>

        {/* ═══ POINTS TAB ═══ */}
        <TabsContent value="points" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={ArrowUpCircle} label="Total Issued" value={(pd?.totalIssued ?? 0).toLocaleString()} color="text-green-500" />
            <StatCard icon={ArrowDownCircle} label="Total Redeemed" value={(pd?.totalRedeemed ?? 0).toLocaleString()} color="text-red-400" />
            <StatCard icon={Skull} label="Net Outstanding" value={(pd?.net ?? 0).toLocaleString()} color="text-primary" />
            <StatCard icon={TrendingUp} label="Redemption Rate" value={pd?.totalIssued ? `${((pd.totalRedeemed / pd.totalIssued) * 100).toFixed(1)}%` : "0%"} />
          </div>

          <ChartCard title="Points Issued vs Redeemed">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={pd?.chartData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="issued" name="Issued" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="redeemed" name="Redeemed" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Points by source */}
          <div className="border border-border rounded-lg p-4 bg-card/50">
            <h3 className="font-display text-sm uppercase tracking-wider text-foreground mb-3">Points by Source</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.entries(pd?.byType || {}).sort((a, b) => b[1] - a[1]).map(([type, pts]) => (
                <div key={type} className="flex items-center justify-between px-3 py-2 rounded-md bg-background/50">
                  <span className="text-xs font-body text-muted-foreground">{TYPE_LABELS[type] || type}</span>
                  <span className="text-xs font-mono font-bold text-foreground">{pts.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ═══ REDEMPTIONS TAB ═══ */}
        <TabsContent value="redemptions" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Ticket} label="Total Redemptions" value={(rd?.total ?? 0).toLocaleString()} />
            <StatCard icon={DollarSign} label="Coupon Value Generated" value={`$${(rd?.totalValue ?? 0).toFixed(2)}`} />
            <StatCard icon={Skull} label="Points Spent" value={(rd?.totalPoints ?? 0).toLocaleString()} />
            <StatCard icon={Gift} label="Coupons Used" value={`${rd?.usedCount ?? 0} / ${rd?.total ?? 0}`} />
          </div>

          {(rd?.redemptions.length ?? 0) > 0 ? (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-card/80 sticky top-0">
                    <tr className="text-left text-muted-foreground font-display text-[10px] uppercase tracking-wider">
                      <th className="px-3 py-2">Date</th><th className="px-3 py-2">Code</th>
                      <th className="px-3 py-2 text-right">Points</th><th className="px-3 py-2 text-right">Value</th>
                      <th className="px-3 py-2">Used</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {(rd?.redemptions || []).map((r) => (
                      <tr key={r.id} className="font-body text-xs hover:bg-secondary/20 transition-colors">
                        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{format(new Date(r.created_at), "MMM d, h:mm a")}</td>
                        <td className="px-3 py-2 font-mono text-foreground">{r.discount_code}</td>
                        <td className="px-3 py-2 text-right font-mono text-red-400">-{r.points_spent.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-mono text-green-500">${Number(r.discount_amount).toFixed(2)}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-display uppercase tracking-wider ${r.used ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"}`}>
                            {r.used ? "Used" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="border border-border rounded-lg p-8 text-center text-muted-foreground font-body text-sm">
              No redemptions yet in this period
            </div>
          )}
        </TabsContent>

        {/* ═══ TIERS TAB ═══ */}
        <TabsContent value="tiers" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {tierData.map((t) => (
              <StatCard key={t.name} icon={Award} label={t.name} value={t.value.toLocaleString()} color={`text-[${t.fill}]`} iconColor={t.fill} />
            ))}
          </div>

          <ChartCard title="Tier Distribution">
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={tierData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, value }) => `${name}: ${value}`} labelLine>
                    {tierData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Tier details table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-card/80">
                <tr className="text-left text-muted-foreground font-display text-[10px] uppercase tracking-wider">
                  <th className="px-3 py-2">Tier</th><th className="px-3 py-2 text-right">Members</th>
                  <th className="px-3 py-2 text-right">% of Total</th><th className="px-3 py-2 text-right">Avg Lifetime Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {tierData.map((t) => {
                  const tierMembers = (od?.members || []).filter(m => (m.current_tier || "apprentice") === t.name);
                  const avgSpend = tierMembers.length > 0 ? tierMembers.reduce((s, m) => s + Number(m.lifetime_spend || 0), 0) / tierMembers.length : 0;
                  const pct = (od?.members.length || 0) > 0 ? (t.value / od!.members.length * 100).toFixed(1) : "0";
                  return (
                    <tr key={t.name} className="font-body text-xs hover:bg-secondary/20 transition-colors">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.fill }} />
                          <span className="capitalize font-medium text-foreground">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-foreground">{t.value}</td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground">{pct}%</td>
                      <td className="px-3 py-2 text-right font-mono text-foreground">${avgSpend.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent transactions (always visible) */}
      <div>
        <h3 className="font-display text-sm uppercase tracking-wider text-foreground mb-3">Recent Transactions</h3>
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-card/80 sticky top-0">
                <tr className="text-left text-muted-foreground font-display text-[10px] uppercase tracking-wider">
                  <th className="px-3 py-2">Date</th><th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Description</th><th className="px-3 py-2 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {(recentQuery.data || []).map((tx) => (
                  <tr key={tx.id} className="font-body text-xs hover:bg-secondary/20 transition-colors">
                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{format(new Date(tx.created_at), "MMM d, h:mm a")}</td>
                    <td className="px-3 py-2"><TypeBadge type={tx.type} /></td>
                    <td className="px-3 py-2 text-muted-foreground truncate max-w-[200px]">{tx.description}</td>
                    <td className={`px-3 py-2 text-right font-mono font-bold ${tx.points >= 0 ? "text-green-500" : "text-red-400"}`}>
                      {tx.points >= 0 ? "+" : ""}{tx.points.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {recentQuery.isLoading && (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></td></tr>
                )}
                {!recentQuery.isLoading && (recentQuery.data || []).length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-muted-foreground font-body text-xs">No transactions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */
function StatCard({ icon: Icon, label, value, color, iconColor }: { icon: React.ElementType; label: string; value: string; color?: string; iconColor?: string }) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card/50">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center">
          <Icon className="w-4 h-4" style={iconColor ? { color: iconColor } : undefined} />
        </div>
        <span className="text-[10px] font-display uppercase tracking-wider text-muted-foreground leading-tight">{label}</span>
      </div>
      <p className={`text-xl font-mono font-bold ${color || "text-foreground"}`}>{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card/50">
      <h3 className="font-display text-sm uppercase tracking-wider text-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}

function MiniStat({ label, value, color, mono = true, capitalize: cap }: { label: string; value: string; color?: string; mono?: boolean; capitalize?: boolean }) {
  return (
    <div className="bg-background/50 rounded-md px-3 py-2">
      <span className="text-[10px] font-display uppercase tracking-wider text-muted-foreground block">{label}</span>
      <span className={`text-sm font-bold ${mono ? "font-mono" : "font-body"} ${color || "text-foreground"} ${cap ? "capitalize" : ""}`}>{value}</span>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-block px-1.5 py-0.5 rounded bg-secondary/60 text-[10px] font-display uppercase tracking-wider">
      {TYPE_LABELS[type] || type}
    </span>
  );
}
