import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Search, ArrowRight, Instagram, MapPin, X, Globe, ChevronDown, Sparkles, Wand2, ChevronLeft, ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StyleMatchQuiz } from "@/components/StyleMatchQuiz";
import { directoryArtists, ALL_STYLES, SPECIALTY_TO_STYLES, REGION_GROUPS, type DirectoryArtist } from "@/data/artistDirectory";
import { useArtistProfiles, mergeArtistProfile } from "@/hooks/useArtistProfiles";
import { shopifyImg, getPortraitFallbacks } from "@/lib/utils";

/* ─── Uniform artist card (no featured sizing) ─── */
function ArtistCard({ artist, index }: { artist: DirectoryArtist; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [imgFailed, setImgFailed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(artist.portrait);
  const fallbacksRef = useRef(artist.portrait ? getPortraitFallbacks(artist.portrait) : []);

  const initials = artist.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: (index % 6) * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link
        to={`/artist/${artist.slug}`}
        className="group relative block overflow-hidden rounded-lg bg-card border border-border/10 hover:border-primary/30 transition-all duration-500 h-full"
      >
        <div className="relative overflow-hidden aspect-[4/5]">
          {/* Shimmer skeleton — visible until image loads or fails */}
          {!imgLoaded && !imgFailed && (
            <div className="absolute inset-0 z-[1] bg-secondary overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/40 to-transparent animate-shimmer" />
              <div className="absolute bottom-4 left-4 right-4 space-y-2">
                <div className="h-3 w-2/3 rounded bg-muted/40" />
                <div className="h-2 w-1/2 rounded bg-muted/30" />
              </div>
            </div>
          )}

          {!imgFailed && currentSrc ? (
            <img
              src={currentSrc}
              alt={artist.name}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => {
                const next = fallbacksRef.current.shift();
                if (next) {
                  setCurrentSrc(next);
                } else {
                  setImgFailed(true);
                }
              }}
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-secondary flex items-center justify-center">
              <span className="text-2xl font-display font-bold text-muted-foreground/50">{initials}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          <div className="absolute inset-0 flex flex-col justify-end p-4 lg:p-5">

            <h3 className="text-sm lg:text-base font-display font-bold uppercase tracking-wide text-foreground group-hover:text-primary transition-colors duration-300">
              {artist.name}
            </h3>

            <div className="flex items-center gap-3 mt-1.5">
              {artist.location && (
                <span className="flex items-center gap-1 text-[10px] font-body text-muted-foreground">
                  <MapPin className="w-2.5 h-2.5" />
                  {artist.location}
                </span>
              )}
              {artist.instagram && (
                <span className="flex items-center gap-1 text-[10px] font-body text-muted-foreground">
                  <Instagram className="w-2.5 h-2.5" />
                  {artist.instagram}
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-display uppercase tracking-[0.2em] text-primary/70 group-hover:text-primary transition-colors">
              <span>View Profile</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

const PAGE_SIZE = 48;

/* ─── Paginated Grid ─── */
function PaginatedArtistGrid({
  filtered,
  onClearFilters,
  currentPage,
  onPageChange,
}: {
  filtered: DirectoryArtist[];
  onClearFilters: () => void;
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  // Scroll to top of grid on page change
  const gridRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [safePage]);

  if (filtered.length === 0) {
    return (
      <section className="px-4 lg:px-8 max-w-7xl mx-auto py-8 lg:py-12">
        <div className="text-center py-20">
          <p className="text-muted-foreground font-body text-sm">No artists found matching your filters</p>
          <button onClick={onClearFilters} className="mt-3 text-xs text-primary hover:underline">
            Clear all filters
          </button>
        </div>
      </section>
    );
  }

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      const rangeStart = Math.max(2, safePage - 1);
      const rangeEnd = Math.min(totalPages - 1, safePage + 1);
      for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <section ref={gridRef} className="px-4 lg:px-8 max-w-7xl mx-auto py-8 lg:py-12 scroll-mt-36">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
        {visible.map((artist, i) => (
          <ArtistCard key={artist.slug} artist={artist} index={i} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav aria-label="Artist directory pagination" className="mt-10 flex items-center justify-center gap-1.5">
          <button
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage === 1}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-border/20 bg-secondary/50 text-muted-foreground hover:text-foreground hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {getPageNumbers().map((page, i) =>
            page === "..." ? (
              <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-xs text-muted-foreground">
                …
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-9 h-9 rounded-lg text-xs font-display uppercase tracking-wider transition-all ${
                  page === safePage
                    ? "bg-primary text-primary-foreground border border-primary"
                    : "border border-border/20 bg-secondary/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}
                aria-label={`Page ${page}`}
                aria-current={page === safePage ? "page" : undefined}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage === totalPages}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-border/20 bg-secondary/50 text-muted-foreground hover:text-foreground hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      )}

      {/* Page info */}
      {totalPages > 1 && (
        <p className="mt-3 text-center text-[10px] font-body text-muted-foreground">
          Showing {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length} artists
        </p>
      )}
    </section>
  );
}

/* ─── Main Page ─── */
export default function ArtistsDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStyles, setActiveStyles] = useState<string[]>([]);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const styleScrollRef = useRef<HTMLDivElement>(null);
  const { data: profileMap } = useArtistProfiles();

  const currentPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const setCurrentPage = useCallback((page: number) => {
    setSearchParams((prev) => {
      if (page <= 1) { prev.delete("page"); } else { prev.set("page", String(page)); }
      return prev;
    }, { replace: true });
  }, [setSearchParams]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeStyles, activeRegion, activeLetter]);

  const toggleStyle = (style: string) => {
    setActiveStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const allArtists = useMemo(() => {
    const toKey = (name: string) =>
      name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const mergedDirectory = directoryArtists.map((artist) =>
      mergeArtistProfile(artist, profileMap?.get(artist.slug))
    );

    // Build a set of normalized names already present in the static directory
    const directorySlugSet = new Set(mergedDirectory.map((a) => a.slug));
    const directoryNameSet = new Set(mergedDirectory.map((a) => toKey(a.name)));

    const dbOnlyArtists: DirectoryArtist[] = profileMap
      ? Array.from(profileMap.values())
          .filter((p) => !directorySlugSet.has(p.slug) && !directoryNameSet.has(toKey(p.name)))
          .map((p) => ({
            name: p.name,
            slug: p.slug,
            portrait: p.stored_portrait_url || (p.portrait_url ? shopifyImg(p.portrait_url) : ""),
            specialty: p.specialty || undefined,
            styles: p.styles || [],
            location: p.location || undefined,
            instagram: p.instagram || undefined,
            bio: p.bio || "",
            fullBio: p.long_bio || p.bio || undefined,
            galleryImages: p.gallery_images || [],
            studio: p.studio || undefined,
            bookingInfo: p.booking_info || undefined,
            blogUrl: `/artist/${p.slug}`,
          }))
      : [];

    // Final dedup pass: keep first occurrence by normalized name
    const combined = [...mergedDirectory, ...dbOnlyArtists];
    const seenNames = new Set<string>();
    const deduped = combined.filter((a) => {
      const key = toKey(a.name);
      if (seenNames.has(key)) return false;
      seenNames.add(key);
      return true;
    });

    return deduped.sort((a, b) => a.name.localeCompare(b.name));
  }, [profileMap]);

  const normalizeText = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const termAliases: Record<string, string[]> = {
    letterheads: ["lettering"],
    lettering: ["letterheads"],
  };

  const expandTerms = (term: string) => {
    const normalized = normalizeText(term).trim();
    if (!normalized) return [] as string[];
    return [normalized, ...(termAliases[normalized] || [])];
  };

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery).trim();
    const queryTerms = normalizedQuery ? expandTerms(normalizedQuery) : [];

    return allArtists.filter((artist) => {
      // Alphabet filter
      if (activeLetter) {
        const firstChar = artist.name.charAt(0).toUpperCase();
        if (firstChar !== activeLetter) return false;
      }

      const artistName = normalizeText(artist.name || "");
      const artistBio = normalizeText(artist.bio || "");
      const artistSpecialty = normalizeText(artist.specialty || "");
      const artistLocation = normalizeText(artist.location || "");
      const artistInstagram = normalizeText(artist.instagram || "");
      const artistStyleTerms = (artist.styles || []).map((s) => normalizeText(s));
      const searchable = [artistName, artistBio, artistSpecialty, artistLocation, artistInstagram, artistStyleTerms.join(" ")].join(" ");

      const matchesSearch =
        !normalizedQuery ||
        queryTerms.some((term) => searchable.includes(term));

      const matchesStyle =
        activeStyles.length === 0 ||
        activeStyles.some((selectedStyle) => {
          const selectedNorm = normalizeText(selectedStyle);
          // Check direct styles array
          if (artistStyleTerms.some((s) => s.includes(selectedNorm))) return true;
          // Check specialty via canonical mapping
          const specialtyMapped = SPECIALTY_TO_STYLES[artist.specialty || ""] || [];
          if (specialtyMapped.some((s) => normalizeText(s).includes(selectedNorm))) return true;
          // Fallback: raw specialty text match
          if (artistSpecialty.includes(selectedNorm)) return true;
          return false;
        });

      const matchesRegion = !activeRegion || artist.region === activeRegion;
      return matchesSearch && matchesStyle && matchesRegion;
    });
  }, [searchQuery, activeStyles, activeRegion, activeLetter, allArtists]);

  const activeFilterCount = activeStyles.length + (activeRegion ? 1 : 0) + (activeLetter ? 1 : 0);

  // Compute which letters have artists
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    allArtists.forEach((a) => {
      const first = a.name.charAt(0).toUpperCase();
      if (/[A-Z]/.test(first)) letters.add(first);
    });
    return letters;
  }, [allArtists]);

  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Artists Directory — 200+ Tattoo Artists"
        description="Explore Sullen Clothing's roster of world-class tattoo artists. Filter by style, region, and more. Each collaboration tells a story through ink-inspired streetwear."
        path="/collections/artists"
      />
      <SiteHeader />

      {/* Hero with Quiz CTA replacing featured strip */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-card via-background to-background" />
        <div className="relative px-4 lg:px-8 max-w-7xl mx-auto pt-8 pb-6 lg:pt-14 lg:pb-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-2xl">
            <span className="inline-flex items-center gap-2 mb-4 text-[10px] font-display uppercase tracking-[0.3em] text-primary/80">
              <span className="w-8 h-px bg-primary/50" />
              Sullen Art Collective
            </span>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold uppercase tracking-tight text-foreground leading-[0.9]">
                Artist<br /><span className="text-primary">Directory</span>
              </h1>
              <span className="self-start mt-1 inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-primary/15 border border-primary/25 text-xs font-display font-bold text-primary tabular-nums">
                {allArtists.length}
              </span>
            </div>
            <p className="mt-4 text-sm lg:text-base font-body text-muted-foreground max-w-md leading-relaxed">
              {allArtists.length}+ world-class tattoo artists, united under one banner.
            </p>
          </motion.div>

          {/* Inline Quiz CTA */}
          <motion.button
            onClick={() => setQuizOpen(true)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 lg:mt-8 w-full sm:w-auto relative overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-r from-primary/10 via-card to-primary/5 p-5 lg:p-6 text-left group hover:border-primary/40 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative flex items-center gap-4">
              <div className="flex-shrink-0 w-11 h-11 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm lg:text-base font-display font-bold uppercase tracking-tight text-foreground">
                  Find Your <span className="text-primary">Perfect Artist</span>
                </h3>
                <p className="text-[10px] lg:text-[11px] font-body text-muted-foreground mt-0.5">
                  AI-powered Style Match Quiz — describe your tattoo idea and we'll find the best match.
                </p>
              </div>
              <div className="flex-shrink-0 hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-[11px] font-display uppercase tracking-[0.15em] group-hover:bg-primary/90 transition-colors">
                Take Quiz
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </motion.button>
        </div>
      </section>

      {/* Filters + Search */}
      <section className="sticky top-14 z-40 bg-background/95 backdrop-blur-md border-b border-border/10">
        <div className="px-4 lg:px-8 max-w-7xl mx-auto py-3 space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-secondary/50 border border-border/20 rounded-lg text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Region dropdown */}
            <div className="flex gap-1.5 items-center">
              <div className="relative">
                <select
                  value={activeRegion || ""}
                  onChange={(e) => setActiveRegion(e.target.value || null)}
                  className="appearance-none pl-8 pr-8 py-2 bg-secondary/50 border border-border/20 rounded-lg text-xs font-display uppercase tracking-[0.1em] text-foreground focus:outline-none focus:border-primary/40 cursor-pointer"
                >
                  <option value="">All Regions</option>
                  {REGION_GROUPS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setActiveStyles([]); setActiveRegion(null); setSearchQuery(""); setActiveLetter(null); }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-display uppercase tracking-[0.12em] bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-all"
                >
                  <X className="w-3 h-3" />
                  Clear {activeFilterCount}
                </button>
              )}
            </div>
          </div>

          {/* Style filter pills — horizontal scroll on mobile, wraps on desktop */}
          <div
            ref={styleScrollRef}
            className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap scrollbar-hide snap-x snap-mandatory"
          >
            {ALL_STYLES.map((style) => (
              <button
                key={style}
                onClick={() => toggleStyle(style)}
                className={`flex-shrink-0 snap-start px-3 py-1.5 rounded-full text-[10px] font-display uppercase tracking-[0.15em] border transition-all whitespace-nowrap ${
                  activeStyles.includes(style)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border/30 hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {style}
              </button>
            ))}
          </div>

          {/* Alphabet bar */}
          <div className="flex gap-0.5 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
            {ALPHABET.map((letter) => {
              const hasArtists = availableLetters.has(letter);
              const isActive = activeLetter === letter;
              return (
                <button
                  key={letter}
                  onClick={() => hasArtists && setActiveLetter(isActive ? null : letter)}
                  disabled={!hasArtists}
                  className={`flex-shrink-0 w-7 h-7 rounded text-[10px] font-display font-bold uppercase transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : hasArtists
                        ? "text-muted-foreground hover:text-foreground hover:bg-secondary"
                        : "text-muted-foreground/25 cursor-not-allowed"
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          {/* Results count */}
          <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">
            {filtered.length} artist{filtered.length !== 1 ? "s" : ""}
            {activeLetter && ` · ${activeLetter}`}
            {activeStyles.length > 0 && ` · ${activeStyles.join(", ")}`}
            {activeRegion && ` · ${REGION_GROUPS.find(r => r.value === activeRegion)?.label || activeRegion}`}
          </p>
        </div>
      </section>

      {/* Artist Grid — virtualized with progressive loading */}
      <PaginatedArtistGrid
        filtered={filtered}
        onClearFilters={() => { setActiveStyles([]); setActiveRegion(null); setSearchQuery(""); setActiveLetter(null); }}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {/* Bottom CTA */}
      <section className="px-4 lg:px-8 max-w-7xl mx-auto pb-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-xl border border-border/20 bg-card p-8 lg:p-12 text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
          <div className="relative">
            <h2 className="text-2xl lg:text-3xl font-display font-bold uppercase tracking-tight text-foreground">
              Wear Their <span className="text-primary">Art</span>
            </h2>
            <p className="mt-2 text-sm font-body text-muted-foreground max-w-md mx-auto">
              Every Sullen Artist Series tee is a wearable canvas — designed by the world's best tattoo artists.
            </p>
            <Link
              to="/collections/artist-series"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-xs font-display uppercase tracking-[0.15em] hover:bg-primary/90 transition-colors"
            >
              Shop Artist Series
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </section>

      <SiteFooter />
      <StyleMatchQuiz open={quizOpen} onClose={() => setQuizOpen(false)} />
    </div>
  );
}
