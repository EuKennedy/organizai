import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Calendar, MapPin, Heart, Trash2, Sparkles, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status-badge";
import { btnPrimary } from "@/lib/ui";
import { cn } from "@/lib/utils";
import {
  WEATHER_EMOJI,
  DATE_TIER_META,
  type DateIdea,
  type DateCostTier,
} from "@/types";

const TIERS: DateCostTier[] = [1, 2, 3];

function brl(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);
}

interface DaySheetProps {
  /** Selected day (Date at 00:00 local). Null = closed. */
  day: Date | null;
  dates: DateIdea[];
  /** Tier R$ ceiling map for hints. */
  limits: Record<DateCostTier, number>;
  onClose: () => void;
  /** Create with name + date_time pre-set to this day. Time defaults to 19:00. */
  onCreate: (params: {
    name: string;
    dateTime: string;
    cost_tier?: DateCostTier | null;
    estimated_cost?: number | null;
  }) => Promise<void>;
  onSelect: (date: DateIdea) => void;
  onDelete: (id: string) => Promise<void>;
  /** Set/clear cost tier on an existing date inline. */
  onSetTier: (id: string, tier: DateCostTier | null) => void;
  /** Set the cost value (actual if done, else estimated). */
  onSetCost: (id: string, value: number | null) => void;
  /** Attach an existing loose idea to the selected day at the given time. */
  onAttachLoose: (id: string, dateTime: string) => Promise<void>;
}

export function DaySheet({
  day,
  dates,
  limits,
  onClose,
  onCreate,
  onSelect,
  onDelete,
  onSetTier,
  onSetCost,
  onAttachLoose,
}: DaySheetProps) {
  const [name, setName] = useState("");
  const [time, setTime] = useState("19:00");
  const [tier, setTier] = useState<DateCostTier | null>(null);
  const [estimated, setEstimated] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [attaching, setAttaching] = useState<string | null>(null);
  const [showLooseIdeas, setShowLooseIdeas] = useState(false);
  /** Local cost drafts keyed by date id — commits onBlur/Enter to avoid refetch per keystroke. */
  const [costDrafts, setCostDrafts] = useState<Record<string, string>>({});

  const commitCost = (id: string, raw: string) => {
    const v = parseFloat(raw.replace(",", "."));
    onSetCost(id, isFinite(v) && v >= 0 ? v : null);
  };

  const isOpen = !!day;
  const dayDates = day
    ? dates.filter(
        (d) =>
          d.date_time &&
          format(new Date(d.date_time), "yyyy-MM-dd") ===
            format(day, "yyyy-MM-dd")
      )
    : [];

  const looseIdeas = useMemo(
    () => dates.filter((d) => !d.date_time && d.status !== "done"),
    [dates]
  );

  const handleCreate = async () => {
    if (!day || !name.trim()) return;
    const [hh, mm] = time.split(":").map((s) => parseInt(s, 10));
    const dt = new Date(day);
    dt.setHours(hh ?? 19, mm ?? 0, 0, 0);
    setCreating(true);
    try {
      await onCreate({
        name: name.trim(),
        dateTime: dt.toISOString(),
        cost_tier: tier,
        estimated_cost: estimated,
      });
      setName("");
      setTier(null);
      setEstimated(null);
    } finally {
      setCreating(false);
    }
  };

  const handleAttach = async (id: string) => {
    if (!day) return;
    const [hh, mm] = time.split(":").map((s) => parseInt(s, 10));
    const dt = new Date(day);
    dt.setHours(hh ?? 19, mm ?? 0, 0, 0);
    setAttaching(id);
    try {
      await onAttachLoose(id, dt.toISOString());
      setShowLooseIdeas(false);
    } finally {
      setAttaching(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && day && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-border bg-card shadow-2xl",
              "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85dvh] sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border"
            )}
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur-md">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {format(day, "EEEE", { locale: ptBR })}
                </p>
                <h3 className="mt-0.5 font-serif text-xl font-semibold tracking-tight">
                  {format(day, "d 'de' MMMM, yyyy", { locale: ptBR })}
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/40 text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Existing dates */}
            <div className="space-y-2 px-5 pt-4">
              {dayDates.length === 0 && (
                <p className="rounded-2xl border border-dashed border-border/60 bg-background/40 px-4 py-6 text-center text-sm text-muted-foreground">
                  Nada planejado pra esse dia ainda.
                </p>
              )}
              {dayDates.map((d) => (
                <div
                  key={d.id}
                  className="group rounded-2xl border border-border bg-background/40 p-3"
                >
                 <div className="flex items-center gap-3">
                  <button
                    onClick={() => onSelect(d)}
                    className="flex flex-1 min-w-0 items-center gap-3 text-left"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/15">
                      <Heart className="h-4 w-4 text-primary" fill="currentColor" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold tracking-tight">
                          {d.name}
                        </p>
                        {d.cost_tier && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide ring-1",
                              DATE_TIER_META[d.cost_tier as DateCostTier].bg,
                              DATE_TIER_META[d.cost_tier as DateCostTier].text,
                              DATE_TIER_META[d.cost_tier as DateCostTier].ring
                            )}
                          >
                            <span className="text-[10px] leading-none">
                              {DATE_TIER_META[d.cost_tier as DateCostTier].emoji}
                            </span>
                            {DATE_TIER_META[d.cost_tier as DateCostTier].label}
                          </span>
                        )}
                        <StatusBadge status={d.status} />
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0 text-[11px] text-muted-foreground">
                        {d.date_time && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(d.date_time), "HH:mm", {
                              locale: ptBR,
                            })}
                          </span>
                        )}
                        {d.expected_weather && (
                          <span>{WEATHER_EMOJI[d.expected_weather]}</span>
                        )}
                        {d.address && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {d.place_name ?? d.address}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => onDelete(d.id)}
                    aria-label="Remover"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                 </div>

                  {/* Inline tier quick-picker — categorizar sem sair do calendário */}
                  <div className="mt-2.5 flex items-center gap-1.5 border-t border-border/50 pt-2.5">
                    <span className="text-[9.5px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                      Tier
                    </span>
                    <div className="flex flex-1 gap-1">
                      {TIERS.map((t) => {
                        const meta = DATE_TIER_META[t];
                        const active = d.cost_tier === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => onSetTier(d.id, active ? null : t)}
                            className={cn(
                              "flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border px-1.5 py-1 text-[10px] font-semibold transition-all",
                              active
                                ? `${meta.bg} ${meta.border} ${meta.text}`
                                : "border-border bg-muted/20 text-muted-foreground/70 hover:bg-muted/40"
                            )}
                          >
                            <span className="text-[11px] leading-none">{meta.emoji}</span>
                            {meta.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cost input — aparece quando tier selecionado */}
                  {d.cost_tier && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[9.5px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                        {d.status === "done" ? "Gasto" : "Estimado"}
                      </span>
                      <div className="relative flex-1">
                        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground">
                          R$
                        </span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          placeholder={`até ${brl(limits[d.cost_tier as DateCostTier])}`}
                          value={
                            costDrafts[d.id] ??
                            (() => {
                              const stored =
                                d.status === "done" ? d.actual_cost : d.estimated_cost;
                              return stored != null ? String(stored) : "";
                            })()
                          }
                          onChange={(e) =>
                            setCostDrafts((p) => ({ ...p, [d.id]: e.target.value }))
                          }
                          onBlur={(e) => commitCost(d.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              commitCost(d.id, (e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="h-8 pl-8 text-xs tabular"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add new — Hora compartilhada com "anexar ideia" */}
            <div className="space-y-3 border-t border-border bg-background/30 px-5 py-4 mt-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Adicionar nesse dia
                </p>
                <div className="flex items-center gap-1.5 rounded-full bg-card/80 px-2.5 py-1 ring-1 ring-border">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="bg-transparent text-[12px] font-semibold tabular outline-none"
                  />
                </div>
              </div>

              {/* Criar novo */}
              <div className="space-y-2 rounded-2xl border border-border bg-card/40 p-3">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Criar novo date
                </Label>
                <Input
                  placeholder='Ex: "Jantar no italiano"'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  className="h-10"
                />

                {/* Tier picker */}
                <div className="grid grid-cols-3 gap-1.5">
                  {TIERS.map((t) => {
                    const meta = DATE_TIER_META[t];
                    const active = tier === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTier(active ? null : t)}
                        className={cn(
                          "flex cursor-pointer flex-col items-center gap-0.5 rounded-xl border py-1.5 text-[10.5px] font-semibold transition-all",
                          active
                            ? `${meta.bg} ${meta.border} ${meta.text}`
                            : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
                        )}
                      >
                        <span className="text-sm leading-none">{meta.emoji}</span>
                        {meta.label}
                        <span className="text-[9px] opacity-70 tabular">{brl(limits[t])}</span>
                      </button>
                    );
                  })}
                </div>

                {tier !== null && (
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder={`Custo estimado · até ${brl(limits[tier])}`}
                    value={estimated ?? ""}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setEstimated(isFinite(v) ? v : null);
                    }}
                    className="h-9 tabular"
                  />
                )}

                <button
                  onClick={handleCreate}
                  disabled={!name.trim() || creating}
                  className={cn(btnPrimary, "w-full")}
                >
                  <Plus className="h-4 w-4" />
                  {creating ? "Criando…" : "Adicionar novo"}
                </button>
              </div>

              {/* Anexar uma ideia solta */}
              {looseIdeas.length > 0 && (
                <div className="space-y-2 rounded-2xl border border-border bg-card/40 p-3">
                  <button
                    type="button"
                    onClick={() => setShowLooseIdeas((v) => !v)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Anexar ideia solta
                      </span>
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tabular text-primary">
                        {looseIdeas.length}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {showLooseIdeas ? "Fechar" : "Ver"}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {showLooseIdeas && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1.5 pt-2">
                          {looseIdeas.map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => handleAttach(d.id)}
                              disabled={attaching === d.id}
                              className="flex w-full items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-left transition-all hover:border-primary/40 hover:bg-primary/[0.04] disabled:opacity-50"
                            >
                              <Heart className="h-3.5 w-3.5 shrink-0 text-primary" fill="currentColor" />
                              <span className="flex-1 truncate text-sm">{d.name}</span>
                              <span className="text-[11px] font-medium text-primary">
                                {attaching === d.id ? "Anexando…" : "Marcar →"}
                              </span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
