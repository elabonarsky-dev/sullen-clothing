import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, Area, AreaChart,
} from "recharts";
import {
  TrendingUp, TrendingDown, AlertTriangle, Star, Heart, Bell,
  Users, Skull, Package, Loader2, Truck, Clock, CheckCircle2,
  DollarSign, ShoppingBag, Repeat, Percent, Tag, ArrowUpRight, ArrowDownRight,
  Globe, Monitor, Smartphone, Tablet, Eye, MousePointerClick, Calendar,
  Shield, AlertCircle, ChevronDown, ChevronUp, RefreshCw,
} from "lucide-react";

interface CommerceData {
  totalRevenue: number;
  prevRevenue: number;
  revenueChange: number;
  totalOrders: number;
  prevTotalOrders: number;
  ordersChange: number;
  aov: number;
  prevAov: number;
  aovChange: number;
  totalRefunds: number;
  uniqueCustomers: number;
  repeatRate: number;
  ordersWithDiscount: number;
  discountRate: number;
  totalDiscountAmount: number;
  fulfillment: { fulfilled: number; unfulfilled: number; partial: number };
  dailyRevenue: Array<{ date: string; revenue: number; orders: number; refunds: number; aov: number }>;
  prevDailyRevenue?: Array<{ date: string; prevDate: string | null; prevRevenue: number; prevOrders: number; prevAov: number }>;
  salesChannels?: Array<{ channel: string; revenue: number; orders: number }>;
  topSellingProducts: Array<{ title: string; revenue: number; unitsSold: number }>;
  discountBreakdown?: Array<{ code: string; type: string; uses: number; totalAmount: number; orders: number }>;
  salesBreakdown?: {
    grossSales: number;
    discounts: number;
    returns: number;
    netSales: number;
    shipping: number;
    taxes: number;
    totalSales: number;
  };
  prevSalesBreakdown?: {
    grossSales: number;
    discounts: number;
    returns: number;
    netSales: number;
    shipping: number;
    taxes: number;
    totalSales: number;
  };
}

interface AnalyticsData {
  period: { days: number; since: string };
  commerce?: CommerceData;
  summary: {
    totalIssues: number;
    identifiedIssues: number;
    totalReviews: number;
    avgRating: number;
    totalPointsEarned: number;
    totalPointsRedeemed: number;
    totalMembers: number;
    frozenMembers: number;
    totalBackInStock: number;
    totalWishlistAdds: number;
  };
  productDemand: Array<{
    handle: string; title: string; bis: number; wishlist: number;
    reviews: number; avgRating: number; score: number;
  }>;
  dailyTrends: Array<{
    date: string; bis: number; wishlist: number; reviews: number;
    issues: number; points_earned: number; points_redeemed: number;
  }>;
  issueBreakdown: Array<{ category: string; count: number }>;
  activePatterns: Array<{
    category: string; title: string; occurrence_count: number;
    status: string; last_seen_at: string;
  }>;
  loyaltyBreakdown: Array<{ type: string; count: number; totalPoints: number }>;
  tierDistribution: Array<{ tier: string; count: number }>;
  shippingHealth: Array<{ status: string; count: number }>;
  shippingPerformance: {
    avgPlacedToDelivered: number | null;
    avgPlacedToFulfilled: number | null;
    avgFulfilledToDelivered: number | null;
    totalShipped: number;
    totalDelivered: number;
  };
}

const TIER_COLORS: Record<string, string> = {
  apprentice: "hsl(var(--muted-foreground))",
  collector: "hsl(45 80% 50%)",
  devotee: "hsl(280 60% 55%)",
  icon: "hsl(0 70% 50%)",
  none: "hsl(var(--muted-foreground))",
};

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(280 60% 55%)",
  "hsl(45 80% 50%)",
  "hsl(150 60% 40%)",
  "hsl(0 70% 50%)",
  "hsl(200 70% 50%)",
  "hsl(30 80% 50%)",
  "hsl(330 60% 50%)",
];

const PERIODS = [
  { label: "Today", days: 1 },
  { label: "Yesterday", days: -2 },
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
  { label: "60d", days: 60 },
  { label: "90d", days: 90 },
  { label: "YTD", days: -1 },
];

type CompareMode = "none" | "prev" | "dod" | "mom" | "yoy";
const COMPARE_OPTIONS: { value: CompareMode; label: string }[] = [
  { value: "none", label: "No Compare" },
  { value: "prev", label: "vs Prev Period" },
  { value: "dod", label: "vs Same Day LW" },
  { value: "mom", label: "vs Last Month" },
  { value: "yoy", label: "vs Last Year" },
];

// Discount abuse thresholds
const ABUSE_THRESHOLDS = {
  highUsagePerDay: 15,      // >15 uses/day flags concern
  highAmountPerUse: 100,    // >$100 avg discount per use
  excessivePercentage: 40,  // >40% of revenue discounted
};

interface GA4FunnelStep {
  step: string;
  count: number;
}

interface GA4EcommerceFunnel {
  viewItem: number;
  addToCart: number;
  viewCart: number;
  beginCheckout: number;
  purchase: number;
  cartAbandonmentRate: number;
  checkoutAbandonmentRate: number;
  steps: GA4FunnelStep[];
}

interface GA4Data {
  overview: {
    sessions: number; prevSessions: number; sessionsChange: number;
    totalUsers: number; prevTotalUsers: number; usersChange: number;
    newUsers: number; prevNewUsers: number; newUsersChange: number;
    pageViews: number; avgSessionDuration: number;
    bounceRate: number; prevBounceRate: number; bounceRateChange: number;
    engagedSessions: number; sessionsPerUser: number;
    engagementRate: number; prevEngagementRate: number; engagementRateChange: number;
  };
  dailyTrends: Array<{ date: string; sessions: number; users: number; newUsers: number; pageViews: number }>;
  hourlyTrends?: Array<{ date: string; sessions: number; users: number; newUsers: number; pageViews: number }> | null;
  trafficSources: Array<{ channel: string; sessions: number; users: number; engagementRate: number }>;
  topPages: Array<{ path: string; pageViews: number; sessions: number; avgDuration: number }>;
  devices: Array<{ device: string; sessions: number; users: number }>;
  ecommerceFunnel?: GA4EcommerceFunnel;
  dailyFunnelTrends?: Array<{ date: string; add_to_cart: number; begin_checkout: number; purchase: number }>;
  sourceByDay?: Array<{ date: string; channel: string; sessions: number; users: number; newUsers: number }>;
  sourceMedium?: Array<{ source: string; medium: string; sessions: number; users: number; newUsers: number; engagementRate: number }>;
}

interface AnalyticsDashboardProps {
  onNavigate?: (section: string) => void;
}

export function AnalyticsDashboard({ onNavigate }: AnalyticsDashboardProps = {}) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(1);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [compareMode, setCompareMode] = useState<CompareMode>("yoy");
  const [error, setError] = useState<string | null>(null);
  const [ga4Data, setGa4Data] = useState<GA4Data | null>(null);
  const [ga4Loading, setGa4Loading] = useState(false);
  const [ga4Error, setGa4Error] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  // Get today's date in Pacific Time (not UTC)
  const pacificToday = useMemo(() => {
    const now = new Date();
    const pacific = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    return pacific; // "YYYY-MM-DD"
  }, []);

  const dateRange = useMemo(() => {
    if (useCustomRange && customStart && customEnd) {
      return { start: customStart, end: customEnd };
    }
    const todayStr = pacificToday;
    const [y] = todayStr.split("-").map(Number);
    if (days === -1) {
      return { start: `${y}-01-01`, end: todayStr };
    }
    if (days === 1) {
      return { start: todayStr, end: todayStr };
    }
    if (days === -2) {
      // Yesterday in Pacific
      const now = new Date();
      const yesterday = new Date(now.getTime() - 86400000);
      const yStr = new Intl.DateTimeFormat("sv-SE", {
        timeZone: "America/Los_Angeles",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(yesterday);
      return { start: yStr, end: yStr };
    }
    const now = new Date();
    const startDate = new Date(now.getTime() - (days - 1) * 86400000);
    const startStr = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(startDate);
    return {
      start: startStr,
      end: todayStr,
    };
  }, [days, useCustomRange, customStart, customEnd, pacificToday]);

  const { conversionRate, convWebOrders, convSessions } = useMemo(() => {
    if (!data?.commerce || !ga4Data?.overview?.sessions) return { conversionRate: null, convWebOrders: 0, convSessions: 0 };
    const sessions = ga4Data.overview.sessions;
    if (sessions === 0) return { conversionRate: 0, convWebOrders: 0, convSessions: sessions };
    // Only count web-based orders for conversion rate (GA4 only tracks web sessions)
    const webChannels = ["Online Store", "Headless / Custom Storefront"];
    const webOrders = data.commerce.salesChannels
      ? data.commerce.salesChannels
          .filter(ch => webChannels.includes(ch.channel))
          .reduce((sum, ch) => sum + ch.orders, 0)
      : data.commerce.totalOrders;
    return {
      conversionRate: Math.round((webOrders / sessions) * 10000) / 100,
      convWebOrders: webOrders,
      convSessions: sessions,
    };
  }, [data, ga4Data]);

  // Merge current + prev daily data for overlay charts, including conversion rate from GA4 sessions
  const mergedDailyRevenue = useMemo(() => {
    if (!data?.commerce?.dailyRevenue) return [];
    const prev = data.commerce.prevDailyRevenue || [];
    // Build a lookup of GA4 sessions by date key (YYYY-MM-DD)
    const ga4SessionMap = new Map<string, number>();
    let totalGa4Sessions = 0;
    if (ga4Data?.dailyTrends) {
      for (const t of ga4Data.dailyTrends) {
        ga4SessionMap.set(t.date, t.sessions);
        totalGa4Sessions += t.sessions;
      }
    }
    // Check if hourly (single-day): date keys like "00:00", "01:00"
    const isHourly = data.commerce.dailyRevenue[0]?.date?.includes(":");
    // Total orders for proportional session split in hourly view
    const totalOrders = isHourly ? data.commerce.dailyRevenue.reduce((s, d) => s + d.orders, 0) : 0;

    return data.commerce.dailyRevenue.map((d, i) => {
      let sessions: number;
      if (isHourly) {
        // For hourly view, use total day sessions from GA4 (overview is more accurate)
        sessions = ga4Data?.overview?.sessions ?? totalGa4Sessions;
      } else {
        sessions = ga4SessionMap.get(d.date) ?? 0;
      }
      // Conversion rate: for hourly, calculate cumulative running rate using total day sessions
      let cr: number | null = null;
      if (isHourly) {
        // Per-hour CR doesn't make sense; show running cumulative rate
        const cumulativeOrders = data.commerce.dailyRevenue.slice(0, i + 1).reduce((s, x) => s + x.orders, 0);
        cr = sessions > 0 ? Math.round((cumulativeOrders / sessions) * 10000) / 100 : null;
      } else {
        cr = sessions > 0 ? Math.round((d.orders / sessions) * 10000) / 100 : null;
      }
      return {
        ...d,
        prevRevenue: prev[i]?.prevRevenue ?? null,
        prevOrders: prev[i]?.prevOrders ?? null,
        prevAov: prev[i]?.prevAov ?? null,
        prevDate: prev[i]?.prevDate ?? null,
        sessions,
        conversionRate: cr,
      };
    });
  }, [data, ga4Data]);

  // Detect if data is hourly (single-day view)
  const isHourlyData = useMemo(() => {
    if (!mergedDailyRevenue.length) return false;
    return mergedDailyRevenue[0]?.date?.includes(":");
  }, [mergedDailyRevenue]);

  const chartTickFormatter = (d: string) => isHourlyData ? d : d.slice(5);

  // Calculate period length for abuse detection
  const periodDays = useMemo(() => {
    const s = new Date(dateRange.start);
    const e = new Date(dateRange.end);
    return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / 86400000) + 1);
  }, [dateRange]);

  // Detect discount abuse flags
  const discountAbuse = useMemo(() => {
    if (!data?.commerce?.discountBreakdown) return [];
    const totalRev = data.commerce.totalRevenue || 1;
    return data.commerce.discountBreakdown.map(d => {
      const flags: string[] = [];
      const usesPerDay = d.uses / periodDays;
      const avgPerUse = d.totalAmount / Math.max(d.uses, 1);
      const pctOfRevenue = (d.totalAmount / totalRev) * 100;

      if (usesPerDay > ABUSE_THRESHOLDS.highUsagePerDay) {
        flags.push(`${usesPerDay.toFixed(0)}/day avg`);
      }
      if (avgPerUse > ABUSE_THRESHOLDS.highAmountPerUse) {
        flags.push(`$${avgPerUse.toFixed(0)} avg/use`);
      }
      if (pctOfRevenue > ABUSE_THRESHOLDS.excessivePercentage) {
        flags.push(`${pctOfRevenue.toFixed(0)}% of revenue`);
      }
      return { code: d.code, flags, severity: flags.length >= 2 ? "high" : flags.length === 1 ? "medium" : "none" };
    }).filter(d => d.flags.length > 0);
  }, [data, periodDays]);

  // Resilient fetch with retry + timeout
  const fetchWithRetry = async (url: string, headers: Record<string, string>, retries = 3): Promise<Response> => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout
        const response = await fetch(url, { headers, signal: controller.signal });
        clearTimeout(timeout);
        if (response.status === 503 || response.status === 502 || response.status === 429) {
          // Retryable server errors
          if (attempt < retries - 1) {
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
            continue;
          }
        }
        return response;
      } catch (err: any) {
        if (err.name === "AbortError") {
          if (attempt < retries - 1) {
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
            continue;
          }
          throw new Error("Request timed out after 25s");
        }
        if (attempt < retries - 1) {
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
          continue;
        }
        throw err;
      }
    }
    throw new Error("Max retries exceeded");
  };

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("Not authenticated — please log in first");
    }
    return {
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    };
  };

  useEffect(() => {
    fetchAnalytics();
    fetchGA4();
    setSelectedSource(null);
  }, [days, useCustomRange, customStart, customEnd, compareMode]);

  const handlePresetClick = (d: number) => {
    setUseCustomRange(false);
    if (d === -1) {
      const now = new Date();
      setCustomStart(`${now.getFullYear()}-01-01`);
      setCustomEnd(now.toISOString().slice(0, 10));
      setUseCustomRange(true);
    }
    setDays(d);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd && customStart <= customEnd) {
      setUseCustomRange(true);
      setDays(0);
    }
  };

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.set("start", dateRange.start);
    params.set("end", dateRange.end);
    if (compareMode !== "none") params.set("compare", compareMode);
    return params.toString();
  };

  const fetchGA4 = async () => {
    setGa4Loading(true);
    setGa4Error(null);
    try {
      const headers = await getAuthHeaders();
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/ga4-analytics?${buildQueryParams()}`;
      const response = await fetchWithRetry(url, headers);
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `GA4 error ${response.status}`);
      }
      const result = await response.json();
      setGa4Data(result);
    } catch (err: any) {
      console.error("GA4 fetch error:", err);
      setGa4Error(err.message);
    } finally {
      setGa4Loading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/analytics-trends?${buildQueryParams()}`;
      const response = await fetchWithRetry(url, headers);
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Analytics error ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      console.error("Analytics fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const summary = data?.summary;
  const commerce = data?.commerce;

  const formatLabel = (type: string) =>
    type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const formatCurrency = (val: number) =>
    val >= 1000 ? `$${(val / 1000).toFixed(1)}K` : `$${val.toFixed(2)}`;

  const cmpLabel = compareMode === "yoy" ? "vs LY" : compareMode === "mom" ? "vs LM" : compareMode === "dod" ? "vs LW" : "vs prev";

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-destructive font-body text-xs sm:text-sm flex-1 line-clamp-2">{error}</p>
          <button onClick={() => { fetchAnalytics(); fetchGA4(); }} className="text-xs text-primary underline shrink-0">Retry</button>
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div className="space-y-3">
        <div className="flex items-start sm:items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-display text-lg sm:text-xl uppercase tracking-wider text-foreground">Analytics</h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-body mt-0.5 truncate">
              {dateRange.start === dateRange.end ? dateRange.start : `${dateRange.start} → ${dateRange.end}`}
              {compareMode !== "none" && <span className="ml-1 text-primary">({cmpLabel})</span>}
            </p>
          </div>
          <button
            onClick={() => { fetchAnalytics(); fetchGA4(); }}
            className="p-2 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading || ga4Loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Period pills — horizontal scroll on mobile */}
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {PERIODS.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePresetClick(p.days)}
              className={`px-2.5 py-1.5 text-[11px] font-display uppercase tracking-wider rounded-md whitespace-nowrap transition-all ${
                days === p.days && !useCustomRange
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/70"
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`px-2.5 py-1.5 text-[11px] font-display uppercase tracking-wider rounded-md whitespace-nowrap transition-all flex items-center gap-1 ${
              useCustomRange && days === 0
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/70"
            }`}
          >
            <Calendar className="w-3 h-3" />
            Custom
            {showDatePicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Expandable date picker + YoY */}
        {showDatePicker && (
          <div className="flex items-center gap-2 flex-wrap p-3 rounded-lg bg-secondary/20 border border-border/30">
            <Input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-[130px] h-8 text-xs bg-card/50"
            />
            <span className="text-muted-foreground text-xs">→</span>
            <Input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-[130px] h-8 text-xs bg-card/50"
            />
            <button
              onClick={handleCustomApply}
              disabled={!customStart || !customEnd || customStart > customEnd}
              className="px-3 py-1.5 text-[11px] font-display uppercase tracking-wider rounded-md bg-primary text-primary-foreground disabled:opacity-40 transition-colors hover:bg-primary/90"
            >
              Apply
            </button>
            {useCustomRange && days !== -1 && (
              <button
                onClick={() => { setUseCustomRange(false); setCustomStart(""); setCustomEnd(""); setDays(30); }}
                className="text-[11px] text-muted-foreground underline hover:text-foreground"
              >
                Reset
              </button>
            )}
            <div className="ml-auto flex gap-1">
              {COMPARE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCompareMode(opt.value)}
                  className={`px-2 py-1.5 text-[10px] font-display uppercase tracking-wider rounded-md border transition-all whitespace-nowrap ${
                    compareMode === opt.value
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card/50 text-muted-foreground border-border/40 hover:text-foreground hover:border-border"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== TABBED SECTIONS ===== */}
      <Tabs defaultValue="commerce" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto bg-secondary/30 border border-border/30 h-auto p-1 gap-0.5">
          <TabsTrigger value="commerce" className="text-[11px] font-display uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:shadow-sm px-3 py-1.5">
            <DollarSign className="w-3 h-3 mr-1" />Commerce
          </TabsTrigger>
          <TabsTrigger value="traffic" className="text-[11px] font-display uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:shadow-sm px-3 py-1.5">
            <Globe className="w-3 h-3 mr-1" />Traffic
          </TabsTrigger>
          <TabsTrigger value="funnel" className="text-[11px] font-display uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:shadow-sm px-3 py-1.5">
            <ShoppingBag className="w-3 h-3 mr-1" />Funnel
          </TabsTrigger>
          <TabsTrigger value="signals" className="text-[11px] font-display uppercase tracking-wider data-[state=active]:bg-card data-[state=active]:shadow-sm px-3 py-1.5">
            <Bell className="w-3 h-3 mr-1" />Signals
          </TabsTrigger>
        </TabsList>

        {/* ==================== COMMERCE TAB ==================== */}
        <TabsContent value="commerce" className="space-y-4 mt-4">
          {loading && !commerce && <SkeletonKPIs count={7} />}
          {commerce && (
            <>
              {/* KPI cards + Sales Breakdown side by side */}
              <div className="grid lg:grid-cols-[1fr_280px] gap-3">
                {/* KPI Grid — 2 cols mobile, 4 tablet, fills left side */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 content-start">
                  <CommerceKPI icon={DollarSign} label="Revenue" value={formatCurrency(commerce.totalRevenue)} change={commerce.revenueChange} compareLabel={cmpLabel} color="hsl(150 60% 40%)" />
                  <CommerceKPI icon={ShoppingBag} label="Orders" value={commerce.totalOrders.toString()} change={commerce.ordersChange} compareLabel={cmpLabel} color="hsl(var(--primary))" />
                  <CommerceKPI icon={DollarSign} label="AOV" value={`$${commerce.aov.toFixed(2)}`} change={commerce.aovChange} compareLabel={cmpLabel} color="hsl(280 60% 55%)" />
                  <CommerceKPI icon={Users} label="Customers" value={commerce.uniqueCustomers.toString()} color="hsl(200 70% 50%)" />
                  <CommerceKPI icon={Repeat} label="Repeat" value={`${commerce.repeatRate}%`} color="hsl(45 80% 50%)" />
                  <CommerceKPI icon={Tag} label="Disc. Use" value={`${commerce.discountRate}%`} subtitle={`$${commerce.totalDiscountAmount.toFixed(0)}`} color="hsl(330 60% 50%)" />
                  <CommerceKPI icon={Percent} label="Conv." value={conversionRate !== null ? `${conversionRate}%` : "—"} subtitle={conversionRate !== null ? `${convWebOrders.toLocaleString()} orders / ${convSessions.toLocaleString()} sessions` : "GA4"} color="hsl(0 70% 50%)" />
                </div>

                {/* Sales Breakdown — compact right sidebar */}
                {commerce.salesBreakdown && (
                  <Card className="border-border/30 bg-card/60 h-fit">
                    <CardHeader className="pb-1 px-3 pt-3">
                      <CardTitle className="font-display text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign className="w-3 h-3" /> Sales Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="space-y-0">
                        {(() => {
                          const b = commerce.salesBreakdown!;
                          const pb = commerce.prevSalesBreakdown;
                          const pctCh = (curr: number, prev: number | undefined) => {
                            if (!prev || prev === 0) return null;
                            return Math.round(((curr - prev) / Math.abs(prev)) * 100);
                          };
                          const rows: Array<{ label: string; value: number; prefix?: string; change: number | null; highlight?: boolean }> = [
                            { label: "Gross sales", value: b.grossSales, change: pctCh(b.grossSales, pb?.grossSales) },
                            { label: "Discounts", value: -b.discounts, prefix: "-", change: pctCh(b.discounts, pb?.discounts) },
                            { label: "Returns", value: -b.returns, prefix: "-", change: pctCh(b.returns, pb?.returns) },
                            { label: "Net sales", value: b.netSales, change: pctCh(b.netSales, pb?.netSales), highlight: true },
                            { label: "Shipping", value: b.shipping, change: pctCh(b.shipping, pb?.shipping) },
                            { label: "Taxes", value: b.taxes, change: pctCh(b.taxes, pb?.taxes) },
                            { label: "Total sales", value: b.totalSales, change: pctCh(b.totalSales, pb?.totalSales), highlight: true },
                          ];
                          return rows.map((row) => (
                            <div key={row.label} className={`flex items-center justify-between py-1.5 border-b border-border/15 last:border-0 ${row.highlight ? "bg-secondary/20 -mx-3 px-3 rounded" : ""}`}>
                              <span className={`text-[10px] font-body ${row.highlight ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{row.label}</span>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-display ${row.highlight ? "text-foreground font-semibold" : "text-foreground"}`}>
                                  {row.value < 0 ? `-$${Math.abs(row.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${row.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                </span>
                                {row.change !== null ? (
                                  <span className={`text-[9px] font-display ${row.label === "Returns" || row.label === "Discounts" ? (row.change > 0 ? "text-destructive" : "text-green-500") : (row.change > 0 ? "text-green-500" : "text-destructive")}`}>
                                    {row.change > 0 ? "↗" : "↘"} {Math.abs(row.change)}%
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-muted-foreground">—</span>
                                )}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Revenue chart + sidebar */}
              <div className="grid lg:grid-cols-3 gap-3 sm:gap-4">
                <Card className="border-border/30 bg-card/60 lg:col-span-2">
                  <CardHeader className="pb-2 px-3 sm:px-6">
                    <CardTitle className="font-display text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5" /> Total Sales Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-6">
                    <ResponsiveContainer width="100%" height={240}>
                      {mergedDailyRevenue.length <= 1 && !isHourlyData ? (
                        <BarChart data={mergedDailyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={chartTickFormatter} stroke="hsl(var(--muted-foreground))" />
                          <YAxis yAxisId="left" tick={{ fontSize: 9 }} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`} stroke="hsl(var(--muted-foreground))" width={45} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} tickFormatter={(v) => `${v}%`} stroke="hsl(0 70% 50%)" width={40} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} formatter={(value: number, name: string) => [name === "Conv. Rate" ? `${value}%` : `$${value.toFixed(2)}`, name]} />
                          <Bar yAxisId="left" dataKey="revenue" fill="hsl(200 70% 50%)" name="Revenue" radius={[4, 4, 0, 0]} maxBarSize={80} />
                          {compareMode !== "none" && (
                            <Bar yAxisId="left" dataKey="prevRevenue" fill="hsl(200 70% 50% / 0.35)" name="Prev Revenue" radius={[4, 4, 0, 0]} maxBarSize={80} />
                          )}
                          <Line yAxisId="right" type="monotone" dataKey="conversionRate" stroke="hsl(0 70% 50%)" strokeWidth={1.5} dot={{ r: 3, fill: "hsl(0 70% 50%)" }} name="Conv. Rate" connectNulls />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                        </BarChart>
                      ) : (
                        <AreaChart data={mergedDailyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={chartTickFormatter} stroke="hsl(var(--muted-foreground))" />
                          <YAxis yAxisId="left" tick={{ fontSize: 9 }} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`} stroke="hsl(var(--muted-foreground))" width={45} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} tickFormatter={(v) => `${v}%`} stroke="hsl(0 70% 50%)" width={40} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} formatter={(value: number, name: string) => [name === "Conv. Rate" ? `${value}%` : `$${value.toFixed(2)}`, name]} />
                          <Area yAxisId="left" type="monotone" dataKey="revenue" fill="hsl(200 70% 50% / 0.15)" stroke="hsl(200 70% 50%)" strokeWidth={2} name="Revenue" />
                          {compareMode !== "none" && (
                            <Line yAxisId="left" type="monotone" dataKey="prevRevenue" stroke="hsl(200 70% 50%)" strokeWidth={1.5} strokeDasharray="6 3" dot={false} name="Prev Revenue" connectNulls />
                          )}
                          <Line yAxisId="right" type="monotone" dataKey="conversionRate" stroke="hsl(0 70% 50%)" strokeWidth={1.5} dot={{ r: 2, fill: "hsl(0 70% 50%)" }} name="Conv. Rate" connectNulls />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Sales by Channel */}
                <Card className="border-border/30 bg-card/60">
                  <CardHeader className="pb-2 px-3 sm:px-6">
                    <CardTitle className="font-display text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5" /> Sales by Channel
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6">
                    {commerce.salesChannels && commerce.salesChannels.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={160}>
                          <PieChart>
                            <Pie
                              data={commerce.salesChannels}
                              dataKey="revenue"
                              nameKey="channel"
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={65}
                              paddingAngle={2}
                              label={false}
                            >
                              {commerce.salesChannels.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-1 mt-1">
                          {commerce.salesChannels.slice(0, 5).map((ch, i) => (
                            <div key={ch.channel} className="flex items-center gap-2 text-[10px]">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                              <span className="text-foreground truncate flex-1">{ch.channel}</span>
                              <span className="text-muted-foreground">{formatCurrency(ch.revenue)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-8">No channel data</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Orders Over Time + AOV Over Time */}
              <div className="grid lg:grid-cols-2 gap-3 sm:gap-4">
                <Card className="border-border/30 bg-card/60">
                  <CardHeader className="pb-2 px-3 sm:px-6">
                    <CardTitle className="font-display text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                      <ShoppingBag className="w-3.5 h-3.5" /> Orders Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-6">
                    <ResponsiveContainer width="100%" height={200}>
                      {mergedDailyRevenue.length <= 1 && !isHourlyData ? (
                        <BarChart data={mergedDailyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={chartTickFormatter} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={30} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                          <Bar dataKey="orders" fill="hsl(var(--primary))" name="Orders" radius={[4, 4, 0, 0]} maxBarSize={80} />
                          {compareMode !== "none" && (
                            <Bar dataKey="prevOrders" fill="hsl(var(--primary) / 0.35)" name="Prev Orders" radius={[4, 4, 0, 0]} maxBarSize={80} />
                          )}
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                        </BarChart>
                      ) : (
                        <AreaChart data={mergedDailyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={chartTickFormatter} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={30} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                          <Area type="monotone" dataKey="orders" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth={2} name="Orders" />
                          {compareMode !== "none" && (
                            <Line type="monotone" dataKey="prevOrders" stroke="hsl(var(--primary))" strokeWidth={1.5} strokeDasharray="6 3" dot={false} name="Prev Orders" connectNulls />
                          )}
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-border/30 bg-card/60">
                  <CardHeader className="pb-2 px-3 sm:px-6">
                    <CardTitle className="font-display text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5" /> Average Order Value Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-6">
                    <ResponsiveContainer width="100%" height={200}>
                      {mergedDailyRevenue.length <= 1 && !isHourlyData ? (
                        <BarChart data={mergedDailyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={chartTickFormatter} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `$${v}`} stroke="hsl(var(--muted-foreground))" width={40} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} formatter={(value: number) => [`$${value.toFixed(2)}`, "AOV"]} />
                          <Bar dataKey="aov" fill="hsl(280 60% 55%)" name="AOV" radius={[4, 4, 0, 0]} maxBarSize={80} />
                          {compareMode !== "none" && (
                            <Bar dataKey="prevAov" fill="hsl(280 60% 55% / 0.35)" name="Prev AOV" radius={[4, 4, 0, 0]} maxBarSize={80} />
                          )}
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                        </BarChart>
                      ) : (
                        <AreaChart data={mergedDailyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={chartTickFormatter} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `$${v}`} stroke="hsl(var(--muted-foreground))" width={40} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} formatter={(value: number) => [`$${value.toFixed(2)}`, "AOV"]} />
                          <Area type="monotone" dataKey="aov" fill="hsl(280 60% 55% / 0.15)" stroke="hsl(280 60% 55%)" strokeWidth={2} name="AOV" />
                          {compareMode !== "none" && (
                            <Line type="monotone" dataKey="prevAov" stroke="hsl(280 60% 55%)" strokeWidth={1.5} strokeDasharray="6 3" dot={false} name="Prev AOV" connectNulls />
                          )}
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Top Sellers + Fulfillment */}
              <div className="grid lg:grid-cols-3 gap-3 sm:gap-4">
                <Card className="border-border/30 bg-card/60 lg:col-span-2">
                  <CardHeader className="pb-2 px-3 sm:px-6">
                    <CardTitle className="font-display text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5" /> Top Sellers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6">
                    <div className="space-y-1 max-h-[240px] overflow-y-auto pr-1">
                      {commerce.topSellingProducts.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/15 last:border-0">
                          <span className="text-[10px] text-muted-foreground font-mono w-4 text-right shrink-0">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-body text-foreground truncate">{p.title}</p>
                            <p className="text-[9px] text-muted-foreground">{p.unitsSold} units</p>
                          </div>
                          <span className="text-[11px] font-display text-foreground whitespace-nowrap">{formatCurrency(p.revenue)}</span>
                        </div>
                      ))}
                      {commerce.topSellingProducts.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">No orders yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/30 bg-card/60">
                  <CardHeader className="pb-2 px-3 sm:px-6">
                    <CardTitle className="font-display text-xs sm:text-sm uppercase tracking-wider">Fulfillment</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6">
                    <div className="space-y-2">
                      {[
                        { label: "Fulfilled", value: commerce.fulfillment.fulfilled, color: "hsl(150 60% 40%)", icon: CheckCircle2 },
                        { label: "Unfulfilled", value: commerce.fulfillment.unfulfilled, color: "hsl(45 80% 50%)", icon: Clock },
                        { label: "Partial", value: commerce.fulfillment.partial, color: "hsl(280 60% 55%)", icon: Package },
                        { label: "Refunds", value: `$${commerce.totalRefunds.toFixed(0)}`, color: "hsl(0 70% 50%)", icon: TrendingDown },
                      ].map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <div key={item.label} className="flex items-center gap-2 py-1.5">
                            <ItemIcon className="w-3.5 h-3.5 shrink-0" style={{ color: item.color }} />
                            <span className="text-[11px] font-body text-foreground flex-1">{item.label}</span>
                            <span className="text-[11px] font-display text-foreground">{item.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Discount Breakdown + Abuse Flags */}
              {commerce.discountBreakdown && commerce.discountBreakdown.length > 0 && (
                <div className="grid lg:grid-cols-3 gap-3 sm:gap-4">
                  <Card className="border-border/30 bg-card/60 lg:col-span-2">
                    <CardHeader className="pb-2 px-3 sm:px-6">
                      <CardTitle className="font-display text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5" /> Discount Breakdown
                        <Badge variant="secondary" className="text-[9px] font-body ml-auto">
                          {commerce.discountBreakdown.length} codes
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6">
                      <div className="max-h-[300px] overflow-y-auto">
                        {/* Table header */}
                        <div className="flex items-center gap-1.5 py-1.5 text-[9px] text-muted-foreground uppercase tracking-wider font-display border-b border-border/30 sticky top-0 bg-card/60">
                          <span className="flex-1 min-w-[80px]">Code</span>
                          <span className="w-10 text-center hidden sm:block">Type</span>
                          <span className="w-10 text-right">Uses</span>
                          <span className="w-16 text-right">Amount</span>
                          <span className="w-14 text-right hidden sm:block">Avg/Use</span>
                          <span className="w-8 text-center">Flag</span>
                        </div>
                        {commerce.discountBreakdown.map((d, i) => {
                          const abuse = discountAbuse.find(a => a.code === d.code);
                          const avgPerUse = d.uses > 0 ? d.totalAmount / d.uses : 0;
                          return (
                            <div
                              key={i}
                              className={`flex items-center gap-1.5 py-2 border-b border-border/10 last:border-0 ${
                                abuse?.severity === "high" ? "bg-destructive/5" : ""
                              }`}
                            >
                              <span className="flex-1 min-w-[80px] text-[11px] font-mono text-foreground truncate">{d.code}</span>
                              <span className="w-10 text-center text-[10px] text-muted-foreground hidden sm:block">
                                {d.type === 'fixed_amount' ? '$' : d.type === 'percentage' ? '%' : d.type === 'shipping' ? '🚚' : '?'}
                              </span>
                              <span className="w-10 text-right text-[11px] text-muted-foreground">{d.uses}</span>
                              <span className="w-16 text-right text-[11px] font-display text-foreground">{formatCurrency(d.totalAmount)}</span>
                              <span className="w-14 text-right text-[10px] text-muted-foreground hidden sm:block">${avgPerUse.toFixed(0)}</span>
                              <span className="w-8 text-center">
                                {abuse ? (
                                  <span title={abuse.flags.join(", ")}>
                                    <AlertCircle
                                      className={`w-3.5 h-3.5 inline-block ${
                                        abuse.severity === "high" ? "text-destructive" : "text-yellow-500"
                                      }`}
                                    />
                                  </span>
                                ) : (
                                  <CheckCircle2 className="w-3 h-3 inline-block text-muted-foreground/30" />
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Abuse Alerts sidebar */}
                  <Card className={`border-border/30 bg-card/60 ${discountAbuse.length > 0 ? "border-destructive/30" : ""}`}>
                    <CardHeader className="pb-2 px-3 sm:px-6">
                      <CardTitle className="font-display text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                        <Shield className={`w-3.5 h-3.5 ${discountAbuse.length > 0 ? "text-destructive" : "text-muted-foreground"}`} />
                        Code Abuse Monitor
                        {discountAbuse.length > 0 && (
                          <Badge variant="destructive" className="text-[9px] ml-auto">{discountAbuse.length}</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6">
                      {discountAbuse.length > 0 ? (
                        <div className="space-y-2.5 max-h-[250px] overflow-y-auto">
                          {discountAbuse.map((a, i) => (
                            <div key={i} className={`p-2.5 rounded-md border ${
                              a.severity === "high"
                                ? "bg-destructive/8 border-destructive/30"
                                : "bg-yellow-500/5 border-yellow-500/20"
                            }`}>
                              <div className="flex items-center gap-2 mb-1">
                                <AlertCircle className={`w-3 h-3 shrink-0 ${
                                  a.severity === "high" ? "text-destructive" : "text-yellow-500"
                                }`} />
                                <span className="text-[11px] font-mono font-semibold text-foreground">{a.code}</span>
                                <Badge variant={a.severity === "high" ? "destructive" : "secondary"} className="text-[8px] ml-auto">
                                  {a.severity}
                                </Badge>
                              </div>
                              <div className="ml-5 space-y-0.5">
                                {a.flags.map((f, fi) => (
                                  <p key={fi} className="text-[10px] text-muted-foreground">• {f}</p>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Shield className="w-8 h-8 text-muted-foreground/20 mb-2" />
                          <p className="text-xs text-muted-foreground">No abuse flags detected</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">
                            Monitors usage rate, avg discount, & revenue impact
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

            </>
          )}
        </TabsContent>

        {/* ==================== TRAFFIC TAB ==================== */}
        <TabsContent value="traffic" className="space-y-4 mt-4">
          {ga4Loading && <SkeletonKPIs count={6} />}
          {ga4Error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
              <p className="text-[11px] font-body text-destructive">GA4 Error: {ga4Error}</p>
              <button onClick={fetchGA4} className="mt-1 text-xs text-primary underline">Retry</button>
            </div>
          )}
          {ga4Data && !ga4Loading && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                <CommerceKPI icon={Eye} label="Sessions" value={ga4Data.overview.sessions.toLocaleString()} change={ga4Data.overview.sessionsChange} compareLabel={cmpLabel} color="hsl(200 70% 50%)" />
                <CommerceKPI icon={Users} label="Users" value={ga4Data.overview.totalUsers.toLocaleString()} change={ga4Data.overview.usersChange} compareLabel={cmpLabel} color="hsl(var(--primary))" />
                <CommerceKPI icon={Users} label="New Users" value={ga4Data.overview.newUsers.toLocaleString()} change={ga4Data.overview.newUsersChange} compareLabel={cmpLabel} color="hsl(150 60% 40%)" />
                <CommerceKPI icon={Eye} label="Page Views" value={ga4Data.overview.pageViews.toLocaleString()} color="hsl(280 60% 55%)" />
                <CommerceKPI icon={MousePointerClick} label="Engagement" value={`${ga4Data.overview.engagementRate}%`} change={ga4Data.overview.engagementRateChange} compareLabel={cmpLabel} color="hsl(45 80% 50%)" />
                <CommerceKPI icon={Clock} label="Avg Duration" value={`${Math.floor(ga4Data.overview.avgSessionDuration / 60)}m ${ga4Data.overview.avgSessionDuration % 60}s`} color="hsl(330 60% 50%)" />
              </div>

              {/* Sessions chart */}
              <Card className="border-border/30 bg-card/60">
                <CardHeader className="pb-2 px-3 sm:px-6">
                  <CardTitle className="font-display text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5" /> Sessions & Users
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={ga4Data.hourlyTrends && ga4Data.hourlyTrends.length > 0 ? ga4Data.hourlyTrends : ga4Data.dailyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={chartTickFormatter} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={35} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                      <Area type="monotone" dataKey="sessions" fill="hsl(200 70% 50% / 0.15)" stroke="hsl(200 70% 50%)" strokeWidth={2} name="Sessions" />
                      <Area type="monotone" dataKey="users" fill="hsl(var(--primary) / 0.1)" stroke="hsl(var(--primary))" strokeWidth={2} name="Users" />
                      <Line type="monotone" dataKey="newUsers" stroke="hsl(150 60% 40%)" strokeWidth={1.5} dot={false} name="New Users" />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Source filter badges */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-display mr-1">Filter by source:</span>
                <button
                  onClick={() => setSelectedSource(null)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-body transition-colors ${
                    !selectedSource ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  All
                </button>
                {ga4Data.trafficSources.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSource(selectedSource === s.channel ? null : s.channel)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-body transition-colors flex items-center gap-1.5 ${
                      selectedSource === s.channel ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    {s.channel}
                    <span className="opacity-70">{s.sessions.toLocaleString()}</span>
                  </button>
                ))}
              </div>

              {/* Source daily breakdown chart */}
              {selectedSource && ga4Data.sourceByDay && (() => {
                const filtered = ga4Data.sourceByDay.filter(r => r.channel === selectedSource);
                if (filtered.length === 0) return null;
                const totalSessions = filtered.reduce((s, r) => s + r.sessions, 0);
                const totalUsers = filtered.reduce((s, r) => s + r.users, 0);
                const totalNew = filtered.reduce((s, r) => s + r.newUsers, 0);
                return (
                  <Card className="border-primary/20 bg-card/60">
                    <CardHeader className="pb-2 px-3 sm:px-6">
                      <CardTitle className="font-display text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5" /> {selectedSource} — Daily Breakdown
                        <div className="ml-auto flex gap-3 text-[10px] font-body text-muted-foreground normal-case tracking-normal">
                          <span>{totalSessions.toLocaleString()} sessions</span>
                          <span>{totalUsers.toLocaleString()} users</span>
                          <span>{totalNew.toLocaleString()} new</span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6">
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={filtered.sort((a, b) => a.date.localeCompare(b.date))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={chartTickFormatter} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={35} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                          <Area type="monotone" dataKey="sessions" fill="hsl(200 70% 50% / 0.15)" stroke="hsl(200 70% 50%)" strokeWidth={2} name="Sessions" />
                          <Area type="monotone" dataKey="users" fill="hsl(var(--primary) / 0.1)" stroke="hsl(var(--primary))" strokeWidth={2} name="Users" />
                          <Line type="monotone" dataKey="newUsers" stroke="hsl(150 60% 40%)" strokeWidth={1.5} dot={false} name="New Users" />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Sources / Source-Medium / Pages / Devices */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <Card className="border-border/30 bg-card/60">
                  <CardHeader className="pb-2 px-3 sm:px-6">
                    <CardTitle className="font-display text-xs uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5" /> Sources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6">
                    <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                      {ga4Data.trafficSources.map((s, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-2 py-1.5 border-b border-border/15 last:border-0 cursor-pointer rounded-sm px-1 transition-colors ${
                            selectedSource === s.channel ? "bg-primary/10" : "hover:bg-secondary/30"
                          }`}
                          onClick={() => setSelectedSource(selectedSource === s.channel ? null : s.channel)}
                        >
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-body text-foreground truncate">{s.channel}</p>
                            <p className="text-[9px] text-muted-foreground">{s.engagementRate}% engaged</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] font-display text-foreground">{s.sessions.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Source / Medium breakdown */}
                {ga4Data.sourceMedium && ga4Data.sourceMedium.length > 0 && (
                  <Card className="border-border/30 bg-card/60">
                    <CardHeader className="pb-2 px-3 sm:px-6">
                      <CardTitle className="font-display text-xs uppercase tracking-wider flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5" /> Source / Medium
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6">
                      <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                        {ga4Data.sourceMedium.map((sm, i) => (
                          <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/15 last:border-0 px-1">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-body text-foreground truncate">{sm.source} / {sm.medium}</p>
                              <p className="text-[9px] text-muted-foreground">{sm.engagementRate}% engaged · {sm.newUsers.toLocaleString()} new</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[11px] font-display text-foreground">{sm.sessions.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-border/30 bg-card/60">
                  <CardHeader className="pb-2 px-3 sm:px-6">
                    <CardTitle className="font-display text-xs uppercase tracking-wider flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5" /> Top Pages
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6">
                    <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                      {ga4Data.topPages.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/15 last:border-0">
                          <span className="text-[10px] text-muted-foreground font-mono w-4 text-right shrink-0">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-body text-foreground truncate">{p.path}</p>
                          </div>
                          <span className="text-[11px] font-display text-foreground whitespace-nowrap">{p.pageViews.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/30 bg-card/60">
                  <CardHeader className="pb-2 px-3 sm:px-6">
                    <CardTitle className="font-display text-xs uppercase tracking-wider flex items-center gap-2">
                      <Monitor className="w-3.5 h-3.5" /> Devices
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6">
                    {ga4Data.devices.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={160}>
                          <PieChart>
                            <Pie data={ga4Data.devices} dataKey="sessions" nameKey="device" cx="50%" cy="50%" outerRadius={60} label={({ device, sessions }) => `${device} (${sessions})`} labelLine={false} fontSize={9}>
                              {ga4Data.devices.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-3 mt-1">
                          {ga4Data.devices.map((d, i) => {
                            const DevIcon = d.device === "mobile" ? Smartphone : d.device === "tablet" ? Tablet : Monitor;
                            return (
                              <div key={d.device} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <DevIcon className="w-3 h-3" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }} />
                                <span className="capitalize">{d.device}</span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-8">No device data</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* ==================== FUNNEL TAB ==================== */}
        <TabsContent value="funnel" className="space-y-4 mt-4">
          {ga4Data?.ecommerceFunnel ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <CommerceKPI icon={ShoppingBag} label="Cart Abandon" value={`${ga4Data.ecommerceFunnel.cartAbandonmentRate}%`} subtitle={`${ga4Data.ecommerceFunnel.addToCart}→${ga4Data.ecommerceFunnel.purchase}`} color="hsl(0 70% 50%)" />
                <CommerceKPI icon={Percent} label="Checkout Abandon" value={`${ga4Data.ecommerceFunnel.checkoutAbandonmentRate}%`} subtitle={`${ga4Data.ecommerceFunnel.beginCheckout}→${ga4Data.ecommerceFunnel.purchase}`} color="hsl(45 80% 50%)" />
                <CommerceKPI icon={Eye} label="ATC Rate" value={ga4Data.ecommerceFunnel.viewItem > 0 ? `${Math.round((ga4Data.ecommerceFunnel.addToCart / ga4Data.ecommerceFunnel.viewItem) * 100)}%` : "—"} subtitle={`${ga4Data.ecommerceFunnel.viewItem} views`} color="hsl(200 70% 50%)" />
                <CommerceKPI icon={CheckCircle2} label="Checkout Rate" value={ga4Data.ecommerceFunnel.addToCart > 0 ? `${Math.round((ga4Data.ecommerceFunnel.purchase / ga4Data.ecommerceFunnel.addToCart) * 100)}%` : "—"} subtitle="Cart → Buy" color="hsl(150 60% 40%)" />
              </div>

              <div className="grid lg:grid-cols-2 gap-3 sm:gap-4">
                <Card className="border-border/30 bg-card/60">
                  <CardHeader className="pb-2 px-3 sm:px-6">
                    <CardTitle className="font-display text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                      <TrendingDown className="w-3.5 h-3.5" /> Conversion Funnel
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-6">
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={ga4Data.ecommerceFunnel.steps} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis type="number" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis dataKey="step" type="category" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={80} />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} formatter={(value: number, _: string, entry: any) => { const maxCount = ga4Data.ecommerceFunnel!.steps[0]?.count || 1; return [`${value.toLocaleString()} (${Math.round((value / maxCount) * 100)}%)`, entry.payload.step]; }} />
                        <Bar dataKey="count" name="Events" radius={[0, 4, 4, 0]}>
                          {ga4Data.ecommerceFunnel.steps.map((_, i) => <Cell key={i} fill={["hsl(200 70% 50%)", "hsl(var(--primary))", "hsl(280 60% 55%)", "hsl(45 80% 50%)", "hsl(150 60% 40%)"][i]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-border/30 bg-card/60">
                  <CardHeader className="pb-2 px-3 sm:px-6">
                    <CardTitle className="font-display text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5" /> Daily Cart Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-6">
                    {ga4Data.dailyFunnelTrends && ga4Data.dailyFunnelTrends.length > 0 ? (
                      <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={ga4Data.dailyFunnelTrends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={chartTickFormatter} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={30} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                          <Area type="monotone" dataKey="add_to_cart" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth={2} name="Add to Cart" />
                          <Area type="monotone" dataKey="begin_checkout" fill="hsl(45 80% 50% / 0.15)" stroke="hsl(45 80% 50%)" strokeWidth={2} name="Begin Checkout" />
                          <Area type="monotone" dataKey="purchase" fill="hsl(150 60% 40% / 0.15)" stroke="hsl(150 60% 40%)" strokeWidth={2} name="Purchase" />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-10">No funnel data yet</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : ga4Loading ? (
            <SkeletonKPIs count={4} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Funnel data requires GA4</p>
            </div>
          )}
        </TabsContent>

        {/* ==================== SIGNALS TAB ==================== */}
        <TabsContent value="signals" className="space-y-4 mt-4">
          {summary ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <SummaryCard icon={Bell} label="Back-in-Stock" value={summary.totalBackInStock} onClick={() => onNavigate?.("back_in_stock")} />
              <SummaryCard icon={Heart} label="Wishlist" value={summary.totalWishlistAdds} />
              <SummaryCard icon={Star} label="Reviews" value={summary.totalReviews} subtitle={`${summary.avgRating}★`} onClick={() => onNavigate?.("reviews")} />
              <SummaryCard icon={AlertTriangle} label="Issues" value={summary.totalIssues} subtitle={`${summary.identifiedIssues} ID'd`} variant="warning" onClick={() => onNavigate?.("issues")} />
              <SummaryCard icon={Skull} label="Pts Earned" value={summary.totalPointsEarned.toLocaleString()} onClick={() => onNavigate?.("rewards")} />
              <SummaryCard icon={TrendingDown} label="Pts Redeemed" value={summary.totalPointsRedeemed.toLocaleString()} onClick={() => onNavigate?.("rewards")} />
              <SummaryCard icon={Users} label="Members" value={summary.totalMembers} onClick={() => onNavigate?.("members")} />
              <SummaryCard icon={Package} label="Frozen" value={summary.frozenMembers} variant={summary.frozenMembers > 0 ? "warning" : "default"} onClick={() => onNavigate?.("members")} />
            </div>
          ) : loading ? (
            <SkeletonKPIs count={8} />
          ) : null}

          {data && (
            <>
              {/* Daily Activity */}
              <Card className="border-border/30 bg-card/60">
                <CardHeader className="pb-2 px-3 sm:px-6">
                  <CardTitle className="font-display text-xs sm:text-sm uppercase tracking-wider">Daily Activity</CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={data.dailyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={chartTickFormatter} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={30} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                      <Area type="monotone" dataKey="wishlist" stackId="1" fill="hsl(280 60% 55% / 0.2)" stroke="hsl(280 60% 55%)" name="Wishlist" />
                      <Area type="monotone" dataKey="bis" stackId="1" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" name="BIS" />
                      <Area type="monotone" dataKey="reviews" stackId="1" fill="hsl(45 80% 50% / 0.2)" stroke="hsl(45 80% 50%)" name="Reviews" />
                      <Area type="monotone" dataKey="issues" stackId="1" fill="hsl(0 70% 50% / 0.2)" stroke="hsl(0 70% 50%)" name="Issues" />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Demand + Issues */}
              <div className="grid lg:grid-cols-2 gap-3 sm:gap-4">
                <Card className="border-border/30 bg-card/60">
                  <CardHeader className="pb-2 px-3 sm:px-6">
                    <CardTitle className="font-display text-xs uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5" /> Product Demand
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6">
                    <div className="space-y-1 max-h-[300px] overflow-y-auto">
                      {data.productDemand.slice(0, 15).map((p, i) => (
                        <div key={p.handle} className="flex items-center gap-2 py-1.5 border-b border-border/15 last:border-0">
                          <span className="text-[10px] text-muted-foreground font-mono w-4 text-right shrink-0">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-body text-foreground truncate">{p.title}</p>
                            <div className="flex gap-2 mt-0.5 flex-wrap">
                              {p.bis > 0 && <span className="text-[9px] text-primary">{p.bis} BIS</span>}
                              {p.wishlist > 0 && <span className="text-[9px]" style={{ color: "hsl(280 60% 55%)" }}>{p.wishlist} ♡</span>}
                              {p.reviews > 0 && <span className="text-[9px]" style={{ color: "hsl(45 80% 50%)" }}>{p.reviews}★{p.avgRating}</span>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[11px] font-display text-foreground">{p.score}</span>
                          </div>
                        </div>
                      ))}
                      {data.productDemand.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No demand signals</p>}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/30 bg-card/60">
                  <CardHeader className="pb-2 px-3 sm:px-6">
                    <CardTitle className="font-display text-xs uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6">
                    {data.issueBreakdown.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={data.issueBreakdown} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ category, count }) => `${formatLabel(category)} (${count})`} labelLine={false} fontSize={9}>
                            {data.issueBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-10">No issues logged</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Loyalty / Tiers / Shipping */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <Card className="border-border/30 bg-card/60">
                  <CardHeader className="pb-2 px-3 sm:px-6">
                    <CardTitle className="font-display text-xs uppercase tracking-wider">Loyalty Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6">
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                      {data.loyaltyBreakdown.map((l) => (
                        <div key={l.type} className="flex items-center justify-between py-1 border-b border-border/15 last:border-0">
                          <span className="text-[11px] font-body text-foreground">{formatLabel(l.type)}</span>
                          <div className="text-right">
                            <span className="text-[11px] font-display text-foreground">{l.count}</span>
                            <span className="text-[9px] text-muted-foreground ml-1.5">{l.totalPoints > 0 ? "+" : ""}{l.totalPoints.toLocaleString()}pts</span>
                          </div>
                        </div>
                      ))}
                      {data.loyaltyBreakdown.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No transactions</p>}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/30 bg-card/60">
                  <CardHeader className="pb-2 px-3 sm:px-6">
                    <CardTitle className="font-display text-xs uppercase tracking-wider">Tier Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-6">
                    {data.tierDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={data.tierDistribution} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis type="number" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis dataKey="tier" type="category" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={65} tickFormatter={formatLabel} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                          <Bar dataKey="count" name="Members">
                            {data.tierDistribution.map((entry) => <Cell key={entry.tier} fill={TIER_COLORS[entry.tier] || CHART_COLORS[0]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">No members</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/30 bg-card/60">
                  <CardHeader className="pb-2 px-3 sm:px-6">
                    <CardTitle className="font-display text-xs uppercase tracking-wider">Shipping Health</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6">
                    <div className="space-y-2">
                      {data.shippingHealth.map((s) => {
                        const total = data.shippingHealth.reduce((sum, h) => sum + h.count, 0);
                        const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                        return (
                          <div key={s.status} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-body">
                              <span className="text-foreground">{formatLabel(s.status)}</span>
                              <span className="text-muted-foreground">{s.count} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                      {data.shippingHealth.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No shipments</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Shipping Performance */}
              <Card className="border-border/30 bg-card/60">
                <CardHeader className="pb-2 px-3 sm:px-6">
                  <CardTitle className="font-display text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5" /> Shipping Performance
                  </CardTitle>
                  <p className="text-[9px] text-muted-foreground font-body mt-1">
                    {data.shippingPerformance.totalShipped > 0
                      ? `${data.shippingPerformance.totalShipped} shipped • ${data.shippingPerformance.totalDelivered} delivered`
                      : "No shipped orders in this selected date range"}
                  </p>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <ShippingKPI icon={Package} value={data.shippingPerformance.totalShipped} label="Total Shipped" color="hsl(var(--primary))" isCount />
                    <ShippingKPI icon={CheckCircle2} value={data.shippingPerformance.totalDelivered} label="Total Delivered" color="hsl(150 60% 40%)" isCount />
                    <ShippingKPI icon={Clock} value={data.shippingPerformance.avgFulfilledToDelivered} label="Avg Transit Time" color="hsl(280 60% 55%)" />
                  </div>
                </CardContent>
              </Card>

              {/* Points Flow */}
              <Card className="border-border/30 bg-card/60">
                <CardHeader className="pb-2 px-3 sm:px-6">
                  <CardTitle className="font-display text-xs sm:text-sm uppercase tracking-wider">Points Flow</CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={data.dailyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={chartTickFormatter} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={35} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                      <Line type="monotone" dataKey="points_earned" stroke="hsl(150 60% 40%)" strokeWidth={2} dot={false} name="Earned" />
                      <Line type="monotone" dataKey="points_redeemed" stroke="hsl(0 70% 50%)" strokeWidth={2} dot={false} name="Redeemed" />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Active Patterns */}
              {data?.activePatterns?.length > 0 && (
                <Card className="border-border/30 bg-card/60">
                  <CardHeader className="pb-2 px-3 sm:px-6">
                    <CardTitle className="font-display text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-destructive" /> Active Issue Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6">
                    <div className="space-y-1.5">
                      {data.activePatterns.map((p) => (
                        <div key={p.title} className="flex items-center gap-2 py-1.5 border-b border-border/15 last:border-0">
                          <Badge variant="secondary" className="text-[8px] font-display shrink-0">{formatLabel(p.category)}</Badge>
                          <span className="flex-1 text-[11px] font-body text-foreground truncate">{p.title}</span>
                          <span className="text-[11px] font-display text-destructive shrink-0">{p.occurrence_count}×</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ==================== Sub-components ==================== */

function SkeletonKPIs({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-border/30 bg-card/60 p-3 sm:p-4 space-y-2 animate-pulse">
          <div className="h-2.5 w-14 bg-muted rounded" />
          <div className="h-5 w-16 bg-muted rounded" />
          <div className="h-2 w-10 bg-muted/60 rounded" />
        </Card>
      ))}
    </div>
  );
}

function CommerceKPI({
  icon: Icon, label, value, change, subtitle, color, compareLabel,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  change?: number;
  subtitle?: string;
  color: string;
  compareLabel?: string;
}) {
  return (
    <Card className="border-border/30 bg-card/60 hover:bg-card/80 transition-colors">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" style={{ color }} />
          <span className="text-[9px] sm:text-[10px] font-display uppercase tracking-wider text-muted-foreground truncate">{label}</span>
        </div>
        <p className="text-base sm:text-lg font-display text-foreground leading-tight">{value}</p>
        <div className="flex items-center gap-1 mt-0.5 min-h-[14px]">
          {change !== undefined && (
            <span className={`flex items-center gap-0.5 text-[9px] sm:text-[10px] font-body ${change >= 0 ? "text-green-500" : "text-destructive"}`}>
              {change >= 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
              {Math.abs(change)}%
            </span>
          )}
          {subtitle && <span className="text-[9px] sm:text-[10px] text-muted-foreground font-body truncate">{subtitle}</span>}
          {change !== undefined && !subtitle && <span className="text-[9px] text-muted-foreground font-body truncate">{compareLabel || "vs prev"}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <Card className="border-border/30 bg-card/60">
      <CardContent className="p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-display text-foreground">{value}</p>
          <p className="text-[9px] sm:text-[10px] font-display uppercase tracking-wider text-muted-foreground truncate">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCard({ icon: Icon, label, value, subtitle, variant = "default", onClick }: { icon: React.ElementType; label: string; value: string | number; subtitle?: string; variant?: "default" | "warning"; onClick?: () => void }) {
  return (
    <Card
      className={`border-border/30 bg-card/60 transition-all ${onClick ? "cursor-pointer hover:border-primary/40 hover:bg-card/80 active:scale-[0.98]" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${variant === "warning" ? "text-destructive" : "text-muted-foreground"}`} />
          <span className="text-[9px] sm:text-[10px] font-display uppercase tracking-wider text-muted-foreground truncate">{label}</span>
          {onClick && <span className="ml-auto text-[9px] text-muted-foreground/40">→</span>}
        </div>
        <p className="text-lg sm:text-xl font-display text-foreground">{value}</p>
        {subtitle && <p className="text-[9px] sm:text-[10px] text-muted-foreground font-body mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function ShippingKPI({ icon: Icon, value, label, color, isCount }: { icon: React.ElementType; value: number | null; label: string; color: string; isCount?: boolean }) {
  return (
    <div className="flex flex-col items-center text-center py-3 sm:py-4">
      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-2 sm:mb-3" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-4 h-4 sm:w-6 sm:h-6" style={{ color }} />
      </div>
      <p className="text-xl sm:text-2xl font-display text-foreground">{value !== null ? `${value}` : "—"}</p>
      <p className="text-[9px] text-muted-foreground font-body">{value !== null ? (isCount ? "Orders" : "Days") : "No data"}</p>
      <p className="text-[8px] sm:text-[10px] font-display uppercase tracking-wider text-muted-foreground mt-1 leading-tight">{label}</p>
    </div>
  );
}
