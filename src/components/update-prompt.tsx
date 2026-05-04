import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, X } from "lucide-react";

/**
 * Floating "new version available" pill — appears bottom-right when the
 * service worker detects an update. Click to apply (reloads the page on
 * the new SW). Also exposes:
 *
 *   - window.__organizaiCheckForUpdate(): fired by the manual button
 *   - window.__organizaiAppVersion: build timestamp (e.g. "2026-05-04 14:32")
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      // Hourly silent check for new SW (catches updates while app stays open).
      const interval = 60 * 60 * 1000;
      setInterval(() => {
        registration.update().catch(() => void 0);
      }, interval);
    },
  });

  // Expose a manual "force check" hook for the Settings page button.
  useEffect(() => {
    (
      window as unknown as { __organizaiCheckForUpdate?: () => Promise<boolean> }
    ).__organizaiCheckForUpdate = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return false;
        await reg.update();
        return reg.waiting !== null || reg.installing !== null;
      } catch {
        return false;
      }
    };
    (window as unknown as { __organizaiAppVersion?: string }).__organizaiAppVersion =
      __APP_VERSION__;
  }, []);

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: "spring", damping: 24, stiffness: 320 }}
          className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="relative flex items-center gap-3 overflow-hidden rounded-full border border-primary/30 bg-card/95 px-4 py-2.5 pr-2 shadow-2xl shadow-primary/20 backdrop-blur-xl ring-1 ring-white/5">
            <div className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-r from-primary/20 via-transparent to-transparent opacity-60" />
            <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
            </div>
            <div className="relative flex flex-col gap-0">
              <p className="text-[13px] font-semibold tracking-tight text-foreground">
                Nova versão disponível
              </p>
              <p className="text-[10.5px] text-muted-foreground">
                Toque pra atualizar
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateServiceWorker(true)}
              className="relative ml-1 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-95"
            >
              <RefreshCw className="h-3 w-3" strokeWidth={2.5} />
              Atualizar
            </button>
            <button
              type="button"
              onClick={() => setNeedRefresh(false)}
              aria-label="Fechar"
              className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
