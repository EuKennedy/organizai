/**
 * Local "I just added this" registry, persisted in IndexedDB.
 *
 * Why: when you and your partner share the same account, the Edge Function
 * can't tell which device created a row. So instead of filtering server-side,
 * each device records every insert it makes in a small IDB store. When a
 * push notification arrives, the Service Worker checks if the {table, id}
 * is in this store with a recent timestamp — if yes, suppress (it's a self
 * notification). The OTHER device never wrote that key, so it sees nothing
 * in IDB and shows the notification normally.
 *
 * Both the page (window) context and the Service Worker context can open
 * the same IDB. This file is imported by both — keep dependencies minimal.
 */

const DB_NAME = "organizai-meta";
const DB_VERSION = 1;
const STORE = "recent_inserts";
/** Suppression window — pushes for keys recorded within this many ms are dropped. */
const TTL_MS = 90 * 1000; // 90s
/** Soft cap on entries to keep IDB tidy. */
const MAX_ENTRIES = 500;

interface RecentEntry {
  key: string;
  ts: number;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const dbInstance = req.result;
      if (!dbInstance.objectStoreNames.contains(STORE)) {
        const os = dbInstance.createObjectStore(STORE, { keyPath: "key" });
        os.createIndex("ts", "ts", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbFor(table: string, id: string): string {
  return `${table}:${id}`;
}

/** Mark a row as "I made this" so the SW can suppress its push. */
export async function recordRecentInsert(
  table: string,
  id: string
): Promise<void> {
  if (typeof indexedDB === "undefined" || !table || !id) return;
  try {
    const conn = await open();
    await new Promise<void>((resolve, reject) => {
      const tx = conn.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({
        key: idbFor(table, id),
        ts: Date.now(),
      } as RecentEntry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    // best-effort cleanup of old / overflow entries
    void cleanup(conn).catch(() => void 0);
    conn.close();
  } catch {
    /* swallow — IDB issues shouldn't block the user */
  }
}

/** Returns true iff this {table, id} was recorded as a self-insert recently. */
export async function isRecentSelfInsert(
  table: string,
  id: string
): Promise<boolean> {
  if (typeof indexedDB === "undefined" || !table || !id) return false;
  try {
    const conn = await open();
    const result = await new Promise<RecentEntry | undefined>((resolve, reject) => {
      const tx = conn.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(idbFor(table, id));
      req.onsuccess = () => resolve(req.result as RecentEntry | undefined);
      req.onerror = () => reject(req.error);
    });
    conn.close();
    if (!result) return false;
    return Date.now() - result.ts < TTL_MS;
  } catch {
    return false;
  }
}

async function cleanup(conn: IDBDatabase): Promise<void> {
  const cutoff = Date.now() - TTL_MS;
  return new Promise<void>((resolve) => {
    const tx = conn.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const idx = store.index("ts");
    const range = IDBKeyRange.upperBound(cutoff);
    const cursor = idx.openCursor(range);
    let count = 0;
    cursor.onsuccess = () => {
      const c = cursor.result;
      if (c) {
        c.delete();
        count++;
        c.continue();
      } else {
        // also enforce MAX_ENTRIES (best effort)
        const countReq = store.count();
        countReq.onsuccess = () => {
          const total = countReq.result - count;
          if (total > MAX_ENTRIES) {
            const overflow = total - MAX_ENTRIES;
            const oldest = store.index("ts").openCursor();
            let removed = 0;
            oldest.onsuccess = () => {
              const oc = oldest.result;
              if (oc && removed < overflow) {
                oc.delete();
                removed++;
                oc.continue();
              } else {
                resolve();
              }
            };
            oldest.onerror = () => resolve();
          } else {
            resolve();
          }
        };
        countReq.onerror = () => resolve();
      }
    };
    cursor.onerror = () => resolve();
  });
}

/**
 * Tables we care about for push suppression. URL pathname inserts that match
 * these are recorded automatically by the supabase fetch interceptor.
 */
export const TRACKED_TABLES = new Set([
  "movies",
  "series",
  "date_ideas",
  "transactions",
  "financial_goals",
  "goal_deposits",
  "mimos",
  "mimo_categories",
  "gallery_albums",
  "gallery_photos",
  "letters",
  "wishlist_items",
  "wishlist_categories",
  "baby_names",
]);
