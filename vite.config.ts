import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
      },
      includeAssets: [
        "favicon.svg",
        "favicon-32.png",
        "apple-touch-icon.png",
        "icon.svg",
      ],
      manifest: {
        id: "/organizai/",
        name: "OrganizAI — Vida a dois",
        short_name: "OrganizAI",
        description:
          "Organizador a dois: filmes, séries, dates, galeria, metas e cartinhas — tudo em um só lugar.",
        lang: "pt-BR",
        dir: "ltr",
        start_url: "/organizai/",
        scope: "/organizai/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#0a0809",
        background_color: "#0a0809",
        categories: ["lifestyle", "productivity", "utilities"],
        icons: [
          {
            src: "pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  base: "/organizai/",
  define: {
    __APP_VERSION__: JSON.stringify(
      new Date().toISOString().slice(0, 16).replace("T", " ")
    ),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
