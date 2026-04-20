<template>
  <v-snackbar
    v-model="needRefresh"
    location="bottom"
    color="primary"
    :timeout="-1"
    multi-line
    elevation="4"
    rounded="lg"
    style="z-index: 9999;"
  >
    <div class="d-flex align-center gap-2">
      <v-icon>mdi-update</v-icon>
      <span>يوجد إصدار جديد (v{{ appVersion }}) متاح</span>
    </div>

    <template #actions>
      <v-btn
        variant="text"
        color="white"
        @click="needRefresh = false"
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

const appVersion = __APP_VERSION__

const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegistered(registration) {
    if (registration) {
      setInterval(() => registration.update(), 60 * 1000)
    }
  }
})

function update() {
  updateServiceWorker(true)
}
</script>

