import { supabase } from "@/lib/supabase";

const BUCKET = "gallery-photos";
const MAX_DIMENSION = 1920; // longest edge (px)
const JPEG_QUALITY = 0.88;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export interface UploadedPhoto {
  storage_path: string;
  public_url: string;
  width: number;
  height: number;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/**
 * Compress + extract width/height. Returns a JPEG blob plus dimensions.
 */
async function compress(
  file: File
): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await loadImage(file);
  const w0 = img.width;
  const h0 = img.height;
  const ratio = Math.min(1, MAX_DIMENSION / Math.max(w0, h0));
  const width = Math.round(w0 * ratio);
  const height = Math.round(h0 * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não suportado");
  ctx.drawImage(img, 0, 0, width, height);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) throw new Error("Falha ao comprimir a imagem");
  return { blob, width, height };
}

/**
 * Upload a single photo under {userId}/{albumId}/{uuid}.jpg.
 */
export async function uploadGalleryPhoto(
  file: File,
  userId: string,
  albumId: string
): Promise<UploadedPhoto> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Arquivo precisa ser uma imagem");
  }

  const { blob, width, height } = await compress(file);
  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error("Imagem muito grande mesmo após compressão");
  }

  const path = `${userId}/${albumId}/${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    cacheControl: "31536000",
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { storage_path: path, public_url: data.publicUrl, width, height };
}

/** Best-effort delete. */
export async function deleteGalleryPhotoStorage(storagePath: string): Promise<void> {
  if (!storagePath) return;
  await supabase.storage.from(BUCKET).remove([storagePath]);
}
