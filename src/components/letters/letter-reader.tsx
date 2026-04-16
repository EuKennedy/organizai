import { motion, AnimatePresence } from "framer-motion";
import { X, Pencil, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LETTER_MOOD_MAP, type Letter } from "@/types";

interface LetterReaderProps {
  letter: Letter | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const TONE_BG: Record<string, string> = {
  coral: "bg-ambient-rose",
  plum:  "bg-ambient-plum",
  gold:  "bg-ambient-gold",
  teal:  "bg-ambient-teal",
};

export function LetterReader({ letter, onClose, onEdit, onDelete }: LetterReaderProps) {
  const mood = letter ? LETTER_MOOD_MAP[letter.mood] : null;
  const toneBg = mood ? TONE_BG[mood.tone] ?? "bg-ambient-rose" : "bg-ambient-rose";

  return (
    <AnimatePresence>
      {letter && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-lg"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed inset-x-3 top-[2%] z-[60] mx-auto flex max-h-[96dvh] max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl sm:inset-x-auto sm:top-[4%]"
          >
            {/* Ambient header strip */}
            <div className={cn("relative overflow-hidden", toneBg)}>
              <div className="pointer-events-none absolute -top-10 right-10 h-44 w-44 rounded-full bg-gradient-to-br from-[oklch(0.78_0.16_22)]/50 to-[oklch(0.68_0.22_340)]/40 blur-3xl opacity-70" />

              <div className="relative flex items-start justify-between gap-3 px-5 pb-5 pt-5 sm:px-6 sm:pt-6">
                <div className="min-w-0 flex-1">
                  {mood && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/95 ring-1 ring-white/15 backdrop-blur-md">
                      <span>{mood.emoji}</span>
                      {mood.label}
                    </span>
                  )}
                  <h2 className="mt-3 font-serif text-2xl font-medium leading-tight tracking-tight text-white drop-shadow-md sm:text-3xl">
                    {letter.title}
                  </h2>
                  <p className="mt-2 text-[11.5px] font-medium uppercase tracking-[0.14em] text-white/80">
                    {format(parseISO(letter.created_at), "dd 'de' MMMM, yyyy · HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={onEdit}
                    aria-label="Editar"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/90 backdrop-blur-md ring-1 ring-white/15 transition-all hover:bg-white/20 hover:scale-105"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={onDelete}
                    aria-label="Excluir"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/90 backdrop-blur-md ring-1 ring-white/15 transition-all hover:bg-red-500/60 hover:scale-105"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={onClose}
                    aria-label="Fechar"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/90 backdrop-blur-md ring-1 ring-white/15 transition-all hover:bg-white/20 hover:scale-105"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Letter body */}
            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-10 sm:py-8">
              <div className="mx-auto max-w-xl">
                {(letter.recipient || letter.author) && (
                  <div className="mb-6 text-sm text-muted-foreground">
                    {letter.recipient && (
                      <p className="font-serif italic">
                        Para <span className="font-semibold not-italic text-foreground">{letter.recipient}</span>,
                      </p>
                    )}
                  </div>
                )}

                <div className="whitespace-pre-wrap break-words font-serif text-[16px] leading-[1.7] text-foreground/90 sm:text-[17px] sm:leading-[1.75]">
                  {letter.body}
                </div>

                {letter.author && (
                  <p className="mt-10 text-right font-serif italic text-sm text-foreground/70">
                    — <span className="font-semibold not-italic text-foreground">{letter.author}</span>
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
