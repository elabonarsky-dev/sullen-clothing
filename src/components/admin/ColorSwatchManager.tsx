import { useState } from "react";
import { useColorSwatches, type ColorSwatch } from "@/hooks/useColorSwatches";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Upload, Loader2, Palette } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

/* ── Inline swatch preview (diagonal split + stroke) ── */
function SwatchPreview({
  swatch,
  size = 64,
}: {
  swatch: {
    hex_fallback?: string | null;
    image_url?: string | null;
    stroke_color?: string | null;
    is_split?: boolean;
    split_color_1?: string | null;
    split_color_2?: string | null;
  };
  size?: number;
}) {
  const stroke = swatch.stroke_color || undefined;
  const borderWidth = stroke ? 3 : 2;

  if (swatch.image_url) {
    return (
      <div
        className="rounded-full overflow-hidden flex-shrink-0"
        style={{
          width: size,
          height: size,
          border: `${borderWidth}px solid ${stroke || "hsl(var(--border))"}`,
        }}
      >
        <img
          src={swatch.image_url}
          alt="swatch"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  if (swatch.is_split && swatch.split_color_1 && swatch.split_color_2) {
    return (
      <div
        className="rounded-full flex-shrink-0"
        style={{
          width: size,
          height: size,
          border: `${borderWidth}px solid ${stroke || "hsl(var(--border))"}`,
          background: `linear-gradient(135deg, ${swatch.split_color_1} 50%, ${swatch.split_color_2} 50%)`,
        }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: swatch.hex_fallback || "#888",
        border: `${borderWidth}px solid ${stroke || "hsl(var(--border))"}`,
      }}
    />
  );
}

export function ColorSwatchManager() {
  const { data: swatches = [], isLoading } = useColorSwatches();
  const queryClient = useQueryClient();

  /* ── New swatch form ── */
  const [newColor, setNewColor] = useState("");
  const [newHex, setNewHex] = useState("#888888");
  const [newStroke, setNewStroke] = useState("");
  const [newSplit, setNewSplit] = useState(false);
  const [newSplit1, setNewSplit1] = useState("#111111");
  const [newSplit2, setNewSplit2] = useState("#f5f5f5");
  const [adding, setAdding] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  /* ── Inline editing state ── */
  const [editId, setEditId] = useState<string | null>(null);
  const [editHex, setEditHex] = useState("#888888");
  const [editStroke, setEditStroke] = useState("");
  const [editSplit, setEditSplit] = useState(false);
  const [editSplit1, setEditSplit1] = useState("#111111");
  const [editSplit2, setEditSplit2] = useState("#f5f5f5");

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["color-swatches"] });

  const handleAdd = async () => {
    const name = newColor.trim().toUpperCase();
    if (!name) return;
    setAdding(true);
    const { error } = await supabase.from("color_swatches").insert({
      color_name: name,
      hex_fallback: newSplit ? null : newHex,
      stroke_color: newStroke || null,
      is_split: newSplit,
      split_color_1: newSplit ? newSplit1 : null,
      split_color_2: newSplit ? newSplit2 : null,
    });
    setAdding(false);
    if (error) {
      if (error.code === "23505") toast.error("Color already exists");
      else toast.error(error.message);
      return;
    }
    toast.success(`Added ${name}`);
    setNewColor("");
    setNewHex("#888888");
    setNewStroke("");
    setNewSplit(false);
    invalidate();
  };

  const handleDelete = async (swatch: ColorSwatch) => {
    if (!confirm(`Delete swatch for "${swatch.color_name}"?`)) return;
    if (swatch.image_url) {
      const path = swatch.image_url.split("/color-swatches/")[1];
      if (path) await supabase.storage.from("color-swatches").remove([path]);
    }
    await supabase.from("color_swatches").delete().eq("id", swatch.id);
    toast.success(`Deleted ${swatch.color_name}`);
    invalidate();
  };

  const handleUpload = async (swatch: ColorSwatch, file: File) => {
    setUploadingId(swatch.id);
    const ext = file.name.split(".").pop() || "png";
    const path = `${swatch.color_name.toLowerCase().replace(/\s+/g, "-")}.${ext}`;
    if (swatch.image_url) {
      const oldPath = swatch.image_url.split("/color-swatches/")[1];
      if (oldPath)
        await supabase.storage.from("color-swatches").remove([oldPath]);
    }
    const { error: uploadError } = await supabase.storage
      .from("color-swatches")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      toast.error(uploadError.message);
      setUploadingId(null);
      return;
    }
    const { data: urlData } = supabase.storage
      .from("color-swatches")
      .getPublicUrl(path);
    await supabase
      .from("color_swatches")
      .update({
        image_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", swatch.id);
    toast.success(`Swatch uploaded for ${swatch.color_name}`);
    setUploadingId(null);
    invalidate();
  };

  const startEdit = (s: ColorSwatch) => {
    setEditId(s.id);
    setEditHex(s.hex_fallback || "#888888");
    setEditStroke(s.stroke_color || "");
    setEditSplit(s.is_split);
    setEditSplit1(s.split_color_1 || "#111111");
    setEditSplit2(s.split_color_2 || "#f5f5f5");
  };

  const saveEdit = async (swatch: ColorSwatch) => {
    await supabase
      .from("color_swatches")
      .update({
        hex_fallback: editSplit ? null : editHex,
        stroke_color: editStroke || null,
        is_split: editSplit,
        split_color_1: editSplit ? editSplit1 : null,
        split_color_2: editSplit ? editSplit2 : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", swatch.id);
    toast.success(`Updated ${swatch.color_name}`);
    setEditId(null);
    invalidate();
  };

  if (isLoading)
    return (
      <div className="text-muted-foreground text-sm">Loading swatches…</div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-hudson text-lg uppercase tracking-wider text-foreground mb-1">
          Color Swatch Library
        </h2>
        <p className="text-sm text-muted-foreground font-body">
          Upload 64×64px circular swatch images, or define colors with the
          picker. Supports split colors (diagonal) and optional stroke borders.
        </p>
      </div>

      {/* ── Add new swatch ── */}
      <div className="border border-border rounded-lg p-4 bg-card space-y-4">
        <h3 className="text-xs font-display uppercase tracking-wider text-muted-foreground">
          Add New Swatch
        </h3>

        <div className="flex flex-wrap items-end gap-3">
          {/* Color name */}
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1 block">
              Color Name (exact Shopify match)
            </label>
            <Input
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              placeholder="e.g. JET BLACK"
              className="font-body"
            />
          </div>

          {/* Split toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="new-split"
              checked={newSplit}
              onCheckedChange={setNewSplit}
            />
            <Label htmlFor="new-split" className="text-xs uppercase tracking-wider font-display">
              Split
            </Label>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          {!newSplit ? (
            /* Solid color picker */
            <div>
              <label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1 block">
                Fill Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newHex}
                  onChange={(e) => setNewHex(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-border"
                />
                <span className="text-xs text-muted-foreground font-mono">
                  {newHex}
                </span>
              </div>
            </div>
          ) : (
            /* Split color pickers */
            <>
              <div>
                <label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1 block">
                  Color 1
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newSplit1}
                    onChange={(e) => setNewSplit1(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-border"
                  />
                  <span className="text-xs text-muted-foreground font-mono">
                    {newSplit1}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1 block">
                  Color 2
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newSplit2}
                    onChange={(e) => setNewSplit2(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-border"
                  />
                  <span className="text-xs text-muted-foreground font-mono">
                    {newSplit2}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Stroke color */}
          <div>
            <label className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-1 block">
              Stroke (optional)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newStroke || "#c8a44e"}
                onChange={(e) => setNewStroke(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-border"
              />
              {newStroke ? (
                <button
                  onClick={() => setNewStroke("")}
                  className="text-[10px] text-muted-foreground underline"
                >
                  Clear
                </button>
              ) : (
                <span className="text-[10px] text-muted-foreground">None</span>
              )}
            </div>
          </div>

          {/* Live preview */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-display uppercase tracking-wider text-muted-foreground">
              Preview
            </span>
            <SwatchPreview
              swatch={{
                hex_fallback: newHex,
                stroke_color: newStroke || null,
                is_split: newSplit,
                split_color_1: newSplit1,
                split_color_2: newSplit2,
              }}
              size={48}
            />
          </div>

          <Button
            onClick={handleAdd}
            disabled={adding || !newColor.trim()}
            size="sm"
            className="gap-1.5"
          >
            {adding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Add
          </Button>
        </div>
      </div>

      {/* ── Swatch grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {swatches.map((swatch) => {
          const isEditing = editId === swatch.id;

          return (
            <div
              key={swatch.id}
              className="border border-border rounded-lg p-3 space-y-3 bg-card"
            >
              {/* Preview */}
              <div className="flex items-center justify-center">
                <SwatchPreview
                  swatch={
                    isEditing
                      ? {
                          hex_fallback: editHex,
                          image_url: swatch.image_url,
                          stroke_color: editStroke || null,
                          is_split: editSplit,
                          split_color_1: editSplit1,
                          split_color_2: editSplit2,
                        }
                      : swatch
                  }
                />
              </div>

              {/* Name */}
              <p className="text-xs font-display uppercase tracking-wider text-center text-foreground truncate">
                {swatch.color_name}
              </p>

              {/* Edit panel */}
              {isEditing ? (
                <div className="space-y-2 border-t border-border pt-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`split-${swatch.id}`}
                      checked={editSplit}
                      onCheckedChange={setEditSplit}
                    />
                    <Label
                      htmlFor={`split-${swatch.id}`}
                      className="text-[10px] uppercase"
                    >
                      Split
                    </Label>
                  </div>
                  {!editSplit ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={editHex}
                        onChange={(e) => setEditHex(e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer border border-border"
                      />
                      <span className="text-[9px] font-mono text-muted-foreground">
                        Fill
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <input
                        type="color"
                        value={editSplit1}
                        onChange={(e) => setEditSplit1(e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer border border-border"
                      />
                      <input
                        type="color"
                        value={editSplit2}
                        onChange={(e) => setEditSplit2(e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer border border-border"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={editStroke || "#c8a44e"}
                      onChange={(e) => setEditStroke(e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border border-border"
                    />
                    {editStroke ? (
                      <button
                        onClick={() => setEditStroke("")}
                        className="text-[9px] text-muted-foreground underline"
                      >
                        Clear
                      </button>
                    ) : (
                      <span className="text-[9px] text-muted-foreground">
                        Stroke: none
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="text-[10px] h-6 px-2"
                      onClick={() => saveEdit(swatch)}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[10px] h-6 px-2"
                      onClick={() => setEditId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                /* Actions */
                <div className="flex items-center gap-1 justify-center">
                  <button
                    onClick={() => startEdit(swatch)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-display uppercase tracking-wider bg-secondary text-foreground hover:bg-accent transition-colors"
                    title="Edit colors"
                  >
                    <Palette className="w-3 h-3" />
                    Edit
                  </button>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(swatch, file);
                        e.target.value = "";
                      }}
                    />
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-display uppercase tracking-wider bg-secondary text-foreground hover:bg-accent transition-colors">
                      {uploadingId === swatch.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Upload className="w-3 h-3" />
                      )}
                      {swatch.image_url ? "Img" : "Img"}
                    </span>
                  </label>
                  <button
                    onClick={() => handleDelete(swatch)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {swatches.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm font-body">
          No swatches yet. Add a color name above to get started.
        </div>
      )}
    </div>
  );
}
