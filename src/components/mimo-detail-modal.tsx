import { useEffect, useState } from "react";
import { X, Trash2, ExternalLink, Check, AlertTriangle, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MimoImageUpload } from "@/components/mimo-image-upload";
import { CreateCategoryDialog } from "@/components/create-category-dialog";
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
  const [owned, setOwned] = useState(mimo?.owned ?? false);
  const [finished, setFinished] = useState(mimo?.finished ?? false);
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
      setOwned(mimo.owned);
      setFinished(mimo.finished);
      setNotes(mimo.notes ?? "");
    } else if (defaultCategory) {
      setCategory(defaultCategory);
      setBrand("");
      setName("");
      setLink("");
      setImageUrl(null);
      setOwned(false);
      setFinished(false);
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
        owned,
        finished: owned ? finished : false,
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

  return (
    <AnimatePresence>
      {(mimo || isNew) && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-3 top-[3%] z-50 mx-auto max-h-[94dvh] max-w-lg overflow-y-auto overscroll-contain rounded-2xl bg-card shadow-2xl sm:inset-x-auto sm:top-[5%] sm:max-h-[90dvh]"
          >
            {/* Hero / Image uploader */}
            <div className="relative">
              <MimoImageUpload value={imageUrl} onChange={setImageUrl} />

              <button
                onClick={onClose}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-sm transition hover:bg-black/70"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="pointer-events-none absolute bottom-3 left-4 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                <span>{meta.emoji}</span>
                {meta.label}
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4 p-4 sm:p-5">
              {/* Name + Brand */}
              <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Marca</Label>
                  <Input
                    placeholder="Ruby Rose"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nome do produto</Label>
                  <Input
                    placeholder="Paleta de sombras Girl's Syndrome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus={isNew}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Category chips + "+" button */}
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Categoria</Label>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map(({ value, label, emoji }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCategory(value)}
                      className={cn(
                        "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                        category === value
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <span>{emoji}</span>
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCreatingCategory(true)}
                    className="flex items-center gap-1 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-2.5 py-1.5 text-xs font-medium text-primary transition-all hover:border-primary hover:bg-primary/10"
                    aria-label="Criar nova categoria"
                  >
                    <Plus className="h-3 w-3" />
                    Nova
                  </button>
                </div>
              </div>

              {/* Status toggles */}
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOwned(!owned)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left transition-all",
                      owned
                        ? "border-green-500/50 bg-green-500/10"
                        : "border-transparent bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-md",
                      owned ? "bg-green-500 text-white" : "bg-muted border border-border"
                    )}>
                      {owned && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <p className={cn("text-xs font-semibold", owned ? "text-green-500" : "text-foreground")}>
                        Tenho
                      </p>
                      <p className="text-[10px] text-muted-foreground">Ja possuo</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => owned && setFinished(!finished)}
                    disabled={!owned}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left transition-all",
                      !owned && "cursor-not-allowed opacity-40",
                      finished && owned
                        ? "border-orange-500/50 bg-orange-500/10"
                        : "border-transparent bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-md",
                      finished && owned ? "bg-orange-500 text-white" : "bg-muted border border-border"
                    )}>
                      {finished && owned && <AlertTriangle className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <p className={cn("text-xs font-semibold", finished && owned ? "text-orange-500" : "text-foreground")}>
                        Acabou
                      </p>
                      <p className="text-[10px] text-muted-foreground">Precisa repor</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Link */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <ExternalLink className="h-3 w-3" />
                  Link de compra
                </Label>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="https://..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="h-9"
                  />
                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-accent"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Anotacoes (opcional)</Label>
                <Textarea
                  placeholder="Tom, tamanho, preferencia..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[60px] resize-none text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                {!isNew && onDelete && mimo && (
                  <button
                    onClick={async () => {
                      await onDelete(mimo.id);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-red-500/70 transition hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remover
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={!name.trim() || saving}
                  className="ml-auto rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition disabled:opacity-50"
                >
                  {saving ? "Salvando..." : isNew ? "Adicionar" : "Salvar"}
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
