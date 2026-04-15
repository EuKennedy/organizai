import { useState } from "react";
import {
  Plus,
  Trash2,
  Heart,
  MapPin,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDates } from "@/hooks/use-dates";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export function DatesPage() {
  const { dates, loading, addDate, updateDate, deleteDate } = useDates();
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [newName, setNewName] = useState("");

  const filtered = statusFilter ? dates.filter((d) => d.status === statusFilter) : dates;
  const hasActiveFilter = statusFilter !== null;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await addDate({
        name: newName.trim(), address: null, date_time: null, expected_weather: null,
        maps_link: null, place_name: null, place_photos: [], status: "idea",
      });
      setNewName("");
      setCreateOpen(false);
      toast.success("Date adicionado!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  const handleFieldUpdate = async (id: string, field: keyof DateIdea, value: string | null) => {
    try { await updateDate(id, { [field]: value }); } catch { toast.error("Erro ao atualizar"); }
  };

  const handleStatusChange = async (id: string, status: DateIdea["status"]) => {
    try { await updateDate(id, { status }); } catch { toast.error("Erro"); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Dates</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {dates.length} {dates.length === 1 ? "ideia" : "ideias"} salvas
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dates.length > 0 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all sm:text-sm",
                hasActiveFilter
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showFilters && "rotate-180")} />
              Filtros
            </button>
          )}
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground sm:text-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Nova ideia</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && dates.length > 0 && (
        <div className="space-y-2 rounded-xl border border-border bg-card/50 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setStatusFilter(null)}
              className={cn("rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                !statusFilter ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              Todos
            </button>
            {STATUS_BUTTONS.map(({ value, label, emoji }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={cn("rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                  statusFilter === value ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                {emoji} {label}
              </button>
            ))}
          </div>
          {hasActiveFilter && (
            <button onClick={() => setStatusFilter(null)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>
      )}

      {/* Empty */}
      {!loading && dates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Heart className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold">Nenhuma ideia ainda</h3>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Comecem a planejar dates incriveis juntos
          </p>
          <button onClick={() => setCreateOpen(true)} className="mt-4 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
            <Plus className="h-4 w-4" /> Nova ideia
          </button>
        </div>
      )}

      {/* Dates list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((d) => {
            const isExpanded = expandedId === d.id;
            return (
              <motion.div
                key={d.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-xl border border-border bg-card"
              >
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-500/10">
                      <Heart className="h-5 w-5 text-pink-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold">{d.name}</h3>
                        <StatusBadge status={d.status} />
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
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
                      <button onClick={() => setExpandedId(isExpanded ? null : d.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/50 hover:bg-accent">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      <button onClick={async () => { await deleteDate(d.id); toast.success("Removido"); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/50 hover:bg-red-500/10 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="border-t border-border px-4 py-3 space-y-3">
                        {/* Status buttons */}
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Status</p>
                          <div className="grid grid-cols-3 gap-2">
                            {STATUS_BUTTONS.map(({ value, label, emoji }) => (
                              <button
                                key={value}
                                onClick={() => handleStatusChange(d.id, value)}
                                className={cn(
                                  "flex items-center justify-center gap-1 rounded-xl border-2 py-2 text-[11px] font-medium transition-all",
                                  d.status === value ? "border-primary bg-primary/10 text-primary" : "border-transparent bg-muted/50 text-muted-foreground"
                                )}
                              >
                                <span>{emoji}</span> {label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Endereco</Label>
                            <Input placeholder="Rua das Flores, 123" value={d.address ?? ""} onChange={(e) => handleFieldUpdate(d.id, "address", e.target.value || null)} className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Data e horario</Label>
                            <Input type="datetime-local" value={d.date_time ? new Date(d.date_time).toISOString().slice(0, 16) : ""} onChange={(e) => handleFieldUpdate(d.id, "date_time", e.target.value ? new Date(e.target.value).toISOString() : null)} className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Clima</Label>
                            <div className="flex gap-1.5">
                              {WEATHER_OPTIONS.map((w) => (
                                <button
                                  key={w.value}
                                  onClick={() => handleFieldUpdate(d.id, "expected_weather", d.expected_weather === w.value ? null : w.value)}
                                  className={cn("rounded-lg px-2 py-1.5 text-xs transition-all", d.expected_weather === w.value ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "bg-muted/50 text-muted-foreground")}
                                >
                                  {w.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Google Maps</Label>
                            <div className="flex gap-1.5">
                              <Input placeholder="Link do Maps" value={d.maps_link ?? ""} onChange={(e) => handleFieldUpdate(d.id, "maps_link", e.target.value || null)} className="h-8 text-sm" />
                              {d.maps_link && (
                                <a href={d.maps_link} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-accent">
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
          })}
        </AnimatePresence>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nova ideia de date</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome</Label>
              <Input placeholder='Ex: "Jantar no italiano"' value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()} autoFocus />
            </div>
            <button onClick={handleCreate} disabled={!newName.trim()} className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
              Criar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
