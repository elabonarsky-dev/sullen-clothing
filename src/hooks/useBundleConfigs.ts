import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BundleConfig {
  id: string;
  collection_handle: string;
  label: string;
  bundle_tag: string;
  min_qty: number;
  discount_type: string;
  fixed_amount: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useBundleConfigs() {
  return useQuery({
    queryKey: ["bundle-configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bundle_configs" as any)
        .select("*")
        .order("label");
      if (error) throw error;
      return (data ?? []) as unknown as BundleConfig[];
    },
  });
}

export function useActiveBundleConfigs() {
  return useQuery({
    queryKey: ["bundle-configs", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bundle_configs" as any)
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return (data ?? []) as unknown as BundleConfig[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useToggleBundleConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("bundle_configs" as any)
        .update({ is_active, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bundle-configs"] });
    },
  });
}

export function useCreateBundleConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: Omit<BundleConfig, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase
        .from("bundle_configs" as any)
        .insert(config as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bundle-configs"] });
    },
  });
}

export function useDeleteBundleConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bundle_configs" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bundle-configs"] });
    },
  });
}
