import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { ArtistProduct } from "@/data/artists";
import type { DirectoryArtist } from "@/data/artistDirectory";
import { getDirectoryArtistByName } from "@/data/artistDirectory";
import { MapPin, Palette, Instagram, ChevronRight } from "lucide-react";

/** Normalized shape used internally */
interface ArtistDisplayData {
  slug: string;
  artistName: string;
  artistPortrait?: string;
  artistQuote?: string;
  artistBio: string;
  artistFullBio?: string;
  artistLocation?: string;
  artistSpecialty?: string;
  artistInstagram?: string;
}

function toDisplayData(input: ArtistProduct | DirectoryArtist): ArtistDisplayData {
  if ("artistName" in input) {
    const a = input as ArtistProduct;
    // Prefer directory portrait (canonical artist profile image), but allow
    // local static portrait fallbacks for mapped artist products.
    const directoryArtist = getDirectoryArtistByName(a.artistName);
    const localFallbackPortrait = a.artistPortrait && !/^https?:\/\//i.test(a.artistPortrait)
      ? a.artistPortrait
      : undefined;
    const portrait = directoryArtist?.portrait || localFallbackPortrait;
    return {
      slug: a.slug,
      artistName: a.artistName,
      artistPortrait: portrait,
      artistQuote: a.artistQuote,
      artistBio: a.artistBio,
      artistLocation: a.artistLocation,
      artistSpecialty: a.artistSpecialty,
      artistInstagram: a.artistInstagram,
    };
  }
  const d = input as DirectoryArtist;
  return {
    slug: d.slug,
    artistName: d.name,
    artistPortrait: d.portrait,
    artistQuote: undefined,
    artistBio: d.bio,
    artistFullBio: d.fullBio,
    artistLocation: d.location,
    artistSpecialty: d.specialty,
    artistInstagram: d.instagram,
  };
}

interface ArtistStorySectionProps {
  artist: ArtistProduct | DirectoryArtist;
}

export function ArtistStorySection({ artist: rawArtist }: ArtistStorySectionProps) {
  const artist = toDisplayData(rawArtist);
  return (
    <section className="relative overflow-hidden">
      <div className="container max-w-6xl relative min-h-[420px] md:min-h-[500px]">
        {/* Ghosted artist background - constrained to container */}
        {artist.artistPortrait && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
            <div
              className="absolute right-0 top-0 bottom-0 w-full md:w-[55%] flex items-start justify-end"
              style={{
                maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 25%, rgba(0,0,0,0.8) 50%, black 100%), linear-gradient(to bottom, black 70%, transparent 100%)',
                maskComposite: 'intersect',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 25%, rgba(0,0,0,0.8) 50%, black 100%), linear-gradient(to bottom, black 70%, transparent 100%)',
                WebkitMaskComposite: 'source-in',
              }}
            >
              <img
                src={artist.artistPortrait}
                alt=""
                className="h-full w-auto max-w-none object-contain object-right-top opacity-50 md:opacity-75"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-start pb-12 pt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[10px] font-condensed font-semibold uppercase tracking-[0.4em] text-primary">
              The Artist
            </span>
            <h2 className="mt-2 text-3xl md:text-5xl font-display font-bold uppercase tracking-tight text-foreground">
              {artist.artistName}
            </h2>

            {artist.artistQuote && (
              <blockquote className="mt-6 text-lg md:text-xl font-body font-light italic text-foreground/80 leading-relaxed border-l-2 border-primary/40 pl-5 max-w-2xl">
                "{artist.artistQuote}"
              </blockquote>
            )}

            <p className="mt-4 text-sm font-body leading-relaxed text-muted-foreground max-w-2xl">
              {artist.artistBio}
            </p>

            {artist.artistFullBio && (
              <Link
                to={`/artist/${artist.slug}/bio`}
                className="inline-flex items-center gap-1 mt-2 text-xs font-body text-primary hover:text-primary/80 transition-colors"
              >
                Read More
                <ChevronRight className="w-3 h-3" />
              </Link>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {artist.artistLocation && (
                <span className="inline-flex items-center gap-1.5 text-xs font-body text-muted-foreground bg-secondary/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <MapPin className="w-3 h-3 text-primary" />
                  {artist.artistLocation}
                </span>
              )}
              {artist.artistSpecialty && (
                <span className="inline-flex items-center gap-1.5 text-xs font-body text-muted-foreground bg-secondary/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Palette className="w-3 h-3 text-primary" />
                  {artist.artistSpecialty}
                </span>
              )}
              {artist.artistInstagram && (
                <span className="inline-flex items-center gap-1.5 text-xs font-body text-muted-foreground bg-secondary/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Instagram className="w-3 h-3 text-primary" />
                  {artist.artistInstagram}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
