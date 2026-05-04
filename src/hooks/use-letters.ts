import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useCouple } from "@/hooks/use-couple";
import { useRealtimeRefetch } from "@/hooks/use-realtime";
import type { Letter, LetterMood } from "@/types";

export function useLetters() {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!couple) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("letters")
        .select("*")
        .order("created_at", { ascending: false });
      setLetters((data as Letter[] | null) ?? []);
    } catch (err) {
      console.error("[letters] fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [couple]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useRealtimeRefetch(couple?.id ?? null, ["letters"], fetch);

  const createLetter = useCallback(
    async (input: {
      title: string;
      body: string;
      author?: string | null;
      recipient?: string | null;
      mood?: LetterMood;
      unlock_at?: string | null;
    }): Promise<Letter> => {
      if (!user || !couple) throw new Error("Não autenticado");
      const payload = {
        user_id: user.id,
        couple_id: couple.id,
        created_by: user.id,
        title: input.title.trim(),
        body: input.body,
        author: input.author?.trim() || null,
        recipient: input.recipient?.trim() || null,
        mood: input.mood ?? "amor",
        unlock_at: input.unlock_at ?? null,
      };
      const { data, error } = await supabase
        .from("letters")
        .insert(payload)
        .select()
        .single();
      if (error) throw new Error(error.message);
      const row = data as Letter;
      setLetters((prev) => [row, ...prev]);
      return row;
    },
    [user, couple]
  );

  const updateLetter = useCallback(
    async (id: string, updates: Partial<Letter>) => {
      const { error } = await supabase.from("letters").update(updates).eq("id", id);
      if (error) throw new Error(error.message);
      setLetters((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
      );
    },
    []
  );

  const deleteLetter = useCallback(async (id: string) => {
    const { error } = await supabase.from("letters").delete().eq("id", id);
    if (error) throw new Error(error.message);
    setLetters((prev) => prev.filter((l) => l.id !== id));
  }, []);

  return { letters, loading, createLetter, updateLetter, deleteLetter, refetch: fetch };
}
