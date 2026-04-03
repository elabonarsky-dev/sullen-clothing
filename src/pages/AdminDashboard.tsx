import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";
import { directoryArtists } from "@/data/artistDirectory";
import { AdminSidebar, AdminSidebarMobile, type AdminSection } from "@/components/admin/AdminSidebar";
import { MarketingManager } from "@/components/admin/MarketingManager";
import { ArtistProfileManager } from "@/components/admin/ArtistProfileManager";
import { RewardsDashboard } from "@/components/admin/RewardsDashboard";
import { VaultCodeManager } from "@/components/admin/VaultCodeManager";
import { VaultItemsManager } from "@/components/admin/VaultItemsManager";
import { ReturnsManager } from "@/components/admin/ReturnsManager";
import { ReviewsManager } from "@/components/admin/ReviewsManager";
import { ReviewRequestsManager } from "@/components/admin/ReviewRequestsManager";
import { CartIncentivesManager } from "@/components/admin/CartIncentivesManager";
import { ProductVideoManager } from "@/components/admin/ProductVideoManager";
import { IssuesDashboard } from "@/components/admin/IssuesDashboard";
import { BundleConfigManager } from "@/components/admin/BundleConfigManager";
import { ColorSwatchManager } from "@/components/admin/ColorSwatchManager";
import { OkendoMigrationDashboard } from "@/components/admin/OkendoMigrationDashboard";
import { VaultMembersManager } from "@/components/admin/VaultMembersManager";
import { VaultBonusEventsManager } from "@/components/admin/VaultBonusEventsManager";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { DropsManager } from "@/components/admin/DropsManager";
import { BrandColorsPage } from "@/components/admin/BrandColorsPage";
import { UserManagement } from "@/components/admin/UserManagement";
import { BackInStockManager } from "@/components/admin/BackInStockManager";
import { SurveyInsightsDashboard } from "@/components/admin/SurveyInsightsDashboard";
import { CartBannerManager } from "@/components/admin/CartBannerManager";
import { UnboxingCampaignsManager } from "@/components/admin/UnboxingCampaignsManager";
import { SEO } from "@/components/SEO";

export default function AdminDashboard() {
  const { user, loading, isAdmin, hasAnyRole, hasRole } = useAuth();
  const navigate = useNavigate();
  const isArtistManager = hasAnyRole("admin", "artist_manager");
  const isCS = hasAnyRole("admin", "customer_service");
  const canAccessDashboard = hasAnyRole("admin", "artist_manager", "customer_service");
  const CS_SECTIONS: AdminSection[] = ["rewards", "returns", "issues", "members", "migration", "reviews", "back_in_stock"];
  const allowedSections: AdminSection[] | undefined = isAdmin
    ? undefined // admin sees everything
    : hasRole("customer_service")
      ? CS_SECTIONS
      : ["artists" as AdminSection]; // artist_manager only sees artists
  const defaultSection: AdminSection = isAdmin ? "analytics" : hasRole("customer_service") ? "rewards" : "artists";
  const [activeSection, setActiveSection] = useState<AdminSection>(defaultSection);
  const [pendingArtistCount, setPendingArtistCount] = useState(0);
  const [pendingReturnsCount, setPendingReturnsCount] = useState(0);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);

  // Set default section based on role
  useEffect(() => {
    if (isAdmin) {
      setActiveSection("analytics");
    } else if (hasRole("customer_service")) {
      setActiveSection("rewards");
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!loading && (!user || !canAccessDashboard)) {
      navigate("/admin/login");
    }
  }, [user, loading, canAccessDashboard, navigate]);

  useEffect(() => {
    if (user && canAccessDashboard) {
      fetchBadgeCounts();
    }
  }, [user, canAccessDashboard]);

  const fetchBadgeCounts = async () => {
    // Pending returns
    const { count: returnsCount } = await supabase
      .from("return_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    setPendingReturnsCount(returnsCount ?? 0);

    // Pending reviews
    const { count: reviewsCount } = await supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    setPendingReviewsCount(reviewsCount ?? 0);

    // Pending artist submissions
    try {
      const res = await fetch(`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/get-approved-artists`);
      if (res.ok) {
        const data = await res.json();
        const submissions = Array.isArray(data) ? data : data?.artists || [];
        const { data: existing } = await supabase.from("artist_profiles").select("slug");
        const existingSlugs = new Set((existing || []).map((p: any) => p.slug));
        const dirSlugs = new Set(directoryArtists.map((a) => a.slug));
        const pending = submissions.filter((a: any) => a.slug && !existingSlugs.has(a.slug) && !dirSlugs.has(a.slug));
        setPendingArtistCount(pending.length);
      }
    } catch {}
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <>
        <SEO title="Admin Dashboard" robots="noindex, nofollow" />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground font-body">Loading...</p>
        </div>
      </>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case "analytics":
        return <AnalyticsDashboard onNavigate={(section) => setActiveSection(section as AdminSection)} />;
      case "marketing":
        return <MarketingManager />;
      case "drops":
        return <DropsManager />;
      case "artists":
        return (
          <div>
            <div className="mb-6">
              <h2 className="font-display text-xl uppercase tracking-wider text-foreground">Artist Profiles</h2>
              <p className="text-sm text-muted-foreground font-body mt-1">Edit artist tags, location, Instagram, bio, and gallery images.</p>
            </div>
            <ArtistProfileManager canDelete={isAdmin} />
          </div>
        );
      case "rewards":
        return <RewardsDashboard />;
      case "vault":
        return (
          <div className="space-y-10">
            <VaultItemsManager />
            <div className="border-t border-border/20 pt-8">
              <VaultCodeManager />
            </div>
          </div>
        );
      case "returns":
        return <ReturnsManager />;
      case "reviews":
        return <ReviewsManager />;
      case "review_requests":
        return <ReviewRequestsManager />;
      case "cart":
        return <CartIncentivesManager />;
      case "cart_banners":
        return <CartBannerManager />;
      case "bundles":
        return <BundleConfigManager />;
      case "videos":
        return <ProductVideoManager />;
      case "issues":
        return <IssuesDashboard />;
      case "swatches":
        return <ColorSwatchManager />;
      case "migration":
        return <OkendoMigrationDashboard />;
      case "members":
        return <VaultMembersManager />;
      case "bonuses":
        return <VaultBonusEventsManager />;
      case "brand_colors":
        return <BrandColorsPage />;
      case "users":
        return <UserManagement />;
      case "back_in_stock":
        return <BackInStockManager />;
      case "surveys":
        return <SurveyInsightsDashboard />;
      case "unboxing":
        return <UnboxingCampaignsManager />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Admin Dashboard" robots="noindex, nofollow" />
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-6">
          <h1
            className="font-display text-lg uppercase tracking-wider text-foreground cursor-pointer hover:text-primary transition-colors"
            onClick={() => { setActiveSection(defaultSection); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          >
            Admin Dashboard
          </h1>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Mobile nav */}
      <AdminSidebarMobile
        active={activeSection}
        onChange={setActiveSection}
        pendingReturns={pendingReturnsCount}
        pendingReviews={pendingReviewsCount}
        pendingArtists={pendingArtistCount}
        allowedSections={allowedSections}
      />

      {/* Main layout */}
      <div className="flex">
        <AdminSidebar
          active={activeSection}
          onChange={setActiveSection}
          pendingReturns={pendingReturnsCount}
          pendingReviews={pendingReviewsCount}
          pendingArtists={pendingArtistCount}
          allowedSections={allowedSections}
        />
        <main className="flex-1 p-6 lg:p-8 min-w-0">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
