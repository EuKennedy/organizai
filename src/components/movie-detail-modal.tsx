import { X, Trash2, Calendar, Star as StarIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { backdropUrl, posterUrl } from "@/lib/tmdb";
import { StarRating } from "@/components/star-rating";
import { cn } from "@/lib/utils";
import type { Movie } from "@/types";

interface MovieDetailModalProps {
  movie: Movie | null;
  onClose: () => void;
  onStatusChange: (id: string, status: Movie["status"]) => void;
  onRate: (id: string, rating: number) => void;
  onDelete: (id: string, title: string) => void;
}

const STATUS_BUTTONS: { value: Movie["status"]; label: string; emoji: string }[] = [
  { value: "want_to_watch", label: "Quero assistir", emoji: "🎯" },
  { value: "watching", label: "Assistindo", emoji: "▶️" },
  { value: "watched", label: "Assistido", emoji: "✅" },
];

export function MovieDetailModal({
  movie,
  onClose,
  onStatusChange,
  onRate,
  onDelete,
}: MovieDetailModalProps) {
  if (!movie) return null;

  return (
    <AnimatePresence>
      {movie && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[5%] z-50 mx-auto max-h-[90dvh] max-w-2xl overflow-y-auto rounded-2xl bg-card shadow-2xl sm:inset-x-auto"
          >
            {/* Hero image */}
            <div className="relative h-48 overflow-hidden rounded-t-2xl sm:h-64">
              {movie.backdrop_path ? (
                <img
                  src={backdropUrl(movie.backdrop_path, "w1280")}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : movie.poster_path ? (
                <img
                  src={posterUrl(movie.poster_path, "w500")}
                  alt=""
                  className="h-full w-full object-cover blur-sm"
                />
              ) : (
                <div className="h-full w-full bg-muted" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Poster + title overlay */}
              <div className="absolute bottom-0 left-0 flex items-end gap-4 p-5">
                {movie.poster_path && (
                  <img
                    src={posterUrl(movie.poster_path, "w185")}
                    alt={movie.title}
                    className="h-28 w-auto rounded-lg shadow-xl sm:h-36"
                  />
                )}
                <div className="space-y-1 pb-1">
                  <h2 className="text-lg font-bold text-white drop-shadow-lg sm:text-xl">
                    {movie.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {movie.release_year}
                    </span>
                    <span className="flex items-center gap-1">
                      <StarIcon className="h-3 w-3 text-yellow-400" fill="currentColor" />
                      {Number(movie.tmdb_score).toFixed(1)}
                    </span>
                    {movie.original_title !== movie.title && (
                      <span className="italic">{movie.original_title}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-5 p-5">
              {/* Genres */}
              {movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {movie.genres.map((g) => (
                    <span
                      key={g}
                      className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Synopsis */}
              {movie.overview && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {movie.overview}
                </p>
              )}

              {/* Status */}
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                  Status
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {STATUS_BUTTONS.map(({ value, label, emoji }) => (
                    <button
                      key={value}
                      onClick={() => onStatusChange(movie.id, value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-xs font-medium transition-all",
                        movie.status === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-transparent bg-muted/50 text-muted-foreground hover:border-border hover:bg-muted"
                      )}
                    >
                      <span className="text-base">{emoji}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                  Sua avaliacao
                </p>
                <div className="flex items-center gap-3">
                  <StarRating
                    value={movie.personal_rating}
                    onChange={(v) => onRate(movie.id, v)}
                    size="md"
                  />
                  {movie.personal_rating && (
                    <span className="text-sm font-semibold text-yellow-500">
                      {movie.personal_rating}/5
                    </span>
                  )}
                </div>
              </div>

              {/* Delete */}
              <div className="flex justify-end border-t border-border pt-4">
                <button
                  onClick={() => {
                    onDelete(movie.id, movie.title);
                    onClose();
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-500/70 transition-colors hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover da lista
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
