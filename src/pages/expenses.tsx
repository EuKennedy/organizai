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
import { cn } from "@/lib/utils";
import { EXPENSE_CATEGORIES } from "@/types";

const PIE_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e",
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
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
    const income = monthTransactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = monthTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
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
      await addTransaction({ amount, category: txCategory, description: txDescription, date: txDate, type: txType });
      setTxDialogOpen(false);
      setTxAmount("");
      setTxCategory("");
      setTxDescription("");
      setTxType("expense");
      toast.success("Lancamento adicionado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Despesas</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">Controle de receitas e despesas</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="h-9 w-[120px] text-xs sm:w-[140px] sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((m) => (
                <SelectItem key={m} value={m}>
                  {format(parseISO(`${m}-01`), "MMM yyyy", { locale: ptBR })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={() => setTxDialogOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground sm:text-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Lancamento</span>
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Receitas</p>
          <p className="text-sm font-bold text-green-500 sm:text-lg">{formatCurrency(summary.income)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Despesas</p>
          <p className="text-sm font-bold text-red-500 sm:text-lg">{formatCurrency(summary.expense)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Saldo</p>
          <p className={cn("text-sm font-bold sm:text-lg", summary.balance >= 0 ? "text-green-500" : "text-red-500")}>
            {formatCurrency(summary.balance)}
          </p>
        </div>
      </div>

      {/* Pie chart */}
      {pieData.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Gastos por categoria</p>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} strokeWidth={0}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transactions list */}
      {!loading && monthTransactions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Receipt className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium">Nenhum lancamento</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Adicione receitas e despesas deste mes</p>
        </div>
      )}

      {monthTransactions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Lancamentos ({monthTransactions.length})
          </p>
          <AnimatePresence mode="popLayout">
            {monthTransactions.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  t.type === "income" ? "bg-green-500/10" : "bg-red-500/10"
                )}>
                  {t.type === "income" ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.description || t.category}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {t.category} — {format(parseISO(t.date), "dd MMM", { locale: ptBR })}
                  </p>
                </div>
                <span className={cn("text-sm font-semibold", t.type === "income" ? "text-green-500" : "text-red-500")}>
                  {t.type === "income" ? "+" : "-"}{formatCurrency(Number(t.amount))}
                </span>
                <button
                  onClick={async () => { await deleteTransaction(t.id); toast.success("Removido"); }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition hover:bg-red-500/10 hover:text-red-500"
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
            <DialogTitle>Novo lancamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTxType("expense")}
                className={cn(
                  "rounded-xl border-2 py-2.5 text-sm font-medium transition-all",
                  txType === "expense"
                    ? "border-red-500/50 bg-red-500/10 text-red-500"
                    : "border-transparent bg-muted/50 text-muted-foreground"
                )}
              >
                Despesa
              </button>
              <button
                onClick={() => setTxType("income")}
                className={cn(
                  "rounded-xl border-2 py-2.5 text-sm font-medium transition-all",
                  txType === "income"
                    ? "border-green-500/50 bg-green-500/10 text-green-500"
                    : "border-transparent bg-muted/50 text-muted-foreground"
                )}
              >
                Receita
              </button>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Valor (R$)</Label>
              <Input type="number" step="0.01" min="0" placeholder="0,00" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Categoria</Label>
              <Select value={txCategory} onValueChange={setTxCategory}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Descricao</Label>
              <Input placeholder="Ex: Supermercado" value={txDescription} onChange={(e) => setTxDescription(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Data</Label>
              <Input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} />
            </div>
            <button
              onClick={handleAdd}
              disabled={!txAmount || !txCategory}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Adicionar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
