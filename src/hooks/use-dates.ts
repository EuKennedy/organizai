import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useCouple } from "@/hooks/use-couple";
import { useRealtimeRefetch } from "@/hooks/use-realtime";
import type { DateIdea } from "@/types";

export function useDates() {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [dates, setDates] = useState<DateIdea[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDates = useCallback(async () => {
    if (!couple) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("date_ideas")
        .select("*")
        .order("created_at", { ascending: false });
      setDates((data as DateIdea[] | null) ?? []);
    } catch (err) {
      console.error("[dates] fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [couple]);

  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  useRealtimeRefetch(couple?.id ?? null, ["date_ideas"], fetchDates);

  const addDate = async (d: Omit<DateIdea, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user || !couple) return;
    const { error } = await supabase
      .from("date_ideas")
      .insert({ ...d, user_id: user.id, couple_id: couple.id, created_by: user.id });
    if (error) throw new Error(error.message);
    await fetchDates();
  };

  const updateDate = async (id: string, updates: Partial<DateIdea>) => {
    const { error } = await supabase.from("date_ideas").update(updates).eq("id", id);
    if (error) throw new Error(error.message);
    await fetchDates();
  };

  const deleteDate = async (id: string) => {
    const { error } = await supabase.from("date_ideas").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await fetchDates();
  };

  return { dates, loading, addDate, updateDate, deleteDate, refetch: fetchDates };
}
