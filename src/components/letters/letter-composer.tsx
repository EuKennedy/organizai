import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Trash2, Lock, Unlock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { btnPrimary, chip, chipActive, chipIdle } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { LETTER_MOODS, type Letter, type LetterMood } from "@/types";

interface LetterComposerProps {
  open: boolean;
  letter: Letter | null;
  onClose: () => void;
  onSave: (input: {
    id?: string;
    title: string;
    body: string;
    author: string | null;
    recipient: string | null;
    mood: LetterMood;
    unlock_at: string | null;
  }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function LetterComposer({
  open,
  letter,
  onClose,
  onSave,
  onDelete,
}: LetterComposerProps) {
  const isEdit = !!letter;
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [recipient, setRecipient] = useState("");
  const [mood, setMood] = useState<LetterMood>("amor");
  const [unlockEnabled, setUnlockEnabled] = useState(false);
  const [unlockDate, setUnlockDate] = useState(""); // YYYY-MM-DD
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (letter) {
      setTitle(letter.title);
      setBody(letter.body);
      setAuthor(letter.author ?? "");
      setRecipient(letter.recipient ?? "");
      setMood(letter.mood);
      if (letter.unlock_at) {
        setUnlockEnabled(true);
        setUnlockDate(new Date(letter.unlock_at).toISOString().slice(0, 10));
      } else {
        setUnlockEnabled(false);
        setUnlockDate("");
      }
    } else {
      setTitle("");
      setBody("");
      setAuthor("");
      setRecipient("");
      setMood("amor");
      setUnlockEnabled(false);
      setUnlockDate("");
    }
    // autofocus after mount
    setTimeout(() => titleRef.current?.focus(), 120);
  }, [open, letter]);

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) return;
    let unlockIso: string | null = null;
    if (unlockEnabled && unlockDate) {
      // Set to 09:00 local on that day so it unlocks "in the morning"
      const d = new Date(`${unlockDate}T09:00:00`);
      if (!Number.isNaN(d.getTime())) unlockIso = d.toISOString();
    }
    setSaving(true);
    try {
      await onSave({
        id: letter?.id,
        title: title.trim(),
        body,
        author: author.trim() || null,
        recipient: recipient.trim() || null,
        mood,
        unlock_at: unlockIso,
      });
      onClose();
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
            className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-lg"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed inset-x-3 top-[2%] z-[60] mx-auto flex max-h-[96dvh] max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl sm:inset-x-auto sm:top-[4%]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-card/80 px-5 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {isEdit ? "Editando" : "Nova carta"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {isEdit && onDelete && letter && (
                  <button
                    onClick={async () => {
                      await onDelete(letter.id);
                      onClose();
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-red-500/10 hover:text-red-500"
                    aria-label="Excluir carta"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
              {/* Mood chips */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Sentimento
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {LETTER_MOODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMood(m.value)}
                      className={cn(chip, mood === m.value ? chipActive : chipIdle)}
                    >
                      <span>{m.emoji}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Título
                </Label>
                <Input
                  ref={titleRef}
                  placeholder='Ex: "Pra você, que iluminou minha semana"'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 text-[15px]"
                  maxLength={120}
                />
              </div>

              {/* Recipient / Author */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Para
                  </Label>
                  <Input
                    placeholder="Ex: Meu amor"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    maxLength={40}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    De
                  </Label>
                  <Input
                    placeholder="Ex: Eu"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    maxLength={40}
                  />
                </div>
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Carta
                </Label>
                <Textarea
                  placeholder="Comece a escrever…"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="min-h-[280px] resize-y font-serif text-[15px] leading-relaxed"
                />
                <p className="text-[10.5px] text-muted-foreground tabular">
                  {body.length} {body.length === 1 ? "caractere" : "caracteres"}
                </p>
              </div>

              {/* Seal — abrir somente em data X */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setUnlockEnabled((v) => !v)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border px-4 py-3 transition-all",
                    unlockEnabled
                      ? "border-primary/50 bg-primary/[0.05]"
                      : "border-border bg-card/40 hover:bg-card/70"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-2xl ring-1",
                        unlockEnabled
                          ? "bg-primary/15 ring-primary/30"
                          : "bg-muted/40 ring-border"
                      )}
                    >
                      {unlockEnabled ? (
                        <Lock className="h-4 w-4 text-primary" />
                      ) : (
                        <Unlock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-semibold tracking-tight">
                        Cartinha selada pro futuro
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {unlockEnabled
                          ? "Vocês só vão poder ler a partir da data escolhida"
                          : "Liberada na hora — qualquer um pode ler já"}
                      </p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "relative h-6 w-10 shrink-0 rounded-full transition-colors",
                      unlockEnabled ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                        unlockEnabled ? "left-[18px]" : "left-0.5"
                      )}
                    />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {unlockEnabled && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1.5 pt-1">
                        <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Abre em
                        </Label>
                        <Input
                          type="date"
                          value={unlockDate}
                          min={new Date(Date.now() + 24 * 3600 * 1000)
                            .toISOString()
                            .slice(0, 10)}
                          onChange={(e) => setUnlockDate(e.target.value)}
                          className="h-10 tabular"
                        />
                        <p className="text-[10.5px] text-muted-foreground">
                          Vai destravar às 9h da manhã do dia escolhido.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-border bg-card/80 px-5 py-3 backdrop-blur-sm">
              <button
                onClick={onClose}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim() || !body.trim() || saving}
                className={cn(btnPrimary)}
              >
                <Save className="h-4 w-4" />
                {saving ? "Salvando…" : isEdit ? "Salvar" : "Guardar carta"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
