import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface SizeSelectorProps {
  sizes: string[];
  selected: string | null;
  onSelect: (size: string) => void;
  availableSizes?: string[];
  /** Optional slot next to the "Size Guide" label, e.g. a SizeChartModal trigger */
  sizeGuideSlot?: React.ReactNode;
  /** Unique layout ID prefix for the checkmark animation (avoids conflicts when multiple instances exist) */
  layoutIdPrefix?: string;
}

export function SizeSelector({
  sizes,
  selected,
  onSelect,
  availableSizes,
  sizeGuideSlot,
  layoutIdPrefix = "size-selector",
}: SizeSelectorProps) {
  // Deterministic two-row layout for 6+ sizes; single row for ≤5
  const shouldSplitRows = sizes.length > 5;
  const splitIndex = Math.ceil(sizes.length / 2);
  const sizeRows = shouldSplitRows
    ? [sizes.slice(0, splitIndex), sizes.slice(splitIndex)]
    : [sizes];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-display uppercase tracking-[0.2em] text-muted-foreground">
          Size
          {selected && <span className="text-foreground ml-2">{selected}</span>}
        </span>
        {sizeGuideSlot || (
          <button className="text-[10px] font-display uppercase tracking-[0.15em] text-primary hover:text-primary/80 transition-colors">
            Size Guide
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        {sizeRows.map((row, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}
          >
            {row.map((size) => {
              const isAvailable = !availableSizes || availableSizes.includes(size);
              const isSelected = selected === size;
              return (
                <button
                  key={size}
                  onClick={() => isAvailable && onSelect(size)}
                  disabled={!isAvailable}
                  className={`relative min-w-[44px] px-3 py-2.5 text-xs font-display uppercase tracking-wider rounded-sm border transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : isAvailable
                        ? "border-border text-foreground/80 hover:border-primary/50 hover:text-foreground"
                        : "border-border/30 text-muted-foreground/30 cursor-not-allowed line-through"
                  }`}
                >
                  {size}
                  {isSelected && (
                    <motion.div
                      layoutId={`${layoutIdPrefix}-check`}
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center"
                    >
                      <Check className="w-2 h-2 text-primary-foreground" strokeWidth={3} />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
