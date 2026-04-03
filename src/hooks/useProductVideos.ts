import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductVideo {
  id: string;
  product_handle: string;
  video_url: string;
  poster_url: string | null;
  position: number;
  is_active: boolean;
}

export function useProductVideos() {
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["product-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_videos")
        .select("*")
        .eq("is_active", true)
        .order("position");
      if (error) throw error;
      return data as ProductVideo[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const handlesWithVideo = new Set(videos.map((v) => v.product_handle));

  const getVideosForProduct = (handle: string) =>
    videos.filter((v) => v.product_handle === handle);

  const hasVideo = (handle: string) => handlesWithVideo.has(handle);

  return { videos, isLoading, hasVideo, getVideosForProduct };
}
