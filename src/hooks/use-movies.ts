import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { Movie } from "@/types";

export function useMovies() {
  const { user } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMovies = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("movies")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setMovies((data as Movie[] | null) ?? []);
    } catch (err) {
      console.error("[movies] fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const addMovie = async (movie: Omit<Movie, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return;
    const { error } = await supabase.from("movies").insert({ ...movie, user_id: user.id });
    if (error) throw new Error(error.message);
    await fetchMovies();
  };

  const updateMovie = async (id: string, updates: Partial<Movie>) => {
    const { error } = await supabase.from("movies").update(updates).eq("id", id);
    if (error) throw new Error(error.message);
    await fetchMovies();
  };

  const deleteMovie = async (id: string) => {
    const { error } = await supabase.from("movies").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await fetchMovies();
  };

  return { movies, loading, addMovie, updateMovie, deleteMovie, refetch: fetchMovies };
}
