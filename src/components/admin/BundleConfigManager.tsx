import { useState } from "react";
import { toast } from "sonner";
import { Package, Plus, Trash2, Loader2 } from "lucide-react";
import {
  useBundleConfigs,
  useToggleBundleConfig,
  useCreateBundleConfig,
  useDeleteBundleConfig,
} from "@/hooks/useBundleConfigs";

export function BundleConfigManager() {
  const { data: configs = [], isLoading } = useBundleConfigs();
  const toggleMutation = useToggleBundleConfig();
  const createMutation = useCreateBundleConfig();
  const deleteMutation = useDeleteBundleConfig();

  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newHandle, setNewHandle] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newMinQty, setNewMinQty] = useState(4);
  const [newType, setNewType] = useState<"cheapest_free" | "fixed">("cheapest_free");
  const [newFixedAmount, setNewFixedAmount] = useState<number>(10);

  const handleToggle = async (id: string, currentState: boolean, label: string) => {
    try {
      await toggleMutation.mutateAsync({ id, is_active: !currentState });
      toast.success(`${label} bundle ${!currentState ? "activated" : "deactivated"}`);
    } catch {
      toast.error("Failed to update bundle config");
    }
  };

  const handleCreate = async () => {
    if (!newLabel || !newHandle || !newTag) {
      toast.error("Label, handle, and tag are required");
      return;
    }
    try {
      await createMutation.mutateAsync({
        label: newLabel,
        collection_handle: newHandle,
        bundle_tag: newTag,
        min_qty: newMinQty,
        discount_type: newType,
        fixed_amount: newType === "fixed" ? newFixedAmount : null,
        is_active: false,
      });
      toast.success(`${newLabel} bundle config created`);
      setShowAdd(false);
      setNewLabel("");
      setNewHandle("");
      setNewTag("");
      setNewMinQty(4);
      setNewType("cheapest_free");
    } catch {
      toast.error("Failed to create bundle config");
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Delete "${label}" bundle config?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(`${label} deleted`);
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (isLoading) {
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
          <h2 className="font-display text-xl uppercase tracking-wider text-foreground flex items-center gap-2">
            <Package className="w-5 h-5" />
            Bundle Configurations
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Toggle "Buy 3, Get 1 Free" bundles on/off for each capsule collection. Active bundles will be calculated at checkout.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Bundle
        </button>
      </div>

      {showAdd && (
        <div className="border border-border rounded-lg p-4 bg-card space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Label</label>
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. New Capsule"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground font-body"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Collection Handle</label>
              <input
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                placeholder="e.g. new-capsule"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground font-body"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Bundle Tag</label>
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="e.g. new-capsule"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground font-body"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Min Qty</label>
              <input
                type="number"
                value={newMinQty}
                onChange={(e) => setNewMinQty(Number(e.target.value))}
                min={2}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground font-body"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Discount Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as "cheapest_free" | "fixed")}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground font-body"
              >
                <option value="cheapest_free">Cheapest Free</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            {newType === "fixed" && (
              <div>
                <label className="text-xs text-muted-foreground font-body mb-1 block">Fixed Amount ($)</label>
                <input
                  type="number"
                  value={newFixedAmount}
                  onChange={(e) => setNewFixedAmount(Number(e.target.value))}
                  min={1}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground font-body"
                />
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 text-xs font-display uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="px-3 py-1.5 rounded-md text-xs font-display uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {configs.map((config) => (
          <div
            key={config.id}
            className="flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:bg-card/80 transition-colors"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleToggle(config.id, config.is_active, config.label)}
                disabled={toggleMutation.isPending}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  config.is_active ? "bg-green-500" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    config.is_active ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <div>
                <p className="text-sm font-display uppercase tracking-wider text-foreground">
                  {config.label}
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  {config.discount_type === "cheapest_free"
                    ? `Buy ${config.min_qty}, cheapest free`
                    : `Buy ${config.min_qty}, save $${config.fixed_amount}`}
                  {" · "}
                  <span className="text-muted-foreground/70">{config.collection_handle}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDelete(config.id, config.label)}
              disabled={deleteMutation.isPending}
              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {configs.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8 font-body">
            No bundle configurations yet. Add one to get started.
          </p>
        )}
      </div>
    </div>
  );
}
