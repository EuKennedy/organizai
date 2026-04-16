import { supabase } from "@/lib/supabase";

const MIMOS_BUCKET = "mimos-photos";
const MAX_DIMENSION = 1400; // longest edge (px)
const JPEG_QUALITY = 0.85;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB safety ceiling (post-compression)

/** Read a File into an HTMLImageElement. */
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
 * Compress an image to JPEG with max longest-edge = MAX_DIMENSION.
 * Returns a Blob ready to upload.
 */
export async function compressImage(file: File): Promise<Blob> {
  // If it's already a small image, short-circuit.
  if (file.size < 400 * 1024 && /^image\/jpe?g$/i.test(file.type)) {
    return file;
  }

  const img = await loadImage(file);
  const { width: w0, height: h0 } = img;
  const ratio = Math.min(1, MAX_DIMENSION / Math.max(w0, h0));
  const width = Math.round(w0 * ratio);
  const height = Math.round(h0 * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não suportado neste navegador");
  ctx.drawImage(img, 0, 0, width, height);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) throw new Error("Falha ao comprimir a imagem");
  return blob;
}

/**
 * Upload a compressed image to the `mimos-photos` bucket under the current user's folder.
 * Returns the public URL (bucket is public).
 */
export async function uploadMimoImage(file: File, userId: string): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Arquivo não é uma imagem");
  }

  const blob = await compressImage(file);
  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error("Imagem muito grande mesmo após compressão");
  }

  const path = `${userId}/${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage.from(MIMOS_BUCKET).upload(path, blob, {
    cacheControl: "31536000",
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(MIMOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete a previously uploaded photo. Best-effort — ignores not-found errors.
 * Accepts a public URL or a raw storage path.
 */
export async function deleteMimoImage(urlOrPath: string): Promise<void> {
  const marker = `/${MIMOS_BUCKET}/`;
  const idx = urlOrPath.indexOf(marker);
  const path = idx >= 0 ? urlOrPath.slice(idx + marker.length) : urlOrPath;
  if (!path) return;
  await supabase.storage.from(MIMOS_BUCKET).remove([path]);
}
