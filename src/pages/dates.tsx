import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Heart,
  MapPin,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CalendarRange,
  ListChecks,
  Sparkles,
  Pencil,
  Wallet,
  TrendingUp,
  CheckCheck,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDates } from "@/hooks/use-dates";
import { useCouple } from "@/hooks/use-couple";
import { StatusBadge } from "@/components/status-badge";
import { PageHero } from "@/components/page-hero";
import { EmptyState } from "@/components/empty-state";
import { FilterLabel } from "@/components/filter-bar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateCalendar } from "@/components/dates/date-calendar";
import { DaySheet } from "@/components/dates/day-sheet";
import { btnPrimary, btnPrimarySm, chip, chipActive, chipIdle } from "@/lib/ui";
import { cn } from "@/lib/utils";
import {
  WEATHER_EMOJI,
  DATE_TIER_META,
  DEFAULT_DATE_TIER_LIMITS,
  DEFAULT_DATE_WEEKLY_QUOTA,
  type DateIdea,
  type DateCostTier,
  type WeatherIcon,
} from "@/types";

const WEATHER_OPTIONS: { value: WeatherIcon; label: string }[] = [
  { value: "sunny", label: `${WEATHER_EMOJI.sunny} Ensolarado` },
  { value: "cloudy", label: `${WEATHER_EMOJI.cloudy} Nublado` },
  { value: "rainy", label: `${WEATHER_EMOJI.rainy} Chuvoso` },
  { value: "snowy", label: `${WEATHER_EMOJI.snowy} Nevando` },
];

const STATUS_BUTTONS: { value: DateIdea["status"]; label: string; emoji: string }[] = [
  { value: "idea", label: "Ideia", emoji: "💡" },
  { value: "scheduled", label: "Agendado", emoji: "📅" },
  { value: "done", label: "Realizado", emoji: "✅" },
];

const TIERS: DateCostTier[] = [1, 2, 3];

type ViewMode = "calendar" | "list";

// ─── helpers ──────────────────────────────────────────────────────────────────

function brl(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);
}

function brlFull(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function normalizeTierMap(
  raw: Record<string, number> | null | undefined,
  fallback: Record<DateCostTier, number>
): Record<DateCostTier, number> {
  if (!raw) return fallback;
  return {
    1: Number(raw["1"] ?? fallback[1]) || fallback[1],
    2: Number(raw["2"] ?? fallback[2]) || fallback[2],
    3: Number(raw["3"] ?? fallback[3]) || fallback[3],
  };
}

function getEffectiveDate(d: DateIdea): Date {
  return new Date(d.date_time ?? d.updated_at);
}

interface TierStats {
  tier: DateCostTier;
  used: number;
  quota: number;
  spent: number;
  budget: number;
  overspent: boolean;
}

function computeWeekStats(
  dates: DateIdea[],
  limits: Record<DateCostTier, number>,
  quota: Record<DateCostTier, number>,
  weekStart: Date,
  weekEnd: Date
): Record<DateCostTier, TierStats> {
  const out: Record<DateCostTier, TierStats> = {
    1: { tier: 1, used: 0, quota: quota[1], spent: 0, budget: quota[1] * limits[1], overspent: false },
    2: { tier: 2, used: 0, quota: quota[2], spent: 0, budget: quota[2] * limits[2], overspent: false },
    3: { tier: 3, used: 0, quota: quota[3], spent: 0, budget: quota[3] * limits[3], overspent: false },
  };
  for (const d of dates) {
    if (d.status !== "done") continue;
    if (!d.cost_tier) continue;
    const eff = getEffectiveDate(d);
    if (!isWithinInterval(eff, { start: weekStart, end: weekEnd })) continue;
    const tier = d.cost_tier as DateCostTier;
    out[tier].used++;
    out[tier].spent += Number(d.actual_cost ?? d.estimated_cost ?? 0);
  }
  out[1].overspent = out[1].spent > out[1].budget;
  out[2].overspent = out[2].spent > out[2].budget;
  out[3].overspent = out[3].spent > out[3].budget;
  return out;
}

function formatWeekRange(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${format(start, "d")}–${format(end, "d 'de' MMM", { locale: ptBR })}`;
  }
  return `${format(start, "d MMM", { locale: ptBR })} – ${format(end, "d MMM", { locale: ptBR })}`;
}

// ─── TierBadge ────────────────────────────────────────────────────────────────

function TierBadge({
  tier,
  size = "sm",
}: {
  tier: DateCostTier;
  size?: "xs" | "sm";
}) {
  const meta = DATE_TIER_META[tier];
  if (size === "xs") {
    return (
      <span
        title={meta.label}
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0 text-[9.5px] font-bold uppercase tracking-wide ring-1",
          meta.bg, meta.text, meta.ring
        )}
      >
        <span className="text-[10px] leading-none">{meta.emoji}</span>
        {meta.label}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
        meta.bg, meta.text, meta.ring
      )}
    >
      <span className="text-xs leading-none">{meta.emoji}</span>
      {meta.label}
    </span>
  );
}

// ─── TierPicker ───────────────────────────────────────────────────────────────

function TierPicker({
  value,
  onChange,
  limits,
  compact = false,
}: {
  value: DateCostTier | null;
  onChange: (v: DateCostTier | null) => void;
  limits: Record<DateCostTier, number>;
  compact?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {TIERS.map((t) => {
        const meta = DATE_TIER_META[t];
        const active = value === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(active ? null : t)}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border py-2 text-xs font-semibold transition-all",
              active
                ? `${meta.bg} ${meta.border} ${meta.text} scale-[1.02]`
                : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
            )}
          >
            <span className="text-base leading-none">{meta.emoji}</span>
            <span className={compact ? "text-[10.5px]" : "text-[12px]"}>{meta.label}</span>
            <span className="text-[9.5px] font-medium opacity-70 tabular">
              até {brl(limits[t])}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── WeekBudgetCard ───────────────────────────────────────────────────────────

function WeekBudgetCard({
  stats,
  limits,
  quota,
  weekStart,
  weekEnd,
  onSaveConfig,
}: {
  stats: Record<DateCostTier, TierStats>;
  limits: Record<DateCostTier, number>;
  quota: Record<DateCostTier, number>;
  weekStart: Date;
  weekEnd: Date;
  onSaveConfig: (
    limits: Record<DateCostTier, number>,
    quota: Record<DateCostTier, number>
  ) => Promise<void>;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [editLimits, setEditLimits] = useState(limits);
  const [editQuota, setEditQuota] = useState(quota);
  const [saving, setSaving] = useState(false);

  const totalSpent = stats[1].spent + stats[2].spent + stats[3].spent;
  const totalBudget = stats[1].budget + stats[2].budget + stats[3].budget;
  const pct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveConfig(editLimits, editQuota);
      setEditOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setEditLimits(limits);
      setEditQuota(quota);
    }
    setEditOpen(open);
  };

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/[0.03] p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="h-3.5 w-3.5 text-primary" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Esta semana
            </p>
          </div>
          <p className="mt-0.5 text-[15px] font-semibold tracking-tight">
            {formatWeekRange(weekStart, weekEnd)}
          </p>
        </div>
        <Popover open={editOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <button
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background/50 px-3 py-1.5 text-[11px] font-semibold text-foreground/80 transition-colors hover:border-primary/40 hover:text-foreground"
              aria-label="Editar limites e quotas"
            >
              <Pencil className="h-3 w-3" />
              Ajustar
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[340px]">
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Limites e quotas
                </p>
                <p className="mt-0.5 text-[11.5px] text-muted-foreground/80">
                  Quanto custa cada tier e quantos rolês/semana.
                </p>
              </div>
              <div className="space-y-2">
                {TIERS.map((t) => {
                  const meta = DATE_TIER_META[t];
                  return (
                    <div
                      key={t}
                      className={cn(
                        "rounded-xl border p-2.5 ring-1",
                        meta.border, meta.bg, meta.ring
                      )}
                    >
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <span className="text-sm leading-none">{meta.emoji}</span>
                        <span className={cn("text-[11.5px] font-bold uppercase tracking-wide", meta.text)}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <Label className="text-[9.5px] uppercase tracking-wide text-muted-foreground">
                            Limite R$
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            step="10"
                            value={editLimits[t]}
                            onChange={(e) =>
                              setEditLimits((p) => ({ ...p, [t]: parseFloat(e.target.value) || 0 }))
                            }
                            className="h-8 text-xs tabular"
                          />
                        </div>
                        <div>
                          <Label className="text-[9.5px] uppercase tracking-wide text-muted-foreground">
                            Por semana
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={editQuota[t]}
                            onChange={(e) =>
                              setEditQuota((p) => ({ ...p, [t]: parseInt(e.target.value) || 0 }))
                            }
                            className="h-8 text-xs tabular"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditOpen(false)}
                  disabled={saving}
                  className="flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={cn(btnPrimary, "flex-1 py-1.5 text-xs")}
                >
                  {saving ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Tier pills */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {TIERS.map((t) => {
          const meta = DATE_TIER_META[t];
          const s = stats[t];
          const full = s.quota > 0 && s.used >= s.quota;
          return (
            <div
              key={t}
              className={cn(
                "relative overflow-hidden rounded-xl border bg-card/60 p-2.5 sm:p-3 ring-1 transition-all",
                full ? "border-emerald-500/30 ring-emerald-500/20" : `${meta.border} ${meta.ring}`,
                s.overspent && "border-red-500/40 ring-red-500/30"
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm leading-none">{meta.emoji}</span>
                <span className={cn("text-[10.5px] font-bold uppercase tracking-wide", meta.text)}>
                  {meta.label}
                </span>
                {full && (
                  <CheckCheck className="ml-auto h-3.5 w-3.5 text-emerald-500" strokeWidth={2.5} />
                )}
                {s.overspent && (
                  <AlertTriangle className="ml-auto h-3.5 w-3.5 text-red-400" strokeWidth={2.5} />
                )}
              </div>
              <p className={cn("mt-1.5 text-lg font-bold tabular leading-none", meta.text)}>
                {s.used}<span className="text-xs text-muted-foreground">/{s.quota}</span>
              </p>
              <p className="mt-0.5 text-[10.5px] tabular text-muted-foreground">
                {brl(s.spent)}<span className="text-muted-foreground/60"> / {brl(s.budget)}</span>
              </p>
              {/* Mini dots showing slot status */}
              <div className="mt-2 flex gap-1">
                {Array.from({ length: Math.max(1, s.quota) }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      i < s.used
                        ? full ? "bg-emerald-500" : meta.text.replace("text-", "bg-")
                        : "bg-muted/40"
                    )}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total bar */}
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[11.5px] tabular text-muted-foreground">
          <span className="font-bold text-foreground">{brlFull(totalSpent)}</span>{" "}
          <span className="text-muted-foreground/60">de</span>{" "}
          <span className="font-semibold">{brlFull(totalBudget)}</span> esta semana
        </p>
        <p className="text-[11.5px] font-semibold tabular text-primary">
          {Math.round(pct)}% usado
        </p>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted/40">
        <motion.div
          className={cn(
            "h-full rounded-full",
            pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-primary"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </div>
    </section>
  );
}

// ─── CostSection (tier + costs picker for use in rows + create) ───────────────

function CostSection({
  value,
  estimated,
  actual,
  status,
  limits,
  onTierChange,
  onEstimatedChange,
  onActualChange,
  compact = false,
}: {
  value: DateCostTier | null;
  estimated: number | null;
  actual: number | null;
  status: DateIdea["status"];
  limits: Record<DateCostTier, number>;
  onTierChange: (v: DateCostTier | null) => void;
  onEstimatedChange: (v: number | null) => void;
  onActualChange?: (v: number | null) => void;
  compact?: boolean;
}) {
  const overEstimate = value !== null && estimated !== null && estimated > limits[value];
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FilterLabel>Tier de custo</FilterLabel>
        <TierPicker value={value} onChange={onTierChange} limits={limits} compact={compact} />
      </div>
      <div className={cn("grid gap-3", status === "done" ? "sm:grid-cols-2" : "")}>
        <div className="space-y-1.5">
          <FilterLabel>Custo estimado (R$)</FilterLabel>
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={estimated ?? ""}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              onEstimatedChange(isFinite(v) ? v : null);
            }}
            className={cn("h-9 tabular", overEstimate && "border-amber-500/50")}
          />
          {overEstimate && value !== null && (
            <p className="flex items-center gap-1 text-[10.5px] text-amber-500">
              <AlertTriangle className="h-3 w-3" />
              Acima do limite de {DATE_TIER_META[value].label} ({brl(limits[value])})
            </p>
          )}
        </div>
        {status === "done" && onActualChange && (
          <div className="space-y-1.5">
            <FilterLabel>Gasto real (R$)</FilterLabel>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder={estimated ? `Sugerido: ${brl(estimated)}` : "0,00"}
              value={actual ?? ""}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                onActualChange(isFinite(v) ? v : null);
              }}
              className="h-9 tabular"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DatesPage ────────────────────────────────────────────────────────────────

export function DatesPage() {
  const { dates, loading, addDate, updateDate, deleteDate } = useDates();
  const { couple, updateCouple } = useCouple();

  const today = new Date();
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTier, setNewTier] = useState<DateCostTier | null>(null);
  const [newEstimated, setNewEstimated] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<DateIdea["status"] | null>(null);
  const [tierFilter, setTierFilter] = useState<DateCostTier | null>(null);
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assigningDate, setAssigningDate] = useState<DateIdea | null>(null);

  const limits = useMemo(
    () => normalizeTierMap(couple?.date_tier_limits, DEFAULT_DATE_TIER_LIMITS),
    [couple]
  );
  const quota = useMemo(
    () => normalizeTierMap(couple?.date_weekly_quota, DEFAULT_DATE_WEEKLY_QUOTA),
    [couple]
  );

  const weekStart = useMemo(() => startOfWeek(today, { weekStartsOn: 1 }), [today]);
  const weekEnd = useMemo(() => endOfWeek(today, { weekStartsOn: 1 }), [today]);
  const weekStats = useMemo(
    () => computeWeekStats(dates, limits, quota, weekStart, weekEnd),
    [dates, limits, quota, weekStart, weekEnd]
  );

  const stats = useMemo(() => {
    const scheduled = dates.filter((d) => d.status === "scheduled").length;
    const done = dates.filter((d) => d.status === "done").length;
    const ideas = dates.filter((d) => !d.date_time || d.status === "idea").length;
    return { total: dates.length, scheduled, done, ideas };
  }, [dates]);

  const looseIdeas = useMemo(
    () => dates.filter((d) => !d.date_time),
    [dates]
  );

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    for (const d of dates) {
      if (d.date_time) {
        set.add(format(new Date(d.date_time), "yyyy-MM"));
      }
    }
    return Array.from(set).sort();
  }, [dates]);

  const filteredList = useMemo(() => {
    let r = dates;
    if (statusFilter) r = r.filter((d) => d.status === statusFilter);
    if (tierFilter !== null) r = r.filter((d) => d.cost_tier === tierFilter);
    if (monthFilter) {
      r = r.filter(
        (d) =>
          d.date_time &&
          format(new Date(d.date_time), "yyyy-MM") === monthFilter
      );
    }
    const now = Date.now();
    return r.slice().sort((a, b) => {
      const aHas = !!a.date_time;
      const bHas = !!b.date_time;
      if (!aHas && !bHas) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (!aHas) return 1;
      if (!bHas) return -1;
      const aT = new Date(a.date_time as string).getTime();
      const bT = new Date(b.date_time as string).getTime();
      const aFuture = aT >= now;
      const bFuture = bT >= now;
      if (aFuture && !bFuture) return -1;
      if (!aFuture && bFuture) return 1;
      if (aFuture) return aT - bT;
      return bT - aT;
    });
  }, [dates, statusFilter, tierFilter, monthFilter]);

  const handleCreate = async (params?: {
    name?: string;
    dateTime?: string | null;
    cost_tier?: DateCostTier | null;
    estimated_cost?: number | null;
  }) => {
    const name = (params?.name ?? newName).trim();
    if (!name) return;
    try {
      await addDate({
        name,
        address: null,
        date_time: params?.dateTime ?? null,
        expected_weather: null,
        maps_link: null,
        place_name: null,
        place_photos: [],
        status: params?.dateTime ? "scheduled" : "idea",
        cost_tier: params?.cost_tier ?? newTier ?? null,
        estimated_cost: params?.estimated_cost ?? newEstimated ?? null,
        actual_cost: null,
      });
      setNewName("");
      setNewTier(null);
      setNewEstimated(null);
      setCreateOpen(false);
      toast.success("Date adicionado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  const handleFieldUpdate = async (
    id: string,
    updates: Partial<DateIdea>
  ) => {
    try {
      await updateDate(id, updates);
    } catch {
      toast.error("Erro ao atualizar");
    }
  };

  const handleStatusChange = async (id: string, status: DateIdea["status"]) => {
    try {
      const dateRow = dates.find((d) => d.id === id);
      const updates: Partial<DateIdea> = { status };
      // When marking done, auto-fill actual_cost from estimated if not yet set
      if (status === "done" && dateRow && dateRow.actual_cost == null && dateRow.estimated_cost != null) {
        updates.actual_cost = dateRow.estimated_cost;
      }
      await updateDate(id, updates);
      if (status === "done") {
        toast.success("Rolê marcado como feito! 🎉");
      }
    } catch {
      toast.error("Erro");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDate(id);
      toast.success("Removido");
    } catch {
      toast.error("Erro ao remover");
    }
  };

  const handleSaveBudgetConfig = async (
    newLimits: Record<DateCostTier, number>,
    newQuota: Record<DateCostTier, number>
  ) => {
    try {
      await updateCouple({
        date_tier_limits: { "1": newLimits[1], "2": newLimits[2], "3": newLimits[3] },
        date_weekly_quota: { "1": newQuota[1], "2": newQuota[2], "3": newQuota[3] },
      });
      toast.success("Orçamento atualizado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Agenda a dois"
        title={
          <>
            Dates <span className="font-serif italic text-primary">inesquecíveis</span>
          </>
        }
        subtitle={
          dates.length === 0
            ? "Planejem passeios, jantares e programas juntos."
            : `${stats.scheduled} agendados · ${stats.done} feitos · ${stats.ideas} ideias`
        }
        ambient="plum"
        action={
          <button onClick={() => setCreateOpen(true)} className={btnPrimarySm}>
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Nova ideia</span>
          </button>
        }
      />

      {/* WEEKLY BUDGET CARD */}
      <WeekBudgetCard
        stats={weekStats}
        limits={limits}
        quota={quota}
        weekStart={weekStart}
        weekEnd={weekEnd}
        onSaveConfig={handleSaveBudgetConfig}
      />

      {/* View toggle */}
      <div className="mb-5 inline-flex items-center gap-1 rounded-full bg-muted/40 p-1">
        <button
          onClick={() => setViewMode("calendar")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
            viewMode === "calendar"
              ? "bg-card text-foreground shadow-sm ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CalendarRange className="h-3.5 w-3.5" />
          Calendário
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
            viewMode === "list"
              ? "bg-card text-foreground shadow-sm ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ListChecks className="h-3.5 w-3.5" />
          Lista
        </button>
      </div>

      {/* Empty state */}
      {!loading && dates.length === 0 && (
        <EmptyState
          icon={Heart}
          title="Nenhuma ideia ainda"
          description="Comecem a planejar os próximos dates — do mais simples ao mais especial."
          tone="plum"
          action={
            <button onClick={() => setCreateOpen(true)} className={btnPrimary}>
              <Plus className="h-4 w-4" />
              Nova ideia
            </button>
          }
        />
      )}

      {/* CALENDAR VIEW */}
      {viewMode === "calendar" && dates.length > 0 && (
        <>
          <DateCalendar
            year={year}
            month={month}
            selectedDay={selectedDay}
            dates={dates}
            onYearChange={setYear}
            onMonthChange={setMonth}
            onDayClick={(d) => setSelectedDay(d)}
          />

          {/* Loose ideas rail */}
          {looseIdeas.length > 0 && (
            <section className="mt-10 space-y-4">
              <div className="flex items-center justify-between gap-3 px-1">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-muted-foreground/70">
                    Sem data marcada
                  </p>
                  <h2 className="mt-0.5 flex items-baseline gap-2.5 text-xl font-semibold tracking-tight sm:text-2xl">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Ideias soltas
                    <span className="text-sm font-normal text-muted-foreground tabular">
                      {looseIdeas.length}
                    </span>
                  </h2>
                </div>
              </div>
              <div className="space-y-2">
                {looseIdeas.map((d) => (
                  <DateRow
                    key={d.id}
                    date={d}
                    limits={limits}
                    expanded={expandedId === d.id}
                    onToggle={() => setExpandedId(expandedId === d.id ? null : d.id)}
                    onFieldUpdate={handleFieldUpdate}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onAssignDate={(date) => setAssigningDate(date)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && dates.length > 0 && (
        <>
          <div className="mb-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              Ordenado pelo mais próximo · futuro primeiro · ideias soltas no fim
            </span>
          </div>

          {/* Status filters */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            <button
              onClick={() => setStatusFilter(null)}
              className={cn(chip, !statusFilter ? chipActive : chipIdle)}
            >
              Todos · {stats.total}
            </button>
            {STATUS_BUTTONS.map(({ value, label, emoji }) => {
              const count =
                value === "idea"
                  ? stats.ideas
                  : value === "scheduled"
                  ? stats.scheduled
                  : stats.done;
              return (
                <button
                  key={value}
                  onClick={() =>
                    setStatusFilter(value === statusFilter ? null : value)
                  }
                  className={cn(
                    chip,
                    statusFilter === value ? chipActive : chipIdle
                  )}
                >
                  <span>{emoji}</span>
                  {label} · {count}
                </button>
              );
            })}
          </div>

          {/* Tier filters */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            <button
              onClick={() => setTierFilter(null)}
              className={cn(chip, tierFilter === null ? chipActive : chipIdle)}
            >
              Todos tiers
            </button>
            {TIERS.map((t) => {
              const meta = DATE_TIER_META[t];
              const count = dates.filter((d) => d.cost_tier === t).length;
              return (
                <button
                  key={t}
                  onClick={() => setTierFilter(tierFilter === t ? null : t)}
                  className={cn(chip, tierFilter === t ? chipActive : chipIdle)}
                >
                  <span>{meta.emoji}</span>
                  {meta.label} · {count}
                </button>
              );
            })}
          </div>

          {/* Month filter */}
          {availableMonths.length > 0 && (
            <div className="scrollbar-hide mb-5 -mx-1 flex snap-x snap-mandatory gap-1.5 overflow-x-auto px-1 pb-1">
              <button
                onClick={() => setMonthFilter(null)}
                className={cn(
                  "snap-start shrink-0",
                  chip,
                  !monthFilter ? chipActive : chipIdle
                )}
              >
                Todos os meses
              </button>
              {availableMonths.map((m) => {
                const [y, mo] = m.split("-").map(Number);
                const label = format(new Date(y!, (mo ?? 1) - 1, 1), "MMM yyyy", {
                  locale: ptBR,
                });
                return (
                  <button
                    key={m}
                    onClick={() => setMonthFilter(m === monthFilter ? null : m)}
                    className={cn(
                      "snap-start shrink-0 capitalize",
                      chip,
                      monthFilter === m ? chipActive : chipIdle
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-2 space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredList.map((d) => (
                <DateRow
                  key={d.id}
                  date={d}
                  limits={limits}
                  expanded={expandedId === d.id}
                  onToggle={() => setExpandedId(expandedId === d.id ? null : d.id)}
                  onFieldUpdate={handleFieldUpdate}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  onAssignDate={(date) => setAssigningDate(date)}
                />
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Day sheet (calendar view) */}
      <DaySheet
        day={selectedDay}
        dates={dates}
        limits={limits}
        onClose={() => setSelectedDay(null)}
        onCreate={async ({ name, dateTime, cost_tier, estimated_cost }) => {
          await handleCreate({ name, dateTime, cost_tier, estimated_cost });
        }}
        onSelect={(d) => {
          setSelectedDay(null);
          setViewMode("list");
          setExpandedId(d.id);
          setTimeout(() => {
            const el = document.getElementById(`date-${d.id}`);
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 100);
        }}
        onDelete={handleDelete}
        onSetTier={(id, tier) => handleFieldUpdate(id, { cost_tier: tier })}
        onAttachLoose={async (id, dateTime) => {
          try {
            await updateDate(id, { date_time: dateTime, status: "scheduled" });
            toast.success("Anexado nesse dia");
          } catch {
            toast.error("Erro ao anexar");
          }
        }}
      />

      <AssignDateDialog
        date={assigningDate}
        onClose={() => setAssigningDate(null)}
        onAssign={async (dateTime) => {
          if (!assigningDate) return;
          try {
            await updateDate(assigningDate.id, {
              date_time: dateTime,
              status: dateTime ? "scheduled" : assigningDate.status,
            });
            toast.success(dateTime ? "Data marcada" : "Data removida");
            setAssigningDate(null);
          } catch {
            toast.error("Erro");
          }
        }}
      />

      {/* CREATE DIALOG */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova ideia de date</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome</Label>
              <Input
                placeholder='Ex: "Jantar no italiano"'
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tier de custo</Label>
              <TierPicker value={newTier} onChange={setNewTier} limits={limits} />
            </div>
            {newTier !== null && (
              <div className="space-y-1.5">
                <Label className="text-xs">Custo estimado (R$)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder={`Sugerido até ${brl(limits[newTier])}`}
                  value={newEstimated ?? ""}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setNewEstimated(isFinite(v) ? v : null);
                  }}
                  className="tabular"
                />
                {newEstimated !== null && newEstimated > limits[newTier] && (
                  <p className="flex items-center gap-1 text-[10.5px] text-amber-500">
                    <AlertTriangle className="h-3 w-3" />
                    Acima do limite de {DATE_TIER_META[newTier].label}
                  </p>
                )}
              </div>
            )}
            <p className="text-[11.5px] text-muted-foreground">
              Sem data, vai pra <span className="font-semibold">Ideias soltas</span>.
              Marque uma data depois clicando num dia do calendário.
            </p>
            <button
              onClick={() => handleCreate()}
              disabled={!newName.trim()}
              className={cn(btnPrimary, "w-full")}
            >
              Criar ideia
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Date row                                                                   */
/* -------------------------------------------------------------------------- */

interface DateRowProps {
  date: DateIdea;
  limits: Record<DateCostTier, number>;
  expanded: boolean;
  onToggle: () => void;
  onFieldUpdate: (id: string, updates: Partial<DateIdea>) => void;
  onStatusChange: (id: string, status: DateIdea["status"]) => void;
  onDelete: (id: string) => void;
  onAssignDate: (date: DateIdea) => void;
}

function DateRow({
  date: d,
  limits,
  expanded,
  onToggle,
  onFieldUpdate,
  onStatusChange,
  onDelete,
  onAssignDate,
}: DateRowProps) {
  const tier = d.cost_tier as DateCostTier | null;
  const cost = d.actual_cost ?? d.estimated_cost ?? null;
  return (
    <motion.div
      id={`date-${d.id}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "overflow-hidden rounded-2xl border bg-card",
        tier ? DATE_TIER_META[tier].border : "border-border"
      )}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1",
              tier
                ? `${DATE_TIER_META[tier].bg} ${DATE_TIER_META[tier].ring}`
                : "bg-gradient-to-br from-[oklch(0.68_0.22_340)]/20 to-[oklch(0.78_0.16_22)]/10 ring-primary/10"
            )}
          >
            {tier ? (
              <span className="text-xl leading-none">{DATE_TIER_META[tier].emoji}</span>
            ) : (
              <Heart className="h-5 w-5 text-primary" fill="currentColor" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-[15px] font-semibold tracking-tight">
                {d.name}
              </h3>
              {tier && <TierBadge tier={tier} size="xs" />}
              <StatusBadge status={d.status} />
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-muted-foreground">
              {d.date_time && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(d.date_time), "dd MMM, HH:mm", { locale: ptBR })}
                </span>
              )}
              {cost !== null && (
                <span className="flex items-center gap-1 font-semibold tabular text-foreground/80">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  {brl(cost)}
                  {d.actual_cost !== null && d.estimated_cost !== null && d.actual_cost !== d.estimated_cost && (
                    <span className="text-muted-foreground/60">
                      (est. {brl(d.estimated_cost)})
                    </span>
                  )}
                </span>
              )}
              {d.expected_weather && <span>{WEATHER_EMOJI[d.expected_weather]}</span>}
              {d.address && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{d.place_name ?? d.address}</span>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onToggle}
              aria-label={expanded ? "Fechar" : "Expandir"}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => onDelete(d.id)}
              aria-label="Remover"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-red-500/10 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-border bg-background/30 px-4 py-4 sm:px-5">
              <div className="space-y-1.5">
                <FilterLabel>Status</FilterLabel>
                <div className="grid grid-cols-3 gap-2">
                  {STATUS_BUTTONS.map(({ value, label, emoji }) => (
                    <button
                      key={value}
                      onClick={() => onStatusChange(d.id, value)}
                      className={cn(
                        "flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-[12px] font-medium transition-all",
                        d.status === value
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <span>{emoji}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* COST SECTION */}
              <CostSection
                value={tier}
                estimated={d.estimated_cost}
                actual={d.actual_cost}
                status={d.status}
                limits={limits}
                onTierChange={(v) => onFieldUpdate(d.id, { cost_tier: v })}
                onEstimatedChange={(v) => onFieldUpdate(d.id, { estimated_cost: v })}
                onActualChange={(v) => onFieldUpdate(d.id, { actual_cost: v })}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <FilterLabel>Endereço</FilterLabel>
                  <Input
                    placeholder="Rua das Flores, 123"
                    value={d.address ?? ""}
                    onChange={(e) =>
                      onFieldUpdate(d.id, { address: e.target.value || null })
                    }
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <FilterLabel>Data e horário</FilterLabel>
                  <button
                    type="button"
                    onClick={() => onAssignDate(d)}
                    className="flex h-9 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-background px-3 text-sm transition-colors hover:bg-muted/40"
                  >
                    <span
                      className={cn(
                        "tabular truncate",
                        d.date_time ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {d.date_time
                        ? format(new Date(d.date_time), "dd MMM yyyy, HH:mm", {
                            locale: ptBR,
                          })
                        : "Definir data e hora"}
                    </span>
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  <FilterLabel>Clima</FilterLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {WEATHER_OPTIONS.map((w) => (
                      <button
                        key={w.value}
                        onClick={() =>
                          onFieldUpdate(d.id, {
                            expected_weather:
                              d.expected_weather === w.value ? null : w.value,
                          })
                        }
                        className={cn(
                          chip,
                          d.expected_weather === w.value ? chipActive : chipIdle
                        )}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <FilterLabel>Google Maps</FilterLabel>
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="Link do Maps"
                      value={d.maps_link ?? ""}
                      onChange={(e) =>
                        onFieldUpdate(d.id, { maps_link: e.target.value || null })
                      }
                      className="h-9"
                    />
                    {d.maps_link && (
                      <a
                        href={d.maps_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border transition-colors hover:bg-accent"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* AssignDateDialog                                                           */
/* -------------------------------------------------------------------------- */

interface AssignDateDialogProps {
  date: DateIdea | null;
  onClose: () => void;
  onAssign: (dateTime: string | null) => Promise<void>;
}

function AssignDateDialog({ date, onClose, onAssign }: AssignDateDialogProps) {
  const initial = date?.date_time
    ? new Date(date.date_time).toISOString().slice(0, 16)
    : "";
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);

  useMemo(() => {
    setValue(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date?.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onAssign(value ? new Date(value).toISOString() : null);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      await onAssign(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!date} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Marcar data e hora</DialogTitle>
        </DialogHeader>
        {date && (
          <div className="space-y-4 pt-2">
            <p className="rounded-xl border border-border bg-background/40 px-3 py-2 text-sm font-medium">
              {date.name}
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Quando?</Label>
              <Input
                type="datetime-local"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-10 tabular"
                autoFocus
              />
            </div>
            <div className="flex gap-2 pt-1">
              {date.date_time && (
                <button
                  onClick={handleRemove}
                  disabled={saving}
                  className="flex-1 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                >
                  Tirar data
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!value || saving}
                className={cn(btnPrimary, "flex-1")}
              >
                {saving ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
