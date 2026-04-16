import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { Letter, LetterMood } from "@/types";

export function useLetters() {
  const { user } = useAuth();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("letters")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setLetters((data as Letter[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const createLetter = useCallback(
    async (input: {
      title: string;
      body: string;
      author?: string | null;
      recipient?: string | null;
      mood?: LetterMood;
    }): Promise<Letter> => {
      if (!user) throw new Error("Não autenticado");
      const payload = {
        user_id: user.id,
        title: input.title.trim(),
        body: input.body,
        author: input.author?.trim() || null,
        recipient: input.recipient?.trim() || null,
        mood: input.mood ?? "amor",
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
    [user]
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
