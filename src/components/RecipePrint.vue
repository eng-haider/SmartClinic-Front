<template>
  <div class="recipe-print-container">
    <!-- Print Button (shown inline when visible prop is true) -->
    <div v-if="visible" class="d-flex justify-center mb-4">
      <v-btn
        color="success"
        size="large"
        prepend-icon="mdi-printer"
        @click="print"
      >
        {{ $t('recipes.print') }}
      </v-btn>
    </div>

    <!-- Printable Content -->
    <div ref="printContent" class="print-content" :class="{ 'print-preview': visible }">
      <!-- Header with Clinic Info -->
      <div class="print-header">
        <div class="clinic-info">
          <!-- Clinic Logo -->
          <div class="clinic-logo">
            <img
              v-if="clinicLogo"
              :src="clinicLogo"
              alt="Clinic Logo"
              class="logo-img"
            />
            <div v-else class="logo-placeholder">
              <svg viewBox="0 0 100 100" class="medical-icon">
                <circle cx="50" cy="50" r="45" fill="#1976d2" />
                <rect x="45" y="20" width="10" height="60" fill="white" />
                <rect x="20" y="45" width="60" height="10" fill="white" />
              </svg>
            </div>
          </div>

          <!-- Clinic Details -->
          <div class="clinic-details">
            <h1 class="clinic-name">{{ clinicName }}</h1>
            <p v-if="clinicAddress" class="clinic-address">
              <span class="icon">📍</span> {{ clinicAddress }}
            </p>
            <p v-if="clinicPhone" class="clinic-phone">
              <span class="icon">📞</span> {{ clinicPhone }}
            </p>
          </div>
        </div>

        <div class="prescription-title">
          <h2>{{ $t('recipes.prescription') }}</h2>
          <div class="rx-symbol">℞</div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Patient & Doctor Info -->
      <div class="patient-doctor-info" v-if="recipe">
        <div class="info-row">
          <div class="info-item">
            <span class="label">{{ $t('recipes.patient') }}:</span>
            <span class="value">{{ recipe.patient?.name || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ $t('recipes.date') }}:</span>
            <span class="value">{{ formatDate(recipe.created_at) }}</span>
          </div>
        </div>
        <div class="info-row">
          <div class="info-item">
            <span class="label">{{ $t('recipes.phone') }}:</span>
            <span class="value" dir="ltr">{{ recipe.patient?.phone || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ $t('recipes.doctor') }}:</span>
            <span class="value">{{ recipe.doctor?.name || '-' }}</span>
          </div>
        </div>
        <div class="info-row" v-if="recipe.patient?.age">
          <div class="info-item">
            <span class="label">{{ $t('recipes.age') }}:</span>
            <span class="value">{{ recipe.patient?.age }} {{ $t('patients.years') }}</span>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Prescription Notes -->
      <div v-if="recipe?.notes" class="prescription-notes">
        <p><strong>{{ $t('recipes.notes') }}:</strong> {{ recipe.notes }}</p>
      </div>

      <!-- Medications Table -->
      <div class="medications-section" v-if="recipe?.recipe_items?.length">
        <table class="medications-table">
          <thead>
            <tr>
              <th class="num-col">#</th>
              <th class="name-col">{{ $t('recipes.medication_name') }}</th>
              <th class="dosage-col">{{ $t('recipes.dosage') }}</th>
              <th class="frequency-col">{{ $t('recipes.frequency') }}</th>
              <th class="duration-col">{{ $t('recipes.duration') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in recipe.recipe_items" :key="item.id || index">
              <td class="num-col">{{ index + 1 }}</td>
              <td class="name-col">
                <strong>{{ item.medication_name }}</strong>
              </td>
              <td class="dosage-col">{{ item.dosage }}</td>
              <td class="frequency-col">{{ item.frequency }}</td>
              <td class="duration-col">{{ item.duration }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div class="print-footer">
        <div class="signature-section">
          <div class="signature-line"></div>
          <p class="signature-label">{{ $t('recipes.doctor_signature') }}</p>
        </div>
        <div class="footer-note">
          <p>{{ $t('recipes.footer_note') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  recipe: {
    type: Object,
    default: null
  },
  clinicSettings: {
    type: Object,
    default: null
  },
  visible: {
    type: Boolean,
    default: false
  }
})

const { t, locale } = useI18n()
const printContent = ref(null)

// Computed
const clinicName = computed(() => {
  return props.clinicSettings?.name || 
         props.clinicSettings?.clinic_name || 
         'Smart Clinic'
})

const clinicAddress = computed(() => {
  return props.clinicSettings?.address || 
         props.clinicSettings?.clinic_address || 
         ''
})

const clinicPhone = computed(() => {
  return props.clinicSettings?.phone || 
         props.clinicSettings?.clinic_phone || 
         ''
})

const clinicLogo = computed(() => {
  const logo = props.clinicSettings?.logo || props.clinicSettings?.clinic_logo
  if (!logo) return null
  if (logo.startsWith('http')) return logo
  return `${import.meta.env.VITE_API_URL || ''}/storage/${logo}`
})

const isRtl = computed(() => locale.value === 'ar' || locale.value === 'ku')

// Methods
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

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="${direction}">
    <head>
      <meta charset="UTF-8">
      <title>${t('recipes.prescription')} - ${props.recipe.patient?.name || ''}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: ${fontFamily};
          direction: ${direction};
          padding: 20px;
          background: white;
          color: #333;
          line-height: 1.6;
        }

        .print-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 30px;
          border: 2px solid #1976d2;
          border-radius: 12px;
        }

        .print-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .clinic-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .clinic-logo {
          flex-shrink: 0;
        }

        .logo-img {
          width: 80px;
          height: 80px;
          object-fit: contain;
          border-radius: 8px;
        }

        .logo-placeholder {
          width: 80px;
          height: 80px;
        }

        .medical-icon {
          width: 100%;
          height: 100%;
        }

        .clinic-details {
          text-align: ${isRtl.value ? 'right' : 'left'};
        }

        .clinic-name {
          font-size: 24px;
          font-weight: 700;
          color: #1976d2;
          margin-bottom: 5px;
        }

        .clinic-address,
        .clinic-phone {
          font-size: 12px;
          color: #666;
          margin-bottom: 3px;
        }

        .icon {
          margin-${isRtl.value ? 'left' : 'right'}: 5px;
        }

        .prescription-title {
          text-align: center;
          padding: 10px 20px;
          background: linear-gradient(135deg, #1976d2, #42a5f5);
          border-radius: 8px;
          color: white;
        }

        .prescription-title h2 {
          font-size: 18px;
          margin-bottom: 5px;
        }

        .rx-symbol {
          font-size: 28px;
          font-weight: bold;
          font-style: italic;
        }

        .divider {
          height: 2px;
          background: linear-gradient(to right, #1976d2, #90caf9, #1976d2);
          margin: 20px 0;
          border-radius: 1px;
        }

        .patient-doctor-info {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .info-row:last-child {
          margin-bottom: 0;
        }

        .info-item {
          flex: 1;
        }

        .info-item .label {
          font-weight: 600;
          color: #1976d2;
          margin-${isRtl.value ? 'left' : 'right'}: 8px;
        }

        .info-item .value {
          color: #333;
        }

        .prescription-notes {
          background: #fff3e0;
          padding: 12px 15px;
          border-radius: 8px;
          border-left: 4px solid #ff9800;
          margin-bottom: 20px;
          font-size: 13px;
        }

        .medications-section {
          margin-bottom: 30px;
        }

        .medications-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .medications-table th {
          background: #1976d2;
          color: white;
          padding: 12px 10px;
          text-align: ${isRtl.value ? 'right' : 'left'};
          font-weight: 600;
        }

        .medications-table th:first-child {
          border-radius: ${isRtl.value ? '0 8px 0 0' : '8px 0 0 0'};
        }

        .medications-table th:last-child {
          border-radius: ${isRtl.value ? '8px 0 0 0' : '0 8px 0 0'};
        }

        .medications-table td {
          padding: 12px 10px;
          border-bottom: 1px solid #e0e0e0;
          text-align: ${isRtl.value ? 'right' : 'left'};
        }

        .medications-table tr:nth-child(even) {
          background: #f8f8f8;
        }

        .medications-table tr:hover {
          background: #e3f2fd;
        }

        .num-col {
          width: 40px;
          text-align: center !important;
        }

        .name-col {
          width: 30%;
        }

        .dosage-col,
        .frequency-col,
        .duration-col {
          width: 20%;
        }

        .print-footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px dashed #ccc;
        }

        .signature-section {
          text-align: ${isRtl.value ? 'left' : 'right'};
          margin-bottom: 20px;
        }

        .signature-line {
          width: 200px;
          height: 1px;
          background: #333;
          margin-${isRtl.value ? 'right' : 'left'}: auto;
          margin-bottom: 5px;
        }

        .signature-label {
          font-size: 12px;
          color: #666;
        }

        .footer-note {
          text-align: center;
          font-size: 11px;
          color: #999;
          font-style: italic;
        }

        @media print {
          body {
            padding: 0;
          }

          .print-content {
            border: none;
            padding: 0;
          }

          @page {
            margin: 15mm;
            size: A4;
          }
        }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `)

  printWindow.document.close()
  
  // Wait for fonts to load
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }
}

// Expose print method
defineExpose({ print })
</script>

<style scoped>
.recipe-print-container {
  position: relative;
}

.print-content {
  display: none;
}

.print-content.print-preview {
  display: block;
  max-width: 800px;
  margin: 0 auto;
  padding: 30px;
  border: 2px solid #1976d2;
  border-radius: 12px;
  background: white;
}

.print-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.clinic-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logo-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  border-radius: 8px;
}

.logo-placeholder {
  width: 80px;
  height: 80px;
}

.medical-icon {
  width: 100%;
  height: 100%;
}

.clinic-name {
  font-size: 24px;
  font-weight: 700;
  color: #1976d2;
  margin-bottom: 5px;
}

.clinic-address,
.clinic-phone {
  font-size: 12px;
  color: #666;
  margin-bottom: 3px;
}

.prescription-title {
  text-align: center;
  padding: 10px 20px;
  background: linear-gradient(135deg, #1976d2, #42a5f5);
  border-radius: 8px;
  color: white;
}

.prescription-title h2 {
  font-size: 18px;
  margin-bottom: 5px;
}

.rx-symbol {
  font-size: 28px;
  font-weight: bold;
  font-style: italic;
}

.divider {
  height: 2px;
  background: linear-gradient(to right, #1976d2, #90caf9, #1976d2);
  margin: 20px 0;
  border-radius: 1px;
}

.patient-doctor-info {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.info-item .label {
  font-weight: 600;
  color: #1976d2;
  margin-inline-end: 8px;
}

.prescription-notes {
  background: #fff3e0;
  padding: 12px 15px;
  border-radius: 8px;
  border-left: 4px solid #ff9800;
  margin-bottom: 20px;
  font-size: 13px;
}

.medications-table {
  width: 100%;
  border-collapse: collapse;
}

.medications-table th {
  background: #1976d2;
  color: white;
  padding: 12px 10px;
  text-align: start;
}

.medications-table td {
  padding: 12px 10px;
  border-bottom: 1px solid #e0e0e0;
}

.signature-section {
  text-align: end;
  margin-top: 40px;
}

.signature-line {
  width: 200px;
  height: 1px;
  background: #333;
  margin-inline-start: auto;
  margin-bottom: 5px;
}

.footer-note {
  text-align: center;
  font-size: 11px;
  color: #999;
  margin-top: 20px;
}
</style>
