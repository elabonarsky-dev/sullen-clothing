import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Gift, Ticket, ChevronDown, ChevronUp } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Campaign = Tables<"unboxing_campaigns">;

export function UnboxingCampaignsManager() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["admin-unboxing-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unboxing_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("unboxing_campaigns").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-unboxing-campaigns"] });
      toast.success("Campaign updated");
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("unboxing_campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-unboxing-campaigns"] });
      toast.success("Campaign deleted");
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Campaign> & { id: string }) => {
      const { error } = await supabase.from("unboxing_campaigns").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-unboxing-campaigns"] });
      toast.success("Campaign saved");
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl uppercase tracking-wider text-foreground">Unboxing Campaigns</h2>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Manage post-purchase scratch-off experiences for special drops.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> New Campaign
        </Button>
      </div>

      {showNew && (
        <NewCampaignForm
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            qc.invalidateQueries({ queryKey: ["admin-unboxing-campaigns"] });
          }}
        />
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : campaigns.length === 0 ? (
        <p className="text-muted-foreground text-sm">No campaigns yet.</p>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <CampaignRow
              key={c.id}
              campaign={c}
              isExpanded={expanded === c.id}
              onToggleExpand={() => setExpanded(expanded === c.id ? null : c.id)}
              onToggleActive={(val) => toggleActive.mutate({ id: c.id, is_active: val })}
              onDelete={() => {
                if (confirm("Delete this campaign and all its claims?")) deleteCampaign.mutate(c.id);
              }}
              onSave={(updates) => updateCampaign.mutate({ id: c.id, ...updates })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Campaign Row ── */
function CampaignRow({
  campaign,
  isExpanded,
  onToggleExpand,
  onToggleActive,
  onDelete,
  onSave,
}: {
  campaign: Campaign;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleActive: (val: boolean) => void;
  onDelete: () => void;
  onSave: (updates: Partial<Campaign>) => void;
}) {
  const [title, setTitle] = useState(campaign.title);
  const [slug, setSlug] = useState(campaign.slug);
  const [description, setDescription] = useState(campaign.description ?? "");
  const [rewardType, setRewardType] = useState(campaign.reward_type);
  const [pointsMin, setPointsMin] = useState(campaign.reward_points_min ?? 0);
  const [pointsMax, setPointsMax] = useState(campaign.reward_points_max ?? 0);
  const [discountAmount, setDiscountAmount] = useState(campaign.reward_discount_amount ?? 0);
  const [codes, setCodes] = useState((campaign.reward_discount_codes ?? []).join("\n"));

  const dirty =
    title !== campaign.title ||
    slug !== campaign.slug ||
    description !== (campaign.description ?? "") ||
    rewardType !== campaign.reward_type ||
    pointsMin !== (campaign.reward_points_min ?? 0) ||
    pointsMax !== (campaign.reward_points_max ?? 0) ||
    discountAmount !== (campaign.reward_discount_amount ?? 0) ||
    codes !== (campaign.reward_discount_codes ?? []).join("\n");

  const handleSave = () => {
    onSave({
      title,
      slug,
      description: description || null,
      reward_type: rewardType,
      reward_points_min: pointsMin,
      reward_points_max: pointsMax,
      reward_discount_amount: discountAmount,
      reward_discount_codes: codes
        .split("\n")
        .map((c) => c.trim())
        .filter(Boolean),
    });
  };

  const codesArr = (campaign.reward_discount_codes ?? []);
  const claimsInfo = rewardType === "discount_code"
    ? `${codesArr.length} codes remaining`
    : `${pointsMin}–${pointsMax} pts`;

  return (
    <Card className="border-border/50">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={onToggleExpand}
      >
        <Switch
          checked={campaign.is_active}
          onCheckedChange={(val) => {
            onToggleActive(val);
          }}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm uppercase tracking-wider text-foreground truncate">
              {campaign.title}
            </span>
            <Badge variant={campaign.is_active ? "default" : "secondary"} className="text-[10px]">
              {campaign.is_active ? "LIVE" : "OFF"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            /unboxing/{campaign.slug} · {campaign.reward_type === "points" ? <Gift className="inline w-3 h-3 mr-0.5" /> : <Ticket className="inline w-3 h-3 mr-0.5" />}
            {claimsInfo}
          </p>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </div>

      {isExpanded && (
        <CardContent className="border-t border-border/30 pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1 block">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1 block">Slug</label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1 block">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional subtitle" />
          </div>

          <div>
            <label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1 block">Reward Type</label>
            <select
              value={rewardType}
              onChange={(e) => setRewardType(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm"
            >
              <option value="points">Skull Points (random range)</option>
              <option value="discount_code">Discount Codes (one-time use)</option>
            </select>
          </div>

          {rewardType === "points" ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1 block">Min Points</label>
                <Input type="number" value={pointsMin} onChange={(e) => setPointsMin(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1 block">Max Points</label>
                <Input type="number" value={pointsMax} onChange={(e) => setPointsMax(Number(e.target.value))} />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1 block">Discount Amount ($)</label>
                <Input type="number" value={discountAmount} onChange={(e) => setDiscountAmount(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1 block">
                  Discount Codes (one per line)
                </label>
                <Textarea
                  value={codes}
                  onChange={(e) => setCodes(e.target.value)}
                  rows={6}
                  placeholder={"SKULL-DROP-001\nSKULL-DROP-002\nSKULL-DROP-003"}
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {codes.split("\n").filter((c) => c.trim()).length} codes loaded. Each code is consumed once when a customer scratches.
                </p>
              </div>
            </>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button variant="destructive" size="sm" onClick={onDelete} className="gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!dirty}>
              Save Changes
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

/* ── New Campaign Form ── */
function NewCampaignForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [rewardType, setRewardType] = useState("points");
  const [pointsMin, setPointsMin] = useState(25);
  const [pointsMax, setPointsMax] = useState(100);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !slug.trim()) {
      toast.error("Title and slug are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("unboxing_campaigns").insert({
      title: title.trim(),
      slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
      reward_type: rewardType,
      reward_points_min: pointsMin,
      reward_points_max: pointsMax,
      is_active: false,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Campaign created");
      onCreated();
    }
  };

  return (
    <Card className="mb-6 border-primary/30">
      <CardHeader>
        <CardTitle className="font-display text-sm uppercase tracking-wider">New Unboxing Campaign</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1 block">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Holiday Drop 2026" />
          </div>
          <div>
            <label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1 block">Slug</label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="holiday-drop-2026"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1 block">Reward Type</label>
          <select
            value={rewardType}
            onChange={(e) => setRewardType(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm"
          >
            <option value="points">Skull Points</option>
            <option value="discount_code">Discount Codes</option>
          </select>
        </div>
        {rewardType === "points" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1 block">Min Points</label>
              <Input type="number" value={pointsMin} onChange={(e) => setPointsMin(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1 block">Max Points</label>
              <Input type="number" value={pointsMax} onChange={(e) => setPointsMax(Number(e.target.value))} />
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleCreate} disabled={saving}>
            {saving ? "Creating…" : "Create Campaign"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
