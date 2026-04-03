import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface RecProduct {
  node: {
    id: string;
    title: string;
    handle: string;
    images: { edges: Array<{ node: { url: string; altText: string | null } }> };
    priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  };
}

interface RecGroup {
  reason: string;
  products: RecProduct[];
}

function RecProductCard({ product, index }: { product: RecProduct; index: number }) {
  const p = product.node;
  const image = p.images?.edges?.[0]?.node?.url;
  const price = parseFloat(p.priceRange.minVariantPrice.amount).toFixed(2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link
        to={`/product/${p.handle}`}
        className="group block"
      >
        <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary/50 mb-3 ring-1 ring-border/10 group-hover:ring-primary/30 transition-all duration-500">
          {image && (
            <img
              src={image}
              alt={p.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex flex-col justify-end p-4">
            <span className="inline-flex items-center gap-1.5 font-display text-xs uppercase tracking-[0.2em] text-primary">
              View Product <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
        <h3 className="font-display text-xs uppercase tracking-wider text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-1">
          {p.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 font-body">${price}</p>
      </Link>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] rounded-lg bg-secondary/50 mb-3" />
      <div className="h-3 w-3/4 bg-secondary/50 rounded mb-2" />
      <div className="h-3 w-1/3 bg-secondary/50 rounded" />
    </div>
  );
}

function RecRow({ group, groupIndex }: { group: RecGroup; groupIndex: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -260 : 260, behavior: "smooth" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: groupIndex * 0.15 }}
      className="space-y-4"
    >
      <p className="text-sm text-muted-foreground font-body">
        {group.reason}
      </p>

      {/* Desktop: 6-col grid */}
      <div className="hidden lg:grid grid-cols-6 gap-6">
        {group.products.slice(0, 6).map((product, i) => (
          <RecProductCard key={product.node.id} product={product} index={i} />
        ))}
      </div>

      {/* Mobile/Tablet: horizontal peek carousel showing ~2.5 cards */}
      <div className="lg:hidden relative group/row">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-1 top-1/3 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
        )}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
        >
          {group.products.map((product, i) => (
            <div key={product.node.id} className="flex-shrink-0 w-[38vw] sm:w-[32vw] snap-start">
              <RecProductCard product={product} index={i} />
            </div>
          ))}
        </div>
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-1 top-1/3 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 transition-opacity"
          >
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function RecommendedForYou() {
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["product-recommendations", user?.id ?? "anon"],
    queryFn: async () => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      };

      // For logged-in users, get the access token explicitly
      if (user) {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/product-recommendations`,
        { method: "POST", headers }
      );

      if (!res.ok) {
        console.error("Recommendations fetch failed:", res.status);
        return { recommendations: [], fallback: true };
      }
      return await res.json();
    },
    enabled: !authLoading,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });

  const recommendations = data?.recommendations || [];
  const isFallback = data?.fallback === true;

  if (!isLoading && recommendations.length === 0) return null;

  const heading = "Recommended For You";

  return (
    <section className="py-12 lg:py-16">
      <div className="container max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <h2 className="font-heading text-2xl lg:text-3xl text-foreground uppercase tracking-wider mb-4">
            {heading}
          </h2>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-10">
              {recommendations.slice(0, 1).map((group, i) => (
                <RecRow key={i} group={group} groupIndex={i} />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
