import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LETTER_MOOD_MAP, type Letter } from "@/types";

interface LetterCardProps {
  letter: Letter;
  onOpen: () => void;
  index?: number;
}

const TONE_BG: Record<string, string> = {
  coral: "bg-ambient-rose",
  rose:  "bg-ambient-rose",
  plum:  "bg-ambient-plum",
  gold:  "bg-ambient-gold",
  teal:  "bg-ambient-teal",
};

const TONE_ACCENT: Record<string, string> = {
  coral: "from-[oklch(0.78_0.16_22)]/40 to-[oklch(0.68_0.22_340)]/30",
  rose:  "from-[oklch(0.78_0.16_22)]/40 to-[oklch(0.68_0.22_340)]/30",
  plum:  "from-[oklch(0.55_0.22_300)]/40 to-[oklch(0.68_0.22_340)]/30",
  gold:  "from-[oklch(0.80_0.15_80)]/40 to-[oklch(0.78_0.16_22)]/30",
  teal:  "from-[oklch(0.70_0.13_195)]/40 to-[oklch(0.55_0.18_250)]/30",
};

export function LetterCard({ letter, onOpen, index = 0 }: LetterCardProps) {
  const mood = LETTER_MOOD_MAP[letter.mood];
  const toneBg = TONE_BG[mood.tone] ?? "bg-ambient-rose";
  const toneAccent = TONE_ACCENT[mood.tone] ?? TONE_ACCENT.coral;

  const preview = letter.body
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.25) }}
      whileHover={{ y: -4 }}
      onClick={onOpen}
      className="group relative block w-full overflow-hidden rounded-3xl text-left"
    >
      {/* Envelope shell */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-lg shadow-black/20 transition-shadow duration-300 group-hover:shadow-2xl group-hover:shadow-black/40">
        {/* Ambient */}
        <div className={cn("pointer-events-none absolute inset-0 opacity-80", toneBg)} />

        {/* Wax seal / flap accent */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br blur-3xl opacity-60"
             style={{ backgroundImage: "linear-gradient(to bottom right, oklch(0.78 0.16 22 / 0.6), oklch(0.68 0.22 340 / 0.4))" }} />

        <div className="relative p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] ring-1 ring-white/10 backdrop-blur-sm",
              toneAccent,
              "text-white/95"
            )}>
              <span>{mood.emoji}</span>
              {mood.label}
            </span>
            <span className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">
              {format(parseISO(letter.created_at), "dd MMM yyyy", { locale: ptBR })}
            </span>
          </div>

          <h3 className="mt-4 font-serif text-[22px] font-medium leading-tight tracking-tight sm:text-2xl line-clamp-2">
            {letter.title}
          </h3>

          {(letter.author || letter.recipient) && (
            <p className="mt-1.5 text-[11.5px] text-muted-foreground">
              {letter.recipient && <span>Para <strong className="font-semibold text-foreground/90">{letter.recipient}</strong></span>}
              {letter.recipient && letter.author && <span className="mx-1">·</span>}
              {letter.author && <span>De <strong className="font-semibold text-foreground/90">{letter.author}</strong></span>}
            </p>
          )}

          {preview && (
            <p className="mt-4 line-clamp-4 font-serif text-[14px] italic leading-relaxed text-foreground/75">
              “{preview}{letter.body.length > preview.length ? "…" : ""}”
            </p>
          )}

          <div className="mt-5 flex items-center justify-between text-[11px] font-medium text-muted-foreground/80">
            <span className="inline-flex items-center gap-1 uppercase tracking-[0.14em]">
              Abrir carta
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
