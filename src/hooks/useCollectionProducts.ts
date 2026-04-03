import { useQuery } from "@tanstack/react-query";
import { storefrontApiRequest, COLLECTION_BY_HANDLE_QUERY } from "@/lib/shopify";

export interface CollectionProduct {
  name: string;
  image: string;
  price: string;
  href: string;
  badge?: string;
  compareAtPrice?: number;
  numericPrice?: number;
}

export function useCollectionProducts(handle: string, count = 8) {
  const { data: products = [], isLoading: loading } = useQuery({
    queryKey: ["collection-products", handle, count],
    queryFn: async () => {
      const res = await storefrontApiRequest(COLLECTION_BY_HANDLE_QUERY, {
        handle,
        first: count,
      });
       const edges = res?.data?.collection?.products?.edges || [];
       return edges.filter((e: any) => e.node.availableForSale !== false).map((e: any) => {
        const node = e.node;
        const price = parseFloat(node.priceRange.minVariantPrice.amount);
        const maxPrice = parseFloat(node.priceRange.maxVariantPrice?.amount || price);
        const compareAt = parseFloat(node.compareAtPriceRange?.maxVariantPrice?.amount || "0");
        const priceLabel =
          price === maxPrice
            ? `$${price.toFixed(2)}`
            : `From $${price.toFixed(2)}`;
        return {
          name: node.title,
          image: node.images?.edges?.[0]?.node?.url || "",
          price: priceLabel,
          href: `/product/${node.handle}`,
          numericPrice: price,
          compareAtPrice: compareAt > price ? compareAt : undefined,
        } as CollectionProduct;
      });
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return { products, loading };
}
