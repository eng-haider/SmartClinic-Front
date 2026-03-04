<template>
  <v-dialog v-model="internalDialog" max-width="700" persistent>
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary">
        <span class="text-white">
          {{ editMode ? $t('patients.edit_patient') : $t('patients.add_patient') }}
        </span>
        <v-btn icon="mdi-close" variant="text" color="white" @click="handleClose" />
      </v-card-title>

      <v-card-text class="pa-6">
        <v-form ref="patientForm" @submit.prevent="savePatient">
          <v-row>
            <!-- Name Field with Patient Combobox -->
            <v-col cols="12">
              <v-combobox
                v-model="patientData.name"
                :items="patientSearchList"
                :loading="loadingPatientSearch"
                :search-input.sync="patientNameSearch"
                item-title="text"
                item-value="value"
                :rules="[v => !!v || $t('validation.required')]"
                :label="$t('patients.name') + ' *'"
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

            <!-- Birth Date -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="birthDateDisplay"
                :label="$t('patients.birth_date')"
                prepend-inner-icon="mdi-calendar-blank"
                variant="outlined"
                placeholder="YYYY or YYYY-MM-DD"
                :hint="$t('patients.birth_date_hint')"
                persistent-hint
                :error-messages="formErrors.birth_date"
                @input="handleBirthDateInput"
              />
            </v-col>

            <!-- Phone -->
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
                    <v-col cols="12" md="6">
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
                    <v-col cols="12" md="6">
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
                    <span class="text-caption">
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
          {{ editMode ? $t('common.update') : $t('common.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'
import reservationService from '@/services/reservation.service'
import { useAuthStore } from '@/stores/auth'

// ==================== Props & Emits ====================
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  editMode:   { type: Boolean, default: false },
  patient:    { type: Object,  default: null   },
  doctors:    { type: Array,   default: () => [] }
})

const emit = defineEmits(['update:modelValue', 'saved', 'error'])

const { t } = useI18n()
const authStore = useAuthStore()

// ==================== Helpers ====================
function getTodayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ==================== State ====================
const saving = ref(false)
const patientForm = ref(null)

const birthDateDisplay = ref('')
const yearOnlyMode = ref(false)
const birthYear = ref('')

const patientSearchList = ref([])
const loadingPatientSearch = ref(false)
const patientNameSearch = ref('')
let patientSearchTimeout = null

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
  from_time: '09:00',
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

// ==================== Watchers ====================
watch(() => props.modelValue, (opened) => {
  if (opened) {
    loadReservationTypes()
    if (props.editMode && props.patient) {
      populateForm(props.patient)
    } else {
      resetForm()
    }
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
  bookingEnabled.value = false
  Object.assign(inlineBookingData, {
    date: getTodayISO(),
    from_time: '09:00',
    doctor_id: null,
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
  if (!selectedItem) return
  if (typeof selectedItem === 'string') {
    patientData.name = selectedItem
    return
  }
  if (typeof selectedItem === 'object') {
    patientData.name = selectedItem.fullData?.name || selectedItem.name || selectedItem.text || selectedItem
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
function handleBirthDateInput(event) {
  let value = event.target ? event.target.value : event
  if (!value) {
    patientData.birth_date = ''
    birthDateDisplay.value = ''
    return
  }

  let cleanValue = value.replace(/[^\d-]/g, '')

  if (cleanValue.length === 4 && !cleanValue.includes('-')) {
    cleanValue += '-'
    birthDateDisplay.value = cleanValue
    if (event.target) event.target.value = cleanValue
    return
  }
  if (/^\d{4}-\d{2}$/.test(cleanValue) && cleanValue.length === 7) {
    cleanValue += '-'
    birthDateDisplay.value = cleanValue
    if (event.target) event.target.value = cleanValue
    return
  }

  const trimmed = cleanValue.trim()
  if (/^\d{4}$/.test(trimmed)) {
    patientData.birth_date = `${trimmed}-01-01`
    birthDateDisplay.value = trimmed
  } else if (/^\d{4}-\d{1,2}$/.test(trimmed)) {
    const [y, mo] = trimmed.split('-')
    patientData.birth_date = `${y}-${mo.padStart(2, '0')}-01`
    birthDateDisplay.value = trimmed
  } else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
    const parts = trimmed.split('-')
    patientData.birth_date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
    birthDateDisplay.value = cleanValue
  } else {
    patientData.birth_date = trimmed
    birthDateDisplay.value = cleanValue
  }
}

// ─── Save ────────────────────────────────────────────────────────────────────
async function savePatient() {
  const { valid } = await patientForm.value.validate()
  if (!valid) return

  saving.value = true
  Object.keys(formErrors).forEach(key => delete formErrors[key])

  try {
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
          const fromTime = inlineBookingData.from_time.split(':').length === 2
            ? `${inlineBookingData.from_time}:00`
            : inlineBookingData.from_time

          await reservationService.create({
            patient_id:              newPatient.id,
            doctor_id:               inlineBookingData.doctor_id,
            clinics_id:              authStore.clinicInfo?.id || 1,
            reservation_start_date:  inlineBookingData.date,
            reservation_end_date:    inlineBookingData.date,
            reservation_from_time:   fromTime,
            reservation_type_id:     inlineBookingData.reservation_type_id || null,
            reservation_type_note:   inlineBookingData.reservation_type_id !== 1 ? inlineBookingData.reservation_type_note : '',
            notes:                   inlineBookingData.notes,
            is_waiting: false
          })
          emit('saved', { message: t('patients.booking_also_created'), color: 'success' })
        } catch (bookingErr) {
          console.error('Booking failed after patient save:', bookingErr)
          emit('saved', { message: t('patients.created'), color: 'success' })
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
