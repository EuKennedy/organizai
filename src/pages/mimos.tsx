import { useMemo, useState } from "react";
import { Plus, Sparkles, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useMimos } from "@/hooks/use-mimos";
import { useMimoCategories } from "@/hooks/use-mimo-categories";
import { MimoCarousel } from "@/components/mimo-carousel";
import { MimoDetailModal } from "@/components/mimo-detail-modal";
import { CreateCategoryDialog } from "@/components/create-category-dialog";
import { PageHero } from "@/components/page-hero";
import { EmptyState } from "@/components/empty-state";
import { FilterBar, FilterLabel } from "@/components/filter-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { btnPrimary, btnPrimarySm, chip, chipActive, chipIdle } from "@/lib/ui";
import { cn } from "@/lib/utils";
import type { Mimo, MimoCategory } from "@/types";

type StatusFilter = "all" | "owned" | "wish" | "finished";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "wish", label: "Desejo" },
  { value: "owned", label: "Tenho" },
  { value: "finished", label: "Acabou" },
];

export function MimosPage() {
  const { mimos, loading, addMimo, updateMimo, deleteMimo } = useMimos();
  const { categories, getCategory, createCategory } = useMimoCategories();

  const [selected, setSelected] = useState<Mimo | null>(null);
  const [creatingCategory, setCreatingCategory] = useState<MimoCategory | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<MimoCategory | null>(null);
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);

  const filtered = useMemo(() => {
    return mimos.filter((m) => {
      if (statusFilter === "owned" && !m.owned) return false;
      if (statusFilter === "wish" && m.owned) return false;
      if (statusFilter === "finished" && !m.finished) return false;
      if (categoryFilter && m.category !== categoryFilter) return false;
      return true;
    });
  }, [mimos, statusFilter, categoryFilter]);

  const activeFilters = (statusFilter !== "all" ? 1 : 0) + (categoryFilter ? 1 : 0);

  const stats = useMemo(() => {
    const owned = mimos.filter((m) => m.owned && !m.finished).length;
    const wish = mimos.filter((m) => !m.owned).length;
    const finished = mimos.filter((m) => m.finished).length;
    return { total: mimos.length, owned, wish, finished };
  }, [mimos]);

  const visibleCategories: MimoCategory[] = useMemo(() => {
    if (categoryFilter) return [categoryFilter];
    const known = categories.map((c) => c.value);
    const extras = Array.from(
      new Set(mimos.map((m) => m.category).filter((v) => !known.includes(v)))
    );
    return [...known, ...extras];
  }, [categories, mimos, categoryFilter]);

  const firstCategoryValue = categories[0]?.value ?? "olhos";

  const handleSave = async (data: Partial<Mimo> & { category: MimoCategory; name: string }) => {
    try {
      if (selected) {
        await updateMimo(selected.id, data);
        toast.success("Mimo atualizado");
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
        toast.success("Mimo adicionado");
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
    <>
      <PageHero
        eyebrow="Lista dela"
        title={
          <>
            Mimos <span className="font-serif italic text-primary">do meu amor</span>
          </>
        }
        subtitle={
          stats.total === 0
            ? "Catalogue os cosméticos, acessórios e mimos prediletos."
            : `${stats.total} ${stats.total === 1 ? "item salvo" : "itens salvos"}`
        }
        ambient="rose"
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
            accent="emerald"
            icon={<Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
            label="Tenho"
            value={stats.owned}
          />
          <StatCard
            accent="rose"
            icon={<Sparkles className="h-3.5 w-3.5" strokeWidth={2} />}
            label="Desejo"
            value={stats.wish}
          />
          <StatCard
            accent="amber"
            icon={<AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.5} />}
            label="Acabou"
            value={stats.finished}
          />
        </div>
      )}

      {mimos.length > 0 && (
        <FilterBar active={activeFilters} onClear={clearFilters}>
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
                  onClick={() => setCategoryFilter(c.value === categoryFilter ? null : c.value)}
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
                    className="aspect-[2/3] w-[140px] flex-none rounded-2xl sm:w-[172px] lg:w-[196px]"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && mimos.length === 0 && (
        <EmptyState
          icon={Sparkles}
          title="Comece o catálogo"
          description="Salve cosméticos, skincare, acessórios — com foto, link e anotação."
          tone="rose"
          action={
            <button
              onClick={() => setCreatingCategory(firstCategoryValue)}
              className={btnPrimary}
            >
              <Plus className="h-4 w-4" />
              Adicionar primeiro mimo
            </button>
          }
        />
      )}

      {!loading && mimos.length > 0 && filtered.length === 0 && (
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
            const items = filtered.filter((m) => m.category === cat);
            if (items.length === 0 && !categoryFilter) return null;
            const meta = getCategory(cat);
            return (
              <MimoCarousel
                key={cat}
                meta={meta}
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
  accent: "emerald" | "rose" | "amber";
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
    amber: {
      line: "from-transparent via-amber-500/60 to-transparent",
      text: "text-amber-500",
      bg: "bg-amber-500/10",
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
      <p className={cn("mt-3 text-3xl font-semibold tabular tracking-tight sm:text-[32px]", t.text)}>
        {value}
      </p>
    </div>
  );
}
