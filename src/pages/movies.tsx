import { useState } from "react";
import { Plus, Trash2, Film } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useMovies } from "@/hooks/use-movies";
import { searchMovies, resolveMovieGenres, posterUrl } from "@/lib/tmdb";
import type { TMDBMovie } from "@/lib/tmdb";
import { MediaSearchDialog, movieRenderItem } from "@/components/media-search-dialog";
import { StatusBadge } from "@/components/status-badge";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Movie } from "@/types";

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "want_to_watch", label: "Quero assistir" },
  { value: "watching", label: "Assistindo" },
  { value: "watched", label: "Assistido" },
] as const;

export function MoviesPage() {
  const { movies, loading, addMovie, updateMovie, deleteMovie } = useMovies();
  const [searchOpen, setSearchOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = statusFilter === "all" ? movies : movies.filter((m) => m.status === statusFilter);

  const handleAddMovie = async (tmdbMovie: TMDBMovie) => {
    try {
      const year = tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear() : 0;
      await addMovie({
        tmdb_id: tmdbMovie.id,
        title: tmdbMovie.title,
        original_title: tmdbMovie.original_title,
        poster_path: tmdbMovie.poster_path,
        backdrop_path: tmdbMovie.backdrop_path,
        overview: tmdbMovie.overview,
        release_year: year,
        genres: resolveMovieGenres(tmdbMovie.genre_ids),
        tmdb_score: tmdbMovie.vote_average,
        status: "want_to_watch",
        personal_rating: null,
      });
      toast.success(`"${tmdbMovie.title}" adicionado`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao adicionar filme");
    }
  };

  const handleStatusChange = async (id: string, status: Movie["status"]) => {
    try {
      await updateMovie(id, { status });
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleRating = async (id: string, rating: number) => {
    try {
      await updateMovie(id, { personal_rating: rating });
    } catch {
      toast.error("Erro ao avaliar");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    try {
      await deleteMovie(id);
      toast.success(`"${title}" removido`);
    } catch {
      toast.error("Erro ao remover");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Filmes</h1>
          <p className="text-sm text-muted-foreground">
            {movies.length} {movies.length === 1 ? "filme" : "filmes"} na lista
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setSearchOpen(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[340px] rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && movies.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Film className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-medium">Nenhum filme ainda</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Clique em "Adicionar" para buscar e salvar filmes
          </p>
        </div>
      )}

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((movie) => (
            <motion.div
              key={movie.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="group relative overflow-hidden">
                {/* Poster */}
                {movie.poster_path ? (
                  <img
                    src={posterUrl(movie.poster_path, "w500")}
                    alt={movie.title}
                    className="aspect-[2/3] w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex aspect-[2/3] w-full items-center justify-center bg-muted">
                    <Film className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="space-y-2">
                    <p className="text-xs text-white/60 line-clamp-3">{movie.overview}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/50">TMDB: {movie.tmdb_score.toFixed(1)}</span>
                      <span className="text-xs text-white/50">{movie.release_year}</span>
                    </div>
                    {movie.genres.length > 0 && (
                      <p className="text-xs text-white/40">{movie.genres.join(", ")}</p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <StarRating
                        value={movie.personal_rating}
                        onChange={(v) => handleRating(movie.id, v)}
                        size="sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/60 hover:text-red-400"
                        onClick={() => handleDelete(movie.id, movie.title)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Info bar */}
                <div className="space-y-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium leading-tight line-clamp-1">{movie.title}</h3>
                    <StatusBadge status={movie.status} />
                  </div>
                  <Select
                    value={movie.status}
                    onValueChange={(v) => handleStatusChange(movie.id, v as Movie["status"])}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="want_to_watch">Quero assistir</SelectItem>
                      <SelectItem value="watching">Assistindo</SelectItem>
                      <SelectItem value="watched">Assistido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Search dialog */}
      <MediaSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Buscar filme"
        searchFn={searchMovies}
        onSelect={handleAddMovie}
        renderItem={movieRenderItem}
      />
    </div>
  );
}
