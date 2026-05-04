import { supabase } from "@/lib/supabase";

const BUCKET = "couple-logos";

/** Comprime a imagem pra 512x512 max, JPEG 0.92 — bom suficiente pra notif + UI. */
async function compressLogo(file: File): Promise<Blob> {
  const img = await loadImage(file);
  const maxDim = 512;
  const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1);
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob falhou"))),
      "image/jpeg",
      0.92
    );
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("imagem inválida"));
    };
    img.src = url;
  });
}

/**
 * Faz upload do logo no bucket {couple-logos}/{coupleId}/{ts}.jpg
 * Retorna a URL pública pra gravar em couples.logo_url.
 */
export async function uploadCoupleLogo(
  file: File,
  coupleId: string
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Arquivo precisa ser uma imagem");
  }
  const compressed = await compressLogo(file);
  // ts no nome força cache-bust em CDN/SW — toda troca vira URL nova
  const path = `${coupleId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed, {
      contentType: "image/jpeg",
      upsert: false,
      cacheControl: "31536000",
    });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Remove uma logo antiga do storage (best-effort). */
export async function deleteCoupleLogo(urlOrPath: string): Promise<void> {
  try {
    let path = urlOrPath;
    if (urlOrPath.includes(`/${BUCKET}/`)) {
      path = urlOrPath.split(`/${BUCKET}/`)[1] ?? "";
    }
    if (!path) return;
    await supabase.storage.from(BUCKET).remove([path]);
  } catch {
    /* ignore */
  }
}
