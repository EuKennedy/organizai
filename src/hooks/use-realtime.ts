import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Subscribe to postgres realtime changes on a list of tables, scoped to the
 * current couple. On any insert/update/delete, calls `refetch`.
 *
 * Pass `null` for coupleId to skip the subscription (e.g. while loading).
 */
export function useRealtimeRefetch(
  coupleId: string | null,
  tables: string[],
  refetch: () => void
) {
  useEffect(() => {
    if (!coupleId) return;
    const channel = supabase.channel(`couple-data:${coupleId}:${tables.join(",")}`);
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
    // we intentionally only resubscribe when the couple or table list changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId, tables.join(",")]);
}
