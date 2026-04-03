import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMarketingImages } from "@/hooks/useMarketingImages";
import { useIsMobile } from "@/hooks/use-mobile";

interface Slide {
  image: string;
  mobileImage?: string;
  videoUrl?: string;
  mobileVideoUrl?: string;
  label: string;
  title: string;
  href: string;
}

const fallbackSlides: Slide[] = [
  {
    image: "https://cdn.shopify.com/s/files/1/1096/0120/files/web-BANNER-LASTY-TATTOOER.jpg?v=1773697393",
    label: "Artist Series",
    title: "Lasty Tattooer",
    href: "/artist/lastly-tattooer/shop",
  },
  {
    image: "https://cdn.shopify.com/s/files/1/1096/0120/files/web-BANNER-ZACH-GOLDIN.jpg?v=1773091548",
    label: "Artist Series",
    title: "Zach Goldin",
    href: "/artist/zach-goldin/shop",
  },
  {
    image: "https://cdn.shopify.com/s/files/1/1096/0120/files/web-BANNER-SECRETE-ANGEL_058ed381-5d9f-46d0-9aeb-450466356528.jpg?v=1771957332",
    label: "Artist Series",
    title: "Secrete Angel",
    href: "/collections/new-releases",
  },
  {
    image: "https://cdn.shopify.com/s/files/1/1096/0120/files/web-BANNER-CHERUBs.jpg?v=1771453523",
    label: "Cherubs Capsule",
    title: "",
    href: "/collections/cherubs-capsule",
  },
  {
    image: "https://cdn.shopify.com/s/files/1/1096/0120/files/web-BANNER-CHERUBs.jpg?v=1771453523",
    label: "March Artist Series",
    title: "Artist Series Bundle",
    href: "/collections/march-artist-series-bundle",
  },
];

export function HeroSlider() {
  const { data: dbImages } = useMarketingImages("hero_slider");
  
  const slides = useMemo(() => {
    if (dbImages && dbImages.length > 0) {
      return dbImages.map((img) => ({
        image: img.image_url,
        mobileImage: img.mobile_image_url || undefined,
        videoUrl: (img as any).video_url || undefined,
        mobileVideoUrl: (img as any).mobile_video_url || undefined,
        label: img.subtitle || "",
        title: img.title || "",
        href: img.link_href || "/collections/new-releases",
      }));
    }
    return fallbackSlides;
  }, [dbImages]);

  const isMobile = useIsMobile();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = useCallback((index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  }, [current]);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];
  const currentImage = (isMobile && slide.mobileImage) ? slide.mobileImage : slide.image;
  const currentVideo = (isMobile && slide.mobileVideoUrl) ? slide.mobileVideoUrl : slide.videoUrl;
  const isVideoSlide = !!currentVideo;

  const imageVariants = {
    enter: (dir: number) => ({
      opacity: 0,
      scale: isMobile ? 1 : 1.05,
      x: isMobile ? 0 : dir * 60,
    }),
    center: { opacity: 1, scale: 1, x: 0 },
    exit: (dir: number) => ({
      opacity: 0,
      scale: isMobile ? 1 : 0.98,
      x: isMobile ? 0 : dir * -60,
    }),
  };

  // Swipe gesture support
  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const SWIPE_THRESHOLD = 50;
  const SWIPE_MAX_Y = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY, t: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = Math.abs(touch.clientY - touchStart.current.y);
    touchStart.current = null;

    if (dy > SWIPE_MAX_Y) return; // vertical scroll, ignore
    if (dx < -SWIPE_THRESHOLD) next();
    else if (dx > SWIPE_THRESHOLD) prev();
  }, [next, prev]);

  const { scrollY } = useScroll();
  const parallaxScale = useTransform(scrollY, [0, 600], [1, isMobile ? 1 : 1.15]);
  const parallaxY = useTransform(scrollY, [0, 600], [0, isMobile ? 0 : 80]);

  return (
    <section
      className="relative w-full h-[calc(100svh-108px)] max-h-[900px] overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background image — full bleed with parallax zoom */}
      <AnimatePresence custom={direction} mode={isMobile ? "sync" : "wait"}>
        <motion.div
          key={current}
          custom={direction}
          variants={imageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            duration: isMobile ? 0.5 : 0.8,
            ease: isMobile ? [0.4, 0, 0.2, 1] : [0.25, 0.1, 0.25, 1],
          }}
          className="absolute inset-0"
          style={{ scale: parallaxScale, y: parallaxY }}
        >
          {isVideoSlide ? (
            <video
              key={currentVideo}
              src={currentVideo}
              poster={currentImage}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={currentImage}
              alt={slide.title || slide.label}
              className="w-full h-full object-cover"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Subtle gradient for bottom-left text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-transparent" />

      {/* Content — bottom-left editorial placement like KITH */}
      <div className="absolute bottom-12 md:bottom-16 lg:bottom-20 left-4 md:left-8 lg:left-12 z-10 max-w-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            <p className="text-[10px] md:text-[11px] font-condensed font-semibold uppercase tracking-[0.5em] text-foreground/60 mb-2 md:mb-3">
              {slide.label}
            </p>
            {slide.title && (
              <h2 className="font-display text-4xl md:text-6xl lg:text-7xl uppercase tracking-wider text-foreground leading-[0.9] mb-4 md:mb-6">
                {slide.title}
              </h2>
            )}
            <Link
              to={slide.href}
              className="inline-block border border-foreground/60 text-foreground font-display text-[10px] md:text-[11px] uppercase tracking-[0.3em] px-8 md:px-10 py-3 md:py-3.5 hover:bg-foreground hover:text-background transition-all duration-300"
            >
              Shop Now
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Left/Right arrows */}
      <button
        onClick={prev}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots — bottom right with fill progress */}
      <div className="absolute bottom-6 md:bottom-8 right-6 md:right-10 flex gap-2.5 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`relative rounded-full overflow-hidden transition-all duration-300 ${
              i === current
                ? "w-7 h-2.5 bg-foreground/20"
                : "w-2.5 h-2.5 bg-foreground/35 hover:bg-foreground/60"
            }`}
          >
            {i === current && (
              <motion.div
                key={`fill-${current}`}
                className="absolute inset-0 bg-foreground rounded-full origin-left"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 6, ease: "linear" }}
              />
            )}
          </button>
        ))}
      </div>

    </section>
  );
}