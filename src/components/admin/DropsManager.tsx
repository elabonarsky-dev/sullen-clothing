import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, Copy, Pencil, Rocket, X } from "lucide-react";
import { format } from "date-fns";
import { isoToPacificLocal, pacificLocalWithOffset } from "@/lib/timezone";

interface CapsuleDrop {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  collection_handle: string;
  drop_date: string;
  is_active: boolean;
  teaser_label: string | null;
  vault_early_access: boolean;
  created_at: string;
}

const empty: Omit<CapsuleDrop, "id" | "created_at"> = {
  slug: "",
  title: "",
  subtitle: "",
  collection_handle: "",
  drop_date: "",
  is_active: true,
  teaser_label: "Incoming Drop",
  vault_early_access: false,
};

export function DropsManager() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<CapsuleDrop> | null>(null);

  const { data: drops = [], isLoading } = useQuery({
    queryKey: ["admin-capsule-drops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("capsule_drops")
        .select("*")
        .order("drop_date", { ascending: false });
      if (error) throw error;
      return data as CapsuleDrop[];
    },
  });

  const { data: notifCounts = {} } = useQuery({
    queryKey: ["drop-notif-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drop_notifications")
        .select("drop_handle");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        counts[r.drop_handle] = (counts[r.drop_handle] || 0) + 1;
      });
      return counts;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (drop: Partial<CapsuleDrop>) => {
      if (drop.id) {
        const { error } = await supabase
          .from("capsule_drops")
          .update({
            slug: drop.slug,
            title: drop.title,
            subtitle: drop.subtitle || null,
            collection_handle: drop.collection_handle,
            drop_date: drop.drop_date,
            is_active: drop.is_active,
            teaser_label: drop.teaser_label || null,
            vault_early_access: drop.vault_early_access ?? false,
          })
          .eq("id", drop.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("capsule_drops").insert({
          slug: drop.slug!,
          title: drop.title!,
          subtitle: drop.subtitle || null,
          collection_handle: drop.collection_handle!,
          drop_date: drop.drop_date!,
          is_active: drop.is_active ?? true,
          teaser_label: drop.teaser_label || null,
          vault_early_access: drop.vault_early_access ?? false,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-capsule-drops"] });
      setEditing(null);
      toast.success("Drop saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("capsule_drops").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-capsule-drops"] });
      toast.success("Drop deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const isLive = (d: CapsuleDrop) => new Date(d.drop_date) <= new Date();

  const handleSave = () => {
    if (!editing) return;
    if (!editing.slug || !editing.title || !editing.collection_handle || !editing.drop_date) {
      toast.error("Fill in all required fields");
      return;
    }
    saveMutation.mutate(editing);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl uppercase tracking-wider text-foreground">
            Capsule Drops
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Manage countdown hype pages for upcoming capsule releases
          </p>
        </div>
        <button
          onClick={() => setEditing({ ...empty })}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs uppercase tracking-wider font-display rounded hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Drop
        </button>
      </div>

      {/* Editor modal */}
      {editing && (
        <div className="mb-8 border border-border rounded-lg bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm uppercase tracking-wider text-foreground">
              {editing.id ? "Edit Drop" : "New Drop"}
            </h3>
            <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-condensed mb-1 block">
                Title *
              </label>
              <input
                value={editing.title || ""}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="March Artist Series"
                className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-condensed mb-1 block">
                URL Slug *
              </label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">/drops/</span>
                <input
                  value={editing.slug || ""}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  placeholder="march-artist-series"
                  className="flex-1 px-3 py-2 bg-background border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-condensed mb-1 block">
                Subtitle
              </label>
              <input
                value={editing.subtitle || ""}
                onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                placeholder="A new capsule forged in ink"
                className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-condensed mb-1 block">
                Teaser Label
              </label>
              <input
                value={editing.teaser_label || ""}
                onChange={(e) => setEditing({ ...editing, teaser_label: e.target.value })}
                placeholder="Incoming Drop — March 26"
                className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-condensed mb-1 block">
                Collection Handle *
              </label>
              <input
                value={editing.collection_handle || ""}
                onChange={(e) => setEditing({ ...editing, collection_handle: e.target.value })}
                placeholder="march-artist-series-bundle"
                className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-condensed mb-1 block">
                Drop Date & Time (PST) *
              </label>
              <input
                type="datetime-local"
                value={editing.drop_date ? isoToPacificLocal(editing.drop_date) : ""}
                onChange={(e) => setEditing({ ...editing, drop_date: e.target.value ? pacificLocalWithOffset(e.target.value) : "" })}
                className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={editing.is_active ?? true}
                onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                className="accent-primary"
              />
              Active (visible to public)
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={editing.vault_early_access ?? false}
                onChange={(e) => setEditing({ ...editing, vault_early_access: e.target.checked })}
                className="accent-primary"
              />
              🔓 Vault Early Access (24h before public drop)
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground text-xs uppercase tracking-wider font-display rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving…" : "Save Drop"}
            </button>
            <button
              onClick={() => setEditing(null)}
              className="px-4 py-2 text-xs uppercase tracking-wider font-display text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Drops list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-card animate-pulse rounded-lg" />
          ))}
        </div>
      ) : drops.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-2">No drops configured yet</p>
          <p className="text-sm">Create your first capsule drop to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {drops.map((drop) => {
            const live = isLive(drop);
            const signups = notifCounts[drop.collection_handle] || 0;
            return (
              <div
                key={drop.id}
                className="border border-border rounded-lg bg-card p-4 flex items-center gap-4"
              >
                {/* Status indicator */}
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  !drop.is_active ? "bg-muted-foreground" :
                  live ? "bg-green-500 animate-pulse" : "bg-primary animate-pulse"
                }`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-display text-sm uppercase tracking-wider text-foreground truncate">
                      {drop.title}
                    </h4>
                    {live && drop.is_active && (
                      <span className="text-[9px] uppercase tracking-wider bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-condensed font-semibold">
                        Live
                      </span>
                    )}
                    {!drop.is_active && (
                      <span className="text-[9px] uppercase tracking-wider bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-condensed">
                        Draft
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground font-body">
                    <span>/drops/{drop.slug}</span>
                    <span>·</span>
                    <span>{format(new Date(drop.drop_date), "MMM d, yyyy 'at' h:mm a")}</span>
                    {signups > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-primary">{signups} signup{signups !== 1 ? "s" : ""}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/drops/${drop.slug}`);
                      toast.success("URL copied");
                    }}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy URL"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={`/drops/${drop.slug}`}
                    target="_blank"
                    rel="noopener"
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Preview"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => setEditing({ ...drop })}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${drop.title}"?`)) {
                        deleteMutation.mutate(drop.id);
                      }
                    }}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
