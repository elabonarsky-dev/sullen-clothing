import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { searchProducts, type SearchResultProduct } from "@/lib/shopify";
import {
  Search, X, CheckCircle2, Loader2, Package, LayoutGrid,
  Plus, Trash2, GripVertical, Image as ImageIcon, ArrowUp, ArrowDown,
  Upload, Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { isoToPacificLocal, pacificLocalToISO } from "@/lib/timezone";

type FeaturedType = "product" | "collection";

interface SlideRow {
  id: string;
  position: number;
  type: FeaturedType;
  handle: string;
  label: string | null;
  background_image_url: string | null;
  is_active: boolean;
  scheduled_from: string | null;
  scheduled_until: string | null;
}

const COLLECTION_OPTIONS = [
  { handle: "men", label: "Men's" },
  { handle: "lifestyle", label: "Lifestyle" },
  { handle: "artists", label: "Artists" },
  { handle: "new-arrivals", label: "New Arrivals" },
  { handle: "best-sellers", label: "Best Sellers" },
  { handle: "tees", label: "Tees" },
  { handle: "hats", label: "Headwear" },
  { handle: "hoodies-sweatshirts", label: "Hoodies & Sweatshirts" },
  { handle: "bottoms", label: "Bottoms" },
  { handle: "outerwear", label: "Outerwear" },
  { handle: "accessories", label: "Accessories" },
  { handle: "outlet", label: "Outlet" },
  { handle: "sullen-angels", label: "Sullen Angels" },
  { handle: "cherubs-capsule", label: "Cherubs Capsule" },
  { handle: "1-ton-tees", label: "1 Ton Tees" },
  { handle: "premium-tees", label: "Premium Tees" },
  { handle: "badge-week", label: "Badge Week" },
  { handle: "tanks", label: "Tanks" },
  { handle: "flannels", label: "Flannels" },
  { handle: "long-sleeves", label: "Long Sleeves" },
  { handle: "bro_oks", label: "BRO_OKS" },
  { handle: "new-hats", label: "New Hats" },
];

export function FeaturedProductSearch() {
  const [slides, setSlides] = useState<SlideRow[]>([]);
  const [loadingSlides, setLoadingSlides] = useState(true);
  const [saving, setSaving] = useState(false);

  // For adding new slides
  const [addMode, setAddMode] = useState<FeaturedType | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load slides
  useEffect(() => {
    loadSlides();
  }, []);

  async function loadSlides() {
    setLoadingSlides(true);
    const { data } = await supabase
      .from("featured_slides")
      .select("*")
      .order("position", { ascending: true });
    setSlides((data as SlideRow[]) || []);
    setLoadingSlides(false);
  }

  // Product search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchProducts(query, 8);
        setResults(res);
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const addSlide = async (type: FeaturedType, handle: string, label: string) => {
    setSaving(true);
    const nextPos = slides.length;
    const { error } = await supabase.from("featured_slides").insert({
      type,
      handle,
      label,
      position: nextPos,
      is_active: true,
    });
    if (error) {
      toast.error("Failed to add: " + error.message);
    } else {
      toast.success(`Added ${label || handle}`);
      setAddMode(null);
      setQuery("");
      setResults([]);
      await loadSlides();
    }
    setSaving(false);
  };

  const removeSlide = async (id: string) => {
    setSaving(true);
    await supabase.from("featured_slides").delete().eq("id", id);
    toast.success("Slide removed");
    await loadSlides();
    setSaving(false);
  };

  const moveSlide = async (id: string, direction: "up" | "down") => {
    const idx = slides.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= slides.length) return;

    setSaving(true);
    const a = slides[idx];
    const b = slides[swapIdx];

    await Promise.all([
      supabase.from("featured_slides").update({ position: b.position }).eq("id", a.id),
      supabase.from("featured_slides").update({ position: a.position }).eq("id", b.id),
    ]);
    await loadSlides();
    setSaving(false);
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    setSaving(true);
    await supabase.from("featured_slides").update({ is_active: !currentActive }).eq("id", id);
    await loadSlides();
    setSaving(false);
  };

  const updateBgImage = async (id: string, url: string | null) => {
    setSaving(true);
    const { error } = await supabase
      .from("featured_slides")
      .update({ background_image_url: url })
      .eq("id", id);
    if (error) {
      toast.error("Failed to save image URL");
    } else {
      toast.success("Background image updated");
      await loadSlides();
    }
    setSaving(false);
  };

  const updateSchedule = async (id: string, from: string | null, until: string | null) => {
    setSaving(true);
    const { error } = await supabase
      .from("featured_slides")
      .update({ scheduled_from: from, scheduled_until: until } as any)
      .eq("id", id);
    if (error) toast.error("Failed to save schedule");
    else { toast.success("Schedule updated"); await loadSlides(); }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-card border border-border rounded-lg space-y-4">
        <h3 className="font-display text-xs uppercase tracking-wider text-foreground">
          Featured Slides
        </h3>
        <p className="text-[11px] text-muted-foreground font-body">
          Add multiple featured products and collections. They cycle like the hero slider.
        </p>

        {/* Current slides list */}
        {loadingSlides ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading…
          </div>
        ) : slides.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No featured slides yet.</p>
        ) : (
          <div className="space-y-2">
            {slides.map((s, idx) => (
              <SlideCard
                key={s.id}
                slide={s}
                index={idx}
                total={slides.length}
                saving={saving}
                onRemove={() => removeSlide(s.id)}
                onMove={(dir) => moveSlide(s.id, dir)}
                onToggle={() => toggleActive(s.id, s.is_active)}
                onBgUpdate={(url) => updateBgImage(s.id, url)}
                onScheduleUpdate={(from, until) => updateSchedule(s.id, from, until)}
              />
            ))}
          </div>
        )}

        {/* Add new slide */}
        {!addMode ? (
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setAddMode("product")}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-xs font-display uppercase tracking-wider rounded-sm border border-dashed border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-all"
            >
              <Plus className="w-3 h-3" />
              <Package className="w-3.5 h-3.5" />
              Add Product
            </button>
            <button
              onClick={() => setAddMode("collection")}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-xs font-display uppercase tracking-wider rounded-sm border border-dashed border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-all"
            >
              <Plus className="w-3 h-3" />
              <LayoutGrid className="w-3.5 h-3.5" />
              Add Collection
            </button>
          </div>
        ) : (
          <div className="p-3 border border-primary/30 rounded-sm bg-primary/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-display uppercase tracking-wider text-foreground">
                Add {addMode === "product" ? "Product" : "Collection"}
              </span>
              <button onClick={() => { setAddMode(null); setQuery(""); setResults([]); }}
                className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {addMode === "product" ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search products…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-sm text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />}
                </div>
                {results.length > 0 && (
                  <div className="border border-border rounded-sm divide-y divide-border max-h-60 overflow-y-auto">
                    {results.map((p) => {
                      const img = p.images.edges[0]?.node.url;
                      const price = parseFloat(p.priceRange.minVariantPrice.amount).toFixed(2);
                      return (
                        <button
                          key={p.id}
                          onClick={() => addSlide("product", p.handle, p.title)}
                          disabled={saving}
                          className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary transition-colors"
                        >
                          {img && (
                            <div className="w-10 h-10 rounded overflow-hidden bg-secondary flex-shrink-0">
                              <img src={img} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-body text-foreground truncate">{p.title}</p>
                            <p className="text-xs text-muted-foreground font-body">${price}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                {/* Custom handle input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Or type a collection handle…"
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-sm text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) {
                          addSlide("collection", val, val);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }
                    }}
                  />
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">Press Enter</span>
                </div>
                <div className="border border-border rounded-sm divide-y divide-border max-h-60 overflow-y-auto">
                {COLLECTION_OPTIONS.filter((c) => !query || c.label.toLowerCase().includes(query.toLowerCase()) || c.handle.toLowerCase().includes(query.toLowerCase())).map((c) => (
                  <button
                    key={c.handle}
                    onClick={() => addSlide("collection", c.handle, c.label)}
                    disabled={saving}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary transition-colors"
                  >
                    <LayoutGrid className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm font-body text-foreground">{c.label}</p>
                  </button>
                ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SlideCard({
  slide,
  index,
  total,
  saving,
  onRemove,
  onMove,
  onToggle,
  onBgUpdate,
  onScheduleUpdate,
}: {
  slide: SlideRow;
  index: number;
  total: number;
  saving: boolean;
  onRemove: () => void;
  onMove: (dir: "up" | "down") => void;
  onToggle: () => void;
  onBgUpdate: (url: string | null) => void;
  onScheduleUpdate: (from: string | null, until: string | null) => void;
}) {
  const [showBgInput, setShowBgInput] = useState(false);
  const [bgUrl, setBgUrl] = useState(slide.background_image_url || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `featured-bg/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("marketing-images")
      .upload(path, file, { upsert: true });
    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage
      .from("marketing-images")
      .getPublicUrl(path);
    const publicUrl = urlData.publicUrl;
    setBgUrl(publicUrl);
    onBgUpdate(publicUrl);
    setUploading(false);
    toast.success("Background image uploaded!");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isCollection = slide.type === "collection";
  const icon = isCollection ? (
    <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground" />
  ) : (
    <Package className="w-3.5 h-3.5 text-muted-foreground" />
  );

  return (
    <div
      className={`p-3 border rounded-sm transition-all ${
        slide.is_active ? "border-border bg-card" : "border-border/50 bg-card/50 opacity-60"
      }`}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
        {icon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-body text-foreground truncate">
            {slide.label || slide.handle}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {slide.type} • Position {index + 1}
          </p>
        </div>

        {/* Reorder */}
        <button
          onClick={() => onMove("up")}
          disabled={saving || index === 0}
          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onMove("down")}
          disabled={saving || index === total - 1}
          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>

        {/* BG image (collections only) */}
        {isCollection && (
          <button
            onClick={() => setShowBgInput(!showBgInput)}
            className={`p-1 transition-colors ${
              slide.background_image_url
                ? "text-green-500 hover:text-green-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Background image"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Toggle active */}
        <button
          onClick={onToggle}
          disabled={saving}
          className={`px-2 py-1 text-[10px] font-display uppercase tracking-wider rounded-sm border transition-all ${
            slide.is_active
              ? "border-green-500/30 text-green-500 bg-green-500/10"
              : "border-border text-muted-foreground"
          }`}
        >
          {slide.is_active ? "On" : "Off"}
        </button>

        {/* Delete */}
        <button
          onClick={onRemove}
          disabled={saving}
          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Background image upload + URL input */}
      {showBgInput && isCollection && (
        <div className="mt-3 space-y-2">
          {/* File upload */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-display uppercase tracking-wider bg-secondary text-foreground rounded-sm border border-border hover:bg-secondary/80 transition-all"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {uploading ? "Uploading…" : "Upload Image"}
            </button>
            <span className="text-[10px] text-muted-foreground">or paste URL below</span>
          </div>
          {/* URL input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={bgUrl}
              onChange={(e) => setBgUrl(e.target.value)}
              placeholder="Paste background image URL…"
              className="flex-1 px-3 py-2 bg-background border border-border rounded-sm text-foreground font-body text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={() => onBgUpdate(bgUrl || null)}
              disabled={saving}
              className="px-3 py-2 text-xs font-display uppercase tracking-wider bg-primary text-primary-foreground rounded-sm hover:opacity-90 transition-opacity"
            >
              Save
            </button>
            {slide.background_image_url && (
              <button
                onClick={() => { setBgUrl(""); onBgUpdate(null); }}
                disabled={saving}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Schedule */}
      <div className="mt-2 flex items-center gap-3 flex-wrap">
        <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] text-muted-foreground font-body">From</label>
          <input
            type="datetime-local"
            value={isoToPacificLocal(slide.scheduled_from)}
            onChange={(e) => onScheduleUpdate(e.target.value ? pacificLocalToISO(e.target.value) : null, slide.scheduled_until)}
            className="px-2 py-1 bg-background border border-border rounded-sm text-foreground font-body text-[11px] focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] text-muted-foreground font-body">Until</label>
          <input
            type="datetime-local"
            value={isoToPacificLocal(slide.scheduled_until)}
            onChange={(e) => onScheduleUpdate(slide.scheduled_from, e.target.value ? pacificLocalToISO(e.target.value) : null)}
            className="px-2 py-1 bg-background border border-border rounded-sm text-foreground font-body text-[11px] focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        {(slide.scheduled_from || slide.scheduled_until) && (
          <button onClick={() => onScheduleUpdate(null, null)} className="text-[10px] text-destructive hover:underline font-body">Clear</button>
        )}
      </div>
    </div>
  );
}
