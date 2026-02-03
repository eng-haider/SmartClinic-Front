<template>
  <v-dialog v-model="show" max-width="500" persistent>
    <v-card rounded="xl">
      <v-card-title class="d-flex justify-space-between align-center bg-primary pa-4">
        <div class="d-flex align-center">
          <v-icon class="me-2">mdi-qrcode-scan</v-icon>
          {{ $t('qrScanner.title') }}
        </div>
        <v-btn icon="mdi-close" variant="text" @click="closeScanner" />
      </v-card-title>

      <v-card-text class="pa-4">
        <!-- Scanner Status -->
        <v-alert
          v-if="statusMessage"
          :type="statusType"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="statusMessage = ''"
        >
          {{ statusMessage }}
        </v-alert>

        <!-- Video Container -->
        <div class="scanner-container">
          <video ref="videoElement" class="scanner-video"></video>
          
          <!-- Scanning Overlay -->
          <div v-if="isScanning" class="scanner-overlay">
            <div class="scan-region">
              <div class="corner top-left"></div>
              <div class="corner top-right"></div>
              <div class="corner bottom-left"></div>
              <div class="corner bottom-right"></div>
            </div>
            <div class="scan-line"></div>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="scanner-loading">
            <v-progress-circular indeterminate color="primary" size="64" />
            <p class="mt-4">{{ $t('qrScanner.initializing') }}</p>
          </div>
        </div>

        <!-- Instructions -->
        <div class="mt-4 text-center text-caption text-grey">
          <v-icon size="small" class="me-1">mdi-information-outline</v-icon>
          {{ $t('qrScanner.instruction') }}
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          color="grey"
          variant="text"
          @click="closeScanner"
        >
          {{ $t('common.cancel') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { patientService } from '@/services/patient.service'
import QrScanner from 'qr-scanner'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'scan-success', 'scan-error'])

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const show = ref(props.modelValue)
const videoElement = ref(null)
const isScanning = ref(false)
const isLoading = ref(false)
const statusMessage = ref('')
const statusType = ref('info')

let qrScanner = null

// Watch for dialog open/close
watch(() => props.modelValue, (newVal) => {
  show.value = newVal
  if (newVal) {
    startScanner()
  } else {
    stopScanner()
  }
})

watch(show, (newVal) => {
  emit('update:modelValue', newVal)
})

const startScanner = async () => {
  isLoading.value = true
  statusMessage.value = ''

  try {
    await nextTick()

    if (!videoElement.value) {
      throw new Error('Video element not found')
    }

    // Create QR Scanner instance
    qrScanner = new QrScanner(
      videoElement.value,
      result => handleScanSuccess(result),
      {
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    )

    // Start scanning
    await qrScanner.start()
    isScanning.value = true
    isLoading.value = false
  } catch (error) {
    console.error('QR Scanner error:', error)
    isLoading.value = false
    
    if (error.name === 'NotAllowedError') {
      statusMessage.value = t('qrScanner.cameraPermissionDenied')
      statusType.value = 'error'
    } else if (error.name === 'NotFoundError') {
      statusMessage.value = t('qrScanner.noCameraFound')
      statusType.value = 'error'
    } else {
      statusMessage.value = t('qrScanner.initError')
      statusType.value = 'error'
    }
    
    emit('scan-error', error)
  }
}

const stopScanner = () => {
  if (qrScanner) {
    qrScanner.stop()
    qrScanner.destroy()
    qrScanner = null
  }
  isScanning.value = false
  isLoading.value = false
}

const handleScanSuccess = async (result) => {
  const scannedData = result.data
  console.log('QR Code scanned:', scannedData)
  console.log('Auth status:', authStore.isAuthenticated)
  console.log('User:', authStore.user)
  console.log('Token:', authStore.token)

  // Check if it's a patient profile URL
  const urlMatch = scannedData.match(/\/public\/patient\/([a-zA-Z0-9-_]+)/)
  
  if (urlMatch && urlMatch[1]) {
    const token = urlMatch[1]
    console.log('Extracted token:', token)
    
    statusMessage.value = t('qrScanner.success')
    statusType.value = 'success'
    
    emit('scan-success', { token, url: scannedData })
    
    // If user is authenticated, get patient ID from token and navigate to internal page
    if (authStore.isAuthenticated) {
      console.log('User is authenticated, fetching patient data...')
      
      // Show loading state
      isLoading.value = true
      statusMessage.value = t('common.loading')
      statusType.value = 'info'
      
      try {
        // Fetch patient data using the token to get the patient ID
        const response = await patientService.getPublicPatientByToken(token)
        const patientData = response.data || response
        console.log('Patient data received:', patientData)
        
        if (patientData && patientData.id) {
          console.log('Navigating to internal patient page:', `/patients/${patientData.id}`)
          
          statusMessage.value = t('qrScanner.redirecting')
          statusType.value = 'success'
          
          // Navigate to internal patient detail page using path
          setTimeout(() => {
            closeScanner()
            router.push(`/patients/${patientData.id}`)
          }, 300)
          return
        } else {
          console.log('No patient ID found in response')
        }
      } catch (error) {
        console.error('Failed to fetch patient data from token:', error)
        console.error('Error details:', error.response)
        statusMessage.value = t('qrScanner.scanError')
        statusType.value = 'error'
        isLoading.value = false
        // Fall through to public profile if error occurs
      }
      
      isLoading.value = false
    } else {
      console.log('User is NOT authenticated, going to public profile')
    }
    
    // For non-authenticated users or if error occurred, navigate to public profile
    console.log('Navigating to public profile')
    setTimeout(() => {
      closeScanner()
      router.push({ name: 'PublicPatientProfile', params: { token } })
    }, 500)
  } else {
    console.log('Invalid QR code format:', scannedData)
    statusMessage.value = t('qrScanner.invalidQr')
    statusType.value = 'warning'
    emit('scan-error', new Error('Invalid QR code'))
  }
}

const closeScanner = () => {
  stopScanner()
  show.value = false
}
</script>

<style scoped>
.scanner-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
}

.scanner-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.scan-region {
  position: relative;
  width: 250px;
  height: 250px;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border-color: #fff;
  border-style: solid;
}

.corner.top-left {
  top: -2px;
  left: -2px;
  border-width: 3px 0 0 3px;
}

.corner.top-right {
  top: -2px;
  right: -2px;
  border-width: 3px 3px 0 0;
}

.corner.bottom-left {
  bottom: -2px;
  left: -2px;
  border-width: 0 0 3px 3px;
}

.corner.bottom-right {
  bottom: -2px;
  right: -2px;
  border-width: 0 3px 3px 0;
}

.scan-line {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 250px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #4CAF50, transparent);
  animation: scan 2s ease-in-out infinite;
}

@keyframes scan {
  0%, 100% {
    transform: translate(-50%, -125px);
  }
  50% {
    transform: translate(-50%, 125px);
  }
}

.scanner-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  color: white;
}
</style>
