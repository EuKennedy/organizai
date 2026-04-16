import { useRef } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { MimoCard } from "@/components/mimo-card";
import type { Mimo, MimoCategory } from "@/types";
import { MIMO_CATEGORY_MAP } from "@/types";

interface MimoCarouselProps {
  category: MimoCategory;
  mimos: Mimo[];
  onSelect: (m: Mimo) => void;
  onAdd: (category: MimoCategory) => void;
}

export function MimoCarousel({ category, mimos, onSelect, onAdd }: MimoCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const meta = MIMO_CATEGORY_MAP[category];

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const owned = mimos.filter((m) => m.owned).length;
  const total = mimos.length;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl">{meta.emoji}</span>
          <h2 className="text-base font-semibold tracking-tight sm:text-lg">
            {meta.label}
          </h2>
          {total > 0 && (
            <span className="text-xs text-muted-foreground">
              {owned}/{total}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {mimos.length > 0 && (
            <div className="hidden gap-1 sm:flex">
              <button
                onClick={() => scroll("left")}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-foreground/50 transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-foreground/50 transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
          <button
            onClick={() => onAdd(category)}
            className="flex h-8 items-center gap-1 rounded-full bg-primary/10 px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <Plus className="h-3 w-3" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        </div>
      </div>

      {mimos.length === 0 ? (
        <button
          onClick={() => onAdd(category)}
          className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border px-4 py-6 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-xl">
            {meta.emoji}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              Nenhum item em {meta.label.toLowerCase()}
            </p>
            <p className="text-xs text-muted-foreground/60">Clique para adicionar o primeiro</p>
          </div>
          <Plus className="h-5 w-5 text-muted-foreground/50" />
        </button>
      ) : (
        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-3 overflow-x-auto scroll-smooth pb-2 sm:gap-4"
        >
          {mimos.map((m) => (
            <MimoCard key={m.id} mimo={m} onClick={() => onSelect(m)} />
          ))}
        </div>
      )}
    </section>
  );
}
