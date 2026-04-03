import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Truck, Globe, Clock, Package } from "lucide-react";

const domesticRates = [
  { method: "Standard Shipping", time: "3–7 business days", price: "Free on orders $99+" },
  { method: "Standard Shipping (under $99)", time: "3–7 business days", price: "$5.95" },
  { method: "Expedited Shipping", time: "2–3 business days", price: "$12.95" },
  { method: "Overnight Shipping", time: "1 business day", price: "$24.95" },
];

const internationalRates = [
  { region: "Canada", time: "7–14 business days", price: "From $14.95" },
  { region: "Europe / UK", time: "10–18 business days", price: "From $19.95" },
  { region: "Australia / NZ", time: "12–21 business days", price: "From $22.95" },
  { region: "Rest of World", time: "14–28 business days", price: "Calculated at checkout" },
];

export default function ShippingRatesPage() {
  return (
    <>
      <SEO
        title="Shipping Rates | Sullen Clothing"
        description="Sullen Clothing shipping rates and delivery times for domestic and international orders. Free shipping on U.S. orders over $99."
      />
      <AnnouncementBar />
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative py-16 sm:py-24">
          <div className="absolute inset-0 bg-gradient-dark" />
          <div className="container max-w-3xl relative z-10 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-hudson text-4xl sm:text-5xl uppercase tracking-[0.08em] text-foreground mb-4"
            >
              Shipping Rates
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
               We ship worldwide so you can rep your favorite artists anywhere. Free U.S. shipping on orders over $99.
             </motion.p>
          </div>
        </section>

        {/* Highlights */}
        <section className="container max-w-4xl py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Truck, label: "Free Shipping $99+" },
              { icon: Clock, label: "1–3 Day Processing" },
              { icon: Globe, label: "50+ Countries" },
              { icon: Package, label: "Tracking Included" },
            ].map(({ icon: Icon, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col items-center gap-2 py-5 rounded-lg bg-card border border-border/20"
              >
                <Icon className="w-5 h-5 text-primary" />
                <span className="text-[11px] font-display uppercase tracking-wider text-muted-foreground text-center">
                  {label}
                </span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Domestic */}
        <section className="container max-w-3xl py-10 space-y-6">
          <h2 className="font-display text-lg uppercase tracking-[0.15em] text-foreground">
            Domestic Shipping (U.S.)
          </h2>
          <div className="border border-border/20 rounded-lg overflow-hidden">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="bg-card border-b border-border/20">
                  <th className="text-left px-4 py-3 text-xs font-display uppercase tracking-wider text-muted-foreground">Method</th>
                  <th className="text-left px-4 py-3 text-xs font-display uppercase tracking-wider text-muted-foreground">Delivery</th>
                  <th className="text-right px-4 py-3 text-xs font-display uppercase tracking-wider text-muted-foreground">Price</th>
                </tr>
              </thead>
              <tbody>
                {domesticRates.map((r) => (
                  <tr key={r.method} className="border-b border-border/10 last:border-0">
                    <td className="px-4 py-3 text-foreground">{r.method}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.time}</td>
                    <td className="px-4 py-3 text-right text-foreground font-medium">{r.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* International */}
        <section className="container max-w-3xl py-10 space-y-6">
          <h2 className="font-display text-lg uppercase tracking-[0.15em] text-foreground">
            International Shipping
          </h2>
          <div className="border border-border/20 rounded-lg overflow-hidden">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="bg-card border-b border-border/20">
                  <th className="text-left px-4 py-3 text-xs font-display uppercase tracking-wider text-muted-foreground">Region</th>
                  <th className="text-left px-4 py-3 text-xs font-display uppercase tracking-wider text-muted-foreground">Delivery</th>
                  <th className="text-right px-4 py-3 text-xs font-display uppercase tracking-wider text-muted-foreground">From</th>
                </tr>
              </thead>
              <tbody>
                {internationalRates.map((r) => (
                  <tr key={r.region} className="border-b border-border/10 last:border-0">
                    <td className="px-4 py-3 text-foreground">{r.region}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.time}</td>
                    <td className="px-4 py-3 text-right text-foreground font-medium">{r.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs font-body text-muted-foreground">
            * International orders may be subject to customs duties and taxes, which are the responsibility of the recipient. Delivery times are estimates and may vary.
          </p>
        </section>

        {/* Contact CTA */}
        <section className="bg-card border-y border-border/20 py-12 sm:py-16">
          <div className="container max-w-2xl text-center space-y-4">
            <h2 className="font-display text-xl uppercase tracking-[0.12em] text-foreground">
              Questions About Your Shipment?
            </h2>
            <p className="text-sm font-body text-muted-foreground">
              Contact our support team and we'll get back to you within 24 hours.
            </p>
            <a
              href="mailto:questions@sullenclothing.com"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-display text-xs uppercase tracking-[0.18em] rounded hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
            >
              Email Us
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
