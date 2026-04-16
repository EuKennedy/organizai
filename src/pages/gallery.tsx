import { useEffect, useMemo, useState } from "react";
import { Plus, Images, ArrowUpDown, Check } from "lucide-react";
import { Reorder } from "framer-motion";
import { toast } from "sonner";
import { useGallery } from "@/hooks/use-gallery";
import { PageHero } from "@/components/page-hero";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AlbumCard } from "@/components/gallery/album-card";
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

  // Sync local order whenever albums change and we're not mid-drag
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
      {!loading && albums.length > 0 && reorderMode && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-2.5">
          <p className="text-[12.5px] text-foreground/85">
            <span className="font-semibold text-primary">Modo reordenar ativo</span>
            <span className="hidden text-muted-foreground sm:inline">
              {" "}
              — arraste os murais para reorganizar.
            </span>
          </p>
          <button
            onClick={() => {
              setLocalOrder(albums);
              setReorderMode(false);
            }}
            className="text-[11.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancelar
          </button>
        </div>
      )}

      {!loading && albums.length > 0 && (
        <>
          {reorderMode ? (
            <Reorder.Group
              axis="y"
              values={localOrder}
              onReorder={setLocalOrder}
              className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6"
            >
              {localOrder.map((album) => (
                <Reorder.Item
                  key={album.id}
                  value={album}
                  onDragStart={() => setDraggingId(album.id)}
                  onDragEnd={() => setDraggingId(null)}
                  whileDrag={{ zIndex: 30 }}
                  transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                  className="touch-none select-none"
                >
                  <AlbumCard
                    album={album}
                    cover={coverFor(album)}
                    photoCount={(photosByAlbum[album.id] ?? []).length}
                    reorderMode
                    dragging={draggingId === album.id}
                  />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          ) : (
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
        </>
      )}

      <CreateAlbumDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </>
  );
}
