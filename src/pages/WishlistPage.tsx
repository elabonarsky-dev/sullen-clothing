import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Trash2, ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SEO } from "@/components/SEO";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useWishlistEnrichment } from "@/hooks/useWishlistEnrichment";
import { WishlistBadges } from "@/components/WishlistBadges";
import { Skeleton } from "@/components/ui/skeleton";

export default function WishlistPage() {
  const { items, removeItem, syncWithCloud } = useWishlistStore();
  const { user } = useAuth();
  const { enrichedItems, isLoading } = useWishlistEnrichment(items);

  useEffect(() => {
    if (user) {
      syncWithCloud(user.id);
    }
  }, [user, syncWithCloud]);

  // Use enriched items when available, fallback to raw items
  const displayItems = enrichedItems.length > 0 ? enrichedItems : items;

  return (
    <>
      <SEO title="Wishlist" robots="noindex, nofollow" />
      <SiteHeader />

      <main className="min-h-screen bg-background pt-4 pb-20">
        <div className="max-w-5xl mx-auto px-4 lg:px-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-display text-2xl lg:text-3xl uppercase tracking-wider text-foreground">
                Wishlist
              </h1>
              <p className="text-sm font-body text-muted-foreground mt-0.5">
                {items.length} saved item{items.length !== 1 ? 's' : ''}
                {!user && <span className="text-primary"> · Sign in to save across devices</span>}
              </p>
            </div>
          </div>

          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <Heart className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h2 className="font-display text-lg uppercase tracking-wider text-muted-foreground mb-2">
                Your wishlist is empty
              </h2>
              <p className="text-sm font-body text-muted-foreground mb-6 max-w-sm">
                Browse our collections and tap the heart icon to save items you love.
              </p>
              <Button asChild variant="default" className="font-display uppercase tracking-wider">
                <Link to="/collections/new-releases">Browse New Releases</Link>
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayItems.map((item, i) => {
                const isEnriched = 'daysOnWishlist' in item;
                const enriched = isEnriched ? (item as unknown as import('@/hooks/useWishlistEnrichment').EnrichedWishlistItem) : null;
                const currentPrice = enriched?.currentPrice;
                const savedPrice = item.productPrice;
                const showNewPrice = enriched?.priceDrop && currentPrice;

                return (
                  <motion.div
                    key={item.productHandle}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative"
                  >
                    <Link to={`/product/${item.productHandle}`} className="block">
                      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productTitle}
                            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${enriched?.availableForSale === false ? 'opacity-50 grayscale' : ''}`}
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Heart className="w-8 h-8 text-muted-foreground/30" />
                          </div>
                        )}

                        {/* Loading skeleton overlay */}
                        {isLoading && enrichedItems.length === 0 && (
                          <div className="absolute bottom-2 left-2 right-2">
                            <Skeleton className="h-4 w-16 rounded-full" />
                          </div>
                        )}
                      </div>

                      <div className="mt-2.5 space-y-0.5">
                        <h3 className="font-display text-xs uppercase tracking-wider text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {item.productTitle}
                        </h3>

                        {/* Price display */}
                        <div className="flex items-center gap-1.5">
                          {showNewPrice ? (
                            <>
                              <p className="text-sm font-body text-primary font-semibold">
                                {new Intl.NumberFormat("en-US", {
                                  style: "currency",
                                  currency: item.currencyCode || "USD",
                                }).format(parseFloat(currentPrice!))}
                              </p>
                              <p className="text-xs font-body text-muted-foreground line-through">
                                {new Intl.NumberFormat("en-US", {
                                  style: "currency",
                                  currency: item.currencyCode || "USD",
                                }).format(parseFloat(savedPrice!))}
                              </p>
                            </>
                          ) : savedPrice ? (
                            <p className="text-sm font-body text-muted-foreground">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: item.currencyCode || "USD",
                              }).format(parseFloat(savedPrice))}
                            </p>
                          ) : null}
                        </div>

                        {/* Enrichment badges */}
                        {enriched && <WishlistBadges item={enriched} />}
                      </div>
                    </Link>

                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        removeItem(item.productHandle);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-background transition-all opacity-0 group-hover:opacity-100"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
