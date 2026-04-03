import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Grid3X3, LayoutGrid, SlidersHorizontal, ChevronDown, X, ArrowRight,
  ShoppingBag, ChevronLeft, Gift, Copy, Check, PackagePlus, Trash2, Hammer, Tag, Video
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import twentyFiveBadge from "@/assets/25-year-badge.png";
import { CollectionSubNav } from "@/components/CollectionSubNav";
import { SEO } from "@/components/SEO";
import { Helmet } from "react-helmet-async";
import { SiteFooter } from "@/components/SiteFooter";
import { storefrontApiRequest, COLLECTION_BY_HANDLE_QUERY, PRODUCT_BY_HANDLE_QUERY, STOREFRONT_QUERY } from "@/lib/shopify";
import { trackCollectionView } from "@/lib/shopifyAnalytics";
import { ga4ViewItemList } from "@/lib/ga4";
import { useCartStore } from "@/stores/cartStore";
import { useProductVideos } from "@/hooks/useProductVideos";
import { useSwatchMap } from "@/hooks/useColorSwatches";
import { toast } from "sonner";
import brooksSkullLogo from "@/assets/brooks-skull-logo.png";
import brooksBanner from "@/assets/brooks-banner.jpg";
import letterheadsBg from "@/assets/letterheads-background.jpg";
import sullenLogo from "@/assets/sullen-logo.png";
import artistSeriesLogo from "@/assets/artist-series-logo.png";

/* ─── Sort options ─── */
const sortOptions = [
  { label: "Featured", key: "COLLECTION_DEFAULT", reverse: false },
  { label: "Best Selling", key: "BEST_SELLING", reverse: false },
  { label: "Newest", key: "CREATED", reverse: true },
  { label: "Price: Low → High", key: "PRICE", reverse: false },
  { label: "Price: High → Low", key: "PRICE", reverse: true },
  { label: "A–Z", key: "TITLE", reverse: false },
];

/* ─── Collection name mapping for breadcrumb/hero ─── */
const collectionMeta: Record<string, { title: string; description?: string; capsule?: boolean }> = {
  "new-releases": { title: "New Releases", description: "The latest drops from the world's best tattoo artists." },
  "best-sellers": { title: "Best Sellers", description: "Fan favorites. The tees everyone's wearing." },
  "outlet": { title: "Sale", description: "Limited time deals. Don't sleep." },
  "tees": { title: "Tees", description: "Every tee in the arsenal." },
  "standard-tees": { title: "Standard Tees", description: "The workhorse. Comfortable, durable, iconic." },
  "premium": { title: "Premium Tees", description: "Elevated fit. Superior fabric. Next level." },
  "1-ton-tees": { title: '1 Ton Oversized', description: "Oversized silhouette. Maximum impact." },
  "hats": { title: "Headwear", description: "Top it off. Snapbacks, fitted, beanies." },
  "fleece": { title: "Sweatshirts", description: "Stay warm. Stay Sullen." },
  "flannels": { title: "Flannels", description: "Woven with attitude." },
  "accessories-2": { title: "Accessories", description: "Complete the look." },
  "jewelry": { title: "Jewelry", description: "Hand-crafted heavy metal rings and accessories." },
  "subscriptions": { title: "Subscriptions", description: "Artist Series tee subscriptions — get the drop before anyone else." },
  "accessories": { title: "Accessories", description: "Complete the look." },
  "bags": { title: "Backpacks", description: "Carry your world." },
  "jackets": { title: "Outerwear", description: "Layer up." },
  "men": { title: "Men's", description: "Full men's collection." },
  "womens": { title: "Women's", description: "Full women's collection." },
  "womens-fleece": { title: "Women's Fleece", description: "Cozy fleece for her." },
  "womens-intimates": { title: "Inktimates", description: "Tattoo-inspired intimates and lounge." },
  "long-sleeves": { title: "Long Sleeves", description: "Extended coverage. Same attitude." },
  "lifestyle": { title: "Lifestyle", description: "Art. Culture. Ink." },
  "cherubs-capsule": { title: "Cherubs Capsule", description: "Guardian angels. Dark devotion. The Cherubs collection.", capsule: true },
  "angels-capsule": { title: "Angels Capsule", description: "Divine ink. The Angels collection.", capsule: true },
  "march-artist-series-bundle": { title: "March Artist Series", description: "Premium artist-driven designs forged in ink. Limited capsule drop.", capsule: true },
  "delivery-2-march-2026": { title: "March Artist Series — Delivery 2", description: "Premium artist-driven designs forged in ink. Limited capsule drop.", capsule: true },
  "bro_oks": { title: "BRO_OKS", description: "The BRO_OKS collection." },
  // Hat sub-collections (urlHandle format uses hyphen)
  "hats-letterheads": { title: "Letterheads Hats", description: "Premium calligraphy-inspired headwear." },
  "hats-artist-series": { title: "Artist Series Hats", description: "Hats designed by the world's best tattoo artists." },
  "hats-staples": { title: "Staple Hats", description: "Everyday essentials. Clean and classic." },
  // Additional collections from nav
  "tanks": { title: "Tanks", description: "Sleeveless and ready." },
  "polos": { title: "Polos", description: "Elevated casual." },
  "wovens": { title: "Wovens", description: "Woven shirts with ink-inspired style." },
  "pants": { title: "Pants", description: "Built to move." },
  "shorts": { title: "Shorts", description: "Warm-weather ready." },
  "sweatpants": { title: "Sweatpants", description: "Comfort meets attitude." },
  "boardshorts": { title: "Boardshorts", description: "From the shop to the shore." },
  "pajamas": { title: "Pajamas", description: "Rest easy." },
  "beanies": { title: "Beanies", description: "Keep your head warm. Stay Sullen." },
  "boxers": { title: "Boxers", description: "Ink-inspired comfort underneath." },
  "socks": { title: "Socks", description: "Details matter." },
  "lanyards": { title: "Lanyards", description: "Carry your keys in style." },
  "sunglasses": { title: "Sunglasses", description: "Shade with attitude." },
  "slides": { title: "Slides", description: "Kick back." },
  "stickers": { title: "Stickers", description: "Stick it everywhere." },
  "misc": { title: "Misc", description: "Everything else." },
  "gift-cards": { title: "Gift Cards", description: "Give the gift of Sullen." },
  "letterheads": { title: "Letterheads", description: "Premium calligraphy-inspired accessories." },
  "solids": { title: "The Solids", description: "Clean. Simple. Essential." },
  "tops": { title: "Tops", description: "All tops and layers." },
  "bottoms": { title: "Bottoms", description: "Pants, shorts, and more." },
  "bundle": { title: "Bundles & Mystery", description: "Mystery packs and value bundles." },
  "artist-series": { title: "Artist Series", description: "Wearable art by the world's best tattoo artists." },
  "stacked-deck": { title: "Stacked Deck", description: "The Stacked Deck collection." },
  "sullen-badge": { title: "Sullen Badge", description: "The iconic Sullen badge collection." },
  "timeless": { title: "Timeless", description: "Designs that never go out of style." },
  "youth": { title: "Youth", description: "Sullen for the next generation." },
  "youth-tees": { title: "Youth Tees", description: "Tees for the next generation." },
};

/* ─── Bundle selection type ─── */
let bundleSelectionCounter = 0;
interface BundleSelection {
  selectionId: string;
  productId: string;
  productTitle: string;
  image: string;
  variantId: string;
  variantTitle: string;
  size: string;
  price: { amount: string; currencyCode: string };
  product: any;
  selectedOptions: Array<{ name: string; value: string }>;
}

/* ─── Color maps (module-level for reuse) ─── */
const BASIC_COLOR_MAP: Record<string, string[]> = {
  Black: ["black", "jet black", "caviar", "onyx", "ebony", "noir", "midnight", "ink", "raven", "obsidian", "coal", "soot", "dark", "black bean"],
  White: ["white", "off-white", "off white", "ivory", "cream", "pearl", "snow", "bone", "eggshell", "chalk", "vanilla", "ecru", "antique white"],
  Red: ["red", "crimson", "scarlet", "maroon", "burgundy", "wine", "cherry", "ruby", "cardinal", "garnet", "blood", "brick", "oxblood", "merlot", "cranberry", "high risk"],
  Orange: ["orange", "tangerine", "rust", "copper", "amber", "burnt orange", "peach", "coral", "apricot", "terra", "terracotta"],
  Yellow: ["yellow", "gold", "mustard", "lemon", "canary", "honey", "sunflower", "maize", "saffron"],
  Green: ["green", "olive", "sage", "forest", "emerald", "moss", "army", "hunter", "lime", "mint", "jade", "pine", "military", "camo", "camouflage", "teal", "fern", "kelly", "pistachio"],
  Blue: ["blue", "navy", "cobalt", "royal", "indigo", "denim", "sky", "ocean", "marine", "steel", "azure", "sapphire", "cerulean", "stalactite"],
  Purple: ["purple", "violet", "plum", "lavender", "lilac", "mauve", "grape", "eggplant", "magenta", "fuchsia", "orchid", "amethyst"],
  Pink: ["pink", "blush", "sachet", "flamingo", "salmon", "bubblegum", "carnation", "watermelon", "raspberry", "rose"],
  Brown: ["brown", "tan", "khaki", "taupe", "beige", "camel", "chocolate", "coffee", "mocha", "sand", "sienna", "chestnut", "walnut", "toffee", "espresso", "cinnamon", "hazel", "caramel"],
  Grey: ["grey", "gray", "silver", "ash", "heather", "pewter", "stone", "smoke", "platinum", "charcoal", "gunmetal", "anthracite", "slate", "battleship", "cement", "fog", "moon mist", "mist"],
  Washes: ["wash", "acid wash", "crystal wash", "vintage wash", "distressed", "pigment dye", "garment dye", "tie dye", "bleach"],
};

const COLOR_SWATCH_HEX: Record<string, string> = {
  Black: "#111111",
  White: "#f5f5f5",
  Red: "#c0392b",
  Orange: "#e67e22",
  Yellow: "#f1c40f",
  Green: "#27ae60",
  Blue: "#2980b9",
  Purple: "#8e44ad",
  Pink: "#e91e8e",
  Brown: "#8b5e3c",
  Grey: "#95a5a6",
  Washes: "",
};

function mapRawColorToBasic(rawColor: string): string[] {
  const lower = rawColor.toLowerCase().trim();
  const padded = ` ${lower} `;
  const matches: string[] = [];
  for (const [basic, keywords] of Object.entries(BASIC_COLOR_MAP)) {
    if (keywords.some((kw) => {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(?:^|[\\s/,_-])${escaped}(?:$|[\\s/,_-])`, 'i').test(padded);
    })) {
      matches.push(basic);
    }
  }
  return matches;
}

/* ─── Product card ─── */
function CollectionProductCard({
  product,
  layout,
  bundleMode,
  bundleSelections,
  onBundleSelect,
  onBundleRemove,
  collectionHandle,
  bundleMax = 4,
  hasVideo,
  swatchMap,
}: {
  product: any;
  layout: "grid" | "large";
  bundleMode?: boolean;
  bundleSelections?: BundleSelection[];
  onBundleSelect?: (selection: BundleSelection) => void;
  onBundleRemove?: (selectionId: string) => void;
  collectionHandle?: string;
  bundleMax?: number;
  hasVideo?: boolean;
  swatchMap?: Map<string, { image_url: string | null; hex_fallback: string | null; stroke_color: string | null; is_split: boolean; split_color_1: string | null; split_color_2: string | null }>;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const images = product.images?.edges || [];
  const mainImage = images[0]?.node?.url;
  const hoverImage = images[1]?.node?.url;
  const [hovered, setHovered] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);

  const price = parseFloat(product.priceRange?.minVariantPrice?.amount || "0");
  const comparePrice = parseFloat(product.compareAtPriceRange?.maxVariantPrice?.amount || "0");
  const onSale = comparePrice > price;
  const currency = product.priceRange?.minVariantPrice?.currencyCode || "USD";

  // Heavy Metals badge for jewelry collection (exclude ear hangers & solid badge earrings)
  const titleLower = (product.title || "").toLowerCase();
  const showHeavyMetalsBadge = collectionHandle === "heavy-metals"
    && !titleLower.includes("ear hanger")
    && !titleLower.includes("solid badge earring");

  // Collector's Edition badge for sold-out letterheads products
  const isSoldOut = product.variants?.edges?.length > 0 && product.variants.edges.every((v: any) => !v.node.availableForSale);
  const isLetterheads = collectionHandle === "letterheads" || titleLower.includes("letterhead");
  const showCollectorsEdge = isLetterheads && isSoldOut;

  const firstVariant = product.variants?.edges?.[0]?.node;
  const productSelections = bundleSelections?.filter((s) => s.productId === product.id) || [];
  const selectionCount = productSelections.length;
  const bundleFull = (bundleSelections?.length || 0) >= bundleMax;
  const autoBundleTag =
    collectionHandle === "the-solids"
      ? "solids-pack"
      : collectionHandle === "youth-tees"
        ? "youth-tees"
        : collectionHandle === "bro_oks"
          ? "bro_oks"
          : collectionHandle === "cherubs-capsule"
            ? "cherubs-capsule"
            : collectionHandle === "angels-capsule"
              ? "angels-capsule"
              : (collectionHandle === "march-artist-series-bundle" || collectionHandle === "delivery-2-march-2026")
                ? "march-artist-series-bundle"
                : undefined;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firstVariant) return;
    await addItem({
      product: { node: product },
      variantId: firstVariant.id,
      variantTitle: firstVariant.title,
      price: firstVariant.price,
      quantity: 1,
      selectedOptions: firstVariant.selectedOptions,
      bundleTag: autoBundleTag,
    });
    toast.success(`${product.title} added to cart`);
  };

  const handleBundleSizeSelect = (size: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const variant = product.variants?.edges?.find((v: any) =>
      v.node.selectedOptions?.some((o: any) => o.name === "Size" && o.value === size)
    )?.node || firstVariant;
    if (!variant || !onBundleSelect) return;
    onBundleSelect({
      selectionId: "",
      productId: product.id,
      productTitle: product.title,
      image: mainImage,
      variantId: variant.id,
      variantTitle: variant.title,
      size,
      price: variant.price,
      product: { node: product },
      selectedOptions: variant.selectedOptions || [{ name: "Size", value: size }],
    });
    
  };

  const handleBundleClick = (e: React.MouseEvent) => {
    if (!bundleMode) return;
    e.preventDefault();
    e.stopPropagation();
    if (bundleFull) {
      toast.error("Bundle full — remove an item first");
      return;
    }
    const sizes = product.options?.find((o: any) => o.name === "Size")?.values;
    if (sizes?.length) {
      // Mobile tap: toggle size picker (desktop uses hover)
      setShowSizePicker((prev) => !prev);
    } else {
      handleBundleSizeSelect("One Size", e);
    }
  };
  const cardImage = (
    <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-secondary">
      {mainImage ? (
        <img
          src={mainImage}
          alt={product.title}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${
            hoverImage ? "group-hover:opacity-0 group-hover:scale-105" : "group-hover:scale-105"
          } ${showCollectorsEdge ? "grayscale-[60%] opacity-80" : ""}`}
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-muted" />
      )}
      {hoverImage && (
        <img
          src={hoverImage}
          alt={`${product.title} alternate`}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
          loading="lazy"
        />
      )}

      {/* Sale badge */}
      {onSale && !showCollectorsEdge && (
        <span className="absolute top-3 left-3 z-10 bg-destructive text-destructive-foreground text-[10px] font-display uppercase tracking-wider px-2 py-1 rounded-sm shadow-sm">
          {Math.round(((comparePrice - price) / comparePrice) * 100 / 5) * 5}% Off
        </span>
      )}

      {hasVideo && (
        <span className={`absolute top-3 ${onSale ? 'right-3' : 'right-3'} z-10 flex items-center gap-1 bg-background/80 backdrop-blur-sm text-foreground text-[10px] font-display uppercase tracking-wider px-2 py-1 rounded-full border border-border/50 shadow-sm`}>
          <Video className="w-3 h-3 text-primary" />
        </span>
      )}
      {product.handle?.includes("25-to-life") && (
        <img
          src={twentyFiveBadge}
          alt="Sullen 25th Anniversary"
          className={`absolute ${onSale ? 'top-10' : 'top-2'} left-2 z-10 w-[60px] h-[60px] object-contain drop-shadow-lg`}
        />
      )}

      {showCollectorsEdge && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="relative -rotate-12">
            <div className="px-5 py-2 border border-primary/40 bg-background/70 backdrop-blur-md rounded-sm shadow-[0_0_30px_rgba(var(--primary-rgb,200,170,110),0.15)]">
              <span className="block text-[9px] font-condensed uppercase tracking-[0.4em] text-primary/70 text-center leading-tight">
                Letterheads
              </span>
              <span className="block text-[13px] font-hudson uppercase tracking-[0.2em] text-primary text-center leading-tight mt-0.5">
                Sold Out
              </span>
            </div>
          </div>
        </div>
      )}

      {!bundleMode && !showCollectorsEdge && (
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex flex-col justify-end p-3 gap-2 z-10">
          {product.options?.find((o: any) => o.name === "Size") ? (
            <div className="grid grid-cols-4 gap-1">
              {product.options
                .find((o: any) => o.name === "Size")
                ?.values.map((size: string) => {
                  const sizeVariant = product.variants?.edges?.find((v: any) =>
                    v.node.selectedOptions?.some((o: any) => o.name === "Size" && o.value === size)
                  )?.node;
                  const sizeAvailable = sizeVariant?.availableForSale ?? false;

                  return (
                    <button
                      key={size}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!sizeAvailable || !sizeVariant) return;
                        addItem({
                          product: { node: product },
                          variantId: sizeVariant.id,
                          variantTitle: sizeVariant.title,
                          price: sizeVariant.price,
                          quantity: 1,
                          selectedOptions: sizeVariant.selectedOptions,
                          bundleTag: autoBundleTag,
                        });
                        toast.success(`${product.title} (${size}) added to cart`);
                      }}
                      disabled={isLoading || !sizeAvailable}
                      className={`text-[11px] font-display uppercase tracking-wider py-2.5 border rounded-sm transition-all disabled:opacity-50 ${
                        sizeAvailable
                          ? "text-foreground border-border/50 bg-card/60 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground hover:border-primary"
                          : "text-muted-foreground/40 border-border/20 bg-card/30 line-through cursor-not-allowed"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
            </div>
          ) : (
            <button
              onClick={handleQuickAdd}
              disabled={isLoading || !firstVariant?.availableForSale}
              className="flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-display text-xs uppercase tracking-[0.2em] rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {firstVariant?.availableForSale ? "Quick Add" : "Sold Out"}
            </button>
          )}
        </div>
      )}

      {/* Bundle mode size picker overlay — hover on desktop, tap on mobile */}
      {bundleMode && !showCollectorsEdge && !bundleFull && product.options?.find((o: any) => o.name === "Size") && (
        <div
          className={`absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-background/30 backdrop-blur-[2px] flex flex-col justify-end p-3 gap-2 z-20 rounded-lg transition-opacity duration-300 ${
            showSizePicker ? "opacity-100" : "opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
          }`}
          onClick={(e) => { e.stopPropagation(); setShowSizePicker(false); }}
        >
          <p className="text-[10px] font-display uppercase tracking-[0.2em] text-muted-foreground text-center mb-1">
            Select Size
          </p>
          <div className="grid grid-cols-4 gap-1" onClick={(e) => e.stopPropagation()}>
            {product.options
              ?.find((o: any) => o.name === "Size")
              ?.values.map((size: string) => {
                const sizeVariant = product.variants?.edges?.find((v: any) =>
                  v.node.selectedOptions?.some((o: any) => o.name === "Size" && o.value === size)
                )?.node;
                const sizeAvailable = sizeVariant?.availableForSale ?? false;

                return (
                  <button
                    key={size}
                    onClick={(e) => {
                      if (sizeAvailable) {
                        handleBundleSizeSelect(size, e);
                        setShowSizePicker(false);
                      }
                    }}
                    disabled={!sizeAvailable}
                    className={`text-[11px] font-display uppercase tracking-wider py-2.5 border rounded-sm transition-all ${
                      sizeAvailable
                        ? "text-foreground border-border/50 bg-card/60 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground hover:border-primary"
                        : "text-muted-foreground/40 border-border/20 bg-card/30 line-through cursor-not-allowed"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );

  // Extract unique colors for swatches — prefer raw names for swatch map lookup, fallback to basic buckets
  const colorSwatchItems = useMemo(() => {
    const colorOption = product.options?.find((o: any) => o.name === "Color");
    if (!colorOption || colorOption.values.length <= 1) return [];
    return colorOption.values.map((raw: string) => {
      const basics = mapRawColorToBasic(raw);
      const basicColor = basics.find(b => b !== "Washes") || basics[0] || "Black";
      return { raw, basic: basicColor };
    });
  }, [product]);

  const productInfo = (
    <div className="mt-3 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-sm uppercase tracking-wider text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-1 flex-1 min-w-0">
          {product.title}
        </h3>
        {colorSwatchItems.length > 1 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {colorSwatchItems.map((item: { raw: string; basic: string }) => {
              const managed = swatchMap?.get(item.raw.toLowerCase());
              const strokeColor = managed?.stroke_color || undefined;
              const borderStyle = strokeColor
                ? `2px solid ${strokeColor}`
                : "1px solid hsl(var(--border) / 0.6)";

              // Split swatch (diagonal)
              if (managed?.is_split && managed.split_color_1 && managed.split_color_2) {
                return (
                  <span
                    key={item.raw}
                    title={item.raw}
                    className="w-3.5 h-3.5 rounded-full shadow-sm flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${managed.split_color_1} 50%, ${managed.split_color_2} 50%)`,
                      border: borderStyle,
                    }}
                  />
                );
              }

              // Image swatch
              if (managed?.image_url) {
                return (
                  <span
                    key={item.raw}
                    title={item.raw}
                    className="w-3.5 h-3.5 rounded-full shadow-sm overflow-hidden flex-shrink-0"
                    style={{ border: borderStyle }}
                  >
                    <img
                      src={managed.image_url}
                      alt={item.raw}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </span>
                );
              }

              // Solid color swatch
              return (
                <span
                  key={item.raw}
                  title={item.raw}
                  className="w-3.5 h-3.5 rounded-full shadow-sm flex-shrink-0"
                  style={{
                    backgroundColor: managed?.hex_fallback || COLOR_SWATCH_HEX[item.basic] || "#888",
                    border: borderStyle,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {showCollectorsEdge ? (
          <span className="text-xs font-display uppercase tracking-[0.15em] text-muted-foreground/70">
            No longer available
          </span>
        ) : (
          <>
            <span className={`text-sm font-body ${onSale ? "text-destructive" : "text-muted-foreground"}`}>
              {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price)}
            </span>
            {onSale && (
              <span className="text-xs text-muted-foreground/60 line-through font-body">
                {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(comparePrice)}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative"
    >
      {bundleMode ? (
        <div
          className={`group block cursor-pointer ${selectionCount > 0 ? "ring-2 ring-primary rounded-lg" : ""}`}
          onClick={handleBundleClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {cardImage}
          {productInfo}
        </div>
      ) : (
        <Link
          to={`/product/${product.handle}`}
          className="group block"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {cardImage}
          {productInfo}
        </Link>
      )}
    </motion.div>
  );
}

/* ─── Filter drawer (mobile) ─── */
function FilterDrawer({
  open,
  onClose,
  sizes,
  selectedSizes,
  toggleSize,
  priceRange,
  setPriceRange,
  teeTypes,
  selectedTypes,
  toggleType,
  colors,
  selectedColors,
  toggleColor,
  colorSwatchHex,
  clearFilters,
  activeFilterCount,
}: {
  open: boolean;
  onClose: () => void;
  sizes: string[];
  selectedSizes: string[];
  toggleSize: (s: string) => void;
  priceRange: [number, number];
  setPriceRange: (r: [number, number]) => void;
  teeTypes: string[];
  selectedTypes: string[];
  toggleType: (t: string) => void;
  colors: string[];
  selectedColors: string[];
  toggleColor: (c: string) => void;
  colorSwatchHex: Record<string, string>;
  clearFilters: () => void;
  activeFilterCount: number;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[70]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-[85vw] max-w-sm bg-card border-r border-border z-[80] overflow-y-auto"
          >
            <div className="p-5 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg uppercase tracking-wider text-foreground">
                  Filters
                </h3>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tee Type filter */}
              {teeTypes.length > 0 && (
                <div>
                  <h4 className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
                    Tee Type
                  </h4>
                  <div className="grid grid-cols-3 gap-1.5">
                    {teeTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => toggleType(type)}
                        className={`text-xs font-display uppercase tracking-wider px-3 py-2.5 rounded-sm border transition-all ${
                          selectedTypes.includes(type)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-foreground/70 hover:border-primary/50 hover:text-foreground"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size filter — 4 columns */}
              {sizes.length > 0 && (
                <div>
                  <h4 className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
                    Size
                  </h4>
                  <div className="grid grid-cols-4 gap-1.5">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={`text-xs font-display uppercase tracking-wider px-2 py-2.5 rounded-sm border transition-all ${
                          selectedSizes.includes(size)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-foreground/70 hover:border-primary/50 hover:text-foreground"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color filter */}
              {colors.length > 0 && (
                <div>
                  <h4 className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
                    Color
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {colors.map((color) => {
                      const hex = colorSwatchHex[color];
                      const isWashes = color === "Washes";
                      return (
                        <button
                          key={color}
                          onClick={() => toggleColor(color)}
                          className={`flex items-center gap-2 text-xs font-display uppercase tracking-wider px-3 py-2.5 rounded-sm border transition-all ${
                            selectedColors.includes(color)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-foreground/70 hover:border-primary/50 hover:text-foreground"
                          }`}
                        >
                          {isWashes ? (
                            <span
                              className="w-4 h-4 rounded-full flex-shrink-0 border border-foreground/20"
                              style={{
                                background: "conic-gradient(#333, #666, #444, #888, #333)",
                              }}
                            />
                          ) : (
                            <span
                              className="w-4 h-4 rounded-full flex-shrink-0 border border-foreground/20"
                              style={{ backgroundColor: hex }}
                            />
                          )}
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Price filter */}
              <div>
                <h4 className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
                  Price Range
                </h4>
                <div className="flex gap-2">
                  {[
                    [0, 30],
                    [30, 50],
                    [50, 100],
                    [100, 999],
                  ].map(([min, max]) => (
                    <button
                      key={`${min}-${max}`}
                      onClick={() => setPriceRange([min, max])}
                      className={`flex-1 text-[11px] font-display uppercase tracking-wider py-2 rounded-sm border transition-all ${
                        priceRange[0] === min && priceRange[1] === max
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-foreground/70 hover:border-primary/50"
                      }`}
                    >
                      {max === 999 ? `$${min}+` : `$${min}–$${max}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-border/30">
                <button
                  onClick={clearFilters}
                  className="flex-1 py-3 text-xs font-display uppercase tracking-wider text-muted-foreground border border-border rounded-sm hover:text-foreground hover:border-foreground/30 transition-all"
                >
                  Clear All
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 text-xs font-display uppercase tracking-wider bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors"
                >
                  Apply {activeFilterCount > 0 && `(${activeFilterCount})`}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Solids Pack Builder banner ─── */
function SolidsPackBanner({
  bundleMode,
  onToggleBundle,
  tier,
  onTierChange,
  selectionCount,
}: {
  bundleMode: boolean;
  onToggleBundle: () => void;
  tier: 3 | 5;
  onTierChange: (t: 3 | 5) => void;
  selectionCount: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="relative overflow-hidden bg-card border-b border-border/20"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[200px] bg-primary/[0.03] blur-[80px] rounded-full" />
      </div>
      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          {/* Left: title + tier toggle */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-2">
              <PackagePlus className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="font-display text-xs sm:text-sm uppercase tracking-[0.2em] text-foreground">
                Build a Pack & Save
              </span>
            </div>

            {/* Tier toggle — full width on mobile */}
            <div className="flex items-center bg-secondary rounded-sm overflow-hidden border border-border/30 w-full sm:w-auto">
              <button
                onClick={() => { onTierChange(3); }}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2 text-[11px] font-display uppercase tracking-[0.15em] transition-all ${
                  tier === 3
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                3-Pack · Save $10
              </button>
              <div className="w-px h-5 bg-border/40" />
              <button
                onClick={() => { onTierChange(5); }}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2 text-[11px] font-display uppercase tracking-[0.15em] transition-all ${
                  tier === 5
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                5-Pack · Get One Free
              </button>
            </div>
          </div>

          {/* Right: build button — full width on mobile */}
          <button
            onClick={onToggleBundle}
            className={`w-full sm:w-auto flex items-center justify-center gap-1.5 text-[11px] font-display uppercase tracking-[0.15em] px-4 py-2.5 sm:py-2 rounded-sm transition-all ${
              bundleMode
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-foreground/10 text-foreground border border-foreground/20 hover:bg-foreground/15"
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            {bundleMode ? `Building (${selectionCount}/${tier})` : "Start Building"}
          </button>
        </div>

        {/* Savings breakdown */}
        {!bundleMode && (
          <p className="mt-2 text-[10px] sm:text-[11px] font-body text-muted-foreground">
            Mix any Standard or Premium solids. Discount code applied at checkout.
          </p>
        )}
      </div>
    </motion.div>
  );
}

function PromoBanner({ bundleMode, onToggleBundle, collectionHandle }: { bundleMode: boolean; onToggleBundle: () => void; collectionHandle?: string }) {
  const [copied, setCopied] = useState(false);

  const isBrooks = collectionHandle === "bro_oks";
  const isAngelsPromo = collectionHandle === "angels-capsule";
  const isMarchArtist = collectionHandle === "march-artist-series-bundle" || collectionHandle === "delivery-2-march-2026";
  const isYouth = collectionHandle === "youth-tees";
  const discountCode = isYouth ? "YOUTH4" : isBrooks ? "BROOKS4" : isAngelsPromo ? "ANGELS4" : isMarchArtist ? "MARCH4" : "CHERUBS4";
  const promoLabel = isYouth ? "Youth Tees — Buy 3, Get 1 Free" : isBrooks ? "BRO_OKS — Buy 3, Get 1 Free" : isAngelsPromo ? "Angels Capsule — Buy 3, Get 1 Free" : isMarchArtist ? "March Artist Series — Buy 3, Get 1 Free" : "Cherubs Capsule — Buy 3, Get 1 Free";

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(discountCode);
    setCopied(true);
    toast.success("Discount code copied!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="z-30 relative overflow-hidden"
      style={{ background: (isBrooks || isYouth)
        ? 'linear-gradient(135deg, #1a1714 0%, #2a2520 50%, #1a1714 100%)'
        : 'linear-gradient(135deg, #f5f2ed 0%, #eae7e1 50%, #f0ede8 100%)'
      }}
    >
      {!isBrooks && !isYouth && (
        <div className="absolute inset-0 overflow-hidden opacity-40">
          <div className="cloud" style={{ width: 200, height: 50, top: '20%', left: '5%', filter: 'blur(12px)', background: 'radial-gradient(ellipse, rgba(255,255,255,0.8) 0%, transparent 70%)', animation: 'cloud-drift-1 80s linear infinite' }} />
          <div className="cloud" style={{ width: 180, height: 45, top: '50%', right: '10%', filter: 'blur(12px)', background: 'radial-gradient(ellipse, rgba(255,255,255,0.7) 0%, transparent 70%)', animation: 'cloud-drift-2 90s linear infinite 4s' }} />
        </div>
      )}
      <div className="relative max-w-7xl mx-auto px-4 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4">
        <div className="flex items-center gap-2">
          <Gift className={`w-4 h-4 flex-shrink-0 ${(isBrooks || isYouth) ? 'text-primary' : 'text-[#1a1714]'}`} />
          <span className={`font-display text-xs md:text-sm uppercase tracking-[0.2em] ${(isBrooks || isYouth) ? 'text-foreground' : 'text-[#1a1714]'}`}>
            {promoLabel}
          </span>
        </div>
        <div className={`h-3.5 w-px hidden sm:block ${(isBrooks || isYouth) ? 'bg-foreground/15' : 'bg-[#1a1714]/15'}`} />
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] font-body ${(isBrooks || isYouth) ? 'text-muted-foreground' : 'text-[#5a5550]'}`}>Code:</span>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1 rounded-sm px-2 py-0.5 transition-all group ${
                (isBrooks || isYouth) ? 'bg-foreground/5 border border-foreground/15 hover:bg-foreground/10' : 'bg-[#1a1714]/5 border border-[#1a1714]/15 hover:bg-[#1a1714]/10'
              }`}
            >
              <span className={`font-display text-[11px] uppercase tracking-[0.2em] font-semibold ${(isBrooks || isYouth) ? 'text-foreground' : 'text-[#1a1714]'}`}>{discountCode}</span>
              {copied ? <Check className="w-2.5 h-2.5 text-green-600" /> : <Copy className={`w-2.5 h-2.5 transition-colors ${(isBrooks || isYouth) ? 'text-muted-foreground group-hover:text-foreground' : 'text-[#5a5550] group-hover:text-[#1a1714]'}`} />}
            </button>
          </div>
          <button
            onClick={onToggleBundle}
            className={`flex items-center gap-1.5 text-[11px] font-display uppercase tracking-[0.15em] px-3 py-1.5 rounded-sm transition-all ${
              bundleMode
                ? (isBrooks || isYouth) ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-[#1a1714] text-[#f0ede8] hover:bg-[#2a2520]'
                : (isBrooks || isYouth) ? 'bg-foreground/10 text-foreground border border-foreground/20 hover:bg-foreground/15' : 'bg-[#1a1714]/10 text-[#1a1714] border border-[#1a1714]/20 hover:bg-[#1a1714]/15'
            }`}
          >
            <PackagePlus className="w-3.5 h-3.5" />
            {bundleMode ? 'Exit Bundle' : 'Build Bundle'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Bundle bottom bar ─── */
function BundleBar({
  selections,
  onRemove,
  onAddAllToCart,
  isAdding,
  maxSlots = 4,
  discountLabel,
}: {
  selections: BundleSelection[];
  onRemove: (selectionId: string) => void;
  onAddAllToCart: () => void;
  isAdding: boolean;
  maxSlots?: number;
  discountLabel?: string;
}) {
  const count = selections.length;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card safe-area-bottom"
      style={{ borderColor: 'hsl(var(--border) / 0.3)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3">
        {/* Progress + discount — compact on mobile */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-1 sm:gap-1.5">
            {Array.from({ length: maxSlots }).map((_, i) => (
              <div key={i} className="flex items-center gap-1 sm:gap-1.5">
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${
                  i < count ? 'bg-primary scale-110' : 'bg-foreground/10'
                }`} />
                {i < maxSlots - 1 && <div className={`w-2 sm:w-4 h-px ${i < count - 1 ? 'bg-primary/50' : 'bg-foreground/5'}`} />}
              </div>
            ))}
            <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-[11px] font-display uppercase tracking-[0.15em] sm:tracking-[0.2em] text-muted-foreground">
              {count}/{maxSlots}
            </span>
          </div>
          {discountLabel && (
            <span className="text-[10px] font-body text-primary truncate ml-2">
              {discountLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Selected items thumbnails — smaller on mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 overflow-x-auto scrollbar-hide">
            {selections.map((s) => (
              <div key={s.selectionId} className="relative flex-shrink-0 group/thumb">
                <img
                  src={s.image}
                  alt={s.productTitle}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover border border-border/30"
                />
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[7px] sm:text-[8px] font-display uppercase tracking-wider bg-foreground text-background px-1 rounded-sm">
                  {s.size}
                </span>
                <button
                  onClick={() => onRemove(s.selectionId)}
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center sm:opacity-0 sm:group-hover/thumb:opacity-100 transition-opacity"
                >
                  <X className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                </button>
              </div>
            ))}
            {Array.from({ length: maxSlots - count }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded border border-dashed border-border/20 flex items-center justify-center flex-shrink-0"
              >
                <PackagePlus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground/30" />
              </div>
            ))}
          </div>

          {/* Add to cart button */}
          <button
            onClick={onAddAllToCart}
            disabled={count < maxSlots || isAdding}
            className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 bg-primary text-primary-foreground font-display text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] px-3 sm:px-5 py-2.5 sm:py-3 rounded-sm hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isAdding ? (
              <span className="animate-pulse">Adding...</span>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline sm:inline">Add {maxSlots}-Pack</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
/* ─── Main page ─── */
export default function CollectionPage() {
  const { handle: rawHandle, subhandle } = useParams<{ handle: string; subhandle?: string }>();
   // Map friendly route handles to Shopify collection handles
  const handleAliases: Record<string, string> = {
    "jewelry": "heavy-metals",
    "lanyards": "lanyards-1",
    "sunglasses": "black-fly-sunglasses",
    // Nested hat sub-collections → actual Shopify handles
    "hats-letterheads": "letterheads",
    "hats-artist-series": "artist-series",
    "hats-staples": "hat-staples",
    // Youth nested routes
    // "youth-tees" uses the same handle on Shopify
    "timeless": "sullen-logo-tees",
    "solids": "the-solids",
  };
  // For nested routes like /collections/hats/staples, combine into "hats-staples" for alias lookup
  const combinedHandle = subhandle ? `${rawHandle}-${subhandle}` : rawHandle;
  const handle = handleAliases[combinedHandle || ""] || combinedHandle;


  const { hasVideo } = useProductVideos();
  const swatchMap = useSwatchMap();
  const [sortIndex, setSortIndex] = useState(0);
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [layout, setLayout] = useState<"grid" | "large">("grid");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 999]);

  // Parallax for capsule hero
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -120]);

  const sort = sortOptions[sortIndex];

  // Pagination state
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["collection", handle, sort.key, sort.reverse],
    queryFn: async () => {
      const res = await storefrontApiRequest(COLLECTION_BY_HANDLE_QUERY, {
        handle,
        first: 48,
        sortKey: sort.key,
        reverse: sort.reverse,
      });
      const collection = res?.data?.collection;

      // "tops" is a virtual collection merging fleece, flannels, wovens, and jackets
      if (handle === "tops" && !collection) {
        const subHandles = ["fleece", "flannels", "wovens", "jackets"];
        const results = await Promise.all(
          subHandles.map((h) =>
            storefrontApiRequest(COLLECTION_BY_HANDLE_QUERY, {
              handle: h,
              first: 48,
              sortKey: sort.key,
              reverse: sort.reverse,
            })
          )
        );
        const allEdges = results.flatMap((r) => r?.data?.collection?.products?.edges || []);
        // Deduplicate by product id
        const seen = new Set<string>();
        const uniqueEdges = allEdges.filter((e: any) => {
          if (seen.has(e.node.id)) return false;
          seen.add(e.node.id);
          return true;
        });
        return {
          id: "tops",
          title: "Tops",
          description: "Sweatshirts, flannels, wovens, jackets & more.",
          products: { edges: uniqueEdges, pageInfo: { hasNextPage: false, endCursor: null } },
        };
      }

      // Subscription products aren't published to Storefront API — hardcode them
      if (combinedHandle === "subscriptions" && (!collection || !collection.products?.edges?.length)) {
        const subscriptionProducts = [
          {
            node: {
              id: "gid://shopify/Product/1537353449571",
              title: "Artist Series Tees - Monthly",
              handle: "artist-series-tees-monthly",
              productType: "Subscription",
              images: { edges: [{ node: { url: "https://cdn.shopify.com/s/files/1/1096/0120/files/Artist_Series_Tees_-_Monthly_-_-1520.jpg?v=1771759364", altText: "Artist Series Tees - Monthly" } }] },
              priceRange: { minVariantPrice: { amount: "24.99", currencyCode: "USD" }, maxVariantPrice: { amount: "24.99", currencyCode: "USD" } },
              variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/13120376438883", title: "ASSORTED / S", availableForSale: true, price: { amount: "24.99", currencyCode: "USD" }, selectedOptions: [{ name: "Size", value: "S" }] } }] },
              options: [{ name: "Size", values: ["S", "M", "L", "XL", "2X", "3X"] }],
              tags: ["Subscription", "STANDARD"],
              description: "Standard Artist Series tee delivered monthly. $24.99/mo with free shipping.",
            },
          },
          {
            node: {
              id: "gid://shopify/Product/6665440821347",
              title: "Premium Tee Subscription - Monthly",
              handle: "subscription-premium-tee-1mo",
              productType: "Subscription",
              images: { edges: [{ node: { url: "https://cdn.shopify.com/s/files/1/1096/0120/files/Premium_Tee_Subscription_-_Monthly_-_-8907.jpg?v=1771780022", altText: "Premium Tee Subscription - Monthly" } }] },
              priceRange: { minVariantPrice: { amount: "29.99", currencyCode: "USD" }, maxVariantPrice: { amount: "33.99", currencyCode: "USD" } },
              variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/39646617600099", title: "ASSORTED / S", availableForSale: true, price: { amount: "29.99", currencyCode: "USD" }, selectedOptions: [{ name: "Size", value: "S" }] } }] },
              options: [{ name: "Size", values: ["S", "M", "L", "XL", "2X", "3X", "4X", "5X"] }],
              tags: ["Subscription", "premium tee"],
              description: "Premium double-dye Artist Series tee delivered monthly. From $29.99/mo.",
            },
          },
          {
            node: {
              id: "gid://shopify/Product/4341563785315",
              title: "Artist Series Gift Subscription - 3 Months",
              handle: "artist-series-gift-subscription-3months",
              productType: "Subscription",
              images: { edges: [{ node: { url: "https://cdn.shopify.com/s/files/1/1096/0120/files/Artist_Series_Tees_-_Monthly_-_-1520.jpg?v=1771759364", altText: "Artist Series Gift Subscription" } }] },
              priceRange: { minVariantPrice: { amount: "75.00", currencyCode: "USD" }, maxVariantPrice: { amount: "85.00", currencyCode: "USD" } },
              variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/31361097760867", title: "ASSORTED / S", availableForSale: true, price: { amount: "75.00", currencyCode: "USD" }, selectedOptions: [{ name: "Size", value: "S" }] } }] },
              options: [{ name: "Size", values: ["S", "M", "L", "XL", "2X", "3X", "4X", "5X"] }],
              tags: ["Subscription", "GIFT"],
              description: "Gift a 3-month Artist Series tee subscription. $75 with free shipping.",
            },
          },
          {
            node: {
              id: "gid://shopify/Product/1527492771939",
              title: "Artist Series Tee Subscription - 6 Months",
              handle: "artist-series-tee-subscription-6-months",
              productType: "Subscription",
              images: { edges: [{ node: { url: "https://cdn.shopify.com/s/files/1/1096/0120/files/Artist_Series_Tees_-_Monthly_-_-1520.jpg?v=1771759364", altText: "Artist Series Tee Subscription - 6 Months" } }] },
              priceRange: { minVariantPrice: { amount: "138.00", currencyCode: "USD" }, maxVariantPrice: { amount: "138.00", currencyCode: "USD" } },
              variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/13120365625443", title: "ASSORTED / S", availableForSale: true, price: { amount: "138.00", currencyCode: "USD" }, selectedOptions: [{ name: "Size", value: "S" }] } }] },
              options: [{ name: "Size", values: ["S", "M", "L", "XL", "2X", "3X"] }],
              tags: ["Subscription", "GIFT"],
              description: "6-month Artist Series tee subscription. $23/tee with free shipping & free gift.",
            },
          },
          {
            node: {
              id: "gid://shopify/Product/1527492968547",
              title: "Artist Series Tee Subscription - 12 Months",
              handle: "artist-series-tee-subscription-12-months",
              productType: "Subscription",
              images: { edges: [{ node: { url: "https://cdn.shopify.com/s/files/1/1096/0120/files/Artist_Series_Tees_-_Monthly_-_-1520.jpg?v=1771759364", altText: "Artist Series Tee Subscription - 12 Months" } }] },
              priceRange: { minVariantPrice: { amount: "264.00", currencyCode: "USD" }, maxVariantPrice: { amount: "264.00", currencyCode: "USD" } },
              variants: { edges: [{ node: { id: "gid://shopify/ProductVariant/13120366116963", title: "ASSORTED / S", availableForSale: true, price: { amount: "264.00", currencyCode: "USD" }, selectedOptions: [{ name: "Size", value: "S" }] } }] },
              options: [{ name: "Size", values: ["S", "M", "L", "XL", "2X", "3X"] }],
              tags: ["Subscription", "GIFT"],
              description: "12-month Artist Series tee subscription. $22/tee with free shipping & free gift.",
            },
          },
        ];
        return {
          id: "subscriptions",
          title: "Subscriptions",
          products: { edges: subscriptionProducts, pageInfo: { hasNextPage: false, endCursor: null } },
        };
      }

      return collection;
    },
    enabled: !!handle,
  });

  // Reset accumulated products when initial data changes (new collection or sort)
  useEffect(() => {
    if (!data) return;
    const edges = data?.products?.edges || [];
    const pageInfo = data?.products?.pageInfo;
    setAllProducts(edges.map((e: any) => e.node));
    setEndCursor(pageInfo?.endCursor || null);
    setHasNextPage(pageInfo?.hasNextPage || false);
  }, [data]);

  // Track collection view in Shopify analytics
  useEffect(() => {
    if (data && handle) {
      trackCollectionView({ id: data.id || "", title: data.title || handle, handle });
      ga4ViewItemList({ id: data.id || "", title: data.title || handle, handle });
    }
  }, [data, handle]);

  const loadMore = useCallback(async () => {
    if (!endCursor || !handle || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await storefrontApiRequest(COLLECTION_BY_HANDLE_QUERY, {
        handle,
        first: 48,
        after: endCursor,
        sortKey: sort.key,
        reverse: sort.reverse,
      });
      const collection = res?.data?.collection;
      const newEdges = collection?.products?.edges || [];
      const pageInfo = collection?.products?.pageInfo;
      setAllProducts((prev) => [...prev, ...newEdges.map((e: any) => e.node)]);
      setEndCursor(pageInfo?.endCursor || null);
      setHasNextPage(pageInfo?.hasNextPage || false);
    } catch (err) {
      console.error("Failed to load more products:", err);
      toast.error("Failed to load more products");
    } finally {
      setIsLoadingMore(false);
    }
  }, [endCursor, handle, sort.key, sort.reverse, isLoadingMore]);

  // Filter out products that are completely unavailable (unpublished / all variants sold out)
  const rawProducts = allProducts.filter((p: any) => p.availableForSale !== false);
  const urlHandle = subhandle ? `${rawHandle}-${subhandle}` : rawHandle;

  // Artist Series tees: filter out non-tee products
  // Artist Series hats: filter to only hat products
  const products = handle === "artist-series" && urlHandle !== "hats-artist-series"
    ? rawProducts.filter((p: any) => {
        const type = (p.productType || "").toLowerCase();
        const title = (p.title || "").toLowerCase();
        const combined = type + " " + title;
        const isNonTee = /\bhat\b|\bhats\b|snapback|cap\b|beanie|sticker|patch|\bpin\b|lanyard|\bbag\b|boxer|hoodie|flannel|jacket|poster/i.test(combined);
        return !isNonTee;
      })
    : urlHandle === "hats-artist-series"
    ? rawProducts.filter((p: any) => {
        const type = (p.productType || "").toLowerCase();
        const title = (p.title || "").toLowerCase();
        const combined = type + " " + title;
        return /\bhat\b|\bhats\b|snapback|beanie/i.test(combined);
      })
    : rawProducts;
  const meta = collectionMeta[urlHandle || ""] || collectionMeta[handle || ""];
  const title = data?.title || meta?.title || handle?.replace(/-/g, " ") || "Collection";
  const description = data?.description || meta?.description || "";
  const heroImage = handle === "bro_oks" ? brooksBanner : data?.image?.url;
  const isCapsule = meta?.capsule || /capsule/i.test(handle || "") || /capsule/i.test(title);
  const isMarchDrop = handle === "march-artist-series-bundle" || handle === "delivery-2-march-2026";
  const capsuleBg = isMarchDrop ? '#5c0602' : '#f0ede8';
  const capsuleTextColor = isMarchDrop ? '#f5e6d0' : '#5a5550';
  const capsuleTitleColor = isMarchDrop ? '#ffffff' : '#1a1714';
  const capsuleToolbarBg = isMarchDrop ? 'rgba(92,6,2,0.95)' : 'rgba(240,237,232,0.95)';
  const capsuleToolbarBorder = isMarchDrop ? 'rgba(255,255,255,0.1)' : 'rgba(213,208,201,0.4)';

  // Bundle mode state
  const isYouthTees = handle === "youth-tees";
  const isSolids = handle === "the-solids";
  const isAngels = handle === "angels-capsule";
  const isMarchArtistSeries = handle === "march-artist-series-bundle" || handle === "delivery-2-march-2026";
  const [bundleMode, setBundleMode] = useState(false);
  const [bundleSelections, setBundleSelections] = useState<BundleSelection[]>([]);
  const [isAddingBundle, setIsAddingBundle] = useState(false);
  const [solidsTier, setSolidsTier] = useState<3 | 5>(3);
  const addItem = useCartStore((s) => s.addItem);

  const bundleMax = isSolids ? solidsTier : 4;

  const handleBundleSelect = (selection: BundleSelection) => {
    setBundleSelections((prev) => {
      const nextCount = prev.length + 1;
      // Auto-upgrade from 3-pack to 5-pack when customer adds a 4th item
      if (isSolids && solidsTier === 3 && nextCount > 3) {
        setSolidsTier(5);
      }
      const currentMax = isSolids ? (nextCount > 3 ? 5 : solidsTier) : 4;
      if (prev.length >= currentMax) return prev;
      return [...prev, { ...selection, selectionId: `sel-${++bundleSelectionCounter}` }];
    });
  };

  const handleBundleRemove = (selectionId: string) => {
    setBundleSelections((prev) => prev.filter((s) => s.selectionId !== selectionId));
  };

  const handleAddBundleToCart = async () => {
    if (bundleSelections.length < bundleMax) return;
    setIsAddingBundle(true);
    const hasPremium = bundleSelections.some(s => /premium/i.test(s.productTitle));
    const solids5Code = hasPremium ? "SOLIDS5PRE" : "SOLIDS5STD";
    const discountCode = isSolids
      ? (solidsTier === 3 ? "SOLIDS3" : solids5Code)
      : isYouthTees ? "YOUTH4"
      : handle === "bro_oks" ? "BROOKS4" : isAngels ? "ANGELS4" : isMarchArtistSeries ? "MARCH4" : "CHERUBS4";
    const bundleTag = isSolids ? "solids-pack" : isYouthTees ? "youth-tees" : handle === "bro_oks" ? "bro_oks" : isAngels ? "angels-capsule" : isMarchArtistSeries ? "march-artist-series-bundle" : "cherubs-capsule";
    try {
      for (const sel of bundleSelections) {
        await addItem({
          product: sel.product,
          variantId: sel.variantId,
          variantTitle: sel.variantTitle,
          price: sel.price,
          quantity: 1,
          selectedOptions: sel.selectedOptions,
          bundleTag,
        });
      }
      const discountMsg = isSolids ? (solidsTier === 3 ? 'Save $10' : 'Get your free shirt') : isYouthTees ? 'get your free tee' : 'your discount';
      const packLabel = isSolids ? `${solidsTier}-pack` : isYouthTees ? '4-pack' : 'Bundle';
      toast.success(`${packLabel} added to cart! ${discountMsg} applies automatically at checkout.`, { duration: 5000 });
      setBundleSelections([]);
      setBundleMode(false);
    } catch (error) {
      toast.error("Failed to add bundle to cart");
    } finally {
      setIsAddingBundle(false);
    }
  };

  // Extract all available sizes
  const allSizes = useMemo(() => {
    const sizeSet = new Set<string>();
    products.forEach((p: any) => {
      const sizeOption = p.options?.find((o: any) => o.name === "Size");
      sizeOption?.values.forEach((v: string) => sizeSet.add(v));
    });
    return Array.from(sizeSet);
  }, [products]);

  // Extract tee types from product titles
  const teeTypes = useMemo(() => {
    const types: string[] = [];
    const hasStandard = products.some((p: any) => /standard/i.test(p.title));
    const hasPremium = products.some((p: any) => /premium/i.test(p.title));
    const has1Ton = products.some((p: any) => /1[\s-]?ton/i.test(p.title));
    if (hasStandard) types.push("Standard");
    if (hasPremium) types.push("Premium");
    if (has1Ton) types.push("1Ton");
    return types;
  }, [products]);

  // Use module-level color maps
  const basicColorMap = BASIC_COLOR_MAP;
  const colorSwatchHex = COLOR_SWATCH_HEX;
  const mapToBasicColors = mapRawColorToBasic;

  // Build a map of basic color → raw color values for filtering
  const colorBuckets = useMemo(() => {
    const buckets: Record<string, Set<string>> = {};
    products.forEach((p: any) => {
      const colorOption = p.options?.find((o: any) => o.name === "Color");
      colorOption?.values.forEach((v: string) => {
        const basics = mapToBasicColors(v);
        basics.forEach((basic) => {
          if (!buckets[basic]) buckets[basic] = new Set();
          buckets[basic].add(v);
        });
      });
    });
    return buckets;
  }, [products]);

  const allColors = useMemo(() => {
    const order = ["Black", "White", "Grey", "Red", "Pink", "Orange", "Yellow", "Green", "Blue", "Purple", "Brown", "Washes"];
    return order.filter((c) => colorBuckets[c]?.size);
  }, [colorBuckets]);

  // Filter products
  const filteredProducts = useMemo(() => {
    const filtered = products.filter((p: any) => {
      // Type filter
      if (selectedTypes.length > 0) {
        const matchesType = selectedTypes.some((type) => {
          if (type === "1Ton") return /1[\s-]?ton/i.test(p.title);
          return new RegExp(type, "i").test(p.title);
        });
        if (!matchesType) return false;
      }
      // Size filter
      if (selectedSizes.length > 0) {
        const sizeOption = p.options?.find((o: any) => o.name === "Size");
        if (!sizeOption || !selectedSizes.some((s) => sizeOption.values.includes(s))) {
          return false;
        }
      }
      // Color filter — match basic color bucket to raw values
      if (selectedColors.length > 0) {
        const colorOption = p.options?.find((o: any) => o.name === "Color");
        if (!colorOption) return false;
        const rawValues: string[] = colorOption.values;
        const matches = selectedColors.some((basicColor) => {
          const bucket = colorBuckets[basicColor];
          return bucket && rawValues.some((v: string) => bucket.has(v));
        });
        if (!matches) return false;
      }
      // Price filter
      const price = parseFloat(p.priceRange?.minVariantPrice?.amount || "0");
      if (price < priceRange[0] || (priceRange[1] !== 999 && price > priceRange[1])) {
        return false;
      }
      return true;
    });

    // Boost Everywear products to the top on pants collection
    if (handle === "pants") {
      filtered.sort((a: any, b: any) => {
        const aEverywear = /everywear/i.test(a.title) ? 0 : 1;
        const bEverywear = /everywear/i.test(b.title) ? 0 : 1;
        return aEverywear - bEverywear;
      });
    }

    return filtered;
  }, [products, selectedTypes, selectedSizes, selectedColors, priceRange, handle]);

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const clearFilters = () => {
    setSelectedSizes([]);
    setSelectedTypes([]);
    setSelectedColors([]);
    setPriceRange([0, 999]);
  };

  const activeFilterCount = selectedSizes.length + selectedTypes.length + selectedColors.length + (priceRange[0] !== 0 || priceRange[1] !== 999 ? 1 : 0);

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!sortOpen) return;
    const handler = () => setSortOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [sortOpen]);

  // Time-gate: redirect to drop countdown page if March drop hasn't gone live yet
  const MARCH_DROP_DATE = "2026-03-26T17:00:00.000Z"; // 9 AM PST
  if (handle === "march-artist-series-bundle" && Date.now() < new Date(MARCH_DROP_DATE).getTime()) {
    return <Navigate to="/drops/march-artist-series" replace />;
  }

  return (
    <div className={`min-h-screen ${isCapsule ? '' : 'bg-background'}`} style={isCapsule ? { backgroundColor: capsuleBg } : undefined}>
      <SEO
        title={title}
        description={description || `Shop ${title} at Sullen Clothing`}
        path={`/collections/${handle}`}
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            description: description || `Shop ${title} at Sullen Clothing`,
            url: `https://www.sullenclothing.com/collections/${handle}`,
            isPartOf: {
              "@type": "WebSite",
              name: "Sullen Clothing",
              url: "https://www.sullenclothing.com",
            },
          })}
        </script>
      </Helmet>
      <SiteHeader />

      {/* Hero banner */}
      {isCapsule ? (
        <>
          <div ref={heroRef} className="relative overflow-hidden h-[35vh] lg:h-[40vh] max-h-[400px]" style={{ background: isMarchDrop ? 'linear-gradient(180deg, #5c0602 0%, #3a0401 100%)' : 'linear-gradient(180deg, #e8e4de 0%, #f5f2ed 40%, #eae7e1 100%)' }}>
            <motion.img
              src="https://cdn.shopify.com/s/files/1/1096/0120/files/web-BANNER-CHERUBs.jpg?v=1771453523"
              alt="Cherubs Capsule"
              className="absolute inset-0 w-full h-[130%] object-cover opacity-30 mix-blend-multiply will-change-transform"
              style={{ y: parallaxY }}
            />
            <div className="absolute inset-0 opacity-25" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,250,240,0.9) 0%, transparent 60%)' }} />
            {/* Artist Series logo watermark behind text */}
            {isMarchDrop && (
              <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none">
                <img
                  src={artistSeriesLogo}
                  alt=""
                  className="w-[60%] max-w-[320px] h-auto opacity-15"
                  style={{ filter: 'invert(1)' }}
                />
              </div>
            )}
            <div className="relative z-10 flex flex-col items-center justify-center text-center py-12 lg:py-16 px-4">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-[10px] md:text-[11px] font-condensed font-semibold uppercase tracking-[0.6em] mb-4" style={{ color: capsuleTextColor }}
              >
                Capsule Collection
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-hudson text-4xl md:text-6xl lg:text-7xl uppercase tracking-[0.08em] leading-[0.95]" style={{ color: capsuleTitleColor, textShadow: isMarchDrop ? '0 2px 20px rgba(0,0,0,0.5)' : '0 2px 10px rgba(255,255,255,0.5)' }}
              >
                {title}
              </motion.h1>
              {isMarchDrop && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-sm border"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245,230,208,0.12) 0%, rgba(245,230,208,0.06) 100%)',
                    borderColor: 'rgba(245,230,208,0.25)',
                  }}
                >
                  <Gift className="w-4 h-4" style={{ color: '#f5e6d0' }} />
                  <span className="font-display text-[11px] md:text-xs uppercase tracking-[0.25em] font-semibold" style={{ color: '#f5e6d0' }}>
                    Bundle &amp; Save — Buy 3 Get 1 Free
                  </span>
                </motion.div>
              )}
            </div>
            {/* Clouds in front of image (not for dark-themed capsules) */}
            {!isMarchDrop && (
              <div className="absolute inset-0 z-20 overflow-hidden pointer-events-none">
                <div className="cloud cloud-1" />
                <div className="cloud cloud-2" />
                <div className="cloud cloud-3" />
                <div className="cloud cloud-4" />
                <div className="cloud cloud-5" />
              </div>
            )}
            <div className="h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.08), transparent)' }} />
          </div>
        </>
      ) : (
      <div className="relative overflow-hidden z-10">
        {heroImage ? (
          <>
            <img
              src={heroImage}
              alt={title}
              className={`w-full object-cover brightness-[0.3] ${handle === "bro_oks" ? "h-[250px] lg:h-[350px]" : "h-[200px] lg:h-[180px]"}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </>
        ) : (
          <div className="h-[140px] lg:h-[120px] bg-gradient-to-b from-secondary/50 to-background" />
        )}

        <div className="absolute inset-0 flex flex-col justify-end pb-6 lg:pb-10 px-4 lg:px-8 max-w-7xl mx-auto w-full">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[11px] font-body text-muted-foreground mb-3">
            <Link to="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronLeft className="w-3 h-3 rotate-180" />
            <span className="text-foreground/80 capitalize">{title}</span>
          </nav>

          <h1 className="font-hudson text-2xl lg:text-4xl uppercase tracking-[0.1em] text-foreground">
            {title}
          </h1>
        </div>
      </div>
      )}

      {/* Category sub-navigation */}
      <CollectionSubNav handle={urlHandle || handle || ""} capsule={isCapsule} />

      {/* BRO_OKS skull logo background */}
      {handle === "bro_oks" && (
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
          <div className="absolute inset-0 bg-background" />
          <div className="absolute inset-0 flex items-center justify-center pt-72">
            <img
              src={brooksSkullLogo}
              alt=""
              className="w-[150vw] max-w-[1500px] h-auto opacity-30"
            />
          </div>
        </div>
      )}

      {/* Letterheads calligraphy background */}
      {handle === "letterheads" && (
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
          <div className="absolute inset-0 bg-background" />
          <img
            src={letterheadsBg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-[0.15]"
          />
        </div>
      )}

      {/* Capsule pages get light theme for content area */}
      <div className={`relative z-10 ${isCapsule && !isMarchDrop ? 'light bg-[#f0ede8]' : ''}`} style={isMarchDrop ? { backgroundColor: capsuleBg } : undefined}>

      {/* Toolbar */}
      <div className={`relative z-20 backdrop-blur-md border-b ${!isCapsule ? 'bg-background/95 border-border/20' : ''}`} style={isCapsule ? { backgroundColor: capsuleToolbarBg, borderColor: capsuleToolbarBorder } : undefined}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Filter button */}
            <button
              onClick={() => setFilterOpen(true)}
              className="flex items-center gap-1.5 text-[11px] font-display uppercase tracking-[0.18em] text-foreground/70 hover:text-foreground transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filter
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-body">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Product count */}
            <span className="text-[11px] text-muted-foreground font-body hidden sm:block">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSortOpen(!sortOpen);
                }}
                className="flex items-center gap-1.5 text-[11px] font-display uppercase tracking-[0.18em] text-foreground/70 hover:text-foreground transition-colors"
              >
                {sort.label}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${sortOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50"
                  >
                    {sortOptions.map((opt, i) => (
                      <button
                        key={`${opt.key}-${opt.reverse}`}
                        onClick={() => {
                          setSortIndex(i);
                          setSortOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-display uppercase tracking-wider transition-colors ${
                          i === sortIndex
                            ? "bg-primary/10 text-primary"
                            : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Layout toggle */}
            <div className="hidden sm:flex items-center border border-border/30 rounded-sm overflow-hidden">
              <button
                onClick={() => setLayout("grid")}
                className={`p-1.5 transition-colors ${
                  layout === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setLayout("large")}
                className={`p-1.5 transition-colors ${
                  layout === "large" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {((isCapsule) || handle === "bro_oks" || isYouthTees) && <PromoBanner bundleMode={bundleMode} onToggleBundle={() => { setBundleMode(!bundleMode); if (bundleMode) setBundleSelections([]); }} collectionHandle={handle} />}

      {isSolids && (
        <SolidsPackBanner
          bundleMode={bundleMode}
          onToggleBundle={() => { setBundleMode(!bundleMode); if (bundleMode) setBundleSelections([]); }}
          tier={solidsTier}
          onTierChange={(t) => { setSolidsTier(t); setBundleSelections([]); }}
          selectionCount={bundleSelections.length}
        />
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-4">
          <div className="flex items-center gap-2 flex-wrap">
            {selectedTypes.map((type) => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className="flex items-center gap-1 text-[11px] font-display uppercase tracking-wider text-foreground/80 bg-secondary border border-border/30 rounded-sm px-2.5 py-1 hover:border-primary/50 transition-colors"
              >
                {type}
                <X className="w-3 h-3" />
              </button>
            ))}
            {selectedColors.map((color) => (
              <button
                key={color}
                onClick={() => toggleColor(color)}
                className="flex items-center gap-1 text-[11px] font-display uppercase tracking-wider text-foreground/80 bg-secondary border border-border/30 rounded-sm px-2.5 py-1 hover:border-primary/50 transition-colors"
              >
                {color}
                <X className="w-3 h-3" />
              </button>
            ))}
            {selectedSizes.map((size) => (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                className="flex items-center gap-1 text-[11px] font-display uppercase tracking-wider text-foreground/80 bg-secondary border border-border/30 rounded-sm px-2.5 py-1 hover:border-primary/50 transition-colors"
              >
                {size}
                <X className="w-3 h-3" />
              </button>
            ))}
            {(priceRange[0] !== 0 || priceRange[1] !== 999) && (
              <button
                onClick={() => setPriceRange([0, 999])}
                className="flex items-center gap-1 text-[11px] font-display uppercase tracking-wider text-foreground/80 bg-secondary border border-border/30 rounded-sm px-2.5 py-1 hover:border-primary/50 transition-colors"
              >
                {priceRange[1] === 999 ? `$${priceRange[0]}+` : `$${priceRange[0]}–$${priceRange[1]}`}
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={clearFilters}
              className="text-[11px] font-body text-primary hover:text-primary/80 transition-colors ml-1"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Product grid */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-10">
        {isLoading ? (
          <div
            className={`grid gap-3 lg:gap-5 ${
              layout === "large"
                ? "grid-cols-2 lg:grid-cols-3"
                : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            }`}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3 animate-pulse">
                <div className="aspect-[3/4] rounded-lg bg-secondary" />
                <div className="h-3 bg-secondary rounded w-3/4" />
                <div className="h-3 bg-secondary rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="font-display text-lg uppercase tracking-wider text-foreground mb-2">
              Something went wrong
            </p>
            <p className="text-sm text-muted-foreground font-body">
              Unable to load this collection. Please try again.
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-lg uppercase tracking-wider text-foreground mb-2">
              No products found
            </p>
            <p className="text-sm text-muted-foreground font-body">
              {activeFilterCount > 0
                ? "Try adjusting your filters."
                : "This collection is empty."}
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 text-xs font-display uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div
            className={`grid gap-3 lg:gap-5 ${
              layout === "large"
                ? "grid-cols-2 lg:grid-cols-3"
                : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            }`}
          >
            {filteredProducts.map((product: any) => (
              <CollectionProductCard
                key={product.id}
                product={product}
                layout={layout}
                bundleMode={(isCapsule || handle === "bro_oks" || isSolids || isYouthTees) && bundleMode}
                bundleSelections={bundleSelections}
                onBundleSelect={handleBundleSelect}
                onBundleRemove={handleBundleRemove}
                collectionHandle={handle}
                bundleMax={bundleMax}
                hasVideo={hasVideo(product.handle)}
                swatchMap={swatchMap}
              />
            ))}
          </div>
        )}

        {/* Load More button */}
        {!isLoading && !error && hasNextPage && (
          <div className="flex justify-center mt-10">
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="inline-flex items-center gap-2 font-display text-xs uppercase tracking-[0.2em] px-8 py-3.5 border border-border/50 rounded-sm text-foreground hover:border-primary hover:text-primary transition-all disabled:opacity-50"
            >
              {isLoadingMore ? (
                <span className="animate-pulse">Loading…</span>
              ) : (
                <>Load More Products</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Collection info (collapsed) */}
      {description && (
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pb-8">
          <details className="group border-t border-border/30 pt-4">
            <summary className="flex items-center gap-2 cursor-pointer text-xs font-display uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors list-none">
              <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
              About this collection
            </summary>
            <p className="text-sm text-muted-foreground font-body mt-3 max-w-2xl leading-relaxed">
              {description}
            </p>
          </details>
        </div>
      )}

      </div> {/* end light theme wrapper */}

      {/* Filter drawer — rendered outside the z-10 wrapper to avoid stacking issues */}
      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        sizes={allSizes}
        selectedSizes={selectedSizes}
        toggleSize={toggleSize}
        teeTypes={teeTypes}
        selectedTypes={selectedTypes}
        toggleType={toggleType}
        colors={allColors}
        selectedColors={selectedColors}
        toggleColor={toggleColor}
        colorSwatchHex={colorSwatchHex}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        clearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* Bundle bottom bar */}
      <AnimatePresence>
        {bundleMode && (
          <BundleBar
            selections={bundleSelections}
            onRemove={handleBundleRemove}
            onAddAllToCart={handleAddBundleToCart}
            isAdding={isAddingBundle}
            maxSlots={bundleMax}
            discountLabel={isSolids ? (solidsTier === 3 ? "Save $10 with SOLIDS3" : "Free shirt at checkout") : isYouthTees ? "Free tee with YOUTH4" : undefined}
          />
        )}
      </AnimatePresence>

      <SiteFooter />
    </div>
  );
}
