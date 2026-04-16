import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { btnPrimary } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { GALLERY_LAYOUTS, type GalleryLayout } from "@/types";

interface CreateAlbumDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (input: {
    name: string;
    description: string | null;
    layout: GalleryLayout;
  }) => Promise<void>;
}

const LAYOUT_PREVIEW: Record<GalleryLayout, React.ReactNode> = {
  masonry: (
    <div className="flex gap-1">
      <div className="flex flex-col gap-1">
        <div className="h-5 w-4 rounded bg-current opacity-70" />
        <div className="h-3 w-4 rounded bg-current opacity-40" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="h-3 w-4 rounded bg-current opacity-50" />
        <div className="h-5 w-4 rounded bg-current opacity-70" />
      </div>
    </div>
  ),
  mosaic: (
    <div className="grid grid-cols-3 gap-1">
      <div className="row-span-2 h-full w-3 rounded bg-current opacity-70" />
      <div className="h-3 w-3 rounded bg-current opacity-50" />
      <div className="h-3 w-3 rounded bg-current opacity-50" />
      <div className="col-span-2 h-3 rounded bg-current opacity-60" />
    </div>
  ),
  collage: (
    <div className="relative h-9 w-12">
      <div className="absolute left-0 top-1 h-5 w-5 rotate-[-6deg] rounded bg-current opacity-70" />
      <div className="absolute left-4 top-0 h-5 w-5 rotate-[4deg] rounded bg-current opacity-60" />
      <div className="absolute left-8 top-2 h-5 w-5 rotate-[-3deg] rounded bg-current opacity-50" />
    </div>
  ),
  grid: (
    <div className="grid grid-cols-3 gap-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-3 w-3 rounded bg-current opacity-60" />
      ))}
    </div>
  ),
};

export function CreateAlbumDialog({
  open,
  onClose,
  onCreate,
}: CreateAlbumDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [layout, setLayout] = useState<GalleryLayout>("masonry");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setLayout("masonry");
      setError(null);
    }
  }, [open]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || null,
        layout,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar álbum");
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
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="fixed inset-x-4 top-[6%] z-[60] mx-auto max-h-[88dvh] max-w-md overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl sm:inset-x-auto"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="text-[15px] font-semibold tracking-tight">Novo mural</h3>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Nome do mural
                </Label>
                <Input
                  autoFocus
                  placeholder='Ex: "Praia, abril de 2026"'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) handleCreate();
                  }}
                  maxLength={60}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Descrição (opcional)
                </Label>
                <Textarea
                  placeholder="Um fim de semana inesquecível…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[72px] resize-none text-sm"
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Layout do mural
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {GALLERY_LAYOUTS.map((opt) => {
                    const selected = layout === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setLayout(opt.value)}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all",
                          selected
                            ? "border-primary/40 bg-primary/8 text-foreground ring-1 ring-primary/25"
                            : "border-border bg-card/40 text-muted-foreground hover:border-border/80 hover:bg-card/70 hover:text-foreground"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-10 w-12 shrink-0 items-center justify-center rounded-lg bg-background/60 ring-1 ring-border",
                            selected && "text-primary"
                          )}
                        >
                          {LAYOUT_PREVIEW[opt.value]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold">{opt.label}</p>
                          <p className="truncate text-[10.5px] text-muted-foreground">
                            {opt.description}
                          </p>
                        </div>
                        {selected && (
                          <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10.5px] text-muted-foreground">
                  O layout pode ser trocado a qualquer momento dentro do mural.
                </p>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-2 border-t border-border pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!name.trim() || saving}
                  className={cn(btnPrimary, "flex-1")}
                >
                  {saving ? "Criando…" : "Criar mural"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
