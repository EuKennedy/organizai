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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDates } from "@/hooks/use-dates";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { WEATHER_EMOJI, type DateIdea, type WeatherIcon } from "@/types";

const WEATHER_OPTIONS: { value: WeatherIcon; label: string }[] = [
  { value: "sunny", label: `${WEATHER_EMOJI.sunny} Ensolarado` },
  { value: "cloudy", label: `${WEATHER_EMOJI.cloudy} Nublado` },
  { value: "rainy", label: `${WEATHER_EMOJI.rainy} Chuvoso` },
  { value: "snowy", label: `${WEATHER_EMOJI.snowy} Nevando` },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "idea", label: "Ideia" },
  { value: "scheduled", label: "Agendado" },
  { value: "done", label: "Realizado" },
] as const;

export function DatesPage() {
  const { dates, loading, addDate, updateDate, deleteDate } = useDates();
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Create form state
  const [newName, setNewName] = useState("");

  const filtered = statusFilter === "all" ? dates : dates.filter((d) => d.status === statusFilter);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await addDate({
        name: newName.trim(),
        address: null,
        date_time: null,
        expected_weather: null,
        maps_link: null,
        place_name: null,
        place_photos: [],
        status: "idea",
      });
      setNewName("");
      setCreateOpen(false);
      toast.success("Date adicionado!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar date");
    }
  };

  const handleStatusChange = async (id: string, status: DateIdea["status"]) => {
    try {
      await updateDate(id, { status });
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleFieldUpdate = async (id: string, field: keyof DateIdea, value: string | null) => {
    try {
      await updateDate(id, { [field]: value });
    } catch {
      toast.error("Erro ao atualizar");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteDate(id);
      toast.success(`"${name}" removido`);
    } catch {
      toast.error("Erro ao remover");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ideias de Dates</h1>
          <p className="text-sm text-muted-foreground">
            {dates.length} {dates.length === 1 ? "ideia" : "ideias"} salvas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Nova ideia
          </Button>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      )}

      {!loading && dates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-medium">Nenhuma ideia ainda</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Clique em "Nova ideia" para comecar a planejar dates
          </p>
        </div>
      )}

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
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardContent className="p-4">
                    {/* Main row */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Heart className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-medium">{d.name}</h3>
                          <StatusBadge status={d.status} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {d.date_time && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(d.date_time), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                            </span>
                          )}
                          {d.expected_weather && (
                            <span>{WEATHER_EMOJI[d.expected_weather]}</span>
                          )}
                          {d.address && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{d.place_name ?? d.address}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setExpandedId(isExpanded ? null : d.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(d.id, d.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Endereco</Label>
                              <Input
                                placeholder="Ex: Rua das Flores, 123"
                                value={d.address ?? ""}
                                onChange={(e) => handleFieldUpdate(d.id, "address", e.target.value || null)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Data e horario</Label>
                              <Input
                                type="datetime-local"
                                value={d.date_time ? new Date(d.date_time).toISOString().slice(0, 16) : ""}
                                onChange={(e) =>
                                  handleFieldUpdate(d.id, "date_time", e.target.value ? new Date(e.target.value).toISOString() : null)
                                }
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Clima esperado</Label>
                              <Select
                                value={d.expected_weather ?? "none"}
                                onValueChange={(v) =>
                                  handleFieldUpdate(d.id, "expected_weather", v === "none" ? null : v)
                                }
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Selecionar" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Nenhum</SelectItem>
                                  {WEATHER_OPTIONS.map((w) => (
                                    <SelectItem key={w.value} value={w.value}>
                                      {w.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Link Google Maps</Label>
                              <div className="flex gap-1.5">
                                <Input
                                  placeholder="https://maps.google.com/..."
                                  value={d.maps_link ?? ""}
                                  onChange={(e) => handleFieldUpdate(d.id, "maps_link", e.target.value || null)}
                                  className="h-8 text-sm"
                                />
                                {d.maps_link && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    asChild
                                  >
                                    <a href={d.maps_link} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div className="sm:col-span-2">
                              <Label className="text-xs">Status</Label>
                              <Select
                                value={d.status}
                                onValueChange={(v) => handleStatusChange(d.id, v as DateIdea["status"])}
                              >
                                <SelectTrigger className="mt-1.5 h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="idea">Ideia</SelectItem>
                                  <SelectItem value="scheduled">Agendado</SelectItem>
                                  <SelectItem value="done">Realizado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova ideia de date</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input
                placeholder='Ex: "Jantar no italiano"'
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
            </div>
            <Button onClick={handleCreate} className="w-full" disabled={!newName.trim()}>
              Criar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
