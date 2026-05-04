import { useRef, useState, useEffect, useCallback } from "react";
import { Camera, ImagePlus, Loader2, Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { uploadWishlistImage, deleteWishlistImage } from "@/lib/wishlist-upload";
import { cn } from "@/lib/utils";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  enableGlobalPaste?: boolean;
}

export function WishlistImageUpload({
  value,
  onChange,
  enableGlobalPaste = true,
}: Props) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!user) {
        toast.error("Sessão expirada");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Arquivo precisa ser uma imagem");
        return;
      }
      setUploading(true);
      try {
        const previous = value;
        const url = await uploadWishlistImage(file, user.id);
        onChange(url);
        if (previous) deleteWishlistImage(previous).catch(() => void 0);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao enviar");
      } finally {
        setUploading(false);
      }
    },
    [user, value, onChange]
  );

  const onPick = () => inputRef.current?.click();

  useEffect(() => {
    if (!enableGlobalPaste) return;
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) {
            e.preventDefault();
            handleFile(f);
            return;
          }
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [enableGlobalPaste, handleFile]);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
      }}
      className={cn(
        "relative h-52 overflow-hidden rounded-t-3xl sm:h-60",
        dragActive && "ring-2 ring-primary ring-offset-2 ring-offset-card"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {value ? (
        <>
          <img src={value} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card/85 via-card/10 to-transparent" />
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button
              type="button"
              onClick={onPick}
              disabled={uploading}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-black/55 px-3.5 text-xs font-semibold text-white backdrop-blur-md ring-1 ring-white/10 transition-all hover:bg-black/75 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5" />
              )}
              Trocar
            </button>
            <button
              type="button"
              onClick={async () => {
                const prev = value;
                onChange(null);
                if (prev) deleteWishlistImage(prev).catch(() => void 0);
              }}
              disabled={uploading}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md ring-1 ring-white/10 transition-all hover:bg-red-500/80 disabled:opacity-50"
              aria-label="Remover foto"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={onPick}
          disabled={uploading}
          className="group relative flex h-full w-full flex-col items-center justify-center overflow-hidden"
        >
          <div className="absolute inset-0 bg-ambient-rose" />
          <div className="absolute left-[10%] top-[18%] h-44 w-44 rounded-full bg-[oklch(0.78_0.16_22)] opacity-45 blur-3xl transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute right-[12%] bottom-[8%] h-36 w-36 rounded-full bg-[oklch(0.65_0.18_280)] opacity-40 blur-3xl transition-transform duration-700 group-hover:scale-110" />
          <div className="relative flex flex-col items-center gap-3">
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <p className="text-sm font-medium text-white/90">Enviando…</p>
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
                  <Camera className="h-6 w-6 text-white" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="flex items-center justify-center gap-1.5 text-[15px] font-semibold text-white">
                    Adicionar foto
                    <ShoppingBag className="h-3.5 w-3.5 text-white/70" />
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/70">
                    <span className="sm:hidden">Toque para escolher da galeria</span>
                    <span className="hidden sm:inline">Clique, arraste ou cole (⌘V)</span>
                  </p>
                </div>
              </>
            )}
          </div>
        </button>
      )}
    </div>
  );
}
