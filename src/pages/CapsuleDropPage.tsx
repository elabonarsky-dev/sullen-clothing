import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import vaultDoorMarch from "@/assets/vault-door-march.jpg";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

/* ─── Fetch drop config from DB ─── */
type DropConfig = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  collection_handle: string;
  drop_date: string;
  teaser_label: string | null;
};

const DROP_FALLBACKS: Record<string, DropConfig> = {
  "march-artist-series": {
    id: "fallback-march-artist-series",
    slug: "march-artist-series",
    title: "March Artist Series",
    subtitle: "A new capsule forged in ink",
    collection_handle: "march-artist-series-bundle",
    drop_date: "2026-03-26T17:00:00.000Z",
    teaser_label: "Incoming Drop — March 26",
  },
};

function useDropConfig(slug: string | undefined) {
  return useQuery({
    queryKey: ["capsule-drop", slug],
    initialData: slug ? (DROP_FALLBACKS[slug] ?? undefined) : undefined,
    queryFn: async () => {
      if (!slug) return null;
      const fallback = DROP_FALLBACKS[slug] ?? null;

      try {
        const timeoutMs = 4500;
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`capsule_drops timeout after ${timeoutMs}ms`)), timeoutMs);
        });

        const { data, error } = await Promise.race([
          supabase
            .from("capsule_drops")
            .select("*")
            .eq("slug", slug)
            .eq("is_active", true)
            .maybeSingle(),
          timeoutPromise,
        ]);

        if (error) throw error;
        return (data as DropConfig | null) ?? fallback;
      } catch (error) {
        console.warn("capsule_drops fetch failed, using fallback", { slug, error });
        return fallback;
      }
    },
    staleTime: 60_000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
}

/* ─── Countdown logic ─── */
function useCountdown(target: Date) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    isLive: diff <= 0,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/* ─── Flip Tile ─── */
function FlipTile({ value, label, numPx, lblPx, gapPx, urgent }: { value: string; label: string; numPx: number; lblPx: number; gapPx: number; urgent?: boolean }) {
  const [displayed, setDisplayed] = useState(value);
  const [flipping, setFlipping] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (value !== prev.current) {
      setFlipping(true);
      const t = setTimeout(() => {
        setDisplayed(value);
        setFlipping(false);
        prev.current = value;
      }, 140);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: `${gapPx}px` }}>
      <div
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          background: "linear-gradient(175deg,#1e1e1e 0%,#0c0c0c 55%,#1a1a1a 100%)",
          borderRadius: "3px",
          border: urgent ? "1px solid rgba(232,168,0,0.35)" : "1px solid rgba(255,255,255,0.06)",
          boxShadow: urgent
            ? "inset 0 2px 8px rgba(0,0,0,0.95), 0 0 10px rgba(0,0,0,0.5), 0 0 18px rgba(232,168,0,0.25)"
            : "inset 0 2px 8px rgba(0,0,0,0.95), 0 0 10px rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          animation: urgent ? "vaultPulse 1.8s ease-in-out infinite" : undefined,
        }}
      >
        <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: "1px", background: "rgba(0,0,0,0.8)", zIndex: 2 }} />
        <span
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: `${numPx}px`,
            fontWeight: "700",
            color: "#e8a800",
            letterSpacing: "0.02em",
            lineHeight: 1,
            textShadow: urgent
              ? "0 0 20px rgba(232,168,0,0.9), 0 0 40px rgba(232,168,0,0.4)"
              : "0 0 14px rgba(232,168,0,0.7)",
            transform: flipping ? "scaleY(0.4)" : "scaleY(1)",
            transition: "transform 0.14s ease",
            position: "relative",
            zIndex: 1,
          }}
        >
          {displayed}
        </span>
      </div>
      <span style={{
        fontFamily: "'Arial Narrow', Arial, sans-serif",
        fontSize: `${lblPx}px`,
        fontWeight: "600",
        letterSpacing: "0.18em",
        color: urgent ? "rgba(232,168,0,0.85)" : "rgba(155,155,155,0.9)",
        textTransform: "uppercase",
        lineHeight: 1,
        whiteSpace: "nowrap",
        transition: "color 0.6s ease",
      }}>
        {label}
      </span>
    </div>
  );
}

/* ─── Calibrated positions (% of 2000×1336 artwork) ─── */
const BOX = {
  CD_LEFT:   37.80,
  CD_TOP:    48.20,
  CD_WIDTH:  21.10,
  CD_HEIGHT:  9.51,
  OPENS_TOP: 62.50,
  FM_LEFT:   39.15,
  FM_TOP:    67.66,
  FM_WIDTH:  18.35,
  FM_HEIGHT: 12.87,
};

const IMG_ASPECT = 1336 / 2000;

/* ─── Vault door (locked state) — same overlay layout at every size ─── */
function VaultDoor({
  countdown,
  title,
  collectionHandle,
}: {
  countdown: ReturnType<typeof useCountdown>;
  title: string;
  subtitle: string;
  teaserLabel: string;
  collectionHandle: string;
}) {
  const [cw, setCw] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewW, setViewW] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);

  useEffect(() => {
    const handler = () => setViewW(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCw(e.contentRect.width));
    ro.observe(el);
    setCw(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  /* Scale factor: 2.6x on mobile (<640), 1.8x on tablet (640-1023), 1x on desktop */
  const scale = viewW < 640 ? 2.6 : viewW < 1024 ? 1.8 : 1;

  const ch = cw * IMG_ASPECT;
  const cdW = cw * BOX.CD_WIDTH / 100;
  const cdH = ch * BOX.CD_HEIGHT / 100;
  const fmW = cw * BOX.FM_WIDTH / 100;
  const fmH = ch * BOX.FM_HEIGHT / 100;

  const numPx   = Math.round(cdH * 0.50);
  const lblPx   = Math.round(cdH * 0.14);
  const gapPx   = Math.round(cdH * 0.08);
  const tileGap = Math.round(cdW * 0.06);
  const opensPx = Math.round(ch * 0.010);

  const formHdrPx = Math.round(fmH * 0.10);
  const inputHpx  = Math.round(fmH * 0.24);
  const inputFpx  = Math.round(fmH * 0.09);
  const btnHpx    = Math.round(fmH * 0.27);
  const formGap   = Math.round(fmH * 0.04);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 relative overflow-hidden bg-[hsl(0,0%,6%)]" style={{ display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
        <div
          ref={containerRef}
          style={{
            position: scale > 1 ? "absolute" : "relative",
            width: scale > 1 ? `${scale * 100}%` : "100%",
            maxWidth: scale > 1 ? "none" : "1400px",
            left: scale > 1 ? "calc(50% + 25px)" : undefined,
            top: scale > 1 ? "0" : undefined,
            transform: scale > 1 ? "translateX(-50%)" : undefined,
            userSelect: "none",
          }}
        >
          <img src={vaultDoorMarch} alt={`${title} – The Vault`} draggable={false} style={{ width: "100%", display: "block" }} />

          {/* Countdown tiles */}
          <div style={{
            position: "absolute", left: `${BOX.CD_LEFT}%`, top: `${BOX.CD_TOP}%`, width: `${BOX.CD_WIDTH}%`, height: `${BOX.CD_HEIGHT}%`,
            display: "flex", alignItems: "center", gap: `${tileGap}px`,
            padding: `${Math.round(cdH * 0.05)}px ${Math.round(cdW * 0.02)}px`, boxSizing: "border-box",
          }}>
            {(() => {
              const totalSec = countdown.days * 86400 + countdown.hours * 3600 + countdown.minutes * 60 + countdown.seconds;
              const urgent = totalSec > 0 && totalSec <= 60;
              return [
                { value: pad(countdown.days), label: "DAYS" },
                { value: pad(countdown.hours), label: "HRS" },
                { value: pad(countdown.minutes), label: "MIN" },
                { value: pad(countdown.seconds), label: "SEC" },
              ].map(({ value, label }) => (
                <FlipTile key={label} value={value} label={label} numPx={numPx} lblPx={lblPx} gapPx={gapPx} urgent={urgent} />
              ));
            })()}
          </div>

          {/* "Vault opens" line */}
          <div style={{
            position: "absolute", top: `${BOX.OPENS_TOP}%`, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap",
            color: "rgba(160,160,160,0.85)", fontFamily: "'Arial Narrow', Arial, sans-serif", fontSize: `${opensPx}px`,
            letterSpacing: "0.16em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.4em",
          }}>
            <span style={{ opacity: 0.7 }}>⏰</span>
            The Vault Opens Thursday 9:00 AM PST
          </div>

          {/* Notify form */}
          <NotifyFormOverlay
            boxLeft={BOX.FM_LEFT} boxTop={BOX.FM_TOP} boxWidth={BOX.FM_WIDTH} boxHeight={BOX.FM_HEIGHT}
            fmW={fmW} fmH={fmH} formHdrPx={formHdrPx} inputHpx={inputHpx} inputFpx={inputFpx} btnHpx={btnHpx} formGap={formGap}
            dropHandle={collectionHandle} dropTitle={title}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Notify form (absolutely positioned over artwork) ─── */
function NotifyFormOverlay({
  boxLeft, boxTop, boxWidth, boxHeight,
  fmW, fmH, formHdrPx, inputHpx, inputFpx, btnHpx, formGap,
  dropHandle, dropTitle,
}: {
  boxLeft: number; boxTop: number; boxWidth: number; boxHeight: number;
  fmW: number; fmH: number;
  formHdrPx: number; inputHpx: number; inputFpx: number; btnHpx: number; formGap: number;
  dropHandle: string; dropTitle: string;
}) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim() && !phone.trim()) {
      toast.error("Enter your email or phone number");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("drop_notifications").insert({
      email: email || null,
      phone: phone ? phone.replace(/\D/g, "") : null,
      drop_handle: dropHandle,
    });
    setLoading(false);
    if (error) {
      toast.error("Something went wrong — try again");
      return;
    }
    setSubmitted(true);

    const rawPhone = phone ? phone.replace(/\D/g, "") : null;
    supabase.functions.invoke("attentive-drop-notify", {
      body: {
        email: email || null,
        phone: rawPhone ? `+1${rawPhone}` : null,
        dropHandle,
        dropTitle: dropTitle || dropHandle,
      },
    }).catch((err) => console.warn("Attentive sync failed (non-critical):", err));
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: `${inputHpx}px`,
    background: "rgba(8,8,8,0.88)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "2px",
    color: "#ccc",
    fontFamily: "'Arial Narrow', Arial, sans-serif",
    fontSize: `${inputFpx}px`,
    letterSpacing: "0.06em",
    padding: `0 ${Math.round(inputHpx * 0.2)}px`,
    outline: "none",
    boxSizing: "border-box",
    caretColor: "#e8a800",
    flexShrink: 0,
  };

  return (
    <div
      style={{
        position: "absolute",
        left: `${boxLeft}%`,
        top: `${boxTop}%`,
        width: `${boxWidth}%`,
        height: `${boxHeight}%`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: `${formGap}px`,
        padding: `${Math.round(fmH * 0.06)}px ${Math.round(fmW * 0.03)}px`,
        boxSizing: "border-box",
      }}
    >
      <div style={{
        textAlign: "center",
        color: "rgba(130,130,130,0.9)",
        fontFamily: "'Arial Narrow', Arial, sans-serif",
        fontSize: `${formHdrPx}px`,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        flexShrink: 0,
      }}>
        Get Notified When It Drops
      </div>

      {submitted ? (
        <div style={{
          textAlign: "center",
          color: "#e8a800",
          fontFamily: "'Arial Narrow', Arial, sans-serif",
          fontSize: `${Math.round(formHdrPx * 1.2)}px`,
          letterSpacing: "0.1em",
          textShadow: "0 0 14px rgba(232,168,0,0.55)",
        }}>
          ✓ You're on the list
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: `${formGap}px`,
            width: "100%",
          }}
        >
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: `${btnHpx}px`,
              flexShrink: 0,
              background: email.trim()
                ? "linear-gradient(135deg, #f0a800 0%, #c48000 100%)"
                : "rgba(90,65,0,0.5)",
              border: "none",
              borderRadius: "2px",
              color: email.trim() ? "#111" : "#504030",
              fontFamily: "'Arial Narrow', Arial, sans-serif",
              fontWeight: "700",
              fontSize: `${inputFpx}px`,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: email.trim() ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.45em",
              transition: "background 0.18s, transform 0.1s",
              boxSizing: "border-box",
              opacity: loading ? 0.6 : 1,
            }}
          >
            🔔 {loading ? "SIGNING UP…" : "NOTIFY ME"}
          </button>
        </form>
      )}
    </div>
  );
}

/* ─── Main page (dynamic by slug) ─── */
export default function CapsuleDropPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: drop, isLoading } = useDropConfig(slug);

  if (isLoading) {
    return (
      <>
        <SiteHeader />
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <SiteFooter />
      </>
    );
  }

  if (!drop) {
    return (
      <>
        <SiteHeader />
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
          <Lock className="w-12 h-12 text-muted-foreground mb-4" />
          <h1 className="font-hudson text-2xl text-foreground mb-2">Drop Not Found</h1>
          <p className="text-muted-foreground text-sm">This drop doesn't exist or hasn't been activated yet.</p>
          <Link to="/" className="mt-6 text-primary text-sm underline underline-offset-4">
            Back to Home
          </Link>
        </div>
        <SiteFooter />
      </>
    );
  }

  return <DropContent drop={drop} />;
}

/* ─── Vault SFX hook (cached in storage) ─── */
const VAULT_SFX_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/sfx/vault-open.mp3`;

function useVaultSfx() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(VAULT_SFX_URL);
    audio.volume = 0.6;
    audio.preload = "auto";
    audioRef.current = audio;
  }, []);

  const play = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn("Vault SFX failed (non-critical):", err);
    }
  }, []);

  return { play };
}

/* ─── Vault Opening Animation (black fade) ─── */
function VaultOpeningAnimation({ onComplete }: { onComplete: () => void }) {
  const sfx = useVaultSfx();
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    sfx.play();
    const t = setTimeout(() => onCompleteRef.current(), 1800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
    />
  );
}

function DropContent({ drop }: { drop: NonNullable<ReturnType<typeof useDropConfig>["data"]> }) {
  const countdown = useCountdown(new Date(drop.drop_date));
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);
  const wasLockedRef = useRef(!countdown.isLive);
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown.isLive && wasLockedRef.current && !animationDone) {
      setShowAnimation(true);
      wasLockedRef.current = false;
    }
  }, [countdown.isLive, animationDone]);

  const alreadyLive = countdown.isLive && !showAnimation && !animationDone;

  useEffect(() => {
    if (alreadyLive) {
      navigate(`/collections/${drop.collection_handle}`, { replace: true });
    }
  }, [alreadyLive, navigate, drop.collection_handle]);

  const handleAnimationComplete = useCallback(() => {
    setShowAnimation(false);
    setAnimationDone(true);
    navigate(`/collections/${drop.collection_handle}`, { replace: true });
  }, [navigate, drop.collection_handle]);

  return (
    <>
      <SEO
        title={`${drop.title} — Coming Soon | Sullen Clothing`}
        description={`${drop.title} ${drop.subtitle || "capsule"} drops soon. Premium artist-driven designs forged in ink.`}
      />
      <SiteHeader />

      {showAnimation && <VaultOpeningAnimation onComplete={handleAnimationComplete} />}

      <motion.div
        key="locked"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <VaultDoor
          countdown={countdown.isLive ? { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true } : countdown}
          title={drop.title}
          subtitle={drop.subtitle || ""}
          teaserLabel={drop.teaser_label || "Incoming Drop"}
          collectionHandle={drop.collection_handle}
        />
      </motion.div>
      <SiteFooter />
    </>
  );
}
