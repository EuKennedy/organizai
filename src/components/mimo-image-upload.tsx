import { useRef, useState, useEffect, useCallback } from "react";
import { Camera, ImagePlus, Loader2, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { uploadMimoImage, deleteMimoImage } from "@/lib/image-upload";
import { cn } from "@/lib/utils";

interface MimoImageUploadProps {
  value: string | null;
  /** Called after successful upload with the new public URL, or null on remove. */
  onChange: (url: string | null) => void;
  /** When true, pasted/dropped images are also accepted globally on the parent modal. */
  enableGlobalPaste?: boolean;
}

/**
 * Mobile-first image input. Tap → native picker (gallery/camera).
 * Desktop also supports drag-and-drop + Ctrl+V paste from clipboard.
 */
export function MimoImageUpload({ value, onChange, enableGlobalPaste = true }: MimoImageUploadProps) {
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
        // If replacing an existing photo, remove the old one (best-effort).
        const previous = value;
        const url = await uploadMimoImage(file, user.id);
        onChange(url);
        if (previous) deleteMimoImage(previous).catch(() => void 0);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao enviar imagem");
      } finally {
        setUploading(false);
      }
    },
    [user, value, onChange]
  );

  const onPick = () => inputRef.current?.click();

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onRemove = async () => {
    const prev = value;
    onChange(null);
    if (prev) deleteMimoImage(prev).catch(() => void 0);
  };

  // Desktop drag-and-drop
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };
  const onDragLeave = () => setDragActive(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // Desktop paste (Ctrl+V / Cmd+V) from clipboard anywhere while modal is open
  useEffect(() => {
    if (!enableGlobalPaste) return;
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            handleFile(file);
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
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "relative h-48 overflow-hidden rounded-t-2xl sm:h-56",
        dragActive && "ring-2 ring-primary ring-offset-2 ring-offset-card"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onInputChange}
      />

      {value ? (
        <>
          <img src={value} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/10 to-transparent" />

          {/* Overlay actions */}
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button
              type="button"
              onClick={onPick}
              disabled={uploading}
              className="flex h-9 items-center gap-1.5 rounded-full bg-black/60 px-3 text-xs font-medium text-white backdrop-blur-md transition hover:bg-black/80 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
              Trocar
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={uploading}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-red-500/80 disabled:opacity-50"
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
          className="group flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-pink-500/25 via-purple-500/25 to-rose-500/25 transition hover:from-pink-500/40 hover:via-purple-500/40 hover:to-rose-500/40"
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-pink-200" />
              <p className="text-xs text-white/80">Enviando...</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-pink-200">
                <Camera className="h-6 w-6" />
                <Sparkles className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium text-white/90">Adicionar foto</p>
              <p className="text-[10px] text-white/60">
                <span className="sm:hidden">Tire ou escolha da galeria</span>
                <span className="hidden sm:inline">Clique, arraste aqui ou cole (Ctrl+V)</span>
              </p>
            </>
          )}
        </button>
      )}
    </div>
  );
}
