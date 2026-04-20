<template>
  <div class="recipe-print-container">
    <!-- Print Settings Dialog -->
    <v-dialog v-model="settingsDialog" max-width="600" persistent scrollable>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary">
          <div class="d-flex align-center gap-2">
            <v-icon color="white">mdi-cog</v-icon>
            <span class="text-white">{{ $t('recipes.print_settings') }}</span>
          </div>
          <v-btn icon="mdi-close" variant="text" color="white" @click="settingsDialog = false" />
        </v-card-title>

        <v-card-text class="pa-6">
          <v-row dense>
            <!-- Logo Upload -->
            <v-col cols="12">
              <div class="text-subtitle-2 mb-2">{{ $t('recipes.clinic_logo') }}</div>
              <div class="d-flex align-center gap-4">
                <v-avatar size="80" :color="rxSettings.logo ? 'transparent' : 'primary'" rounded="lg" class="border">
                  <v-img v-if="rxSettings.logo" :src="rxSettings.logo" cover />
                  <v-icon v-else size="40" color="white">mdi-hospital-building</v-icon>
                </v-avatar>
                <div>
                  <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-upload" @click="$refs.logoInput.click()">
                    {{ $t('recipes.upload_logo') }}
                  </v-btn>
                  <v-btn v-if="rxSettings.logo" size="small" variant="text" color="error" class="ms-2" @click="rxSettings.logo = ''">
                    {{ $t('common.delete') }}
                  </v-btn>
                  <input ref="logoInput" type="file" accept="image/*" hidden @change="onLogoUpload" />
                </div>
              </div>
            </v-col>

            <!-- Clinic Name -->
            <v-col cols="12" class="mt-4">
              <v-text-field
                v-model="rxSettings.clinicName"
                :label="$t('recipes.clinic_name')"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-hospital-building"
              />
            </v-col>

            <!-- Clinic Slogan -->
            <v-col cols="12">
              <v-text-field
                v-model="rxSettings.slogan"
                :label="$t('recipes.clinic_slogan')"
                :placeholder="$t('recipes.clinic_slogan_placeholder')"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-text-short"
              />
            </v-col>

            <!-- Address -->
            <v-col cols="12">
              <v-text-field
                v-model="rxSettings.address"
                :label="$t('recipes.clinic_address')"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-map-marker"
              />
            </v-col>

            <!-- Phone -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="rxSettings.phone"
                :label="$t('recipes.clinic_phone')"
                variant="outlined"
                density="compact"
                prepend-inner-icon="mdi-phone"
                dir="ltr"
              />
            </v-col>

            <!-- Primary Color -->
            <v-col cols="12" md="6">
              <div class="text-subtitle-2 mb-2">{{ $t('recipes.primary_color') }}</div>
              <div class="d-flex gap-2 flex-wrap">
                <v-avatar
                  v-for="color in colorOptions"
                  :key="color"
                  size="36"
                  :color="color"
                  class="cursor-pointer"
                  :class="{ 'border-active': rxSettings.primaryColor === color }"
                  @click="rxSettings.primaryColor = color"
                >
                  <v-icon v-if="rxSettings.primaryColor === color" color="white" size="18">mdi-check</v-icon>
                </v-avatar>
              </div>
            </v-col>

            <!-- Footer Text -->
            <v-col cols="12">
              <v-textarea
                v-model="rxSettings.footerText"
                :label="$t('recipes.custom_footer')"
                variant="outlined"
                density="compact"
                rows="2"
                auto-grow
                prepend-inner-icon="mdi-text-box"
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-btn variant="text" color="error" @click="resetSettings">{{ $t('recipes.reset_defaults') }}</v-btn>
          <v-spacer />
          <v-btn variant="text" @click="settingsDialog = false">{{ $t('common.cancel') }}</v-btn>
          <v-btn variant="elevated" color="primary" @click="saveSettings">{{ $t('common.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Print Button Row -->
    <div v-if="visible" class="d-flex justify-center gap-2 mb-4">
      <v-btn color="grey" variant="tonal" prepend-icon="mdi-cog" @click="settingsDialog = true">
        {{ $t('recipes.print_settings') }}
      </v-btn>
      <v-btn color="success" size="large" prepend-icon="mdi-printer" @click="print">
        {{ $t('recipes.print') }}
      </v-btn>
    </div>

    <!-- Printable Content -->
    <div ref="printContent" class="print-content" :class="{ 'print-preview': visible }">
      <!-- Header -->
      <div class="rx-header">
        <div class="rx-header-top">
          <div class="rx-clinic-block">
            <div v-if="printLogo" class="rx-logo">
              <img :src="printLogo" alt="Logo" class="rx-logo-img" />
            </div>
            <div class="rx-clinic-info">
              <h1 class="rx-clinic-name">{{ printClinicName }}</h1>
              <p v-if="printSlogan" class="rx-slogan">{{ printSlogan }}</p>
              <div class="rx-contact-row">
                <span v-if="printAddress"><span class="rx-icon">📍</span> {{ printAddress }}</span>
                <span v-if="printPhone"><span class="rx-icon">📞</span> <span dir="ltr">{{ printPhone }}</span></span>
              </div>
            </div>
          </div>
        </div>
        <div class="rx-title-bar">
          <span class="rx-symbol">℞</span>
          <span class="rx-title-text">{{ $t('recipes.prescription') }}</span>
        </div>
      </div>

      <!-- Patient & Doctor Section -->
      <div class="rx-info-section" v-if="recipe">
        <div class="rx-info-grid">
          <div class="rx-info-cell">
            <span class="rx-info-label">{{ $t('recipes.patient') }}</span>
            <span class="rx-info-value">{{ recipe.patient?.name || '—' }}</span>
          </div>
          <div class="rx-info-cell">
            <span class="rx-info-label">{{ $t('recipes.doctor') }}</span>
            <span class="rx-info-value">{{ recipe.doctor?.name || '—' }}</span>
          </div>
          <div class="rx-info-cell">
            <span class="rx-info-label">{{ $t('recipes.phone') }}</span>
            <span class="rx-info-value" dir="ltr">{{ recipe.patient?.phone || '—' }}</span>
          </div>
          <div class="rx-info-cell">
            <span class="rx-info-label">{{ $t('recipes.date') }}</span>
            <span class="rx-info-value">{{ formatDate(recipe.created_at) }}</span>
          </div>
          <div v-if="recipe.patient?.age" class="rx-info-cell">
            <span class="rx-info-label">{{ $t('recipes.age') }}</span>
            <span class="rx-info-value">{{ recipe.patient.age }}</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="recipe?.notes" class="rx-notes">
        <strong>{{ $t('recipes.notes') }}:</strong> {{ recipe.notes }}
      </div>

      <!-- Medications Table -->
      <div class="rx-meds-section" v-if="medications.length">
        <table class="rx-meds-table">
          <thead>
            <tr>
              <th class="rx-th-num">#</th>
              <th class="rx-th-name">{{ $t('recipes.medication_name') }}</th>
              <th class="rx-th-detail">{{ $t('recipes.dosage') }}</th>
              <th class="rx-th-detail">{{ $t('recipes.frequency') }}</th>
              <th class="rx-th-detail">{{ $t('recipes.duration') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in medications" :key="idx">
              <td class="rx-td-num">{{ idx + 1 }}</td>
              <td class="rx-td-name">
                <span class="rx-pill-icon">💊</span>
                {{ item.medication_name }}
              </td>
              <td class="rx-td-detail">{{ item.dosage }}</td>
              <td class="rx-td-detail">{{ item.frequency }}</td>
              <td class="rx-td-detail">{{ item.duration }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!medications.length && recipe" class="rx-no-meds">
        {{ $t('recipes.no_medications') }}
      </div>

      <!-- Footer -->
      <div class="rx-footer">
        <div class="rx-signature">
          <div class="rx-sig-line"></div>
          <p class="rx-sig-label">{{ $t('recipes.doctor_signature') }}</p>
        </div>
        <div v-if="printFooterText" class="rx-footer-text">
          {{ printFooterText }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const SETTINGS_KEY = 'rx_print_settings'

const colorOptions = [
  '#1976d2', '#0d47a1', '#00695c', '#2e7d32',
  '#4527a0', '#c62828', '#37474f', '#000000'
]

const props = defineProps({
  recipe: { type: Object, default: null },
  clinicSettings: { type: Object, default: null },
  visible: { type: Boolean, default: false }
})

const { t, locale } = useI18n()
const printContent = ref(null)
const settingsDialog = ref(false)

// RX Print Settings (persisted in localStorage)
const rxSettings = ref({
  logo: '',
  clinicName: '',
  slogan: '',
  address: '',
  phone: '',
  primaryColor: '#1976d2',
  footerText: ''
})

onMounted(() => {
  loadSettings()
})

const loadSettings = () => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      Object.assign(rxSettings.value, parsed)
    }
  } catch { /* ignore */ }
}

const saveSettings = () => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(rxSettings.value))
  } catch { /* ignore */ }
  settingsDialog.value = false
}

const resetSettings = () => {
  rxSettings.value = {
    logo: '',
    clinicName: '',
    slogan: '',
    address: '',
    phone: '',
    primaryColor: '#1976d2',
    footerText: ''
  }
  localStorage.removeItem(SETTINGS_KEY)
}

const onLogoUpload = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    rxSettings.value.logo = e.target.result
  }
  reader.readAsDataURL(file)
}

// Computed print values (user settings override clinic settings)
const printClinicName = computed(() =>
  rxSettings.value.clinicName || props.clinicSettings?.name || props.clinicSettings?.clinic_name || 'Smart Clinic'
)
const printSlogan = computed(() => rxSettings.value.slogan || '')
const printAddress = computed(() =>
  rxSettings.value.address || props.clinicSettings?.address || props.clinicSettings?.clinic_address || ''
)
const printPhone = computed(() =>
  rxSettings.value.phone || props.clinicSettings?.phone || props.clinicSettings?.clinic_phone || ''
)
const printLogo = computed(() => {
  if (rxSettings.value.logo) return rxSettings.value.logo
  const logo = props.clinicSettings?.logo || props.clinicSettings?.clinic_logo
  if (!logo) return null
  if (logo.startsWith('http') || logo.startsWith('data:')) return logo
  return `${import.meta.env.VITE_API_URL || ''}/storage/${logo}`
})
const printFooterText = computed(() =>
  rxSettings.value.footerText || t('recipes.footer_note')
)
const printColor = computed(() => rxSettings.value.primaryColor || '#1976d2')
const isRtl = computed(() => locale.value === 'ar' || locale.value === 'ku')

// Normalize medications — support both snake_case and camelCase from API
const medications = computed(() => {
  if (!props.recipe) return []
  const items = props.recipe.recipe_items || props.recipe.recipeItems || props.recipe.items || []
  return Array.isArray(items) ? items : []
})

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const print = () => {
  if (!props.recipe) return

  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (!printWindow) {
    alert('Please allow popups for printing')
    return
  }

  const content = printContent.value?.innerHTML || ''
  const direction = isRtl.value ? 'rtl' : 'ltr'
  const fontFamily = isRtl.value ? "'Cairo', 'Tajawal', sans-serif" : "'Segoe UI', Tahoma, sans-serif"
  const color = printColor.value

  printWindow.document.write(`<!DOCTYPE html>
<html dir="${direction}">
<head>
  <meta charset="UTF-8">
  <title>${printClinicName.value} - ${props.recipe.patient?.name || ''}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${fontFamily};
      direction: ${direction};
      background: #fff;
      color: #222;
      line-height: 1.6;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-content { max-width: 780px; margin: 0 auto; padding: 24px 32px; }

    .rx-header { margin-bottom: 10px; }
    .rx-header-top {
      display: flex; align-items: center; justify-content: center;
      gap: 18px; padding-bottom: 10px;
    }
    .rx-clinic-block { display: flex; align-items: center; gap: 16px; }
    .rx-logo-img { width: 72px; height: 72px; object-fit: contain; border-radius: 10px; }
    .rx-clinic-info { text-align: ${isRtl.value ? 'right' : 'left'}; }
    .rx-clinic-name {
      font-size: 26px; font-weight: 800; color: ${color}; letter-spacing: .5px;
    }
    .rx-slogan { font-size: 12px; color: #666; margin-top: 1px; }
    .rx-contact-row {
      display: flex; gap: 20px; font-size: 11.5px; color: #555;
      margin-top: 4px; flex-wrap: wrap;
    }
    .rx-icon { margin-${isRtl.value ? 'left' : 'right'}: 3px; }

    .rx-title-bar {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      background: ${color}; color: #fff; padding: 6px 0;
      border-radius: 6px; margin-top: 6px;
    }
    .rx-symbol { font-size: 26px; font-weight: 700; font-style: italic; }
    .rx-title-text { font-size: 17px; font-weight: 700; letter-spacing: 1px; }

    .rx-info-section {
      border: 1.5px solid #ddd; border-radius: 8px;
      padding: 12px 16px; margin: 14px 0;
    }
    .rx-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
    .rx-info-cell { display: flex; align-items: baseline; gap: 6px; }
    .rx-info-label {
      font-size: 12px; font-weight: 700; color: ${color}; white-space: nowrap;
    }
    .rx-info-label::after { content: ':'; }
    .rx-info-value { font-size: 14px; color: #222; }

    .rx-notes {
      background: #fffbe6; border-${isRtl.value ? 'right' : 'left'}: 4px solid #ffc107;
      padding: 8px 14px; border-radius: 4px; font-size: 13px; margin-bottom: 14px;
    }

    .rx-meds-section { margin: 10px 0 20px; }
    .rx-meds-table {
      width: 100%; border-collapse: separate; border-spacing: 0;
      font-size: 13.5px; border: 1.5px solid ${color}40;
      border-radius: 8px; overflow: hidden;
    }
    .rx-meds-table thead tr { background: ${color}; color: #fff; }
    .rx-meds-table th {
      padding: 10px 12px; font-weight: 700;
      text-align: ${isRtl.value ? 'right' : 'left'};
      font-size: 12.5px; letter-spacing: .3px;
    }
    .rx-th-num { width: 36px; text-align: center !important; }
    .rx-th-name { min-width: 140px; }
    .rx-meds-table td {
      padding: 10px 12px; border-bottom: 1px solid #eee;
      text-align: ${isRtl.value ? 'right' : 'left'}; vertical-align: middle;
    }
    .rx-td-num { text-align: center !important; font-weight: 600; color: ${color}; }
    .rx-td-name { font-weight: 600; }
    .rx-td-detail { color: #444; }
    .rx-pill-icon { margin-${isRtl.value ? 'left' : 'right'}: 4px; }
    .rx-meds-table tbody tr:nth-child(even) { background: #f7f9fc; }
    .rx-meds-table tbody tr:last-child td { border-bottom: none; }

    .rx-no-meds { text-align: center; color: #999; padding: 30px; font-size: 14px; }

    .rx-footer { margin-top: 40px; padding-top: 16px; border-top: 1.5px dashed #ccc; }
    .rx-signature { text-align: ${isRtl.value ? 'left' : 'right'}; margin-bottom: 18px; }
    .rx-sig-line {
      width: 200px; border-bottom: 1.5px solid #333;
      margin-${isRtl.value ? 'right' : 'left'}: auto; margin-bottom: 4px;
    }
    .rx-sig-label { font-size: 11px; color: #777; }
    .rx-footer-text {
      text-align: center; font-size: 10.5px; color: #aaa;
      font-style: italic; line-height: 1.5;
    }

    @media print {
      body { padding: 0; }
      .print-content { padding: 0; max-width: none; }
      @page { margin: 12mm 15mm; size: A4; }
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`)

  printWindow.document.close()
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }
}

defineExpose({ print, openSettings: () => { settingsDialog.value = true } })
</script>

<style scoped>
.recipe-print-container { position: relative; }
.print-content { display: none; }
.print-content.print-preview {
  display: block;
  max-width: 780px;
  margin: 0 auto;
  padding: 24px 32px;
  border: 2px solid v-bind(printColor);
  border-radius: 14px;
  background: #fff;
}

.print-preview .rx-header { margin-bottom: 10px; }
.print-preview .rx-header-top {
  display: flex; align-items: center; justify-content: center; gap: 18px; padding-bottom: 10px;
}
.print-preview .rx-clinic-block { display: flex; align-items: center; gap: 16px; }
.print-preview .rx-logo-img { width: 72px; height: 72px; object-fit: contain; border-radius: 10px; }
.print-preview .rx-clinic-name { font-size: 26px; font-weight: 800; color: v-bind(printColor); }
.print-preview .rx-slogan { font-size: 12px; color: #666; margin-top: 1px; }
.print-preview .rx-contact-row { display: flex; gap: 20px; font-size: 11.5px; color: #555; margin-top: 4px; flex-wrap: wrap; }

.print-preview .rx-title-bar {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  background: v-bind(printColor); color: #fff; padding: 6px 0; border-radius: 6px; margin-top: 6px;
}
.print-preview .rx-symbol { font-size: 26px; font-weight: 700; font-style: italic; }
.print-preview .rx-title-text { font-size: 17px; font-weight: 700; letter-spacing: 1px; }

.print-preview .rx-info-section { border: 1.5px solid #ddd; border-radius: 8px; padding: 12px 16px; margin: 14px 0; }
.print-preview .rx-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
.print-preview .rx-info-cell { display: flex; align-items: baseline; gap: 6px; }
.print-preview .rx-info-label { font-size: 12px; font-weight: 700; color: v-bind(printColor); white-space: nowrap; }
.print-preview .rx-info-label::after { content: ':'; }
.print-preview .rx-info-value { font-size: 14px; color: #222; }

.print-preview .rx-notes {
  background: #fffbe6; border-inline-start: 4px solid #ffc107;
  padding: 8px 14px; border-radius: 4px; font-size: 13px; margin-bottom: 14px;
}

.print-preview .rx-meds-section { margin: 10px 0 20px; }
.print-preview .rx-meds-table {
  width: 100%; border-collapse: separate; border-spacing: 0;
  font-size: 13.5px; border: 1.5px solid color-mix(in srgb, v-bind(printColor) 25%, transparent);
  border-radius: 8px; overflow: hidden;
}
.print-preview .rx-meds-table thead tr { background: v-bind(printColor); color: #fff; }
.print-preview .rx-meds-table th { padding: 10px 12px; font-weight: 700; text-align: start; font-size: 12.5px; }
.print-preview .rx-th-num { width: 36px; text-align: center !important; }
.print-preview .rx-meds-table td { padding: 10px 12px; border-bottom: 1px solid #eee; text-align: start; vertical-align: middle; }
.print-preview .rx-td-num { text-align: center !important; font-weight: 600; color: v-bind(printColor); }
.print-preview .rx-td-name { font-weight: 600; }
.print-preview .rx-td-detail { color: #444; }
.print-preview .rx-pill-icon { margin-inline-end: 4px; }
.print-preview .rx-meds-table tbody tr:nth-child(even) { background: #f7f9fc; }
.print-preview .rx-meds-table tbody tr:last-child td { border-bottom: none; }
.print-preview .rx-no-meds { text-align: center; color: #999; padding: 30px; font-size: 14px; }

.print-preview .rx-footer { margin-top: 40px; padding-top: 16px; border-top: 1.5px dashed #ccc; }
.print-preview .rx-signature { text-align: end; margin-bottom: 18px; }
.print-preview .rx-sig-line { width: 200px; border-bottom: 1.5px solid #333; margin-inline-start: auto; margin-bottom: 4px; }
.print-preview .rx-sig-label { font-size: 11px; color: #777; }
.print-preview .rx-footer-text { text-align: center; font-size: 10.5px; color: #aaa; font-style: italic; }

.cursor-pointer { cursor: pointer; }
.border { border: 2px solid #e0e0e0 !important; }
.border-active { outline: 3px solid currentColor; outline-offset: 2px; }
</style>
