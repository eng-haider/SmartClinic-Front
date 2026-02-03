<template>
  <v-snackbar
    v-model="showUpdatePrompt"
    :timeout="-1"
    location="top"
    color="primary"
    multi-line
  >
    <div class="d-flex flex-column">
      <div class="text-h6 mb-2">
        <v-icon class="mr-2">mdi-update</v-icon>
        {{ $t('pwa.updateAvailable') }}
      </div>
      <div class="text-body-2">
        {{ $t('pwa.updateMessage') }}
      </div>
    </div>

    <template v-slot:actions>
      <v-btn
        variant="text"
        @click="dismissUpdate"
      >
        {{ $t('pwa.later') }}
      </v-btn>
      <v-btn
        variant="elevated"
        color="white"
        @click="updateApp"
      >
        {{ $t('pwa.update') }}
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const showUpdatePrompt = ref(false)
const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegistered(registration) {
    console.log('✅ Service Worker registered successfully')
    
    // Check for updates every 60 seconds for immediate deployment
    if (registration) {
      setInterval(async () => {
        console.log('🔄 Checking for updates...')
        await registration.update()
      }, 60 * 1000) // Check every 60 seconds
    }
  },
  onRegisterError(error) {
    console.error('❌ Service Worker registration error:', error)
  },
  onNeedRefresh() {
    console.log('🆕 New version available!')
    showUpdatePrompt.value = true
  },
  onOfflineReady() {
    console.log('✅ App ready to work offline')
  }
})

const updateApp = async () => {
  try {
    showUpdatePrompt.value = false
    await updateServiceWorker(true)
    // Force reload to ensure the new version is loaded
    window.location.reload()
  } catch (error) {
    console.error('Error updating:', error)
  }
}

const dismissUpdate = () => {
  showUpdatePrompt.value = false
  // Show again in 5 minutes if dismissed
  setTimeout(() => {
    if (needRefresh.value) {
      showUpdatePrompt.value = true
    }
  }, 5 * 60 * 1000)
}

onMounted(() => {
  // Show prompt if update is already available
  if (needRefresh.value) {
    showUpdatePrompt.value = true
  }
})
</script>

<style scoped>
.v-snackbar {
  z-index: 9999;
}
</style>
