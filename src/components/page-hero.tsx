import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  /** Pequena "eyebrow" em uppercase/letter-spacing, cor primary/70 */
  eyebrow?: string;
  /** Título editorial (pode conter <em className="font-serif italic"> para ênfase) */
  title: ReactNode;
  /** Subtítulo/stat debaixo do título */
  subtitle?: ReactNode;
  /** Ação primária no topo direito (ex: botão Adicionar) */
  action?: ReactNode;
  /** Ação secundária (ex: Filtros) */
  secondaryAction?: ReactNode;
  /** Atmosfera de fundo */
  ambient?: "rose" | "plum" | "gold" | "teal";
  /** Imagem opcional pra virar backdrop blurado (ex: último poster) */
  backdropUrl?: string | null;
  className?: string;
}

const AMBIENT: Record<NonNullable<PageHeroProps["ambient"]>, string> = {
  rose: "bg-ambient-rose",
  plum: "bg-ambient-plum",
  gold: "bg-ambient-gold",
  teal: "bg-ambient-teal",
};

export function PageHero({
  eyebrow,
  title,
  subtitle,
  action,
  secondaryAction,
  ambient = "rose",
  backdropUrl,
  className,
}: PageHeroProps) {
  return (
    <div
      className={cn(
        "relative -mx-4 -mt-6 mb-6 overflow-hidden px-4 pb-8 pt-10 sm:-mx-6 sm:px-6 sm:pt-12 lg:-mx-8 lg:px-8 lg:pt-14",
        className
      )}
    >
      {/* Backdrop layer */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {backdropUrl && (
          <img
            src={backdropUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-25 blur-2xl saturate-[1.2]"
          />
        )}
        <div className={cn("absolute inset-0", AMBIENT[ambient])} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background" />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/80">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-2 text-3xl font-semibold leading-[1.05] tracking-tight sm:text-4xl lg:text-[44px]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-muted-foreground sm:text-[15px]">
              {subtitle}
            </p>
          )}
        </div>
        {(action || secondaryAction) && (
          <div className="flex shrink-0 items-center gap-2">
            {secondaryAction}
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
