import { useEffect, useState } from "react";
import {
  X,
  Trash2,
  ExternalLink,
  Plus,
  Check,
  AlertTriangle,
  ShoppingBag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WishlistImageUpload } from "@/components/wishlist/wishlist-image-upload";
import { CreateCategoryDialog } from "@/components/create-category-dialog";
import { btnPrimary, chip, chipActive, chipIdle } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/hooks/use-wishlist";
import type {
  WishlistItem,
  WishlistCategory,
  WishlistCategoryDef,
  WishlistPriority,
  WishlistStatus,
} from "@/types";

interface Props {
  item: WishlistItem | null;
  isNew?: boolean;
  defaultCategory?: WishlistCategory | null;
  onClose: () => void;
  onSave: (
    data: Partial<WishlistItem> & { category: WishlistCategory; name: string }
  ) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const PRIORITIES: { value: WishlistPriority; label: string; emoji: string; color: string }[] = [
  { value: "baixa", label: "Baixa", emoji: "🌱", color: "text-zinc-400" },
  { value: "media", label: "Média", emoji: "✨", color: "text-primary" },
  { value: "alta", label: "Alta", emoji: "🔥", color: "text-rose-500" },
];

const STATUSES: { value: WishlistStatus; label: string; icon: React.ReactNode; color: string }[] = [
  {
    value: "querendo",
    label: "Querendo",
    icon: <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2.25} />,
    color: "text-primary",
  },
  {
    value: "comprado",
    label: "Comprado",
    icon: <Check className="h-3.5 w-3.5" strokeWidth={3} />,
    color: "text-emerald-500",
  },
  {
    value: "desistido",
    label: "Desisti",
    icon: <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.5} />,
    color: "text-zinc-400",
  },
];

export function WishlistDetailModal({
  item,
  isNew = false,
  defaultCategory = null,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const { categories, getCategory, createCategory } = useWishlist();

  const [category, setCategory] = useState<WishlistCategory>(
    item?.category ?? defaultCategory ?? "outros"
  );
  const [name, setName] = useState(item?.name ?? "");
  const [brand, setBrand] = useState(item?.brand ?? "");
  const [link, setLink] = useState(item?.link ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(item?.image_url ?? null);
  const [price, setPrice] = useState(item?.price?.toString() ?? "");
  const [priority, setPriority] = useState<WishlistPriority>(item?.priority ?? "media");
  const [status, setStatus] = useState<WishlistStatus>(item?.status ?? "querendo");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    if (item) {
      setCategory(item.category);
      setName(item.name);
      setBrand(item.brand ?? "");
      setLink(item.link ?? "");
      setImageUrl(item.image_url ?? null);
      setPrice(item.price?.toString() ?? "");
      setPriority(item.priority);
      setStatus(item.status);
      setNotes(item.notes ?? "");
    } else if (defaultCategory) {
      setCategory(defaultCategory);
      setName("");
      setBrand("");
      setLink("");
      setImageUrl(null);
      setPrice("");
      setPriority("media");
      setStatus("querendo");
      setNotes("");
    }
  }, [item, defaultCategory]);

  const meta = getCategory(category);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const parsedPrice = price.trim() ? parseFloat(price.replace(",", ".")) : null;
      await onSave({
        category,
        name: name.trim(),
        brand: brand.trim() || null,
        link: link.trim() || null,
        image_url: imageUrl,
        price: parsedPrice && !isNaN(parsedPrice) ? parsedPrice : null,
        priority,
        status,
        notes: notes.trim() || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async (
    label: string,
    emoji: string
  ): Promise<WishlistCategoryDef> => {
    const created = await createCategory(label, emoji);
    setCategory(created.value);
    return created;
  };

  return (
    <AnimatePresence>
      {(item || isNew) && (
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
            <div className="relative">
              <WishlistImageUpload value={imageUrl} onChange={setImageUrl} />

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

            <div className="space-y-5 p-5 sm:p-6">
              {/* Name + Brand */}
              <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    O que é
                  </Label>
                  <Input
                    placeholder='Ex: "Mesa de jantar 6 lugares"'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus={isNew}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Marca/Loja
                  </Label>
                  <Input
                    placeholder="Ex: Tok&Stok"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Preço (R$)
                </Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="h-10 tabular"
                />
              </div>

              {/* Categoria */}
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
                  >
                    <Plus className="h-3 w-3" />
                    Nova
                  </button>
                </div>
              </div>

              {/* Prioridade */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Prioridade
                </Label>
                <div className="grid grid-cols-3 gap-1 rounded-full bg-muted/50 p-1">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={cn(
                        "relative inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all",
                        priority === p.value
                          ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>{p.emoji}</span>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Status
                </Label>
                <div className="grid grid-cols-3 gap-1 rounded-full bg-muted/50 p-1">
                  {STATUSES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setStatus(s.value)}
                      className={cn(
                        "relative inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all",
                        status === s.value
                          ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className={status === s.value ? s.color : ""}>{s.icon}</span>
                      {s.label}
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
                  placeholder="Cor, tamanho, motivo de querer…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[72px] resize-none text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
                {!isNew && onDelete && item && (
                  <button
                    onClick={async () => {
                      await onDelete(item.id);
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
