import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { storefrontApiRequest, PRODUCT_BY_HANDLE_QUERY, COLLECTION_BY_HANDLE_QUERY } from "@/lib/shopify";

export interface FeaturedVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: { amount: string; currencyCode: string };
  selectedOptions: Array<{ name: string; value: string }>;
}

export interface FeaturedProductData {
  handle: string;
  title: string;
  price: string;
  currencyCode: string;
  images: string[];
  description: string;
  features: string[];
  artistSeries?: string;
  variants: FeaturedVariant[];
  options: Array<{ name: string; values: string[] }>;
  rawProduct: any;
}

export interface FeaturedCollectionProduct {
  handle: string;
  title: string;
  image: string | null;
  price: string;
  currencyCode: string;
  rawNode: any;
  variants: FeaturedVariant[];
  options: Array<{ name: string; values: string[] }>;
}

export interface FeaturedCollectionData {
  handle: string;
  title: string;
  description: string;
  image: string | null;
  productCount: number;
  products: FeaturedCollectionProduct[];
}

export type FeaturedType = "product" | "collection";

export interface FeaturedSlide {
  id: string;
  type: FeaturedType;
  handle: string;
  label: string | null;
  backgroundImageUrl: string | null;
  product?: FeaturedProductData;
  collection?: FeaturedCollectionData;
}

export function useFeaturedProduct() {
  const [slides, setSlides] = useState<FeaturedSlide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: dbSlides } = await supabase
          .from("featured_slides")
          .select("*")
          .eq("is_active", true)
          .order("position", { ascending: true });

        if (!dbSlides || dbSlides.length === 0) {
          setSlides([]);
          setLoading(false);
          return;
        }

        // Filter by schedule
        const now = new Date().toISOString();
        const scheduled = dbSlides.filter((s: any) => {
          if (s.scheduled_from && s.scheduled_from > now) return false;
          if (s.scheduled_until && s.scheduled_until < now) return false;
          return true;
        });

        if (scheduled.length === 0) {
          setSlides([]);
          setLoading(false);
          return;
        }

        const resolved: FeaturedSlide[] = [];

        for (const s of scheduled) {
          const slide: FeaturedSlide = {
            id: s.id,
            type: s.type as FeaturedType,
            handle: s.handle,
            label: s.label,
            backgroundImageUrl: s.background_image_url,
          };

          if (s.type === "collection") {
            try {
              const res = await storefrontApiRequest(COLLECTION_BY_HANDLE_QUERY, {
                handle: s.handle,
                first: 4,
              });
              const c = res?.data?.collection;
              if (c) {
                slide.collection = {
                  handle: s.handle,
                  title: c.title,
                  description: c.description || "",
                  image: c.image?.url || null,
                  productCount: (c.products?.edges || []).length,
                  products: (c.products?.edges || []).map((e: any) => ({
                    handle: e.node.handle,
                    title: e.node.title,
                    image: e.node.images?.edges?.[0]?.node?.url || null,
                    price: parseFloat(e.node.priceRange.minVariantPrice.amount).toFixed(2),
                    currencyCode: e.node.priceRange.minVariantPrice.currencyCode,
                    rawNode: e.node,
                    variants: (e.node.variants?.edges || []).map((v: any) => ({
                      id: v.node.id,
                      title: v.node.title,
                      availableForSale: v.node.availableForSale,
                      price: v.node.price || { amount: e.node.priceRange.minVariantPrice.amount, currencyCode: e.node.priceRange.minVariantPrice.currencyCode },
                      selectedOptions: v.node.selectedOptions || [],
                    })),
                    options: e.node.options || [],
                  })),
                };
              }
            } catch (err) {
              console.error("Failed to load collection:", s.handle, err);
            }
          } else {
            try {
              const res = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle: s.handle });
              const p = res?.data?.product;
              if (p) {
                const images = p.images.edges.map((e: { node: { url: string } }) => e.node.url);
                const price = p.priceRange.minVariantPrice.amount;
                const currencyCode = p.priceRange.minVariantPrice.currencyCode;
                const descLines = p.description
                  ?.split(/[\n•·]/)
                  .map((l: string) => l.trim())
                  .filter((l: string) => l.length > 0 && l.length < 80)
                  .slice(0, 5) || [];
                const isArtist = p.tags?.some((t: string) => t.toLowerCase().includes("artist"));
                const variants: FeaturedVariant[] = (p.variants?.edges || []).map((e: any) => ({
                  id: e.node.id,
                  title: e.node.title,
                  availableForSale: e.node.availableForSale,
                  price: e.node.price || { amount: price, currencyCode },
                  selectedOptions: e.node.selectedOptions || [],
                }));

                slide.product = {
                  handle: p.handle,
                  title: p.title,
                  price: parseFloat(price).toFixed(2),
                  currencyCode,
                  images,
                  description: p.description || "",
                  features: descLines.length > 0 ? descLines : ["Premium quality", "Exclusive design"],
                  artistSeries: isArtist ? "Artist Series" : undefined,
                  variants,
                  options: p.options || [],
                  rawProduct: p,
                };
              }
            } catch (err) {
              console.error("Failed to load product:", s.handle, err);
            }
          }

          if (slide.product || slide.collection) {
            resolved.push(slide);
          }
        }

        setSlides(resolved);
      } catch (err) {
        console.error("Failed to load featured slides:", err);
        setSlides([]);
      }
      setLoading(false);
    }
    load();
  }, []);

  return { slides, loading };
}
