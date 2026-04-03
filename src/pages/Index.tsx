import { AnnouncementBar } from "@/components/AnnouncementBar";
import { SiteHeader } from "@/components/SiteHeader";
import { HeroSlider } from "@/components/HeroSlider";
import { CollectionsRow } from "@/components/CollectionsRow";
import { TabbedCollections } from "@/components/TabbedCollections";
import { FeaturedProduct } from "@/components/FeaturedProduct";
import { CategoryLinks } from "@/components/CategoryLinks";
import { TrustBadges } from "@/components/TrustBadges";
import { SocialFeed } from "@/components/SocialFeed";
import { ReviewsCarousel } from "@/components/ReviewsCarousel";
import { SiteFooter } from "@/components/SiteFooter";
import { RecommendedForYou } from "@/components/RecommendedForYou";
import { SEO } from "@/components/SEO";
import { Helmet } from "react-helmet-async";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Sullen Clothing",
  url: "https://www.sullenclothing.com",
  logo: "https://www.sullenclothing.com/og-image.jpg",
  sameAs: [
    "https://www.instagram.com/sullenclothing",
    "https://www.facebook.com/SullenClothing",
    "https://twitter.com/SullenClothing",
    "https://www.youtube.com/user/SullenTV",
    "https://www.tiktok.com/@sullenclothing",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    url: "https://www.sullenclothing.com/support",
  },
  description:
    "Tattoo-inspired streetwear featuring artist collaborations, premium tees, hats, and accessories.",
};

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SEO path="/" />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(organizationJsonLd)}
        </script>
      </Helmet>
      <AnnouncementBar />
      <SiteHeader />
      <HeroSlider />
      <CollectionsRow />
      <TabbedCollections />
      <FeaturedProduct />
      <RecommendedForYou />
      <CategoryLinks />
      <SocialFeed />
      <ReviewsCarousel />
      <TrustBadges />
      <SiteFooter />
    </div>
  );
}