import { Slider } from "@/components/ui/slider";
import { ThumbsUp } from "lucide-react";

export interface ReviewAttributes {
  sizing: number; // 1-5: Runs Small → True to Size → Runs Large
  design: number; // 1-5: Poor → Excellent
  quality: number; // 1-5: Poor → Excellent
  recommends: boolean;
  clothingSize: string;
  bodyType: string;
  height: string;
}

export const DEFAULT_ATTRIBUTES: ReviewAttributes = {
  sizing: 3,
  design: 5,
  quality: 5,
  recommends: true,
  clothingSize: "",
  bodyType: "",
  height: "",
};

const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
const BODY_TYPES = ["Slim", "Average", "Athletic", "Broad"];

interface ReviewAttributeFieldsProps {
  attributes: ReviewAttributes;
  onChange: (attrs: ReviewAttributes) => void;
}

export function ReviewAttributeFields({ attributes, onChange }: ReviewAttributeFieldsProps) {
  const update = (patch: Partial<ReviewAttributes>) =>
    onChange({ ...attributes, ...patch });

  return (
    <div className="space-y-5">
      {/* Recommends */}
      <div>
        <label className="text-xs text-muted-foreground font-body block mb-2">
          Would you recommend this product?
        </label>
        <div className="flex gap-2">
          {[true, false].map((val) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => update({ recommends: val })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-body transition-colors ${
                attributes.recommends === val
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:border-border"
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${!val ? "rotate-180" : ""}`} />
              {val ? "Yes" : "No"}
            </button>
          ))}
        </div>
      </div>

      {/* Product Attribute Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Sizing */}
        <div>
          <label className="text-xs text-muted-foreground font-body block mb-2">Sizing</label>
          <Slider
            min={1}
            max={5}
            step={1}
            value={[attributes.sizing]}
            onValueChange={([v]) => update({ sizing: v })}
            className="w-full"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground font-body">Runs Small</span>
            <span className="text-[10px] text-muted-foreground font-body">True to Size</span>
            <span className="text-[10px] text-muted-foreground font-body">Runs Large</span>
          </div>
        </div>

        {/* Design */}
        <div>
          <label className="text-xs text-muted-foreground font-body block mb-2">Design</label>
          <Slider
            min={1}
            max={5}
            step={1}
            value={[attributes.design]}
            onValueChange={([v]) => update({ design: v })}
            className="w-full"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground font-body">Poor</span>
            <span className="text-[10px] text-muted-foreground font-body">Excellent</span>
          </div>
        </div>

        {/* Product Quality */}
        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground font-body block mb-2">Product Quality</label>
          <Slider
            min={1}
            max={5}
            step={1}
            value={[attributes.quality]}
            onValueChange={([v]) => update({ quality: v })}
            className="w-full"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground font-body">Poor</span>
            <span className="text-[10px] text-muted-foreground font-body">Excellent</span>
          </div>
        </div>
      </div>

      {/* Profile Attributes */}
      <div>
        <label className="text-xs text-muted-foreground font-body block mb-2.5 font-semibold uppercase tracking-wider">
          Profile Attributes
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Clothing Size */}
          <div>
            <label className="text-xs text-muted-foreground font-body block mb-1.5">
              Usual Clothing Size
            </label>
            <select
              value={attributes.clothingSize}
              onChange={(e) => update({ clothingSize: e.target.value })}
              className="w-full bg-background border border-border/50 rounded-md px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select</option>
              {CLOTHING_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Body Type */}
          <div>
            <label className="text-xs text-muted-foreground font-body block mb-1.5">
              Body Type
            </label>
            <select
              value={attributes.bodyType}
              onChange={(e) => update({ bodyType: e.target.value })}
              className="w-full bg-background border border-border/50 rounded-md px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select</option>
              {BODY_TYPES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Height */}
          <div>
            <label className="text-xs text-muted-foreground font-body block mb-1.5">
              Height
            </label>
            <input
              type="text"
              value={attributes.height}
              onChange={(e) => update({ height: e.target.value })}
              placeholder="e.g. 6' 3&quot;"
              maxLength={10}
              className="w-full bg-background border border-border/50 rounded-md px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
