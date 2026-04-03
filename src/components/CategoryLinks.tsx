import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useMarketingImages } from "@/hooks/useMarketingImages";
import { shopifyImg } from "@/lib/utils";

const fallbackCategories = [
  { name: "Artist Series", image: "https://www.sullenclothing.com/cdn/shop/files/MXN08964.webp?v=1769161562&width=600", href: "/collections/artist-series" },
  { name: "Cherubs", image: "https://www.sullenclothing.com/cdn/shop/files/SEE-NO-EVIL-LIFSTYLE.jpg?v=1771879776&width=600", href: "/collections/cherubs-capsule" },
  { name: "Angels", image: "https://www.sullenclothing.com/cdn/shop/files/SINCE-BIRTH-LIFESTYLE.jpg?v=1771881040&width=600", href: "/pages/sullen-angels" },
  { name: "Bro-oks", image: "https://www.sullenclothing.com/cdn/shop/files/vs-evil-lifestyle.jpg?v=1771879603&width=600", href: "/collections/bro_oks" },
  { name: "Timeless", image: "https://www.sullenclothing.com/cdn/shop/files/The_Classic_Black_Tee_-_-9442.jpg?v=1771759702&width=600", href: "/collections/sullen-logo-tees" },
  { name: "Sullen Badge", image: "https://www.sullenclothing.com/cdn/shop/files/keepers-lifestyle.jpg?v=1772765792&width=600", href: "/collections/sullen-badge" },
];

export function CategoryLinks() {
  const { data: dbImages } = useMarketingImages("category_link");
  
  const categories = useMemo(() => {
    if (dbImages && dbImages.length > 0) {
      return dbImages.map((img) => ({
        name: img.title || "",
        image: img.image_url,
        href: img.link_href || "#",
      }));
    }
    return fallbackCategories;
  }, [dbImages]);

  return (
    <section className="py-10 lg:py-14">
      <div className="container max-w-7xl">
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link key={cat.name} to={cat.href} className="group text-center">
              <div className="aspect-square rounded-full overflow-hidden bg-secondary mx-auto w-24 lg:w-28 mb-3 border-2 border-transparent group-hover:border-primary transition-all duration-300 ease-out group-hover:scale-110 group-hover:shadow-[0_0_16px_hsl(var(--primary)/0.35)]">
                <img
                  src={shopifyImg(cat.image)}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <p className="font-display text-xs uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
                {cat.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}