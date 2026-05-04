import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Calendar, MapPin, Heart, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status-badge";
import { btnPrimary } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { WEATHER_EMOJI, type DateIdea } from "@/types";

interface DaySheetProps {
  /** Selected day (Date at 00:00 local). Null = closed. */
  day: Date | null;
  dates: DateIdea[];
  onClose: () => void;
  /** Create with name + date_time pre-set to this day. Time defaults to 19:00. */
  onCreate: (params: { name: string; dateTime: string }) => Promise<void>;
  onSelect: (date: DateIdea) => void;
  onDelete: (id: string) => Promise<void>;
}

export function DaySheet({
  day,
  dates,
  onClose,
  onCreate,
  onSelect,
  onDelete,
}: DaySheetProps) {
  const [name, setName] = useState("");
  const [time, setTime] = useState("19:00");
  const [creating, setCreating] = useState(false);

  const isOpen = !!day;
  const dayDates = day
    ? dates.filter(
        (d) =>
          d.date_time &&
          format(new Date(d.date_time), "yyyy-MM-dd") ===
            format(day, "yyyy-MM-dd")
      )
    : [];

  const handleCreate = async () => {
    if (!day || !name.trim()) return;
    const [hh, mm] = time.split(":").map((s) => parseInt(s, 10));
    const dt = new Date(day);
    dt.setHours(hh ?? 19, mm ?? 0, 0, 0);
    setCreating(true);
    try {
      await onCreate({ name: name.trim(), dateTime: dt.toISOString() });
      setName("");
    } finally {
      setCreating(false);
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
                  className="group flex items-center gap-3 rounded-2xl border border-border bg-background/40 p-3"
                >
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
              ))}
            </div>

            {/* Quick add */}
            <div className="space-y-3 border-t border-border bg-background/30 px-5 py-4 mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Adicionar nesse dia
              </p>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground">Nome</Label>
                  <Input
                    placeholder='Ex: "Jantar no italiano"'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground">Hora</Label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="h-10 w-28 tabular"
                  />
                </div>
              </div>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || creating}
                className={cn(btnPrimary, "w-full")}
              >
                <Plus className="h-4 w-4" />
                {creating ? "Criando…" : "Adicionar"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
