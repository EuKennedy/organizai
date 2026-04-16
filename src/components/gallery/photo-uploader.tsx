import { useEffect, useRef, useState, useCallback } from "react";
import { ImagePlus, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { btnPrimary } from "@/lib/ui";
import { cn } from "@/lib/utils";

interface PhotoUploaderProps {
  onFiles: (files: File[]) => Promise<void>;
  disabled?: boolean;
  enableGlobalPaste?: boolean;
  compact?: boolean;
}

/**
 * Drop zone + pick button for multiple photos.
 * Mobile tap → native gallery/câmera. Desktop adds drag-drop + paste.
 */
export function PhotoUploader({
  onFiles,
  disabled,
  enableGlobalPaste = true,
  compact = false,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const handle = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      const images = files.filter((f) => f.type.startsWith("image/"));
      if (images.length === 0) {
        toast.error("Somente imagens são aceitas");
        return;
      }
      setUploading(true);
      setProgress({ done: 0, total: images.length });
      try {
        // Wrap to catch progress signals if the hook exposes them later;
        // for now just await the batch. Progress pulse is handled in page.
        await onFiles(images);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro no upload");
      } finally {
        setUploading(false);
        setProgress(null);
      }
    },
    [onFiles]
  );

  const onPick = () => inputRef.current?.click();
  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    handle(files);
  };

  useEffect(() => {
    if (!enableGlobalPaste) return;
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        handle(files);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [enableGlobalPaste, handle]);

  if (compact) {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onInput}
        />
        <button
          type="button"
          onClick={onPick}
          disabled={disabled || uploading}
          className={cn(btnPrimary, "whitespace-nowrap")}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {progress ? `${progress.done}/${progress.total}` : "Enviando…"}
            </>
          ) : (
            <>
              <ImagePlus className="h-4 w-4" />
              <span className="hidden sm:inline">Adicionar fotos</span>
              <span className="sm:hidden">Fotos</span>
            </>
          )}
        </button>
      </>
    );
  }

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
        const files = Array.from(e.dataTransfer.files ?? []);
        handle(files);
      }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-dashed border-border bg-card/40 px-6 py-10 text-center transition-all",
        dragActive && "border-primary/60 bg-primary/5 ring-2 ring-primary/30"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onInput}
      />

      <div className="pointer-events-none absolute inset-0 bg-ambient-rose opacity-50" />

      <div className="relative flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/25">
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <UploadCloud className="h-6 w-6 text-primary" strokeWidth={1.5} />
          )}
        </div>
        <div>
          <p className="text-[15px] font-semibold">
            {uploading
              ? progress
                ? `Enviando ${progress.done}/${progress.total}…`
                : "Enviando…"
              : "Arraste as fotos aqui"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span className="hidden sm:inline">
              ou clique pra escolher · cole com ⌘V
            </span>
            <span className="sm:hidden">Toque para escolher da galeria</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onPick}
          disabled={disabled || uploading}
          className={cn(btnPrimary, "mt-2")}
        >
          <ImagePlus className="h-4 w-4" />
          Escolher fotos
        </button>
      </div>
    </div>
  );
}
