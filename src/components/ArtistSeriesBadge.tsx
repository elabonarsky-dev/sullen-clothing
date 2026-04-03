import { Badge } from "@/components/ui/badge";
import sullenLogo from "@/assets/sullen-logo.png";

/**
 * Shared Artist Series badge — use in all PDP contexts to keep branding consistent.
 * Positioned absolutely, so the parent must have `position: relative`.
 */
export function ArtistSeriesBadge() {
  return (
    <Badge
      variant="outline"
      className="absolute top-3 left-3 z-10 text-[10px] font-condensed font-semibold uppercase tracking-[0.3em] text-primary border-primary/30 bg-background/80 backdrop-blur-sm gap-1.5"
    >
      <img
        src={sullenLogo}
        alt="Sullen"
        className="h-3.5 w-auto"
        style={{
          filter:
            "invert(67%) sepia(89%) saturate(600%) hue-rotate(10deg) brightness(100%) contrast(95%)",
        }}
      />
      Artist Series
    </Badge>
  );
}
