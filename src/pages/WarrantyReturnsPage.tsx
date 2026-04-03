import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function WarrantyReturnsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Warranty & Returns"
        description="Sullen Clothing return policy. Returns accepted for unused, unwashed items within 30 days of purchase."
        path="/pages/warranty-returns"
      />
      <SiteHeader />

      <div className="relative overflow-hidden">
        <div className="h-[120px] lg:h-[100px] bg-gradient-to-b from-secondary/50 to-background" />
        <div className="absolute inset-0 flex flex-col justify-end pb-6 lg:pb-8 px-4 lg:px-8 max-w-7xl mx-auto w-full">
          <nav className="flex items-center gap-1.5 text-[11px] font-body text-muted-foreground mb-3">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronLeft className="w-3 h-3 rotate-180" />
            <span className="text-foreground/80">Warranty & Returns</span>
          </nav>
          <h1 className="font-hudson text-2xl lg:text-4xl uppercase tracking-[0.1em] text-foreground">
            Warranty & Returns
          </h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto px-4 lg:px-8 py-10 lg:py-16"
      >
        <div className="prose prose-invert prose-sm max-w-none font-body text-muted-foreground space-y-6">
          <p>
            Returns are accepted for any unused, unwashed item(s) for any reason within 30 days of the original purchase date. If you have an item(s) that need to be returned please email{" "}
            <a href="mailto:returns@sullenclothing.com" className="text-foreground hover:underline">returns@sullenclothing.com</a>.
            The item(s) will need to be shipped back to Sullen Clothing: 1779 Apollo Ct. Seal Beach, CA 90740 in order to be processed.
          </p>

          <p>
            Once we receive the returned item(s) they will be inspected. If a product is damaged as a result of manufacturing, not by misuse, the item(s) will be exchanged for a new item/items or a credit will be issued to the bank account that was used for the original purchase. If you find an item to be the wrong size, feel free to contact us at{" "}
            <a href="mailto:info@sullenclothing.com" className="text-foreground hover:underline">info@sullenclothing.com</a>{" "}
            to make the exchange for the correct size.
          </p>

          <p>
            Please allow 2–10 business days for any credits to be applied back to your account. Also, please note that some items sold online are not eligible for returns or exchanges. For further assistance please contact Customer Service at:{" "}
            <a href="tel:18558783278" className="text-foreground hover:underline">1 (855) TRUE-ART</a> or{" "}
            <a href="mailto:returns@sullenclothing.com" className="text-foreground hover:underline">returns@sullenclothing.com</a>.
          </p>

          <p>Thank you for your business and for supporting the Sullen Art Collective.</p>

          <div className="mt-10 pt-8 border-t border-border/20">
            <p className="text-xs text-muted-foreground/60">
              You can also use our{" "}
              <a
                href="https://sullenclothing.loopreturns.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/70 hover:text-foreground underline"
              >
                hassle-free returns portal
              </a>{" "}
              for easy self-service returns.
            </p>
          </div>
        </div>
      </motion.div>

      <SiteFooter />
    </div>
  );
}
