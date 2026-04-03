import { useParams, Link } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Instagram, Palette } from "lucide-react";
import { ResilientImage } from "@/components/ResilientImage";
import DOMPurify from "dompurify";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getDirectoryArtistBySlug, type DirectoryArtist } from "@/data/artistDirectory";
import { useArtistProfiles, mergeArtistProfile } from "@/hooks/useArtistProfiles";

export default function ArtistBioPage() {
  const { slug } = useParams<{ slug: string }>();
  const rawArtist = getDirectoryArtistBySlug(slug || "");
  const { data: profileMap } = useArtistProfiles();
  const dbProfile = profileMap?.get(slug || "");

  const artist = useMemo(() => {
    if (rawArtist) {
      return mergeArtistProfile(rawArtist, profileMap?.get(rawArtist.slug));
    }

    if (!dbProfile) {
      return undefined;
    }

    const fallbackArtist: DirectoryArtist = {
      name: dbProfile.name,
      slug: dbProfile.slug,
      portrait: dbProfile.stored_portrait_url || dbProfile.portrait_url || "",
      specialty: dbProfile.specialty || undefined,
      styles: dbProfile.styles || [],
      location: dbProfile.location || undefined,
      instagram: dbProfile.instagram || undefined,
      bio: dbProfile.bio || "",
      fullBio: dbProfile.long_bio || dbProfile.bio || undefined,
      galleryImages: dbProfile.gallery_images || [],
      studio: dbProfile.studio || undefined,
      bookingInfo: dbProfile.booking_info || undefined,
      blogUrl: `/artist/${dbProfile.slug}`,
    };

    return fallbackArtist;
  }, [rawArtist, profileMap, dbProfile]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!artist || !artist.fullBio) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-display font-bold uppercase text-foreground">Bio Not Found</h1>
          <Link to={`/artist/${slug}`} className="text-primary hover:underline font-body text-sm">← Back to Artist</Link>
        </div>
      </div>
    );
  }

  // Convert markdown to HTML for rich rendering
  const parseMarkdown = (text: string): string =>
    text
      .replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>')
      .replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>')
      .replace(/^#{1}\s+(.+)$/gm, '<h2>$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      .replace(/~~(.+?)~~/g, '<del>$1</del>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/^[-*+]\s+(.+)/gm, '<li>$1</li>')
      .replace(/((?:<li>.+<\/li>\n?)+)/g, '<ul>$1</ul>')
      .replace(/^\d+\.\s+(.+)/gm, '<li>$1</li>')
      .replace(/^>\s+(.+)/gm, '<blockquote>$1</blockquote>')
      .replace(/---+/g, '<hr />')
      .split(/\n\n+/)
      .filter(Boolean)
      .map(block => block.startsWith('<') ? block : `<p>${block}</p>`)
      .join('\n');

  const bioHtml = DOMPurify.sanitize(parseMarkdown(artist.fullBio), {
    ALLOWED_TAGS: ['h2', 'h3', 'p', 'strong', 'em', 'del', 'code', 'a', 'ul', 'li', 'blockquote', 'hr'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero banner */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={artist.portrait}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.2) contrast(1.1) saturate(0.3)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        </div>

        <div className="relative px-4 lg:px-8 max-w-3xl mx-auto pt-8 pb-10 lg:pt-14 lg:pb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              to={`/artist/${slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-primary transition-colors mb-6"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to {artist.name}
            </Link>

            <div className="flex items-center gap-5">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden border border-border/20 flex-shrink-0">
                <ResilientImage src={artist.portrait} alt={artist.name} className="w-full h-full object-cover" />
              </div>
              <div>
                {artist.specialty && (
                  <span className="inline-flex items-center gap-1 mb-1.5 px-2 py-0.5 rounded-full bg-primary/15 border border-primary/20 text-[9px] font-display uppercase tracking-[0.2em] text-primary">
                    <Palette className="w-2.5 h-2.5" />
                    {artist.specialty}
                  </span>
                )}
                <h1 className="text-2xl lg:text-3xl font-display font-bold uppercase tracking-tight text-foreground">
                  {artist.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  {artist.location && (
                    <span className="flex items-center gap-1 text-xs font-body text-muted-foreground">
                      <MapPin className="w-3 h-3 text-primary/60" />
                      {artist.location}
                    </span>
                  )}
                  {artist.instagram && (
                    <span className="flex items-center gap-1 text-xs font-body text-muted-foreground">
                      <Instagram className="w-3 h-3 text-primary/60" />
                      {artist.instagram}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Full bio content */}
      <section className="px-4 lg:px-8 max-w-3xl mx-auto py-10 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="prose prose-sm lg:prose-base prose-invert prose-headings:font-display prose-headings:uppercase prose-headings:tracking-tight prose-a:text-primary prose-strong:text-foreground prose-p:text-foreground/85 prose-p:leading-relaxed prose-li:text-foreground/85 max-w-none"
          dangerouslySetInnerHTML={{ __html: bioHtml }}
        />

        {/* Back link */}
        <div className="mt-12 pt-6 border-t border-border/20">
          <Link
            to={`/artist/${slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-display uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to {artist.name}'s Profile
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
