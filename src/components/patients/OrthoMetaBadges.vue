<template>
  <div v-if="hasMeta" class="omb-row">
    <span v-if="meta.noteDate" class="omb-badge omb-badge--date">
      <v-icon size="12" class="me-1">mdi-calendar-outline</v-icon>{{ formatOrthoDate(meta.noteDate) }}
    </span>
    <span v-if="meta.appliance" class="omb-badge">
      <v-icon size="12" class="me-1">mdi-tools</v-icon>{{ meta.appliance }}
    </span>
    <span v-if="meta.phase" class="omb-badge">
      <v-icon size="12" class="me-1">mdi-progress-clock</v-icon>{{ meta.phase }}
    </span>
    <span v-if="meta.duration" class="omb-badge">
      <v-icon size="12" class="me-1">mdi-calendar-range</v-icon>{{ meta.duration }} شهر
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatOrthoDate } from '@/utils/orthoNote'

const props = defineProps({
  meta: { type: Object, default: null },
})

const hasMeta = computed(() => {
  const m = props.meta
  return !!(m && (m.noteDate || m.appliance || m.phase || m.duration))
})
</script>

<style scoped>
.omb-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.omb-badge {
  display: inline-flex;
  align-items: center;
  background: rgba(var(--v-theme-primary), 0.08);
  color: rgb(var(--v-theme-primary));
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
}
.omb-badge--date {
  background: rgba(var(--v-theme-primary), 0.16);
}
</style>
