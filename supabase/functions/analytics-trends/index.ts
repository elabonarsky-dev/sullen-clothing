import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ShopifyOrder {
  id: number;
  name: string;
  email: string;
  created_at: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  total_shipping_price_set?: { shop_money?: { amount: string } };
  financial_status: string;
  fulfillment_status: string | null;
  source_name: string | null;
  line_items: Array<{
    title: string;
    product_id: number;
    quantity: number;
    price: string;
  }>;
  customer?: { id: number; orders_count: number };
  discount_codes?: Array<{ code: string; amount: string; type: string }>;
  refunds?: Array<{ created_at: string; transactions: Array<{ amount: string }> }>;
}

async function fetchShopifyOrders(since: string, shopDomain: string, token: string, until?: string): Promise<ShopifyOrder[]> {
  const allOrders: ShopifyOrder[] = [];
  let baseUrl =
    `https://${shopDomain}/admin/api/2025-01/orders.json?status=any&created_at_min=${since}&limit=250&fields=id,name,email,created_at,total_price,subtotal_price,total_tax,total_shipping_price_set,financial_status,fulfillment_status,source_name,line_items,customer,discount_codes,refunds`;
  if (until) {
    baseUrl += `&created_at_max=${until}`;
  }
  let url: string | null = baseUrl;

  while (url) {
    const res = await fetch(url, {
      headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
    });
    if (!res.ok) {
      console.error("Shopify orders fetch failed:", res.status, await res.text());
      break;
    }
    const json = await res.json();
    allOrders.push(...(json.orders || []));

    // Pagination
    const linkHeader = res.headers.get("link");
    const nextMatch = linkHeader?.match(/<([^>]+)>;\s*rel="next"/);
    url = nextMatch ? nextMatch[1] : null;
  }

  return allOrders;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: roleData } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const customStart = url.searchParams.get("start"); // YYYY-MM-DD
    const customEnd = url.searchParams.get("end");     // YYYY-MM-DD
    const days = parseInt(url.searchParams.get("days") || "30");
    const compareMode = url.searchParams.get("compare"); // "yoy" for year-over-year

    let since: string;
    let until: string; // end of current period
    let prevSince: string;
    let prevUntil: string; // end of previous period

    // Store timezone: America/Los_Angeles (Pacific)
    // PDT = UTC-7, PST = UTC-8. Use a helper to get the correct offset.
    const STORE_TZ_OFFSET_HOURS = (() => {
      // Determine if a date is in PDT or PST
      // PDT: 2nd Sunday in March to 1st Sunday in November
      const now = new Date();
      const jan = new Date(now.getFullYear(), 0, 1);
      const jul = new Date(now.getFullYear(), 6, 1);
      const stdOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
      // For server-side (UTC), we calculate manually
      // March 2026: DST starts March 8 (2nd Sunday), ends Nov 1
      // Simple approach: check if current month is in DST range
      const month = now.getUTCMonth(); // 0-indexed
      const day = now.getUTCDate();
      // Rough DST check for US Pacific: March 8 - Nov 1
      if (month > 2 && month < 10) return -7; // Apr-Oct = PDT
      if (month === 2 && day >= 8) return -7; // March after 8th
      if (month === 10 && day < 1) return -7; // Nov before 1st
      return -8; // PST
    })();

    // Convert a YYYY-MM-DD date string to UTC ISO string representing start of that day in store timezone
    const dayStartUTC = (dateStr: string): string => {
      const [y, m, d] = dateStr.split("-").map(Number);
      const utcHour = -STORE_TZ_OFFSET_HOURS; // e.g. PDT -7 → midnight PDT = 07:00 UTC
      return new Date(Date.UTC(y, m - 1, d, utcHour, 0, 0, 0)).toISOString();
    };

    // End of day in store timezone
    const dayEndUTC = (dateStr: string): string => {
      const [y, m, d] = dateStr.split("-").map(Number);
      const utcHour = -STORE_TZ_OFFSET_HOURS + 23;
      return new Date(Date.UTC(y, m - 1, d, utcHour, 59, 59, 999)).toISOString();
    };

    if (customStart && customEnd) {
      since = dayStartUTC(customStart);
      until = dayEndUTC(customEnd);
      const s = new Date(customStart);
      const e = new Date(customEnd);

      if (compareMode === "yoy") {
        const prevS = new Date(s);
        prevS.setFullYear(prevS.getFullYear() - 1);
        const prevE = new Date(e);
        prevE.setFullYear(prevE.getFullYear() - 1);
        prevSince = dayStartUTC(prevS.toISOString().slice(0, 10));
        prevUntil = dayEndUTC(prevE.toISOString().slice(0, 10));
      } else if (compareMode === "mom") {
        const prevS = new Date(s);
        prevS.setMonth(prevS.getMonth() - 1);
        const prevE = new Date(e);
        prevE.setMonth(prevE.getMonth() - 1);
        prevSince = dayStartUTC(prevS.toISOString().slice(0, 10));
        prevUntil = dayEndUTC(prevE.toISOString().slice(0, 10));
      } else if (compareMode === "dod") {
        // Same day(s) last week
        const prevS = new Date(s.getTime() - 7 * 86400000);
        const prevE = new Date(e.getTime() - 7 * 86400000);
        prevSince = dayStartUTC(prevS.toISOString().slice(0, 10));
        prevUntil = dayEndUTC(prevE.toISOString().slice(0, 10));
      } else {
        const rangeDays = Math.ceil((e.getTime() - s.getTime()) / 86400000) + 1;
        const prevEnd = new Date(s.getTime() - 86400000);
        const prevStart = new Date(prevEnd.getTime() - (rangeDays - 1) * 86400000);
        prevSince = dayStartUTC(prevStart.toISOString().slice(0, 10));
        prevUntil = dayEndUTC(prevEnd.toISOString().slice(0, 10));
      }
    } else {
      // Fallback for days-based (shouldn't happen with new frontend, but keep for safety)
      since = new Date(Date.now() - days * 86400000).toISOString();
      until = new Date().toISOString();

      if (compareMode === "yoy") {
        const s = new Date(Date.now() - days * 86400000);
        const prevS = new Date(s);
        prevS.setFullYear(prevS.getFullYear() - 1);
        prevSince = prevS.toISOString();
        const prevE = new Date();
        prevE.setFullYear(prevE.getFullYear() - 1);
        prevUntil = prevE.toISOString();
      } else {
        prevSince = new Date(Date.now() - days * 2 * 86400000).toISOString();
        prevUntil = since;
      }
    }

    // Shopify config
    const shopDomain = "sullenclothing.myshopify.com";
    let shopifyToken = Deno.env.get("SHOPIFY_ACCESS_TOKEN") || "";
    try {
      const { data: tokenSetting } = await admin
        .from("site_settings").select("value").eq("key", "shopify_returns_token").single();
      if (tokenSetting?.value) shopifyToken = tokenSetting.value;
    } catch (_) { /* use env var */ }

    // Run all queries in parallel
    const [
      backInStockRes,
      wishlistRes,
      reviewsRes,
      issueLogsRes,
      issuePatternsRes,
      rewardTxRes,
      vaultMembersRes,
      orderTrackingRes,
      shopifyOrders,
      shopifyPrevOrders,
    ] = await Promise.all([
      admin
        .from("back_in_stock_requests")
        .select("product_handle, product_title, created_at")
        .gte("created_at", since)
        .lte("created_at", until)
        .order("created_at", { ascending: false })
        .range(0, 5999),
      admin
        .from("wishlists")
        .select("product_handle, product_title, created_at")
        .gte("created_at", since)
        .lte("created_at", until)
        .order("created_at", { ascending: false })
        .range(0, 5999),
      admin
        .from("reviews")
        .select("product_handle, product_title, rating, status, created_at")
        .gte("created_at", since)
        .lte("created_at", until)
        .order("created_at", { ascending: false })
        .range(0, 5999),
      admin
        .from("issue_logs")
        .select("category, source, created_at, order_number, customer_email")
        .gte("created_at", since)
        .lte("created_at", until)
        .order("created_at", { ascending: false })
        .range(0, 5999),
      admin
        .from("issue_patterns")
        .select("category, title, occurrence_count, status, first_seen_at, last_seen_at")
        .eq("status", "active")
        .order("occurrence_count", { ascending: false })
        .limit(20),
      admin
        .from("reward_transactions")
        .select("type, points, created_at, multiplier")
        .gte("created_at", since)
        .lte("created_at", until)
        .order("created_at", { ascending: false })
        .range(0, 9999),
      admin
        .from("vault_members")
        .select("current_tier, lifetime_spend, annual_spend, points_frozen, created_at")
        .range(0, 9999),
      admin
        .from("order_tracking")
        .select("status, carrier, shipped_at, delivered_at, created_at", { count: "exact" })
        .not("shipped_at", "is", null)
        .gte("shipped_at", since)
        .lte("shipped_at", until)
        .range(0, 5999),
      // Shopify orders for current period (with end date)
      shopifyToken ? fetchShopifyOrders(since, shopDomain, shopifyToken, until) : Promise.resolve([]),
      // Shopify orders for previous period (with end date)
      shopifyToken ? fetchShopifyOrders(prevSince, shopDomain, shopifyToken, prevUntil) : Promise.resolve([]),
    ]);

    // =========== COMMERCE METRICS (Shopify) ===========
    console.log("Analytics debug:", {
      since, until, prevSince, prevUntil,
      totalShopifyOrders: shopifyOrders.length,
      prevShopifyOrders: shopifyPrevOrders.length,
      sampleOrderDates: shopifyOrders.slice(0, 3).map(o => ({ id: o.name, created: o.created_at, total: o.total_price, status: o.financial_status })),
    });
    const paidOrders = shopifyOrders.filter(o => o.financial_status !== "voided" && o.financial_status !== "refunded");
    const prevPaidOrders = shopifyPrevOrders.filter(o => o.financial_status !== "voided" && o.financial_status !== "refunded");

    const totalRevenue = paidOrders.reduce((s, o) => s + parseFloat(o.total_price || "0"), 0);
    const prevRevenue = prevPaidOrders.reduce((s, o) => s + parseFloat(o.total_price || "0"), 0);
    console.log("Revenue debug:", { paidOrderCount: paidOrders.length, totalRevenue, prevPaidCount: prevPaidOrders.length, prevRevenue });
    const totalOrders = paidOrders.length;
    const prevTotalOrders = prevPaidOrders.length;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const prevAov = prevTotalOrders > 0 ? prevRevenue / prevTotalOrders : 0;

    // Total refund amount
    const totalRefunds = shopifyOrders.reduce((s, o) => {
      return s + (o.refunds || []).reduce((rs, r) =>
        rs + r.transactions.reduce((ts, t) => ts + parseFloat(t.amount || "0"), 0), 0);
    }, 0);
    const prevRefunds = shopifyPrevOrders.reduce((s, o) => {
      return s + (o.refunds || []).reduce((rs, r) =>
        rs + r.transactions.reduce((ts, t) => ts + parseFloat(t.amount || "0"), 0), 0);
    }, 0);

    // Sales breakdown: gross, discounts, shipping, tax
    const calcBreakdown = (orders: ShopifyOrder[]) => {
      let grossSales = 0;
      let discounts = 0;
      let shipping = 0;
      let taxes = 0;
      orders.forEach(o => {
        if (o.financial_status === "voided" || o.financial_status === "refunded") return;
        grossSales += parseFloat(o.subtotal_price || "0");
        discounts += (o.discount_codes || []).reduce((s, d) => s + parseFloat(d.amount || "0"), 0);
        shipping += parseFloat(o.total_shipping_price_set?.shop_money?.amount || "0");
        taxes += parseFloat(o.total_tax || "0");
      });
      const refunds = orders.reduce((s, o) => s + (o.refunds || []).reduce((rs, r) =>
        rs + r.transactions.reduce((ts, t) => ts + parseFloat(t.amount || "0"), 0), 0), 0);
      const netSales = grossSales - discounts - refunds;
      const totalSales = netSales + shipping + taxes;
      return {
        grossSales: Math.round(grossSales * 100) / 100,
        discounts: Math.round(discounts * 100) / 100,
        returns: Math.round(refunds * 100) / 100,
        netSales: Math.round(netSales * 100) / 100,
        shipping: Math.round(shipping * 100) / 100,
        taxes: Math.round(taxes * 100) / 100,
        totalSales: Math.round(totalSales * 100) / 100,
      };
    };
    const salesBreakdown = calcBreakdown(shopifyOrders);
    const prevSalesBreakdown = calcBreakdown(shopifyPrevOrders);

    const customerIds = new Set<number>();
    const repeatCustomerIds = new Set<number>();
    paidOrders.forEach(o => {
      if (o.customer?.id) {
        customerIds.add(o.customer.id);
        if ((o.customer.orders_count || 0) > 1) {
          repeatCustomerIds.add(o.customer.id);
        }
      }
    });
    const uniqueCustomers = customerIds.size;
    const repeatRate = uniqueCustomers > 0 ? Math.round((repeatCustomerIds.size / uniqueCustomers) * 100) : 0;

    // Discount usage
    let ordersWithDiscount = 0;
    let totalDiscountAmount = 0;
    const discountCodeMap = new Map<string, { code: string; type: string; uses: number; totalAmount: number; orders: number }>();
    paidOrders.forEach(o => {
      if (o.discount_codes && o.discount_codes.length > 0) {
        ordersWithDiscount++;
        totalDiscountAmount += o.discount_codes.reduce((s, d) => s + parseFloat(d.amount || "0"), 0);
        o.discount_codes.forEach(d => {
          const key = d.code.toUpperCase();
          if (!discountCodeMap.has(key)) discountCodeMap.set(key, { code: d.code.toUpperCase(), type: d.type || "unknown", uses: 0, totalAmount: 0, orders: 0 });
          const entry = discountCodeMap.get(key)!;
          entry.uses++;
          entry.totalAmount += parseFloat(d.amount || "0");
          entry.orders++;
        });
      }
    });
    const discountBreakdown = Array.from(discountCodeMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 20);

    // Determine if this is a single-day view (hourly granularity)
    const isSingleDay = customStart && customEnd && customStart === customEnd;

    // Daily (or hourly) revenue trend (current period)
    const dailyRevenueMap = new Map<string, { revenue: number; orders: number; refunds: number }>();
    paidOrders.forEach(o => {
      const key = isSingleDay
        ? (() => {
            const d = new Date(o.created_at);
            const utcH = d.getUTCHours();
            const localH = (utcH + 24 + STORE_TZ_OFFSET_HOURS) % 24;
            return `${String(localH).padStart(2, "0")}:00`;
          })()
        : o.created_at.slice(0, 10);
      if (!dailyRevenueMap.has(key)) dailyRevenueMap.set(key, { revenue: 0, orders: 0, refunds: 0 });
      const d = dailyRevenueMap.get(key)!;
      d.revenue += parseFloat(o.total_price || "0");
      d.orders++;
    });
    shopifyOrders.forEach(o => {
      (o.refunds || []).forEach(r => {
        const key = isSingleDay
          ? (() => {
              const d = new Date(r.created_at);
              const utcH = d.getUTCHours();
              const localH = (utcH + 24 + STORE_TZ_OFFSET_HOURS) % 24;
              return `${String(localH).padStart(2, "0")}:00`;
            })()
          : r.created_at.slice(0, 10);
        if (!dailyRevenueMap.has(key)) dailyRevenueMap.set(key, { revenue: 0, orders: 0, refunds: 0 });
        dailyRevenueMap.get(key)!.refunds += r.transactions.reduce((s, t) => s + parseFloat(t.amount || "0"), 0);
      });
    });

    // For single-day, fill all 24 hours so the chart has a full x-axis
    if (isSingleDay) {
      for (let h = 0; h < 24; h++) {
        const key = `${String(h).padStart(2, "0")}:00`;
        if (!dailyRevenueMap.has(key)) dailyRevenueMap.set(key, { revenue: 0, orders: 0, refunds: 0 });
      }
    }

    const dailyRevenue = Array.from(dailyRevenueMap.entries())
      .map(([date, d]) => ({
        date,
        ...d,
        aov: d.orders > 0 ? Math.round((d.revenue / d.orders) * 100) / 100 : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Previous period daily/hourly data (for dashed comparison overlay)
    const prevDailyMap = new Map<string, { revenue: number; orders: number; aov: number }>();
    prevPaidOrders.forEach(o => {
      const key = isSingleDay
        ? (() => {
            const d = new Date(o.created_at);
            const utcH = d.getUTCHours();
            const localH = (utcH + 24 + STORE_TZ_OFFSET_HOURS) % 24;
            return `${String(localH).padStart(2, "0")}:00`;
          })()
        : o.created_at.slice(0, 10);
      if (!prevDailyMap.has(key)) prevDailyMap.set(key, { revenue: 0, orders: 0, aov: 0 });
      const d = prevDailyMap.get(key)!;
      d.revenue += parseFloat(o.total_price || "0");
      d.orders++;
    });
    // Calculate AOV per bucket
    prevDailyMap.forEach(d => { d.aov = d.orders > 0 ? Math.round((d.revenue / d.orders) * 100) / 100 : 0; });
    // Align prev dates to current period dates by index
    const prevDailySorted = Array.from(prevDailyMap.entries())
      .map(([date, d]) => ({ date, ...d }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const prevDailyRevenue = dailyRevenue.map((curr, i) => {
      // For hourly mode, match by same hour key; for daily, match by index
      const prev = isSingleDay
        ? prevDailySorted.find(p => p.date === curr.date)
        : prevDailySorted[i];
      return {
        date: curr.date,
        prevDate: prev?.date ?? null,
        prevRevenue: prev?.revenue ?? 0,
        prevOrders: prev?.orders ?? 0,
        prevAov: prev?.aov ?? 0,
      };
    });

    // Sales channel breakdown — map Shopify source_name to friendly labels
    const CHANNEL_LABELS: Record<string, string> = {
      web: "Online Store",
      pos: "POS",
      shopify_draft_order: "Draft Orders",
      iphone: "iPhone App",
      android: "Android App",
      tiktok: "TikTok",
      facebook: "Facebook",
      instagram: "Instagram",
      google: "Google",
      pinterest: "Pinterest",
      buy_button: "Buy Button",
      // Known Shopify app IDs
      "580111": "Online Store",
      "1520611": "Shop App",
      "3890849": "Headless / Custom Storefront",
      "278891167745": "Google & YouTube",
      "975680": "Facebook & Instagram",
      "6571367489": "TikTok",
      "517850977": "Point of Sale",
      "346745": "Hydrogen / Custom App",
      "510996486657": "Pinterest",
      "2329312": "Loop Returns",
      "1662707": "ReCharge Subscriptions",
    };
    const friendlyChannel = (raw: string): string => {
      if (CHANNEL_LABELS[raw.toLowerCase()]) return CHANNEL_LABELS[raw.toLowerCase()];
      if (CHANNEL_LABELS[raw]) return CHANNEL_LABELS[raw];
      if (/^\d+$/.test(raw)) return `Shopify App (${raw})`;
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    };
    // Log unique raw source names for debugging
    const rawSources = new Set(paidOrders.map(o => o.source_name || "web"));
    console.log("Raw sales channel source_names:", Array.from(rawSources));
    const channelMap = new Map<string, { channel: string; revenue: number; orders: number }>();
    paidOrders.forEach(o => {
      const ch = friendlyChannel(o.source_name || "web");
      if (!channelMap.has(ch)) channelMap.set(ch, { channel: ch, revenue: 0, orders: 0 });
      const d = channelMap.get(ch)!;
      d.revenue += parseFloat(o.total_price || "0");
      d.orders++;
    });
    const salesChannels = Array.from(channelMap.values())
      .sort((a, b) => b.revenue - a.revenue);

    // Top products by revenue
    const productRevenueMap = new Map<string, { title: string; revenue: number; unitsSold: number }>();
    paidOrders.forEach(o => {
      o.line_items.forEach(li => {
        const key = String(li.product_id || li.title);
        if (!productRevenueMap.has(key)) productRevenueMap.set(key, { title: li.title, revenue: 0, unitsSold: 0 });
        const d = productRevenueMap.get(key)!;
        d.revenue += parseFloat(li.price) * li.quantity;
        d.unitsSold += li.quantity;
      });
    });
    const topSellingProducts = Array.from(productRevenueMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15);

    // Fulfillment breakdown
    let fulfilledCount = 0;
    let unfulfilled = 0;
    let partiallyFulfilled = 0;
    paidOrders.forEach(o => {
      if (o.fulfillment_status === "fulfilled") fulfilledCount++;
      else if (o.fulfillment_status === "partial") partiallyFulfilled++;
      else unfulfilled++;
    });

    const pctChange = (curr: number, prev: number) =>
      prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0;

    const commerce = {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      prevRevenue: Math.round(prevRevenue * 100) / 100,
      revenueChange: pctChange(totalRevenue, prevRevenue),
      totalOrders,
      prevTotalOrders,
      ordersChange: pctChange(totalOrders, prevTotalOrders),
      aov: Math.round(aov * 100) / 100,
      prevAov: Math.round(prevAov * 100) / 100,
      aovChange: pctChange(aov, prevAov),
      totalRefunds: Math.round(totalRefunds * 100) / 100,
      uniqueCustomers,
      repeatRate,
      ordersWithDiscount,
      discountRate: totalOrders > 0 ? Math.round((ordersWithDiscount / totalOrders) * 100) : 0,
      totalDiscountAmount: Math.round(totalDiscountAmount * 100) / 100,
      fulfillment: { fulfilled: fulfilledCount, unfulfilled, partial: partiallyFulfilled },
      dailyRevenue,
      prevDailyRevenue,
      salesChannels,
      topSellingProducts,
      discountBreakdown,
      salesBreakdown,
      prevSalesBreakdown,
    };

    // =========== EXISTING: Product Demand ===========
    const demandMap = new Map<string, { title: string; bis: number; wishlist: number; reviews: number; avgRating: number; totalRating: number }>();
    const ensureProduct = (handle: string, title: string) => {
      if (!demandMap.has(handle)) {
        demandMap.set(handle, { title, bis: 0, wishlist: 0, reviews: 0, avgRating: 0, totalRating: 0 });
      }
    };
    (backInStockRes.data || []).forEach((r) => { ensureProduct(r.product_handle, r.product_title); demandMap.get(r.product_handle)!.bis++; });
    (wishlistRes.data || []).forEach((r) => { ensureProduct(r.product_handle, r.product_title); demandMap.get(r.product_handle)!.wishlist++; });
    (reviewsRes.data || []).forEach((r) => {
      ensureProduct(r.product_handle, r.product_title);
      const d = demandMap.get(r.product_handle)!;
      d.reviews++;
      d.totalRating += r.rating;
    });
    demandMap.forEach((v) => { v.avgRating = v.reviews > 0 ? Math.round((v.totalRating / v.reviews) * 10) / 10 : 0; });
    const productDemand = Array.from(demandMap.entries())
      .map(([handle, d]) => ({ handle, ...d, score: d.bis * 3 + d.wishlist * 2 + d.reviews }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 25);

    // =========== EXISTING: Daily trends ===========
    const dailyMap = new Map<string, { bis: number; wishlist: number; reviews: number; issues: number; points_earned: number; points_redeemed: number }>();
    const ensureDay = (dateStr: string) => {
      const day = dateStr.slice(0, 10);
      if (!dailyMap.has(day)) dailyMap.set(day, { bis: 0, wishlist: 0, reviews: 0, issues: 0, points_earned: 0, points_redeemed: 0 });
      return day;
    };
    (backInStockRes.data || []).forEach((r) => { dailyMap.get(ensureDay(r.created_at))!.bis++; });
    (wishlistRes.data || []).forEach((r) => { dailyMap.get(ensureDay(r.created_at))!.wishlist++; });
    (reviewsRes.data || []).forEach((r) => { dailyMap.get(ensureDay(r.created_at))!.reviews++; });
    (issueLogsRes.data || []).forEach((r) => { dailyMap.get(ensureDay(r.created_at))!.issues++; });
    (rewardTxRes.data || []).forEach((r) => {
      const day = ensureDay(r.created_at);
      const d = dailyMap.get(day)!;
      if (r.points > 0) d.points_earned += r.points;
      else d.points_redeemed += Math.abs(r.points);
    });
    const dailyTrends = Array.from(dailyMap.entries())
      .map(([date, d]) => ({ date, ...d }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // =========== EXISTING: Issues, loyalty, tiers, shipping ===========
    const issueCategoryMap = new Map<string, number>();
    (issueLogsRes.data || []).forEach((r) => {
      const cat = r.category || "uncategorized";
      issueCategoryMap.set(cat, (issueCategoryMap.get(cat) || 0) + 1);
    });
    const issueBreakdown = Array.from(issueCategoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const rewardTypes = new Map<string, { count: number; totalPoints: number }>();
    (rewardTxRes.data || []).forEach((r) => {
      if (!rewardTypes.has(r.type)) rewardTypes.set(r.type, { count: 0, totalPoints: 0 });
      const t = rewardTypes.get(r.type)!;
      t.count++;
      t.totalPoints += r.points;
    });
    const loyaltyBreakdown = Array.from(rewardTypes.entries())
      .map(([type, d]) => ({ type, ...d }))
      .sort((a, b) => b.count - a.count);

    const tierMap = new Map<string, number>();
    (vaultMembersRes.data || []).forEach((m) => {
      const tier = m.current_tier || "none";
      tierMap.set(tier, (tierMap.get(tier) || 0) + 1);
    });
    const tierDistribution = Array.from(tierMap.entries())
      .map(([tier, count]) => ({ tier, count }))
      .sort((a, b) => b.count - a.count);

    const shippingStatusMap = new Map<string, number>();
    const trackingData = orderTrackingRes.data || [];
    console.log("Shipping debug:", { trackingCount: trackingData.length, error: orderTrackingRes.error, sample: trackingData.slice(0, 2) });
    trackingData.forEach((o) => { shippingStatusMap.set(o.status, (shippingStatusMap.get(o.status) || 0) + 1); });
    const shippingHealth = Array.from(shippingStatusMap.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    let placedToDeliveredDays: number[] = [];
    let placedToFulfilledDays: number[] = [];
    let fulfilledToDeliveredDays: number[] = [];
    trackingData.forEach((o) => {
      const shipped = o.shipped_at ? new Date(o.shipped_at).getTime() : null;
      const delivered = o.delivered_at ? new Date(o.delivered_at).getTime() : null;
      if (shipped && delivered) {
        const transitDiff = (delivered - shipped) / 86400000;
        if (transitDiff >= 0) fulfilledToDeliveredDays.push(transitDiff);
      }
    });
    const avg = (arr: number[]) => arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;
    const deliveredCount = trackingData.filter((o) => o.delivered_at).length;
    const shippingPerformance = {
      avgPlacedToDelivered: null as number | null,
      avgPlacedToFulfilled: null as number | null,
      avgFulfilledToDelivered: avg(fulfilledToDeliveredDays),
      totalShipped: trackingData.length,
      totalDelivered: deliveredCount,
    };

    // Summary cards
    const totalIssues = issueLogsRes.data?.length || 0;
    const identifiedIssues = (issueLogsRes.data || []).filter((l) => l.customer_email || l.order_number).length;
    const totalReviews = reviewsRes.data?.length || 0;
    const avgRating = totalReviews > 0
      ? Math.round(((reviewsRes.data || []).reduce((s, r) => s + r.rating, 0) / totalReviews) * 10) / 10
      : 0;
    const totalPointsEarned = (rewardTxRes.data || []).filter((t) => t.points > 0).reduce((s, t) => s + t.points, 0);
    const totalPointsRedeemed = Math.abs((rewardTxRes.data || []).filter((t) => t.points < 0).reduce((s, t) => s + t.points, 0));
    const totalMembers = vaultMembersRes.data?.length || 0;
    const frozenMembers = (vaultMembersRes.data || []).filter((m) => m.points_frozen).length;

    const result = {
      period: { days, since },
      commerce,
      summary: {
        totalIssues,
        identifiedIssues,
        totalReviews,
        avgRating,
        totalPointsEarned,
        totalPointsRedeemed,
        totalMembers,
        frozenMembers,
        totalBackInStock: backInStockRes.data?.length || 0,
        totalWishlistAdds: wishlistRes.data?.length || 0,
      },
      productDemand,
      dailyTrends,
      issueBreakdown,
      activePatterns: issuePatternsRes.data || [],
      loyaltyBreakdown,
      tierDistribution,
      shippingHealth,
      shippingPerformance,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return new Response(JSON.stringify({ error: "An unexpected error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
