import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Plus, Loader2, Check, Award, Tag } from "lucide-react";
import { storefrontApiRequest, type SearchResultProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";

interface RelatedProductsProps {
  currentHandle: string;
  productTitle: string;
  artistName?: string;
  artistInstagram?: string;
  isArtistSeries?: boolean;
}

const RELATED_PRODUCTS_QUERY = `
  query RelatedProducts($query: String!, $first: Int!) {
    search(query: $query, first: $first, types: [PRODUCT]) {
      edges {
        node {
          ... on Product {
            id
            title
            handle
            productType
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  availableForSale
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

function extractDesignName(title: string): string {
  let name = title.trim();
  name = name.replace(/\s*["'][^"']+["']\s*$/i, "").trim();
  const suffixes = /\s+(premium\s+tee|standard\s+tee|1\s*[- ]?ton\s+tee|1\s*[- ]?ton|french\s+terry\s+longsleeve|longsleeve|long\s+sleeve|pullover|hoodie|snapback|dad\s+hat|beanie|jogger|shorts?|tank|crop|women'?s?\s+tee|boxers?|lanyard|stickers?|cap|hat|premium|standard|tee|badge)\s*$/i;
  name = name.replace(suffixes, "").trim();
  return name;
}

const normalizeDesignKey = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Bundle tier configuration
const BUNDLE_TIERS = [
  { min: 2, discount: 10, code: "BUNDLE10", label: "2 items → 10% off" },
  { min: 3, discount: 15, code: "BUNDLE15", label: "3 items → 15% off" },
  { min: 4, discount: 20, code: "COMPLETESET", label: "Full set → 20% off", badge: true },
];

function getCurrentTier(count: number) {
  // count includes the main product (1) + selected add-ons
  for (let i = BUNDLE_TIERS.length - 1; i >= 0; i--) {
    if (count >= BUNDLE_TIERS[i].min) return BUNDLE_TIERS[i];
  }
  return null;
}

export function RelatedProducts({ currentHandle, productTitle, artistName, artistInstagram, isArtistSeries }: RelatedProductsProps) {
  const designName = extractDesignName(productTitle);
  const completeLookDesignKey = useMemo(() => normalizeDesignKey(designName), [designName]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addingBundle, setAddingBundle] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  

  // Build search query: search for design name + accessories
  const searchQuery = useMemo(() => {
    const base = isArtistSeries && artistName ? `${designName} ${artistName}` : designName;
    return base;
  }, [designName, artistName, isArtistSeries]);

  const { data: related } = useQuery({
    queryKey: ["related-products", searchQuery],
    queryFn: async () => {
      // Primary search by design name
      const data = await storefrontApiRequest(RELATED_PRODUCTS_QUERY, {
        query: searchQuery,
        first: 30,
      });
      const results = (data?.data?.search?.edges?.map((e: any) => e.node) ?? []) as SearchResultProduct[];

      // Secondary search: explicitly look for accessory types with the design name
      const accessoryQuery = `${designName} (boxer OR lanyard OR snapback OR hat OR beanie)`;
      const accData = await storefrontApiRequest(RELATED_PRODUCTS_QUERY, {
        query: accessoryQuery,
        first: 20,
      });
      const accResults = (accData?.data?.search?.edges?.map((e: any) => e.node) ?? []) as SearchResultProduct[];

      // Merge & dedupe
      const seen = new Set(results.map((r) => r.id));
      for (const r of accResults) {
        if (!seen.has(r.id)) {
          results.push(r);
          seen.add(r.id);
        }
      }

      if (results.length <= 1) {
        const words = designName.split(/\s+/);
        const shorterQuery = words.length > 1 ? words.slice(0, -1).join(" ") : words[0];
        if (shorterQuery !== designName && shorterQuery.length > 2) {
          const fallback = await storefrontApiRequest(RELATED_PRODUCTS_QUERY, {
            query: shorterQuery,
            first: 20,
          });
          return (fallback?.data?.search?.edges?.map((e: any) => e.node) ?? []) as SearchResultProduct[];
        }
      }

      return results;
    },
    enabled: designName.length > 2,
    staleTime: 5 * 60 * 1000,
  });

  // Only show accessories that actually match the design name
  const ACCESSORY_KEYWORDS = ["snapback", "hat", "cap", "dad hat", "beanie", "boxer", "lanyard"];
  const filtered = (related ?? []).filter((p) => {
    if (p.handle === currentHandle) return false;
    const text = `${p.title} ${p.productType}`.toLowerCase();
    const isAccessory = ACCESSORY_KEYWORDS.some((kw) => text.includes(kw));
    if (!isAccessory) return false;
    // Require the design name to appear in the product title or handle
    const designKey = completeLookDesignKey;
    const handleKey = p.handle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const titleKey = p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return handleKey.includes(designKey) || titleKey.includes(designKey);
  });

  // Sort: hats/snapbacks first, lanyards/stickers last
  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const rank = (p: SearchResultProduct) => {
      const t = (p.title + " " + p.productType).toLowerCase();
      if (t.includes("snapback") || t.includes("hat") || t.includes("cap") || t.includes("beanie")) return 0;
      if (t.includes("boxer")) return 1;
      if (t.includes("lanyard")) return 2;
      return 1;
    };
    return rank(a) - rank(b);
  }), [filtered]);

  // Total items = 1 (current product) + selected add-ons
  const totalItems = 1 + selectedIds.size;
  const currentTier = getCurrentTier(totalItems);
  const nextTier = BUNDLE_TIERS.find((t) => t.min > totalItems) ?? null;
  const isFullSet = totalItems >= 4;

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleAddBundle = useCallback(async () => {
    const selectedProducts = sorted.filter((p) => selectedIds.has(p.id));
    if (selectedProducts.length === 0) return;

    setAddingBundle(true);
    try {
      for (const product of selectedProducts) {
        const variant = product.variants?.edges[0]?.node;
        if (!variant || !variant.availableForSale) continue;
        await addItem({
          product: {
            node: {
              id: product.id,
              title: product.title,
              description: "",
              handle: product.handle,
              priceRange: product.priceRange,
              images: product.images,
              variants: product.variants!,
              options: [],
            },
          },
          variantId: variant.id,
          variantTitle: variant.title,
          price: variant.price,
          quantity: 1,
          selectedOptions: variant.selectedOptions || [],
          bundleTag: completeLookDesignKey ? `complete-look:${completeLookDesignKey}:addon` : undefined,
        });
      }

      // Automatic discounts apply at checkout — no code needed
      toast.success(
        currentTier
          ? (isFullSet
              ? `🏆 Complete the Set! ${selectedProducts.length} items added — ${currentTier.discount}% off applies at checkout!`
              : `${selectedProducts.length} items added — ${currentTier.discount}% off applies at checkout!`)
          : `${selectedProducts.length} items added to cart`,
        { position: "top-center", duration: 4000 }
      );

      setSelectedIds(new Set());
    } catch {
      toast.error("Failed to add items", { position: "top-center" });
    } finally {
      setAddingBundle(false);
    }
  }, [sorted, selectedIds, addItem, currentTier, isFullSet, completeLookDesignKey]);

  if (sorted.length === 0) return null;

  // Calculate bundle savings
  const selectedProducts = sorted.filter((p) => selectedIds.has(p.id));
  const bundleSubtotal = selectedProducts.reduce(
    (sum, p) => sum + parseFloat(p.priceRange.minVariantPrice.amount),
    0
  );
  const savings = currentTier ? bundleSubtotal * (currentTier.discount / 100) : 0;

  if (sorted.length === 0) return null;

  return (
    <section className="border-t border-border/30 pt-6 pb-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xs font-display font-bold uppercase tracking-[0.18em] text-foreground/80">
            Complete the Look
          </h2>
          {isFullSet && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-display uppercase tracking-wider font-bold"
            >
              <Award className="w-3 h-3" />
              Complete the Set
            </motion.span>
          )}
        </div>
        <p className="text-[11px] font-body text-muted-foreground mb-3">
          Select add-ons from the <span className="text-foreground font-medium">{designName}</span> collection
          {isArtistSeries && artistInstagram && (
            <span className="text-muted-foreground"> by <span className="text-primary font-medium">{artistInstagram}</span></span>
          )}
        </p>
      </motion.div>

      {/* Tier progress */}
      <div className="mb-3 flex items-center gap-3 flex-wrap">
        {BUNDLE_TIERS.map((tier) => {
          const isActive = totalItems >= tier.min;
          const isNext = !isActive && tier === nextTier;
          return (
            <div
              key={tier.code}
              className={`flex items-center gap-1.5 text-[10px] font-body transition-all ${
                isActive
                  ? "text-primary font-semibold"
                  : isNext
                  ? "text-foreground/60"
                  : "text-muted-foreground/40"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-primary border-primary"
                    : "border-muted-foreground/30"
                }`}
              >
                {isActive && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
              </div>
              <span>{tier.label}</span>
              {tier.badge && isActive && <span className="text-[8px]">🏆</span>}
            </div>
          );
        })}
        {nextTier && (
          <span className="text-[10px] font-body text-primary/70">
            · Add {nextTier.min - totalItems} more for {nextTier.discount}% off
          </span>
        )}
      </div>

      {/* Product cards */}
      <div className="grid grid-cols-3 gap-2">
        {sorted.map((product, i) => {
          const isSelected = selectedIds.has(product.id);
          return (
            <RelatedProductCard
              key={product.id}
              product={product}
              index={i}
              isSelected={isSelected}
              onToggle={() => toggleSelect(product.id)}
            />
          );
        })}
      </div>

      {/* Add bundle CTA */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <button
              onClick={handleAddBundle}
              disabled={addingBundle}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-display text-xs uppercase tracking-wider font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {addingBundle ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Add {selectedIds.size} Item{selectedIds.size > 1 ? "s" : ""} to Cart
                  {currentTier && (
                    <span className="flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded bg-primary-foreground/20 text-[10px]">
                      <Tag className="w-3 h-3" />
                      {currentTier.discount}% off · Save ${savings.toFixed(2)}
                    </span>
                  )}
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function RelatedProductCard({
  product,
  index,
  isSelected,
  onToggle,
}: {
  product: SearchResultProduct;
  index: number;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const image = product.images.edges[0]?.node;
  const price = parseFloat(product.priceRange.minVariantPrice.amount);
  const currency = product.priceRange.minVariantPrice.currencyCode;
  const variant = product.variants?.edges[0]?.node;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <div
        onClick={onToggle}
        className={`group cursor-pointer block rounded-lg border overflow-hidden transition-all ${
          isSelected
            ? "border-primary ring-1 ring-primary/30 bg-primary/5"
            : "border-border/20 bg-card hover:border-primary/30"
        }`}
      >
        <div className="aspect-square overflow-hidden bg-muted relative">
          {image ? (
            <img
              src={image.url}
              alt={image.altText || product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-muted-foreground/30" />
            </div>
          )}
          {/* Selection checkbox */}
          <div
            className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
              isSelected
                ? "bg-primary text-primary-foreground"
                : "bg-background/70 backdrop-blur-sm border border-border/50"
            }`}
          >
            {isSelected ? (
              <Check className="w-3 h-3" />
            ) : (
              <Plus className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
        </div>
        <div className="p-2">
          <Link
            to={`/product/${product.handle}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] font-display font-bold uppercase tracking-wide text-foreground hover:text-primary transition-colors line-clamp-1 leading-snug"
          >
            {product.title}
          </Link>
          <p className="mt-0.5 text-xs font-body font-semibold text-foreground">
            {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
