import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil } from "lucide-react";

interface BonusEvent {
  id: string;
  name: string;
  trigger: string;
  points_flat: number | null;
  points_multiplier: number | null;
  min_tier: string | null;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

const EMPTY_EVENT = {
  name: "", trigger: "review", points_flat: null as number | null,
  points_multiplier: null as number | null, min_tier: null as string | null,
  active: true, start_date: null as string | null, end_date: null as string | null,
};

export function VaultBonusEventsManager() {
  const queryClient = useQueryClient();
  const [editEvent, setEditEvent] = useState<Partial<BonusEvent> | null>(null);
  const [isNew, setIsNew] = useState(false);

  const eventsQuery = useQuery({
    queryKey: ["vault-bonus-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vault_bonus_events")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as BonusEvent[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (event: Partial<BonusEvent>) => {
      if (event.id) {
        const { error } = await supabase.from("vault_bonus_events").update({
          name: event.name,
          trigger: event.trigger,
          points_flat: event.points_flat,
          points_multiplier: event.points_multiplier,
          min_tier: event.min_tier || null,
          active: event.active ?? true,
          start_date: event.start_date || null,
          end_date: event.end_date || null,
        }).eq("id", event.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("vault_bonus_events").insert({
          name: event.name!,
          trigger: event.trigger!,
          points_flat: event.points_flat,
          points_multiplier: event.points_multiplier,
          min_tier: event.min_tier || null,
          active: event.active ?? true,
          start_date: event.start_date || null,
          end_date: event.end_date || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isNew ? "Bonus event created" : "Bonus event updated");
      queryClient.invalidateQueries({ queryKey: ["vault-bonus-events"] });
      setEditEvent(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("vault_bonus_events").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vault-bonus-events"] }),
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-xl uppercase tracking-wider text-foreground">Bonus Events</h2>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Configure point multipliers and flat bonuses for promotions.
          </p>
        </div>
        <Button size="sm" onClick={() => { setEditEvent({ ...EMPTY_EVENT }); setIsNew(true); }}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Event
        </Button>
      </div>

      <div className="border border-border/20 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/20">
              <TableHead>Name</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Flat Pts</TableHead>
              <TableHead>Multiplier</TableHead>
              <TableHead>Min Tier</TableHead>
              <TableHead>Active</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(eventsQuery.data ?? []).map((ev) => (
              <TableRow key={ev.id} className="border-border/10">
                <TableCell className="font-medium">{ev.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px]">{ev.trigger}</Badge>
                </TableCell>
                <TableCell>{ev.points_flat ?? "—"}</TableCell>
                <TableCell>{ev.points_multiplier ? `${ev.points_multiplier}×` : "—"}</TableCell>
                <TableCell className="capitalize">{ev.min_tier ?? "All"}</TableCell>
                <TableCell>
                  <Switch
                    checked={ev.active}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: ev.id, active: checked })}
                  />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => { setEditEvent(ev); setIsNew(false); }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={!!editEvent} onOpenChange={(open) => !open && setEditEvent(null)}>
        <DialogContent>
          {editEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display uppercase tracking-wider">
                  {isNew ? "New Bonus Event" : "Edit Bonus Event"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-4">
                <Input
                  value={editEvent.name ?? ""}
                  onChange={(e) => setEditEvent({ ...editEvent, name: e.target.value })}
                  placeholder="Event name"
                  className="bg-card"
                />
                <select
                  value={editEvent.trigger ?? "review"}
                  onChange={(e) => setEditEvent({ ...editEvent, trigger: e.target.value })}
                  className="w-full bg-card border border-border/20 rounded-md px-3 py-2 text-sm text-foreground"
                >
                  {["drop_day", "review", "referral", "social_tag", "birthday", "welcome", "tier_upgrade", "manual"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    value={editEvent.points_flat ?? ""}
                    onChange={(e) => setEditEvent({ ...editEvent, points_flat: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Flat points"
                    className="bg-card"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    value={editEvent.points_multiplier ?? ""}
                    onChange={(e) => setEditEvent({ ...editEvent, points_multiplier: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="Multiplier (e.g. 2.0)"
                    className="bg-card"
                  />
                </div>
                <select
                  value={editEvent.min_tier ?? ""}
                  onChange={(e) => setEditEvent({ ...editEvent, min_tier: e.target.value || null })}
                  className="w-full bg-card border border-border/20 rounded-md px-3 py-2 text-sm text-foreground"
                >
                  <option value="">All Tiers</option>
                  <option value="collector">Collector+</option>
                  <option value="mentor">Mentor+</option>
                  <option value="master">Master only</option>
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="date"
                    value={editEvent.start_date ?? ""}
                    onChange={(e) => setEditEvent({ ...editEvent, start_date: e.target.value || null })}
                    className="bg-card"
                  />
                  <Input
                    type="date"
                    value={editEvent.end_date ?? ""}
                    onChange={(e) => setEditEvent({ ...editEvent, end_date: e.target.value || null })}
                    className="bg-card"
                  />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setEditEvent(null)}>Cancel</Button>
                <Button
                  onClick={() => saveMutation.mutate(editEvent)}
                  disabled={!editEvent.name || !editEvent.trigger || saveMutation.isPending}
                >
                  {isNew ? "Create" : "Save"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
