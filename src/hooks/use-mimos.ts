import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { Mimo } from "@/types";

export function useMimos() {
  const { user } = useAuth();
  const [mimos, setMimos] = useState<Mimo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMimos = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("mimos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setMimos((data as Mimo[] | null) ?? []);
    } catch (err) {
      console.error("[mimos] fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMimos();
  }, [fetchMimos]);

  const addMimo = async (m: Omit<Mimo, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return;
    const { error } = await supabase.from("mimos").insert({ ...m, user_id: user.id });
    if (error) throw new Error(error.message);
    await fetchMimos();
  };

  const updateMimo = async (id: string, updates: Partial<Mimo>) => {
    const { error } = await supabase.from("mimos").update(updates).eq("id", id);
    if (error) throw new Error(error.message);
    await fetchMimos();
  };

  const deleteMimo = async (id: string) => {
    const { error } = await supabase.from("mimos").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await fetchMimos();
  };

  return { mimos, loading, addMimo, updateMimo, deleteMimo, refetch: fetchMimos };
}
