/**
 * Meta (Facebook) Pixel — client-side tracking for standard e-commerce events.
 * Pixel ID is injected at build time via VITE_META_PIXEL_ID env var,
 * or falls back to the value set in Supabase secrets (loaded at runtime).
 *
 * Events tracked: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase
 * Each event generates a unique event_id for server-side deduplication via CAPI.
 */

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

let pixelInitialized = false;
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '515408688634510';

/** Generate a unique event ID for deduplication with CAPI */
export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Initialize the Meta Pixel script (call once on app load) */
export function initMetaPixel(pixelId?: string) {
  if (pixelInitialized || typeof window === 'undefined') return;

  const id = pixelId || META_PIXEL_ID;
  if (!id) {
    console.warn('[MetaPixel] No Pixel ID configured');
    return;
  }

  // Meta Pixel base code
  (function (f: Window, b: Document, e: string, v: string) {
    if (f.fbq) return;
    const n: any = (f.fbq = function (...args: unknown[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s?.parentNode?.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('init', id);
  pixelInitialized = true;
}

function fbq(...args: unknown[]) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq(...args);
  }
}

/* ─── Standard Events ─── */

/** PageView — fires on every route change */
export function metaPageView(eventId?: string) {
  const eid = eventId || generateEventId();
  fbq('track', 'PageView', {}, { eventID: eid });
  return eid;
}

/** ViewContent — fires on product detail page */
export function metaViewContent(product: {
  id: string;
  title: string;
  handle: string;
  price: string;
  currencyCode: string;
  category?: string;
}, eventId?: string) {
  const eid = eventId || generateEventId();
  fbq('track', 'ViewContent', {
    content_ids: [product.id],
    content_name: product.title,
    content_type: 'product',
    content_category: product.category || 'Apparel',
    value: parseFloat(product.price) || 0,
    currency: product.currencyCode || 'USD',
  }, { eventID: eid });
  return eid;
}

/** AddToCart */
export function metaAddToCart(item: {
  variantId: string;
  productTitle: string;
  price: string;
  currencyCode: string;
  quantity: number;
}, eventId?: string) {
  const eid = eventId || generateEventId();
  fbq('track', 'AddToCart', {
    content_ids: [item.variantId],
    content_name: item.productTitle,
    content_type: 'product',
    value: (parseFloat(item.price) || 0) * item.quantity,
    currency: item.currencyCode || 'USD',
    num_items: item.quantity,
  }, { eventID: eid });
  return eid;
}

/** InitiateCheckout */
export function metaInitiateCheckout(items: {
  variantId: string;
  productTitle: string;
  price: string;
  currencyCode: string;
  quantity: number;
}[], eventId?: string) {
  const eid = eventId || generateEventId();
  const value = items.reduce((sum, i) => sum + (parseFloat(i.price) || 0) * i.quantity, 0);
  fbq('track', 'InitiateCheckout', {
    content_ids: items.map(i => i.variantId),
    content_type: 'product',
    value,
    currency: items[0]?.currencyCode || 'USD',
    num_items: items.reduce((sum, i) => sum + i.quantity, 0),
  }, { eventID: eid });
  return eid;
}

/** Purchase */
export function metaPurchase(order: {
  transactionId: string;
  value: number;
  currencyCode: string;
  items: { variantId: string; productTitle: string; price: number; quantity: number }[];
}, eventId?: string) {
  const eid = eventId || generateEventId();
  fbq('track', 'Purchase', {
    content_ids: order.items.map(i => i.variantId),
    content_type: 'product',
    value: order.value,
    currency: order.currencyCode || 'USD',
    num_items: order.items.reduce((sum, i) => sum + i.quantity, 0),
    order_id: order.transactionId,
  }, { eventID: eid });
  return eid;
}
