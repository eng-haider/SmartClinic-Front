<template>
  <header class="public-sticky-header">
    <div class="public-shell public-header-row">
      <div class="public-brand" :aria-label="clinicName || labels.portal">
        <img v-if="logo" class="public-logo" :src="logo" :alt="clinicName" width="38" height="38">
        <span v-else class="public-logo-fallback" aria-hidden="true"><v-icon size="20">mdi-hospital-building-outline</v-icon></span>
        <span class="public-brand-name">{{ clinicName || labels.portal }}</span>
      </div>

      <div class="public-header-actions">
        <button class="public-icon-button" type="button" :aria-label="labels.changeLanguage" @click="$emit('toggle-language')">
          <span aria-hidden="true">{{ locale === 'ar' ? 'EN' : 'ع' }}</span>
        </button>
        <a v-if="whatsapp" class="public-text-button" :href="whatsapp" target="_blank" rel="noopener noreferrer">
          <v-icon size="19">mdi-whatsapp</v-icon><span>{{ labels.contact }}</span>
        </a>
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  clinicName: { type: String, default: '' },
  logo: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  locale: { type: String, default: 'en' },
  labels: { type: Object, required: true },
})
defineEmits(['toggle-language'])
</script>
