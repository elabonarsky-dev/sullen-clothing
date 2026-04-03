import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Search, ChevronLeft, ChevronRight, RefreshCw, Plus, Minus } from "lucide-react";

interface VaultMember {
  id: string;
  user_id: string | null;
  shopify_customer_id: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  lifetime_spend: number;
  annual_spend: number;
  annual_spend_year: number;
  current_tier: string;
  tier_locked_until: string | null;
  points_last_active: string | null;
  points_frozen: boolean;
  welcome_bonus_claimed: boolean;
  created_at: string;
  updated_at: string;
}

const TIER_COLORS: Record<string, string> = {
  apprentice: "bg-[#5a5750]/20 text-[#a8a198] border-[#5a5750]/40",
  collector: "bg-[#639922]/15 text-[#8bc34a] border-[#639922]/40",
  mentor: "bg-[#BA7517]/15 text-[#e8a830] border-[#BA7517]/40",
  master: "bg-[#7F77DD]/15 text-[#a89ef0] border-[#7F77DD]/40",
};

const PAGE_SIZE = 25;

export function VaultMembersManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selectedMember, setSelectedMember] = useState<VaultMember | null>(null);
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const membersQuery = useQuery({
    queryKey: ["vault-members", search, tierFilter, page],
    queryFn: async () => {
      let query = supabase
        .from("vault_members")
        .select("*", { count: "exact" })
        .order("lifetime_spend", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (tierFilter !== "all") {
        query = query.eq("current_tier", tierFilter);
      }
      if (search.trim()) {
        query = query.or(`email.ilike.%${search.trim()}%,first_name.ilike.%${search.trim()}%,last_name.ilike.%${search.trim()}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { members: (data || []) as VaultMember[], total: count ?? 0 };
    },
  });

  const statsQuery = useQuery({
    queryKey: ["vault-member-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vault_members")
        .select("current_tier, lifetime_spend, annual_spend, points_frozen");
      if (error) throw error;
      const members = data || [];
      const tiers: Record<string, number> = {};
      let totalLifetime = 0;
      let activeThisYear = 0;
      let dormant = 0;
      for (const m of members) {
        tiers[m.current_tier] = (tiers[m.current_tier] || 0) + 1;
        totalLifetime += Number(m.lifetime_spend);
        if (Number(m.annual_spend) > 0) activeThisYear++;
        if (m.points_frozen) dormant++;
      }
      return { total: members.length, tiers, totalLifetime, activeThisYear, dormant };
    },
  });

  const memberTransactions = useQuery({
    queryKey: ["vault-member-transactions", selectedMember?.user_id],
    queryFn: async () => {
      if (!selectedMember?.user_id) return [];
      const { data, error } = await supabase
        .from("reward_transactions")
        .select("*")
        .eq("user_id", selectedMember.user_id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedMember?.user_id,
  });

  const adjustMutation = useMutation({
    mutationFn: async ({ memberId, userId, points, reason }: { memberId: string; userId: string; points: number; reason: string }) => {
      const { error } = await supabase.from("reward_transactions").insert({
        user_id: userId,
        points,
        type: "admin_adjustment",
        description: reason || "Manual adjustment",
        source: "admin",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Points adjusted");
      queryClient.invalidateQueries({ queryKey: ["vault-member-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["vault-members"] });
      setAdjustPoints("");
      setAdjustReason("");
    },
    onError: (e) => toast.error(e.message),
  });

  const reassignTierMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { data, error } = await supabase.rpc("assign_vault_tier", { p_member_id: memberId });
      if (error) throw error;
      return data;
    },
    onSuccess: (tier) => {
      toast.success(`Tier reassigned: ${tier}`);
      queryClient.invalidateQueries({ queryKey: ["vault-members"] });
      if (selectedMember) {
        setSelectedMember({ ...selectedMember, current_tier: tier as string });
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const totalPages = Math.ceil((membersQuery.data?.total ?? 0) / PAGE_SIZE);
  const stats = statsQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl uppercase tracking-wider text-foreground">
          Vault Members
        </h2>
        <p className="text-sm text-muted-foreground font-body mt-1">
          Manage loyalty program members, view spend data, and adjust points.
        </p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-card border border-border/20 rounded-lg p-4">
            <div className="text-2xl font-display text-foreground">{stats.total.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Members</div>
          </div>
          <div className="bg-card border border-border/20 rounded-lg p-4">
            <div className="text-2xl font-display text-foreground">{stats.activeThisYear.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Active This Year</div>
          </div>
          <div className="bg-card border border-border/20 rounded-lg p-4">
            <div className="text-2xl font-display text-foreground">${(stats.totalLifetime / 1000).toFixed(0)}k</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Lifetime Spend</div>
          </div>
          <div className="bg-card border border-border/20 rounded-lg p-4">
            <div className="text-2xl font-display text-foreground">{stats.dormant}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Dormant</div>
          </div>
          <div className="bg-card border border-border/20 rounded-lg p-4">
            <div className="flex gap-2 flex-wrap">
              {["apprentice", "collector", "mentor", "master"].map((t) => (
                <span key={t} className="text-xs">
                  <span className="capitalize">{t}</span>: {stats.tiers[t] ?? 0}
                </span>
              ))}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Tier Distribution</div>
          </div>
        </div>
      )}

      {/* Search and filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by name or email…"
            className="pl-10 bg-card border-border/20"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => { setTierFilter(e.target.value); setPage(0); }}
          className="bg-card border border-border/20 rounded-md px-3 py-2 text-sm text-foreground"
        >
          <option value="all">All Tiers</option>
          <option value="apprentice">Apprentice</option>
          <option value="collector">Collector</option>
          <option value="mentor">Mentor</option>
          <option value="master">Master</option>
        </select>
      </div>

      {/* Members table */}
      <div className="border border-border/20 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/20">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead className="text-right">Lifetime</TableHead>
              <TableHead className="text-right">Annual</TableHead>
              <TableHead>Last Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {membersQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Loading…
                </TableCell>
              </TableRow>
            ) : (membersQuery.data?.members ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No members found. Import members or wait for signups.
                </TableCell>
              </TableRow>
            ) : (
              (membersQuery.data?.members ?? []).map((m) => (
                <TableRow
                  key={m.id}
                  className="border-border/10 cursor-pointer hover:bg-card/80"
                  onClick={() => setSelectedMember(m)}
                >
                  <TableCell className="font-medium">
                    {[m.first_name, m.last_name].filter(Boolean).join(" ") || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{m.email || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize text-[10px] ${TIER_COLORS[m.current_tier] ?? ""}`}>
                      {m.current_tier}
                    </Badge>
                    {m.points_frozen && (
                      <Badge variant="outline" className="ml-1 text-[10px] border-destructive/40 text-destructive">
                        Frozen
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    ${Number(m.lifetime_spend).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    ${Number(m.annual_spend).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {m.points_last_active || "Never"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages} ({membersQuery.data?.total ?? 0} members)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Member Detail Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedMember && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display uppercase tracking-wider flex items-center gap-3">
                  {[selectedMember.first_name, selectedMember.last_name].filter(Boolean).join(" ") || selectedMember.email || "Member"}
                  <Badge variant="outline" className={`capitalize ${TIER_COLORS[selectedMember.current_tier] ?? ""}`}>
                    {selectedMember.current_tier}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div className="bg-secondary/50 rounded-md p-3">
                  <div className="text-lg font-display">${Number(selectedMember.lifetime_spend).toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Lifetime Spend</div>
                </div>
                <div className="bg-secondary/50 rounded-md p-3">
                  <div className="text-lg font-display">${Number(selectedMember.annual_spend).toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Annual Spend ({selectedMember.annual_spend_year})</div>
                </div>
                <div className="bg-secondary/50 rounded-md p-3">
                  <div className="text-lg font-display">{selectedMember.points_last_active || "—"}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Last Active</div>
                </div>
                <div className="bg-secondary/50 rounded-md p-3">
                  <div className="text-lg font-display">{selectedMember.points_frozen ? "Yes" : "No"}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Points Frozen</div>
                </div>
              </div>

              {/* Tier reassign button */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => reassignTierMutation.mutate(selectedMember.id)}
                  disabled={reassignTierMutation.isPending}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Recalculate Tier
                </Button>
              </div>

              {/* Point adjustment */}
              {selectedMember.user_id && (
                <div className="mt-4 p-4 border border-border/20 rounded-lg">
                  <h4 className="font-display text-sm uppercase tracking-wider mb-3">Manual Point Adjustment</h4>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={adjustPoints}
                      onChange={(e) => setAdjustPoints(e.target.value)}
                      placeholder="Points (+/-)"
                      className="w-28 bg-card"
                    />
                    <Input
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="Reason"
                      className="flex-1 bg-card"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const pts = parseInt(adjustPoints);
                        if (!pts || !selectedMember.user_id) return;
                        adjustMutation.mutate({
                          memberId: selectedMember.id,
                          userId: selectedMember.user_id,
                          points: pts,
                          reason: adjustReason,
                        });
                      }}
                      disabled={!adjustPoints || adjustMutation.isPending}
                    >
                      {parseInt(adjustPoints || "0") >= 0 ? <Plus className="w-3.5 h-3.5 mr-1" /> : <Minus className="w-3.5 h-3.5 mr-1" />}
                      Apply
                    </Button>
                  </div>
                </div>
              )}

              {/* Transaction history */}
              <div className="mt-4">
                <h4 className="font-display text-sm uppercase tracking-wider mb-3">Transaction History</h4>
                <div className="border border-border/20 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/20">
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memberTransactions.isLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-4">Loading…</TableCell>
                        </TableRow>
                      ) : (memberTransactions.data ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-4">No transactions</TableCell>
                        </TableRow>
                      ) : (
                        (memberTransactions.data ?? []).map((tx: any) => (
                          <TableRow key={tx.id} className="border-border/10">
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(tx.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">{tx.type}</Badge>
                            </TableCell>
                            <TableCell className={`text-right font-mono text-sm ${tx.points >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {tx.points > 0 ? "+" : ""}{tx.points}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {tx.description || "—"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
