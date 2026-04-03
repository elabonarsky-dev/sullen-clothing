import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Skull, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="text-center max-w-lg mx-auto px-6">
          <Skull className="w-20 h-20 text-primary mx-auto mb-6 opacity-80" />
          <h1 className="font-display text-7xl md:text-8xl font-black tracking-tight text-foreground mb-2">
            404
          </h1>
          <p className="font-display text-xl uppercase tracking-[0.2em] text-primary mb-4">
            Page Not Found
          </p>
          <p className="font-body text-muted-foreground mb-10 leading-relaxed">
            The page you're looking for has been lost in the ink. It may have been moved, deleted, or never existed.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/collections">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse Collections
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default NotFound;
