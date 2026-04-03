import { useEffect, useState } from 'react';
import { storefrontApiRequest } from '@/lib/shopify';
import type { WishlistItem } from '@/stores/wishlistStore';

export interface EnrichedWishlistItem extends WishlistItem {
  currentPrice?: string;
  compareAtPrice?: string;
  availableForSale?: boolean;
  totalInventory?: number;
  priceDrop?: boolean;
  priceDropAmount?: string;
  backInStock?: boolean;
  lowStock?: boolean;
  daysOnWishlist: number;
}

const WISHLIST_PRODUCTS_QUERY = `
  query GetWishlistProducts($handles: [String!]!) {
    nodes: products(first: 50, query: "") {
      edges { node { id } }
    }
  }
`;

// We need to fetch by handle individually since Storefront API
// doesn't support batch handle lookups efficiently
const PRODUCT_LITE_QUERY = `
  query GetProductLite($handle: String!) {
    product(handle: $handle) {
      handle
      availableForSale
      totalInventory
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      compareAtPriceRange {
        maxVariantPrice {
          amount
          currencyCode
        }
      }
    }
  }
`;

interface ShopifyLiteProduct {
  handle: string;
  availableForSale: boolean;
  totalInventory: number | null;
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string };
  };
  compareAtPriceRange: {
    maxVariantPrice: { amount: string; currencyCode: string };
  };
}

export function useWishlistEnrichment(items: WishlistItem[]): {
  enrichedItems: EnrichedWishlistItem[];
  isLoading: boolean;
} {
  const [enrichedItems, setEnrichedItems] = useState<EnrichedWishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      setEnrichedItems([]);
      return;
    }

    let cancelled = false;

    async function fetchLiveData() {
      setIsLoading(true);
      const now = new Date();

      // Fetch all products in parallel (max 50)
      const handles = items.slice(0, 50).map(i => i.productHandle);
      const results = await Promise.allSettled(
        handles.map(handle =>
          storefrontApiRequest(PRODUCT_LITE_QUERY, { handle })
            .then(d => d?.data?.product as ShopifyLiteProduct | null)
        )
      );

      if (cancelled) return;

      const productMap = new Map<string, ShopifyLiteProduct>();
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value) {
          productMap.set(handles[i], r.value);
        }
      });

      const enriched: EnrichedWishlistItem[] = items.map(item => {
        const live = productMap.get(item.productHandle);
        const addedAt = new Date(item.addedAt);
        const daysOnWishlist = Math.floor((now.getTime() - addedAt.getTime()) / (1000 * 60 * 60 * 24));

        if (!live) {
          return { ...item, daysOnWishlist };
        }

        const currentPrice = live.priceRange.minVariantPrice.amount;
        const compareAt = live.compareAtPriceRange?.maxVariantPrice?.amount;
        const savedPrice = item.productPrice ? parseFloat(item.productPrice) : null;
        const livePrice = parseFloat(currentPrice);

        // Price drop: current price is lower than what was saved
        const priceDrop = savedPrice !== null && livePrice < savedPrice;
        const priceDropAmount = priceDrop ? (savedPrice! - livePrice).toFixed(2) : undefined;

        // Back in stock: was unavailable (price was saved but product wasn't buyable) → now available
        // We approximate: if totalInventory > 0 and availableForSale, it's in stock
        const availableForSale = live.availableForSale;
        const totalInventory = live.totalInventory ?? 0;

        // Low stock threshold
        const lowStock = availableForSale && totalInventory > 0 && totalInventory <= 5;

        return {
          ...item,
          currentPrice,
          compareAtPrice: compareAt && parseFloat(compareAt) > livePrice ? compareAt : undefined,
          availableForSale,
          totalInventory,
          priceDrop,
          priceDropAmount,
          backInStock: false, // We can't determine this without historical data
          lowStock,
          daysOnWishlist,
        };
      });

      setEnrichedItems(enriched);
      setIsLoading(false);
    }

    fetchLiveData();

    return () => { cancelled = true; };
  }, [items]);

  return { enrichedItems, isLoading };
}
