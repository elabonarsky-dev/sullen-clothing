import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Save, Eye, EyeOff, Loader2 } from "lucide-react";

interface CartIncentive {
  id: string;
  label: string;
  type: string;
  threshold: number;
  description: string | null;
  icon: string;
  is_active: boolean;
  position: number;
}

export function CartIncentivesManager() {
  const [incentives, setIncentives] = useState<CartIncentive[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchIncentives = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("cart_incentives")
      .select("*")
      .order("position", { ascending: true });
    setIncentives((data as CartIncentive[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchIncentives();
  }, []);

  const updateIncentive = async (id: string, updates: Partial<CartIncentive>) => {
    setSaving(id);
    const { error } = await supabase
      .from("cart_incentives")
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) {
      toast.error("Failed to update: " + error.message);
    } else {
      toast.success("Updated");
      setIncentives((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
      );
    }
    setSaving(null);
  };

  const addIncentive = async () => {
    const { data, error } = await supabase
      .from("cart_incentives")
      .insert({
        label: "New Reward",
        type: "gift",
        threshold: 125,
        description: "Describe the reward",
        icon: "🎁",
        position: incentives.length,
      } as any)
      .select()
      .single();
    if (error) {
      toast.error("Failed to add: " + error.message);
    } else {
      setIncentives((prev) => [...prev, data as CartIncentive]);
      toast.success("Incentive added");
    }
  };

  const deleteIncentive = async (id: string) => {
    const { error } = await supabase
      .from("cart_incentives")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Failed to delete: " + error.message);
    } else {
      setIncentives((prev) => prev.filter((i) => i.id !== id));
      toast.success("Deleted");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg uppercase tracking-wider text-foreground">
            Cart Incentives
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Configure the progress milestones shown in the cart drawer (free shipping, free gifts, etc.)
          </p>
        </div>
        <button
          onClick={addIncentive}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Tier
        </button>
      </div>

      <div className="space-y-3">
        {incentives.map((inc) => (
          <div
            key={inc.id}
            className={`border rounded-lg p-4 space-y-3 transition-colors ${
              inc.is_active ? "border-border bg-card" : "border-border/30 bg-card/50 opacity-60"
            }`}
          >
            <div className="flex items-center gap-3 flex-wrap">
              {/* Icon */}
              <input
                type="text"
                value={inc.icon}
                onChange={(e) =>
                  setIncentives((prev) =>
                    prev.map((i) => (i.id === inc.id ? { ...i, icon: e.target.value } : i))
                  )
                }
                className="w-12 text-center text-lg bg-secondary rounded px-2 py-1 border border-border/30"
              />

              {/* Label */}
              <input
                type="text"
                value={inc.label}
                onChange={(e) =>
                  setIncentives((prev) =>
                    prev.map((i) => (i.id === inc.id ? { ...i, label: e.target.value } : i))
                  )
                }
                className="flex-1 min-w-[120px] text-sm font-display uppercase tracking-wider bg-secondary rounded px-3 py-1.5 border border-border/30 text-foreground"
                placeholder="Label"
              />

              {/* Type */}
              <select
                value={inc.type}
                onChange={(e) =>
                  setIncentives((prev) =>
                    prev.map((i) => (i.id === inc.id ? { ...i, type: e.target.value } : i))
                  )
                }
                className="text-xs bg-secondary rounded px-2 py-1.5 border border-border/30 text-foreground"
              >
                <option value="shipping">Shipping</option>
                <option value="gift">Gift</option>
                <option value="discount">Discount</option>
              </select>

              {/* Threshold */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">$</span>
                <input
                  type="number"
                  value={inc.threshold}
                  onChange={(e) =>
                    setIncentives((prev) =>
                      prev.map((i) =>
                        i.id === inc.id ? { ...i, threshold: parseFloat(e.target.value) || 0 } : i
                      )
                    )
                  }
                  className="w-20 text-sm bg-secondary rounded px-2 py-1.5 border border-border/30 text-foreground"
                  min={0}
                  step={1}
                />
              </div>
            </div>

            {/* Description */}
            <input
              type="text"
              value={inc.description || ""}
              onChange={(e) =>
                setIncentives((prev) =>
                  prev.map((i) => (i.id === inc.id ? { ...i, description: e.target.value } : i))
                )
              }
              className="w-full text-xs bg-secondary rounded px-3 py-1.5 border border-border/30 text-foreground"
              placeholder="Description shown to customers"
            />

            {/* Actions */}
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => updateIncentive(inc.id, { ...inc })}
                disabled={saving === inc.id}
                className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                title="Save"
              >
                {saving === inc.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => updateIncentive(inc.id, { is_active: !inc.is_active })}
                className={`p-1.5 transition-colors ${
                  inc.is_active
                    ? "text-green-500 hover:text-green-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={inc.is_active ? "Deactivate" : "Activate"}
              >
                {inc.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => deleteIncentive(inc.id)}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {incentives.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No cart incentives configured. Add one to get started.
        </div>
      )}
    </div>
  );
}
