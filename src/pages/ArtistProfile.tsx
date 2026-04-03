import { useParams, Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, Instagram, MapPin, Palette, X, BookOpen, ChevronRight, Mic } from "lucide-react";
import { ResilientImage } from "@/components/ResilientImage";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getDirectoryArtistBySlug, directoryArtists, type DirectoryArtist } from "@/data/artistDirectory";
import { getArtistBySlug } from "@/data/artists";
import { blogStories } from "@/data/blogStories";
import { useArtistStory } from "@/hooks/useArtistStories";
import { useArtistProfiles, mergeArtistProfile } from "@/hooks/useArtistProfiles";

export default function ArtistProfile() {
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

  const productArtist = getArtistBySlug(slug || "");
  const [storyOpen, setStoryOpen] = useState(false);
  const { story } = useArtistStory(slug || "");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!artist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-display font-bold uppercase text-foreground">Artist Not Found</h1>
          <Link to="/collections/artists" className="text-primary hover:underline font-body text-sm">← Back to Artists</Link>
        </div>
      </div>
    );
  }

  // Find prev/next artists
  const currentIndex = directoryArtists.findIndex((a) => a.slug === slug);
  const prevArtist = currentIndex > 0 ? directoryArtists[currentIndex - 1] : null;
  const nextArtist = currentIndex >= 0 && currentIndex < directoryArtists.length - 1
    ? directoryArtists[currentIndex + 1]
    : null;

  const galleryImages = artist.galleryImages || [artist.portrait];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero — Full bleed portrait with overlay */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <ResilientImage
            src={artist.portrait}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.25) contrast(1.1) saturate(0.4)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />
        </div>

        <div className="relative px-4 lg:px-8 max-w-6xl mx-auto pt-8 pb-12 lg:pt-16 lg:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/collections/artists" className="inline-flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-primary transition-colors mb-8">
              <ArrowLeft className="w-3.5 h-3.5" />
              All Artists
            </Link>

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-start">
              {/* Portrait */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative w-40 h-40 lg:w-56 lg:h-56 rounded-xl overflow-hidden border-2 border-border/20 flex-shrink-0 shadow-2xl"
              >
                
                <img
                  src={artist.portrait}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {artist.specialty && (
                  <span className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-full bg-primary/15 backdrop-blur-sm border border-primary/20 text-[10px] font-display uppercase tracking-[0.2em] text-primary">
                    <Palette className="w-3 h-3" />
                    {artist.specialty}
                  </span>
                )}

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold uppercase tracking-tight text-foreground leading-[0.95]">
                  {artist.name}
                </h1>

                <div className="flex flex-wrap items-center gap-4 mt-3">
                  {artist.location && (
                    <span className="flex items-center gap-1.5 text-xs font-body text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 text-primary/60" />
                      {artist.location}
                    </span>
                  )}
                  {artist.instagram && (
                    <span className="flex items-center gap-1.5 text-xs font-body text-muted-foreground">
                      <Instagram className="w-3.5 h-3.5 text-primary/60" />
                      {artist.instagram}
                    </span>
                  )}
                  {artist.studio && (
                    <span className="flex items-center gap-1.5 text-xs font-body text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                      {artist.studio}
                    </span>
                  )}
                </div>

                <p className="mt-5 text-sm lg:text-base font-body text-foreground/80 leading-relaxed max-w-xl">
                  {artist.bio}
                </p>

                {artist.fullBio && (
                  <Link
                    to={`/artist/${artist.slug}/bio`}
                    className="inline-flex items-center gap-1 mt-2 text-xs font-body text-primary hover:text-primary/80 transition-colors"
                  >
                    Read More
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 mt-6">
                  {dbProfile?.interview && dbProfile.interview.length > 0 && (
                    <a
                      href="#interview"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-xs font-display uppercase tracking-[0.15em] hover:bg-primary/90 transition-colors"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      Artist Interview
                    </a>
                  )}
                  {story && (
                    <button
                      onClick={() => setStoryOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-xs font-display uppercase tracking-[0.15em] hover:bg-primary/90 transition-colors"
                    >
                      Read Full Story
                      <BookOpen className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {productArtist && (
                    <Link
                      to={`/artist/${artist.slug}/shop`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary border border-border/30 text-foreground rounded-lg text-xs font-display uppercase tracking-[0.15em] hover:border-primary/40 hover:text-primary transition-all"
                    >
                      Shop Collection
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Gallery */}
      {galleryImages.length > 1 && (
        <GallerySection images={galleryImages} artistName={artist.name} />
      )}

      {/* Booking info */}
      {artist.bookingInfo && (
        <section className="px-4 lg:px-8 max-w-6xl mx-auto py-10 lg:py-14">
          <div className="rounded-xl border border-border/20 bg-card p-6 lg:p-8">
            <h2 className="text-lg font-display font-bold uppercase tracking-wide text-foreground mb-2">
              Book with {artist.name}
            </h2>
            <p className="text-sm font-body text-muted-foreground">{artist.bookingInfo}</p>
            {artist.instagram && (
              <p className="mt-2 text-sm font-body text-primary">
                Instagram: {artist.instagram}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Interview Section */}
      {dbProfile?.interview && Array.isArray(dbProfile.interview) && dbProfile.interview.length > 0 && (
        <section id="interview" className="px-4 lg:px-8 max-w-6xl mx-auto py-10 lg:py-14 scroll-mt-24">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 lg:p-10">
            <div className="flex items-center gap-2 mb-8">
              <Mic className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-display font-bold uppercase tracking-wide text-foreground">
                Interview with {artist.name}
              </h2>
            </div>
            <div className="space-y-8">
              {(dbProfile.interview as { question: string; answer: string }[]).map((qa, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-sm font-display font-semibold uppercase tracking-wide text-primary">
                    Q: {qa.question}
                  </p>
                  <p className="text-sm font-body text-foreground/80 leading-relaxed whitespace-pre-line">
                    {qa.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Prev / Next navigation */}
      <section className="px-4 lg:px-8 max-w-6xl mx-auto pb-16">
        <div className="flex gap-3">
          {prevArtist && (
            <Link
              to={`/artist/${prevArtist.slug}`}
              className="flex-1 group relative overflow-hidden rounded-xl border border-border/20 bg-card hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <ResilientImage src={prevArtist.portrait} alt={prevArtist.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">Previous</p>
                  <p className="text-xs font-display uppercase tracking-wide text-foreground group-hover:text-primary transition-colors truncate">
                    {prevArtist.name}
                  </p>
                </div>
              </div>
            </Link>
          )}
          {nextArtist && (
            <Link
              to={`/artist/${nextArtist.slug}`}
              className="flex-1 group relative overflow-hidden rounded-xl border border-border/20 bg-card hover:border-primary/30 transition-all text-right"
            >
              <div className="flex items-center gap-4 p-4 justify-end">
                <div className="min-w-0">
                  <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">Next</p>
                  <p className="text-xs font-display uppercase tracking-wide text-foreground group-hover:text-primary transition-colors truncate">
                    {nextArtist.name}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <ResilientImage src={nextArtist.portrait} alt={nextArtist.name} className="w-full h-full object-cover" />
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      <SiteFooter />

      {/* Full Story Modal */}
      <AnimatePresence>
        {storyOpen && story && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 backdrop-blur-sm overflow-y-auto"
            onClick={() => setStoryOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative w-full max-w-2xl mx-4 my-8 lg:my-16 bg-card border border-border/20 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header image */}
              <div className="relative h-48 lg:h-64 overflow-hidden">
                <img
                  src={artist.portrait}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                  style={{ filter: "brightness(0.4) saturate(0.5)" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                <button
                  onClick={() => setStoryOpen(false)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-background/60 backdrop-blur-sm border border-border/30 flex items-center justify-center text-foreground hover:bg-background/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-4 left-5 right-5">
                  <span className="inline-flex items-center gap-1 mb-2 px-2 py-0.5 rounded-full bg-primary/15 backdrop-blur-sm border border-primary/20 text-[9px] font-display uppercase tracking-[0.2em] text-primary">
                    <Palette className="w-2.5 h-2.5" />
                    {artist.specialty}
                  </span>
                  <h2 className="text-xl lg:text-2xl font-display font-bold uppercase tracking-tight text-foreground leading-tight">
                    {story.title}
                  </h2>
                </div>
              </div>

              {/* Story content */}
              <div className="px-5 lg:px-8 py-6 lg:py-8 space-y-6">
                {story.sections
                  .filter((section) => {
                    const h = (section.heading || "").toLowerCase();
                    const t = (section.text || "").toLowerCase();
                    // Skip boilerplate scraped sections
                    if (/^(newsletter|cart|your cart)/i.test(h)) return false;
                    if (t.includes("err\\_blocked\\_by\\_client") || t.includes("err_blocked_by_client")) return false;
                    if (t.includes("this page has been blocked by an extension")) return false;
                    if (t.includes("your cart is empty") && t.length < 200) return false;
                    if (t.includes("www.sullenclothing.com") && t.includes("blocked")) return false;
                    if (h.includes("cart •")) return false;
                    return true;
                  })
                  .map((section, i) => (
                  <div key={i}>
                    {section.heading && (
                      <h3 className="text-sm font-display font-bold uppercase tracking-wide text-primary mb-2">
                        {section.heading}
                      </h3>
                    )}
                    <p className="text-sm font-body text-foreground/80 leading-relaxed whitespace-pre-line">
                      {section.text}
                    </p>
                  </div>
                ))}

                {/* Footer with external link */}
                <div className="pt-4 border-t border-border/20 flex items-center justify-between">
                  <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">Written by Ryan Smith</p>
                  <a
                    href={artist.blogUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-display uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
                  >
                    View on Sullen
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Gallery Section ─── */
function GallerySection({ images, artistName }: { images: string[]; artistName: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <section ref={ref} className="px-4 lg:px-8 max-w-6xl mx-auto py-10 lg:py-14">
      <h2 className="text-lg font-display font-bold uppercase tracking-wide text-foreground mb-4">
        Art Gallery
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {images.map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="aspect-square rounded-lg overflow-hidden border border-border/10"
          >
            <img
              src={img}
              alt={`${artistName} artwork ${i + 1}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
