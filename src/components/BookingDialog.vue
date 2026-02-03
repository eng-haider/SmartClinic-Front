<template>
  <v-dialog v-model="internalDialog" max-width="600" persistent>
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary">
        <span class="text-white text-h6">
          {{ $t('reservations.new_booking') }}
        </span>
        <v-btn
          icon="mdi-close"
          variant="text"
          color="white"
          @click="handleClose"
        />
      </v-card-title>

      <v-card-text class="pa-6">
        <v-form ref="bookingForm" v-model="bookingFormValid">
          <!-- Date Picker -->
          <v-text-field
            v-model="bookingData.date"
            :label="$t('reservations.date')"
            type="date"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-calendar"
            :rules="[rules.required]"
            class="mb-4"
          />

          <!-- Patient Search -->
          <v-autocomplete
            v-model="bookingData.patient"
            v-model:search="patientSearch"
            :items="patientOptions"
            :label="$t('reservations.select_patient')"
            :loading="searchingPatients"
            item-title="name"
            item-value="id"
            return-object
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-account-search"
            :rules="[rules.required]"
            class="mb-4"
            clearable
            no-filter
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props">
                <template v-slot:prepend>
                  <v-avatar color="primary" size="40">
                    <span class="text-white">{{ getInitials(item.raw.name) }}</span>
                  </v-avatar>
                </template>
                <template v-slot:subtitle>
                  <span dir="ltr">{{ item.raw.phone }}</span>
                </template>
              </v-list-item>
            </template>
            
            <template v-slot:no-data>
              <v-list-item>
                <v-list-item-title>
                  {{ patientSearch?.length >= 3 
                    ? $t('reservations.no_patients_found') 
                    : $t('reservations.type_to_search') 
                  }}
                </v-list-item-title>
              </v-list-item>
            </template>
          </v-autocomplete>

          <!-- Doctor Selection -->
          <v-select
            v-model="bookingData.doctor_id"
            :items="doctors"
            :label="$t('reservations.select_doctor')"
            item-title="name"
            item-value="id"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-doctor"
            :rules="[rules.required]"
            class="mb-4"
          />

          <!-- Time Picker -->
          <v-text-field
            v-model="bookingData.from_time"
            :label="$t('reservations.time')"
            type="time"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-clock-start"
            :rules="[rules.required]"
            class="mb-4"
          />

          <!-- Appointment Type -->
          <v-radio-group
            v-model="bookingData.appointment_type"
            inline
            class="mb-4"
          >
            <v-radio
              :label="$t('reservations.examination')"
              value="examination"
            />
            <v-radio
              :label="$t('reservations.other')"
              value="other"
            />
          </v-radio-group>

          <!-- Notes (for Other type) -->
          <v-textarea
            v-if="bookingData.appointment_type === 'other'"
            v-model="bookingData.notes"
            :label="$t('reservations.notes')"
            variant="outlined"
            density="comfortable"
            rows="3"
            class="mb-4"
          />

          <!-- WhatsApp Reminder -->
          <v-switch
            v-model="bookingData.sendWhatsApp"
            :label="$t('reservations.send_whatsapp')"
            color="success"
            hide-details
            class="mb-2"
          />

          <!-- WhatsApp Message Preview -->
          <v-alert
            v-if="bookingData.sendWhatsApp && bookingData.patient"
            type="success"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            <div class="text-caption">{{ $t('reservations.message_preview') }}:</div>
            <div class="mt-1" style="white-space: pre-line;">{{ whatsAppMessage }}</div>
          </v-alert>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          variant="text"
          @click="handleClose"
        >
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          :loading="saving"
          :disabled="!bookingFormValid"
          @click="handleSave"
        >
          {{ $t('common.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import reservationService from '@/services/reservation.service'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  selectedDate: {
    type: String,
    default: null
  },
  doctors: {
    type: Array,
    default: () => []
  },
  defaultDoctorId: {
    type: Number,
    default: null
  },
  patientId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'saved', 'error'])

const { t, locale } = useI18n()
const authStore = useAuthStore()

// ==================== State ====================
const saving = ref(false)
const searchingPatients = ref(false)
const bookingFormValid = ref(false)
const bookingForm = ref(null)

const patientSearch = ref('')
const patientOptions = ref([])

const bookingData = ref({
  patient: null,
  doctor_id: null,
  date: null,
  from_time: '09:00',
  appointment_type: 'examination',
  notes: '',
  sendWhatsApp: false
})

// ==================== Computed ====================
const internalDialog = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

const whatsAppMessage = computed(() => {
  if (!bookingData.value.patient || !bookingData.value.date) return ''
  
  const patientName = bookingData.value.patient.name
  const date = formatDate(bookingData.value.date)
  const time = bookingData.value.from_time
  const clinicName = authStore.clinicInfo?.name || 'العيادة'
  
  return `مرحباً ${patientName}،\n\nنود تذكيرك بموعدك في ${clinicName}\n📅 التاريخ: ${date}\n🕐 الوقت: ${time}\n\nنتطلع لرؤيتك!`
})

// ==================== Rules ====================
const rules = {
  required: v => !!v || t('validation.required')
}

// ==================== Methods ====================
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

const formatDateISO = (date) => {
  // Format as YYYY-MM-DD without timezone conversion
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

const resetForm = () => {
  bookingData.value = {
    patient: null,
    doctor_id: props.defaultDoctorId,
    date: props.selectedDate || formatDateISO(new Date()),
    from_time: '09:00',
    appointment_type: 'examination',
    notes: '',
    sendWhatsApp: false
  }
  patientOptions.value = []
  patientSearch.value = ''
  
  // If patientId is provided, load that patient
  if (props.patientId) {
    loadPatientById(props.patientId)
  } else {
    loadInitialPatients()
  }
}

const handleClose = () => {
  internalDialog.value = false
}

const handleSave = async () => {
  if (!bookingFormValid.value) return
  
  saving.value = true
  try {
    // Convert time from HH:MM to HH:MM:SS format
    const fromTime = bookingData.value.from_time.includes(':') && bookingData.value.from_time.split(':').length === 2
      ? `${bookingData.value.from_time}:00`
      : bookingData.value.from_time
    
    const payload = {
      patient_id: bookingData.value.patient.id,
      doctor_id: bookingData.value.doctor_id,
      clinics_id: authStore.clinicInfo?.id || 1,
      reservation_start_date: bookingData.value.date,
      reservation_end_date: bookingData.value.date,
      reservation_from_time: fromTime,
      notes: bookingData.value.appointment_type === 'examination' 
        ? t('reservations.examination')
        : bookingData.value.notes,
      is_waiting: false
    }
    
    const response = await reservationService.create(payload)
    
    // Send WhatsApp if enabled
    if (bookingData.value.sendWhatsApp && bookingData.value.patient?.phone) {
      const message = encodeURIComponent(whatsAppMessage.value)
      let phone = bookingData.value.patient.phone.replace(/\D/g, '')
      if (!phone.startsWith('964')) {
        phone = '964' + phone
      }
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
    }
    
    emit('saved', response)
    internalDialog.value = false
  } catch (error) {
    console.error('Failed to save booking:', error)
    emit('error', error)
  } finally {
    saving.value = false
  }
}

const loadInitialPatients = async () => {
  searchingPatients.value = true
  try {
    const response = await reservationService.searchPatients('')
    patientOptions.value = response.data || []
  } catch (error) {
    console.error('Failed to load patients:', error)
  } finally {
    searchingPatients.value = false
  }
}

const loadPatientById = async (patientId) => {
  searchingPatients.value = true
  try {
    const response = await reservationService.searchPatients('')
    patientOptions.value = response.data || []
    
    // Find and set the patient
    const patient = patientOptions.value.find(p => p.id === patientId)
    if (patient) {
      bookingData.value.patient = patient
    }
  } catch (error) {
    console.error('Failed to load patient:', error)
  } finally {
    searchingPatients.value = false
  }
}

const searchPatients = async (query) => {
  if (!query || query.length < 3) {
    loadInitialPatients()
    return
  }
  
  searchingPatients.value = true
  try {
    const response = await reservationService.searchPatients(query)
    patientOptions.value = response.data || []
  } catch (error) {
    console.error('Failed to search patients:', error)
  } finally {
    searchingPatients.value = false
  }
}

// ==================== Watchers ====================
let searchTimeout = null
watch(patientSearch, (newVal) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchPatients(newVal)
  }, 300)
})

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    resetForm()
  }
})

watch(() => props.selectedDate, (newVal) => {
  if (newVal) {
    bookingData.value.date = newVal
  }
})

watch(() => props.defaultDoctorId, (newVal) => {
  if (newVal) {
    bookingData.value.doctor_id = newVal
  }
})
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
