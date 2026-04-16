import { useState } from "react";
import {
  Plus,
  Target,
  Trash2,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
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

export function GoalsPage() {
  const { goals, loading, addGoal, updateGoal, deleteGoal } = useGoals();
  const [createOpen, setCreateOpen] = useState(false);
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
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

  const handleDeposit = async () => {
    if (!depositGoalId || !depositAmount) return;
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;
    const goal = goals.find((g) => g.id === depositGoalId);
    if (!goal) return;
    const newAmount = Number(goal.current_amount) + amount;
    try {
      await updateGoal(depositGoalId, { current_amount: newAmount });
      setDepositGoalId(null);
      setDepositAmount("");
      toast.success(`${formatCurrency(amount)} depositado`);
    } catch {
      toast.error("Erro ao depositar");
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
                {totalPct.toFixed(0)}
                <span className="text-xl text-muted-foreground sm:text-2xl">%</span>
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
              const pct =
                Number(g.target_amount) > 0
                  ? Math.min((Number(g.current_amount) / Number(g.target_amount)) * 100, 100)
                  : 0;
              const isExpanded = expandedId === g.id;
              const isComplete = pct >= 100;

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
                  <div className="p-4 sm:p-5">
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
                          {pct.toFixed(0)}%
                        </span>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : g.id)}
                          aria-label={isExpanded ? "Fechar" : "Expandir"}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Progress
                        value={pct}
                        className={cn("h-2", isComplete && "[&>div]:bg-emerald-500")}
                      />
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border bg-background/30 px-4 py-4 sm:px-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            <div className="flex-1 space-y-1.5">
                              <Label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                Depositar valor
                              </Label>
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="R$ 0,00"
                                  value={depositGoalId === g.id ? depositAmount : ""}
                                  onFocus={() => setDepositGoalId(g.id)}
                                  onChange={(e) => {
                                    setDepositGoalId(g.id);
                                    setDepositAmount(e.target.value);
                                  }}
                                  className="h-10"
                                />
                                <button
                                  onClick={handleDeposit}
                                  disabled={depositGoalId !== g.id || !depositAmount}
                                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 hover:shadow-md disabled:opacity-50"
                                >
                                  <TrendingUp className="h-3.5 w-3.5" />
                                  Depositar
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground tabular">
                              Falta:{" "}
                              <span className="font-semibold text-foreground">
                                {formatCurrency(
                                  Math.max(
                                    Number(g.target_amount) - Number(g.current_amount),
                                    0
                                  )
                                )}
                              </span>
                            </p>
                            <button
                              onClick={async () => {
                                await deleteGoal(g.id);
                                toast.success("Meta removida");
                              }}
                              className="flex items-center gap-1 text-xs text-muted-foreground/70 hover:text-red-500"
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
