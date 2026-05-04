import { Check, AlertTriangle, ShoppingBag, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WishlistItem } from "@/types";

interface Props {
  item: WishlistItem;
  onClick: () => void;
}

function formatBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);
}

export function WishlistCard({ item, onClick }: Props) {
  const isBought = item.status === "comprado";
  const isAbandoned = item.status === "desistido";
  const priorityRing =
    item.priority === "alta"
      ? "ring-rose-500/30"
      : item.priority === "baixa"
      ? "ring-zinc-500/15"
      : "ring-white/5";

  return (
    <button
      onClick={onClick}
      className="group relative flex-none snap-start text-left"
    >
      <div
        className={cn(
          "relative w-[140px] overflow-hidden rounded-2xl shadow-lg shadow-black/30 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-black/50 group-hover:ring-primary/30 sm:w-[172px] lg:w-[196px]",
          "ring-1",
          priorityRing,
          (isBought || isAbandoned) && "opacity-65"
        )}
      >
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            className="aspect-[3/4] w-full object-cover transition-transform duration-[450ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex aspect-[3/4] w-full items-center justify-center bg-gradient-to-br from-[oklch(0.78_0.16_22)]/25 via-[oklch(0.65_0.18_280)]/20 to-[oklch(0.55_0.22_300)]/25">
            <ShoppingBag className="h-10 w-10 text-white/70" strokeWidth={1.25} />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />

        {/* Top right pill */}
        {isBought ? (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-emerald-500/95 px-2 py-0.5 text-[10.5px] font-semibold text-white backdrop-blur-md ring-1 ring-white/10 shadow-sm">
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
            Comprado
          </div>
        ) : isAbandoned ? (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-zinc-600/95 px-2 py-0.5 text-[10.5px] font-semibold text-white backdrop-blur-md ring-1 ring-white/10 shadow-sm">
            <AlertTriangle className="h-2.5 w-2.5" strokeWidth={2.5} />
            Desisti
          </div>
        ) : item.priority === "alta" ? (
          <div className="absolute right-2 top-2 rounded-full bg-rose-500/95 px-2 py-0.5 text-[10.5px] font-semibold text-white backdrop-blur-md ring-1 ring-white/10 shadow-sm">
            Alta
          </div>
        ) : null}

        {item.link && (
          <div className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white/90 backdrop-blur-md ring-1 ring-white/10">
            <ExternalLink className="h-3 w-3" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-3">
          {item.brand && (
            <p className="truncate text-[9.5px] font-semibold uppercase tracking-[0.15em] text-white/60">
              {item.brand}
            </p>
          )}
          <p className="mt-0.5 text-[13px] font-semibold leading-tight text-white line-clamp-2 drop-shadow-md sm:text-sm">
            {item.name}
          </p>
          {item.price != null && (
            <p className="mt-1 text-[11.5px] font-semibold tabular text-primary/90">
              {formatBRL(Number(item.price))}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
