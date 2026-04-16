import { ImageIcon, GripVertical, ArrowUp, ArrowDown, Layers } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { GalleryAlbum, GalleryPhoto } from "@/types";

interface AlbumReorderRowProps {
  album: GalleryAlbum;
  cover: GalleryPhoto | null;
  photoCount: number;
  position: number;
  total: number;
  dragging?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function AlbumReorderRow({
  album,
  cover,
  photoCount,
  position,
  total,
  dragging,
  onMoveUp,
  onMoveDown,
}: AlbumReorderRowProps) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-3 rounded-2xl border bg-card px-3 py-3 transition-all sm:gap-4 sm:px-4",
        dragging
          ? "border-primary/50 bg-card/95 shadow-[0_24px_50px_-10px_rgba(0,0,0,0.7)] scale-[1.015] ring-1 ring-primary/30"
          : "border-border"
      )}
    >
      {/* Position indicator */}
      <div className="flex h-9 w-7 shrink-0 items-center justify-center text-[11px] font-semibold tabular text-muted-foreground">
        {position}
      </div>

      {/* Thumbnail */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-border sm:h-16 sm:w-16">
        {cover ? (
          <img
            src={cover.public_url}
            alt=""
            loading="lazy"
            draggable={false}
            className="h-full w-full select-none object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[oklch(0.68_0.22_340)]/30 via-[oklch(0.78_0.16_22)]/20 to-[oklch(0.55_0.22_300)]/30">
            <ImageIcon className="h-5 w-5 text-white/60" strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[14px] font-semibold tracking-tight sm:text-[15px]">
          {album.name}
        </h3>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          {photoCount > 0 && (
            <span className="inline-flex items-center gap-1 tabular">
              <Layers className="h-3 w-3" />
              {photoCount} {photoCount === 1 ? "foto" : "fotos"}
            </span>
          )}
          <span className="hidden sm:inline">·</span>
          <span className="hidden truncate sm:inline">
            {format(parseISO(album.created_at), "dd MMM yyyy", { locale: ptBR })}
          </span>
        </div>
      </div>

      {/* Explicit up/down buttons — always available, works regardless of drag support */}
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onMoveUp?.();
          }}
          disabled={position === 1}
          aria-label="Mover pra cima"
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent active:scale-95"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onMoveDown?.();
          }}
          disabled={position === total}
          aria-label="Mover pra baixo"
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent active:scale-95"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      </div>

      {/* Drag handle — desktop only (optional alternative to buttons) */}
      <div
        className={cn(
          "hidden h-10 w-8 shrink-0 items-center justify-center text-muted-foreground/50 transition-colors sm:flex",
          dragging ? "cursor-grabbing text-primary" : "cursor-grab hover:text-foreground"
        )}
        aria-hidden="true"
      >
        <GripVertical className="h-5 w-5" />
      </div>
    </div>
  );
}
