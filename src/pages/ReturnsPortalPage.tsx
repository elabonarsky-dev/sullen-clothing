import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SEO } from "@/components/SEO";
import { Package, ArrowLeftRight, CreditCard, DollarSign, Search, ChevronRight, Check, Loader2, ArrowLeft, Gift } from "lucide-react";
import { searchProducts, type SearchResultProduct } from "@/lib/shopify";

interface OrderLineItem {
  id: string;
  title: string;
  variant_title: string | null;
  quantity: number;
  price: string;
  image: string | null;
  product_id: string;
  variant_id: string;
  fulfillment_status: string | null;
}

interface OrderData {
  order_id: string;
  order_name: string;
  email: string;
  created_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  line_items: OrderLineItem[];
  days_since_order: number;
}

type Resolution = "exchange" | "store_credit" | "refund";

interface SelectedItem {
  lineItem: OrderLineItem;
  quantity: number;
  resolution: Resolution;
  exchangeProduct?: SearchResultProduct;
  exchangeVariantId?: string;
  exchangeVariantTitle?: string;
}

type Step = "lookup" | "select" | "resolve" | "confirm" | "success";

export default function ReturnsPortalPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("lookup");
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [reason, setReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeExchangeIdx, setActiveExchangeIdx] = useState<number | null>(null);
  const [returnResult, setReturnResult] = useState<{ return_id: string; status: string; message: string } | null>(null);

  const handleLookup = async () => {
    if (!orderNumber.trim() || !email.trim()) {
      toast.error("Please enter your order number and email");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("order-lookup", {
        body: { order_number: orderNumber.trim(), email: email.trim() },
      });
      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }
      setOrder(data);
      setStep("select");
    } catch (err: any) {
      toast.error(err.message || "Failed to look up order");
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (item: OrderLineItem) => {
    setSelectedItems((prev) => {
      const exists = prev.find((s) => s.lineItem.id === item.id);
      if (exists) return prev.filter((s) => s.lineItem.id !== item.id);
      return [...prev, { lineItem: item, quantity: item.quantity, resolution: "exchange" }];
    });
  };

  const updateResolution = (idx: number, resolution: Resolution) => {
    setSelectedItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, resolution } : item))
    );
  };

  const handleExchangeSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchProducts(query, 6);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectExchangeProduct = (idx: number, product: SearchResultProduct) => {
    const firstVariant = product.variants?.edges?.[0]?.node;
    setSelectedItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? {
              ...item,
              exchangeProduct: product,
              exchangeVariantId: firstVariant?.id,
              exchangeVariantTitle: firstVariant?.title,
            }
          : item
      )
    );
    setActiveExchangeIdx(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please log in to submit a return request");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-return", {
        body: {
          order_id: order!.order_id,
          order_name: order!.order_name,
          order_email: order!.email,
          reason,
          user_id: user?.id || null,
          items: selectedItems.map((s) => ({
            line_item_title: s.lineItem.title,
            line_item_variant: s.lineItem.variant_title,
            line_item_image: s.lineItem.image,
            line_item_price: parseFloat(s.lineItem.price),
            quantity: s.quantity,
            resolution: s.resolution,
            exchange_product_handle: s.exchangeProduct?.handle,
            exchange_variant_id: s.exchangeVariantId,
            exchange_variant_title: s.exchangeVariantTitle,
          })),
        },
      });
      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }
      setReturnResult(data);
      setStep("success");
      // Log the return as an issue for pattern tracking
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/classify-issue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          source: "return",
          customer_message: `Return request: ${reason || "No reason provided"}. Items: ${selectedItems.map(s => s.lineItem.title).join(", ")}`,
          metadata: { order_name: order!.order_name, item_count: selectedItems.length },
          customer_email: order!.email,
          order_number: order!.order_name,
        }),
      }).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || "Failed to submit return");
    } finally {
      setLoading(false);
    }
  };

  const exchangeTotal = selectedItems
    .filter((s) => s.resolution === "exchange")
    .reduce((sum, s) => sum + parseFloat(s.lineItem.price) * s.quantity, 0);

  const creditTotal = selectedItems
    .filter((s) => s.resolution === "store_credit")
    .reduce((sum, s) => sum + parseFloat(s.lineItem.price) * s.quantity, 0);

  const refundTotal = selectedItems
    .filter((s) => s.resolution === "refund")
    .reduce((sum, s) => sum + parseFloat(s.lineItem.price) * s.quantity, 0);

  const resolutionIcons: Record<Resolution, typeof ArrowLeftRight> = {
    exchange: ArrowLeftRight,
    store_credit: CreditCard,
    refund: DollarSign,
  };

  const resolutionLabels: Record<Resolution, string> = {
    exchange: "Exchange",
    store_credit: "Store Credit",
    refund: "Refund",
  };

  const resolutionDescriptions: Record<Resolution, string> = {
    exchange: "Swap for a different item + earn bonus Skull Points",
    store_credit: "Get instant store credit to use anytime",
    refund: "Refund to original payment method",
  };

  return (
    <>
      <SEO title="Returns Portal | Sullen Clothing" description="Start a return or exchange for your Sullen order." />
      <SiteHeader />
      <main className="min-h-screen bg-background pt-8 pb-20">
        <div className="container max-w-2xl mx-auto px-4">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {(["lookup", "select", "resolve", "confirm"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-display uppercase transition-colors ${
                    step === s || (["lookup", "select", "resolve", "confirm"].indexOf(step) > i)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {["lookup", "select", "resolve", "confirm"].indexOf(step) > i ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 3 && <div className={`w-8 h-px ${["lookup", "select", "resolve", "confirm"].indexOf(step) > i ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1: Order Lookup */}
            {step === "lookup" && (
              <motion.div
                key="lookup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <Package className="w-10 h-10 text-primary mx-auto" />
                  <h1 className="font-display text-2xl uppercase tracking-wider text-foreground">
                    Returns & Exchanges
                  </h1>
                  <p className="text-sm text-muted-foreground font-body">
                    Start a return or exchange within 30 days of your order.
                    <br />
                    <span className="text-primary font-semibold">Choose an exchange and earn bonus Skull Points! 💀</span>
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-display uppercase tracking-wider text-foreground mb-1.5">
                      Order Number
                    </label>
                    <input
                      type="text"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="#1001"
                      className="w-full px-4 py-3 bg-background border border-border rounded-sm text-foreground font-body placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-display uppercase tracking-wider text-foreground mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 bg-background border border-border rounded-sm text-foreground font-body placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <button
                    onClick={handleLookup}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-display text-sm uppercase tracking-[0.15em] rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Find My Order
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Select Items */}
            {step === "select" && order && (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-1">
                  <h2 className="font-display text-xl uppercase tracking-wider text-foreground">
                    Order {order.order_name}
                  </h2>
                  <p className="text-sm text-muted-foreground font-body">
                    Select the items you'd like to return or exchange
                  </p>
                </div>

                <div className="space-y-3">
                  {order.line_items.map((item) => {
                    const isSelected = selectedItems.some((s) => s.lineItem.id === item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(item)}
                        className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm text-foreground truncate">{item.title}</p>
                          {item.variant_title && (
                            <p className="text-xs text-muted-foreground font-body">{item.variant_title}</p>
                          )}
                          <p className="text-xs text-muted-foreground font-body mt-1">
                            Qty: {item.quantity} · ${parseFloat(item.price).toFixed(2)}
                          </p>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "border-primary bg-primary" : "border-border"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("lookup")}
                    className="flex items-center gap-2 px-4 py-3 border border-border text-foreground font-display text-xs uppercase tracking-wider rounded-sm hover:bg-card transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                  <button
                    onClick={() => setStep("resolve")}
                    disabled={selectedItems.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-display text-sm uppercase tracking-[0.15em] rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Choose Resolution */}
            {step === "resolve" && (
              <motion.div
                key="resolve"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-1">
                  <h2 className="font-display text-xl uppercase tracking-wider text-foreground">
                    How Would You Like to Resolve?
                  </h2>
                  <p className="text-sm text-muted-foreground font-body">
                    Exchanges earn you bonus Skull Points 💀
                  </p>
                </div>

                <div className="space-y-4">
                  {selectedItems.map((sel, idx) => (
                    <div key={sel.lineItem.id} className="bg-card border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        {sel.lineItem.image && (
                          <img src={sel.lineItem.image} alt={sel.lineItem.title} className="w-12 h-12 object-cover rounded" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm text-foreground truncate">{sel.lineItem.title}</p>
                          {sel.lineItem.variant_title && (
                            <p className="text-xs text-muted-foreground">{sel.lineItem.variant_title}</p>
                          )}
                        </div>
                      </div>

                      {/* Resolution options */}
                      <div className="grid grid-cols-3 gap-2">
                        {(["exchange", "store_credit", "refund"] as Resolution[]).map((res) => {
                          const Icon = resolutionIcons[res];
                          return (
                            <button
                              key={res}
                              onClick={() => updateResolution(idx, res)}
                              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all ${
                                sel.resolution === res
                                  ? "border-primary bg-primary/10 text-foreground"
                                  : "border-border text-muted-foreground hover:border-primary/40"
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                              <span className="font-display text-[10px] uppercase tracking-wider">{resolutionLabels[res]}</span>
                              {res === "exchange" && (
                                <span className="text-[9px] text-primary font-body">+Bonus pts</span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Exchange product picker */}
                      {sel.resolution === "exchange" && (
                        <div className="space-y-2">
                          {sel.exchangeProduct ? (
                            <div className="flex items-center gap-3 p-2 bg-background rounded border border-border">
                              {sel.exchangeProduct.images?.edges?.[0]?.node?.url && (
                                <img
                                  src={sel.exchangeProduct.images.edges[0].node.url}
                                  alt={sel.exchangeProduct.title}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-body text-foreground truncate">{sel.exchangeProduct.title}</p>
                                {sel.exchangeVariantTitle && sel.exchangeVariantTitle !== "Default Title" && (
                                  <p className="text-[10px] text-muted-foreground">{sel.exchangeVariantTitle}</p>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  setActiveExchangeIdx(idx);
                                  setSelectedItems((prev) =>
                                    prev.map((item, i) =>
                                      i === idx
                                        ? { ...item, exchangeProduct: undefined, exchangeVariantId: undefined, exchangeVariantTitle: undefined }
                                        : item
                                    )
                                  );
                                }}
                                className="text-xs text-primary font-display uppercase"
                              >
                                Change
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                <input
                                  type="text"
                                  value={activeExchangeIdx === idx ? searchQuery : ""}
                                  onFocus={() => setActiveExchangeIdx(idx)}
                                  onChange={(e) => {
                                    setActiveExchangeIdx(idx);
                                    handleExchangeSearch(e.target.value);
                                  }}
                                  placeholder="Search for exchange product..."
                                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-sm text-sm text-foreground font-body placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </div>
                              {activeExchangeIdx === idx && searchResults.length > 0 && (
                                <div className="bg-background border border-border rounded-lg max-h-48 overflow-y-auto">
                                  {searchResults.map((p) => (
                                    <button
                                      key={p.id}
                                      onClick={() => selectExchangeProduct(idx, p)}
                                      className="w-full flex items-center gap-3 p-2 hover:bg-card transition-colors text-left"
                                    >
                                      {p.images?.edges?.[0]?.node?.url && (
                                        <img
                                          src={p.images.edges[0].node.url}
                                          alt={p.title}
                                          className="w-8 h-8 object-cover rounded"
                                        />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-body text-foreground truncate">{p.title}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                          ${parseFloat(p.priceRange.minVariantPrice.amount).toFixed(2)}
                                        </p>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                              {activeExchangeIdx === idx && searching && (
                                <p className="text-xs text-muted-foreground font-body flex items-center gap-1">
                                  <Loader2 className="w-3 h-3 animate-spin" /> Searching...
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-xs font-display uppercase tracking-wider text-foreground mb-1.5">
                    Reason for Return (optional)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="Too small, wrong color, changed my mind..."
                    className="w-full px-4 py-3 bg-background border border-border rounded-sm text-foreground font-body placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("select")}
                    className="flex items-center gap-2 px-4 py-3 border border-border text-foreground font-display text-xs uppercase tracking-wider rounded-sm hover:bg-card transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                  <button
                    onClick={() => setStep("confirm")}
                    disabled={selectedItems.some((s) => s.resolution === "exchange" && !s.exchangeProduct)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-display text-sm uppercase tracking-[0.15em] rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    Review Request
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Confirm */}
            {step === "confirm" && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-1">
                  <h2 className="font-display text-xl uppercase tracking-wider text-foreground">
                    Confirm Your Return
                  </h2>
                  <p className="text-sm text-muted-foreground font-body">
                    Order {order?.order_name}
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg divide-y divide-border">
                  {selectedItems.map((sel) => (
                    <div key={sel.lineItem.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {sel.lineItem.image && (
                            <img src={sel.lineItem.image} alt={sel.lineItem.title} className="w-10 h-10 object-cover rounded" />
                          )}
                          <div>
                            <p className="font-body text-sm text-foreground">{sel.lineItem.title}</p>
                            {sel.lineItem.variant_title && (
                              <p className="text-xs text-muted-foreground">{sel.lineItem.variant_title}</p>
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-body text-foreground">${parseFloat(sel.lineItem.price).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {(() => {
                          const Icon = resolutionIcons[sel.resolution];
                          return <Icon className="w-3.5 h-3.5 text-primary" />;
                        })()}
                        <span className="font-display uppercase tracking-wider text-primary">
                          {resolutionLabels[sel.resolution]}
                        </span>
                        {sel.exchangeProduct && (
                          <span className="text-muted-foreground font-body">
                            → {sel.exchangeProduct.title}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="bg-card border border-border rounded-lg p-4 space-y-2">
                  {exchangeTotal > 0 && (
                    <div className="flex items-center justify-between text-sm font-body">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <ArrowLeftRight className="w-3.5 h-3.5" /> Exchange Value
                      </span>
                      <span className="text-foreground">${exchangeTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {creditTotal > 0 && (
                    <div className="flex items-center justify-between text-sm font-body">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" /> Store Credit
                      </span>
                      <span className="text-foreground">${creditTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {refundTotal > 0 && (
                    <div className="flex items-center justify-between text-sm font-body">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" /> Refund Amount
                      </span>
                      <span className="text-foreground">${refundTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {exchangeTotal > 0 && (
                    <div className="flex items-center justify-between text-sm font-body pt-2 border-t border-border">
                      <span className="text-primary flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5" /> Exchange Bonus Points
                      </span>
                      <span className="text-primary font-semibold">
                        +{Math.round(exchangeTotal * 0.1 * 2)} pts 💀
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("resolve")}
                    className="flex items-center gap-2 px-4 py-3 border border-border text-foreground font-display text-xs uppercase tracking-wider rounded-sm hover:bg-card transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-display text-sm uppercase tracking-[0.15em] rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Submit Return
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Success */}
            {step === "success" && returnResult && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-display text-2xl uppercase tracking-wider text-foreground">
                    {returnResult.status === "approved" ? "Exchange Approved!" : "Request Submitted!"}
                  </h2>
                  <p className="text-sm text-muted-foreground font-body max-w-md mx-auto">
                    {returnResult.message}
                  </p>
                  <p className="text-xs text-muted-foreground font-body">
                    Return ID: <span className="font-mono text-foreground">{returnResult.return_id.slice(0, 8)}</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setStep("lookup");
                    setOrder(null);
                    setSelectedItems([]);
                    setOrderNumber("");
                    setEmail("");
                    setReason("");
                    setReturnResult(null);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground font-display text-sm uppercase tracking-wider rounded-sm hover:bg-card transition-colors"
                >
                  Start Another Return
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
