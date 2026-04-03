import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { storefrontApiRequest, COLLECTION_BY_HANDLE_QUERY, type ShopifyProduct } from "@/lib/shopify";

interface VaultItem {
  id: string;
  section: string;
  collection_handle: string;
  label: string | null;
  position: number;
  is_active: boolean;
}

export function useVaultProducts(section: string, enabled: boolean) {
  // First fetch vault_items for this section
  const { data: vaultItems } = useQuery({
    queryKey: ["vault-items", section],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vault_items")
        .select("*")
        .eq("section", section)
        .eq("is_active", true)
        .order("position");
      if (error) throw error;
      return data as VaultItem[];
    },
    enabled,
  });

  // Then fetch products from all collection handles
  const handles = vaultItems?.map((i) => i.collection_handle) ?? [];

  const { data: products, isLoading } = useQuery({
    queryKey: ["vault-collection-products", section, handles],
    queryFn: async () => {
      const allProducts: ShopifyProduct[] = [];
      const seen = new Set<string>();

      for (const handle of handles) {
        try {
          const data = await storefrontApiRequest(COLLECTION_BY_HANDLE_QUERY, {
            handle,
            first: 50,
          });
          const edges = data?.data?.collection?.products?.edges ?? [];
          for (const edge of edges) {
            if (!seen.has(edge.node.id)) {
              seen.add(edge.node.id);
              allProducts.push({ node: edge.node });
            }
          }
        } catch {
          // skip failed collections
        }
      }
      return allProducts;
    },
    enabled: enabled && handles.length > 0,
  });

  return {
    products: products ?? [],
    isLoading: isLoading && handles.length > 0,
    hasCollections: handles.length > 0,
  };
}
