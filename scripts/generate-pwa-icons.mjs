// Renderiza public/icon.svg em múltiplos PNGs necessários pro PWA.
// Rodar uma vez após mudar o SVG:
//   node scripts/generate-pwa-icons.mjs
//
// Gera:
//   public/pwa-192.png           — manifest icon (any)
//   public/pwa-512.png           — manifest icon (any)
//   public/pwa-512-maskable.png  — manifest icon (maskable) com padding seguro
//   public/apple-touch-icon.png  — 180×180, requerido pelo iOS Safari

import sharp from "sharp";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, "..", "public");
const SRC = resolve(PUBLIC_DIR, "icon.svg");

const svgBuffer = readFileSync(SRC);

// O SVG base já tem o background escuro. Pra `maskable` precisamos garantir
// que o conteúdo caiba no "safe zone" de 80% do ícone — geramos um SVG
// derivado com o heart reposicionado/reescalado.

async function renderStandard(size, outPath) {
  await sharp(svgBuffer, { density: 384 })
    .resize(size, size, { fit: "cover" })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log(`✓ ${outPath.replace(PUBLIC_DIR + "/", "")} (${size}×${size})`);
}

/**
 * Maskable variant: 20% padding on each side, solid dark background
 * behind. We render the source SVG inside a larger canvas.
 */
async function renderMaskable(size, outPath) {
  // Render the source into inner size (60% of canvas), then pad.
  const inner = Math.round(size * 0.6);
  const pad = Math.round((size - inner) / 2);

  const innerBuf = await sharp(svgBuffer, { density: 384 })
    .resize(inner, inner, { fit: "cover" })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 10, g: 8, b: 9, alpha: 1 },
    },
  })
    .composite([{ input: innerBuf, top: pad, left: pad }])
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log(`✓ ${outPath.replace(PUBLIC_DIR + "/", "")} (${size}×${size}, maskable)`);
}

async function main() {
  await renderStandard(192, resolve(PUBLIC_DIR, "pwa-192.png"));
  await renderStandard(512, resolve(PUBLIC_DIR, "pwa-512.png"));
  await renderMaskable(512, resolve(PUBLIC_DIR, "pwa-512-maskable.png"));
  await renderStandard(180, resolve(PUBLIC_DIR, "apple-touch-icon.png"));
  await renderStandard(32, resolve(PUBLIC_DIR, "favicon-32.png"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
