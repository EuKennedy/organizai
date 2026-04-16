import { useMemo, useState } from "react";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useTransactions } from "@/hooks/use-finance";
import { PageHero } from "@/components/page-hero";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { btnPrimary, btnPrimarySm } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { EXPENSE_CATEGORIES } from "@/types";

// Palette derivada do primary coral + complementares
const PIE_COLORS = [
  "oklch(0.78 0.155 22)",  // coral (primary)
  "oklch(0.68 0.22 340)",  // rosa
  "oklch(0.55 0.22 300)",  // ameixa
  "oklch(0.72 0.14 60)",   // amarelo quente
  "oklch(0.68 0.15 200)",  // azul suave
  "oklch(0.70 0.17 140)",  // verde
  "oklch(0.65 0.18 20)",   // vermelho-tijolo
  "oklch(0.60 0.16 280)",  // roxo
  "oklch(0.70 0.10 30)",   // areia
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function ExpensesPage() {
  const { transactions, loading, addTransaction, deleteTransaction } = useTransactions();
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), "yyyy-MM"));

  const [txAmount, setTxAmount] = useState("");
  const [txCategory, setTxCategory] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [txDate, setTxDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [txType, setTxType] = useState<"income" | "expense">("expense");

  const monthTransactions = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    if (!year || !month) return [];
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(start);
    return transactions.filter((t) => {
      const d = parseISO(t.date);
      return d >= start && d <= end;
    });
  }, [transactions, selectedMonth]);

  const summary = useMemo(() => {
    const income = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + Number(t.amount), 0);
    const expense = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + Number(t.amount), 0);
    return { income, expense, balance: income - expense };
  }, [monthTransactions]);

  const pieData = useMemo(() => {
    const byCategory = new Map<string, number>();
    monthTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const current = byCategory.get(t.category) ?? 0;
        byCategory.set(t.category, current + Number(t.amount));
      });
    return Array.from(byCategory.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthTransactions]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(format(new Date(), "yyyy-MM"));
    transactions.forEach((t) => months.add(t.date.slice(0, 7)));
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const handleAdd = async () => {
    const amount = parseFloat(txAmount);
    if (!amount || !txCategory || !txDate) return;
    try {
      await addTransaction({
        amount,
        category: txCategory,
        description: txDescription,
        date: txDate,
        type: txType,
      });
      setTxDialogOpen(false);
      setTxAmount("");
      setTxCategory("");
      setTxDescription("");
      setTxType("expense");
      toast.success("Lançamento adicionado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Fluxo financeiro"
        title={
          <>
            Despesas <span className="font-serif italic text-primary">a dois</span>
          </>
        }
        subtitle="Receitas, despesas e saldo do mês em um só lugar."
        ambient="teal"
        secondaryAction={
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="h-9 w-[140px] rounded-full border-border bg-card/60 text-xs font-medium backdrop-blur-sm sm:w-[160px] sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((m) => (
                <SelectItem key={m} value={m}>
                  {format(parseISO(`${m}-01`), "MMMM yyyy", { locale: ptBR })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        action={
          <button onClick={() => setTxDialogOpen(true)} className={btnPrimarySm}>
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Lançamento</span>
          </button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          tone="emerald"
          icon={<ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />}
          label="Receitas"
          value={summary.income}
          valueClassName="text-emerald-500"
        />
        <SummaryCard
          tone="rose"
          icon={<ArrowDownRight className="h-3.5 w-3.5" strokeWidth={2.5} />}
          label="Despesas"
          value={summary.expense}
          valueClassName="text-rose-500"
        />
        <SummaryCard
          tone="primary"
          icon={<Wallet className="h-3.5 w-3.5" strokeWidth={2.25} />}
          label="Saldo"
          value={summary.balance}
          valueClassName={summary.balance >= 0 ? "text-emerald-500" : "text-rose-500"}
        />
      </div>

      {/* Pie */}
      {pieData.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Gastos por categoria
          </p>
          <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
            <div className="shrink-0">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={2.5}
                    strokeWidth={0}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                      padding: "8px 12px",
                    }}
                    formatter={(v) => formatCurrency(Number(v))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {pieData.map((item, i) => {
                const pct = summary.expense > 0 ? (item.value / summary.expense) * 100 : 0;
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="truncate text-muted-foreground">{item.name}</span>
                      <span className="text-[10px] text-muted-foreground/60 tabular">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <span className="font-semibold tabular">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && monthTransactions.length === 0 && (
        <EmptyState
          icon={Receipt}
          title="Nenhum lançamento no mês"
          description="Adicione receitas e despesas para ver o resumo e os gráficos."
          tone="teal"
          action={
            <button onClick={() => setTxDialogOpen(true)} className={btnPrimary}>
              <Plus className="h-4 w-4" />
              Novo lançamento
            </button>
          }
        />
      )}

      {/* Transactions */}
      {monthTransactions.length > 0 && (
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Lançamentos
            </p>
            <span className="text-xs text-muted-foreground tabular">
              {monthTransactions.length}
            </span>
          </div>
          <AnimatePresence mode="popLayout">
            {monthTransactions.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5"
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    t.type === "income"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-rose-500/10 text-rose-500"
                  )}
                >
                  {t.type === "income" ? (
                    <TrendingUp className="h-4 w-4" strokeWidth={2.25} />
                  ) : (
                    <TrendingDown className="h-4 w-4" strokeWidth={2.25} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold">
                    {t.description || t.category}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {t.category} · {format(parseISO(t.date), "dd MMM", { locale: ptBR })}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold tabular",
                    t.type === "income" ? "text-emerald-500" : "text-rose-500"
                  )}
                >
                  {t.type === "income" ? "+" : "−"}
                  {formatCurrency(Number(t.amount))}
                </span>
                <button
                  onClick={async () => {
                    await deleteTransaction(t.id);
                    toast.success("Removido");
                  }}
                  aria-label="Remover"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo lançamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTxType("expense")}
                className={cn(
                  "rounded-2xl border px-3 py-3 text-sm font-semibold transition-all",
                  txType === "expense"
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-500"
                    : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                Despesa
              </button>
              <button
                onClick={() => setTxType("income")}
                className={cn(
                  "rounded-2xl border px-3 py-3 text-sm font-semibold transition-all",
                  txType === "income"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                    : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                Receita
              </button>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Categoria</Label>
              <Select value={txCategory} onValueChange={setTxCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Descrição</Label>
              <Input
                placeholder="Ex: Supermercado"
                value={txDescription}
                onChange={(e) => setTxDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Data</Label>
              <Input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} />
            </div>
            <button
              onClick={handleAdd}
              disabled={!txAmount || !txCategory}
              className={cn(btnPrimary, "w-full")}
            >
              Adicionar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SummaryCard({
  tone,
  icon,
  label,
  value,
  valueClassName,
}: {
  tone: "emerald" | "rose" | "primary";
  icon: React.ReactNode;
  label: string;
  value: number;
  valueClassName?: string;
}) {
  const tones = {
    emerald: {
      line: "from-transparent via-emerald-500/50 to-transparent",
      iconBg: "bg-emerald-500/10 text-emerald-500",
    },
    rose: {
      line: "from-transparent via-rose-500/50 to-transparent",
      iconBg: "bg-rose-500/10 text-rose-500",
    },
    primary: {
      line: "from-transparent via-primary/60 to-transparent",
      iconBg: "bg-primary/10 text-primary",
    },
  } as const;
  const t = tones[tone];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div
        className={cn("pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r", t.line)}
      />
      <div className="flex items-center gap-2">
        <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", t.iconBg)}>
          {icon}
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p
        className={cn(
          "mt-3 text-[22px] font-semibold tabular tracking-tight sm:text-[26px]",
          valueClassName
        )}
      >
        {formatCurrency(value)}
      </p>
    </div>
  );
}
