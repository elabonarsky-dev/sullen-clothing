import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Copy, Trash2, Lock } from "lucide-react";

interface VaultCode {
  id: string;
  code: string;
  description: string | null;
  min_tier: string | null;
  valid_from: string;
  valid_until: string | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  shopify_tag: string | null;
  created_at: string;
}

export function VaultCodeManager() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newMaxUses, setNewMaxUses] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [newTag, setNewTag] = useState("vault-exclusive");
  const [saving, setSaving] = useState(false);

  const { data: codes, isLoading } = useQuery({
    queryKey: ["vault-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vault_access_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as VaultCode[];
    },
  });

  const handleCreate = async () => {
    if (!newCode.trim()) {
      toast.error("Code is required");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("vault_access_codes").insert({
        code: newCode.trim().toUpperCase(),
        description: newDesc || null,
        max_uses: newMaxUses ? parseInt(newMaxUses) : null,
        valid_until: newExpiry || null,
        shopify_tag: newTag || "vault-exclusive",
      });
      if (error) throw error;
      toast.success("Vault code created");
      setNewCode("");
      setNewDesc("");
      setNewMaxUses("");
      setNewExpiry("");
      setCreating(false);
      queryClient.invalidateQueries({ queryKey: ["vault-codes"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to create code");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    await supabase.from("vault_access_codes").update({ is_active: !active }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["vault-codes"] });
    toast.success(active ? "Code deactivated" : "Code activated");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("vault_access_codes").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["vault-codes"] });
    toast.success("Code deleted");
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl uppercase tracking-wider text-foreground">
            Vault Access Codes
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Create codes for exclusive Vault access. Tag products in Shopify with <code className="text-primary">vault-exclusive</code>, <code className="text-primary">vault-early</code>, or <code className="text-primary">vault-flash</code>.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setCreating(!creating)}
          className="font-display text-[10px] uppercase tracking-wider"
        >
          <Plus className="w-3 h-3 mr-1" />
          New Code
        </Button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="bg-card border border-border/20 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-1 block">
                Code *
              </label>
              <Input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="VAULT2026"
                className="font-mono text-sm uppercase"
              />
            </div>
            <div>
              <label className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-1 block">
                Shopify Tag
              </label>
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="vault-exclusive"
                className="text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-1 block">
              Description
            </label>
            <Input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Summer 2026 early drop access"
              className="text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-1 block">
                Max Uses (blank = unlimited)
              </label>
              <Input
                type="number"
                value={newMaxUses}
                onChange={(e) => setNewMaxUses(e.target.value)}
                placeholder="100"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-1 block">
                Expires (blank = never)
              </label>
              <Input
                type="datetime-local"
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Create Code"}
            </Button>
          </div>
        </div>
      )}

      {/* Code list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : !codes || codes.length === 0 ? (
        <div className="text-center py-12">
          <Lock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm font-body text-muted-foreground">No vault codes yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {codes.map((c) => (
            <div
              key={c.id}
              className={`flex items-center justify-between p-4 bg-card border rounded-lg ${
                c.is_active ? "border-border/20" : "border-border/10 opacity-50"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-sm font-mono text-foreground">{c.code}</code>
                  <button onClick={() => copyCode(c.code)} className="text-muted-foreground hover:text-foreground">
                    <Copy className="w-3 h-3" />
                  </button>
                  {!c.is_active && (
                    <span className="text-[9px] font-display uppercase tracking-wider text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-body text-muted-foreground">
                  {c.description || "No description"} · Used {c.current_uses}
                  {c.max_uses ? `/${c.max_uses}` : ""} times
                  {c.valid_until && ` · Expires ${new Date(c.valid_until).toLocaleDateString()}`}
                  {c.shopify_tag && ` · Tag: ${c.shopify_tag}`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggle(c.id, c.is_active)}
                  className="h-7 text-[10px] font-display uppercase tracking-wider"
                >
                  {c.is_active ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(c.id)}
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
  );
}
