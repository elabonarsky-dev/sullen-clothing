import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/hooks/useAuth";
import { useWishlistStore } from "@/stores/wishlistStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, User, Heart, Package, LogOut, Skull, Cake, Lock, ChevronRight, ExternalLink, Truck, X, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import vaultDoorImg from "@/assets/sullen-vault.jpg";
import { Link } from "react-router-dom";
import { SkullPointsDashboard } from "@/components/rewards/SkullPointsDashboard";
import { SubscriptionsTab } from "@/components/SubscriptionsTab";
import { CustomerSurvey } from "@/components/CustomerSurvey";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

function BirthdayCard({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile-birthday", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("birthday")
        .eq("user_id", userId)
        .maybeSingle();
      return data;
    },
  });

  const [birthday, setBirthday] = useState("");

  useEffect(() => {
    if (profile?.birthday) setBirthday(profile.birthday);
  }, [profile]);

  const handleSave = async () => {
    if (!birthday) return;
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        await supabase.from("profiles").update({ birthday }).eq("user_id", userId);
      } else {
        await supabase.from("profiles").insert({ user_id: userId, birthday });
      }
      queryClient.invalidateQueries({ queryKey: ["profile-birthday"] });
      toast.success("Birthday saved! You'll earn 3× points on your birthday 🎂");
    } catch {
      toast.error("Failed to save birthday");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="bg-card border border-border/20 rounded-lg p-6 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Cake className="w-4 h-4 text-primary" />
        <p className="text-xs font-display uppercase tracking-wider text-foreground">
          Birthday Bonus
        </p>
      </div>
      <p className="text-[11px] font-body text-muted-foreground">
        Set your birthday to earn <span className="text-primary font-semibold">3× Skull Points</span> on all purchases made on your birthday.
      </p>
      <div className="flex gap-2">
        <Input
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          className="flex-1 text-xs"
          disabled={!!profile?.birthday}
        />
        {!profile?.birthday && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!birthday || saving}
            className="font-display text-[10px] uppercase tracking-wider"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
          </Button>
        )}
      </div>
      {profile?.birthday && (
        <p className="text-[10px] font-body text-muted-foreground/70">
          🎂 Birthday set — can't be changed once saved
        </p>
      )}
    </div>
  );
}

interface OrderHistoryItem {
  id: string;
  order_name: string;
  order_date: string;
  total_price: number;
  currency: string;
  financial_status: string;
  fulfillment_status: string;
  line_items: Array<{
    title: string;
    variant_title: string;
    quantity: number;
    price: string;
    image: string;
  }>;
}

function OrdersTab({ userEmail, userId }: { userEmail: string; userId: string }) {
  const [selectedOrder, setSelectedOrder] = useState<OrderHistoryItem | null>(null);
  const [ordersPage, setOrdersPage] = useState(1);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["order-history", userId, userEmail],
    queryFn: async () => {
      const normalizedEmail = userEmail.trim().toLowerCase();

      const { data: byUserId, error: byUserIdError } = await supabase
        .from("order_history")
        .select("id, order_name, order_date, total_price, currency, financial_status, fulfillment_status, line_items")
        .eq("user_id", userId)
        .order("order_date", { ascending: false })
        .limit(50);

      if (byUserIdError) throw byUserIdError;
      if (byUserId && byUserId.length > 0) {
        return byUserId as OrderHistoryItem[];
      }

      const { data: byEmail, error: byEmailError } = await supabase
        .from("order_history")
        .select("id, order_name, order_date, total_price, currency, financial_status, fulfillment_status, line_items")
        .ilike("email", normalizedEmail)
        .order("order_date", { ascending: false })
        .limit(50);

      if (byEmailError) throw byEmailError;
      return (byEmail || []) as OrderHistoryItem[];
    },
    enabled: !!userEmail && !!userId,
  });

  // Derive effective status considering financial_status and age
  const getEffectiveStatus = (order: OrderHistoryItem) => {
    // Cancelled / refunded / voided
    const fs = (order.financial_status || "").toLowerCase();
    if (["cancelled", "refunded", "voided"].includes(fs)) return "cancelled";

    const fulfillment = (order.fulfillment_status || "").toLowerCase();
    if (fulfillment === "fulfilled" || fulfillment === "delivered") return fulfillment;
    if (fulfillment === "partial") return "partial";

    // Old unfulfilled orders (>14 days) are almost certainly delivered
    const age = Date.now() - new Date(order.order_date).getTime();
    const dayMs = 86400000;
    if (age > 14 * dayMs && (!fulfillment || fulfillment === "unfulfilled")) {
      return "delivered";
    }

    return "unfulfilled";
  };

  const statusConfig: Record<string, { label: string; className: string }> = {
    unfulfilled: { label: "Processing", className: "bg-yellow-500/10 text-yellow-600" },
    fulfilled: { label: "Shipped", className: "bg-green-500/10 text-green-600" },
    partial: { label: "In Transit", className: "bg-blue-500/10 text-blue-600" },
    delivered: { label: "Delivered", className: "bg-green-500/10 text-green-700" },
    cancelled: { label: "Cancelled", className: "bg-red-500/10 text-red-500" },
  };

  const statusBadge = (status: string) => {
    const s = statusConfig[status] || { label: status || "Processing", className: "bg-muted text-muted-foreground" };
    return (
      <span className={`inline-block text-[10px] font-display uppercase tracking-wider px-2 py-0.5 rounded-full ${s.className}`}>
        {s.label}
      </span>
    );
  };

  // Split orders into active (processing/shipped/in-transit) and past (delivered/cancelled)
  const activeOrders = (orders || []).filter((o) => {
    const s = getEffectiveStatus(o);
    return s === "unfulfilled" || s === "fulfilled" || s === "partial";
  });
  const pastOrders = (orders || []).filter((o) => {
    const s = getEffectiveStatus(o);
    return s === "delivered" || s === "cancelled";
  });

  return (
    <div className="space-y-6">
      {/* Track Order Card */}
      <div className="bg-card border border-border/20 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Truck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-display uppercase tracking-wider text-foreground">Track Your Order</h3>
            <p className="text-xs font-body text-muted-foreground">Real-time shipping updates</p>
          </div>
        </div>
        <Link to={`/track?email=${encodeURIComponent(userEmail)}`}>
          <Button className="w-full font-display uppercase tracking-wider text-xs" size="sm">
            <Package className="w-3.5 h-3.5 mr-2" />
            Go to Order Tracking
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-body text-muted-foreground mb-2">No orders yet</p>
          <p className="text-xs font-body text-muted-foreground/60 mb-4">Orders placed after today will appear here</p>
          <Link to="/">
            <Button variant="outline" size="sm" className="font-display uppercase tracking-wider text-xs">
              Shop Now
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Active Orders — full cards with product photos */}
          {activeOrders.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-display uppercase tracking-[0.2em] text-muted-foreground">Active Orders</p>
              {activeOrders.map((order) => {
                const lineItems = Array.isArray(order.line_items) ? order.line_items : [];
                const firstImage = lineItems.find((li) => li.image)?.image;
                const itemCount = lineItems.reduce((sum, li) => sum + (li.quantity || 1), 0);
                const formattedDate = new Date(order.order_date).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                });
                const currencySymbol = order.currency === "USD" ? "$" : order.currency;
                const effectiveStatus = getEffectiveStatus(order);

                return (
                  <Link
                    key={order.id}
                    to={`/track?order=${encodeURIComponent(order.order_name)}&email=${encodeURIComponent(userEmail)}`}
                    className="block bg-card border border-border/20 rounded-lg p-4 hover:border-primary/30 transition-colors group"
                  >
                    <div className="flex items-start gap-4">
                      {firstImage ? (
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-secondary shrink-0">
                          <img src={firstImage} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-md bg-secondary/50 flex items-center justify-center shrink-0">
                          <Package className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-display uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
                            {order.order_name}
                          </p>
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                        </div>
                        <p className="text-xs font-body text-muted-foreground mb-2">{formattedDate}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {statusBadge(effectiveStatus)}
                            <span className="text-[11px] font-body text-muted-foreground">
                              {itemCount} item{itemCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <p className="text-sm font-display text-foreground">
                            {currencySymbol}{Number(order.total_price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Past Orders — compact list, tap to open drawer */}
          {pastOrders.length > 0 && (() => {
            const ORDERS_PER_PAGE = 5;
            return (
            <div className="space-y-2">
              <p className="text-[10px] font-display uppercase tracking-[0.2em] text-muted-foreground">
                Past Orders ({pastOrders.length})
              </p>
              {pastOrders.slice(0, ordersPage * ORDERS_PER_PAGE).map((order) => {
                const lineItems = Array.isArray(order.line_items) ? order.line_items : [];
                const itemCount = lineItems.reduce((sum, li) => sum + (li.quantity || 1), 0);
                const formattedDate = new Date(order.order_date).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                });
                const currencySymbol = order.currency === "USD" ? "$" : order.currency;
                const effectiveStatus = getEffectiveStatus(order);

                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="w-full text-left bg-card border border-border/20 rounded-lg px-4 py-3 hover:border-primary/30 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <p className="text-sm font-display uppercase tracking-wider text-foreground group-hover:text-primary transition-colors shrink-0">
                          {order.order_name}
                        </p>
                        {statusBadge(effectiveStatus)}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-body text-muted-foreground hidden sm:inline">{formattedDate}</span>
                        <p className="text-sm font-display text-foreground">
                          {currencySymbol}{Number(order.total_price).toFixed(2)}
                        </p>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                    <p className="text-[11px] font-body text-muted-foreground mt-1 sm:hidden">{formattedDate} · {itemCount} item{itemCount !== 1 ? "s" : ""}</p>
                  </button>
                );
              })}
              {pastOrders.length > ordersPage * ORDERS_PER_PAGE && (
                <button
                  onClick={() => setOrdersPage(p => p + 1)}
                  className="w-full text-center py-2.5 text-xs font-display uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                >
                  Show More Orders
                </button>
              )}
            </div>
            );
          })()}
        </>
      )}

      {/* Order Detail Drawer */}
      <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent className="w-full sm:max-w-md bg-background border-border/30 overflow-y-auto">
          {selectedOrder && (() => {
            const lineItems = Array.isArray(selectedOrder.line_items) ? selectedOrder.line_items : [];
            const itemCount = lineItems.reduce((sum, li) => sum + (li.quantity || 1), 0);
            const formattedDate = new Date(selectedOrder.order_date).toLocaleDateString("en-US", {
              weekday: "short", month: "short", day: "numeric", year: "numeric",
            });
            const currencySymbol = selectedOrder.currency === "USD" ? "$" : selectedOrder.currency;
            const effectiveStatus = getEffectiveStatus(selectedOrder);

            return (
              <>
                <SheetHeader className="pb-4 border-b border-border/20">
                  <SheetTitle className="font-display uppercase tracking-wider text-foreground">
                    {selectedOrder.order_name}
                  </SheetTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {statusBadge(effectiveStatus)}
                    <span className="text-xs font-body text-muted-foreground">{formattedDate}</span>
                  </div>
                </SheetHeader>

                {/* Line Items */}
                <div className="py-4 space-y-3">
                  <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-2">
                    {itemCount} Item{itemCount !== 1 ? "s" : ""}
                  </p>
                  {lineItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      {item.image ? (
                        <div className="w-14 h-14 rounded-md overflow-hidden bg-secondary shrink-0">
                          <img src={item.image} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-md bg-secondary/50 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-display uppercase tracking-wider text-foreground line-clamp-2">
                          {item.title}
                        </p>
                        {item.variant_title && item.variant_title !== "Default Title" && (
                          <p className="text-[11px] font-body text-muted-foreground mt-0.5">{item.variant_title}</p>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[11px] font-body text-muted-foreground">Qty: {item.quantity}</span>
                          <span className="text-xs font-display text-foreground">{currencySymbol}{Number(item.price).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Total */}
                <div className="border-t border-border/20 pt-4 flex items-center justify-between">
                  <span className="text-xs font-display uppercase tracking-wider text-muted-foreground">Total</span>
                  <span className="text-base font-display text-foreground">{currencySymbol}{Number(selectedOrder.total_price).toFixed(2)}</span>
                </div>

                {/* Actions */}
                {effectiveStatus !== "cancelled" && (
                  <div className="mt-6 space-y-2">
                    <Link
                      to={`/track?order=${encodeURIComponent(selectedOrder.order_name)}&email=${encodeURIComponent(userEmail)}`}
                      onClick={() => setSelectedOrder(null)}
                    >
                      <Button className="w-full font-display uppercase tracking-wider text-xs" size="sm">
                        <Truck className="w-3.5 h-3.5 mr-2" />
                        Track Order
                      </Button>
                    </Link>
                    <Link
                      to="/returns"
                      onClick={() => setSelectedOrder(null)}
                    >
                      <Button variant="outline" className="w-full font-display uppercase tracking-wider text-xs mt-2" size="sm">
                        Return or Exchange
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Helpful links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Link to="/returns" className="bg-card border border-border/20 rounded-lg p-4 hover:border-primary/30 transition-colors group">
          <p className="text-xs font-display uppercase tracking-wider text-foreground group-hover:text-primary transition-colors mb-1">Returns & Exchanges</p>
          <p className="text-[11px] font-body text-muted-foreground">Start a return or exchange for any order</p>
        </Link>
        <Link to="/support" className="bg-card border border-border/20 rounded-lg p-4 hover:border-primary/30 transition-colors group">
          <p className="text-xs font-display uppercase tracking-wider text-foreground group-hover:text-primary transition-colors mb-1">Need Help?</p>
          <p className="text-[11px] font-body text-muted-foreground">Contact our support team</p>
        </Link>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"profile" | "rewards" | "wishlist" | "orders" | "subscriptions">("profile");
  const wishlistItems = useWishlistStore((s) => s.items);

  useEffect(() => {
    if (!loading && !user) navigate("/account/login", { replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <>
        <SEO title="My Account" robots="noindex, nofollow" />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "rewards" as const, label: "Skull Points", icon: Skull },
    { id: "subscriptions" as const, label: "Subscriptions", icon: RefreshCw },
    { id: "wishlist" as const, label: "Wishlist", icon: Heart, count: wishlistItems.length },
    { id: "orders" as const, label: "Orders", icon: Package },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO title="My Account" robots="noindex, nofollow" />
      <SiteHeader />
      <div className="container max-w-4xl py-16 md:py-24">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-xl md:text-2xl font-display uppercase tracking-[0.15em] text-foreground">
            My Account
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-xs font-display uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            Sign Out
          </Button>
        </div>

        {/* Tabs — grid on mobile, horizontal on desktop */}
        <div className="grid grid-cols-2 gap-2 md:flex md:gap-1 md:border-b md:border-border/30 mb-6">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-display uppercase tracking-wider transition-all whitespace-nowrap rounded-lg md:rounded-none md:border-b-2 ${
                tab === id
                  ? "bg-primary/10 text-primary border border-primary/20 md:border-0 md:border-b-2 md:border-primary md:bg-transparent"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground border border-border/10 md:border-0 md:border-b-2 md:border-transparent md:bg-transparent"
              }`}
            >
              <Icon className="w-4 h-4 md:w-3.5 md:h-3.5" />
              {label}
              {count !== undefined && count > 0 && (
                <span className="ml-auto md:ml-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Vault CTA — mirrors vault page aesthetic */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{
            boxShadow: [
              "0 0 20px hsl(38 60% 55% / 0.08), 0 0 40px hsl(38 60% 55% / 0.04)",
              "0 0 35px hsl(38 60% 55% / 0.2), 0 0 70px hsl(38 60% 55% / 0.1)",
              "0 0 20px hsl(38 60% 55% / 0.08), 0 0 40px hsl(38 60% 55% / 0.04)",
            ],
            transition: {
              boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            },
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          onClick={() => navigate("/vault")}
          className="group relative w-full mb-8 rounded-xl overflow-hidden h-[130px] md:h-[150px]"
        >
          {/* Vault door background image */}
          <img
            src={vaultDoorImg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700"
          />
          {/* Dark overlay with gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, hsl(0 0% 4% / 0.85), hsl(0 0% 8% / 0.7) 50%, hsl(0 0% 4% / 0.9))`,
            }}
          />
          {/* Dot texture */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle, hsl(0 0% 60%) 0.5px, transparent 0.5px)`,
              backgroundSize: "24px 24px",
            }}
          />
          {/* Gold border glow */}
          <div
            className="absolute inset-0 rounded-xl opacity-50 group-hover:opacity-80 transition-opacity duration-500"
            style={{
              background: `linear-gradient(135deg, hsl(38 60% 55% / 0.4), transparent 30%, transparent 70%, hsl(38 60% 55% / 0.3))`,
              mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
              maskComposite: `exclude`,
              WebkitMaskComposite: `xor`,
              padding: "1px",
            }}
          />
          {/* Content */}
          <div className="relative z-10 flex items-center justify-between h-full px-6 md:px-8">
            <div className="flex items-center gap-4 md:gap-5">
              {/* Vault icon with spinning conic ring */}
              <span className="relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center shrink-0">
                <span
                  className="absolute inset-0 rounded-full animate-[spin_8s_linear_infinite]"
                  style={{
                    background: `conic-gradient(from 0deg, hsl(38 60% 55% / 0.5), transparent 20%, hsl(38 60% 55% / 0.3) 40%, transparent 60%, hsl(38 60% 55% / 0.6) 80%, transparent)`,
                  }}
                />
                <span
                  className="absolute inset-[2px] rounded-full"
                  style={{ background: `linear-gradient(135deg, hsl(0 0% 6%), hsl(0 0% 10%))`, border: "1px solid hsl(38 60% 55% / 0.15)" }}
                />
                <Lock className="w-5 h-5 md:w-6 md:h-6 relative z-10 group-hover:scale-110 transition-transform duration-300" style={{ color: "hsl(38 60% 55%)" }} strokeWidth={1.5} />
              </span>
              <div className="text-left">
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-px w-6" style={{ background: "linear-gradient(90deg, transparent, hsl(38 60% 55% / 0.4))" }} />
                  <span className="text-[8px] md:text-[9px] font-display uppercase tracking-[0.45em]" style={{ color: "hsl(38 60% 55% / 0.5)" }}>
                    Members Only
                  </span>
                  <div className="h-px w-6" style={{ background: "linear-gradient(270deg, transparent, hsl(38 60% 55% / 0.4))" }} />
                </div>
                <p className="text-base md:text-lg font-display uppercase tracking-[0.2em] text-white group-hover:text-[hsl(38_60%_55%)] transition-colors duration-300">
                  The Vault
                </p>
                <p className="text-[10px] font-body mt-0.5" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
                  Exclusive drops & early access
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 group-hover:translate-x-1 transition-transform duration-300" style={{ color: "hsl(38 60% 55% / 0.5)" }}>
              <span className="hidden md:block text-[9px] font-display uppercase tracking-[0.25em]" style={{ color: "hsl(38 60% 55% / 0.4)" }}>
                Enter
              </span>
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </motion.button>

        {/* Profile Tab */}
        {tab === "profile" && (
          <div className="space-y-6">
            <div className="bg-card border border-border/20 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-display text-sm uppercase tracking-wider text-foreground">
                    {user.user_metadata?.full_name || user.email?.split("@")[0] || "Customer"}
                  </p>
                  <p className="text-xs font-body text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="h-px bg-border/20" />
              <div className="grid grid-cols-2 gap-4 text-xs font-body">
                <div>
                  <p className="text-muted-foreground mb-1">Member since</p>
                  <p className="text-foreground">{new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Login method</p>
                  <p className="text-foreground capitalize">{user.app_metadata?.provider || "email"}</p>
                </div>
              </div>
            </div>

            {/* Birthday Section */}
            <BirthdayCard userId={user.id} />

            {/* Customer Survey */}
            <CustomerSurvey userId={user.id} />
          </div>
        )}

        {/* Rewards Tab */}
        {tab === "rewards" && <SkullPointsDashboard />}

        {/* Wishlist Tab */}
        {tab === "wishlist" && (
          <div>
            {wishlistItems.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-body text-muted-foreground mb-4">Your wishlist is empty</p>
                <Link to="/">
                  <Button variant="outline" size="sm" className="font-display uppercase tracking-wider text-xs">
                    Browse Products
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {wishlistItems.map((item) => (
                  <Link
                    key={item.productHandle}
                    to={`/product/${item.productHandle}`}
                    className="group"
                  >
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-secondary mb-2">
                      {item.productImage && (
                        <img
                          src={item.productImage}
                          alt={item.productTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                    </div>
                    <p className="text-xs font-display uppercase tracking-wider text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {item.productTitle}
                    </p>
                    {item.productPrice && (
                      <p className="text-xs font-body text-muted-foreground">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: item.currencyCode || "USD",
                        }).format(parseFloat(item.productPrice))}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "subscriptions" && <SubscriptionsTab />}

        {tab === "orders" && <OrdersTab userEmail={user.email || ""} userId={user.id} />}
      </div>
      <SiteFooter />
    </div>
  );
}
