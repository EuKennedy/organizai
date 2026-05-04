import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useCouple } from "@/hooks/use-couple";
import { useRealtimeRefetch } from "@/hooks/use-realtime";
import type { Series } from "@/types";

export function useSeries() {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSeries = useCallback(async () => {
    if (!couple) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("series")
        .select("*")
        .order("created_at", { ascending: false });
      setSeries((data as Series[] | null) ?? []);
    } catch (err) {
      console.error("[series] fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [couple]);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  useRealtimeRefetch(couple?.id ?? null, ["series"], fetchSeries);

  const addSeries = async (s: Omit<Series, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user || !couple) return;
    const { error } = await supabase
      .from("series")
      .insert({ ...s, user_id: user.id, couple_id: couple.id, created_by: user.id });
    if (error) throw new Error(error.message);
    await fetchSeries();
  };

  const updateSeries = async (id: string, updates: Partial<Series>) => {
    const { error } = await supabase.from("series").update(updates).eq("id", id);
    if (error) throw new Error(error.message);
    await fetchSeries();
  };

  const deleteSeries = async (id: string) => {
    const { error } = await supabase.from("series").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await fetchSeries();
  };

  return { series, loading, addSeries, updateSeries, deleteSeries, refetch: fetchSeries };
}
