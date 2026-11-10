import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    vueDevTools(),
    // PWA: service worker Workbox untuk app shell & asset build (offline).
    // Manifest ditulis manual di public/manifest.webmanifest (manifest: false),
    // dan registrasi SW dilakukan manual di src/main.js hanya pada platform web
    // (lihat juga usePwaInstall) supaya tidak bentrok dengan WebView Capacitor.
    // Tidak ada runtime caching untuk data bisnis: IndexedDB tetap satu-satunya
    // sumber data, dan precache hanya menyentuh file hasil build.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      manifest: false,
      includeAssets: ['favicon.ico', 'possuper_logo.png', 'possuper_logo_wordmark.png', 'icons/*.png', 'manifest.webmanifest'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    watch: {
      ignored: ['**/.freebuff/**'],
    },
  },
})
