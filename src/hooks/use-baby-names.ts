import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useCouple } from "@/hooks/use-couple";
import { useRealtimeRefetch } from "@/hooks/use-realtime";
import type { BabyName } from "@/types";

export function useBabyNames() {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [names, setNames] = useState<BabyName[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNames = useCallback(async () => {
    if (!couple) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("baby_names")
        .select("*")
        .order("favorite", { ascending: false })
        .order("created_at", { ascending: false });
      setNames((data as BabyName[] | null) ?? []);
    } catch (err) {
      console.error("[baby-names] fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [couple]);

  useEffect(() => {
    fetchNames();
  }, [fetchNames]);

  useRealtimeRefetch(couple?.id ?? null, ["baby_names"], fetchNames);

  const addName = async (
    input: Omit<BabyName, "id" | "user_id" | "created_at">
  ) => {
    if (!user || !couple) return;
    const { error } = await supabase
      .from("baby_names")
      .insert({ ...input, user_id: user.id, couple_id: couple.id, created_by: user.id });
    if (error) throw new Error(error.message);
    await fetchNames();
  };

  const updateName = async (id: string, updates: Partial<BabyName>) => {
    const { error } = await supabase
      .from("baby_names")
      .update(updates)
      .eq("id", id);
    if (error) throw new Error(error.message);
    await fetchNames();
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    await updateName(id, { favorite: !current });
  };

  const deleteName = async (id: string) => {
    const { error } = await supabase.from("baby_names").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await fetchNames();
  };

  return {
    names,
    loading,
    addName,
    updateName,
    toggleFavorite,
    deleteName,
    refetch: fetchNames,
  };
}
