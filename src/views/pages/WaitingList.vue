<template>
  <div class="waiting-list-page pa-4">
    <!-- Page Header -->
    <div class="page-header mb-4">
      <div class="d-flex flex-wrap align-center justify-space-between gap-3">
        <div>
          <h1 class="text-h5 text-md-h4 font-weight-bold text-primary ma-0">
            {{ $t('waitingList.title') || 'قائمة الانتظار' }}
          </h1>
          <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
            {{ $t('waitingList.todayReservations') || 'حجوزات اليوم' }} - {{ formattedToday }}
          </p>
        </div>
        
        <v-btn
          icon="mdi-refresh"
          variant="text"
          :loading="loading"
          @click="loadReservations"
        />
      </div>
    </div>

    <!-- Filters Card -->
    <v-card class="mb-4" elevation="2" rounded="xl">
      <v-card-text>
        <v-row align="center" dense>
          <!-- Doctor Filter -->
          <v-col cols="12" sm="6" md="4">
            <v-select
              v-model="selectedDoctor"
              :items="doctorOptions"
              :label="$t('waitingList.selectDoctor') || 'اختر الطبيب'"
              item-title="name"
              item-value="id"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @update:model-value="loadReservations"
            />
          </v-col>
          
          <!-- Patient Search Filter -->
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model="patientSearch"
              :label="$t('waitingList.searchPatient') || 'بحث عن مريض'"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          
          <!-- Results Count -->
          <v-col cols="12" md="4" class="d-flex align-center justify-md-end">
            <v-chip color="primary" variant="tonal" size="small">
              <v-icon start size="small">mdi-account-group</v-icon>
              {{ filteredReservations.length }} {{ $t('waitingList.reservations') || 'حجز' }}
            </v-chip>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Reservations Table -->
    <v-card elevation="2" rounded="xl">
      <v-progress-linear v-if="loading" indeterminate color="primary" />
      
      <v-card-text class="pa-0">
        <v-data-table
          :headers="headers"
          :items="filteredReservations"
          :loading="loading"
          :items-per-page="15"
          :items-per-page-options="[10, 15, 25, 50]"
          hover
          class="waiting-list-table"
        >
          <!-- Patient Name Column - Clickable -->
          <template #item.patient="{ item }">
            <div 
              class="patient-link d-flex align-center gap-2 cursor-pointer"
              @click="goToPatient(item)"
            >
              <v-avatar size="32" color="primary">
                <span class="text-white text-caption font-weight-bold">
                  {{ getPatientInitials(item.patient) }}
                </span>
              </v-avatar>
              <div>
                <div class="font-weight-medium text-primary">
                  {{ item.patient?.name || $t('common.noData') }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ item.patient?.phone || '' }}
                </div>
              </div>
            </div>
          </template>
          
          <!-- Doctor Column -->
          <template #item.doctor="{ item }">
            <div class="d-flex align-center gap-2">
              <v-icon size="small" color="teal">mdi-doctor</v-icon>
              <span>{{ item.doctor?.name || $t('common.noData') }}</span>
            </div>
          </template>
          
          <!-- Reservation Time Column -->
          <template #item.reservation_from_time="{ item }">
            <div class="d-flex align-center gap-2">
              <v-icon size="small" color="primary">mdi-clock-outline</v-icon>
              <span>{{ formatTime(item.reservation_from_time) }}</span>
            </div>
          </template>
          
          <!-- Notes Column -->
          <template #item.notes="{ item }">
            <div v-if="item.notes" class="text-body-2" style="max-width: 300px;">
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <span v-bind="props" class="text-truncate d-inline-block" style="max-width: 200px;">
                    {{ item.notes }}
                  </span>
                </template>
                <span>{{ item.notes }}</span>
              </v-tooltip>
            </div>
            <span v-else class="text-medium-emphasis text-caption">
              {{ $t('common.noData') || '-' }}
            </span>
          </template>
          
          <!-- Status Column -->
          <template #item.status="{ item }">
            <v-chip
              :color="getStatusColor(item.status)"
              size="small"
              variant="flat"
            >
              {{ getStatusText(item.status) }}
            </v-chip>
          </template>
          
          <!-- Actions Column -->
          <template #item.actions="{ item }">
            <v-btn
              icon="mdi-eye"
              size="small"
              variant="text"
              color="primary"
              @click="goToPatient(item)"
            >
              <v-icon>mdi-eye</v-icon>
              <v-tooltip activator="parent" location="top">
                {{ $t('waitingList.viewPatient') || 'عرض المراجع' }}
              </v-tooltip>
            </v-btn>
          </template>
          
          <!-- No Data -->
          <template #no-data>
            <div class="text-center pa-8">
              <v-icon size="64" color="grey-lighten-1">mdi-calendar-blank</v-icon>
              <p class="text-body-1 text-medium-emphasis mt-4">
                {{ $t('waitingList.noReservations') || 'لا توجد حجوزات اليوم' }}
              </p>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { reservationService } from '@/services/reservation.service'
import DoctorService from '@/services/doctor.service'
import { useAuthStore } from '@/stores/authNew'

const router = useRouter()
const { t, locale } = useI18n()
const authStore = useAuthStore()

// State
const loading = ref(false)
const reservations = ref([])
const doctors = ref([])
const selectedDoctor = ref(null)
const patientSearch = ref('')

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

// Formatted today's date for display
const formattedToday = computed(() => {
  const today = new Date()
  return today.toLocaleDateString(locale.value === 'ar' ? 'ar-IQ' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// Table headers (without date and time columns)
const headers = computed(() => [
  { title: t('waitingList.patient') || 'المراجع', key: 'patient', sortable: true },
  { title: t('waitingList.doctor') || 'الطبيب', key: 'doctor', sortable: true },
  { title: t('waitingList.reservationTime') || 'وقت الحجز', key: 'reservation_from_time', sortable: true },
  { title: t('waitingList.notes') || 'ملاحظات', key: 'notes', sortable: false },
  { title: t('waitingList.status') || 'الحالة', key: 'status', sortable: true },
  { title: t('common.actions') || 'الإجراءات', key: 'actions', sortable: false, align: 'center' }
])

// Doctor options for filter
const doctorOptions = computed(() => {
  return [
    { id: null, name: t('common.all') || 'الكل' },
    ...doctors.value.map(d => ({ id: d.id, name: d.name }))
  ]
})

// Filtered reservations based on patient search
const filteredReservations = computed(() => {
  if (!patientSearch.value) {
    return reservations.value
  }
  
  const search = patientSearch.value.toLowerCase()
  return reservations.value.filter(r => {
    const patientName = r.patient?.name?.toLowerCase() || ''
    const patientPhone = r.patient?.phone || ''
    return patientName.includes(search) || patientPhone.includes(search)
  })
})

// Methods
async function loadReservations() {
  loading.value = true
  
  try {
    const today = getTodayDate()
    
    const params = {
      from_date: today,
      to_date: today,
      include: 'patient,doctor,status',
      per_page: 500
    }
    
    // Add doctor filter if selected
    if (selectedDoctor.value) {
      params['filter[doctor_id]'] = selectedDoctor.value
    }
    
    // If user is a doctor, filter by their ID
    if (authStore.isDoctor && authStore.user?.doctor_id) {
      params['filter[doctor_id]'] = authStore.user.doctor_id
    }
    
    const response = await reservationService.getAll(params)
    reservations.value = response.data?.data || response.data || []
  } catch (error) {
    console.error('Error loading reservations:', error)
    reservations.value = []
  } finally {
    loading.value = false
  }
}

async function loadDoctors() {
  try {
    const response = await DoctorService.getActive()
    doctors.value = response.data?.data || response.data || []
  } catch (error) {
    console.error('Error loading doctors:', error)
    doctors.value = []
  }
}

function goToPatient(item) {
  if (item.patient?.id) {
    router.push({ name: 'PatientDetail', params: { id: item.patient.id } })
  }
}

function getPatientInitials(patient) {
  if (!patient?.name) return '?'
  return patient.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

function formatTime(timeString) {
  if (!timeString) return t('common.noData') || '-'
  
  try {
    // If it's a full datetime, extract the time
    if (timeString.includes('T') || timeString.includes(' ')) {
      const datePart = timeString.split('T')[1] || timeString.split(' ')[1]
      timeString = datePart?.split('.')[0] || timeString
    }
    
    // Parse time (format: HH:MM:SS or HH:MM)
    const [hours, minutes] = timeString.split(':')
    
    // Convert to 12-hour format
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    
    return `${hour12}:${minutes} ${ampm}`
  } catch (error) {
    console.error('Error formatting time:', error)
    return timeString
  }
}

function getStatusColor(status) {
  if (!status) return 'grey'
  const name = status.name?.toLowerCase() || ''
  const id = status.id
  
  if (name === 'waiting' || id === 1) return 'orange'
  if (name === 'completed' || name === 'finished' || id === 2) return 'success'
  if (name === 'cancelled' || id === 3) return 'error'
  if (name === 'out_of_clinic' || id === 4) return 'info'
  return 'grey'
}

function getStatusText(status) {
  if (!status) return t('waitingList.pending') || 'قيد الانتظار'
  
  const name = status.name?.toLowerCase() || ''
  
  if (name === 'waiting') return t('waitingList.waiting') || 'في الانتظار'
  if (name === 'completed' || name === 'finished') return t('waitingList.finished') || 'مكتمل'
  if (name === 'cancelled') return t('waitingList.cancelled') || 'ملغي'
  if (name === 'out_of_clinic') return t('waitingList.out_of_clinic') || 'خارج العيادة'
  
  return status.name || t('waitingList.pending')
}

// Lifecycle
onMounted(() => {
  loadDoctors()
  loadReservations()
})
</script>

<style scoped>
.waiting-list-page {
  max-width: 1400px;
  margin: 0 auto;
}

.patient-link {
  transition: all 0.2s ease;
  padding: 4px 8px;
  border-radius: 8px;
}

.patient-link:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.cursor-pointer {
  cursor: pointer;
}

.gap-2 {
  gap: 8px;
}

.gap-3 {
  gap: 12px;
}

.waiting-list-table :deep(.v-data-table__tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.04) !important;
}

.waiting-list-table :deep(.v-data-table-header) {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.waiting-list-table :deep(.v-data-table-header th) {
  font-weight: 600 !important;
}
</style>
