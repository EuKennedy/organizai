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
      registerType: "autoUpdate",
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
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        // Never precache the Cloudflare Worker / Supabase responses —
        // we always want fresh auth calls. Only cache app shell + assets.
        navigateFallback: "/organizai/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/auth\//, /^\/rest\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // TMDB posters — cache-first, fine to serve stale.
            urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "tmdb-images",
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Supabase Storage public photos — cache-first too.
            urlPattern:
              /^https:\/\/[^/]*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "storage-photos",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts (Fraunces) — cache-first with long TTL.
            urlPattern: /^https:\/\/fonts\.(gstatic|googleapis)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Inter variable font on rsms.me.
            urlPattern: /^https:\/\/rsms\.me\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "inter-font",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  base: "/organizai/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
