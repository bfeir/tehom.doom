import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Calisthenics Tracker",
        short_name: "CalisTracker",
        description: "Track your calisthenics training and readiness",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#1976d2",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            // CacheFirst: static assets (JS/CSS bundles, fonts, images) — content-hashed, safe indefinitely
            urlPattern: /\.(?:js|css|woff2?|ttf|eot|png|jpg|jpeg|svg|gif|ico)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
              },
            },
          },
          {
            // StaleWhileRevalidate: exercise registry (rarely changes)
            urlPattern: /\/rest\/v1\/exercises/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "exercise-registry",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
            },
          },
          {
            // NetworkFirst: session data and Edge Functions (must be fresh)
            urlPattern: /\/rest\/v1\/sessions|\/functions\/v1\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-sessions",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 24 * 60 * 60, // 1 day
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
