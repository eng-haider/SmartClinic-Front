/**
 * Main Entry Point - Vue 3
 * نقطة الدخول الرئيسية للتطبيق
 * 
 * @author Clinic Management System
 * @version 3.0.0
 */

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import '@fortawesome/fontawesome-free/css/all.css'

// i18n
import { createI18n } from 'vue-i18n'
import ar from './locales/ar.json'
import en from './locales/en.json'
import ku from './locales/ku.json'

// Styles
import './styles/main.css'

// Custom Directives
import permissionDirective from './directives/permission'
import roleDirective from './directives/role'

// Auth Store
import { useAuthStore } from './stores/authNew'

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

// Use Plugins
app.use(pinia)
app.use(router)
app.use(vuetify)
app.use(i18n)

// Register Custom Directives
app.directive('permission', permissionDirective)
app.directive('role', roleDirective)

// Initialize Auth Store
const authStore = useAuthStore()
authStore.initializeAuth()

// Set RTL Direction
const currentLang = localStorage.getItem('locale') || 'ar'
const rtlLangs = ['ar', 'ku']
document.documentElement.dir = rtlLangs.includes(currentLang) ? 'rtl' : 'ltr'
document.documentElement.lang = currentLang

// Mount App
app.mount('#app')
