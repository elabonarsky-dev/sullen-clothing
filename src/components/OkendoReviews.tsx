import { useEffect, useRef } from "react";

interface OkendoReviewsProps {
  productId: string;
}

declare global {
  interface Window {
    okeWidgetApi?: {
      initWidget: (el: HTMLElement) => void;
    };
  }
}

export function OkendoReviews({ productId }: OkendoReviewsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Try to initialize immediately, or wait for script to load
    const initWidget = () => {
      if (window.okeWidgetApi && containerRef.current) {
        window.okeWidgetApi.initWidget(containerRef.current);
      }
    };

    initWidget();

    // Also listen for the script's ready event
    const handleReady = () => initWidget();
    document.addEventListener("oke-reviews-widget-loaded", handleReady);

    // Retry after a short delay in case the script is still loading
    const timeout = setTimeout(initWidget, 1500);

    return () => {
      document.removeEventListener("oke-reviews-widget-loaded", handleReady);
      clearTimeout(timeout);
    };
  }, [productId]);

  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <div
          ref={containerRef}
          data-oke-reviews-widget
          data-oke-reviews-product-id={productId}
          data-oke-reviews-subscriber-id="ad92a7fe-22d5-46ea-9e6c-e3c89606274e"
        />
      </div>
    </section>
  );
}
