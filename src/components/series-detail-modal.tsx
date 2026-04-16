import { X, Trash2, Calendar, Star as StarIcon, Clapperboard, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { backdropUrl, posterUrl } from "@/lib/tmdb";
import { StarRating } from "@/components/star-rating";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Series } from "@/types";

interface SeriesDetailModalProps {
  series: Series | null;
  onClose: () => void;
  onStatusChange: (id: string, status: Series["status"]) => void;
  onRate: (id: string, rating: number) => void;
  onEpisodeUpdate: (
    id: string,
    field: "current_season" | "current_episode",
    value: string
  ) => void;
  onDelete: (id: string, title: string) => void;
}

const STATUS_BUTTONS: { value: Series["status"]; label: string; emoji: string }[] = [
  { value: "want_to_watch", label: "Quero assistir", emoji: "🎯" },
  { value: "watching", label: "Assistindo", emoji: "▶️" },
  { value: "watched", label: "Assistido", emoji: "✅" },
];

export function SeriesDetailModal({
  series,
  onClose,
  onStatusChange,
  onRate,
  onEpisodeUpdate,
  onDelete,
}: SeriesDetailModalProps) {
  return (
    <AnimatePresence>
      {series && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="fixed inset-x-3 top-[3%] z-50 mx-auto max-h-[94dvh] max-w-2xl overflow-y-auto overscroll-contain rounded-3xl border border-border bg-card shadow-2xl sm:inset-x-auto sm:top-[5%] sm:max-h-[90dvh]"
          >
            <div className="relative h-48 overflow-hidden rounded-t-3xl sm:h-64">
              {series.backdrop_path ? (
                <img
                  src={backdropUrl(series.backdrop_path, "w1280")}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : series.poster_path ? (
                <img
                  src={posterUrl(series.poster_path, "w500")}
                  alt=""
                  className="h-full w-full object-cover blur-md brightness-50"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/25 to-muted" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />

              <button
                onClick={onClose}
                aria-label="Fechar"
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white/90 backdrop-blur-md ring-1 ring-white/10 transition-all hover:bg-black/75 hover:scale-105"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="absolute bottom-0 left-0 flex items-end gap-4 p-5 sm:gap-5">
                {series.poster_path && (
                  <img
                    src={posterUrl(series.poster_path, "w185")}
                    alt={series.title}
                    className="h-28 w-auto rounded-xl shadow-2xl ring-1 ring-white/10 sm:h-36"
                  />
                )}
                <div className="min-w-0 space-y-1.5 pb-1">
                  <h2 className="text-lg font-semibold leading-tight tracking-tight text-white drop-shadow-lg sm:text-2xl line-clamp-2">
                    {series.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-white/75 sm:text-xs">
                    <span className="flex items-center gap-1 tabular">
                      <Calendar className="h-3 w-3" />
                      {series.first_air_year}
                    </span>
                    <span className="flex items-center gap-1 tabular">
                      <StarIcon className="h-3 w-3 text-yellow-400" fill="currentColor" />
                      {Number(series.tmdb_score).toFixed(1)}
                    </span>
                    {series.original_title !== series.title && (
                      <span className="font-serif italic text-white/65">
                        {series.original_title}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:space-y-6 sm:p-6">
              {(series.director || (series.cast && series.cast.length > 0)) && (
                <div className="space-y-2.5 rounded-2xl bg-muted/40 p-4 ring-1 ring-border">
                  {series.director && (
                    <div className="flex items-start gap-2">
                      <Clapperboard className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Criador
                        </p>
                        <p className="text-sm font-semibold">{series.director}</p>
                      </div>
                    </div>
                  )}
                  {series.cast && series.cast.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Elenco
                        </p>
                        <p className="text-sm">{series.cast.join(", ")}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {series.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {series.genres.map((g) => (
                    <span
                      key={g}
                      className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary ring-1 ring-primary/20"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {series.overview && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {series.overview}
                </p>
              )}

              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Status
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {STATUS_BUTTONS.map(({ value, label, emoji }) => (
                    <button
                      key={value}
                      onClick={() => onStatusChange(series.id, value)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-[11.5px] font-semibold transition-all",
                        series.status === value
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <span className="text-base">{emoji}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {series.status === "watching" && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Progresso
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Temporada</span>
                      <Input
                        type="number"
                        min={1}
                        className="h-9 w-20 text-center tabular"
                        value={series.current_season ?? ""}
                        onChange={(e) =>
                          onEpisodeUpdate(series.id, "current_season", e.target.value)
                        }
                        placeholder="—"
                      />
                    </label>
                    <label className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Episódio</span>
                      <Input
                        type="number"
                        min={1}
                        className="h-9 w-20 text-center tabular"
                        value={series.current_episode ?? ""}
                        onChange={(e) =>
                          onEpisodeUpdate(series.id, "current_episode", e.target.value)
                        }
                        placeholder="—"
                      />
                    </label>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Sua avaliação
                </p>
                <div className="flex items-center gap-3">
                  <StarRating
                    value={series.personal_rating}
                    onChange={(v) => onRate(series.id, v)}
                    size="md"
                  />
                  {series.personal_rating && (
                    <span className="text-sm font-semibold text-yellow-500 tabular">
                      {series.personal_rating}/5
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end border-t border-border pt-4">
                <button
                  onClick={() => {
                    onDelete(series.id, series.title);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground/70 transition-colors hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
