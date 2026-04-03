import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AppRole = "admin" | "artist_manager" | "user" | "customer_service";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roles, setRoles] = useState<AppRole[]>([]);

  useEffect(() => {
    let mounted = true;

    const checkRolesAndFinish = (u: User | null) => {
      if (!u) {
        if (mounted) {
          setUser(null);
          setIsAdmin(false);
          setRoles([]);
          setLoading(false);
        }
        return;
      }
      if (mounted) setUser(u);
      // Grant signup bonus, ensure vault member, then claim Okendo points (sequenced to avoid race conditions)
      const runPostLoginTasks = async (userId: string, email?: string) => {
        try {
          await supabase.rpc("grant_signup_bonus", { p_user_id: userId });
        } catch (e) {
          console.error("[useAuth] grant_signup_bonus failed:", e);
        }
        if (email) {
          try {
            await supabase.rpc("ensure_vault_member", { p_user_id: userId, p_email: email });
          } catch (e) {
            console.error("[useAuth] ensure_vault_member failed:", e);
          }
          try {
            await supabase.rpc("claim_okendo_points", { p_user_id: userId, p_email: email });
          } catch (e) {
            console.error("[useAuth] claim_okendo_points failed:", e);
          }
        }
      };
      runPostLoginTasks(u.id, u.email ?? undefined);
      // Fetch ALL roles for this user
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.id)
        .then(({ data }) => {
          if (mounted) {
            const userRoles = (data || []).map((r: any) => r.role as AppRole);
            setRoles(userRoles);
            setIsAdmin(userRoles.includes("admin"));
            setLoading(false);
          }
        });
    };

    // Restore session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      checkRolesAndFinish(session?.user ?? null);
    });

    // Listen for subsequent auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        const u = session?.user ?? null;
        if (u) {
          setUser(u);
          // Run post-login tasks with error handling (sequenced)
          (async () => {
            try {
              await supabase.rpc("grant_signup_bonus", { p_user_id: u.id });
            } catch (e) {
              console.error("[useAuth] grant_signup_bonus failed:", e);
            }
            if (u.email) {
              try {
                await supabase.rpc("ensure_vault_member", { p_user_id: u.id, p_email: u.email });
              } catch (e) {
                console.error("[useAuth] ensure_vault_member failed:", e);
              }
              try {
                await supabase.rpc("claim_okendo_points", { p_user_id: u.id, p_email: u.email });
              } catch (e) {
                console.error("[useAuth] claim_okendo_points failed:", e);
              }
            }
          })();
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", u.id)
            .then(({ data }) => {
              if (mounted) {
                const userRoles = (data || []).map((r: any) => r.role as AppRole);
                setRoles(userRoles);
                setIsAdmin(userRoles.includes("admin"));
              }
            });
        } else {
          setUser(null);
          setIsAdmin(false);
          setRoles([]);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = () => supabase.auth.signOut();

  const hasRole = (role: AppRole) => roles.includes(role);
  const hasAnyRole = (...checkRoles: AppRole[]) => checkRoles.some((r) => roles.includes(r));

  return { user, loading, isAdmin, roles, hasRole, hasAnyRole, signOut };
}
