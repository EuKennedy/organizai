import { Tv, Star } from "lucide-react";
import { posterUrl } from "@/lib/tmdb";
import { MediaCarouselShell } from "@/components/media-carousel-shell";
import { cn } from "@/lib/utils";
import type { Series } from "@/types";

interface SeriesCarouselProps {
  eyebrow?: string;
  title: string;
  series: Series[];
  onSelect: (s: Series) => void;
}

export function SeriesCarousel({ eyebrow, title, series, onSelect }: SeriesCarouselProps) {
  if (series.length === 0) return null;

  return (
    <MediaCarouselShell eyebrow={eyebrow} title={title} count={series.length}>
      {series.map((s) => (
        <SeriesPosterCard key={s.id} series={s} onSelect={onSelect} />
      ))}
    </MediaCarouselShell>
  );
}

function SeriesPosterCard({
  series: s,
  onSelect,
}: {
  series: Series;
  onSelect: (s: Series) => void;
}) {
  const hasRating = s.personal_rating != null && s.personal_rating > 0;
  const score = Number(s.tmdb_score);

  return (
    <button
      onClick={() => onSelect(s)}
      className="group relative flex-none snap-start text-left"
    >
      <div className="relative w-[140px] overflow-hidden rounded-2xl ring-1 ring-white/5 shadow-lg shadow-black/30 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-black/50 group-hover:ring-primary/30 sm:w-[172px] lg:w-[196px]">
        {s.poster_path ? (
          <img
            src={posterUrl(s.poster_path, "w342")}
            alt={s.title}
            loading="lazy"
            className="aspect-[2/3] w-full object-cover transition-transform duration-[450ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex aspect-[2/3] w-full items-center justify-center bg-gradient-to-br from-muted to-muted/40">
            <Tv className="h-10 w-10 text-muted-foreground/30" strokeWidth={1.25} />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />

        {/* Badge superior */}
        {hasRating ? (
          <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-semibold text-yellow-400 backdrop-blur-md ring-1 ring-white/10">
            <Star className="h-2.5 w-2.5" fill="currentColor" />
            {s.personal_rating}
          </div>
        ) : score > 0 ? (
          <div
            className={cn(
              "absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold backdrop-blur-md ring-1 ring-white/10 tabular",
              score >= 7
                ? "bg-emerald-500/90 text-white"
                : score >= 5
                ? "bg-amber-500/90 text-white"
                : "bg-zinc-600/90 text-white"
            )}
          >
            {score.toFixed(1)}
          </div>
        ) : null}

        {/* Pill de progresso */}
        {s.status === "watching" && s.current_season && (
          <div className="absolute left-2 top-2 rounded-full bg-primary/95 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-primary-foreground backdrop-blur-sm shadow-sm">
            T{s.current_season}
            {s.current_episode ? `·E${s.current_episode}` : ""}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="text-[13px] font-semibold leading-tight text-white line-clamp-2 drop-shadow-md sm:text-sm">
            {s.title}
          </p>
          {s.first_air_year > 0 && (
            <p className="mt-1 text-[10.5px] font-medium tracking-wide text-white/60 tabular">
              {s.first_air_year}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
