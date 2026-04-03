import { Link } from "react-router-dom";
import { useRecentlyViewed, type RecentlyViewedItem } from "@/hooks/useRecentlyViewed";

interface RecentlyViewedProps {
  /** Exclude the current product from the list */
  excludeHandle?: string;
}

export function RecentlyViewed({ excludeHandle }: RecentlyViewedProps) {
  const { items } = useRecentlyViewed();
  const filtered = items.filter((i) => i.handle !== excludeHandle).slice(0, 8);

  if (filtered.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container max-w-6xl">
        <h2 className="text-lg font-display uppercase tracking-[0.2em] text-foreground mb-6">
          Recently Viewed
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          {filtered.map((item) => (
            <Link
              key={item.handle}
              to={`/product/${item.handle}`}
              className="group flex-shrink-0 w-40 md:w-48"
            >
              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-secondary mb-2">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <p className="text-xs font-display uppercase tracking-wider text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {item.title}
              </p>
              <p className="text-xs font-body text-muted-foreground">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: item.currencyCode,
                }).format(parseFloat(item.price))}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
