import { useState, useRef, useEffect } from "react";
import twentyFiveBadge from "@/assets/25-year-badge.png";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight, Star, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCollectionProducts, CollectionProduct } from "@/hooks/useCollectionProducts";
import { useProductVideos } from "@/hooks/useProductVideos";

const tabConfig = [
  { label: "New Releases", key: "new", handle: "new-releases", href: "/collections/new-releases" },
  { label: "Best Sellers", key: "best", handle: "best-sellers", href: "/collections/best-sellers" },
  { label: "1 Ton Tees", key: "1ton", handle: "1-ton-tees", href: "/collections/1-ton-tees" },
  { label: "Premium Tees", key: "premium", handle: "premium", href: "/collections/premium" },
  { label: "Standard Tees", key: "standard", handle: "standard-tees", href: "/collections/standard-tees" },
];

function ProductCard({ product }: { product: CollectionProduct }) {
  const handle = product.href.replace("/product/", "");
  const { hasVideo } = useProductVideos();
  const showVideo = hasVideo(handle);
  const onSale = !!product.compareAtPrice && !!product.numericPrice;
  const discountPct = onSale
    ? Math.round(((product.compareAtPrice! - product.numericPrice!) / product.compareAtPrice!) * 100 / 5) * 5
    : 0;

  return (
    <Link
      to={product.href}
      className="flex-shrink-0 w-[70vw] sm:w-[280px] lg:w-[300px] group snap-start"
    >
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary mb-3">
        {onSale && (
          <span className="absolute top-3 left-3 z-10 bg-destructive text-destructive-foreground text-[10px] font-display uppercase tracking-wider px-2.5 py-1 rounded-sm shadow-sm">
            {discountPct}% Off
          </span>
        )}
        {product.badge && !onSale && (
          <span className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground text-[10px] font-display uppercase tracking-wider px-2.5 py-1 rounded-sm">
            {product.badge}
          </span>
        )}
        {handle.includes("25-to-life") && (
          <img
            src={twentyFiveBadge}
            alt="Sullen 25th Anniversary"
            className={`absolute ${onSale ? 'top-10' : 'top-2'} left-2 z-10 w-[60px] h-[60px] object-contain drop-shadow-lg`}
          />
        )}
        {showVideo && (
          <span className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-background/80 backdrop-blur-sm text-foreground text-[10px] font-display uppercase tracking-wider px-2 py-1 rounded-full border border-border/50 shadow-sm">
            <Video className="w-3 h-3 text-primary" />
          </span>
        )}
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex flex-col justify-end p-4">
          <span className="inline-flex items-center gap-1.5 font-display text-xs uppercase tracking-[0.2em] text-primary">
            Choose Options <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
      <h3 className="font-display text-sm uppercase tracking-wider text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-1">
        {product.name}
      </h3>
      <div className="flex items-center gap-2 mt-1">
        <span className={`text-sm font-body ${onSale ? "text-destructive" : "text-muted-foreground"}`}>
          {product.price}
        </span>
        {onSale && (
          <span className="text-xs text-muted-foreground/60 line-through font-body">
            ${product.compareAtPrice!.toFixed(2)}
          </span>
        )}
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[70vw] sm:w-[280px] lg:w-[300px] snap-start animate-pulse">
      <div className="aspect-[3/4] rounded-lg bg-secondary mb-3" />
      <div className="h-4 w-3/4 bg-secondary rounded mb-2" />
      <div className="h-3 w-1/3 bg-secondary rounded" />
    </div>
  );
}

function TabProducts({ handle }: { handle: string }) {
  const { products, loading } = useCollectionProducts(handle, 8);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el.removeEventListener("scroll", checkScroll);
  }, [products]);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-12 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-12 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      )}

      <div
        ref={scrollRef}
        className="flex gap-4 lg:gap-5 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : products.map((product, i) => (
              <ProductCard key={`${handle}-${i}`} product={product} />
            ))}
        {!loading && products.length === 0 && (
          <p className="text-muted-foreground text-sm py-8">No products found in this collection.</p>
        )}
      </div>

      <button
        onClick={() => scroll(-1)}
        disabled={!canScrollLeft}
        className="absolute -left-4 top-[35%] -translate-y-1/2 w-11 h-11 rounded-full bg-card/90 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:border-primary hover:text-primary transition-all shadow-xl disabled:opacity-0 disabled:pointer-events-none hidden lg:flex z-20"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => scroll(1)}
        disabled={!canScrollRight}
        className="absolute -right-4 top-[35%] -translate-y-1/2 w-11 h-11 rounded-full bg-card/90 backdrop-blur-sm border border-border flex items-center justify-center text-foreground hover:border-primary hover:text-primary transition-all shadow-xl disabled:opacity-0 disabled:pointer-events-none hidden lg:flex z-20"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

export function ProductGrid() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const tab = tabConfig[activeTab];

  return (
    <section className="py-12 lg:py-16">
      <div className="container max-w-7xl">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto scrollbar-hide">
          {tabConfig.map((t, i) => (
            <button
              key={t.key}
              onClick={() => {
                if (i === activeTab) {
                  navigate(t.href);
                } else {
                  setActiveTab(i);
                }
              }}
              className={`relative px-5 py-2.5 text-[12px] font-display uppercase tracking-[0.18em] whitespace-nowrap transition-all duration-300 rounded-sm ${
                i === activeTab
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Products carousel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <TabProducts handle={tab.handle} />
          </motion.div>
        </AnimatePresence>

        {/* View All link */}
        <div className="mt-6 text-center">
          <Link
            to={tab.href}
            className="inline-flex items-center gap-2 text-xs font-display uppercase tracking-[0.25em] text-muted-foreground hover:text-primary transition-colors group"
          >
            View All
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
