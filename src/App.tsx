import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useParams, useLocation, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCartSync } from "@/hooks/useCartSync";
import { useSiteTheme } from "@/hooks/useSiteTheme";
import { HalloweenAtmosphere } from "@/components/HalloweenAtmosphere";
import { BlaqFridayAtmosphere } from "@/components/BlaqFridayAtmosphere";
import { BackToTop } from "@/components/BackToTop";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ga4PageView } from "@/lib/ga4";
import { trackPageView } from "@/lib/shopifyAnalytics";
import { initMetaPixel, metaPageView, generateEventId } from "@/lib/metaPixel";
import { capiPageView } from "@/lib/metaCapi";

import Index from "./pages/Index.tsx";
import ArtistPDP from "./pages/ArtistPDP.tsx";
import ArtistProfile from "./pages/ArtistProfile.tsx";
import ArtistBioPage from "./pages/ArtistBioPage.tsx";
import ArtistsDirectory from "./pages/ArtistsDirectory.tsx";
import CollectionPage from "./pages/CollectionPage.tsx";
import MensCategoryPage from "./pages/MensCategoryPage.tsx";
import LifestyleCategoryPage from "./pages/LifestyleCategoryPage.tsx";
import WomensCategoryPage from "./pages/WomensCategoryPage.tsx";
import ProductPage from "./pages/ProductPage.tsx";
import AboutPage from "./pages/AboutPage.tsx";
import FAQPage from "./pages/FAQPage.tsx";
import ReviewsPage from "./pages/ReviewsPage.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import WishlistPage from "./pages/WishlistPage.tsx";
import ShippingRatesPage from "./pages/ShippingRatesPage.tsx";

import RewardsPage from "./pages/RewardsPage.tsx";
import MilitaryDiscountPage from "./pages/MilitaryDiscountPage.tsx";
import WarrantyReturnsPage from "./pages/WarrantyReturnsPage.tsx";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage.tsx";
import TermsOfServicePage from "./pages/TermsOfServicePage.tsx";
import SullenAngelsPage from "./pages/SullenAngelsPage.tsx";
import TattooStencilsPage from "./pages/TattooStencilsPage.tsx";
import AccountLoginPage from "./pages/AccountLoginPage.tsx";
import AccountPage from "./pages/AccountPage.tsx";
import VaultPage from "./pages/VaultPage.tsx";
import ReturnsPortalPage from "./pages/ReturnsPortalPage.tsx";
import TrackOrderPage from "./pages/TrackOrderPage.tsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.tsx";
import CollectionsIndexPage from "./pages/CollectionsIndexPage.tsx";
import WriteReviewPage from "./pages/WriteReviewPage.tsx";
import SupportPage from "./pages/SupportPage.tsx";
import FiveRandomTeesLanding from "./pages/FiveRandomTeesLanding.tsx";
import CapsuleDropPage from "./pages/CapsuleDropPage.tsx";
import UnsubscribePage from "./pages/UnsubscribePage.tsx";
import CCPAOptOutPage from "./pages/CCPAOptOutPage.tsx";
import UnboxingPage from "./pages/UnboxingPage.tsx";
import SubscriptionsLandingPage from "./pages/SubscriptionsLandingPage.tsx";

import NotFound from "./pages/NotFound.tsx";
import { AIConcierge } from "@/components/AIConcierge";
import { getArtistBySlug } from "@/data/artists";

/** Redirects Shopify-hosted paths (gift cards, etc.) to the checkout domain */
function ShopifyRedirect() {
  useEffect(() => {
    const path = window.location.pathname + window.location.search;
    window.location.replace(`https://checkout.sullenclothing.com${path}`);
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground text-sm">Redirecting…</p>
    </div>
  );
}

/** Redirects /products/:handle (Shopify plural) → /product/:handle (our canonical singular) */
function ProductsRedirect() {
  const { handle } = useParams<{ handle: string }>();
  return <Navigate to={`/product/${handle || ""}`} replace />;
}

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** Fires GA4 + Shopify + Meta page_view on every route change */
function RouteTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    initMetaPixel();
  }, []);
  useEffect(() => {
    ga4PageView(pathname);
    trackPageView();
    const eventId = metaPageView();
    capiPageView(eventId);
  }, [pathname]);
  return null;
}


/* Shows product PDP if artist has a product, otherwise generic profile */
function ArtistRouter() {
  const { slug } = useParams<{ slug: string }>();
  const hasProduct = !!getArtistBySlug(slug || "");
  return hasProduct ? <ArtistPDP /> : <ArtistProfile />;
}

function AppContent() {
  useCartSync();
  useSiteTheme();
  return (
    <>
      <HalloweenAtmosphere />
      <BlaqFridayAtmosphere />
      <BrowserRouter>
      <ScrollToTop />
      <RouteTracker />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/artist/:slug" element={<ArtistProfile />} />
        <Route path="/artist/:slug/bio" element={<ArtistBioPage />} />
        <Route path="/artist/:slug/shop" element={<ArtistRouter />} />
        <Route path="/collections" element={<CollectionsIndexPage />} />
        <Route path="/collections/artists" element={<ArtistsDirectory />} />
        <Route path="/collections/men" element={<MensCategoryPage />} />
        <Route path="/collections/lifestyle" element={<LifestyleCategoryPage />} />
        <Route path="/collections/women" element={<WomensCategoryPage />} />
        <Route path="/collections/subscriptions" element={<SubscriptionsLandingPage />} />
        <Route path="/collections/:handle" element={<CollectionPage />} />
        <Route path="/collections/:handle/:subhandle" element={<CollectionPage />} />
        <Route path="/product/:handle" element={<ProductPage />} />
        <Route path="/products/:handle" element={<ProductsRedirect />} />
        <Route path="/pages/about-us" element={<AboutPage />} />
        <Route path="/pages/faq" element={<FAQPage />} />
        <Route path="/pages/reviews" element={<ReviewsPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/pages/shipping-rates" element={<ShippingRatesPage />} />
        
        <Route path="/pages/rewards" element={<RewardsPage />} />
        <Route path="/pages/military-discount" element={<MilitaryDiscountPage />} />
        <Route path="/pages/warranty-returns" element={<WarrantyReturnsPage />} />
        <Route path="/pages/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/pages/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/pages/tattoo-stencils" element={<TattooStencilsPage />} />
        <Route path="/pages/sullen-angels" element={<SullenAngelsPage />} />
        <Route path="/account/login" element={<AccountLoginPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/vault" element={<VaultPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/returns" element={<ReturnsPortalPage />} />
        <Route path="/track" element={<TrackOrderPage />} />
        <Route path="/write-review/:token" element={<WriteReviewPage />} />
        <Route path="/5-random-tees" element={<FiveRandomTeesLanding />} />
        <Route path="/drops/:slug" element={<CapsuleDropPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/unsubscribe" element={<UnsubscribePage />} />
        <Route path="/pages/ccpa-opt-out" element={<CCPAOptOutPage />} />
        <Route path="/unboxing/:slug" element={<UnboxingPage />} />
        <Route path="/gift_cards/*" element={<ShopifyRedirect />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BackToTop />
      <AIConcierge />
      
    </BrowserRouter>
    </>
  );
}

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
