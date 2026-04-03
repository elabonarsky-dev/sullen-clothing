import { useState } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw, Star, Zap, Check, ChevronDown, Truck, Shield, Palette,
  Crown, Gift, Clock, ArrowRight, Sparkles
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import teeStandard from "@/assets/tee-standard.svg";
import teePremium from "@/assets/tee-premium.svg";
import artistSeriesLogo from "@/assets/artist-series-logo.png";
import heroBg from "@/assets/subscriptions-hero-bg.jpg";
import teeDetailImg from "@/assets/tee-detail-premium.jpg";
import lifestyleImg from "@/assets/subscription-lifestyle.jpg";
import pastDropsImg from "@/assets/past-drops-collection.jpg";
import subStandard1 from "@/assets/sub-standard-1.jpg";
import subStandard2 from "@/assets/sub-standard-2.jpg";
import subStandard3 from "@/assets/sub-standard-3.jpg";
import subStandard4 from "@/assets/sub-standard-4.jpg";
import subPremium1 from "@/assets/sub-premium-1.jpg";
import subPremium2 from "@/assets/sub-premium-2.jpg";
import subPremium3 from "@/assets/sub-premium-3.jpg";
import subPremium4 from "@/assets/sub-premium-4.jpg";
import subPremium5 from "@/assets/sub-premium-5.jpg";

/* ─── Tier data ─── */
const tiers = [
  {
    id: "standard",
    name: "Standard",
    price: 24.99,
    image: teeStandard,
    href: "https://checkout.sullenclothing.com/products/artist-series-tees-monthly",
    tagline: "Hand-selected by Co-Founder Ryan Smith & the creative department.",
    weight: "5.3 oz standard tee · Mostly black",
    sizes: ["S", "M", "L", "XL", "2X", "3X"],
    variantIds: {
      S: "13120376438883",
      M: "13120376471651",
      L: "13120376504419",
      XL: "13120376537187",
      "2X": "13120376569955",
      "3X": "13120376602723",
    } as Record<string, string>,
    features: [
      { text: "Exclusive styles only available to subscribers", included: true },
      { text: "Early access before public release", included: true },
      { text: "Hand-selected by Co-Founder Ryan Smith & the creative department", included: true },
      { text: "Free shipping (domestic US only)", included: true },
      { text: "Order by the 5th — ships end of that month", included: true },
      { text: "Cancel anytime · Manage from your Sullen account", included: true },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 29.99,
    image: teePremium,
    href: "https://checkout.sullenclothing.com/products/subscription-premium-tee-1mo",
    tagline: "Hand-selected by Co-Founder Ryan Smith & the creative department. New surprises coming.",
    weight: "6.5 oz heavyweight cotton",
    popular: true,
    isNew: true,
    sizes: ["S", "M", "L", "XL", "2X", "3X", "4X", "5X"],
    variantIds: {
      S: "39646617600099",
      M: "39646617632867",
      L: "39646617665635",
      XL: "39646617698403",
      "2X": "39646617731171",
      "3X": "39646617763939",
      "4X": "39646617796707",
      "5X": "39646617829475",
    } as Record<string, string>,
    features: [
      { text: "Exclusive styles only available to subscribers", included: true },
      { text: "Early access before public release", included: true },
      { text: "Hand-selected by Co-Founder Ryan Smith & the creative department", included: true },
      { text: "Premium 6.5 oz heavyweight fabric", included: true },
      { text: "Get the tees before anyone else", included: true },
      { text: "Free shipping", included: true },
      { text: "Skull Points 2× multiplier", included: true },
      { text: "Cancel anytime — last order ships end of final month", included: true },
    ],
  },
];
const perks = [
  { icon: Truck, title: "Free Shipping", desc: "Every subscription order ships free. No minimums." },
  { icon: Palette, title: "Exclusive Art", desc: "Designs you can't buy anywhere else, by world-class tattoo artists." },
  { icon: Shield, title: "Cancel Anytime", desc: "No contracts, no commitments. Pause or cancel in one click." },
  { icon: Crown, title: "VIP Perks", desc: "Earn Skull Points at 2× rate and unlock Vault early access." },
];

const faqs = [
  { q: "When do orders ship?", a: "All orders ship at the end of the month. For Standard: place your order before the 5th and you'll receive yours that same month. Orders after the 5th ship at the end of the following month. Premium orders ship at the end of the month you ordered." },
  { q: "What happens when I cancel?", a: "When you cancel, your last order will ship at the end of that final month. No surprise charges after that." },
  { q: "Can I update my subscription?", a: "Yes — log into your Sullen account to change or update your size, address, or any other info." },
  { q: "What's the difference between Standard and Premium?", a: "Standard tees are 5.3 oz, curated by Co-Founder Ryan Smith and the design team — mostly black tees. Premium tees are 6.5 oz heavyweight cotton, hand-picked by our creative department, with exclusive surprises for subscribers." },
  { q: "Is this available internationally?", a: "Subscriptions are currently available for domestic US customers only." },
  { q: "Do I earn Skull Points on subscriptions?", a: "Yes! Standard subscribers earn at the normal rate. Premium subscribers earn at 2× the standard rate on every subscription order." },
  { q: "Can I gift a subscription?", a: "We offer 3-month, 6-month, and 12-month prepaid gift subscriptions. Check out our gift options below the tier cards." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export default function SubscriptionsLandingPage() {
  const [billingCycle] = useState<"monthly" | "prepaid">("monthly");
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  return (
    <>
      <SEO
        title="Artist Series Subscriptions"
        description="Get a new exclusive Artist Series tee delivered every month. Choose Standard or Premium tier — cancel anytime. Free shipping on every order."
        path="/collections/subscriptions"
      />

      <SiteHeader />

      <main className="min-h-screen bg-background">
        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden py-24 md:py-32">
          {/* Hero background image */}
          <div className="absolute inset-0">
            <img src={heroBg} alt="" className="w-full h-full object-cover" width={1920} height={800} />
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
          </div>
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }} />

          <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <Badge className="text-[9px] font-display uppercase tracking-wider bg-primary text-primary-foreground border-0 gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  New
                </Badge>
                <RefreshCw className="w-4 h-4 text-primary" />
                <span className="font-display text-[10px] uppercase tracking-[0.3em] text-primary">
                  Premium Tee Subscriptions
                </span>
              </div>

              {artistSeriesLogo && (
                <img
                  src={artistSeriesLogo}
                  alt="Artist Series"
                  className="h-10 md:h-14 mx-auto mb-4 opacity-90"
                  style={{ filter: "brightness(1.1)" }}
                />
              )}

              <h1 className="font-display text-3xl md:text-5xl uppercase tracking-wider text-foreground mb-4">
                Our Favorites.<br />
                <span className="text-primary">Delivered Monthly.</span>
              </h1>

              <p className="font-body text-sm md:text-base text-muted-foreground max-w-lg mx-auto mb-3">
                Two ways to subscribe — both hand-selected by <strong className="text-foreground">Co-Founder Ryan Smith</strong> and
                the <strong className="text-foreground">creative department</strong>. <strong className="text-foreground">Standard</strong> — 5.3 oz classic fit.
                <strong className="text-foreground"> Premium</strong> — 6.5 oz heavyweight with exclusive surprises for subscribers.
              </p>
              <p className="font-body text-[11px] text-muted-foreground/70 max-w-md mx-auto mb-8">
                Orders ship end of month. Standard: order by the 5th to get yours that month. Domestic US only. Cancel anytime.
              </p>

              <div className="flex items-center justify-center gap-3">
                <a href="#tiers">
                  <Button size="lg" className="font-display uppercase tracking-wider text-xs gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Choose Your Tier
                  </Button>
                </a>
                <a href="#how-it-works">
                  <Button variant="outline" size="lg" className="font-display uppercase tracking-wider text-xs">
                    How It Works
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section id="how-it-works" className="py-16 border-t border-border/20">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="font-display text-xs uppercase tracking-[0.25em] text-center text-muted-foreground mb-10">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: "01", title: "Pick Your Tier", desc: "Both tiers hand-selected by Co-Founder Ryan Smith & the creative department. Standard 5.3 oz or Premium 6.5 oz heavyweight." },
                { step: "02", title: "Ships End of Month", desc: "Standard: order by the 5th to ship that month. Premium: ships end of the month you ordered." },
                { step: "03", title: "Collect & Flex", desc: "Build your collection of curated wearable art. Earn Skull Points on every order." },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <span className="font-display text-3xl text-primary/20">{item.step}</span>
                  <h3 className="font-display text-sm uppercase tracking-wider text-foreground mt-2 mb-1">
                    {item.title}
                  </h3>
                  <p className="font-body text-xs text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── PREMIUM SHOWCASE GALLERY ─── */}
        <section className="py-16 border-t border-border/20">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="font-display text-xs uppercase tracking-[0.25em] text-center text-muted-foreground mb-2">
              Premium Subscription Drops
            </h2>
            <p className="font-body text-[11px] text-muted-foreground text-center max-w-md mx-auto mb-8">
              Hand-picked by our creative department. 6.5 oz heavyweight cotton with exclusive colorways and surprises only for Premium subscribers.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { src: subPremium1, alt: "Once Bitten cherub tee in teal" },
                { src: subPremium2, alt: "Premium subscription tee collection spread" },
                { src: subPremium3, alt: "Creative Manufacturing snake skull tee" },
                { src: subPremium4, alt: "Sullen Art Collective gold crest tee" },
                { src: subPremium5, alt: "Protect The Trade skull tee in white" },
              ].map((img, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="relative rounded-xl overflow-hidden aspect-square group"
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-6">
              <a href="https://checkout.sullenclothing.com/products/subscription-premium-tee-1mo" target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="font-display uppercase tracking-wider text-[10px] gap-1.5">
                  Subscribe to Premium — $29.99/mo <ArrowRight className="w-3 h-3" />
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* ─── TIER COMPARISON ─── */}
        <section id="tiers" className="py-16 border-t border-border/20">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="font-display text-xs uppercase tracking-[0.25em] text-center text-muted-foreground mb-10">
              Choose Your Tier
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {tiers.map((tier, i) => (
                <motion.div
                  key={tier.id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className={`relative rounded-xl border p-6 md:p-8 transition-all ${
                    tier.popular
                      ? "border-primary/40 bg-primary/[0.03] shadow-[0_0_40px_-12px_hsl(var(--primary)/0.2)]"
                      : "border-border/30 bg-card/60"
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-2.5 left-5 flex gap-1.5">
                      {(tier as any).isNew && (
                        <Badge className="text-[9px] font-display uppercase tracking-wider bg-destructive text-destructive-foreground border-0">
                          New!
                        </Badge>
                      )}
                      <Badge className="text-[9px] font-display uppercase tracking-wider bg-primary text-primary-foreground border-0">
                        <Star className="w-2.5 h-2.5 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-start gap-4 mb-5">
                    <img
                      src={tier.image}
                      alt={`${tier.name} tee`}
                      className="w-20 h-20 object-contain opacity-80"
                    />
                    <div>
                      <h3 className="font-display text-lg uppercase tracking-wider text-foreground">
                        {tier.name}
                      </h3>
                      <p className="text-[10px] font-body text-muted-foreground mt-0.5">{tier.tagline}</p>
                      <div className="flex items-baseline gap-0.5 mt-2">
                        <span className="text-2xl font-display text-foreground">${tier.price}</span>
                        <span className="text-[10px] font-body text-muted-foreground">/ month</span>
                      </div>
                      <span className="text-[9px] font-body text-primary/80 uppercase tracking-wider">
                        {tier.weight}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 mb-6">
                    {tier.features.map((feat, fi) => (
                      <li key={fi} className="flex items-start gap-2.5 text-[11px] font-body">
                        {feat.included ? (
                          <Check className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 mt-0.5 shrink-0 rounded-full border border-border/40" />
                        )}
                        <span className={feat.included ? "text-foreground/90" : "text-muted-foreground/50"}>
                          {feat.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Size selector */}
                  <div className="mb-4">
                    <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                      Select Size
                    </p>
                    <div className={`grid gap-1.5 ${tier.sizes.length > 6 ? 'grid-cols-4' : 'grid-cols-6'}`}>
                      {tier.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSizes((prev) => ({ ...prev, [tier.id]: size }))}
                          className={`w-10 h-9 rounded-md text-[11px] font-display uppercase tracking-wider border transition-all ${
                            selectedSizes[tier.id] === size
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border/40 text-muted-foreground hover:border-primary/60 hover:text-foreground"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <a
                    href={
                      selectedSizes[tier.id]
                        ? `${tier.href}?variant=${tier.variantIds[selectedSizes[tier.id]]}`
                        : undefined
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!selectedSizes[tier.id]) e.preventDefault();
                    }}
                  >
                    <Button
                      className="w-full font-display uppercase tracking-wider text-xs"
                      variant={tier.popular ? "default" : "secondary"}
                      size="lg"
                      disabled={!selectedSizes[tier.id]}
                    >
                      {selectedSizes[tier.id]
                        ? `Subscribe (${selectedSizes[tier.id]}) — $${tier.price}/mo`
                        : `Select Size — $${tier.price}/mo`}
                    </Button>
                  </a>
                </motion.div>
              ))}
            </div>

            {/* Gift options callout */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-8 text-center rounded-lg border border-border/20 bg-card/40 p-5"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift className="w-4 h-4 text-primary" />
                <span className="font-display text-xs uppercase tracking-wider text-foreground">
                  Gift a Subscription
                </span>
              </div>
              <p className="font-body text-[11px] text-muted-foreground mb-3">
                Give the gift of wearable art. Available in 3, 6, and 12-month prepaid plans.
              </p>
              <a href="https://checkout.sullenclothing.com/products/artist-series-tees-monthly" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="font-display uppercase tracking-wider text-[10px] gap-1.5">
                  Shop Gift Options <ArrowRight className="w-3 h-3" />
                </Button>
              </a>
            </motion.div>
          </div>
        </section>

        {/* ─── PERKS STRIP ─── */}
        <section className="py-14 border-t border-border/20 bg-card/30">
          <div className="max-w-4xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {perks.map((perk, i) => (
                <motion.div
                  key={perk.title}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <perk.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                  <h3 className="font-display text-[11px] uppercase tracking-wider text-foreground mb-1">
                    {perk.title}
                  </h3>
                  <p className="font-body text-[10px] text-muted-foreground leading-relaxed">{perk.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── STANDARD SHOWCASE GALLERY ─── */}
        <section className="py-16 border-t border-border/20">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="font-display text-xs uppercase tracking-[0.25em] text-center text-muted-foreground mb-2">
              Standard Subscription Drops
            </h2>
            <p className="font-body text-[11px] text-muted-foreground text-center max-w-md mx-auto mb-8">
              Exclusive styles only available to subscribers. Early access before anyone else.
              Once they're gone, they're gone.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { src: subStandard1, alt: "Julian Farrar cathedral skull tee" },
                { src: subStandard2, alt: "Dan Roberts flame skull tee" },
                { src: subStandard3, alt: "Quangsta Art Collective tee" },
                { src: subStandard4, alt: "Carlos Torres fallen angel tee" },
              ].map((img, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="relative rounded-xl overflow-hidden aspect-square group"
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-6">
              <a href="https://checkout.sullenclothing.com/products/artist-series-tees-monthly" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="font-display uppercase tracking-wider text-[10px] gap-1.5">
                  Subscribe to Standard — $24.99/mo <ArrowRight className="w-3 h-3" />
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="py-16 border-t border-border/20">
          <div className="max-w-2xl mx-auto px-4">
            <h2 className="font-display text-xs uppercase tracking-[0.25em] text-center text-muted-foreground mb-8">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border border-border/20 rounded-lg px-4 bg-card/30"
                >
                  <AccordionTrigger className="font-display text-xs uppercase tracking-wider text-foreground hover:text-primary py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="font-body text-xs text-muted-foreground pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="py-16 border-t border-border/20">
          <div className="max-w-lg mx-auto px-4 text-center">
            <h2 className="font-display text-xl md:text-2xl uppercase tracking-wider text-foreground mb-3">
              Join the <span className="text-primary">Artist Series</span>
            </h2>
            <p className="font-body text-xs text-muted-foreground mb-6">
              New art. New artist. Every month. Your first tee ships within days of subscribing.
            </p>
            <a href="#tiers">
              <Button size="lg" className="font-display uppercase tracking-wider text-xs gap-2">
                <RefreshCw className="w-3.5 h-3.5" />
                Get Started
              </Button>
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
