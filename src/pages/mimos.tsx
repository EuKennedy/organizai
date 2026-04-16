import { useMemo, useState } from "react";
import { Plus, Sparkles, ChevronDown, X, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useMimos } from "@/hooks/use-mimos";
import { MimoCarousel } from "@/components/mimo-carousel";
import { MimoDetailModal } from "@/components/mimo-detail-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MIMO_CATEGORIES, type Mimo, type MimoCategory } from "@/types";

type StatusFilter = "all" | "owned" | "wish" | "finished";

const STATUS_FILTERS: { value: StatusFilter; label: string; icon?: typeof Check }[] = [
  { value: "all", label: "Todos" },
  { value: "owned", label: "Tenho", icon: Check },
  { value: "wish", label: "Desejo" },
  { value: "finished", label: "Acabou", icon: AlertTriangle },
];

export function MimosPage() {
  const { mimos, loading, addMimo, updateMimo, deleteMimo } = useMimos();
  const [selected, setSelected] = useState<Mimo | null>(null);
  const [creatingCategory, setCreatingCategory] = useState<MimoCategory | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<MimoCategory | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return mimos.filter((m) => {
      if (statusFilter === "owned" && !m.owned) return false;
      if (statusFilter === "wish" && m.owned) return false;
      if (statusFilter === "finished" && !m.finished) return false;
      if (categoryFilter && m.category !== categoryFilter) return false;
      return true;
    });
  }, [mimos, statusFilter, categoryFilter]);

  const hasActiveFilter = statusFilter !== "all" || categoryFilter !== null;

  // Stats
  const stats = useMemo(() => {
    const owned = mimos.filter((m) => m.owned).length;
    const wish = mimos.filter((m) => !m.owned).length;
    const finished = mimos.filter((m) => m.finished).length;
    return { total: mimos.length, owned, wish, finished };
  }, [mimos]);

  const visibleCategories = categoryFilter
    ? [categoryFilter]
    : (MIMO_CATEGORIES.map((c) => c.value) as MimoCategory[]);

  const handleSave = async (data: Partial<Mimo> & { category: MimoCategory; name: string }) => {
    try {
      if (selected) {
        await updateMimo(selected.id, data);
        toast.success("Mimo atualizado!");
      } else {
        await addMimo({
          category: data.category,
          brand: data.brand ?? "",
          name: data.name,
          link: data.link ?? null,
          image_url: data.image_url ?? null,
          owned: data.owned ?? false,
          finished: data.finished ?? false,
          notes: data.notes ?? null,
        });
        toast.success("Mimo adicionado!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMimo(id);
      toast.success("Mimo removido");
    } catch {
      toast.error("Erro ao remover");
    }
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setCategoryFilter(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💕</span>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Mimos do meu amor</h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            {stats.total} {stats.total === 1 ? "item" : "itens"} salvos
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mimos.length > 0 && (
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
                  {(statusFilter !== "all" ? 1 : 0) + (categoryFilter ? 1 : 0)}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setCreatingCategory("olhos")}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground sm:text-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        </div>
      </div>

      {/* Stats cards */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Tenho</p>
            <p className="text-lg font-bold text-green-500 sm:text-xl">{stats.owned}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Desejo</p>
            <p className="text-lg font-bold text-pink-500 sm:text-xl">{stats.wish}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Acabou</p>
            <p className="text-lg font-bold text-orange-500 sm:text-xl">{stats.finished}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && mimos.length > 0 && (
        <div className="space-y-3 rounded-xl border border-border bg-card/50 p-3 sm:p-4">
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                    statusFilter === f.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Categoria</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setCategoryFilter(null)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                  !categoryFilter
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                Todas
              </button>
              {MIMO_CATEGORIES.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => setCategoryFilter(value)}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                    categoryFilter === value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span>{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
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
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-52 w-36 flex-none rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && mimos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20">
            <Sparkles className="h-8 w-8 text-pink-500" />
          </div>
          <h3 className="text-base font-semibold">Sua lista esta vazia</h3>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground sm:text-sm">
            Comece a catalogar seus produtos favoritos — maquiagem, skincare, acessorios...
          </p>
          <button
            onClick={() => setCreatingCategory("olhos")}
            className="mt-4 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Adicionar primeiro mimo
          </button>
        </div>
      )}

      {/* No results */}
      {!loading && mimos.length > 0 && filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">Nenhum item com esse filtro</p>
          <button onClick={clearFilters} className="mt-2 text-xs text-primary hover:underline">
            Limpar filtros
          </button>
        </div>
      )}

      {/* Carousels */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-6 sm:space-y-8">
          {visibleCategories.map((cat) => {
            const items = filtered.filter((m) => m.category === cat);
            // If there's a category filter active, always show carousel even if empty
            if (items.length === 0 && !categoryFilter) return null;
            return (
              <MimoCarousel
                key={cat}
                category={cat}
                mimos={items}
                onSelect={setSelected}
                onAdd={(c) => setCreatingCategory(c)}
              />
            );
          })}
        </div>
      )}

      {/* Modals */}
      <MimoDetailModal
        mimo={selected}
        onClose={() => setSelected(null)}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <MimoDetailModal
        mimo={null}
        isNew={!!creatingCategory}
        defaultCategory={creatingCategory}
        onClose={() => setCreatingCategory(null)}
        onSave={handleSave}
      />
    </div>
  );
}
