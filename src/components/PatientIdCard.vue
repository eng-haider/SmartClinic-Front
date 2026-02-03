<template>
  <v-dialog v-model="internalDialog" max-width="500" scrollable>
    <v-card rounded="xl" class="patient-id-card-dialog">
      <!-- Header -->
      <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary">
        <span class="text-white text-h6">
          {{ $t('patientIdCard.title') }}
        </span>
        <v-btn
          icon="mdi-close"
          variant="text"
          color="white"
          @click="handleClose"
        />
      </v-card-title>

      <v-card-text class="pa-4 d-flex flex-column align-center">
        <!-- Loading State -->
        <div v-if="isLoading" class="d-flex flex-column align-center pa-8">
          <v-progress-circular indeterminate color="primary" size="48" />
          <p class="mt-4 text-grey">{{ $t('common.loading') }}</p>
        </div>

        <!-- Error State -->
        <v-alert
          v-else-if="errorMessage"
          type="error"
          variant="tonal"
          class="mb-4 w-100"
        >
          {{ errorMessage }}
        </v-alert>

        <!-- ID Card Preview -->
        <div v-else class="card-preview-container">
          <div 
            ref="idCardRef"
            class="id-card"
            :dir="isRtl ? 'rtl' : 'ltr'"
          >
            <!-- Clinic Name -->
            <div class="clinic-name">{{ clinicName }}</div>
            
            <!-- Patient Name -->
            <div class="patient-name">{{ patientName }}</div>
            
            <!-- QR Code -->
            <div class="qr-container">
              <canvas ref="qrCanvasRef" class="qr-code"></canvas>
              <div class="qr-text">{{ $t('patientIdCard.scanToView') }}</div>
            </div>
          </div>

          <!-- Card Info -->
          <p class="text-caption text-grey mt-3 text-center">
            {{ $t('patientIdCard.cardSize') }}: 85.6mm × 54mm
          </p>
        </div>
      </v-card-text>

      <v-divider />

      <!-- Actions -->
      <v-card-actions class="pa-4 d-flex flex-wrap ga-2 justify-center action-buttons">
        <v-btn
          color="primary"
          variant="tonal"
          prepend-icon="mdi-printer"
          @click="handlePrint"
          :loading="isPrinting"
          :disabled="isProcessing || !isReady"
        >
          {{ $t('patientIdCard.print') }}
        </v-btn>
        
        <v-btn
          color="success"
          variant="tonal"
          prepend-icon="mdi-download"
          @click="handleDownload"
          :loading="isDownloading"
          :disabled="isProcessing || !isReady"
        >
          {{ $t('patientIdCard.download') }}
        </v-btn>
        
        <v-btn
          color="teal"
          variant="flat"
          prepend-icon="mdi-whatsapp"
          @click="handleWhatsApp"
          :loading="isSendingWhatsApp"
          :disabled="isProcessing || !isReady || !hasPhone"
          class="whatsapp-btn"
          elevation="2"
        >
          {{ $t('patientIdCard.sendWhatsApp') }}
        </v-btn>
      </v-card-actions>

      <!-- Phone Warning -->
      <div v-if="!hasPhone && isReady" class="pa-2 text-center">
        <v-chip color="warning" size="small" prepend-icon="mdi-alert">
          {{ $t('patientIdCard.noPhoneWarning') }}
        </v-chip>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCardImageExport } from '@/composables/useCardImageExport'
import { useWhatsAppSender } from '@/composables/useWhatsAppSender'
import { patientService } from '@/services/patient.service'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  patient: {
    type: Object,
    required: true
  },
  clinicSettings: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'close', 'error'])

const { t, locale } = useI18n()

// Composables
const { 
  elementToDataUrl, 
  downloadAsImage, 
  printElement, 
  isExporting, 
  isPrinting: isPrintingExport 
} = useCardImageExport()

const { 
  sendViaClipboard, 
  isSending: isSendingWhatsApp,
  isValidPhone 
} = useWhatsAppSender()

// Refs
const idCardRef = ref(null)
const qrCanvasRef = ref(null)
const isLoading = ref(false)
const isDownloading = ref(false)
const isPrinting = ref(false)
const errorMessage = ref(null)
const qrCodeContent = ref(null)
const isQrGenerated = ref(false)

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

const patientName = computed(() => {
  return props.patient?.name || '-'
})

const patientPhone = computed(() => {
  return props.patient?.phone || null
})

const hasPhone = computed(() => {
  return isValidPhone(patientPhone.value)
})

const isReady = computed(() => {
  return !isLoading.value && !errorMessage.value && isQrGenerated.value
})

const isProcessing = computed(() => {
  return isExporting.value || 
         isPrintingExport.value || 
         isDownloading.value || 
         isPrinting.value || 
         isSendingWhatsApp.value
})

// Methods
const handleClose = () => {
  internalDialog.value = false
  emit('close')
}

/**
 * Fetch public profile data and generate QR code
 */
const initializeCard = async () => {
  if (!props.patient?.id) {
    errorMessage.value = t('patientIdCard.errors.noPatient')
    return
  }

  isLoading.value = true
  errorMessage.value = null
  isQrGenerated.value = false

  try {
    // Get public profile settings
    let profileData = null
    
    try {
      const response = await patientService.getPublicProfile(props.patient.id)
      profileData = response.data || response
      console.log('Public profile response:', profileData)
    } catch (err) {
      console.log('Failed to get profile, trying to enable:', err)
      // If profile doesn't exist or is disabled, try to enable it
      if (err.response?.status === 400 || err.response?.status === 404) {
        try {
          const enableResponse = await patientService.enablePublicProfile(props.patient.id)
          profileData = enableResponse.data || enableResponse
          console.log('Profile enabled:', profileData)
        } catch (enableErr) {
          console.error('Failed to enable profile:', enableErr)
          // Don't throw - use fallback instead
          profileData = null
        }
      } else {
        console.error('API error:', err)
        // Don't throw - use fallback instead
        profileData = null
      }
    }

    // Extract QR code content from response
    // IMPORTANT: QR code should point to FRONTEND app, not API
    const frontendBaseUrl = window.location.origin // e.g., https://app.smartclinic.software
    
    if (profileData?.public_token) {
      // Use frontend URL with token
      qrCodeContent.value = `${frontendBaseUrl}/public/patient/${profileData.public_token}`
    } else if (profileData?.qr_code_content) {
      // If backend provides a custom URL, use it
      qrCodeContent.value = profileData.qr_code_content
    } else if (profileData?.public_profile_url) {
      // Replace API URL with frontend URL if needed
      const token = profileData.public_profile_url.split('/').pop()
      qrCodeContent.value = `${frontendBaseUrl}/public/patient/${token}`
    } else {
      // Fallback: use patient ID (for development/testing)
      console.warn('No QR content in response, using fallback URL')
      qrCodeContent.value = `${frontendBaseUrl}/public/patient/patient-${props.patient.id}`
    }

    console.log('QR Code Content:', qrCodeContent.value)

    // Stop loading to render the card
    isLoading.value = false
    
    // Wait for DOM to be fully ready
    await nextTick()
    
    // Wait for canvas element to be available
    let attempts = 0
    while (!qrCanvasRef.value && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
      console.log(`Waiting for canvas ref... attempt ${attempts}`)
    }
    
    if (!qrCanvasRef.value) {
      throw new Error('Canvas element not available after waiting')
    }
    
    await generateQrCode()
    
    isQrGenerated.value = true
  } catch (err) {
    console.error('Failed to initialize card:', err)
    errorMessage.value = t('patientIdCard.errors.fetchFailed') + ': ' + err.message
    emit('error', err)
    isLoading.value = false
  }
}

/**
 * Generate QR code on canvas
 */
const generateQrCode = async () => {
  if (!qrCanvasRef.value) {
    console.error('QR canvas ref not available')
    return
  }
  
  if (!qrCodeContent.value) {
    console.error('QR code content not available')
    return
  }

  try {
    console.log('Generating QR code for:', qrCodeContent.value)
    
    // Dynamically import QRCode library
    const QRCode = (await import('qrcode')).default
    
    console.log('QRCode library loaded:', QRCode)

    await QRCode.toCanvas(qrCanvasRef.value, qrCodeContent.value, {
      width: 100,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
    
    console.log('QR code generated successfully')
  } catch (err) {
    console.error('QR code generation failed:', err)
    errorMessage.value = 'Failed to generate QR code: ' + err.message
    throw new Error('QR_GENERATION_FAILED')
  }
}

/**
 * Handle print action
 */
const handlePrint = async () => {
  if (!idCardRef.value) return

  isPrinting.value = true

  try {
    await printElement(idCardRef.value, {
      title: `${t('patientIdCard.title')} - ${patientName.value}`,
      isRtl: isRtl.value
    })
  } catch (err) {
    console.error('Print failed:', err)
    if (err.message === 'POPUP_BLOCKED') {
      alert(t('patientIdCard.errors.popupBlocked'))
    } else {
      alert(t('patientIdCard.errors.printFailed'))
    }
  } finally {
    isPrinting.value = false
  }
}

/**
 * Handle download action
 */
const handleDownload = async () => {
  if (!idCardRef.value) return

  isDownloading.value = true

  try {
    const filename = `patient-card-${props.patient.id}-${Date.now()}.png`
    await downloadAsImage(idCardRef.value, filename, { scale: 3 })
  } catch (err) {
    console.error('Download failed:', err)
    alert(t('patientIdCard.errors.downloadFailed'))
  } finally {
    isDownloading.value = false
  }
}

/**
 * Handle WhatsApp send action
 */
const handleWhatsApp = async () => {
  if (!idCardRef.value || !hasPhone.value) return

  try {
    // Convert card to image
    const dataUrl = await elementToDataUrl(idCardRef.value, { scale: 3 })

    // Send via clipboard method (same as bills)
    await sendViaClipboard({
      dataUrl,
      phone: patientPhone.value,
      message: '',
      filename: `بطاقة-${patientName.value}.png`
    })

    // Show instruction to user
    alert(t('patientIdCard.pasteInstruction'))
  } catch (err) {
    console.error('WhatsApp send failed:', err)
    if (err.message === 'NO_PHONE') {
      alert(t('patientIdCard.noPhoneWarning'))
    } else {
      alert(t('patientIdCard.errors.shareFailed'))
    }
  }
}

// Watchers
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    initializeCard()
  } else {
    // Reset state when dialog closes
    errorMessage.value = null
    qrCodeContent.value = null
    isQrGenerated.value = false
  }
})

// Initialize if dialog is already open
onMounted(() => {
  if (props.modelValue) {
    initializeCard()
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');

.patient-id-card-dialog {
  font-family: 'Cairo', 'Arial', 'Helvetica Neue', 'Segoe UI', Tahoma, sans-serif;
}

.card-preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

/* ID Card - Exact credit card size */
.id-card {
  width: 85.6mm;
  height: 54mm;
  padding: 4mm;
  background: white;
  border: 0.5mm solid #e0e0e0;
  border-radius: 2mm;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-family: 'Cairo', 'Arial', 'Helvetica Neue', sans-serif;
  box-sizing: border-box;
}

/* Clinic Name */
.clinic-name {
  font-size: 4mm;
  font-weight: 700;
  color: #1976d2;
  text-align: center;
  line-height: 1.2;
  max-width: 100%;
  word-wrap: break-word;
}

/* Patient Name */
.patient-name {
  font-size: 3.5mm;
  font-weight: 600;
  color: #333;
  text-align: center;
  line-height: 1.3;
  max-width: 77mm;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}

/* QR Code Container */
.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-code {
  width: 25mm !important;
  height: 25mm !important;
}

.qr-text {
  font-size: 2mm;
  color: #666;
  text-align: center;
  margin-top: 1mm;
}

/* RTL Support */
.id-card[dir="rtl"] {
  font-family: 'Cairo', 'Tajawal', 'Arial', sans-serif;
}

.id-card[dir="rtl"] .clinic-name,
.id-card[dir="rtl"] .patient-name,
.id-card[dir="rtl"] .qr-text {
  font-family: 'Cairo', 'Tajawal', 'Arial', sans-serif;
}

/* WhatsApp Button */
.whatsapp-btn {
  background: linear-gradient(135deg, #25D366, #128C7E) !important;
  color: white !important;
}

.whatsapp-btn:disabled {
  opacity: 0.6;
}

/* Print Styles */
@media print {
  .action-buttons,
  .v-card-title,
  .v-divider {
    display: none !important;
  }

  .patient-id-card-dialog {
    box-shadow: none !important;
    border: none !important;
  }

  .id-card {
    box-shadow: none;
    border: 0.5mm solid #e0e0e0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  @page {
    size: 85.6mm 54mm;
    margin: 0;
  }
}
</style>
