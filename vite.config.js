import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync, createReadStream, existsSync } from 'node:fs'



const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

/**
 * Orthodontics module: WebAssembly files the imaging libraries load at
 * runtime, served at fixed paths (dev) and emitted into dist (build). They are
 * only fetched when a doctor opens the CBCT or facial-analysis tab.
 *  - cornerstone-wasm/: DICOM codecs (JPEG 2000, HTJ2K, JPEG-LS, JPEG, JPEG XL)
 *  - mediapipe/wasm/:   MediaPipe Tasks Vision runtime (face landmarks)
 */
const ORTHO_STATIC_ASSETS = {
  'cornerstone-wasm/openjpegwasm_decode.wasm': 'node_modules/@cornerstonejs/codec-openjpeg/dist/openjpegwasm_decode.wasm',
  'cornerstone-wasm/openjphjs.wasm': 'node_modules/@cornerstonejs/codec-openjph/dist/openjphjs.wasm',
  'cornerstone-wasm/charlswasm_decode.wasm': 'node_modules/@cornerstonejs/codec-charls/dist/charlswasm_decode.wasm',
  'cornerstone-wasm/libjpegturbowasm_decode.wasm': 'node_modules/@cornerstonejs/codec-libjpeg-turbo-8bit/dist/libjpegturbowasm_decode.wasm',
  'cornerstone-wasm/jpegxlwasm_decode.wasm': 'node_modules/@cornerstonejs/codec-libjxl/dist/jpegxlwasm_decode.wasm',
  'mediapipe/wasm/vision_wasm_internal.js': 'node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.js',
  'mediapipe/wasm/vision_wasm_internal.wasm': 'node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.wasm',
  'mediapipe/wasm/vision_wasm_nosimd_internal.js': 'node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_nosimd_internal.js',
  'mediapipe/wasm/vision_wasm_nosimd_internal.wasm': 'node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_nosimd_internal.wasm'
}

function orthodonticsStaticAssets() {
  return {
    name: 'orthodontics-static-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const source = ORTHO_STATIC_ASSETS[(req.url || '').split('?')[0].replace(/^\//, '')]
        if (!source || !existsSync(source)) return next()
        res.setHeader('Content-Type', source.endsWith('.wasm') ? 'application/wasm' : 'text/javascript')
        createReadStream(source).pipe(res)
      })
    },
    generateBundle() {
      for (const [fileName, source] of Object.entries(ORTHO_STATIC_ASSETS)) {
        this.emitFile({ type: 'asset', fileName, source: readFileSync(source) })
      }
    }
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    orthodonticsStaticAssets(),
    VitePWA({
      // Use prompt so we can notify the user and let them choose when to update
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'logo.png', 'robots.txt'],
      // Force service worker to update immediately
      workbox: {
        // Only cache JS/CSS/fonts/images - NOT html files
        globPatterns: ['**/*.{js,css,ico,png,svg,woff,woff2}'],
        // The orthodontics imaging libraries (3D, DICOM, face landmarks) are
        // several MB and only used by doctors who open those tabs - never
        // precache them for every user.
        globIgnores: ['**/ortho-*', 'mediapipe/**', 'cornerstone-wasm/**', '**/decodeImageFrameWorker*', '**/computeWorker*'],
        // Do NOT skipWaiting - let the user confirm before the new SW activates
        // Don't cache index.html to always get fresh version
        navigateFallback: null,
        // Clean up old caches from previous builds
        cleanupOutdatedCaches: true,
        // Web Push: show pushed notifications and tell open tabs (public/push-sw.js)
        importScripts: ['push-sw.js'],
        runtimeCaching: [
          {
            // Orthodontic radiographs, 3D models, DICOM and analyses are medical
            // records: always from the network, never kept in the device cache.
            urlPattern: /^https:\/\/api\.smartclinic\.software\/.*\/orthodontics(?:[/?]|$)/i,
            handler: 'NetworkOnly'
          },
          {
            // Financial balances must never fall back to an old cached response.
            urlPattern: /^https:\/\/api\.smartclinic\.software\/.*\/bills\/(?:patient-balances|payments)(?:[/?]|$)/i,
            handler: 'NetworkOnly'
          },
          {
            // Reports/dashboard data must always be live — never serve stale
            // numbers from cache. This rule is first, so it wins for /reports/.
            urlPattern: /^https:\/\/api\.smartclinic\.software\/.*\/reports\//i,
            handler: 'NetworkOnly'
          },
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
  // DICOM decoding runs in module workers that code-split.
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    // Pre-bundling breaks the loader's worker / WebAssembly URLs.
    exclude: ['@cornerstonejs/dicom-image-loader'],
    // The codecs are CommonJS (Emscripten): pre-bundle them so dev mode gets
    // ES modules (the production build converts them with Rollup).
    include: [
      'dicom-parser',
      'pako',
      '@cornerstonejs/codec-charls/decodewasmjs',
      '@cornerstonejs/codec-libjpeg-turbo-8bit/decodewasmjs',
      '@cornerstonejs/codec-libjxl/decodewasmjs',
      '@cornerstonejs/codec-openjpeg/decodewasmjs',
      '@cornerstonejs/codec-openjph/wasmjs'
    ]
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Add timestamp to file names for cache busting
    rollupOptions: {
      output: {
        // Heavy imaging libraries get their own lazy chunks (ortho-*), loaded
        // only inside the orthodontics workspace.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('/three/')) return 'ortho-three'
          if (id.includes('@cornerstonejs') || id.includes('@kitware/vtk.js') || id.includes('dicom-parser')) return 'ortho-cornerstone'
          if (id.includes('@mediapipe')) return 'ortho-mediapipe'
          if (id.includes('/fflate/')) return 'ortho-fflate'
          return undefined
        },
        entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`
      }
    }
  }
})
