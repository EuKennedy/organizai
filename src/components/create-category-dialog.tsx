import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { MimoCategoryDef } from "@/types";

interface CreateCategoryDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (label: string, emoji: string) => Promise<MimoCategoryDef>;
}

const EMOJI_SUGGESTIONS = [
  "💄", "✨", "💅", "👄", "🧴", "🌺", "🌷", "🎀", "💎", "👑",
  "🫧", "🪞", "💆", "👁️", "💋", "🌸", "🧼", "🧖", "🩰", "💝",
];

export function CreateCategoryDialog({ open, onClose, onCreate }: CreateCategoryDialogProps) {
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLabel("");
      setEmoji("✨");
      setError(null);
    }
  }, [open]);

  const handleCreate = async () => {
    if (!label.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await onCreate(label, emoji);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar categoria");
    } finally {
      setCreating(false);
    }
  };

  // Take the first visible glyph from input (handles multi-codepoint emojis)
  const handleEmojiInput = (value: string) => {
    if (!value) {
      setEmoji("");
      return;
    }
    try {
      const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
      const first = seg.segment(value)[Symbol.iterator]().next().value;
      setEmoji((first?.segment ?? value).toString().slice(0, 8));
    } catch {
      setEmoji(Array.from(value)[0] ?? "");
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
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", damping: 25, stiffness: 320 }}
            className="fixed inset-x-4 top-1/2 z-[60] mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-border bg-card shadow-2xl sm:inset-x-auto"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold">Nova categoria</h3>
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Nome da categoria
                </Label>
                <Input
                  autoFocus
                  placeholder="Ex: Perfumes, Cabelo, Unhas..."
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                  }}
                  maxLength={32}
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Emoji
                </Label>
                <div className="flex items-center gap-2">
                  <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl border-2 border-primary/30 bg-primary/5 text-2xl">
                    {emoji || "✨"}
                  </div>
                  <Input
                    placeholder="✨"
                    value={emoji}
                    onChange={(e) => handleEmojiInput(e.target.value)}
                    className="h-10 text-lg"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {EMOJI_SUGGESTIONS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setEmoji(em)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg text-lg transition",
                        emoji === em
                          ? "bg-primary/20 ring-1 ring-primary/40"
                          : "bg-muted/40 hover:bg-muted"
                      )}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!label.trim() || creating}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition disabled:opacity-50"
                >
                  {creating ? "Criando..." : "Criar"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
