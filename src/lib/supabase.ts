import { createClient } from "@supabase/supabase-js";
import { authStorage, AUTH_STORAGE_KEY, clearAuthStorage } from "@/lib/auth-storage";
import { recordRecentInsert, TRACKED_TABLES } from "@/lib/recent-inserts";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Check .env.local for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

/**
 * Wraps fetch so we can detect a dead session globally. When a REST /
 * Storage call comes back 401 with a PostgREST "JWT expired" /
 * "PGRST301" body (or similar), we nuke the local auth state and send
 * the user back to /login instead of showing empty data.
 *
 * This guards against the worst UX we hit: proxy switch invalidated the
 * refresh token, queries kept running with a stale JWT, every hook's
 * try/catch swallowed the error, the user saw "nothing's here" with no
 * explanation.
 */
let recoveryInFlight = false;

async function handleBrokenSession() {
  if (recoveryInFlight) return;
  recoveryInFlight = true;
  try {
    clearAuthStorage();
    if (typeof window !== "undefined" && window.location.pathname !== "/organizai/login") {
      // Give any in-flight React state a tick, then hard-redirect.
      setTimeout(() => {
        window.location.href = "/organizai/login";
      }, 100);
    }
  } catch {
    // ignore
  }
}

function isJwtFailure(bodyText: string): boolean {
  if (!bodyText) return false;
  return (
    bodyText.includes("JWT expired") ||
    bodyText.includes("invalid JWT") ||
    bodyText.includes("PGRST301") ||
    bodyText.includes('"code":"PGRST301"') ||
    bodyText.includes("JWSError")
  );
}

/**
 * After a successful POST insert to /rest/v1/<table>, record the inserted
 * row id(s) in IndexedDB so the Service Worker can suppress the matching
 * push notification (the one we ourselves triggered).
 */
async function trackInsertResponse(url: string, res: Response): Promise<void> {
  try {
    const m = url.match(/\/rest\/v1\/([^?\/]+)/);
    const table = m?.[1];
    if (!table || !TRACKED_TABLES.has(table)) return;
    const text = await res.clone().text();
    if (!text) return;
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return;
    }
    const rows = Array.isArray(data) ? data : [data];
    for (const row of rows) {
      const id = (row as { id?: string } | null)?.id;
      if (typeof id === "string" && id) {
        void recordRecentInsert(table, id);
      }
    }
  } catch {
    /* never throw from a side effect */
  }
}

const customFetch: typeof fetch = async (input, init) => {
  const res = await fetch(input, init);
  const url = typeof input === "string" ? input : (input as Request).url;
  const method = (init?.method ?? "GET").toUpperCase();

  // 401 → broken session
  if (url && url.startsWith(supabaseUrl) && res.status === 401) {
    try {
      const clone = res.clone();
      const text = await clone.text();
      if (isJwtFailure(text)) {
        void handleBrokenSession();
      }
    } catch {
      /* ignore */
    }
  }

  // Successful insert → mark in IDB for SW suppression
  if (
    res.ok &&
    method === "POST" &&
    url &&
    url.startsWith(supabaseUrl) &&
    url.includes("/rest/v1/")
  ) {
    void trackInsertResponse(url, res);
  }

  return res;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    storageKey: AUTH_STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: customFetch,
  },
});
