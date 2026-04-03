import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Loader2, Check, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { useCartStore } from "@/stores/cartStore";
import { type ShopifyProduct } from "@/lib/shopify";
import { toast } from "sonner";

interface VaultQuickAddProps {
  product: ShopifyProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VaultQuickAdd({ product, open, onOpenChange }: VaultQuickAddProps) {
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);

  if (!product) return null;

  const variants = product.node.variants.edges;
  const sizeOption = product.node.options.find(
    (o) => o.name.toLowerCase() === "size"
  );
  const sizes = sizeOption?.values ?? [];
  const image = product.node.images.edges[0]?.node;
  const price = product.node.priceRange.minVariantPrice;

  const selectedVariant = selectedSize
    ? variants.find((v) =>
        v.node.selectedOptions.some(
          (o) => o.name.toLowerCase() === "size" && o.value === selectedSize
        )
      )?.node
    : variants.length === 1
      ? variants[0].node
      : null;

  const isSoldOut = selectedVariant ? !selectedVariant.availableForSale : false;

  const handleAdd = async () => {
    if (!selectedVariant) return;
    await addItem({
      product,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions || [],
    });
    setAdded(true);
    toast.success("Added to cart", { description: product.node.title });
    setTimeout(() => {
      setAdded(false);
      setSelectedSize(null);
    }, 1200);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setSelectedSize(null);
      setAdded(false);
      setImageExpanded(false);
    }
    onOpenChange(val);
  };

  const isVariantAvailable = (size: string) => {
    const v = variants.find((v) =>
      v.node.selectedOptions.some(
        (o) => o.name.toLowerCase() === "size" && o.value === size
      )
    );
    return v?.node.availableForSale ?? false;
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="relative pb-0">
          <DrawerClose className="absolute right-4 top-4 rounded-full p-1 hover:bg-secondary/50 transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </DrawerClose>
          <DrawerTitle className="text-sm font-display uppercase tracking-[0.15em] text-foreground pr-8 line-clamp-1">
            {product.node.title}
          </DrawerTitle>
          <DrawerDescription className="text-xs font-body text-muted-foreground">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: price.currencyCode,
            }).format(parseFloat(price.amount))}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6 pt-3 space-y-4">
          {/* Product image */}
          {image && (
            <div
              className={`relative mx-auto rounded-lg overflow-hidden bg-secondary/30 cursor-pointer transition-all duration-300 ${
                imageExpanded ? "w-full max-w-full aspect-square" : "w-full max-w-[280px] aspect-square"
              }`}
              style={{ boxShadow: "0 8px 30px hsl(0 0% 0% / 0.35), 0 4px 12px hsl(0 0% 0% / 0.2)" }}
              onClick={() => setImageExpanded(!imageExpanded)}
            >
              <img
                src={image.url}
                alt={image.altText || product.node.title}
                className="w-full h-full object-cover"
              />
              {!imageExpanded && (
                <div className="absolute bottom-2 right-2 bg-background/70 backdrop-blur-sm rounded-full p-1.5">
                  <ZoomIn className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
            </div>
          )}

          {/* Size selector */}
          {sizes.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-display uppercase tracking-[0.2em] text-muted-foreground">
                Select Size
              </p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const available = isVariantAvailable(size);
                  return (
                    <button
                      key={size}
                      onClick={() => available && setSelectedSize(size)}
                      disabled={!available}
                      className={`min-w-[44px] px-3 py-2 text-[11px] font-display uppercase tracking-wider rounded-sm border transition-all ${
                        selectedSize === size
                          ? "bg-primary text-primary-foreground border-primary"
                          : available
                            ? "border-border text-foreground/70 hover:border-primary/50 hover:text-foreground"
                            : "border-border/30 text-muted-foreground/30 cursor-not-allowed line-through"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add to Cart button */}
          <Button
            className="w-full h-12 font-display text-xs uppercase tracking-[0.15em] rounded-sm"
            onClick={handleAdd}
            disabled={
              isLoading ||
              isSoldOut ||
              (sizes.length > 0 && !selectedSize)
            }
          >
            {added ? (
              <motion.span
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Added!
              </motion.span>
            ) : isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSoldOut ? (
              "Sold Out"
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 mr-2" />
                {sizes.length > 0 && !selectedSize
                  ? "Select a Size"
                  : "Add to Cart"}
              </>
            )}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
