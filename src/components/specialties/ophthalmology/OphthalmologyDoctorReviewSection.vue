<template>
  <div class="doctor-review-section">
    <v-card variant="outlined" rounded="lg" class="doctor-card">
      <v-card-title class="d-flex align-center ga-2 py-3 px-4 text-subtitle-2">
        <v-icon size="18" color="primary">mdi-stethoscope</v-icon>
        تقييم الطبيب
        <v-chip
          size="x-small"
          :color="isCompleted ? 'success' : 'warning'"
          variant="flat"
          class="ms-auto"
        >
          <v-icon start size="12">{{ isCompleted ? 'mdi-check-circle' : 'mdi-clock-outline' }}</v-icon>
          {{ isCompleted ? 'مكتمل' : 'قيد الانتظار' }}
        </v-chip>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-4">
        <!-- Final Diagnosis -->
        <v-textarea
          v-model="localDiagnosis"
          label="التشخيص النهائي"
          placeholder="اكتب التشخيص النهائي للمريض…"
          variant="outlined"
          color="primary"
          rows="3"
          auto-grow
          class="mb-3"
          prepend-inner-icon="mdi-stethoscope"
        />

        <!-- Doctor Notes -->
        <v-textarea
          v-model="localNotes"
          label="ملاحظات الطبيب"
          placeholder="توصيات أو ملاحظات إضافية…"
          variant="outlined"
          color="primary"
          rows="2"
          auto-grow
          prepend-inner-icon="mdi-note-text-outline"
        />
      </v-card-text>

      <v-card-actions class="px-4 pb-4 pt-0 d-flex flex-wrap align-center ga-2">
        <!-- Status switch -->
        <div class="status-switch-wrap">
          <span class="status-switch-label" :class="!isCompleted ? 'label--pending' : 'label--inactive'">
            <v-icon size="14" class="me-1">mdi-clock-outline</v-icon>قيد الانتظار
          </span>
          <v-switch
            :model-value="isCompleted"
            color="success"
            hide-details
            density="compact"
            class="mx-1"
            :loading="statusLoading"
            :disabled="statusLoading"
            @update:model-value="$emit('toggle-status', $event)"
          />
          <span class="status-switch-label" :class="isCompleted ? 'label--completed' : 'label--inactive'">
            <v-icon size="14" class="me-1">mdi-check-circle</v-icon>مكتمل
          </span>
          <v-progress-circular v-if="statusLoading" indeterminate size="14" color="primary" class="ms-2" />
        </div>

        <v-spacer />

        <!-- Save diagnosis -->
        <v-btn
          color="primary"
          variant="elevated"
          prepend-icon="mdi-content-save"
          :disabled="!localDiagnosis.trim()"
          :loading="saving"
          @click="save"
        >
          حفظ التشخيص
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  diagnosis:     { type: String,  default: ''    },
  notes:         { type: String,  default: ''    },
  isCompleted:   { type: Boolean, default: false },
  statusLoading: { type: Boolean, default: false },
  saving:        { type: Boolean, default: false },
})

const emit = defineEmits(['save', 'toggle-status'])

const localDiagnosis = ref(props.diagnosis || '')
const localNotes     = ref(props.notes     || '')

watch(() => props.diagnosis, (v) => { localDiagnosis.value = v || '' })
watch(() => props.notes,     (v) => { localNotes.value     = v || '' })

const save = () => {
  emit('save', localDiagnosis.value, localNotes.value)
}
</script>

<style scoped>
.doctor-card {
  border-color: rgba(var(--v-theme-primary), 0.25) !important;
  background: rgba(var(--v-theme-primary), 0.02);
}
.status-switch-wrap {
  display: flex; align-items: center; gap: 4px;
  background: rgba(0,0,0,0.04); border-radius: 8px; padding: 4px 10px;
}
.status-switch-label {
  font-size: 13px; font-weight: 700; white-space: nowrap; display: flex; align-items: center;
}
.label--pending   { color: #F57C00; }
.label--completed { color: #2e7d32; }
.label--inactive  { color: rgba(0,0,0,0.28); }
</style>
