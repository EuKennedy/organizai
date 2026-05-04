import { useMemo, useState, useEffect } from "react";
import { Plus, Heart, Trash2, Baby, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useBabyNames } from "@/hooks/use-baby-names";
import { PageHero } from "@/components/page-hero";
import { EmptyState } from "@/components/empty-state";
import { FilterBar, FilterLabel } from "@/components/filter-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { btnPrimary, btnPrimarySm, chip, chipActive, chipIdle } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { BABY_GENDERS, type BabyGender, type BabyName } from "@/types";

const GENDER_TONES: Record<BabyGender, { ring: string; text: string; bg: string; soft: string }> = {
  menino: {
    ring: "ring-sky-400/30",
    text: "text-sky-400",
    bg: "bg-sky-500/10",
    soft: "from-sky-500/15 via-sky-500/5 to-transparent",
  },
  menina: {
    ring: "ring-pink-400/30",
    text: "text-pink-400",
    bg: "bg-pink-500/10",
    soft: "from-pink-500/15 via-pink-500/5 to-transparent",
  },
  unissex: {
    ring: "ring-amber-400/25",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    soft: "from-amber-500/15 via-amber-500/5 to-transparent",
  },
};

export function BabyNamesPage() {
  const { names, loading, addName, updateName, toggleFavorite, deleteName } = useBabyNames();

  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<BabyName | null>(null);
  const [genderFilter, setGenderFilter] = useState<BabyGender | "all" | "favorites">("all");

  const filtered = useMemo(() => {
    return names.filter((n) => {
      if (genderFilter === "favorites") return n.favorite;
      if (genderFilter !== "all" && n.gender !== genderFilter) return false;
      return true;
    });
  }, [names, genderFilter]);

  const stats = useMemo(() => {
    return {
      total: names.length,
      menino: names.filter((n) => n.gender === "menino").length,
      menina: names.filter((n) => n.gender === "menina").length,
      unissex: names.filter((n) => n.gender === "unissex").length,
      favorites: names.filter((n) => n.favorite).length,
    };
  }, [names]);

  const handleSave = async (data: Omit<BabyName, "id" | "user_id" | "created_at">) => {
    try {
      if (editing) {
        await updateName(editing.id, data);
        toast.success("Nome atualizado");
      } else {
        await addName(data);
        toast.success("Nome adicionado");
      }
      setEditing(null);
      setComposerOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteName(id);
      toast.success("Nome removido");
    } catch {
      toast.error("Erro ao remover");
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Para um dia"
        title={
          <>
            Nomes dos <span className="font-serif italic text-primary">nossos filhos</span>
          </>
        }
        subtitle={
          stats.total === 0
            ? "Nossas ideias para os pequenos que um dia virão."
            : `${stats.total} ${stats.total === 1 ? "ideia" : "ideias"}${
                stats.favorites > 0 ? ` · ${stats.favorites} favoritas` : ""
              }`
        }
        ambient="rose"
        action={
          <button onClick={() => setComposerOpen(true)} className={btnPrimarySm}>
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        }
      />

      {names.length > 0 && (
        <FilterBar
          active={genderFilter !== "all" ? 1 : 0}
          onClear={() => setGenderFilter("all")}
        >
          <div className="space-y-2">
            <FilterLabel>Mostrar</FilterLabel>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setGenderFilter("all")}
                className={cn(chip, genderFilter === "all" ? chipActive : chipIdle)}
              >
                Todos · {stats.total}
              </button>
              <button
                onClick={() => setGenderFilter("favorites")}
                className={cn(chip, genderFilter === "favorites" ? chipActive : chipIdle)}
              >
                <Heart className="h-3 w-3 fill-current" /> Favoritos · {stats.favorites}
              </button>
              {BABY_GENDERS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGenderFilter(g.value)}
                  className={cn(chip, genderFilter === g.value ? chipActive : chipIdle)}
                >
                  <span>{g.emoji}</span>
                  {g.label} · {stats[g.value]}
                </button>
              ))}
            </div>
          </div>
        </FilterBar>
      )}

      {loading && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && names.length === 0 && (
        <EmptyState
          icon={Baby}
          title="Nenhuma ideia ainda"
          description="Adicione nomes que te encantam — para meninos, meninas ou unissex. Marque os favoritos."
          tone="rose"
          action={
            <button onClick={() => setComposerOpen(true)} className={btnPrimary}>
              <Plus className="h-4 w-4" />
              Adicionar primeiro nome
            </button>
          }
        />
      )}

      {!loading && names.length > 0 && filtered.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-sm text-muted-foreground">Nada por aqui ainda.</p>
          <button
            onClick={() => setGenderFilter("all")}
            className="mt-3 text-xs font-medium text-primary hover:underline"
          >
            Limpar filtro
          </button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((n) => (
            <NameCard
              key={n.id}
              name={n}
              onEdit={() => setEditing(n)}
              onToggleFavorite={() => toggleFavorite(n.id, n.favorite)}
              onDelete={() => handleDelete(n.id)}
            />
          ))}
        </div>
      )}

      <NameComposer
        open={composerOpen || !!editing}
        editing={editing}
        onClose={() => {
          setComposerOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />
    </>
  );
}

function NameCard({
  name,
  onEdit,
  onToggleFavorite,
  onDelete,
}: {
  name: BabyName;
  onEdit: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}) {
  const tone = GENDER_TONES[name.gender];
  const genderMeta = BABY_GENDERS.find((g) => g.value === name.gender)!;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-lg hover:shadow-black/30",
        "ring-1",
        tone.ring
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 -z-0 bg-gradient-to-br",
          tone.soft
        )}
      />

      <div className="relative flex items-start justify-between gap-3">
        <button onClick={onEdit} className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                tone.bg,
                tone.text
              )}
            >
              <span>{genderMeta.emoji}</span>
              {genderMeta.label}
            </span>
            {name.origin && (
              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                · {name.origin}
              </span>
            )}
          </div>
          <p className="mt-2.5 font-serif text-2xl font-semibold tracking-tight text-foreground">
            {name.name}
          </p>
          {name.notes && (
            <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
              {name.notes}
            </p>
          )}
        </button>

        <div className="flex flex-col gap-1.5">
          <button
            onClick={onToggleFavorite}
            aria-label={name.favorite ? "Desfavoritar" : "Favoritar"}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-all",
              name.favorite
                ? "bg-rose-500/15 text-rose-500 ring-1 ring-rose-500/30"
                : "bg-muted/40 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
            )}
          >
            <Heart
              className="h-3.5 w-3.5"
              fill={name.favorite ? "currentColor" : "none"}
              strokeWidth={name.favorite ? 0 : 2}
            />
          </button>
          <button
            onClick={onDelete}
            aria-label="Remover"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function NameComposer({
  open,
  editing,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: BabyName | null;
  onClose: () => void;
  onSave: (data: Omit<BabyName, "id" | "user_id" | "created_at">) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<BabyGender>("menina");
  const [favorite, setFavorite] = useState(false);
  const [origin, setOrigin] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setGender(editing.gender);
      setFavorite(editing.favorite);
      setOrigin(editing.origin ?? "");
      setNotes(editing.notes ?? "");
    } else {
      setName("");
      setGender("menina");
      setFavorite(false);
      setOrigin("");
      setNotes("");
    }
  }, [editing, open]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        gender,
        favorite,
        origin: origin.trim() || null,
        notes: notes.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="fixed inset-x-3 top-[8%] z-50 mx-auto max-h-[84dvh] max-w-md overflow-y-auto overscroll-contain rounded-3xl border border-border bg-card shadow-2xl sm:inset-x-auto"
          >
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {editing ? "Editar" : "Novo nome"}
                </p>
                <h3 className="mt-1 font-serif text-xl font-semibold tracking-tight">
                  {editing ? editing.name : "Adicionar ideia"}
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/40 text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Nome
                </Label>
                <Input
                  placeholder="Ex: Antônia"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="h-11 font-serif text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Gênero
                </Label>
                <div className="grid grid-cols-3 gap-1 rounded-full bg-muted/50 p-1">
                  {BABY_GENDERS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGender(g.value)}
                      className={cn(
                        "relative inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all",
                        gender === g.value
                          ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>{g.emoji}</span>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Origem / significado
                </Label>
                <Input
                  placeholder="Ex: Latim · 'inestimável'"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Por que gostamos
                </Label>
                <Textarea
                  placeholder="Lembrança, sonoridade, homenagem…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[72px] resize-none text-sm"
                />
              </div>

              <button
                type="button"
                onClick={() => setFavorite((f) => !f)}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-all",
                  favorite
                    ? "bg-rose-500/15 text-rose-500 ring-1 ring-rose-500/30"
                    : "bg-muted/40 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
                )}
              >
                <Heart
                  className="h-3.5 w-3.5"
                  fill={favorite ? "currentColor" : "none"}
                  strokeWidth={favorite ? 0 : 2}
                />
                {favorite ? "Favorito" : "Marcar como favorito"}
              </button>

              <div className="flex justify-end border-t border-border pt-4">
                <button
                  onClick={handleSave}
                  disabled={!name.trim() || saving}
                  className={btnPrimary}
                >
                  {saving ? "Salvando…" : editing ? "Salvar" : "Adicionar"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
