<template>
  <v-dialog v-model="internalDialog" max-width="700" persistent @after-enter="focusNameField">
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="patient-form-heading">
          <v-avatar color="primary" variant="tonal" rounded="lg" size="42">
            <v-icon size="23">{{ editMode ? 'mdi-account-edit-outline' : 'mdi-account-plus-outline' }}</v-icon>
          </v-avatar>
          <h2 class="patient-form-heading__title">
            {{ editMode ? $t('patients.edit_patient') : $t('patients.add_patient') }}
          </h2>
        </div>
        <v-btn icon="mdi-close" variant="text" color="primary" :aria-label="$t('common.close')" @click="handleClose" />
      </v-card-title>

      <v-card-text class="pa-6">
        <v-form ref="patientForm" @submit.prevent="savePatient">
          <v-row>
            <!-- Name Field with Patient Combobox -->
            <v-col cols="12">
              <v-combobox
                ref="nameField"
                v-model="patientData.name"
                :items="patientSearchList"
                :loading="loadingPatientSearch"
                :search-input.sync="patientNameSearch"
                item-title="text"
                item-value="value"
                :rules="[v => !!v || $t('validation.required')]"
                :label="$t('patients.name') + ' *'"
                :hint="editMode || existingPatient ? '' : $t('patients.search_existing_hint')"
                persistent-hint
                prepend-inner-icon="mdi-account"
                variant="outlined"
                clearable
                :error-messages="formErrors.name"
                @update:search="searchPatientsByName"
                @update:model-value="handlePatientNameSelect"
              >
                <template v-slot:no-data>
                  <v-list-item>
                    <v-list-item-title>
                      {{ patientNameSearch ? $t('patients.add_new_name') : $t('patients.type_to_search_patients') }}
                    </v-list-item-title>
                  </v-list-item>
                </template>

                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template v-slot:title>
                      {{ item.raw.text || item.raw.name }}
                    </template>
                    <template v-slot:subtitle>
                      {{ item.raw.phone }} - {{ $t('patients.age') }}: {{ item.raw.age || $t('patients.not_specified') }}
                    </template>
                  </v-list-item>
                </template>
              </v-combobox>
            </v-col>

            <!-- A registered patient was picked: only a booking is added for them -->
            <v-col v-if="existingPatient" cols="12" class="pt-0">
              <v-alert type="success" variant="tonal" density="compact" icon="mdi-account-check-outline">
                <div class="text-body-2 font-weight-medium">{{ $t('patients.existing_patient_selected') }}</div>
                <div class="existing-patient-meta text-caption">
                  <span v-if="existingPatient.phone" dir="ltr">
                    <v-icon size="13">mdi-phone-outline</v-icon>
                    {{ existingPatient.phone }}
                  </span>
                  <span v-if="existingPatient.age">
                    <v-icon size="13">mdi-cake-variant-outline</v-icon>
                    {{ existingPatient.age }} {{ $t('patients.years') }}
                  </span>
                </div>
                <v-btn
                  size="small"
                  variant="text"
                  color="primary"
                  prepend-icon="mdi-account-plus-outline"
                  class="mt-1 px-1"
                  @click="existingPatient = null"
                >
                  {{ $t('patients.register_as_new') }}
                </v-btn>
              </v-alert>
            </v-col>

            <template v-if="!existingPatient">
              <!-- Phone: right after the name, the two things always asked first -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="patientData.phone"
                  :label="$t('patients.phone')"
                  prepend-inner-icon="mdi-phone"
                  variant="outlined"
                  dir="ltr"
                  placeholder="07XX XXX XXXX"
                  maxlength="13"
                  :error-messages="formErrors.phone"
                  @input="formatPhoneNumber"
                />
              </v-col>

              <!-- Birth Date (default) or Age, per the clinic's patient_age_input setting -->
              <v-col v-if="asksForAge" cols="12" md="6">
                <v-text-field
                  v-model.number="patientData.age"
                  :label="$t('patients.age')"
                  prepend-inner-icon="mdi-cake-variant-outline"
                  variant="outlined"
                  type="number"
                  min="0"
                  max="150"
                  :rules="[ageRule]"
                  :error-messages="formErrors.age"
                />
              </v-col>
              <v-col v-else cols="12" md="6">
                <v-text-field
                  v-model="birthDateDisplay"
                  :label="$t('patients.birth_date')"
                  prepend-inner-icon="mdi-calendar-blank"
                  variant="outlined"
                  placeholder="YYYY or YYYY-MM-DD (optional)"
                  :hint="$t('patients.birth_date_hint')"
                  persistent-hint
                  :error-messages="formErrors.birth_date"
                  @input="handleBirthDateInput"
                  clearable
                />
              </v-col>

              <!-- Gender/Sex -->
              <v-col cols="12" md="6">
                <div class="text-subtitle-2 mb-2">{{ $t('patients.sex') }}</div>
                <v-radio-group
                  v-model="patientData.sex"
                  :error-messages="formErrors.sex"
                  inline
                >
                  <v-radio
                    v-for="option in genderOptions"
                    :key="option.value"
                    :label="option.text"
                    :value="option.value"
                    color="primary"
                  />
                </v-radio-group>
              </v-col>

              <!-- Address -->
              <v-col cols="12">
                <v-text-field
                  v-model="patientData.address"
                  :label="$t('patients.address')"
                  prepend-inner-icon="mdi-map-marker"
                  variant="outlined"
                  :error-messages="formErrors.address"
                />
              </v-col>
            </template>

            <!-- Note -->
            <!-- <v-col cols="12">
              <v-textarea
                v-model="patientData.note"
                :label="$t('patients.note')"
                prepend-inner-icon="mdi-note"
                variant="outlined"
                rows="3"
                :error-messages="formErrors.note"
              />
            </v-col> -->
          </v-row>

          <!-- Book Reservation Section (Add mode only) -->
          <template v-if="!editMode">
            <v-divider class="my-4" />
            <div
              class="booking-section rounded-xl pa-4"
              :class="bookingEnabled ? 'bg-primary-lighten-5' : 'bg-grey-lighten-5'"
              style="border: 2px solid; transition: all 0.3s ease;"
              :style="bookingEnabled ? 'border-color: rgb(var(--v-theme-primary))' : 'border-color: transparent'"
            >
              <!-- Toggle Header -->
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center ga-3">
                  <v-icon
                    :color="bookingEnabled ? 'primary' : 'grey'"
                    size="26"
                  >mdi-calendar-check</v-icon>
                  <div>
                    <div
                      class="text-subtitle-1 font-weight-semibold"
                      :class="bookingEnabled ? 'text-primary' : 'text-grey-darken-2'"
                    >{{ $t('patients.book_reservation') }}</div>
                    <div class="text-caption text-grey">{{ $t('reservations.new_booking') }}</div>
                  </div>
                </div>
                <v-switch
                  v-if="!bookNow && !existingPatient"
                  v-model="bookingEnabled"
                  color="primary"
                  hide-details
                  density="compact"
                  inset
                />
              </div>

              <!-- Booking Fields -->
              <v-expand-transition>
                <div v-if="bookingEnabled" class="mt-5">
                  <v-row>
                    <!-- Date -->
                    <v-col v-if="!bookNow" cols="12" md="6">
                      <v-text-field
                        v-model="inlineBookingData.date"
                        :label="$t('reservations.date')"
                        type="date"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-calendar"
                        color="primary"
                        :rules="[v => !!v || $t('validation.required')]"
                      />
                    </v-col>

                    <!-- Time -->
                    <v-col v-if="!bookNow" cols="12" md="6">
                      <v-text-field
                        v-model="inlineBookingData.from_time"
                        :label="$t('reservations.time')"
                        type="time"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-clock-start"
                        color="primary"
                      />
                    </v-col>

                    <!-- Doctor -->
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="inlineBookingData.doctor_id"
                        :items="doctors"
                        :label="$t('reservations.select_doctor')"
                        item-title="name"
                        item-value="id"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-doctor"
                        clearable
                        color="primary"
                      />
                    </v-col>

                    <!-- Appointment Type -->
                    <v-col cols="12">
                      <div class="text-caption text-grey-darken-1 mb-2 font-weight-medium">
                        {{ $t('reservations.reservation_type') }}
                      </div>
                      <v-radio-group
                        v-model="inlineBookingData.reservation_type_id"
                        inline
                        color="primary"
                        hide-details
                        density="compact"
                      >
                        <v-radio
                          v-for="rt in reservationTypes"
                          :key="rt.id"
                          :label="rt.name"
                          :value="rt.id"
                        />
                      </v-radio-group>
                    </v-col>

                    <!-- Reservation Type Note -->
                    <v-col cols="12" v-if="inlineBookingData.reservation_type_id && inlineBookingData.reservation_type_id !== 1">
                      <v-textarea
                        v-model="inlineBookingData.reservation_type_note"
                        :label="$t('reservations.reservation_type_note')"
                        variant="outlined"
                        density="comfortable"
                        rows="2"
                        auto-grow
                        prepend-inner-icon="mdi-note-text-outline"
                        color="primary"
                      />
                    </v-col>
                  </v-row>

                  <v-alert
                    type="info"
                    variant="tonal"
                    density="compact"
                    class="mt-2"
                    icon="mdi-information-outline"
                  >
                    <span v-if="bookNow" class="text-caption">{{ $t('waitingList.bookedNowNote') }}</span>
                    <span v-else class="text-caption">
                      {{ $t('reservations.date') }}: <strong>{{ inlineBookingData.date }}</strong>
                      &nbsp;·&nbsp;
                      {{ $t('reservations.time') }}: <strong>{{ inlineBookingData.from_time }}</strong>
                    </span>
                  </v-alert>
                </div>
              </v-expand-transition>
            </div>
          </template>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="handleClose">
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          :loading="saving"
          @click="savePatient"
        >
          {{ existingPatient ? $t('patients.book_only') : editMode ? $t('common.update') : $t('common.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'
import reservationService from '@/services/reservation.service'
import { useAuthStore } from '@/stores/auth'
import { useClinicSettings } from '@/composables/useClinicSettings'
import { releaseKeyboard } from '@/utils/mobileKeyboard'

// ==================== Props & Emits ====================
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  editMode:   { type: Boolean, default: false },
  patient:    { type: Object,  default: null   },
  doctors:    { type: Array,   default: () => [] },
  // Waiting list: always book the new patient for today, at the moment they are saved
  bookNow:         { type: Boolean, default: false },
  defaultDoctorId: { type: [Number, String], default: null }
})

const emit = defineEmits(['update:modelValue', 'saved', 'error'])

const { t } = useI18n()
const { patientAgeInput, loadSettings } = useClinicSettings()
const authStore = useAuthStore()

// ==================== Helpers ====================
function getTodayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getNowTime() {
  const d = new Date()
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0'))
    .join(':')
}

// ==================== State ====================
const saving = ref(false)
const patientForm = ref(null)
const nameField = ref(null)

const birthDateDisplay = ref('')
const yearOnlyMode = ref(false)
const birthYear = ref('')

const patientSearchList = ref([])
const loadingPatientSearch = ref(false)
const patientNameSearch = ref('')
let patientSearchTimeout = null
// Add mode: a registered patient picked from the name search. Saving then
// only books them, instead of registering the same person a second time.
const existingPatient = ref(null)

const bookingEnabled = ref(false)
const reservationTypes = ref([
  { id: 1, name: t('reservations.examination') },
  { id: 2, name: t('reservations.other') }
])
const loadingReservationTypes = ref(false)

const patientData = reactive({
  name: '',
  phone: '',
  sex: null,
  age: null,
  doctor_id: null,
  identifier: '',
  address: '',
  notes: '',
  birth_date: '',
  systemic_conditions: '',
  rx_id: '',
  note: '',
  credit_balance: null,
  credit_balance_add_at: '',
  from_where_come_id: null
})

const formErrors = reactive({})

const inlineBookingData = reactive({
  date: getTodayISO(),
  from_time: getNowTime().slice(0, 5),
  doctor_id: null,
  reservation_type_id: 1,
  reservation_type_note: '',
  notes: ''
})

// ==================== Computed ====================
const internalDialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const genderOptions = computed(() => [
  { text: t('patients.male'),   value: 1 },
  { text: t('patients.female'), value: 2 }
])

// The clinic picks in Settings whether staff type a birth date or an age.
// Either way the full patient is sent and the API keeps the two consistent.
const asksForAge = computed(() => patientAgeInput.value === 'age')

const ageRule = v =>
  v === null || v === '' || (Number.isInteger(Number(v)) && v >= 0 && v <= 150) || t('patients.age_invalid')

// ==================== Watchers ====================
watch(() => props.modelValue, async (opened) => {
  if (opened) {
    loadSettings(true) // fresh every time: the age setting may have just changed on another device
    loadReservationTypes()
    if (props.editMode && props.patient) {
      populateForm(props.patient)
    } else {
      resetForm()
    }
    // Take over the keyboard the opener held as soon as the field exists;
    // @after-enter tries again in case it is not rendered yet.
    await nextTick()
    focusNameField()
  } else {
    releaseKeyboard()
  }
})

async function loadReservationTypes() {
  try {
    const response = await api.get('/reservation-types')
    const data = response.data?.data || response.data || []
    if (data.length) {
      reservationTypes.value = data
    }
    if (!inlineBookingData.reservation_type_id && reservationTypes.value.length) {
      inlineBookingData.reservation_type_id = reservationTypes.value[0].id
    }
  } catch (e) {
    console.error('Failed to load reservation types, using defaults:', e)
  }
}

// ==================== Methods ====================
// Adding a patient starts with typing the name, so put the cursor there and,
// on phones, keep the keyboard the opener held (see utils/mobileKeyboard).
function focusNameField() {
  if (props.editMode || !nameField.value) return
  releaseKeyboard(nameField.value)
}

function populateForm(patient) {
  Object.assign(patientData, {
    name:                  patient.name,
    phone:                 patient.phone,
    sex:                   patient.sex,
    age:                   patient.age,
    doctor_id:             patient.doctor_id,
    identifier:            patient.identifier,
    address:               patient.address,
    notes:                 patient.notes,
    birth_date:            patient.birth_date || '',
    systemic_conditions:   patient.systemic_conditions || '',
    rx_id:                 patient.rx_id || '',
    note:                  patient.note || '',
    credit_balance:        patient.credit_balance,
    credit_balance_add_at: patient.credit_balance_add_at || '',
    from_where_come_id:    patient.from_where_come_id
  })
  birthDateDisplay.value = patient.birth_date || ''
}

function resetForm() {
  Object.assign(patientData, {
    name: '', phone: '', sex: null, age: null, doctor_id: null,
    identifier: '', address: '', notes: '', birth_date: '',
    systemic_conditions: '', rx_id: '', note: '',
    credit_balance: null, credit_balance_add_at: '', from_where_come_id: null
  })
  Object.keys(formErrors).forEach(key => delete formErrors[key])
  yearOnlyMode.value = false
  birthYear.value = ''
  birthDateDisplay.value = ''
  patientNameSearch.value = ''
  patientSearchList.value = []
  existingPatient.value = null
  bookingEnabled.value = props.bookNow
  // The booking defaults to right now; the time field takes HH:MM
  Object.assign(inlineBookingData, {
    date: getTodayISO(),
    from_time: getNowTime().slice(0, 5),
    doctor_id: props.defaultDoctorId,
    reservation_type_id: reservationTypes.value[0]?.id || 1,
    reservation_type_note: '',
    notes: ''
  })
}

function handleClose() {
  internalDialog.value = false
  resetForm()
}

// ─── Patient Name Combobox ───────────────────────────────────────────────────
async function searchPatientsByName(searchTerm) {
  if (patientSearchTimeout) clearTimeout(patientSearchTimeout)
  if (!searchTerm || searchTerm.length < 2) {
    patientSearchList.value = []
    return
  }
  patientSearchTimeout = setTimeout(async () => {
    try {
      loadingPatientSearch.value = true
      const response = await api.get('/patients', { params: { search: searchTerm, per_page: 20 } })
      if (response.data) {
        patientSearchList.value = response.data.map(p => ({
          text: p.name, value: p.name, name: p.name,
          phone: p.phone || '',
          age: p.age || t('patients.not_specified'),
          id: p.id, fullData: p
        }))
      }
    } catch (err) {
      console.error('Failed to search patients:', err)
      patientSearchList.value = []
    } finally {
      loadingPatientSearch.value = false
    }
  }, 300)
}

function handlePatientNameSelect(selectedItem) {
  if (!selectedItem) {
    existingPatient.value = null
    return
  }
  if (typeof selectedItem === 'string') {
    patientData.name = selectedItem
    // Typing a different name goes back to registering a new patient
    if (existingPatient.value && selectedItem !== existingPatient.value.name) {
      existingPatient.value = null
    }
    return
  }
  if (typeof selectedItem === 'object') {
    patientData.name = selectedItem.fullData?.name || selectedItem.name || selectedItem.text || selectedItem
    if (!props.editMode && selectedItem.fullData) {
      existingPatient.value = selectedItem.fullData
      bookingEnabled.value = true
    }
  }
}

// ─── Phone Formatting ────────────────────────────────────────────────────────
function formatPhoneNumber(event) {
  let value = event.target.value.replace(/\D/g, '')
  if (value.length > 4 && value.length <= 7) {
    value = value.substring(0, 4) + ' ' + value.substring(4)
  } else if (value.length > 7) {
    value = value.substring(0, 4) + ' ' + value.substring(4, 7) + ' ' + value.substring(7, 11)
  }
  value = value.substring(0, 13)
  patientData.phone = value
  event.target.value = value
}

// ─── Birth Date ──────────────────────────────────────────────────────────────
function isMinaTenant() {
  return localStorage.getItem('x-tenant-id') === '_mina'
}

function handleBirthDateInput(event) {
  let value = event.target ? event.target.value : event
  if (!value || value.trim() === '') {
    patientData.birth_date = ''
    birthDateDisplay.value = ''
    return
  }

  let cleanValue = value.replace(/[^\d-]/g, '')
  const trimmed = cleanValue.trim()

 
    if (/^\d{4}$/.test(trimmed)) {
      patientData.birth_date = `${trimmed}-01-01`
      birthDateDisplay.value = `${trimmed}-01-01`
      if (event.target) event.target.value = birthDateDisplay.value
      return
    }

    if (/^\d{4}-\d{1,2}$/.test(trimmed)) {
      const [y, mo] = trimmed.split('-')
      const formatted = `${y}-${mo.padStart(2, '0')}-01`
      patientData.birth_date = formatted
      birthDateDisplay.value = formatted
      if (event.target) event.target.value = birthDateDisplay.value
      return
    }

    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
      const parts = trimmed.split('-')
      const formatted = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
      patientData.birth_date = formatted
      birthDateDisplay.value = formatted
      if (event.target) event.target.value = birthDateDisplay.value
      return
    }

    patientData.birth_date = ''
    birthDateDisplay.value = cleanValue
    if (event.target) event.target.value = cleanValue
    return
 

  // Non-_mina tenants: keep original behavior (no automatic 01-01 fill)
  if (/^\d{4}$/.test(trimmed)) {
    patientData.birth_date = trimmed
    birthDateDisplay.value = trimmed
    if (event.target) event.target.value = trimmed
    return
  }

  if (/^\d{4}-\d{1,2}$/.test(trimmed)) {
    patientData.birth_date = trimmed
    birthDateDisplay.value = trimmed
    if (event.target) event.target.value = trimmed
    return
  }

  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
    patientData.birth_date = trimmed
    birthDateDisplay.value = trimmed
    if (event.target) event.target.value = trimmed
    return
  }

  patientData.birth_date = ''
  birthDateDisplay.value = cleanValue
  if (event.target) event.target.value = cleanValue
}

// ─── Save ────────────────────────────────────────────────────────────────────
function createBooking(patientId) {
  let date = inlineBookingData.date
  let fromTime = inlineBookingData.from_time.split(':').length === 2
    ? `${inlineBookingData.from_time}:00`
    : inlineBookingData.from_time

  // Taken at save time, not when the dialog was opened
  if (props.bookNow) {
    date = getTodayISO()
    fromTime = getNowTime()
  }

  return reservationService.create({
    patient_id:              patientId,
    doctor_id:               inlineBookingData.doctor_id,
    clinics_id:              authStore.clinicInfo?.id || 1,
    reservation_start_date:  date,
    reservation_end_date:    date,
    reservation_from_time:   fromTime,
    reservation_type_id:     inlineBookingData.reservation_type_id || null,
    reservation_type_note:   inlineBookingData.reservation_type_id !== 1 ? inlineBookingData.reservation_type_note : '',
    notes:                   inlineBookingData.notes,
    is_waiting: false
  })
}

async function bookExistingPatient() {
  saving.value = true
  try {
    await createBooking(existingPatient.value.id)
    emit('saved', { message: t('reservations.booking_success'), color: 'success' })
    internalDialog.value = false
    resetForm()
  } catch (err) {
    console.error('Failed to book existing patient:', err)
    emit('error', { message: err.response?.data?.message || t('errors.saveFailed'), color: 'error' })
  } finally {
    saving.value = false
  }
}

async function savePatient() {
  const { valid } = await patientForm.value.validate()
  if (!valid) return
  if (existingPatient.value) return bookExistingPatient()

  saving.value = true
  Object.keys(formErrors).forEach(key => delete formErrors[key])

  try {
    // Normalize birth_date to YYYY-MM-DD (optional field)
    if (patientData.birth_date && patientData.birth_date.trim()) {
      const d = patientData.birth_date.trim()
      if (/^\d{4}$/.test(d)) {
        patientData.birth_date = `${d}-01-01`
      } else if (/^\d{4}-\d{1,2}$/.test(d)) {
        const [y, m] = d.split('-')
        patientData.birth_date = `${y}-${m.padStart(2, '0')}-01`
      } else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(d)) {
        const [y,m,day] = d.split('-')
        patientData.birth_date = `${y}-${m.padStart(2,'0')}-${day.padStart(2,'0')}`
      }
    } else {
      // Clear birth date if empty
      patientData.birth_date = ''
    }

    const payload = { ...patientData }
    let response

    if (props.editMode) {
      response = await api.put(`/patients/${props.patient.id}`, payload)
      emit('saved', { message: t('patients.updated'), color: 'success' })
    } else {
      response = await api.post('/patients', payload)

      if (bookingEnabled.value) {
        try {
          const newPatient = response.data || response
          await createBooking(newPatient.id)
          emit('saved', { message: t('patients.booking_also_created'), color: 'success' })
        } catch (bookingErr) {
          console.error('Booking failed after patient save:', bookingErr)
          emit('saved', props.bookNow
            ? { message: t('waitingList.bookingFailed'), color: 'warning' }
            : { message: t('patients.created'), color: 'success' })
        }
      } else {
        emit('saved', { message: t('patients.created'), color: 'success' })
      }
    }

    internalDialog.value = false
    resetForm()
  } catch (err) {
    console.error('Failed to save patient:', err)
    if (err.response?.status === 422) {
      const errors = err.response.data.errors
      Object.keys(errors).forEach(key => { formErrors[key] = errors[key][0] })
    } else {
      emit('error', { message: t('patients.save_error'), color: 'error' })
    }
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.patient-form-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.existing-patient-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 12px;
  margin-top: 2px;
}

.existing-patient-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.patient-form-heading__title {
  font-size: inherit;
  font-weight: 700;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
</style>
