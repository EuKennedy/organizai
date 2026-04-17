import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, AlertTriangle, XCircle, Loader2, Copy, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { runDiagnostics, environmentSnapshot, type CheckResult } from "@/lib/diagnostics";
import { cn } from "@/lib/utils";

interface DiagnosticsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function DiagnosticsDialog({ open, onClose }: DiagnosticsDialogProps) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<CheckResult[] | null>(null);

  useEffect(() => {
    if (open && !running && !results) {
      run();
    }
    if (!open) {
      // Reset when dialog closes
      setResults(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const run = async () => {
    setRunning(true);
    setResults(null);
    const r = await runDiagnostics();
    setResults(r);
    setRunning(false);
  };

  const copyReport = async () => {
    const lines: string[] = [];
    lines.push("=== OrganizAI Diagnóstico ===");
    lines.push(`Data: ${new Date().toISOString()}`);
    lines.push("");
    const env = environmentSnapshot();
    for (const [k, v] of Object.entries(env)) {
      lines.push(`${k}: ${v}`);
    }
    lines.push("");
    lines.push("--- Checks ---");
    (results ?? []).forEach((r) => {
      lines.push(`[${r.status.toUpperCase()}] ${r.label}: ${r.detail}`);
      if (r.suggestion) lines.push(`  → ${r.suggestion}`);
    });
    const txt = lines.join("\n");
    try {
      await navigator.clipboard.writeText(txt);
      toast.success("Relatório copiado");
    } catch {
      // Fallback: show in a textarea-ish dialog
      toast.error("Não consegui copiar automaticamente");
      console.log(txt);
    }
  };

  const hasFail = results?.some((r) => r.status === "fail");
  const hasWarn = results?.some((r) => r.status === "warn");

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="fixed inset-x-3 top-[4%] z-[60] mx-auto flex max-h-[92dvh] max-w-md flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl sm:inset-x-auto"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                  <Stethoscope className="h-4 w-4 text-primary" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-[14.5px] font-semibold tracking-tight">Diagnóstico</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Verificando o que está bloqueando o login…
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {running && !results && (
                <div className="flex flex-col items-center gap-3 py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-[13px] text-muted-foreground">Rodando testes…</p>
                </div>
              )}

              {results?.map((r) => (
                <CheckRow key={r.id} r={r} />
              ))}

              {results && !running && (
                <>
                  {hasFail && (
                    <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[12px] text-red-500">
                      Pelo menos um teste crítico falhou. Veja a sugestão do item marcado em
                      vermelho — geralmente é o que está bloqueando o login.
                    </div>
                  )}
                  {!hasFail && hasWarn && (
                    <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-[12px] text-amber-500">
                      Tem avisos menores mas a rede parece OK. Tente entrar de novo.
                    </div>
                  )}
                  {!hasFail && !hasWarn && (
                    <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-[12px] text-emerald-500">
                      Tudo funcional daqui. Se o login ainda travar, copie o relatório e me
                      envie — o problema é específico e eu consigo localizar pelo output.
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
              <button
                type="button"
                onClick={copyReport}
                disabled={running || !results}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                <Copy className="h-3 w-3" />
                Copiar relatório
              </button>
              <button
                type="button"
                onClick={run}
                disabled={running}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[12px] font-semibold text-primary-foreground transition-all hover:shadow-[0_0_20px_-5px_oklch(0.78_0.155_22/0.6)] disabled:opacity-50"
              >
                {running ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Stethoscope className="h-3 w-3" />
                )}
                Testar de novo
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CheckRow({ r }: { r: CheckResult }) {
  const tone = {
    ok: {
      icon: <Check className="h-3.5 w-3.5" strokeWidth={3} />,
      pill: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20",
    },
    warn: {
      icon: <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.5} />,
      pill: "bg-amber-500/10 text-amber-500 ring-amber-500/20",
    },
    fail: {
      icon: <XCircle className="h-3.5 w-3.5" strokeWidth={2.5} />,
      pill: "bg-red-500/10 text-red-500 ring-red-500/20",
    },
  }[r.status];

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-3">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1",
            tone.pill
          )}
        >
          {tone.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold">{r.label}</p>
          <p className="truncate text-[11px] text-muted-foreground">{r.detail}</p>
        </div>
      </div>
      {r.suggestion && r.status !== "ok" && (
        <p className="mt-2 rounded-xl bg-muted/40 p-2.5 text-[11px] leading-relaxed text-foreground/85">
          {r.suggestion}
        </p>
      )}
    </div>
  );
}
