<template>
  <v-card variant="outlined" rounded="lg" class="rx-med-form">
    <v-card-text class="pa-4">
      <div class="d-flex align-center gap-2 mb-4">
        <v-icon color="primary" size="20">mdi-plus-circle</v-icon>
        <h3 class="rx-med-form__title">
          {{ isEditing ? $t('rx.edit_medication') : $t('rx.add_medication') }}
        </h3>
      </div>

      <v-form ref="formRef" v-model="formValid" @submit.prevent="handleSubmit">
        <v-row dense>
          <!-- Medication Name -->
          <v-col cols="12" sm="6" md="4">
            <MedicationPicker
              v-model="form.medication_name"
              :label="$t('rx.medication_name')"
              :placeholder="$t('rx.medication_name_placeholder')"
              :rules="[rules.required]"
              density="compact"
            />
          </v-col>

          <!-- Dosage -->
          <v-col cols="6" sm="3" md="2">
            <v-text-field
              v-model="form.dosage"
              :label="$t('rx.dosage')"
              :placeholder="$t('rx.dosage_placeholder')"
              variant="outlined"
              density="compact"
              :rules="[rules.required]"
              prepend-inner-icon="mdi-scale-balance"
            />
          </v-col>

          <!-- Form (tablet / syrup / injection) -->
          <v-col cols="6" sm="3" md="2">
            <v-select
              v-model="form.form"
              :items="formOptions"
              :label="$t('rx.form')"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-medical-bag"
              clearable
            />
          </v-col>

          <!-- Frequency -->
          <v-col cols="6" sm="4" md="2">
            <v-combobox
              v-model="form.frequency"
              :items="frequencyPresets"
              :label="$t('rx.frequency')"
              :placeholder="$t('rx.frequency_placeholder')"
              variant="outlined"
              density="compact"
              :rules="[rules.required]"
              prepend-inner-icon="mdi-clock-outline"
            />
          </v-col>

          <!-- Duration -->
          <v-col cols="6" sm="4" md="2">
            <v-combobox
              v-model="form.duration"
              :items="durationPresets"
              :label="$t('rx.duration')"
              :placeholder="$t('rx.duration_placeholder')"
              variant="outlined"
              density="compact"
              :rules="[rules.required]"
              prepend-inner-icon="mdi-calendar-range"
            />
          </v-col>

          <!-- Instructions -->
          <v-col cols="12" sm="4" md="4">
            <v-combobox
              v-model="form.instructions"
              :items="instructionPresets"
              :label="$t('rx.instructions')"
              :placeholder="$t('rx.instructions_placeholder')"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-information-outline"
              clearable
            />
          </v-col>

          <!-- Actions -->
          <v-col cols="12" md="8" class="d-flex align-center gap-2 pt-1">
            <v-btn
              color="primary"
              variant="elevated"
              size="small"
              prepend-icon="mdi-plus"
              :disabled="!formValid"
              @click="handleSubmit"
            >
              {{ isEditing ? $t('rx.update_medication') : $t('rx.add_medication') }}
            </v-btn>
            <v-btn
              v-if="isEditing"
              variant="text"
              size="small"
              @click="cancelEdit"
            >
              {{ $t('common.cancel') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MedicationPicker from '@/components/MedicationPicker.vue'

const props = defineProps({
  editItem: {
    type: Object,
    default: null
  },
  editIndex: {
    type: Number,
    default: -1
  }
})

const emit = defineEmits(['add', 'update', 'cancel-edit'])

const { t } = useI18n()

const formRef = ref(null)
const formValid = ref(false)

const defaultForm = () => ({
  medication_name: '',
  dosage: '',
  form: '',
  frequency: '',
  duration: '',
  instructions: ''
})

const form = ref(defaultForm())

const isEditing = computed(() => props.editIndex >= 0 && props.editItem)

// Watch for edit item changes
watch(() => props.editItem, (item) => {
  if (item) {
    form.value = { ...item }
  }
}, { immediate: true })

const rules = {
  required: v => !!v || t('rx.field_required')
}

// Preset options
const formOptions = computed(() => [
  t('rx.form_tablet'),
  t('rx.form_capsule'),
  t('rx.form_syrup'),
  t('rx.form_injection'),
  t('rx.form_cream'),
  t('rx.form_drops'),
  t('rx.form_inhaler'),
  t('rx.form_suppository'),
  t('rx.form_patch')
])

const frequencyPresets = computed(() => [
  t('rx.freq_once_daily'),
  t('rx.freq_twice_daily'),
  t('rx.freq_three_daily'),
  t('rx.freq_four_daily'),
  t('rx.freq_every_8h'),
  t('rx.freq_every_12h'),
  t('rx.freq_as_needed'),
  t('rx.freq_once_weekly')
])

const durationPresets = computed(() => [
  t('rx.dur_3_days'),
  t('rx.dur_5_days'),
  t('rx.dur_7_days'),
  t('rx.dur_10_days'),
  t('rx.dur_14_days'),
  t('rx.dur_30_days'),
  t('rx.dur_continuous')
])

const instructionPresets = computed(() => [
  t('rx.instr_before_food'),
  t('rx.instr_after_food'),
  t('rx.instr_with_food'),
  t('rx.instr_empty_stomach'),
  t('rx.instr_before_sleep'),
  t('rx.instr_as_needed')
])

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  const medication = { ...form.value }
  if (isEditing.value) {
    emit('update', props.editIndex, medication)
  } else {
    emit('add', medication)
  }
  resetForm()
}

const resetForm = () => {
  form.value = defaultForm()
  formRef.value?.resetValidation()
}

const cancelEdit = () => {
  resetForm()
  emit('cancel-edit')
}

defineExpose({ resetForm })
</script>

<style scoped>
.rx-med-form {
  border-color: rgba(var(--v-theme-primary), 0.15) !important;
  border-style: dashed !important;
  background: rgba(var(--v-theme-primary), 0.01);
}

.rx-med-form__title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

@media print {
  .rx-med-form { display: none !important; }
}
</style>
