import { useState } from "react";
import {
  Plus,
  Target,
  Trash2,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  History,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useGoals } from "@/hooks/use-finance";
import { PageHero } from "@/components/page-hero";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { btnPrimary, btnPrimarySm } from "@/lib/ui";
import { cn } from "@/lib/utils";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Smart percent:
 * - 0 → "0%"
 * - (0, 1) → "0,4%" (don't claim progress is zero when it isn't)
 * - [1, 100] → "17%" (clean)
 * - >= 100 → "100%"
 */
function formatPct(pct: number): string {
  if (pct >= 100) return "100%";
  if (pct <= 0) return "0%";
  if (pct < 1) return `${pct.toFixed(1).replace(".", ",")}%`;
  if (pct < 10) return `${pct.toFixed(1).replace(".", ",")}%`;
  return `${Math.round(pct)}%`;
}

export function GoalsPage() {
  const {
    goals,
    depositsByGoal,
    loading,
    addGoal,
    deleteGoal,
    addDeposit,
    deleteDeposit,
  } = useGoals();

  const [createOpen, setCreateOpen] = useState(false);
  const [depositDraft, setDepositDraft] = useState<Record<string, string>>({});
  const [submittingDeposit, setSubmittingDeposit] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");

  const handleCreate = async () => {
    const target = parseFloat(goalTarget);
    if (!goalName.trim() || !target) return;
    try {
      await addGoal({ name: goalName.trim(), target_amount: target, current_amount: 0 });
      setCreateOpen(false);
      setGoalName("");
      setGoalTarget("");
      toast.success("Meta criada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  const handleDeposit = async (goalId: string) => {
    const raw = depositDraft[goalId];
    const amount = parseFloat(raw ?? "");
    if (!amount || amount <= 0) return;
    setSubmittingDeposit(goalId);
    try {
      await addDeposit(goalId, amount);
      setDepositDraft((prev) => ({ ...prev, [goalId]: "" }));
      toast.success(`${formatCurrency(amount)} depositado`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao depositar");
    } finally {
      setSubmittingDeposit(null);
    }
  };

  const handleRemoveDeposit = async (depositId: string) => {
    try {
      await deleteDeposit(depositId);
      toast.success("Depósito removido");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover");
    }
  };

  const handleDeleteGoal = async (goalId: string, hasDeposits: boolean) => {
    if (hasDeposits) {
      const ok = window.confirm(
        "Essa meta tem depósitos registrados. Excluir apaga tudo. Continuar?"
      );
      if (!ok) return;
    }
    try {
      await deleteGoal(goalId);
      toast.success("Meta removida");
    } catch {
      toast.error("Erro ao remover meta");
    }
  };

  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);
  const totalSaved = goals.reduce((s, g) => s + Number(g.current_amount), 0);
  const totalPct = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

  return (
    <>
      <PageHero
        eyebrow="Sonhos a dois"
        title={
          <>
            Metas <span className="font-serif italic text-primary">que viram reais</span>
          </>
        }
        subtitle={
          goals.length === 0
            ? "Crie metas financeiras e acompanhem juntos o progresso."
            : `${goals.length} ${goals.length === 1 ? "meta ativa" : "metas ativas"}`
        }
        ambient="gold"
        action={
          <button onClick={() => setCreateOpen(true)} className={btnPrimarySm}>
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Nova meta</span>
          </button>
        }
      />

      {/* Overview */}
      {goals.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/[0.04] p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Progresso geral
              </p>
              <p className="mt-2 text-4xl font-semibold tabular tracking-tight sm:text-5xl">
                {formatPct(totalPct)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Guardado
              </p>
              <p className="mt-0.5 text-sm font-semibold text-emerald-500 tabular">
                {formatCurrency(totalSaved)}
              </p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Meta total
              </p>
              <p className="mt-0.5 text-sm font-semibold tabular">{formatCurrency(totalTarget)}</p>
            </div>
          </div>
          <Progress value={totalPct} className="mt-5 h-2.5" />
        </div>
      )}

      {!loading && goals.length === 0 && (
        <EmptyState
          icon={Target}
          title="Nenhuma meta ainda"
          description="Defina um alvo e acompanhem o caminho juntos — com depósitos e celebrações."
          tone="gold"
          action={
            <button onClick={() => setCreateOpen(true)} className={btnPrimary}>
              <Plus className="h-4 w-4" />
              Criar meta
            </button>
          }
        />
      )}

      {/* Lista */}
      {goals.length > 0 && (
        <div className="mt-6 space-y-3">
          <AnimatePresence mode="popLayout">
            {goals.map((g) => {
              const deposits = depositsByGoal[g.id] ?? [];
              const pct =
                Number(g.target_amount) > 0
                  ? Math.min((Number(g.current_amount) / Number(g.target_amount)) * 100, 100)
                  : 0;
              const isExpanded = expandedId === g.id;
              const isComplete = pct >= 100;
              const draft = depositDraft[g.id] ?? "";
              const isSubmitting = submittingDeposit === g.id;

              return (
                <motion.div
                  key={g.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "overflow-hidden rounded-2xl border bg-card transition-colors",
                    isComplete ? "border-emerald-500/30" : "border-border"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : g.id)}
                    className="w-full p-4 text-left transition-colors hover:bg-muted/20 sm:p-5"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1",
                          isComplete
                            ? "bg-emerald-500/10 ring-emerald-500/20"
                            : "bg-primary/10 ring-primary/10"
                        )}
                      >
                        {isComplete ? (
                          <span className="text-xl">🎉</span>
                        ) : (
                          <Target className="h-5 w-5 text-primary" strokeWidth={2} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-[15px] font-semibold tracking-tight">
                            {g.name}
                          </h3>
                          {isComplete && (
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 ring-1 ring-emerald-500/20">
                              Concluída
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground tabular">
                          {formatCurrency(Number(g.current_amount))} de{" "}
                          {formatCurrency(Number(g.target_amount))}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-[15px] font-semibold tabular",
                            isComplete ? "text-emerald-500" : "text-primary"
                          )}
                        >
                          {formatPct(pct)}
                        </span>
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground/60"
                          aria-hidden="true"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Progress
                        value={pct}
                        className={cn("h-2", isComplete && "[&>div]:bg-emerald-500")}
                      />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-5 border-t border-border bg-background/30 px-4 py-4 sm:px-5 sm:py-5">
                          {/* Novo depósito */}
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                              Novo depósito
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                min="0"
                                placeholder="R$ 0,00"
                                value={draft}
                                onChange={(e) =>
                                  setDepositDraft((prev) => ({
                                    ...prev,
                                    [g.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleDeposit(g.id);
                                }}
                                disabled={isSubmitting || isComplete}
                                className="h-10 flex-1"
                              />
                              <button
                                onClick={() => handleDeposit(g.id)}
                                disabled={!draft || parseFloat(draft) <= 0 || isSubmitting || isComplete}
                                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 hover:shadow-md disabled:opacity-50 disabled:hover:bg-emerald-600"
                              >
                                <TrendingUp className="h-3.5 w-3.5" />
                                {isSubmitting ? "..." : "Depositar"}
                              </button>
                            </div>
                            <p className="text-[11px] text-muted-foreground tabular">
                              Falta{" "}
                              <span className="font-semibold text-foreground">
                                {formatCurrency(
                                  Math.max(
                                    Number(g.target_amount) - Number(g.current_amount),
                                    0
                                  )
                                )}
                              </span>{" "}
                              pra bater a meta.
                            </p>
                          </div>

                          {/* Histórico de depósitos */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                <History className="h-3 w-3" />
                                Histórico
                              </Label>
                              {deposits.length > 0 && (
                                <span className="text-[10px] text-muted-foreground tabular">
                                  {deposits.length}{" "}
                                  {deposits.length === 1 ? "depósito" : "depósitos"}
                                </span>
                              )}
                            </div>

                            {deposits.length === 0 ? (
                              <div className="rounded-xl border border-dashed border-border bg-background/40 px-4 py-5 text-center">
                                <p className="text-xs text-muted-foreground">
                                  Ainda sem depósitos. Registre o primeiro acima.
                                </p>
                              </div>
                            ) : (
                              <ul className="space-y-1.5">
                                <AnimatePresence initial={false}>
                                  {deposits.map((d) => (
                                    <motion.li
                                      key={d.id}
                                      layout
                                      initial={{ opacity: 0, y: 6 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                      transition={{ duration: 0.18 }}
                                      className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3.5 py-2.5"
                                    >
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                                        <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-[14px] font-semibold tabular">
                                          +{formatCurrency(Number(d.amount))}
                                        </p>
                                        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                          <Calendar className="h-3 w-3" />
                                          {format(parseISO(d.created_at), "dd MMM yyyy · HH:mm", {
                                            locale: ptBR,
                                          })}
                                          {d.note && (
                                            <span className="truncate">· {d.note}</span>
                                          )}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveDeposit(d.id)}
                                        aria-label="Remover depósito"
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-red-500/10 hover:text-red-500"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </motion.li>
                                  ))}
                                </AnimatePresence>
                              </ul>
                            )}
                          </div>

                          {/* Excluir meta */}
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => handleDeleteGoal(g.id, deposits.length > 0)}
                              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground/70 transition-colors hover:bg-red-500/10 hover:text-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                              Excluir meta
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome da meta</Label>
              <Input
                placeholder='Ex: "Viagem para o Nordeste"'
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Valor alvo (R$)</Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="3000,00"
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={!goalName.trim() || !goalTarget}
              className={cn(btnPrimary, "w-full")}
            >
              Criar meta
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
