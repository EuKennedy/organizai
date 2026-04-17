import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { DateIdea } from "@/types";

export function useDates() {
  const { user } = useAuth();
  const [dates, setDates] = useState<DateIdea[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDates = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("date_ideas")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setDates((data as DateIdea[] | null) ?? []);
    } catch (err) {
      console.error("[dates] fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  const addDate = async (d: Omit<DateIdea, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return;
    const { error } = await supabase.from("date_ideas").insert({ ...d, user_id: user.id });
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
