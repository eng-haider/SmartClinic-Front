<template>
  <v-dialog v-model="internalDialog" max-width="900" persistent scrollable>
    <v-card rounded="xl" class="recipe-dialog">
      <!-- Header -->
      <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary">
        <div class="d-flex align-center gap-2">
          <v-icon color="white">mdi-pill</v-icon>
          <span class="text-white text-h6">
            {{ isEditing ? $t('recipes.edit_recipe') : $t('recipes.add_recipe') }}
          </span>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          color="white"
          @click="handleClose"
        />
      </v-card-title>

      <v-card-text class="pa-6">
        <v-form ref="recipeForm" v-model="formValid">
          <!-- Patient Info (if patient is passed) -->
          <v-alert
            v-if="patientInfo"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            <div class="d-flex align-center gap-2">
              <v-icon>mdi-account</v-icon>
              <span class="font-weight-medium">{{ patientInfo.name }}</span>
              <span v-if="patientInfo.phone" class="text-caption">• {{ patientInfo.phone }}</span>
            </div>
          </v-alert>

          <!-- Patient Search (if no patient passed) -->
          <v-autocomplete
            v-if="!patientId"
            v-model="recipeData.patient"
            v-model:search="patientSearch"
            :items="patientOptions"
            :label="$t('recipes.select_patient')"
            :loading="searchingPatients"
            item-title="name"
            item-value="id"
            return-object
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-account-search"
            :rules="[rules.required]"
            class="mb-4"
            clearable
            no-filter
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props">
                <template v-slot:prepend>
                  <v-avatar color="primary" size="40">
                    <span class="text-white">{{ getInitials(item.raw.name) }}</span>
                  </v-avatar>
                </template>
                <template v-slot:subtitle>
                  <span dir="ltr">{{ item.raw.phone }}</span>
                </template>
              </v-list-item>
            </template>
            
            <template v-slot:no-data>
              <v-list-item>
                <v-list-item-title>
                  {{ patientSearch?.length >= 3 
                    ? $t('recipes.no_patients_found') 
                    : $t('recipes.type_to_search') 
                  }}
                </v-list-item-title>
              </v-list-item>
            </template>
          </v-autocomplete>

          <!-- Doctor Selection -->
          <v-select
            v-model="recipeData.doctors_id"
            :items="doctors"
            :label="$t('recipes.select_doctor')"
            item-title="name"
            item-value="id"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-doctor"
            :rules="[rules.required]"
            class="mb-4"
          />

          <!-- Prescription Notes -->
          <v-textarea
            v-model="recipeData.notes"
            :label="$t('recipes.prescription_notes')"
            :placeholder="$t('recipes.notes_placeholder')"
            variant="outlined"
            density="comfortable"
            rows="2"
            auto-grow
            class="mb-4"
            prepend-inner-icon="mdi-note-text"
          />

          <!-- Medications Section -->
          <v-divider class="mb-4" />

          <div class="d-flex align-center justify-space-between mb-4">
            <h3 class="text-subtitle-1 font-weight-bold d-flex align-center gap-2">
              <v-icon color="primary">mdi-pill</v-icon>
              {{ $t('recipes.medications') }}
              <v-chip size="small" color="primary" variant="tonal">
                {{ recipeData.recipe_items.length }}
              </v-chip>
            </h3>
            <v-btn
              color="primary"
              variant="tonal"
              size="small"
              prepend-icon="mdi-plus"
              @click="addMedication"
            >
              {{ $t('recipes.add_medication') }}
            </v-btn>
          </div>

          <!-- Medications List -->
          <v-card
            v-for="(med, index) in recipeData.recipe_items"
            :key="index"
            variant="outlined"
            class="mb-3 medication-card"
            rounded="lg"
          >
            <v-card-text class="pa-4">
              <div class="d-flex align-center justify-space-between mb-3">
                <v-chip size="small" color="primary" variant="flat">
                  {{ $t('recipes.medication') }} #{{ index + 1 }}
                </v-chip>
                <v-btn
                  v-if="recipeData.recipe_items.length > 1"
                  icon="mdi-delete"
                  variant="text"
                  size="small"
                  color="error"
                  @click="removeMedication(index)"
                />
              </div>

              <v-row dense>
                <v-col cols="12" md="6">
                  <MedicationPicker
                    v-model="med.medication_name"
                    :label="$t('recipes.medication_name')"
                    :placeholder="$t('recipes.medication_name_placeholder')"
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="med.dosage"
                    :label="$t('recipes.dosage')"
                    :placeholder="$t('recipes.dosage_placeholder')"
                    variant="outlined"
                    density="compact"
                    :rules="[rules.required]"
                    prepend-inner-icon="mdi-scale-balance"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="med.frequency"
                    :label="$t('recipes.frequency')"
                    :placeholder="$t('recipes.frequency_placeholder')"
                    variant="outlined"
                    density="compact"
                    :rules="[rules.required]"
                    prepend-inner-icon="mdi-clock-outline"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="med.duration"
                    :label="$t('recipes.duration')"
                    :placeholder="$t('recipes.duration_placeholder')"
                    variant="outlined"
                    density="compact"
                    :rules="[rules.required]"
                    prepend-inner-icon="mdi-calendar-range"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Empty State -->
          <v-alert
            v-if="recipeData.recipe_items.length === 0"
            type="warning"
            variant="tonal"
            class="mb-4"
          >
            <div class="d-flex align-center gap-2">
              <v-icon>mdi-alert</v-icon>
              {{ $t('recipes.no_medications') }}
            </div>
          </v-alert>
        </v-form>
      </v-card-text>

      <v-divider />

      <!-- Actions -->
      <v-card-actions class="pa-4">
        <v-btn
          color="success"
          variant="tonal"
          prepend-icon="mdi-printer"
          :disabled="recipeData.recipe_items.length === 0 || !recipeData.recipe_items.some(m => m.medication_name)"
          @click="printRx"
        >
          {{ $t('rx.print') }}
        </v-btn>
        <v-spacer />
        <v-btn
          variant="text"
          @click="handleClose"
        >
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          :loading="saving"
          :disabled="!formValid || recipeData.recipe_items.length === 0"
          @click="handleSave"
        >
          <v-icon start>mdi-content-save</v-icon>
          {{ $t('common.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import RecipeService from '@/services/recipe.service'
import MedicationService from '@/services/medication.service'
import MedicationPicker from '@/components/MedicationPicker.vue'
import api from '@/services/api'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  patientId: {
    type: Number,
    default: null
  },
  patientInfo: {
    type: Object,
    default: null
  },
  doctors: {
    type: Array,
    default: () => []
  },
  defaultDoctorId: {
    type: Number,
    default: null
  },
  recipe: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'saved', 'error'])

const { t, locale } = useI18n()
const authStore = useAuthStore()

const isRtl = computed(() => locale.value === 'ar' || locale.value === 'ku')

// Form state
const recipeForm = ref(null)
const formValid = ref(false)
const saving = ref(false)
const searchingPatients = ref(false)
const patientSearch = ref('')
const patientOptions = ref([])

// Recipe data
const recipeData = ref({
  patient: null,
  doctors_id: null,
  notes: '',
  recipe_items: [
    { medication_name: '', dosage: '', frequency: '', duration: '' }
  ]
})

// Computed
const internalDialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEditing = computed(() => !!props.recipe?.id)

// Validation rules
const rules = {
  required: v => !!v || t('validation.required')
}

// Methods
const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const addMedication = () => {
  recipeData.value.recipe_items.push({
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: ''
  })
}

const removeMedication = (index) => {
  recipeData.value.recipe_items.splice(index, 1)
}

const resetForm = () => {
  recipeData.value = {
    patient: null,
    doctors_id: props.defaultDoctorId || authStore.user?.id || null,
    notes: '',
    recipe_items: [
      { medication_name: '', dosage: '', frequency: '', duration: '' }
    ]
  }
}

const loadRecipeData = () => {
  if (props.recipe) {
    recipeData.value = {
      patient: props.recipe.patient || null,
      doctors_id: props.recipe.doctors_id,
      notes: props.recipe.notes || '',
      recipe_items: props.recipe.recipe_items?.length 
        ? props.recipe.recipe_items.map(item => ({
            medication_name: item.medication_name,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration
          }))
        : [{ medication_name: '', dosage: '', frequency: '', duration: '' }]
    }
  } else {
    resetForm()
  }
}

const searchPatients = async (search) => {
  if (!search || search.length < 3) {
    patientOptions.value = []
    return
  }

  try {
    searchingPatients.value = true
    const isPhone = /^\d+$/.test(search.trim())
    const params = { per_page: 20 }
    if (isPhone) {
      params['filter[phone]'] = search.trim()
    } else {
      params['filter[name]'] = search.trim()
    }
    const response = await api.get('/patients', { params })
    patientOptions.value = response.data?.data || response.data || []
  } catch (error) {
    console.error('Error searching patients:', error)
    patientOptions.value = []
  } finally {
    searchingPatients.value = false
  }
}

// Silently persist any new medication names to the clinic library
const saveNewMedications = async (items) => {
  const names = [...new Set(items.map(i => i.medication_name).filter(Boolean))]
  await Promise.allSettled(names.map(name => MedicationService.create(name)))
}

const handleSave = async () => {
  if (!formValid.value || recipeData.value.recipe_items.length === 0) return

  try {
    saving.value = true

    const validItems = recipeData.value.recipe_items.filter(item =>
      item.medication_name && item.dosage && item.frequency && item.duration
    )

    // Persist new medication names to the clinic library silently
    await saveNewMedications(validItems)

    const payload = {
      patient_id: props.patientId || recipeData.value.patient?.id,
      doctors_id: recipeData.value.doctors_id,
      notes: recipeData.value.notes,
      recipe_items: validItems,
    }

    let response
    if (isEditing.value) {
      response = await RecipeService.update(props.recipe.id, payload)
    } else {
      response = await RecipeService.create(payload)
    }

    emit('saved', response.data || response)
    handleClose()
  } catch (error) {
    console.error('Error saving recipe:', error)
    emit('error', error)
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  resetForm()
  internalDialog.value = false
}

// ─── Print Theme Definitions (synced with RxPreview) ───
const rxThemes = [
  { id: 'clean-blue', primary: '#17638D', bg: '#f0f7fc', card: '#ffffff',
    cardBorder: 'rgba(23,99,141,0.12)', text: '#1a2e3b', textSecondary: '#5a7d8f',
    shadow: '0 4px 24px rgba(23,99,141,0.08)', barGrad: 'linear-gradient(135deg,#17638D,#1a7ab5)',
    notesBg: '#e8f4fd', notesBorder: '#17638D', glowColor: 'rgba(23,99,141,0.06)' },
  { id: 'soft-medical', primary: '#4a90c4', bg: '#fafcff', card: '#ffffff',
    cardBorder: 'rgba(74,144,196,0.10)', text: '#2c3e50', textSecondary: '#7094b0',
    shadow: '0 4px 20px rgba(74,144,196,0.06)', barGrad: 'linear-gradient(135deg,#4a90c4,#68aed8)',
    notesBg: '#f0f6fc', notesBorder: '#4a90c4', glowColor: 'rgba(74,144,196,0.05)' },
  { id: 'royal-purple', primary: '#6c3fa0', bg: '#f7f3fb', card: '#ffffff',
    cardBorder: 'rgba(108,63,160,0.10)', text: '#2d1f4e', textSecondary: '#8a6fb0',
    shadow: '0 4px 24px rgba(108,63,160,0.07)', barGrad: 'linear-gradient(135deg,#6c3fa0,#8b5fc7)',
    notesBg: '#f3eef8', notesBorder: '#6c3fa0', glowColor: 'rgba(108,63,160,0.05)' },
  { id: 'emerald-green', primary: '#2e7d56', bg: '#f2f9f4', card: '#ffffff',
    cardBorder: 'rgba(46,125,86,0.10)', text: '#1b3a2a', textSecondary: '#5e9b7a',
    shadow: '0 4px 24px rgba(46,125,86,0.07)', barGrad: 'linear-gradient(135deg,#2e7d56,#3da06e)',
    notesBg: '#e8f5e9', notesBorder: '#2e7d56', glowColor: 'rgba(46,125,86,0.05)' },
  { id: 'warm-light', primary: '#b8860b', bg: '#fdfaf5', card: '#ffffff',
    cardBorder: 'rgba(184,134,11,0.10)', text: '#3d2e0a', textSecondary: '#a08450',
    shadow: '0 4px 24px rgba(184,134,11,0.06)', barGrad: 'linear-gradient(135deg,#b8860b,#d4a017)',
    notesBg: '#fdf8f0', notesBorder: '#b8860b', glowColor: 'rgba(184,134,11,0.05)' },
]

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return `${parseInt(h.substring(0, 2), 16)}, ${parseInt(h.substring(2, 4), 16)}, ${parseInt(h.substring(4, 6), 16)}`
}

function getActiveTheme() {
  let themeId = 'clean-blue'
  try {
    const saved = localStorage.getItem('rx_theme')
    if (saved && rxThemes.some(t => t.id === saved)) themeId = saved
  } catch { /* ignore */ }
  return rxThemes.find(t => t.id === themeId) || rxThemes[0]
}

const printRx = () => {
  const validMeds = recipeData.value.recipe_items.filter(m => m.medication_name)
  if (!validMeds.length) return

  // Gather clinic/print settings
  let clinic = {}
  try {
    const stored = localStorage.getItem('rx_print_settings')
    if (stored) clinic = JSON.parse(stored)
  } catch { /* ignore */ }
  if (!clinic.clinicName) {
    try {
      const cs = localStorage.getItem('clinic_settings') || localStorage.getItem('clinic')
      if (cs) {
        const c = JSON.parse(cs)
        clinic.clinicName = clinic.clinicName || c.name || c.clinic_name || ''
        clinic.phone = clinic.phone || c.phone || c.clinic_phone || ''
        clinic.address = clinic.address || c.address || c.clinic_address || ''
      }
    } catch { /* ignore */ }
  }

  const doctor = props.doctors?.find(d => d.id === recipeData.value.doctors_id)
  const doctorName = doctor?.name || clinic.doctorName || ''
  const th = getActiveTheme()
  const direction = isRtl.value ? 'rtl' : 'ltr'
  const fontFamily = isRtl.value ? "'Cairo', 'Tajawal', sans-serif" : "'Inter', 'Segoe UI', sans-serif"
  const rtl = isRtl.value
  const c = hexToRgb(th.primary)

  const patientName = props.patientInfo?.name || recipeData.value.patient?.name || ''
  const patientPhone = props.patientInfo?.phone || recipeData.value.patient?.phone || ''
  const patientAge = props.patientInfo?.age || ''
  const patientGender = props.patientInfo?.gender || ''
  const today = new Date().toLocaleDateString(locale.value === 'ar' ? 'ar-IQ' : locale.value === 'ku' ? 'ckb' : 'en-GB')

  // Build medications HTML
  const medsHtml = validMeds.map((med, i) => {
    const parts = [med.form, med.frequency, med.duration ? `× ${med.duration}` : ''].filter(Boolean)
    const regimen = parts.join(' — ')
    return `<div class="rx-row">
      <span class="rx-num">${i + 1}</span>
      <div class="rx-body">
        <div class="rx-drug"><span class="rx-name">${med.medication_name}</span>${med.dosage ? `<span class="rx-dose">${med.dosage}</span>` : ''}</div>
        ${regimen || med.instructions ? `<div class="rx-regimen">${regimen}${med.instructions ? `<span class="rx-sep"> — </span><span class="rx-instr">${med.instructions}</span>` : ''}</div>` : ''}
      </div>
    </div>`
  }).join('')

  const pw = window.open('', '_blank', 'width=800,height=900')
  if (!pw) return

  pw.document.write(`<!DOCTYPE html>
<html dir="${direction}" lang="${locale.value}">
<head>
<meta charset="UTF-8">
<title>${clinic.clinicName || 'Smart Clinic'} - Rx</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: ${fontFamily};
    direction: ${direction};
    background: ${th.bg};
    color: ${th.text};
    line-height: 1.6;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .rx-sheet {
    max-width: 780px;
    margin: 0 auto;
    padding: 28px 36px;
    background: ${th.card};
    border: 1px solid ${th.cardBorder};
    border-radius: 20px;
    box-shadow: ${th.shadow};
    position: relative;
  }
  .rx-sheet::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 20px;
    background: radial-gradient(ellipse at 20% 0%, ${th.glowColor}, transparent 60%);
    pointer-events: none;
  }
  /* Header */
  .rx-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 8px; }
  .rx-clinic { font-size: 1.35rem; font-weight: 800; color: ${th.primary}; }
  .rx-doctor-line { font-size: 0.85rem; color: ${th.textSecondary}; }
  .rx-contact { font-size: 0.75rem; color: ${th.textSecondary}; }
  .rx-bar {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    background: ${th.barGrad}; color: #fff; padding: 10px 0;
    border-radius: 12px; margin: 10px 0 16px;
    box-shadow: 0 2px 12px rgba(${c}, 0.2);
  }
  .rx-bar__sym { font-size: 1.6rem; font-weight: 700; font-style: italic; }
  .rx-bar__txt { font-size: 0.95rem; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
  /* Patient */
  .rx-patient {
    border: 1.5px solid ${th.cardBorder}; border-radius: 14px;
    background: ${th.notesBg}; padding: 14px 18px; margin-bottom: 18px;
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 24px;
  }
  .rx-patient__label { font-size: 0.7rem; font-weight: 700; color: ${th.primary}; text-transform: uppercase; letter-spacing: 0.4px; }
  .rx-patient__value { font-size: 0.9rem; color: ${th.text}; }
  .rx-patient__value--bold { font-weight: 700; font-size: 0.95rem; }
  /* Meds */
  .rx-meds-title { font-size: 1rem; font-weight: 700; color: ${th.text}; margin-bottom: 10px; }
  .rx-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px 0; border-bottom: 1px solid rgba(${c}, 0.08); }
  .rx-row:last-child { border-bottom: none; }
  .rx-num {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 28px; height: 28px; border-radius: 50%;
    background: ${th.barGrad}; color: #fff; font-size: 0.75rem; font-weight: 700;
    flex-shrink: 0; margin-top: 2px; box-shadow: 0 2px 8px rgba(${c}, 0.2);
  }
  .rx-body { flex: 1; }
  .rx-drug { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
  .rx-name { font-size: 1.05rem; font-weight: 700; color: ${th.text}; }
  .rx-dose { font-size: 0.95rem; font-weight: 600; color: ${th.primary}; }
  .rx-regimen { margin-top: 4px; font-size: 0.85rem; color: ${th.textSecondary}; line-height: 1.5; }
  .rx-sep { margin: 0 5px; color: rgba(${c}, 0.3); }
  .rx-instr { color: #b8860b; font-style: italic; }
  /* Notes */
  .rx-notes {
    background: ${th.notesBg};
    border-${rtl ? 'right' : 'left'}: 4px solid ${th.notesBorder};
    border-radius: 10px; padding: 12px 18px; margin-top: 24px;
  }
  .rx-notes__label { font-size: 0.75rem; font-weight: 700; color: ${th.primary}; text-transform: uppercase; margin-bottom: 4px; }
  .rx-notes__text { font-size: 0.85rem; color: ${th.textSecondary}; white-space: pre-wrap; }
  /* Signature */
  .rx-sig { text-align: ${rtl ? 'left' : 'right'}; margin-top: 32px; }
  .rx-sig__line { width: 200px; border-bottom: 2px solid ${th.text}; margin-${rtl ? 'right' : 'left'}: auto; margin-bottom: 6px; }
  .rx-sig__name { font-size: 0.82rem; font-weight: 600; color: ${th.text}; }
  @media print {
    @page { margin: 12mm 15mm; size: A4; }
    body { background: #fff !important; padding: 0; }
    .rx-sheet { padding: 20px 28px; max-width: none; box-shadow: none; border: none; border-radius: 0; }
    .rx-sheet::before { display: none; }
  }
</style>
</head>
<body>
  <div class="rx-sheet">
  <div class="rx-header">
    <div>
      <div class="rx-clinic">${clinic.clinicName || 'Smart Clinic'}</div>
      ${doctorName ? `<div class="rx-doctor-line">${doctorName}${clinic.specialty ? ` — ${clinic.specialty}` : ''}</div>` : ''}
    </div>
    <div style="text-align:${rtl ? 'left' : 'right'}">
      ${clinic.phone ? `<div class="rx-contact">${clinic.phone}</div>` : ''}
      ${clinic.address ? `<div class="rx-contact">${clinic.address}</div>` : ''}
    </div>
  </div>
  <div class="rx-bar"><span class="rx-bar__sym">℞</span><span class="rx-bar__txt">${t('rx.prescription')}</span></div>
  <div class="rx-patient">
    <div><span class="rx-patient__label">${t('rx.patient_name')}</span><div class="rx-patient__value rx-patient__value--bold">${patientName}</div></div>
    ${patientAge ? `<div><span class="rx-patient__label">${t('rx.age')}</span><div class="rx-patient__value">${patientAge}${patientGender ? ` / ${t('rx.' + patientGender)}` : ''}</div></div>` : ''}
    <div><span class="rx-patient__label">${t('rx.date')}</span><div class="rx-patient__value">${today}</div></div>
    ${patientPhone ? `<div><span class="rx-patient__label">${t('rx.phone')}</span><div class="rx-patient__value" dir="ltr">${patientPhone}</div></div>` : ''}
    ${doctorName ? `<div><span class="rx-patient__label">${t('rx.doctor')}</span><div class="rx-patient__value">${doctorName}</div></div>` : ''}
  </div>
  <div class="rx-meds-title">💊 ${t('rx.medications')}</div>
  ${medsHtml}
  ${recipeData.value.notes ? `<div class="rx-notes"><div class="rx-notes__label">${t('rx.notes')}</div><div class="rx-notes__text">${recipeData.value.notes}</div></div>` : ''}
  ${doctorName ? `<div class="rx-sig"><div class="rx-sig__line"></div><div class="rx-sig__name">${doctorName}</div></div>` : ''}
  </div>
</body>
</html>`)

  pw.document.close()
  pw.onload = () => {
    setTimeout(() => {
      pw.print()
      pw.close()
    }, 500)
  }
}

// Watchers
let patientSearchTimeout = null
watch(patientSearch, (val) => {
  clearTimeout(patientSearchTimeout)
  if (!val || val.length < 3) { patientOptions.value = []; return }
  patientSearchTimeout = setTimeout(() => searchPatients(val), 400)
})

watch(() => props.modelValue, (val) => {
  if (val) {
    loadRecipeData()
    if (props.defaultDoctorId) {
      recipeData.value.doctors_id = props.defaultDoctorId
    } else if (authStore.user?.id) {
      recipeData.value.doctors_id = authStore.user.id
    }
  }
})

watch(() => props.recipe, () => {
  if (props.modelValue) {
    loadRecipeData()
  }
})

onMounted(() => {
  if (props.modelValue) {
    loadRecipeData()
  }
})
</script>

<style scoped>
.recipe-dialog {
  font-family: 'Cairo', sans-serif;
}

.medication-card {
  transition: all 0.2s ease;
}

.medication-card:hover {
  border-color: rgb(var(--v-theme-primary));
}

/* RTL Support */
:deep(.v-input__prepend-inner) {
  margin-inline-end: 8px;
}
</style>
