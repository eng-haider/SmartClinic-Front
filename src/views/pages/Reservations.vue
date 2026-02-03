<template>
  <div class="reservations-page">
    <!-- Single Row Header (desktop) / Stacked (mobile) -->
    <div class="page-header mb-3">
      <div class="header-row">
        <!-- Title -->
        <h1 class="header-title text-h5 text-md-h4 font-weight-bold text-primary ma-0">
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
    <v-card elevation="2" rounded="xl">
      <v-progress-linear v-if="loading" indeterminate color="primary" />
      
      <div class="calendar-container pa-4">
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
                v-for="event in day.events.slice(0, 3)"
                :key="event.id"
                class="event-chip"
                :style="{ backgroundColor: getEventColor(event) }"
                @click.stop="openDetailsDialog(event)"
              >
                <span class="event-time">{{ formatTime(event.reservation_from_time) }}</span>
                <span class="event-name">{{ event.patient?.name }}</span>
              </div>
              
              <!-- More events indicator -->
              <div
                v-if="day.events.length > 3"
                class="more-events"
                @click.stop="showAllEvents(day)"
              >
                +{{ day.events.length - 3 }} {{ $t('reservations.more') }}
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
    <v-dialog v-model="detailsDialog" max-width="500">
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

            <v-list-item v-if="selectedReservation.notes">
              <template v-slot:prepend>
                <v-icon color="primary">mdi-note-text</v-icon>
              </template>
              <v-list-item-title>{{ $t('reservations.notes') }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ selectedReservation.notes }}
              </v-list-item-subtitle>
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

    <!-- All Events Dialog -->
    <v-dialog v-model="allEventsDialog" max-width="500">
      <v-card rounded="xl">
        <v-card-title class="pa-4 bg-primary text-white">
          {{ formatDate(selectedDayForEvents?.date) }} - {{ $t('reservations.all_appointments') }}
        </v-card-title>
        <v-card-text class="pa-4">
          <v-list>
            <v-list-item
              v-for="event in selectedDayForEvents?.events"
              :key="event.id"
              @click="openDetailsDialog(event); allEventsDialog = false"
              rounded="lg"
              class="mb-2"
            >
              <template v-slot:prepend>
                <v-avatar :color="getEventColor(event)" size="40">
                  <v-icon color="white">mdi-calendar-clock</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title>{{ event.patient?.name }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ formatTime(event.reservation_from_time) }} - {{ formatTime(event.reservation_to_time) }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import reservationService from '@/services/reservation.service'
import BookingDialog from '@/components/BookingDialog.vue'

const router = useRouter()
const { t, locale } = useI18n()
const authStore = useAuthStore()

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
const selectedDayForEvents = ref(null)

const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// ==================== Computed ====================
const isRtl = computed(() => {
  return locale.value === 'ar' || locale.value === 'ku'
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

const getEventColor = (event) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Parse date string as local date to avoid timezone issues
  const [year, month, day] = event.reservation_start_date.split('-').map(Number)
  const eventDate = new Date(year, month - 1, day)
  eventDate.setHours(0, 0, 0, 0)
  
  // Status ID = 2 (Completed/Confirmed)
  if (event.status_id === 2) {
    return '#2196F3' // Blue
  }
  
  // Future appointments
  if (eventDate > today) {
    return '#FFA500' // Orange
  }
  
  // Past appointments
  return '#4CAF50' // Green
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

const showAllEvents = (day) => {
  selectedDayForEvents.value = day
  allEventsDialog.value = true
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

// ==================== Lifecycle ====================
onMounted(() => {
  loadReservations()
  loadDoctors()
})
</script>

<style scoped>
.reservations-page {
  padding: 12px;
}

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
  .reservations-page {
    padding: 8px;
  }
  
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

.calendar-container {
  overflow-x: auto;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.calendar-header-cell {
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
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: transform 0.2s;
}

.event-chip:hover {
  transform: scale(1.02);
}

.event-time {
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
</style>
