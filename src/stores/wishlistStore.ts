import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

export interface WishlistItem {
  productHandle: string;
  productTitle: string;
  productImage?: string;
  productPrice?: string;
  currencyCode?: string;
  addedAt: string;
}

interface WishlistStore {
  items: WishlistItem[];
  isSynced: boolean;
  addItem: (item: Omit<WishlistItem, 'addedAt'>) => void;
  removeItem: (productHandle: string) => void;
  isInWishlist: (productHandle: string) => boolean;
  toggleItem: (item: Omit<WishlistItem, 'addedAt'>) => void;
  syncWithCloud: (userId: string) => Promise<void>;
  clearLocal: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      isSynced: false,

      addItem: (item) => {
        const { items } = get();
        if (items.some(i => i.productHandle === item.productHandle)) return;
        const newItem: WishlistItem = { ...item, addedAt: new Date().toISOString() };
        set({ items: [...items, newItem] });

        // Try to persist to cloud + sync to Attentive
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            supabase.from('wishlists').upsert({
              user_id: session.user.id,
              product_handle: item.productHandle,
              product_title: item.productTitle,
              product_image: item.productImage || null,
              product_price: item.productPrice || null,
              currency_code: item.currencyCode || 'USD',
            }, { onConflict: 'user_id,product_handle' }).then(() => {});

            // Fire-and-forget Attentive sync
            supabase.functions.invoke('attentive-wishlist-sync', {
              body: {
                action: 'add',
                productHandle: item.productHandle,
                productTitle: item.productTitle,
                productPrice: item.productPrice,
                productImage: item.productImage,
              },
            }).catch(() => {});
          }
        });
      },

      removeItem: (productHandle) => {
        const removedItem = get().items.find(i => i.productHandle === productHandle);
        set({ items: get().items.filter(i => i.productHandle !== productHandle) });

        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            supabase.from('wishlists')
              .delete()
              .eq('user_id', session.user.id)
              .eq('product_handle', productHandle)
              .then(() => {});

            // Fire-and-forget Attentive sync
            supabase.functions.invoke('attentive-wishlist-sync', {
              body: {
                action: 'remove',
                productHandle,
                productTitle: removedItem?.productTitle,
              },
            }).catch(() => {});
          }
        });
      },

      isInWishlist: (productHandle) => {
        return get().items.some(i => i.productHandle === productHandle);
      },

      toggleItem: (item) => {
        const { isInWishlist, addItem, removeItem } = get();
        if (isInWishlist(item.productHandle)) {
          removeItem(item.productHandle);
        } else {
          addItem(item);
        }
      },

      syncWithCloud: async (userId: string) => {
        const { items: localItems } = get();

        // Fetch cloud items
        const { data: cloudItems } = await supabase
          .from('wishlists')
          .select('*')
          .eq('user_id', userId);

        if (!cloudItems) return;

        // Merge: union of local + cloud
        const merged = new Map<string, WishlistItem>();

        for (const item of localItems) {
          merged.set(item.productHandle, item);
        }

        for (const ci of cloudItems) {
          if (!merged.has(ci.product_handle)) {
            merged.set(ci.product_handle, {
              productHandle: ci.product_handle,
              productTitle: ci.product_title,
              productImage: ci.product_image || undefined,
              productPrice: ci.product_price || undefined,
              currencyCode: ci.currency_code || 'USD',
              addedAt: ci.created_at,
            });
          }
        }

        const mergedItems = Array.from(merged.values());
        set({ items: mergedItems, isSynced: true });

        // Push any local-only items to cloud
        const cloudHandles = new Set(cloudItems.map(c => c.product_handle));
        const toInsert = mergedItems
          .filter(i => !cloudHandles.has(i.productHandle))
          .map(i => ({
            user_id: userId,
            product_handle: i.productHandle,
            product_title: i.productTitle,
            product_image: i.productImage || null,
            product_price: i.productPrice || null,
            currency_code: i.currencyCode || 'USD',
          }));

        if (toInsert.length > 0) {
          await supabase.from('wishlists').upsert(toInsert, { onConflict: 'user_id,product_handle' });
        }
      },

      clearLocal: () => set({ items: [], isSynced: false }),
    }),
    {
      name: 'sullen-wishlist',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
