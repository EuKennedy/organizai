import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCouple } from "@/hooks/use-couple";
import { useRealtimeRefetch } from "@/hooks/use-realtime";
import type { ActivityKind, ActivityRow } from "@/lib/activity-message";

interface TableQuery {
  table: string;
  kind: ActivityKind;
  select: string;
  /** Build click-through URL */
  url: (row: Record<string, unknown>) => string;
  /** Use updated_at if present, else created_at */
  timestampField?: "created_at" | "updated_at";
}

const TABLES: TableQuery[] = [
  { table: "movies", kind: "movies", select: "id,title,status,created_at,updated_at,created_device", url: () => "/movies", timestampField: "updated_at" },
  { table: "series", kind: "series", select: "id,title,status,created_at,updated_at,created_device", url: () => "/series", timestampField: "updated_at" },
  { table: "date_ideas", kind: "date_ideas", select: "id,name,status,date_time,created_at,updated_at,created_device", url: () => "/dates", timestampField: "updated_at" },
  { table: "mimos", kind: "mimos", select: "id,name,brand,owned,finished,created_at,updated_at,created_device", url: () => "/mimos", timestampField: "updated_at" },
  { table: "wishlist_items", kind: "wishlist_items", select: "id,name,brand,status,price,created_at,updated_at,created_device", url: () => "/wishlist", timestampField: "updated_at" },
  { table: "baby_names", kind: "baby_names", select: "id,name,favorite,created_at,created_device", url: () => "/baby-names" },
  { table: "gallery_albums", kind: "gallery_albums", select: "id,name,created_at,updated_at,created_device", url: () => "/gallery", timestampField: "updated_at" },
  { table: "gallery_photos", kind: "gallery_photos", select: "id,album_id,caption,created_at,created_device", url: (r) => `/gallery/${(r as { album_id?: string }).album_id ?? ""}` },
  { table: "letters", kind: "letters", select: "id,title,unlock_at,created_at,updated_at,created_device", url: () => "/letters", timestampField: "updated_at" },
  { table: "transactions", kind: "transactions", select: "id,amount,category,type,date,created_at,created_device", url: () => "/expenses" },
  { table: "financial_goals", kind: "financial_goals", select: "id,name,created_at,updated_at,created_device", url: () => "/goals", timestampField: "updated_at" },
  { table: "goal_deposits", kind: "goal_deposits", select: "id,amount,goal_id,created_at,created_device", url: () => "/goals" },
];

const PER_TABLE_LIMIT = 8;
const FEED_LIMIT = 30;

/**
 * Pulls the most recent activity across all couple data tables and merges
 * into a single timeline feed sorted by ts desc. Subscribes to realtime
 * inserts/updates so the home feed updates live when the partner adds
 * something on their device.
 */
export function useActivityFeed() {
  const { couple } = useCouple();
  const [items, setItems] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!couple) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const results = await Promise.all(
        TABLES.map(async (cfg) => {
          const orderField = cfg.timestampField ?? "created_at";
          const { data } = await supabase
            .from(cfg.table)
            .select(cfg.select)
            .order(orderField, { ascending: false })
            .limit(PER_TABLE_LIMIT);
          if (!data) return [] as ActivityRow[];
          return (data as unknown as Record<string, unknown>[]).map<ActivityRow>((row) => ({
            id: String(row.id ?? ""),
            kind: cfg.kind,
            ts: String(row[orderField] ?? row.created_at ?? new Date().toISOString()),
            row,
            url: cfg.url(row),
          }));
        })
      );
      const merged = results
        .flat()
        .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
        .slice(0, FEED_LIMIT);
      setItems(merged);
    } catch (err) {
      console.error("[activity-feed] fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [couple]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Realtime: subscribe to ALL tracked tables. When anything changes in our
  // couple, refetch (cheap because PER_TABLE_LIMIT=8).
  useRealtimeRefetch(
    couple?.id ?? null,
    TABLES.map((t) => t.table),
    fetchAll
  );

  return { items, loading, refetch: fetchAll };
}
