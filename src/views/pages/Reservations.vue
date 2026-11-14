<template>
  <div class="reservations-page app-page">
    <!-- Single Row Header (desktop) / Stacked (mobile) -->
    <div class="page-header mb-3">
      <div class="header-row">
        <!-- Title -->
        <h1 class="header-title text-h5 text-md-h4 font-weight-bold text-primary ma-0 mobile-page-heading">
          {{ $t('reservations.title') }}
        </h1>
        
        <!-- Controls Group -->
        <div class="header-controls">
          <!-- Calendar Navigation (RTL-aware) -->
          <v-btn-group density="compact" variant="outlined" divided class="nav-btns">
            <v-btn 
              :icon="isRtl ? 'mdi-chevron-right' : 'mdi-chevron-left'" 
              size="small" 
              @click="previousMonth" 
            />
            <v-btn size="small" @click="goToToday" min-width="110" class="month-btn">
              {{ currentMonthName }} {{ currentYear }}
            </v-btn>
            <v-btn 
              :icon="isRtl ? 'mdi-chevron-left' : 'mdi-chevron-right'" 
              size="small" 
              @click="nextMonth" 
            />
          </v-btn-group>
          
          <v-btn
            variant="tonal"
            color="primary"
            size="small"
            @click="goToToday"
            class="today-btn"
          >
            {{ $t('reservations.today') }}
          </v-btn>
          
          <!-- Doctor Filter -->
          <v-select
            v-model="selectedDoctor"
            :items="doctorOptions"
            :label="$t('reservations.select_doctor')"
            item-title="name"
            item-value="id"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            class="doctor-filter"
            @update:model-value="loadReservations"
          />
          
          <!-- Refresh Button -->
          <v-btn
            icon="mdi-refresh"
            variant="text"
            size="small"
            :loading="loading"
            @click="loadReservations"
          />
          
          <!-- Add Button -->
          <v-btn
            color="primary"
            size="small"
            prepend-icon="mdi-plus"
            @click="openBookingDialog()"
            elevation="1"
            class="add-btn"
          >
            <span class="d-none d-sm-inline">{{ $t('reservations.add') }}</span>
            <span class="d-sm-none">{{ $t('common.add') }}</span>
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Calendar View -->
    <v-card elevation="2" rounded="xl" class="calendar-card">
      <v-progress-linear v-if="loading" indeterminate color="primary" />
      
      <div class="calendar-container pa-4">
        <!-- Color Legend -->
        <div class="color-legend mb-3">
          <span class="legend-title">{{ $t('reservations.legend.title') }}:</span>
          <div v-for="item in colorLegend" :key="item.key" class="legend-item">
            <span class="legend-dot" :style="{ backgroundColor: item.color }" />
            <span>{{ item.label }}</span>
          </div>
        </div>

        <!-- Calendar Header (Days of Week) -->
        <div class="calendar-header">
          <div 
            v-for="day in weekDays" 
            :key="day" 
            class="calendar-header-cell"
          >
            {{ day }}
          </div>
        </div>
        
        <!-- Calendar Grid -->
        <div class="calendar-grid">
          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            class="calendar-day"
            :class="{
              'other-month': !day.currentMonth,
              'today': day.isToday,
              'selected': day.date === selectedDate
            }"
            @click="handleDayClick(day)"
          >
            <div class="day-number">{{ day.dayNumber }}</div>
            
            <!-- Events for this day -->
            <div class="day-events">
              <div
                v-for="event in day.events"
                :key="event.id"
                class="event-chip"
                :style="{ backgroundColor: getEventColor(event) }"
                @click.stop="compactCalendar ? handleDayClick(day) : openDetailsDialog(event)"
              >
                <span class="event-time">{{ formatTime(event.reservation_from_time) }}</span>
                <span class="event-name">{{ event.patient?.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-card>

    <!-- Booking Dialog -->
    <BookingDialog
      v-model="bookingDialog"
      :selected-date="selectedDate"
      :doctors="doctors"
      :default-doctor-id="defaultDoctorId"
      @saved="handleBookingSaved"
      @error="handleBookingError"
    />

    <!-- Reservation Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="500" scrollable>
      <v-card rounded="xl" v-if="selectedReservation">
        <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary">
          <span class="text-white text-h6">
            {{ $t('reservations.details') }}
          </span>
          <v-btn
            icon="mdi-close"
            variant="text"
            color="white"
            @click="detailsDialog = false"
          />
        </v-card-title>

        <v-card-text class="pa-6">
          <!-- Patient Info -->
          <div class="d-flex align-center ga-4 mb-4">
            <v-avatar color="primary" size="56">
              <span class="text-white text-h6">
                {{ getInitials(selectedReservation.patient?.name) }}
              </span>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">
                {{ selectedReservation.patient?.name }}
              </div>
              <div class="text-grey" dir="ltr">
                {{ selectedReservation.patient?.phone }}
              </div>
            </div>
          </div>

          <v-divider class="mb-4" />

          <!-- Reservation Info -->
          <v-list density="compact" class="bg-transparent">
            <v-list-item>
              <template v-slot:prepend>
                <v-icon color="primary">mdi-calendar</v-icon>
              </template>
              <v-list-item-title>{{ $t('reservations.date') }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ formatDate(selectedReservation.reservation_start_date) }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template v-slot:prepend>
                <v-icon color="primary">mdi-clock</v-icon>
              </template>
              <v-list-item-title>{{ $t('reservations.time') }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ formatTime(selectedReservation.reservation_from_time) }} - 
                {{ formatTime(selectedReservation.reservation_to_time) }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template v-slot:prepend>
                <v-icon color="primary">mdi-doctor</v-icon>
              </template>
              <v-list-item-title>{{ $t('reservations.doctor') }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ selectedReservation.doctor?.name }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="getReservationNote(selectedReservation)">
              <template v-slot:prepend>
                <v-icon color="primary">mdi-note-text</v-icon>
              </template>
              <v-list-item-title>{{ $t('reservations.notes') }}</v-list-item-title>
              <div class="reservation-note">{{ getReservationNote(selectedReservation) }}</div>
            </v-list-item>
          </v-list>

          <!-- Status Chip -->
          <div class="text-center mt-4">
            <v-chip
              :color="selectedReservation.status?.color || 'grey'"
              size="large"
            >
              {{ selectedReservation.status?.name_ar || selectedReservation.status?.name_en }}
            </v-chip>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4 d-flex flex-wrap ga-2">
          <!-- View Patient -->
          <v-btn
            color="info"
            variant="tonal"
            prepend-icon="mdi-account"
            @click="goToPatient(selectedReservation.patient_id)"
          >
            {{ $t('reservations.view_patient') }}
          </v-btn>

          <!-- WhatsApp -->
          <v-btn
            color="success"
            variant="tonal"
            prepend-icon="mdi-whatsapp"
            @click="openWhatsApp(selectedReservation.patient?.phone)"
          >
            {{ $t('reservations.whatsapp') }}
          </v-btn>

          <v-spacer />

          <!-- Delete -->
          <v-btn
            color="error"
            variant="tonal"
            prepend-icon="mdi-delete"
            @click="confirmDelete(selectedReservation)"
          >
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="text-h6 pa-4">
          {{ $t('common.confirmDelete') }}
        </v-card-title>
        <v-card-text>
          {{ $t('reservations.delete_confirm') }}
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :loading="deleting"
            @click="deleteReservation"
          >
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Day List Dialog (phones): every reservation of the tapped day -->
    <v-dialog v-model="allEventsDialog" max-width="500" scrollable>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>{{ formatDate(selectedDate) }} ({{ dayEventsCount }})</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            :aria-label="$t('common.close')"
            @click="allEventsDialog = false"
          />
        </v-card-title>

        <div v-if="dayEventsCount >= DAY_SEARCH_MIN" class="day-search">
          <v-text-field
            v-model="daySearch"
            :label="$t('waitingList.searchPatient')"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            clearable
          />
        </div>

        <v-card-text class="pa-3">
          <button
            v-for="event in selectedDayEvents"
            :key="event.id"
            type="button"
            class="day-row"
            @click="openDetailsDialog(event)"
          >
            <span class="day-row__stripe" :style="{ backgroundColor: getEventColor(event) }" />
            <span class="day-row__time">{{ formatTime(event.reservation_from_time) }}</span>
            <span class="day-row__info">
              <span class="day-row__name">{{ event.patient?.name }}</span>
              <span class="day-row__meta">{{ event.doctor?.name }}</span>
              <span v-if="getReservationNote(event)" class="day-row__meta">
                {{ getReservationNote(event) }}
              </span>
            </span>
          </button>
          <p v-if="!selectedDayEvents.length" class="text-center text-medium-emphasis py-6 mb-0">
            {{ $t('common.noData') }}
          </p>
        </v-card-text>

        <v-card-actions class="pa-3">
          <v-btn
            block
            color="primary"
            variant="flat"
            prepend-icon="mdi-plus"
            @click="bookingDialog = true"
          >
            {{ $t('reservations.add') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="top"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">
          {{ $t('common.close') }}
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import reservationService from '@/services/reservation.service'
import BookingDialog from '@/components/BookingDialog.vue'
import { clockPart } from '@/utils/waitingList'

const router = useRouter()
const { t, locale } = useI18n()
const authStore = useAuthStore()
const { width } = useDisplay()

// ==================== State ====================
const loading = ref(false)
const deleting = ref(false)

const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)
const selectedDate = ref(null)

const reservations = ref([])
const doctors = ref([])
const selectedDoctor = ref(null)

// Dialogs
const bookingDialog = ref(false)
const detailsDialog = ref(false)
const deleteDialog = ref(false)
const allEventsDialog = ref(false)

const selectedReservation = ref(null)
const reservationToDelete = ref(null)
const daySearch = ref('')

const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Seeded status id (same as WaitingList): 3 = completed
const STATUS_COMPLETED = 3

const EVENT_COLORS = {
  pending: '#FFA500',
  completed: '#4CAF50',
  overdue: '#E53935'
}

// A day's list gets a search box once scrolling through it stops being quick
const DAY_SEARCH_MIN = 6

// Ticks every minute so reservations turn red while the page stays open
const now = ref(new Date())
let nowTimer = null

// ==================== Computed ====================
const colorLegend = computed(() => [
  { key: 'pending', color: EVENT_COLORS.pending, label: t('reservations.legend.pending') },
  { key: 'completed', color: EVENT_COLORS.completed, label: t('reservations.legend.completed') },
  { key: 'overdue', color: EVENT_COLORS.overdue, label: t('reservations.legend.overdue') }
])

const isRtl = computed(() => {
  return locale.value === 'ar' || locale.value === 'ku'
})

// Same width as the page's mobile styles: below it a day's chips are too small
// to tap one by one, so tapping a day lists its reservations instead
const compactCalendar = computed(() => width.value <= 768)

const dayEventsCount = computed(() => getEventsForDate(selectedDate.value).length)

// The tapped day's reservations, earliest first, narrowed by the search box
const selectedDayEvents = computed(() => {
  const search = daySearch.value?.trim().toLowerCase()
  return getEventsForDate(selectedDate.value)
    .filter(event => {
      if (!search) return true
      const name = event.patient?.name?.toLowerCase() || ''
      const phone = event.patient?.phone || ''
      return name.includes(search) || phone.includes(search)
    })
    .sort((a, b) => clockPart(a.reservation_from_time).localeCompare(clockPart(b.reservation_from_time)))
})

const canFilterByDoctor = computed(() => {
  const role = authStore.user?.role
  return ['secretary', 'adminDoctor', 'accounter', 'admin'].includes(role)
})

const defaultDoctorId = computed(() => {
  return canFilterByDoctor.value 
    ? (doctors.value.length > 0 ? doctors.value[0].id : null)
    : authStore.user?.doctor_id
})

const doctorOptions = computed(() => {
  return [
    { id: null, name: t('reservations.all_doctors') },
    ...doctors.value
  ]
})

const weekDays = computed(() => {
  const days = locale.value === 'ar' 
    ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days
})

const currentMonthName = computed(() => {
  const months = locale.value === 'ar'
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return months[currentMonth.value - 1]
})

const calendarDays = computed(() => {
  const days = []
  const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value, 0)
  const startDay = firstDay.getDay()
  
  // Previous month days
  const prevMonthLastDay = new Date(currentYear.value, currentMonth.value - 1, 0).getDate()
  for (let i = startDay - 1; i >= 0; i--) {
    const date = new Date(currentYear.value, currentMonth.value - 2, prevMonthLastDay - i)
    days.push({
      dayNumber: prevMonthLastDay - i,
      date: formatDateISO(date),
      currentMonth: false,
      isToday: false,
      events: getEventsForDate(formatDateISO(date))
    })
  }
  
  // Current month days
  const today = new Date()
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(currentYear.value, currentMonth.value - 1, i)
    const isToday = date.toDateString() === today.toDateString()
    days.push({
      dayNumber: i,
      date: formatDateISO(date),
      currentMonth: true,
      isToday,
      events: getEventsForDate(formatDateISO(date))
    })
  }
  
  // Next month days to fill the grid
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(currentYear.value, currentMonth.value, i)
    days.push({
      dayNumber: i,
      date: formatDateISO(date),
      currentMonth: false,
      isToday: false,
      events: getEventsForDate(formatDateISO(date))
    })
  }
  
  return days
})

// ==================== Methods ====================
const formatDateISO = (date) => {
  // Format as YYYY-MM-DD without timezone conversion
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  // Parse date string as local date to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const date = new Date()
  date.setHours(parseInt(hours), parseInt(minutes))
  return date.toLocaleTimeString(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

const getEventsForDate = (date) => {
  return reservations.value.filter(r => r.reservation_start_date === date)
}

// True once the reservation's end time (or start time, or end of day) has passed
const isReservationTimePassed = (event) => {
  if (!event.reservation_start_date) return false
  const [year, month, day] = event.reservation_start_date.split('-').map(Number)
  const timeStr = event.reservation_to_time || event.reservation_from_time || '23:59'
  const [hours, minutes] = timeStr.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes) < now.value
}

const getEventColor = (event) => {
  const statusId = event.status?.id ?? event.status_id

  if (statusId === STATUS_COMPLETED) return EVENT_COLORS.completed

  // Time has passed but the reservation was never completed
  if (isReservationTimePassed(event)) return EVENT_COLORS.overdue

  return EVENT_COLORS.pending
}

// The type note is the booking forms' only note input, so staff notes live there
const getReservationNote = (event) => {
  return [event.reservation_type_note, event.notes].filter(Boolean).join('\n')
}

const previousMonth = () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
  loadReservations()
}

const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
  loadReservations()
}

const goToToday = () => {
  const today = new Date()
  currentYear.value = today.getFullYear()
  currentMonth.value = today.getMonth() + 1
  loadReservations()
}

const handleDayClick = (day) => {
  selectedDate.value = day.date
  if (compactCalendar.value && day.events.length) {
    daySearch.value = ''
    allEventsDialog.value = true
    return
  }
  bookingDialog.value = true
}

const openBookingDialog = () => {
  selectedDate.value = formatDateISO(new Date())
  bookingDialog.value = true
}

const openDetailsDialog = (reservation) => {
  selectedReservation.value = reservation
  detailsDialog.value = true
}

const confirmDelete = (reservation) => {
  reservationToDelete.value = reservation
  detailsDialog.value = false
  deleteDialog.value = true
}

const goToPatient = (patientId) => {
  router.push(`/patients/${patientId}`)
}

const openWhatsApp = (phone) => {
  if (!phone) return
  // Remove any non-numeric characters and add country code if needed
  let cleanPhone = phone.replace(/\D/g, '')
  if (!cleanPhone.startsWith('964')) {
    cleanPhone = '964' + cleanPhone
  }
  window.open(`https://wa.me/${cleanPhone}`, '_blank')
}

// ==================== API Methods ====================
const loadReservations = async () => {
  loading.value = true
  try {
    const response = await reservationService.getMonthlyReservations(
      currentYear.value,
      currentMonth.value,
      selectedDoctor.value
    )
    reservations.value = response.data || []
  } catch (error) {
    console.error('Failed to load reservations:', error)
    showSnackbar(t('errors.fetchFailed'), 'error')
  } finally {
    loading.value = false
  }
}

const loadDoctors = async () => {
  try {
    const response = await reservationService.getDoctors()
    console.log('Doctors API Response:', response)
    
    // Handle different response structures
    if (Array.isArray(response)) {
      doctors.value = response
    } else if (response.data) {
      doctors.value = Array.isArray(response.data) ? response.data : [response.data]
    } else {
      doctors.value = []
    }
    
    console.log('Loaded doctors:', doctors.value)
  } catch (error) {
    console.error('Failed to load doctors:', error)
    doctors.value = []
  }
}

const loadInitialPatients = async () => {
  // Not needed anymore - handled by BookingDialog component
}

const searchPatients = async (query) => {
  // Not needed anymore - handled by BookingDialog component
}

const handleBookingSaved = (response) => {
  showSnackbar(t('reservations.booking_success'), 'success')
  loadReservations()
}

const handleBookingError = (error) => {
  console.error('Failed to save booking:', error)
  showSnackbar(error.response?.data?.message || t('errors.saveFailed'), 'error')
}

const deleteReservation = async () => {
  if (!reservationToDelete.value) return
  
  deleting.value = true
  try {
    await reservationService.delete(reservationToDelete.value.id)
    showSnackbar(t('reservations.delete_success'), 'success')
    deleteDialog.value = false
    loadReservations()
  } catch (error) {
    console.error('Failed to delete reservation:', error)
    showSnackbar(t('errors.deleteFailed'), 'error')
  } finally {
    deleting.value = false
  }
}

const showSnackbar = (message, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

// ==================== Watchers ====================
// No longer needed - patient search handled in BookingDialog

// Deleting a day's last reservation leaves nothing to list
watch(dayEventsCount, (count) => {
  if (!count) allEventsDialog.value = false
})

// ==================== Lifecycle ====================
onMounted(() => {
  loadReservations()
  loadDoctors()
  nowTimer = setInterval(() => { now.value = new Date() }, 60000)
})

onUnmounted(() => {
  clearInterval(nowTimer)
})
</script>

<style scoped>

/* Single Row Header */
.page-header {
  padding: 0;
}

.header-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.header-title {
  flex-shrink: 0;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 4px 0;
}

.header-controls::-webkit-scrollbar {
  display: none;
}

.nav-btns {
  flex-shrink: 0;
}

.month-btn {
  font-size: 12px !important;
}

.today-btn {
  flex-shrink: 0;
}

.doctor-filter {
  min-width: 140px;
  max-width: 180px;
  flex-shrink: 0;
}

.add-btn {
  flex-shrink: 0;
  margin-inline-start: auto;
}

/* Mobile: controls scroll horizontally */
@media (max-width: 599px) {

  
  .header-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-title {
    margin-bottom: 8px;
  }
  
  .header-controls {
    justify-content: flex-start;
  }
  
  .add-btn {
    margin-inline-start: 0;
  }
  
  .doctor-filter {
    min-width: 120px;
    max-width: 140px;
  }
}

/* Tablet and up: single row */
@media (min-width: 600px) {
  .header-row {
    flex-wrap: nowrap;
  }
  
  .header-controls {
    justify-content: flex-end;
  }
}

/* Large screens */
@media (min-width: 960px) {
  .doctor-filter {
    min-width: 180px;
    max-width: 220px;
  }
  
  .month-btn {
    min-width: 130px !important;
    font-size: 13px !important;
  }
}

/* The weekday row sticks to the top while the month scrolls. A sticky element
   only works when no ancestor between it and the page scroller is itself a
   scroll box, so the card and container clip instead of hiding/scrolling
   (clip keeps the rounded corners). Browsers without `clip` keep the old
   behaviour. */
.calendar-card {
  overflow: clip !important;
}

.calendar-container {
  overflow-x: auto;
  overflow-x: clip;
}

.color-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  font-size: 13px;
}

.legend-title {
  font-weight: 600;
  color: #666;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 4px;
  position: sticky;
  top: 0;
  z-index: 3;
  /* Solid backdrop so days scrolling underneath don't show through the gaps */
  background: rgb(var(--v-theme-surface));
  padding-block: 4px;
}

.calendar-header-cell {
  min-width: 0;
  text-align: center;
  padding: 12px 8px;
  font-weight: 600;
  color: #666;
  background: #f5f5f5;
  border-radius: 8px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-day {
  /* Columns stay 1/7 wide even with a long name inside (nothing to scroll sideways) */
  min-width: 0;
  min-height: 140px;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.calendar-day:hover {
  background: #f5f5f5;
  border-color: #1976d2;
}

.calendar-day.other-month {
  background: #fafafa;
  opacity: 0.6;
}

.calendar-day.today {
  border-color: #1976d2;
  border-width: 2px;
  background: #e3f2fd;
}

.calendar-day.selected {
  background: #bbdefb;
}

.day-number {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.event-chip {
  font-size: 12px;
  padding: 3px 7px;
  border-radius: 4px;
  color: white;
  /* The columns are a fixed 1/7 wide (so they line up with the weekday row):
     a long patient name wraps onto another line instead of being cut */
  white-space: normal;
  overflow-wrap: break-word;
  line-height: 1.35;
  /* time and name are two spans with no space between them: as a wrapping
     row, the name moves under the time when it doesn't fit beside it */
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  cursor: pointer;
  transition: transform 0.2s;
}

/* Phones: a cell is too narrow for time and name, so the chip shows the
   patient's name (up to two lines); tapping the day lists times and full names */
@media (max-width: 599px) {
  .calendar-day .event-chip {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    padding: 1px 2px;
    line-height: 1.3;
    text-align: center;
  }

  .calendar-day .event-time {
    display: none;
  }

  .calendar-day .event-name {
    margin: 0;
  }
}

.event-chip:hover {
  transform: scale(1.02);
}

.event-time {
  white-space: nowrap;
  font-weight: 600;
  margin-left: 4px;
}

.event-name {
  margin-right: 4px;
}

.more-events {
  font-size: 10px;
  color: #1976d2;
  cursor: pointer;
  text-align: center;
  padding: 2px;
}

.more-events:hover {
  text-decoration: underline;
}

/* Day list (phones) */
.day-search {
  flex-shrink: 0;
  padding: 12px 12px 0;
}

.day-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 64px;
  margin-bottom: 8px;
  padding: 10px 12px;
  padding-inline-start: 16px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  text-align: start;
  cursor: pointer;
}

.day-row:active {
  background: rgba(var(--v-theme-primary), 0.06);
}

.day-row:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}

/* Status colour stripe on the leading edge (flips automatically in RTL) */
.day-row__stripe {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  width: 5px;
}

.day-row__time {
  flex-shrink: 0;
  min-width: 62px;
  font-size: 0.85rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.day-row__info {
  display: grid;
  flex: 1;
  gap: 1px;
  min-width: 0;
}

.day-row__name {
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.day-row__meta {
  overflow: hidden;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Details dialog: the note is shown in full, with the line breaks staff typed */
.reservation-note {
  margin-top: 2px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.875rem;
  line-height: 1.6;
  overflow-wrap: anywhere;
  white-space: pre-line;
}

/* RTL Support */
:deep([dir="rtl"]) .event-time {
  margin-left: 0;
  margin-right: 4px;
}

:deep([dir="rtl"]) .event-name {
  margin-right: 0;
  margin-left: 4px;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .calendar-day {
    min-height: 70px;
    padding: 4px;
  }
  
  .day-number {
    font-size: 12px;
  }
  
  .event-chip {
    font-size: 8px;
    padding: 1px 4px;
  }
  
  .calendar-header-cell {
    padding: 8px 4px;
    font-size: 12px;
  }
}

/* Phones: a day name never breaks mid-word in the narrow columns */
@media (max-width: 599px) {
  .calendar-header-cell {
    padding: 8px 1px;
    font-size: 10.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
