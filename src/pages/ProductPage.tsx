import { useParams, Link } from "react-router-dom";
import { useState, useMemo, useRef, useEffect } from "react";
import { ProductReviews } from "@/components/ProductReviews";
import { StickyAddToCart } from "@/components/StickyAddToCart";
import { RandomTeesPDPEnhancement } from "@/components/RandomTeesPDPEnhancement";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useNativeReviews, getReviewGroup } from "@/hooks/useNativeReviews";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ShoppingBag, Loader2, ChevronLeft, Check,
  Truck, Shield, RotateCcw, ChevronDown, Heart, Star, X, AlertTriangle
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SEO } from "@/components/SEO";
import { SiteFooter } from "@/components/SiteFooter";

import { ArtistStorySection } from "@/components/ArtistStorySection";
import { ArtistInterviewSection } from "@/components/ArtistInterviewSection";
import { RelatedProducts } from "@/components/RelatedProducts";
import { TeeTierSwitcher } from "@/components/TeeTierSwitcher";
import { Badge } from "@/components/ui/badge";
import { SizeChartModal, type SizeChartType } from "@/components/SizeChartModal";
import { ArtistSeriesBadge } from "@/components/ArtistSeriesBadge";
import { ImageGallery } from "@/components/ImageGallery";
import { BackInStockForm } from "@/components/BackInStockForm";
import { SizeSelector } from "@/components/SizeSelector";
import twentyFiveBadge from "@/assets/25-year-badge.png";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import {
  storefrontApiRequest,
  PRODUCT_BY_HANDLE_QUERY,
  type ShopifyProduct,
} from "@/lib/shopify";
import { getArtistByShopifyHandle } from "@/data/artists";
import { trackProductView } from "@/lib/shopifyAnalytics";
import { ga4ViewItem } from "@/lib/ga4";
import { metaViewContent, generateEventId } from "@/lib/metaPixel";
import { capiViewContent } from "@/lib/metaCapi";
import { getDirectoryArtistByName, directoryArtists, type DirectoryArtist } from "@/data/artistDirectory";
import { useArtistStory } from "@/hooks/useArtistStories";
import { useArtistProfiles, mergeArtistProfile } from "@/hooks/useArtistProfiles";
import { useProductVideos } from "@/hooks/useProductVideos";
import sullenLogo from "@/assets/sullen-logo.png";
import letterheadsBg from "@/assets/letterheads-background.jpg";
import { toast } from "sonner";

/* ─── Main PDP ─── */
export default function ProductPage() {
  const { handle } = useParams<{ handle: string }>();
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedSellingPlanId, setSelectedSellingPlanId] = useState<string | null>(null);
  const [artistPopupOpen, setArtistPopupOpen] = useState(false);
  const [artistBioExpanded, setArtistBioExpanded] = useState(false);
  const addToCartRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((s) => s.addItem);
  const isCartLoading = useCartStore((s) => s.isLoading);
  const { toggleItem, isInWishlist } = useWishlistStore();
  const { trackView } = useRecentlyViewed();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", handle],
    queryFn: async () => {
      const res = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
      const p = res?.data?.product ?? null;
      if (!p) {
        console.warn(`[PDP] Product not found for handle: "${handle}"`);
      }
      return p;
    },
    enabled: !!handle,
    retry: 1,
  });

  // Determine review group from product's collections
  const productCollections = product?.collections?.edges?.map((e: any) => e.node.handle) ?? [];
  const reviewGroup = getReviewGroup(productCollections);
  const nativeReviews = useNativeReviews(handle ?? "", reviewGroup);
  const avgRating = nativeReviews.data?.aggregate?.avgRating ?? 0;
  const reviewCount = nativeReviews.data?.aggregate?.totalReviews ?? 0;

  // Detect Artist Series tag & lookup local artist data
  const isArtistSeries = product?.tags?.some((t: string) => t.toLowerCase() === "artist series");
  const isPremiumTee = product?.tags?.some((t: string) => t.toLowerCase() === "premium tee");
  const is1TonTee = product?.tags?.some((t: string) => t.toLowerCase() === "1 ton");
  const isTee = product?.tags?.some((t: string) =>
    ["tee", "tees", "standard tee", "premium tee", "1 ton"].includes(t.toLowerCase())
  );

  // Auto-detect size chart type from tags & product type
  const detectedSizeChart = useMemo((): SizeChartType | null => {
    if (!product) return null;
    const tags = (product.tags || []).map((t: string) => t.toLowerCase());
    const pType = (product.productType || "").toLowerCase();
    const title = (product.title || "").toLowerCase();

    // Boxers
    if (tags.includes("boxers") || pType === "boxers" || title.includes("boxer")) return "boxers";
    // Boy shorts
    if (tags.includes("boy shorts") || tags.includes("boyshorts") || title.includes("boy short")) return "boyshorts";
    // Bralette
    if (tags.includes("bralette") || title.includes("bralette")) return "bralette";
    // E-waist
    if (tags.includes("sweatshort") || tags.includes("sweatshorts") || title.includes("sweatshort")) return "sweatshorts";
    if ((tags.includes("womens") || title.includes("women")) && (tags.includes("sweatpant") || title.includes("sweatpant"))) return "womens-sweatpants";
    if (tags.includes("sweatpant") || tags.includes("sweatpants") || title.includes("sweatpant")) return "sweatpants";
    if (tags.includes("walkshort") || tags.includes("walkshorts") || title.includes("walkshort")) return "walkshorts";
    if (tags.includes("sweatshirt") || title.includes("sweatshirt")) return "sweatshirt";
    if (tags.includes("pajama") || title.includes("pajama")) return "pajama-pants";
    if (tags.includes("polo") || title.includes("polo")) return "polo";
    if (tags.includes("belt") || title.includes("belt")) return "belt";
    if (tags.includes("youth") || title.includes("youth")) return "youth-tee";
    if (tags.includes("woven") || tags.includes("wovens") || title.includes("woven")) return "woven";
    if (tags.includes("crop") || title.includes("crop top") || title.includes("crop tee")) return "womens-crop";
    if (tags.includes("boy tee") || title.includes("boy tee")) return "womens-boy-tee";
    if (tags.includes("thong") || title.includes("thong")) return "thong";
    if (tags.includes("thermal") || title.includes("thermal")) return "thermal-ls";
    if (tags.includes("mens tank") || (title.includes("tank") && !title.includes("jersey"))) return "mens-tank";
    if (tags.includes("tank") || tags.includes("jersey top") || title.includes("jersey top")) return "tank-jersey";
    if (tags.includes("jersey shorts") || title.includes("jersey short")) return "jersey-shorts";
    if (tags.includes("e-waist shorts") || title.includes("e-waist short") || title.includes("e waist short")) return "e-waist-shorts";
    if (tags.includes("e-waist") || tags.includes("ewaist") || title.includes("e-waist") || title.includes("e waist")) return "e-waist";
    if (tags.includes("chino") || tags.includes("chinos") || title.includes("chino")) return "chinos";
    // Cargo
    if (tags.includes("cargo") || title.includes("cargo")) return "cargo";
    // Bikini
    if (tags.includes("bikini top") || title.includes("bikini top")) return "bikini-top";
    if (tags.includes("bikini bottom") || tags.includes("bikini bottoms") || title.includes("bikini bottom")) return "bikini-bottom";
    // Baby doll / women's tee
    if (tags.includes("baby doll") || tags.includes("babydoll") || pType === "baby doll") return "babydoll";
    // Flannel
    if (tags.includes("flannel") || title.includes("flannel")) return "flannel";
    // Jacket
    if (tags.includes("jacket") || title.includes("jacket")) return "jacket";
    // Fleece
    if (tags.includes("french terry long sleeve") || (title.includes("french terry") && title.includes("long sleeve"))) return "french-terry-ls";
    if (tags.includes("heavyweight pullover") || title.includes("heavyweight pullover") || (title.includes("heavyweight") && title.includes("fleece"))) return "hw-pullover";
    if (tags.includes("fleece") || tags.includes("french terry") || title.includes("fleece") || title.includes("french terry") || title.includes("ever crew")) return "fleece";
    // Tee tiers
    if (is1TonTee) return "1ton";
    if (isPremiumTee) return "premium";
    if (isTee) return "standard";

    return null;
  }, [product, isTee, isPremiumTee, is1TonTee]);
  const artistData = handle ? getArtistByShopifyHandle(handle) : undefined;

  // Look up directory artist from explicit artist mapping, handle, vendor, description, or title
  // Merge DB profile overrides (portrait, fullBio, location, etc.)
  const { data: profileMap } = useArtistProfiles();

  // Build a combined list of static + DB-only artists for matching
  const allArtists: DirectoryArtist[] = useMemo(() => {
    const staticSlugs = new Set(directoryArtists.map((a) => a.slug));
    const dbOnly: DirectoryArtist[] = [];
    profileMap?.forEach((row, slug) => {
      if (!staticSlugs.has(slug)) {
        dbOnly.push({
          name: row.name,
          slug,
          portrait: row.stored_portrait_url || row.portrait_url || "",
          specialty: row.specialty || undefined,
          styles: row.styles || [],
          location: row.location || undefined,
          instagram: row.instagram || undefined,
          bio: row.bio || "",
          fullBio: row.long_bio || undefined,
          blogUrl: "",
          galleryImages: row.gallery_images || [],
          studio: row.studio || undefined,
          bookingInfo: row.booking_info || undefined,
        });
      }
    });
    return [...directoryArtists, ...dbOnly];
  }, [profileMap]);

  const directoryArtist: DirectoryArtist | undefined = useMemo(() => {
    // Only show artist info for products tagged "Artist Series"
    if (!isArtistSeries) return undefined;
    if (!product) return undefined;

    // 0. Strongest signal: mapped artist from local artist product config
    if (artistData?.artistName) {
      const byMappedArtist = getDirectoryArtistByName(artistData.artistName);
      if (byMappedArtist) return byMappedArtist;
    }

    // 1. Match product handle against artist slugs (bidirectional)
    if (handle) {
      const bySlug = allArtists.find((a) => handle.includes(a.slug) || a.slug.startsWith(handle));
      if (bySlug) return bySlug;

      // Also check if the handle starts with an artist's last-name slug segment
      const byPartialSlug = allArtists.find((a) => {
        const parts = a.slug.split("-");
        if (parts.length < 2) return false;
        const lastName = parts[parts.length - 1];
        return lastName.length >= 4 && handle.startsWith(lastName);
      });
      if (byPartialSlug) return byPartialSlug;
    }

    // 2. Try vendor (if not generic Sullen)
    if (product.vendor && !["sullen", "sullen clothing", "sullen art collective"].includes(product.vendor.toLowerCase())) {
      const byVendor = allArtists.find((a) => a.name.toLowerCase() === product.vendor.toLowerCase());
      if (byVendor) return byVendor;
    }

    // 3. Scan description for Instagram handles (e.g. @danielrhzz)
    const desc = (product.description || "").toLowerCase();
    if (desc) {
      const handleMatch = desc.match(/@([a-z0-9_.]+)/);
      if (handleMatch) {
        const igHandle = `@${handleMatch[1]}`;
        const byHandle = allArtists.find((a) => a.instagram?.toLowerCase() === igHandle);
        if (byHandle) return byHandle;
      }
    }

    // 4. Match artist name in title or description
    const searchText = `${(product.title || "").toLowerCase()} ${desc}`;
    if (searchText.trim()) {
      const ambiguousNames = new Set(["feel", "norm", "art", "ink"]);
      const sorted = [...allArtists].sort((a, b) => b.name.length - a.name.length);
      const byName = sorted.find((a) => {
        const name = a.name.toLowerCase();
        if (ambiguousNames.has(name)) return false;
        const pattern = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
        return pattern.test(searchText);
      });
      if (byName) return byName;
    }

    return undefined;
  }, [isArtistSeries, artistData?.artistName, handle, product, allArtists]);

  // Fetch scraped bio for the directory artist
  const { story: artistStory } = useArtistStory(directoryArtist?.slug || "");

  const dbEnrichedArtist = useMemo(() => {
    if (!directoryArtist) return undefined;
    return mergeArtistProfile(directoryArtist, profileMap?.get(directoryArtist.slug));
  }, [directoryArtist, profileMap]);

  const localArtistPortraitFallback = useMemo(() => {
    const portrait = artistData?.artistPortrait;
    return portrait && !/^https?:\/\//i.test(portrait) ? portrait : undefined;
  }, [artistData?.artistPortrait]);

  // Enrich directoryArtist with scraped bio if available and guarantee portrait fallback
  const enrichedDirectoryArtist: DirectoryArtist | undefined = useMemo(() => {
    if (!dbEnrichedArtist) return undefined;
    const scrapedBio = artistStory?.sections?.[0]?.text;
    return {
      ...dbEnrichedArtist,
      bio: scrapedBio || dbEnrichedArtist.bio,
      portrait: dbEnrichedArtist.portrait || localArtistPortraitFallback || "",
    };
  }, [dbEnrichedArtist, artistStory, localArtistPortraitFallback]);

  const { getVideosForProduct } = useProductVideos();

  const images = useMemo(() => {
    const imgs: any[] = product?.images?.edges?.map((e: any) => e.node) || [];
    // Append promo videos from DB
    const productVideos = getVideosForProduct(handle || "");
    productVideos.forEach((v) => {
      imgs.push({ type: "video", url: v.video_url, poster: v.poster_url || undefined });
    });
    return imgs;
  }, [product, handle, getVideosForProduct]);

  // Auto-select first option values
  const options = product?.options || [];
  const resolvedOptions = useMemo(() => {
    const resolved: Record<string, string> = {};
    options.forEach((opt: any) => {
      // Auto-select single-value options (e.g. Color: BLACK)
      if (opt.values.length === 1) {
        resolved[opt.name] = opt.values[0];
      } else {
        resolved[opt.name] = selectedOptions[opt.name] || "";
      }
    });
    return resolved;
  }, [options, selectedOptions]);

  // Find matching variant
  const selectedVariant = useMemo(() => {
    if (!product) return null;
    const hasSelections = Object.values(resolvedOptions).some((v) => v !== "");
    if (!hasSelections) return product.variants?.edges?.[0]?.node;

    return product.variants?.edges?.find((v: any) =>
      v.node.selectedOptions.every(
        (so: any) => resolvedOptions[so.name] === so.value || resolvedOptions[so.name] === ""
      )
    )?.node;
  }, [product, resolvedOptions]);

  const price = selectedVariant
    ? parseFloat(selectedVariant.price.amount)
    : product
    ? parseFloat(product.priceRange?.minVariantPrice?.amount || "0")
    : 0;

  const comparePrice = selectedVariant?.compareAtPrice
    ? parseFloat(selectedVariant.compareAtPrice.amount)
    : 0;
  const onSale = comparePrice > price;
  const currency = product?.priceRange?.minVariantPrice?.currencyCode || "USD";

  const handleAddToCart = async () => {
    if (!product || !selectedVariant) {
      toast.error("Please select all options", { position: "top-center" });
      return;
    }
    if (!selectedVariant.availableForSale) {
      toast.error("This variant is sold out", { position: "top-center" });
      return;
    }
    const shopifyProduct: ShopifyProduct = { node: product };
    await addItem({
      product: shopifyProduct,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions || [],
      ...(selectedSellingPlanId ? { sellingPlanId: selectedSellingPlanId } : {}),
    });
    toast.success(selectedSellingPlanId ? "Subscription added to cart" : "Added to cart", {
      description: `${product.title} — ${selectedVariant.title}`,
      position: "top-center",
    });
  };

  // Scroll to top on product change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [handle]);

  // Track recently viewed + Shopify analytics
  useEffect(() => {
    if (product && handle) {
      trackView({
        handle,
        title: product.title,
        image: product.images?.edges?.[0]?.node?.url || "",
        price: product.priceRange?.minVariantPrice?.amount || "0",
        currencyCode: product.priceRange?.minVariantPrice?.currencyCode || "USD",
      });
      trackProductView({
        id: product.id,
        title: product.title,
        handle,
        vendor: product.vendor,
        price: product.priceRange?.minVariantPrice?.amount || "0",
        currencyCode: product.priceRange?.minVariantPrice?.currencyCode || "USD",
      });
      ga4ViewItem({
        id: product.id,
        title: product.title,
        handle,
        vendor: product.vendor,
        price: product.priceRange?.minVariantPrice?.amount || "0",
        currencyCode: product.priceRange?.minVariantPrice?.currencyCode || "USD",
      });
      const vcProduct = {
        id: product.id,
        title: product.title,
        handle,
        price: product.priceRange?.minVariantPrice?.amount || "0",
        currencyCode: product.priceRange?.minVariantPrice?.currencyCode || "USD",
      };
      const vcEventId = metaViewContent(vcProduct);
      capiViewContent(vcEventId, vcProduct);
    }
  }, [product, handle, trackView]);

  const setOption = (name: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [name]: value }));
  };

  /* ─── Loading / Error states ─── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-8 lg:pt-14">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
            <div className="aspect-[3/4] rounded-lg bg-secondary animate-pulse" />
            <div className="space-y-6">
              <div className="h-4 bg-secondary rounded w-1/3 animate-pulse" />
              <div className="h-8 bg-secondary rounded w-2/3 animate-pulse" />
              <div className="h-6 bg-secondary rounded w-1/4 animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 bg-secondary rounded w-full animate-pulse" />
                <div className="h-3 bg-secondary rounded w-4/5 animate-pulse" />
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-12 h-10 bg-secondary rounded animate-pulse" />
                ))}
              </div>
              <div className="h-12 bg-secondary rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h1 className="font-display text-2xl uppercase tracking-wider text-foreground">
              Product Not Found
            </h1>
            <p className="text-sm text-muted-foreground font-body">
              This product may no longer be available.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-display uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isLetterheads = handle?.toLowerCase().includes("letterhead") || product?.tags?.some((t: string) => t.toLowerCase() === "letterheads") || productCollections?.some((c: string) => c.toLowerCase().includes("letterhead"));

  return (
    <div className="min-h-screen bg-background relative">
      {/* Letterheads background */}
      {isLetterheads && (
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
          <div className="absolute inset-0 bg-background" />
          <img
            src={letterheadsBg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-[0.15]"
          />
        </div>
      )}
      <div className="relative z-10">
      <SEO
        title={product.title}
        description={product.description?.slice(0, 155)}
        path={`/product/${handle}`}
        image={images[0]?.url}
        type="product"
        product={{
          name: product.title,
          description: product.description || "",
          image: images.filter((i: any) => i.url).map((i: any) => i.url),
          url: `https://www.sullenclothing.com/product/${handle}`,
          brand: product.vendor || "Sullen Clothing",
          sku: selectedVariant?.sku || handle || "",
          price: price.toFixed(2),
          currency,
          availability: selectedVariant?.availableForSale !== false ? "InStock" : "OutOfStock",
          ratingValue: avgRating > 0 ? avgRating : undefined,
          reviewCount: reviewCount > 0 ? reviewCount : undefined,
          compareAtPrice: comparePrice > 0 ? comparePrice.toFixed(2) : undefined,
        }}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Collections", url: "/collections" },
          { name: product.title, url: `/product/${handle}` },
        ]}
      />
      <SiteHeader />

      <div className="max-w-6xl mx-auto px-0 lg:px-8 pt-0 lg:pt-10 pb-16 lg:pb-24">
        {/* Breadcrumb */}
        <nav className="hidden lg:flex items-center gap-1.5 text-[11px] font-body text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronLeft className="w-3 h-3 rotate-180" />
          <Link
            to={isLetterheads ? "/collections/letterheads" : isArtistSeries ? "/collections/artist-series" : "/collections/new-releases"}
            className="hover:text-foreground transition-colors"
          >
            {isLetterheads ? "Letterheads" : isArtistSeries ? "Artist Series" : "Shop"}
          </Link>
          <ChevronLeft className="w-3 h-3 rotate-180" />
          <span className="text-foreground/80 truncate max-w-[200px]">{product.title}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-0 lg:gap-14">
          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            {isArtistSeries && <ArtistSeriesBadge />}
            {handle?.includes("25-to-life") && (
              <img
                src={twentyFiveBadge}
                alt="Sullen 25th Anniversary"
                className="absolute top-3 left-3 z-20 w-[100px] h-[100px] object-contain drop-shadow-lg"
              />
            )}
            <ImageGallery images={images} productName={product.title} />
          </motion.div>

          {/* Product info */}
          <motion.div
            className="space-y-5 px-4 lg:px-0 mt-[5px] lg:mt-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >

            {/* Title & Price */}
            <div>
              <h1 className="font-hudson text-xl lg:text-3xl uppercase tracking-[0.08em] text-foreground leading-tight">
                {product.title}
              </h1>

              {/* Star rating inline */}
              {reviewCount > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < Math.round(avgRating) ? "fill-primary text-primary" : "text-muted-foreground/30"}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {avgRating.toFixed(1)} · {reviewCount.toLocaleString()} reviews
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mt-3">
                <span className={`text-xl font-body font-semibold ${onSale ? "text-destructive" : "text-foreground"}`}>
                  {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price)}
                </span>
                {onSale && (
                  <span className="text-sm text-muted-foreground/60 line-through font-body">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(comparePrice)}
                  </span>
                )}
                {onSale && (
                  <span className="text-[10px] font-display uppercase tracking-wider text-destructive bg-destructive/10 px-2 py-0.5 rounded-sm">
                    Save {Math.round(((comparePrice - price) / comparePrice) * 100)}%
                  </span>
                )}
              </div>
            </div>

            {/* Artist Attribution — opens popup */}
            {(enrichedDirectoryArtist || (isArtistSeries && product?.vendor)) && (
              <>
                <button
                  onClick={() => setArtistPopupOpen(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/20 hover:border-primary/30 transition-all group text-left"
                >
                  {enrichedDirectoryArtist?.portrait ? (
                    <img
                      src={enrichedDirectoryArtist.portrait}
                      alt={enrichedDirectoryArtist.name}
                      className="w-10 h-10 rounded-full object-cover border border-border/30"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <img src={sullenLogo} alt="Sullen" className="h-4 w-auto" style={{ filter: 'invert(67%) sepia(89%) saturate(600%) hue-rotate(10deg) brightness(100%) contrast(95%)' }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-display uppercase tracking-[0.2em] text-muted-foreground">
                      Designed by
                    </p>
                    <p className="text-sm font-display font-bold uppercase tracking-wide text-foreground group-hover:text-primary transition-colors truncate">
                      {enrichedDirectoryArtist?.name || product.vendor}
                    </p>
                    {enrichedDirectoryArtist?.specialty && (
                      <p className="text-[10px] font-body text-muted-foreground truncate">{enrichedDirectoryArtist.specialty}</p>
                    )}
                  </div>
                  <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* Artist popup modal */}
                <AnimatePresence>
                  {artistPopupOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setArtistPopupOpen(false)}>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative z-10 w-full max-w-md max-h-[80vh] overflow-y-auto rounded-xl bg-card border border-border/30 shadow-2xl"
                      >
                        {/* Close button */}
                        <button
                          onClick={() => setArtistPopupOpen(false)}
                          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/30 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        {/* Portrait header */}
                        {enrichedDirectoryArtist?.portrait && (
                          <div className="relative h-72 overflow-hidden rounded-t-xl">
                            <img
                              src={enrichedDirectoryArtist.portrait}
                              alt={enrichedDirectoryArtist.name}
                              className="w-full h-full object-cover object-top"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                          </div>
                        )}

                        <div className={`p-5 ${enrichedDirectoryArtist?.portrait ? "-mt-12 relative" : ""}`}>
                          <p className="text-[10px] font-display uppercase tracking-[0.2em] text-primary mb-0.5">The Artist</p>
                          <h3 className="text-xl font-display font-bold uppercase tracking-wide text-foreground mb-2">
                            {enrichedDirectoryArtist?.name || product.vendor}
                          </h3>

                          {enrichedDirectoryArtist && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {enrichedDirectoryArtist.location && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-body text-muted-foreground bg-secondary/60 px-2 py-1 rounded">
                                  📍 {enrichedDirectoryArtist.location}
                                </span>
                              )}
                              {enrichedDirectoryArtist.specialty && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-body text-muted-foreground bg-secondary/60 px-2 py-1 rounded">
                                  🎨 {enrichedDirectoryArtist.specialty}
                                </span>
                              )}
                              {enrichedDirectoryArtist.instagram && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-body text-muted-foreground bg-secondary/60 px-2 py-1 rounded">
                                  📸 {enrichedDirectoryArtist.instagram}
                                </span>
                              )}
                            </div>
                          )}

                          {enrichedDirectoryArtist?.bio && (
                            <div className="mb-4">
                              <p className={`text-sm font-body text-muted-foreground leading-relaxed ${!artistBioExpanded ? "line-clamp-4" : ""}`}>
                                {artistBioExpanded && enrichedDirectoryArtist.fullBio
                                  ? enrichedDirectoryArtist.fullBio
                                  : enrichedDirectoryArtist.bio}
                              </p>
                              {(enrichedDirectoryArtist.fullBio || (enrichedDirectoryArtist.bio && enrichedDirectoryArtist.bio.length > 150)) && (
                                <button
                                  onClick={() => setArtistBioExpanded(!artistBioExpanded)}
                                  className="mt-1 text-xs font-body text-primary hover:text-primary/80 transition-colors"
                                >
                                  {artistBioExpanded ? "Show Less" : "Read More"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </>
            )}


            {/* Options (Color, etc.) — hide single-value options like Color: BLACK; Size handled separately below */}
            {options
              .filter((option: any) => option.values.length > 1 && option.name.toLowerCase() !== "size")
              .map((option: any) => (
              <div key={option.name}>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-display uppercase tracking-[0.2em] text-muted-foreground">
                    {option.name}
                    {resolvedOptions[option.name] && (
                      <span className="text-foreground ml-2">{resolvedOptions[option.name]}</span>
                    )}
                  </span>
                </div>
                <div className="grid gap-1.5 grid-cols-4">
                  {option.values.map((value: string) => {
                    const isSelected = resolvedOptions[option.name] === value;
                    const isAvailable = product.variants.edges.some(
                      (v: any) =>
                        v.node.availableForSale &&
                        v.node.selectedOptions.some(
                          (so: any) => so.name === option.name && so.value === value
                        )
                    );
                    return (
                      <button
                        key={value}
                        onClick={() => setOption(option.name, value)}
                        disabled={!isAvailable}
                        className={`relative min-w-[44px] px-3 py-2.5 text-xs font-display uppercase tracking-wider rounded-sm border transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : isAvailable
                            ? "border-border text-foreground/80 hover:border-primary/50 hover:text-foreground"
                            : "border-border/30 text-muted-foreground/30 cursor-not-allowed line-through"
                        }`}
                      >
                        {value}
                        {isSelected && (
                          <motion.div
                            layoutId={`check-${option.name}`}
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center"
                          >
                            <Check className="w-2 h-2 text-primary-foreground" strokeWidth={3} />
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Size Selector — uses shared component for consistent two-row layout */}
            {(() => {
              const sizeOption = options.find((o: any) => o.name.toLowerCase() === "size" && o.values.length > 1);
              if (!sizeOption) return null;
              const availSizes = product.variants.edges
                .filter((v: any) => v.node.availableForSale)
                .map((v: any) => v.node.selectedOptions.find((so: any) => so.name === sizeOption.name)?.value)
                .filter(Boolean) as string[];
              return (
                <SizeSelector
                  sizes={sizeOption.values}
                  selected={resolvedOptions[sizeOption.name] || null}
                  onSelect={(size) => setOption(sizeOption.name, size)}
                  availableSizes={availSizes}
                  layoutIdPrefix="pdp-size"
                  sizeGuideSlot={detectedSizeChart ? (
                    <SizeChartModal chartType={detectedSizeChart}>
                      <button className="text-[10px] font-display uppercase tracking-[0.15em] text-primary hover:text-primary/80 transition-colors">
                        Size Guide
                      </button>
                    </SizeChartModal>
                  ) : undefined}
                />
              );
            })()}

            {/* Low Stock Urgency Badge */}
            {selectedVariant && selectedVariant.quantityAvailable != null && selectedVariant.quantityAvailable > 0 && selectedVariant.quantityAvailable < 10 && (
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 mb-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="text-xs font-body font-semibold">
                  Only {selectedVariant.quantityAvailable} left in stock
                </span>
              </div>
            )}

            {/* ─── Loop Selling Plan Selector (Subscriptions) ─── */}
            {(() => {
              const sellingPlanGroups = product?.sellingPlanGroups?.edges || [];
              if (sellingPlanGroups.length === 0) return null;

              const allPlans = sellingPlanGroups.flatMap((g: any) =>
                g.node.sellingPlans.edges.map((sp: any) => ({
                  ...sp.node,
                  groupName: g.node.name,
                }))
              );

              // Auto-select first plan if none selected
              if (!selectedSellingPlanId && allPlans.length > 0) {
                setTimeout(() => setSelectedSellingPlanId(allPlans[0].id), 0);
              }

              return (
                <div className="mb-4 space-y-2">
                  <label className="text-[10px] font-display uppercase tracking-[0.2em] text-muted-foreground">
                    Subscription Plan
                  </label>
                  <div className="space-y-1.5">
                    {allPlans.map((plan: any) => (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedSellingPlanId(plan.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-md border transition-all text-xs font-body ${
                          selectedSellingPlanId === plan.id
                            ? "border-primary bg-primary/[0.06] text-foreground"
                            : "border-border/30 bg-card/40 text-muted-foreground hover:border-border/60"
                        }`}
                      >
                        <span className="font-semibold">{plan.name}</span>
                        {plan.description && (
                          <span className="block text-[10px] text-muted-foreground mt-0.5">{plan.description}</span>
                        )}
                      </button>
                    ))}
                    <button
                      onClick={() => setSelectedSellingPlanId(null)}
                      className={`w-full text-left px-3 py-2.5 rounded-md border transition-all text-xs font-body ${
                        !selectedSellingPlanId
                          ? "border-primary bg-primary/[0.06] text-foreground"
                          : "border-border/30 bg-card/40 text-muted-foreground hover:border-border/60"
                      }`}
                    >
                      <span className="font-semibold">One-time purchase</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Add to Cart + Wishlist */}
            <div ref={addToCartRef} className="flex gap-2">
              <Button
                className="flex-1 h-14 text-base font-display uppercase tracking-[0.15em] rounded-sm shadow-lg shadow-primary/20 hover:shadow-primary/30"
                size="lg"
                onClick={handleAddToCart}
                disabled={
                  isCartLoading ||
                  !selectedVariant ||
                  (selectedVariant && !selectedVariant.availableForSale)
                }
              >
                {isCartLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : selectedVariant && !selectedVariant.availableForSale ? (
                  "Sold Out"
                ) : selectedSellingPlanId ? (
                  <>
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Subscribe
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>

              {product && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 flex-shrink-0 rounded-sm border-border/50"
                  onClick={() => {
                    const mainImage = product.images?.edges?.[0]?.node?.url;
                    toggleItem({
                      productHandle: handle || '',
                      productTitle: product.title,
                      productImage: mainImage,
                      productPrice: product.priceRange?.minVariantPrice?.amount,
                      currencyCode: product.priceRange?.minVariantPrice?.currencyCode,
                    });
                  }}
                  aria-label={isInWishlist(handle || '') ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart
                    className={`w-5 h-5 transition-colors ${
                      isInWishlist(handle || '') ? 'fill-primary text-primary' : ''
                    }`}
                  />
                </Button>
              )}
            </div>

            {/* Back in Stock — shown when selected variant is sold out */}
            {selectedVariant && !selectedVariant.availableForSale && handle && product && (
              <BackInStockForm
                variantId={selectedVariant.id}
                productHandle={handle}
                productTitle={product.title}
                variantTitle={selectedVariant.title}
              />
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: "Free Shipping $99+" },
                { icon: Shield, label: "Secure Checkout" },
                { icon: RotateCcw, label: "Easy Returns" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-sm bg-secondary/40 border border-border/20"
                >
                  <Icon className="w-4 h-4 text-primary/70" />
                  <span className="text-[9px] font-display uppercase tracking-wider text-muted-foreground text-center leading-tight">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Tee Tier — inline visual comparison for tees */}
            {isTee && (
              <div className="mt-3">
                <TeeTierSwitcher currentTier={is1TonTee ? "1ton" : isPremiumTee ? "premium" : "standard"} />
              </div>
            )}

            {/* ─── Info Accordions ─── */}
            <div className="border-t border-border/30 mt-4">

              {/* Product Description */}
              {product.description && (
                <InfoAccordion
                  label="Product Description"
                  defaultOpen
                >
                  <div
                    className="text-sm font-body text-muted-foreground leading-relaxed prose prose-invert prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1"
                    dangerouslySetInnerHTML={{
                      __html: product.descriptionHtml || product.description || "",
                    }}
                  />
                </InfoAccordion>
              )}

              {/* Fabric & Fit */}
              <InfoAccordion label="Fabric & Fit">
                <FabricFitInfo product={product} isTee={!!isTee} isPremiumTee={!!isPremiumTee} is1TonTee={!!is1TonTee} />
              </InfoAccordion>

              {/* Shipping & Returns */}
              <InfoAccordion label="Shipping & Returns">
                <ul className="space-y-2 text-sm font-body text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Truck className="w-3.5 h-3.5 mt-0.5 text-primary/60 flex-shrink-0" />
                    <span>Free shipping on orders over $99. Orders ship within 1–3 business days.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <RotateCcw className="w-3.5 h-3.5 mt-0.5 text-primary/60 flex-shrink-0" />
                    <span>30-day hassle-free returns. Exchanges available.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="w-3.5 h-3.5 mt-0.5 text-primary/60 flex-shrink-0" />
                    <span>Secure checkout. All transactions encrypted.</span>
                  </li>
                </ul>
              </InfoAccordion>
            </div>

            {/* Related Products — same design name */}
            {product && handle && (
              <RelatedProducts
                currentHandle={handle}
                productTitle={product.title}
                artistName={enrichedDirectoryArtist?.name}
                artistInstagram={enrichedDirectoryArtist?.instagram}
                isArtistSeries={!!isArtistSeries}
              />
            )}
          </motion.div>
        </div>
      </div>

      {/* Artist Series sections */}
      {(artistData || enrichedDirectoryArtist) && (
        <>
          <div className="max-w-6xl mx-auto"><div className="h-px bg-border" /></div>

          {/* Artist Story — prefer full artistData, fall back to enriched directoryArtist */}
          <ArtistStorySection artist={artistData || enrichedDirectoryArtist!} />

          <div className="max-w-6xl mx-auto"><div className="h-px bg-border" /></div>

          {/* Artist Interview (only available from full artistData) */}
          {artistData?.interview && artistData.interview.length > 0 && (
            <ArtistInterviewSection artistName={artistData.artistName} interview={artistData.interview} />
          )}
        </>
      )}

      {/* Enhanced content for 5 Random Premium Tees */}
      {handle === "5-random-premium-tees" && <RandomTeesPDPEnhancement />}

      {/* Product Reviews — after enhanced content */}
      {product && handle && <ProductReviews productHandle={handle} productTitle={product.title} reviewGroup={reviewGroup} />}

      {/* Recently Viewed */}
      <RecentlyViewed excludeHandle={handle} />

      {/* Sticky Add to Cart */}
      {product && (
        <StickyAddToCart
          productName={product.title}
          price={new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price)}
          onAddToCart={handleAddToCart}
          isLoading={isCartLoading}
          isSoldOut={!!selectedVariant && !selectedVariant.availableForSale}
          hasSelection={!!selectedVariant}
          triggerRef={addToCartRef}
          sizes={(() => {
            const sizeOption = options.find((o: any) => o.name.toLowerCase() === "size" && o.values.length > 1);
            if (!sizeOption) return undefined;
            return sizeOption.values.map((value: string) => ({
              value,
              available: product.variants.edges.some(
                (v: any) => v.node.availableForSale && v.node.selectedOptions.some((so: any) => so.name === sizeOption.name && so.value === value)
              ),
            }));
          })()}
          selectedSize={resolvedOptions[options.find((o: any) => o.name.toLowerCase() === "size")?.name || ""] || null}
          onSizeSelect={(size) => {
            const sizeOption = options.find((o: any) => o.name.toLowerCase() === "size");
            if (sizeOption) setOption(sizeOption.name, size);
          }}
        />
      )}

      <SiteFooter />
      </div>
    </div>
  );
}

/* ─── Reusable Info Accordion ─── */
function InfoAccordion({ label, defaultOpen = false, children }: { label: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-border/30">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3.5 text-xs font-display uppercase tracking-[0.18em] text-foreground/80 hover:text-foreground transition-colors"
      >
        {label}
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Fabric & Fit — parses from description + metafields with tee-tier fallbacks ─── */
function FabricFitInfo({ product, isTee, isPremiumTee, is1TonTee }: { product: any; isTee: boolean; isPremiumTee: boolean; is1TonTee: boolean }) {
  const desc = (product.description || "").toLowerCase();

  // Parse structured info from description text
  function extract(patterns: RegExp[]): string | null {
    for (const p of patterns) {
      const m = desc.match(p);
      if (m) return m[1]?.trim() || m[0]?.trim();
    }
    return null;
  }

  // Extract from description — tighter patterns to avoid grabbing unrelated text
  const parsedMaterial = extract([/(\d+%\s*(?:soft\s+)?(?:cotton|polyester|ring-?spun|tri-?blend|rayon)[^,\n]*?\d*\s*(?:oz|g\/m2)?(?:\s+(?:body|blank|jersey|fleece|fabric))?)/i]);
  const parsedWeight = extract([/(\d+(?:\.\d+)?\s*oz(?:\/yd[²2]?)?)\s*(?:body|blank|fabric)?/i, /(\d+(?:\.\d+)?g(?:\/m[²2])?)\s*(?:body|blank|fabric|cotton)?/i]);
  const parsedFit = extract([/(premium fit|standard fit|classic fit|relaxed fit|boxy fit|oversized fit|custom fit|tailored fit)/i]);
  const parsedCollar = extract([/(set-in rib collar|drop shoulder|crew neck|v-neck)[^\n.]*/i]);
  const parsedHem = extract([/(double-needle[^\n.]*hem)/i]);
  const parsedCare = extract([/(machine wash(?:able)?(?:\s*,?\s*(?:cold|warm))?)/i]);
  const parsedTagless = desc.includes("tagless");
  const parsedPreshrunk = desc.includes("preshrunk");

  // Metafield overrides
  const mMaterial = product.metafield_material?.value || product.metafield_descriptors_material?.value || product.metafield_fabric?.value || product.metafield_descriptors?.value;
  const mFit = product.metafield_fit?.value || product.metafield_descriptors_fit?.value;
  const mWeight = product.metafield_weight?.value;
  const mCare = product.metafield_care?.value || product.metafield_descriptors_care?.value;
  const mCollar = product.metafield_collar?.value;
  const mHem = product.metafield_hem?.value;

  // Priority: metafield → parsed from description → tee-tier fallback
  const specs: { label: string; value: string }[] = [];

  const material = mMaterial || parsedMaterial || (isTee ? "100% Cotton Jersey" : null);
  if (material) specs.push({ label: "Material", value: capitalize(material) });

  const weight = mWeight || parsedWeight || (is1TonTee ? "7.2 oz/yd² (Heavyweight)" : isPremiumTee ? "185g/m² (~5.5 oz/yd²)" : isTee ? "6 oz/yd² (Mid-weight)" : null);
  if (weight) specs.push({ label: "Weight", value: capitalize(weight) });

  const fit = mFit || parsedFit || (is1TonTee ? "Boxy / Oversized" : isPremiumTee ? "Premium / Tailored" : isTee ? "Classic / Relaxed" : "True to size");
  specs.push({ label: "Fit", value: capitalize(fit) });

  const collar = mCollar || parsedCollar || (isTee ? (is1TonTee ? "Drop Shoulder" : "Set-in rib collar with shoulder-to-shoulder taping") : null);
  if (collar) specs.push({ label: "Collar", value: capitalize(collar) });

  const hem = mHem || parsedHem || (isTee ? "Double-needle sleeve and bottom hem" : null);
  if (hem) specs.push({ label: "Hem", value: capitalize(hem) });

  const extras: string[] = [];
  if (parsedTagless) extras.push("Tagless for comfort");
  if (parsedPreshrunk) extras.push("Preshrunk to minimize shrinkage");
  if (extras.length > 0) specs.push({ label: "Details", value: extras.join(" · ") });

  const care = mCare || parsedCare || "Machine wash cold, tumble dry low";
  specs.push({ label: "Care", value: capitalize(care) });

  return (
    <ul className="space-y-2 text-sm font-body text-muted-foreground">
      {specs.map((s) => (
        <li key={s.label} className="flex justify-between gap-4">
          <span className="text-foreground/60 flex-shrink-0">{s.label}</span>
          <span className="text-foreground text-right">{s.value}</span>
        </li>
      ))}
    </ul>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
