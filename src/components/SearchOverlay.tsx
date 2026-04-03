import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, X, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { searchProducts, type SearchResultProduct } from "@/lib/shopify";
import { trackSearch } from "@/lib/shopifyAnalytics";
import { ga4Search } from "@/lib/ga4";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchOverlay = React.forwardRef<HTMLDivElement, SearchOverlayProps>(function SearchOverlay({ isOpen, onClose }, _ref) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchProducts(value.trim(), 8);
        setResults(data);
        trackSearch(value.trim(), data.length);
        ga4Search(value.trim());
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const formatPrice = (amount: string, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(parseFloat(amount));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Search panel */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-[80] bg-background border-b border-border shadow-2xl"
          >
            <div className="container max-w-3xl py-6">
              {/* Input */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-12 pr-12 py-4 bg-secondary/50 border border-border/30 rounded-lg text-base font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  onClick={onClose}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Results */}
              <div className="mt-4 max-h-[60vh] overflow-y-auto">
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                )}

                {!loading && query.trim().length >= 2 && results.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground font-body py-12">
                    No results for "{query}"
                  </p>
                )}

                {!loading && results.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {results.map((product) => {
                      const image = product.images.edges[0]?.node;
                      const price = product.priceRange.minVariantPrice;
                      return (
                        <Link
                          key={product.id}
                          to={`/product/${product.handle}`}
                          onClick={onClose}
                          className="group"
                        >
                          <div className="aspect-[3/4] rounded-md overflow-hidden bg-secondary mb-2">
                            {image && (
                              <img
                                src={image.url}
                                alt={image.altText || product.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            )}
                          </div>
                          <h3 className="text-xs font-display uppercase tracking-wider text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {product.title}
                          </h3>
                          <p className="text-xs text-muted-foreground font-body mt-0.5">
                            {formatPrice(price.amount, price.currencyCode)}
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {!loading && query.trim().length < 2 && (
                  <div className="space-y-5 py-4">
                    <div>
                      <h4 className="text-[10px] font-display uppercase tracking-[0.2em] text-muted-foreground mb-3 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-primary/60" />
                        Capsule Collections
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: "Cherubs Capsule", href: "/collections/cherubs-capsule" },
                          { label: "Badge Week", href: "/collections/badge-week" },
                          { label: "1 Ton Tees", href: "/collections/1-ton-tees" },
                          { label: "Premium Tees", href: "/collections/premium-tees" },
                          { label: "New Releases", href: "/collections/new-releases" },
                          { label: "Best Sellers", href: "/collections/best-sellers" },
                        ].map((c) => (
                          <Link
                            key={c.href}
                            to={c.href}
                            onClick={onClose}
                            className="px-3 py-1.5 rounded-full border border-border/50 bg-secondary/40 text-xs font-display uppercase tracking-wider text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all"
                          >
                            {c.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <p className="text-center text-xs text-muted-foreground/60 font-body">
                      Type at least 2 characters to search
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
