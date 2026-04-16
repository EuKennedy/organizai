import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  want_to_watch: {
    label: "Quero assistir",
    className: "bg-primary/10 text-primary ring-primary/20",
  },
  watching: {
    label: "Assistindo",
    className: "bg-amber-500/10 text-amber-500 ring-amber-500/20",
  },
  watched: {
    label: "Assistido",
    className: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20",
  },
  idea: {
    label: "Ideia",
    className: "bg-primary/10 text-primary ring-primary/20",
  },
  scheduled: {
    label: "Agendado",
    className: "bg-amber-500/10 text-amber-500 ring-amber-500/20",
  },
  done: {
    label: "Realizado",
    className: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20",
  },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

export function StatusBadge({ status }: { status: StatusKey }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
