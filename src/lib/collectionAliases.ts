/**
 * Maps friendly route handles to their actual Shopify collection handles.
 * Centralised here so CollectionPage, sitemap, and any future consumers share
 * one source of truth. Keys are the URL-visible slugs; values are the Shopify
 * handles that the Storefront API understands.
 */
export const COLLECTION_HANDLE_ALIASES: Record<string, string> = {
  jewelry: "heavy-metals",
  lanyards: "lanyards-1",
  sunglasses: "black-fly-sunglasses",
  "hats-letterheads": "letterheads",
  "hats-artist-series": "artist-series",
  "hats-staples": "hat-staples",
  timeless: "sullen-logo-tees",
  solids: "the-solids",
};

/** Resolve a combined route handle (possibly including subhandle) to a Shopify handle. */
export function resolveCollectionHandle(combinedHandle: string): string {
  return COLLECTION_HANDLE_ALIASES[combinedHandle] || combinedHandle;
}
