import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Sparkles, MapPin, RotateCcw, Loader2, Wand2 } from "lucide-react";
import { ResilientImage } from "@/components/ResilientImage";
import { directoryArtists, REGION_GROUPS, type DirectoryArtist } from "@/data/artistDirectory";
import { supabase } from "@/integrations/supabase/client";

/* ── Quiz Steps ── */
type ColorPref = "color" | "blackgrey" | "both";
type SizePref = "small" | "medium" | "large" | "any";

interface QuizState {
  colorPref: ColorPref | null;
  styles: string[];
  size: SizePref | null;
  region: string | null;
}

interface AiRecommendation {
  slug: string;
  reason: string;
}

const STYLE_OPTIONS = [
  { value: "Realism", label: "Realism", desc: "Photographic precision" },
  { value: "Neo-Trad", label: "Neo-Traditional", desc: "Bold lines, rich color" },
  { value: "Traditional", label: "Traditional", desc: "Classic Americana" },
  { value: "Chicano", label: "Chicano", desc: "Cultural storytelling" },
  { value: "Blackwork", label: "Blackwork", desc: "Bold black ink" },
  { value: "Japanese", label: "Japanese", desc: "Flowing bodywork" },
  { value: "Illustrative", label: "Illustrative", desc: "Art-forward design" },
  { value: "Geometric", label: "Geometric", desc: "Sacred geometry" },
  { value: "Lettering", label: "Lettering", desc: "Script & typography" },
];

const COLOR_OPTIONS: { value: ColorPref; label: string; desc: string }[] = [
  { value: "color", label: "Full Color", desc: "Vibrant, vivid palettes" },
  { value: "blackgrey", label: "Black & Grey", desc: "Classic contrast & depth" },
  { value: "both", label: "Open to Both", desc: "Show me everything" },
];

const SIZE_OPTIONS: { value: SizePref; label: string; desc: string }[] = [
  { value: "small", label: "Small Pieces", desc: "Fine detail, single session" },
  { value: "medium", label: "Medium Work", desc: "Half sleeves, panels" },
  { value: "large", label: "Large Scale", desc: "Full sleeves, back pieces" },
  { value: "any", label: "Not Sure Yet", desc: "I'm open to anything" },
];

const TOTAL_STEPS = 5;

function matchArtists(state: QuizState): DirectoryArtist[] {
  return directoryArtists
    .map((artist) => {
      let score = 0;
      const styles = artist.styles || [];
      if (state.colorPref === "color") {
        if (styles.includes("Color Realism")) score += 3;
        else if (styles.some((s) => !["Black & Grey", "Blackwork"].includes(s))) score += 1;
      } else if (state.colorPref === "blackgrey") {
        if (styles.includes("Black & Grey") || styles.includes("Blackwork")) score += 3;
      } else {
        score += 1;
      }
      if (state.styles.length > 0) {
        const matched = state.styles.filter((s) => styles.includes(s)).length;
        score += matched * 4;
      }
      if (state.size === "large" && (artist.pieces || 0) >= 300) score += 2;
      if (state.size === "small" && (artist.pieces || 0) < 250) score += 1;
      if (state.region && artist.region === state.region) score += 2;
      if (artist.featured) score += 1;
      return { artist, score };
    })
    .filter((r) => r.score > 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((r) => r.artist);
}

/* ── Step Components ── */
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-500 ${
            i <= current ? "bg-primary w-8" : "bg-border/40 w-4"
          }`}
        />
      ))}
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  label,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border transition-all duration-300 ${
        selected
          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
          : "border-border/20 bg-card hover:border-primary/30 hover:bg-card/80"
      }`}
    >
      <p className={`text-sm font-display uppercase tracking-[0.12em] ${selected ? "text-primary" : "text-foreground"}`}>
        {label}
      </p>
      {desc && <p className="text-[11px] font-body text-muted-foreground mt-0.5">{desc}</p>}
    </button>
  );
}

/* ── Main Quiz Modal ── */
export function StyleMatchQuiz({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<QuizState>({
    colorPref: null,
    styles: [],
    size: null,
    region: null,
  });
  const [tattooDescription, setTattooDescription] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [aiResults, setAiResults] = useState<{ artist: DirectoryArtist; reason: string }[] | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const fallbackResults = useMemo(() => matchArtists(state), [state]);

  const canAdvance =
    (step === 0 && state.colorPref !== null) ||
    (step === 1 && state.styles.length > 0) ||
    (step === 2 && state.size !== null) ||
    step === 3 ||
    (step === 4); // description is optional — can skip

  const fetchAiRecommendations = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      // Build a compact catalog for the AI
      const catalog = directoryArtists.map((a) => ({
        slug: a.slug,
        name: a.name,
        styles: a.styles,
        specialty: a.specialty,
        location: a.location,
        region: a.region,
        bio: a.bio?.slice(0, 120),
        featured: a.featured || false,
      }));

      const { data, error } = await supabase.functions.invoke("artist-recommend", {
        body: { quizState: state, tattooDescription, artistCatalog: catalog },
      });

      if (error) throw error;

      const recs: AiRecommendation[] = data.recommendations || [];
      const matched = recs
        .map((r) => {
          const artist = directoryArtists.find((a) => a.slug === r.slug);
          return artist ? { artist, reason: r.reason } : null;
        })
        .filter(Boolean) as { artist: DirectoryArtist; reason: string }[];

      setAiResults(matched.length > 0 ? matched : null);
    } catch (e) {
      console.error("AI recommendation error:", e);
      setAiError("AI matching unavailable — showing algorithm matches instead.");
      setAiResults(null);
    } finally {
      setIsAiLoading(false);
      setShowResults(true);
    }
  };

  const next = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Step 4 = description step — if description provided, use AI
      if (tattooDescription.trim().length > 5) {
        fetchAiRecommendations();
      } else {
        setShowResults(true);
      }
    }
  };

  const back = () => {
    if (showResults) {
      setShowResults(false);
      setAiResults(null);
      setAiError(null);
    } else if (step > 0) setStep(step - 1);
  };

  const reset = () => {
    setStep(0);
    setState({ colorPref: null, styles: [], size: null, region: null });
    setTattooDescription("");
    setShowResults(false);
    setAiResults(null);
    setAiError(null);
  };

  const toggleStyle = (s: string) => {
    setState((prev) => ({
      ...prev,
      styles: prev.styles.includes(s) ? prev.styles.filter((x) => x !== s) : [...prev.styles, s],
    }));
  };

  const displayResults = aiResults ? aiResults.map((r) => r.artist) : fallbackResults;
  const reasonMap = aiResults ? Object.fromEntries(aiResults.map((r) => [r.artist.slug, r.reason])) : {};

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-card border border-border/20 rounded-xl shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border/10 px-6 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-display uppercase tracking-[0.3em] text-primary">
                    {aiResults ? "AI-Powered Match" : "Style Match"}
                  </span>
                </div>
                {!showResults && !isAiLoading && <StepIndicator current={step} total={TOTAL_STEPS} />}
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-6">
              <AnimatePresence mode="wait">
                {isAiLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16 gap-4">
                    <div className="relative">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <Wand2 className="w-4 h-4 text-primary absolute -top-1 -right-1" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-display uppercase tracking-[0.12em] text-foreground">Finding Your Perfect Artists</p>
                      <p className="text-[11px] font-body text-muted-foreground mt-1">AI is analyzing your tattoo idea against 200+ artists…</p>
                    </div>
                  </motion.div>
                ) : showResults ? (
                  <motion.div key="results" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h3 className="text-lg font-display font-bold uppercase tracking-tight text-foreground mb-1">
                      Your <span className="text-primary">{aiResults ? "AI Picks" : "Matches"}</span>
                    </h3>
                    <p className="text-[11px] font-body text-muted-foreground mb-1">
                      {displayResults.length} artists matched your vibe
                    </p>
                    {aiError && (
                      <p className="text-[10px] font-body text-muted-foreground/70 mb-4 italic">{aiError}</p>
                    )}

                    {displayResults.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground font-body">No perfect matches — try broadening your preferences.</p>
                        <button onClick={reset} className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                          <RotateCcw className="w-3 h-3" /> Start Over
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        {displayResults.map((artist) => (
                          <Link
                            key={artist.slug}
                            to={`/artist/${artist.slug}`}
                            onClick={onClose}
                            className="group relative block overflow-hidden rounded-lg border border-border/10 hover:border-primary/30 transition-all"
                          >
                            <div className="aspect-[3/4] relative overflow-hidden">
                              <ResilientImage src={artist.portrait} alt={artist.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                              <div className="absolute bottom-2 left-2 right-2">
                                <p className="text-[11px] font-display uppercase tracking-wider text-foreground group-hover:text-primary transition-colors truncate font-bold">
                                  {artist.name}
                                </p>
                                {reasonMap[artist.slug] && (
                                  <p className="text-[9px] font-body text-primary/80 mt-0.5 line-clamp-2 leading-tight">
                                    {reasonMap[artist.slug]}
                                  </p>
                                )}
                                {!reasonMap[artist.slug] && artist.location && (
                                  <p className="flex items-center gap-1 text-[9px] text-muted-foreground mt-0.5">
                                    <MapPin className="w-2 h-2" /> {artist.location}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : step === 0 ? (
                  <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h3 className="text-lg font-display font-bold uppercase tracking-tight text-foreground mb-1">
                      Color <span className="text-primary">Preference</span>
                    </h3>
                    <p className="text-[11px] font-body text-muted-foreground mb-5">What speaks to you?</p>
                    <div className="space-y-2.5">
                      {COLOR_OPTIONS.map((opt) => (
                        <OptionCard
                          key={opt.value}
                          selected={state.colorPref === opt.value}
                          onClick={() => setState((s) => ({ ...s, colorPref: opt.value }))}
                          label={opt.label}
                          desc={opt.desc}
                        />
                      ))}
                    </div>
                  </motion.div>
                ) : step === 1 ? (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h3 className="text-lg font-display font-bold uppercase tracking-tight text-foreground mb-1">
                      Tattoo <span className="text-primary">Style</span>
                    </h3>
                    <p className="text-[11px] font-body text-muted-foreground mb-5">Pick one or more styles you love</p>
                    <div className="grid grid-cols-2 gap-2">
                      {STYLE_OPTIONS.map((opt) => (
                        <OptionCard
                          key={opt.value}
                          selected={state.styles.includes(opt.value)}
                          onClick={() => toggleStyle(opt.value)}
                          label={opt.label}
                          desc={opt.desc}
                        />
                      ))}
                    </div>
                  </motion.div>
                ) : step === 2 ? (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h3 className="text-lg font-display font-bold uppercase tracking-tight text-foreground mb-1">
                      Piece <span className="text-primary">Size</span>
                    </h3>
                    <p className="text-[11px] font-body text-muted-foreground mb-5">How big are you thinking?</p>
                    <div className="space-y-2.5">
                      {SIZE_OPTIONS.map((opt) => (
                        <OptionCard
                          key={opt.value}
                          selected={state.size === opt.value}
                          onClick={() => setState((s) => ({ ...s, size: opt.value }))}
                          label={opt.label}
                          desc={opt.desc}
                        />
                      ))}
                    </div>
                  </motion.div>
                ) : step === 3 ? (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h3 className="text-lg font-display font-bold uppercase tracking-tight text-foreground mb-1">
                      Preferred <span className="text-primary">Region</span>
                    </h3>
                    <p className="text-[11px] font-body text-muted-foreground mb-5">Where do you want to get inked? (Optional)</p>
                    <div className="space-y-2.5">
                      <OptionCard
                        selected={state.region === null}
                        onClick={() => setState((s) => ({ ...s, region: null }))}
                        label="Anywhere"
                        desc="Show artists from all regions"
                      />
                      {REGION_GROUPS.map((r) => (
                        <OptionCard
                          key={r.value}
                          selected={state.region === r.value}
                          onClick={() => setState((s) => ({ ...s, region: r.value }))}
                          label={r.label}
                          desc=""
                        />
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-display font-bold uppercase tracking-tight text-foreground">
                        Describe Your <span className="text-primary">Tattoo Idea</span>
                      </h3>
                      <Wand2 className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-[11px] font-body text-muted-foreground mb-5">
                      Tell us about your vision and our AI will find the perfect artist. Skip to use algorithm matching.
                    </p>
                    <textarea
                      value={tattooDescription}
                      onChange={(e) => setTattooDescription(e.target.value)}
                      placeholder="e.g. A hyper-realistic lion portrait with a crown, flowing mane blending into geometric patterns, on my forearm…"
                      className="w-full min-h-[120px] rounded-lg border border-border/20 bg-background px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 resize-none transition-all"
                    />
                    <div className="mt-3 flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-primary/60" />
                      <p className="text-[10px] font-body text-muted-foreground">
                        Powered by AI — the more detail you give, the better the match
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer nav */}
            {!isAiLoading && (
              <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border/10 px-6 py-4 flex items-center justify-between">
                <button
                  onClick={step === 0 && !showResults ? onClose : back}
                  className="flex items-center gap-1.5 text-xs font-display uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {step === 0 && !showResults ? "Cancel" : "Back"}
                </button>

                {showResults ? (
                  <button
                    onClick={reset}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-display uppercase tracking-[0.12em] bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Retake
                  </button>
                ) : (
                  <button
                    onClick={next}
                    disabled={!canAdvance}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-display uppercase tracking-[0.12em] bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {step === 4 ? (
                      tattooDescription.trim().length > 5 ? (
                        <>
                          <Wand2 className="w-3.5 h-3.5" /> AI Match
                        </>
                      ) : (
                        "Find My Artists"
                      )
                    ) : (
                      "Next"
                    )}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
