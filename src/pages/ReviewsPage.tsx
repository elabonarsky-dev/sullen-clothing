import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface Review {
  name: string;
  rating: number;
  date: string;
  product: string;
  text: string;
  verified: boolean;
}

const reviews: Review[] = [
  {
    name: "Mike R.",
    rating: 5,
    date: "Mar 2, 2026",
    product: "Lastly Tattooer Premium Tee",
    text: "The quality on the premium tees is unmatched. Heavyweight, soft, and the print is insane. This is my 8th Sullen tee and they just keep getting better.",
    verified: true,
  },
  {
    name: "Sarah T.",
    rating: 5,
    date: "Feb 18, 2026",
    product: "1 Ton Oversized Tee",
    text: "The oversized fit is perfect — not too boxy, just the right amount of drape. The fabric weight is substantial and the artwork is stunning. Worth every penny.",
    verified: true,
  },
  {
    name: "Carlos M.",
    rating: 5,
    date: "Feb 10, 2026",
    product: "Stacked Deck Flannel",
    text: "Bought this for the art but stayed for the quality. The flannel is thick and well-constructed. Gets compliments every time I wear it out.",
    verified: true,
  },
  {
    name: "Jake W.",
    rating: 4,
    date: "Jan 28, 2026",
    product: "Standard Tee — Sicarios",
    text: "Great art, great fit. The standard tees are solid everyday wearers. Only wish they had more colorways for this design. Already ordered another one for my brother.",
    verified: true,
  },
  {
    name: "Amanda L.",
    rating: 5,
    date: "Jan 15, 2026",
    product: "Women's Crop Tank",
    text: "Finally a brand that does women's streetwear right. The cut is flattering without being too tight and the tattoo art prints are fire. Need more women's drops!",
    verified: true,
  },
  {
    name: "Danny K.",
    rating: 5,
    date: "Jan 3, 2026",
    product: "Letterhead Snapback",
    text: "Clean hat with an amazing embroidered patch. The quality of Sullen's hats is legit — structured crown, great snap closure. Already have 4 in my rotation.",
    verified: true,
  },
  {
    name: "Rachel P.",
    rating: 5,
    date: "Dec 19, 2025",
    product: "Premium Tee — Grace",
    text: "I got this as a gift for my husband who's a tattoo artist. He was blown away by the print quality and fabric weight. We're both fans for life now.",
    verified: true,
  },
  {
    name: "Tony V.",
    rating: 4,
    date: "Dec 8, 2025",
    product: "Sullen Badge Hoodie",
    text: "Super warm and the embroidery is clean. Runs a little large so I'd say size down if you're between sizes. Otherwise no complaints — top tier streetwear.",
    verified: true,
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < count ? "fill-primary text-primary" : "text-border"}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <>
      <SEO
        title="Customer Reviews | Sullen Clothing"
        description="See what customers are saying about Sullen Clothing. Real reviews from real fans of tattoo-inspired streetwear."
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
              Reviews
            </motion.h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="w-16 h-[2px] bg-primary mx-auto mb-6"
            />

            {/* Aggregate rating */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-2">
                <Stars count={5} />
                <span className="text-lg font-display text-foreground">{avgRating}</span>
              </div>
              <p className="text-sm font-body text-muted-foreground">
                Based on {reviews.length.toLocaleString()}+ verified reviews
              </p>
            </motion.div>
          </div>
        </section>

        {/* Review grid */}
        <section className="container max-w-4xl py-12 sm:py-16">
          <div className="grid sm:grid-cols-2 gap-4">
            {reviews.map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 4) * 0.05, duration: 0.4 }}
                className="bg-card border border-border/20 rounded-lg p-5 hover:border-primary/20 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-display uppercase tracking-wider text-foreground">
                        {review.name}
                      </span>
                      {review.verified && (
                        <span className="text-[9px] font-body uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          Verified
                        </span>
                      )}
                    </div>
                    <Stars count={review.rating} />
                  </div>
                  <span className="text-[11px] font-body text-muted-foreground whitespace-nowrap">
                    {review.date}
                  </span>
                </div>

                <p className="text-[10px] font-display uppercase tracking-[0.15em] text-primary/70 mb-2">
                  {review.product}
                </p>
                <p className="text-sm font-body text-muted-foreground leading-relaxed">
                  {review.text}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-card border-y border-border/20 py-12 sm:py-16">
          <div className="container max-w-2xl text-center space-y-4">
            <h2 className="font-display text-xl sm:text-2xl uppercase tracking-[0.12em] text-foreground">
              Join the <span className="text-gradient-gold">Collective</span>
            </h2>
            <p className="text-sm font-body text-muted-foreground">
              Shop tattoo-inspired streetwear and see why thousands of fans trust Sullen.
            </p>
            <a
              href="/collections/new-releases"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-display text-xs uppercase tracking-[0.18em] rounded hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
            >
              Shop New Releases
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
