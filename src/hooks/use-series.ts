import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { Series } from "@/types";

export function useSeries() {
  const { user } = useAuth();
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSeries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("series")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setSeries((data as Series[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  const addSeries = async (s: Omit<Series, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return;
    const { error } = await supabase.from("series").insert({ ...s, user_id: user.id });
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
