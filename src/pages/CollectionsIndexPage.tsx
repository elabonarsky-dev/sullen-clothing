import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SEO } from "@/components/SEO";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const collections = [
  { handle: "men", label: "Men's" },
  { handle: "lifestyle", label: "Lifestyle" },
  { handle: "artists", label: "Artists" },
  { handle: "new-arrivals", label: "New Arrivals" },
  { handle: "best-sellers", label: "Best Sellers" },
  { handle: "tees", label: "Tees" },
  { handle: "hats", label: "Headwear" },
  { handle: "hoodies-sweatshirts", label: "Hoodies & Sweatshirts" },
  { handle: "bottoms", label: "Bottoms" },
  { handle: "outerwear", label: "Outerwear" },
  { handle: "accessories", label: "Accessories" },
  { handle: "outlet", label: "Outlet" },
];

export default function CollectionsIndexPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEO title="All Collections | Sullen Clothing" description="Browse all Sullen Clothing collections." path="/collections" />
      <SiteHeader />
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h1 className="font-hudson text-3xl lg:text-4xl uppercase tracking-[0.1em] text-foreground mb-10 text-center">
          All Collections
        </h1>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {collections.map((c) => (
            <Link
              key={c.handle}
              to={`/collections/${c.handle}`}
              className="block rounded-lg border border-border bg-card p-6 text-center font-display text-sm uppercase tracking-wider text-foreground hover:bg-accent/20 transition-colors"
            >
              {c.label}
            </Link>
          ))}
        </motion.div>
      </div>
      <SiteFooter />
    </div>
  );
}
