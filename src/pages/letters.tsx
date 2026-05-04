import { useMemo, useState } from "react";
import { Plus, Mail, X as XIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLetters } from "@/hooks/use-letters";
import { PageHero } from "@/components/page-hero";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { LetterCard } from "@/components/letters/letter-card";
import { LetterComposer } from "@/components/letters/letter-composer";
import { LetterReader } from "@/components/letters/letter-reader";
import { btnPrimary, btnPrimarySm, chip, chipActive, chipIdle } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { LETTER_MOODS, type Letter, type LetterMood } from "@/types";

type Mode = "reader" | "composer" | null;

export function LettersPage() {
  const { letters, loading, createLetter, updateLetter, deleteLetter } = useLetters();
  const [selected, setSelected] = useState<Letter | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [moodFilter, setMoodFilter] = useState<LetterMood | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    let r = letters;
    if (moodFilter) r = r.filter((l) => l.mood === moodFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      r = r.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.body.toLowerCase().includes(q) ||
          (l.author ?? "").toLowerCase().includes(q) ||
          (l.recipient ?? "").toLowerCase().includes(q)
      );
    }
    return r;
  }, [letters, moodFilter, searchQuery]);

  const openReader = (l: Letter) => {
    setSelected(l);
    setMode("reader");
  };

  const openCompose = (l: Letter | null = null) => {
    setSelected(l);
    setMode("composer");
  };

  const closeAll = () => {
    setMode(null);
    setSelected(null);
  };

  const handleSave = async (input: {
    id?: string;
    title: string;
    body: string;
    author: string | null;
    recipient: string | null;
    mood: LetterMood;
    unlock_at: string | null;
  }) => {
    try {
      if (input.id) {
        await updateLetter(input.id, {
          title: input.title,
          body: input.body,
          author: input.author,
          recipient: input.recipient,
          mood: input.mood,
          unlock_at: input.unlock_at,
        });
        toast.success("Carta atualizada");
      } else {
        await createLetter(input);
        toast.success(input.unlock_at ? "Cartinha selada 🔒" : "Carta guardada");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLetter(id);
      toast.success("Carta removida");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover");
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Palavras guardadas"
        title={
          <>
            Nossos <span className="font-serif italic text-primary">textos</span>
          </>
        }
        subtitle={
          letters.length === 0
            ? "Cartinhas, desabafos e declarações — tudo em um só lugar."
            : `${letters.length} ${letters.length === 1 ? "carta escrita" : "cartas escritas"}`
        }
        ambient="plum"
        action={
          <button onClick={() => openCompose(null)} className={btnPrimarySm}>
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Escrever</span>
          </button>
        }
      />

      {/* Search */}
      {letters.length > 0 && (
        <div className="mb-4 relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Buscar título, conteúdo, autor…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Limpar busca"
            >
              <XIcon className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Mood filter */}
      {letters.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setMoodFilter(null)}
            className={cn(chip, !moodFilter ? chipActive : chipIdle)}
          >
            Todas
          </button>
          {LETTER_MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMoodFilter(m.value === moodFilter ? null : m.value)}
              className={cn(chip, moodFilter === m.value ? chipActive : chipIdle)}
            >
              <span>{m.emoji}</span>
              {m.label}
            </button>
          ))}
          {moodFilter && (
            <button
              onClick={() => setMoodFilter(null)}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <XIcon className="h-3 w-3" />
              Limpar
            </button>
          )}
        </div>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-3xl" />
          ))}
        </div>
      )}

      {!loading && letters.length === 0 && (
        <EmptyState
          icon={Mail}
          title="Nenhuma carta ainda"
          description="Escreva a primeira: uma declaração, uma saudade, um desabafo. Fica guardado só pra vocês."
          tone="plum"
          action={
            <button onClick={() => openCompose(null)} className={btnPrimary}>
              <Plus className="h-4 w-4" />
              Escrever primeira carta
            </button>
          }
        />
      )}

      {!loading && letters.length > 0 && filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma carta com esse sentimento.
          </p>
          <button
            onClick={() => setMoodFilter(null)}
            className="mt-3 text-xs font-medium text-primary hover:underline"
          >
            Ver todas
          </button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          {filtered.map((letter, i) => (
            <LetterCard
              key={letter.id}
              letter={letter}
              onOpen={() => openReader(letter)}
              index={i}
            />
          ))}
        </div>
      )}

      <LetterReader
        letter={mode === "reader" ? selected : null}
        onClose={closeAll}
        onEdit={() => setMode("composer")}
        onDelete={async () => {
          if (!selected) return;
          if (!confirm("Excluir essa carta?")) return;
          await handleDelete(selected.id);
          closeAll();
        }}
      />

      <LetterComposer
        open={mode === "composer"}
        letter={mode === "composer" ? selected : null}
        onClose={closeAll}
        onSave={handleSave}
        onDelete={async (id) => {
          if (!confirm("Excluir essa carta?")) return;
          await handleDelete(id);
        }}
      />
    </>
  );
}
