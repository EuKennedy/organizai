import { Trash2, Pin, PinOff } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { GalleryPhoto } from "@/types";

/**
 * A single photo tile used across all layouts.
 * Hover reveals actions (pin cover, delete).
 */
export function PhotoTile({
  photo,
  isCover,
  onOpen,
  onDelete,
  onSetCover,
  className,
  style,
  index = 0,
}: {
  photo: GalleryPhoto;
  isCover: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onSetCover: () => void;
  className?: string;
  style?: React.CSSProperties;
  index?: number;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.015, 0.2) }}
      className={cn("group relative overflow-hidden bg-muted", className)}
      style={style}
    >
      <button
        type="button"
        onClick={onOpen}
        className="block h-full w-full cursor-zoom-in"
      >
        <img
          src={photo.public_url}
          alt={photo.caption ?? ""}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[500ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.04]"
        />
      </button>

      {/* Shadow overlay on hover (desktop only) */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Cover pin indicator */}
      {isCover && (
        <div className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm ring-1 ring-white/10 backdrop-blur-sm">
          <Pin className="h-2.5 w-2.5" />
          Capa
        </div>
      )}

      {/*
       * Actions — always visible on touch devices (opacity-100),
       * hover-reveal on desktop (sm:opacity-0 + group-hover).
       */}
      <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSetCover();
          }}
          aria-label={isCover ? "Remover capa" : "Definir como capa"}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/65 text-white/95 backdrop-blur-md ring-1 ring-white/15 shadow-lg transition-all active:scale-95 hover:bg-black/80 hover:scale-105"
        >
          {isCover ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Remover foto"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/65 text-white/95 backdrop-blur-md ring-1 ring-white/15 shadow-lg transition-all active:scale-95 hover:bg-red-500/80 hover:scale-105"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

interface LayoutProps {
  photos: GalleryPhoto[];
  coverId: string | null;
  onOpen: (index: number) => void;
  onDelete: (photoId: string) => void;
  onSetCover: (photoId: string) => void;
}

/** MASONRY — CSS columns, variable heights (Pinterest). */
export function MasonryLayout({ photos, coverId, onOpen, onDelete, onSetCover }: LayoutProps) {
  return (
    <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4">
      {photos.map((p, i) => {
        const ar = p.width > 0 && p.height > 0 ? p.height / p.width : 1;
        return (
          <div key={p.id} className="mb-3 break-inside-avoid sm:mb-4">
            <PhotoTile
              photo={p}
              isCover={coverId === p.id}
              onOpen={() => onOpen(i)}
              onDelete={() => onDelete(p.id)}
              onSetCover={() => onSetCover(p.id)}
              className="w-full rounded-2xl ring-1 ring-white/5 shadow-lg shadow-black/30"
              style={{ aspectRatio: `${1 / Math.max(ar, 0.5)}` }}
              index={i}
            />
          </div>
        );
      })}
    </div>
  );
}

/** MOSAIC — a fixed grid with selectively large tiles, asymmetric feel. */
export function MosaicLayout({ photos, coverId, onOpen, onDelete, onSetCover }: LayoutProps) {
  // Patterns define col/row spans cycled to create rhythm.
  // 6-col grid on desktop, 3-col on mobile. Patterns optimized for both.
  const patterns = [
    "col-span-2 row-span-2 sm:col-span-3 sm:row-span-2",
    "col-span-1 row-span-1 sm:col-span-1 sm:row-span-1",
    "col-span-1 row-span-1 sm:col-span-2 sm:row-span-1",
    "col-span-1 row-span-2 sm:col-span-1 sm:row-span-2",
    "col-span-1 row-span-1 sm:col-span-1 sm:row-span-1",
    "col-span-2 row-span-1 sm:col-span-2 sm:row-span-1",
    "col-span-1 row-span-1 sm:col-span-1 sm:row-span-1",
    "col-span-1 row-span-1 sm:col-span-1 sm:row-span-1",
  ];

  return (
    <div className="grid auto-rows-[120px] grid-cols-3 gap-3 sm:auto-rows-[160px] sm:grid-cols-6 sm:gap-4">
      {photos.map((p, i) => (
        <PhotoTile
          key={p.id}
          photo={p}
          isCover={coverId === p.id}
          onOpen={() => onOpen(i)}
          onDelete={() => onDelete(p.id)}
          onSetCover={() => onSetCover(p.id)}
          className={cn(
            "rounded-2xl ring-1 ring-white/5 shadow-lg shadow-black/30",
            patterns[i % patterns.length]
          )}
          index={i}
        />
      ))}
    </div>
  );
}

/** COLLAGE — overlapping cards with slight rotations, analog feel. */
export function CollageLayout({ photos, coverId, onOpen, onDelete, onSetCover }: LayoutProps) {
  // Deterministic pseudo-random rotation based on index for stability.
  const rotate = (i: number) => {
    const seeds = [-3, 2, -1.5, 3, -2.5, 1, -1, 2.5, -3.5, 1.8];
    return seeds[i % seeds.length];
  };
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 sm:gap-7 lg:grid-cols-4">
      {photos.map((p, i) => {
        const ar = p.width > 0 && p.height > 0 ? p.height / p.width : 1;
        const r = rotate(i);
        return (
          <div
            key={p.id}
            className="transition-transform duration-300 hover:!rotate-0 hover:scale-[1.03]"
            style={{ transform: `rotate(${r}deg)` }}
          >
            <div className="relative rounded-[4px] bg-white p-2 pb-8 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.45)] ring-1 ring-black/5 sm:p-2.5 sm:pb-10">
              <PhotoTile
                photo={p}
                isCover={coverId === p.id}
                onOpen={() => onOpen(i)}
                onDelete={() => onDelete(p.id)}
                onSetCover={() => onSetCover(p.id)}
                className="rounded-[2px]"
                style={{ aspectRatio: `${1 / Math.max(ar, 0.6)}` }}
                index={i}
              />
              <p className="absolute inset-x-0 bottom-1.5 text-center font-serif text-[11px] italic text-zinc-600 sm:text-xs">
                {p.caption || " "}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** GRID — uniform squares, minimal. */
export function GridLayout({ photos, coverId, onOpen, onDelete, onSetCover }: LayoutProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
      {photos.map((p, i) => (
        <PhotoTile
          key={p.id}
          photo={p}
          isCover={coverId === p.id}
          onOpen={() => onOpen(i)}
          onDelete={() => onDelete(p.id)}
          onSetCover={() => onSetCover(p.id)}
          className="aspect-square rounded-xl ring-1 ring-white/5 shadow shadow-black/20"
          index={i}
        />
      ))}
    </div>
  );
}
