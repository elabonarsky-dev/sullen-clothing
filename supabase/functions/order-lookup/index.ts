import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SHOPIFY_STORE = "sullenclothing.myshopify.com";
const SHOPIFY_ADMIN_API_VERSION = "2026-01";
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

// Unified error message to prevent information leakage
const GENERIC_LOOKUP_ERROR = "We couldn't find a matching order. Please check your order number and email address.";

function errorResponse(message: string, status = 200) {
  return new Response(JSON.stringify({ error: message }), { status, headers: jsonHeaders });
}

async function getShopifyToken(supabase: any): Promise<string | null> {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "shopify_returns_token")
      .single();
    if (data?.value) return data.value;
  } catch (_) { /* fall through */ }
  return Deno.env.get("SHOPIFY_ACCESS_TOKEN") || null;
}

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_number, email } = await req.json();

    if (!order_number || !email) {
      return errorResponse("Order number and email are required");
    }

    // ── Rate limiting: 10 lookups per IP per 15 minutes ──
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const clientIP = getClientIP(req);
    const rateLimitKey = `order-lookup:${clientIP}`;

    const { data: allowed } = await supabase.rpc("check_rate_limit", {
      p_key: rateLimitKey,
      p_max_attempts: 10,
      p_window_minutes: 15,
    });

    if (allowed === false) {
      return errorResponse("Too many requests. Please wait a few minutes and try again.", 429);
    }

    const shopifyToken = await getShopifyToken(supabase);
    if (!shopifyToken) {
      console.error("No Shopify access token found");
      return errorResponse("Service configuration error");
    }

    const cleanNumber = order_number.toString().replace(/^#/, "");
    const searchUrl = `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/orders.json?name=%23${cleanNumber}&status=any&limit=1`;

    console.log("Looking up order:", cleanNumber);

    const orderRes = await fetch(searchUrl, {
      headers: {
        "X-Shopify-Access-Token": shopifyToken,
        "Content-Type": "application/json",
      },
    });

    if (!orderRes.ok) {
      const body = await orderRes.text();
      console.error("Shopify API error:", orderRes.status, body);
      return errorResponse("Failed to look up order. Please try again.");
    }

    const { orders } = await orderRes.json();

    // ── Unified error: don't distinguish "not found" vs "email mismatch" ──
    if (!orders || orders.length === 0) {
      return errorResponse(GENERIC_LOOKUP_ERROR);
    }

    const order = orders[0];

    if (order.email?.toLowerCase() !== email.toLowerCase()) {
      // Same generic message — prevents email enumeration
      return errorResponse(GENERIC_LOOKUP_ERROR);
    }

    // Check if order is within return window (30 days)
    const orderDate = new Date(order.created_at);
    const daysSinceOrder = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceOrder > 30) {
      return errorResponse("This order is past the 30-day return window");
    }

    const lineItems = order.line_items.map((item: any) => ({
      id: item.id.toString(),
      title: item.title,
      variant_title: item.variant_title,
      quantity: item.quantity,
      price: item.price,
      image: item.image?.src || null,
      product_id: item.product_id?.toString(),
      variant_id: item.variant_id?.toString(),
      fulfillment_status: item.fulfillment_status,
    }));

    return new Response(
      JSON.stringify({
        order_id: order.id.toString(),
        order_name: order.name,
        email: order.email,
        created_at: order.created_at,
        financial_status: order.financial_status,
        fulfillment_status: order.fulfillment_status,
        line_items: lineItems,
        days_since_order: Math.floor(daysSinceOrder),
      }),
      { headers: jsonHeaders }
    );
  } catch (err) {
    console.error("Order lookup error:", err);
    return errorResponse("Something went wrong. Please try again.");
  }
});
