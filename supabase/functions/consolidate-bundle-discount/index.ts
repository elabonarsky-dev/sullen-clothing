const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

/* ------------------------------------------------------------------ */
/*  Bundle-rule definitions — loaded from DB                          */
/* ------------------------------------------------------------------ */

interface BundleRule {
  min: number;
  type: "cheapest_free" | "fixed" | "percent_10" | "percent_15" | "percent_20";
  fixedAmount?: number;
}

interface CartLineItem {
  variantId: string;
  price: number;
  quantity: number;
  bundleTag?: string;
  handle?: string;
  title?: string;
  designKey?: string;
  isTee?: boolean;
  isFreeGift?: boolean;
}

interface CTLRule { min: number; pct: number }
const CTL_TIERS: CTLRule[] = [
  { min: 4, pct: 20 },
  { min: 3, pct: 15 },
  { min: 2, pct: 10 },
];

async function loadBundleRules(): Promise<Record<string, BundleRule>> {
  const sbUrl = Deno.env.get("SUPABASE_URL")!;
  const sbKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(`${sbUrl}/rest/v1/bundle_configs?is_active=eq.true&select=bundle_tag,min_qty,discount_type,fixed_amount`, {
    headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
  });
  if (!res.ok) {
    console.error("Failed to load bundle_configs:", res.status);
    return {};
  }
  const rows: Array<{ bundle_tag: string; min_qty: number; discount_type: string; fixed_amount: number | null }> = await res.json();
  const rules: Record<string, BundleRule> = {};
  for (const r of rows) {
    rules[`${r.bundle_tag}:${r.min_qty}`] = {
      min: r.min_qty,
      type: r.discount_type as "cheapest_free" | "fixed",
      fixedAmount: r.fixed_amount ?? undefined,
    };
  }
  return rules;
}

/* ------------------------------------------------------------------ */
/*  Savings calculator                                                */
/* ------------------------------------------------------------------ */

function calcBundleSavings(items: CartLineItem[], bundleRules: Record<string, BundleRule>, freeGiftPrices: Record<string, number>): number {
  let totalSavings = 0;

  // Free gift: add its full actual price to savings so it's zeroed out at checkout
  for (const item of items) {
    if (item.isFreeGift) {
      const actualPrice = freeGiftPrices[item.variantId] ?? item.price;
      totalSavings += actualPrice * item.quantity;
    }
  }

  const groups = new Map<string, CartLineItem[]>();
  for (const item of items) {
    if (!item.bundleTag) continue;
    const existing = groups.get(item.bundleTag) || [];
    existing.push(item);
    groups.set(item.bundleTag, existing);
  }

  for (const [tag, groupItems] of groups.entries()) {
    const expanded: number[] = [];
    for (const item of groupItems) {
      for (let q = 0; q < item.quantity; q++) expanded.push(item.price);
    }

    if (tag === "solids-pack") {
      const rule5 = bundleRules["solids-pack:5"];
      const rule3 = bundleRules["solids-pack:3"];
      if (rule5 && expanded.length >= 5) {
        totalSavings += Math.min(...expanded);
      } else if (rule3 && expanded.length >= 3) {
        totalSavings += rule3.fixedAmount ?? 10;
      }
      continue;
    }

    if (tag === "complete-the-look") continue;

    let rule: BundleRule | undefined;
    for (const [key, r] of Object.entries(bundleRules)) {
      if (key.startsWith(tag + ":") && expanded.length >= r.min) {
        if (!rule || r.min > rule.min) rule = r;
      }
    }
    if (!rule || expanded.length < rule.min) continue;

    if (rule.type === "cheapest_free") {
      const freeUnits = Math.floor(expanded.length / rule.min);
      const sorted = [...expanded].sort((a, b) => a - b);
      for (let i = 0; i < freeUnits; i++) {
        if (typeof sorted[i] === "number") totalSavings += sorted[i];
      }
    } else if (rule.type === "fixed" && rule.fixedAmount) {
      totalSavings += rule.fixedAmount * Math.max(1, Math.floor(expanded.length / rule.min));
    } else if (rule.type.startsWith("percent_")) {
      const pct = parseInt(rule.type.split("_")[1], 10);
      if (!isNaN(pct)) {
        const subtotal = expanded.reduce((a, b) => a + b, 0);
        totalSavings += subtotal * (pct / 100);
      }
    }
  }

  // Complete-the-Look: group by designKey, require tee, discount only add-ons
  const ctlGroups = new Map<string, { totalQty: number; teeQty: number; addOnSubtotal: number }>();
  for (const item of items) {
    if (!item.designKey) continue;
    const group = ctlGroups.get(item.designKey) || { totalQty: 0, teeQty: 0, addOnSubtotal: 0 };
    group.totalQty += item.quantity;
    if (item.isTee) {
      group.teeQty += item.quantity;
    } else {
      group.addOnSubtotal += item.price * item.quantity;
    }
    ctlGroups.set(item.designKey, group);
  }

  for (const group of ctlGroups.values()) {
    if (group.teeQty < 1 || group.addOnSubtotal <= 0) continue;
    const tier = CTL_TIERS.find(t => group.totalQty >= t.min);
    if (!tier) continue;
    totalSavings += group.addOnSubtotal * (tier.pct / 100);
  }

  return Math.round(totalSavings * 100) / 100;
}

/* ------------------------------------------------------------------ */
/*  Shopify Client Credentials auth + GraphQL Admin API               */
/* ------------------------------------------------------------------ */

const SHOPIFY_DOMAIN = "sullenclothing.myshopify.com";
const SHOPIFY_API_VERSION = "2026-01";

let _cachedToken: string | null = null;
let _tokenExpiry = 0;

async function getShopifyAccessToken(): Promise<string> {
  if (_cachedToken && Date.now() < _tokenExpiry) return _cachedToken;

  const clientId = Deno.env.get("SHOPIFY_APP_CLIENT_ID");
  const clientSecret = Deno.env.get("SHOPIFY_APP_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("SHOPIFY_APP_CLIENT_ID and SHOPIFY_APP_CLIENT_SECRET are required");
  }

  const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Shopify OAuth error:", res.status, body);
    throw new Error(`Failed to obtain Shopify access token: ${res.status} — ${body}`);
  }

  const data = await res.json();
  _cachedToken = data.access_token;
  _tokenExpiry = Date.now() + 55 * 60 * 1000;
  return _cachedToken!;
}

async function shopifyGraphQL(query: string, variables: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  const token = await getShopifyAccessToken();
  const res = await fetch(
    `https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Shopify GraphQL ${res.status}: ${body}`);
  }
  return res.json();
}

/* ------------------------------------------------------------------ */
/*  Promo code validation helper                                      */
/* ------------------------------------------------------------------ */

async function lookupPromoCodeValue(promoCode: string, cartSubtotal: number): Promise<{ amount: number; discountNodeId: string | null }> {
  try {
    const safeCode = promoCode.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const lookupQuery = `{
      codeDiscountNodeByCode(code: "${safeCode}") {
        id
        codeDiscount {
          ... on DiscountCodeBasic {
            title
            status
            usageLimit
            asyncUsageCount
            customerGets {
              value {
                ... on DiscountAmount { amount { amount } }
                ... on DiscountPercentage { percentage }
              }
            }
          }
        }
      }
    }`;

    const result = await shopifyGraphQL(lookupQuery) as {
      data?: {
        codeDiscountNodeByCode?: {
          id: string;
          codeDiscount?: {
            status?: string;
            usageLimit?: number;
            asyncUsageCount?: number;
            customerGets?: {
              value?: {
                amount?: { amount: string };
                percentage?: number;
              };
            };
          };
        };
      };
    };

    const node = result?.data?.codeDiscountNodeByCode;
    const discount = node?.codeDiscount;

    if (!discount || discount.status !== "ACTIVE") {
      console.warn(`[Bundle] Promo code "${promoCode}" not found or inactive`);
      return { amount: 0, discountNodeId: null };
    }

    // Check usage limit
    if (discount.usageLimit && discount.asyncUsageCount !== undefined && discount.asyncUsageCount >= discount.usageLimit) {
      console.warn(`[Bundle] Promo code "${promoCode}" usage limit reached`);
      return { amount: 0, discountNodeId: null };
    }

    const fixedAmount = parseFloat(discount.customerGets?.value?.amount?.amount || "0");
    if (fixedAmount > 0) {
      console.log(`[Bundle] Promo code "${promoCode}" validated: $${fixedAmount} off`);
      return { amount: fixedAmount, discountNodeId: node!.id };
    }

    const pct = discount.customerGets?.value?.percentage;
    if (pct && pct > 0) {
      const pctAmount = Math.round(cartSubtotal * pct * 100) / 100;
      console.log(`[Bundle] Promo code "${promoCode}" validated: ${pct * 100}% = $${pctAmount} off`);
      return { amount: pctAmount, discountNodeId: node!.id };
    }

    return { amount: 0, discountNodeId: null };
  } catch (e) {
    console.error(`[Bundle] Failed to validate promo code "${promoCode}":`, e);
    return { amount: 0, discountNodeId: null };
  }
}

/* ------------------------------------------------------------------ */
/*  Main handler                                                      */
/* ------------------------------------------------------------------ */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { items, cartId, promoCode } = (await req.json()) as {
      items: CartLineItem[];
      cartId: string;
      promoCode?: string;
    };

    if (!items || !cartId) {
      return new Response(
        JSON.stringify({ error: "items and cartId are required" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const bundleRules = await loadBundleRules();

    // Look up real prices for free gift items
    const freeGiftItems = items.filter(i => i.isFreeGift);
    const freeGiftPrices: Record<string, number> = {};
    for (const gift of freeGiftItems) {
      if (gift.price > 0) {
        freeGiftPrices[gift.variantId] = gift.price;
      }
      try {
        const priceQuery = `{
          node(id: "${gift.variantId}") {
            ... on ProductVariant { price }
          }
        }`;
        const result = await shopifyGraphQL(priceQuery) as { data?: { node?: { price?: string } } };
        const realPrice = parseFloat(result?.data?.node?.price || "0");
        if (realPrice > 0) {
          freeGiftPrices[gift.variantId] = realPrice;
          console.log(`[Bundle] Free gift ${gift.variantId} real price: $${realPrice}`);
        }
      } catch (e) {
        console.error(`[Bundle] Failed to fetch free gift price for ${gift.variantId}, using client fallback: $${freeGiftPrices[gift.variantId] ?? 0}`, e);
      }
    }

    let savings = calcBundleSavings(items, bundleRules, freeGiftPrices);

    // If customer supplied a promo/rewards code, look up its value and fold it in
    // EXCEPT for non-stackable codes — these must be applied separately at checkout
    // Explicitly non-stackable codes + any percentage code over 20% is auto-blocked
    const NON_STACKABLE_CODES = ["SULLENFAMILY50", "SULLENFAMILY40", "SULLENANGEL", "FANDF", "OCHAWIN50"];
    const NON_STACKABLE_PCT_THRESHOLD = 0.20; // codes > 20% are non-stackable
    let promoAmount = 0;
    let promoValidated = false;
    let promoNonStackable = false;

    if (promoCode?.trim()) {
      const upperCode = promoCode.trim().toUpperCase();

      if (NON_STACKABLE_CODES.includes(upperCode)) {
        promoNonStackable = true;
        console.log(`[Bundle] Promo "${promoCode}" is in non-stackable list, skipping consolidation`);
      } else {
        // Look up the code to check its percentage before deciding
        const cartSubtotal = items
          .filter(i => !i.isFreeGift)
          .reduce((sum, i) => sum + i.price * i.quantity, 0);

        // Peek at the discount to check if it's a high-percentage code
        const safeCode = promoCode.trim().replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        const peekQuery = `{
          codeDiscountNodeByCode(code: "${safeCode}") {
            id
            codeDiscount {
              ... on DiscountCodeBasic {
                status
                usageLimit
                asyncUsageCount
                customerGets {
                  value {
                    ... on DiscountAmount { amount { amount } }
                    ... on DiscountPercentage { percentage }
                  }
                }
              }
            }
          }
        }`;
        const peekResult = await shopifyGraphQL(peekQuery) as {
          data?: { codeDiscountNodeByCode?: { id: string; codeDiscount?: { status?: string; usageLimit?: number; asyncUsageCount?: number; customerGets?: { value?: { amount?: { amount: string }; percentage?: number } } } } }
        };
        const peekDiscount = peekResult?.data?.codeDiscountNodeByCode?.codeDiscount;
        const peekPct = peekDiscount?.customerGets?.value?.percentage ?? 0;

        if (peekPct > NON_STACKABLE_PCT_THRESHOLD) {
          promoNonStackable = true;
          console.log(`[Bundle] Promo "${promoCode}" is ${peekPct * 100}% (>${NON_STACKABLE_PCT_THRESHOLD * 100}%), non-stackable`);
        } else if (peekDiscount && peekDiscount.status === "ACTIVE") {
          // Code is valid and stackable — calculate its value
          const fixedAmt = parseFloat(peekDiscount.customerGets?.value?.amount?.amount || "0");
          if (fixedAmt > 0) {
            promoAmount = fixedAmt;
          } else if (peekPct > 0) {
            promoAmount = Math.round(cartSubtotal * peekPct * 100) / 100;
          }

          // Check usage limits
          if (peekDiscount.usageLimit && peekDiscount.asyncUsageCount !== undefined && peekDiscount.asyncUsageCount >= peekDiscount.usageLimit) {
            promoAmount = 0;
          }

          promoValidated = promoAmount > 0;
          savings += promoAmount;
          console.log(`[Bundle] Promo "${promoCode}" stackable: $${promoAmount}`);
        }
      }
    }

    if (savings <= 0) {
      return new Response(
        JSON.stringify({
          discount_code: null,
          savings: 0,
          promo_valid: promoCode ? false : undefined,
          promo_non_stackable: promoNonStackable || undefined,
        }),
        { headers: jsonHeaders }
      );
    }

    const code = `BUNDLE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const endsAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const mutation = `
      mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
        discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
          codeDiscountNode { id }
          userErrors { field code message }
        }
      }
    `;

    const titleParts = ["Bundle Consolidation"];
    if (promoValidated) titleParts.push(`+ Promo ${promoCode}`);
    titleParts.push(`- ${code}`);

    const variables = {
      basicCodeDiscount: {
        title: titleParts.join(" "),
        code,
        startsAt: new Date().toISOString(),
        endsAt,
        usageLimit: 1,
        appliesOncePerCustomer: true,
        customerSelection: { all: true },
        customerGets: {
          value: { discountAmount: { amount: savings.toFixed(2), appliesOnEachItem: false } },
          items: { all: true },
        },
      },
    };

    const result = await shopifyGraphQL(mutation, variables) as {
      data?: {
        discountCodeBasicCreate?: {
          codeDiscountNode?: { id: string };
          userErrors?: Array<{ field: string[]; code: string; message: string }>;
        };
      };
      errors?: Array<{ message: string }>;
    };

    if (result.errors?.length) {
      console.error("GraphQL errors:", JSON.stringify(result.errors));
      return new Response(
        JSON.stringify({ error: "Shopify API error", detail: result.errors[0].message }),
        { status: 500, headers: jsonHeaders }
      );
    }

    const userErrors = result.data?.discountCodeBasicCreate?.userErrors || [];
    if (userErrors.length > 0) {
      console.error("Discount creation errors:", JSON.stringify(userErrors));
      return new Response(
        JSON.stringify({ error: "Failed to create discount", detail: userErrors[0].message }),
        { status: 500, headers: jsonHeaders }
      );
    }

    const discountId = result.data?.discountCodeBasicCreate?.codeDiscountNode?.id;
    console.log(`Created bundle code ${code} for $${savings.toFixed(2)}${promoValidated ? ` (includes $${promoAmount} promo)` : ""} (discount: ${discountId})`);

    return new Response(
      JSON.stringify({
        discount_code: code,
        savings,
        promo_valid: promoCode ? promoValidated : undefined,
        promo_amount: promoValidated ? promoAmount : undefined,
        promo_non_stackable: promoNonStackable || undefined,
      }),
      { headers: jsonHeaders }
    );
  } catch (err) {
    console.error("Consolidate bundle error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
