/**
 * Main Entry Point - Vue 3 + Capacitor
 * نقطة الدخول الرئيسية للتطبيق
 * 
 * @author Clinic Management System
 * @version 3.0.0
 */

// Auto-reload when a new build is deployed and old chunk hashes no longer exist.
//
// Guard against infinite reload loops: a plain reload can NEVER fix a genuinely
// missing chunk (stale CDN index.html, stale service-worker precache, or a file
// that was truly removed on the server), so an unconditional reload here turns a
// one-off stale-chunk error into a page that refreshes forever. We therefore
// reload at most once within a short window, and clear stale service-worker
// caches first so the single reload actually fetches fresh assets.
window.addEventListener('vite:preloadError', (event) => {
  const RELOAD_KEY = 'vite:preload-reload-at'
  const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0)
  const now = Date.now()

  // Already reloaded in the last 20s and the chunk is STILL failing — stop, so
  // we don't loop. Let Vite surface the original error instead.
  if (now - last < 20000) {
    console.error(
      '[vite:preloadError] Chunk still failing after reload; aborting auto-reload to avoid an infinite refresh loop.',
      event && event.payload
    )
    return
  }

  sessionStorage.setItem(RELOAD_KEY, String(now))

  // Clear any stale service-worker caches (old JS/CSS chunks may be precached)
  // so the reload picks up the freshly deployed assets, then reload.
  if ('caches' in window) {
    caches.keys()
      .then((names) => Promise.all(names.map((name) => caches.delete(name))))
      .catch(() => {})
      .finally(() => window.location.reload())
  } else {
    window.location.reload()
  }
})

// Force unregister old service workers and re-register fresh one
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.update()
    })
  })
}

import { createApp, nextTick } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import '@fortawesome/fontawesome-free/css/all.css'

// Virtual Scroller
import 'vue3-virtual-scroller/dist/vue3-virtual-scroller.css'

// i18n
import { createI18n } from 'vue-i18n'
import ar from './locales/ar.json'
import en from './locales/en.json'
import ku from './locales/ku.json'
import pl from './locales/pl.json'

// Styles
import './styles/main.css'
import './styles/mobile.css'
import './styles/dialogs.css'

// Custom Directives
import permissionDirective, { roleDirective as roleDir, canDirective } from './directives/permission'
import roleDirective from './directives/role'

// Auth Store
import { useAuthStore } from './stores/authNew'

// Mobile utilities
import { initMobileApp } from './composables/useMobile'

// ==================== Vuetify Setup ====================
const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi }
  },
  theme: {
    defaultTheme: localStorage.getItem('darkMode') === 'true' ? 'dark' : 'light',
    themes: {
      light: {
        colors: {
          primary: '#17638D',
          secondary: '#ff0000',
          accent: '#9C27b0',
          info: '#00CAE3',
          success: '#4CAF50',
          warning: '#FB8C00',
          error: '#FF5252'
        }
      },
      dark: {
        colors: {
          primary: '#17638D',
          secondary: '#ff0000',
          accent: '#9C27b0',
          info: '#00CAE3',
          success: '#4CAF50',
          warning: '#FB8C00',
          error: '#FF5252'
        }
      }
    }
  },
  defaults: {
    VDialog: {
      scrollable: true,
      scrollStrategy: 'block'
    },
    VMenu: {
      scrollStrategy: 'reposition'
    },
    VOverlay: {
      scrollStrategy: 'reposition'
    }
  },
  locale: {
    locale: localStorage.getItem('locale') || 'ar',
    rtl: { ar: true, en: false, ku: true, pl: false }
  }
})

// ==================== i18n Setup ====================
const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || 'ar',
  fallbackLocale: 'en',
  messages: { ar, en, ku, pl }
})

// ==================== Pinia Setup ====================
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// ==================== Create App ====================
const app = createApp(App)

// Global Properties
app.config.globalProperties.$url = 'https://mina-api.tctate.com'
app.config.globalProperties.$http = 'https://'

// Use Plugins
app.use(pinia)

// Initialize Auth Store BEFORE router so guards can read auth state immediately
const authStore = useAuthStore()
authStore.initializeAuth()

app.use(router)
app.use(vuetify)
app.use(i18n)

// Register Custom Directives
app.directive('permission', permissionDirective)
app.directive('role', roleDirective)
app.directive('can', canDirective)  // Keyword-based permission check

// Set RTL Direction
const currentLang = localStorage.getItem('locale') || 'ar'
const rtlLangs = ['ar', 'ku']
document.documentElement.dir = rtlLangs.includes(currentLang) ? 'rtl' : 'ltr'
document.documentElement.lang = currentLang

// Mount App when the router is ready
router.isReady().then(async () => {
  app.mount('#app')
  await nextTick()
  requestAnimationFrame(() => window.dispatchEvent(new Event('app:ready')))

  // Initialize mobile-specific features (status bar, splash screen, etc.)
  initMobileApp()
}).catch((error) => {
  console.error('Failed to start the app:', error)
  window.dispatchEvent(new Event('app:startup-error'))
})
