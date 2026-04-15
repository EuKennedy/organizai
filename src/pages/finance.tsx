import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  ArrowUpRight,
  ArrowDownRight,
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useTransactions, useGoals } from "@/hooks/use-finance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EXPENSE_CATEGORIES } from "@/types";

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#ffc658",
  "#82ca9d",
  "#ff7c43",
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function FinancePage() {
  const { transactions, loading: txLoading, addTransaction, deleteTransaction } = useTransactions();
  const { goals, loading: goalsLoading, addGoal, updateGoal, deleteGoal } = useGoals();

  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), "yyyy-MM"));

  // Transaction form
  const [txAmount, setTxAmount] = useState("");
  const [txCategory, setTxCategory] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [txDate, setTxDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [txType, setTxType] = useState<"income" | "expense">("expense");

  // Goal form
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");

  // Filtered transactions for selected month
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

  // Summary
  const summary = useMemo(() => {
    const income = monthTransactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = monthTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    return { income, expense, balance: income - expense };
  }, [monthTransactions]);

  // Pie chart data
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

  // Line chart data (last 6 months)
  const lineData = useMemo(() => {
    const months: { month: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = format(d, "yyyy-MM");
      const label = format(d, "MMM", { locale: ptBR });
      const monthTxs = transactions.filter((t) => t.date.startsWith(key));
      const income = monthTxs.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
      const expense = monthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
      months.push({ month: label, income, expense });
    }
    return months;
  }, [transactions]);

  // Available months for filter
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(format(new Date(), "yyyy-MM"));
    transactions.forEach((t) => months.add(t.date.slice(0, 7)));
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const handleAddTransaction = async () => {
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
      toast.success("Transacao adicionada!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao adicionar");
    }
  };

  const handleAddGoal = async () => {
    const target = parseFloat(goalTarget);
    if (!goalName.trim() || !target) return;
    try {
      await addGoal({ name: goalName.trim(), target_amount: target, current_amount: 0 });
      setGoalDialogOpen(false);
      setGoalName("");
      setGoalTarget("");
      toast.success("Meta criada!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar meta");
    }
  };

  const handleUpdateGoalAmount = async (id: string, value: string) => {
    const amount = parseFloat(value);
    if (isNaN(amount)) return;
    try {
      await updateGoal(id, { current_amount: amount });
    } catch {
      toast.error("Erro ao atualizar meta");
    }
  };

  const loading = txLoading || goalsLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Dashboard e controle financeiro</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px]">
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
          <Button onClick={() => setTxDialogOpen(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Transacao
          </Button>
          <Button onClick={() => setGoalDialogOpen(true)} size="sm" variant="outline">
            <Target className="mr-1.5 h-4 w-4" />
            Meta
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <ArrowUpRight className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receitas</p>
                <p className="text-lg font-bold text-green-500">{formatCurrency(summary.income)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <ArrowDownRight className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Despesas</p>
                <p className="text-lg font-bold text-red-500">{formatCurrency(summary.expense)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p className={`text-lg font-bold ${summary.balance >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {formatCurrency(summary.balance)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gastos por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Sem despesas neste mes</p>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                    >
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
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Evolucao mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Line type="monotone" dataKey="income" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} name="Receita" />
                <Line type="monotone" dataKey="expense" stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={false} name="Despesa" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Goals */}
      {goals.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Metas financeiras</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.map((g) => {
              const pct = g.target_amount > 0 ? Math.min((Number(g.current_amount) / Number(g.target_amount)) * 100, 100) : 0;
              return (
                <div key={g.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{g.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(Number(g.current_amount))} / {formatCurrency(Number(g.target_amount))}
                      </span>
                      <Input
                        type="number"
                        className="h-7 w-24 text-xs"
                        placeholder="Valor atual"
                        value={g.current_amount}
                        onChange={(e) => handleUpdateGoalAmount(g.id, e.target.value)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={async () => {
                          await deleteGoal(g.id);
                          toast.success("Meta removida");
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <p className="text-right text-xs text-muted-foreground">{pct.toFixed(0)}%</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Transactions list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Transacoes ({monthTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthTransactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma transacao neste mes
            </p>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {monthTransactions.map((t) => (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent/50"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        t.type === "income" ? "bg-green-500/10" : "bg-red-500/10"
                      }`}
                    >
                      {t.type === "income" ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {t.description || t.category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.category} — {format(parseISO(t.date), "dd MMM", { locale: ptBR })}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        t.type === "income" ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"}{formatCurrency(Number(t.amount))}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={async () => {
                        await deleteTransaction(t.id);
                        toast.success("Transacao removida");
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction dialog */}
      <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova transacao</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={txType === "expense" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setTxType("expense")}
              >
                Despesa
              </Button>
              <Button
                variant={txType === "income" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setTxType("income")}
              >
                Receita
              </Button>
            </div>
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
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
              <Label>Categoria</Label>
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
              <Label>Descricao</Label>
              <Input
                placeholder="Ex: Supermercado"
                value={txDescription}
                onChange={(e) => setTxDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
              />
            </div>
            <Button onClick={handleAddTransaction} className="w-full" disabled={!txAmount || !txCategory}>
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Goal dialog */}
      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova meta financeira</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome da meta</Label>
              <Input
                placeholder='Ex: "Viagem para o Nordeste"'
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Valor alvo (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="3000.00"
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
              />
            </div>
            <Button onClick={handleAddGoal} className="w-full" disabled={!goalName.trim() || !goalTarget}>
              Criar meta
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
