<template>
  <div class="public-patient-profile">
    <!-- Loading State -->
    <v-container v-if="loading" class="fill-height">
      <v-row align="center" justify="center">
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate color="primary" size="64" />
          <p class="mt-4 text-h6">{{ $t('common.loading') }}</p>
        </v-col>
      </v-row>
    </v-container>

    <!-- Error State -->
    <v-container v-else-if="error">
      <v-row justify="center">
        <v-col cols="12" md="6">
          <v-card rounded="xl" class="pa-8 text-center">
            <v-icon size="80" color="error">mdi-alert-circle</v-icon>
            <h2 class="text-h5 mt-4">{{ $t('publicProfile.notFound') }}</h2>
            <p class="text-grey mt-2">{{ error }}</p>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Patient Profile Content -->
    <v-container v-else class="py-8">
      <v-row justify="center">
        <v-col cols="12" lg="10" xl="8">
          <!-- Header Card -->
          <v-card rounded="xl" class="mb-6" elevation="3">
            <v-card-text class="pa-6">
              <!-- Clinic Info -->
              <div class="d-flex align-center ga-4 mb-6">
                <v-avatar color="primary" size="60">
                  <v-icon size="32">mdi-hospital-building</v-icon>
                </v-avatar>
                <div>
                  <h1 class="text-h5 font-weight-bold text-primary">
                    {{ patientData.clinic?.name || 'Smart Clinic' }}
                  </h1>
                  <p v-if="patientData.clinic?.address" class="text-grey">
                    <v-icon size="14">mdi-map-marker</v-icon>
                    {{ patientData.clinic.address }}
                  </p>
                  <p v-if="patientData.clinic?.phone" class="text-grey">
                    <v-icon size="14">mdi-phone</v-icon>
                    {{ patientData.clinic.phone }}
                  </p>
                </div>
              </div>

              <v-divider class="my-4" />

              <!-- Patient Info -->
              <div class="patient-info">
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <v-icon color="primary" class="me-2">mdi-account</v-icon>
                      <span class="text-h6 font-weight-medium">{{ patientData.name }}</span>
                    </div>
                  </v-col>
                  <v-col cols="6" md="3">
                    <div class="info-item">
                      <span class="text-caption text-grey">{{ $t('publicProfile.age') }}</span>
                      <span class="text-body-1">{{ patientData.age }} {{ $t('publicProfile.years') }}</span>
                    </div>
                  </v-col>
                  <v-col cols="6" md="3">
                    <div class="info-item">
                      <span class="text-caption text-grey">{{ $t('publicProfile.gender') }}</span>
                      <v-chip size="small" :color="patientData.sex === 1 ? 'blue' : 'pink'">
                        {{ patientData.sex_label }}
                      </v-chip>
                    </div>
                  </v-col>
                </v-row>

                <v-row v-if="patientData.systemic_conditions" class="mt-2">
                  <v-col cols="12">
                    <v-alert type="info" variant="tonal" density="compact">
                      <strong>{{ $t('publicProfile.systemicConditions') }}:</strong>
                      {{ patientData.systemic_conditions }}
                    </v-alert>
                  </v-col>
                </v-row>
              </div>
            </v-card-text>
          </v-card>

          <!-- Stats Cards -->
          <v-row class="mb-6">
            <v-col cols="6" md="3">
              <v-card rounded="lg" color="primary" variant="tonal">
                <v-card-text class="text-center pa-4">
                  <v-icon size="32" color="primary">mdi-clipboard-text</v-icon>
                  <div class="text-h5 font-weight-bold mt-2">{{ patientData.cases_count || 0 }}</div>
                  <div class="text-caption">{{ $t('publicProfile.totalCases') }}</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6" md="3">
              <v-card rounded="lg" color="success" variant="tonal">
                <v-card-text class="text-center pa-4">
                  <v-icon size="32" color="success">mdi-image</v-icon>
                  <div class="text-h5 font-weight-bold mt-2">{{ patientData.images_count || 0 }}</div>
                  <div class="text-caption">{{ $t('publicProfile.images') }}</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6" md="3">
              <v-card rounded="lg" color="info" variant="tonal">
                <v-card-text class="text-center pa-4">
                  <v-icon size="32" color="info">mdi-calendar</v-icon>
                  <div class="text-h5 font-weight-bold mt-2">{{ patientData.upcoming_reservations?.length || 0 }}</div>
                  <div class="text-caption">{{ $t('publicProfile.appointments') }}</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6" md="3">
              <v-card rounded="lg" color="purple" variant="tonal">
                <v-card-text class="text-center pa-4">
                  <v-icon size="32" color="purple">mdi-account-clock</v-icon>
                  <div class="text-caption font-weight-bold mt-2">{{ $t('publicProfile.memberSince') }}</div>
                  <div class="text-body-2">{{ formatDate(patientData.member_since) }}</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Teeth Chart -->
          <v-card v-if="patientData.tooth_details && patientData.tooth_details.length > 0" rounded="xl" class="mb-6" elevation="2">
            <v-card-title class="bg-purple pa-4">
              <v-icon class="me-2">mdi-tooth</v-icon>
              {{ $t('publicProfile.dentalChart') }}
            </v-card-title>
            <v-card-text class="pa-4">
              <TeethChart
                :patient-data="{ tooth_details: patientData.tooth_details }"
                :show-color-picker="false"
                :patient-cases="[]"
                :categories="[]"
              />
              
              <!-- Color Legend -->
              <div class="color-legend mt-4">
                <div class="legend-title text-subtitle-2 mb-2">
                  <v-icon size="18" class="me-1">mdi-palette</v-icon>
                  {{ $t('publicProfile.colorLegend') }}
                </div>
                <div class="colors-grid">
                  <div 
                    v-for="color in uniqueColors" 
                    :key="color.color"
                    class="color-item"
                  >
                    <span 
                      class="color-dot" 
                      :style="{ backgroundColor: color.color }"
                    ></span>
                    <span class="color-name">{{ color.name }}</span>
                    <span class="color-count">({{ color.count }})</span>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- Medical Cases -->
          <v-card rounded="xl" class="mb-6" elevation="2">
            <v-card-title class="bg-primary pa-4">
              <v-icon class="me-2">mdi-clipboard-text</v-icon>
              {{ $t('publicProfile.medicalCases') }}
            </v-card-title>
            <v-card-text class="pa-0">
              <v-list v-if="patientData.cases && patientData.cases.length > 0">
                <v-list-item
                  v-for="(caseItem, index) in patientData.cases"
                  :key="caseItem.id"
                  :class="{ 'bg-grey-lighten-4': index % 2 === 0 }"
                >
                  <template v-slot:prepend>
                    <v-avatar :color="caseItem.status?.color || 'grey'">
                      <v-icon color="white">mdi-tooth</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="font-weight-medium">
                    {{ getCategoryName(caseItem.category) }}
                    <v-chip v-if="caseItem.tooth_num" size="x-small" class="ms-2">
                      {{ $t('publicProfile.tooth') }} {{ caseItem.tooth_num }}
                    </v-chip>
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ caseItem.notes || $t('publicProfile.noNotes') }}
                  </v-list-item-subtitle>
                  <template v-slot:append>
                    <div class="text-end">
                      <v-chip
                        :color="caseItem.status?.color || 'grey'"
                        size="small"
                        variant="tonal"
                      >
                        {{ getStatusName(caseItem.status) }}
                      </v-chip>
                      <div class="text-caption text-grey mt-1">
                        {{ formatDate(caseItem.created_at) }}
                      </div>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
              <div v-else class="pa-8 text-center text-grey">
                <v-icon size="48">mdi-clipboard-text-off</v-icon>
                <p class="mt-2">{{ $t('publicProfile.noCases') }}</p>
              </div>
            </v-card-text>
          </v-card>

          <!-- Medical Images -->
          <v-card v-if="patientData.images && patientData.images.length > 0" rounded="xl" class="mb-6" elevation="2">
            <v-card-title class="bg-success pa-4">
              <v-icon class="me-2">mdi-image</v-icon>
              {{ $t('publicProfile.medicalImages') }}
            </v-card-title>
            <v-card-text class="pa-4">
              <v-row>
                <v-col
                  v-for="image in patientData.images"
                  :key="image.id"
                  cols="6"
                  md="4"
                  lg="3"
                >
                  <v-card rounded="lg" @click="viewImage(image)">
                    <v-img
                      :src="image.url"
                      :alt="image.alt_text || 'Medical image'"
                      aspect-ratio="1"
                      cover
                      class="cursor-pointer"
                    >
                      <template v-slot:placeholder>
                        <div class="d-flex align-center justify-center fill-height">
                          <v-progress-circular indeterminate color="primary" />
                        </div>
                      </template>
                    </v-img>
                    <v-card-subtitle class="text-caption pa-2">
                      {{ formatDate(image.created_at) }}
                    </v-card-subtitle>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Upcoming Appointments -->
          <v-card v-if="patientData.upcoming_reservations && patientData.upcoming_reservations.length > 0" rounded="xl" elevation="2">
            <v-card-title class="bg-info pa-4">
              <v-icon class="me-2">mdi-calendar-clock</v-icon>
              {{ $t('publicProfile.upcomingAppointments') }}
            </v-card-title>
            <v-card-text class="pa-0">
              <v-list>
                <v-list-item
                  v-for="reservation in patientData.upcoming_reservations"
                  :key="reservation.id"
                >
                  <template v-slot:prepend>
                    <v-avatar color="info">
                      <v-icon color="white">mdi-calendar</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title>
                    {{ formatDate(reservation.date) }} - {{ reservation.time }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ reservation.notes || $t('publicProfile.noNotes') }}
                  </v-list-item-subtitle>
                  <template v-slot:append>
                    <v-chip color="info" size="small">
                      {{ reservation.status }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Image Viewer Dialog -->
    <v-dialog v-model="imageDialog" max-width="800">
      <v-card v-if="selectedImage" rounded="xl">
        <v-card-title class="d-flex justify-space-between align-center">
          {{ selectedImage.alt_text || $t('publicProfile.medicalImage') }}
          <v-btn icon="mdi-close" variant="text" @click="imageDialog = false" />
        </v-card-title>
        <v-img :src="selectedImage.url" />
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { patientService } from '@/services/patient.service'
import { useAuthStore } from '@/stores/auth'
import TeethChart from '@/components/teeth/TeethChart.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { t, locale } = useI18n()

const loading = ref(true)
const error = ref(null)
const patientData = ref(null)
const imageDialog = ref(false)
const selectedImage = ref(null)

// Color name mapping for common dental colors
const colorNames = {
  '#FF0000': { en: 'Extraction', ar: 'خلع', ku: 'هەڵکێشان' },
  '#ff0000': { en: 'Extraction', ar: 'خلع', ku: 'هەڵکێشان' },
  '#00FF00': { en: 'Filling', ar: 'حشوة', ku: 'پڕکردنەوە' },
  '#00ff00': { en: 'Filling', ar: 'حشوة', ku: 'پڕکردنەوە' },
  '#0000FF': { en: 'Crown', ar: 'تاج', ku: 'تاج' },
  '#0000ff': { en: 'Crown', ar: 'تاج', ku: 'تاج' },
  '#FFFF00': { en: 'Root Canal', ar: 'علاج عصب', ku: 'دەرمانی دەمار' },
  '#ffff00': { en: 'Root Canal', ar: 'علاج عصب', ku: 'دەرمانی دەمار' },
  '#FF00FF': { en: 'Bridge', ar: 'جسر', ku: 'پرد' },
  '#ff00ff': { en: 'Bridge', ar: 'جسر', ku: 'پرد' },
  '#00FFFF': { en: 'Implant', ar: 'زرع', ku: 'چاندن' },
  '#00ffff': { en: 'Implant', ar: 'زرع', ku: 'چاندن' },
  '#FFA500': { en: 'Decay', ar: 'تسوس', ku: 'ڕزین' },
  '#ffa500': { en: 'Decay', ar: 'تسوس', ku: 'ڕزین' },
  '#800080': { en: 'Abscess', ar: 'خراج', ku: 'خوڵ' },
  '#808080': { en: 'Missing', ar: 'مفقود', ku: 'لەدەستچوو' },
  '#A52A2A': { en: 'Broken', ar: 'مكسور', ku: 'شکاو' },
  '#a52a2a': { en: 'Broken', ar: 'مكسور', ku: 'شکاو' }
}

// Computed property for unique colors in tooth_details
const uniqueColors = computed(() => {
  if (!patientData.value?.tooth_details?.length) return []
  
  const colorMap = new Map()
  
  patientData.value.tooth_details.forEach(detail => {
    const color = detail.color?.toLowerCase()
    if (color) {
      if (colorMap.has(color)) {
        colorMap.set(color, colorMap.get(color) + 1)
      } else {
        colorMap.set(color, 1)
      }
    }
  })
  
  return Array.from(colorMap.entries()).map(([color, count]) => ({
    color,
    count,
    name: getColorName(color)
  }))
})

const getColorName = (color) => {
  const colorInfo = colorNames[color] || colorNames[color.toLowerCase()]
  if (colorInfo) {
    if (locale.value === 'ar') return colorInfo.ar
    if (locale.value === 'ku') return colorInfo.ku
    return colorInfo.en
  }
  return color // Return the hex code if no name found
}

const fetchPatientProfile = async () => {
  const token = route.params.token

  if (!token) {
    error.value = t('publicProfile.invalidToken')
    loading.value = false
    return
  }

  try {
    const response = await patientService.getPublicPatientByToken(token)
    patientData.value = response.data || response
    console.log('Patient data:', patientData.value)
    
    // Smart redirect for authenticated doctors
    // If user is logged in, redirect to internal patient page
    if (authStore.isAuthenticated && patientData.value?.id) {
      router.replace({ 
        name: 'PatientDetail', 
        params: { id: patientData.value.id } 
      })
      return
    }
  } catch (err) {
    console.error('Failed to fetch patient profile:', err)
    error.value = t('publicProfile.fetchError')
  } finally {
    loading.value = false
  }
}

const getCategoryName = (category) => {
  if (!category) return '-'
  if (locale.value === 'ar' && category.name_ar) return category.name_ar
  if (locale.value === 'ku' && category.name_ku) return category.name_ku
  return category.name || category.name_en || '-'
}

const getStatusName = (status) => {
  if (!status) return '-'
  if (locale.value === 'ar' && status.name_ar) return status.name_ar
  if (locale.value === 'ku' && status.name_ku) return status.name_ku
  return status.name_en || status.name || '-'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString(locale.value === 'ar' ? 'ar-IQ' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return dateStr
  }
}

const viewImage = (image) => {
  selectedImage.value = image
  imageDialog.value = true
}

onMounted(() => {
  fetchPatientProfile()
})
</script>

<style scoped>
.public-patient-profile {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cursor-pointer {
  cursor: pointer;
}

/* Color Legend Styles */
.color-legend {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  padding-top: 16px;
}

.legend-title {
  color: rgba(0, 0, 0, 0.7);
  font-weight: 500;
  display: flex;
  align-items: center;
}

.colors-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.color-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 16px;
  font-size: 0.875rem;
}

.color-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}

.color-name {
  font-weight: 500;
}

.color-count {
  color: rgba(0, 0, 0, 0.5);
  font-size: 0.75rem;
}

/* Make teeth chart read-only */
.public-patient-profile :deep(.teeth-chart) {
  pointer-events: none;
  user-select: none;
}

.public-patient-profile :deep(.tooth-number) {
  cursor: default !important;
}

.public-patient-profile :deep(.tooth-path) {
  cursor: default !important;
}
</style>
