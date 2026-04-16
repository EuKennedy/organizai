import { Film, Star } from "lucide-react";
import { posterUrl } from "@/lib/tmdb";
import { MediaCarouselShell } from "@/components/media-carousel-shell";
import { cn } from "@/lib/utils";
import type { Movie } from "@/types";

interface MovieCarouselProps {
  eyebrow?: string;
  title: string;
  movies: Movie[];
  onSelect: (movie: Movie) => void;
}

export function MovieCarousel({ eyebrow, title, movies, onSelect }: MovieCarouselProps) {
  if (movies.length === 0) return null;

  return (
    <MediaCarouselShell eyebrow={eyebrow} title={title} count={movies.length}>
      {movies.map((movie) => (
        <PosterCard key={movie.id} movie={movie} onSelect={onSelect} />
      ))}
    </MediaCarouselShell>
  );
}

function PosterCard({ movie, onSelect }: { movie: Movie; onSelect: (m: Movie) => void }) {
  const hasRating = movie.personal_rating != null && movie.personal_rating > 0;
  const score = Number(movie.tmdb_score);

  return (
    <button
      onClick={() => onSelect(movie)}
      className="group relative flex-none snap-start text-left"
    >
      <div className="relative w-[140px] overflow-hidden rounded-2xl ring-1 ring-white/5 shadow-lg shadow-black/30 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-black/50 group-hover:ring-primary/30 sm:w-[172px] lg:w-[196px]">
        {movie.poster_path ? (
          <img
            src={posterUrl(movie.poster_path, "w342")}
            alt={movie.title}
            loading="lazy"
            className="aspect-[2/3] w-full object-cover transition-transform duration-[450ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex aspect-[2/3] w-full items-center justify-center bg-gradient-to-br from-muted to-muted/40">
            <Film className="h-10 w-10 text-muted-foreground/30" strokeWidth={1.25} />
          </div>
        )}

        {/* Gradient permanente inferior — título sempre legível */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />

        {/* Score/rating — UM badge por vez */}
        {hasRating ? (
          <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-semibold text-yellow-400 backdrop-blur-md ring-1 ring-white/10">
            <Star className="h-2.5 w-2.5" fill="currentColor" />
            {movie.personal_rating}
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

        {/* Título dentro do poster */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="text-[13px] font-semibold leading-tight text-white line-clamp-2 drop-shadow-md sm:text-sm">
            {movie.title}
          </p>
          {movie.release_year > 0 && (
            <p className="mt-1 text-[10.5px] font-medium tracking-wide text-white/60 tabular">
              {movie.release_year}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
