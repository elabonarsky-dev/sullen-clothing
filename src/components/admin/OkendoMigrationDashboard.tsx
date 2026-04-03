import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, CheckCircle2, Clock, DollarSign, TrendingUp } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const TIER_ORDER = ["Apprentice", "Collector", "Mentor", "Master"];

const TIER_QUALIFICATIONS: Record<string, { spend: string; rate: string }> = {
  Apprentice: { spend: "$0+", rate: "2× ($2/spend)" },
  Collector: { spend: "$200+ lifetime", rate: "2× ($2/spend)" },
  Mentor: { spend: "$750+ lifetime", rate: "3× ($3/spend)" },
  Master: { spend: "$2,000+ lifetime", rate: "3× ($3/spend)" },
};

interface TierData {
  tier: string;
  count: number;
  claimed: number;
  points: number;
}

interface MigrationStats {
  total: number;
  claimed: number;
  unclaimed: number;
  totalPoints: number;
  claimedPoints: number;
  unclaimedPoints: number;
  tierBreakdown: TierData[];
}

interface TopBalance {
  email: string;
  corrected_balance: number;
  tier: string;
  total_order_value: number;
  claimed: boolean;
  claimed_at: string | null;
}

export function OkendoMigrationDashboard() {
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [topBalances, setTopBalances] = useState<TopBalance[]>([]);
  const [recentClaims, setRecentClaims] = useState<TopBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"overview" | "top" | "recent">("overview");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Use server-side aggregation for stats
      const { data: statsData, error: statsError } = await supabase.rpc("get_okendo_migration_stats");
      if (statsError) throw statsError;

      const s = statsData as any;
      setStats({
        total: s.total,
        claimed: s.claimed,
        unclaimed: s.unclaimed,
        totalPoints: Number(s.totalPoints),
        claimedPoints: Number(s.claimedPoints),
        unclaimedPoints: Number(s.unclaimedPoints),
        tierBreakdown: (s.tierBreakdown || []).map((t: any) => ({
          tier: t.tier,
          count: t.count,
          claimed: t.claimed,
          points: Number(t.points),
        })),
      });

      // Top unclaimed balances
      const { data: top } = await supabase
        .from("okendo_migration")
        .select("email, corrected_balance, tier, total_order_value, claimed, claimed_at")
        .eq("claimed", false)
        .order("corrected_balance", { ascending: false })
        .limit(25);

      setTopBalances((top as TopBalance[]) || []);

      // Recent claims
      const { data: recent } = await supabase
        .from("okendo_migration")
        .select("email, corrected_balance, tier, total_order_value, claimed, claimed_at")
        .eq("claimed", true)
        .order("claimed_at", { ascending: false })
        .limit(25);

      setRecentClaims((recent as TopBalance[]) || []);
    } catch (err) {
      console.error("Failed to load migration data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) return <p className="text-muted-foreground text-center py-10">No migration data found.</p>;

  const claimRate = stats.total > 0 ? ((stats.claimed / stats.total) * 100).toFixed(2) : "0";
  const dollarLiability = (stats.unclaimedPoints / 100).toLocaleString("en-US", { minimumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display uppercase tracking-wider">Okendo Migration</h2>
        <button onClick={fetchData} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Users className="w-3.5 h-3.5" />
            Total Records
          </div>
          <p className="text-2xl font-display">{stats.total.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            Claimed
          </div>
          <p className="text-2xl font-display">{stats.claimed.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{claimRate}% claim rate</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Unclaimed
          </div>
          <p className="text-2xl font-display">{stats.unclaimed.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <DollarSign className="w-3.5 h-3.5 text-red-400" />
            Unclaimed Liability
          </div>
          <p className="text-2xl font-display">${dollarLiability}</p>
          <p className="text-xs text-muted-foreground">{stats.unclaimedPoints.toLocaleString()} pts</p>
        </div>
      </div>

      {/* Tier Breakdown */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-display uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Tier Breakdown
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tier</TableHead>
              <TableHead>Qualification</TableHead>
              <TableHead>Earn Rate</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Claimed</TableHead>
              <TableHead className="text-right">Unclaimed</TableHead>
              <TableHead className="text-right">Total Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...stats.tierBreakdown].sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier)).map((data) => {
              const qual = TIER_QUALIFICATIONS[data.tier] || { spend: "—", rate: "—" };
              return (
                <TableRow key={data.tier}>
                  <TableCell className="font-medium">{data.tier}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{qual.spend}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{qual.rate}</TableCell>
                  <TableCell className="text-right">{data.count.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-green-500">{data.claimed.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-amber-500">{(data.count - data.claimed).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{data.points.toLocaleString()}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-2">
        {(["overview", "top", "recent"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-md text-xs font-display uppercase tracking-wider transition-colors ${
              view === v
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            {v === "overview" ? "Overview" : v === "top" ? "Top Unclaimed" : "Recent Claims"}
          </button>
        ))}
      </div>

      {/* Tables */}
      {view === "top" && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-display uppercase tracking-wider mb-3">Top 25 Unclaimed Balances</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Order Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topBalances.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{r.email}</TableCell>
                  <TableCell>{r.tier}</TableCell>
                  <TableCell className="text-right font-medium">{r.corrected_balance.toLocaleString()}</TableCell>
                  <TableCell className="text-right">${Number(r.total_order_value).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {view === "recent" && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-display uppercase tracking-wider mb-3">Recent Claims</h3>
          {recentClaims.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No claims yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Points Credited</TableHead>
                  <TableHead className="text-right">Claimed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentClaims.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{r.email}</TableCell>
                    <TableCell>{r.tier}</TableCell>
                    <TableCell className="text-right font-medium">{r.corrected_balance.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {r.claimed_at ? new Date(r.claimed_at).toLocaleDateString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
