import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Star, Zap } from "lucide-react";
import teeStandard from "@/assets/tee-standard.svg";
import teePremium from "@/assets/tee-premium.svg";

const plans = [
  {
    id: "premium",
    name: "Premium",
    price: "$29.99",
    interval: "/ month",
    description: "Heavyweight 6.5oz cotton, Artist Series collaboration tee delivered monthly.",
    features: [
      "Premium 6.5oz heavyweight tee",
      "Exclusive Artist Series design each month",
      "Early access to new drops",
      "Free shipping on subscription orders",
      "Cancel anytime",
    ],
    image: teePremium,
    href: "/product/subscription-premium-tee-1mo",
    badge: "Most Popular",
    accent: true,
  },
  {
    id: "standard",
    name: "Standard",
    price: "$24.99",
    interval: "/ month",
    description: "Classic 5.3oz cotton Artist Series tee delivered to your door every month.",
    features: [
      "Standard 5.3oz classic fit tee",
      "Monthly Artist Series design",
      "Subscriber-only colorways",
      "Free shipping on subscription orders",
      "Cancel anytime",
    ],
    image: teeStandard,
    href: "/product/artist-series-tees-monthly",
    badge: null,
    accent: false,
  },
];

export function SubscriptionsTab() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <RefreshCw className="w-4 h-4 text-primary" />
          <h2 className="font-display text-sm uppercase tracking-[0.2em] text-foreground">
            Artist Series Subscriptions
          </h2>
        </div>
        <p className="text-xs font-body text-muted-foreground max-w-md mx-auto">
          Get a new Artist Series tee delivered every month. Choose your tier — cancel anytime.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-xl border p-6 transition-all ${
              plan.accent
                ? "border-primary/40 bg-primary/[0.03] shadow-[0_0_30px_-10px_hsl(var(--primary)/0.15)]"
                : "border-border/30 bg-card/60"
            }`}
          >
            {plan.badge && (
              <Badge className="absolute -top-2.5 left-4 text-[9px] font-display uppercase tracking-wider bg-primary text-primary-foreground border-0">
                <Star className="w-2.5 h-2.5 mr-1" />
                {plan.badge}
              </Badge>
            )}

            <div className="flex items-start gap-4 mb-4">
              <img
                src={plan.image}
                alt={`${plan.name} tee`}
                className="w-16 h-16 object-contain opacity-80"
              />
              <div>
                <h3 className="font-display text-base uppercase tracking-wider text-foreground">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-0.5 mt-1">
                  <span className="text-xl font-display text-foreground">{plan.price}</span>
                  <span className="text-[10px] font-body text-muted-foreground">{plan.interval}</span>
                </div>
              </div>
            </div>

            <p className="text-xs font-body text-muted-foreground mb-4">{plan.description}</p>

            <ul className="space-y-2 mb-6">
              {plan.features.map((feat, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] font-body text-foreground/80">
                  <Zap className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>

            <Link to={plan.href}>
              <Button
                className={`w-full font-display uppercase tracking-wider text-xs ${
                  plan.accent ? "" : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
                variant={plan.accent ? "default" : "secondary"}
                size="sm"
              >
                Subscribe — {plan.price}/mo
              </Button>
            </Link>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link
          to="/collections/subscriptions"
          className="text-[10px] font-display uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
        >
          View all subscription options →
        </Link>
      </div>
    </div>
  );
}
