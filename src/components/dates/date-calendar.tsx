import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { DateIdea } from "@/types";

interface DateCalendarProps {
  year: number;
  month: number; // 0-11
  selectedDay: Date | null;
  dates: DateIdea[];
  onYearChange: (next: number) => void;
  onMonthChange: (next: number) => void;
  onDayClick: (day: Date) => void;
}

const MONTH_LABELS = [
  "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
  "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
];

const WEEK_LABELS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function statusDotClass(status: DateIdea["status"]): string {
  if (status === "scheduled") return "bg-primary";
  if (status === "done") return "bg-emerald-500";
  return "bg-purple-400";
}

export function DateCalendar({
  year,
  month,
  selectedDay,
  dates,
  onYearChange,
  onMonthChange,
  onDayClick,
}: DateCalendarProps) {
  // Counts per month for the current year (used in the strip)
  const monthCounts = useMemo(() => {
    const counts: number[] = Array.from({ length: 12 }, () => 0);
    for (const d of dates) {
      if (!d.date_time) continue;
      const dt = new Date(d.date_time);
      if (dt.getFullYear() === year) {
        const m = dt.getMonth();
        counts[m] = (counts[m] ?? 0) + 1;
      }
    }
    return counts;
  }, [dates, year]);

  // Days grid for the selected month (with leading/trailing days from neighbours)
  const days = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const start = startOfWeek(startOfMonth(firstOfMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(firstOfMonth), { weekStartsOn: 0 });
    const out: Date[] = [];
    let cursor = start;
    while (!isSameDay(cursor, end) && !isBefore(end, cursor)) {
      out.push(cursor);
      cursor = addDays(cursor, 1);
    }
    out.push(end);
    return out;
  }, [year, month]);

  // Index dates by yyyy-mm-dd
  const datesByDay = useMemo(() => {
    const map: Record<string, DateIdea[]> = {};
    for (const d of dates) {
      if (!d.date_time) continue;
      const k = format(new Date(d.date_time), "yyyy-MM-dd");
      (map[k] ??= []).push(d);
    }
    return map;
  }, [dates]);

  const todayStart = startOfDay(new Date());

  return (
    <div className="space-y-4">
      {/* Year switcher */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card/60 px-3 py-2 sm:px-4">
        <button
          type="button"
          onClick={() => onYearChange(year - 1)}
          aria-label="Ano anterior"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="font-serif text-2xl font-semibold tracking-tight tabular sm:text-[28px]">
          {year}
        </p>
        <button
          type="button"
          onClick={() => onYearChange(year + 1)}
          aria-label="Próximo ano"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Months strip */}
      <div className="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1">
        {MONTH_LABELS.map((m, i) => {
          const active = i === month;
          const count = monthCounts[i] ?? 0;
          const now = new Date();
          const isCurrent = i === now.getMonth() && year === now.getFullYear();
          return (
            <button
              key={m}
              type="button"
              onClick={() => onMonthChange(i)}
              className={cn(
                "snap-start relative flex shrink-0 flex-col items-center gap-0.5 rounded-2xl border px-3.5 py-2.5 transition-all",
                active
                  ? "border-primary/50 bg-primary/10 text-primary shadow-sm"
                  : "border-border bg-card/40 text-muted-foreground hover:border-border hover:bg-card/70 hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "text-[10.5px] font-semibold uppercase tracking-[0.18em]",
                  active ? "text-primary" : ""
                )}
              >
                {m}
              </span>
              <span className="text-[11px] font-medium tabular">
                {count > 0 ? count : "—"}
              </span>
              {isCurrent && !active && (
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 px-1">
        {WEEK_LABELS.map((w) => (
          <div
            key={w}
            className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1 px-1">
        {days.map((d, idx) => {
          const inMonth = isSameMonth(d, new Date(year, month));
          const today = isToday(d);
          const past = isBefore(d, todayStart) && !today;
          const key = format(d, "yyyy-MM-dd");
          const list = datesByDay[key] ?? [];
          const isSelected = selectedDay && isSameDay(d, selectedDay);

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onDayClick(d)}
              className={cn(
                "group relative aspect-square min-h-[44px] rounded-xl text-left transition-all",
                "flex flex-col items-stretch p-1.5",
                inMonth ? "" : "opacity-30",
                isSelected
                  ? "bg-primary/15 ring-2 ring-primary/60"
                  : today
                  ? "bg-primary/5 ring-1 ring-primary/30 hover:bg-primary/10"
                  : list.length > 0
                  ? "bg-card hover:bg-muted/40 ring-1 ring-border/60"
                  : "hover:bg-muted/30"
              )}
            >
              <span
                className={cn(
                  "text-[12px] font-semibold tabular leading-none",
                  today ? "text-primary" : past ? "text-muted-foreground/60" : "text-foreground"
                )}
              >
                {format(d, "d", { locale: ptBR })}
              </span>

              {/* Status dots */}
              {list.length > 0 && (
                <div className="mt-auto flex items-center gap-0.5">
                  {list.slice(0, 3).map((dt) => (
                    <span
                      key={dt.id}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        statusDotClass(dt.status)
                      )}
                    />
                  ))}
                  {list.length > 3 && (
                    <span className="text-[8.5px] font-semibold tabular text-muted-foreground">
                      +{list.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 px-1 text-[10.5px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400" /> Ideia
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Agendado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Realizado
        </span>
      </div>
    </div>
  );
}
