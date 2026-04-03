import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type MarketingImage = Database["public"]["Tables"]["marketing_images"]["Row"];
type Slot = Database["public"]["Enums"]["marketing_image_slot"];

export function useMarketingImages(slot: Slot) {
  return useQuery({
    queryKey: ["marketing-images", slot],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_images")
        .select("*")
        .eq("slot", slot)
        .eq("is_active", true)
        .order("position", { ascending: true });
      if (error) throw error;
      const now = new Date().toISOString();
      return (data as any[]).filter((img) => {
        if (img.scheduled_from && img.scheduled_from > now) return false;
        if (img.scheduled_until && img.scheduled_until < now) return false;
        return true;
      }) as MarketingImage[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
