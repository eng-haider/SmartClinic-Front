/**
 * Main Entry Point - Vue 3 + Ionic + Capacitor
 * نقطة الدخول الرئيسية للتطبيق
 * 
 * @author Clinic Management System
 * @version 3.0.0
 */

// Clear old caches on every load to prevent stale versions
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      // Clear all workbox precache entries to force fresh content
      if (name.includes('precache') || name.includes('runtime') || name.includes('api-cache')) {
        caches.delete(name)
        console.log('🗑️ Cleared cache:', name)
      }
    })
  })
}

// Force unregister old service workers and re-register fresh one
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.update()
      console.log('🔄 Forced SW update check')
    })
  })
}

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// Ionic
import { IonicVue } from '@ionic/vue'

/* Ionic CSS - Core */
import '@ionic/vue/css/core.css'

/* Ionic CSS - Basic */
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'

/* Ionic CSS - Optional (recommended for clean mobile UI) */
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
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

// Styles
import './styles/main.css'
import './styles/mobile.css'

// Custom Directives
import permissionDirective, { roleDirective as roleDir, canDirective } from './directives/permission'
import roleDirective from './directives/role'

// Auth Store
import { useAuthStore } from './stores/authNew'

// Mobile utilities
import { initMobileApp } from './composables/useMobile'

// ==================== Vuetify Setup ====================
const vuetify = createVuetify({
  components,
  directives,
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
      scrollStrategy: 'reposition'
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
    rtl: { ar: true, en: false, ku: true }
  }
})

// ==================== i18n Setup ====================
const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || 'ar',
  fallbackLocale: 'en',
  messages: { ar, en, ku }
})

// ==================== Pinia Setup ====================
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// ==================== Create App ====================
const app = createApp(App)

// Global Properties
app.config.globalProperties.$url = 'https://mina-api.tctate.com'
app.config.globalProperties.$http = 'https://'

// Use Plugins (Ionic must be registered before router)
app.use(pinia)

// Initialize Auth Store BEFORE router so guards can read auth state immediately
const authStore = useAuthStore()
authStore.initializeAuth()

app.use(IonicVue, {
  mode: 'md', // Material Design mode for consistent look
  animated: true,
})
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

// Mount App when Ionic router is ready
router.isReady().then(() => {
  app.mount('#app')
  
  // Initialize mobile-specific features (status bar, splash screen, etc.)
  initMobileApp()
})
