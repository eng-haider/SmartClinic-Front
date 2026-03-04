<template>
  <!-- No prompt needed - auto update silently -->
</template>

<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { updateServiceWorker } = useRegisterSW({
  onRegistered(registration) {
    console.log('✅ Service Worker registered successfully')
    
    // Check for updates every 30 seconds
    if (registration) {
      setInterval(async () => {
        console.log('🔄 Checking for updates...')
        await registration.update()
      }, 30 * 1000)
    }
  },
  onRegisterError(error) {
    console.error('❌ Service Worker registration error:', error)
  },
  onNeedRefresh() {
    console.log('🆕 New version available! Auto-updating...')
    // Automatically update and reload - no user interaction needed
    updateServiceWorker(true).then(() => {
      window.location.reload()
    })
  },
  onOfflineReady() {
    console.log('✅ App ready to work offline')
  }
})
</script>
