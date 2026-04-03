import { Link } from "react-router-dom";
import { useFeaturedProduct, type FeaturedSlide, type FeaturedCollectionProduct } from "@/hooks/useFeaturedProduct";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowRight, ShoppingBag, Check, Loader2, ChevronLeft, ChevronRight, Package, ChevronDown, X, Gift } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";

const vp = { once: true, amount: 0.1 as const };

function CollectionSlide({ slide, onBundleToggle }: { slide: FeaturedSlide; onBundleToggle?: (open: boolean) => void }) {
  const collection = slide.collection!;
  const bgUrl = slide.backgroundImageUrl;
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [bundleOpen, setBundleOpen] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  

  const allSizes = useMemo(() => {
    const sizeSet = new Set<string>();
    collection.products.forEach((p) => {
      const sizeOpt = p.options.find((o) => o.name.toLowerCase() === "size");
      sizeOpt?.values.forEach((v) => sizeSet.add(v));
    });
    return Array.from(sizeSet);
  }, [collection.products]);

  const getProductsForSize = useCallback(
    (size: string): { product: FeaturedCollectionProduct; variant: any }[] => {
      return collection.products
        .map((p) => {
          const variant = p.variants.find(
            (v) =>
              v.availableForSale &&
              v.selectedOptions.some((o) => o.name.toLowerCase() === "size" && o.value === size)
          );
          return variant ? { product: p, variant } : null;
        })
        .filter(Boolean) as any[];
    },
    [collection.products]
  );

  const availableForSize = selectedSize ? getProductsForSize(selectedSize) : [];
  const availableCount = availableForSize.length;

  // Homepage: auto-select ALL items for the chosen size
  const pickedItems = availableForSize;
  const isBundleComplete = pickedItems.length >= 4;
  const sortedByPrice = [...pickedItems].sort((a, b) => parseFloat(a.variant.price.amount) - parseFloat(b.variant.price.amount));
  const freeItem = isBundleComplete ? sortedByPrice[0] : null;
  const bundleTotal = pickedItems.reduce((sum, { variant }) => sum + parseFloat(variant.price.amount), 0);
  const discountAmount = freeItem ? parseFloat(freeItem.variant.price.amount) : 0;
  const finalPrice = bundleTotal - discountAmount;

  const handleBundleAdd = async () => {
    if (!selectedSize || pickedItems.length === 0) return;
    setIsAdding(true);
    try {
      const bundleTag = collection.handle === "bro_oks" ? "bro_oks" : "cherubs-capsule";
      const discountCode = collection.handle === "bro_oks" ? "BROOKS4" : "CHERUBS4";
      for (const { product, variant } of pickedItems) {
        await addItem({
          product: {
            node: {
              id: product.rawNode.id,
              title: product.title,
              description: product.rawNode.description || "",
              handle: product.handle,
              priceRange: product.rawNode.priceRange,
              images: product.rawNode.images,
              variants: product.rawNode.variants,
              options: product.rawNode.options,
            },
          },
          variantId: variant.id,
          variantTitle: variant.title,
          price: variant.price,
          quantity: 1,
          selectedOptions: variant.selectedOptions,
          bundleTag,
        });
      }
      // Automatic discounts apply at checkout — no code needed
      setJustAdded(true);
      if (isBundleComplete) {
        toast.success(`Bundle added — 1 item FREE!`, {
          description: `${pickedItems.length} items in ${selectedSize} · You save $${discountAmount.toFixed(2)} · Discount applies at checkout`,
          position: "top-center",
        });
      } else {
        const remaining = 4 - pickedItems.length;
        toast.success(`${pickedItems.length} tee${pickedItems.length > 1 ? "s" : ""} added!`, {
          description: `Add ${remaining} more to unlock Buy 3 Get 1 Free`,
          position: "top-center",
        });
      }
      setTimeout(() => setJustAdded(false), 2500);
    } catch (err) {
      console.error("Bundle add failed:", err);
      toast.error("Failed to add items");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div ref={sectionRef} className="relative w-full border-t border-b border-primary/50 overflow-hidden">
      {/* Background with parallax */}
      <div className="absolute inset-[-20%_0] z-0">
        {bgUrl ? (
          <>
            <motion.img
              src={bgUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              style={isMobile ? undefined : { y: bgY }}
            />
            <div className="absolute inset-0 bg-background/85" />
          </>
        ) : (
          <div className="w-full h-full bg-card/30" />
        )}
      </div>

      <div className="container max-w-7xl relative z-10 py-10 pb-16 lg:py-14 lg:pb-20">
        <motion.div
          className="mb-6 lg:mb-8"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="text-[10px] font-condensed font-semibold uppercase tracking-[0.5em] text-primary/70">
            ★ Featured Collection
          </span>
          <h2
            className="font-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-wide text-foreground leading-[0.95] mt-2"
            style={{ textWrap: "balance" }}
          >
            {collection.title}
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {collection.products.map((p, idx) => {
            const hasSize =
              selectedSize &&
              p.variants.some(
                (v) =>
                  v.availableForSale &&
                  v.selectedOptions.some((o) => o.name.toLowerCase() === "size" && o.value === selectedSize)
              );
            const isInBundle = selectedSize && hasSize && bundleOpen;
            const isFree = freeItem?.product.handle === p.handle;
            return (
              <motion.div
                key={p.handle}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: idx * 0.06 }}
                className={`group block transition-opacity duration-300 ${
                  selectedSize ? (hasSize ? "opacity-100" : "opacity-40 pointer-events-none") : "opacity-100"
                }`}
              >
                <Link to={`/product/${p.handle}`}>
                  <div className="aspect-[3/4] rounded-sm overflow-hidden bg-secondary mb-2 relative">
                    {p.image && (
                      <img
                        src={p.image}
                        alt={p.title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    )}
                    {isInBundle && isFree && (
                      <div className="absolute top-2 left-2 bg-green-600 text-green-50 text-[10px] font-display uppercase tracking-wider px-2 py-1 rounded-sm flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        Free
                      </div>
                    )}
                    {isInBundle && !isFree && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-display uppercase tracking-wider px-2 py-1 rounded-sm">
                        ✓ {selectedSize}
                      </div>
                    )}
                    {selectedSize && hasSize && !bundleOpen && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-display uppercase tracking-wider px-2 py-1 rounded-sm">
                        {selectedSize}
                      </div>
                    )}
                  </div>
                </Link>
                <h3 className="font-display text-xs uppercase tracking-wider text-foreground truncate">
                  {p.title}
                </h3>
                <p className={`text-xs font-body tabular-nums mt-1 ${isInBundle && isFree ? "line-through text-muted-foreground/50" : "text-muted-foreground"}`}>
                  ${p.price}
                </p>
              </motion.div>
            );
          })}
        </div>

        {allSizes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={vp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="mt-6 lg:mt-8 flex justify-center"
          >
            <AnimatePresence mode="wait">
              {!bundleOpen ? (
                <motion.button
                  key="bundle-trigger"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, scale: [1, 1.02, 1] }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, scale: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.5 } }}
                  onClick={() => { setBundleOpen(true); onBundleToggle?.(true); }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-border/50 rounded-sm px-4 py-2.5 text-xs font-display uppercase tracking-[0.2em] text-foreground/70 hover:text-foreground hover:border-foreground/40 transition-colors duration-200 active:scale-[0.97] bg-card/30 backdrop-blur-sm"
                >
                  <Gift className="w-3.5 h-3.5 text-primary" />
                  Bundle & Save — Buy 3 Get 1 Free
                  <ChevronDown className="w-3 h-3 ml-1" />
                </motion.button>
              ) : (
                <motion.div
                  key="bundle-panel"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden w-full max-w-md"
                >
                  <div className="border border-border/50 rounded-sm p-4 lg:p-5 bg-card/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Gift className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-display uppercase tracking-[0.15em] text-foreground">
                          Buy 3 Get 1 Free
                        </span>
                      </div>
                      <button
                        onClick={() => { setBundleOpen(false); setSelectedSize(null); onBundleToggle?.(false); }}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Pick your size — all 4 tees auto-selected */}
                    <p className="text-[10px] font-body uppercase tracking-wider text-muted-foreground mb-2">Pick your size — all 4 tees included</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {allSizes.map((size) => {
                        const count = getProductsForSize(size).length;
                        const hasAll = count >= 4;
                        const isActive = selectedSize === size;
                        return (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(isActive ? null : size)}
                            disabled={count === 0}
                            className={`min-w-[2.5rem] px-2 py-1.5 text-xs font-body font-medium uppercase tracking-wider transition-all duration-200 rounded-sm border active:scale-[0.96] ${
                              count === 0
                                ? "border-border/30 text-muted-foreground/30 cursor-not-allowed line-through"
                                : isActive
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border/50 text-foreground/70 hover:border-foreground/40"
                            }`}
                          >
                            {size}
                            {!hasAll && count > 0 && <span className="text-[8px] ml-0.5 opacity-50">({count})</span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Bundle summary */}
                    <AnimatePresence mode="wait">
                      {selectedSize && availableCount > 0 ? (
                        <motion.div
                          key="bundle-summary"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          {isBundleComplete && freeItem && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-2 mb-3 p-2 rounded-sm bg-green-500/10 border border-green-500/20"
                            >
                              <Gift className="w-3.5 h-3.5 text-green-500 shrink-0" />
                              <p className="text-xs font-body text-green-400">
                                <span className="font-medium">{freeItem.product.title}</span> is free!
                              </p>
                            </motion.div>
                          )}

                          {!isBundleComplete && (
                            <p className="text-xs font-body text-muted-foreground mb-3">
                              {availableCount} of 4 tees available in {selectedSize} — add {4 - availableCount} more from the{" "}
                              <Link to={`/collections/${collection.handle}`} className="underline text-primary hover:text-primary/80">collection page</Link>{" "}
                              to unlock the free tee
                            </p>
                          )}

                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs font-body text-muted-foreground">
                              <span className="text-foreground/60">{pickedItems.length} tees</span>
                              {isBundleComplete && (
                                <>
                                  {" · "}
                                  <span className="line-through tabular-nums">${bundleTotal.toFixed(2)}</span>{" "}
                                  <span className="text-foreground font-medium tabular-nums">${finalPrice.toFixed(2)}</span>
                                </>
                              )}
                              {!isBundleComplete && (
                                <>
                                  {" · "}
                                  <span className="tabular-nums">${bundleTotal.toFixed(2)}</span>
                                </>
                              )}
                            </div>
                            <button
                              onClick={handleBundleAdd}
                              disabled={pickedItems.length === 0 || isAdding || justAdded}
                              className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-display text-[10px] uppercase tracking-[0.2em] px-4 py-2 transition-all duration-300 hover:shadow-[0_4px_24px_hsl(var(--primary)/0.25)] active:scale-[0.97] disabled:opacity-50 whitespace-nowrap rounded-sm"
                            >
                              {isAdding ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : justAdded ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  Added
                                </>
                              ) : (
                                <>
                                  <ShoppingBag className="w-3 h-3" />
                                  Add All to Cart
                                </>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      ) : selectedSize ? (
                        <motion.p
                          key="none-available"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-xs font-body text-muted-foreground"
                        >
                          No items in {selectedSize}
                        </motion.p>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        <div className="mt-4 flex justify-center">
          <Link
            to={`/collections/${collection.handle}`}
            className="w-full sm:w-auto group/cta inline-flex items-center justify-center gap-3 bg-primary text-primary-foreground font-display text-xs uppercase tracking-[0.25em] px-10 py-3.5 transition-all duration-300 hover:shadow-[0_4px_24px_hsl(var(--primary)/0.25)] active:scale-[0.97]"
          >
            Shop Collection
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProductSlide({ slide, onSizeSelect }: { slide: FeaturedSlide; onSizeSelect?: (selected: boolean) => void }) {
  const product = slide.product!;
  const isMobile = useIsMobile();
  const [activeThumb, setActiveThumb] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const isCartLoading = useCartStore((s) => s.isLoading);

  const heroImage = product.images[activeThumb] || product.images[0];
  const sizeOption = product.options.find((o) => o.name.toLowerCase() === "size");
  const sizes = sizeOption?.values || [];
  const selectedVariant = selectedSize
    ? product.variants.find((v) =>
        v.selectedOptions.some((o) => o.name.toLowerCase() === "size" && o.value === selectedSize)
      )
    : null;
  const isSelectedSoldOut = selectedVariant && !selectedVariant.availableForSale;

  const handleAddToCart = async () => {
    if (!selectedVariant || !selectedVariant.availableForSale) return;
    await addItem({
      product: {
        node: {
          id: product.rawProduct.id,
          title: product.title,
          description: product.description,
          handle: product.handle,
          priceRange: product.rawProduct.priceRange,
          images: product.rawProduct.images,
          variants: product.rawProduct.variants,
          options: product.rawProduct.options,
        },
      },
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions,
    });
    setJustAdded(true);
    toast.success(`${product.title} added to cart`, {
      description: `Size: ${selectedSize}`,
      position: "top-center",
    });
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="relative w-full">
      <div className="container max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="pt-0 pb-4 lg:pb-6"
        >
          <span className="text-[10px] font-condensed font-semibold uppercase tracking-[0.5em] text-primary/70">
            ★ Featured
          </span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={vp}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            className="lg:col-span-7 relative group"
          >
            <Link
              to={`/product/${product.handle}`}
              className="block relative aspect-[3/4] sm:aspect-[4/5] lg:aspect-[3/4] overflow-hidden rounded-sm"
            >
              <img
                src={heroImage}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent pointer-events-none" />
            </Link>

            {product.images.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={vp}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                className="absolute bottom-4 left-4 right-4 lg:bottom-6 lg:left-6 flex gap-2"
              >
                {product.images.slice(0, 5).map((img, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveThumb(i);
                    }}
                    className={`w-14 h-14 lg:w-16 lg:h-16 rounded-sm overflow-hidden border-2 transition-all duration-300 flex-shrink-0 ${
                      activeThumb === i
                        ? "border-primary shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                        : "border-foreground/20 hover:border-foreground/50 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </motion.div>
            )}
          </motion.div>

          <div className="lg:col-span-5 flex flex-col justify-center px-0 py-8 lg:py-12 lg:pl-12 xl:pl-16 lg:pr-0">
            {product.artistSeries && (
              <motion.p
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={vp}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="text-[10px] font-condensed font-semibold uppercase tracking-[0.4em] text-primary mb-3"
              >
                {product.artistSeries}
              </motion.p>
            )}

            <motion.h2
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
              className="font-display text-4xl sm:text-5xl lg:text-5xl xl:text-6xl uppercase tracking-wide text-foreground leading-[0.95]"
              style={{ textWrap: "balance" }}
            >
              {product.title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
              className="font-display text-3xl lg:text-4xl text-foreground mt-4 tabular-nums"
            >
              ${product.price}
            </motion.p>

            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={vp}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
              className="h-px bg-border/50 my-6 lg:my-8 origin-left"
            />

            {sizes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={vp}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
              >
                <p className="text-[10px] font-display uppercase tracking-[0.2em] text-muted-foreground mb-3">
                  Select Size
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => {
                    const variant = product.variants.find((v) =>
                      v.selectedOptions.some((o) => o.name.toLowerCase() === "size" && o.value === size)
                    );
                    const soldOut = variant && !variant.availableForSale;
                    const isActive = selectedSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => { const next = isActive ? null : size; setSelectedSize(next); onSizeSelect?.(!!next); }}
                        disabled={!!soldOut}
                        className={`relative min-w-[3rem] px-3 py-2 text-xs font-body font-medium uppercase tracking-wider transition-all duration-200 rounded-sm border active:scale-[0.96] ${
                          soldOut
                            ? "border-border/30 text-muted-foreground/30 cursor-not-allowed line-through"
                            : isActive
                            ? "border-primary bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.2)]"
                            : "border-border/50 text-foreground/70 hover:border-foreground/40 hover:text-foreground"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.55 }}
              className="mt-8 lg:mt-10 flex flex-wrap items-center gap-3"
            >
              <AnimatePresence mode="wait">
                {selectedSize && !isSelectedSoldOut ? (
                  <motion.button
                    key="add-to-cart"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={handleAddToCart}
                    disabled={isCartLoading || justAdded}
                    className="group/cta inline-flex items-center gap-3 bg-primary text-primary-foreground font-display text-xs uppercase tracking-[0.25em] px-10 py-4 transition-all duration-300 hover:shadow-[0_4px_24px_hsl(var(--primary)/0.25)] active:scale-[0.97] disabled:opacity-70"
                  >
                    {isCartLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : justAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        Added
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        Add to Cart — {selectedSize}
                      </>
                    )}
                  </motion.button>
                ) : isSelectedSoldOut ? (
                  <motion.span
                    key="sold-out"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="inline-flex items-center gap-3 bg-secondary text-muted-foreground font-display text-xs uppercase tracking-[0.25em] px-10 py-4 cursor-not-allowed"
                  >
                    Sold Out — {selectedSize}
                  </motion.span>
                ) : (
                  <motion.div
                    key="shop-now"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      to={`/product/${product.handle}`}
                      className="group/cta inline-flex items-center gap-3 bg-primary text-primary-foreground font-display text-xs uppercase tracking-[0.25em] px-10 py-4 transition-all duration-300 hover:shadow-[0_4px_24px_hsl(var(--primary)/0.25)] active:scale-[0.97]"
                    >
                      Shop Now
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
      <div className="h-8 lg:h-12" />
    </div>
  );
}

export function FeaturedProduct() {
  const { slides, loading } = useFeaturedProduct();
  const [activeIndex, setActiveIndex] = useState(0);
  const isMobile = useIsMobile();
  const [paused, setPaused] = useState(false);

  // Auto-advance every 8s, paused when bundle is open
  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length, paused]);

  const goTo = useCallback(
    (idx: number) => setActiveIndex(idx),
    []
  );

  if (loading) {
    return (
      <section className="py-16 lg:py-24">
        <div className="container max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            <div className="lg:col-span-7">
              <Skeleton className="aspect-[4/5] w-full" />
            </div>
            <div className="lg:col-span-5 p-8 space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (slides.length === 0) return null;

  const currentSlide = slides[activeIndex];

  return (
    <section className="relative overflow-hidden -mt-[30px]">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-[120px]" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: isMobile ? 0.3 : 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {currentSlide.type === "collection" && currentSlide.collection ? (
            <CollectionSlide slide={currentSlide} onBundleToggle={setPaused} />
          ) : currentSlide.product ? (
            <ProductSlide slide={currentSlide} onSizeSelect={setPaused} />
          ) : null}
        </motion.div>
      </AnimatePresence>

      {/* Navigation dots + arrows — overlaid on slide */}
      {slides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="flex items-center justify-center gap-4 pb-4">
            <button
              onClick={() => setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length)}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all active:scale-95 bg-background/30 backdrop-blur-sm"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeIndex
                      ? "w-8 bg-primary"
                      : "w-3 bg-foreground/20 hover:bg-foreground/40"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => setActiveIndex((prev) => (prev + 1) % slides.length)}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all active:scale-95 bg-background/30 backdrop-blur-sm"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
