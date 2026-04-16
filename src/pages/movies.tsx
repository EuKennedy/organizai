import { useMemo, useState } from "react";
import { Plus, Film, Star } from "lucide-react";
import { toast } from "sonner";
import { useMovies } from "@/hooks/use-movies";
import {
  searchMovies,
  resolveMovieGenres,
  getMovieCredits,
  backdropUrl,
} from "@/lib/tmdb";
import type { TMDBMovie } from "@/lib/tmdb";
import { MediaSearchDialog, movieRenderItem } from "@/components/media-search-dialog";
import { MovieCarousel } from "@/components/movie-carousel";
import { MovieDetailModal } from "@/components/movie-detail-modal";
import { PageHero } from "@/components/page-hero";
import { EmptyState } from "@/components/empty-state";
import { FilterBar, FilterLabel } from "@/components/filter-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { btnPrimarySm, btnPrimary, chip, chipActive, chipIdle } from "@/lib/ui";
import { cn } from "@/lib/utils";
import type { Movie } from "@/types";

export function MoviesPage() {
  const { movies, loading, addMovie, updateMovie, deleteMovie } = useMovies();
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [genreFilter, setGenreFilter] = useState<string | null>(null);

  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    movies.forEach((m) => m.genres.forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }, [movies]);

  const filtered = useMemo(() => {
    let r = movies;
    if (ratingFilter > 0) r = r.filter((m) => m.personal_rating === ratingFilter);
    if (genreFilter) r = r.filter((m) => m.genres.includes(genreFilter));
    return r;
  }, [movies, ratingFilter, genreFilter]);

  const wantToWatch = filtered.filter((m) => m.status === "want_to_watch");
  const watching = filtered.filter((m) => m.status === "watching");
  const watched = filtered.filter((m) => m.status === "watched");
  const activeFilters = (ratingFilter > 0 ? 1 : 0) + (genreFilter ? 1 : 0);

  // Backdrop do primeiro "assistindo" ou "watched" rated highest
  const heroBackdrop = useMemo(() => {
    const candidate =
      watching.find((m) => m.backdrop_path) ??
      watched.find((m) => m.backdrop_path) ??
      wantToWatch.find((m) => m.backdrop_path);
    return candidate?.backdrop_path ? backdropUrl(candidate.backdrop_path, "w1280") : null;
  }, [watching, watched, wantToWatch]);

  const handleAddMovie = async (t: TMDBMovie) => {
    try {
      const year = t.release_date ? new Date(t.release_date).getFullYear() : 0;
      const credits = await getMovieCredits(t.id);
      await addMovie({
        tmdb_id: t.id,
        title: t.title,
        original_title: t.original_title,
        poster_path: t.poster_path,
        backdrop_path: t.backdrop_path,
        overview: t.overview,
        release_year: year,
        genres: resolveMovieGenres(t.genre_ids),
        tmdb_score: t.vote_average,
        director: credits.director,
        cast: credits.cast,
        status: "want_to_watch",
        personal_rating: null,
      });
      toast.success(`"${t.title}" adicionado`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao adicionar");
    }
  };

  const handleStatusChange = async (id: string, status: Movie["status"]) => {
    try {
      await updateMovie(id, { status });
      setSelectedMovie((p) => (p?.id === id ? { ...p, status } : p));
    } catch {
      toast.error("Erro ao atualizar");
    }
  };
  const handleRating = async (id: string, rating: number) => {
    try {
      await updateMovie(id, { personal_rating: rating });
      setSelectedMovie((p) => (p?.id === id ? { ...p, personal_rating: rating } : p));
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
    <>
      <PageHero
        eyebrow="Biblioteca"
        title={
          <>
            Filmes <span className="font-serif italic text-primary">do nosso casal</span>
          </>
        }
        subtitle={
          movies.length === 0
            ? "Monte a lista do que vocês querem ver juntos."
            : `${movies.length} ${movies.length === 1 ? "filme" : "filmes"} · ${watching.length} em andamento`
        }
        ambient="gold"
        backdropUrl={heroBackdrop}
        action={
          <button onClick={() => setSearchOpen(true)} className={btnPrimarySm}>
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        }
      />

      {movies.length > 0 && (
        <FilterBar active={activeFilters} onClear={clearFilters}>
          <div className="space-y-2">
            <FilterLabel>Avaliação</FilterLabel>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setRatingFilter(0)}
                className={cn(chip, ratingFilter === 0 ? chipActive : chipIdle)}
              >
                Todas
              </button>
              <div className="mx-1 h-4 w-px bg-border" />
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRatingFilter(n === ratingFilter ? 0 : n)}
                  aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-full transition-all",
                    n <= ratingFilter
                      ? "text-yellow-400 scale-110"
                      : "text-muted-foreground/40 hover:text-muted-foreground"
                  )}
                >
                  <Star className="h-4 w-4" fill={n <= ratingFilter ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>

          {availableGenres.length > 0 && (
            <div className="space-y-2">
              <FilterLabel>Gênero</FilterLabel>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setGenreFilter(null)}
                  className={cn(chip, !genreFilter ? chipActive : chipIdle)}
                >
                  Todos
                </button>
                {availableGenres.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenreFilter(g === genreFilter ? null : g)}
                    className={cn(chip, genreFilter === g ? chipActive : chipIdle)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}
        </FilterBar>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-8 space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="flex gap-4">
                {Array.from({ length: 6 }).map((_, j) => (
                  <Skeleton
                    key={j}
                    className="aspect-[2/3] w-[140px] flex-none rounded-2xl sm:w-[172px] lg:w-[196px]"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && movies.length === 0 && (
        <EmptyState
          icon={Film}
          title="Comece a coleção"
          description="Os filmes que vocês querem ver juntos vão viver aqui — com sinopse, elenco e nota da crítica."
          tone="gold"
          action={
            <button onClick={() => setSearchOpen(true)} className={btnPrimary}>
              <Plus className="h-4 w-4" />
              Buscar filme
            </button>
          }
        />
      )}

      {!loading && movies.length > 0 && filtered.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-sm text-muted-foreground">Nenhum filme combina com esses filtros.</p>
          <button onClick={clearFilters} className="mt-3 text-xs font-medium text-primary hover:underline">
            Limpar filtros
          </button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="mt-8 space-y-10 sm:space-y-12">
          {watching.length > 0 && (
            <MovieCarousel
              eyebrow="Em andamento"
              title="Assistindo"
              movies={watching}
              onSelect={setSelectedMovie}
            />
          )}
          {wantToWatch.length > 0 && (
            <MovieCarousel
              eyebrow="Fila"
              title="Queremos assistir"
              movies={wantToWatch}
              onSelect={setSelectedMovie}
            />
          )}
          {watched.length > 0 && (
            <MovieCarousel
              eyebrow="Arquivo"
              title="Já assistimos"
              movies={watched}
              onSelect={setSelectedMovie}
            />
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
    </>
  );
}
