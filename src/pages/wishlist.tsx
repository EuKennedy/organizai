import { useMemo, useState } from "react";
import { Plus, ShoppingBag, Check, AlertTriangle, Sparkles, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useWishlist } from "@/hooks/use-wishlist";
import { WishlistCarousel } from "@/components/wishlist/wishlist-carousel";
import { WishlistDetailModal } from "@/components/wishlist/wishlist-detail-modal";
import { CreateCategoryDialog } from "@/components/create-category-dialog";
import { PageHero } from "@/components/page-hero";
import { EmptyState } from "@/components/empty-state";
import { FilterBar, FilterLabel } from "@/components/filter-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { btnPrimary, btnPrimarySm, chip, chipActive, chipIdle } from "@/lib/ui";
import { cn } from "@/lib/utils";
import type {
  WishlistItem,
  WishlistCategory,
  WishlistStatus,
  WishlistPriority,
} from "@/types";

const STATUS_FILTERS: { value: WishlistStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "querendo", label: "Querendo" },
  { value: "comprado", label: "Comprado" },
  { value: "desistido", label: "Desisti" },
];

const PRIORITY_FILTERS: { value: WishlistPriority | "all"; label: string; emoji: string }[] = [
  { value: "all", label: "Todas", emoji: "•" },
  { value: "alta", label: "Alta", emoji: "🔥" },
  { value: "media", label: "Média", emoji: "✨" },
  { value: "baixa", label: "Baixa", emoji: "🌱" },
];

function formatBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);
}

export function WishlistPage() {
  const { items, categories, loading, addItem, updateItem, deleteItem, getCategory, createCategory } =
    useWishlist();

  const [selected, setSelected] = useState<WishlistItem | null>(null);
  const [creatingCategory, setCreatingCategory] = useState<WishlistCategory | null>(null);
  const [statusFilter, setStatusFilter] = useState<WishlistStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<WishlistPriority | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<WishlistCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (priorityFilter !== "all" && m.priority !== priorityFilter) return false;
      if (categoryFilter && m.category !== categoryFilter) return false;
      if (q) {
        const hay = `${m.brand ?? ""} ${m.name} ${m.notes ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, statusFilter, priorityFilter, categoryFilter, searchQuery]);

  const activeFilters =
    (statusFilter !== "all" ? 1 : 0) +
    (priorityFilter !== "all" ? 1 : 0) +
    (categoryFilter ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const stats = useMemo(() => {
    const querendo = items.filter((i) => i.status === "querendo");
    const total = items.length;
    const totalPrice = querendo.reduce(
      (s, i) => s + (i.price ? Number(i.price) : 0),
      0
    );
    return {
      total,
      querendo: querendo.length,
      comprado: items.filter((i) => i.status === "comprado").length,
      desistido: items.filter((i) => i.status === "desistido").length,
      totalPrice,
    };
  }, [items]);

  const visibleCategories: WishlistCategory[] = useMemo(() => {
    if (categoryFilter) return [categoryFilter];
    const known = categories.map((c) => c.value);
    const extras = Array.from(
      new Set(items.map((i) => i.category).filter((v) => !known.includes(v)))
    );
    return [...known, ...extras];
  }, [categories, items, categoryFilter]);

  const firstCategoryValue = categories[0]?.value ?? "outros";

  const handleSave = async (
    data: Partial<WishlistItem> & { category: WishlistCategory; name: string }
  ) => {
    try {
      if (selected) {
        await updateItem(selected.id, data);
        toast.success("Item atualizado");
      } else {
        await addItem({
          category: data.category,
          name: data.name,
          brand: data.brand ?? null,
          link: data.link ?? null,
          image_url: data.image_url ?? null,
          price: data.price ?? null,
          priority: data.priority ?? "media",
          status: data.status ?? "querendo",
          notes: data.notes ?? null,
        });
        toast.success("Item adicionado");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem(id);
      toast.success("Item removido");
    } catch {
      toast.error("Erro ao remover");
    }
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setSearchQuery("");
    setCategoryFilter(null);
  };

  return (
    <>
      <PageHero
        eyebrow="Lista a dois"
        title={
          <>
            Coisas que <span className="font-serif italic text-primary">queremos comprar</span>
          </>
        }
        subtitle={
          stats.total === 0
            ? "Salve links, fotos e prioridades dos itens que sonhamos juntos."
            : `${stats.total} ${stats.total === 1 ? "item salvo" : "itens salvos"}${
                stats.totalPrice > 0 ? ` · ${formatBRL(stats.totalPrice)} querendo` : ""
              }`
        }
        ambient="gold"
        action={
          <button
            onClick={() => setCreatingCategory(firstCategoryValue)}
            className={btnPrimarySm}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        }
      />

      {/* Stats */}
      {stats.total > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          <StatCard
            accent="rose"
            icon={<ShoppingBag className="h-3.5 w-3.5" strokeWidth={2.25} />}
            label="Querendo"
            value={stats.querendo}
          />
          <StatCard
            accent="emerald"
            icon={<Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
            label="Comprado"
            value={stats.comprado}
          />
          <StatCard
            accent="zinc"
            icon={<AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.5} />}
            label="Desisti"
            value={stats.desistido}
          />
        </div>
      )}

      {items.length > 0 && (
        <FilterBar active={activeFilters} onClear={clearFilters}>
          <div className="space-y-2">
            <FilterLabel>Buscar</FilterLabel>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                placeholder="Marca, item, anotação…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Limpar busca"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <FilterLabel>Status</FilterLabel>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(chip, statusFilter === f.value ? chipActive : chipIdle)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <FilterLabel>Prioridade</FilterLabel>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITY_FILTERS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriorityFilter(p.value)}
                  className={cn(chip, priorityFilter === p.value ? chipActive : chipIdle)}
                >
                  {p.value !== "all" && <span>{p.emoji}</span>}
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <FilterLabel>Categoria</FilterLabel>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setCategoryFilter(null)}
                className={cn(chip, !categoryFilter ? chipActive : chipIdle)}
              >
                Todas
              </button>
              {categories.map((c) => (
                <button
                  key={c.value}
                  onClick={() =>
                    setCategoryFilter(c.value === categoryFilter ? null : c.value)
                  }
                  className={cn(chip, categoryFilter === c.value ? chipActive : chipIdle)}
                >
                  <span>{c.emoji}</span>
                  {c.label}
                </button>
              ))}
              <button
                onClick={() => setShowNewCategoryDialog(true)}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:border-primary hover:bg-primary/10"
              >
                <Plus className="h-3 w-3" />
                Nova
              </button>
            </div>
          </div>
        </FilterBar>
      )}

      {loading && (
        <div className="mt-8 space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-6 w-40" />
              <div className="flex gap-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton
                    key={j}
                    className="aspect-[3/4] w-[140px] flex-none rounded-2xl sm:w-[172px] lg:w-[196px]"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <EmptyState
          icon={Sparkles}
          title="Comece a lista de desejos"
          description="Salve aquele item que vimos no shopping, no Instagram, em qualquer lugar — com link, foto, preço e prioridade."
          tone="gold"
          action={
            <button
              onClick={() => setCreatingCategory(firstCategoryValue)}
              className={btnPrimary}
            >
              <Plus className="h-4 w-4" />
              Adicionar primeiro item
            </button>
          }
        />
      )}

      {!loading && items.length > 0 && filtered.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-sm text-muted-foreground">Nada combina com esses filtros.</p>
          <button
            onClick={clearFilters}
            className="mt-3 text-xs font-medium text-primary hover:underline"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="mt-8 space-y-10 sm:space-y-12">
          {visibleCategories.map((cat) => {
            const list = filtered.filter((i) => i.category === cat);
            if (list.length === 0 && !categoryFilter) return null;
            const meta = getCategory(cat);
            return (
              <WishlistCarousel
                key={cat}
                meta={meta}
                items={list}
                onSelect={setSelected}
                onAdd={(c) => setCreatingCategory(c)}
              />
            );
          })}
        </div>
      )}

      {/* Modals */}
      <WishlistDetailModal
        item={selected}
        onClose={() => setSelected(null)}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <WishlistDetailModal
        item={null}
        isNew={!!creatingCategory}
        defaultCategory={creatingCategory}
        onClose={() => setCreatingCategory(null)}
        onSave={handleSave}
      />

      <CreateCategoryDialog
        open={showNewCategoryDialog}
        onClose={() => setShowNewCategoryDialog(false)}
        onCreate={async (label, emoji) => {
          const created = await createCategory(label, emoji);
          setCategoryFilter(created.value);
          return created;
        }}
      />
    </>
  );
}

function StatCard({
  accent,
  icon,
  label,
  value,
}: {
  accent: "emerald" | "rose" | "zinc";
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  const tones: Record<typeof accent, { line: string; text: string; bg: string }> = {
    emerald: {
      line: "from-transparent via-emerald-500/60 to-transparent",
      text: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    rose: {
      line: "from-transparent via-pink-500/60 to-transparent",
      text: "text-pink-500",
      bg: "bg-pink-500/10",
    },
    zinc: {
      line: "from-transparent via-zinc-500/60 to-transparent",
      text: "text-zinc-400",
      bg: "bg-zinc-500/10",
    },
  };
  const t = tones[accent];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r",
          t.line
        )}
      />
      <div className="flex items-center gap-2">
        <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", t.bg)}>
          <span className={t.text}>{icon}</span>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p
        className={cn(
          "mt-3 text-3xl font-semibold tabular tracking-tight sm:text-[32px]",
          t.text
        )}
      >
        {value}
      </p>
    </div>
  );
}
