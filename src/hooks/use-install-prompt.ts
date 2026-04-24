import { useCallback, useEffect, useState } from "react";

/**
 * Shared PWA install logic used by the login page CTA and the sidebar
 * footer item. Encapsulates:
 *
 * - `beforeinstallprompt` capture (Chrome / Android / desktop),
 * - iOS-Safari fallback (event isn't fired there — we instead open a
 *   bottom-sheet with "Compartilhar → Adicionar à Tela de Início" steps),
 * - standalone detection (if already installed, never show the button),
 * - 14-day localStorage dismissal so the user isn't nagged.
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
  const ios = (window.navigator as { standalone?: boolean }).standalone;
  return ios === true;
}

function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

function isIOSSafari(): boolean {
  if (!isIOSDevice()) return false;
  const ua = navigator.userAgent;
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

export interface UseInstallPromptState {
  /** Button is worth rendering (installable + not dismissed + not already installed). */
  canInstall: boolean;
  /** True when we need to show iOS steps instead of firing a real prompt. */
  needsIOSInstructions: boolean;
  /** Opens the install flow — native prompt on Chrome, iOS sheet on Safari. */
  install: () => Promise<void>;
  /** Snooze for 14 days and hide the button. */
  dismiss: () => void;
  /** Close the iOS bottom sheet. */
  closeIOSSheet: () => void;
  /** Is the iOS instructions sheet currently open? */
  iosSheetOpen: boolean;
}

export function useInstallPrompt(): UseInstallPromptState {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosAvailable, setIosAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [iosSheetOpen, setIosSheetOpen] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    setDismissed(recentlyDismissed());

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    const onInstalled = () => {
      setInstalled(true);
      setEvt(null);
    };
    window.addEventListener("appinstalled", onInstalled);

    // If we're on iOS Safari and the user isn't already standalone,
    // we can offer the instruction-based install flow.
    if (isIOSSafari()) {
      setIosAvailable(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const canInstall = !installed && !dismissed && (!!evt || iosAvailable);
  const needsIOSInstructions = !evt && iosAvailable;

  const install = useCallback(async () => {
    if (evt) {
      await evt.prompt();
      const choice = await evt.userChoice;
      if (choice.outcome === "dismissed") {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setDismissed(true);
      }
      setEvt(null);
      return;
    }
    if (iosAvailable) {
      setIosSheetOpen(true);
    }
  }, [evt, iosAvailable]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setDismissed(true);
    setIosSheetOpen(false);
  }, []);

  const closeIOSSheet = useCallback(() => setIosSheetOpen(false), []);

  return {
    canInstall,
    needsIOSInstructions,
    install,
    dismiss,
    closeIOSSheet,
    iosSheetOpen,
  };
}
