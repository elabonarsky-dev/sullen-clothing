import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/useAuth";
import { useRewards } from "@/hooks/useRewards";
import { supabase } from "@/integrations/supabase/client";
import { type ShopifyProduct } from "@/lib/shopify";
import { Expand, X } from "lucide-react";
import { useVaultProducts } from "@/hooks/useVaultProducts";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, ShoppingBag, Clock, Crown, Gift, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import vaultDoorImg from "@/assets/sullen-vault.jpg";
import { toast } from "sonner";
import { VaultQuickAdd } from "@/components/VaultQuickAdd";

// Bundle tag per vault section
const VAULT_BUNDLE_TAG: Record<VaultSection, string> = {
  exclusive: "vault-exclusive",
  early: "vault-early",
};

const VAULT_BUNDLE_MIN = 4; // Buy 3 get 1 free


type VaultSection = "exclusive" | "early";

const VAULT_SECTIONS: { id: VaultSection; label: string; icon: typeof Crown; description: string }[] = [
  { id: "exclusive", label: "Vault Exclusives", icon: Crown, description: "Only for Vault members" },
  { id: "early", label: "Early Drops", icon: Clock, description: "Shop before anyone else" },
];

function VaultProductCard({ product, onImageExpand, bundleTag }: { product: ShopifyProduct; onImageExpand: (p: ShopifyProduct) => void; bundleTag: string }) {
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const variant = product.node.variants.edges[0]?.node;
  const image = product.node.images.edges[0]?.node;
  const price = product.node.priceRange.minVariantPrice;

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!variant) return;
    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
      bundleTag,
    });
    toast.success("Added to cart");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <div
        className="aspect-[3/4] rounded-lg overflow-hidden bg-secondary/30 mb-3 relative cursor-pointer"
        style={{ boxShadow: "0 8px 30px hsl(0 0% 0% / 0.35), 0 4px 12px hsl(0 0% 0% / 0.2)" }}
        onClick={() => onImageExpand(product)}
      >
        {image && (
          <img
            src={image.url}
            alt={image.altText || product.node.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        )}
        <div className="absolute top-2 left-2">
          <span
            className="relative text-[8px] font-display uppercase px-2.5 py-1 rounded-sm overflow-hidden"
            style={{
              background: "linear-gradient(135deg, hsl(0 0% 92%), hsl(0 0% 100%), hsl(0 0% 88%))",
              color: "hsl(0 0% 25%)",
              border: "1px solid hsl(0 0% 80%)",
              boxShadow: "0 2px 8px hsl(0 0% 0% / 0.15), inset 0 1px 0 hsl(0 0% 100% / 0.8)",
              letterSpacing: "0.35em",
            }}
          >
            Vault VIP
            <span
              className="absolute inset-0 animate-shimmer"
              style={{
                background: "linear-gradient(90deg, transparent 0%, hsl(0 0% 100% / 0.6) 50%, transparent 100%)",
                width: "50%",
              }}
            />
          </span>
        </div>
        {/* Expand hint */}
        <div className="absolute bottom-2 right-2 bg-background/70 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Expand className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>
      <p className="text-xs font-display uppercase tracking-wider line-clamp-1 mb-1" style={{ color: "hsl(0 0% 8%)" }}>
        {product.node.title}
      </p>
      <p className="text-xs font-body mb-3" style={{ color: "hsl(0 0% 50%)" }}>
        {new Intl.NumberFormat("en-US", { style: "currency", currency: price.currencyCode }).format(parseFloat(price.amount))}
      </p>
      <Button
        size="sm"
        variant="outline"
        onClick={handleAdd}
        disabled={isLoading || !variant?.availableForSale}
        className="w-full font-display text-[10px] uppercase tracking-wider border-border/40 bg-transparent hover:bg-secondary/50"
        style={{ color: "hsl(0 0% 30%)" }}
      >
        {!variant?.availableForSale ? "Sold Out" : isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add to Cart"}
      </Button>
    </motion.div>
  );
}
function FullPageVaultGate({ onUnlock, onClose, currentTierName, requiredTierName, progressPercent, lifetimePoints, requiredPoints, qualifies }: { onUnlock: () => void; onClose: () => void; currentTierName?: string; requiredTierName: string; progressPercent: number; lifetimePoints: number; requiredPoints: number; qualifies?: boolean }) {
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [opening, setOpening] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setChecking(true);
    try {
      const { data, error } = await supabase.rpc("verify_vault_code", {
        p_code: code.trim(),
      });

      if (error) {
        toast.error("Something went wrong");
        setChecking(false);
        return;
      }

      const result = data as { valid: boolean; reason?: string };
      if (!result.valid) {
        const messages: Record<string, string> = {
          invalid_code: "Invalid access code",
          expired: "This code has expired",
          usage_limit: "This code has reached its usage limit",
        };
        toast.error(messages[result.reason || ""] || "Invalid access code");
        setChecking(false);
        return;
      }

      // Vault unlocked via valid code - state managed in component
      setOpening(true);
      setTimeout(() => onUnlock(), 2200);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, hsl(0 0% 100%), hsl(0 0% 97%) 50%, hsl(0 0% 94%) 100%)" }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-6 h-6 rounded-full flex items-center justify-center bg-black/5 hover:bg-black/10 transition-colors"
        aria-label="Close"
      >
        <X className="w-3 h-3" style={{ color: "hsl(0 0% 40%)" }} />
      </button>
      {/* Subtle dot texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, hsl(0 0% 60%) 0.5px, transparent 0.5px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Ambient soft glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-30 blur-[150px]"
        style={{ background: `radial-gradient(circle, hsl(38 60% 70% / 0.4), transparent 70%)` }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={opening ? { opacity: 0, y: -40 } : { opacity: 1, y: 0 }}
        transition={opening ? { duration: 0.6 } : { duration: 1, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center px-6"
      >
        {/* Members Only label */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={opening ? { opacity: 0 } : { opacity: 1, y: 0 }}
          transition={{ delay: opening ? 0 : 0.3, duration: opening ? 0.3 : 0.6 }}
          className="flex items-center gap-4 mb-5"
        >
          <div className="h-px w-14" style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 75%))" }} />
          <span className="text-[9px] font-display uppercase tracking-[0.5em]" style={{ color: "hsl(0 0% 55%)" }}>
            Members Only
          </span>
          <div className="h-px w-14" style={{ background: "linear-gradient(270deg, transparent, hsl(0 0% 75%))" }} />
        </motion.div>

        {/* Vault Door — elevated on white with luxury shadow */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={
            opening
              ? { scale: 2.5, opacity: 0, rotate: 720 }
              : { scale: 1, opacity: 1, rotate: 0 }
          }
          transition={
            opening
              ? { duration: 2, ease: [0.22, 1, 0.36, 1] }
              : { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
          }
          className="relative"
        >
          {/* Outer shadow ring for depth */}
          <div
            className="absolute -inset-3 rounded-full"
            style={{
              boxShadow: `
                0 4px 6px hsl(0 0% 0% / 0.04),
                0 10px 24px hsl(0 0% 0% / 0.06),
                0 30px 60px hsl(0 0% 0% / 0.08),
                0 0 0 1px hsl(0 0% 90%)
              `,
            }}
          />

          <motion.div
            animate={
              opening
                ? { filter: "brightness(1.4)" }
                : { filter: ["brightness(0.97)", "brightness(1.03)", "brightness(0.97)"] }
            }
            transition={opening ? { duration: 0.5 } : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-[240px] h-[240px] md:w-[380px] md:h-[380px] lg:w-[440px] lg:h-[440px] rounded-full overflow-hidden"
            style={{
              boxShadow: `
                0 8px 32px hsl(0 0% 0% / 0.12),
                0 24px 64px hsl(0 0% 0% / 0.08),
                inset 0 0 30px hsl(0 0% 100% / 0.15),
                0 0 0 3px hsl(0 0% 92%),
                0 0 0 6px hsl(0 0% 96%)
              `,
            }}
          >
            <img
              src={vaultDoorImg}
              alt="The Vault — Locked"
              className="w-full h-full object-cover"
              draggable={false}
            />
            {/* Bright sheen sweep */}
            <motion.div
              animate={{ x: ["-100%", "250%"] }}
              transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-15deg]"
            />
          </motion.div>
        </motion.div>

        {/* Title + messaging */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={opening ? { opacity: 0, y: 30 } : { opacity: 1, y: 0 }}
          transition={opening ? { duration: 0.4 } : { delay: 0.6 }}
          className="mt-5 text-center max-w-md space-y-2.5"
        >
          <div className="flex items-center justify-center gap-2">
            <Lock className="w-3.5 h-3.5" style={{ color: qualifies ? "hsl(142 70% 45%)" : "hsl(0 0% 50%)" }} />
            <span
              className="text-[10px] font-display uppercase tracking-[0.3em]"
              style={{ color: qualifies ? "hsl(142 70% 45%)" : "hsl(0 0% 50%)" }}
            >
              {qualifies ? "Access Granted" : "Vault Sealed"}
            </span>
          </div>

          <h1
            className="text-2xl md:text-4xl font-display uppercase tracking-[0.25em]"
            style={{ color: "hsl(0 0% 12%)" }}
          >
            The Vault
          </h1>

          <p
            className="text-xs font-body leading-relaxed max-w-sm mx-auto"
            style={{ color: "hsl(0 0% 45%)" }}
          >
            {qualifies
              ? "Your loyalty has earned you access. Welcome inside."
              : "Exclusive drops, early access & flash sales for our most dedicated members."}
          </p>

          {currentTierName && (
            <div className="w-full max-w-xs mx-auto space-y-2">
              <div className="flex items-center justify-between text-[9px] font-display uppercase tracking-[0.2em]">
                <span style={{ color: "hsl(0 0% 30%)" }}>{currentTierName}</span>
                {!qualifies && <span className="text-primary">{requiredTierName}</span>}
                {qualifies && (
                  <span className="flex items-center gap-1" style={{ color: "hsl(142 70% 45%)" }}>
                    <Check className="w-3 h-3" /> Qualified
                  </span>
                )}
              </div>
              <div
                className="relative h-1.5 rounded-full overflow-hidden"
                style={{
                  background: "hsl(0 0% 90%)",
                  boxShadow: "inset 0 1px 2px hsl(0 0% 0% / 0.06)",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(qualifies ? 100 : progressPercent, 100)}%` }}
                  transition={{ duration: 1.5, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: qualifies
                      ? `linear-gradient(90deg, hsl(142 70% 45% / 0.7), hsl(142 70% 45%))`
                      : `linear-gradient(90deg, hsl(var(--gold) / 0.7), hsl(var(--gold)))`,
                    boxShadow: qualifies
                      ? `0 0 8px hsl(142 70% 45% / 0.3)`
                      : `0 0 8px hsl(var(--gold) / 0.3)`,
                  }}
                />
              </div>
              {!qualifies && (
                <p className="text-[10px] font-body text-center" style={{ color: "hsl(0 0% 50%)" }}>
                  <span className="text-primary font-semibold">{lifetimePoints.toLocaleString()}</span>
                  {" / "}
                  <span style={{ color: "hsl(0 0% 25%)" }}>{requiredPoints.toLocaleString()}</span>
                  {" points to unlock"}
                </p>
              )}
            </div>
          )}

          {qualifies ? (
            <div className="pt-3">
              <Button
                onClick={() => {
                  setOpening(true);
                  setTimeout(() => onUnlock(), 2200);
                }}
                className="h-12 px-10 font-display text-[10px] uppercase tracking-[0.25em] rounded-lg border-0 transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, hsl(0 0% 8%), hsl(0 0% 18%))",
                  color: "hsl(0 0% 98%)",
                  boxShadow: `
                    0 2px 4px hsl(0 0% 0% / 0.1),
                    0 8px 24px hsl(0 0% 0% / 0.15),
                    0 0 20px hsl(var(--gold) / 0.15)
                  `,
                }}
              >
                <Crown className="w-4 h-4 mr-2" style={{ color: "hsl(var(--gold))" }} />
                Enter The Vault
              </Button>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-center gap-3">
                <div className="h-px w-10" style={{ background: "hsl(0 0% 82%)" }} />
                <p
                  className="text-[9px] font-display uppercase tracking-[0.25em]"
                  style={{ color: "hsl(0 0% 60%)" }}
                >
                  Have an access code?
                </p>
                <div className="h-px w-10" style={{ background: "hsl(0 0% 82%)" }} />
              </div>
              <form onSubmit={handleSubmit} className="flex gap-2.5 max-w-xs mx-auto">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE"
                  className="font-mono text-xs uppercase tracking-wider h-12 rounded-lg border-0"
                  style={{
                    background: "hsl(0 0% 100%)",
                    color: "hsl(0 0% 15%)",
                    boxShadow: `
                      0 1px 3px hsl(0 0% 0% / 0.06),
                      0 4px 12px hsl(0 0% 0% / 0.04),
                      inset 0 0 0 1px hsl(0 0% 88%)
                    `,
                  }}
                />
                <Button
                  type="submit"
                  disabled={checking || !code.trim()}
                  className="h-12 px-6 font-display text-[10px] uppercase tracking-[0.2em] rounded-lg border-0 transition-all duration-300"
                  style={{
                    background: "hsl(0 0% 10%)",
                    color: "hsl(0 0% 98%)",
                    boxShadow: `
                      0 2px 4px hsl(0 0% 0% / 0.1),
                      0 8px 24px hsl(0 0% 0% / 0.12)
                    `,
                  }}
                >
                  {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unlock"}
                </Button>
              </form>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

function VaultInterior({ tierName, tierIcon, lastName, onExit }: { tierName?: string; tierIcon?: string; lastName?: string; onExit: () => void }) {
  const [activeSection, setActiveSection] = useState<VaultSection>("exclusive");
  const [expandedProduct, setExpandedProduct] = useState<ShopifyProduct | null>(null);
  const sectionConfig = VAULT_SECTIONS.find((s) => s.id === activeSection)!;
  const { products, isLoading: productsLoading } = useVaultProducts(activeSection, true);
  const cartItems = useCartStore((s) => s.items);

  const bundleTag = VAULT_BUNDLE_TAG[activeSection];
  const bundleCount = useMemo(() => {
    return cartItems
      .filter((i) => i.bundleTag === bundleTag)
      .reduce((sum, i) => sum + i.quantity, 0);
  }, [cartItems, bundleTag]);
  const bundleComplete = bundleCount >= VAULT_BUNDLE_MIN;

  return (
    <div
      className="min-h-[calc(100vh-3.5rem)] relative"
      style={{ background: "linear-gradient(180deg, hsl(0 0% 100%), hsl(0 0% 97%) 40%, hsl(0 0% 95%) 100%)" }}
    >
      {/* Close / Exit button */}
      <button
        onClick={onExit}
        className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center bg-black/5 hover:bg-black/10 transition-colors"
        aria-label="Exit Vault"
      >
        <X className="w-4 h-4" style={{ color: "hsl(0 0% 40%)" }} />
      </button>
      {/* Subtle texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, hsl(0 0% 60%) 0.5px, transparent 0.5px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Hero banner */}
      <div className="relative py-10 md:py-16 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 container max-w-6xl text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-12" style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 78%))" }} />
            <span className="text-[8px] font-display uppercase tracking-[0.5em] leading-none" style={{ color: "hsl(0 0% 55%)" }}>
              Private Collection
            </span>
            <div className="h-px w-12" style={{ background: "linear-gradient(270deg, transparent, hsl(0 0% 78%))" }} />
          </div>
          <h1
            className="text-2xl md:text-4xl font-display uppercase tracking-[0.2em] leading-none mb-2"
            style={{ color: "hsl(0 0% 12%)" }}
          >
            The Vault
          </h1>
          <p className="text-xs font-body leading-tight" style={{ color: "hsl(0 0% 50%)" }}>
            {lastName ? (
              <>Welcome, <span className="font-semibold" style={{ color: "hsl(0 0% 20%)" }}>Mr. {lastName}</span></>
            ) : (
              "Welcome inside."
            )}
            {tierName && (
              <span className="ml-1.5" style={{ color: "hsl(0 0% 40%)" }}>— {tierName}</span>
            )}
          </p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl pb-20">
        {/* Section tabs */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {VAULT_SECTIONS.map(({ id, label }, idx) => (
            <div key={id} className="flex items-center">
              {idx > 0 && (
                <div className="h-4 w-px mx-6 md:mx-8" style={{ background: "hsl(0 0% 80%)" }} />
              )}
              <button
                onClick={() => setActiveSection(id)}
                className="relative py-2 transition-all duration-300"
              >
                <span
                  className="text-[11px] md:text-xs font-display uppercase tracking-[0.3em]"
                  style={{
                    color: activeSection === id ? "hsl(0 0% 10%)" : "hsl(0 0% 60%)",
                  }}
                >
                  {label}
                </span>
                {activeSection === id && (
                  <motion.div
                    layoutId="vault-tab-underline"
                    className="absolute -bottom-1 left-0 right-0 h-px"
                    style={{ background: "hsl(0 0% 20%)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Products */}
        <AnimatePresence mode="wait">
          {productsLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-24"
            >
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: "hsl(0 0% 50%)" }} />
            </motion.div>
          ) : products && products.length > 0 ? (
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6"
            >
              {products.map((p, i) => (
                <motion.div
                  key={p.node.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <VaultProductCard product={p} onImageExpand={setExpandedProduct} bundleTag={bundleTag} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <div
                className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
                style={{
                  background: "hsl(0 0% 100%)",
                  boxShadow: "0 2px 8px hsl(0 0% 0% / 0.04), 0 8px 24px hsl(0 0% 0% / 0.06)",
                }}
              >
                <ShoppingBag className="w-6 h-6" style={{ color: "hsl(0 0% 70%)" }} />
              </div>
              <p
                className="text-xs font-display uppercase tracking-[0.25em] mb-2"
                style={{ color: "hsl(0 0% 35%)" }}
              >
                No {sectionConfig.label.toLowerCase()} right now
              </p>
              <p className="text-xs font-body" style={{ color: "hsl(0 0% 60%)" }}>
                Check back soon — new drops land without warning
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Image lightbox */}
      <AnimatePresence>
        {expandedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setExpandedProduct(null)}
          >
            <motion.img
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              src={expandedProduct.node.images.edges[0]?.node.url}
              alt={expandedProduct.node.title}
              className="max-w-full max-h-[80vh] rounded-lg object-contain"
              style={{ boxShadow: "0 20px 60px hsl(0 0% 0% / 0.5)" }}
            />
            <p className="absolute bottom-8 left-0 right-0 text-center text-xs font-display uppercase tracking-[0.2em] text-white/70">
              Tap to close
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky bundle progress bar */}
      <AnimatePresence>
        {bundleCount > 0 && !bundleComplete && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md"
            style={{ boxShadow: "0 -4px 20px hsl(0 0% 0% / 0.1)", paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="container max-w-6xl py-3">
              <div className="flex items-center gap-3">
                <Gift className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(0 0% 30%)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-display uppercase tracking-[0.15em]" style={{ color: "hsl(0 0% 20%)" }}>
                    Buy 3, Get 1 Free
                  </p>
                  <p className="text-[10px] font-body" style={{ color: "hsl(0 0% 50%)" }}>
                    {bundleCount} of {VAULT_BUNDLE_MIN} added — {VAULT_BUNDLE_MIN - bundleCount} more to go
                  </p>
                </div>
                {/* Dot progress */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {Array.from({ length: VAULT_BUNDLE_MIN }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        i < bundleCount ? "scale-110" : ""
                      }`}
                      style={{
                        background: i < bundleCount ? "hsl(0 0% 15%)" : "hsl(0 0% 85%)",
                        boxShadow: i < bundleCount ? "0 1px 4px hsl(0 0% 0% / 0.2)" : "none",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bundle complete banner */}
      <AnimatePresence>
        {bundleComplete && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-40 border-t border-primary/20"
            style={{
              background: "linear-gradient(135deg, hsl(0 0% 8%), hsl(0 0% 15%))",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            <div className="container max-w-6xl py-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "hsl(142 70% 45%)" }}>
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-display uppercase tracking-[0.15em] text-white">
                    🎉 Bundle Complete — Cheapest Item Free!
                  </p>
                  <p className="text-[10px] font-body text-white/60">
                    Discount applies at checkout automatically
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function VaultPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentTier, tiers, lifetimePoints, isLoading: rewardsLoading } = useRewards();
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(false);

  const hasTierAccess = !!(currentTier && currentTier.position >= 1);
  const isUnlocked = unlocked;
  const requiredTier = tiers?.find((t) => t.position === 1);
  const requiredTierName = requiredTier?.name || "Collector";
  const requiredPoints = requiredTier ? requiredTier.min_lifetime_spend * requiredTier.earn_rate : 1000;
  const progressPercent = requiredPoints > 0 ? (lifetimePoints / requiredPoints) * 100 : 0;

  if (authLoading || rewardsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Lock className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-sm font-body text-muted-foreground">Sign in to access The Vault</p>
          <Button onClick={() => navigate("/account/login")} className="font-display text-xs uppercase tracking-wider">
            Sign In
          </Button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      {isUnlocked ? (
        <VaultInterior tierName={currentTier?.name} tierIcon={currentTier?.icon} lastName={user?.user_metadata?.last_name || user?.user_metadata?.full_name?.split(" ").pop()} onExit={() => navigate(-1)} />
      ) : (
        <FullPageVaultGate
          onUnlock={() => setUnlocked(true)}
          onClose={() => navigate(-1)}
          currentTierName={currentTier?.name}
          requiredTierName={requiredTierName}
          progressPercent={progressPercent}
          lifetimePoints={lifetimePoints}
          requiredPoints={requiredPoints}
          qualifies={hasTierAccess}
        />
      )}
      <SiteFooter />
    </div>
  );
}
