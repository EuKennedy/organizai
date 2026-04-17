/**
 * Auth storage hardened against Safari / WebKit edge cases.
 *
 * Why this exists: Safari on iOS is aggressive with ITP (Intelligent
 * Tracking Prevention). It can put localStorage into a state where
 * reads succeed but return stale/corrupt data, or writes throw
 * QuotaExceededError under 7-day tracking rules. The default Supabase
 * client throws on those paths, which is what produces the 'Load
 * failed' / infinite login loop users hit after the app has been
 * sitting unused for a while.
 *
 * This wrapper:
 * - Sandboxes auth keys under a single prefix so a full nuclear reset
 *   only clears auth (photos/albums cache etc. stay intact).
 * - Catches every storage error so a broken backend never throws into
 *   Supabase's auth pipeline.
 * - Exposes `clearAuthStorage()` so the UI can offer a recovery path.
 */

const AUTH_STORAGE_KEY = "organizai-auth";

function safeLocalStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const ls = window.localStorage;
    // Trigger any SecurityError early (Safari Private mode, etc).
    const probe = "__organizai_probe__";
    ls.setItem(probe, "1");
    ls.removeItem(probe);
    return ls;
  } catch {
    return null;
  }
}

const memoryStore = new Map<string, string>();

export const authStorage = {
  getItem(key: string): string | null {
    try {
      const ls = safeLocalStorage();
      if (ls) {
        const v = ls.getItem(key);
        if (v !== null) return v;
      }
    } catch (err) {
      console.warn("[auth-storage] getItem failed, using memory", err);
    }
    return memoryStore.get(key) ?? null;
  },

  setItem(key: string, value: string): void {
    try {
      const ls = safeLocalStorage();
      if (ls) {
        ls.setItem(key, value);
        return;
      }
    } catch (err) {
      console.warn("[auth-storage] setItem failed, using memory", err);
    }
    memoryStore.set(key, value);
  },

  removeItem(key: string): void {
    try {
      const ls = safeLocalStorage();
      if (ls) ls.removeItem(key);
    } catch (err) {
      console.warn("[auth-storage] removeItem failed", err);
    }
    memoryStore.delete(key);
  },
};

export { AUTH_STORAGE_KEY };

/**
 * Nuke every piece of auth state. Used when the app detects a stuck
 * session (watchdog timeout, or user-triggered "Limpar e tentar de
 * novo" action). Safe to call from anywhere.
 */
export function clearAuthStorage(): void {
  try {
    const ls = safeLocalStorage();
    if (ls) {
      // Clear our own storage key
      ls.removeItem(AUTH_STORAGE_KEY);
      // Legacy sb- prefixed keys (older Supabase client versions)
      const toRemove: string[] = [];
      for (let i = 0; i < ls.length; i++) {
        const k = ls.key(i);
        if (k && (k.startsWith("sb-") || k.startsWith("supabase."))) {
          toRemove.push(k);
        }
      }
      toRemove.forEach((k) => ls.removeItem(k));
    }
  } catch (err) {
    console.warn("[auth-storage] clear failed", err);
  }
  memoryStore.clear();
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.clear();
    }
  } catch {
    // ignore
  }
}
