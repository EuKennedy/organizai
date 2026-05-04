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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDates } from "@/hooks/use-dates";
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
import { DateCalendar } from "@/components/dates/date-calendar";
import { DaySheet } from "@/components/dates/day-sheet";
import { btnPrimary, btnPrimarySm, chip, chipActive, chipIdle } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { WEATHER_EMOJI, type DateIdea, type WeatherIcon } from "@/types";

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

type ViewMode = "calendar" | "list";

export function DatesPage() {
  const { dates, loading, addDate, updateDate, deleteDate } = useDates();

  const today = new Date();
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [statusFilter, setStatusFilter] = useState<DateIdea["status"] | null>(null);
  const [monthFilter, setMonthFilter] = useState<string | null>(null); // YYYY-MM
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assigningDate, setAssigningDate] = useState<DateIdea | null>(null);

  const stats = useMemo(() => {
    const scheduled = dates.filter((d) => d.status === "scheduled").length;
    const done = dates.filter((d) => d.status === "done").length;
    const ideas = dates.filter((d) => !d.date_time || d.status === "idea").length;
    return { total: dates.length, scheduled, done, ideas };
  }, [dates]);

  // Dates without a date_time (ideias soltas)
  const looseIdeas = useMemo(
    () => dates.filter((d) => !d.date_time),
    [dates]
  );

  // Months that have any scheduled date — used in the list-view month filter
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
    if (monthFilter) {
      r = r.filter(
        (d) =>
          d.date_time &&
          format(new Date(d.date_time), "yyyy-MM") === monthFilter
      );
    }
    // Sort by proximity:
    //   1. Future dates first, ASCending (closest upcoming first)
    //   2. Past dates after, DESCending (most recent past first)
    //   3. Loose (no date_time) at the very end, by created_at desc
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
  }, [dates, statusFilter, monthFilter]);

  const handleCreate = async (params?: { name?: string; dateTime?: string | null }) => {
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
      });
      setNewName("");
      setCreateOpen(false);
      toast.success("Date adicionado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  const handleFieldUpdate = async (
    id: string,
    field: keyof DateIdea,
    value: string | null
  ) => {
    try {
      await updateDate(id, { [field]: value });
    } catch {
      toast.error("Erro ao atualizar");
    }
  };

  const handleStatusChange = async (id: string, status: DateIdea["status"]) => {
    try {
      await updateDate(id, { status });
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
          {/* Sort hint */}
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

          {/* Month filter — only shown if there are scheduled dates */}
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
        onClose={() => setSelectedDay(null)}
        onCreate={async ({ name, dateTime }) => {
          await handleCreate({ name, dateTime });
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

      {/* Create dialog (top-level + button) */}
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
            <p className="text-[11.5px] text-muted-foreground">
              Sem data, vai pra <span className="font-semibold">Ideias soltas</span>.
              Marque uma data depois clicando num dia do calendário ou expandindo a linha.
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
/* Date row (used in both list and ideias soltas sections)                   */
/* -------------------------------------------------------------------------- */

interface DateRowProps {
  date: DateIdea;
  expanded: boolean;
  onToggle: () => void;
  onFieldUpdate: (id: string, field: keyof DateIdea, value: string | null) => void;
  onStatusChange: (id: string, status: DateIdea["status"]) => void;
  onDelete: (id: string) => void;
  onAssignDate: (date: DateIdea) => void;
}

function DateRow({
  date: d,
  expanded,
  onToggle,
  onFieldUpdate,
  onStatusChange,
  onDelete,
  onAssignDate,
}: DateRowProps) {
  return (
    <motion.div
      id={`date-${d.id}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.68_0.22_340)]/20 to-[oklch(0.78_0.16_22)]/10 ring-1 ring-primary/10">
            <Heart className="h-5 w-5 text-primary" fill="currentColor" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-[15px] font-semibold tracking-tight">
                {d.name}
              </h3>
              <StatusBadge status={d.status} />
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-muted-foreground">
              {d.date_time && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(d.date_time), "dd MMM, HH:mm", { locale: ptBR })}
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
                        "flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-[12px] font-medium transition-all",
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
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <FilterLabel>Endereço</FilterLabel>
                  <Input
                    placeholder="Rua das Flores, 123"
                    value={d.address ?? ""}
                    onChange={(e) =>
                      onFieldUpdate(d.id, "address", e.target.value || null)
                    }
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <FilterLabel>Data e horário</FilterLabel>
                  <button
                    type="button"
                    onClick={() => onAssignDate(d)}
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm transition-colors hover:bg-muted/40"
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
                          onFieldUpdate(
                            d.id,
                            "expected_weather",
                            d.expected_weather === w.value ? null : w.value
                          )
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
                        onFieldUpdate(d.id, "maps_link", e.target.value || null)
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
/* AssignDateDialog — picker dedicado pra anexar / mudar data + hora         */
/* Sem race com o re-render do parent (input fica em state local até salvar)*/
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

  // Reset internal value whenever a new date is opened
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
