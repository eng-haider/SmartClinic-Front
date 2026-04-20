<template>
  <v-dialog v-model="isOpen" max-width="600" scrollable>
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top" timeout="4000">
      {{ snackbar.message }}
    </v-snackbar>
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>{{ editingCase ? $t('patients.editCase') : $t('patients.addCase') }}</span>
        <v-btn icon variant="text" @click="isOpen = false"><v-icon>mdi-close</v-icon></v-btn>
      </v-card-title>
      <v-card-text>
        <v-form ref="formRef" v-model="isValid">

          <div class="price-field-wrapper mb-3">
            <label class="price-field-label">{{ $t('cases.price') }}</label>
            <div class="price-field-inner">
              <input
                class="price-native-input"
                type="text"
                inputmode="numeric"
                :value="formatNumberWithCommas(form.amount)"
                @focus="onPriceFocus"
                @input="onPriceInputNative"
                @blur="onPriceBlur($event)"
              />
              <span class="price-field-suffix">IQD</span>
            </div>
          </div>

          <v-select
            v-model="form.status"
            :items="statusOptions"
            :label="$t('patients.status')"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-model="form.case_date"
            :label="$t('common.date')"
            type="date"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-textarea
            v-model="form.notes"
            :label="$t('patients.description') || 'Notes'"
            variant="outlined"
            density="comfortable"
            rows="2"
            class="mb-3"
          />

          <v-select
            v-model="form.category_id"
            :items="categories"
            :item-title="getCategoryItemTitle"
            item-value="id"
            :label="$t('patients.category') + ' (' + ($t('common.optional') || 'اختياري') + ')'"
            clearable
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          
          <OphthalmologyCaseForm v-model="form" />

        </v-form>
      </v-card-text>
      <v-card-actions class="pa-4 pt-0">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="isOpen = false" :disabled="loading">{{ $t('common.cancel') }}</v-btn>
        <v-btn color="primary" variant="elevated" :loading="loading" @click="saveCase" :disabled="!isValid">{{ $t('common.save') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'
import OphthalmologyCaseForm from './OphthalmologyCaseForm.vue'

const { t, locale } = useI18n()

const props = defineProps({
  modelValue: Boolean,
  patientId: [Number, String],
  editingCase: Object,
  categories: {
    type: Array,
    default: () => []
  },
  doctors: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref(null)
const isValid = ref(true)
const loading = ref(false)

const snackbar = ref({ show: false, message: '', color: 'error' })
function showError(msg) {
  snackbar.value = { show: true, message: msg, color: 'error' }
}

const form = ref({
  doctor_id: null,
  category_id: null,
  amount: 0,
  status: 'pending',
  case_date: '',
  notes: '',
  eye_side: '',
  visual_acuity_left: '',
  visual_acuity_right: '',
  iop_left: null,
  iop_right: null,
  refraction_left: '',
  refraction_right: '',
  anterior_segment: '',
  posterior_segment: '',
  diagnosis: ''
})

const getCategoryItemTitle = (item) => {
  if (locale.value === 'ar') return item.name_ar || item.name
  return item.name_en || item.name
}

const statusOptions = computed(() => [
  { title: t('common.pending'), value: 'pending' },
  { title: t('common.completed'), value: 'completed' }
])

watch(() => form.value.category_id, (newCategoryId) => {
  if (!newCategoryId || props.editingCase) return
  const category = props.categories.find(c => c.id === newCategoryId)
  if (category?.item_cost) {
    form.value.amount = category.item_cost
  }
})

watch(isOpen, (newVal) => {
  if (newVal) {
    if (props.editingCase) {
      const ophDetails = props.editingCase.ophthalmology_encounter_details || {}
      const statusId = props.editingCase.status?.id || props.editingCase.status_id || props.editingCase.status
      form.value = {
        doctor_id: props.editingCase.doctor_id || props.editingCase.doctor?.id || null,
        category_id: props.editingCase.case_categores_id || props.editingCase.category?.id || null,
        amount: props.editingCase.price || props.editingCase.amount || 0,
        status: (statusId === 3 || statusId === '3') ? 'completed' : 'pending',
        case_date: props.editingCase.case_date ? new Date(props.editingCase.case_date).toISOString().split('T')[0] : (props.editingCase.created_at ? new Date(props.editingCase.created_at).toISOString().split('T')[0] : ''),
        notes: props.editingCase.notes || props.editingCase.description || '',
        eye_side: ophDetails.eye_side || props.editingCase.eye_side || '',
        visual_acuity_left: ophDetails.visual_acuity_left || props.editingCase.visual_acuity_left || '',
        visual_acuity_right: ophDetails.visual_acuity_right || props.editingCase.visual_acuity_right || '',
        iop_left: ophDetails.iop_left || props.editingCase.iop_left || null,
        iop_right: ophDetails.iop_right || props.editingCase.iop_right || null,
        refraction_left: ophDetails.refraction_left || props.editingCase.refraction_left || '',
        refraction_right: ophDetails.refraction_right || props.editingCase.refraction_right || '',
        anterior_segment: ophDetails.anterior_segment || props.editingCase.anterior_segment || '',
        posterior_segment: ophDetails.posterior_segment || props.editingCase.posterior_segment || '',
        diagnosis: ophDetails.diagnosis || props.editingCase.diagnosis || ''
      }
    } else {
      form.value = {
        doctor_id: props.doctors?.length ? props.doctors[0].id : null,
        category_id: null,
        amount: 0,
        status: 'pending',
        case_date: '',
        notes: '',
        eye_side: '',
        visual_acuity_left: '',
        visual_acuity_right: '',
        iop_left: null,
        iop_right: null,
        refraction_left: '',
        refraction_right: '',
        anterior_segment: '',
        posterior_segment: '',
        diagnosis: ''
      }
      if (formRef.value) formRef.value.resetValidation()
    }
  }
})

const formatNumberWithCommas = (value) => {
  if (!value) return ''
  return new Intl.NumberFormat('en-US').format(value)
}

const onPriceFocus = (event) => {
  const input = event.target
  const raw = input.value.replace(/,/g, '')
  input.value = raw
  input.select()
}

const onPriceInputNative = (event) => {
  const input = event.target
  const cursorPos = input.selectionStart
  const oldVal = input.value
  const rawDigits = oldVal.replace(/[^0-9]/g, '')
  if (!rawDigits) { input.value = ''; return }
  const formatted = new Intl.NumberFormat('en-US').format(parseInt(rawDigits, 10))
  const rawBeforeCursor = oldVal.slice(0, cursorPos).replace(/,/g, '').length
  let digitCount = 0, newCursor = formatted.length
  for (let i = 0; i < formatted.length; i++) {
    if (formatted[i] !== ',') digitCount++
    if (digitCount === rawBeforeCursor) { newCursor = i + 1; break }
  }
  input.value = formatted
  input.setSelectionRange(newCursor, newCursor)
}

const onPriceBlur = (event) => {
  const raw = event.target.value.replace(/,/g, '')
  const num = parseFloat(raw)
  form.value.amount = isNaN(num) ? 0 : num
  event.target.value = formatNumberWithCommas(form.value.amount)
}

const saveCase = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  try {
    loading.value = true
    const payload = {
      patient_id: props.patientId,
      doctor_id: form.value.doctor_id,
      case_categores_id: form.value.category_id,
      price: form.value.amount,
      status_id: form.value.status === 'completed' ? 3 : 2,
      case_date: form.value.case_date || new Date().toISOString().split('T')[0],
      notes: form.value.notes,
      eye_side: form.value.eye_side,
      visual_acuity_left: form.value.visual_acuity_left,
      visual_acuity_right: form.value.visual_acuity_right,
      iop_left: form.value.iop_left,
      iop_right: form.value.iop_right,
      refraction_left: form.value.refraction_left,
      refraction_right: form.value.refraction_right,
      anterior_segment: form.value.anterior_segment,
      posterior_segment: form.value.posterior_segment,
      diagnosis: form.value.diagnosis
    }

    if (props.editingCase) {
      await api.put(`/cases/${props.editingCase.id}`, payload)
    } else {
      await api.post('/cases', payload)
    }

    isOpen.value = false
    emit('success')
  } catch (err) {
    console.error('Error saving ophthalmology case:', err)
    const msg = err.response?.data?.message
      || Object.values(err.response?.data?.errors || {}).flat()[0]
      || err.message
      || t('common.error')
    showError(msg)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.price-field-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.price-field-label {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  padding-inline-start: 2px;
}

.price-field-inner {
  display: flex;
  align-items: center;
  border: 1px solid rgba(0, 0, 0, 0.38);
  border-radius: 4px;
  padding: 10px 12px;
  gap: 8px;
  transition: border-color 0.2s;
}

.price-field-inner:focus-within {
  border-color: rgb(var(--v-theme-primary));
  border-width: 2px;
  padding: 9px 11px;
}

.price-native-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.87);
  text-align: start;
  min-width: 0;
}

.price-field-suffix {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  font-weight: 500;
}
</style>
