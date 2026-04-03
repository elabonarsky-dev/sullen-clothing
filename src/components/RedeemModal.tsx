import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skull, CreditCard, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface RedeemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: number;
}

const POINTS_PER_DOLLAR = 100;
const MIN_POINTS = 500;
const STEP = 500;

export function RedeemModal({ open, onOpenChange, balance }: RedeemModalProps) {
  const queryClient = useQueryClient();
  const [redeeming, setRedeeming] = useState(false);
  const [discountCode, setDiscountCode] = useState<string | null>(null);

  // Max redeemable (floored to nearest STEP)
  const maxPoints = Math.floor(balance / STEP) * STEP;
  const canRedeem = maxPoints >= MIN_POINTS;

  const [points, setPoints] = useState(canRedeem ? MIN_POINTS : 0);

  // Sync slider default when balance changes / modal opens
  const effectivePoints = canRedeem ? Math.min(Math.max(points, MIN_POINTS), maxPoints) : 0;
  const dollarValue = effectivePoints / POINTS_PER_DOLLAR;

  // Preset quick-pick options
  const presets = useMemo(() => {
    const options = [500, 1000, 2500];
    return options.filter((p) => p <= maxPoints);
  }, [maxPoints]);

  const handleRedeem = async () => {
    if (!canRedeem || effectivePoints < MIN_POINTS) return;

    // Map to valid redemption options the edge function accepts
    const VALID_OPTIONS: Record<number, number> = { 500: 5, 1000: 10, 2500: 25 };
    const amount = VALID_OPTIONS[effectivePoints];

    if (!amount) {
      toast.error("Please select 500, 1,000, or 2,500 Skulls");
      return;
    }

    setRedeeming(true);
    try {
      const { data, error } = await supabase.functions.invoke("redeem-skulls", {
        body: { points: effectivePoints, amount },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setDiscountCode(data.discount_code);
      toast.success(`Redeemed ${effectivePoints.toLocaleString()} Skulls for $${amount} off!`);

      queryClient.invalidateQueries({ queryKey: ["reward-balance"] });
      queryClient.invalidateQueries({ queryKey: ["reward-lifetime"] });
      queryClient.invalidateQueries({ queryKey: ["reward-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["reward-redemptions"] });
    } catch (err: any) {
      toast.error("Redemption failed", { description: err.message });
    } finally {
      setRedeeming(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setDiscountCode(null);
      if (canRedeem) setPoints(MIN_POINTS);
    }, 300);
  };

  const copyCode = () => {
    if (discountCode) {
      navigator.clipboard.writeText(discountCode);
      toast.success("Copied to clipboard!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border/20 p-0 overflow-hidden">
        {/* Header glow */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.1)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative p-6 sm:p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-hudson text-2xl uppercase tracking-wider text-foreground text-center">
              Redeem Skulls
            </DialogTitle>
            <DialogDescription className="text-xs font-body text-muted-foreground text-center mt-1">
              Convert your Skull Points into a discount code
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {discountCode ? (
              /* ═══ SUCCESS STATE ═══ */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-5"
              >
                <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>

                <div>
                  <p className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-2">
                    Your Discount Code
                  </p>
                  <button
                    onClick={copyCode}
                    className="group inline-block px-6 py-3 bg-primary/10 border border-primary/30 rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <code className="text-lg font-mono text-primary tracking-wider">
                      {discountCode}
                    </code>
                    <p className="text-[10px] font-body text-muted-foreground mt-1 group-hover:text-foreground transition-colors">
                      Click to copy
                    </p>
                  </button>
                </div>

                <p className="text-sm font-body text-primary font-semibold">
                  ${dollarValue.toFixed(0)} off your next order
                </p>

                <Button onClick={handleClose} variant="outline" className="w-full font-display text-xs uppercase tracking-wider">
                  Done
                </Button>
              </motion.div>
            ) : (
              /* ═══ SLIDER STATE ═══ */
              <motion.div
                key="slider"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Balance display */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                    <Skull className="w-4 h-4 text-primary" />
                    <span className="text-sm font-display uppercase tracking-wider text-primary">
                      {balance.toLocaleString()} Available
                    </span>
                  </div>
                </div>

                {!canRedeem ? (
                  <div className="text-center py-4">
                    <p className="text-sm font-body text-muted-foreground">
                      You need at least <span className="text-primary font-semibold">500 Skulls</span> to redeem.
                    </p>
                    <p className="text-xs font-body text-muted-foreground/60 mt-1">
                      {MIN_POINTS - balance} more to go!
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Dollar value — large display */}
                    <div className="text-center">
                      <motion.div
                        key={effectivePoints}
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="text-5xl font-hudson text-primary tracking-wide">
                          ${dollarValue.toFixed(0)}
                        </span>
                      </motion.div>
                      <p className="text-xs font-body text-muted-foreground mt-1">
                        discount value
                      </p>
                    </div>

                    {/* Slider */}
                    <div className="px-2">
                      <Slider
                        min={MIN_POINTS}
                        max={maxPoints}
                        step={STEP}
                        value={[effectivePoints]}
                        onValueChange={([v]) => setPoints(v)}
                        className="py-4"
                      />
                      <div className="flex justify-between text-[10px] font-body text-muted-foreground mt-1">
                        <span>{MIN_POINTS.toLocaleString()} Skulls</span>
                        <span>{maxPoints.toLocaleString()} Skulls</span>
                      </div>
                    </div>

                    {/* Quick presets */}
                    {presets.length > 1 && (
                      <div className="flex gap-2 justify-center">
                        {presets.map((p) => (
                          <button
                            key={p}
                            onClick={() => setPoints(p)}
                            className={`px-4 py-2 rounded-lg text-xs font-display uppercase tracking-wider border transition-all ${
                              effectivePoints === p
                                ? "bg-primary/15 border-primary/40 text-primary"
                                : "bg-card border-border/20 text-muted-foreground hover:border-primary/20 hover:text-foreground"
                            }`}
                          >
                            {p.toLocaleString()}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Points cost line */}
                    <div className="flex items-center justify-between px-1 text-xs font-body">
                      <span className="text-muted-foreground">Skulls to spend</span>
                      <span className="text-foreground font-semibold">{effectivePoints.toLocaleString()}</span>
                    </div>

                    {/* Redeem button */}
                    <Button
                      onClick={handleRedeem}
                      disabled={redeeming || !canRedeem}
                      className="w-full h-12 font-display text-xs uppercase tracking-[0.2em] gap-2"
                    >
                      {redeeming ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          Redeem {effectivePoints.toLocaleString()} Skulls
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </Button>

                    <p className="text-[10px] font-body text-muted-foreground/50 text-center">
                      100 Skulls = $1 · Cannot be combined with other discounts
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
