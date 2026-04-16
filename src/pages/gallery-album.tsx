import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Images, Trash2, Check, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useGallery } from "@/hooks/use-gallery";
import {
  CollageLayout,
  GridLayout,
  MasonryLayout,
  MosaicLayout,
} from "@/components/gallery/photo-layouts";
import { PhotoLightbox } from "@/components/gallery/photo-lightbox";
import { PhotoUploader } from "@/components/gallery/photo-uploader";
import { CoverPickerDialog } from "@/components/gallery/cover-picker-dialog";
import { btnSecondarySm } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { GALLERY_LAYOUTS, type GalleryLayout } from "@/types";

export function GalleryAlbumPage() {
  const { id: albumId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    albums,
    photosByAlbum,
    loading,
    updateAlbum,
    addPhotos,
    deletePhoto,
    setCover,
    deleteAlbum,
  } = useGallery();

  const album = useMemo(
    () => albums.find((a) => a.id === albumId) ?? null,
    [albums, albumId]
  );
  const photos = useMemo(
    () => (albumId ? photosByAlbum[albumId] ?? [] : []),
    [photosByAlbum, albumId]
  );

  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);

  if (!loading && !album) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-muted-foreground">Mural não encontrado.</p>
        <button
          onClick={() => navigate("/gallery")}
          className="mt-3 text-xs font-medium text-primary hover:underline"
        >
          Voltar para galeria
        </button>
      </div>
    );
  }

  const layout: GalleryLayout = album?.layout ?? "masonry";

  const renderLayout = () => {
    const props = {
      photos,
      coverId: album?.cover_photo_id ?? null,
      onOpen: (i: number) => setLightboxIndex(i),
      onDelete: async (photoId: string) => {
        try {
          await deletePhoto(photoId);
          toast.success("Foto removida");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Erro ao remover");
        }
      },
      onSetCover: async (photoId: string) => {
        if (!album) return;
        const newCover = album.cover_photo_id === photoId ? null : photoId;
        try {
          await setCover(album.id, newCover as string);
          toast.success(newCover ? "Capa definida" : "Capa removida");
        } catch {
          toast.error("Erro ao definir capa");
        }
      },
    };
    switch (layout) {
      case "mosaic":
        return <MosaicLayout {...props} />;
      case "collage":
        return <CollageLayout {...props} />;
      case "grid":
        return <GridLayout {...props} />;
      default:
        return <MasonryLayout {...props} />;
    }
  };

  return (
    <>
      {/* Back */}
      <div className="-mt-2 mb-4 flex items-center justify-between gap-2">
        <button
          onClick={() => navigate("/gallery")}
          className={cn(btnSecondarySm)}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Galeria
        </button>
        {album && (
          <button
            onClick={async () => {
              if (!confirm("Excluir este mural e todas as fotos dele?")) return;
              try {
                await deleteAlbum(album.id);
                toast.success("Mural excluído");
                navigate("/gallery");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Erro");
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground/70 transition-colors hover:bg-red-500/10 hover:text-red-500"
          >
            <Trash2 className="h-3 w-3" />
            Excluir mural
          </button>
        )}
      </div>

      {/* Header */}
      {album && (
        <div className="relative mb-6 overflow-hidden rounded-3xl border border-border bg-card">
          <div className="pointer-events-none absolute inset-0 bg-ambient-rose opacity-80" />
          <div className="relative px-5 py-6 sm:px-7 sm:py-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/80">
              {format(parseISO(album.created_at), "dd 'de' MMMM, yyyy", {
                locale: ptBR,
              })}
            </p>
            <h1 className="mt-1.5 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              {album.name}
            </h1>
            {album.description && (
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                {album.description}
              </p>
            )}

            {/* Layout switcher */}
            <div className="mt-5 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Layout:
              </span>
              {GALLERY_LAYOUTS.map((opt) => {
                const active = layout === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={async () => {
                      if (active) return;
                      try {
                        await updateAlbum(album.id, { layout: opt.value });
                      } catch {
                        toast.error("Não foi possível trocar");
                      }
                    }}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                      active
                        ? "border-primary/40 bg-primary/12 text-primary ring-1 ring-primary/20"
                        : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {active && <Check className="h-3 w-3" strokeWidth={2.5} />}
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Cover picker */}
            {photos.length > 0 && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setCoverPickerOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1.5 text-[11.5px] font-medium text-foreground/85 backdrop-blur-sm transition-colors hover:bg-accent hover:text-foreground"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  {album.cover_photo_id ? "Trocar capa" : "Escolher capa"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload zone — compact when album has photos */}
      {album && photos.length > 0 && (
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {photos.length} {photos.length === 1 ? "foto" : "fotos"}
          </p>
          <PhotoUploader
            compact
            onFiles={async (files) => {
              try {
                const added = await addPhotos(album.id, files);
                if (added.length > 0) {
                  toast.success(
                    `${added.length} ${added.length === 1 ? "foto adicionada" : "fotos adicionadas"}`
                  );
                }
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Erro no upload");
              }
            }}
          />
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-2xl bg-muted/40"
            />
          ))}
        </div>
      )}

      {!loading && album && photos.length === 0 && (
        <div className="space-y-5">
          <PhotoUploader
            onFiles={async (files) => {
              try {
                const added = await addPhotos(album.id, files);
                if (added.length > 0) {
                  toast.success(
                    `${added.length} ${added.length === 1 ? "foto adicionada" : "fotos adicionadas"}`
                  );
                }
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Erro no upload");
              }
            }}
          />
          <div className="py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
              <Images className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
            <p className="mt-3 text-sm font-medium">Mural esperando a primeira foto</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Adicione fotos acima pra começar.
            </p>
          </div>
        </div>
      )}

      {!loading && album && photos.length > 0 && renderLayout()}

      <PhotoLightbox
        photos={photos}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(-1)}
        onChangeIndex={setLightboxIndex}
      />

      {album && (
        <CoverPickerDialog
          open={coverPickerOpen}
          photos={photos}
          currentCoverId={album.cover_photo_id}
          onClose={() => setCoverPickerOpen(false)}
          onChange={async (photoId) => {
            try {
              await updateAlbum(album.id, { cover_photo_id: photoId });
              toast.success(photoId ? "Capa atualizada" : "Capa automática");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Erro ao salvar capa");
            }
          }}
        />
      )}
    </>
  );
}
