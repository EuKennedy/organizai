import { useEffect, useMemo, useState } from "react";
import { Plus, Images, ArrowUpDown, Check } from "lucide-react";
import { Reorder } from "framer-motion";
import { toast } from "sonner";
import { useGallery } from "@/hooks/use-gallery";
import { PageHero } from "@/components/page-hero";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AlbumCard } from "@/components/gallery/album-card";
import { AlbumReorderRow } from "@/components/gallery/album-reorder-row";
import { CreateAlbumDialog } from "@/components/gallery/create-album-dialog";
import { btnPrimary, btnPrimarySm, btnSecondarySm } from "@/lib/ui";
import { cn } from "@/lib/utils";
import type { GalleryAlbum } from "@/types";

export function GalleryPage() {
  const {
    albums,
    photosByAlbum,
    coverFor,
    loading,
    createAlbum,
    reorderAlbums,
  } = useGallery();

  const [createOpen, setCreateOpen] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [localOrder, setLocalOrder] = useState<GalleryAlbum[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  // Sync local order when leaving/entering reorder mode or when data changes
  // (but not during a drag, to avoid fighting the user).
  useEffect(() => {
    if (!draggingId) {
      setLocalOrder(albums);
    }
  }, [albums, draggingId]);

  const totalPhotos = useMemo(
    () =>
      Object.values(photosByAlbum).reduce((acc, list) => acc + list.length, 0),
    [photosByAlbum]
  );

  const handleCreate = async (input: {
    name: string;
    description: string | null;
    layout: "masonry" | "mosaic" | "collage" | "grid";
  }) => {
    try {
      await createAlbum(input);
      toast.success("Mural criado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar");
      throw err;
    }
  };

  const handleDoneReorder = async () => {
    const ids = localOrder.map((a) => a.id);
    const currentIds = albums.map((a) => a.id);
    const changed =
      ids.length !== currentIds.length ||
      ids.some((id, i) => id !== currentIds[i]);

    if (changed) {
      setSavingOrder(true);
      try {
        await reorderAlbums(ids);
        toast.success("Ordem salva");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao salvar ordem");
      } finally {
        setSavingOrder(false);
      }
    }
    setReorderMode(false);
  };

  const moveBy = (id: string, delta: number) => {
    setLocalOrder((prev) => {
      const idx = prev.findIndex((a) => a.id === id);
      if (idx < 0) return prev;
      const target = idx + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = prev.slice();
      const item = next[idx];
      if (!item) return prev;
      next.splice(idx, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const heroBackdrop = useMemo(() => {
    for (const a of albums) {
      const c = coverFor(a);
      if (c) return c.public_url;
    }
    return null;
  }, [albums, coverFor]);

  return (
    <>
      <PageHero
        eyebrow="Memórias juntos"
        title={
          <>
            Nossa <span className="font-serif italic text-primary">Galeria</span>
          </>
        }
        subtitle={
          albums.length === 0
            ? "Crie murais das fotos mais bonitas da nossa história."
            : `${albums.length} ${albums.length === 1 ? "mural" : "murais"} · ${totalPhotos} ${totalPhotos === 1 ? "foto" : "fotos"}`
        }
        ambient="rose"
        backdropUrl={heroBackdrop}
        secondaryAction={
          albums.length > 1 ? (
            reorderMode ? (
              <button
                onClick={handleDoneReorder}
                disabled={savingOrder}
                className={cn(btnPrimarySm, "disabled:opacity-60")}
              >
                <Check className="h-3.5 w-3.5" />
                {savingOrder ? "Salvando…" : "Concluir"}
              </button>
            ) : (
              <button
                onClick={() => setReorderMode(true)}
                className={btnSecondarySm}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reordenar</span>
              </button>
            )
          ) : null
        }
        action={
          !reorderMode ? (
            <button onClick={() => setCreateOpen(true)} className={btnPrimarySm}>
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Novo mural</span>
            </button>
          ) : null
        }
      />

      {loading && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] w-full rounded-3xl" />
          ))}
        </div>
      )}

      {!loading && albums.length === 0 && (
        <EmptyState
          icon={Images}
          title="Ainda sem murais"
          description="Crie o primeiro e comece a guardar as fotos que contam a nossa história."
          tone="rose"
          action={
            <button onClick={() => setCreateOpen(true)} className={btnPrimary}>
              <Plus className="h-4 w-4" />
              Criar primeiro mural
            </button>
          }
        />
      )}

      {/* Reorder mode banner */}
      {!loading && albums.length > 1 && reorderMode && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold text-primary">
              Modo reordenar ativo
            </p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              Use as setas ▲▼ pra mover cada mural — ou arraste pela alça ⋮⋮.
            </p>
          </div>
          <button
            onClick={() => {
              setLocalOrder(albums);
              setReorderMode(false);
            }}
            className="shrink-0 rounded-full px-3 py-1.5 text-[11.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Normal grid */}
      {!loading && albums.length > 0 && !reorderMode && (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {albums.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              cover={coverFor(album)}
              photoCount={(photosByAlbum[album.id] ?? []).length}
            />
          ))}
        </div>
      )}

      {/* Reorder view — always single column list */}
      {!loading && albums.length > 1 && reorderMode && (
        <Reorder.Group
          axis="y"
          values={localOrder}
          onReorder={setLocalOrder}
          className="mx-auto flex max-w-2xl flex-col gap-2"
        >
          {localOrder.map((album, i) => (
            <Reorder.Item
              key={album.id}
              value={album}
              dragListener={true}
              onDragStart={() => setDraggingId(album.id)}
              onDragEnd={() => setDraggingId(null)}
              whileDrag={{ zIndex: 30 }}
              transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
              className="touch-none select-none"
            >
              <AlbumReorderRow
                album={album}
                cover={coverFor(album)}
                photoCount={(photosByAlbum[album.id] ?? []).length}
                position={i + 1}
                total={localOrder.length}
                dragging={draggingId === album.id}
                onMoveUp={() => moveBy(album.id, -1)}
                onMoveDown={() => moveBy(album.id, 1)}
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      <CreateAlbumDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </>
  );
}
