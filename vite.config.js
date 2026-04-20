import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'



const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    VitePWA({
      // Use prompt so we can notify the user and let them choose when to update
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'logo.png', 'robots.txt'],
      // Force service worker to update immediately
      workbox: {
        // Only cache JS/CSS/fonts/images - NOT html files
        globPatterns: ['**/*.{js,css,ico,png,svg,woff,woff2}'],
        // Do NOT skipWaiting - let the user confirm before the new SW activates
        // Don't cache index.html to always get fresh version
        navigateFallback: null,
        // Clean up old caches from previous builds
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.smartclinic\.software\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: 'SmartClinic - نظام إدارة العيادات',
        short_name: 'SmartClinic',
        description: 'نظام إدارة العيادات الذكي - Smart Clinic Management System',
        theme_color: '#17638D',
        background_color: '#17638D',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/?v=' + Date.now(),
        dir: 'rtl',
        lang: 'ar',
        // Use logo.png as the primary icon for the PWA.
        icons: [
          {
            src: '/logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        categories: ['medical', 'health', 'productivity'],
        screenshots: []
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 8080,
    host: true,
    watch: {
      usePolling: true
    },
    historyApiFallback: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Add timestamp to file names for cache busting
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`
      }
    }
  }
})
