import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Volume2, VolumeX } from "lucide-react";

type GalleryImage = string | { url: string; altText?: string | null };
type GalleryVideo = { type: "video"; url: string; poster?: string };
type GalleryItem = GalleryImage | GalleryVideo;

interface ImageGalleryProps {
  /** Array of image URLs, image objects, or video objects */
  images: GalleryItem[];
  productName?: string;
}

function isVideo(item: GalleryItem): item is GalleryVideo {
  return typeof item === "object" && "type" in item && item.type === "video";
}

function normalise(item: GalleryItem) {
  if (isVideo(item)) return { kind: "video" as const, url: item.url, poster: item.poster, alt: "Product video" };
  const img = typeof item === "string" ? { url: item, altText: null } : item;
  return { kind: "image" as const, url: img.url, alt: img.altText || "Product image" };
}

/**
 * Shared product image gallery with swipe support on mobile,
 * dot indicators, thumbnail strip on desktop, and inline video support.
 */
export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());

  const normalised = images.map(normalise);

  const goTo = useCallback(
    (i: number) => setSelectedIndex(Math.max(0, Math.min(i, images.length - 1))),
    [images.length]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const SWIPE_THRESHOLD = 50;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) goTo(selectedIndex + 1);
      else goTo(selectedIndex - 1);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (normalised.length === 0) {
    return <div className="aspect-[3/4] rounded-none md:rounded-lg bg-secondary" />;
  }

  return (
    <div className="space-y-0 md:space-y-3">
      {/* Main image / video */}
      <div
        className="relative aspect-[3/4] rounded-none md:rounded-lg overflow-hidden bg-secondary"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {normalised.map((item, i) =>
          item.kind === "video" ? (
            <video
              key={`v-${i}`}
              src={item.url}
              poster={item.poster}
              muted={isMuted}
              loop
              playsInline
              autoPlay={i === selectedIndex}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
              style={{ opacity: i === selectedIndex ? 1 : 0 }}
              ref={(el) => {
                if (!el) return;
                videoRefs.current.set(i, el);
                el.muted = isMuted;
                if (i === selectedIndex) el.play().catch(() => {});
                else el.pause();
              }}
            />
          ) : (
            <img
              key={`i-${i}`}
              src={item.url}
              alt={productName ? `${productName} - Image ${i + 1}` : item.alt}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
              style={{ opacity: i === selectedIndex ? 1 : 0 }}
            />
          )
        )}

        {/* Video badge — shown when not currently viewing the video */}
        {(() => {
          const videoIndex = normalised.findIndex((item) => item.kind === "video");
          if (videoIndex === -1 || videoIndex === selectedIndex) return null;
          return (
            <button
              onClick={() => setSelectedIndex(videoIndex)}
              className="absolute top-3 right-3 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm text-foreground text-xs font-medium px-2.5 py-1.5 rounded-full border border-border/50 shadow-sm hover:bg-background transition-colors z-10"
              aria-label="Watch product video"
            >
              <Video className="w-4 h-4 text-primary" />
              <span>Watch</span>
            </button>
          );
        })()}

        {/* Mute / Unmute toggle — shown when viewing a video */}
        {normalised[selectedIndex]?.kind === "video" && (
          <button
            onClick={() => {
              setIsMuted((prev) => {
                const next = !prev;
                videoRefs.current.forEach((el) => { el.muted = next; });
                return next;
              });
            }}
            className="absolute top-3 right-3 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm text-foreground text-xs font-medium px-2.5 py-1.5 rounded-full border border-border/50 shadow-sm hover:bg-background transition-colors z-10"
            aria-label={isMuted ? "Unmute video" : "Mute video"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-primary" /> : <Volume2 className="w-4 h-4 text-primary" />}
            <span>{isMuted ? "Unmute" : "Mute"}</span>
          </button>
        )}

        {/* Dot indicators */}
        {normalised.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {normalised.map((item, i) => (
              <button
                key={i}
                onClick={() => setSelectedIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === selectedIndex
                    ? "w-5 bg-primary"
                    : "w-1.5 bg-foreground/30 hover:bg-foreground/50"
                }`}
                aria-label={item.kind === "video" ? "View video" : `View image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip — desktop only */}
      {normalised.length > 1 && (
        <div className="hidden md:flex gap-2 px-0 overflow-x-auto scrollbar-hide">
          {normalised.map((item, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`relative flex-shrink-0 w-16 h-20 rounded-md overflow-hidden border-2 transition-all duration-300 ${
                i === selectedIndex
                  ? "border-primary"
                  : "border-transparent opacity-60 hover:opacity-90 hover:border-border"
              }`}
            >
              {item.kind === "video" ? (
                <>
                  {item.poster ? (
                    <img src={item.poster} alt="Video thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Video className="w-5 h-5 text-foreground/60" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-background/30">
                    <Video className="w-4 h-4 text-foreground" />
                  </div>
                </>
              ) : (
                <img src={item.url} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}