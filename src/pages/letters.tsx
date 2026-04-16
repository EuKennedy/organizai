import { useMemo, useState } from "react";
import { Plus, Mail, X as XIcon } from "lucide-react";
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

  const filtered = useMemo(
    () => (moodFilter ? letters.filter((l) => l.mood === moodFilter) : letters),
    [letters, moodFilter]
  );

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
  }) => {
    try {
      if (input.id) {
        await updateLetter(input.id, {
          title: input.title,
          body: input.body,
          author: input.author,
          recipient: input.recipient,
          mood: input.mood,
        });
        toast.success("Carta atualizada");
      } else {
        await createLetter(input);
        toast.success("Carta guardada");
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
