import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SizeOption {
  value: string;
  available: boolean;
}

interface StickyAddToCartProps {
  productName: string;
  price: string;
  onAddToCart: () => void;
  isLoading: boolean;
  isSoldOut: boolean;
  hasSelection: boolean;
  /** Ref to the main Add to Cart button — sticky bar appears when this scrolls out */
  triggerRef: React.RefObject<HTMLElement | null>;
  /** Size options to display inline */
  sizes?: SizeOption[];
  selectedSize?: string | null;
  onSizeSelect?: (size: string) => void;
}

export function StickyAddToCart({
  productName,
  price,
  onAddToCart,
  isLoading,
  isSoldOut,
  hasSelection,
  triggerRef,
  sizes,
  selectedSize,
  onSizeSelect,
}: StickyAddToCartProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [triggerRef]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.15)]"
        >
          <div className="container max-w-6xl py-3 space-y-2">
            {/* Top row: product info + button */}
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-display uppercase tracking-wider text-foreground truncate">
                  {productName}
                </p>
                <p className="text-sm font-body text-muted-foreground">{price}</p>
              </div>
              <Button
                className="h-11 px-6 text-sm font-display uppercase tracking-[0.15em] rounded-sm shadow-lg shadow-primary/20 flex-shrink-0"
                onClick={onAddToCart}
                disabled={isLoading || isSoldOut || !hasSelection}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSoldOut ? (
                  "Sold Out"
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
            </div>

            {/* Size selector row */}
            {sizes && sizes.length > 0 && onSizeSelect && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
                {sizes.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => s.available && onSizeSelect(s.value)}
                    disabled={!s.available}
                    className={`min-w-[40px] px-2.5 py-1.5 text-[11px] font-display uppercase tracking-wider rounded-sm border transition-all flex-shrink-0 ${
                      selectedSize === s.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : s.available
                          ? "border-border text-foreground/70 hover:border-primary/50 hover:text-foreground"
                          : "border-border/30 text-muted-foreground/30 cursor-not-allowed line-through"
                    }`}
                  >
                    {s.value}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
