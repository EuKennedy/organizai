import { useState } from "react";
import { Plus, Trash2, Tv } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useSeries } from "@/hooks/use-series";
import { searchSeries, resolveTVGenres, posterUrl } from "@/lib/tmdb";
import type { TMDBSeries } from "@/lib/tmdb";
import { MediaSearchDialog, seriesRenderItem } from "@/components/media-search-dialog";
import { StatusBadge } from "@/components/status-badge";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Series } from "@/types";

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "want_to_watch", label: "Quero assistir" },
  { value: "watching", label: "Assistindo" },
  { value: "watched", label: "Assistido" },
] as const;

export function SeriesPage() {
  const { series, loading, addSeries, updateSeries, deleteSeries } = useSeries();
  const [searchOpen, setSearchOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = statusFilter === "all" ? series : series.filter((s) => s.status === statusFilter);

  const handleAddSeries = async (tmdbSeries: TMDBSeries) => {
    try {
      const year = tmdbSeries.first_air_date ? new Date(tmdbSeries.first_air_date).getFullYear() : 0;
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
        status: "want_to_watch",
        current_season: null,
        current_episode: null,
        personal_rating: null,
      });
      toast.success(`"${tmdbSeries.name}" adicionada`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao adicionar serie");
    }
  };

  const handleStatusChange = async (id: string, status: Series["status"]) => {
    try {
      await updateSeries(id, { status });
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleEpisodeUpdate = async (id: string, field: "current_season" | "current_episode", value: string) => {
    const num = value ? parseInt(value, 10) : null;
    try {
      await updateSeries(id, { [field]: num });
    } catch {
      toast.error("Erro ao atualizar");
    }
  };

  const handleRating = async (id: string, rating: number) => {
    try {
      await updateSeries(id, { personal_rating: rating });
    } catch {
      toast.error("Erro ao avaliar");
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Series</h1>
          <p className="text-sm text-muted-foreground">
            {series.length} {series.length === 1 ? "serie" : "series"} na lista
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

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[380px] rounded-xl" />
          ))}
        </div>
      )}

      {!loading && series.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Tv className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-medium">Nenhuma serie ainda</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Clique em "Adicionar" para buscar e salvar series
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((s) => (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="group relative overflow-hidden">
                {s.poster_path ? (
                  <img
                    src={posterUrl(s.poster_path, "w500")}
                    alt={s.title}
                    className="aspect-[2/3] w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex aspect-[2/3] w-full items-center justify-center bg-muted">
                    <Tv className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}

                {/* "Em andamento" badge */}
                {s.status === "watching" && (
                  <Badge className="absolute left-2 top-2 bg-yellow-500 text-white">
                    Em andamento
                  </Badge>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="space-y-2">
                    <p className="text-xs text-white/60 line-clamp-3">{s.overview}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/50">TMDB: {s.tmdb_score.toFixed(1)}</span>
                      <span className="text-xs text-white/50">{s.first_air_year}</span>
                    </div>
                    {s.genres.length > 0 && (
                      <p className="text-xs text-white/40">{s.genres.join(", ")}</p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <StarRating
                        value={s.personal_rating}
                        onChange={(v) => handleRating(s.id, v)}
                        size="sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/60 hover:text-red-400"
                        onClick={() => handleDelete(s.id, s.title)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Info bar */}
                <div className="space-y-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium leading-tight line-clamp-1">{s.title}</h3>
                    <StatusBadge status={s.status} />
                  </div>

                  {/* Episode tracker */}
                  {s.status === "watching" && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">T</span>
                        <Input
                          type="number"
                          min={1}
                          className="h-7 w-12 text-xs"
                          value={s.current_season ?? ""}
                          onChange={(e) => handleEpisodeUpdate(s.id, "current_season", e.target.value)}
                          placeholder="-"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">E</span>
                        <Input
                          type="number"
                          min={1}
                          className="h-7 w-12 text-xs"
                          value={s.current_episode ?? ""}
                          onChange={(e) => handleEpisodeUpdate(s.id, "current_episode", e.target.value)}
                          placeholder="-"
                        />
                      </div>
                    </div>
                  )}

                  <Select
                    value={s.status}
                    onValueChange={(v) => handleStatusChange(s.id, v as Series["status"])}
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

      <MediaSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Buscar serie"
        searchFn={searchSeries}
        onSelect={handleAddSeries}
        renderItem={seriesRenderItem}
      />
    </div>
  );
}
