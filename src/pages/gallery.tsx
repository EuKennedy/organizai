import { useMemo, useState } from "react";
import { Plus, Images } from "lucide-react";
import { toast } from "sonner";
import { useGallery } from "@/hooks/use-gallery";
import { PageHero } from "@/components/page-hero";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AlbumCard } from "@/components/gallery/album-card";
import { CreateAlbumDialog } from "@/components/gallery/create-album-dialog";
import { btnPrimary, btnPrimarySm } from "@/lib/ui";

export function GalleryPage() {
  const { albums, photosByAlbum, coverFor, loading, createAlbum } = useGallery();
  const [createOpen, setCreateOpen] = useState(false);

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
        action={
          <button onClick={() => setCreateOpen(true)} className={btnPrimarySm}>
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Novo mural</span>
          </button>
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

      {!loading && albums.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
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

      <CreateAlbumDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </>
  );
}
