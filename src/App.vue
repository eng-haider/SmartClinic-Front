<template>
  <v-app>
    <router-view />
    <PwaUpdatePrompt />
  </v-app>
</template>

<script setup>
/**
 * App Component - Vue 3
 * المكون الرئيسي للتطبيق
 */

import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/authNew'
import PwaUpdatePrompt from '@/components/PwaUpdatePrompt.vue'

const authStore = useAuthStore()

onMounted(() => {
  authStore.initializeAuth()
  
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

/* Scrollbar Styles (desktop only) */
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: #313942; }
::-webkit-scrollbar-thumb { background: #3F51B5; }
</style>