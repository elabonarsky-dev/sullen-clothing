/**
 * Meta Conversions API (CAPI) — sends server-side events via edge function
 * for improved attribution accuracy and iOS 14+ tracking.
 *
 * Each call includes the same event_id used by the client-side pixel
 * so Meta can deduplicate the two signals.
 *
 * Sends hashed email + external_id when available for better Event Match Quality.
 */

import { supabase } from '@/integrations/supabase/client';

interface CapiEvent {
  event_name: string;
  event_id: string;
  event_source_url: string;
  user_data: {
    client_user_agent: string;
    fbc?: string;
    fbp?: string;
    em?: string;       // SHA-256 hashed email
    external_id?: string; // SHA-256 hashed user ID
  };
  custom_data?: Record<string, unknown>;
}

/** Read Meta browser cookies for deduplication */
function getMetaCookies() {
  const cookies = document.cookie.split('; ');
  const fbc = cookies.find(c => c.startsWith('_fbc='))?.split('=')[1] || undefined;
  const fbp = cookies.find(c => c.startsWith('_fbp='))?.split('=')[1] || undefined;
  return { fbc, fbp };
}

/** SHA-256 hash a string (Meta requires lowercase hex) */
async function sha256(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Get the current user's email and ID (if logged in) */
async function getAuthUserData(): Promise<{ email?: string; userId?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      return {
        email: session.user.email,
        userId: session.user.id,
      };
    }
  } catch {
    // Not logged in — fine
  }
  return {};
}

/** Send an event to the CAPI edge function */
async function sendCapiEvent(event: CapiEvent) {
  try {
    await supabase.functions.invoke('meta-capi', {
      body: event,
    });
  } catch (error) {
    console.error('[CAPI] Failed to send event:', error);
  }
}

async function baseUserData() {
  const { fbc, fbp } = getMetaCookies();
  const { email, userId } = await getAuthUserData();

  const userData: CapiEvent['user_data'] = {
    client_user_agent: navigator.userAgent,
    fbc,
    fbp,
  };

  if (email) {
    userData.em = await sha256(email);
  }
  if (userId) {
    userData.external_id = await sha256(userId);
  }

  return userData;
}

/* ─── Public API ─── */

export async function capiPageView(eventId: string) {
  sendCapiEvent({
    event_name: 'PageView',
    event_id: eventId,
    event_source_url: window.location.href,
    user_data: await baseUserData(),
  });
}

export async function capiViewContent(eventId: string, product: {
  id: string;
  title: string;
  price: string;
  currencyCode: string;
}) {
  sendCapiEvent({
    event_name: 'ViewContent',
    event_id: eventId,
    event_source_url: window.location.href,
    user_data: await baseUserData(),
    custom_data: {
      content_ids: [product.id],
      content_name: product.title,
      content_type: 'product',
      value: parseFloat(product.price) || 0,
      currency: product.currencyCode || 'USD',
    },
  });
}

export async function capiAddToCart(eventId: string, item: {
  variantId: string;
  productTitle: string;
  price: string;
  currencyCode: string;
  quantity: number;
}) {
  sendCapiEvent({
    event_name: 'AddToCart',
    event_id: eventId,
    event_source_url: window.location.href,
    user_data: await baseUserData(),
    custom_data: {
      content_ids: [item.variantId],
      content_name: item.productTitle,
      content_type: 'product',
      value: (parseFloat(item.price) || 0) * item.quantity,
      currency: item.currencyCode || 'USD',
      num_items: item.quantity,
    },
  });
}

export async function capiInitiateCheckout(eventId: string, items: {
  variantId: string;
  price: string;
  currencyCode: string;
  quantity: number;
}[]) {
  const value = items.reduce((sum, i) => sum + (parseFloat(i.price) || 0) * i.quantity, 0);
  sendCapiEvent({
    event_name: 'InitiateCheckout',
    event_id: eventId,
    event_source_url: window.location.href,
    user_data: await baseUserData(),
    custom_data: {
      content_ids: items.map(i => i.variantId),
      content_type: 'product',
      value,
      currency: items[0]?.currencyCode || 'USD',
      num_items: items.reduce((sum, i) => sum + i.quantity, 0),
    },
  });
}

export async function capiPurchase(eventId: string, order: {
  transactionId: string;
  value: number;
  currencyCode: string;
  items: { variantId: string; price: number; quantity: number }[];
}) {
  sendCapiEvent({
    event_name: 'Purchase',
    event_id: eventId,
    event_source_url: window.location.href,
    user_data: await baseUserData(),
    custom_data: {
      content_ids: order.items.map(i => i.variantId),
      content_type: 'product',
      value: order.value,
      currency: order.currencyCode || 'USD',
      num_items: order.items.reduce((sum, i) => sum + i.quantity, 0),
      order_id: order.transactionId,
    },
  });
}
