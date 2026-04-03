import { useState, useMemo } from "react";
import { useRewards } from "@/hooks/useRewards";
import { supabase } from "@/integrations/supabase/client";
import { type ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, ShoppingBag, Clock, Skull, Crown, Zap, Expand, Gift, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import vaultDoorImg from "@/assets/sullen-vault.jpg";
import { toast } from "sonner";
import { useVaultProducts } from "@/hooks/useVaultProducts";

type VaultSection = "exclusive" | "early" | "flash";

const VAULT_BUNDLE_TAG: Record<string, string> = {
  exclusive: "vault-exclusive",
  early: "vault-early",
  flash: "vault-flash",
};
const VAULT_BUNDLE_MIN = 4;

const VAULT_SECTIONS: { id: VaultSection; label: string; icon: typeof Crown; description: string }[] = [
  { id: "exclusive", label: "Vault Exclusives", icon: Crown, description: "Products only available to Vault members" },
  { id: "early", label: "Early Drops", icon: Clock, description: "Shop before anyone else" },
  { id: "flash", label: "Flash Sales", icon: Zap, description: "Limited-time deals for Vault members" },
];

function VaultProductCard({ product, onImageExpand, bundleTag }: { product: ShopifyProduct; onImageExpand: (p: ShopifyProduct) => void; bundleTag: string }) {
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const variant = product.node.variants.edges[0]?.node;
  const image = product.node.images.edges[0]?.node;
  const price = product.node.priceRange.minVariantPrice;

  const handleAdd = async () => {
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
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="group">
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
      <p className="text-xs font-body mb-2" style={{ color: "hsl(0 0% 50%)" }}>
        {new Intl.NumberFormat("en-US", { style: "currency", currency: price.currencyCode }).format(parseFloat(price.amount))}
      </p>
      <Button
        size="sm"
        variant="outline"
        onClick={handleAdd}
        disabled={isLoading || !variant?.availableForSale}
        className="w-full font-display text-[10px] uppercase tracking-wider border-border/40 bg-transparent text-foreground hover:bg-secondary/50"
      >
        {!variant?.availableForSale ? "Sold Out" : isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add to Cart"}
      </Button>
    </motion.div>
  );
}

function VaultLockedState({ onUnlock, currentTierName, requiredTierName }: { onUnlock: () => void; currentTierName?: string; requiredTierName: string }) {
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);

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
      onUnlock();
      toast.success("Welcome to The Vault");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex flex-col items-center py-8 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Vault Door Image */}
        <motion.div
          animate={{ filter: ["brightness(0.95)", "brightness(1.05)", "brightness(0.95)"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-[280px] h-[280px] md:w-[380px] md:h-[380px] rounded-full overflow-hidden border-4 border-muted-foreground/40"
          style={{
            boxShadow: `0 0 60px hsl(0 0% 0% / 0.6), 0 0 120px hsl(0 0% 0% / 0.3), inset 0 0 30px hsl(0 0% 0% / 0.2)`,
          }}
        >
          <img
            src={vaultDoorImg}
            alt="The Vault — Locked"
            className="w-full h-full object-cover"
            draggable={false}
          />
          {/* Overlay sheen */}
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg]"
          />
        </motion.div>

        {/* Locked status + code input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center max-w-sm space-y-4"
        >
          <div className="flex items-center justify-center gap-2 text-destructive">
            <Lock className="w-4 h-4" />
            <span className="text-[10px] font-display uppercase tracking-[0.25em]">Locked</span>
          </div>
          <div>
            <h3 className="text-xl font-display uppercase tracking-[0.15em] text-foreground mb-1">
              The Vault
            </h3>
            <p className="text-[11px] font-body text-muted-foreground leading-relaxed">
              Exclusive drops, early access &amp; flash sales. 
              {currentTierName ? (
                <span className="block mt-1 text-muted-foreground/70">
                  You're currently <span className="text-foreground font-semibold">{currentTierName}</span> — reach <span className="text-primary font-semibold">{requiredTierName}</span> tier for auto-access.
                </span>
              ) : (
                <span className="block mt-1 text-muted-foreground/70">
                  Reach <span className="text-primary font-semibold">{requiredTierName}</span> tier for auto-access.
                </span>
              )}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-[9px] font-display uppercase tracking-[0.2em] text-muted-foreground">
              Or enter an access code
            </p>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ACCESS CODE"
                className="font-mono text-xs uppercase tracking-wider bg-secondary/50 border-border/30"
              />
              <Button type="submit" disabled={checking || !code.trim()} size="icon" variant="outline">
                {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              </Button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export function VaultTab() {
  const { currentTier, tiers, isLoading: rewardsLoading } = useRewards();
  const [unlocked, setUnlocked] = useState(false);
  const [activeSection, setActiveSection] = useState<VaultSection>("exclusive");
  const [expandedProduct, setExpandedProduct] = useState<ShopifyProduct | null>(null);
  const cartItems = useCartStore((s) => s.items);

  // Collector+ = position >= 1
  const hasTierAccess = currentTier && currentTier.position >= 1;
  const isUnlocked = unlocked || hasTierAccess;

  // Find the required tier name
  const requiredTier = tiers?.find((t) => t.position === 1);
  const requiredTierName = requiredTier?.name || "Collector";

  const { products, isLoading: productsLoading, hasCollections } = useVaultProducts(activeSection, !!isUnlocked);

  const bundleTag = VAULT_BUNDLE_TAG[activeSection] || "vault-exclusive";
  const bundleCount = useMemo(() => {
    return cartItems.filter((i) => i.bundleTag === bundleTag).reduce((sum, i) => sum + i.quantity, 0);
  }, [cartItems, bundleTag]);
  const bundleComplete = bundleCount >= VAULT_BUNDLE_MIN;

  if (rewardsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <VaultLockedState
        onUnlock={() => setUnlocked(true)}
        currentTierName={currentTier?.name}
        requiredTierName={requiredTierName}
      />
    );
  }

  return (
    <div>
      {/* Unlocked banner */}
      <div className="flex items-center gap-2 mb-6 px-4 py-3 rounded-lg bg-primary/5 border border-primary/10">
        <Crown className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-display uppercase tracking-[0.2em] text-primary">
          Vault Unlocked
          {hasTierAccess && currentTier && (
            <span className="ml-1 text-muted-foreground">— {currentTier.icon} {currentTier.name} access</span>
          )}
        </span>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 border-b border-border/20 mb-6">
        {VAULT_SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-2 px-3 py-2.5 text-[10px] font-display uppercase tracking-wider border-b-2 transition-colors ${
              activeSection === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      <p className="text-xs font-body text-muted-foreground mb-5">
        {VAULT_SECTIONS.find((s) => s.id === activeSection)?.description}
      </p>

      {productsLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <VaultProductCard key={p.node.id} product={p} onImageExpand={setExpandedProduct} bundleTag={bundleTag} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <ShoppingBag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-body text-muted-foreground mb-1">
            No {VAULT_SECTIONS.find((s) => s.id === activeSection)?.label.toLowerCase()} right now
          </p>
          <p className="text-xs font-body text-muted-foreground/70">
            Check back soon — new drops land without warning
          </p>
        </div>
      )}

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
            className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="container max-w-6xl py-3">
              <div className="flex items-center gap-3">
                <Gift className="w-4 h-4 flex-shrink-0 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-display uppercase tracking-[0.15em] text-foreground">
                    Buy 3, Get 1 Free
                  </p>
                  <p className="text-[10px] font-body text-muted-foreground">
                    {bundleCount} of {VAULT_BUNDLE_MIN} added — {VAULT_BUNDLE_MIN - bundleCount} more to go
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {Array.from({ length: VAULT_BUNDLE_MIN }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        i < bundleCount ? "bg-primary scale-110" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bundleComplete && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-40 border-t border-primary/20 bg-primary text-primary-foreground"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="container max-w-6xl py-3">
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-display uppercase tracking-[0.15em]">
                    🎉 Bundle Complete — Cheapest Item Free!
                  </p>
                  <p className="text-[10px] font-body opacity-70">
                    Discount applies at checkout
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
