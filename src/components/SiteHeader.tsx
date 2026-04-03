import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, User, Menu, X, ChevronRight, ChevronDown, Heart, Sun, Moon, Palette, Skull } from "lucide-react";
import { CartDrawer } from "@/components/CartDrawer";
import { useWishlistStore } from "@/stores/wishlistStore";
import sullenLogo from "@/assets/black-banner-logo.avif";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { SearchOverlay } from "@/components/SearchOverlay";
import { storefrontApiRequest } from "@/lib/shopify";
import { NavNewsletter } from "@/components/NavNewsletter";
import { supabase } from "@/integrations/supabase/client";
import { usePointsNotification } from "@/hooks/usePointsNotification";

/* ─── Nav data types ─── */
interface SubItem {
  label: string;
  href: string;
  external?: boolean;
}

interface NavCategory {
  label: string;
  href: string;
  subs?: SubItem[];
  external?: boolean;
}

interface NavItem {
  label: string;
  href: string;
  categories?: NavCategory[];
  featured?: { image: string; title: string; href: string };
  hideQuickLinks?: boolean;
  hideFooter?: boolean;
}

const topNavItems: NavItem[] = [
  {
    label: "Men",
    href: "/collections/men",
    categories: [
      { label: "Shop All", href: "/collections/men" },
      { label: "New Releases", href: "/collections/new-releases" },
      {
        label: "All Tees",
        href: "/collections/tees",
        subs: [
          { label: "Standard Tees", href: "/collections/standard-tees" },
          { label: "Premium Tees", href: "/collections/premium" },
          { label: "1 Ton Oversized", href: "/collections/1-ton-tees" },
          { label: "The Solids", href: "/collections/solids" },
          { label: "Longsleeves", href: "/collections/long-sleeves" },
          { label: "Tanks", href: "/collections/tanks" },
        ],
      },
      {
        label: "Tops",
        href: "/collections/tops",
        subs: [
          { label: "Sweatshirts", href: "/collections/fleece" },
          { label: "Flannels", href: "/collections/flannels" },
          { label: "Wovens", href: "/collections/wovens" },
          { label: "Polos", href: "/collections/polos" },
        ],
      },
      {
        label: "Outerwear",
        href: "/collections/jackets",
        subs: [
          { label: "Jackets", href: "/collections/jackets" },
        ],
      },
      {
        label: "Bottoms",
        href: "/collections/pants",
        subs: [
          { label: "Pants", href: "/collections/pants" },
          { label: "Sweatpants", href: "/collections/sweatpants" },
          { label: "Boardshorts", href: "/collections/boardshorts" },
          { label: "Shorts", href: "/collections/shorts" },
          { label: "Pajamas", href: "/collections/pajamas" },
        ],
      },
      {
        label: "Accessories",
        href: "/collections/accessories",
        subs: [
          { label: "NEW Jewelry", href: "/collections/jewelry" },
          { label: "Headwear", href: "/collections/hats" },
          { label: "Boxers", href: "/collections/boxers" },
          { label: "Beanies", href: "/collections/beanies" },
          { label: "Socks", href: "/collections/socks" },
          { label: "Slides", href: "/collections/slides" },
          { label: "Backpacks", href: "/collections/bags" },
          { label: "Sunglasses", href: "/collections/black-fly-sunglasses" },
          { label: "Lanyards", href: "/collections/lanyards-1" },
          { label: "Stickers", href: "/collections/stickers" },
          { label: "Misc", href: "/collections/misc" },
          { label: "Gift Cards", href: "/collections/gift-cards" },
        ],
      },
      { label: "Youth Tees", href: "/collections/youth-tees" },
      {
        label: "Sale",
        href: "/collections/outlet",
        subs: [
          { label: "All Sale", href: "/collections/outlet" },
          { label: "Bundles / Mystery", href: "/collections/bundle" },
          { label: "Subscriptions", href: "/collections/subscriptions" },
        ],
      },
    ],
    featured: {
      image: "https://cdn.shopify.com/s/files/1/1096/0120/files/lastly-tattooer-up-close-life.jpg?v=1773688404",
      title: "Lasty Tattooer Collection",
      href: "/artist/lastly-tattooer/shop",
    },
  },
  {
    label: "Women",
    href: "/collections/womens",
    categories: [
      { label: "Shop All", href: "/collections/womens" },
      { label: "Tops", href: "/collections/womens" },
      { label: "Fleece", href: "/collections/womens-fleece" },
      { label: "Inktimates", href: "/collections/womens-intimates" },
    ],
    hideQuickLinks: true,
    featured: {
      image: "https://cdn.shopify.com/s/files/1/1096/0120/files/IMG_5715_98b3e639-06f0-45c7-9ba4-c5f3c2e9ef10.jpg?v=1771880875",
      title: "Women's Collection",
      href: "/collections/womens",
    },
  },
  {
    label: "Lifestyle",
    href: "/collections/lifestyle",
    hideQuickLinks: true,
    hideFooter: true,
    categories: [
      { label: "Artist Series", href: "/collections/artist-series" },
      { label: "__DROP_PLACEHOLDER__", href: "#" },
      { label: "Cherubs Capsule", href: "/collections/cherubs-capsule" },
      { label: "Angels Capsule", href: "/collections/angels-capsule" },
      { label: "BRO_OKS Collection", href: "/collections/bro_oks" },
      { label: "Timeless Collection", href: "/collections/timeless" },
      { label: "Sullen Badge", href: "/collections/sullen-badge" },
      { label: "Letterheads", href: "/collections/letterheads" },
      { label: "---", href: "#" },
      { label: "Artists Directory", href: "/collections/artists" },
    ],
  },
  {
    label: "Sale",
    href: "/collections/outlet",
  },
];

/* ─── Full nav items for mobile slide-out (nested like desktop) ─── */
interface MobileNavSub {
  label: string;
  href: string;
}
interface MobileNavCategory {
  label: string;
  href: string;
  subs?: MobileNavSub[];
  external?: boolean;
}
interface MobileNavItem {
  label: string;
  href: string;
  categories?: MobileNavCategory[];
}

const mobileNavItems: MobileNavItem[] = [
  { label: "New Releases", href: "/collections/new-releases" },
  { label: "Best Sellers", href: "/collections/best-sellers" },
  {
    label: "Men",
    href: "/collections/men",
    categories: [
      { label: "Shop All", href: "/collections/men" },
      {
        label: "Tees",
        href: "/collections/tees",
        subs: [
          { label: "Standard Tees", href: "/collections/standard-tees" },
          { label: "Premium Tees", href: "/collections/premium" },
          { label: "1 Ton Oversized", href: "/collections/1-ton-tees" },
          { label: "The Solids", href: "/collections/solids" },
          { label: "Long Sleeves", href: "/collections/long-sleeves" },
          { label: "Tanks", href: "/collections/tanks" },
        ],
      },
      {
        label: "Tops",
        href: "/collections/tops",
        subs: [
          { label: "Sweatshirts", href: "/collections/fleece" },
          { label: "Flannels", href: "/collections/flannels" },
          { label: "Wovens", href: "/collections/wovens" },
          { label: "Polos", href: "/collections/polos" },
        ],
      },
      { label: "Outerwear", href: "/collections/jackets" },
      {
        label: "Bottoms",
        href: "/collections/pants",
        subs: [
          { label: "Pants", href: "/collections/pants" },
          { label: "Sweatpants", href: "/collections/sweatpants" },
          { label: "Boardshorts", href: "/collections/boardshorts" },
          { label: "Shorts", href: "/collections/shorts" },
          { label: "Pajamas", href: "/collections/pajamas" },
        ],
      },
      {
        label: "Accessories",
        href: "/collections/accessories",
        subs: [
          { label: "Shop All", href: "/collections/accessories" },
          { label: "NEW Jewelry", href: "/collections/jewelry" },
          { label: "Headwear", href: "/collections/hats" },
          { label: "Boxers", href: "/collections/boxers" },
          { label: "Beanies", href: "/collections/beanies" },
          { label: "Socks", href: "/collections/socks" },
          { label: "Slides", href: "/collections/slides" },
          { label: "Backpacks", href: "/collections/bags" },
          { label: "Sunglasses", href: "/collections/black-fly-sunglasses" },
          { label: "Stickers", href: "/collections/stickers" },
          { label: "Gift Cards", href: "/collections/gift-cards" },
        ],
      },
      { label: "Youth Tees", href: "/collections/youth-tees" },
      { label: "Sale", href: "/collections/outlet" },
    ],
  },
  {
    label: "Women",
    href: "/collections/womens",
    categories: [
      { label: "Shop All", href: "/collections/womens" },
      { label: "Tops", href: "/collections/womens" },
      { label: "Fleece", href: "/collections/womens-fleece" },
      { label: "Inktimates", href: "/collections/womens-intimates" },
    ],
  },
  
  {
    label: "Accessories",
    href: "/collections/accessories",
    categories: [
      { label: "Shop All", href: "/collections/accessories" },
      { label: "NEW Jewelry", href: "/collections/jewelry" },
      { label: "Headwear", href: "/collections/hats" },
      { label: "Boxers", href: "/collections/boxers" },
      { label: "Beanies", href: "/collections/beanies" },
      { label: "Socks", href: "/collections/socks" },
      { label: "Slides", href: "/collections/slides" },
      { label: "Backpacks", href: "/collections/bags" },
      { label: "Sunglasses", href: "/collections/black-fly-sunglasses" },
      { label: "Stickers", href: "/collections/stickers" },
      { label: "Gift Cards", href: "/collections/gift-cards" },
    ],
  },
  {
    label: "Lifestyle",
    href: "/collections/lifestyle",
    categories: [
      { label: "Artist Series", href: "/collections/artist-series" },
      { label: "__DROP_PLACEHOLDER__", href: "#" },
      { label: "Cherubs Capsule", href: "/collections/cherubs-capsule" },
      { label: "Angels Capsule", href: "/collections/angels-capsule" },
      { label: "BRO_OKS Collection", href: "/collections/bro_oks" },
      { label: "Sullen Badge", href: "/collections/sullen-badge" },
      { label: "Timeless Collection", href: "/collections/timeless" },
      { label: "Letterheads", href: "/collections/letterheads" },
      { label: "---", href: "#" },
      { label: "Artists Directory", href: "/collections/artists" },
    ],
  },
  { label: "Sale", href: "/collections/outlet" },
];

const bottomNavLinks: { label: string; href: string }[] = [];

const secondaryLinks: { label: string; href: string }[] = [];

/* ─── KITH-style side-loading mega nav with nested sub-panels ─── */
const PANEL_W = 340;

function DesktopMegaPanel({
  menu,
  onClose,
}: {
  menu: NavItem;
  onClose: () => void;
}) {
  const location = useLocation();
  const { user } = useAuth();
  
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<import("@/lib/shopify").SearchResultProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const initialPath = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== initialPath.current) {
      onClose();
    }
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const { searchProducts } = await import("@/lib/shopify");
        const data = await searchProducts(value.trim(), 4);
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, []);

  const quickLinkDefs = [
    { label: "New Releases", href: "/collections/new-releases", handle: "new-releases" },
    { label: "Best Sellers", href: "/collections/best-sellers", handle: "best-sellers" },
    { label: "Sale", href: "/collections/outlet", handle: "outlet" },
  ];

  const [quickLinkImages, setQuickLinkImages] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchImages = async () => {
      const results: Record<string, string> = {};
      await Promise.all(
        quickLinkDefs.map(async (ql) => {
          try {
            const data = await storefrontApiRequest(
              `query($handle: String!) {
                collection(handle: $handle) {
                  products(first: 1) {
                    edges {
                      node {
                        images(first: 1) {
                          edges { node { url } }
                        }
                      }
                    }
                  }
                }
              }`,
              { handle: ql.handle }
            );
            const imgUrl = data?.data?.collection?.products?.edges?.[0]?.node?.images?.edges?.[0]?.node?.url;
            if (imgUrl) results[ql.handle] = imgUrl;
          } catch { /* skip */ }
        })
      );
      setQuickLinkImages(results);
    };
    fetchImages();
  }, []);

  const quickLinks = quickLinkDefs.map((ql) => ({
    ...ql,
    image: quickLinkImages[ql.handle] || "",
  }));

  if (!menu.categories) return null;

  const activeCat = menu.categories.find((c) => c.label === activeCategory);
  const hasSearch = searchQuery.trim().length >= 2;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[90] bg-background/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Primary panel */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "tween", duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        className="flex fixed top-0 left-0 bottom-0 z-[100] flex-col overflow-hidden bg-background border-r border-border/10 shadow-2xl"
        style={{ width: PANEL_W }}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-6 border-b border-border/10 flex-shrink-0">
          <span className="text-[10px] font-display uppercase tracking-[0.3em] text-muted-foreground">
            Explore {menu.label}
          </span>
          <button onClick={onClose} className="text-foreground/50 hover:text-foreground transition-colors p-1" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-border/10 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-6 pr-6 py-1.5 bg-transparent border border-border/30 rounded-md text-[12px] font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/40 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {hasSearch ? (
            /* Search results */
            <div className="px-6 py-4">
              {searchLoading ? (
                <p className="text-[11px] text-muted-foreground font-body py-6 text-center">Searching...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-[11px] text-muted-foreground font-body py-6 text-center">No results for "{searchQuery}"</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {searchResults.map((product) => {
                    const image = product.images.edges[0]?.node;
                    const price = product.priceRange.minVariantPrice;
                    return (
                      <Link key={product.id} to={`/product/${product.handle}`} onClick={onClose} className="group">
                        <div className="aspect-[3/4] overflow-hidden bg-secondary mb-1.5">
                          {image && <img src={image.url} alt={image.altText || product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                        </div>
                        <h3 className="text-[10px] font-display uppercase tracking-wider text-foreground group-hover:text-primary transition-colors line-clamp-2">{product.title}</h3>
                        <p className="text-[10px] text-muted-foreground font-body mt-0.5">${parseFloat(price.amount).toFixed(2)}</p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Quick link cards */}
              {!menu.hideQuickLinks && (
              <div className="flex gap-2 px-6 pt-4 pb-3">
                {quickLinks.map((ql) => (
                  <Link
                    key={ql.label}
                    to={ql.href}
                    onClick={onClose}
                    className="flex-1 relative overflow-hidden rounded-lg aspect-[4/3] group"
                  >
                    <img
                      src={ql.image}
                      alt={ql.label}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <span className="absolute bottom-2 left-0 right-0 text-center text-[8px] font-display uppercase tracking-[0.12em] text-white/90 group-hover:text-white transition-colors">
                      {ql.label}
                    </span>
                  </Link>
                ))}
              </div>
              )}

              {/* Category links */}
              <div className="px-6 pb-3">
                {menu.categories.map((cat, i) => {
                  if (cat.label === "---") {
                    return <div key="divider" className="border-t border-border/20 my-2" />;
                  }
                  return (
                  <motion.div
                    key={cat.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 + i * 0.02, duration: 0.2 }}
                  >
                    {cat.subs ? (
                      <button
                        onClick={() => setActiveCategory(activeCategory === cat.label ? null : cat.label)}
                        className={`w-full flex items-center justify-between py-2.5 text-[13px] font-display uppercase tracking-[0.15em] transition-colors group ${
                          activeCategory === cat.label ? "text-foreground" : "text-foreground/60 hover:text-foreground"
                        }`}
                      >
                        <span className={activeCategory === cat.label ? "underline underline-offset-4" : ""}>{cat.label}</span>
                        <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-foreground/60 transition-all ${activeCategory === cat.label ? "translate-x-0.5" : ""}`} />
                      </button>
                    ) : cat.external ? (
                      <a
                        href={cat.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onClose}
                        className={`block py-2.5 text-[13px] font-display uppercase tracking-[0.15em] transition-colors text-foreground/60 hover:text-foreground`}
                      >
                        {cat.label}
                      </a>
                    ) : (
                      <Link
                        to={cat.href}
                        onClick={onClose}
                        className={`block py-2.5 text-[13px] font-display uppercase tracking-[0.15em] transition-colors ${
                          cat.label === "Artists Directory"
                            ? "text-primary/80 hover:text-primary flex items-center gap-2"
                            : "text-foreground/60 hover:text-foreground"
                        }`}
                      >
                        {cat.label === "Artists Directory" && <Palette className="w-3.5 h-3.5" />}
                        {cat.label}
                      </Link>
                    )}
                  </motion.div>
                  );
                })}
              </div>
            </>
          )}

          {/* Featured image */}
          {menu.featured && (
            <div className="px-6 pb-4">
              <Link to={menu.featured.href} onClick={onClose} className="block group/feat">
                <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                  <img
                    src={menu.featured.image}
                    alt={menu.featured.title}
                    className="w-full h-full object-cover group-hover/feat:scale-105 transition-transform duration-700"
                  />
                </div>
                <p className="font-display text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-2 text-center group-hover/feat:text-foreground transition-colors">
                  {menu.featured.title}
                </p>
              </Link>
            </div>
          )}

          {/* Bottom nav links */}
          <div className="mt-auto" />
          <div className="px-6 py-3">
            {bottomNavLinks.filter(l => l.label !== "Artists").map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={onClose}
                className="block py-1.5 text-[11px] font-display uppercase tracking-[0.15em] text-foreground/40 hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Newsletter + Account/Artists — only for menus that want it */}
          {!menu.hideFooter && (
            <>
              <div className="border-t border-border/10 px-6 py-4">
                <NavNewsletter compact />
              </div>

              <div className="flex gap-2 px-6 pb-4">
                <Link
                  to={user ? "/account" : "/account/login"}
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-border/40 bg-secondary/50 hover:bg-secondary transition-colors group"
                >
                  <User className="w-4 h-4 text-foreground/50 group-hover:text-foreground transition-colors" />
                  <span className="text-[10px] font-display uppercase tracking-[0.12em] text-foreground/60 group-hover:text-foreground transition-colors">{user ? "My Account" : "Sign In"}</span>
                </Link>
                <Link
                  to="/collections/artists"
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-border/40 bg-secondary/50 hover:bg-secondary transition-colors group"
                >
                  <Palette className="w-4 h-4 text-foreground/50 group-hover:text-foreground transition-colors" />
                  <span className="text-[10px] font-display uppercase tracking-[0.12em] text-foreground/60 group-hover:text-foreground transition-colors">Artists</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Secondary sub-panel (slides in next to primary) */}
      <AnimatePresence>
        {activeCat && activeCat.subs && (
          <motion.div
            key={activeCat.label}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-0 bottom-0 z-[99] flex flex-col bg-background border-r border-border/10 shadow-xl overflow-hidden"
            style={{ left: PANEL_W, width: PANEL_W }}
          >
            {/* Sub-panel header */}
            <div className="flex items-center h-14 px-6 border-b border-border/10 flex-shrink-0">
              <span className="text-[10px] font-display uppercase tracking-[0.3em] text-muted-foreground">
                {activeCat.label}
              </span>
            </div>

            {/* Sub items */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 pt-5 pb-6">
              {activeCat.subs.map((sub, i) => (
                <motion.div
                  key={sub.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 + i * 0.02, duration: 0.2 }}
                >
                  <Link
                    to={sub.href}
                    onClick={onClose}
                    className="block py-2.5 text-[13px] font-display uppercase tracking-[0.15em] text-foreground/60 hover:text-foreground transition-colors"
                  >
                    {sub.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
/* ─── Mobile slide-out nav ─── */
const MobileSlideNav = React.forwardRef<HTMLDivElement, { isOpen: boolean; onClose: () => void; navItems?: typeof mobileNavItems }>(function MobileSlideNav({ isOpen, onClose, navItems }, _ref) {
  const resolvedNav = navItems ?? mobileNavItems;
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<import("@/lib/shopify").SearchResultProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => { onClose(); }, [location.pathname]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 350);
      setActiveSubmenu(null);
      setActiveSubCategory(null);
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const { searchProducts } = await import("@/lib/shopify");
        const data = await searchProducts(value.trim(), 6);
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, []);

  const hasSearch = searchQuery.trim().length >= 2;
  const activeItem = resolvedNav.find((item) => item.label === activeSubmenu);
  const activeSubCat = activeItem?.categories?.find((c) => c.label === activeSubCategory);

  // Quick links (no categories) vs category links (with categories)
  const quickLinks = resolvedNav.filter((item) => !item.categories);
  const categoryLinks = resolvedNav.filter((item) => item.categories);

  // Fetch first product image for each quick link collection
  const [quickLinkImages, setQuickLinkImages] = useState<Record<string, string>>({});
  useEffect(() => {
    const fetchImages = async () => {
      const results: Record<string, string> = {};
      const handles = quickLinks.map((ql) => {
        const parts = ql.href.split("/");
        return parts[parts.length - 1];
      });
      await Promise.all(
        handles.map(async (handle) => {
          try {
            const data = await storefrontApiRequest(
              `query($handle: String!) {
                collection(handle: $handle) {
                  products(first: 1) {
                    edges { node { images(first: 1) { edges { node { url } } } } }
                  }
                }
              }`,
              { handle }
            );
            const imgUrl = data?.data?.collection?.products?.edges?.[0]?.node?.images?.edges?.[0]?.node?.url;
            if (imgUrl) results[handle] = imgUrl;
          } catch { /* skip */ }
        })
      );
      setQuickLinkImages(results);
    };
    fetchImages();
  }, []);

  const isActivePath = (href: string) => location.pathname === href || location.pathname.startsWith(href + "/");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden fixed inset-0 z-[55] bg-background/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            drag="x"
            dragConstraints={{ left: -340, right: 0 }}
            dragElastic={0.1}
            dragSnapToOrigin={false}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80 || info.velocity.x < -300) onClose();
            }}
            className="lg:hidden fixed top-0 left-0 bottom-0 z-[60] w-[85vw] max-w-[380px] bg-background flex flex-col overflow-hidden shadow-2xl touch-pan-y"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-14 px-5 border-b border-border/10 flex-shrink-0">
              <span className="text-xs font-display uppercase tracking-[0.25em] text-muted-foreground">Menu</span>
              <button onClick={onClose} className="text-foreground/70 hover:text-foreground transition-colors p-1 -mr-1" aria-label="Close menu">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search + Theme toggle */}
            <div className="px-5 py-3 border-b border-border/10 flex-shrink-0 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-secondary/50 rounded-lg text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <MobileThemeToggle />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain relative">
              {hasSearch ? (
                <div className="px-5 py-5">
                  {searchLoading ? (
                    <p className="text-sm text-muted-foreground font-body py-8 text-center">Searching...</p>
                  ) : searchResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground font-body py-8 text-center">No results for "{searchQuery}"</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {searchResults.map((product) => {
                        const image = product.images.edges[0]?.node;
                        const price = product.priceRange.minVariantPrice;
                        return (
                          <Link key={product.id} to={`/product/${product.handle}`} onClick={onClose} className="group">
                            <div className="aspect-[3/4] overflow-hidden bg-secondary rounded-lg mb-2">
                              {image && <img src={image.url} alt={image.altText || product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                            </div>
                            <h3 className="text-[11px] font-display uppercase tracking-wider text-foreground group-hover:text-primary transition-colors line-clamp-2">{product.title}</h3>
                            <p className="text-[11px] text-muted-foreground font-body mt-0.5">${parseFloat(price.amount).toFixed(2)}</p>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-2">
                  {/* Quick links — with product image backgrounds */}
                  <div className="grid grid-cols-3 gap-2.5 px-5 py-3">
                    {quickLinks.map((item) => {
                      const handle = item.href.split("/").pop() || "";
                      const imgUrl = quickLinkImages[handle];
                      return (
                        <Link
                          key={item.label}
                          to={item.href}
                          onClick={onClose}
                          className="relative overflow-hidden rounded-lg aspect-[3/4] flex items-end justify-center group"
                        >
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={item.label}
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-secondary/70" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          <span className={`relative z-10 pb-2.5 text-[11px] font-display uppercase tracking-[0.15em] transition-colors ${
                            isActivePath(item.href)
                              ? "text-primary font-semibold"
                              : "text-white/90 group-hover:text-primary"
                          }`}>
                            {item.label}
                          </span>
                          {isActivePath(item.href) && (
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-primary rounded-full" />
                          )}
                        </Link>
                      );
                    })}
                  </div>

                  {/* Divider */}
                  <div className="mx-5 border-t border-border/10 my-1" />

                  {/* Category links — with chevron, opening sub-panel */}
                  <div className="py-1">
                    {categoryLinks.map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + i * 0.02, duration: 0.25 }}
                      >
                        <button
                          onClick={() => setActiveSubmenu(item.label)}
                          className={`w-full flex items-center justify-between px-5 py-3.5 group transition-colors ${
                            isActivePath(item.href) ? "text-primary" : "text-foreground"
                          }`}
                        >
                          <span className="text-[19px] font-display uppercase tracking-[0.15em] group-hover:text-primary transition-colors">
                            {item.label}
                          </span>
                          <div className="flex items-center gap-2">
                            {isActivePath(item.href) && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            )}
                            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground/60 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mx-5 border-t border-border/10 my-1" />

                  {/* Secondary links */}
                  <div className="py-2">
                    {secondaryLinks.map((link, i) => (
                      <motion.div key={link.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.03 }}>
                        <Link
                          to={link.href}
                          onClick={onClose}
                          className={`block px-5 py-2.5 text-sm font-body tracking-wide transition-colors ${
                            isActivePath(link.href) ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {link.label}
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                </div>
              )}

              {/* ─── Level 1 sub-panel: categories (slides in from right) ─── */}
              <AnimatePresence>
                {activeItem && activeItem.categories && (
                  <motion.div
                    key={activeItem.label}
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "tween", duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute inset-0 bg-background flex flex-col z-10"
                  >
                    {/* Back button */}
                    <button
                      onClick={() => { setActiveSubmenu(null); setActiveSubCategory(null); }}
                      className="flex items-center gap-2 h-12 px-5 border-b border-border/10 flex-shrink-0 text-foreground/70 hover:text-foreground transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      <span className="text-xs font-display uppercase tracking-[0.25em] text-muted-foreground">{activeItem.label}</span>
                    </button>

                    {/* Category items */}
                    <div className="flex-1 overflow-y-auto overscroll-contain py-2 relative">
                      {activeItem.categories.map((cat, j) => {
                        if (cat.label === "---") {
                          return <div key="divider" className="mx-5 border-t border-border/20 my-2" />;
                        }
                        return (
                        <motion.div
                          key={cat.label}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.03 + j * 0.02, duration: 0.2 }}
                        >
                          {cat.subs ? (
                            <button
                              onClick={() => setActiveSubCategory(cat.label)}
                              className="w-full flex items-center justify-between px-5 py-3 text-[19px] font-display uppercase tracking-[0.12em] text-foreground/60 hover:text-foreground transition-colors group"
                            >
                              <span>{cat.label}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-foreground/60 group-hover:translate-x-0.5 transition-all" />
                            </button>
                          ) : cat.external ? (
                            <a
                              href={cat.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={onClose}
                              className="flex items-center justify-between px-5 py-3 text-[19px] font-display uppercase tracking-[0.12em] text-foreground/60 hover:text-foreground transition-colors"
                            >
                              <span>{cat.label}</span>
                            </a>
                          ) : (
                            <Link
                              to={cat.href}
                              onClick={onClose}
                              className={`flex items-center justify-between px-5 py-3 text-[19px] font-display uppercase tracking-[0.12em] transition-colors ${
                                cat.label === "Artists Directory"
                                  ? "text-primary/80 hover:text-primary gap-2"
                                  : isActivePath(cat.href) ? "text-primary font-medium" : "text-foreground/60 hover:text-foreground"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                {cat.label === "Artists Directory" && <Palette className="w-3.5 h-3.5" />}
                                {cat.label}
                              </span>
                              {isActivePath(cat.href) && cat.label !== "Artists Directory" && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                            </Link>
                          )}
                        </motion.div>
                        );
                      })}

                      {/* ─── Level 2 sub-panel: sub-items (slides in from right) ─── */}
                      <AnimatePresence>
                        {activeSubCat && activeSubCat.subs && (
                          <motion.div
                            key={activeSubCat.label}
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "tween", duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                            className="absolute inset-0 bg-background flex flex-col z-20"
                          >
                            {/* Back button */}
                            <button
                              onClick={() => setActiveSubCategory(null)}
                              className="flex items-center gap-2 h-12 px-5 border-b border-border/10 flex-shrink-0 text-foreground/70 hover:text-foreground transition-colors"
                            >
                              <ChevronRight className="w-4 h-4 rotate-180" />
                              <span className="text-xs font-display uppercase tracking-[0.25em] text-muted-foreground">{activeSubCat.label}</span>
                            </button>

                            {/* Shop All link */}
                            <Link
                              to={activeSubCat.href}
                              onClick={onClose}
                              className="block px-5 py-3.5 text-[19px] font-display uppercase tracking-[0.15em] text-primary hover:text-primary/80 transition-colors border-b border-border/5"
                            >
                              Shop All {activeSubCat.label}
                            </Link>

                            {/* Sub items */}
                            <div className="flex-1 overflow-y-auto overscroll-contain py-2">
                              {activeSubCat.subs.map((sub, k) => (
                                <motion.div
                                  key={sub.label}
                                  initial={{ opacity: 0, x: 12 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.03 + k * 0.02, duration: 0.2 }}
                                >
                                  <Link
                                    to={sub.href}
                                    onClick={onClose}
                                    className={`flex items-center justify-between px-5 py-3 text-[19px] font-body transition-colors ${
                                      isActivePath(sub.href) ? "text-primary font-medium" : "text-foreground/60 hover:text-foreground"
                                    }`}
                                  >
                                    <span>{sub.label}</span>
                                    {isActivePath(sub.href) && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                                  </Link>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer — Newsletter + Account/Artists */}
            <div className="flex-shrink-0 border-t border-border/10">
              <div className="px-5 pt-3 pb-2">
                <NavNewsletter />
              </div>
              <div className="px-5 pb-3 pt-1 flex gap-2">
                <Link
                  to={user ? "/account" : "/account/login"}
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-colors group"
                >
                  <User className="w-4 h-4 text-foreground/50 group-hover:text-foreground transition-colors" />
                  <span className="text-xs font-display uppercase tracking-[0.12em] text-foreground/60 group-hover:text-foreground transition-colors">
                    {user ? "Account" : "Sign In"}
                  </span>
                </Link>
                <Link
                  to="/wishlist"
                  onClick={onClose}
                  className="flex items-center justify-center py-2.5 px-3 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-colors group"
                >
                  <Heart className="w-4 h-4 text-foreground/50 group-hover:text-foreground transition-colors" />
                </Link>
                <Link
                  to="/collections/artists"
                  onClick={onClose}
                  className="flex items-center justify-center py-2.5 px-3 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-colors group"
                >
                  <Palette className="w-4 h-4 text-foreground/50 group-hover:text-foreground transition-colors" />
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

/* ─── Theme toggle for mobile nav (next to search) ─── */
function MobileThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === "dark" ? (
          <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
            <Sun className="w-4 h-4 text-foreground/60" />
          </motion.div>
        ) : (
          <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
            <Moon className="w-4 h-4 text-foreground/60" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

function SkullPointsBadge() {
  const { unreadCount, clearNotifications } = usePointsNotification();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Link
      to="/rewards"
      onClick={clearNotifications}
      className="relative text-foreground/70 hover:text-foreground transition-colors p-1.5"
      aria-label="Skull Points"
    >
      <Skull className="w-[18px] h-[18px]" />
      {unreadCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 h-4 min-w-[16px] px-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </motion.span>
      )}
    </Link>
  );
}

function WishlistIcon() {
  const count = useWishlistStore((s) => s.items.length);
  return (
    <Link to="/wishlist" className="relative text-foreground/70 hover:text-foreground transition-colors p-1.5" aria-label="Wishlist">
      <Heart className="w-[18px] h-[18px]" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  );
}


export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDesktopMenu, setActiveDesktopMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const megaTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const { user } = useAuth();
  const isHome = location.pathname === "/";

  // Fetch active capsule drops for dynamic nav labels
  const [capsuleDrops, setCapsuleDrops] = useState<{ title: string; slug: string; collection_handle: string; drop_date: string }[]>([]);
  useEffect(() => {
    supabase
      .from("capsule_drops")
      .select("title, slug, collection_handle, drop_date")
      .eq("is_active", true)
      .order("drop_date", { ascending: false })
      .then(({ data }) => { if (data) setCapsuleDrops(data); });
  }, []);

  // Build dynamic nav items by injecting drop entries into Lifestyle categories
  const dynamicTopNav = useMemo(() => {
    const dropEntries = capsuleDrops.map((drop) => {
      const isLive = new Date(drop.drop_date) <= new Date();
      return {
        label: isLive ? drop.title : `🔒 ${drop.title}`,
        href: isLive ? `/collections/${drop.collection_handle}` : `/drops/${drop.slug}`,
      };
    });
    return topNavItems.map((item) => {
      if (item.label !== "Lifestyle" || !item.categories) return item;
      const cats = item.categories.flatMap((cat) =>
        cat.label.includes("DROP_PLACEHOLDER") ? dropEntries : [cat]
      );
      return { ...item, categories: cats };
    });
  }, [capsuleDrops]);

  const dynamicMobileNav = useMemo(() => {
    const dropEntries = capsuleDrops.map((drop) => {
      const isLive = new Date(drop.drop_date) <= new Date();
      return {
        label: isLive ? drop.title : `🔒 ${drop.title}`,
        href: isLive ? `/collections/${drop.collection_handle}` : `/drops/${drop.slug}`,
      };
    });
    return mobileNavItems.map((item) => {
      if (item.label !== "Lifestyle" || !item.categories) return item;
      const cats = item.categories.flatMap((cat) =>
        cat.label.includes("DROP_PLACEHOLDER") ? dropEntries : [cat]
      );
      return { ...item, categories: cats };
    });
  }, [capsuleDrops]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const headerTransparent = isHome && !scrolled && !activeDesktopMenu && !mobileOpen;

  const activeMenu = dynamicTopNav.find((m) => m.label === activeDesktopMenu);

  return (
    <>
      <header
        className={`sticky top-0 left-0 right-0 z-50 transition-all duration-500 ${
          headerTransparent
            ? "bg-transparent border-b border-transparent"
            : "bg-background/80 backdrop-blur-xl border-b border-border/20"
        }`}
      >
        <nav className="flex items-center justify-between h-14 lg:h-[72px] px-3 sm:px-4 lg:px-6 max-w-7xl mx-auto">
          {/* Left — hamburger (mobile) / nav links (desktop) */}
          <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
            {/* Mobile hamburger */}
            <button
              className="lg:hidden text-foreground p-1.5 -ml-1.5"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Desktop top nav links like KITH */}
            <div className="hidden lg:flex items-center gap-7">
              {dynamicTopNav.map((item) => (
                <div key={item.label} className="relative">
                  {item.categories ? (
                    <button
                      onClick={() => setActiveDesktopMenu(activeDesktopMenu === item.label ? null : item.label)}
                      className={`text-[13px] font-display font-semibold uppercase tracking-[0.2em] transition-colors py-1 whitespace-nowrap ${
                        activeDesktopMenu === item.label ? "text-foreground" : "text-foreground hover:text-foreground/70"
                      }`}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      to={item.href}
                      className="text-[13px] font-display font-semibold uppercase tracking-[0.2em] transition-colors py-1 whitespace-nowrap text-foreground hover:text-foreground/70"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Center logo */}
          <Link to="/" className="absolute left-1/2 -translate-x-1/2 group/logo" onClick={() => { setMobileOpen(false); setActiveDesktopMenu(null); }}>
            <div className="relative overflow-hidden" style={{ WebkitMaskImage: 'url(' + sullenLogo + ')', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskImage: 'url(' + sullenLogo + ')', maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center' }}>
              <img
                src={sullenLogo}
                alt="Sullen Clothing"
                className={`h-[28px] sm:h-[27px] lg:h-[39px] hover:opacity-80 transition-opacity ${theme === 'dark' ? 'brightness-0 invert' : 'brightness-0'}`}
              />
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/20 to-transparent pointer-events-none" style={{ animation: 'shimmer 3s ease-in-out 2' }} />
            </div>
          </Link>

          {/* Right icons */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">
            {/* Theme toggle — desktop only */}
            <button
              onClick={toggleTheme}
              className="hidden lg:block text-foreground/70 hover:text-foreground transition-colors p-1.5"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === "dark" ? (
                  <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Sun className="w-[18px] h-[18px]" />
                  </motion.div>
                ) : (
                  <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Moon className="w-[18px] h-[18px]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <button onClick={() => setSearchOpen(true)} className="text-foreground/70 hover:text-foreground transition-colors p-1.5" aria-label="Search">
              <Search className="w-[18px] h-[18px]" />
            </button>
            <Link to={user ? "/account" : "/account/login"} className="text-foreground/70 hover:text-foreground transition-colors p-1.5" aria-label="Account">
              <User className="w-[18px] h-[18px]" />
            </Link>
            <span className="hidden lg:block"><WishlistIcon /></span>
            <CartDrawer />
          </div>
        </nav>
      </header>

      {/* Desktop dropdown panel (KITH-style) */}
      <AnimatePresence>
        {activeMenu && activeMenu.categories && (
          <DesktopMegaPanel
            key={activeMenu.label}
            menu={activeMenu}
            onClose={() => setActiveDesktopMenu(null)}
          />
        )}
      </AnimatePresence>

      {/* Mobile slide-out nav */}
      <MobileSlideNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} navItems={dynamicMobileNav} />

      {/* Search overlay */}
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
