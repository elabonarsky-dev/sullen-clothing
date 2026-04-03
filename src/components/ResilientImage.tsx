import { useState, useRef, ImgHTMLAttributes } from "react";
import { getPortraitFallbacks, shopifyImg } from "@/lib/utils";

interface ResilientImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackElement?: React.ReactNode;
}

/**
 * Image component that automatically tries alternative CDN URL patterns
 * (myshopify.com ↔ sullenclothing.com, articles/ ↔ files/) before
 * falling back to a placeholder element.
 */
export function ResilientImage({ src, fallbackElement, onLoad, onError, ...props }: ResilientImageProps) {
  const normalizedSrc = src ? shopifyImg(src) : src;
  const [currentSrc, setCurrentSrc] = useState(normalizedSrc);
  const [failed, setFailed] = useState(false);
  const fallbacksRef = useRef(normalizedSrc ? getPortraitFallbacks(normalizedSrc) : []);

  if (failed || !currentSrc) {
    return <>{fallbackElement ?? null}</>;
  }

  return (
    <img
      {...props}
      src={currentSrc}
      onLoad={onLoad}
      onError={(e) => {
        const next = fallbacksRef.current.shift();
        if (next) {
          setCurrentSrc(next);
        } else {
          setFailed(true);
          onError?.(e);
        }
      }}
    />
  );
}
