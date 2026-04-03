import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

/* ─── Token definitions ─── */
interface ColorToken {
  name: string;
  cssVar: string;
  hsl: string;
  description: string;
  category: string;
}

const tokens: ColorToken[] = [
  // Core
  { name: "Background", cssVar: "--background", hsl: "0 0% 5%", description: "Page background", category: "Core" },
  { name: "Foreground", cssVar: "--foreground", hsl: "40 20% 92%", description: "Default text color", category: "Core" },
  // Brand
  { name: "Primary (Gold)", cssVar: "--primary", hsl: "38 90% 52%", description: "Brand gold — CTAs, links, accents", category: "Brand" },
  { name: "Primary Foreground", cssVar: "--primary-foreground", hsl: "0 0% 5%", description: "Text on primary backgrounds", category: "Brand" },
  { name: "Gold", cssVar: "--gold", hsl: "38 90% 52%", description: "Alias for primary gold", category: "Brand" },
  { name: "Gold Dim", cssVar: "--gold-dim", hsl: "38 60% 35%", description: "Muted gold for subtle accents", category: "Brand" },
  // Surfaces
  { name: "Card", cssVar: "--card", hsl: "0 0% 8%", description: "Card & panel backgrounds", category: "Surfaces" },
  { name: "Card Foreground", cssVar: "--card-foreground", hsl: "40 20% 92%", description: "Text on cards", category: "Surfaces" },
  { name: "Secondary", cssVar: "--secondary", hsl: "0 0% 14%", description: "Secondary surfaces, hover states", category: "Surfaces" },
  { name: "Secondary Foreground", cssVar: "--secondary-foreground", hsl: "40 20% 85%", description: "Text on secondary surfaces", category: "Surfaces" },
  { name: "Muted", cssVar: "--muted", hsl: "0 0% 12%", description: "Muted backgrounds", category: "Surfaces" },
  { name: "Muted Foreground", cssVar: "--muted-foreground", hsl: "0 0% 55%", description: "Subdued text, captions", category: "Surfaces" },
  // Named brand tokens
  { name: "Bone", cssVar: "--bone", hsl: "40 20% 92%", description: "Off-white brand tone", category: "Named" },
  { name: "Ink", cssVar: "--ink", hsl: "0 0% 5%", description: "Deep black brand tone", category: "Named" },
  { name: "Charcoal", cssVar: "--charcoal", hsl: "0 0% 12%", description: "Dark grey brand tone", category: "Named" },
  { name: "Smoke", cssVar: "--smoke", hsl: "0 0% 55%", description: "Mid grey brand tone", category: "Named" },
  // System
  { name: "Border", cssVar: "--border", hsl: "0 0% 18%", description: "Borders & dividers", category: "System" },
  { name: "Input", cssVar: "--input", hsl: "0 0% 18%", description: "Input field borders", category: "System" },
  { name: "Ring", cssVar: "--ring", hsl: "38 90% 52%", description: "Focus ring color", category: "System" },
  { name: "Destructive", cssVar: "--destructive", hsl: "0 84.2% 60.2%", description: "Error / danger states", category: "System" },
  { name: "Destructive FG", cssVar: "--destructive-foreground", hsl: "210 40% 98%", description: "Text on destructive", category: "System" },
];

const typographyTokens = [
  { name: "Display / H1", font: "Hudson NY Serif", usage: "Hero headings, product titles (h1)", css: "font-hudson" },
  { name: "Headings", font: "Oswald", usage: "Navigation, labels, buttons, section headers", css: "font-display" },
  { name: "Body", font: "Barlow", usage: "Paragraphs, descriptions, form text", css: "font-body" },
  { name: "Condensed", font: "Barlow Condensed", usage: "Badges, compact labels", css: "font-condensed" },
];

function hslToHex(hsl: string): string {
  const parts = hsl.split(/\s+/);
  const h = parseFloat(parts[0]) || 0;
  const s = (parseFloat(parts[1]) || 0) / 100;
  const l = (parseFloat(parts[2]) || 0) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`Copied: ${text}`);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="p-1 rounded hover:bg-secondary/60 transition-colors" title={`Copy ${text}`}>
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
    </button>
  );
}

function ColorSwatch({ token }: { token: ColorToken }) {
  const hex = hslToHex(token.hsl);
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-card transition-colors">
      <div
        className="w-14 h-14 rounded-md flex-shrink-0 border border-border/30 shadow-inner"
        style={{ backgroundColor: `hsl(${token.hsl})` }}
      />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-display uppercase tracking-wider text-foreground">{token.name}</p>
        <p className="text-[11px] text-muted-foreground font-body">{token.description}</p>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <span className="text-[10px] font-mono bg-secondary/60 px-1.5 py-0.5 rounded text-foreground/80">
            {token.cssVar}
          </span>
          <CopyButton text={`var(${token.cssVar})`} />
          <span className="text-[10px] font-mono bg-secondary/60 px-1.5 py-0.5 rounded text-foreground/80">
            {hex}
          </span>
          <CopyButton text={hex} />
          <span className="text-[10px] font-mono bg-secondary/60 px-1.5 py-0.5 rounded text-foreground/80">
            hsl({token.hsl})
          </span>
          <CopyButton text={`hsl(${token.hsl})`} />
        </div>
      </div>
    </div>
  );
}

export function BrandColorsPage() {
  const categories = [...new Set(tokens.map((t) => t.category))];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl uppercase tracking-wider text-foreground">Brand & Design Tokens</h2>
        <p className="text-sm text-muted-foreground font-body mt-1">
          Reference guide for all colors, typography, and design tokens used across the site.
        </p>
      </div>

      {/* Color tokens by category */}
      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="font-display text-sm uppercase tracking-[0.2em] text-primary mb-3">{cat}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {tokens.filter((t) => t.category === cat).map((t) => (
              <ColorSwatch key={t.cssVar + t.name} token={t} />
            ))}
          </div>
        </div>
      ))}

      {/* Typography */}
      <div>
        <h3 className="font-display text-sm uppercase tracking-[0.2em] text-primary mb-3">Typography</h3>
        <div className="space-y-2">
          {typographyTokens.map((t) => (
            <div key={t.name} className="flex items-center gap-4 p-3 rounded-lg border border-border/50 bg-card/50">
              <div className="w-40 flex-shrink-0">
                <p className={`text-lg ${t.css} text-foreground`}>{t.font}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-display uppercase tracking-wider text-foreground/80">{t.name}</p>
                <p className="text-[11px] text-muted-foreground font-body">{t.usage}</p>
              </div>
              <span className="text-[10px] font-mono bg-secondary/60 px-1.5 py-0.5 rounded text-foreground/80 flex-shrink-0">
                {t.css}
              </span>
              <CopyButton text={t.css} />
            </div>
          ))}
        </div>
      </div>

      {/* Quick reference */}
      <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
        <h3 className="font-display text-sm uppercase tracking-[0.2em] text-primary mb-2">Usage Guide</h3>
        <ul className="text-xs text-muted-foreground font-body space-y-1.5 list-disc list-inside">
          <li>Always use semantic tokens (<code className="font-mono bg-secondary/60 px-1 rounded">bg-primary</code>, <code className="font-mono bg-secondary/60 px-1 rounded">text-foreground</code>) — never hardcode hex values.</li>
          <li>Primary Gold hex: <strong className="text-primary">#E8A40E</strong> — use for external assets, emails, and print.</li>
          <li>Background hex: <strong className="text-foreground">#0D0D0D</strong> — the "Ink" dark foundation.</li>
          <li>Foreground hex: <strong className="text-foreground">#EDE5D8</strong> — the "Bone" off-white text.</li>
        </ul>
      </div>
    </div>
  );
}
