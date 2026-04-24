import { Download, Share, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

/**
 * Login-page CTA. Shows a subtle "Instalar no celular" chip below the
 * "ORGANIZAI · VIDA A DOIS" footer when installable, plus the iOS
 * instructions sheet that's shared with any other entry point (sidebar,
 * header, etc.) through the useInstallPrompt hook.
 */
export function InstallPrompt() {
  const { canInstall, install, dismiss, iosSheetOpen, closeIOSSheet } =
    useInstallPrompt();

  if (!canInstall && !iosSheetOpen) return null;

  return (
    <>
      {canInstall && (
        <div className="mx-auto mt-3 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={install}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-[11.5px] font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <Download className="h-3 w-3" />
            Instalar no celular
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full px-2 py-1 text-[10.5px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
          >
            agora não
          </button>
        </div>
      )}

      <IOSInstallSheet open={iosSheetOpen} onClose={closeIOSSheet} />
    </>
  );
}

/**
 * Shared iOS-specific bottom sheet. Exported so the sidebar variant can
 * hook into the same hook and reuse this dialog.
 */
export function IOSInstallSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-md"
            onClick={onClose}
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
              onClick={onClose}
              className="mt-5 w-full rounded-full bg-primary py-2.5 text-[13px] font-semibold text-primary-foreground"
            >
              Entendi
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Compact sidebar row that matches the "Modo claro" / "Sair" items
 * pattern. Hidden when the app is already installed or the user
 * dismissed for 14 days.
 */
export function InstallButton({ className }: { className?: string }) {
  const { canInstall, install, iosSheetOpen, closeIOSSheet } =
    useInstallPrompt();

  return (
    <>
      {canInstall && (
        <button
          onClick={install}
          className={
            className ??
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-primary transition-colors hover:bg-sidebar-accent/60"
          }
        >
          <Download className="h-[17px] w-[17px]" strokeWidth={1.75} />
          Instalar app
        </button>
      )}

      <IOSInstallSheet open={iosSheetOpen} onClose={closeIOSSheet} />
    </>
  );
}
