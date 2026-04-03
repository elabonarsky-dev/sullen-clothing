import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Shirt } from "lucide-react";
import teeStandard from "@/assets/tee-standard.svg";
import teePremium from "@/assets/tee-premium.svg";
import tee1ton from "@/assets/tee-1ton.svg";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";


interface Spec {
  label: string;
  value: string;
}

interface Measurement {
  label: string;
  valueSm: string;
  valueMd: string;
  valueLg: string;
  valueXl: string;
}

interface TierData {
  id: string;
  tierLabel: string;
  tierName: string;
  image: string;
  color: string;
  imgWidth: number;
  tagline: string;
  weightMetric: string;
  weightImperial: string;
  barPercent: number;
  specs: Spec[];
  description: string;
  badge?: string;
  featured?: boolean;
  measurements: Measurement[];
}

const tiers: TierData[] = [
  {
    id: "standard",
    tierLabel: "Tier 01",
    tierName: "Standard",
    image: teeStandard,
    color: "hsl(0 0% 55%)",
    imgWidth: 200,
    tagline: "The workhorse. Built for constant rotation.",
    weightMetric: "203",
    weightImperial: "6 oz/yd²",
    barPercent: 80,
    specs: [
      { label: "Cotton", value: "100% cotton jersey" },
      { label: "Yarn", value: "Standard spun" },
      { label: "Dye", value: "Standard" },
      { label: "Fit", value: "Classic / relaxed" },
      { label: "Collar", value: "Set-in rib" },
      { label: "Taping", value: "Shoulder-to-shoulder" },
      { label: "Hem", value: "Double-needle" },
      { label: "Wash", value: "Preshrunk" },
    ],
    description: "Mid-heavy cotton jersey with the construction details that outlast the trend. Set-in rib collar, shoulder-to-shoulder taping, double-needle hem.",
    measurements: [
      { label: "Sleeve to Sleeve", valueSm: '34"', valueMd: '35"', valueLg: '36"', valueXl: '37"' },
      { label: "Midsection Width", valueSm: '19"', valueMd: '20"', valueLg: '21"', valueXl: '22"' },
      { label: "HPS Length", valueSm: '28"', valueMd: '29"', valueLg: '30"', valueXl: '31"' },
    ],
  },
  {
    id: "premium",
    tierLabel: "Tier 02",
    tierName: "Premium",
    image: teePremium,
    color: "hsl(38 90% 52%)",
    imgWidth: 190,
    tagline: "Lighter weight. Heavier hand feel.",
    weightMetric: "185",
    weightImperial: "~5.5 oz/yd²",
    barPercent: 67,
    specs: [
      { label: "Cotton", value: "100% soft cotton jersey" },
      { label: "Yarn", value: "Ring-spun, combed" },
      { label: "Dye", value: "Custom dye (single or double)" },
      { label: "Fit", value: "Custom / tailored" },
      { label: "Collar", value: "Set-in rib" },
      { label: "Taping", value: "Shoulder-to-shoulder" },
      { label: "Hem", value: "Double-needle" },
      { label: "Wash", value: "Preshrunk" },
    ],
    description: "Ring-spun combed yarn — tighter weave, smoother surface, less pilling, more drape, softer hand feel from wear one.",
    measurements: [
      { label: "Sleeve to Sleeve", valueSm: '31"', valueMd: '32"', valueLg: '33"', valueXl: '34"' },
      { label: "Midsection Width", valueSm: '19"', valueMd: '20"', valueLg: '21"', valueXl: '22"' },
      { label: "HPS Length", valueSm: '26.5"', valueMd: '27.5"', valueLg: '28.5"', valueXl: '29.5"' },
    ],
  },
  {
    id: "1ton",
    tierLabel: "Tier 03",
    tierName: "1Ton",
    image: tee1ton,
    color: "hsl(40 20% 92%)",
    imgWidth: 215,
    tagline: "Designed from scratch. Built to outlast everything.",
    weightMetric: "~244",
    weightImperial: "7.2 oz/yd²",
    barPercent: 100,
    badge: "Heaviest build",
    featured: true,
    specs: [
      { label: "Cotton", value: "100% heavyweight cotton" },
      { label: "Yarn", value: "Heavyweight" },
      { label: "Dye", value: "Custom dyed to artwork" },
      { label: "Fit", value: "Boxy / oversized" },
      { label: "Collar", value: "Drop shoulder" },
      { label: "Taping", value: "Shoulder-to-shoulder" },
      { label: "Hem", value: "Double-needle" },
      { label: "Wash", value: "Double-washed" },
    ],
    description: "7.2 oz heavyweight cotton — nearly 20% heavier than Standard. Double-washed. Drop shoulder. Boxy silhouette. Custom dyed to the art.",
    measurements: [
      { label: "Sleeve to Sleeve", valueSm: '38"', valueMd: '39"', valueLg: '40"', valueXl: '41"' },
      { label: "Midsection Width", valueSm: '21.5"', valueMd: '22.5"', valueLg: '23.5"', valueXl: '24.5"' },
      { label: "HPS Length", valueSm: '28"', valueMd: '29"', valueLg: '30"', valueXl: '31"' },
    ],
  },
];

type ViewMode = "detail" | "compare";

export function TeeTierSwitcher({ currentTier }: { currentTier?: "standard" | "premium" | "1ton" }) {
  const [activeTab, setActiveTab] = useState<string>(currentTier || "standard");
  const [viewMode, setViewMode] = useState<ViewMode>("detail");
  const [compareLeft, setCompareLeft] = useState("standard");
  const [compareRight, setCompareRight] = useState("premium");
  const activeTier = tiers.find((t) => t.id === activeTab)!;
  const leftTier = tiers.find((t) => t.id === compareLeft)!;
  const rightTier = tiers.find((t) => t.id === compareRight)!;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-3 w-full cursor-pointer py-3 px-4 my-1 rounded-lg border border-border/30 bg-secondary/20 hover:bg-secondary/40 transition-all duration-200 active:scale-[0.995] group">
          <Shirt className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
          <span className="text-[10px] font-display uppercase tracking-[0.15em] text-foreground/70 group-hover:text-foreground transition-colors leading-tight flex-shrink-0">Compare<br/>Tees</span>
          <div className="flex gap-1.5 ml-auto items-center">
            {tiers.map((t) => {
              const isActive = currentTier === t.id;
              return (
                <span
                  key={t.id}
                  className={`text-[12px] font-body font-medium px-4 py-2 rounded transition-all duration-300 ${
                    isActive
                      ? "bg-foreground/15 text-foreground border border-foreground/25"
                      : "bg-secondary text-muted-foreground/80 group-hover:bg-secondary/80"
                  }`}
                >
                  {t.tierName}
                </span>
              );
            })}
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-0 bg-background border-border/50 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">Compare Tee Weights</DialogTitle>

        <div className="p-5 pb-6">
          <p className="text-[10px] font-body font-medium tracking-[0.14em] uppercase text-muted-foreground mb-1">
            Built different at every level
          </p>
          <h2 className="text-xl font-display font-medium tracking-tight text-foreground mb-4">
            Find your weight class
          </h2>

          <div className="flex gap-1 bg-secondary rounded-[10px] p-1 mb-4">
            <button
              onClick={() => setViewMode("detail")}
              className={`flex-1 py-2 px-1 text-xs font-body font-medium rounded-[7px] transition-all duration-150 ${
                viewMode === "detail" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setViewMode("compare")}
              className={`flex-1 py-2 px-1 text-xs font-body font-medium rounded-[7px] transition-all duration-150 flex items-center justify-center gap-1 ${
                viewMode === "compare" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              <Layers className="w-3 h-3" />
              Compare
            </button>
          </div>

          <AnimatePresence mode="wait">
            {viewMode === "detail" ? (
              <motion.div key="detail" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <div className="flex gap-1 bg-secondary/50 rounded-lg p-1 mb-4">
                  {tiers.map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => setActiveTab(tier.id)}
                      className={`flex-1 py-2 px-1 text-[13px] font-body font-medium rounded-md transition-all duration-150 ${
                        activeTab === tier.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground/70"
                      }`}
                    >
                      {tier.tierName}
                    </button>
                  ))}
                </div>
                <DetailPanel tier={activeTier} />
              </motion.div>
            ) : (
              <motion.div key="compare" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <CompareView leftId={compareLeft} rightId={compareRight} leftTier={leftTier} rightTier={rightTier} onLeftChange={setCompareLeft} onRightChange={setCompareRight} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailPanel({ tier }: { tier: TierData }) {
  return (
    <div className={`rounded-xl p-5 bg-card ${tier.featured ? "border-[1.5px] border-primary/40" : "border border-border/50"}`}>
      {tier.badge && (
        <span className="inline-block text-[9px] font-body font-medium tracking-[0.1em] uppercase py-1 px-2.5 rounded-md bg-foreground text-background mb-2">
          {tier.badge}
        </span>
      )}
      <span className="block text-[9px] font-body font-medium tracking-[0.12em] uppercase text-muted-foreground mb-0.5">{tier.tierLabel}</span>
      <h3 className="text-2xl font-display font-medium tracking-tight text-foreground">{tier.tierName}</h3>

      <div className="relative flex items-end justify-center my-4 h-[200px]">
        <img src={tier.image} alt={tier.tierName} className="h-auto" style={{ filter: "brightness(1.8)", maxWidth: `${tier.imgWidth}px` }} />
      </div>

      <p className="text-[13px] font-body text-muted-foreground leading-relaxed pt-3 border-t border-border/50">{tier.tagline}</p>

      <div className="flex items-baseline justify-between mt-3.5">
        <span className="text-xl font-display font-medium text-foreground">{tier.weightMetric} <span className="text-[11px] font-body text-muted-foreground">g/m²</span></span>
        <span className="text-[11px] font-body text-muted-foreground">{tier.weightImperial}</span>
      </div>

      <div className="h-[3px] bg-border/60 rounded-full overflow-hidden mt-1.5">
        <motion.div className="h-full bg-foreground rounded-full" initial={{ width: 0 }} animate={{ width: `${tier.barPercent}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
      </div>

      <ul className="border-t border-border/50 mt-3.5 pt-3.5 flex flex-col gap-2.5">
        {tier.specs.map((spec) => (
          <li key={spec.label} className="flex items-start justify-between gap-3">
            <span className="text-xs font-body text-muted-foreground flex-shrink-0">{spec.label}</span>
            <span className="text-xs font-body font-medium text-foreground text-right">{spec.value}</span>
          </li>
        ))}
      </ul>

      <div className="border-t border-border/50 mt-3.5 pt-3.5">
        <span className="text-[10px] font-body font-medium tracking-[0.1em] uppercase text-muted-foreground mb-2 block">Measurements by size</span>
        <div className="overflow-hidden rounded-lg border border-border/40">
          <table className="w-full text-[11px] font-body">
            <thead>
              <tr className="bg-secondary/50">
                <th className="text-left py-1.5 px-2 text-muted-foreground font-medium" />
                <th className="py-1.5 px-2 text-center text-muted-foreground font-medium">S</th>
                <th className="py-1.5 px-2 text-center text-muted-foreground font-medium">M</th>
                <th className="py-1.5 px-2 text-center text-muted-foreground font-medium">L</th>
                <th className="py-1.5 px-2 text-center text-muted-foreground font-medium">XL</th>
              </tr>
            </thead>
            <tbody>
              {tier.measurements.map((m) => (
                <tr key={m.label} className="border-t border-border/30">
                  <td className="py-1.5 px-2 text-muted-foreground whitespace-nowrap">{m.label}</td>
                  <td className="py-1.5 px-2 text-center font-medium text-foreground">{m.valueSm}</td>
                  <td className="py-1.5 px-2 text-center font-medium text-foreground">{m.valueMd}</td>
                  <td className="py-1.5 px-2 text-center font-medium text-foreground">{m.valueLg}</td>
                  <td className="py-1.5 px-2 text-center font-medium text-foreground">{m.valueXl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[13px] font-body text-muted-foreground leading-[1.7] border-t border-border/50 mt-3.5 pt-3.5">{tier.description}</p>
    </div>
  );
}

function CompareView({ leftId, rightId, leftTier, rightTier, onLeftChange, onRightChange }: {
  leftId: string; rightId: string; leftTier: TierData; rightTier: TierData;
  onLeftChange: (id: string) => void; onRightChange: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="grid grid-cols-2 gap-px bg-border/30">
        <TierPicker selected={leftId} onChange={onLeftChange} exclude={rightId} color={leftTier.color} />
        <TierPicker selected={rightId} onChange={onRightChange} exclude={leftId} color={rightTier.color} />
      </div>

      <div className="relative flex items-end justify-center h-[200px] bg-card px-4 pt-4">
        <img src={leftTier.image} alt={leftTier.tierName} className="absolute bottom-0 left-1/2 -translate-x-1/2 h-auto transition-all duration-300" style={{ filter: "brightness(1.4)", opacity: 0.45, maxWidth: `${leftTier.imgWidth}px` }} />
        <img src={rightTier.image} alt={rightTier.tierName} className="absolute bottom-0 left-1/2 -translate-x-1/2 h-auto transition-all duration-300" style={{ filter: "brightness(1.8)", opacity: 0.7, maxWidth: `${rightTier.imgWidth}px` }} />
        <div className="absolute top-3 left-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 rounded-full" style={{ backgroundColor: leftTier.color, opacity: 0.6 }} />
            <span className="text-[9px] font-body text-muted-foreground">{leftTier.tierName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 rounded-full" style={{ backgroundColor: rightTier.color }} />
            <span className="text-[9px] font-body text-muted-foreground">{rightTier.tierName}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border/50">
        <div className="grid grid-cols-2 gap-px bg-border/20">
          <div className="bg-card p-3">
            <span className="text-lg font-display font-medium text-foreground">{leftTier.weightMetric}<span className="text-[10px] font-body text-muted-foreground ml-1">g/m²</span></span>
            <div className="h-[2px] bg-border/40 rounded-full overflow-hidden mt-1.5">
              <motion.div className="h-full rounded-full" style={{ backgroundColor: leftTier.color }} initial={{ width: 0 }} animate={{ width: `${leftTier.barPercent}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
            </div>
          </div>
          <div className="bg-card p-3">
            <span className="text-lg font-display font-medium text-foreground">{rightTier.weightMetric}<span className="text-[10px] font-body text-muted-foreground ml-1">g/m²</span></span>
            <div className="h-[2px] bg-border/40 rounded-full overflow-hidden mt-1.5">
              <motion.div className="h-full rounded-full" style={{ backgroundColor: rightTier.color }} initial={{ width: 0 }} animate={{ width: `${rightTier.barPercent}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
            </div>
          </div>
        </div>

        {leftTier.specs.map((spec, i) => {
          const rightSpec = rightTier.specs[i];
          const isDifferent = spec.value !== rightSpec?.value;
          return (
            <div key={spec.label} className="grid grid-cols-[1fr_auto_1fr] border-t border-border/30">
              <div className={`p-2.5 text-right ${isDifferent ? "" : "opacity-50"}`}>
                <span className="text-[11px] font-body font-medium text-foreground">{spec.value}</span>
              </div>
              <div className="flex items-center px-2">
                <span className="text-[10px] font-body text-muted-foreground uppercase tracking-wider whitespace-nowrap">{spec.label}</span>
              </div>
              <div className={`p-2.5 ${isDifferent ? "" : "opacity-50"}`}>
                <span className="text-[11px] font-body font-medium text-foreground">{rightSpec?.value}</span>
              </div>
            </div>
          );
        })}

        <div className="border-t border-border/50 p-3">
          <span className="text-[10px] font-body font-medium tracking-[0.1em] uppercase text-muted-foreground mb-2 block">Measurements by size</span>
          {leftTier.measurements.map((m, i) => {
            const rm = rightTier.measurements[i];
            return (
              <div key={m.label} className="mb-2.5 last:mb-0">
                <span className="text-[10px] font-body text-muted-foreground uppercase tracking-wider block mb-1">{m.label}</span>
                <div className="grid grid-cols-4 gap-1 text-[10px] font-body">
                  {(["valueSm", "valueMd", "valueLg", "valueXl"] as const).map((key, ki) => {
                    const isDiff = m[key] !== rm[key];
                    return (
                      <div key={key} className="text-center">
                        <span className="text-muted-foreground/60 block">{["S", "M", "L", "XL"][ki]}</span>
                        <div className="flex items-center justify-center gap-1">
                          <span className={`font-medium ${isDiff ? "text-foreground" : "text-foreground/50"}`} style={isDiff ? { color: leftTier.color } : {}}>{m[key]}</span>
                          <span className="text-muted-foreground/40">/</span>
                          <span className={`font-medium ${isDiff ? "text-foreground" : "text-foreground/50"}`} style={isDiff ? { color: rightTier.color } : {}}>{rm[key]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TierPicker({ selected, onChange, exclude, color }: {
  selected: string; onChange: (id: string) => void; exclude: string; color: string;
}) {
  const current = tiers.find((t) => t.id === selected)!;
  return (
    <div className="bg-card p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[9px] font-body font-medium tracking-[0.1em] uppercase text-muted-foreground">{current.tierLabel}</span>
      </div>
      <div className="flex gap-1">
        {tiers.map((tier) => (
          <button
            key={tier.id}
            disabled={tier.id === exclude}
            onClick={() => onChange(tier.id)}
            className={`flex-1 py-1.5 text-[11px] font-body font-medium rounded-md transition-all duration-150 ${
              tier.id === selected ? "bg-secondary text-foreground" : tier.id === exclude ? "text-muted-foreground/30 cursor-not-allowed" : "text-muted-foreground hover:text-foreground/70"
            }`}
          >
            {tier.tierName}
          </button>
        ))}
      </div>
    </div>
  );
}
