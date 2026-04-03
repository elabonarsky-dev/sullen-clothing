import { useEffect, useRef } from "react";

interface OkendoStarRatingProps {
  productId: string;
}

declare global {
  interface Window {
    okeWidgetApi?: {
      initWidget: (el: HTMLElement) => void;
    };
  }
}

export function OkendoStarRating({ productId }: OkendoStarRatingProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const initWidget = () => {
      if (window.okeWidgetApi && containerRef.current) {
        window.okeWidgetApi.initWidget(containerRef.current);
      }
    };

    initWidget();
    const handleReady = () => initWidget();
    document.addEventListener("oke-reviews-widget-loaded", handleReady);
    const timeout = setTimeout(initWidget, 1500);

    return () => {
      document.removeEventListener("oke-reviews-widget-loaded", handleReady);
      clearTimeout(timeout);
    };
  }, [productId]);

  return (
    <div
      ref={containerRef}
      data-oke-reviews-star-rating-widget
      data-oke-reviews-product-id={productId}
      data-oke-reviews-subscriber-id="ad92a7fe-22d5-46ea-9e6c-e3c89606274e"
      className="mt-2"
    />
  );
}
