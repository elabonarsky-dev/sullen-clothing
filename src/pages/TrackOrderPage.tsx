import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Truck, CheckCircle, Clock, MapPin, ExternalLink, Search, ArrowRight, ShieldCheck } from "lucide-react";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TrackingEvent {
  status: string;
  title: string;
  description: string;
  occurred_at: string | null;
  completed: boolean;
  tracking_number?: string;
  tracking_url?: string;
  carrier?: string;
}

interface LineItem {
  title: string;
  variant_title: string | null;
  quantity: number;
  price: string;
  image: string | null;
}

interface TrackingData {
  order_name: string;
  email: string;
  created_at: string;
  status: string;
  financial_status: string;
  fulfillment_status: string | null;
  line_items: LineItem[];
  timeline: TrackingEvent[];
  tracking: {
    number: string | null;
    url: string | null;
    carrier: string | null;
  };
  shipping_address: {
    city: string;
    province: string;
    country: string;
  } | null;
}

const STATUS_ICONS: Record<string, typeof Package> = {
  confirmed: ShieldCheck,
  payment: CheckCircle,
  processing: Clock,
  shipped: Truck,
  delivered: Package,
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

export default function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [error, setError] = useState("");
  const [autoLooked, setAutoLooked] = useState(false);

  // Auto-fill from URL params like /track?order=494429&email=x@y.com
  useEffect(() => {
    const orderParam = searchParams.get("order") || searchParams.get("order_number") || "";
    const emailParam = searchParams.get("email") || "";
    if (orderParam) setOrderNumber(orderParam);
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  // Auto-submit when both params are present
  useEffect(() => {
    if (autoLooked) return;
    const orderParam = searchParams.get("order") || searchParams.get("order_number") || "";
    const emailParam = searchParams.get("email") || "";
    if (orderParam && emailParam) {
      setAutoLooked(true);
      // Small delay to let state settle
      const timer = setTimeout(() => {
        handleLookup(orderParam, emailParam);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchParams, autoLooked]);

  const handleLookup = async (orderNum: string, emailAddr: string) => {
    setError("");
    setTracking(null);
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("track-order", {
        body: { order_number: orderNum.trim(), email: emailAddr.trim() },
      });
      if (fnError) throw fnError;
      if (data?.error) {
        setError(data.error);
      } else {
        setTracking(data);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !email.trim()) {
      setError("Please enter both order number and email.");
      return;
    }
    handleLookup(orderNumber, email);
  };

  const currentStepIndex = tracking
    ? ["confirmed", "processing", "shipped", "delivered"].indexOf(tracking.status)
    : -1;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Track Order"
        robots="noindex, nofollow"
        description="Track your Sullen Clothing order in real-time. Enter your order number and email to see your shipment status."
        path="/track"
      />
      <AnnouncementBar />
      <SiteHeader />

      <main className="max-w-4xl mx-auto px-4 py-12 sm:py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="font-heading text-3xl sm:text-5xl text-foreground uppercase tracking-wider mb-3">
            Track Your Order
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            Enter your order number and email to see real-time updates on your shipment.
          </p>
        </motion.div>

        {/* Lookup form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-sm p-6 sm:p-8 mb-10"
        >
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block font-medium">
                Order Number
              </label>
              <Input
                placeholder="#1001"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block font-medium">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border-border"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-widest text-sm font-semibold"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
                Looking up…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Track Order
              </span>
            )}
          </Button>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-destructive text-sm mt-4 text-center"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.form>

        {/* Tracking Results */}
        <AnimatePresence mode="wait">
          {tracking && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Status bar */}
              <div className="bg-card border border-border rounded-sm p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Order</p>
                    <p className="text-xl font-heading text-foreground">{tracking.order_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-sm font-semibold uppercase tracking-wider ${
                      tracking.status === "delivered"
                        ? "bg-green-500/10 text-green-400"
                        : tracking.status === "shipped"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-foreground"
                    }`}>
                      {STATUS_LABELS[tracking.status] || tracking.status}
                    </span>
                  </div>
                </div>

                {/* Progress steps */}
                <div className="relative">
                  <div className="flex justify-between items-center">
                    {["confirmed", "processing", "shipped", "delivered"].map((step, idx) => {
                      const Icon = STATUS_ICONS[step] || Package;
                      const isComplete = idx <= currentStepIndex;
                      const isCurrent = idx === currentStepIndex;
                      return (
                        <div key={step} className="flex flex-col items-center relative z-10">
                          <motion.div
                            initial={false}
                            animate={{
                              scale: isCurrent ? 1.15 : 1,
                              backgroundColor: isComplete ? "hsl(var(--primary))" : "hsl(var(--muted))",
                            }}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center"
                          >
                            <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${isComplete ? "text-primary-foreground" : "text-muted-foreground"}`} />
                          </motion.div>
                          <span className={`text-[10px] sm:text-xs mt-2 uppercase tracking-wider font-medium ${
                            isComplete ? "text-primary" : "text-muted-foreground"
                          }`}>
                            {STATUS_LABELS[step]}
                          </span>
                          {isCurrent && (
                            <motion.div
                              layoutId="pulse"
                              className="absolute -inset-1 rounded-full border-2 border-primary/40"
                              animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Connector line */}
                  <div className="absolute top-5 sm:top-6 left-[10%] right-[10%] h-0.5 bg-muted -z-0">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: "0%" }}
                      animate={{ width: `${Math.max(0, (currentStepIndex / 3) * 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>

              {/* Tracking details */}
              {tracking.tracking.number && (
                <div className="bg-card border border-border rounded-sm p-6 mb-6">
                  <h2 className="font-heading text-lg text-foreground uppercase tracking-wider mb-4">
                    Shipment Details
                  </h2>
                  <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Carrier</p>
                      <p className="text-foreground font-medium">{tracking.tracking.carrier || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Tracking #</p>
                      <p className="text-foreground font-medium font-mono text-xs">{tracking.tracking.number}</p>
                    </div>
                    {tracking.shipping_address && (
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Destination</p>
                        <p className="text-foreground font-medium flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {[tracking.shipping_address.city, tracking.shipping_address.province].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                  {tracking.tracking.url && (
                    <a
                      href={tracking.tracking.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-4 text-primary text-sm font-semibold uppercase tracking-wider hover:underline"
                    >
                      Track on carrier site <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              )}

              {/* Timeline */}
              <div className="bg-card border border-border rounded-sm p-6 mb-6">
                <h2 className="font-heading text-lg text-foreground uppercase tracking-wider mb-6">
                  Order Timeline
                </h2>
                <div className="space-y-0">
                  {tracking.timeline.map((event, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full mt-1 ${
                          event.completed ? "bg-primary" : "bg-muted-foreground/30"
                        }`} />
                        {idx < tracking.timeline.length - 1 && (
                          <div className={`w-px flex-1 min-h-[2rem] ${
                            event.completed ? "bg-primary/40" : "bg-border"
                          }`} />
                        )}
                      </div>
                      <div className="pb-6">
                        <p className={`font-semibold text-sm ${
                          event.completed ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {event.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                        {event.occurred_at && (
                          <p className="text-[10px] text-muted-foreground/60 mt-1">
                            {new Date(event.occurred_at).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric",
                              hour: "numeric", minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order items */}
              <div className="bg-card border border-border rounded-sm p-6">
                <h2 className="font-heading text-lg text-foreground uppercase tracking-wider mb-4">
                  Items in This Order
                </h2>
                <div className="divide-y divide-border">
                  {tracking.line_items.map((item, idx) => (
                    <div key={idx} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded-sm bg-muted"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-sm flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                        {item.variant_title && (
                          <p className="text-xs text-muted-foreground">{item.variant_title}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Qty: {item.quantity} · ${parseFloat(item.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Help */}
              <div className="text-center mt-8 text-sm text-muted-foreground">
                <p>
                  Need help?{" "}
                  <a href="/pages/faq" className="text-primary hover:underline">
                    Visit our FAQ
                  </a>{" "}
                  or email{" "}
                  <a href="mailto:support@sullenclothing.com" className="text-primary hover:underline">
                    support@sullenclothing.com
                  </a>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <SiteFooter />
    </div>
  );
}
