import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Upload, Trash2, Eye, EyeOff, Save, RefreshCw, Smartphone,
  CheckCircle2, Loader2, Send, Link as LinkIcon, ArrowUp, ArrowDown, Palette,
  Calendar, Video,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { artistProducts } from "@/data/artists";
import { directoryArtists } from "@/data/artistDirectory";
import { FeaturedProductSearch } from "@/components/admin/FeaturedProductSearch";
import { isoToPacificLocal, pacificLocalToISO } from "@/lib/timezone";

type MarketingImage = Database["public"]["Tables"]["marketing_images"]["Row"];
type Slot = Database["public"]["Enums"]["marketing_image_slot"];

const SLOT_LABELS: Record<Slot, string> = {
  hero_slider: "Hero Slider",
  collection_row: "Collections Row",
  featured_product: "Featured Product",
  category_link: "Category Links",
  mega_menu_featured: "Mega Menu Featured",
  cart_banner: "Cart Banner",
};

const SLOT_DESCRIPTIONS: Record<Slot, string> = {
  hero_slider: "Full-width banner images on the homepage slider",
  collection_row: "Collection thumbnails in the scrollable row",
  featured_product: "Featured product section images",
  category_link: "Circular category images on the homepage",
  mega_menu_featured: "Featured images in the desktop mega menu",
  cart_banner: "Promotional banner displayed at the top of the cart drawer",
};

interface SmartLink {
  label: string;
  value: string;
  category: string;
}

const COLLECTION_LINKS: SmartLink[] = [
  { label: "New Releases", value: "/collections/new-releases", category: "Collection" },
  { label: "Best Sellers", value: "/collections/best-sellers", category: "Collection" },
  { label: "Men's", value: "/collections/men", category: "Collection" },
  { label: "Lifestyle", value: "/collections/lifestyle", category: "Collection" },
  { label: "Artists Directory", value: "/collections/artists", category: "Page" },
  { label: "About Us", value: "/pages/about-us", category: "Page" },
  { label: "Reviews", value: "/pages/reviews", category: "Page" },
  { label: "Rewards", value: "/pages/rewards", category: "Page" },
  { label: "FAQ", value: "/pages/faq", category: "Page" },
  { label: "Cherubs Capsule", value: "/collections/cherubs-capsule", category: "Collection" },
  { label: "1 Ton Tees", value: "/collections/1-ton-tees", category: "Collection" },
  { label: "Premium Tees", value: "/collections/premium-tees", category: "Collection" },
  { label: "Standard Tees", value: "/collections/standard-tees", category: "Collection" },
  { label: "Hoodies", value: "/collections/hoodies", category: "Collection" },
  { label: "Headwear", value: "/collections/hats", category: "Collection" },
  { label: "Accessories", value: "/collections/accessories", category: "Collection" },
  { label: "Badge Week", value: "/collections/badge-week", category: "Collection" },
  { label: "Tanks", value: "/collections/tanks", category: "Collection" },
  { label: "Flannels", value: "/collections/flannels", category: "Collection" },
  { label: "Shorts", value: "/collections/shorts", category: "Collection" },
  { label: "Joggers", value: "/collections/joggers", category: "Collection" },
  { label: "Women's", value: "/collections/women", category: "Collection" },
];

export function MarketingManager() {
  const [activeSlot, setActiveSlot] = useState<Slot>("hero_slider");
  const [images, setImages] = useState<MarketingImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [linkSearches, setLinkSearches] = useState<Record<string, string>>({});
  const [focusedLinkId, setFocusedLinkId] = useState<string | null>(null);
  const [siteThemes, setSiteThemes] = useState<{ id: string; name: string; label: string; description: string | null; is_active: boolean }[]>([]);
  const [togglingTheme, setTogglingTheme] = useState<string | null>(null);

  const allSmartLinks = useMemo<SmartLink[]>(() => {
    const artistLinks: SmartLink[] = [];
    const seen = new Set<string>();
    for (const a of artistProducts) {
      if (!seen.has(a.slug)) {
        seen.add(a.slug);
        artistLinks.push({ label: a.artistName, value: `/artist/${a.slug}/shop`, category: "Artist Product" });
      }
      if (a.shopifyHandle) {
        artistLinks.push({ label: `${a.artistName} (Product)`, value: `/product/${a.shopifyHandle}`, category: "Product" });
      }
    }
    for (const a of directoryArtists) {
      if (!seen.has(a.slug)) {
        seen.add(a.slug);
        artistLinks.push({ label: a.name, value: `/artist/${a.slug}/shop`, category: "Artist Product" });
      }
    }
    return [...COLLECTION_LINKS, ...artistLinks];
  }, []);

  useEffect(() => {
    fetchImages();
    fetchThemes();
  }, [activeSlot]);

  const fetchImages = async () => {
    setLoadingImages(true);
    setDirtyIds(new Set());
    const { data, error } = await supabase
      .from("marketing_images")
      .select("*")
      .eq("slot", activeSlot)
      .order("position", { ascending: true });
    if (error) toast.error(error.message);
    else {
      setImages(data || []);
      setPublishedIds(new Set((data || []).filter((img) => img.is_active).map((img) => img.id)));
    }
    setLoadingImages(false);
  };

  const fetchThemes = async () => {
    const { data } = await supabase
      .from("site_themes")
      .select("id, name, label, description, is_active")
      .order("name");
    if (data) setSiteThemes(data);
  };

  const toggleSiteTheme = async (themeId: string, themeName: string) => {
    setTogglingTheme(themeId);
    const otherThemes = siteThemes.filter((t) => t.id !== themeId && t.is_active);
    for (const t of otherThemes) {
      await supabase.from("site_themes").update({ is_active: false }).eq("id", t.id);
    }
    await supabase.from("site_themes").update({ is_active: true }).eq("id", themeId);
    await fetchThemes();
    toast.success(themeName === "default" ? "Reverted to default theme" : `${themeName} theme is now live!`);
    setTogglingTheme(null);
  };

  const handleSyncStories = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("sync-artist-stories");
      if (error) toast.error("Sync failed: " + error.message);
      else if (data?.success) { toast.success(data.message); setSyncResult(data.message); }
      else toast.error(data?.error || "Sync failed");
    } catch { toast.error("Sync request failed"); }
    finally { setSyncing(false); }
  };

  const markDirty = (id: string) => {
    setDirtyIds((prev) => new Set(prev).add(id));
    setPublishedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  const handlePublishAll = async () => {
    setPublishing(true);
    const results: string[] = [];
    for (const img of images) {
      const { error } = await supabase
        .from("marketing_images")
        .update({
          title: img.title, subtitle: img.subtitle, link_href: img.link_href,
          alt_text: img.alt_text, mobile_image_url: img.mobile_image_url, is_active: img.is_active,
          scheduled_from: (img as any).scheduled_from || null,
          scheduled_until: (img as any).scheduled_until || null,
          video_url: (img as any).video_url || null,
          mobile_video_url: (img as any).mobile_video_url || null,
        } as any)
        .eq("id", img.id);
      if (error) toast.error(`Failed to publish: ${img.title || img.alt_text || img.id}`);
      else results.push(img.id);
    }
    setPublishedIds(new Set(results));
    setDirtyIds(new Set());
    toast.success(`${results.length} image${results.length !== 1 ? "s" : ""} published!`);
    setPublishing(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${activeSlot}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("marketing-images").upload(path, file, { upsert: true });
    if (uploadError) { toast.error(uploadError.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("marketing-images").getPublicUrl(path);
    const { error: insertError } = await supabase.from("marketing_images").insert({ slot: activeSlot, image_url: publicUrl, position: images.length, title: "", alt_text: file.name });
    if (insertError) toast.error(insertError.message);
    else { toast.success("Image uploaded!"); fetchImages(); }
    setUploading(false);
    e.target.value = "";
  };

  const updateImage = async (id: string, updates: Partial<MarketingImage>) => {
    const { error } = await supabase.from("marketing_images").update(updates).eq("id", id);
    if (error) toast.error(error.message);
    else setImages((prev) => prev.map((img) => (img.id === id ? { ...img, ...updates } : img)));
  };

  const deleteImage = async (id: string) => {
    const { error } = await supabase.from("marketing_images").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Image deleted"); setImages((prev) => prev.filter((img) => img.id !== id)); }
  };

  const moveImage = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= images.length) return;
    const updated = [...images];
    const posA = updated[index].position;
    const posB = updated[swapIndex].position;
    updated[index] = { ...updated[index], position: posB };
    updated[swapIndex] = { ...updated[swapIndex], position: posA };
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    setImages(updated);
    const { error: e1 } = await supabase.from("marketing_images").update({ position: posB }).eq("id", images[index].id);
    const { error: e2 } = await supabase.from("marketing_images").update({ position: posA }).eq("id", images[swapIndex].id);
    if (e1 || e2) toast.error("Failed to reorder");
    else toast.success("Order updated");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar - slot tabs */}
      <div className="lg:w-64 flex-shrink-0">
        <nav className="space-y-1">
          {(Object.entries(SLOT_LABELS) as [Slot, string][]).map(([slot, label]) => (
            <button
              key={slot}
              onClick={() => setActiveSlot(slot)}
              className={`w-full text-left px-4 py-3 rounded-lg font-display text-xs uppercase tracking-wider transition-all ${
                activeSlot === slot
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-card"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Artist Story Sync */}
        <div className="mt-8 p-4 bg-card border border-border rounded-lg space-y-3">
          <h3 className="font-display text-xs uppercase tracking-wider text-foreground">Artist Stories</h3>
          <p className="text-[11px] text-muted-foreground font-body leading-relaxed">Pull new artist stories from the Sullen blog automatically.</p>
          <button onClick={handleSyncStories} disabled={syncing} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-display text-xs uppercase tracking-[0.15em] rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Stories"}
          </button>
          {syncResult && <p className="text-[11px] text-primary font-body">{syncResult}</p>}
        </div>

        {/* Site Theme Selector */}
        <div className="mt-6 p-4 bg-card border border-border rounded-lg space-y-3">
          <h3 className="font-display text-xs uppercase tracking-wider text-foreground flex items-center gap-2">
            <Palette className="w-3.5 h-3.5" /> Site Theme
          </h3>
          <p className="text-[11px] text-muted-foreground font-body leading-relaxed">Activate a seasonal theme to transform the entire site.</p>
          <div className="space-y-2">
            {siteThemes.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleSiteTheme(t.id, t.name)}
                disabled={togglingTheme !== null}
                className={`w-full text-left px-3 py-2.5 rounded-sm border transition-all ${
                  t.is_active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs uppercase tracking-wider">{t.label}</span>
                  {t.is_active && (
                    <span className="flex items-center gap-1 text-[9px] font-display uppercase tracking-wider text-primary">
                      <CheckCircle2 className="w-3 h-3" /> Live
                    </span>
                  )}
                </div>
                {t.description && <p className="text-[10px] font-body mt-0.5 opacity-70">{t.description}</p>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        <div className="mb-6">
          <h2 className="font-display text-xl uppercase tracking-wider text-foreground">{SLOT_LABELS[activeSlot]}</h2>
          <p className="text-sm text-muted-foreground font-body mt-1">{SLOT_DESCRIPTIONS[activeSlot]}</p>
        </div>

        {/* Live hero preview */}
        {activeSlot === "hero_slider" && images.filter((i) => i.is_active).length > 0 && (() => {
          const activeImages = images.filter((i) => i.is_active);
          return (
            <div className="mb-8">
              <h3 className="font-display text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
                <Eye className="w-3.5 h-3.5" /> Live Preview — {activeImages.length} banner{activeImages.length !== 1 ? "s" : ""} active
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {activeImages.map((img, idx) => (
                  <div key={img.id} className="relative rounded-lg overflow-hidden border border-border bg-secondary aspect-[16/9] group">
                    {(img as any).video_url ? (
                      <video src={(img as any).video_url} muted playsInline className="w-full h-full object-cover" />
                    ) : (
                      <img src={img.image_url} alt={img.alt_text || img.title || "Hero banner"} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      {img.subtitle && <p className="text-white/60 text-[8px] font-condensed uppercase tracking-[0.15em]">{img.subtitle}</p>}
                      {img.title && <p className="text-white font-display text-sm uppercase tracking-wider leading-tight">{img.title}</p>}
                    </div>
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                      <span className="px-1.5 py-0.5 bg-foreground/80 text-background text-[8px] font-display uppercase tracking-wider rounded-sm">{idx + 1}</span>
                      {(img as any).video_url && <span className="px-1.5 py-0.5 bg-purple-600/90 text-white text-[8px] font-display uppercase tracking-wider rounded-sm flex items-center gap-0.5"><Video className="w-2.5 h-2.5" /> Video</span>}
                    </div>
                    <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[7px] font-body rounded-sm flex items-center gap-0.5 max-w-[60%] ${img.link_href ? "bg-primary/90 text-primary-foreground" : "bg-destructive/80 text-white"}`}>
                      <LinkIcon className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="truncate">{img.link_href ? (allSmartLinks.find((l) => l.value === img.link_href)?.label || img.link_href) : "No link set"}</span>
                    </div>
                    {img.mobile_image_url && <div className="absolute bottom-1.5 right-1.5"><Smartphone className="w-3 h-3 text-white/60" /></div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Featured product search */}
        {activeSlot === "featured_product" && (
          <div className="mb-6"><FeaturedProductSearch /></div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 mb-6">
          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-display text-xs uppercase tracking-[0.2em] cursor-pointer hover:bg-primary/90 transition-colors rounded-sm">
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload Image"}
            <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
          </label>
          {activeSlot === "hero_slider" && (
            <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-display text-xs uppercase tracking-[0.2em] cursor-pointer hover:bg-purple-700 transition-colors rounded-sm">
              <Video className="w-4 h-4" />
              {uploading ? "Uploading..." : "Upload Video"}
              <input type="file" accept="video/mp4,video/webm" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 15 * 1024 * 1024) { toast.error("Video must be under 15MB"); return; }
                setUploading(true);
                const ext = file.name.split(".").pop();
                const path = `${activeSlot}/video-${Date.now()}.${ext}`;
                const { error: uploadError } = await supabase.storage.from("marketing-images").upload(path, file, { upsert: true });
                if (uploadError) { toast.error(uploadError.message); setUploading(false); return; }
                const { data: { publicUrl } } = supabase.storage.from("marketing-images").getPublicUrl(path);
                const { error: insertError } = await supabase.from("marketing_images").insert({
                  slot: activeSlot, image_url: publicUrl, position: images.length,
                  title: "", alt_text: file.name, video_url: publicUrl,
                } as any);
                if (insertError) toast.error(insertError.message);
                else { toast.success("Video uploaded!"); fetchImages(); }
                setUploading(false);
                e.target.value = "";
              }} disabled={uploading} className="hidden" />
            </label>
          )}
          {images.length > 0 && (
            <button onClick={handlePublishAll} disabled={publishing} className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white font-display text-xs uppercase tracking-[0.2em] hover:bg-green-700 transition-colors rounded-sm disabled:opacity-50">
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {publishing ? "Publishing..." : "Publish All"}
            </button>
          )}
        </div>

        {/* Images list */}
        {loadingImages ? (
          <p className="text-muted-foreground font-body py-8 text-center">Loading...</p>
        ) : images.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-lg py-16 text-center">
            <p className="text-muted-foreground font-body">No images yet. Upload one to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className={`relative flex items-start gap-4 p-4 bg-card border rounded-lg transition-colors ${
                  publishedIds.has(img.id) ? "border-green-500/50 bg-green-500/5" : dirtyIds.has(img.id) ? "border-amber-500/50" : "border-border"
                }`}
              >
                {/* Reorder */}
                <div className="flex flex-col items-center gap-1 pt-2">
                  <button onClick={() => moveImage(idx, "up")} disabled={idx === 0} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors" title="Move up"><ArrowUp className="w-4 h-4" /></button>
                  <span className="text-[10px] font-display text-muted-foreground">{idx + 1}</span>
                  <button onClick={() => moveImage(idx, "down")} disabled={idx === images.length - 1} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors" title="Move down"><ArrowDown className="w-4 h-4" /></button>
                </div>

                {/* Badges */}
                {publishedIds.has(img.id) && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white text-[10px] font-display uppercase tracking-wider rounded-sm"><CheckCircle2 className="w-3 h-3" /> Live</div>
                )}
                {dirtyIds.has(img.id) && !publishedIds.has(img.id) && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-display uppercase tracking-wider rounded-sm">Unsaved</div>
                )}

                {/* Thumbnails */}
                <div className="flex-shrink-0 space-y-2">
                  <div className="relative w-32 h-20 rounded overflow-hidden bg-secondary">
                    <img src={img.image_url} alt={img.alt_text || ""} className="w-full h-full object-cover" />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/50 cursor-pointer transition-colors group">
                      <Upload className="w-4 h-4 text-transparent group-hover:text-white transition-colors" />
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const ext = file.name.split(".").pop();
                        const path = `${activeSlot}/web-${Date.now()}.${ext}`;
                        const { error: uploadError } = await supabase.storage.from("marketing-images").upload(path, file, { upsert: true });
                        if (uploadError) { toast.error(uploadError.message); return; }
                        const { data: { publicUrl } } = supabase.storage.from("marketing-images").getPublicUrl(path);
                        await updateImage(img.id, { image_url: publicUrl });
                        toast.success("Web banner image updated!");
                        e.target.value = "";
                      }} />
                    </label>
                  </div>
                  <div className="relative w-32 h-20 rounded overflow-hidden bg-secondary border border-dashed border-border">
                    {img.mobile_image_url ? (
                      <img src={img.mobile_image_url} alt={`${img.alt_text || ""} (mobile)`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50">
                        <Smartphone className="w-4 h-4 mb-0.5" />
                        <span className="text-[9px] font-body">No mobile</span>
                      </div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/50 cursor-pointer transition-colors group">
                      <Upload className="w-4 h-4 text-transparent group-hover:text-white transition-colors" />
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const ext = file.name.split(".").pop();
                        const path = `${activeSlot}/mobile-${Date.now()}.${ext}`;
                        const { error: uploadError } = await supabase.storage.from("marketing-images").upload(path, file, { upsert: true });
                        if (uploadError) { toast.error(uploadError.message); return; }
                        const { data: { publicUrl } } = supabase.storage.from("marketing-images").getPublicUrl(path);
                        await updateImage(img.id, { mobile_image_url: publicUrl });
                        toast.success("Mobile image uploaded!");
                        e.target.value = "";
                      }} />
                    </label>
                  </div>
                </div>

                {/* Fields */}
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input type="text" placeholder="Title" value={img.title || ""} onChange={(e) => { markDirty(img.id); setImages((prev) => prev.map((i) => i.id === img.id ? { ...i, title: e.target.value } : i)); }} className="px-3 py-2 bg-background border border-border rounded-sm text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                    <input type="text" placeholder="Subtitle / Label" value={img.subtitle || ""} onChange={(e) => { markDirty(img.id); setImages((prev) => prev.map((i) => i.id === img.id ? { ...i, subtitle: e.target.value } : i)); }} className="px-3 py-2 bg-background border border-border rounded-sm text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Type to search links (e.g. Zach, Cherub, New Releases...)"
                        value={linkSearches[img.id] !== undefined ? linkSearches[img.id] : (img.link_href || "")}
                        onFocus={() => setFocusedLinkId(img.id)}
                        onBlur={() => setTimeout(() => setFocusedLinkId(null), 200)}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLinkSearches((prev) => ({ ...prev, [img.id]: val }));
                          markDirty(img.id);
                          setImages((prev) => prev.map((i) => i.id === img.id ? { ...i, link_href: val } : i));
                        }}
                        className="w-full px-3 py-2 bg-background border border-border rounded-sm text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {focusedLinkId === img.id && (() => {
                        const query = (linkSearches[img.id] ?? img.link_href ?? "").toLowerCase();
                        const filtered = query.length > 0
                          ? allSmartLinks.filter((l) => l.label.toLowerCase().includes(query) || l.value.toLowerCase().includes(query))
                          : allSmartLinks.slice(0, 10);
                        if (filtered.length === 0) return null;
                        const grouped: Record<string, SmartLink[]> = {};
                        for (const link of filtered.slice(0, 15)) { (grouped[link.category] ??= []).push(link); }
                        return (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                            {Object.entries(grouped).map(([cat, links]) => (
                              <div key={cat}>
                                <div className="px-3 py-1.5 text-[9px] font-display uppercase tracking-widest text-muted-foreground bg-secondary/50 sticky top-0">{cat}</div>
                                {links.map((link) => (
                                  <button key={link.value} type="button" onMouseDown={(e) => {
                                    e.preventDefault();
                                    markDirty(img.id);
                                    setImages((prev) => prev.map((i) => i.id === img.id ? { ...i, link_href: link.value } : i));
                                    setLinkSearches((prev) => ({ ...prev, [img.id]: link.value }));
                                    setFocusedLinkId(null);
                                  }} className={`w-full text-left px-3 py-2 text-sm font-body hover:bg-secondary transition-colors flex items-center justify-between ${img.link_href === link.value ? "text-primary" : "text-foreground"}`}>
                                    <span>{link.label}</span>
                                    <span className="text-[10px] text-muted-foreground ml-2 truncate max-w-[140px]">{link.value}</span>
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                      {img.link_href && (
                        <p className="mt-0.5 text-[10px] text-muted-foreground font-body flex items-center gap-1">
                          <LinkIcon className="w-3 h-3" /> Links to: {allSmartLinks.find((l) => l.value === img.link_href)?.label || img.link_href}
                        </p>
                      )}
                    </div>
                    <input type="text" placeholder="Alt text" value={img.alt_text || ""} onChange={(e) => { markDirty(img.id); setImages((prev) => prev.map((i) => i.id === img.id ? { ...i, alt_text: e.target.value } : i)); }} className="px-3 py-2 bg-background border border-border rounded-sm text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  {img.mobile_image_url && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-body flex items-center gap-1"><Smartphone className="w-3 h-3" /> Mobile image set</span>
                      <button onClick={() => updateImage(img.id, { mobile_image_url: null })} className="text-[10px] text-destructive hover:underline font-body">Remove</button>
                    </div>
                  )}
                  {/* Schedule */}
                  <div className="flex items-center gap-3 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] text-muted-foreground font-body">From</label>
                      <input
                        type="datetime-local"
                        value={isoToPacificLocal((img as any).scheduled_from)}
                        onChange={(e) => {
                          markDirty(img.id);
                          setImages((prev) => prev.map((i) => i.id === img.id ? { ...i, scheduled_from: e.target.value ? pacificLocalToISO(e.target.value) : null } as any : i));
                        }}
                        className="px-2 py-1 bg-background border border-border rounded-sm text-foreground font-body text-[11px] focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] text-muted-foreground font-body">Until</label>
                      <input
                        type="datetime-local"
                        value={isoToPacificLocal((img as any).scheduled_until)}
                        onChange={(e) => {
                          markDirty(img.id);
                          setImages((prev) => prev.map((i) => i.id === img.id ? { ...i, scheduled_until: e.target.value ? pacificLocalToISO(e.target.value) : null } as any : i));
                        }}
                        className="px-2 py-1 bg-background border border-border rounded-sm text-foreground font-body text-[11px] focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    {((img as any).scheduled_from || (img as any).scheduled_until) && (
                      <button
                        onClick={() => {
                          markDirty(img.id);
                          setImages((prev) => prev.map((i) => i.id === img.id ? { ...i, scheduled_from: null, scheduled_until: null } as any : i));
                        }}
                        className="text-[10px] text-destructive hover:underline font-body"
                      >Clear</button>
                    )}
                  </div>
                  {/* Video URL fields (hero_slider only) */}
                  {activeSlot === "hero_slider" && (
                    <div className="flex items-center gap-3 mt-1">
                      <Video className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Video URL (mp4) — leave empty for image-only"
                        value={(img as any).video_url || ""}
                        onChange={(e) => {
                          markDirty(img.id);
                          setImages((prev) => prev.map((i) => i.id === img.id ? { ...i, video_url: e.target.value || null } as any : i));
                        }}
                        className="flex-1 px-3 py-1.5 bg-background border border-border rounded-sm text-foreground font-body text-[11px] focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <input
                        type="text"
                        placeholder="Mobile video URL (optional)"
                        value={(img as any).mobile_video_url || ""}
                        onChange={(e) => {
                          markDirty(img.id);
                          setImages((prev) => prev.map((i) => i.id === img.id ? { ...i, mobile_video_url: e.target.value || null } as any : i));
                        }}
                        className="flex-1 px-3 py-1.5 bg-background border border-border rounded-sm text-foreground font-body text-[11px] focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {(img as any).video_url && (
                        <button
                          onClick={() => {
                            markDirty(img.id);
                            setImages((prev) => prev.map((i) => i.id === img.id ? { ...i, video_url: null, mobile_video_url: null } as any : i));
                          }}
                          className="text-[10px] text-destructive hover:underline font-body"
                        >Clear</button>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5">
                  <button onClick={async () => {
                    const { error } = await supabase.from("marketing_images").update({
                      title: img.title, subtitle: img.subtitle, link_href: img.link_href, alt_text: img.alt_text, mobile_image_url: img.mobile_image_url,
                      scheduled_from: (img as any).scheduled_from || null,
                      scheduled_until: (img as any).scheduled_until || null,
                      video_url: (img as any).video_url || null,
                      mobile_video_url: (img as any).mobile_video_url || null,
                    } as any).eq("id", img.id);
                    if (error) toast.error("Save failed: " + error.message);
                    else { toast.success(`"${img.title || img.alt_text}" saved!`); setDirtyIds((prev) => { const next = new Set(prev); next.delete(img.id); return next; }); setPublishedIds((prev) => new Set(prev).add(img.id)); }
                  }} className="p-2 text-muted-foreground hover:text-primary transition-colors" title="Save changes"><Save className="w-4 h-4" /></button>
                  <button onClick={() => updateImage(img.id, { is_active: !img.is_active })} className={`p-2 transition-colors ${img.is_active ? "text-green-500 hover:text-green-400" : "text-muted-foreground hover:text-foreground"}`} title={img.is_active ? "Deactivate" : "Activate"}>
                    {img.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => deleteImage(img.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
