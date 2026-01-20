<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script setup>
/**
 * App Component - Vue 3
 * المكون الرئيسي للتطبيق
 */

import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/authNew'

const authStore = useAuthStore()

onMounted(() => {
  // Initialize auth from localStorage
  authStore.initializeAuth()
  
  // Set language direction
  const locale = localStorage.getItem('locale') || 'ar'
  const rtlLangs = ['ar', 'ku']
  document.documentElement.dir = rtlLangs.includes(locale) ? 'rtl' : 'ltr'
  document.documentElement.lang = locale
})
</script>

<style>
* {
  font-family: "Cairo", sans-serif;
}

html {
  overflow-y: auto !important;
  overflow-x: hidden;
}

/* Fix for Vuetify scroll lock */
html.overflow-y-hidden {
  overflow-y: hidden !important;
}

/* Scrollbar Styles */
::-webkit-scrollbar {
  width: 5px;
}

::-webkit-scrollbar-track {
  background: #313942;
}

::-webkit-scrollbar-thumb {
  background: #3F51B5;
}
</style>