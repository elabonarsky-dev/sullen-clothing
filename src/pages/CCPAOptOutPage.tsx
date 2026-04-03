import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SEO } from "@/components/SEO";

export default function CCPAOptOutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Do Not Sell or Share My Personal Information"
        description="Exercise your right to opt out of the sale or sharing of your personal information under U.S. state privacy laws."
        path="/pages/ccpa-opt-out"
      />
      <SiteHeader />

      <main className="max-w-3xl mx-auto px-4 py-16 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Do Not Sell or Share My Personal Information
        </h1>

        <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground">
          <p>
            As described in our{" "}
            <a href="/pages/privacy-policy" className="text-primary underline hover:text-primary/80">
              Privacy Policy
            </a>
            , we collect personal information from your interactions with us and our website, including
            through cookies and similar technologies. We may also share this personal information with
            third parties, including advertising partners. We do this in order to show you ads on other
            websites that are more relevant to your interests and for other reasons outlined in our
            privacy policy.
          </p>

          <p>
            Sharing of personal information for targeted advertising based on your interaction on
            different websites may be considered "sales", "sharing", or "targeted advertising" under
            certain U.S. state privacy laws. Depending on where you live, you may have the right to opt
            out of these activities. If you would like to exercise this opt-out right, please follow the
            instructions below.
          </p>

          <p>
            If you visit our website with the{" "}
            <a
              href="https://globalprivacycontrol.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              Global Privacy Control
            </a>{" "}
            opt-out preference signal enabled, depending on where you are, we will treat this as a
            request to opt-out of activity that may be considered a "sale" or "sharing" of personal
            information or other uses that may be considered targeted advertising for the device and
            browser you used to visit our website.
          </p>

          <div className="border border-border rounded-lg p-6 mt-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              To Opt Out
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Install and enable the{" "}
                <a
                  href="https://globalprivacycontrol.org/#download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  Global Privacy Control (GPC)
                </a>{" "}
                signal in your browser.
              </li>
              <li>
                Contact us at{" "}
                <a href="mailto:info@sullenclothing.com" className="text-primary underline hover:text-primary/80">
                  info@sullenclothing.com
                </a>{" "}
                with the subject line "CCPA Opt-Out Request".
              </li>
            </ul>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
