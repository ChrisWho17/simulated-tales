/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,
      devOptions: { enabled: false },
      filename: "sw.js",
      // Manifest is hand-authored at public/manifest.webmanifest; don't double-emit.
      manifest: false,
      // Make sure our extra precache helper ships alongside the generated SW.
      includeAssets: [
        "sw-bg-sync.js",
        "manifest.webmanifest",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/icon-maskable-512.png",
        "icons/apple-touch-icon.png",
        "icons/favicon-32.png",
        "icons/favicon-16.png",
        "images/untold-logo.png",
        "images/og-thumbnail.png",
      ],
      workbox: {
        // Skip waiting is controlled from the client wrapper via SKIP_WAITING message.
        skipWaiting: false,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigationPreload: true,
        // Background Sync API hook lives in this script — imported into the SW.
        importScripts: ["/sw-bg-sync.js"],
        // Don't intercept OAuth callbacks or the dev/asset infra paths.
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [
          /^\/~oauth/,
          /^\/__l5e\//,
          /^\/api\//,
        ],
        // Precache: build output + critical Main Menu assets (icons, logo, og).
        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,webmanifest,woff2}",
          "images/**/*.{png,jpg,jpeg,webp,svg}",
          "icons/**/*.{png,svg}",
          "audio/**/*.{mp3,ogg,wav}",
        ],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            // HTML navigations: always try network first so updates land fast.
            urlPattern: ({ request, url }) =>
              request.mode === "navigate" && !url.pathname.startsWith("/~oauth"),
            handler: "NetworkFirst",
            options: {
              cacheName: "html-navigations",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            // Same-origin hashed build assets.
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && /\/assets\/.*\.(?:js|css|woff2?)$/.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets",
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Images (icons, og, in-app art).
            urlPattern: ({ request, sameOrigin }) =>
              sameOrigin && request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  },
}));
