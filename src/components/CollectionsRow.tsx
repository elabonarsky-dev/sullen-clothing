import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useRef, useState, useEffect, useMemo } from "react";
import { useMarketingImages } from "@/hooks/useMarketingImages";

const fallbackCollections = [
  { name: "Tees", image: "https://cdn.shopify.com/s/files/1/1096/0120/files/MXN08964.webp?v=1769161562", href: "/collections/tees" },
  { name: "Headwear", image: "https://cdn.shopify.com/s/files/1/1096/0120/files/hats_1a0401e2-1e78-4311-b66e-d3ab6799a3b8.jpg?v=1765855462", href: "/collections/hats" },
  { name: "Sweatshirts", image: "https://cdn.shopify.com/s/files/1/1096/0120/files/collections_sweatshirts.jpg?v=1753213597", href: "/collections/fleece" },
  { name: "Flannels", image: "https://cdn.shopify.com/s/files/1/1096/0120/files/MXN05845_953e7b91-7dd7-4266-8c2c-346c34491e00.jpg?v=1764717187", href: "/collections/flannels" },
  { name: "Sale Items", image: "https://cdn.shopify.com/s/files/1/1096/0120/files/DSC04202.jpg?v=1764720036", href: "/collections/outlet" },
  { name: "Accessories", image: "https://cdn.shopify.com/s/files/1/1096/0120/files/MXN06534_f6006377-6c15-437a-8715-26be4261f118.jpg?v=1762303144", href: "/collections/accessories-2" },
  { name: "Backpacks", image: "https://cdn.shopify.com/s/files/1/1096/0120/files/DSC08281.jpg?v=1764716736", href: "/collections/bags" },
  { name: "Outerwear", image: "https://cdn.shopify.com/s/files/1/1096/0120/files/MXN05015.jpg?v=1764720583", href: "/collections/jackets" },
];

export function CollectionsRow() {
  const { data: dbImages } = useMarketingImages("collection_row");
  
  const collections = useMemo(() => {
    if (dbImages && dbImages.length > 0) {
      return dbImages.map((img) => ({
        name: img.title || "",
        image: img.image_url,
        href: img.link_href || "#",
      }));
    }
    return fallbackCollections;
  }, [dbImages]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el.removeEventListener("scroll", checkScroll);
  }, []);

  const scroll = () => {
    scrollRef.current?.scrollBy({ left: 280, behavior: "smooth" });
  };

  return (
    <section className="py-5 lg:py-6">
      <div className="container max-w-7xl">
        {/* Heading with inline arrow */}
        <div className="flex items-center gap-3 mb-5">
          <h2 className="font-hudson text-base sm:text-lg lg:text-xl uppercase tracking-[0.06em] text-foreground whitespace-nowrap">
            Explore <span className="text-muted-foreground">Our Collections</span>
          </h2>
          {canScrollRight && (
            <button
              onClick={scroll}
              className="w-9 h-9 rounded-full bg-foreground/10 flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-foreground/20 transition-all"
              aria-label="Scroll collections"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable row */}
        <div className="relative">
          {/* Right fade */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          )}

          <div
            ref={scrollRef}
            className="flex gap-2 lg:gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
          >
            {collections.map((col) => (
              <Link
                key={col.name}
                to={col.href}
                className="flex-shrink-0 w-[38vw] sm:w-[160px] lg:w-[180px] group snap-start relative"
              >
                <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-secondary">
                  <img
                    src={col.image}
                    alt={col.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
                    <p className="font-display text-xs lg:text-sm uppercase tracking-[0.12em] text-foreground group-hover:text-primary transition-colors duration-300">
                      {col.name}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
