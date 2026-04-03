import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ColorSwatch {
  id: string;
  color_name: string;
  hex_fallback: string | null;
  image_url: string | null;
  stroke_color: string | null;
  is_split: boolean;
  split_color_1: string | null;
  split_color_2: string | null;
  created_at: string;
  updated_at: string;
}

export function useColorSwatches() {
  return useQuery({
    queryKey: ["color-swatches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("color_swatches")
        .select("*")
        .order("color_name");
      if (error) throw error;
      return (data || []) as ColorSwatch[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Build a lookup map: lowercase color name → swatch */
export function useSwatchMap() {
  const { data: swatches } = useColorSwatches();
  const map = new Map<string, ColorSwatch>();
  for (const s of swatches || []) {
    map.set(s.color_name.toLowerCase(), s);
  }
  return map;
}
