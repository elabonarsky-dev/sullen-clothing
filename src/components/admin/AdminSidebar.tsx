import {
  LayoutDashboard, Users, Skull, Lock, Package, MessageSquare,
  Mail, ShoppingCart, Video, AlertTriangle, Boxes, Pipette,
  Gift, Image, UserCheck, Palette, BarChart3, Rocket, KeyRound, Bell, ImageIcon, PartyPopper
} from "lucide-react";

export type AdminSection =
  | "analytics" | "marketing" | "drops" | "artists" | "rewards" | "vault" | "returns"
  | "reviews" | "review_requests" | "cart" | "cart_banners" | "bundles" | "videos"
  | "issues" | "swatches" | "migration" | "members" | "bonuses" | "brand_colors" | "users"
  | "back_in_stock" | "surveys" | "unboxing";

interface NavGroup {
  label: string;
  items: { id: AdminSection; label: string; icon: React.ElementType; badge?: number }[];
}

interface AdminSidebarProps {
  active: AdminSection;
  onChange: (section: AdminSection) => void;
  pendingReturns?: number;
  pendingReviews?: number;
  pendingArtists?: number;
  allowedSections?: AdminSection[];
}

export function AdminSidebar({ active, onChange, pendingReturns = 0, pendingReviews = 0, pendingArtists = 0, allowedSections }: AdminSidebarProps) {
  const groups: NavGroup[] = [
    {
      label: "Overview",
      items: [
        { id: "analytics", label: "Analytics", icon: BarChart3 },
        { id: "users", label: "Users", icon: KeyRound },
      ],
    },
    {
      label: "Content",
      items: [
        { id: "marketing", label: "Marketing", icon: Image },
        { id: "drops", label: "Drops", icon: Rocket },
        { id: "unboxing", label: "Unboxing", icon: PartyPopper },
        { id: "artists", label: "Artists", icon: Users, badge: pendingArtists },
        { id: "videos", label: "Videos", icon: Video },
        { id: "swatches", label: "Swatches", icon: Pipette },
        { id: "brand_colors", label: "Brand Colors", icon: Palette },
      ],
    },
    {
      label: "Commerce",
      items: [
        { id: "cart", label: "Cart Rules", icon: ShoppingCart },
        { id: "cart_banners", label: "Cart Banners", icon: ImageIcon },
        { id: "bundles", label: "Bundles", icon: Boxes },
      ],
    },
    {
      label: "Customer",
      items: [
        { id: "reviews", label: "Reviews", icon: MessageSquare, badge: pendingReviews },
        { id: "review_requests", label: "Review Requests", icon: Mail },
        { id: "returns", label: "Returns", icon: Package, badge: pendingReturns },
        { id: "back_in_stock", label: "Back in Stock", icon: Bell },
        { id: "surveys", label: "Survey Insights", icon: LayoutDashboard },
        { id: "issues", label: "Issues", icon: AlertTriangle },
      ],
    },
    {
      label: "Loyalty",
      items: [
        { id: "rewards", label: "Rewards", icon: Skull },
        { id: "vault", label: "The Vault", icon: Lock },
        { id: "members", label: "Members", icon: UserCheck },
        { id: "bonuses", label: "Bonus Events", icon: Gift },
        { id: "migration", label: "Migration", icon: Palette },
      ],
    },
  ];

  const filteredGroups = allowedSections
    ? groups
        .map((g) => ({ ...g, items: g.items.filter((i) => allowedSections.includes(i.id)) }))
        .filter((g) => g.items.length > 0)
    : groups;

  return (
    <aside className="w-56 flex-shrink-0 border-r border-border bg-card/30 min-h-[calc(100vh-4rem)] py-4 px-2 space-y-6 hidden lg:block">
      {filteredGroups.map((group) => (
        <div key={group.label}>
          <h3 className="px-3 mb-1.5 text-[10px] font-display uppercase tracking-[0.2em] text-muted-foreground/60">
            {group.label}
          </h3>
          <nav className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onChange(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-display uppercase tracking-wider transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {(item.badge ?? 0) > 0 && (
                    <span className={`min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1 ${
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-destructive text-destructive-foreground"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      ))}
    </aside>
  );
}

// Mobile dropdown version
export function AdminSidebarMobile({ active, onChange, pendingReturns = 0, pendingReviews = 0, pendingArtists = 0, allowedSections }: AdminSidebarProps) {
  const allItems: { id: AdminSection; label: string }[] = [
    { id: "analytics", label: "Analytics" },
    { id: "marketing", label: "Marketing" },
    { id: "drops", label: "Drops" },
    { id: "artists", label: "Artists" },
    { id: "videos", label: "Videos" },
    { id: "swatches", label: "Swatches" },
    { id: "cart", label: "Cart Rules" },
    { id: "bundles", label: "Bundles" },
    { id: "reviews", label: "Reviews" },
    { id: "review_requests", label: "Review Requests" },
    { id: "returns", label: "Returns" },
    { id: "back_in_stock", label: "Back in Stock" },
    { id: "surveys", label: "Survey Insights" },
    { id: "unboxing", label: "Unboxing" },
    { id: "issues", label: "Issues" },
    { id: "rewards", label: "Rewards" },
    { id: "vault", label: "The Vault" },
    { id: "members", label: "Members" },
    { id: "bonuses", label: "Bonus Events" },
    { id: "migration", label: "Migration" },
    { id: "brand_colors", label: "Brand Colors" },
  ];

  const filteredItems = allowedSections
    ? allItems.filter((i) => allowedSections.includes(i.id))
    : allItems;

  return (
    <div className="lg:hidden px-4 py-3 border-b border-border bg-card/30">
      <select
        value={active}
        onChange={(e) => onChange(e.target.value as AdminSection)}
        className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground font-display text-xs uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {filteredItems.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}
