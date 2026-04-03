import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SEO } from "@/components/SEO";
import stencilImage from "@/assets/sullen-badge-tattoo-stencils.jpg";

export default function TattooStencilsPage() {
  return (
    <>
      <SEO
        title="Sullen Badge Tattoo Stencils"
        description="Download free Sullen Badge tattoo stencils with suggested placements. Get the iconic skull and brushes design in multiple sizes."
        path="/pages/tattoo-stencils"
      />
      <SiteHeader />

      <main className="bg-background text-foreground">
        {/* Hero */}
        <section className="bg-card py-16 md:py-24 text-center print-hide">
          <div className="container mx-auto px-4">
            <h1 className="font-display text-4xl md:text-5xl uppercase tracking-wider text-foreground mb-4">
              Sullen Badge Tattoo Stencils
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Suggested placements based on past Sullen Badge tattoos. Print, trace, and take to your artist.
            </p>
          </div>
        </section>

        {/* Stencil Sheet */}
        <section className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
          <div className="print-stencil bg-white rounded-lg shadow-lg overflow-hidden">
            <img
              src={stencilImage}
              alt="Sullen Badge tattoo stencil sheet showing skull and crossed brushes design in multiple sizes — finger, hand, neck, arm, leg, back, and thigh placements"
              className="w-full h-auto"
              loading="eager"
            />
          </div>

          <div className="mt-8 text-center print-hide flex flex-wrap justify-center gap-4">
            <a
              href={stencilImage}
              download="sullen-badge-tattoo-stencils.jpg"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-display uppercase tracking-wider text-sm px-8 py-3 rounded hover:bg-primary/90 transition-colors"
            >
              Download Stencil Sheet
            </a>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 border border-border text-foreground font-display uppercase tracking-wider text-sm px-8 py-3 rounded hover:bg-accent transition-colors"
            >
              Print Stencil Sheet
            </button>
          </div>

          {/* Placement Guide */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-6 text-center print-hide">
            {[
              { size: "Finger", desc: "Smallest — bold micro badge" },
              { size: "Hand (Thumb)", desc: "Classic hand placement" },
              { size: "Neck Behind Ear", desc: "Subtle & clean" },
              { size: "Arm", desc: "Mid-size for forearm or bicep" },
              { size: "Leg / Arm", desc: "Versatile medium stencil" },
              { size: "Back / Leg / Arm", desc: "Large detailed piece" },
              { size: "Back / Thigh", desc: "Full-size statement piece" },
            ].map((p) => (
              <div key={p.size} className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-display text-sm uppercase tracking-wider text-foreground mb-1">
                  {p.size}
                </h3>
                <p className="text-muted-foreground text-xs">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
