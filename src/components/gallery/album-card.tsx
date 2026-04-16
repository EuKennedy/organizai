import { Link } from "react-router-dom";
import { ImageIcon, Layers } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { GalleryAlbum, GalleryPhoto } from "@/types";

interface AlbumCardProps {
  album: GalleryAlbum;
  cover: GalleryPhoto | null;
  photoCount: number;
}

export function AlbumCard({ album, cover, photoCount }: AlbumCardProps) {
  return (
    <Link
      to={`/gallery/${album.id}`}
      className="group relative block overflow-hidden rounded-3xl ring-1 ring-border bg-card transition-all hover:ring-primary/30 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {cover ? (
          <img
            src={cover.public_url}
            alt=""
            loading="lazy"
            draggable={false}
            className="h-full w-full select-none object-cover transition-transform duration-[550ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[oklch(0.68_0.22_340)]/25 via-[oklch(0.78_0.16_22)]/20 to-[oklch(0.55_0.22_300)]/25">
            <ImageIcon className="h-10 w-10 text-white/50" strokeWidth={1.25} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        {photoCount > 0 && (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md ring-1 ring-white/10">
            <Layers className="h-3 w-3" />
            {photoCount}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="text-lg font-semibold leading-tight tracking-tight text-white drop-shadow-md sm:text-xl line-clamp-2">
            {album.name}
          </h3>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.15em] text-white/70">
            {format(parseISO(album.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
          </p>
          {album.description && (
            <p className="mt-2 line-clamp-2 text-xs text-white/75">{album.description}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
