import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { SEO } from "@/components/SEO";
import { AIConcierge } from "@/components/AIConcierge";
import { motion } from "framer-motion";
import { Mail, Phone, MessageCircle } from "lucide-react";

export default function SupportPage() {
  return (
    <>
      <SEO
        title="Support | Sullen Clothing"
        description="Get help from the Sullen Concierge AI or contact our team. Shipping, returns, sizing, rewards — we got you."
        path="/support"
      />
      <AnnouncementBar />
      <SiteHeader />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative py-10 sm:py-14">
          <div className="absolute inset-0 bg-gradient-dark" />
          <div className="container max-w-3xl relative z-10 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-hudson text-3xl sm:text-4xl uppercase tracking-[0.08em] text-foreground mb-3"
            >
              Support
            </motion.h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="w-12 h-[2px] bg-primary mx-auto mb-3"
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground text-sm"
            >
              Chat with our AI concierge or reach out directly — we got you. 💀
            </motion.p>
          </div>
        </section>

        {/* Chat */}
        <section className="container max-w-3xl py-6 sm:py-8">
          <div className="bg-card border border-border/30 rounded-xl overflow-hidden">
            <AIConcierge fullPage />
          </div>
        </section>

        {/* Contact fallback */}
        <section className="container max-w-3xl pb-16">
          <p className="text-xs font-display uppercase tracking-wider text-muted-foreground text-center mb-4">
            Or reach us directly
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              {
                icon: Mail,
                label: "Email Us",
                value: "questions@sullenclothing.com",
                href: "mailto:questions@sullenclothing.com",
              },
              {
                icon: Phone,
                label: "Call Us",
                value: "562-296-1894",
                href: "tel:5622961894",
              },
              {
                icon: MessageCircle,
                label: "FAQ",
                value: "Browse common questions",
                href: "/pages/faq",
              },
            ].map(({ icon: Icon, label, value, href }) => (
              <a
                key={label}
                href={href}
                className="flex items-center gap-3 p-4 rounded-lg border border-border/20 hover:border-primary/40 transition-colors bg-card group"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="text-xs font-body text-foreground">{value}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
