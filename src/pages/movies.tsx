import { useMemo, useState } from "react";
import { Plus, Film, ChevronDown, X } from "lucide-react";
import { toast } from "sonner";
import { useMovies } from "@/hooks/use-movies";
import { searchMovies, resolveMovieGenres, getMovieCredits } from "@/lib/tmdb";
import type { TMDBMovie } from "@/lib/tmdb";
import { MediaSearchDialog, movieRenderItem } from "@/components/media-search-dialog";
import { MovieCarousel } from "@/components/movie-carousel";
import { MovieDetailModal } from "@/components/movie-detail-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Movie } from "@/types";

export function MoviesPage() {
  const { movies, loading, addMovie, updateMovie, deleteMovie } = useMovies();
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Dynamic genres from user's movies
  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    movies.forEach((m) => m.genres.forEach((g) => genreSet.add(g)));
    return Array.from(genreSet).sort();
  }, [movies]);

  const filtered = useMemo(() => {
    let result = movies;
    if (ratingFilter > 0) {
      result = result.filter((m) => m.personal_rating === ratingFilter);
    }
    if (genreFilter) {
      result = result.filter((m) => m.genres.includes(genreFilter));
    }
    return result;
  }, [movies, ratingFilter, genreFilter]);

  const wantToWatch = useMemo(() => filtered.filter((m) => m.status === "want_to_watch"), [filtered]);
  const watching = useMemo(() => filtered.filter((m) => m.status === "watching"), [filtered]);
  const watched = useMemo(() => filtered.filter((m) => m.status === "watched"), [filtered]);

  const hasActiveFilter = ratingFilter > 0 || genreFilter !== null;

  const handleAddMovie = async (tmdbMovie: TMDBMovie) => {
    try {
      const year = tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear() : 0;
      const credits = await getMovieCredits(tmdbMovie.id);
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
        director: credits.director,
        cast: credits.cast,
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

  const clearFilters = () => {
    setRatingFilter(0);
    setGenreFilter(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Filmes</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {movies.length} {movies.length === 1 ? "filme" : "filmes"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {movies.length > 0 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all sm:text-sm",
                hasActiveFilter
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showFilters && "rotate-180")} />
              Filtros
              {hasActiveFilter && (
                <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {(ratingFilter > 0 ? 1 : 0) + (genreFilter ? 1 : 0)}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:text-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && movies.length > 0 && (
        <div className="space-y-3 rounded-xl border border-border bg-card/50 p-3 sm:p-4">
          {/* Rating */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Avaliacao</p>
            <div className="flex flex-wrap gap-1.5">
              {[0, 5, 4, 3, 2, 1].map((v) => (
                <button
                  key={v}
                  onClick={() => setRatingFilter(v)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                    ratingFilter === v
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {v === 0 ? "Todas" : `${"★".repeat(v)} ${v}`}
                </button>
              ))}
            </div>
          </div>

          {/* Genres */}
          {availableGenres.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Genero</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setGenreFilter(null)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                    genreFilter === null
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  Todos
                </button>
                {availableGenres.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenreFilter(g)}
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                      genreFilter === g
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <div className="flex gap-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="h-44 w-28 flex-none rounded-lg sm:h-52 sm:w-36" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && movies.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center sm:py-24">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Film className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold">Sua lista esta vazia</h3>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground sm:text-sm">
            Adicione filmes para organizar o que voces querem assistir juntos
          </p>
          <button
            onClick={() => setSearchOpen(true)}
            className="mt-4 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Buscar filme
          </button>
        </div>
      )}

      {/* No results from filter */}
      {!loading && movies.length > 0 && filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">Nenhum filme com esse filtro</p>
          <button onClick={clearFilters} className="mt-2 text-xs text-primary hover:underline">
            Limpar filtros
          </button>
        </div>
      )}

      {/* Carousels */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-6 sm:space-y-8">
          {wantToWatch.length > 0 && (
            <MovieCarousel title="Quero assistir" movies={wantToWatch} onSelect={setSelectedMovie} />
          )}
          {watching.length > 0 && (
            <MovieCarousel title="Assistindo" movies={watching} onSelect={setSelectedMovie} />
          )}
          {watched.length > 0 && (
            <MovieCarousel title="Assistido" movies={watched} onSelect={setSelectedMovie} />
          )}
        </div>
      )}

      <MediaSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Buscar filme"
        searchFn={searchMovies}
        onSelect={handleAddMovie}
        renderItem={movieRenderItem}
      />

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
