import { useState } from "react";
import { useRewards } from "@/hooks/useRewards";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skull, Gift, History, Copy, Check, Loader2, ShoppingCart, Star, Users, Instagram, Cake, Trophy, ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const redeemOptions = [
  { label: "$5 off", points: 500, amount: 5 },
  { label: "$10 off", points: 1000, amount: 10 },
  { label: "$25 off", points: 2500, amount: 25 },
];

const txMeta: Record<string, { label: string; icon: typeof Skull; color: string }> = {
  signup_bonus: { label: "Signup Bonus", icon: Sparkles, color: "text-primary" },
  purchase: { label: "Purchase", icon: ShoppingCart, color: "text-primary" },
  review: { label: "Review Reward", icon: Star, color: "text-yellow-400" },
  referral: { label: "Referral Bonus", icon: Users, color: "text-emerald-400" },
  social_follow: { label: "Social Follow", icon: Instagram, color: "text-pink-400" },
  birthday: { label: "Birthday Bonus", icon: Cake, color: "text-primary" },
  birthday_multiplier: { label: "Birthday 3× Multiplier", icon: Cake, color: "text-primary" },
  collect_the_set: { label: "Collect The Set", icon: Trophy, color: "text-primary" },
  redemption: { label: "Redeemed", icon: Gift, color: "text-destructive" },
  admin_adjustment: { label: "Adjustment", icon: Skull, color: "text-muted-foreground" },
  okendo_import: { label: "Imported Points", icon: ArrowUpRight, color: "text-primary" },
  survey: { label: "Survey Reward", icon: Star, color: "text-primary" },
};

function getTxMeta(type: string) {
  return txMeta[type] || { label: type, icon: Skull, color: "text-muted-foreground" };
}

export function SkullPointsDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    balance,
    lifetimePoints,
    transactions,
    tiers,
    redemptions,
    currentTier,
    nextTier,
    isLoading,
  } = useRewards();
  const [redeeming, setRedeeming] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [tab, setTab] = useState<"earn" | "redeem" | "history">("earn");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const handleRedeem = async (option: (typeof redeemOptions)[number]) => {
    if (balance < option.points) {
      toast.error("Not enough Skull Points");
      return;
    }
    setRedeeming(option.points);
    try {
      const { data, error } = await supabase.functions.invoke("redeem-skulls", {
        body: { points: option.points, amount: option.amount },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Redeemed ${option.points} Skulls for $${option.amount} off!`, {
        description: `Discount code: ${data.discount_code}`,
      });
      queryClient.invalidateQueries({ queryKey: ["reward-balance"] });
      queryClient.invalidateQueries({ queryKey: ["reward-lifetime"] });
      queryClient.invalidateQueries({ queryKey: ["reward-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["reward-redemptions"] });
    } catch (err: any) {
      toast.error("Redemption failed", { description: err.message });
    } finally {
      setRedeeming(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // --- Tier Roadmap ---
  const currentTierIdx = currentTier ? tiers.findIndex((t) => t.id === currentTier.id) : -1;

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-card border border-border/20 rounded-lg p-6"
      >
        {/* Subtle glow behind skull */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2 relative z-10">
          <div>
            <p className="text-[10px] font-display uppercase tracking-[0.2em] text-muted-foreground mb-1">
              Skull Points Balance
            </p>
            <p className="text-4xl font-hudson text-primary tracking-wide leading-none">
              {balance.toLocaleString()}
            </p>
            <p className="text-[10px] font-body text-muted-foreground mt-1">
              {lifetimePoints.toLocaleString()} lifetime earned
            </p>
          </div>
          <motion.div
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
            className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20"
          >
            <Skull className="w-8 h-8 text-primary" />
          </motion.div>
        </div>
      </motion.div>

      {/* Tier Progression Roadmap */}
      {tiers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border/20 rounded-lg p-5"
        >
          <p className="text-[10px] font-display uppercase tracking-[0.2em] text-muted-foreground mb-5">
            Vault Tier Progression
          </p>

          {/* Visual Roadmap */}
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute top-5 left-5 right-5 h-[2px] bg-border/30 z-0" />
            {/* Filled progress line */}
            <div
              className="absolute top-5 left-5 h-[2px] bg-primary z-[1] transition-all duration-700"
              style={{
                width: `calc(${
                  currentTierIdx >= 0
                    ? (currentTierIdx / Math.max(tiers.length - 1, 1)) * 100
                    : 0
                }% - 20px)`,
              }}
            />

            <div className="relative z-10 flex justify-between">
              {tiers.map((tier, idx) => {
                const isActive = currentTierIdx >= idx;
                const isCurrent = currentTierIdx === idx;
                const tierColor = tier.color_hex || (isActive ? "hsl(38, 90%, 52%)" : "hsl(0, 0%, 30%)");

                return (
                  <div key={tier.id} className="flex flex-col items-center" style={{ width: `${100 / tiers.length}%` }}>
                    {/* Node */}
                    <motion.div
                      initial={false}
                      animate={isCurrent ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                      transition={isCurrent ? { duration: 2, repeat: Infinity } : {}}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all duration-500 ${
                        isCurrent
                          ? "border-primary bg-primary/20 shadow-[0_0_12px_hsl(38,90%,52%,0.4)]"
                          : isActive
                          ? "border-primary/60 bg-primary/10"
                          : "border-border/30 bg-card"
                      }`}
                      style={isCurrent ? {} : isActive ? {} : { borderColor: tierColor }}
                    >
                      <span className={isCurrent ? "drop-shadow-[0_0_4px_hsl(38,90%,52%)]" : ""}>
                        {tier.icon}
                      </span>
                    </motion.div>

                    {/* Label */}
                    <p
                      className={`text-[9px] font-display uppercase tracking-wider mt-2 text-center leading-tight ${
                        isCurrent ? "text-primary font-bold" : isActive ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {tier.name}
                    </p>
                    <p className="text-[8px] font-body text-muted-foreground/60 mt-0.5">
                      {tier.earn_rate}× earn
                    </p>
                    {isCurrent && (
                      <motion.span
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[8px] font-display text-primary mt-1 bg-primary/10 px-1.5 py-0.5 rounded-full"
                      >
                        YOU
                      </motion.span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next tier info */}
          {nextTier && (
            <div className="mt-5 pt-4 border-t border-border/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-body text-muted-foreground">
                  <span className="text-foreground font-semibold">
                    {Math.max(0, nextTier.min_lifetime_spend - lifetimePoints).toLocaleString()}
                  </span>{" "}
                  points to {nextTier.icon} {nextTier.name}
                </p>
                <p className="text-[10px] font-display text-primary">
                  {Math.min(
                    100,
                    Math.round(
                      ((lifetimePoints - (currentTier?.min_lifetime_spend ?? 0)) /
                        (nextTier.min_lifetime_spend - (currentTier?.min_lifetime_spend ?? 0))) *
                        100
                    )
                  )}
                  %
                </p>
              </div>
              <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(
                      100,
                      ((lifetimePoints - (currentTier?.min_lifetime_spend ?? 0)) /
                        (nextTier.min_lifetime_spend - (currentTier?.min_lifetime_spend ?? 0))) *
                        100
                    )}%`,
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/80 to-primary rounded-full"
                />
              </div>
              {/* Perks preview */}
              {nextTier.perks && nextTier.perks.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {nextTier.perks.slice(0, 3).map((perk, i) => (
                    <span
                      key={i}
                      className="text-[8px] font-body text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full"
                    >
                      {perk}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {!nextTier && currentTier && (
            <div className="mt-4 pt-3 border-t border-border/10 text-center">
              <p className="text-[11px] font-display text-primary">
                🎉 Max tier unlocked — {currentTier.earn_rate}× earning rate
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-border/20">
        {[
          { id: "earn" as const, label: "Earn", icon: Skull },
          { id: "redeem" as const, label: "Redeem", icon: Gift },
          { id: "history" as const, label: "History", icon: History },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-display uppercase tracking-wider border-b-2 transition-colors ${
              tab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Earn Tab */}
        {tab === "earn" && (
          <motion.div
            key="earn"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            className="grid gap-3"
          >
            {[
              { title: "Place an Order", desc: `${currentTier?.earn_rate ?? 2} Skulls per $1 spent`, icon: "🛒" },
              { title: "Birthday 3× Multiplier", desc: "3× points on all purchases on your birthday", icon: "🎂" },
              { title: "Collect The Set", desc: "+500 bonus for 3+ items in one order", icon: "🃏" },
              { title: "Write a Review", desc: "Up to 200 Skulls", icon: "⭐" },
              { title: "Refer a Friend", desc: "500 Skulls", icon: "👥" },
              { title: "Follow on Instagram", desc: "100 Skulls", icon: "📸" },
            ].map((rule) => (
              <div
                key={rule.title}
                className="flex items-center gap-3 p-3 bg-card border border-border/20 rounded-lg hover:border-primary/20 transition-colors"
              >
                <span className="text-lg">{rule.icon}</span>
                <div>
                  <p className="text-xs font-display uppercase tracking-wider text-foreground">
                    {rule.title}
                  </p>
                  <p className="text-[11px] font-body text-muted-foreground">{rule.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Redeem Tab */}
        {tab === "redeem" && (
          <motion.div
            key="redeem"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            className="space-y-4"
          >
            <div className="grid gap-3">
              {redeemOptions.map((option) => (
                <div
                  key={option.points}
                  className="flex items-center justify-between p-4 bg-card border border-border/20 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-display uppercase tracking-wider text-foreground">
                      {option.label}
                    </p>
                    <p className="text-xs font-body text-primary font-semibold">
                      {option.points.toLocaleString()} Skulls
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleRedeem(option)}
                    disabled={balance < option.points || redeeming !== null}
                    className="font-display text-[10px] uppercase tracking-wider"
                  >
                    {redeeming === option.points ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "Redeem"
                    )}
                  </Button>
                </div>
              ))}
            </div>

            {redemptions.length > 0 && (
              <div>
                <p className="text-xs font-display uppercase tracking-wider text-foreground mb-3">
                  Your Discount Codes
                </p>
                <div className="space-y-2">
                  {redemptions.map((r) => (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between p-3 bg-card border rounded-lg ${
                        r.used ? "border-border/10 opacity-50" : "border-primary/30"
                      }`}
                    >
                      <div>
                        <code className="text-xs font-mono text-foreground">{r.discount_code}</code>
                        <p className="text-[10px] font-body text-muted-foreground">
                          ${r.discount_amount} off · {r.used ? "Used" : "Active"}
                        </p>
                      </div>
                      {!r.used && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCode(r.discount_code)}
                          className="h-7 px-2"
                        >
                          {copiedCode === r.discount_code ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* History Tab */}
        {tab === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
          >
            {transactions.length === 0 ? (
              <div className="text-center py-10">
                <History className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs font-body text-muted-foreground">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {/* Running balance header */}
                <div className="flex items-center justify-between px-3 pb-2 mb-1 border-b border-border/20">
                  <span className="text-[9px] font-display uppercase tracking-[0.15em] text-muted-foreground">
                    Activity
                  </span>
                  <span className="text-[9px] font-display uppercase tracking-[0.15em] text-muted-foreground">
                    Points
                  </span>
                </div>

                {transactions.map((tx, idx) => {
                  const meta = getTxMeta(tx.type);
                  const TxIcon = meta.icon;
                  const isPositive = tx.points > 0;

                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03, duration: 0.25 }}
                      className="flex items-center gap-3 py-3 px-3 rounded-md hover:bg-secondary/30 transition-colors group"
                    >
                      {/* Icon */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isPositive ? "bg-primary/10" : "bg-destructive/10"
                        }`}
                      >
                        <TxIcon className={`w-3.5 h-3.5 ${meta.color}`} />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-display uppercase tracking-wider text-foreground leading-tight">
                          {meta.label}
                        </p>
                        {tx.description && (
                          <p className="text-[10px] font-body text-muted-foreground truncate">
                            {tx.description}
                          </p>
                        )}
                        <p className="text-[9px] font-body text-muted-foreground/50 mt-0.5">
                          {new Date(tx.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      {/* Points */}
                      <div className="flex items-center gap-1 shrink-0">
                        {isPositive ? (
                          <ArrowUpRight className="w-3 h-3 text-primary" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 text-destructive" />
                        )}
                        <span
                          className={`text-sm font-display tabular-nums ${
                            isPositive ? "text-primary" : "text-destructive"
                          }`}
                        >
                          {isPositive ? "+" : ""}
                          {tx.points.toLocaleString()}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
