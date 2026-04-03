import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useCollectionProducts } from "@/hooks/useCollectionProducts";
import { shopifyImg } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const TABS = [
  { label: "Best Sellers", handle: "best-sellers" },
  { label: "1 Ton Tees", handle: "1-ton-tees" },
  { label: "Premium Tees", handle: "premium" },
  { label: "Standard Tees", handle: "standard-tees" },
];

function TabProducts({ handle }: { handle: string }) {
  const { products, loading } = useCollectionProducts(handle, 12);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-w-[260px] flex-shrink-0">
            <Skeleton className="aspect-[3/4] w-full rounded-sm" />
            <Skeleton className="h-4 w-3/4 mt-3" />
            <Skeleton className="h-3 w-1/3 mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        No products found in this collection.
      </p>
    );
  }

  return (
    <div className="relative group/scroll">
      {/* Scroll arrows */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground/70 hover:text-foreground hover:border-foreground/40 transition-all opacity-0 group-hover/scroll:opacity-100 -translate-x-1/2"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground/70 hover:text-foreground hover:border-foreground/40 transition-all opacity-0 group-hover/scroll:opacity-100 translate-x-1/2"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((product, idx) => (
          <motion.div
            key={product.href}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
            className="w-[200px] sm:w-[240px] lg:w-[260px] flex-shrink-0 group"
          >
            <Link to={product.href}>
              <div className="aspect-[3/4] rounded-sm overflow-hidden bg-secondary mb-2 relative">
                {product.image && (
                  <img
                    src={shopifyImg(product.image)}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                )}
                {product.compareAtPrice && product.numericPrice && (
                  <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] font-display uppercase tracking-wider px-2 py-0.5 rounded-sm">
                    {Math.round(((product.compareAtPrice - product.numericPrice) / product.compareAtPrice) * 20) * 5}% Off
                  </div>
                )}
              </div>
              <h3 className="font-display text-xs uppercase tracking-wider text-foreground truncate">
                {product.name}
              </h3>
              <p className="text-xs font-body text-muted-foreground mt-1 tabular-nums">
                {product.compareAtPrice ? (
                  <>
                    <span className="line-through text-muted-foreground/50 mr-1.5">
                      ${product.compareAtPrice.toFixed(2)}
                    </span>
                    {product.price}
                  </>
                ) : (
                  product.price
                )}
              </p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function TabbedCollections() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="py-10 lg:py-14">
      <div className="container max-w-7xl">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 lg:mb-8 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: "none" }}>
          {TABS.map((tab, i) => (
            <button
              key={tab.handle}
              onClick={() => setActiveTab(i)}
              className={`relative whitespace-nowrap px-4 py-2 text-xs font-display uppercase tracking-[0.15em] transition-all duration-200 rounded-sm ${
                i === activeTab
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Products */}
        <TabProducts handle={TABS[activeTab].handle} />

        {/* View All */}
        <div className="mt-6 flex justify-center">
          <Link
            to={`/collections/${TABS[activeTab].handle}`}
            className="inline-flex items-center gap-2 text-xs font-display uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground transition-colors"
          >
            View All
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
