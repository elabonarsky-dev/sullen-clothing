import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  type CartItem,
  type ShopifyProduct,
  createShopifyCart,
  createShopifyCartFromItems,
  addLineToShopifyCart,
  updateShopifyCartLine,
  removeLineFromShopifyCart,
  storefrontApiRequest,
  CART_QUERY,
  applyDiscountsToCart,
} from '@/lib/shopify';
import { supabase } from '@/integrations/supabase/client';
import { trackAddToCart } from '@/lib/shopifyAnalytics';
import { ga4AddToCart, ga4BeginCheckout, ga4Purchase } from '@/lib/ga4';
import { metaAddToCart, metaInitiateCheckout, metaPurchase, generateEventId } from '@/lib/metaPixel';
import { capiAddToCart, capiInitiateCheckout, capiPurchase } from '@/lib/metaCapi';

export type { CartItem, ShopifyProduct };

interface CartStore {
  items: CartItem[];
  cartId: string | null;
  checkoutUrl: string | null;
  promoCode: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  isConsolidating: boolean;
  addItem: (item: Omit<CartItem, 'lineId'>) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  setPromoCode: (code: string | null) => void;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  getCheckoutUrl: () => string | null;
  consolidateAndCheckout: () => Promise<string | null>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartId: null,
      checkoutUrl: null,
      promoCode: null,
      isLoading: false,
      isSyncing: false,
      isConsolidating: false,

      addItem: async (item) => {
        const { items, cartId, clearCart } = get();
        const existingItem = items.find(i => i.variantId === item.variantId);
        set({ isLoading: true });
        trackAddToCart({
          variantId: item.variantId,
          productTitle: item.product?.node?.title || item.variantTitle,
          price: item.price.amount,
          currencyCode: item.price.currencyCode,
          quantity: item.quantity,
        });
        ga4AddToCart({
          variantId: item.variantId,
          productTitle: item.product?.node?.title || item.variantTitle,
          price: item.price.amount,
          currencyCode: item.price.currencyCode,
          quantity: item.quantity,
        });
        const metaItem = {
          variantId: item.variantId,
          productTitle: item.product?.node?.title || item.variantTitle,
          price: item.price.amount,
          currencyCode: item.price.currencyCode,
          quantity: item.quantity,
        };
        const atcEventId = metaAddToCart(metaItem);
        capiAddToCart(atcEventId, metaItem);
        set({ isLoading: true });
        try {
          if (!cartId) {
            const result = await createShopifyCart({ ...item, lineId: null });
            if (result) {
              set({ cartId: result.cartId, checkoutUrl: result.checkoutUrl, items: [{ ...item, lineId: result.lineId }] });
            }
          } else if (existingItem) {
            const newQuantity = existingItem.quantity + item.quantity;
            if (!existingItem.lineId) return;
            const result = await updateShopifyCartLine(cartId, existingItem.lineId, newQuantity);
            if (result.success) {
              set({ items: get().items.map(i => i.variantId === item.variantId ? { ...i, quantity: newQuantity, bundleTag: item.bundleTag || i.bundleTag } : i) });
            } else if (result.cartNotFound) clearCart();
          } else {
            const result = await addLineToShopifyCart(cartId, { ...item, lineId: null });
            if (result.success) {
              set({ items: [...get().items, { ...item, lineId: result.lineId ?? null }] });
            } else if (result.cartNotFound) clearCart();
          }
        } catch (error) {
          console.error('Failed to add item:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      updateQuantity: async (variantId, quantity) => {
        if (quantity <= 0) { await get().removeItem(variantId); return; }
        const { items, cartId, clearCart } = get();
        const item = items.find(i => i.variantId === variantId);
        if (!item?.lineId || !cartId) return;
        set({ isLoading: true });
        try {
          const result = await updateShopifyCartLine(cartId, item.lineId, quantity);
          if (result.success) {
            set({ items: get().items.map(i => i.variantId === variantId ? { ...i, quantity } : i) });
          } else if (result.cartNotFound) clearCart();
        } catch (error) {
          console.error('Failed to update quantity:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (variantId) => {
        const { items, cartId, clearCart } = get();
        const item = items.find(i => i.variantId === variantId);
        if (!item?.lineId || !cartId) return;
        set({ isLoading: true });
        try {
          const result = await removeLineFromShopifyCart(cartId, item.lineId);
          if (result.success) {
            const newItems = get().items.filter(i => i.variantId !== variantId);
            newItems.length === 0 ? clearCart() : set({ items: newItems });
          } else if (result.cartNotFound) clearCart();
        } catch (error) {
          console.error('Failed to remove item:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      clearCart: () => set({ items: [], cartId: null, checkoutUrl: null, promoCode: null }),
      setPromoCode: (code: string | null) => set({ promoCode: code }),
      getCheckoutUrl: () => {
        const checkoutUrl = get().checkoutUrl;
        if (!checkoutUrl) return null;
        try {
          const url = new URL(checkoutUrl);
          url.hostname = 'checkout.sullenclothing.com';
          url.protocol = 'https:';
          url.searchParams.set('channel', 'online_store');
          return url.toString();
        } catch {
          return checkoutUrl;
        }
      },

      /** Consolidate all bundle discounts into one code, apply to cart, and return checkout URL */
      consolidateAndCheckout: async () => {
        const normalizeCheckoutUrl = (rawUrl: string) => {
          try {
            const url = new URL(rawUrl);
            url.hostname = 'checkout.sullenclothing.com';
            url.protocol = 'https:';
            url.searchParams.set('channel', 'online_store');
            return url.toString();
          } catch {
            return rawUrl;
          }
        };

        const { items, cartId, checkoutUrl, promoCode } = get();
        if (!cartId || !checkoutUrl) return null;

        // Fire GA4 + Meta begin_checkout events
        const checkoutItems = items.map(i => ({
          variantId: i.variantId,
          productTitle: i.product?.node?.title || '',
          price: i.price.amount,
          currencyCode: i.price.currencyCode || 'USD',
          quantity: i.quantity,
        }));
        ga4BeginCheckout(checkoutItems);
        const checkoutEventId = metaInitiateCheckout(checkoutItems);
        capiInitiateCheckout(checkoutEventId, checkoutItems);

        const localTotalQty = items.reduce((sum, i) => sum + i.quantity, 0);
        let effectiveCartId = cartId;
        let effectiveCheckoutUrl = normalizeCheckoutUrl(checkoutUrl);

        if (effectiveCheckoutUrl !== checkoutUrl) {
          set({ checkoutUrl: effectiveCheckoutUrl });
        }

        try {
          const cartSnapshot = await storefrontApiRequest(CART_QUERY, { id: cartId });
          const remoteCart = cartSnapshot?.data?.cart;
          const remoteQty = remoteCart?.totalQuantity ?? 0;
          const remoteCheckoutUrl = typeof remoteCart?.checkoutUrl === 'string'
            ? normalizeCheckoutUrl(remoteCart.checkoutUrl)
            : null;

          // Always prefer Shopify's freshest checkout URL to avoid stale /cart/c token 404s.
          if (remoteCheckoutUrl && remoteCheckoutUrl !== effectiveCheckoutUrl) {
            effectiveCheckoutUrl = remoteCheckoutUrl;
            set({ checkoutUrl: remoteCheckoutUrl });
          }

          if (!remoteCart || remoteQty !== localTotalQty) {
            console.warn('[Bundle] Cart desync detected. Rebuilding Shopify cart before checkout.', { remoteQty, localTotalQty });

            const rebuilt = await createShopifyCartFromItems(
              items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }))
            );

            if (rebuilt) {
              effectiveCartId = rebuilt.cartId;
              const normalizedRebuiltCheckoutUrl = normalizeCheckoutUrl(rebuilt.checkoutUrl);
              effectiveCheckoutUrl = normalizedRebuiltCheckoutUrl;

              set({
                cartId: rebuilt.cartId,
                checkoutUrl: normalizedRebuiltCheckoutUrl,
                items: items.map((i) => ({
                  ...i,
                  lineId: rebuilt.lineIdsByVariant[i.variantId] ?? i.lineId,
                })),
              });
            }
          }
        } catch (e) {
          console.error('[Bundle] Failed to validate cart before checkout:', e);
        }

        const ADDON_KEYWORDS = ['snapback', 'hat', 'cap', 'beanie', 'boxer', 'lanyard', 'sticker'];
        const TEE_RE = /\b(tee|t-shirt|1\s*[- ]?ton|premium|standard|long\s*sleeve|longsleeve)\b/i;

        const extractDesignKey = (title: string, handle: string): string => {
          const source = (title || handle || '').trim();
          if (!source) return '';
          let name = source.replace(/\s*["'][^"']+["']\s*$/i, '').trim();
          name = name.replace(/\s+(premium\s+tee|standard\s+tee|1\s*[- ]?ton|french\s+terry\s+longsleeve|longsleeve|long\s+sleeve|pullover|hoodie|snapback|dad\s+hat|beanie|jogger|shorts?|tank|crop|women'?s?\s+tee|boxers?|lanyard|stickers?|cap|hat|tee|badge)\s*$/i, '').trim();
          return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        };

        const inferBundleTag = (item: (typeof items)[number]): string | undefined => {
          if (item.bundleTag) return item.bundleTag;

          const normalizedHandle = (item.product?.node?.handle || '').toLowerCase();
          const tags = ((((item.product?.node as unknown as { tags?: string[] })?.tags) ?? [])).map((t) => String(t).toLowerCase());

          if (normalizedHandle.includes('bro_oks') || normalizedHandle.includes('brooks') || tags.some((t) => t.includes('bro_oks') || t.includes('brooks'))) {
            return 'bro_oks';
          }
          if (normalizedHandle.includes('youth') || tags.some((t) => t.includes('youth'))) return 'youth-tees';
          if (normalizedHandle.includes('solid') || tags.some((t) => t.includes('solid'))) return 'solids-pack';
          if (normalizedHandle.includes('cherub') || tags.some((t) => t.includes('cherub'))) return 'cherubs-capsule';
          if (tags.some((t) => t.includes('angels capsule') || t.includes('angels-capsule'))) return 'angels-capsule';
          if (normalizedHandle.includes('intimate') || normalizedHandle.includes('inktimate') || tags.some((t) => t.includes('intimate') || t.includes('inktimate'))) return 'inktimates';

          return undefined;
        };

        const FREE_GIFT_VARIANT_ID = "gid://shopify/ProductVariant/44079193751651";

        const payload = items.map(i => {
          const title = i.product?.node?.title || '';
          const handle = i.product?.node?.handle || '';
          const text = `${title} ${handle}`.toLowerCase();
          const capsuleTag = inferBundleTag(i);
          const isGift = i.variantId === FREE_GIFT_VARIANT_ID;

          // For free gift items, send the real variant price (not $0.00) so the
          // edge function can create an accurate discount even if its own Shopify
          // price lookup fails.
          let effectivePrice = parseFloat(i.price.amount);
          if (isGift) {
            const realVariantPrice = parseFloat(
              i.product?.node?.variants?.edges?.[0]?.node?.price?.amount || "0"
            );
            if (realVariantPrice > 0) effectivePrice = realVariantPrice;
          }

          // CTL tagging: if item belongs to a design group with addon keywords or tee pattern
          const isTee = TEE_RE.test(text);
          const isAddon = ADDON_KEYWORDS.some(kw => text.includes(kw));
          const designKey = (isTee || isAddon) ? extractDesignKey(title, handle) : '';

          return {
            variantId: i.variantId,
            price: effectivePrice,
            quantity: i.quantity,
            bundleTag: capsuleTag,
            // CTL fields — edge function uses these for complete-the-look grouping
            handle,
            title,
            designKey: designKey || undefined,
            isTee: (isTee || isAddon) ? isTee : undefined,
            isFreeGift: isGift || undefined,
          };
        });

        const hasBundleTags = payload.some(i => Boolean(i.bundleTag));
        const hasFreeGift = payload.some(i => Boolean(i.isFreeGift));
        const hasCompleteLookCandidate = (() => {
          const addOnKeywords = ['snapback', 'hat', 'cap', 'beanie', 'boxer', 'lanyard', 'sticker'];
          const hasTee = items.some((i) => /\b(tee|t-shirt|1\s*[- ]?ton|premium|standard|long\s*sleeve|longsleeve)\b/i.test(`${i.product.node.title} ${i.product.node.handle}`.toLowerCase()));
          const hasAddon = items.some((i) => addOnKeywords.some((kw) => `${i.product.node.title} ${i.product.node.handle}`.toLowerCase().includes(kw)));
          return hasTee && hasAddon;
        })();

        const hasPromoCode = Boolean(promoCode?.trim());

        if (!hasBundleTags && !hasCompleteLookCandidate && !hasFreeGift && !hasPromoCode) return effectiveCheckoutUrl;

        set({ isConsolidating: true });
        try {
          console.log('[Bundle] Consolidating discounts for', payload.filter(p => p.bundleTag).length, 'tagged items');

          const { data, error } = await supabase.functions.invoke('consolidate-bundle-discount', {
            body: { items: payload, cartId: effectiveCartId, promoCode: promoCode?.trim() || undefined },
          });

          if (error) {
            console.error('[Bundle] Consolidation error:', error);
            return effectiveCheckoutUrl;
          }

          console.log('[Bundle] Consolidation result:', data);

          if (data?.discount_code) {
            // Build discount codes to apply
            const codesToApply = [data.discount_code];

            // If the promo code is non-stackable, apply it separately via redirect chain
            // (Shopify will enforce its own combination rules at checkout)
            if (data.promo_non_stackable && promoCode?.trim()) {
              codesToApply.push(promoCode.trim());
              console.log(`[Bundle] Non-stackable promo "${promoCode}" will be applied separately`);
            }

            let checkoutWithDiscount = effectiveCheckoutUrl;
            try {
              const checkout = new URL(effectiveCheckoutUrl);
              const redirectTarget = `${checkout.pathname}${checkout.search}`;
              const discountUrl = new URL(`/discount/${encodeURIComponent(data.discount_code)}`, checkout.origin);
              discountUrl.searchParams.set('redirect', redirectTarget);
              checkoutWithDiscount = discountUrl.toString();
            } catch {
              checkoutWithDiscount = `${effectiveCheckoutUrl}${effectiveCheckoutUrl.includes('?') ? '&' : '?'}discount=${encodeURIComponent(data.discount_code)}`;
            }

            // Apply the consolidated code to the Shopify cart
            const applyResult = await applyDiscountsToCart(effectiveCartId, [data.discount_code]);
            if (!applyResult.success) {
              console.error('[Bundle] Failed to apply discount code to cart');
            } else {
              console.log('[Bundle] Successfully applied code:', data.discount_code, 'savings:', data.savings);
            }

            return checkoutWithDiscount;
          }

          return effectiveCheckoutUrl;
        } catch (error) {
          console.error('[Bundle] Consolidation failed:', error);
          return effectiveCheckoutUrl;
        } finally {
          set({ isConsolidating: false });
        }
      },

      syncCart: async () => {
        const { cartId, isSyncing, items, clearCart } = get();
        if (!cartId || isSyncing) return;
        set({ isSyncing: true });
        try {
          const data = await storefrontApiRequest(CART_QUERY, { id: cartId });
          if (!data) return;
          const cart = data?.data?.cart;
          if (!cart || cart.totalQuantity === 0) {
            // Cart is empty after checkout — fire GA4 purchase event
            if (items.length > 0) {
              const totalValue = items.reduce((sum, i) => sum + (parseFloat(i.price.amount) || 0) * i.quantity, 0);
              const purchaseOrder = {
                transactionId: cartId,
                value: totalValue,
                currencyCode: items[0]?.price.currencyCode || 'USD',
                items: items.map(i => ({
                  variantId: i.variantId,
                  productTitle: i.product?.node?.title || '',
                  price: parseFloat(i.price.amount) || 0,
                  quantity: i.quantity,
                })),
              };
              ga4Purchase(purchaseOrder);
              const purchaseEventId = metaPurchase(purchaseOrder);
              capiPurchase(purchaseEventId, purchaseOrder);
            }
            clearCart();
          }
        } catch (error) {
          console.error('Failed to sync cart:', error);
        } finally {
          set({ isSyncing: false });
        }
      }
    }),
    {
      name: 'shopify-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, cartId: state.cartId, checkoutUrl: state.checkoutUrl, promoCode: state.promoCode }),
    }
  )
);
