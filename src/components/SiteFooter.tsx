import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, MessageCircle } from "lucide-react";
import sullenLogo from "@/assets/sullen-footer-logo.png";
import { NewsletterSection } from "./NewsletterSection";

const termsLinks = [
  { label: "FAQ", href: "/pages/faq" },
  { label: "About Us", href: "/pages/about-us" },
  { label: "Warranty & Returns", href: "/pages/warranty-returns" },
  { label: "Privacy Policy", href: "/pages/privacy-policy" },
  { label: "Terms of Service", href: "/pages/terms-of-service" },
  { label: "Reviews", href: "/pages/reviews" },
  { label: "Do Not Sell My Info", href: "/pages/ccpa-opt-out" },
];

const orderLinks = [
  { label: "Track My Package", href: "/track" },
  { label: "Shipping Rates", href: "/pages/shipping-rates" },
  { label: "Rewards Program", href: "/pages/rewards" },
  { label: "Military Discount", href: "/pages/military-discount" },
];

const lifestyleLinks = [
  
  { label: "Sullen TV", href: "https://www.youtube.com/sullentv" },
  { label: "Sullen Artist Directory", href: "/collections/artists" },
  { label: "Tattoo Stencils", href: "/pages/tattoo-stencils" },
  { label: "Sullen Angels", href: "/pages/sullen-angels" },
];

const appLinks = [
  {
    label: "Download on the App Store",
    href: "https://apps.apple.com/us/app/sullen-art-co/id1671824510",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
  },
  {
    label: "Get it on Google Play",
    href: "https://play.google.com/store/apps/details?id=co.tapcart.app.id_WHs1hHtbLA",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M3.18 23.64c-.36-.2-.58-.57-.58-.99V1.35c0-.42.22-.79.58-.99l11.83 11.64L3.18 23.64zM15.76 12.82L5.23 23.16l12.67-7.12-2.14-3.22zM21.17 10.72l-3.5-1.97-2.53 3.25 2.53 3.25 3.5-1.97c.63-.35.63-1.21 0-1.56zM5.23.84l10.53 10.34 2.14-3.22L5.23.84z" />
      </svg>
    ),
  },
];

const socialLinks = [
  { label: "Facebook", href: "https://www.fb.com/sullenfamily", icon: Facebook },
  { label: "Instagram", href: "https://www.instagram.com/sullenclothing", icon: Instagram },
  { label: "YouTube", href: "https://www.youtube.com/sullentv", icon: Youtube },
  { label: "TikTok", href: "https://www.tiktok.com/@sullen_clothing", icon: null },
];

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="font-display text-sm uppercase tracking-[0.15em] text-foreground mb-4">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((l) => {
          const isExternal = l.href.startsWith("http");
          return (
            <li key={l.label}>
              {isExternal ? (
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  to={l.href}
                  className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
                >
                  {l.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-background border-t border-border/30">
      <NewsletterSection />

      {/* Main footer */}
      <div className="container max-w-7xl py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Logo */}
          <div className="flex items-start">
            <img src={sullenLogo} alt="Sullen Art Collective" className="h-28" />
          </div>

          <FooterColumn title="Terms" links={termsLinks} />
          <FooterColumn title="Order Info." links={orderLinks} />
          <div>
            <FooterColumn title="Lifestyle" links={lifestyleLinks} />
            <div className="mt-5 flex flex-col gap-2.5">
              <h4 className="font-display text-sm uppercase tracking-[0.15em] text-foreground">Get the App</h4>
              {appLinks.map((app) => (
                <a
                  key={app.label}
                  href={app.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border/40 bg-foreground/5 px-3 py-2 text-xs font-body text-foreground hover:bg-foreground/10 transition-colors w-fit"
                >
                  {app.icon}
                  <span>{app.label}</span>
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-display text-sm uppercase tracking-[0.15em] text-foreground mb-4">Contact Us</h4>
            <div className="space-y-1 text-sm font-body text-muted-foreground mb-4">
              <p>1779 Apollo Court</p>
              <p>Seal Beach, CA 90740</p>
              <p>Phone: <a href="tel:5622961894" className="hover:text-foreground transition-colors">562-296-1894</a></p>
            </div>
            <a href="mailto:questions@sullenclothing.com" className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
              questions@sullenclothing.com
            </a>
            <div className="mt-5 space-y-1">
              <Link to="/returns" className="block text-sm font-display uppercase tracking-wider text-foreground underline underline-offset-2 hover:text-foreground/80 transition-colors">Start a Return</Link>
              <Link to="/track" className="block text-sm font-display uppercase tracking-wider text-foreground underline underline-offset-2 hover:text-foreground/80 transition-colors">Order Tracking</Link>
              <button
                onClick={() => window.dispatchEvent(new Event("open-concierge"))}
                className="flex items-center gap-2 text-sm font-display uppercase tracking-wider text-primary hover:text-primary/80 transition-colors mt-2"
              >
                <MessageCircle className="w-4 h-4" />
                Chat
              </button>
            </div>
            <div className="mt-5">
              <h5 className="text-sm font-display uppercase tracking-wider text-foreground mb-1">Store Hours</h5>
              <p className="text-sm font-body text-muted-foreground">10am - 6pm Monday - Friday</p>
              <p className="text-sm font-body text-muted-foreground">10am - 3pm Saturday</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border/20 py-5">
        <div className="container max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-muted-foreground">
            {socialLinks.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-border/30 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                  aria-label={s.label}
                >
                  {Icon ? (
                    <Icon className="w-4 h-4" />
                  ) : (
                    /* TikTok custom SVG */
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.18z" />
                    </svg>
                  )}
                </a>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-body">
            © {new Date().getFullYear()} Sullen Clothing. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
