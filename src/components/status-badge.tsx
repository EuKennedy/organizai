import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  want_to_watch: { label: "Quero assistir", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  watching: { label: "Assistindo", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  watched: { label: "Assistido", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  idea: { label: "Ideia", className: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  scheduled: { label: "Agendado", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  done: { label: "Realizado", className: "bg-green-500/10 text-green-500 border-green-500/20" },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

export function StatusBadge({ status }: { status: StatusKey }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
