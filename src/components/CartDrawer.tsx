import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingCart, Minus, Plus, Trash2, ExternalLink, Loader2, Gift, Tag, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/stores/cartStore";
import { CartProgressBar } from "@/components/CartProgressBar";
import { CartRecommendations } from "@/components/CartRecommendations";
import cartBannerBat from "@/assets/cart-banner-bat.jpg";
import { useFreeGift, FREE_GIFT_VARIANT_ID } from "@/hooks/useFreeGift";
import { supabase } from "@/integrations/supabase/client";
import { ga4ViewCart } from "@/lib/ga4";
import { useAuth } from "@/hooks/useAuth";

export const CartDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartBanner, setCartBanner] = useState<{ image_url: string; alt_text: string | null; link_href: string | null } | null>(null);
  const { items, isLoading, isSyncing, isConsolidating, updateQuantity, removeItem, consolidateAndCheckout, syncCart, promoCode, setPromoCode } = useCartStore();
  const [promoInput, setPromoInput] = useState(promoCode || "");
  const { giftWanted, setGiftWanted, eligible: giftEligible } = useFreeGift();
  const totalItems = items.filter(i => i.variantId !== FREE_GIFT_VARIANT_ID).reduce((sum, item) => sum + item.quantity, 0);

  // Celebration sparkle when gift is added
  const [showCelebration, setShowCelebration] = useState(false);
  const prevGiftInCart = useRef(false);
  const giftInCart = items.some(i => i.variantId === FREE_GIFT_VARIANT_ID);
  useEffect(() => {
    if (giftInCart && !prevGiftInCart.current) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 1500);
      return () => clearTimeout(timer);
    }
    prevGiftInCart.current = giftInCart;
  }, [giftInCart]);

  useEffect(() => {
    if (isOpen) {
      syncCart();
      if (items.length > 0) {
        ga4ViewCart(items.map(i => ({
          variantId: i.variantId,
          productTitle: i.product?.node?.title || '',
          price: i.price.amount,
          currencyCode: i.price.currencyCode || 'USD',
          quantity: i.quantity,
        })));
      }
    }
  }, [isOpen, syncCart]);

  // Auto-apply unused Skull Points code for logged-in users
  const { user } = useAuth();
  useEffect(() => {
    if (!isOpen || !user || promoCode) return;
    supabase
      .from("reward_redemptions")
      .select("discount_code, discount_amount")
      .eq("user_id", user.id)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        const code = data?.[0]?.discount_code;
        if (code) {
          setPromoCode(code);
          setPromoInput(code);
        }
      });
  }, [isOpen, user, promoCode]);

  // Fetch active cart banner
  useEffect(() => {
    supabase
      .from("marketing_images")
      .select("image_url, alt_text, link_href")
      .eq("slot", "cart_banner")
      .eq("is_active", true)
      .order("position", { ascending: true })
      .limit(1)
      .then(({ data }) => {
        setCartBanner(data?.[0] || null);
      });
  }, []);

  // Bundle config: tag → { min items for deal, label, type, fixedAmount }
  const BUNDLE_CONFIG: Record<string, { min: number; label: string; type: 'cheapest_free' | 'fixed'; fixedAmount?: number }> = {
    'cherubs-capsule': { min: 4, label: 'Cherubs Bundle', type: 'cheapest_free' },
    'bro_oks': { min: 4, label: 'Bro_oks Bundle', type: 'cheapest_free' },
    'solids-pack-3': { min: 3, label: 'Solids 3-Pack', type: 'fixed', fixedAmount: 10 },
    'solids-pack-5': { min: 5, label: 'Solids 5-Pack', type: 'cheapest_free' },
    'vault-exclusive': { min: 4, label: 'Vault Exclusive Bundle', type: 'cheapest_free' },
    'vault-early': { min: 4, label: 'Vault Early Drop Bundle', type: 'cheapest_free' },
    'vault-flash': { min: 4, label: 'Vault Flash Bundle', type: 'cheapest_free' },
    'youth-tees': { min: 4, label: 'Youth Tees Bundle', type: 'cheapest_free' },
    'angels-capsule': { min: 4, label: 'Angels Bundle', type: 'cheapest_free' },
    'march-artist-series-bundle': { min: 4, label: 'March Artist Series Bundle', type: 'cheapest_free' },
  };

  const COMPLETE_LOOK_TIERS = [
    { min: 4, discount: 20 },
    { min: 3, discount: 15 },
    { min: 2, discount: 10 },
  ];

  const COMPLETE_LOOK_ADDON_KEYWORDS = ["snapback", "hat", "cap", "beanie", "boxer", "lanyard", "sticker"];

  const inferBundleTag = (item: (typeof items)[number]): string | undefined => {
    if (item.bundleTag) return item.bundleTag;

    const normalizedHandle = (item.product.node.handle || '').toLowerCase();
    const tags = (((item.product.node as unknown as { tags?: string[] }).tags) ?? []).map((t) => String(t).toLowerCase());

    if (normalizedHandle.includes('bro_oks') || normalizedHandle.includes('brooks') || tags.some((t) => t.includes('bro_oks') || t.includes('brooks'))) {
      return 'bro_oks';
    }
    if (normalizedHandle.includes('youth') || tags.some((t) => t.includes('youth'))) return 'youth-tees';
    if (normalizedHandle.includes('solid') || tags.some((t) => t.includes('solid'))) return 'solids-pack';
    if (normalizedHandle.includes('cherub') || tags.some((t) => t.includes('cherub'))) return 'cherubs-capsule';
    if (tags.some((t) => t.includes('angels capsule') || t.includes('angels-capsule'))) return 'angels-capsule';
    if (normalizedHandle.includes('intimate') || normalizedHandle.includes('inktimate') || tags.some((t) => t.includes('intimate') || t.includes('inktimate'))) return 'inktimates';

    return undefined;
  };

  const resolveBundleTag = (item: (typeof items)[number]): string | undefined => inferBundleTag(item);

  const extractDesignName = (title?: string, handle?: string): string => {
    const source = (title || handle || '').trim();
    if (!source) return '';
    let name = source.replace(/\s*["'][^"']+["']\s*$/i, '').trim();
    name = name.replace(/\s+(premium\s+tee|standard\s+tee|1\s*[- ]?ton|french\s+terry\s+longsleeve|longsleeve|long\s+sleeve|pullover|hoodie|snapback|dad\s+hat|beanie|jogger|shorts?|tank|crop|women'?s?\s+tee|boxers?|lanyard|stickers?|cap|hat|tee|badge)\s*$/i, '').trim();
    return name;
  };

  const normalizeDesignKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const isCompleteLookAddon = (item: (typeof items)[number]) => {
    const text = `${item.product.node.title} ${item.product.node.handle}`.toLowerCase();
    return COMPLETE_LOOK_ADDON_KEYWORDS.some((kw) => text.includes(kw));
  };

  const isCompleteLookTee = (item: (typeof items)[number]) => {
    const text = `${item.product.node.title} ${item.product.node.handle}`.toLowerCase();
    return /\b(tee|t-shirt|1\s*[- ]?ton|premium|standard|long\s*sleeve|longsleeve)\b/i.test(text);
  };

  const getCompleteLookKeyFromTag = (item: (typeof items)[number]): string | null => {
    const tag = item.bundleTag?.toLowerCase();
    if (!tag?.startsWith('complete-look:')) return null;
    const [, key] = tag.split(':');
    return key || null;
  };

  const labelFromKey = (key: string) =>
    key
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

  // Detect ALL active deals and accumulate savings with per-bundle breakdown
  const { freeByVariant, savings, totalPrice, bundleSavings } = useMemo(() => {
    const freeMap: Record<string, number> = {};
    let totalSavings = 0;
    const perBundle: { label: string; amount: number }[] = [];

    // Existing capsule/vault bundles
    // Special handling for solids-pack (dual tiers: 3-pack fixed, 5-pack cheapest free)
    const solidItems = items.filter(i => resolveBundleTag(i) === 'solids-pack');
    if (solidItems.length > 0) {
      const solidExpanded: { variantId: string; price: number }[] = [];
      for (const item of solidItems) {
        for (let q = 0; q < item.quantity; q++) {
          solidExpanded.push({ variantId: item.variantId, price: parseFloat(item.price.amount) });
        }
      }
      const solids5 = BUNDLE_CONFIG['solids-pack-5'];
      const solids3 = BUNDLE_CONFIG['solids-pack-3'];
      if (solids5 && solidExpanded.length >= 5) {
        const cheapest = Math.min(...solidExpanded.map(e => e.price));
        const freeItem = solidExpanded.find(e => e.price === cheapest);
        if (freeItem) {
          freeMap[freeItem.variantId] = (freeMap[freeItem.variantId] || 0) + 1;
        }
        totalSavings += cheapest;
        perBundle.push({ label: solids5.label, amount: cheapest });
      } else if (solids3 && solidExpanded.length >= 3) {
        const amount = solids3.fixedAmount ?? 10;
        totalSavings += amount;
        perBundle.push({ label: solids3.label, amount });
      }
    }

    for (const [tag, config] of Object.entries(BUNDLE_CONFIG)) {
      if (tag.startsWith('solids-pack')) continue; // handled above
      const bundleItems = items.filter(i => resolveBundleTag(i) === tag);
      if (bundleItems.length === 0) continue;

      const expanded: { variantId: string; price: number }[] = [];
      for (const item of bundleItems) {
        for (let q = 0; q < item.quantity; q++) {
          expanded.push({ variantId: item.variantId, price: parseFloat(item.price.amount) });
        }
      }

      if (expanded.length >= config.min) {
        let bundleAmount = 0;
        if (config.type === 'cheapest_free') {
          const freeUnits = Math.floor(expanded.length / config.min);
          const sortedByPrice = [...expanded].sort((a, b) => a.price - b.price);
          for (let idx = 0; idx < freeUnits; idx++) {
            const freeItem = sortedByPrice[idx];
            if (!freeItem) break;
            bundleAmount += freeItem.price;
            freeMap[freeItem.variantId] = (freeMap[freeItem.variantId] || 0) + 1;
          }
        } else if (config.type === 'fixed' && config.fixedAmount) {
          bundleAmount = config.fixedAmount;
        }
        totalSavings += bundleAmount;
        perBundle.push({ label: config.label, amount: bundleAmount });
      }
    }

    // Complete the Look tiered add-on discount (tee + matching add-ons by design name)
    const completeLookGroups = new Map<string, { label: string; totalQty: number; teeQty: number; addOnSubtotal: number }>();

    for (const item of items) {
      const designName = extractDesignName(item.product.node.title, item.product.node.handle);
      const taggedKey = getCompleteLookKeyFromTag(item);
      const designKey = taggedKey || normalizeDesignKey(designName);
      if (!designKey) continue;

      const current = completeLookGroups.get(designKey) || {
        label: designName || (taggedKey ? labelFromKey(taggedKey) : ''),
        totalQty: 0,
        teeQty: 0,
        addOnSubtotal: 0,
      };
      const qty = item.quantity;
      const lineAmount = parseFloat(item.price.amount) * qty;

      current.totalQty += qty;
      if (isCompleteLookTee(item)) current.teeQty += qty;
      if (isCompleteLookAddon(item)) current.addOnSubtotal += lineAmount;

      completeLookGroups.set(designKey, current);
    }

    for (const group of completeLookGroups.values()) {
      if (group.teeQty < 1 || group.addOnSubtotal <= 0) continue;

      const tier = COMPLETE_LOOK_TIERS.find((t) => group.totalQty >= t.min);
      if (!tier) continue;

      const amount = group.addOnSubtotal * (tier.discount / 100);
      if (amount <= 0) continue;

      totalSavings += amount;
      perBundle.push({ label: `${group.label} Complete the Look`, amount });
    }

    const total = items.reduce((sum, item) => sum + (parseFloat(item.price.amount) * item.quantity), 0);
    return { freeByVariant: freeMap, savings: totalSavings, totalPrice: total - totalSavings, bundleSavings: perBundle };
  }, [items]);

  // Automatic discounts are handled by Shopify — no code sending needed

  const originalTotal = items.reduce((sum, item) => sum + (parseFloat(item.price.amount) * item.quantity), 0);

  const normalizeCheckoutHost = (rawUrl: string) => {
    try {
      const url = new URL(rawUrl);
      url.hostname = "checkout.sullenclothing.com";
      url.protocol = "https:";
      url.searchParams.set("channel", "online_store");
      return url.toString();
    } catch {
      return rawUrl;
    }
  };

  const handleCheckout = async () => {
    const hostname = window.location.hostname.toLowerCase();
    const isLovablePreviewHost =
      hostname.endsWith(".lovableproject.com") ||
      (hostname.includes("id-preview--") && hostname.endsWith(".lovable.app"));

    const previewTab = isLovablePreviewHost ? window.open("about:blank", "_blank") : null;

    const url = await consolidateAndCheckout();
    if (!url) {
      if (previewTab) previewTab.close();
      return;
    }

    const finalUrl = normalizeCheckoutHost(url);

    if (previewTab) {
      previewTab.location.replace(finalUrl);
      setIsOpen(false);
      return;
    }

    window.location.assign(finalUrl);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-foreground">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-accent text-accent-foreground">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full bg-card border-border">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="font-display uppercase tracking-wider text-foreground">Shopping Cart</SheetTitle>
          <SheetDescription>
            {totalItems === 0 ? "Your cart is empty" : `${totalItems} item${totalItems !== 1 ? 's' : ''} in your cart`}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col flex-1 pt-4 min-h-0">
          {/* Progress bar — always visible when cart has items */}
          {items.length > 0 && <CartProgressBar cartTotal={totalPrice} />}
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                {/* Promo banner - dynamic from admin or fallback */}
                {(() => {
                  const bannerUrl = cartBanner?.image_url || cartBannerBat;
                  const bannerAlt = cartBanner?.alt_text || "Free Mini Bat with $99+ purchase";
                  const bannerLink = cartBanner?.link_href;
                  const img = <img src={bannerUrl} alt={bannerAlt} className="w-full h-auto" />;
                  return (
                    <div className="mx-1 mb-3 rounded-lg overflow-hidden">
                      {bannerLink ? <a href={bannerLink}>{img}</a> : img}
                    </div>
                  );
                  })()}
                  {/* Free gift opt-in toggle when eligible but opted out */}
                  <AnimatePresence>
                    {giftEligible && !giftWanted && (
                      <motion.div
                        key="gift-opt-in"
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="mx-1 overflow-hidden"
                      >
                        <div className="px-3 py-2.5 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <Gift className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-xs font-display uppercase tracking-wider text-foreground">I want my free gift!</span>
                          </div>
                          <Switch
                            checked={giftWanted}
                            onCheckedChange={setGiftWanted}
                            className="data-[state=checked]:bg-primary flex-shrink-0"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                <AnimatePresence mode="popLayout">
                <div className="space-y-4">
                  {[...items].sort((a, b) => {
                    const aGift = a.variantId === FREE_GIFT_VARIANT_ID ? 0 : 1;
                    const bGift = b.variantId === FREE_GIFT_VARIANT_ID ? 0 : 1;
                    return aGift - bGift;
                  }).map((item) => {
                    const isAutoGift = item.variantId === FREE_GIFT_VARIANT_ID;
                    const freeQtyForItem = Math.min(item.quantity, freeByVariant[item.variantId] || 0);
                    const isFreeItem = freeQtyForItem > 0 || isAutoGift;
                    const itemPrice = parseFloat(item.price.amount);
                    const paidQty = isAutoGift ? 0 : item.quantity - freeQtyForItem;
                    const lineTotal = itemPrice * paidQty;
                    const originalLineTotal = itemPrice * item.quantity;
                    return (
                      <motion.div
                        key={item.variantId}
                        layout
                        initial={isAutoGift ? { opacity: 0, scale: 0.9, y: -10 } : false}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={isAutoGift ? { opacity: 0, scale: 0.9, y: -10 } : undefined}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="flex gap-4 p-2 border-b border-border relative overflow-visible"
                      >
                        {/* Celebration sparkles */}
                        <AnimatePresence>
                          {isAutoGift && showCelebration && (
                            <>
                              {['💀', '🖤', '🦇', '⚰️', '💀', '🔥'].map((emoji, i) => (
                                <motion.span
                                  key={`sparkle-${i}`}
                                  initial={{ opacity: 1, scale: 0.5, x: 30, y: 20 }}
                                  animate={{
                                    opacity: 0,
                                    scale: [0.5, 1.2, 0.8],
                                    x: 30 + (i % 2 === 0 ? 1 : -1) * (20 + Math.random() * 40),
                                    y: -10 - Math.random() * 50,
                                  }}
                                  transition={{ duration: 1 + Math.random() * 0.5, delay: i * 0.1, ease: "easeOut" }}
                                  className="absolute pointer-events-none text-base z-10"
                                  style={{ left: `${15 + i * 12}%` }}
                                >
                                  {emoji}
                                </motion.span>
                              ))}
                            </>
                          )}
                        </AnimatePresence>
                        <div className="w-16 h-16 bg-secondary rounded overflow-hidden flex-shrink-0 relative">
                          {item.product.node.images?.edges?.[0]?.node && (
                            <img src={item.product.node.images.edges[0].node.url} alt={item.product.node.title} className="w-full h-full object-cover" />
                          )}
                          {isFreeItem && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <span className="text-[9px] font-display uppercase tracking-wider bg-primary text-primary-foreground px-1.5 py-0.5 rounded-sm font-bold">
                                {isAutoGift ? '🎁 Gift' : 'Free'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-display text-sm uppercase tracking-wide truncate text-foreground">{item.product.node.title}</h4>
                          <p className="text-xs text-muted-foreground">{item.selectedOptions.map(o => o.value).join(' • ')}</p>
                          {isAutoGift ? (
                            <span className="font-display text-primary font-bold text-sm">FREE GIFT</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              {isFreeItem ? (
                                <>
                                  <span className="font-display text-muted-foreground line-through">${originalLineTotal.toFixed(2)}</span>
                                  <span className="font-display text-primary font-bold">${lineTotal.toFixed(2)}</span>
                                </>
                              ) : (
                                <span className="font-display text-foreground">${originalLineTotal.toFixed(2)}</span>
                              )}
                            </div>
                          )}
                          {(() => {
                            if (isAutoGift) return <span className="text-[10px] font-display uppercase tracking-wider text-primary">Spend $99+ reward</span>;
                            const itemBundleTag = resolveBundleTag(item);
                            if (itemBundleTag && BUNDLE_CONFIG[itemBundleTag]) {
                              // Only show vault bundle badges when there are 2+ items with that vault tag
                              const isVaultTag = itemBundleTag.startsWith('vault-');
                              if (isVaultTag) {
                                const vaultCount = items.reduce((sum, i) => resolveBundleTag(i) === itemBundleTag ? sum + i.quantity : sum, 0);
                                if (vaultCount < 2) return null;
                              }
                              return <span className="text-[10px] font-display uppercase tracking-wider text-primary">{BUNDLE_CONFIG[itemBundleTag].label}</span>;
                            }
                            if (item.bundleTag && !item.bundleTag.startsWith('complete-look:')) {
                              return null;
                            }
                            return null;
                          })()}
                        </div>
                        {isAutoGift ? (
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <label className="flex items-center gap-2 cursor-pointer" htmlFor={`gift-toggle-${item.variantId}`}>
                              <span className="text-[10px] font-display uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                {giftWanted ? "Added" : "Add?"}
                              </span>
                              <Switch
                                id={`gift-toggle-${item.variantId}`}
                                checked={giftWanted}
                                onCheckedChange={setGiftWanted}
                                className="data-[state=checked]:bg-primary"
                              />
                            </label>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.variantId)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm text-foreground">{item.quantity}</span>
                              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
                </AnimatePresence>
                {/* Recommendations */}
                <CartRecommendations cartItems={items} />
              </div>
              <div className="flex-shrink-0 space-y-4 pt-4 border-t border-border">
                {(savings > 0 || promoCode) && (
                  <div className="bg-primary/10 border border-primary/20 rounded-md px-3 py-2 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-primary flex-shrink-0" />
                      <p className="text-xs font-display uppercase tracking-wider text-primary flex-1">
                        Your Savings
                      </p>
                    </div>
                    {bundleSavings.map((b, i) => (
                      <div key={i} className="flex items-center justify-between pl-6">
                        <span className="text-[11px] text-muted-foreground">{b.label}</span>
                        <span className="text-xs font-display text-primary font-bold">−${b.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    {promoCode && (
                      <div className="flex items-center justify-between pl-6">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Tag className="w-3 h-3 text-primary" />
                          Skull Points: {promoCode}
                        </span>
                        <span className="text-xs font-display text-primary font-bold">Applied ✓</span>
                      </div>
                    )}
                    {(bundleSavings.length + (promoCode ? 1 : 0)) > 1 && savings > 0 && (
                      <div className="flex items-center justify-between pl-6 pt-1 border-t border-primary/10">
                        <span className="text-[11px] font-display uppercase tracking-wider text-primary">Total Saved</span>
                        <span className="text-sm font-display text-primary font-bold">−${savings.toFixed(2)} +code</span>
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground pl-6">All discounts combined at checkout ✓</p>
                  </div>
                )}
                {/* Promo / Rewards Code Input */}
                <div className="space-y-1.5">
                  {promoCode ? (
                    <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-md px-3 py-2">
                      <Tag className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span className="text-xs font-display uppercase tracking-wider text-primary flex-1">{promoCode}</span>
                      <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-destructive"
                        onClick={() => { setPromoCode(null); setPromoInput(""); }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Promo or Rewards code"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        className="h-8 text-xs font-display uppercase tracking-wider bg-background"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && promoInput.trim()) {
                            setPromoCode(promoInput.trim());
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs font-display uppercase tracking-wider"
                        disabled={!promoInput.trim()}
                        onClick={() => promoInput.trim() && setPromoCode(promoInput.trim())}
                      >
                        Apply
                      </Button>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">Skull Points codes stack with bundle deals ✓</p>
                </div>
                <Button onClick={handleCheckout} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-display uppercase tracking-wider" size="lg" disabled={items.length === 0 || isLoading || isSyncing || isConsolidating}>
                  {isLoading || isSyncing || isConsolidating ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <span className="flex items-center justify-center gap-2 w-full">
                      <ExternalLink className="w-4 h-4" />
                      <span>{isConsolidating ? 'Applying Discounts…' : 'Checkout'}</span>
                      <span className="ml-auto">
                        {savings > 0 && <span className="text-accent-foreground/60 line-through text-xs mr-1">${originalTotal.toFixed(2)}</span>}
                        ${totalPrice.toFixed(2)}
                      </span>
                    </span>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
