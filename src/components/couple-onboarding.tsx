import { useEffect, useState } from "react";
import { Heart, X, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useCouple } from "@/hooks/use-couple";
import { Input } from "@/components/ui/input";
import { btnPrimary } from "@/lib/ui";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "organizai:couple-onboarding-dismissed-at";
const DISMISS_DAYS = 7;

/**
 * Soft onboarding nudge shown once per week to solo users:
 * "You're using OrganizAI alone — want to invite your partner?"
 */
export function CoupleOnboarding() {
  const { couple, isSolo, loading } = useCouple();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { createInvite } = useCouple();

  useEffect(() => {
    if (loading || !couple || !isSolo) {
      setOpen(false);
      return;
    }
    const last = localStorage.getItem(DISMISS_KEY);
    if (last) {
      const days = (Date.now() - Number(last)) / (1000 * 60 * 60 * 24);
      if (days < DISMISS_DAYS) return;
    }
    // Slight delay so it doesn't pop on first paint
    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, [couple, isSolo, loading]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setOpen(false);
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const c = await createInvite();
      setCode(c);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar convite");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            onClick={dismiss}
          />
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="fixed inset-x-3 top-[10%] z-50 mx-auto max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl sm:inset-x-auto"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-ambient-rose opacity-60" />
              <div className="relative px-6 pb-2 pt-7 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30 backdrop-blur-md">
                  <Heart className="h-6 w-6 text-primary" fill="currentColor" />
                </div>
                <h3 className="mt-4 font-serif text-2xl font-semibold tracking-tight">
                  Convide seu amor
                </h3>
                <p className="mx-auto mt-1.5 max-w-[28ch] text-[13px] text-muted-foreground">
                  OrganizAI é melhor a dois. Compartilhem filmes, fotos, mimos e tudo mais — em tempo real.
                </p>
              </div>
              <button
                onClick={dismiss}
                aria-label="Fechar"
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-muted/40 text-muted-foreground backdrop-blur-md transition-colors hover:bg-muted/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-6 pt-2">
              {!code ? (
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className={cn(btnPrimary, "w-full")}
                >
                  {creating ? "Gerando…" : "Gerar código de convite"}
                </button>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Compartilhe esse código
                    </p>
                    <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/50 p-3">
                      <Input
                        readOnly
                        value={code}
                        className="h-10 flex-1 border-0 bg-transparent text-center font-serif text-2xl font-semibold tabular tracking-[0.18em] focus-visible:ring-0"
                      />
                      <button
                        onClick={handleCopy}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all hover:bg-primary/20"
                        aria-label="Copiar"
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-center text-[11px] text-muted-foreground">
                    Válido por 14 dias. Quem usar este código entra no nosso casal.
                  </p>
                </>
              )}

              <button
                onClick={dismiss}
                className="block w-full text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Lembrar mais tarde
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
