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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const filteredList = useMemo(
    () => (statusFilter ? dates.filter((d) => d.status === statusFilter) : dates),
    [dates, statusFilter]
  );

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
          {/* Status filters */}
          <div className="mb-5 flex flex-wrap gap-1.5">
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
          // Scroll to the row after the view switches
          setTimeout(() => {
            const el = document.getElementById(`date-${d.id}`);
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 100);
        }}
        onDelete={handleDelete}
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
}

function DateRow({
  date: d,
  expanded,
  onToggle,
  onFieldUpdate,
  onStatusChange,
  onDelete,
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
                  <Input
                    type="datetime-local"
                    value={
                      d.date_time
                        ? new Date(d.date_time).toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      onFieldUpdate(
                        d.id,
                        "date_time",
                        e.target.value
                          ? new Date(e.target.value).toISOString()
                          : null
                      )
                    }
                    className="h-9"
                  />
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
