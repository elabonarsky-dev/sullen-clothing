import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Build a JWT from the service-account JSON and exchange it for a Google access token
async function getGoogleAccessToken(serviceAccount: {
  client_email: string;
  private_key: string;
  token_uri: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: serviceAccount.token_uri,
    iat: now,
    exp: now + 3600,
  };

  const enc = (obj: unknown) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const unsignedToken = `${enc(header)}.${enc(payload)}`;

  // Import the RSA private key
  const pemBody = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${unsignedToken}.${sig}`;

  // Exchange JWT for access token
  const tokenRes = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin"])
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse params — support both days-based and custom date range
    const url = new URL(req.url);
    const customStart = url.searchParams.get("start"); // YYYY-MM-DD
    const customEnd = url.searchParams.get("end");     // YYYY-MM-DD
    const days = parseInt(url.searchParams.get("days") || "30", 10);
    const compareMode = url.searchParams.get("compare"); // "yoy" for year-over-year

    // Load credentials
    const saKeyRaw = Deno.env.get("GA4_SERVICE_ACCOUNT_KEY");
    const propertyId = Deno.env.get("GA4_PROPERTY_ID");

    if (!saKeyRaw || !propertyId) {
      return new Response(
        JSON.stringify({ error: "GA4 credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceAccount = JSON.parse(saKeyRaw);
    const accessToken = await getGoogleAccessToken(serviceAccount);

    // Call GA4 Data API — runReport
    let startDate: string;
    let endDate: string;
    let prevStartDate: string;
    let prevEndDate: string;

    if (customStart && customEnd) {
      startDate = customStart;
      endDate = customEnd;
      const s = new Date(customStart);
      const e = new Date(customEnd);

      if (compareMode === "yoy") {
        const prevS = new Date(s);
        prevS.setFullYear(prevS.getFullYear() - 1);
        const prevE = new Date(e);
        prevE.setFullYear(prevE.getFullYear() - 1);
        prevStartDate = prevS.toISOString().slice(0, 10);
        prevEndDate = prevE.toISOString().slice(0, 10);
      } else if (compareMode === "mom") {
        const prevS = new Date(s);
        prevS.setMonth(prevS.getMonth() - 1);
        const prevE = new Date(e);
        prevE.setMonth(prevE.getMonth() - 1);
        prevStartDate = prevS.toISOString().slice(0, 10);
        prevEndDate = prevE.toISOString().slice(0, 10);
      } else if (compareMode === "dod") {
        const prevS = new Date(s.getTime() - 7 * 86400000);
        const prevE = new Date(e.getTime() - 7 * 86400000);
        prevStartDate = prevS.toISOString().slice(0, 10);
        prevEndDate = prevE.toISOString().slice(0, 10);
      } else {
        const rangeDays = Math.ceil((e.getTime() - s.getTime()) / 86400000) + 1;
        const prevEnd = new Date(s.getTime() - 86400000);
        const prevStart = new Date(prevEnd.getTime() - (rangeDays - 1) * 86400000);
        prevStartDate = prevStart.toISOString().slice(0, 10);
        prevEndDate = prevEnd.toISOString().slice(0, 10);
      }
    } else {
      startDate = `${days}daysAgo`;
      endDate = "today";

      if (compareMode === "yoy") {
        // Year-over-year with days-based range
        const now = new Date();
        const s = new Date(Date.now() - days * 86400000);
        const prevS = new Date(s);
        prevS.setFullYear(prevS.getFullYear() - 1);
        const prevE = new Date(now);
        prevE.setFullYear(prevE.getFullYear() - 1);
        prevStartDate = prevS.toISOString().slice(0, 10);
        prevEndDate = prevE.toISOString().slice(0, 10);
      } else {
        prevStartDate = `${days * 2}daysAgo`;
        prevEndDate = `${days + 1}daysAgo`;
      }
    }

    // Current period request
    const currentReportBody = {
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "screenPageViews" },
        { name: "averageSessionDuration" },
        { name: "bounceRate" },
        { name: "engagedSessions" },
        { name: "sessionsPerUser" },
        { name: "engagementRate" },
      ],
    };

    // Previous period request
    const prevReportBody = {
      dateRanges: [{ startDate: prevStartDate, endDate: prevEndDate }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "bounceRate" },
        { name: "engagementRate" },
      ],
    };

    // Detect single-day view for hourly granularity
    const isSingleDay = customStart && customEnd && customStart === customEnd;

    // Daily breakdown
    const dailyReportBody = {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "screenPageViews" },
      ],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    };

    // Hourly breakdown (only for single-day views)
    const hourlyReportBody = isSingleDay ? {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "hour" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "screenPageViews" },
      ],
      orderBys: [{ dimension: { dimensionName: "hour" } }],
    } : null;

    // Top sources
    const sourcesReportBody = {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "engagementRate" },
      ],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    };

    // Source breakdown by day (for source drilldown)
    const sourceByDayReportBody = {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }, { name: "sessionDefaultChannelGroup" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "newUsers" },
      ],
      orderBys: [{ dimension: { dimensionName: "date" } }],
      limit: 5000,
    };

    // Source/medium breakdown (granular)
    const sourceMediumReportBody = {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "engagementRate" },
      ],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 25,
    };

    // Top pages
    const pagesReportBody = {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "pagePath" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "sessions" },
        { name: "averageSessionDuration" },
      ],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 15,
    };

    // Device breakdown
    const deviceReportBody = {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "deviceCategory" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
      ],
    };

    // E-commerce funnel: event counts for cart abandonment
    const funnelReportBody = {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          inListFilter: {
            values: ["view_item", "add_to_cart", "view_cart", "begin_checkout", "purchase"],
          },
        },
      },
    };

    // Daily funnel events (add_to_cart + purchase per day for trend)
    const dailyFunnelReportBody = {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }, { name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          inListFilter: {
            values: ["add_to_cart", "begin_checkout", "purchase"],
          },
        },
      },
      orderBys: [{ dimension: { dimensionName: "date" } }],
    };

    const ga4Url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

    const fetchPromises: Promise<Response>[] = [
      fetch(ga4Url, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(currentReportBody) }),
      fetch(ga4Url, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(prevReportBody) }),
      fetch(ga4Url, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(dailyReportBody) }),
      fetch(ga4Url, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(sourcesReportBody) }),
      fetch(ga4Url, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(pagesReportBody) }),
      fetch(ga4Url, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(deviceReportBody) }),
      fetch(ga4Url, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(funnelReportBody) }),
      fetch(ga4Url, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(dailyFunnelReportBody) }),
      fetch(ga4Url, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(sourceByDayReportBody) }),
      fetch(ga4Url, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(sourceMediumReportBody) }),
    ];

    // Add hourly report if single-day
    if (hourlyReportBody) {
      fetchPromises.push(
        fetch(ga4Url, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(hourlyReportBody) })
      );
    }

    const allResponses = await Promise.all(fetchPromises);
    const [currentRes, prevRes, dailyRes, sourcesRes, pagesRes, deviceRes, funnelRes, dailyFunnelRes, sourceByDayRes, sourceMediumRes] = allResponses;
    const hourlyRes = hourlyReportBody ? allResponses[10] : null;

    // Helper to parse metric values
    const parseRow = (row: { metricValues: { value: string }[] }) =>
      row.metricValues.map((m) => parseFloat(m.value) || 0);

    // Check for errors
    const checkPairs: [string, Response][] = [
      ["current", currentRes],
      ["previous", prevRes],
      ["daily", dailyRes],
      ["sources", sourcesRes],
      ["pages", pagesRes],
      ["device", deviceRes],
      ["funnel", funnelRes],
      ["dailyFunnel", dailyFunnelRes],
      ["sourceByDay", sourceByDayRes],
      ["sourceMedium", sourceMediumRes],
    ];
    if (hourlyRes) checkPairs.push(["hourly", hourlyRes]);

    for (const [name, res] of checkPairs) {
      if (!res.ok) {
        const errText = await res.text();
        console.error(`GA4 ${name} report error:`, errText);
        return new Response(
          JSON.stringify({ error: `GA4 ${name} report failed`, detail: errText }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const [currentData, prevData, dailyData, sourcesData, pagesData, deviceData, funnelData, dailyFunnelData, sourceByDayData, sourceMediumData] =
      await Promise.all([
        currentRes.json(),
        prevRes.json(),
        dailyRes.json(),
        sourcesRes.json(),
        pagesRes.json(),
        deviceRes.json(),
        funnelRes.json(),
        dailyFunnelRes.json(),
        sourceByDayRes.json(),
        sourceMediumRes.json(),
      ]);
    const hourlyData = hourlyRes ? await hourlyRes.json() : null;

    // Current period metrics
    const cRow = currentData.rows?.[0];
    const cVals = cRow ? parseRow(cRow) : [0, 0, 0, 0, 0, 0, 0, 0, 0];

    // Previous period metrics
    const pRow = prevData.rows?.[0];
    const pVals = pRow ? parseRow(pRow) : [0, 0, 0, 0, 0];

    const pctChange = (curr: number, prev: number) =>
      prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

    const overview = {
      sessions: cVals[0],
      prevSessions: pVals[0],
      sessionsChange: pctChange(cVals[0], pVals[0]),
      totalUsers: cVals[1],
      prevTotalUsers: pVals[1],
      usersChange: pctChange(cVals[1], pVals[1]),
      newUsers: cVals[2],
      prevNewUsers: pVals[2],
      newUsersChange: pctChange(cVals[2], pVals[2]),
      pageViews: cVals[3],
      avgSessionDuration: Math.round(cVals[4]),
      bounceRate: Math.round(cVals[5] * 100),
      prevBounceRate: Math.round(pVals[3] * 100),
      bounceRateChange: pctChange(cVals[5], pVals[3]),
      engagedSessions: cVals[6],
      sessionsPerUser: Math.round(cVals[7] * 100) / 100,
      engagementRate: Math.round(cVals[8] * 100),
      prevEngagementRate: Math.round(pVals[4] * 100),
      engagementRateChange: pctChange(cVals[8], pVals[4]),
    };

    // Daily trends
    const dailyTrends = (dailyData.rows || []).map(
      (row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => {
        const dateStr = row.dimensionValues[0].value; // YYYYMMDD
        const formatted = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        const vals = row.metricValues.map((m) => parseFloat(m.value) || 0);
        return {
          date: formatted,
          sessions: vals[0],
          users: vals[1],
          newUsers: vals[2],
          pageViews: vals[3],
        };
      }
    );

    // Traffic sources
    const trafficSources = (sourcesData.rows || []).map(
      (row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
        channel: row.dimensionValues[0].value,
        sessions: parseFloat(row.metricValues[0].value) || 0,
        users: parseFloat(row.metricValues[1].value) || 0,
        engagementRate: Math.round((parseFloat(row.metricValues[2].value) || 0) * 100),
      })
    );

    // Top pages
    const topPages = (pagesData.rows || []).map(
      (row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
        path: row.dimensionValues[0].value,
        pageViews: parseFloat(row.metricValues[0].value) || 0,
        sessions: parseFloat(row.metricValues[1].value) || 0,
        avgDuration: Math.round(parseFloat(row.metricValues[2].value) || 0),
      })
    );

    // Device breakdown
    const devices = (deviceData.rows || []).map(
      (row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
        device: row.dimensionValues[0].value,
        sessions: parseFloat(row.metricValues[0].value) || 0,
        users: parseFloat(row.metricValues[1].value) || 0,
      })
    );

    // E-commerce funnel
    const funnelEventCounts: Record<string, number> = {};
    (funnelData.rows || []).forEach(
      (row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => {
        funnelEventCounts[row.dimensionValues[0].value] = parseFloat(row.metricValues[0].value) || 0;
      }
    );

    const viewItem = funnelEventCounts["view_item"] || 0;
    const addToCart = funnelEventCounts["add_to_cart"] || 0;
    const viewCart = funnelEventCounts["view_cart"] || 0;
    const beginCheckout = funnelEventCounts["begin_checkout"] || 0;
    const purchaseCount = funnelEventCounts["purchase"] || 0;

    const cartAbandonmentRate = addToCart > 0
      ? Math.round(((addToCart - purchaseCount) / addToCart) * 100)
      : 0;
    const checkoutAbandonmentRate = beginCheckout > 0
      ? Math.round(((beginCheckout - purchaseCount) / beginCheckout) * 100)
      : 0;

    const ecommerceFunnel = {
      viewItem,
      addToCart,
      viewCart,
      beginCheckout,
      purchase: purchaseCount,
      cartAbandonmentRate,
      checkoutAbandonmentRate,
      steps: [
        { step: "View Product", count: viewItem },
        { step: "Add to Cart", count: addToCart },
        { step: "View Cart", count: viewCart },
        { step: "Begin Checkout", count: beginCheckout },
        { step: "Purchase", count: purchaseCount },
      ],
    };

    // Daily funnel trends
    const dailyFunnelMap = new Map<string, { add_to_cart: number; begin_checkout: number; purchase: number }>();
    (dailyFunnelData.rows || []).forEach(
      (row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => {
        const dateStr = row.dimensionValues[0].value;
        const formatted = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        const eventName = row.dimensionValues[1].value;
        const count = parseFloat(row.metricValues[0].value) || 0;
        if (!dailyFunnelMap.has(formatted)) {
          dailyFunnelMap.set(formatted, { add_to_cart: 0, begin_checkout: 0, purchase: 0 });
        }
        const entry = dailyFunnelMap.get(formatted)!;
        if (eventName === "add_to_cart") entry.add_to_cart = count;
        else if (eventName === "begin_checkout") entry.begin_checkout = count;
        else if (eventName === "purchase") entry.purchase = count;
      }
    );
    const dailyFunnelTrends = Array.from(dailyFunnelMap.entries())
      .map(([date, d]) => ({ date, ...d }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Hourly trends (single-day only)
    const hourlyTrends = hourlyData ? (hourlyData.rows || []).map(
      (row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => {
        const hour = parseInt(row.dimensionValues[0].value, 10);
        const formatted = `${hour.toString().padStart(2, "0")}:00`;
        const vals = row.metricValues.map((m) => parseFloat(m.value) || 0);
        return {
          date: formatted,
          sessions: vals[0],
          users: vals[1],
          newUsers: vals[2],
          pageViews: vals[3],
        };
      }
    ).sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date)) : null;

    // Source breakdown by day
    const sourceByDay = (sourceByDayData.rows || []).map(
      (row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => {
        const dateStr = row.dimensionValues[0].value;
        const formatted = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        const vals = row.metricValues.map((m) => parseFloat(m.value) || 0);
        return {
          date: formatted,
          channel: row.dimensionValues[1].value,
          sessions: vals[0],
          users: vals[1],
          newUsers: vals[2],
        };
      }
    );

    // Source/medium breakdown
    const sourceMedium = (sourceMediumData.rows || []).map(
      (row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => {
        const vals = row.metricValues.map((m) => parseFloat(m.value) || 0);
        return {
          source: row.dimensionValues[0].value,
          medium: row.dimensionValues[1].value,
          sessions: vals[0],
          users: vals[1],
          newUsers: vals[2],
          engagementRate: Math.round(vals[3] * 1000) / 10,
        };
      }
    );

    return new Response(
      JSON.stringify({
        overview,
        dailyTrends,
        hourlyTrends,
        trafficSources,
        topPages,
        devices,
        ecommerceFunnel,
        dailyFunnelTrends,
        sourceByDay,
        sourceMedium,
        period: { days, startDate, endDate },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("GA4 analytics error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
