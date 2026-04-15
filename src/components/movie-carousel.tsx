import { useRef } from "react";
import { ChevronLeft, ChevronRight, Film } from "lucide-react";
import { posterUrl } from "@/lib/tmdb";
import { cn } from "@/lib/utils";
import type { Movie } from "@/types";

interface MovieCarouselProps {
  title: string;
  movies: Movie[];
  onSelect: (movie: Movie) => void;
}

export function MovieCarousel({ title, movies, onSelect }: MovieCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (movies.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-semibold tracking-tight sm:text-lg">
          {title}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {movies.length}
          </span>
        </h2>
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
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-hide flex gap-3 overflow-x-auto scroll-smooth pb-2 sm:gap-4"
      >
        {movies.map((movie) => (
          <button
            key={movie.id}
            onClick={() => onSelect(movie)}
            className="group relative flex-none"
          >
            <div className="relative w-28 overflow-hidden rounded-lg sm:w-36 lg:w-40">
              {movie.poster_path ? (
                <img
                  src={posterUrl(movie.poster_path, "w342")}
                  alt={movie.title}
                  className="aspect-[2/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex aspect-[2/3] w-full items-center justify-center bg-muted">
                  <Film className="h-8 w-8 text-muted-foreground/20" />
                </div>
              )}
              {/* Hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              {/* Rating badge */}
              {movie.personal_rating && (
                <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-400 backdrop-blur-sm">
                  <span>★</span>
                  {movie.personal_rating}
                </div>
              )}
              {/* TMDB score */}
              <div className={cn(
                "absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur-sm",
                movie.tmdb_score >= 7
                  ? "bg-green-500/20 text-green-400"
                  : movie.tmdb_score >= 5
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-red-500/20 text-red-400"
              )}>
                {Number(movie.tmdb_score).toFixed(1)}
              </div>
              {/* Title on hover */}
              <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <p className="text-xs font-medium text-white line-clamp-2">{movie.title}</p>
              </div>
            </div>
            <p className="mt-1.5 w-28 truncate text-left text-xs text-foreground/70 sm:w-36 lg:w-40">
              {movie.title}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
