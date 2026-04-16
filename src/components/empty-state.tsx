import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  tone?: "coral" | "rose" | "plum" | "teal" | "gold";
  className?: string;
}

const TONES: Record<NonNullable<EmptyStateProps["tone"]>, string> = {
  coral: "from-[oklch(0.78_0.16_22)]/30 to-[oklch(0.78_0.16_22)]/5",
  rose:  "from-[oklch(0.68_0.22_340)]/30 to-[oklch(0.68_0.22_340)]/5",
  plum:  "from-[oklch(0.55_0.22_300)]/30 to-[oklch(0.55_0.22_300)]/5",
  teal:  "from-[oklch(0.70_0.13_195)]/30 to-[oklch(0.70_0.13_195)]/5",
  gold:  "from-[oklch(0.80_0.15_80)]/30 to-[oklch(0.80_0.15_80)]/5",
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "coral",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center py-20 text-center sm:py-24",
        className
      )}
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 -z-10 rounded-full bg-primary/25 blur-3xl" />
        <div
          className={cn(
            "flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ring-1 ring-white/10 backdrop-blur-xl",
            TONES[tone]
          )}
        >
          <Icon className="h-9 w-9 text-foreground/90" strokeWidth={1.5} />
        </div>
      </div>
      <h3 className="text-2xl font-semibold tracking-tight sm:text-[26px]">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground sm:text-[15px]">
        {description}
      </p>
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}
