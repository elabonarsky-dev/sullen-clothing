import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQCategory {
  title: string;
  questions: { q: string; a: string }[];
}

const faqData: FAQCategory[] = [
  {
    title: "Orders & Shipping",
    questions: [
      {
        q: "How long does shipping take?",
        a: "Domestic orders typically ship within 1–3 business days. Standard shipping takes 3–7 business days, and expedited options are available at checkout. International orders may take 7–21 business days depending on the destination.",
      },
      {
        q: "Do you ship internationally?",
        a: "Yes! We ship to over 50 countries worldwide. International shipping rates and delivery times vary by location. Duties and taxes may apply depending on your country's customs regulations.",
      },
      {
        q: "How can I track my order?",
        a: "Once your order ships, you'll receive a confirmation email with a tracking number. You can also track your package using our Track My Package page.",
      },
      {
        q: "Can I change or cancel my order?",
        a: "We process orders quickly! If you need to make changes, contact us at questions@sullenclothing.com or call 562-296-1894 as soon as possible. Once an order has shipped, we cannot make changes.",
      },
    ],
  },
  {
    title: "Returns & Exchanges",
    questions: [
      {
        q: "What is your return policy?",
        a: "We offer hassle-free returns within 30 days of purchase. Items must be unworn, unwashed, and in original condition with tags attached. Use our easy returns portal to start the process.",
      },
      {
        q: "How do exchanges work?",
        a: "For exchanges, simply return the original item and place a new order for the desired size or style. This ensures you get the item you want as quickly as possible.",
      },
      {
        q: "Are sale items final sale?",
        a: "Items marked as 'Final Sale' cannot be returned or exchanged. All other sale items follow our standard return policy.",
      },
    ],
  },
  {
    title: "Products & Sizing",
    questions: [
      {
        q: "What's the difference between Standard, Premium, and 1 Ton tees?",
        a: "Standard tees are our classic fit in quality ringspun cotton. Premium tees feature heavyweight, garment-dyed fabric with a more refined feel. 1 Ton tees are our oversized silhouette with a relaxed, streetwear-forward fit — extra weight, extra length, extra style.",
      },
      {
        q: "How do your sizes run?",
        a: "Our Standard and Premium tees run true to size. Our 1 Ton oversized tees are designed with extra room — we recommend your normal size for the intended oversized fit, or size down for a more fitted look. Each product page includes a size chart for reference.",
      },
      {
        q: "Are your products ethically made?",
        a: "We're committed to responsible manufacturing. Our garments are produced in facilities that meet fair labor standards, and we continuously work to improve our sustainability practices.",
      },
    ],
  },
  {
    title: "Artist Collaborations",
    questions: [
      {
        q: "How do artist collaborations work?",
        a: "Every Sullen design is created in collaboration with a tattoo artist. Artists submit their work, and our design team works closely with them to translate their art onto apparel. Artists receive royalties for every piece sold featuring their artwork.",
      },
      {
        q: "Can I submit my art for a collaboration?",
        a: "Absolutely! We're always looking for talented tattoo artists. Visit our 'Submit your Tattoo Art' page to send us your portfolio. Our team reviews every submission.",
      },
      {
        q: "Do artists get paid for their designs?",
        a: "Yes. Sullen has paid out millions in artist royalties since our founding. We believe in fairly compensating the artists whose talent drives our brand.",
      },
    ],
  },
  {
    title: "Account & Other",
    questions: [
      {
        q: "Do you have a rewards program?",
        a: "Yes! Join Sullen Rewards to earn points on every purchase, get exclusive discounts, early access to new releases, and birthday perks.",
      },
      {
        q: "Do you offer a military discount?",
        a: "We proudly support our military community with an exclusive discount. Visit our Military Discount page to verify your status and unlock your savings.",
      },
      {
        q: "How do I contact customer support?",
        a: "Email us at questions@sullenclothing.com or call 562-296-1894 during business hours (Mon–Fri, 10am–6pm PST; Sat, 10am–3pm PST). We typically respond within 24 hours.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <>
      <SEO
        title="FAQ | Sullen Clothing"
        description="Frequently asked questions about Sullen Clothing — shipping, returns, sizing, artist collaborations, and more."
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
              FAQ
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
              Got questions? We've got answers. Can't find what you're looking for? Hit us up at{" "}
              <a href="mailto:questions@sullenclothing.com" className="text-primary hover:underline">
                questions@sullenclothing.com
              </a>
            </motion.p>
          </div>
        </section>

        {/* FAQ sections */}
        <section className="container max-w-3xl py-12 sm:py-16 space-y-10">
          {faqData.map((category, catIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: catIndex * 0.05, duration: 0.5 }}
            >
              <h2 className="font-display text-lg sm:text-xl uppercase tracking-[0.15em] text-foreground mb-4">
                {category.title}
              </h2>
              <Accordion type="single" collapsible className="space-y-2">
                {category.questions.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`${catIndex}-${i}`}
                    className="bg-card border border-border/20 rounded-lg px-5 data-[state=open]:border-primary/30 data-[state=open]:glow-gold transition-all duration-300"
                  >
                    <AccordionTrigger className="text-sm sm:text-[15px] font-display uppercase tracking-wider text-foreground hover:text-primary py-4 [&[data-state=open]]:text-primary">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm font-body text-muted-foreground leading-relaxed pb-4">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))}
        </section>

        {/* Contact CTA */}
        <section className="bg-card border-y border-border/20 py-12 sm:py-16">
          <div className="container max-w-2xl text-center space-y-4">
            <h2 className="font-display text-xl sm:text-2xl uppercase tracking-[0.12em] text-foreground">
              Still Have Questions?
            </h2>
            <p className="text-sm font-body text-muted-foreground">
              Our team is here to help. Reach out and we'll get back to you within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href="mailto:questions@sullenclothing.com"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-display text-xs uppercase tracking-[0.18em] rounded hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
              >
                Email Us
              </a>
              <a
                href="tel:5622961894"
                className="inline-flex items-center justify-center px-6 py-3 border border-border/40 text-foreground font-display text-xs uppercase tracking-[0.18em] rounded hover:border-primary/40 hover:text-primary transition-all"
              >
                Call 562-296-1894
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
