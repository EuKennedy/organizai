import { Check, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Mimo } from "@/types";

interface MimoCardProps {
  mimo: Mimo;
  onClick: () => void;
}

export function MimoCard({ mimo, onClick }: MimoCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative flex-none snap-start text-left"
    >
      <div className="relative w-[140px] overflow-hidden rounded-2xl ring-1 ring-white/5 shadow-lg shadow-black/30 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-black/50 group-hover:ring-primary/30 sm:w-[172px] lg:w-[196px]">
        {mimo.image_url ? (
          <img
            src={mimo.image_url}
            alt={mimo.name}
            className="aspect-[2/3] w-full object-cover transition-transform duration-[450ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.05]"
            loading="lazy"
          />
        ) : (
          <div className="relative flex aspect-[2/3] w-full items-center justify-center bg-gradient-to-br from-[oklch(0.68_0.22_340)]/25 via-[oklch(0.78_0.16_22)]/20 to-[oklch(0.55_0.22_300)]/25">
            <Sparkles className="h-10 w-10 text-white/70" strokeWidth={1.25} />
          </div>
        )}

        {/* Gradient permanente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />

        {/* Status — UM pill por vez */}
        {mimo.owned && mimo.finished ? (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-amber-500/95 px-2 py-0.5 text-[10.5px] font-semibold text-white backdrop-blur-md ring-1 ring-white/10 shadow-sm">
            <AlertTriangle className="h-2.5 w-2.5" strokeWidth={2.5} />
            Acabou
          </div>
        ) : mimo.owned ? (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-emerald-500/95 px-2 py-0.5 text-[10.5px] font-semibold text-white backdrop-blur-md ring-1 ring-white/10 shadow-sm">
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
            Tenho
          </div>
        ) : (
          <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10.5px] font-medium text-white/85 backdrop-blur-md ring-1 ring-white/10">
            Desejo
          </div>
        )}

        {/* Título + marca */}
        <div className={cn("absolute inset-x-0 bottom-0 p-3")}>
          {mimo.brand && (
            <p className="truncate text-[9.5px] font-semibold uppercase tracking-[0.15em] text-white/60">
              {mimo.brand}
            </p>
          )}
          <p className="mt-0.5 text-[13px] font-semibold leading-tight text-white line-clamp-2 drop-shadow-md sm:text-sm">
            {mimo.name}
          </p>
        </div>
      </div>
    </button>
  );
}
