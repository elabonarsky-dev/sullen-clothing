import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DirectoryArtist } from "@/data/artistDirectory";
import { shopifyImg } from "@/lib/utils";

interface InterviewQA {
  question: string;
  answer: string;
}

export interface ArtistProfileRow {
  slug: string;
  name: string;
  bio: string | null;
  long_bio: string | null;
  location: string | null;
  instagram: string | null;
  specialty: string | null;
  styles: string[];
  gallery_images: string[];
  portrait_url: string | null;
  stored_portrait_url: string | null;
  studio: string | null;
  booking_info: string | null;
  interview: InterviewQA[] | null;
}

/** Fetch all artist profile overrides from DB */
export function useArtistProfiles() {
  return useQuery({
    queryKey: ["artist-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artist_profiles")
        .select("slug, name, bio, long_bio, location, instagram, specialty, styles, gallery_images, portrait_url, stored_portrait_url, studio, booking_info, interview");

      if (error) {
        console.error("Failed to fetch artist profiles:", error);
        return new Map<string, ArtistProfileRow>();
      }

      const map = new Map<string, ArtistProfileRow>();
      for (const row of (data as unknown as ArtistProfileRow[]) || []) {
        map.set(row.slug, row);
      }
      return map;
    },
    staleTime: 2 * 60 * 1000,
  });
}

/** Merge a directory artist with DB overrides, normalizing CDN URLs */
export function mergeArtistProfile(
  artist: DirectoryArtist,
  dbProfile: ArtistProfileRow | undefined
): DirectoryArtist {
  if (!dbProfile) {
    return { ...artist, portrait: shopifyImg(artist.portrait) };
  }
  return {
    ...artist,
    bio: dbProfile.bio || artist.bio,
    fullBio: dbProfile.long_bio || dbProfile.bio || artist.fullBio,
    location: dbProfile.location || artist.location,
    instagram: dbProfile.instagram || artist.instagram,
    specialty: dbProfile.specialty || artist.specialty,
    styles: dbProfile.styles?.length ? dbProfile.styles : artist.styles,
    galleryImages: dbProfile.gallery_images?.length ? dbProfile.gallery_images : artist.galleryImages,
    portrait: dbProfile.stored_portrait_url || shopifyImg(dbProfile.portrait_url || artist.portrait),
    studio: dbProfile.studio || artist.studio,
    bookingInfo: dbProfile.booking_info || artist.bookingInfo,
  };
}
