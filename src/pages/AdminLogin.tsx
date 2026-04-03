import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();

  // Auto-redirect if already logged in with a staff role
  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: role } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .in("role", ["admin", "customer_service", "artist_manager"])
          .maybeSingle();

        if (role) {
          navigate("/admin", { replace: true });
          return;
        }
      }
      setCheckingSession(false);
    };

    checkExistingSession();

    // Listen for magic link callback (user returns from email)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const { data: role } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .in("role", ["admin", "customer_service", "artist_manager"])
            .maybeSingle();

          if (role) {
            toast.success("Welcome back!");
            navigate("/admin", { replace: true });
          } else {
            await supabase.auth.signOut();
            toast.error("Access denied. Staff privileges required.");
            setSent(false);
            setCheckingSession(false);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/login`,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setSent(true);
      toast.success("Magic link sent! Check your inbox.");
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <>
        <SEO title="Admin Login" robots="noindex, nofollow" />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <SEO title="Admin Login" robots="noindex, nofollow" />
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="font-display text-3xl uppercase tracking-wider text-foreground">
            Admin Login
          </h1>
          <p className="mt-2 text-sm text-muted-foreground font-body">
            {sent
              ? "Check your email for the login link"
              : "Enter your email to receive a secure login link"}
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-4">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-foreground font-body">
                We sent a login link to
              </p>
              <p className="text-sm font-semibold text-foreground font-body">
                {email}
              </p>
              <p className="text-xs text-muted-foreground font-body mt-4">
                Click the link in your email to sign in. The link expires in 1 hour.
              </p>
            </div>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="text-sm text-primary hover:underline font-body"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@sullenclothing.com"
                className="w-full px-4 py-3 bg-card border border-border rounded-sm text-foreground font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground font-display text-xs uppercase tracking-[0.25em] hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Login Link
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
