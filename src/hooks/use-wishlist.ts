import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import {
  DEFAULT_WISHLIST_CATEGORIES,
  DEFAULT_WISHLIST_CATEGORY_MAP,
  UNKNOWN_WISHLIST_CATEGORY,
  slugifyCategory,
  type WishlistItem,
  type WishlistCategoryDef,
  type WishlistCustomCategoryRow,
} from "@/types";

export function useWishlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [customs, setCustoms] = useState<WishlistCustomCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        supabase
          .from("wishlist_items")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("wishlist_categories")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
      ]);
      setItems((itemsRes.data as WishlistItem[] | null) ?? []);
      setCustoms((catsRes.data as WishlistCustomCategoryRow[] | null) ?? []);
    } catch (err) {
      console.error("[wishlist] fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const categories: WishlistCategoryDef[] = useMemo(
    () => [
      ...DEFAULT_WISHLIST_CATEGORIES,
      ...customs.map<WishlistCategoryDef>((c) => ({
        value: c.value,
        label: c.label,
        emoji: c.emoji,
        custom: true,
      })),
    ],
    [customs]
  );

  const categoryMap: Record<string, WishlistCategoryDef> = useMemo(() => {
    const map: Record<string, WishlistCategoryDef> = {
      ...DEFAULT_WISHLIST_CATEGORY_MAP,
    };
    for (const c of customs) {
      map[c.value] = {
        value: c.value,
        label: c.label,
        emoji: c.emoji,
        custom: true,
      };
    }
    return map;
  }, [customs]);

  const getCategory = useCallback(
    (value: string): WishlistCategoryDef =>
      categoryMap[value] ?? { ...UNKNOWN_WISHLIST_CATEGORY, value },
    [categoryMap]
  );

  const addItem = async (
    input: Omit<WishlistItem, "id" | "user_id" | "created_at" | "updated_at">
  ) => {
    if (!user) return;
    const { error } = await supabase
      .from("wishlist_items")
      .insert({ ...input, user_id: user.id });
    if (error) throw new Error(error.message);
    await fetchAll();
  };

  const updateItem = async (id: string, updates: Partial<WishlistItem>) => {
    const { error } = await supabase
      .from("wishlist_items")
      .update(updates)
      .eq("id", id);
    if (error) throw new Error(error.message);
    await fetchAll();
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("wishlist_items").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await fetchAll();
  };

  const createCategory = async (
    label: string,
    emoji: string
  ): Promise<WishlistCategoryDef> => {
    if (!user) throw new Error("Não autenticado");
    const cleanLabel = label.trim();
    const cleanEmoji = emoji.trim() || "🛒";
    if (!cleanLabel) throw new Error("Nome da categoria é obrigatório");

    let base = slugifyCategory(cleanLabel);
    if (!base) base = `cat_${Date.now().toString(36)}`;

    const taken = new Set([
      ...DEFAULT_WISHLIST_CATEGORIES.map((c) => c.value),
      ...customs.map((c) => c.value),
    ]);
    let value = base;
    let i = 2;
    while (taken.has(value)) value = `${base}_${i++}`;

    const { data, error } = await supabase
      .from("wishlist_categories")
      .insert({ user_id: user.id, value, label: cleanLabel, emoji: cleanEmoji })
      .select()
      .single();
    if (error) throw new Error(error.message);
    const row = data as WishlistCustomCategoryRow;
    setCustoms((prev) => [...prev, row]);
    return { value: row.value, label: row.label, emoji: row.emoji, custom: true };
  };

  return {
    items,
    categories,
    categoryMap,
    loading,
    addItem,
    updateItem,
    deleteItem,
    getCategory,
    createCategory,
    refetch: fetchAll,
  };
}
