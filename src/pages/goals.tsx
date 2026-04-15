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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
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
      toast.success("Meta criada!");
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
      toast.success(`${formatCurrency(amount)} depositado!`);
    } catch {
      toast.error("Erro ao depositar");
    }
  };

  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);
  const totalSaved = goals.reduce((s, g) => s + Number(g.current_amount), 0);
  const totalPct = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Metas</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {goals.length} {goals.length === 1 ? "meta" : "metas"} ativas
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground sm:text-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova meta
        </button>
      </div>

      {/* Total overview */}
      {goals.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Progresso geral</p>
            <span className="text-xs font-semibold text-primary">{totalPct.toFixed(0)}%</span>
          </div>
          <Progress value={totalPct} className="mb-2 h-2.5" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Guardado: <span className="font-semibold text-green-500">{formatCurrency(totalSaved)}</span></span>
            <span>Meta total: <span className="font-semibold text-foreground">{formatCurrency(totalTarget)}</span></span>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && goals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Target className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold">Nenhuma meta ainda</h3>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Crie metas financeiras e acompanhem juntos o progresso
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-4 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Criar meta
          </button>
        </div>
      )}

      {/* Goals list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {goals.map((g) => {
            const pct = Number(g.target_amount) > 0 ? Math.min((Number(g.current_amount) / Number(g.target_amount)) * 100, 100) : 0;
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
                  "rounded-xl border bg-card transition-colors",
                  isComplete ? "border-green-500/30" : "border-border"
                )}
              >
                <div className="p-4">
                  {/* Goal header */}
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      isComplete ? "bg-green-500/10" : "bg-primary/10"
                    )}>
                      {isComplete ? (
                        <span className="text-lg">🎉</span>
                      ) : (
                        <Target className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold">{g.name}</h3>
                        {isComplete && (
                          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-500">
                            Concluida!
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(Number(g.current_amount))} de {formatCurrency(Number(g.target_amount))}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={cn("text-sm font-bold", isComplete ? "text-green-500" : "text-primary")}>
                        {pct.toFixed(0)}%
                      </span>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : g.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/50 hover:bg-accent"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <Progress value={pct} className={cn("h-2", isComplete && "[&>div]:bg-green-500")} />
                  </div>
                </div>

                {/* Expanded actions */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border px-4 py-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                          <div className="flex-1 space-y-1.5">
                            <Label className="text-xs">Depositar valor</Label>
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
                                className="h-9"
                              />
                              <button
                                onClick={handleDeposit}
                                disabled={depositGoalId !== g.id || !depositAmount}
                                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white transition disabled:opacity-50"
                              >
                                <TrendingUp className="h-3.5 w-3.5" />
                                Depositar
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Falta / Retirar info */}
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            Falta: <span className="font-semibold text-foreground">{formatCurrency(Math.max(Number(g.target_amount) - Number(g.current_amount), 0))}</span>
                          </p>
                          <button
                            onClick={async () => {
                              await deleteGoal(g.id);
                              toast.success("Meta removida");
                            }}
                            className="flex items-center gap-1 text-xs text-red-500/60 hover:text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                            Excluir
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

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome da meta</Label>
              <Input placeholder='Ex: "Viagem para o Nordeste"' value={goalName} onChange={(e) => setGoalName(e.target.value)} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Valor alvo (R$)</Label>
              <Input type="number" step="0.01" min="0" placeholder="3000.00" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} />
            </div>
            <button
              onClick={handleCreate}
              disabled={!goalName.trim() || !goalTarget}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Criar meta
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
