/**
 * Shopify Analytics — fires standard e-commerce events to Shopify's
 * monorail analytics endpoint so they appear in the Shopify Admin
 * Analytics dashboard (page views, product views, add-to-cart, search,
 * collection views).
 *
 * For headless storefronts the Shopify Web Pixel sandbox isn't available,
 * so we POST events directly.
 */

const SHOPIFY_DOMAIN = "sullenclothing.myshopify.com";
const MONORAIL_URL = "https://monorail-edge.shopifysvc.net/v1/produce";
const SCHEMA_ID = "trekkie_storefront_page_view/1.4";

/* ─── Unique visit / session tracking ─── */
let _uniqToken: string | null = null;
let _visitToken: string | null = null;

function uniqToken(): string {
  if (!_uniqToken) {
    _uniqToken = localStorage.getItem("shopify_Y") || crypto.randomUUID();
    localStorage.setItem("shopify_Y", _uniqToken);
  }
  return _uniqToken;
}

function visitToken(): string {
  if (!_visitToken) {
    _visitToken = sessionStorage.getItem("shopify_S") || crypto.randomUUID();
    sessionStorage.setItem("shopify_S", _visitToken);
  }
  return _visitToken;
}

/* ─── Common payload ─── */
function basePayload() {
  return {
    appClientId: "headless-storefront",
    isMerchantRequest: false,
    isPersistentCookie: true,
    uniqToken: uniqToken(),
    visitToken: visitToken(),
    microSessionId: crypto.randomUUID(),
    microSessionCount: 1,
    shopId: SHOPIFY_DOMAIN,
    url: window.location.href,
    path: window.location.pathname,
    search: window.location.search,
    referrer: document.referrer,
    title: document.title,
    timestamp: new Date().toISOString(),
    navigationType: "navigate",
    connection: {
      effectiveType: (navigator as any).connection?.effectiveType || "4g",
      rtt: (navigator as any).connection?.rtt || 0,
      downlink: (navigator as any).connection?.downlink || 10,
    },
  };
}

function send(payload: Record<string, unknown>) {
  try {
    const body = JSON.stringify({ schema_id: SCHEMA_ID, payload, metadata: { event_created_at_ms: Date.now() } });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(MONORAIL_URL, body);
    } else {
      fetch(MONORAIL_URL, { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
    }
  } catch {
    // analytics should never crash the app
  }
}

/* ─── Public API ─── */

/** Track a page view (homepage, about, etc.) */
export function trackPageView() {
  send({ ...basePayload(), eventType: "page_view" });
}

/** Track a product detail page view */
export function trackProductView(product: {
  id: string;
  title: string;
  handle: string;
  vendor?: string;
  price: string;
  currencyCode: string;
  variantId?: string;
}) {
  send({
    ...basePayload(),
    eventType: "product_view",
    resourceType: "product",
    resourceId: product.id,
    productId: product.id,
    productTitle: product.title,
    productUrl: `/product/${product.handle}`,
    productVendor: product.vendor || "Sullen",
    variantId: product.variantId || "",
    variantPrice: product.price,
    currency: product.currencyCode,
  });
}

/** Track a collection page view */
export function trackCollectionView(collection: {
  id: string;
  title: string;
  handle: string;
}) {
  send({
    ...basePayload(),
    eventType: "collection_view",
    resourceType: "collection",
    resourceId: collection.id,
    collectionTitle: collection.title,
    collectionUrl: `/collections/${collection.handle}`,
  });
}

/** Track add-to-cart */
export function trackAddToCart(item: {
  variantId: string;
  productTitle: string;
  price: string;
  currencyCode: string;
  quantity: number;
}) {
  send({
    ...basePayload(),
    eventType: "add_to_cart",
    cartToken: visitToken(),
    variantId: item.variantId,
    productTitle: item.productTitle,
    variantPrice: item.price,
    currency: item.currencyCode,
    quantity: item.quantity,
  });
}

/** Track search queries */
export function trackSearch(query: string, resultCount?: number) {
  send({
    ...basePayload(),
    eventType: "search",
    searchQuery: query,
    resultCount: resultCount ?? 0,
  });
}
