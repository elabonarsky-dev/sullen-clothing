import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Video, Eye, EyeOff, Loader2 } from "lucide-react";

interface ProductVideoRow {
  id: string;
  product_handle: string;
  video_url: string;
  poster_url: string | null;
  position: number;
  is_active: boolean;
}

export function ProductVideoManager() {
  const [videos, setVideos] = useState<ProductVideoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newHandle, setNewHandle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newPoster, setNewPoster] = useState("");

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from("product_videos")
      .select("*")
      .order("product_handle")
      .order("position");
    if (error) {
      toast.error("Failed to load videos");
      return;
    }
    setVideos(data as ProductVideoRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const addVideo = async () => {
    const handle = newHandle.trim().toLowerCase();
    const url = newUrl.trim();
    if (!handle || !url) {
      toast.error("Product handle and video URL are required");
      return;
    }
    setSaving(true);
    const poster = newPoster.trim() || null;
    const { error } = await supabase.from("product_videos").insert({
      product_handle: handle,
      video_url: url,
      poster_url: poster,
    });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Video already exists for this product" : error.message);
    } else {
      toast.success(`Video added for "${handle}"`);
      setNewHandle("");
      setNewUrl("");
      setNewPoster("");
      fetchVideos();
    }
    setSaving(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("product_videos")
      .update({ is_active: !current })
      .eq("id", id);
    if (error) toast.error(error.message);
    else fetchVideos();
  };

  const deleteVideo = async (id: string) => {
    const { error } = await supabase.from("product_videos").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Video removed");
      fetchVideos();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading videos…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl uppercase tracking-wider text-foreground">
          Product Videos
        </h2>
        <p className="text-sm text-muted-foreground font-body mt-1">
          Attach promo videos to products. A camera icon will appear on product cards and the video will show in the PDP gallery.
        </p>
      </div>

      {/* Add new */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-card border border-border rounded-lg">
        <input
          type="text"
          placeholder="Product handle (e.g. bzzt-bzzt)"
          value={newHandle}
          onChange={(e) => setNewHandle(e.target.value)}
          className="flex-1 px-3 py-2 bg-background border border-border rounded-sm text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          type="text"
          placeholder="Video URL (e.g. /videos/promo.mp4)"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          className="flex-1 px-3 py-2 bg-background border border-border rounded-sm text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          type="text"
          placeholder="Poster URL (optional thumbnail)"
          value={newPoster}
          onChange={(e) => setNewPoster(e.target.value)}
          className="flex-1 px-3 py-2 bg-background border border-border rounded-sm text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={addVideo}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-display text-xs uppercase tracking-[0.15em] rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          {saving ? "Adding…" : "Add Video"}
        </button>
      </div>

      {/* List */}
      {videos.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No product videos yet. Add one above.
        </p>
      ) : (
        <div className="space-y-2">
          {videos.map((v) => (
            <div
              key={v.id}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                v.is_active
                  ? "bg-card border-border"
                  : "bg-card/50 border-border/50 opacity-60"
              }`}
            >
              <Video className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm uppercase tracking-wider text-foreground truncate">
                  {v.product_handle}
                </p>
                <p className="text-xs text-muted-foreground font-body truncate">
                  {v.video_url}
                </p>
                {v.poster_url && (
                  <p className="text-xs text-muted-foreground/60 font-body truncate">
                    poster: {v.poster_url}
                  </p>
                )}
              </div>
              <button
                onClick={() => toggleActive(v.id, v.is_active)}
                className="p-2 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                title={v.is_active ? "Disable" : "Enable"}
              >
                {v.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => deleteVideo(v.id)}
                className="p-2 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
