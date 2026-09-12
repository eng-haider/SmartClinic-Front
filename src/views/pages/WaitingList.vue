<template>
  <div class="waiting-list-page pa-4">
    <!-- Page Header -->
    <div class="page-header mb-4">
      <div class="d-flex flex-wrap align-center justify-space-between gap-3">
        <div>
          <h1 class="text-h5 text-md-h4 font-weight-bold text-primary ma-0 mobile-page-heading">
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
              :label="$t('waitingList.searchPatient') || 'بحث عن مراجع'"
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

    <!-- Reservations: cards on phones, table on larger screens -->
    <v-card :elevation="smAndDown ? 0 : 2" rounded="xl" :class="{ 'wl-mobile': smAndDown }">
      <v-progress-linear v-if="loading" indeterminate color="primary" :rounded="smAndDown" />

      <!-- Mobile card list -->
      <div v-if="smAndDown" class="wl-card-list" :aria-busy="loading">
        <template v-if="loading && !filteredReservations.length">
          <v-skeleton-loader
            v-for="n in 4"
            :key="n"
            type="list-item-avatar-two-line, chip, actions"
            class="wl-card wl-card--skeleton"
          />
        </template>

        <div v-else-if="!filteredReservations.length" class="wl-empty">
          <div class="wl-empty__icon">
            <v-icon size="40" color="primary">mdi-calendar-blank-outline</v-icon>
          </div>
          <p class="text-body-1 font-weight-medium mt-4 mb-1">
            {{ $t('waitingList.noReservations') || 'لا توجد حجوزات اليوم' }}
          </p>
          <p class="text-body-2 text-medium-emphasis mb-0">{{ formattedToday }}</p>
        </div>

        <template v-else>
          <article
            v-for="item in filteredReservations"
            :key="item.id"
            class="wl-card"
            :class="{ 'wl-card--done': isDone(item), 'wl-card--updating': updatingStatus.has(item.id) }"
          >
            <span class="wl-card__accent" v-bind="getStatusAccent(item.status)" aria-hidden="true" />

            <div
              class="wl-card__body"
              role="button"
              tabindex="0"
              @click="goToPatient(item)"
              @keydown.enter="goToPatient(item)"
            >
              <!-- Identity + time -->
              <div class="wl-card__top">
                <v-avatar size="46" color="primary" variant="tonal" class="wl-card__avatar">
                  <span class="font-weight-bold">{{ getPatientInitials(item.patient) }}</span>
                </v-avatar>

                <div class="wl-card__identity">
                  <h2 class="wl-card__name">
                    {{ item.patient?.name || $t('common.noData') }}
                  </h2>
                  <div class="wl-card__meta">
                    <span v-if="item.patient?.phone" dir="ltr">{{ item.patient.phone }}</span>
                    <span v-if="item.patient?.age">{{ item.patient.age }} {{ $t('patients.years') }}</span>
                  </div>
                </div>

                <div class="wl-card__time" dir="ltr">
                  <v-icon size="15">mdi-clock-outline</v-icon>
                  <span>{{ formatTime(item.reservation_from_time) }}</span>
                </div>
              </div>

              <!-- Doctor -->
              <div class="wl-card__row">
                <v-icon size="18" color="teal">mdi-doctor</v-icon>
                <span class="text-truncate">{{ item.doctor?.name || $t('common.noData') }}</span>
              </div>

              <!-- Status + type chips -->
              <div class="wl-card__chips">
                <v-chip :color="getStatusColor(item.status)" size="small" variant="flat" class="font-weight-medium">
                  <v-icon start size="14">{{ isDone(item) ? 'mdi-check-circle' : 'mdi-timer-sand' }}</v-icon>
                  {{ getStatusText(item.status) }}
                </v-chip>
                <v-chip
                  v-if="item.reservation_type"
                  size="small"
                  :color="item.reservation_type.id === 1 ? 'teal' : 'purple'"
                  variant="tonal"
                >
                  <v-icon start size="14">{{ item.reservation_type.id === 1 ? 'mdi-stethoscope' : 'mdi-dots-horizontal-circle-outline' }}</v-icon>
                  {{ item.reservation_type.name }}
                </v-chip>
              </div>

              <!-- Notes -->
              <div v-if="item.notes || item.reservation_type_note" class="wl-card__notes">
                <v-icon size="16" class="wl-card__notes-icon">mdi-note-text-outline</v-icon>
                <div class="wl-card__notes-text">
                  <div v-if="item.notes">{{ item.notes }}</div>
                  <div v-if="item.reservation_type_note" class="text-caption text-medium-emphasis">
                    {{ item.reservation_type_note }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer: mark done + view patient -->
            <div class="wl-card__footer">
              <div class="wl-card__done" @click.stop>
                <v-switch
                  :model-value="isDone(item)"
                  :loading="updatingStatus.has(item.id)"
                  :disabled="updatingStatus.has(item.id)"
                  :label="$t('waitingList.markDone') || 'مكتمل'"
                  color="success"
                  density="compact"
                  inset
                  hide-details
                  @update:model-value="val => toggleDone(item, val)"
                />
              </div>
              <v-btn
                color="primary"
                variant="tonal"
                class="wl-card__view"
                prepend-icon="mdi-account-eye-outline"
                @click="goToPatient(item)"
              >
                {{ $t('waitingList.viewPatient') || 'عرض المراجع' }}
              </v-btn>
            </div>
          </article>
        </template>
      </div>

      <!-- Desktop table -->
      <v-card-text v-else class="pa-0">
        <v-data-table
          :headers="headers"
          :items="filteredReservations"
          :loading="loading"
          :items-per-page="150"
          :items-per-page-options="[10, 15, 25, 50]"
          :row-props="getReservationRowProps"
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
          
          <!-- Patient Age Column -->
          <template #item.age="{ item }">
            <span>{{ item.patient?.age ? item.patient.age + ' ' + $t('patients.years') : $t('common.noData') }}</span>
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

          <!-- Reservation Type Column -->
          <template #item.reservation_type="{ item }">
            <v-chip
              v-if="item.reservation_type"
              size="small"
              :color="item.reservation_type.id === 1 ? 'teal' : 'purple'"
              variant="tonal"
            >
              <v-icon start size="14">{{ item.reservation_type.id === 1 ? 'mdi-stethoscope' : 'mdi-dots-horizontal-circle-outline' }}</v-icon>
              {{ item.reservation_type.name }}
            </v-chip>
            <span v-else class="text-medium-emphasis text-caption">-</span>
          </template>
          
          <!-- Notes Column -->
          <template #item.notes="{ item }">
            <div class="d-flex flex-column gap-1">
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
              <div v-if="item.reservation_type_note" class="text-caption text-medium-emphasis">
                {{ item.reservation_type_note }}
              </div>
              <span v-if="!item.notes && !item.reservation_type_note" class="text-medium-emphasis text-caption">
                {{ $t('common.noData') || '-' }}
              </span>
            </div>
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

          <!-- Mark as Done Column -->
          <template #item.done="{ item }">
            <v-switch
              :model-value="item.status?.id === 3"
              :loading="updatingStatus.has(item.id)"
              :disabled="updatingStatus.has(item.id)"
              color="success"
              hide-details
              density="compact"
              @update:model-value="val => toggleDone(item, val)"
            />
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

    <!-- Snackbar for status update feedback -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { reservationService } from '@/services/reservation.service'
import DoctorService from '@/services/doctor.service'
import { useAuthStore } from '@/stores/authNew'

const router = useRouter()
const { t, locale } = useI18n()
const authStore = useAuthStore()
const { smAndDown } = useDisplay()

// State
const loading = ref(false)
const reservations = ref([])
const doctors = ref([])
const selectedDoctor = ref(null)
const patientSearch = ref('')
const updatingStatus = ref(new Set())
const snackbar = ref({ show: false, text: '', color: 'success' })

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
  { title: t('patients.age') || 'العمر', key: 'age', sortable: false },
  { title: t('waitingList.doctor') || 'الطبيب', key: 'doctor', sortable: true },
  { title: t('waitingList.reservationTime') || 'وقت الحجز', key: 'reservation_from_time', sortable: true },
  { title: t('reservations.reservation_type') || 'نوع الحجز', key: 'reservation_type', sortable: false },
  { title: t('waitingList.notes') || 'ملاحظات', key: 'notes', sortable: false },
  { title: t('waitingList.status') || 'الحالة', key: 'status', sortable: true },
  { title: t('waitingList.markDone') || 'مكتمل', key: 'done', sortable: false, align: 'center' },
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
      include: 'patient,doctor,status,reservationType',
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
  // Use the color from the API directly if available
  if (status.color) return status.color
  const id = status.id
  if (id === 1) return 'orange'
  if (id === 2) return 'success'
  if (id === 3) return 'error'
  if (id === 4) return 'info'
  return 'grey'
}

function getStatusText(status) {
  if (!status) return t('waitingList.pending') || 'قيد الانتظار'
  // Prefer localised name from API
  return status.name_ar || status.name_en || status.name || t('waitingList.pending')
}

function isDone(item) {
  const statusName = item?.status?.name?.toString().toLowerCase() || ''
  return item?.status?.id === 3 || statusName === 'completed' || statusName === 'complete'
}

// Mobile card accent stripe: API colours are CSS values (#hex / rgb), palette names map to Vuetify bg-* classes
function getStatusAccent(status) {
  const color = getStatusColor(status)
  if (/^(#|rgb|hsl)/i.test(color)) return { style: { backgroundColor: color } }
  return { class: `bg-${color}` }
}

function getReservationRowProps(rowProps) {
  // Vuetify passes an object like { item, index, internalItem }
  const item = rowProps?.item || rowProps
  return isDone(item) ? { class: 'waiting-list-complete-row' } : {}
}

async function toggleDone(item, isDone) {
  const statusId = isDone ? 3 : 1
  updatingStatus.value = new Set([...updatingStatus.value, item.id])

  try {
    const response = await reservationService.updateStatus(item.id, statusId)
    const updated = response.data?.data || response.data
    // Update the row in-place
    const idx = reservations.value.findIndex(r => r.id === item.id)
    if (idx !== -1 && updated?.status) {
      reservations.value[idx] = { ...reservations.value[idx], status: updated.status }
    } else if (idx !== -1) {
      // Fallback: update status directly
      reservations.value[idx] = { ...reservations.value[idx], status: { id: statusId } }
    }
  } catch (error) {
    console.error('Error updating reservation status:', error)
    snackbar.value = {
      show: true,
      text: error.response?.data?.message || t('errors.saveFailed') || 'فشل تحديث الحالة',
      color: 'error'
    }
  } finally {
    const next = new Set(updatingStatus.value)
    next.delete(item.id)
    updatingStatus.value = next
  }
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

.waiting-list-table :deep(.waiting-list-complete-row) {
  background-color: rgba(46, 125, 50, 0.14) !important;
}

.waiting-list-table :deep(.waiting-list-complete-row) td {
  color: rgba(0, 0, 0, 0.85) !important;
}

/* ==================== Mobile cards (smAndDown) ==================== */
.wl-mobile {
  background: transparent;
  overflow: visible;
}

.wl-card-list {
  display: grid;
  gap: 14px;
  padding-block: 6px 16px;
}

.wl-card {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 18px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
  transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.2s ease, border-color 0.2s ease;
}

.wl-card:active {
  transform: scale(0.985);
}

.wl-card--skeleton {
  padding: 8px;
}

/* Status colour stripe on the leading edge (flips automatically in RTL) */
.wl-card__accent {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  width: 5px;
}

.wl-card__body {
  display: grid;
  gap: 12px;
  padding: 16px 16px 12px;
  padding-inline-start: 20px;
  cursor: pointer;
  outline: none;
}

.wl-card__body:focus-visible {
  box-shadow: inset 0 0 0 2px rgb(var(--v-theme-primary));
}

.wl-card__top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wl-card__avatar {
  flex-shrink: 0;
  font-size: 0.9rem;
}

.wl-card__identity {
  flex: 1;
  min-width: 0;
}

.wl-card__name {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 700;
  line-height: 1.5;
  color: rgb(var(--v-theme-on-surface));
  overflow-wrap: anywhere;
}

.wl-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 10px;
  font-size: 0.78rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.wl-card__time {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  font-size: 0.8rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.wl-card__row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 0.875rem;
}

.wl-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.wl-card__notes {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  font-size: 0.85rem;
  line-height: 1.6;
}

.wl-card__notes-icon {
  flex-shrink: 0;
  margin-top: 3px;
  opacity: 0.7;
}

.wl-card__notes-text {
  min-width: 0;
  overflow-wrap: anywhere;
  white-space: pre-line;
}

.wl-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 12px 8px;
  padding-inline-start: 16px;
  border-top: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.wl-card__done {
  min-width: 0;
}

.wl-card__done :deep(.v-selection-control) {
  min-height: 40px;
}

.wl-card__done :deep(.v-label) {
  font-size: 0.85rem;
  font-weight: 600;
  opacity: 1;
}

.wl-card__view {
  flex-shrink: 0;
  min-height: 40px;
  border-radius: 12px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}

/* Completed reservation */
.wl-card--done {
  background: rgba(var(--v-theme-success), 0.06);
  border-color: rgba(var(--v-theme-success), 0.35);
}

.wl-card--done .wl-card__time {
  background: rgba(var(--v-theme-success), 0.14);
  color: rgb(var(--v-theme-success));
}

.wl-card--updating {
  opacity: 0.65;
}

/* Empty state */
.wl-empty {
  padding: 48px 16px;
  text-align: center;
}

.wl-empty__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.08);
}
</style>
