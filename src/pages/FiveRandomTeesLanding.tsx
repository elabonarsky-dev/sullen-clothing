import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback, useMemo } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ReviewsCarousel } from "@/components/ReviewsCarousel";
import { useCollectionProducts } from "@/hooks/useCollectionProducts";
import { useNativeReviews } from "@/hooks/useNativeReviews";
import {
  ShoppingBag, Shuffle, Package, Star, Shield,
  ChevronRight, Sparkles, Shirt, ArrowRight, Camera,
} from "lucide-react";

const STEPS = [
  {
    icon: ShoppingBag,
    title: "Choose Your Pack",
    description: "Select the 5 Random Premium Tees bundle — one simple purchase.",
  },
  {
    icon: Shuffle,
    title: "We Curate",
    description: "Our team hand-picks 5 premium tees from current and past collections. No duplicates, no filler.",
  },
  {
    icon: Package,
    title: "Unbox the Surprise",
    description: "Receive a curated mystery pack worth way more than what you paid. Every shirt is premium quality.",
  },
];

const FAQ = [
  {
    q: "Can I choose which shirts I get?",
    a: "The magic is in the mystery! We hand-pick a curated mix based on available stock. You might get exclusive designs you can't buy individually.",
  },
  {
    q: "What sizes are available?",
    a: "We carry S through 3XL. Select your size at checkout and all 5 tees will be in your chosen size.",
  },
  {
    q: "Are these actually premium quality?",
    a: "Every tee in this bundle is from our Premium line — 185g/m² ringspun cotton, tailored fit, and the same quality you'd get buying them individually at $32+ each.",
  },
  {
    q: "Will I get duplicate designs?",
    a: "Never. Every pack contains 5 unique designs from across our collections.",
  },
  {
    q: "What if something doesn't fit?",
    a: "Our standard 30-day return and exchange policy applies. We've got you covered.",
  },
];

const VALUE_PROPS = [
  { label: "5 Premium Tees", detail: "Valued at $160+" },
  { label: "Hand-Picked", detail: "Curated by our team" },
  { label: "No Duplicates", detail: "5 unique designs" },
  { label: "Free Shipping", detail: "On orders $99+" },
];

export default function FiveRandomTeesLanding() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="5 Random Premium Tees — Mystery Pack | Sullen"
        description="Get 5 hand-picked premium tees for a fraction of retail. No duplicates, no filler — just $160+ worth of premium Sullen designs in every pack."
        path="/5-random-tees"
      />
      <SiteHeader />

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Full-bleed hero background image */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent z-[1]" />
        <div className="max-w-6xl mx-auto px-4 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-display uppercase tracking-wider text-primary">Best Seller</span>
              </div>
              <h1 className="font-hudson text-4xl lg:text-6xl uppercase tracking-[0.05em] text-foreground leading-[1.1]">
                5 Random<br />
                <span className="text-primary">Premium Tees</span>
              </h1>
              <p className="text-lg font-body text-muted-foreground leading-relaxed max-w-md">
                Our most popular product. Get 5 hand-picked premium tees from current
                and past collections — curated just for you. Over <strong className="text-foreground">$160+ in value</strong>.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/product/5-random-premium-tees">
                  <Button size="lg" className="h-14 px-8 text-base font-display uppercase tracking-[0.15em] shadow-lg shadow-primary/20">
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Shop Now
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="outline" size="lg" className="h-14 px-8 text-base font-display uppercase tracking-[0.15em]">
                    How It Works
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </a>
              </div>
            </motion.div>

            {/* Value cards with product image background */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative aspect-square"
            >
              <ProductHeroBackground />
              <div className="absolute inset-0 z-10 grid grid-cols-2 gap-3 p-6 content-center">
                {VALUE_PROPS.map((v, i) => (
                  <motion.div
                    key={v.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="bg-card/85 backdrop-blur-sm border border-border/30 rounded-lg p-4 text-center"
                  >
                    <p className="font-display text-sm uppercase tracking-wider text-foreground">{v.label}</p>
                    <p className="text-xs font-body text-primary mt-1">{v.detail}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── UGC Scrolling Strip ─── */}
      <UGCMarquee />

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-card/30">
        <div className="max-w-5xl mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-hudson text-3xl lg:text-4xl uppercase tracking-wider text-foreground">
              How It Works
            </h2>
            <p className="text-sm font-body text-muted-foreground mt-3 max-w-md mx-auto">
              Three steps to your next favorite tees
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center"
              >
                {i < STEPS.length - 1 && (
                  <ArrowRight className="hidden md:block absolute -right-6 top-8 w-5 h-5 text-muted-foreground/30" />
                )}
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>
                <p className="text-[10px] font-display uppercase tracking-[0.2em] text-primary mb-2">
                  Step {i + 1}
                </p>
                <h3 className="font-display text-lg uppercase tracking-wider text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm font-body text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Value Breakdown ─── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-hudson text-3xl lg:text-4xl uppercase tracking-wider text-foreground">
              The Breakdown
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card/60 border border-border/30 rounded-xl p-8 lg:p-10"
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border/20">
                  <div className="flex items-center gap-3">
                    <Shirt className="w-5 h-5 text-primary/60" />
                    <span className="font-body text-foreground">5× Premium Tees</span>
                  </div>
                  <span className="font-display text-foreground">$160+</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/20">
                  <span className="font-body text-muted-foreground">Individual retail value</span>
                  <span className="font-body text-muted-foreground line-through">$32+ each</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="font-display text-lg uppercase tracking-wider text-primary">You Pay</span>
                  <span className="font-display text-2xl text-primary">Bundle Price</span>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { icon: Star, text: "Premium 185g/m² ringspun cotton" },
                  { icon: Shield, text: "Same quality as individual purchases" },
                  { icon: Shuffle, text: "Unique designs — no duplicates" },
                  { icon: Package, text: "Ships within 1-3 business days" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-primary/60 flex-shrink-0" />
                    <span className="text-sm font-body text-muted-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Reviews ─── */}
      <section className="py-20 lg:py-28 bg-card/30">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="font-hudson text-3xl lg:text-4xl uppercase tracking-wider text-foreground">
              What Customers Say
            </h2>
          </motion.div>
          <ReviewsCarousel />
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-hudson text-3xl lg:text-4xl uppercase tracking-wider text-foreground">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="space-y-0">
            {FAQ.map((item, i) => (
              <FAQItem key={i} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-20 lg:py-28 bg-gradient-to-t from-primary/5 via-transparent to-transparent">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="font-hudson text-3xl lg:text-4xl uppercase tracking-wider text-foreground">
              Ready to Roll the Dice?
            </h2>
            <p className="text-sm font-body text-muted-foreground max-w-md mx-auto">
              Join thousands of customers who've discovered their new favorite tees through our mystery packs.
            </p>
            <Link to="/product/5-random-premium-tees">
              <Button size="lg" className="h-14 px-10 text-base font-display uppercase tracking-[0.15em] shadow-lg shadow-primary/20">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Get Your Pack
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

/* ─── Product Hero Background ─── */
import heroBackground from "@/assets/5rt-hero-bg.png";

function ProductHeroBackground() {
  return (
    <div className="absolute inset-0 z-0">
      <img
        src={heroBackground}
        alt="5 Random Premium Tees Pack"
        className="w-full h-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-black/60" />
    </div>
  );
}

/* ─── Product Photo Marquee Strip ─── */
function UGCMarquee() {
  const { data: reviewData } = useNativeReviews("5-random-premium-tees", "Premium Tees");

  // Collect unique UGC images from customer review media
  const photos = useMemo(() => {
    const seen = new Set<string>();
    const urls: string[] = [];
    for (const r of reviewData?.reviews ?? []) {
      for (const url of r.mediaUrls) {
        if (!seen.has(url)) {
          seen.add(url);
          urls.push(url);
        }
        if (urls.length >= 24) break;
      }
      if (urls.length >= 24) break;
    }
    return urls;
  }, [reviewData?.reviews]);

  if (photos.length < 3) return null;

  const doubled = [...photos, ...photos];

  return (
    <section className="py-6 overflow-hidden border-y border-border/20 bg-card/30">
      <div className="flex items-center gap-2 justify-center mb-4">
        <Camera className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] font-display uppercase tracking-[0.2em] text-muted-foreground">
          Customer Photos
        </span>
      </div>
      <div className="relative">
        <div
          className="flex gap-3 w-max"
          style={{
            animation: `ugc-scroll ${photos.length * 3}s linear infinite`,
          }}
        >
          {doubled.map((url, i) => (
            <div
              key={i}
              className="w-28 h-28 md:w-36 md:h-36 rounded-lg overflow-hidden flex-shrink-0 border border-border/20"
            >
              <img
                src={url}
                alt={`Customer photo ${(i % photos.length) + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ Accordion Item ─── */
import { ChevronDown } from "lucide-react";
import { AnimatePresence } from "framer-motion";

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border/30">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="font-display text-sm uppercase tracking-wider text-foreground pr-4">
          {question}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm font-body text-muted-foreground leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
