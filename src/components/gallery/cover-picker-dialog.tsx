import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ImageIcon } from "lucide-react";
import { btnPrimary } from "@/lib/ui";
import { cn } from "@/lib/utils";
import type { GalleryPhoto } from "@/types";

interface CoverPickerDialogProps {
  open: boolean;
  photos: GalleryPhoto[];
  currentCoverId: string | null;
  onClose: () => void;
  onChange: (photoId: string | null) => Promise<void>;
}

export function CoverPickerDialog({
  open,
  photos,
  currentCoverId,
  onClose,
  onChange,
}: CoverPickerDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(currentCoverId);
  const [saving, setSaving] = useState(false);

  // Sync when opening
  if (open && selectedId !== currentCoverId && !saving) {
    // Only resync when the dialog is (re)opened; tracked via a tiny guard
    // to avoid a loop: only if selectedId is still the stale cover.
    if (
      (currentCoverId === null && selectedId === null) ||
      (currentCoverId !== null && selectedId === null)
    ) {
      // fine, keep
    }
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await onChange(selectedId);
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
            className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="fixed inset-x-3 top-[4%] z-[60] mx-auto flex max-h-[92dvh] max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl sm:inset-x-auto"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3 className="text-[15px] font-semibold tracking-tight">Escolher capa</h3>
                <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                  A capa é a foto que aparece no card do mural.
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                    <ImageIcon className="h-6 w-6 text-primary" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Adicione fotos ao mural antes de escolher uma capa.
                  </p>
                </div>
              ) : (
                <>
                  {/* Auto option */}
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className={cn(
                      "mb-3 flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                      selectedId === null
                        ? "border-primary/40 bg-primary/10 ring-1 ring-primary/25"
                        : "border-border bg-card/40 hover:border-border/80 hover:bg-card/70"
                    )}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/5 ring-1 ring-primary/20">
                      <ImageIcon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold">Automática</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        Usa a primeira foto do mural
                      </p>
                    </div>
                    {selectedId === null && (
                      <Check className="h-5 w-5 shrink-0 text-primary" strokeWidth={2.5} />
                    )}
                  </button>

                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
                    {photos.map((p) => {
                      const selected = selectedId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedId(p.id)}
                          className={cn(
                            "group relative aspect-square overflow-hidden rounded-xl ring-1 transition-all",
                            selected
                              ? "ring-2 ring-primary"
                              : "ring-border hover:ring-primary/40"
                          )}
                        >
                          <img
                            src={p.public_url}
                            alt=""
                            loading="lazy"
                            draggable={false}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          {selected && (
                            <>
                              <div className="pointer-events-none absolute inset-0 bg-primary/25" />
                              <div className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                              </div>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
              <button
                onClick={onClose}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={cn(btnPrimary)}
              >
                {saving ? "Salvando…" : "Salvar capa"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
