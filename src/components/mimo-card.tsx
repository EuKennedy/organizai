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
      className="group relative flex-none overflow-hidden text-left"
    >
      <div className="relative aspect-[3/4] w-32 overflow-hidden rounded-xl sm:w-40 lg:w-44">
        {/* Image or gradient */}
        {mimo.image_url ? (
          <img
            src={mimo.image_url}
            alt={mimo.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-rose-500/20">
            <Sparkles className="h-8 w-8 text-pink-300/50" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Status badges */}
        <div className="absolute left-2 top-2 flex gap-1">
          {mimo.owned ? (
            <span className="flex items-center gap-1 rounded-md bg-green-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              <Check className="h-2.5 w-2.5" />
              Tenho
            </span>
          ) : (
            <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur-sm">
              Desejo
            </span>
          )}
          {mimo.owned && mimo.finished && (
            <span className="flex items-center gap-1 rounded-md bg-orange-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              <AlertTriangle className="h-2.5 w-2.5" />
              Acabou
            </span>
          )}
        </div>

        {/* Bottom info */}
        <div className="absolute inset-x-0 bottom-0 p-2.5">
          {mimo.brand && (
            <p className="truncate text-[10px] font-medium uppercase tracking-wider text-white/60">
              {mimo.brand}
            </p>
          )}
          <p className={cn(
            "font-medium leading-tight text-white line-clamp-2",
            "text-xs sm:text-sm"
          )}>
            {mimo.name}
          </p>
        </div>
      </div>
    </button>
  );
}
