import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { blogStories } from "@/data/blogStories";

export type StoryData = {
  title: string;
  sections: { heading?: string; text: string }[];
};

/** Fetch all artist stories from the database and merge with static stories */
export function useArtistStories() {
  return useQuery({
    queryKey: ["artist-stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artist_stories")
        .select("slug, title, sections");

      if (error) {
        console.error("Failed to fetch artist stories:", error);
        return blogStories;
      }

      // Start with static stories
      const merged: Record<string, StoryData> = { ...blogStories };

      // DB stories override static ones
      for (const row of data || []) {
        try {
          const sections = typeof row.sections === "string" ? JSON.parse(row.sections) : row.sections;
          merged[row.slug] = { title: row.title, sections };
        } catch {
          // skip malformed
        }
      }

      return merged;
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

/** Get a single artist story, preferring DB over static */
export function useArtistStory(slug: string) {
  const { data: allStories, isLoading } = useArtistStories();
  return {
    story: allStories?.[slug] || null,
    isLoading,
  };
}
