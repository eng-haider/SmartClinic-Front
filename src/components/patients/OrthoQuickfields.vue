<template>
  <div class="oqf-row">
    <div class="oqf-group">
      <span class="oqf-label"><v-icon size="14" class="me-1">mdi-tools</v-icon>نوع الجهاز</span>
      <v-chip-group v-model="meta.appliance" selected-class="text-white bg-primary" @update:model-value="emit('change')">
        <v-chip v-for="opt in orthoApplianceOptions" :key="opt" :value="opt" size="small" variant="outlined" filter>{{ opt }}</v-chip>
      </v-chip-group>
    </div>
    <div class="oqf-group">
      <span class="oqf-label"><v-icon size="14" class="me-1">mdi-progress-clock</v-icon>المرحلة</span>
      <v-chip-group v-model="meta.phase" selected-class="text-white bg-primary" @update:model-value="emit('change')">
        <v-chip v-for="opt in orthoPhaseOptions" :key="opt" :value="opt" size="small" variant="outlined" filter>{{ opt }}</v-chip>
      </v-chip-group>
    </div>
    <div class="oqf-group oqf-duration">
      <span class="oqf-label"><v-icon size="14" class="me-1">mdi-calendar-range</v-icon>المدة</span>
      <v-text-field
        v-model="meta.duration"
        type="number"
        min="0"
        suffix="شهر"
        variant="outlined"
        density="compact"
        hide-details
        style="max-width:130px"
        @update:model-value="emit('change')"
      />
    </div>
    <div class="oqf-group oqf-date">
      <span class="oqf-label"><v-icon size="14" class="me-1">mdi-calendar-outline</v-icon>تاريخ الملاحظة</span>
      <v-text-field
        v-model="meta.noteDate"
        type="date"
        variant="outlined"
        density="compact"
        color="primary"
        hide-details
        prepend-inner-icon="mdi-calendar-blank-outline"
        class="oqf-date-field"
        style="max-width:180px"
        @update:model-value="emit('change')"
      />
    </div>
  </div>
</template>

<script setup>
import { orthoApplianceOptions, orthoPhaseOptions } from '@/utils/orthoNote'

// `meta` is mutated in place (same pattern the rest of this app already uses
// for the per-case note-draft objects) rather than a formal v-model — the
// parent always owns a plain reactive object shaped { noteDate, appliance, phase, duration }.
defineProps({
  meta: { type: Object, required: true },
})
const emit = defineEmits(['change'])
</script>

<style scoped>
.oqf-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 28px;
}
.oqf-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 160px;
}
.oqf-duration {
  min-width: 130px;
}
.oqf-date {
  min-width: 180px;
}
.oqf-label {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}
.oqf-group :deep(.v-chip-group) {
  margin-top: -4px;
}

.oqf-date-field :deep(input[type="date"]) {
  font-size: 13px;
  font-weight: 600;
  color-scheme: light;
  cursor: pointer;
}
.oqf-date-field :deep(.v-field__prepend-inner) {
  color: rgb(var(--v-theme-primary));
}
.oqf-date-field :deep(input[type="date"]::-webkit-calendar-picker-indicator) {
  cursor: pointer;
  opacity: 0.55;
  border-radius: 4px;
  padding: 3px;
  transition: opacity 0.15s, background 0.15s;
}
.oqf-date-field :deep(input[type="date"]::-webkit-calendar-picker-indicator:hover) {
  opacity: 1;
  background: rgba(var(--v-theme-primary), 0.1);
}
</style>
