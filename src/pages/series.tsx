import { useMemo, useState } from "react";
import { Plus, Tv, Star } from "lucide-react";
import { toast } from "sonner";
import { useSeries } from "@/hooks/use-series";
import {
  searchSeries,
  resolveTVGenres,
  getSeriesCredits,
  backdropUrl,
} from "@/lib/tmdb";
import type { TMDBSeries } from "@/lib/tmdb";
import { MediaSearchDialog, seriesRenderItem } from "@/components/media-search-dialog";
import { SeriesCarousel } from "@/components/series-carousel";
import { SeriesDetailModal } from "@/components/series-detail-modal";
import { PageHero } from "@/components/page-hero";
import { EmptyState } from "@/components/empty-state";
import { FilterBar, FilterLabel } from "@/components/filter-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { btnPrimary, btnPrimarySm, chip, chipActive, chipIdle } from "@/lib/ui";
import { cn } from "@/lib/utils";
import type { Series } from "@/types";

export function SeriesPage() {
  const { series, loading, addSeries, updateSeries, deleteSeries } = useSeries();
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [genreFilter, setGenreFilter] = useState<string | null>(null);

  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    series.forEach((s) => s.genres.forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }, [series]);

  const filtered = useMemo(() => {
    let r = series;
    if (ratingFilter > 0) r = r.filter((s) => s.personal_rating === ratingFilter);
    if (genreFilter) r = r.filter((s) => s.genres.includes(genreFilter));
    return r;
  }, [series, ratingFilter, genreFilter]);

  const watching = filtered.filter((s) => s.status === "watching");
  const wantToWatch = filtered.filter((s) => s.status === "want_to_watch");
  const watched = filtered.filter((s) => s.status === "watched");
  const activeFilters = (ratingFilter > 0 ? 1 : 0) + (genreFilter ? 1 : 0);

  const heroBackdrop = useMemo(() => {
    const c =
      watching.find((s) => s.backdrop_path) ??
      watched.find((s) => s.backdrop_path) ??
      wantToWatch.find((s) => s.backdrop_path);
    return c?.backdrop_path ? backdropUrl(c.backdrop_path, "w1280") : null;
  }, [watching, watched, wantToWatch]);

  const handleAdd = async (t: TMDBSeries) => {
    try {
      const year = t.first_air_date ? new Date(t.first_air_date).getFullYear() : 0;
      const credits = await getSeriesCredits(t.id);
      await addSeries({
        tmdb_id: t.id,
        title: t.name,
        original_title: t.original_name,
        poster_path: t.poster_path,
        backdrop_path: t.backdrop_path,
        overview: t.overview,
        first_air_year: year,
        genres: resolveTVGenres(t.genre_ids),
        tmdb_score: t.vote_average,
        director: credits.director,
        cast: credits.cast,
        status: "want_to_watch",
        current_season: null,
        current_episode: null,
        personal_rating: null,
      });
      toast.success(`"${t.name}" adicionada`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao adicionar");
    }
  };

  const handleStatusChange = async (id: string, status: Series["status"]) => {
    try {
      await updateSeries(id, { status });
      setSelectedSeries((p) => (p?.id === id ? { ...p, status } : p));
    } catch {
      toast.error("Erro ao atualizar");
    }
  };
  const handleRating = async (id: string, rating: number) => {
    try {
      await updateSeries(id, { personal_rating: rating });
      setSelectedSeries((p) => (p?.id === id ? { ...p, personal_rating: rating } : p));
    } catch {
      toast.error("Erro ao avaliar");
    }
  };
  const handleEpisodeUpdate = async (
    id: string,
    field: "current_season" | "current_episode",
    value: string
  ) => {
    const num = value ? parseInt(value, 10) : null;
    try {
      await updateSeries(id, { [field]: num });
      setSelectedSeries((p) => (p?.id === id ? { ...p, [field]: num } : p));
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
    <>
      <PageHero
        eyebrow="Biblioteca"
        title={
          <>
            Séries <span className="font-serif italic text-primary">do casal</span>
          </>
        }
        subtitle={
          series.length === 0
            ? "Acompanhem temporada e episódio do que estão vendo."
            : `${series.length} ${series.length === 1 ? "série" : "séries"} · ${watching.length} em andamento`
        }
        ambient="teal"
        backdropUrl={heroBackdrop}
        action={
          <button onClick={() => setSearchOpen(true)} className={btnPrimarySm}>
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        }
      />

      {series.length > 0 && (
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
                  aria-label={`${n} estrelas`}
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

      {!loading && series.length === 0 && (
        <EmptyState
          icon={Tv}
          title="Nenhuma série ainda"
          description="Acompanhem temporada e episódio sem perder o fio."
          tone="teal"
          action={
            <button onClick={() => setSearchOpen(true)} className={btnPrimary}>
              <Plus className="h-4 w-4" />
              Buscar série
            </button>
          }
        />
      )}

      {!loading && series.length > 0 && filtered.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma série combina com esses filtros.</p>
          <button onClick={clearFilters} className="mt-3 text-xs font-medium text-primary hover:underline">
            Limpar filtros
          </button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="mt-8 space-y-10 sm:space-y-12">
          {watching.length > 0 && (
            <SeriesCarousel
              eyebrow="Em andamento"
              title="Assistindo"
              series={watching}
              onSelect={setSelectedSeries}
            />
          )}
          {wantToWatch.length > 0 && (
            <SeriesCarousel
              eyebrow="Fila"
              title="Queremos assistir"
              series={wantToWatch}
              onSelect={setSelectedSeries}
            />
          )}
          {watched.length > 0 && (
            <SeriesCarousel
              eyebrow="Arquivo"
              title="Já assistimos"
              series={watched}
              onSelect={setSelectedSeries}
            />
          )}
        </div>
      )}

      <MediaSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Buscar série"
        searchFn={searchSeries}
        onSelect={handleAdd}
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
    </>
  );
}
