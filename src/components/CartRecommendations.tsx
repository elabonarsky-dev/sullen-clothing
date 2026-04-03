import { useState, useEffect, useMemo } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore, type ShopifyProduct, type CartItem } from "@/stores/cartStore";
import { storefrontApiRequest } from "@/lib/shopify";
import { Skeleton } from "@/components/ui/skeleton";

const RECOMMENDATIONS_QUERY = `
  query GetProductRecommendations($productId: ID!) {
    productRecommendations(productId: $productId) {
      id
      title
      handle
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
      options {
        name
        values
      }
    }
  }
`;

interface CartRecommendationsProps {
  cartItems: CartItem[];
}

export const CartRecommendations = ({ cartItems }: CartRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const { addItem } = useCartStore();

  const cartHandles = useMemo(() => new Set(cartItems.map(i => i.product.node.handle)), [cartItems]);

  // Pick a seed product from cart (most recently added)
  const seedProductId = useMemo(() => {
    if (cartItems.length === 0) return null;
    return cartItems[cartItems.length - 1].product.node.id;
  }, [cartItems]);

  useEffect(() => {
    if (!seedProductId) return;

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const data = await storefrontApiRequest(RECOMMENDATIONS_QUERY, { productId: seedProductId });
        if (cancelled || !data?.data?.productRecommendations) return;

        const recs: ShopifyProduct[] = data.data.productRecommendations
          .filter((p: any) => !cartHandles.has(p.handle) && p.variants?.edges?.[0]?.node?.availableForSale)
          .slice(0, 3)
          .map((p: any) => ({ node: p }));

        setRecommendations(recs);
      } catch (e) {
        console.error("Failed to fetch recommendations:", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [seedProductId, cartHandles]);

  const handleQuickAdd = async (product: ShopifyProduct) => {
    const variant = product.node.variants.edges[0]?.node;
    if (!variant) return;

    setAddingId(variant.id);
    try {
      await addItem({
        variantId: variant.id,
        variantTitle: variant.title,
        quantity: 1,
        price: variant.price,
        product,
        selectedOptions: variant.selectedOptions,
      });
    } finally {
      setAddingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2 pt-3">
        <p className="text-[11px] font-display uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> You might also like
        </p>
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1 rounded-md overflow-hidden border border-border">
              <Skeleton className="w-full aspect-square" />
              <div className="p-1.5 space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-2 pt-3">
      <p className="text-[11px] font-display uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Sparkles className="w-3 h-3" /> You might also like
      </p>
      <div className="flex gap-2">
        {recommendations.map((product) => {
          const img = product.node.images?.edges?.[0]?.node;
          const price = product.node.priceRange.minVariantPrice;
          const variant = product.node.variants.edges[0]?.node;
          const isAdding = addingId === variant?.id;

          return (
            <div
              key={product.node.id}
              className="flex-1 rounded-md overflow-hidden border border-border bg-secondary/30 group"
            >
              <div className="aspect-square overflow-hidden relative">
                {img && (
                  <img
                    src={img.url}
                    alt={img.altText || product.node.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                )}
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => handleQuickAdd(product)}
                  disabled={isAdding}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <div className="p-1.5">
                <p className="text-[10px] font-display uppercase tracking-wide leading-tight line-clamp-2 text-foreground">
                  {product.node.title}
                </p>
                <p className="text-[10px] font-display text-muted-foreground mt-0.5">
                  ${parseFloat(price.amount).toFixed(2)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
