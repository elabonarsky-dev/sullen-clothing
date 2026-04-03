/**
 * Google Analytics 4 — fires standard GA4 e-commerce events via gtag.js.
 * Measurement ID is loaded in index.html; this module wraps the gtag() calls.
 */

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(...args);
  }
}

/* ─── Page-level ─── */

export function ga4PageView(path: string, title?: string) {
  gtag("event", "page_view", {
    page_path: path,
    page_title: title || document.title,
  });
}

/* ─── E-commerce: Product View ─── */

export function ga4ViewItem(product: {
  id: string;
  title: string;
  handle: string;
  vendor?: string;
  price: string;
  currencyCode: string;
  variantId?: string;
}) {
  gtag("event", "view_item", {
    currency: product.currencyCode,
    value: parseFloat(product.price) || 0,
    items: [
      {
        item_id: product.id,
        item_name: product.title,
        item_brand: product.vendor || "Sullen",
        item_variant: product.variantId || "",
        price: parseFloat(product.price) || 0,
      },
    ],
  });
}

/* ─── E-commerce: Collection / Item List View ─── */

export function ga4ViewItemList(collection: {
  id: string;
  title: string;
  handle: string;
}) {
  gtag("event", "view_item_list", {
    item_list_id: collection.id,
    item_list_name: collection.title,
  });
}

/* ─── E-commerce: Add to Cart ─── */

export function ga4AddToCart(item: {
  variantId: string;
  productTitle: string;
  price: string;
  currencyCode: string;
  quantity: number;
}) {
  gtag("event", "add_to_cart", {
    currency: item.currencyCode,
    value: (parseFloat(item.price) || 0) * item.quantity,
    items: [
      {
        item_id: item.variantId,
        item_name: item.productTitle,
        price: parseFloat(item.price) || 0,
        quantity: item.quantity,
      },
    ],
  });
}

/* ─── E-commerce: Remove from Cart ─── */

export function ga4RemoveFromCart(item: {
  variantId: string;
  productTitle: string;
  price: string;
  currencyCode: string;
  quantity: number;
}) {
  gtag("event", "remove_from_cart", {
    currency: item.currencyCode,
    value: (parseFloat(item.price) || 0) * item.quantity,
    items: [
      {
        item_id: item.variantId,
        item_name: item.productTitle,
        price: parseFloat(item.price) || 0,
        quantity: item.quantity,
      },
    ],
  });
}

/* ─── E-commerce: View Cart ─── */

export function ga4ViewCart(items: {
  variantId: string;
  productTitle: string;
  price: string;
  currencyCode: string;
  quantity: number;
}[]) {
  const value = items.reduce((sum, i) => sum + (parseFloat(i.price) || 0) * i.quantity, 0);
  gtag("event", "view_cart", {
    currency: items[0]?.currencyCode || "USD",
    value,
    items: items.map((i) => ({
      item_id: i.variantId,
      item_name: i.productTitle,
      price: parseFloat(i.price) || 0,
      quantity: i.quantity,
    })),
  });
}

/* ─── E-commerce: Begin Checkout ─── */

export function ga4BeginCheckout(items: {
  variantId: string;
  productTitle: string;
  price: string;
  currencyCode: string;
  quantity: number;
}[]) {
  const value = items.reduce((sum, i) => sum + (parseFloat(i.price) || 0) * i.quantity, 0);
  gtag("event", "begin_checkout", {
    currency: items[0]?.currencyCode || "USD",
    value,
    items: items.map((i) => ({
      item_id: i.variantId,
      item_name: i.productTitle,
      price: parseFloat(i.price) || 0,
      quantity: i.quantity,
    })),
  });
}

/* ─── E-commerce: Purchase ─── */

export function ga4Purchase(order: {
  transactionId: string;
  value: number;
  currencyCode: string;
  items: {
    variantId: string;
    productTitle: string;
    price: number;
    quantity: number;
  }[];
}) {
  gtag("event", "purchase", {
    transaction_id: order.transactionId,
    currency: order.currencyCode,
    value: order.value,
    items: order.items.map((i) => ({
      item_id: i.variantId,
      item_name: i.productTitle,
      price: i.price,
      quantity: i.quantity,
    })),
  });
}

/* ─── Search ─── */

export function ga4Search(query: string) {
  gtag("event", "search", { search_term: query });
}
