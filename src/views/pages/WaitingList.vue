<template>
  <div class="waiting-list-page app-page">
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
        
        <div class="d-flex align-center gap-2">
          <v-btn
            v-if="canAddPatient"
            color="primary"
            prepend-icon="mdi-account-plus-outline"
            @click="openPatientDialog"
          >
            {{ $t('waitingList.addPatient') }}
          </v-btn>
          <v-btn
            icon="mdi-refresh"
            variant="text"
            :loading="loading"
            @click="loadReservations"
          />
        </div>
      </div>
    </div>

    <!-- Filters Card -->
    <v-card class="mb-4" elevation="2" rounded="xl">
      <v-card-text>
        <v-row align="center" dense>
          <!-- Doctor Filter -->
          <v-col cols="12" sm="6" md="3">
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
          <v-col cols="12" sm="6" md="3">
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

          <!-- Sort -->
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="sortMode"
              :items="sortOptions"
              :label="$t('waitingList.sortBy')"
              prepend-inner-icon="mdi-sort"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>

          <!-- Counts -->
          <v-col cols="12" sm="6" md="3" class="d-flex flex-wrap align-center justify-md-end gap-2">
            <v-chip color="primary" variant="tonal" size="small">
              <v-icon start size="small">mdi-account-group</v-icon>
              {{ filteredReservations.length }} {{ $t('waitingList.reservations') || 'حجز' }}
            </v-chip>
            <v-chip color="warning" variant="tonal" size="small">
              <v-icon start size="small">mdi-timer-sand</v-icon>
              {{ waitingCount }} {{ $t('waitingList.waiting') }}
            </v-chip>
            <v-chip color="success" variant="tonal" size="small">
              <v-icon start size="small">mdi-check-circle</v-icon>
              {{ doneCount }} {{ $t('waitingList.markDone') }}
            </v-chip>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Reservations: the clinic picks the table or the cards in Settings -->
    <WaitingListTable
      v-if="waitingListStyle === 'table'"
      :items="filteredReservations"
      :queue-numbers="queueNumbers"
      :loading="loading"
      :updating-status="updatingStatus"
      :date-label="formattedToday"
      @open="goToPatient"
      @toggle-done="toggleDone"
    />

    <template v-else>
      <v-progress-linear v-if="loading" indeterminate color="primary" rounded class="mb-3" />

      <div class="wl-card-list" :aria-busy="loading">
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
            :class="{
              'wl-card--next': item.id === nextReservationId,
              'wl-card--done': isDone(item),
              'wl-card--cancelled': isCancelled(item),
              'wl-card--updating': updatingStatus.has(item.id)
            }"
          >
            <span class="wl-card__accent" v-bind="getStatusAccent(item.status)" aria-hidden="true" />

            <div
              class="wl-card__body"
              role="button"
              tabindex="0"
              @click="goToPatient(item)"
              @keydown.enter="goToPatient(item)"
            >
              <!-- Queue number + identity + time -->
              <div class="wl-card__top">
                <div
                  class="wl-card__queue"
                  dir="ltr"
                  :title="$t('waitingList.queueNumber')"
                  :aria-label="`${$t('waitingList.queueNumber')} ${queueNumbers.get(item.id)}`"
                >
                  <span class="wl-card__queue-hash">#</span>{{ queueNumbers.get(item.id) }}
                </div>

                <div class="wl-card__identity">
                  <div class="wl-card__name-row">
                    <h2 class="wl-card__name">
                      {{ item.patient?.name || $t('common.noData') }}
                    </h2>
                    <v-chip
                      v-if="item.id === nextReservationId"
                      color="warning"
                      size="x-small"
                      variant="flat"
                      prepend-icon="mdi-bell-ring-outline"
                      class="font-weight-bold"
                    >
                      {{ $t('waitingList.next') }}
                    </v-chip>
                  </div>
                  <div class="wl-card__meta">
                    <span v-if="item.patient?.phone" dir="ltr">
                      <v-icon size="13">mdi-phone-outline</v-icon>
                      {{ item.patient.phone }}
                    </span>
                    <span v-if="item.patient?.age">
                      <v-icon size="13">mdi-cake-variant-outline</v-icon>
                      {{ item.patient.age }} {{ $t('patients.years') }}
                    </span>
                  </div>
                </div>

                <div class="wl-card__time" dir="ltr">
                  <v-icon size="15">mdi-clock-outline</v-icon>
                  <span>{{ formatTime(item.reservation_from_time) }}</span>
                </div>
              </div>

              <!-- Doctor + status/type -->
              <div class="wl-card__details">
                <div class="wl-card__doctor">
                  <span class="wl-card__doctor-icon">
                    <v-icon size="16">mdi-doctor</v-icon>
                  </span>
                  <span class="text-truncate">{{ item.doctor?.name || $t('common.noData') }}</span>
                </div>

                <div class="wl-card__chips">
                  <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal" class="wl-card__status-chip font-weight-medium">
                    <v-icon start size="14">{{ isDone(item) ? 'mdi-check-circle' : 'mdi-timer-sand' }}</v-icon>
                    {{ getStatusText(item.status) }}
                  </v-chip>
                  <v-chip
                    v-if="item.reservation_type"
                    size="small"
                    :color="item.reservation_type.id === 1 ? 'teal' : 'purple'"
                    variant="tonal"
                    class="wl-card__type-chip"
                    :title="typeChipNote(item) || undefined"
                  >
                    <v-icon start size="14">{{ item.reservation_type.id === 1 ? 'mdi-stethoscope' : 'mdi-dots-horizontal-circle-outline' }}</v-icon>
                    <span class="text-truncate">{{ typeChipNote(item) || item.reservation_type.name }}</span>
                  </v-chip>
                </div>
              </div>

              <!-- Notes -->
              <div
                v-if="item.notes || boxTypeNote(item)"
                class="wl-card__notes"
                :title="[item.notes, boxTypeNote(item)].filter(Boolean).join('\n')"
              >
                <v-icon size="16" class="wl-card__notes-icon">mdi-note-text-outline</v-icon>
                <div class="wl-card__notes-text">
                  <div v-if="item.notes">{{ item.notes }}</div>
                  <div v-if="boxTypeNote(item)" class="text-caption text-medium-emphasis">
                    {{ boxTypeNote(item) }}
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
    </template>

    <!-- Snackbar for status update feedback -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top">
      {{ snackbar.text }}
    </v-snackbar>

    <!-- Add patient: booked for today at the current time -->
    <PatientFormDialog
      v-model="patientDialog"
      :doctors="doctors"
      :default-doctor-id="defaultBookingDoctorId"
      book-now
      @saved="handlePatientSaved"
      @error="handlePatientError"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { reservationService } from '@/services/reservation.service'
import DoctorService from '@/services/doctor.service'
import { useAuthStore } from '@/stores/authNew'
import { PERMISSIONS } from '@/constants/permissions'
import PatientFormDialog from '@/components/PatientFormDialog.vue'
import WaitingListTable from '@/components/waitingList/WaitingListTable.vue'
import { holdKeyboard } from '@/utils/mobileKeyboard'
import { useClinicSettings } from '@/composables/useClinicSettings'
import {
  clockPart,
  formatClockTime,
  getStatusColor,
  getStatusName,
  isDone,
  isCancelled,
  isWaiting,
  getStatusAccent
} from '@/utils/waitingList'

const router = useRouter()
const { t, locale } = useI18n()
const authStore = useAuthStore()
const { waitingListStyle, loadSettings } = useClinicSettings()

// State
const loading = ref(false)
const reservations = ref([])
const doctors = ref([])
const selectedDoctor = ref(null)
const patientSearch = ref('')
const updatingStatus = ref(new Set())
const snackbar = ref({ show: false, text: '', color: 'success' })
const patientDialog = ref(false)

function openPatientDialog() {
  holdKeyboard() // phones: keyboard opens with the tap, ready for the name
  patientDialog.value = true
}

// Sort choice is remembered per browser
const SORT_MODES = ['time', 'waiting', 'latest']
const SORT_STORAGE_KEY = 'waitingList.sort'

function readSortMode() {
  try {
    const saved = localStorage.getItem(SORT_STORAGE_KEY)
    return SORT_MODES.includes(saved) ? saved : 'time'
  } catch {
    return 'time'
  }
}

const sortMode = ref(readSortMode())

watch(sortMode, (mode) => {
  try {
    localStorage.setItem(SORT_STORAGE_KEY, mode)
  } catch {
    // Storage blocked (private mode): keep the choice for this visit only
  }
})

const sortOptions = computed(() => [
  { value: 'time', title: t('waitingList.sortTimeAsc') },
  { value: 'waiting', title: t('waitingList.sortWaitingFirst') },
  { value: 'latest', title: t('waitingList.sortTimeDesc') }
])

const canAddPatient = computed(() => authStore.hasPermission(PERMISSIONS.CREATE_PATIENT))

// New patients are booked with the doctor being viewed, or with the doctor adding them
const defaultBookingDoctorId = computed(() =>
  selectedDoctor.value || (authStore.isDoctor || authStore.isClinicSuperDoctor ? authStore.user?.id : null)
)

// Get today's local date in YYYY-MM-DD format (toISOString would give the UTC date)
function getTodayDate() {
  const today = new Date()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return `${today.getFullYear()}-${m}-${d}`
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

// Doctor options for filter
const doctorOptions = computed(() => {
  return [
    { id: null, name: t('common.all') || 'الكل' },
    ...doctors.value.map(d => ({ id: d.id, name: d.name }))
  ]
})

// Arrival order: booking time, then creation time (the API returns today's rows unordered)
function compareArrival(a, b) {
  return (clockPart(a.reservation_from_time) || '99').localeCompare(clockPart(b.reservation_from_time) || '99')
    || (a.created_at || '').localeCompare(b.created_at || '')
    || a.id - b.id
}

const arrivalOrder = computed(() => [...reservations.value].sort(compareArrival))

// Queue number = position in today's arrival order, so it stays put while searching or re-sorting
const queueNumbers = computed(() => new Map(arrivalOrder.value.map((r, i) => [r.id, i + 1])))

const nextReservationId = computed(() => arrivalOrder.value.find(isWaiting)?.id ?? null)

const waitingCount = computed(() => reservations.value.filter(isWaiting).length)
const doneCount = computed(() => reservations.value.filter(isDone).length)

const sortedReservations = computed(() => {
  const list = [...arrivalOrder.value]
  if (sortMode.value === 'latest') return list.reverse()
  if (sortMode.value === 'waiting') {
    // Finished and cancelled sink to the bottom; arrival order is kept within each group
    const rank = r => (isDone(r) || isCancelled(r) ? 1 : 0)
    return list.sort((a, b) => rank(a) - rank(b))
  }
  return list
})

// Sorted reservations narrowed by patient search
const filteredReservations = computed(() => {
  if (!patientSearch.value) {
    return sortedReservations.value
  }

  const search = patientSearch.value.toLowerCase()
  return sortedReservations.value.filter(r => {
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

function formatTime(timeString) {
  return formatClockTime(timeString) || t('common.noData') || '-'
}

function getStatusText(status) {
  return getStatusName(status) || t('waitingList.pending') || 'قيد الانتظار'
}

// The "Other" type's chip shows what was typed for it, instead of the word "Other"
// and a notes box that would make the card taller
function typeChipNote(item) {
  const type = item.reservation_type
  return type && type.id !== 1 ? item.reservation_type_note || '' : ''
}

// A type note with no chip to sit on stays in the notes box
function boxTypeNote(item) {
  return typeChipNote(item) ? '' : item.reservation_type_note
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

function handlePatientSaved({ message, color }) {
  snackbar.value = { show: true, text: message, color: color || 'success' }
  loadReservations()
}

function handlePatientError({ message, color }) {
  snackbar.value = { show: true, text: message, color: color || 'error' }
}

// Lifecycle
onMounted(() => {
  loadSettings(true) // fresh every time: the style may have just changed on another device
  loadDoctors()
  loadReservations()
})
</script>

<style scoped>

.gap-2 {
  gap: 8px;
}

.gap-3 {
  gap: 12px;
}

/* ==================== Reservation cards ==================== */
.wl-card-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
  /* Every row takes the tallest card's height, so all cards are the same size */
  grid-auto-rows: 1fr;
  gap: 16px;
  padding-block: 4px 16px;
}

.wl-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 20px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06);
  transition: transform 0.15s ease, box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
}

@media (hover: hover) {
  .wl-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.1);
  }
}

.wl-card:active {
  transform: scale(0.985);
}

.wl-card--skeleton {
  flex-direction: row;
  padding: 8px;
}

/* Status colour stripe on the leading edge (flips automatically in RTL) */
.wl-card__accent {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  width: 5px;
}

/* Fills the card's spare height, keeping the footer pinned to the bottom */
.wl-card__body {
  flex: 1;
  display: grid;
  align-content: start;
  gap: 12px;
  padding: 16px 16px 14px;
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

/* Queue number badge */
.wl-card__queue {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  height: 52px;
  padding-inline: 6px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)), rgba(var(--v-theme-primary), 0.72));
  color: rgb(var(--v-theme-on-primary));
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.3);
}

.wl-card__queue-hash {
  margin-inline-end: 1px;
  font-size: 0.8rem;
  font-weight: 700;
  opacity: 0.75;
}

.wl-card__identity {
  flex: 1;
  min-width: 0;
}

.wl-card__name-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
}

.wl-card__name {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.5;
  color: rgb(var(--v-theme-on-surface));
  overflow-wrap: anywhere;
}

.wl-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 12px;
  margin-top: 2px;
  font-size: 0.78rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.wl-card__meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.wl-card__time {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  align-self: flex-start;
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

/* Doctor + chips panel */
.wl-card__details {
  display: grid;
  gap: 10px;
  min-width: 0;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(var(--v-theme-on-surface), 0.035);
}

.wl-card__doctor {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 0.875rem;
  font-weight: 600;
}

.wl-card__doctor-icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: rgba(0, 137, 123, 0.14);
  color: #00897B;
}

.wl-card__chips {
  display: flex;
  gap: 6px;
  min-width: 0;
}

/* Chips stay on one row so a long note can't add height: the status keeps its
   width and the type chip takes what is left, ending in "…" */
.wl-card__status-chip {
  flex-shrink: 0;
}

.wl-card__type-chip {
  min-width: 0;
}

.wl-card__type-chip :deep(.v-chip__content) {
  min-width: 0;
}

.wl-card__notes {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
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

/* Cards share one height, so a long note is cut at two lines rather than
   stretching every card; the full text is in the tooltip. */
.wl-card__notes-text > div {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}

.wl-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 12px 8px;
  padding-inline-start: 16px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
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

/* Next patient to go in */
.wl-card--next {
  border-color: rgba(var(--v-theme-warning), 0.6);
  box-shadow: 0 0 0 3px rgba(var(--v-theme-warning), 0.15), 0 6px 18px rgba(15, 23, 42, 0.08);
}

.wl-card--next .wl-card__queue {
  background: linear-gradient(135deg, rgb(var(--v-theme-warning)), rgba(var(--v-theme-warning), 0.72));
  color: rgb(var(--v-theme-on-warning));
  box-shadow: 0 4px 14px rgba(var(--v-theme-warning), 0.4);
}

/* Completed reservation */
.wl-card--done {
  background: rgba(var(--v-theme-success), 0.06);
  border-color: rgba(var(--v-theme-success), 0.35);
}

.wl-card--done .wl-card__queue {
  background: rgba(var(--v-theme-success), 0.14);
  color: rgb(var(--v-theme-success));
  box-shadow: none;
}

.wl-card--done .wl-card__time {
  background: rgba(var(--v-theme-success), 0.14);
  color: rgb(var(--v-theme-success));
}

/* Cancelled reservation */
.wl-card--cancelled {
  opacity: 0.7;
}

.wl-card--cancelled .wl-card__queue {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.55);
  box-shadow: none;
}

.wl-card--updating {
  opacity: 0.65;
}

/* Empty state */
.wl-empty {
  grid-column: 1 / -1;
  padding: 48px 16px;
  border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 20px;
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
