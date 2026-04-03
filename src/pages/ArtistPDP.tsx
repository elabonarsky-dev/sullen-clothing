import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StickyAddToCart } from "@/components/StickyAddToCart";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { BackInStockForm } from "@/components/BackInStockForm";
import { ArrowLeft, Loader2, ShoppingBag, AlertTriangle } from "lucide-react";
import { getArtistBySlug } from "@/data/artists";
import { ArtistSeriesBadge } from "@/components/ArtistSeriesBadge";
import { ImageGallery } from "@/components/ImageGallery";
import { ProductReviews } from "@/components/ProductReviews";
import { getReviewGroup } from "@/hooks/useNativeReviews";
import { SizeSelector } from "@/components/SizeSelector";
import { ArtistStorySection } from "@/components/ArtistStorySection";
import { ArtistInterviewSection } from "@/components/ArtistInterviewSection";
import { TeeTierSwitcher } from "@/components/TeeTierSwitcher";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";
import { storefrontApiRequest, PRODUCT_BY_HANDLE_QUERY, type ShopifyProduct } from "@/lib/shopify";
import { toast } from "sonner";

export default function ArtistPDP() {
  const { slug } = useParams<{ slug: string }>();
  const artist = getArtistBySlug(slug || "");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [shopifyProduct, setShopifyProduct] = useState<ShopifyProduct['node'] | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const addToCartRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore(state => state.addItem);
  const isCartLoading = useCartStore(state => state.isLoading);
  const { trackView } = useRecentlyViewed();

  // Scroll to top on artist change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Fetch real Shopify product data for cart integration
  useEffect(() => {
    async function fetchShopifyProduct() {
      if (!artist?.shopifyHandle) { setLoadingProduct(false); return; }
      try {
        const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle: artist.shopifyHandle });
        if (data?.data?.product) {
          setShopifyProduct(data.data.product);
        }
      } catch (error) {
        console.error('Failed to fetch Shopify product:', error);
      } finally {
        setLoadingProduct(false);
      }
    }
    fetchShopifyProduct();
  }, [artist?.shopifyHandle]);

  // Track recently viewed
  useEffect(() => {
    if (shopifyProduct && artist) {
      trackView({
        handle: artist.shopifyHandle || slug || "",
        title: artist.productName,
        image: artist.productImages[0] || "",
        price: shopifyProduct.priceRange?.minVariantPrice?.amount || String(artist.price),
        currencyCode: shopifyProduct.priceRange?.minVariantPrice?.currencyCode || "USD",
      });
    }
  }, [shopifyProduct, artist, slug, trackView]);

  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-display font-bold uppercase text-foreground">Artist Not Found</h1>
          <Link to="/" className="text-primary hover:underline font-body">← Back to all artists</Link>
        </div>
      </div>
    );
  }

  // Find the matching Shopify variant based on selected size
  const selectedVariant = shopifyProduct?.variants.edges.find(v =>
    v.node.selectedOptions.some(so => so.name === "Size" && so.value === selectedSize)
  )?.node;

  // Get available sizes from Shopify
  const availableSizes = shopifyProduct?.variants.edges
    .filter(v => v.node.availableForSale)
    .map(v => v.node.selectedOptions.find(so => so.name === "Size")?.value)
    .filter(Boolean) as string[] | undefined;

  const handleAddToCart = async () => {
    if (!shopifyProduct || !selectedVariant || !selectedSize) {
      if (!selectedSize) toast.error("Please select a size", { position: "top-center" });
      return;
    }
    const product: ShopifyProduct = { node: shopifyProduct };
    await addItem({
      product,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions || [],
    });
    toast.success("Added to cart", { description: `${artist.productName} — ${selectedSize}`, position: "top-center" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Product Section */}
      <section className="pt-0 pb-10 md:pt-20 md:pb-20">
        <div className="container max-w-6xl px-0 md:px-4">
          <div className="grid md:grid-cols-2 gap-0 md:gap-14">
            {/* Gallery */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="relative">
              <ArtistSeriesBadge />
              <ImageGallery images={artist.productImages} productName={artist.productName} />
            </motion.div>

            {/* Product Info */}
            <motion.div className="space-y-6 px-4 md:px-0 mt-[5px] lg:mt-0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>


              <div>
                <h2 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-tight text-foreground">
                  {artist.productName}
                </h2>
                <p className="mt-1 text-xl font-body font-medium text-foreground">
                  ${selectedVariant ? parseFloat(selectedVariant.price.amount).toFixed(2) : artist.price.toFixed(2)}
                </p>
              </div>

              <p className="text-sm font-body leading-relaxed text-muted-foreground">
                {artist.description}
              </p>

              {/* Size Selector */}
              <SizeSelector
                sizes={artist.sizes}
                selected={selectedSize}
                onSelect={setSelectedSize}
                availableSizes={availableSizes}
              />

              {/* Low Stock Urgency Badge */}
              {selectedVariant && selectedVariant.quantityAvailable != null && selectedVariant.quantityAvailable > 0 && selectedVariant.quantityAvailable < 10 && (
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="text-xs font-body font-semibold">
                    Only {selectedVariant.quantityAvailable} left in stock
                  </span>
                </div>
              )}

              {/* Add to Cart */}
              <div ref={addToCartRef}>
              <Button
                className="w-full h-12 text-sm font-body font-semibold tracking-wide rounded-lg"
                size="lg"
                onClick={handleAddToCart}
                disabled={isCartLoading || loadingProduct || (selectedVariant && !selectedVariant.availableForSale)}
              >
                {isCartLoading || loadingProduct ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : selectedVariant && !selectedVariant.availableForSale ? (
                  "Sold Out"
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
              </div>

              {/* Back in Stock — shown when selected variant is sold out */}
              {selectedVariant && !selectedVariant.availableForSale && artist.shopifyHandle && (
                <BackInStockForm
                  variantId={selectedVariant.id}
                  productHandle={artist.shopifyHandle}
                  productTitle={artist.productName}
                  variantTitle={selectedVariant.title}
                />
              )}

              {/* Features */}
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer py-3 border-t border-border text-xs font-body font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                  Product Details
                  <span className="text-muted-foreground group-open:rotate-45 transition-transform duration-200 text-lg leading-none">+</span>
                </summary>
                <ul className="pb-4 space-y-2">
                  {artist.features.map((feat) => (
                    <li key={feat} className="text-xs font-body text-muted-foreground flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary/60" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </details>

              {/* Tee Tier Comparison */}
              <TeeTierSwitcher />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="container max-w-6xl"><div className="h-px bg-border" /></div>

      {/* Artist Story */}
      <ArtistStorySection artist={artist} />

      {/* Divider */}
      <div className="container max-w-6xl"><div className="h-px bg-border" /></div>

      {/* Artist Interview */}
      {artist.interview && artist.interview.length > 0 && (
        <ArtistInterviewSection artistName={artist.artistName} interview={artist.interview} />
      )}

      {/* Product Reviews */}
      {(artist.shopifyHandle || slug) && (
        <ProductReviews
          productHandle={artist.shopifyHandle || slug}
          productTitle={shopifyProduct?.title || artist.artistName}
          reviewGroup={getReviewGroup((shopifyProduct as any)?.collections?.edges?.map((e: any) => e.node.handle) ?? [])}
        />
      )}

      {/* Recently Viewed */}
      <RecentlyViewed excludeHandle={artist.shopifyHandle || slug} />

      {/* Sticky Add to Cart */}
      <StickyAddToCart
        productName={artist.productName}
        price={`$${selectedVariant ? parseFloat(selectedVariant.price.amount).toFixed(2) : artist.price.toFixed(2)}`}
        onAddToCart={handleAddToCart}
        isLoading={isCartLoading || loadingProduct}
        isSoldOut={!!selectedVariant && !selectedVariant.availableForSale}
        hasSelection={!!selectedSize}
        triggerRef={addToCartRef}
        sizes={artist.sizes.map((s: string) => ({
          value: s,
          available: !availableSizes || availableSizes.includes(s),
        }))}
        selectedSize={selectedSize}
        onSizeSelect={setSelectedSize}
      />

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
