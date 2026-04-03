import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Trash2, Package, Eye, EyeOff } from "lucide-react";

interface VaultItem {
  id: string;
  section: string;
  collection_handle: string;
  label: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
}

const SECTION_OPTIONS = [
  { value: "exclusive", label: "Vault Exclusives" },
  { value: "early", label: "Early Drops" },
  { value: "flash", label: "Flash Sales" },
];

export function VaultItemsManager() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [handle, setHandle] = useState("");
  const [label, setLabel] = useState("");
  const [section, setSection] = useState("exclusive");
  const [saving, setSaving] = useState(false);

  const { data: items, isLoading } = useQuery({
    queryKey: ["vault-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vault_items")
        .select("*")
        .order("section")
        .order("position");
      if (error) throw error;
      return data as VaultItem[];
    },
  });

  const handleCreate = async () => {
    if (!handle.trim()) {
      toast.error("Collection handle is required");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("vault_items").insert({
        collection_handle: handle.trim().toLowerCase(),
        label: label.trim() || null,
        section,
        position: (items?.length ?? 0),
      });
      if (error) throw error;
      toast.success("Collection added to Vault");
      setHandle("");
      setLabel("");
      setCreating(false);
      queryClient.invalidateQueries({ queryKey: ["vault-items"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to add");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("vault_items").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Removed from Vault");
      queryClient.invalidateQueries({ queryKey: ["vault-items"] });
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    await supabase.from("vault_items").update({ is_active: !active }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["vault-items"] });
    toast.success(active ? "Hidden from Vault" : "Visible in Vault");
  };

  const grouped = SECTION_OPTIONS.map((s) => ({
    ...s,
    items: (items ?? []).filter((i) => i.section === s.value),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl uppercase tracking-wider text-foreground">
            Vault Collections
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Add Shopify collection handles to each Vault section. Products from these collections will appear in the Vault.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setCreating(!creating)}
          className="font-display text-[10px] uppercase tracking-wider"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Collection
        </Button>
      </div>

      {creating && (
        <div className="bg-card border border-border/20 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-1 block">
                Collection Handle *
              </label>
              <Input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="sullen-angels"
                className="font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-1 block">
                Display Label
              </label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Sullen Angels"
                className="text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-1 block">
              Section
            </label>
            <div className="flex gap-2">
              {SECTION_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSection(s.value)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-display uppercase tracking-wider transition-colors border ${
                    section === s.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add to Vault"}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.value}>
              <h3 className="text-[10px] font-display uppercase tracking-[0.2em] text-muted-foreground mb-2">
                {group.label}
              </h3>
              {group.items.length === 0 ? (
                <p className="text-xs font-body text-muted-foreground/50 py-3">No collections assigned</p>
              ) : (
                <div className="space-y-1.5">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 bg-card border rounded-lg ${
                        item.is_active ? "border-border/20" : "border-border/10 opacity-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-display uppercase tracking-wider text-foreground">
                            {item.label || item.collection_handle}
                          </p>
                          <code className="text-[10px] font-mono text-muted-foreground">
                            /collections/{item.collection_handle}
                          </code>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggle(item.id, item.is_active)}
                          className="h-7"
                        >
                          {item.is_active ? (
                            <Eye className="w-3 h-3 text-green-500" />
                          ) : (
                            <EyeOff className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="h-7 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
