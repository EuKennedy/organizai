import { useEffect, useId, useRef } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Subscribe to postgres realtime changes on a list of tables, scoped to the
 * current couple. On any insert/update/delete, calls `refetch`.
 *
 * Each hook call uses a UNIQUE channel name (instanceId + useId fallback),
 * because supabase.channel(name) returns the SAME channel reference for the
 * same name — and once that channel is `.subscribe()`d, calling `.on()` on
 * it again throws:
 *   "cannot add `postgres_changes` callbacks ... after subscribe()"
 *
 * That happens whenever a hook like useMimoCategories is mounted in more
 * than one place at once (e.g. MimosPage + two instances of MimoDetailModal).
 *
 * Pass `null` for coupleId to skip the subscription (e.g. while loading).
 */
export function useRealtimeRefetch(
  coupleId: string | null,
  tables: string[],
  refetch: () => void
) {
  const reactId = useId();
  const instanceRef = useRef<string | null>(null);
  if (instanceRef.current === null) {
    instanceRef.current =
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).slice(2, 10));
  }

  useEffect(() => {
    if (!coupleId) return;

    const channelName = `rt:${coupleId}:${tables.join(",")}:${reactId}:${instanceRef.current}`;
    const channel = supabase.channel(channelName);
    for (const t of tables) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (channel as any).on(
        "postgres_changes",
        { event: "*", schema: "public", table: t, filter: `couple_id=eq.${coupleId}` },
        () => refetch()
      );
    }
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // We resubscribe only when couple or table list changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId, tables.join(",")]);
}
