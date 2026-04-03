import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Privacy Policy"
        description="Sullen Clothing privacy policy. Learn how we collect, use, and protect your personal information."
        path="/pages/privacy-policy"
      />
      <SiteHeader />

      <div className="relative overflow-hidden">
        <div className="h-[120px] lg:h-[100px] bg-gradient-to-b from-secondary/50 to-background" />
        <div className="absolute inset-0 flex flex-col justify-end pb-6 lg:pb-8 px-4 lg:px-8 max-w-7xl mx-auto w-full">
          <nav className="flex items-center gap-1.5 text-[11px] font-body text-muted-foreground mb-3">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronLeft className="w-3 h-3 rotate-180" />
            <span className="text-foreground/80">Privacy Policy</span>
          </nav>
          <h1 className="font-hudson text-2xl lg:text-4xl uppercase tracking-[0.1em] text-foreground">
            Privacy Policy
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

          <section>
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground mb-3">Section 1 — How Do We Collect Your Information?</h2>
            <p>When you purchase something from our site, as part of the buying and selling process, we collect the personal information you give us such as your name, address and email address. Our third party e-commerce service provider, Shopify, has access to this information as well as your credit card information. (We do not maintain your credit card information.) Once your order is complete, we store your name and address information to more easily assist you in the future. We do not give any other third party your information without your express consent.</p>
            <p>When you browse our store, we also automatically receive your computer's internet protocol (IP) address in order to provide us with information that helps us learn about your browser and operating system. There is an option in the checkout process on our site for you to opt in to receiving promotional communications from us.</p>
          </section>

          <section>
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground mb-3">Section 2 — Consent</h2>
            <h3 className="font-display text-sm uppercase tracking-wider text-foreground/80 mb-2">How do you get my consent?</h3>
            <p>By providing us with personal information to complete a transaction, verifying your credit card, placing an order, arranging for a delivery or return, you have consented to us collecting your personal information for that specific reason only.</p>
            <h3 className="font-display text-sm uppercase tracking-wider text-foreground/80 mb-2 mt-4">How do I withdraw my consent?</h3>
            <p>If after you opt-in, you change your mind, you may withdraw your consent for us to contact you, for the continued collection, use or disclosure of your information, at any time, by contacting us at <a href="mailto:questions@sullenclothing.com" className="text-foreground hover:underline">questions@sullenclothing.com</a>, calling 562-296-1894 or mailing us at: Sullen Clothing, 1799 Apollo Ct., Seal Beach, CA 90740.</p>
          </section>

          <section>
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground mb-3">Section 3 — Disclosure</h2>
            <p>We may disclose your personal information if we are required by law to do so or if you violate our Terms of Service. If we are requested to share your information, we will advise you in advance, unless we are legally precluded from doing so.</p>
          </section>

          <section>
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground mb-3">Section 4 — Shopify</h2>
            <p>Our store is hosted by Shopify Inc. They provide us with the online e-commerce platform that allows us to sell our products and services to you. Your data is stored through Shopify's data storage, databases and the general Shopify application.</p>
            <p><strong className="text-foreground/80">Payment:</strong> If you choose a direct payment gateway to complete your purchase, then Shopify stores your credit card data. It is encrypted using secure socket layer technology (SSL) and stored with AES-256 encryption. Your purchase transaction data is stored only as long as is necessary to complete your purchase transaction.</p>
            <p>All direct payment gateways adhere to the standards set by PCI-DSS as managed by the PCI Security Standards Council, which is a joint effort of brands like Visa, Mastercard, American Express and Discover.</p>
          </section>

          <section>
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground mb-3">Section 5 — Third-Party Services</h2>
            <p>In general, the third-party providers used by us will only collect, use and disclose your information to the extent necessary to allow them to perform the services they provide to us and as requested by you.</p>
            <p>However, certain third-party service providers, such as payment gateways and other payment transaction processors, have their own privacy policies in respect to the information we are required to provide to them for your purchase-related transactions. For these providers, we recommend that you read their privacy policies so you can understand the manner in which your personal information will be handled.</p>
            <p>Once you leave our store's website or are redirected to a third-party website or application, you are no longer governed by this Privacy Policy or our website's Terms of Service.</p>
          </section>

          <section>
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground mb-3">Section 6 — Security</h2>
            <p>To protect your personal information, we take reasonable precautions and follow industry best practices to make sure it is not inappropriately lost, misused, accessed, disclosed, altered or destroyed.</p>
            <p>If you provide us with your credit card information, the information is encrypted using secure socket layer technology (SSL) and stored with AES-256 encryption. Although no method of transmission over the internet or electronic storage is 100% secure, we follow all PCI-DSS requirements and implement additional generally accepted industry standards.</p>
          </section>

          <section>
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground mb-3">Section 7 — Cookies</h2>
            <p>We use cookies to maintain your session, remember your preferences, and understand how you interact with our site. You can opt out of cookies through your browser settings.</p>
          </section>

          <section>
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground mb-3">Section 8 — Age of Consent</h2>
            <p>By using this site, you represent that you are at least the age of majority in your state or province of residence, or that you are the age of majority and you have given us your consent to allow any of your minor dependents to use this site.</p>
          </section>

          <section>
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground mb-3">Section 9 — Changes to This Privacy Policy</h2>
            <p>We reserve the right to modify this privacy policy at any time, so please review it frequently. Changes and clarifications will take effect immediately upon their posting on the website.</p>
          </section>

          <section>
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground mb-3">Questions & Contact Information</h2>
            <p>If you would like to access, correct, amend or delete any personal information we have about you, register a complaint, or simply want more information, contact us at <a href="mailto:questions@sullenclothing.com" className="text-foreground hover:underline">questions@sullenclothing.com</a> or by mail at: Sullen Clothing, 1799 Apollo Ct., Seal Beach, CA 90740.</p>
          </section>

        </div>
      </motion.div>

      <SiteFooter />
    </div>
  );
}
