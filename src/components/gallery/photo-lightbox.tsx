import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { GalleryPhoto } from "@/types";

interface PhotoLightboxProps {
  photos: GalleryPhoto[];
  index: number;
  onClose: () => void;
  onChangeIndex: (next: number) => void;
}

export function PhotoLightbox({ photos, index, onClose, onChangeIndex }: PhotoLightboxProps) {
  const open = index >= 0 && index < photos.length;
  const photo = open ? photos[index] : null;

  const prev = useCallback(() => {
    if (index > 0) onChangeIndex(index - 1);
  }, [index, onChangeIndex]);

  const next = useCallback(() => {
    if (index < photos.length - 1) onChangeIndex(index + 1);
  }, [index, photos.length, onChangeIndex]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, prev, next]);

  return (
    <AnimatePresence>
      {open && photo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl"
          onClick={onClose}
        >
          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-4 top-[calc(env(safe-area-inset-top)+16px)] z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md ring-1 ring-white/20 transition-all hover:bg-white/20 hover:scale-105"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Counter */}
          <div className="absolute left-4 top-[calc(env(safe-area-inset-top)+16px)] z-10 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md ring-1 ring-white/20 tabular">
            {index + 1} / {photos.length}
          </div>

          {/* Prev */}
          {index > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="Anterior"
              className="absolute left-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md ring-1 ring-white/20 transition-all hover:bg-white/20 hover:scale-105 sm:flex"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {/* Next */}
          {index < photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="Próxima"
              className="absolute right-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md ring-1 ring-white/20 transition-all hover:bg-white/20 hover:scale-105 sm:flex"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Image */}
          <motion.img
            key={photo.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            src={photo.public_url}
            alt={photo.caption ?? ""}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[92vw] select-none rounded-2xl object-contain shadow-2xl"
          />

          {/* Caption */}
          {photo.caption && (
            <div className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+20px)] text-center">
              <p className="mx-auto max-w-xl rounded-full bg-white/10 px-4 py-2 text-[13px] font-medium text-white/90 backdrop-blur-md ring-1 ring-white/20">
                {photo.caption}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
