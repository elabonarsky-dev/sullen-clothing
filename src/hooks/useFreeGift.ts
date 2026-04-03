import { useEffect, useRef, useState, useCallback } from "react";
import { useCartStore } from "@/stores/cartStore";
import { storefrontApiRequest } from "@/lib/shopify";
import type { ShopifyProduct } from "@/lib/shopify";

const FREE_GIFT_VARIANT_ID = "gid://shopify/ProductVariant/44079193751651";
const FREE_GIFT_THRESHOLD = 99;
const GIFT_OPT_OUT_KEY = "sullen-gift-opt-out";

const GIFT_PRODUCT_QUERY = `
  query GetVariant($id: ID!) {
    node(id: $id) {
      ... on ProductVariant {
        id
        title
        price { amount currencyCode }
        availableForSale
        selectedOptions { name value }
        product {
          id
          title
          description
          handle
          priceRange { minVariantPrice { amount currencyCode } }
          images(first: 1) { edges { node { url altText } } }
          variants(first: 1) {
            edges {
              node {
                id
                title
                price { amount currencyCode }
                availableForSale
                selectedOptions { name value }
              }
            }
          }
          options { name values }
        }
      }
    }
  }
`;

let cachedGiftProduct: ShopifyProduct | null = null;

async function fetchGiftProduct(): Promise<ShopifyProduct | null> {
  if (cachedGiftProduct) return cachedGiftProduct;
  try {
    const data = await storefrontApiRequest(GIFT_PRODUCT_QUERY, { id: FREE_GIFT_VARIANT_ID });
    const variant = data?.data?.node;
    if (!variant?.product) return null;
    cachedGiftProduct = {
      node: {
        ...variant.product,
        variants: {
          edges: [{ node: { id: variant.id, title: variant.title, price: variant.price, availableForSale: variant.availableForSale, selectedOptions: variant.selectedOptions } }],
        },
      },
    };
    return cachedGiftProduct;
  } catch (e) {
    console.error("[FreeGift] Failed to fetch gift product:", e);
    return null;
  }
}

/**
 * Auto-adds a free gift item when cart total (excluding the gift itself) >= $99.
 * Auto-removes the gift when cart drops below threshold or user opts out.
 * Returns { giftWanted, setGiftWanted, eligible } for UI toggle.
 */
export function useFreeGift() {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const busyRef = useRef(false);

  const [giftWanted, setGiftWantedState] = useState(() => {
    try { return localStorage.getItem(GIFT_OPT_OUT_KEY) !== "true"; }
    catch { return true; }
  });

  const setGiftWanted = useCallback((wanted: boolean) => {
    setGiftWantedState(wanted);
    try { wanted ? localStorage.removeItem(GIFT_OPT_OUT_KEY) : localStorage.setItem(GIFT_OPT_OUT_KEY, "true"); }
    catch { /* noop */ }
  }, []);

  const giftInCart = items.find((i) => i.variantId === FREE_GIFT_VARIANT_ID);
  const cartTotalWithoutGift = items
    .filter((i) => i.variantId !== FREE_GIFT_VARIANT_ID)
    .reduce((sum, i) => sum + parseFloat(i.price.amount) * i.quantity, 0);
  const eligible = cartTotalWithoutGift >= FREE_GIFT_THRESHOLD && items.filter(i => i.variantId !== FREE_GIFT_VARIANT_ID).length > 0;

  useEffect(() => {
    if (isLoading || busyRef.current) return;

    const shouldHaveGift = eligible && giftWanted;

    if (shouldHaveGift && !giftInCart) {
      busyRef.current = true;
      fetchGiftProduct().then((product) => {
        if (!product) {
          busyRef.current = false;
          return;
        }
        const variant = product.node.variants.edges[0]?.node;
        if (!variant) {
          busyRef.current = false;
          return;
        }
        addItem({
          product,
          variantId: FREE_GIFT_VARIANT_ID,
          variantTitle: variant.title,
          price: { amount: "0.00", currencyCode: variant.price.currencyCode },
          quantity: 1,
          selectedOptions: variant.selectedOptions || [],
          bundleTag: "free-gift",
        }).finally(() => {
          busyRef.current = false;
        });
      });
    } else if (!shouldHaveGift && giftInCart) {
      busyRef.current = true;
      removeItem(FREE_GIFT_VARIANT_ID).finally(() => {
        busyRef.current = false;
      });
    }
  }, [items, isLoading, addItem, removeItem, giftWanted, eligible]);

  return { giftWanted, setGiftWanted, eligible };
}

export { FREE_GIFT_VARIANT_ID };
