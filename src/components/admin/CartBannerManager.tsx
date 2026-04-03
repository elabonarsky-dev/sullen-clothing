import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Trash2, Eye, EyeOff, Save, Loader2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Database } from "@/integrations/supabase/types";

type MarketingImage = Database["public"]["Tables"]["marketing_images"]["Row"];

export function CartBannerManager() {
  const [banners, setBanners] = useState<MarketingImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New banner form
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newAltText, setNewAltText] = useState("");
  const [newLinkHref, setNewLinkHref] = useState("");

  const fetchBanners = async () => {
    const { data, error } = await supabase
      .from("marketing_images")
      .select("*")
      .eq("slot", "cart_banner")
      .order("position", { ascending: true });

    if (error) {
      toast.error("Failed to load cart banners");
      console.error(error);
    } else {
      setBanners(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleAdd = async () => {
    if (!newImageUrl.trim()) {
      toast.error("Image URL is required");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("marketing_images").insert({
      slot: "cart_banner" as any,
      image_url: newImageUrl.trim(),
      alt_text: newAltText.trim() || null,
      link_href: newLinkHref.trim() || null,
      is_active: true,
      position: banners.length,
    });

    if (error) {
      toast.error("Failed to add banner");
      console.error(error);
    } else {
      toast.success("Cart banner added");
      setNewImageUrl("");
      setNewAltText("");
      setNewLinkHref("");
      fetchBanners();
    }
    setSaving(false);
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    // If activating, deactivate all others first
    if (isActive) {
      await supabase
        .from("marketing_images")
        .update({ is_active: false })
        .eq("slot", "cart_banner");
    }

    const { error } = await supabase
      .from("marketing_images")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update banner");
    } else {
      toast.success(isActive ? "Banner activated" : "Banner deactivated");
      fetchBanners();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner?")) return;

    const { error } = await supabase
      .from("marketing_images")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete banner");
    } else {
      toast.success("Banner deleted");
      fetchBanners();
    }
  };

  const handleUpload = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `cart-banners/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("marketing-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      toast.error("Upload failed");
      console.error(uploadError);
      return;
    }

    const { data } = supabase.storage.from("marketing-images").getPublicUrl(path);
    setNewImageUrl(data.publicUrl);
    toast.success("Image uploaded");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl uppercase tracking-wider text-foreground">Cart Banners</h2>
        <p className="text-sm text-muted-foreground font-body mt-1">
          Manage promotional banners displayed at the top of the cart drawer. Only one banner can be active at a time.
        </p>
      </div>

      {/* Add new banner */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-display uppercase tracking-wider">Add New Banner</CardTitle>
          <CardDescription>Upload or paste an image URL for a new cart banner</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Image URL</Label>
            <div className="flex gap-2">
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1"
              />
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                  }}
                />
                <Button variant="outline" size="icon" asChild>
                  <span><Upload className="w-4 h-4" /></span>
                </Button>
              </label>
            </div>
          </div>

          {newImageUrl && (
            <div className="rounded-md overflow-hidden border border-border">
              <img src={newImageUrl} alt="Preview" className="w-full h-auto max-h-32 object-contain bg-secondary/30" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Alt Text</Label>
              <Input
                value={newAltText}
                onChange={(e) => setNewAltText(e.target.value)}
                placeholder="Free gift with $99+ purchase"
              />
            </div>
            <div className="space-y-2">
              <Label>Link (optional)</Label>
              <Input
                value={newLinkHref}
                onChange={(e) => setNewLinkHref(e.target.value)}
                placeholder="/collections/new-releases"
              />
            </div>
          </div>

          <Button onClick={handleAdd} disabled={saving || !newImageUrl.trim()}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Add Banner
          </Button>
        </CardContent>
      </Card>

      {/* Existing banners */}
      {banners.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No cart banners yet. Add one above.</p>
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => (
            <Card key={banner.id} className={!banner.is_active ? "opacity-50" : ""}>
              <CardContent className="flex items-center gap-4 py-3">
                <div className="w-32 h-16 rounded overflow-hidden border border-border flex-shrink-0">
                  <img src={banner.image_url} alt={banner.alt_text || ""} className="w-full h-full object-contain bg-secondary/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{banner.alt_text || "No alt text"}</p>
                  {banner.link_href && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <LinkIcon className="w-3 h-3" /> {banner.link_href}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {banner.is_active ? "✅ Active" : "Inactive"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={banner.is_active}
                    onCheckedChange={(checked) => handleToggle(banner.id, checked)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(banner.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
