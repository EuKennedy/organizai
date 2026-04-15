import { useMemo, useState } from "react";
import { Plus, Tv, ChevronDown, X } from "lucide-react";
import { toast } from "sonner";
import { useSeries } from "@/hooks/use-series";
import { searchSeries, resolveTVGenres, getSeriesCredits } from "@/lib/tmdb";
import type { TMDBSeries } from "@/lib/tmdb";
import { MediaSearchDialog, seriesRenderItem } from "@/components/media-search-dialog";
import { SeriesCarousel } from "@/components/series-carousel";
import { SeriesDetailModal } from "@/components/series-detail-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Series } from "@/types";

export function SeriesPage() {
  const { series, loading, addSeries, updateSeries, deleteSeries } = useSeries();
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    series.forEach((s) => s.genres.forEach((g) => genreSet.add(g)));
    return Array.from(genreSet).sort();
  }, [series]);

  const filtered = useMemo(() => {
    let result = series;
    if (ratingFilter > 0) {
      result = result.filter((s) => s.personal_rating === ratingFilter);
    }
    if (genreFilter) {
      result = result.filter((s) => s.genres.includes(genreFilter));
    }
    return result;
  }, [series, ratingFilter, genreFilter]);

  const wantToWatch = useMemo(() => filtered.filter((s) => s.status === "want_to_watch"), [filtered]);
  const watching = useMemo(() => filtered.filter((s) => s.status === "watching"), [filtered]);
  const watched = useMemo(() => filtered.filter((s) => s.status === "watched"), [filtered]);

  const hasActiveFilter = ratingFilter > 0 || genreFilter !== null;

  const handleAddSeries = async (tmdbSeries: TMDBSeries) => {
    try {
      const year = tmdbSeries.first_air_date ? new Date(tmdbSeries.first_air_date).getFullYear() : 0;
      const credits = await getSeriesCredits(tmdbSeries.id);
      await addSeries({
        tmdb_id: tmdbSeries.id,
        title: tmdbSeries.name,
        original_title: tmdbSeries.original_name,
        poster_path: tmdbSeries.poster_path,
        backdrop_path: tmdbSeries.backdrop_path,
        overview: tmdbSeries.overview,
        first_air_year: year,
        genres: resolveTVGenres(tmdbSeries.genre_ids),
        tmdb_score: tmdbSeries.vote_average,
        director: credits.director,
        cast: credits.cast,
        status: "want_to_watch",
        current_season: null,
        current_episode: null,
        personal_rating: null,
      });
      toast.success(`"${tmdbSeries.name}" adicionada`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao adicionar");
    }
  };

  const handleStatusChange = async (id: string, status: Series["status"]) => {
    try {
      await updateSeries(id, { status });
      setSelectedSeries((prev) => (prev?.id === id ? { ...prev, status } : prev));
    } catch {
      toast.error("Erro ao atualizar");
    }
  };

  const handleRating = async (id: string, rating: number) => {
    try {
      await updateSeries(id, { personal_rating: rating });
      setSelectedSeries((prev) => (prev?.id === id ? { ...prev, personal_rating: rating } : prev));
    } catch {
      toast.error("Erro ao avaliar");
    }
  };

  const handleEpisodeUpdate = async (id: string, field: "current_season" | "current_episode", value: string) => {
    const num = value ? parseInt(value, 10) : null;
    try {
      await updateSeries(id, { [field]: num });
      setSelectedSeries((prev) => (prev?.id === id ? { ...prev, [field]: num } : prev));
    } catch {
      toast.error("Erro ao atualizar");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    try {
      await deleteSeries(id);
      toast.success(`"${title}" removida`);
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
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Series</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {series.length} {series.length === 1 ? "serie" : "series"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {series.length > 0 && (
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

      {/* Filters */}
      {showFilters && series.length > 0 && (
        <div className="space-y-3 rounded-xl border border-border bg-card/50 p-3 sm:p-4">
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
      {!loading && series.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center sm:py-24">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Tv className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold">Nenhuma serie ainda</h3>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground sm:text-sm">
            Adicione series para acompanhar o que voces estao assistindo
          </p>
          <button
            onClick={() => setSearchOpen(true)}
            className="mt-4 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Buscar serie
          </button>
        </div>
      )}

      {/* No results */}
      {!loading && series.length > 0 && filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma serie com esse filtro</p>
          <button onClick={clearFilters} className="mt-2 text-xs text-primary hover:underline">
            Limpar filtros
          </button>
        </div>
      )}

      {/* Carousels */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-6 sm:space-y-8">
          {wantToWatch.length > 0 && (
            <SeriesCarousel title="Quero assistir" series={wantToWatch} onSelect={setSelectedSeries} />
          )}
          {watching.length > 0 && (
            <SeriesCarousel title="Assistindo" series={watching} onSelect={setSelectedSeries} />
          )}
          {watched.length > 0 && (
            <SeriesCarousel title="Assistido" series={watched} onSelect={setSelectedSeries} />
          )}
        </div>
      )}

      <MediaSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Buscar serie"
        searchFn={searchSeries}
        onSelect={handleAddSeries}
        renderItem={seriesRenderItem}
      />

      <SeriesDetailModal
        series={selectedSeries}
        onClose={() => setSelectedSeries(null)}
        onStatusChange={handleStatusChange}
        onRate={handleRating}
        onEpisodeUpdate={handleEpisodeUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
