<template>
  <div class="public-patient-main public-shell public-skeleton" aria-label="Loading">
    <p v-if="slow" class="public-notice"><v-icon size="18">mdi-wifi-strength-1-alert</v-icon>{{ labels.slowNetwork }}</p>
    <div class="public-greeting"><div class="skeleton-line skeleton-line--short"></div><div class="skeleton-line skeleton-line--title" style="margin-top: 10px"></div></div>
    <div class="public-grid public-grid--patient">
      <div class="public-stack"><div class="skeleton-block"></div><div class="public-quick-actions"><div v-for="item in 4" :key="item" class="skeleton-block" style="min-height: 78px"></div></div><div class="skeleton-block"></div></div>
      <div class="public-stack"><div class="skeleton-block"></div><div class="skeleton-block"></div></div>
    </div>
  </div>
</template>

<script setup>
defineProps({ slow: { type: Boolean, default: false }, labels: { type: Object, default: () => ({ slowNetwork: 'Still loading…' }) } })
</script>
