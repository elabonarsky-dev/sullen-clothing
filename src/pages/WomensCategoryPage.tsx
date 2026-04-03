import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SEO } from "@/components/SEO";
import { useCollectionProducts } from "@/hooks/useCollectionProducts";

interface Category {
  name: string;
  handle: string;
  href: string;
  span?: string;
}

const categories: Category[] = [
  { name: "Shop All", handle: "womens", href: "/collections/womens", span: "md:col-span-2 md:row-span-2" },
  { name: "Tops", handle: "womens-tops", href: "/collections/womens-tops" },
  { name: "Fleece", handle: "womens-fleece", href: "/collections/womens-fleece" },
  { name: "Inktimates", handle: "womens-intimates", href: "/collections/womens-intimates" },
];

function CategoryCard({ cat, index }: { cat: Category; index: number }) {
  const { products, loading } = useCollectionProducts(cat.handle, 1);
  const image = products[0]?.image || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className={cat.span || ""}
    >
      <Link
        to={cat.href}
        className="relative block w-full h-full rounded-lg overflow-hidden group"
      >
        {loading ? (
          <div className="absolute inset-0 bg-secondary animate-pulse" />
        ) : image ? (
          <img
            src={image}
            alt={cat.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 flex items-end justify-between">
          <h2 className="font-display text-lg md:text-xl lg:text-2xl uppercase tracking-wider text-foreground">
            {cat.name}
          </h2>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </Link>
    </motion.div>
  );
}

export default function WomensCategoryPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        path="/collections/women"
        title="Women's Clothing | Sullen Art Collective"
        description="Shop women's tops, fleece, intimates, and more from Sullen Art Collective. Tattoo-inspired streetwear designed for her."
      />
      <AnnouncementBar />
      <SiteHeader />

      <section className="pt-4 pb-6 md:pt-6 md:pb-10">
        <div className="container max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl uppercase tracking-wider text-foreground leading-[0.95]">
              Women's
            </h1>
            <p className="mt-2 text-sm md:text-base text-muted-foreground font-body max-w-xl">
              Tattoo-inspired pieces designed for her — from statement tops to cozy fleece and bold inktimates.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-16 lg:pb-24">
        <div className="container max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[200px] md:auto-rows-[240px]">
            {categories.map((cat, i) => (
              <CategoryCard key={cat.name} cat={cat} index={i} />
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}