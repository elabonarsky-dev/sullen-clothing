import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Terms of Service"
        description="Sullen Clothing terms of service. Please read these terms and conditions carefully before using this website."
        path="/pages/terms-of-service"
      />
      <SiteHeader />

      <div className="relative overflow-hidden">
        <div className="h-[120px] lg:h-[100px] bg-gradient-to-b from-secondary/50 to-background" />
        <div className="absolute inset-0 flex flex-col justify-end pb-6 lg:pb-8 px-4 lg:px-8 max-w-7xl mx-auto w-full">
          <nav className="flex items-center gap-1.5 text-[11px] font-body text-muted-foreground mb-3">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronLeft className="w-3 h-3 rotate-180" />
            <span className="text-foreground/80">Terms of Service</span>
          </nav>
          <h1 className="font-hudson text-2xl lg:text-4xl uppercase tracking-[0.1em] text-foreground">
            Terms of Service
          </h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto px-4 lg:px-8 py-10 lg:py-16"
      >
        <div className="prose prose-invert prose-sm max-w-none font-body text-muted-foreground space-y-8">

          <p className="text-xs text-muted-foreground/60">
            Effective Date: 07/2020 · Last Modified: 07/2020
          </p>

          <p>Please read these terms and conditions carefully before using this website. Your use of this website confirms your unconditional acceptance of the following terms and conditions and to the collection and use of your information as set forth in our <Link to="/pages/privacy-policy" className="text-foreground hover:underline">Privacy Policy</Link>. If you do not accept these terms, do not use this website.</p>

          <p>All features, content, specifications, products and prices of products and services described or depicted on this website are subject to change at any time without notice. We make all reasonable efforts to accurately display the attributes of our products, including applicable colors; however, the actual color you see will depend on your computer system and we cannot guarantee accuracy. The inclusion of any products or services at a particular time does not imply or warrant that these products or services will be available at any time.</p>

          <section>
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground mb-3">1. Shipping Limitations</h2>
            <p>When an order is placed, it will be shipped to an address designated by the purchaser as long as that shipping address is compliant with the shipping restrictions contained on this website. All purchases are made pursuant to a shipment contract. Risk of loss and title for items purchased pass to you upon delivery of the items to the carrier. You are responsible for filing any claims with carriers for damaged and/or lost shipments.</p>
          </section>

          <section>
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground mb-3">2. Accuracy of Information</h2>
            <p>We attempt to ensure that information on this website is complete, accurate and current. Despite our efforts, the information may occasionally be incomplete, inaccurate or out of date. We make no representation as to the completeness, accuracy or currentness of any information. Products may be unavailable, may have different attributes than those listed, or may carry a different price than that stated. We reserve the right, without prior notice, to limit the order quantity on any product or service and/or to refuse service to any customer.</p>
          </section>

          <section>
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground mb-3">3. Use of This Website</h2>
            <p>You agree not to engage in any prohibited activities including: copying or distributing any part of the website; using automated systems to access the website; transmitting spam; attempting to interfere with system integrity; uploading viruses or malicious software; collecting personally identifiable information; or using the website for any commercial solicitation purposes.</p>
            <p>You may use the website only if you can form a binding contract with us, and only in compliance with all applicable local, state, national, and international laws. Any use or access by anyone under 13 is strictly prohibited.</p>
          </section>

          <section>
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground mb-3">4. Proprietary Rights</h2>
            <p>The design of this website and all text, graphics, software, photographs, information, designs, logos, content, and other material displayed on or that can be downloaded from this website are either the property of, or used with permission by, Sullen and are protected by U.S. and international copyright, trademark and other laws. You may not modify, reproduce, copy, distribute, or publicly display any such materials for any public or commercial purpose without prior written permission.</p>
          </section>

          <section>
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground mb-3">5. Limitation of Liability</h2>
            <p>This website and all information, content, materials, products and services included on or otherwise made available to you through this website are provided on an "as is" and "as available" basis, unless otherwise specified in writing. We make no representations or warranties of any kind, express or implied, as to the operation of this website or the information, content, materials, products or services included.</p>
            <p>To the full extent permissible by applicable law, we disclaim all warranties, express or implied. We will not be liable for any damages of any kind arising from the use of this website, including but not limited to direct, indirect, incidental, punitive and consequential damages.</p>
          </section>

          <section>
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground mb-3">6. Indemnification</h2>
            <p>You agree to defend, indemnify and hold us harmless from any claim or demand, including reasonable attorneys' fees, made by any third party due to or arising out of your use of this website, your violation of these Terms and Conditions, or your violation of any rights of another.</p>
          </section>

          <section>
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground mb-3">7. Governing Law & Disputes</h2>
            <p>These Terms and Conditions and any separate agreements whereby we provide you services shall be governed by and construed in accordance with the laws of the State of California.</p>
          </section>

          <section>
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground mb-3">8. Changes to Terms of Service</h2>
            <p>You can review the most current version of the Terms of Service at any time at this page. We reserve the right, at our sole discretion, to update, change or replace any part of these Terms of Service by posting updates and changes to our website.</p>
          </section>

          <section>
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground mb-3">Contact Information</h2>
            <p>Questions about the Terms of Service should be sent to us at <a href="mailto:questions@sullenclothing.com" className="text-foreground hover:underline">questions@sullenclothing.com</a> or by mail at: Sullen Clothing, 1799 Apollo Ct., Seal Beach, CA 90740.</p>
          </section>

        </div>
      </motion.div>

      <SiteFooter />
    </div>
  );
}
