import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const LAST_SEEN_KEY = "skull_points_last_seen";

function getLastSeen(): string {
  return localStorage.getItem(LAST_SEEN_KEY) || new Date(0).toISOString();
}

function markSeen() {
  localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
}

export function usePointsNotification() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const mountedRef = useRef(true);

  // Catch-up: check for points earned since last visit
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const lastSeen = getLastSeen();

    supabase
      .from("reward_transactions")
      .select("id, points, description, created_at")
      .eq("user_id", user.id)
      .gt("points", 0)
      .gt("created_at", lastSeen)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (!mountedRef.current || !data) return;
        if (data.length > 0) {
          setUnreadCount(data.length);
          const totalNew = data.reduce((s, t) => s + t.points, 0);
          toast({
            title: "💀 You earned Skull Points!",
            description: `+${totalNew.toLocaleString()} points since your last visit`,
          });
        }
      });

    return () => {
      mountedRef.current = false;
    };
  }, [user]);

  // Realtime: listen for new point-earning transactions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`points-notify-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reward_transactions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as { points: number; description: string | null };
          if (row.points > 0) {
            setUnreadCount((c) => c + 1);
            toast({
              title: "💀 Skull Points Earned!",
              description:
                row.description || `+${row.points.toLocaleString()} points`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const clearNotifications = useCallback(() => {
    markSeen();
    setUnreadCount(0);
  }, []);

  return { unreadCount, clearNotifications };
}
