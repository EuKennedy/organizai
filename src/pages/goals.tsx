import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  addMonths,
  differenceInDays,
  differenceInMonths,
  format,
  parseISO,
  startOfMonth,
  isBefore,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronDown,
  ChevronUp,
  History,
  Loader2,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
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
import type { FinancialGoal, GoalDeposit } from "@/types";

// ─── constants ────────────────────────────────────────────────────────────────

const GOAL_EMOJIS = [
  "🏠","🚗","✈️","💍","🎓","🏥","💻","🎸",
  "🏖️","🍕","💰","🎯","📱","🐕","🎮","🌴",
];

const MILESTONES = [
  { pct: 25,  emoji: "🌱", msg: "Primeiro quarto guardado!" },
  { pct: 50,  emoji: "⚡", msg: "Metade do caminho!" },
  { pct: 75,  emoji: "🔥", msg: "Quase lá, não parem agora!" },
  { pct: 100, emoji: "🏆", msg: "Meta conquistada!" },
] as const;

// ─── helpers ──────────────────────────────────────────────────────────────────

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);

const brlFull = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function pctStr(p: number): string {
  if (p >= 100) return "100%";
  if (p <= 0) return "0%";
  if (p < 10) return `${p.toFixed(1).replace(".", ",")}%`;
  return `${Math.round(p)}%`;
}

interface Breakdown {
  daysLeft: number;
  monthsLeft: number;
  perDay: number;
  perWeek: number;
  perMonth: number;
  monthlyTarget: number;
  totalMonths: number;
  isOnTrack: boolean;
  isOverdue: boolean;
}

function getBreakdown(goal: FinancialGoal, now = new Date()): Breakdown | null {
  if (!goal.deadline) return null;
  const deadline = new Date(goal.deadline);
  const start = new Date(goal.created_at);
  const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount));
  const daysLeft = Math.max(0, differenceInDays(deadline, now));
  const monthsLeft = Math.max(0, differenceInMonths(deadline, now));
  const totalMonths = Math.max(1, differenceInMonths(deadline, start));
  const monthlyTarget = Number(goal.target_amount) / totalMonths;
  const elapsedMonths = Math.max(0, differenceInMonths(now, start));
  const expectedByNow = monthlyTarget * elapsedMonths;
  return {
    daysLeft,
    monthsLeft,
    perDay: daysLeft > 0 ? remaining / daysLeft : 0,
    perWeek: daysLeft > 0 ? (remaining / daysLeft) * 7 : 0,
    perMonth: monthsLeft > 0 ? remaining / monthsLeft : 0,
    monthlyTarget,
    totalMonths,
    isOnTrack: Number(goal.current_amount) >= expectedByNow,
    isOverdue: daysLeft === 0 && remaining > 0,
  };
}

type MonthStatus = "complete" | "partial" | "missed" | "current" | "future";

interface MonthChip {
  key: string;
  label: string;
  deposited: number;
  target: number;
  status: MonthStatus;
}

function getMonthlyChecklist(
  goal: FinancialGoal,
  deposits: GoalDeposit[],
  now = new Date()
): MonthChip[] | null {
  if (!goal.deadline) return null;
  const start = startOfMonth(new Date(goal.created_at));
  const end = new Date(goal.deadline);
  const n = Math.max(1, differenceInMonths(end, start) + 1);
  const monthlyTarget = Number(goal.target_amount) / n;
  const byMonth: Record<string, number> = {};
  for (const d of deposits) {
    const k = d.created_at.slice(0, 7);
    byMonth[k] = (byMonth[k] ?? 0) + Number(d.amount);
  }
  const nowKey = format(now, "yyyy-MM");
  return Array.from({ length: n }, (_, i) => {
    const date = addMonths(start, i);
    const key = format(date, "yyyy-MM");
    const deposited = byMonth[key] ?? 0;
    const future = isBefore(now, date);
    const current = key === nowKey;
    let status: MonthStatus;
    if (future) status = "future";
    else if (current) status = deposited >= monthlyTarget ? "complete" : "current";
    else status = deposited >= monthlyTarget ? "complete" : deposited > 0 ? "partial" : "missed";
    return {
      key,
      label: format(date, "MMM/yy", { locale: ptBR }),
      deposited,
      target: monthlyTarget,
      status,
    };
  });
}

function getCrossed(prev: number, next: number) {
  return MILESTONES.filter((m) => prev < m.pct && next >= m.pct);
}

// ─── ProgressRing ─────────────────────────────────────────────────────────────

function ProgressRing({
  pct,
  emoji,
  size = 72,
  stroke = 5,
}: {
  pct: number;
  emoji: string | null;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const capped = Math.min(pct, 100);
  const offset = circ * (1 - capped / 100);
  const colorClass =
    capped >= 100
      ? "text-emerald-500"
      : capped >= 75
      ? "text-orange-500"
      : capped >= 50
      ? "text-amber-500"
      : "text-primary";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className={colorClass}
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {emoji ? (
          <span className="select-none text-xl leading-none">{emoji}</span>
        ) : (
          <Target
            className={cn("h-5 w-5", colorClass)}
            strokeWidth={2}
          />
        )}
      </div>
    </div>
  );
}

// ─── MilestoneRow ──────────────────────────────────────────────────────────────

function MilestoneRow({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-1">
      {MILESTONES.map((m) => {
        const reached = pct >= m.pct;
        return (
          <motion.div
            key={m.pct}
            initial={false}
            animate={reached ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
            title={`${m.pct}% — ${m.msg}`}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-[11px] transition-all",
              reached
                ? "bg-primary/12 ring-1 ring-primary/25"
                : "bg-muted/40 opacity-35"
            )}
          >
            {reached ? m.emoji : "·"}
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── MonthChips ───────────────────────────────────────────────────────────────

function MonthChips({ chips }: { chips: MonthChip[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pastChips = chips.filter((c) => c.status !== "future");
  const completedCount = chips.filter((c) => c.status === "complete").length;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Checklist mensal
        </span>
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 ring-1 ring-emerald-500/20">
          {completedCount}/{pastChips.length > 0 ? pastChips.length : chips.length} meses
        </span>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {chips.map((chip) => (
          <div
            key={chip.key}
            title={`${chip.label}: ${brlFull(chip.deposited)} / ${brlFull(chip.target)}`}
            className={cn(
              "flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-2 py-2 ring-1 transition-colors",
              chip.status === "complete" &&
                "bg-emerald-500/10 ring-emerald-500/20",
              chip.status === "partial" && "bg-amber-500/10 ring-amber-500/20",
              chip.status === "missed" && "bg-red-500/8 ring-red-500/15",
              chip.status === "current" && "bg-primary/10 ring-primary/30",
              chip.status === "future" && "bg-muted/30 ring-border/40 opacity-45"
            )}
          >
            <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
              {chip.label}
            </span>
            <span
              className={cn(
                "text-[11px] font-bold leading-none",
                chip.status === "complete" && "text-emerald-500",
                chip.status === "partial" && "text-amber-500",
                chip.status === "missed" && "text-red-400",
                chip.status === "current" && "text-primary",
                chip.status === "future" && "text-muted-foreground/50"
              )}
            >
              {chip.status === "complete"
                ? "✓"
                : chip.status === "missed"
                ? "✗"
                : chip.status === "current"
                ? "→"
                : "·"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BreakdownStrip ───────────────────────────────────────────────────────────

function BreakdownStrip({ bd }: { bd: Breakdown }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-2xl border border-border/60 bg-background/50 px-3.5 py-2.5">
      {[
        { label: "por mês", value: bd.perMonth },
        { label: "por semana", value: bd.perWeek },
        { label: "por dia", value: bd.perDay },
      ].map(({ label, value }) => (
        <div key={label} className="flex items-baseline gap-1">
          <span className="text-[14px] font-semibold tabular text-foreground">
            {brl(value)}
          </span>
          <span className="text-[10.5px] text-muted-foreground">{label}</span>
        </div>
      ))}
      <div className="ml-auto">
        {bd.isOverdue ? (
          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-500 ring-1 ring-red-500/20">
            Prazo vencido
          </span>
        ) : bd.isOnTrack ? (
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 ring-1 ring-emerald-500/20">
            No ritmo ✓
          </span>
        ) : (
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-500 ring-1 ring-amber-500/20">
            Atrasado
          </span>
        )}
      </div>
    </div>
  );
}

// ─── GoalCard ─────────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  deposits,
  expanded,
  onToggle,
  onDeposit,
  onRemoveDeposit,
  onDelete,
}: {
  goal: FinancialGoal;
  deposits: GoalDeposit[];
  expanded: boolean;
  onToggle: () => void;
  onDeposit: (goalId: string, amount: number) => Promise<void>;
  onRemoveDeposit: (depositId: string) => Promise<void>;
  onDelete: (goalId: string) => Promise<void>;
}) {
  const [draftAmt, setDraftAmt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  const pct =
    Number(goal.target_amount) > 0
      ? Math.min(
          (Number(goal.current_amount) / Number(goal.target_amount)) * 100,
          100
        )
      : 0;
  const isComplete = pct >= 100;

  const bd = useMemo(() => getBreakdown(goal), [goal]);
  const checklist = useMemo(
    () => getMonthlyChecklist(goal, deposits),
    [goal, deposits]
  );

  const handleDeposit = async () => {
    const amount = parseFloat(draftAmt);
    if (!amount || amount <= 0) return;
    setSubmitting(true);
    try {
      const prevPct = pct;
      const expectedNew = Math.min(
        ((Number(goal.current_amount) + amount) / Number(goal.target_amount)) *
          100,
        100
      );
      await onDeposit(goal.id, amount);
      setDraftAmt("");
      toast.success(`+${brlFull(amount)} guardado`);
      const crossed = getCrossed(prevPct, expectedNew);
      if (crossed.length > 0) {
        setCelebrating(true);
        setTimeout(() => setCelebrating(false), 700);
        for (const m of crossed) {
          setTimeout(() => {
            toast.success(`${m.emoji} ${m.msg}`, {
              description: `Vocês chegaram a ${m.pct}% da meta "${goal.name}"!`,
              duration: 5000,
            });
          }, 350);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao depositar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "overflow-hidden rounded-3xl border bg-card transition-[box-shadow,border-color]",
        isComplete ? "border-emerald-500/30" : "border-border",
        celebrating && "ring-2 ring-primary/30 shadow-lg shadow-primary/5"
      )}
    >
      {/* HEADER */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full cursor-pointer p-4 text-left transition-colors hover:bg-muted/20 sm:p-5"
      >
        <div className="flex items-start gap-3.5">
          <motion.div
            animate={celebrating ? { scale: [1, 1.18, 1] } : { scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <ProgressRing pct={pct} emoji={goal.emoji} />
          </motion.div>

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[15px] font-semibold tracking-tight">
                {goal.name}
              </h3>
              {isComplete && (
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 ring-1 ring-emerald-500/20">
                  Concluída 🏆
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[12.5px] tabular text-muted-foreground">
              {brlFull(Number(goal.current_amount))}
              <span className="text-muted-foreground/60"> de </span>
              {brlFull(Number(goal.target_amount))}
            </p>
            <div className="mt-2.5">
              <MilestoneRow pct={pct} />
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
            <span
              className={cn(
                "text-[15px] font-semibold tabular",
                isComplete ? "text-emerald-500" : "text-primary"
              )}
            >
              {pctStr(pct)}
            </span>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground/60" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground/60" />
            )}
            {bd && !isComplete && (
              <span className="text-[10.5px] tabular text-muted-foreground">
                {bd.monthsLeft > 0
                  ? `${bd.monthsLeft}m restando`
                  : `${bd.daysLeft}d restando`}
              </span>
            )}
          </div>
        </div>

        {/* breakdown strip — always visible when deadline set */}
        {bd && !isComplete && (
          <div className="mt-3">
            <BreakdownStrip bd={bd} />
          </div>
        )}
      </button>

      {/* EXPANDED SECTION */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-5 border-t border-border bg-background/30 px-4 py-4 sm:px-5 sm:py-5">

              {/* MONTHLY CHECKLIST */}
              {checklist && (
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setShowChecklist((v) => !v)}
                    className="flex w-full cursor-pointer items-center gap-1.5 text-left"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Checklist mensal
                    </span>
                    {showChecklist ? (
                      <ChevronUp className="h-3 w-3 text-muted-foreground/60" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
                    )}
                    <span className="ml-auto rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 ring-1 ring-emerald-500/20">
                      {checklist.filter((c) => c.status === "complete").length}/
                      {checklist.filter((c) => c.status !== "future").length || checklist.length} meses
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {showChecklist && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        <MonthChips chips={checklist} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* DEPOSIT */}
              {!isComplete && (
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
                      value={draftAmt}
                      onChange={(e) => setDraftAmt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleDeposit();
                      }}
                      disabled={submitting}
                      className="h-10 flex-1"
                    />
                    <button
                      onClick={handleDeposit}
                      disabled={
                        !draftAmt || parseFloat(draftAmt) <= 0 || submitting
                      }
                      className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-emerald-600 px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <TrendingUp className="h-3.5 w-3.5" />
                      )}
                      {submitting ? "…" : "Guardar"}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Falta{" "}
                    <span className="font-semibold tabular text-foreground">
                      {brlFull(
                        Math.max(
                          Number(goal.target_amount) - Number(goal.current_amount),
                          0
                        )
                      )}
                    </span>{" "}
                    pra bater a meta.
                    {bd && bd.perMonth > 0 && (
                      <span className="ml-1 text-primary/80">
                        ({brl(bd.perMonth)}/mês sugerido)
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* DEPOSIT HISTORY */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <History className="h-3 w-3" />
                    Histórico
                  </Label>
                  {deposits.length > 0 && (
                    <span className="text-[10px] tabular text-muted-foreground">
                      {deposits.length}{" "}
                      {deposits.length === 1 ? "depósito" : "depósitos"}
                    </span>
                  )}
                </div>

                {deposits.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-background/40 px-4 py-5 text-center">
                    <p className="text-xs text-muted-foreground">
                      Nenhum depósito ainda.
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
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                            <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13.5px] font-semibold tabular">
                              +{brlFull(Number(d.amount))}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {format(
                                parseISO(d.created_at),
                                "dd MMM yyyy · HH:mm",
                                { locale: ptBR }
                              )}
                              {d.note && (
                                <span className="ml-1 truncate">· {d.note}</span>
                              )}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveDeposit(d.id)}
                            aria-label="Remover depósito"
                            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-red-500/10 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </div>

              {/* DELETE */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => onDelete(goal.id)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground/70 transition-colors hover:bg-red-500/10 hover:text-red-500"
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
}

// ─── CreateGoalDialog ─────────────────────────────────────────────────────────

type DeadlineMode = "months" | "years" | "date";

interface CreateGoalData {
  name: string;
  emoji: string | null;
  targetAmount: number;
  deadline: string | null;
}

function CreateGoalDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGoalData) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [targetAmt, setTargetAmt] = useState("");
  const [mode, setMode] = useState<DeadlineMode>("months");
  const [deadlineN, setDeadlineN] = useState("12");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const computeDeadline = (): string | null => {
    const n = parseInt(deadlineN);
    if (mode === "months" && n > 0)
      return addMonths(new Date(), n).toISOString();
    if (mode === "years" && n > 0)
      return addMonths(new Date(), n * 12).toISOString();
    if (mode === "date" && deadlineDate)
      return new Date(deadlineDate).toISOString();
    return null;
  };

  const preview = useMemo(() => {
    const target = parseFloat(targetAmt);
    if (!target || target <= 0) return null;
    const deadline = computeDeadline();
    if (!deadline) return null;
    const now = new Date();
    const dl = new Date(deadline);
    const months = Math.max(1, differenceInMonths(dl, now));
    const days = Math.max(1, differenceInDays(dl, now));
    return {
      perMonth: target / months,
      perWeek: (target / days) * 7,
      perDay: target / days,
      months,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetAmt, mode, deadlineN, deadlineDate]);

  const canSubmit = name.trim() && parseFloat(targetAmt) > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        emoji: selectedEmoji,
        targetAmount: parseFloat(targetAmt),
        deadline: computeDeadline(),
      });
      setName("");
      setSelectedEmoji(null);
      setTargetAmt("");
      setMode("months");
      setDeadlineN("12");
      setDeadlineDate("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const nudge = (dir: 1 | -1) => {
    const n = parseInt(deadlineN) || 1;
    const max = mode === "years" ? 30 : 120;
    setDeadlineN(String(Math.min(max, Math.max(1, n + dir))));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova meta</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Emoji picker */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Ícone (opcional)
            </Label>
            <div className="grid grid-cols-8 gap-1.5">
              {GOAL_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() =>
                    setSelectedEmoji((prev) => (prev === e ? null : e))
                  }
                  className={cn(
                    "flex h-9 w-full cursor-pointer items-center justify-center rounded-xl text-lg transition-all",
                    selectedEmoji === e
                      ? "scale-105 bg-primary/15 ring-2 ring-primary/40"
                      : "bg-muted/40 hover:bg-muted/70"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Nome da meta
            </Label>
            <Input
              placeholder='Ex: "Morar Juntos"'
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Target amount */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Valor alvo (R$)
            </Label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="15.000,00"
              value={targetAmt}
              onChange={(e) => setTargetAmt(e.target.value)}
            />
          </div>

          {/* Deadline */}
          <div className="space-y-2.5">
            <Label className="text-xs text-muted-foreground">
              Prazo para juntar
            </Label>

            {/* Mode segmented control */}
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/40 p-1">
              {(["months", "years", "date"] as DeadlineMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "cursor-pointer rounded-lg py-1.5 text-[11.5px] font-semibold transition-all",
                    mode === m
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m === "months" ? "Meses" : m === "years" ? "Anos" : "Data"}
                </button>
              ))}
            </div>

            {/* Input based on mode */}
            {(mode === "months" || mode === "years") && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => nudge(-1)}
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
                >
                  −
                </button>
                <Input
                  type="number"
                  min="1"
                  max={mode === "years" ? 30 : 120}
                  value={deadlineN}
                  onChange={(e) => setDeadlineN(e.target.value)}
                  className="h-9 text-center tabular"
                />
                <button
                  type="button"
                  onClick={() => nudge(1)}
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
                >
                  +
                </button>
                <span className="text-sm text-muted-foreground">
                  {mode === "years" ? "anos" : "meses"}
                </span>
              </div>
            )}
            {mode === "date" && (
              <Input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="h-9"
              />
            )}
          </div>

          {/* Live preview */}
          <AnimatePresence>
            {preview && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden rounded-2xl border border-primary/20 bg-primary/[0.04]"
              >
                <div className="px-4 py-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/70">
                    Plano calculado
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[
                      { label: "por mês", value: preview.perMonth },
                      { label: "por semana", value: preview.perWeek },
                      { label: "por dia", value: preview.perDay },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="rounded-xl bg-card/70 px-2.5 py-2.5 text-center ring-1 ring-border/60"
                      >
                        <p className="text-[13px] font-bold tabular tracking-tight">
                          {brl(value)}
                        </p>
                        <p className="mt-0.5 text-[9.5px] text-muted-foreground">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[12px] text-muted-foreground">
                    Em{" "}
                    <span className="font-semibold text-foreground">
                      {preview.months} {preview.months === 1 ? "mês" : "meses"}
                    </span>{" "}
                    vocês chegam lá.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className={cn(btnPrimary, "w-full")}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Criando…" : "Criar meta"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── GoalsPage ────────────────────────────────────────────────────────────────

export function GoalsPage() {
  const { goals, depositsByGoal, loading, addGoal, deleteGoal, addDeposit, deleteDeposit } =
    useGoals();

  const [createOpen, setCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);
  const totalSaved = goals.reduce((s, g) => s + Number(g.current_amount), 0);
  const totalPct =
    totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;
  const completedCount = goals.filter(
    (g) => Number(g.current_amount) >= Number(g.target_amount)
  ).length;
  const onTrackCount = goals.filter((g) => getBreakdown(g)?.isOnTrack).length;

  const handleCreate = async (data: CreateGoalData) => {
    await addGoal({
      name: data.name,
      emoji: data.emoji ?? null,
      deadline: data.deadline ?? null,
      target_amount: data.targetAmount,
      current_amount: 0,
    });
    toast.success("Meta criada 🎯");
  };

  const handleDelete = async (goalId: string) => {
    const deps = depositsByGoal[goalId] ?? [];
    if (deps.length > 0) {
      const ok = window.confirm(
        "Essa meta tem depósitos. Excluir apaga tudo. Continuar?"
      );
      if (!ok) return;
    }
    await deleteGoal(goalId);
    toast.success("Meta removida");
  };

  const handleRemoveDeposit = async (depositId: string) => {
    try {
      await deleteDeposit(depositId);
      toast.success("Depósito removido");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover");
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Sonhos a dois"
        title={
          <>
            Metas{" "}
            <span className="font-serif italic text-primary">
              que viram reais
            </span>
          </>
        }
        subtitle={
          goals.length === 0
            ? "Escolham um sonho, definam um prazo e guardem todo mês."
            : `${goals.length} ${goals.length === 1 ? "meta ativa" : "metas ativas"}`
        }
        ambient="gold"
        action={
          <button
            onClick={() => setCreateOpen(true)}
            className={btnPrimarySm}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Nova meta</span>
          </button>
        }
      />

      {/* OVERVIEW */}
      {goals.length > 0 && (
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/[0.04] p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Progresso geral
              </p>
              <p className="mt-2 text-4xl font-semibold tabular tracking-tight sm:text-5xl">
                {pctStr(totalPct)}
              </p>
              <p className="mt-1.5 text-[12px] tabular text-muted-foreground">
                {brlFull(totalSaved)}{" "}
                <span className="text-muted-foreground/60">de</span>{" "}
                {brlFull(totalTarget)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {completedCount > 0 && (
                <div className="flex items-center gap-1.5 rounded-2xl bg-emerald-500/10 px-3 py-2 ring-1 ring-emerald-500/20">
                  <Trophy className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-[12px] font-semibold text-emerald-500">
                    {completedCount} concluída{completedCount > 1 ? "s" : ""}
                  </span>
                </div>
              )}
              {onTrackCount > 0 && (
                <div className="flex items-center gap-1.5 rounded-2xl bg-primary/10 px-3 py-2 ring-1 ring-primary/20">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[12px] font-semibold text-primary">
                    {onTrackCount} no ritmo
                  </span>
                </div>
              )}
            </div>
          </div>
          <Progress value={totalPct} className="mt-5 h-2" />
        </div>
      )}

      {/* EMPTY */}
      {!loading && goals.length === 0 && (
        <EmptyState
          icon={Target}
          title="Nenhuma meta ainda"
          description="Escolham um sonho, definam um prazo, e o sistema mostra exatamente quanto guardar por mês."
          tone="gold"
          action={
            <button onClick={() => setCreateOpen(true)} className={btnPrimary}>
              <Plus className="h-4 w-4" />
              Criar primeira meta
            </button>
          }
        />
      )}

      {/* GOALS LIST */}
      {goals.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {goals.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                deposits={depositsByGoal[g.id] ?? []}
                expanded={expandedId === g.id}
                onToggle={() =>
                  setExpandedId((prev) => (prev === g.id ? null : g.id))
                }
                onDeposit={addDeposit}
                onRemoveDeposit={handleRemoveDeposit}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <CreateGoalDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </>
  );
}
