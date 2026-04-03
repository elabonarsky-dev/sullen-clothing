import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Shield, BadgeCheck, Star } from "lucide-react";

export default function MilitaryDiscountPage() {
  return (
    <>
      <SEO
        title="Military Discount | Sullen Clothing"
        description="Sullen Clothing proudly offers an exclusive military discount. Verify your military status and save on tattoo-inspired streetwear."
      />
      <AnnouncementBar />
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative py-16 sm:py-24">
          <div className="absolute inset-0 bg-gradient-dark" />
          <div className="container max-w-3xl relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 border border-primary/20 mb-5"
            >
              <Shield className="w-7 h-7 text-primary" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-hudson text-4xl sm:text-5xl uppercase tracking-[0.08em] text-foreground mb-4"
            >
              Military Discount
            </motion.h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="w-16 h-[2px] bg-primary mx-auto mb-6"
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm sm:text-base font-body text-muted-foreground max-w-xl mx-auto"
            >
              We proudly support our military community. Active duty, veterans, and military families — thank you for your service.
            </motion.p>
          </div>
        </section>

        {/* Details */}
        <section className="container max-w-3xl py-12 sm:py-16 space-y-10">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: BadgeCheck, title: "Verify Once", desc: "Quick, one-time verification through our partner VerifyPass" },
              { icon: Star, title: "Exclusive Savings", desc: "Receive a discount code for use on your purchases" },
              { icon: Shield, title: "Always Valid", desc: "Your military discount never expires once verified" },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center gap-3 py-6 px-4 rounded-lg bg-card border border-border/20"
              >
                <Icon className="w-6 h-6 text-primary" />
                <h3 className="font-display text-sm uppercase tracking-[0.15em] text-foreground">{title}</h3>
                <p className="text-xs font-body text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h2 className="font-display text-lg uppercase tracking-[0.15em] text-foreground">
              Who Qualifies?
            </h2>
            <ul className="space-y-2">
              {[
                "Active Duty Military (Army, Navy, Air Force, Marines, Coast Guard, Space Force)",
                "National Guard & Reserves",
                "Veterans",
                "Military Spouses & Dependents",
                "First Responders (Police, Fire, EMT)",
              ].map((item) => (
                <li key={item} className="text-sm font-body text-muted-foreground flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h2 className="font-display text-lg uppercase tracking-[0.15em] text-foreground">
              How It Works
            </h2>
            <ol className="space-y-3">
              {[
                "Click the 'Verify & Save' button below to start the verification process through VerifyPass.",
                "Complete the quick verification with your military credentials.",
                "Once verified, you'll receive a unique discount code via email.",
                "Apply your code at checkout — it never expires!",
              ].map((step, i) => (
                <li key={i} className="text-sm font-body text-muted-foreground flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-display text-primary">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </motion.div>
        </section>

        {/* CTA */}
        <section className="bg-card border-y border-border/20 py-12 sm:py-16">
          <div className="container max-w-2xl text-center space-y-4">
            <h2 className="font-display text-xl uppercase tracking-[0.12em] text-foreground">
              Ready to Save?
            </h2>
            <p className="text-sm font-body text-muted-foreground">
              Verify your status and unlock your exclusive military discount.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href="https://verifypass.com/offers/website/www.sullenclothing.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-display text-xs uppercase tracking-[0.18em] rounded hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
              >
                Verify & Save
              </a>
              <a
                href="mailto:questions@sullenclothing.com"
                className="inline-flex items-center justify-center px-6 py-3 border border-border/40 text-foreground font-display text-xs uppercase tracking-[0.18em] rounded hover:border-primary/40 hover:text-primary transition-all"
              >
                Contact Support
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
