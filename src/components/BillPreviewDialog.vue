<template>
  <v-dialog v-model="internalDialog" max-width="600" scrollable>
    <v-card rounded="xl" class="bill-dialog">
      <!-- Header -->
      <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary">
        <span class="text-white text-h6">
          {{ $t('bill.title') }}
        </span>
        <v-btn
          icon="mdi-close"
          variant="text"
          color="white"
          @click="handleClose"
        />
      </v-card-title>

      <v-card-text class="pa-0">
        <!-- Bill Content for Print/Image -->
        <div ref="billContent" class="bill-content" :dir="$i18n.locale === 'ar' ? 'rtl' : 'ltr'">
          <!-- Clinic Header -->
          <div class="bill-header">
            <div class="clinic-info">
              <div class="clinic-logo">
                <img
                  v-if="clinicLogo"
                  :src="clinicLogo"
                  alt="Clinic Logo"
                  class="logo-img"
                />
                <div v-else class="logo-placeholder">
                  <v-icon size="48" color="primary">mdi-hospital-building</v-icon>
                </div>
              </div>
              <div class="clinic-details">
                <h1 class="clinic-name">{{ clinicName }}</h1>
                <p v-if="clinicAddress" class="clinic-address">
                  <v-icon size="14" class="me-1">mdi-map-marker</v-icon>
                  {{ clinicAddress }}
                </p>
                <p v-if="clinicPhone" class="clinic-phone">
                  <v-icon size="14" class="me-1">mdi-phone</v-icon>
                  {{ clinicPhone }}
                </p>
              </div>
            </div>
            <div class="bill-title-section">
              <div class="bill-title">{{ $t('bill.invoice') }}</div>
              <div class="bill-number">#{{ reservation?.patient?.id || '---' }}</div>
            </div>
          </div>

          <v-divider class="my-3" />

          <!-- Patient Info -->
          <div class="bill-info-section">
            <div class="info-row">
              <div class="info-item">
                <span class="info-label">{{ $t('bill.patient_name') }}:</span>
                <span class="info-value">{{ reservation?.patient?.name || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{ $t('bill.phone') }}:</span>
                <span class="info-value" dir="ltr">{{ reservation?.patient?.phone || '-' }}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <span class="info-label">{{ $t('bill.date') }}:</span>
                <span class="info-value" dir="ltr">{{ currentDate }}</span>
              </div>
            </div>
          </div>

          <v-divider class="my-3" />

          <!-- Bills Table -->
          <div class="services-section">
            <h3 class="section-title">{{ $t('bill.services') }}</h3>
            <table class="services-table">
              <thead>
                <tr>
                  <th>{{ $t('patients.bill_id') }}</th>
                  <th>{{ $t('patients.category') }}</th>
                  <th>{{ $t('bill.date') }}</th>
                  <th>{{ $t('bill.total') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(bill, index) in bills" :key="bill.id">
                  <td>{{ bill.id }}</td>
                  <td>{{ getBillCategoryName(bill) }}</td>
                  <td dir="ltr" style="text-align: right;">{{ formatDate(bill.created_at) }}</td>
                  <td dir="ltr" style="text-align: right;">{{ formatCurrency(bill.price) }}</td>
                </tr>
                <tr v-if="bills.length === 0">
                  <td colspan="4" class="text-center text-grey">
                    {{ $t('bill.no_services') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <v-divider class="my-3" />

          <!-- Total Section -->
          <div class="total-section">
            <div class="total-row grand-total">
              <span class="total-label">{{ $t('bill.total_amount') }}:</span>
              <span class="total-value" dir="ltr">{{ formatCurrency(totalAmount) }}</span>
            </div>
          </div>

          <!-- Footer -->
          <div class="bill-footer">
            <p class="footer-note">{{ $t('bill.thank_you') }}</p>
            <p class="footer-date">{{ currentDateTime }}</p>
          </div>
        </div>
      </v-card-text>

      <v-divider />

      <!-- Actions -->
      <v-card-actions class="pa-4 d-flex flex-wrap ga-2 justify-center action-buttons">
        <v-btn
          color="primary"
          variant="tonal"
          prepend-icon="mdi-printer"
          @click="printBill"
          :loading="printing"
        >
          {{ $t('bill.print') }}
        </v-btn>
        
        <v-btn
          color="success"
          variant="tonal"
          prepend-icon="mdi-image"
          @click="saveAsImage"
          :loading="savingImage"
        >
          {{ $t('bill.save_image') }}
        </v-btn>
        
        <v-btn
          color="teal"
          variant="flat"
          prepend-icon="mdi-whatsapp"
          @click.stop="shareViaWhatsApp"
          :loading="sharing"
          class="whatsapp-btn"
          elevation="2"
        >
          {{ $t('bill.share_whatsapp') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  reservation: {
    type: Object,
    default: null
  },
  clinicSettings: {
    type: Object,
    default: null
  },
  services: {
    type: Array,
    default: () => []
  },
  bills: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const { t, locale } = useI18n()

// Refs
const billContent = ref(null)
const printing = ref(false)
const savingImage = ref(false)
const sharing = ref(false)

// Internal dialog state
const internalDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Computed
const isRtl = computed(() => locale.value === 'ar' || locale.value === 'ku')

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

const totalAmount = computed(() => {
  return props.bills.reduce((sum, bill) => sum + (parseFloat(bill.price) || 0), 0)
})

const currentDate = computed(() => {
  const now = new Date()
  // Always use English format
  return now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const currentDateTime = computed(() => {
  const now = new Date()
  // Always use English format
  return now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

// Methods
const getBillCategoryName = (bill) => {
  if (!bill.billable?.category) return '-'
  
  const category = bill.billable.category
  if (locale.value === 'ar' && category.name_ar) {
    return category.name_ar
  } else if (locale.value === 'ku' && category.name_ku) {
    return category.name_ku
  }
  return category.name || category.name_en || '-'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  
  try {
    const date = new Date(dateStr)
    // Always use English format
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch (e) {
    return '-'
  }
}

const handleClose = () => {
  internalDialog.value = false
  emit('close')
}

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '-'
  // Always use English format for numbers
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0
  }).format(amount) + ' IQD'
}

// Generate bill HTML for printing
const generateBillHtml = () => {
  const content = billContent.value?.innerHTML || ''
  const direction = isRtl.value ? 'rtl' : 'ltr'
  const fontFamily = isRtl.value ? "'Cairo', 'Tajawal', sans-serif" : "'Segoe UI', Tahoma, sans-serif"
  
  return `
    <!DOCTYPE html>
    <html dir="${direction}">
    <head>
      <meta charset="UTF-8">
      <title>${t('bill.invoice')} #${props.reservation?.id || ''}</title>
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

        .bill-content {
          max-width: 600px;
          margin: 0 auto;
          padding: 30px;
          border: 2px solid #1976d2;
          border-radius: 12px;
        }

        .bill-header {
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
          width: 70px;
          height: 70px;
          object-fit: contain;
          border-radius: 8px;
        }

        .logo-placeholder {
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e3f2fd;
          border-radius: 8px;
        }

        .clinic-details {
          text-align: ${isRtl.value ? 'right' : 'left'};
        }

        .clinic-name {
          font-size: 20px;
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

        .bill-title-section {
          text-align: center;
          padding: 10px 20px;
          background: linear-gradient(135deg, #1976d2, #42a5f5);
          border-radius: 8px;
          color: white;
        }

        .bill-title {
          font-size: 16px;
          font-weight: 600;
        }

        .bill-number {
          font-size: 14px;
          opacity: 0.9;
        }

        .bill-info-section {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 15px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .info-row:last-child {
          margin-bottom: 0;
        }

        .info-item {
          flex: 1;
        }

        .info-label {
          font-weight: 600;
          color: #1976d2;
          margin-${isRtl.value ? 'left' : 'right'}: 8px;
        }

        .info-value {
          color: #333;
        }

        .services-section {
          margin: 15px 0;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #1976d2;
          margin-bottom: 10px;
        }

        .services-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .services-table th {
          background: #1976d2;
          color: white;
          padding: 10px 8px;
          text-align: ${isRtl.value ? 'right' : 'left'};
          font-weight: 600;
        }

        .services-table th:first-child {
          border-radius: ${isRtl.value ? '0 8px 0 0' : '8px 0 0 0'};
        }

        .services-table th:last-child {
          border-radius: ${isRtl.value ? '8px 0 0 0' : '0 8px 0 0'};
        }

        .services-table td {
          padding: 10px 8px;
          border-bottom: 1px solid #e0e0e0;
          text-align: ${isRtl.value ? 'right' : 'left'};
        }

        .services-table tr:nth-child(even) {
          background: #f8f8f8;
        }

        .total-section {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .total-row.grand-total {
          font-size: 18px;
          font-weight: 700;
          color: #1976d2;
          border-top: 2px solid #1976d2;
          padding-top: 10px;
          margin-top: 10px;
        }

        .payment-status-section {
          text-align: center;
          margin: 15px 0;
        }

        .payment-chip {
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          border-radius: 20px;
        }

        .bill-footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px dashed #ccc;
        }

        .footer-note {
          font-size: 14px;
          color: #1976d2;
          font-weight: 600;
        }

        .footer-date {
          font-size: 11px;
          color: #999;
          margin-top: 5px;
        }

        /* Hide action buttons when printing */
        .action-buttons {
          display: none !important;
        }

        @media print {
          body {
            padding: 0;
          }
          
          .bill-content {
            border: none;
            padding: 20px;
          }
          
          .action-buttons {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="bill-content">
        ${content}
      </div>
    </body>
    </html>
  `
}

// Print bill
const printBill = async () => {
  printing.value = true
  
  try {
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) {
      alert('Please allow popups for printing')
      return
    }

    printWindow.document.write(generateBillHtml())
    printWindow.document.close()
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
  } catch (error) {
    console.error('Print error:', error)
  } finally {
    printing.value = false
  }
}

// Save as image using dom-to-image-more (better Arabic support)
const saveAsImage = async () => {
  savingImage.value = true
  
  try {
    // Dynamically import dom-to-image-more
    const domtoimage = await import('dom-to-image-more')
    
    if (!billContent.value) return
    
    // Wait for fonts to load
    await document.fonts.ready
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const dataUrl = await domtoimage.toPng(billContent.value, {
      quality: 1,
      bgcolor: '#ffffff',
      style: {
        'font-family': 'Arial, Tahoma, sans-serif'
      }
    })
    
    // Download the image
    const link = document.createElement('a')
    link.download = `bill-${props.reservation?.id || 'receipt'}-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  } catch (error) {
    console.error('Save image error:', error)
    alert('Error saving image. Please try again.')
  } finally {
    savingImage.value = false
  }
}

// Share via WhatsApp
const shareViaWhatsApp = async () => {
  sharing.value = true
  
  try {
    // Get patient phone number
    const patientPhone = props.reservation?.patient?.phone
    
    if (!patientPhone) {
      alert(t('bill.no_phone_number') || 'رقم هاتف المراجع غير متوفر')
      sharing.value = false
      return
    }
    
    // Clean and format phone number for Iraq
    let cleanPhone = patientPhone.replace(/\D/g, '')
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1)
    }
    if (!cleanPhone.startsWith('964')) {
      cleanPhone = '964' + cleanPhone
    }
    
    // Convert bill to image using dom-to-image-more (better Arabic support)
    const domtoimage = await import('dom-to-image-more')
    
    // Wait for fonts to load
    await document.fonts.ready
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const dataUrl = await domtoimage.toPng(billContent.value, {
      quality: 1,
      bgcolor: '#ffffff',
      style: {
        'font-family': 'Arial, Tahoma, sans-serif'
      }
    })
    
    // Convert dataUrl to blob
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    
    // Try to copy image to clipboard (so user can paste in WhatsApp)
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ])
      console.log('Image copied to clipboard!')
    } catch (clipboardError) {
      console.log('Clipboard not supported, downloading instead:', clipboardError)
      // Fallback: download the image
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `فاتورة-${props.reservation?.patient?.name || 'bill'}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
    
    // Open WhatsApp with patient's number
    const whatsappUrl = `https://wa.me/${cleanPhone}`
    window.open(whatsappUrl, '_blank')
    
    // Show instruction to user
    alert(t('bill.paste_image_instruction') || 'تم نسخ صورة الفاتورة! افتح واتساب واضغط Ctrl+V للصق الصورة وإرسالها')
    
  } catch (error) {
    console.error('Share error:', error)
    alert(t('errors.shareFailed') || 'فشل في مشاركة الفاتورة')
  } finally {
    sharing.value = false
  }
}

// Generate share text message
const generateShareText = () => {
  const reservation = props.reservation
  
  return `
${t('bill.invoice')} #${reservation?.id || ''}
${clinicName.value}
---
${t('bill.patient_name')}: ${reservation?.patient?.name || '-'}
${t('bill.date')}: ${formatDate(reservation?.reservation_start_date)}
${t('bill.time')}: ${formatTime(reservation?.reservation_from_time)}
${t('bill.doctor')}: ${reservation?.doctor?.name || '-'}
---
${t('bill.total_amount')}: ${formatCurrency(totalAmount.value)}
${t('bill.status')}: ${isPaid.value ? t('bill.paid') : t('bill.unpaid')}
---
${t('bill.thank_you')}
  `.trim()
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');

.bill-dialog {
  font-family: 'Cairo', 'Arial', 'Helvetica Neue', 'Segoe UI', Tahoma, sans-serif;
}

.bill-content {
  padding: 24px;
  background: white;
  font-family: 'Cairo', 'Arial', 'Helvetica Neue', Tahoma, sans-serif !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.bill-content * {
  font-family: inherit !important;
}

/* RTL Support */
.bill-content[dir="rtl"] {
  text-align: right;
  font-family: 'Cairo', 'Arial', 'Tahoma', 'Helvetica Neue', sans-serif !important;
}

.bill-content[dir="rtl"] * {
  font-family: 'Cairo', 'Arial', 'Tahoma', 'Helvetica Neue', sans-serif !important;
}

.bill-content[dir="rtl"] .info-label,
.bill-content[dir="rtl"] .info-value,
.bill-content[dir="rtl"] .total-label,
.bill-content[dir="rtl"] .total-value {
  text-align: right;
}

.bill-content[dir="rtl"] .services-table th,
.bill-content[dir="rtl"] .services-table td {
  text-align: right;
}

.bill-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.clinic-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-img {
  width: 70px;
  height: 70px;
  object-fit: contain;
  border-radius: 8px;
}

.logo-placeholder {
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e3f2fd;
  border-radius: 8px;
}

.clinic-details {
  text-align: start;
}

.bill-content[dir="rtl"] .clinic-details {
  text-align: right;
}

.bill-content[dir="rtl"] .bill-title-section {
  text-align: center;
}

.clinic-name {
  font-size: 18px;
  font-weight: 700;
  color: #1976d2;
  margin-bottom: 4px;
}

.clinic-address,
.clinic-phone {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
}

.bill-title-section {
  text-align: center;
  padding: 12px 20px;
  background: linear-gradient(135deg, #1976d2, #42a5f5);
  border-radius: 8px;
  color: white;
}

.bill-title {
  font-size: 16px;
  font-weight: 600;
}

.bill-number {
  font-size: 14px;
  opacity: 0.9;
}

.bill-info-section {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-item {
  flex: 1;
  min-width: 150px;
}

.info-label {
  font-weight: 600;
  color: #1976d2;
  font-size: 13px;
}

.info-value {
  color: #333;
  font-size: 13px;
}

.services-section {
  margin: 16px 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1976d2;
  margin-bottom: 10px;
}

.services-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.services-table th {
  background: #1976d2;
  color: white;
  padding: 10px 8px;
  text-align: start;
  font-weight: 600;
}

.services-table th:first-child {
  border-radius: 8px 0 0 0;
}

[dir="rtl"] .services-table th:first-child {
  border-radius: 0 8px 0 0;
}

.services-table th:last-child {
  border-radius: 0 8px 0 0;
}

[dir="rtl"] .services-table th:last-child {
  border-radius: 8px 0 0 0;
}

.services-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #e0e0e0;
  text-align: start;
}

.services-table tr:nth-child(even) {
  background: #f8f8f8;
}

.total-section {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.total-row.grand-total {
  font-size: 16px;
  font-weight: 700;
  color: #1976d2;
  border-top: 2px solid #1976d2;
  padding-top: 10px;
  margin-top: 10px;
  margin-bottom: 0;
}

.payment-status-section {
  text-align: center;
  margin: 16px 0;
}

.payment-chip {
  font-weight: 600;
}

.bill-footer {
  text-align: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #ccc;
}

.footer-note {
  font-size: 14px;
  color: #1976d2;
  font-weight: 600;
}

.footer-date {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

/* Mobile responsive */
@media (max-width: 500px) {
  .bill-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .clinic-info {
    flex-direction: column;
    text-align: center;
  }
  
  .clinic-details {
    text-align: center;
  }
  
  .clinic-address,
  .clinic-phone {
    justify-content: center;
  }
  
  .info-row {
    flex-direction: column;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons .v-btn {
    width: 100%;
  }
}

/* Print styles */
@media print {
  .action-buttons {
    display: none !important;
  }
  
  .bill-content {
    border: none;
    padding: 10px;
  }
}

/* WhatsApp button fix - ensure click works properly */
.whatsapp-btn {
  position: relative;
  z-index: 10;
  cursor: pointer !important;
}

.whatsapp-btn:deep(.v-btn__overlay) {
  pointer-events: none;
}

.whatsapp-btn:deep(.v-btn__content) {
  pointer-events: auto;
}
</style>
