import { TrendingDown, Package, Flame, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { EnrichedWishlistItem } from '@/hooks/useWishlistEnrichment';

interface WishlistBadgesProps {
  item: EnrichedWishlistItem;
}

export function WishlistBadges({ item }: WishlistBadgesProps) {
  const badges: React.ReactNode[] = [];

  // Price Drop badge
  if (item.priceDrop && item.priceDropAmount) {
    badges.push(
      <Badge
        key="price-drop"
        className="bg-green-600 text-white border-transparent text-[10px] gap-1 px-1.5 py-0"
      >
        <TrendingDown className="w-3 h-3" />
        ${item.priceDropAmount} off
      </Badge>
    );
  }

  // Out of stock indicator
  if (item.availableForSale === false) {
    badges.push(
      <Badge
        key="oos"
        variant="secondary"
        className="text-[10px] gap-1 px-1.5 py-0 opacity-80"
      >
        <Package className="w-3 h-3" />
        Sold out
      </Badge>
    );
  }

  // Low stock urgency
  if (item.lowStock && item.totalInventory !== undefined) {
    badges.push(
      <Badge
        key="low-stock"
        className="bg-amber-600 text-white border-transparent text-[10px] gap-1 px-1.5 py-0"
      >
        <Flame className="w-3 h-3" />
        Only {item.totalInventory} left
      </Badge>
    );
  }

  // Wishlist age nudge (7+ days)
  if (item.daysOnWishlist >= 7 && item.availableForSale !== false) {
    badges.push(
      <Badge
        key="age"
        variant="outline"
        className="text-[10px] gap-1 px-1.5 py-0 text-muted-foreground"
      >
        <Clock className="w-3 h-3" />
        {item.daysOnWishlist}d ago
      </Badge>
    );
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {badges}
    </div>
  );
}
