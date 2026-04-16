import { Plus } from "lucide-react";
import { MimoCard } from "@/components/mimo-card";
import { MediaCarouselShell } from "@/components/media-carousel-shell";
import { btnSecondarySm } from "@/lib/ui";
import type { Mimo, MimoCategory, MimoCategoryDef } from "@/types";

interface MimoCarouselProps {
  meta: MimoCategoryDef;
  mimos: Mimo[];
  onSelect: (m: Mimo) => void;
  onAdd: (category: MimoCategory) => void;
}

export function MimoCarousel({ meta, mimos, onSelect, onAdd }: MimoCarouselProps) {
  const owned = mimos.filter((m) => m.owned).length;
  const total = mimos.length;

  if (total === 0) {
    return (
      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4 px-1">
          <h2 className="flex items-baseline gap-2.5 text-xl font-semibold tracking-tight sm:text-2xl">
            <span className="text-xl sm:text-2xl">{meta.emoji}</span>
            {meta.label}
          </h2>
        </div>
        <button
          onClick={() => onAdd(meta.value)}
          className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-dashed border-border bg-card/40 px-5 py-6 text-left transition-all hover:border-primary/40 hover:bg-primary/[0.04]"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-2xl ring-1 ring-primary/20">
            {meta.emoji}
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-semibold">Nada em {meta.label.toLowerCase()} ainda</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Adicione o primeiro item desta categoria
            </p>
          </div>
          <Plus className="h-5 w-5 text-muted-foreground/60 transition-colors group-hover:text-primary" />
        </button>
      </section>
    );
  }

  const titleNode = (
    <span className="inline-flex items-baseline gap-2.5">
      <span className="text-xl sm:text-2xl">{meta.emoji}</span>
      <span>{meta.label}</span>
      <span className="text-sm font-normal text-muted-foreground tabular">
        {owned}/{total}
      </span>
    </span>
  );

  return (
    <MediaCarouselShell
      title={titleNode}
      action={
        <button onClick={() => onAdd(meta.value)} className={btnSecondarySm}>
          <Plus className="h-3 w-3" />
          <span className="hidden sm:inline">Adicionar</span>
        </button>
      }
    >
      {mimos.map((m) => (
        <MimoCard key={m.id} mimo={m} onClick={() => onSelect(m)} />
      ))}
    </MediaCarouselShell>
  );
}
