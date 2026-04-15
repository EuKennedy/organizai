import { useMemo, useState } from "react";
import { Plus, Film, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useMovies } from "@/hooks/use-movies";
import { searchMovies, resolveMovieGenres } from "@/lib/tmdb";
import type { TMDBMovie } from "@/lib/tmdb";
import { MediaSearchDialog, movieRenderItem } from "@/components/media-search-dialog";
import { MovieCarousel } from "@/components/movie-carousel";
import { MovieDetailModal } from "@/components/movie-detail-modal";
import { Skeleton } from "@/components/ui/skeleton";
import type { Movie } from "@/types";

const RATING_FILTERS = [
  { value: 0, label: "Todas" },
  { value: 5, label: "★★★★★" },
  { value: 4, label: "★★★★" },
  { value: 3, label: "★★★" },
  { value: 2, label: "★★" },
  { value: 1, label: "★" },
] as const;

export function MoviesPage() {
  const { movies, loading, addMovie, updateMovie, deleteMovie } = useMovies();
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [ratingFilter, setRatingFilter] = useState(0);

  const filtered = useMemo(() => {
    if (ratingFilter === 0) return movies;
    return movies.filter((m) => m.personal_rating === ratingFilter);
  }, [movies, ratingFilter]);

  const allMovies = filtered;
  const wantToWatch = useMemo(() => filtered.filter((m) => m.status === "want_to_watch"), [filtered]);
  const watching = useMemo(() => filtered.filter((m) => m.status === "watching"), [filtered]);
  const watched = useMemo(() => filtered.filter((m) => m.status === "watched"), [filtered]);

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
      toast.error(err instanceof Error ? err.message : "Erro ao adicionar");
    }
  };

  const handleStatusChange = async (id: string, status: Movie["status"]) => {
    try {
      await updateMovie(id, { status });
      setSelectedMovie((prev) => (prev?.id === id ? { ...prev, status } : prev));
    } catch {
      toast.error("Erro ao atualizar");
    }
  };

  const handleRating = async (id: string, rating: number) => {
    try {
      await updateMovie(id, { personal_rating: rating });
      setSelectedMovie((prev) => (prev?.id === id ? { ...prev, personal_rating: rating } : prev));
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Filmes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {movies.length} {movies.length === 1 ? "filme" : "filmes"} na sua lista
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Rating filter */}
          <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1">
            <SlidersHorizontal className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
            {RATING_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setRatingFilter(value)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                  ratingFilter === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <div className="flex gap-3">
                {Array.from({ length: 6 }).map((_, j) => (
                  <Skeleton key={j} className="h-52 w-36 flex-none rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && movies.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Film className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Sua lista esta vazia</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Adicione filmes para organizar o que voces querem assistir juntos
          </p>
          <button
            onClick={() => setSearchOpen(true)}
            className="mt-5 flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Buscar filme
          </button>
        </div>
      )}

      {/* Carousels */}
      {!loading && movies.length > 0 && (
        <div className="space-y-8">
          <MovieCarousel title="Todos" movies={allMovies} onSelect={setSelectedMovie} />
          <MovieCarousel title="🎯 Quero assistir" movies={wantToWatch} onSelect={setSelectedMovie} />
          <MovieCarousel title="▶️ Assistindo" movies={watching} onSelect={setSelectedMovie} />
          <MovieCarousel title="✅ Assistido" movies={watched} onSelect={setSelectedMovie} />
        </div>
      )}

      {/* Search dialog */}
      <MediaSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Buscar filme"
        searchFn={searchMovies}
        onSelect={handleAddMovie}
        renderItem={movieRenderItem}
      />

      {/* Detail modal */}
      <MovieDetailModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onStatusChange={handleStatusChange}
        onRate={handleRating}
        onDelete={handleDelete}
      />
    </div>
  );
}
