import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import {
  uploadGalleryPhoto,
  deleteGalleryPhotoStorage,
} from "@/lib/gallery-upload";
import type {
  GalleryAlbum,
  GalleryPhoto,
  GalleryLayout,
} from "@/types";

export function useGallery() {
  const { user } = useAuth();
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [albumsRes, photosRes] = await Promise.all([
      supabase
        .from("gallery_albums")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("gallery_photos")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);
    setAlbums((albumsRes.data as GalleryAlbum[] | null) ?? []);
    setPhotos((photosRes.data as GalleryPhoto[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const photosByAlbum: Record<string, GalleryPhoto[]> = useMemo(() => {
    const map: Record<string, GalleryPhoto[]> = {};
    for (const p of photos) {
      (map[p.album_id] ??= []).push(p);
    }
    return map;
  }, [photos]);

  const coverFor = useCallback(
    (album: GalleryAlbum): GalleryPhoto | null => {
      const list = photosByAlbum[album.id] ?? [];
      if (album.cover_photo_id) {
        const pinned = list.find((p) => p.id === album.cover_photo_id);
        if (pinned) return pinned;
      }
      return list[0] ?? null;
    },
    [photosByAlbum]
  );

  const createAlbum = useCallback(
    async (input: {
      name: string;
      description?: string | null;
      layout?: GalleryLayout;
    }): Promise<GalleryAlbum> => {
      if (!user) throw new Error("Não autenticado");
      const payload = {
        user_id: user.id,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        layout: input.layout ?? "masonry",
      };
      const { data, error } = await supabase
        .from("gallery_albums")
        .insert(payload)
        .select()
        .single();
      if (error) throw new Error(error.message);
      const row = data as GalleryAlbum;
      setAlbums((prev) => [row, ...prev]);
      return row;
    },
    [user]
  );

  const updateAlbum = useCallback(
    async (id: string, updates: Partial<GalleryAlbum>) => {
      const { error } = await supabase
        .from("gallery_albums")
        .update(updates)
        .eq("id", id);
      if (error) throw new Error(error.message);
      setAlbums((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    },
    []
  );

  const deleteAlbum = useCallback(
    async (id: string) => {
      const albumPhotos = photosByAlbum[id] ?? [];
      const { error } = await supabase.from("gallery_albums").delete().eq("id", id);
      if (error) throw new Error(error.message);
      // storage cleanup best-effort
      await Promise.all(
        albumPhotos.map((p) => deleteGalleryPhotoStorage(p.storage_path))
      );
      setAlbums((prev) => prev.filter((a) => a.id !== id));
      setPhotos((prev) => prev.filter((p) => p.album_id !== id));
    },
    [photosByAlbum]
  );

  const addPhotos = useCallback(
    async (
      albumId: string,
      files: File[],
      onProgress?: (done: number, total: number) => void
    ): Promise<GalleryPhoto[]> => {
      if (!user) throw new Error("Não autenticado");
      const existing = photosByAlbum[albumId] ?? [];
      let nextOrder = existing.length;
      const inserted: GalleryPhoto[] = [];
      let done = 0;
      for (const file of files) {
        try {
          const { storage_path, public_url, width, height } = await uploadGalleryPhoto(
            file,
            user.id,
            albumId
          );
          const payload = {
            user_id: user.id,
            album_id: albumId,
            storage_path,
            public_url,
            width,
            height,
            caption: null,
            sort_order: nextOrder++,
          };
          const { data, error } = await supabase
            .from("gallery_photos")
            .insert(payload)
            .select()
            .single();
          if (error) throw new Error(error.message);
          inserted.push(data as GalleryPhoto);
        } catch (err) {
          console.error("upload failed", err);
        } finally {
          done++;
          onProgress?.(done, files.length);
        }
      }
      if (inserted.length > 0) {
        setPhotos((prev) => [...prev, ...inserted]);
      }
      return inserted;
    },
    [user, photosByAlbum]
  );

  const deletePhoto = useCallback(
    async (photoId: string) => {
      const photo = photos.find((p) => p.id === photoId);
      if (!photo) return;
      const { error } = await supabase.from("gallery_photos").delete().eq("id", photoId);
      if (error) throw new Error(error.message);
      await deleteGalleryPhotoStorage(photo.storage_path);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      // if this was the cover, clear cover_photo_id
      setAlbums((prev) =>
        prev.map((a) =>
          a.cover_photo_id === photoId ? { ...a, cover_photo_id: null } : a
        )
      );
      // DB: clear cover too
      await supabase
        .from("gallery_albums")
        .update({ cover_photo_id: null })
        .eq("cover_photo_id", photoId);
    },
    [photos]
  );

  const setCover = useCallback(
    async (albumId: string, photoId: string) => {
      await updateAlbum(albumId, { cover_photo_id: photoId });
    },
    [updateAlbum]
  );

  return {
    albums,
    photos,
    photosByAlbum,
    loading,
    coverFor,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    addPhotos,
    deletePhoto,
    setCover,
    refetch: fetchAll,
  };
}
