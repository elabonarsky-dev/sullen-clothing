import { useMemo } from "react";
import { Truck, Gift, Check, PartyPopper } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface CartIncentive {
  id: string;
  label: string;
  type: string;
  threshold: number;
  description: string | null;
  icon: string;
}

const ICON_MAP: Record<string, typeof Truck> = {
  "🚚": Truck,
  shipping: Truck,
  "🎁": Gift,
  gift: Gift,
};

export function CartProgressBar({ cartTotal }: { cartTotal: number }) {
  const { data: incentives } = useQuery({
    queryKey: ["cart-incentives"],
    queryFn: async () => {
      const { data } = await supabase
        .from("cart_incentives")
        .select("*")
        .eq("is_active", true)
        .order("threshold", { ascending: true });
      return (data || []) as CartIncentive[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const milestones = useMemo(() => {
    if (!incentives?.length) return [];
    return incentives
      .map((inc) => ({
        ...inc,
        unlocked: cartTotal >= inc.threshold,
        remaining: Math.max(0, inc.threshold - cartTotal),
      }));
  }, [incentives, cartTotal]);

  if (!milestones.length) return null;

  const maxThreshold = milestones[milestones.length - 1].threshold;
  // Add headroom so the last milestone icon has space on the right
  const trackMax = maxThreshold * 1.15;
  const lastMilestonePercent = (maxThreshold / trackMax) * 100;
  // Cap fill at the last milestone position so it doesn't extend past the checkpoint
  const progressPercent = Math.min((cartTotal / trackMax) * 100, lastMilestonePercent);
  const allUnlocked = milestones.every((m) => m.unlocked);
  const nextMilestone = milestones.find((m) => !m.unlocked);

  const milestoneStops = (() => {
    const groups = new Map<number, typeof milestones>();
    for (const milestone of milestones) {
      const existing = groups.get(milestone.threshold);
      if (existing) {
        existing.push(milestone);
      } else {
        groups.set(milestone.threshold, [milestone]);
      }
    }

    return Array.from(groups.entries()).map(([threshold, grouped]) => {
      const primary = grouped.find((g) => g.type === "shipping") ?? grouped[0];
      return {
        id: grouped.map((g) => g.id).join("-"),
        threshold,
        unlocked: grouped.every((g) => g.unlocked),
        icon: primary.icon,
        type: primary.type,
        label:
          grouped.length > 1
            ? grouped.map((g) => g.label.replace(/^free\s*/i, "")).join(" + ")
            : grouped[0].label,
      };
    });
  })();

  // The "slider icon" rides the leading edge of the progress bar
  const sliderPercent = Math.min(progressPercent, 97); // cap so it doesn't overflow

  return (
    <div className="mb-4 mx-1 rounded-lg bg-secondary/40 border border-border/15 px-4 pt-3.5 pb-2">
      {/* Status message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={allUnlocked ? "done" : nextMilestone?.id || "x"}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.3 }}
          className="text-[11px] font-display uppercase tracking-[0.18em] text-center mb-3 leading-relaxed"
        >
          {allUnlocked ? (
            <span className="text-accent flex items-center justify-center gap-1.5">
              <PartyPopper className="w-3.5 h-3.5" />
              All rewards unlocked!
            </span>
          ) : nextMilestone ? (
            <span className="text-foreground/70">
              You're{" "}
              <span className="font-bold text-accent">
                ${nextMilestone.remaining.toFixed(2)}
              </span>{" "}
              away from{" "}
              <span className="font-bold text-foreground">
                FREE {nextMilestone.label.replace(/^free\s*/i, "")}
              </span>
              !
            </span>
          ) : null}
        </motion.p>
      </AnimatePresence>

      {/* Track */}
      <div className="relative h-3 rounded-full bg-background/50 overflow-visible">
        {/* Fill */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Sliding icon — rides the leading edge of the fill, hidden when all unlocked to avoid overlap */}
        {!allUnlocked && (
          <motion.div
            className="absolute top-1/2 z-10"
            initial={{ left: "0%" }}
            animate={{ left: `${sliderPercent}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ transform: "translate(-50%, -50%)" }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-md bg-card border-accent text-accent">
              <Truck className="w-4 h-4" />
            </div>
          </motion.div>
        )}

        {/* Milestone markers at their threshold positions */}
        {milestoneStops.map((m) => {
          const position = (m.threshold / trackMax) * 100;
          const IconComponent = ICON_MAP[m.icon] || ICON_MAP[m.type] || Gift;

          return (
            <div
              key={m.id}
              className="absolute top-1/2"
              style={{ left: `${position}%`, transform: "translate(-50%, -50%)" }}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: m.unlocked ? 1.05 : 0.95,
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${
                  m.unlocked
                    ? "bg-accent border-accent text-accent-foreground"
                    : "bg-card border-border/50 text-muted-foreground/50"
                }`}
              >
                {m.unlocked ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.15 }}
                  >
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <IconComponent className="w-3 h-3" />
                )}
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Labels below milestones */}
      <div className="relative h-5 mt-1">
        {milestoneStops.map((m) => {
          const position = (m.threshold / trackMax) * 100;
          const nearRightEdge = position > 90;
          return (
            <span
              key={m.id}
              className={`absolute text-[8px] sm:text-[9px] font-display uppercase tracking-[0.12em] whitespace-nowrap transition-colors duration-300 ${
                m.unlocked ? "text-accent" : "text-muted-foreground/50"
              } ${nearRightEdge ? "text-right" : ""}`}
              style={{
                left: `${position}%`,
                transform: nearRightEdge ? "translateX(-100%)" : "translateX(-50%)",
                top: "5px",
              }}
            >
              {m.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
