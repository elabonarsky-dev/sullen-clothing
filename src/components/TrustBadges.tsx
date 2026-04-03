import { RotateCcw, Headphones, ShieldCheck } from "lucide-react";

const badges = [
  { icon: RotateCcw, title: "Fast Easy Returns", desc: "Use our hassle-free returns portal or reach out via phone or email" },
  { icon: Headphones, title: "Top-Notch Support", desc: "Dedicated All-Star Support Team" },
  { icon: ShieldCheck, title: "Quality Guarantee", desc: "Love your product or send it back." },
];

export function TrustBadges() {
  return (
    <section className="border-y border-border py-10">
      <div className="container max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {badges.map((b) => (
            <div key={b.title} className="text-center">
              <b.icon className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-display text-sm uppercase tracking-wider text-foreground mb-1">{b.title}</h3>
              <p className="text-xs text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}