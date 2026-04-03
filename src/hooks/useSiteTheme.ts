import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteThemeName = "default" | "halloween" | "blaq-friday";

export function useSiteTheme() {
  const [activeTheme, setActiveTheme] = useState<SiteThemeName>("default");

  useEffect(() => {
    const fetchTheme = async () => {
      const { data } = await supabase
        .from("site_themes")
        .select("name")
        .eq("is_active", true)
        .maybeSingle();
      if (data?.name && data.name !== "default") {
        setActiveTheme(data.name as SiteThemeName);
      } else {
        setActiveTheme("default");
      }
    };

    fetchTheme();

    // Listen for realtime changes
    const channel = supabase
      .channel("site-themes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_themes" },
        () => fetchTheme()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("halloween", "blaq-friday");
    if (activeTheme !== "default") {
      root.classList.add(activeTheme);
    }
  }, [activeTheme]);

  return activeTheme;
}
