import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface RewardTransaction {
  id: string;
  points: number;
  type: string;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface RewardTier {
  id: string;
  name: string;
  icon: string;
  min_lifetime_spend: number;
  earn_rate: number;
  position: number;
  perks: string[];
  slug?: string;
  annual_threshold?: number;
  early_access_hours?: number;
  free_shipping_minimum?: number | null;
  color_hex?: string;
  pts_per_dollar?: number;
}

export interface RewardRedemption {
  id: string;
  points_spent: number;
  discount_code: string;
  discount_amount: number;
  used: boolean;
  created_at: string;
}

export function useRewards() {
  const { user } = useAuth();

  const balanceQuery = useQuery({
    queryKey: ["reward-balance", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_points_balance", {
        p_user_id: user!.id,
      });
      if (error) throw error;
      return (data as number) ?? 0;
    },
    enabled: !!user,
  });

  const lifetimeQuery = useQuery({
    queryKey: ["reward-lifetime", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_lifetime_points", {
        p_user_id: user!.id,
      });
      if (error) throw error;
      return (data as number) ?? 0;
    },
    enabled: !!user,
  });

  const transactionsQuery = useQuery({
    queryKey: ["reward-transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reward_transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as RewardTransaction[];
    },
    enabled: !!user,
  });

  const tiersQuery = useQuery({
    queryKey: ["reward-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reward_tiers")
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      return data as RewardTier[];
    },
  });

  const redemptionsQuery = useQuery({
    queryKey: ["reward-redemptions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reward_redemptions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as RewardRedemption[];
    },
    enabled: !!user,
  });

  // Determine current tier based on lifetime points (matches webhook logic)
  const currentTier = tiersQuery.data
    ?.slice()
    .reverse()
    .find((t) => (lifetimeQuery.data ?? 0) >= t.min_lifetime_spend);

  const nextTier = tiersQuery.data?.find(
    (t) =>
      t.position === ((currentTier?.position ?? -1) + 1)
  );

  return {
    balance: balanceQuery.data ?? 0,
    lifetimePoints: lifetimeQuery.data ?? 0,
    transactions: transactionsQuery.data ?? [],
    tiers: tiersQuery.data ?? [],
    redemptions: redemptionsQuery.data ?? [],
    currentTier: currentTier ?? null,
    nextTier: nextTier ?? null,
    isLoading:
      balanceQuery.isLoading ||
      lifetimeQuery.isLoading ||
      transactionsQuery.isLoading,
    refetch: () => {
      balanceQuery.refetch();
      lifetimeQuery.refetch();
      transactionsQuery.refetch();
      redemptionsQuery.refetch();
    },
  };
}
