import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Shuffle, Package, Sparkles, Shield, Star, Shirt,
  ChevronDown, ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";

const FAQ = [
  {
    q: "Can I choose which shirts I get?",
    a: "The magic is in the mystery! We hand-pick a curated mix based on available stock. You might get exclusive designs you can't buy individually.",
  },
  {
    q: "Will I get duplicate designs?",
    a: "Never. Every pack contains 5 unique designs from across our collections.",
  },
  {
    q: "Are these really premium quality?",
    a: "Every tee is from our Premium line — 185g/m² ringspun cotton, tailored fit, same quality as individual purchases at $32+ each.",
  },
  {
    q: "What if something doesn't fit?",
    a: "Our standard 30-day return and exchange policy applies.",
  },
];

export function RandomTeesPDPEnhancement() {
  return (
    <div className="space-y-0">
      {/* Value Banner */}
      <section className="py-10 lg:py-14 bg-card/30 border-t border-border/40">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-display uppercase tracking-wider text-primary">#1 Best Seller</span>
            </div>
            <h2 className="font-hudson text-2xl lg:text-3xl uppercase tracking-wider text-foreground">
              Why Everyone's Buying This
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Shirt, label: "5 Premium Tees", detail: "Valued at $160+" },
              { icon: Shuffle, label: "Hand-Curated", detail: "No duplicates" },
              { icon: Shield, label: "Same Quality", detail: "As individual buys" },
              { icon: Package, label: "Fast Shipping", detail: "1-3 business days" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card/60 border border-border/20 rounded-lg p-4 text-center"
              >
                <item.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="font-display text-xs uppercase tracking-wider text-foreground">{item.label}</p>
                <p className="text-[10px] font-body text-muted-foreground mt-0.5">{item.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — Compact */}
      <section className="py-10 lg:py-14 border-t border-border/40">
        <div className="max-w-5xl mx-auto px-4 lg:px-8">
          <h3 className="font-display text-sm uppercase tracking-[0.2em] text-center text-muted-foreground mb-8">
            How It Works
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Add to Cart", desc: "Select your size and add to cart" },
              { step: "2", title: "We Curate", desc: "Our team hand-picks 5 unique premium designs" },
              { step: "3", title: "Unbox & Enjoy", desc: "Receive $160+ worth of premium tees" },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-display text-xs text-primary">{s.step}</span>
                </div>
                <div>
                  <p className="font-display text-sm uppercase tracking-wider text-foreground">{s.title}</p>
                  <p className="text-xs font-body text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality Guarantee */}
      <section className="py-10 lg:py-14 bg-card/30 border-t border-border/40">
        <div className="max-w-4xl mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-card/60 border border-border/20 rounded-xl p-6 lg:p-8"
          >
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div>
                <h3 className="font-display text-sm uppercase tracking-[0.2em] text-primary mb-3">
                  Quality Guarantee
                </h3>
                <p className="text-sm font-body text-muted-foreground leading-relaxed">
                  Every tee in your mystery pack is pulled from our premium line — the same 185g/m²
                  ringspun cotton, tailored fit, and artist-designed graphics you'd pay $32+ for individually.
                  No seconds, no misprints, no filler.
                </p>
              </div>
              <div className="space-y-2.5">
                {[
                  { icon: Star, text: "185g/m² premium ringspun cotton" },
                  { icon: Shield, text: "Full retail quality — no defects" },
                  { icon: Shuffle, text: "5 unique designs guaranteed" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2.5">
                    <item.icon className="w-4 h-4 text-primary/60 flex-shrink-0" />
                    <span className="text-xs font-body text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-10 lg:py-14 border-t border-border/40">
        <div className="max-w-3xl mx-auto px-4 lg:px-8">
          <h3 className="font-display text-sm uppercase tracking-[0.2em] text-center text-muted-foreground mb-6">
            Frequently Asked Questions
          </h3>
          <div className="space-y-0">
            {FAQ.map((item, i) => (
              <MiniAccordion key={i} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Landing page link */}
      <section className="py-8 border-t border-border/40">
        <div className="text-center">
          <Link
            to="/5-random-tees"
            className="inline-flex items-center gap-2 text-xs font-display uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-colors"
          >
            Learn more about Mystery Packs
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function MiniAccordion({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/20">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3.5 text-left"
      >
        <span className="text-xs font-display uppercase tracking-wider text-foreground pr-4">{question}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-3.5 text-xs font-body text-muted-foreground leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
