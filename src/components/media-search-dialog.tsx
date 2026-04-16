import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { posterUrl } from "@/lib/tmdb";
import type { TMDBMovie, TMDBSeries } from "@/lib/tmdb";

interface MediaSearchDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  searchFn: (query: string) => Promise<T[]>;
  onSelect: (item: T) => void;
  renderItem: (item: T) => { title: string; subtitle: string; poster: string | null };
}

export function MediaSearchDialog<T>({
  open,
  onOpenChange,
  title,
  searchFn,
  onSelect,
  renderItem,
}: MediaSearchDialogProps<T>) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [searching, setSearching] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchFn(value);
        setResults(res);
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 400);
    setDebounceTimer(timer);
  };

  const handleSelect = (item: T) => {
    onSelect(item);
    setQuery("");
    setResults([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-11 pl-10 text-[15px]"
            autoFocus
          />
        </div>
        <div className="max-h-[55vh] space-y-1 overflow-y-auto pr-1">
          {searching && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {!searching && results.length === 0 && query.trim() && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado
            </p>
          )}
          {!searching &&
            results.map((item, i) => {
              const { title: itemTitle, subtitle, poster } = renderItem(item);
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(item)}
                  className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-accent"
                >
                  {poster ? (
                    <img
                      src={posterUrl(poster, "w185")}
                      alt={itemTitle}
                      className="h-[72px] w-12 rounded-lg object-cover ring-1 ring-white/5"
                    />
                  ) : (
                    <div className="flex h-[72px] w-12 items-center justify-center rounded-lg bg-muted text-[10px] text-muted-foreground">
                      s/ capa
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold">{itemTitle}</p>
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                  </div>
                </button>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function movieRenderItem(item: TMDBMovie) {
  const year = item.release_date ? new Date(item.release_date).getFullYear() : "N/A";
  return {
    title: item.title,
    subtitle: `${year} — ${item.original_title}`,
    poster: item.poster_path,
  };
}

export function seriesRenderItem(item: TMDBSeries) {
  const year = item.first_air_date ? new Date(item.first_air_date).getFullYear() : "N/A";
  return {
    title: item.name,
    subtitle: `${year} — ${item.original_name}`,
    poster: item.poster_path,
  };
}
