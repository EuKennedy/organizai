import { supabase } from "@/lib/supabase";

const BUCKET = "wishlist-photos";
const MAX_DIMENSION = 1400;
const JPEG_QUALITY = 0.85;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

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

export async function compressImage(file: File): Promise<Blob> {
  if (file.size < 400 * 1024 && /^image\/jpe?g$/i.test(file.type)) return file;
  const img = await loadImage(file);
  const ratio = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não suportado");
  ctx.drawImage(img, 0, 0, w, h);
  const blob: Blob | null = await new Promise((res) =>
    canvas.toBlob((b) => res(b), "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) throw new Error("Falha ao comprimir imagem");
  return blob;
}

export async function uploadWishlistImage(
  file: File,
  userId: string
): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Arquivo não é imagem");
  const blob = await compressImage(file);
  if (blob.size > MAX_UPLOAD_BYTES)
    throw new Error("Imagem muito grande mesmo após compressão");
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    cacheControl: "31536000",
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteWishlistImage(urlOrPath: string): Promise<void> {
  const marker = `/${BUCKET}/`;
  const idx = urlOrPath.indexOf(marker);
  const path = idx >= 0 ? urlOrPath.slice(idx + marker.length) : urlOrPath;
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
