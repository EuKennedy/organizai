import { useEffect, useState } from "react";
import { Download, Share, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Lightweight "install this app" nudge.
 *
 * Browsers emit `beforeinstallprompt` on Android Chrome / desktop Chrome
 * when the PWA is installable and the user hasn't installed yet. We stash
 * the event, render a CTA, and call `.prompt()` on click.
 *
 * iOS Safari does NOT expose `beforeinstallprompt`. We detect the iOS
 * + Safari combo and show a small instructions sheet instead telling the
 * user to tap Share → "Adicionar à Tela de Início".
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "organizai-install-dismissed-at";
const HIDE_DURATION_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS legacy
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone;
  return iosStandalone === true;
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

function isIOSSafari(): boolean {
  if (!isIOS()) return false;
  const ua = navigator.userAgent;
  // Exclude Chrome (CriOS), Firefox (FxiOS), Edge (EdgiOS) on iOS
  return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

function recentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = parseInt(raw, 10);
    if (Number.isNaN(at)) return false;
    return Date.now() - at < HIDE_DURATION_MS;
  } catch {
    return false;
  }
}

function markDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosSheetOpen, setIosSheetOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // already installed
    if (recentlyDismissed()) return;

    // Chrome / Android / desktop: real install prompt available.
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS Safari: no event fires; show our own helper button.
    if (isIOSSafari()) {
      // Small delay so the login form renders first.
      const t = setTimeout(() => setVisible(true), 800);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  if (!visible) return null;

  const handleInstall = async () => {
    if (evt) {
      await evt.prompt();
      const choice = await evt.userChoice;
      if (choice.outcome === "dismissed") markDismissed();
      setEvt(null);
      setVisible(false);
      return;
    }
    // iOS path: show instructions sheet.
    setIosSheetOpen(true);
  };

  const handleDismiss = () => {
    markDismissed();
    setVisible(false);
    setIosSheetOpen(false);
  };

  return (
    <>
      <div className="mx-auto mt-3 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={handleInstall}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-[11.5px] font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          <Download className="h-3 w-3" />
          Instalar no celular
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-full px-2 py-1 text-[10.5px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
        >
          agora não
        </button>
      </div>

      {/* iOS install instructions bottom sheet */}
      <AnimatePresence>
        {iosSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-md"
              onClick={() => setIosSheetOpen(false)}
            />
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+16px)] z-[70] mx-auto max-w-sm rounded-3xl border border-border bg-card p-5 shadow-2xl sm:inset-x-auto"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25">
                  <Download className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold tracking-tight">
                    Instalar no iPhone
                  </p>
                  <p className="text-[11.5px] text-muted-foreground">
                    Pra ficar como app na tela inicial.
                  </p>
                </div>
              </div>

              <ol className="space-y-2.5">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                    1
                  </span>
                  <p className="text-[13px] leading-snug text-foreground/90">
                    Toque em{" "}
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold">
                      <Share className="h-3 w-3" /> Compartilhar
                    </span>{" "}
                    no Safari (ícone no rodapé).
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                    2
                  </span>
                  <p className="text-[13px] leading-snug text-foreground/90">
                    Role e toque em{" "}
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold">
                      <Plus className="h-3 w-3" /> Adicionar à Tela de Início
                    </span>
                    .
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                    3
                  </span>
                  <p className="text-[13px] leading-snug text-foreground/90">
                    Confirme em{" "}
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold">
                      Adicionar
                    </span>
                    . O ícone do OrganizAI aparece na home como app nativo.
                  </p>
                </li>
              </ol>

              <button
                onClick={() => setIosSheetOpen(false)}
                className="mt-5 w-full rounded-full bg-primary py-2.5 text-[13px] font-semibold text-primary-foreground"
              >
                Entendi
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
