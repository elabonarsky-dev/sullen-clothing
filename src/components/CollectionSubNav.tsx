import { useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

/* ─── Category group definitions matching the main nav structure ─── */
interface SubNavLink {
  label: string;
  href: string;
}

interface CategoryGroup {
  /** Handles that belong to this group — when any is active, all links show */
  handles: string[];
  links: SubNavLink[];
}

const categoryGroups: CategoryGroup[] = [
  {
    handles: ["men"],
    links: [
      { label: "Shop All", href: "/collections/men" },
      { label: "Tees", href: "/collections/tees" },
      { label: "Tops", href: "/collections/tops" },
      { label: "Pants", href: "/collections/pants" },
      { label: "Shorts", href: "/collections/shorts" },
      { label: "Accessories", href: "/collections/accessories" },
      { label: "Youth", href: "/collections/youth-tees" },
      { label: "Sale", href: "/collections/outlet" },
    ],
  },
  {
    handles: [
      "tees", "standard-tees", "premium", "1-ton-tees", "solids", "long-sleeves", "tanks",
    ],
    links: [
      { label: "All Tees", href: "/collections/tees" },
      { label: "Standard", href: "/collections/standard-tees" },
      { label: "Premium", href: "/collections/premium" },
      { label: "1 Ton Oversized", href: "/collections/1-ton-tees" },
      { label: "The Solids", href: "/collections/solids" },
      { label: "Long Sleeves", href: "/collections/long-sleeves" },
      { label: "Tanks", href: "/collections/tanks" },
    ],
  },
  {
    handles: [
      "tops", "polos", "wovens", "fleece", "flannels",
    ],
    links: [
      { label: "All Tops", href: "/collections/tops" },
      { label: "Sweatshirts", href: "/collections/fleece" },
      { label: "Flannels", href: "/collections/flannels" },
      { label: "Wovens", href: "/collections/wovens" },
      { label: "Polos", href: "/collections/polos" },
    ],
  },
  {
    handles: ["pants", "sweatpants", "pajamas", "shorts", "boardshorts"],
    links: [
      { label: "Pants", href: "/collections/pants" },
      { label: "Sweatpants", href: "/collections/sweatpants" },
      { label: "Shorts", href: "/collections/shorts" },
      { label: "Boardshorts", href: "/collections/boardshorts" },
      { label: "Pajamas", href: "/collections/pajamas" },
    ],
  },
  {
    handles: [
      "hats", "hats-artist-series", "hats-letterheads", "hats-staples", "beanies",
    ],
    links: [
      { label: "All Headwear", href: "/collections/hats" },
      { label: "Artist Series", href: "/collections/hats-artist-series" },
      { label: "Letterheads", href: "/collections/hats-letterheads" },
      { label: "Staples", href: "/collections/hats-staples" },
      { label: "Beanies", href: "/collections/beanies" },
    ],
  },
  {
    handles: [
      "accessories", "accessories-2",
    ],
    links: [
      { label: "All", href: "/collections/accessories" },
      { label: "Jewelry", href: "/collections/jewelry" },
      { label: "Headwear", href: "/collections/hats" },
      { label: "Boxers", href: "/collections/boxers" },
      { label: "Beanies", href: "/collections/beanies" },
      { label: "Socks", href: "/collections/socks" },
      { label: "Slides", href: "/collections/slides" },
      { label: "Backpacks", href: "/collections/bags" },
      { label: "Sunglasses", href: "/collections/black-fly-sunglasses" },
      { label: "Gift Cards", href: "/collections/gift-cards" },
    ],
  },
  {
    handles: [
      "womens", "womens-fleece", "womens-intimates",
    ],
    links: [
      { label: "Shop All", href: "/collections/womens" },
      { label: "Fleece", href: "/collections/womens-fleece" },
      { label: "Inktimates", href: "/collections/womens-intimates" },
    ],
  },
  {
    handles: [
      "artist-series", "cherubs-capsule", "angels-capsule", "bro_oks",
      "sullen-badge", "timeless", "letterheads",
    ],
    links: [
      { label: "Artist Series", href: "/collections/artist-series" },
      { label: "Cherubs", href: "/collections/cherubs-capsule" },
      { label: "Angels", href: "/collections/angels-capsule" },
      { label: "BRO_OKS", href: "/collections/bro_oks" },
      { label: "Sullen Badge", href: "/collections/sullen-badge" },
      { label: "Timeless", href: "/collections/timeless" },
      { label: "Letterheads", href: "/collections/letterheads" },
    ],
  },
  {
    handles: ["outlet", "bundle", "subscriptions"],
    links: [
      { label: "All Sale", href: "/collections/outlet" },
      { label: "Bundles / Mystery", href: "/collections/bundle" },
      { label: "Subscriptions", href: "/collections/subscriptions" },
    ],
  },
];

// Standalone sub-category pages that don't need the parent sub-nav
const standaloneHandles = new Set([
  "jackets", "jewelry", "beanies", "stickers", "womens-fleece", "womens-intimates",
]);

function getLinksForHandle(handle: string): SubNavLink[] | null {
  if (standaloneHandles.has(handle)) return null;
  const group = categoryGroups.find((g) => g.handles.includes(handle));
  return group?.links ?? null;
}

interface CollectionSubNavProps {
  handle: string;
  /** If true, use capsule/light styling */
  capsule?: boolean;
}

export function CollectionSubNav({ handle, capsule = false }: CollectionSubNavProps) {
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);
  const links = getLinksForHandle(handle);

  // Auto-scroll the active link into view
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const left = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
    }
  }, [location.pathname]);

  if (!links || links.length <= 1) return null;

  return (
    <div
      className={`sticky top-[56px] lg:top-[64px] z-30 border-b ${
        capsule
          ? "bg-[#f0ede8]/95 border-[#d5d0c9]/40"
          : "bg-background/95 border-border/20"
      } backdrop-blur-md`}
    >
      <div className="max-w-7xl mx-auto">
        <div
          ref={scrollRef}
          className="flex items-center gap-0 overflow-x-auto scrollbar-hide px-3 lg:px-8"
        >
          {links.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                ref={isActive ? activeRef : undefined}
                className={`relative flex-shrink-0 px-3 py-3.5 text-[15px] sm:text-base font-display uppercase tracking-[0.08em] transition-colors whitespace-nowrap ${
                  isActive
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="collection-subnav-indicator"
                    className="absolute bottom-0 left-3 right-3 h-[2.5px] bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
