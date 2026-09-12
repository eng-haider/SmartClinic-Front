<template>
  <v-card variant="outlined" class="settings-section mb-6">
    <button
      v-if="xs"
      type="button"
      class="settings-section__toggle"
      :aria-expanded="expanded"
      :aria-controls="`${id}-content`"
      @click="expanded = !expanded"
    >
      <v-icon color="primary" size="22">{{ icon }}</v-icon>
      <span>{{ title }}</span>
      <v-icon size="20">{{ expanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
    </button>
    <v-card-title v-else class="bg-grey-lighten-4">
      <v-icon start>{{ icon }}</v-icon>
      {{ title }}
    </v-card-title>
    <!-- Keep fields mounted so closing a section preserves unsaved edits. -->
    <div v-show="!xs || expanded" :id="`${id}-content`" class="settings-section__body">
      <slot />
    </div>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'
import { useDisplay } from 'vuetify'

const props = defineProps({
  id: { type: String, required: true },
  title: { type: String, required: true },
  icon: { type: String, required: true },
  initiallyOpen: { type: Boolean, default: false }
})
const { xs } = useDisplay()
const expanded = ref(props.initiallyOpen)
</script>

<style scoped>
.settings-section__toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 60px;
  padding: 16px;
  color: rgb(var(--v-theme-on-surface));
  text-align: start;
  font-size: 0.875rem;
  font-weight: 600;
}

.settings-section__toggle span {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.settings-section__toggle[aria-expanded="true"] {
  background: rgba(var(--v-theme-primary), 0.06);
}

.settings-section__toggle:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -3px;
}

@media (max-width: 599px) {
  .settings-section {
    margin-bottom: 12px !important;
    border-radius: 16px;
  }

  .settings-section__body :deep(.v-card-text) {
    padding: 16px !important;
  }
}
</style>
