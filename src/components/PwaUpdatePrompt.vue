<template>
  <v-snackbar
    v-model="showPrompt"
    :model-value="showPrompt && needRefresh"
    location="top center"
    color="primary"
    :timeout="-1"
    multi-line
    elevation="4"
    rounded="lg"
    style="z-index: 9999; margin-top: 60px;"
  >
    <div class="d-flex align-center gap-2">
      <v-icon>mdi-update</v-icon>
      <span>يوجد إصدار جديد (v{{ appVersion }}) متاح</span>
    </div>

    <template #actions>
      <v-btn
        variant="text"
        color="white"
        @click="dismissUpdate"
      >
        لاحقاً
      </v-btn>
      <v-btn
        variant="elevated"
        color="white"
        class="text-primary font-weight-bold"
        @click="update"
      >
        تحديث الآن
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { ref, onMounted } from 'vue'

const appVersion = __APP_VERSION__
const isUpdating = ref(false)
const showPrompt = ref(true)

const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegistered(registration) {
    if (registration) {
      setInterval(() => registration.update(), 60 * 1000)
    }
  },
  onNeedRefresh() {
    // Clear old cache when update is available
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name))
      })
    }
  }
})

onMounted(() => {
  // Check if we just finished updating
  const isJustUpdated = sessionStorage.getItem('pwa_just_updated')
  if (isJustUpdated) {
    // Hide prompt for this session after update
    showPrompt.value = false
    sessionStorage.removeItem('pwa_just_updated')
  }
})

function dismissUpdate() {
  showPrompt.value = false
  needRefresh.value = false
}

function update() {
  isUpdating.value = true
  showPrompt.value = false
  needRefresh.value = false

  // Mark that we're updating
  sessionStorage.setItem('pwa_just_updated', 'true')

  // Unregister old service workers
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister())
  })

  updateServiceWorker(true)

  // Hard reload with cache busting after short delay
  setTimeout(() => {
    window.location.href = window.location.href.split('#')[0] + '?t=' + Date.now()
  }, 300)
}
</script>

