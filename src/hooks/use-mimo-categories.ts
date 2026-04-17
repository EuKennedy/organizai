import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import {
  DEFAULT_MIMO_CATEGORIES,
  DEFAULT_MIMO_CATEGORY_MAP,
  UNKNOWN_MIMO_CATEGORY,
  slugifyCategory,
  type MimoCategoryDef,
  type MimoCustomCategoryRow,
} from "@/types";

/**
 * Combines built-in default categories with user-created custom categories.
 * Customs are stored in `public.mimo_categories` with RLS.
 */
export function useMimoCategories() {
  const { user } = useAuth();
  const [customs, setCustoms] = useState<MimoCustomCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustoms = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("mimo_categories")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      setCustoms((data as MimoCustomCategoryRow[] | null) ?? []);
    } catch (err) {
      console.error("[mimo-categories] fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCustoms();
  }, [fetchCustoms]);

  const categories: MimoCategoryDef[] = useMemo(() => {
    return [
      ...DEFAULT_MIMO_CATEGORIES,
      ...customs.map<MimoCategoryDef>((c) => ({
        value: c.value,
        label: c.label,
        emoji: c.emoji,
        custom: true,
      })),
    ];
  }, [customs]);

  const categoryMap: Record<string, MimoCategoryDef> = useMemo(() => {
    const map: Record<string, MimoCategoryDef> = { ...DEFAULT_MIMO_CATEGORY_MAP };
    for (const c of customs) {
      map[c.value] = { value: c.value, label: c.label, emoji: c.emoji, custom: true };
    }
    return map;
  }, [customs]);

  const getCategory = useCallback(
    (value: string): MimoCategoryDef => categoryMap[value] ?? { ...UNKNOWN_MIMO_CATEGORY, value },
    [categoryMap]
  );

  const createCategory = useCallback(
    async (label: string, emoji: string): Promise<MimoCategoryDef> => {
      if (!user) throw new Error("Not authenticated");
      const cleanLabel = label.trim();
      const cleanEmoji = emoji.trim() || "✨";
      if (!cleanLabel) throw new Error("Nome da categoria é obrigatório");

      let base = slugifyCategory(cleanLabel);
      if (!base) base = `cat_${Date.now().toString(36)}`;

      // Ensure uniqueness against defaults + existing customs
      const taken = new Set<string>([
        ...DEFAULT_MIMO_CATEGORIES.map((c) => c.value),
        ...customs.map((c) => c.value),
      ]);
      let value = base;
      let i = 2;
      while (taken.has(value)) {
        value = `${base}_${i++}`;
      }

      const { data, error } = await supabase
        .from("mimo_categories")
        .insert({ user_id: user.id, value, label: cleanLabel, emoji: cleanEmoji })
        .select()
        .single();
      if (error) throw new Error(error.message);

      const row = data as MimoCustomCategoryRow;
      setCustoms((prev) => [...prev, row]);
      return { value: row.value, label: row.label, emoji: row.emoji, custom: true };
    },
    [user, customs]
  );

  return {
    categories,
    categoryMap,
    customs,
    loading,
    getCategory,
    createCategory,
    refetch: fetchCustoms,
  };
}
