import { useEffect, useState } from "react";
import { X, Trash2, ExternalLink, Plus, Check, AlertTriangle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MimoImageUpload } from "@/components/mimo-image-upload";
import { CreateCategoryDialog } from "@/components/create-category-dialog";
import { btnPrimary, chip, chipActive, chipIdle } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { useMimoCategories } from "@/hooks/use-mimo-categories";
import type { Mimo, MimoCategory, MimoCategoryDef } from "@/types";

interface MimoDetailModalProps {
  mimo: Mimo | null;
  isNew?: boolean;
  defaultCategory?: MimoCategory | null;
  onClose: () => void;
  onSave: (data: Partial<Mimo> & { category: MimoCategory; name: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

type StatusValue = "wish" | "owned" | "finished";

function toStatus(m: { owned: boolean; finished: boolean }): StatusValue {
  if (m.finished && m.owned) return "finished";
  if (m.owned) return "owned";
  return "wish";
}

export function MimoDetailModal({
  mimo,
  isNew = false,
  defaultCategory = null,
  onClose,
  onSave,
  onDelete,
}: MimoDetailModalProps) {
  const { categories, getCategory, createCategory } = useMimoCategories();

  const [category, setCategory] = useState<MimoCategory>(
    mimo?.category ?? defaultCategory ?? "olhos"
  );
  const [brand, setBrand] = useState(mimo?.brand ?? "");
  const [name, setName] = useState(mimo?.name ?? "");
  const [link, setLink] = useState(mimo?.link ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(mimo?.image_url ?? null);
  const [status, setStatus] = useState<StatusValue>(
    mimo ? toStatus(mimo) : "wish"
  );
  const [notes, setNotes] = useState(mimo?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    if (mimo) {
      setCategory(mimo.category);
      setBrand(mimo.brand);
      setName(mimo.name);
      setLink(mimo.link ?? "");
      setImageUrl(mimo.image_url ?? null);
      setStatus(toStatus(mimo));
      setNotes(mimo.notes ?? "");
    } else if (defaultCategory) {
      setCategory(defaultCategory);
      setBrand("");
      setName("");
      setLink("");
      setImageUrl(null);
      setStatus("wish");
      setNotes("");
    }
  }, [mimo, defaultCategory]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        category,
        brand: brand.trim(),
        name: name.trim(),
        link: link.trim() || null,
        image_url: imageUrl,
        owned: status !== "wish",
        finished: status === "finished",
        notes: notes.trim() || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async (label: string, emoji: string): Promise<MimoCategoryDef> => {
    const created = await createCategory(label, emoji);
    setCategory(created.value);
    return created;
  };

  const meta = getCategory(category);

  const STATUS_OPTS: { value: StatusValue; label: string; icon: React.ReactNode; color: string }[] = [
    {
      value: "wish",
      label: "Desejo",
      icon: <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />,
      color: "text-pink-500",
    },
    {
      value: "owned",
      label: "Tenho",
      icon: <Check className="h-3.5 w-3.5" strokeWidth={3} />,
      color: "text-emerald-500",
    },
    {
      value: "finished",
      label: "Acabou",
      icon: <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.5} />,
      color: "text-amber-500",
    },
  ];

  return (
    <AnimatePresence>
      {(mimo || isNew) && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="fixed inset-x-3 top-[3%] z-50 mx-auto max-h-[94dvh] max-w-lg overflow-y-auto overscroll-contain rounded-3xl border border-border bg-card shadow-2xl sm:inset-x-auto sm:top-[5%] sm:max-h-[90dvh]"
          >
            {/* Hero / uploader */}
            <div className="relative">
              <MimoImageUpload value={imageUrl} onChange={setImageUrl} />

              <button
                onClick={onClose}
                aria-label="Fechar"
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white/90 backdrop-blur-md ring-1 ring-white/10 transition-all hover:bg-black/75 hover:scale-105"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="pointer-events-none absolute bottom-3 left-4 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur-md ring-1 ring-white/10">
                <span>{meta.emoji}</span>
                {meta.label}
              </div>
            </div>

            {/* Form */}
            <div className="space-y-5 p-5 sm:p-6">
              {/* Name + Brand */}
              <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Marca
                  </Label>
                  <Input
                    placeholder="Ruby Rose"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Nome do produto
                  </Label>
                  <Input
                    placeholder="Paleta de sombras Girl's Syndrome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus={isNew}
                    className="h-10"
                  />
                </div>
              </div>

              {/* Categoria chips + "+" */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Categoria
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map(({ value, label, emoji }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCategory(value)}
                      className={cn(chip, category === value ? chipActive : chipIdle)}
                    >
                      <span>{emoji}</span>
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCreatingCategory(true)}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:border-primary hover:bg-primary/10"
                    aria-label="Criar nova categoria"
                  >
                    <Plus className="h-3 w-3" />
                    Nova
                  </button>
                </div>
              </div>

              {/* Status — segmented iOS-style */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Status
                </Label>
                <div className="grid grid-cols-3 gap-1 rounded-full bg-muted/50 p-1">
                  {STATUS_OPTS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatus(opt.value)}
                      className={cn(
                        "relative inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all",
                        status === opt.value
                          ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className={status === opt.value ? opt.color : ""}>{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Link */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <ExternalLink className="h-3 w-3" />
                  Link de compra
                </Label>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="https://..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="h-10"
                  />
                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border transition-colors hover:bg-accent"
                      aria-label="Abrir link"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Anotações
                </Label>
                <Textarea
                  placeholder="Tom, tamanho, preferência..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[72px] resize-none text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
                {!isNew && onDelete && mimo && (
                  <button
                    onClick={async () => {
                      await onDelete(mimo.id);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs text-muted-foreground/70 transition-colors hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remover
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={!name.trim() || saving}
                  className={cn(btnPrimary, "ml-auto")}
                >
                  {saving ? "Salvando…" : isNew ? "Adicionar" : "Salvar"}
                </button>
              </div>
            </div>
          </motion.div>

          <CreateCategoryDialog
            open={creatingCategory}
            onClose={() => setCreatingCategory(false)}
            onCreate={handleCreateCategory}
          />
        </>
      )}
    </AnimatePresence>
  );
}
