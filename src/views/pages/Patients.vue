<template>
  <div class="patients-page">
    <!-- Page Header -->
    <div class="page-header mb-6">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4">
        <div>
          <h1 class="text-h4 font-weight-bold text-primary">{{ $t('patients.title') }}</h1>
          <p class="text-grey mt-1">{{ $t('patients.subtitle') }}</p>
        </div>
        <div class="d-flex ga-2">
          <v-btn
            color="purple"
            size="large"
            prepend-icon="mdi-qrcode-scan"
            @click="openScanner"
            elevation="2"
            variant="tonal"
          >
            {{ $t('patients.scanQr') }}
          </v-btn>
          <v-btn
            color="primary"
            size="large"
            prepend-icon="mdi-plus"
            @click="openAddDialog"
            elevation="2"
          >
            {{ $t('patients.add') }}
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <v-card class="toolbar-card mb-6" elevation="2" rounded="xl">
      <v-card-text>
        <v-row align="center">
          <!-- Search -->
          <v-col cols="12" md="8">
            <v-text-field
              v-model="search"
              :label="$t('patients.search')"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              @update:model-value="debouncedSearch"
            />
          </v-col>

          <!-- Per Page -->
          <v-col cols="6" md="4">
            <v-select
              v-model="perPage"
              :label="$t('patients.per_page')"
              :items="[15, 25, 50, 100]"
              variant="outlined"
              density="comfortable"
              hide-details
              @update:model-value="loadPatients"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Patients Table -->
    <v-card elevation="2" rounded="xl">
      <!-- Loading State -->
      <v-progress-linear v-if="loading" indeterminate color="primary" />

      <!-- Error State -->
      <v-alert v-if="error" type="error" variant="tonal" class="ma-4" closable @click:close="error = ''">
        {{ error }}
      </v-alert>

      <!-- Data Table -->
      <v-data-table-server
        v-model:items-per-page="perPage"
        v-model:page="currentPage"
        :headers="headers"
        :items="patients"
        :items-length="totalPatients"
        :loading="loading"
        class="patients-table"
        density="compact"
        mobile-breakpoint="md"
        hover
        @update:page="loadPatients"
        @update:items-per-page="loadPatients"
        @click:row="(event, { item }) => goToPatient(item)"
      >
        <!-- Avatar & Name -->
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center ga-3 py-2">
            <v-avatar :color="getAvatarColor(item.name)" size="42">
              <span class="text-white font-weight-bold">{{ getInitials(item.name) }}</span>
            </v-avatar>
            <div>
              <div class="font-weight-medium">{{ item.name }}</div>
              <div class="text-caption text-grey">ID: {{ item.id }}</div>
            </div>
          </div>
        </template>

        <!-- Phone -->
        <template v-slot:item.phone="{ item }">
          <div class="d-flex align-center ga-2">
            <v-icon size="small" color="grey">mdi-phone</v-icon>
            <span dir="ltr">{{ item.phone || '-' }}</span>
          </div>
        </template>

        <!-- Gender Badge -->
        <template v-slot:item.sex="{ item }">
          <v-chip
            :color="item.sex === 1 ? 'blue' : 'pink'"
            size="small"
            variant="tonal"
          >
            <v-icon start size="14">{{ item.sex === 1 ? 'mdi-gender-male' : 'mdi-gender-female' }}</v-icon>
            {{ item.sex === 1 ? $t('patients.male') : $t('patients.female') }}
          </v-chip>
        </template>

        <!-- Age -->
        <template v-slot:item.age="{ item }">
          <span>{{ item.age || '-' }} {{ $t('patients.years') }}</span>
        </template>

        <!-- Cases Count -->
        <template v-slot:item.cases_count="{ item }">
          <v-chip
            color="primary"
            size="small"
            variant="tonal"
          >
            <v-icon start size="14">mdi-clipboard-text</v-icon>
            {{ item.cases_count || 0 }}
          </v-chip>
        </template>

        <!-- Created Date -->
        <template v-slot:item.created_at="{ item }">
          <div class="text-caption">
            {{ formatDate(item.created_at) }}
          </div>
        </template>

        <!-- Actions -->
        <template v-slot:item.actions="{ item }">
          <div class="d-flex ga-1">
            <v-btn
              icon="mdi-qrcode"
              size="small"
              variant="text"
              color="purple"
              @click.stop="openQrCard(item)"
            >
              <v-icon>mdi-qrcode</v-icon>
              <v-tooltip activator="parent" location="top">
                {{ $t('patientIdCard.title') }}
              </v-tooltip>
            </v-btn>
            <v-btn
              icon="mdi-calendar-plus"
              size="small"
              variant="text"
              color="primary"
              @click.stop="openBookingForPatient(item)"
            >
              <v-icon>mdi-calendar-plus</v-icon>
              <v-tooltip activator="parent" location="top">
                {{ $t('patients.add_booking') }}
              </v-tooltip>
            </v-btn>
            <v-btn
              icon="mdi-whatsapp"
              size="small"
              variant="text"
              color="success"
              @click.stop="openWhatsAppDialog(item)"
            >
              <v-icon>mdi-whatsapp</v-icon>
              <v-tooltip activator="parent" location="top">
                {{ $t('patients.send_whatsapp') }}
              </v-tooltip>
            </v-btn>
            <v-btn
              icon="mdi-eye"
              size="small"
              variant="text"
              color="info"
              @click.stop="viewPatient(item)"
            />
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              color="warning"
              @click.stop="editPatient(item)"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click.stop="confirmDelete(item)"
            />
          </div>
        </template>

        <!-- Empty State -->
        <template v-slot:no-data>
          <div class="text-center py-12">
            <v-icon size="80" color="grey-lighten-2">mdi-account-search</v-icon>
            <h3 class="text-h6 mt-4 text-grey">{{ $t('patients.no_patients') }}</h3>
            <p class="text-grey-darken-1">{{ $t('patients.no_patients_desc') }}</p>
            <v-btn
              color="primary"
              class="mt-4"
              prepend-icon="mdi-plus"
              @click="openAddDialog"
            >
              {{ $t('patients.add_first') }}
            </v-btn>
          </div>
        </template>

        <!-- Loading Skeleton -->
        <template v-slot:loading>
          <v-skeleton-loader type="table-row@10" />
        </template>
      </v-data-table-server>

      <!-- Pagination Info -->
      <v-divider />
      <div class="d-flex align-center justify-space-between pa-4">
        <div class="text-caption text-grey">
          {{ $t('patients.showing') }} {{ paginationInfo.from }}-{{ paginationInfo.to }} 
          {{ $t('patients.of') }} {{ paginationInfo.total }} {{ $t('patients.patients') }}
        </div>
      </div>
    </v-card>

    <!-- Add/Edit Patient Dialog -->
    <v-dialog v-model="patientDialog" max-width="700" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary">
          <span class="text-white">
            {{ editMode ? $t('patients.edit_patient') : $t('patients.add_patient') }}
          </span>
          <v-btn icon="mdi-close" variant="text" color="white" @click="closeDialog" />
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
                <v-textarea
                  v-model="patientData.address"
                  :label="$t('patients.address')"
                  prepend-inner-icon="mdi-map-marker"
                  variant="outlined"
                  rows="2"
                  :error-messages="formErrors.address"
                />
              </v-col>

              <!-- Note -->
              <v-col cols="12">
                <v-textarea
                  v-model="patientData.note"
                  :label="$t('patients.note')"
                  prepend-inner-icon="mdi-note"
                  variant="outlined"
                  rows="3"
                  :error-messages="formErrors.note"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">
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

    <!-- View Patient Dialog -->
    <v-dialog v-model="viewDialog" max-width="600">
      <v-card v-if="selectedPatient" rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary">
          <span class="text-white">{{ $t('patients.patient_details') }}</span>
          <v-btn icon="mdi-close" variant="text" color="white" @click="viewDialog = false" />
        </v-card-title>

        <v-card-text class="pa-6">
          <!-- Patient Header -->
          <div class="text-center mb-6">
            <v-avatar :color="getAvatarColor(selectedPatient.name)" size="80">
              <span class="text-h4 text-white">{{ getInitials(selectedPatient.name) }}</span>
            </v-avatar>
            <h2 class="text-h5 mt-3">{{ selectedPatient.name }}</h2>
            <v-chip
              :color="selectedPatient.sex === 1 ? 'blue' : 'pink'"
              size="small"
              variant="tonal"
              class="mt-2"
            >
              {{ selectedPatient.sex === 1 ? $t('patients.male') : $t('patients.female') }}
            </v-chip>
          </div>

          <v-divider class="mb-4" />

          <!-- Patient Info Grid -->
          <v-row>
            <v-col cols="6">
              <div class="info-item">
                <v-icon color="grey" size="20">mdi-phone</v-icon>
                <div>
                  <div class="text-caption text-grey">{{ $t('patients.phone') }}</div>
                  <div class="font-weight-medium" dir="ltr">{{ selectedPatient.phone || '-' }}</div>
                </div>
              </div>
            </v-col>

            <v-col cols="6">
              <div class="info-item">
                <v-icon color="grey" size="20">mdi-calendar</v-icon>
                <div>
                  <div class="text-caption text-grey">{{ $t('patients.age') }}</div>
                  <div class="font-weight-medium">{{ selectedPatient.age || '-' }} {{ $t('patients.years') }}</div>
                </div>
              </div>
            </v-col>

            <v-col cols="6">
              <div class="info-item">
                <v-icon color="grey" size="20">mdi-doctor</v-icon>
                <div>
                  <div class="text-caption text-grey">{{ $t('patients.doctor') }}</div>
                  <div class="font-weight-medium">{{ selectedPatient.doctor?.name || '-' }}</div>
                </div>
              </div>
            </v-col>

            <v-col cols="6">
              <div class="info-item">
                <v-icon color="grey" size="20">mdi-currency-usd</v-icon>
                <div>
                  <div class="text-caption text-grey">{{ $t('patients.credit_balance') }}</div>
                  <div class="font-weight-medium">{{ formatCurrency(selectedPatient.credit_balance) }}</div>
                </div>
              </div>
            </v-col>

            <v-col cols="12" v-if="selectedPatient.address">
              <div class="info-item">
                <v-icon color="grey" size="20">mdi-map-marker</v-icon>
                <div>
                  <div class="text-caption text-grey">{{ $t('patients.address') }}</div>
                  <div class="font-weight-medium">{{ selectedPatient.address }}</div>
                </div>
              </div>
            </v-col>

            <v-col cols="12" v-if="selectedPatient.notes">
              <div class="info-item">
                <v-icon color="grey" size="20">mdi-note-text</v-icon>
                <div>
                  <div class="text-caption text-grey">{{ $t('patients.notes') }}</div>
                  <div class="font-weight-medium">{{ selectedPatient.notes }}</div>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-btn variant="text" color="error" prepend-icon="mdi-delete" @click="confirmDelete(selectedPatient)">
            {{ $t('common.delete') }}
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="viewDialog = false">
            {{ $t('common.close') }}
          </v-btn>
          <v-btn color="primary" prepend-icon="mdi-pencil" @click="editFromView">
            {{ $t('common.edit') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="text-center pa-6">
          <v-icon color="error" size="60">mdi-alert-circle</v-icon>
          <h3 class="text-h5 mt-4">{{ $t('patients.confirm_delete') }}</h3>
        </v-card-title>

        <v-card-text class="text-center pb-6">
          <p class="text-grey-darken-1">
            {{ $t('patients.delete_warning') }}
          </p>
          <p class="font-weight-bold mt-2">{{ patientToDelete?.name }}</p>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :loading="deleting"
            @click="deletePatient"
          >
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Booking Dialog -->
    <BookingDialog
      v-model="bookingDialog"
      :patient-id="selectedPatientForBooking?.id"
      :doctors="doctors"
      @saved="handleBookingSaved"
    />

    <!-- WhatsApp Message Dialog -->
    <v-dialog v-model="whatsappDialog" max-width="600">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between pa-4 bg-success">
          <div class="d-flex align-center ga-2">
            <v-icon color="white" size="28">mdi-whatsapp</v-icon>
            <span class="text-white">{{ $t('patients.send_whatsapp') }}</span>
          </div>
          <v-btn icon="mdi-close" variant="text" color="white" @click="whatsappDialog = false" />
        </v-card-title>

        <v-card-text class="pa-6">
          <!-- Patient Info -->
          <v-alert v-if="selectedPatientForWhatsApp" type="info" variant="tonal" class="mb-4">
            <div class="d-flex align-center ga-3">
              <v-avatar :color="getAvatarColor(selectedPatientForWhatsApp.name)" size="40">
                <span class="text-white">{{ getInitials(selectedPatientForWhatsApp.name) }}</span>
              </v-avatar>
              <div>
                <div class="font-weight-medium">{{ selectedPatientForWhatsApp.name }}</div>
                <div class="text-caption" dir="ltr">{{ selectedPatientForWhatsApp.phone }}</div>
              </div>
            </div>
          </v-alert>

          <!-- Message Templates -->
          <div class="mb-4">
            <div class="text-subtitle-2 mb-2">{{ $t('patients.message_templates') }}</div>
            <v-chip-group v-model="selectedTemplate" column mandatory>
              <v-chip
                v-for="template in messageTemplates"
                :key="template.id"
                :value="template.id"
                filter
                variant="outlined"
                @click="selectTemplate(template)"
              >
                {{ template.title }}
              </v-chip>
            </v-chip-group>
          </div>

          <!-- Custom Message -->
          <v-textarea
            v-model="whatsappMessage"
            :label="$t('patients.message')"
            variant="outlined"
            rows="6"
            auto-grow
            prepend-inner-icon="mdi-message-text"
            :hint="$t('patients.message_hint')"
            persistent-hint
          />

          <!-- Character Count -->
          <div class="text-caption text-right text-grey mt-1">
            {{ whatsappMessage.length }} {{ $t('patients.characters') }}
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="whatsappDialog = false">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="success"
            variant="elevated"
            prepend-icon="mdi-whatsapp"
            :disabled="!whatsappMessage || !selectedPatientForWhatsApp?.phone"
            @click="sendWhatsAppMessage"
          >
            {{ $t('patients.send') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Patient ID Card Dialog -->
    <PatientIdCard
      v-model="qrCardDialog"
      :patient="selectedPatientForQrCard"
      :clinic-settings="clinicSettings"
      @close="qrCardDialog = false"
    />

    <!-- QR Scanner Dialog -->
    <QrScanner
      v-model="scannerDialog"
      @scan-success="handleScanSuccess"
      @scan-error="handleScanError"
    />

    <!-- Snackbar Notifications -->
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import BookingDialog from '@/components/BookingDialog.vue'
import PatientIdCard from '@/components/PatientIdCard.vue'
import QrScanner from '@/components/QrScanner.vue'
import { useClinicSettings } from '@/composables/useClinicSettings'

const { t } = useI18n()
const router = useRouter()
const { clinicSettings } = useClinicSettings()

// ==================== State ====================
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const error = ref('')
const search = ref('')
const patients = ref([])
const doctors = ref([])
const currentPage = ref(1)
const perPage = ref(15)
const totalPatients = ref(0)

// Filters
const filters = reactive({
  sex: null,
  doctor_id: null,
  clinics_id: null
})

const sortBy = ref('-created_at')

// Dialogs
const patientDialog = ref(false)
const viewDialog = ref(false)
const deleteDialog = ref(false)
const bookingDialog = ref(false)
const whatsappDialog = ref(false)
const qrCardDialog = ref(false)
const scannerDialog = ref(false)
const editMode = ref(false)

// Selected patients for dialogs
const selectedPatientForBooking = ref(null)
const selectedPatientForWhatsApp = ref(null)
const selectedPatientForQrCard = ref(null)

// WhatsApp message
const whatsappMessage = ref('')
const selectedTemplate = ref(null)

// Birth date mode
const yearOnlyMode = ref(false)
const birthYear = ref('')
const birthDateDisplay = ref('')

// Patient search for combobox
const patientSearchList = ref([])
const loadingPatientSearch = ref(false)
const patientNameSearch = ref('')
let patientSearchTimeout = null

// Selected Patient
const selectedPatient = ref(null)
const patientToDelete = ref(null)

// Form Data
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
const patientForm = ref(null)

// Snackbar
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success'
})

// ==================== Options ====================
const genderOptions = computed(() => [
  { text: t('patients.male'), value: 1 },     // 1 = Male
  { text: t('patients.female'), value: 2 }    // 2 = Female
])

const sortOptions = computed(() => [
  { text: t('patients.newest'), value: '-created_at' },
  { text: t('patients.oldest'), value: 'created_at' },
  { text: t('patients.name_az'), value: 'name' },
  { text: t('patients.name_za'), value: '-name' }
])

// WhatsApp Message Templates
const messageTemplates = computed(() => [
  {
    id: 1,
    title: t('patients.template_reminder'),
    text: t('patients.template_reminder_text', {
      name: selectedPatientForWhatsApp.value?.name || '',
      clinic: t('patients.clinic_name')
    })
  },
  {
    id: 2,
    title: t('patients.template_followup'),
    text: t('patients.template_followup_text', {
      name: selectedPatientForWhatsApp.value?.name || ''
    })
  },
  {
    id: 3,
    title: t('patients.template_checkup'),
    text: t('patients.template_checkup_text', {
      name: selectedPatientForWhatsApp.value?.name || ''
    })
  },
  {
    id: 4,
    title: t('patients.template_results'),
    text: t('patients.template_results_text', {
      name: selectedPatientForWhatsApp.value?.name || ''
    })
  },
  {
    id: 5,
    title: t('patients.template_profile_link'),
    text: generateProfileLinkMessage()
  },
  {
    id: 6,
    title: t('patients.template_greeting'),
    text: t('patients.template_greeting_text', {
      name: selectedPatientForWhatsApp.value?.name || ''
    })
  }
])

// Table Headers
const headers = computed(() => [
  { title: t('patients.name'), key: 'name', sortable: false },
  { title: t('patients.phone'), key: 'phone', sortable: false },
  { title: t('patients.gender'), key: 'sex', sortable: false },
  { title: t('patients.age'), key: 'age', sortable: false },
  { title: t('patients.cases_count'), key: 'cases_count', sortable: false },
  { title: t('patients.created_at'), key: 'created_at', sortable: false },
  { title: t('patients.actions'), key: 'actions', sortable: false, align: 'center' }
])

// Pagination Info
const paginationInfo = computed(() => ({
  from: (currentPage.value - 1) * perPage.value + 1,
  to: Math.min(currentPage.value * perPage.value, totalPatients.value),
  total: totalPatients.value
}))

// ==================== Methods ====================

// Debounced Search
let searchTimeout = null
function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadPatients()
  }, 500)
}

// Load Patients
async function loadPatients() {
  loading.value = true
  error.value = ''

  try {
    const params = {
      page: currentPage.value,
      per_page: perPage.value,
      sort: sortBy.value,
      'include[]': 'casesCount'
    }

    // Search by name or phone using QueryBuilder filter format
    if (search.value) {
      const searchTerm = search.value.trim()
      
      // Check if search looks like a phone number (contains only digits)
      const isPhoneSearch = /^\d+$/.test(searchTerm)
      
      if (isPhoneSearch) {
        // Search by phone
        params['filter[phone]'] = searchTerm
      } else {
        // Search by name (first_name)
        params['filter[name]'] = searchTerm
      }
    }

    if (filters.sex) {
      params['filter[gender]'] = filters.sex
    }

    if (filters.doctor_id) {
      params['filter[doctor_id]'] = filters.doctor_id
    }

    if (filters.clinics_id) {
      params['filter[clinics_id]'] = filters.clinics_id
    }

    const response = await api.get('/patients', { params })
    
    patients.value = response.data || []
    totalPatients.value = response.meta?.total || response.total || 0
    
  } catch (err) {
    console.error('Failed to load patients:', err)
    error.value = t('patients.load_error')
  } finally {
    loading.value = false
  }
}

// Load Doctors for Filter
async function loadDoctors() {
  try {
    const response = await api.get('/doctors')
    doctors.value = response.data || []
  } catch (err) {
    console.error('Failed to load doctors:', err)
  }
}

// Search Patients for Combobox
async function searchPatientsByName(searchTerm) {
  // Clear existing timeout
  if (patientSearchTimeout) {
    clearTimeout(patientSearchTimeout)
  }

  // If search term is empty or too short, clear list
  if (!searchTerm || searchTerm.length < 2) {
    patientSearchList.value = []
    return
  }

  // Debounce search to avoid too many API calls
  patientSearchTimeout = setTimeout(async () => {
    try {
      loadingPatientSearch.value = true
      const params = {
        search: searchTerm,
        per_page: 20
      }
      
      const response = await api.get('/patients', { params })
      
      if (response.data) {
        patientSearchList.value = response.data.map(patient => ({
          text: patient.name,
          value: patient.name,
          name: patient.name,
          phone: patient.phone || '',
          age: patient.age || t('patients.not_specified'),
          id: patient.id,
          fullData: patient
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

// Handle Patient Name Selection from Combobox
function handlePatientNameSelect(selectedItem) {
  console.log('Patient selected:', selectedItem, typeof selectedItem)
  
  if (!selectedItem) return

  // If selectedItem is a string, it's a new patient name
  if (typeof selectedItem === 'string') {
    patientData.name = selectedItem
    return
  }

  // If selectedItem is an object with patient data, only set the name
  if (selectedItem && typeof selectedItem === 'object') {
    if (selectedItem.fullData) {
      // Only set the name, don't fill other fields
      patientData.name = selectedItem.fullData.name || ''
    } else {
      // Just set the name
      patientData.name = selectedItem.name || selectedItem.text || selectedItem
    }
  }
}

// Open Add Dialog
function openAddDialog() {
  editMode.value = false
  resetForm()
  patientDialog.value = true
}

// Edit Patient
function editPatient(patient) {
  editMode.value = true
  selectedPatient.value = patient
  
  Object.assign(patientData, {
    name: patient.name,
    phone: patient.phone,
    sex: patient.sex,
    age: patient.age,
    doctor_id: patient.doctor_id,
    identifier: patient.identifier,
    address: patient.address,
    notes: patient.notes,
    birth_date: patient.birth_date || '',
    systemic_conditions: patient.systemic_conditions || '',
    rx_id: patient.rx_id || '',
    note: patient.note || '',
    credit_balance: patient.credit_balance,
    credit_balance_add_at: patient.credit_balance_add_at || '',
    from_where_come_id: patient.from_where_come_id
  })
  
  // Set birth date display
  birthDateDisplay.value = patient.birth_date || ''
  
  patientDialog.value = true
}

// Edit from View Dialog
function editFromView() {
  viewDialog.value = false
  editPatient(selectedPatient.value)
}

// Go to Patient Page
function goToPatient(patient) {
  router.push(`/patients/${patient.id}`)
}

// View Patient
function viewPatient(patient) {
  selectedPatient.value = patient
  viewDialog.value = true
}

// Close Dialog
function closeDialog() {
  patientDialog.value = false
  resetForm()
}

// Reset Form
function resetForm() {
  Object.assign(patientData, {
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
  Object.keys(formErrors).forEach(key => delete formErrors[key])
  yearOnlyMode.value = false
  birthYear.value = ''
  birthDateDisplay.value = ''
  patientNameSearch.value = ''
  patientSearchList.value = []
}

// Handle birth date input - automatically convert year-only to full date
function handleBirthDateInput(event) {
  let value = event.target ? event.target.value : event
  
  if (!value) {
    patientData.birth_date = ''
    birthDateDisplay.value = ''
    return
  }

  // Remove any extra characters, keep only digits and dashes
  let cleanValue = value.replace(/[^\d-]/g, '')
  
  // Auto-add dash after 4 digits (year)
  if (cleanValue.length === 4 && !cleanValue.includes('-')) {
    cleanValue = cleanValue + '-'
    birthDateDisplay.value = cleanValue
    if (event.target) {
      event.target.value = cleanValue
    }
    return
  }
  
  // Auto-add dash after month (YYYY-MM format)
  if (/^\d{4}-\d{2}$/.test(cleanValue) && cleanValue.length === 7) {
    cleanValue = cleanValue + '-'
    birthDateDisplay.value = cleanValue
    if (event.target) {
      event.target.value = cleanValue
    }
    return
  }
  
  const trimmedValue = cleanValue.trim()
  
  // If user enters exactly 4 digits (year only)
  if (/^\d{4}$/.test(trimmedValue)) {
    const formattedDate = `${trimmedValue}-01-01`
    patientData.birth_date = formattedDate
    birthDateDisplay.value = trimmedValue
    console.log('✅ Year converted to:', formattedDate)
  }
  // If user enters year-month (YYYY-MM)
  else if (/^\d{4}-\d{1,2}$/.test(trimmedValue)) {
    const [year, month] = trimmedValue.split('-')
    const formattedDate = `${year}-${month.padStart(2, '0')}-01`
    patientData.birth_date = formattedDate
    birthDateDisplay.value = trimmedValue
    console.log('✅ Year-Month converted to:', formattedDate)
  }
  // If user enters full date (YYYY-MM-DD)
  else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmedValue)) {
    const parts = trimmedValue.split('-')
    const formattedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
    patientData.birth_date = formattedDate
    birthDateDisplay.value = cleanValue
    console.log('✅ Full date:', formattedDate)
  }
  // Any other format
  else {
    patientData.birth_date = trimmedValue
    birthDateDisplay.value = cleanValue
  }
}

// Save Patient
async function savePatient() {
  // Validate form
  const { valid } = await patientForm.value.validate()
  if (!valid) return

  saving.value = true
  Object.keys(formErrors).forEach(key => delete formErrors[key])

  try {
    const payload = { ...patientData }
    
    console.log('💾 Saving patient data:', payload)
    console.log('📅 Birth date being sent:', payload.birth_date)
    
    let response
    if (editMode.value) {
      response = await api.put(`/patients/${selectedPatient.value.id}`, payload)
    } else {
      response = await api.post('/patients', payload)
    }

    showSnackbar(
      editMode.value ? t('patients.updated') : t('patients.created'),
      'success'
    )
    
    closeDialog()
    loadPatients()
    
  } catch (err) {
    console.error('Failed to save patient:', err)
    
    if (err.response?.status === 422) {
      const errors = err.response.data.errors
      Object.keys(errors).forEach(key => {
        formErrors[key] = errors[key][0]
      })
    } else {
      showSnackbar(t('patients.save_error'), 'error')
    }
  } finally {
    saving.value = false
  }
}

// Confirm Delete
function confirmDelete(patient) {
  patientToDelete.value = patient
  viewDialog.value = false
  deleteDialog.value = true
}

// Delete Patient
async function deletePatient() {
  deleting.value = true

  try {
    await api.delete(`/patients/${patientToDelete.value.id}`)
    
    showSnackbar(t('patients.deleted'), 'success')
    deleteDialog.value = false
    loadPatients()
    
  } catch (err) {
    console.error('Failed to delete patient:', err)
    showSnackbar(t('patients.delete_error'), 'error')
  } finally {
    deleting.value = false
  }
}

// Open Booking Dialog for Patient
function openBookingForPatient(patient) {
  selectedPatientForBooking.value = patient
  bookingDialog.value = true
}

// Handle Booking Saved
function handleBookingSaved() {
  showSnackbar(t('patients.booking_created'), 'success')
  bookingDialog.value = false
  selectedPatientForBooking.value = null
}

// Open WhatsApp Dialog
function openWhatsAppDialog(patient) {
  selectedPatientForWhatsApp.value = patient
  selectedTemplate.value = 1
  // Set default template message
  selectTemplate(messageTemplates.value[0])
  whatsappDialog.value = true
}

// Open QR Card Dialog
function openQrCard(patient) {
  selectedPatientForQrCard.value = patient
  qrCardDialog.value = true
}

// Open QR Scanner
function openScanner() {
  scannerDialog.value = true
}

// Handle QR Scan Success
function handleScanSuccess(data) {
  console.log('QR Scan successful:', data)
  showSnackbar(t('qrScanner.success'), 'success')
  // Router navigation is handled in the QrScanner component
}

// Handle QR Scan Error
function handleScanError(error) {
  console.error('QR Scan error:', error)
  showSnackbar(t('qrScanner.scanError'), 'error')
}

// Generate Profile Link Message
function generateProfileLinkMessage() {
  if (!selectedPatientForWhatsApp.value) return ''
  
  const patient = selectedPatientForWhatsApp.value
  const frontendBaseUrl = window.location.origin
  
  // Try to get public token from patient data (if available)
  let profileUrl = `${frontendBaseUrl}/public/patient/patient-${patient.id}`
  
  // If patient has public_token, use it
  if (patient.public_token) {
    profileUrl = `${frontendBaseUrl}/public/patient/${patient.public_token}`
  }
  
  return t('patients.template_profile_link_text', {
    name: patient.name,
    clinic: t('patients.clinic_name'),
    url: profileUrl
  })
}

// Select Message Template
function selectTemplate(template) {
  if (template && template.text) {
    whatsappMessage.value = template.text
  }
}

// Send WhatsApp Message
function sendWhatsAppMessage() {
  if (!selectedPatientForWhatsApp.value?.phone || !whatsappMessage.value) {
    showSnackbar(t('patients.whatsapp_error'), 'error')
    return
  }

  // Clean phone number (remove spaces and formatting)
  let phone = selectedPatientForWhatsApp.value.phone.replace(/\D/g, '')
  
  // Ensure phone starts with country code
  if (!phone.startsWith('964')) {
    // If starts with 0, replace with 964
    if (phone.startsWith('0')) {
      phone = '964' + phone.substring(1)
    } else {
      phone = '964' + phone
    }
  }

  // Encode message for URL
  const encodedMessage = encodeURIComponent(whatsappMessage.value)
  
  // Create WhatsApp URL
  const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`
  
  // Open in new tab
  window.open(whatsappUrl, '_blank')
  
  showSnackbar(t('patients.whatsapp_opened'), 'success')
  whatsappDialog.value = false
}

// ==================== Helpers ====================

// ==================== Helpers ====================

function formatPhoneNumber(event) {
  let value = event.target.value.replace(/\D/g, '') // Remove non-digits
  
  // Add space formatting: 07XX XXX XXXX
  if (value.length > 4 && value.length <= 7) {
    value = value.substring(0, 4) + ' ' + value.substring(4)
  } else if (value.length > 7) {
    value = value.substring(0, 4) + ' ' + value.substring(4, 7) + ' ' + value.substring(7, 11)
  }
  
  // Limit to 13 characters (11 digits + 2 spaces)
  value = value.substring(0, 13)
  
  // Update both the model and the input value
  patientData.phone = value
  event.target.value = value
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

function getAvatarColor(name) {
  const colors = ['primary', 'secondary', 'success', 'warning', 'info', 'error']
  const index = name ? name.charCodeAt(0) % colors.length : 0
  return colors[index]
}

function getCreditColor(balance) {
  if (!balance || balance === 0) return 'grey'
  if (balance > 0) return 'success'
  return 'error'
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0
  }).format(amount)
}

function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function showSnackbar(message, color = 'success') {
  snackbar.message = message
  snackbar.color = color
  snackbar.show = true
}

// ==================== Lifecycle ====================
onMounted(() => {
  loadPatients()
  loadDoctors()
})
</script>

<style scoped>
.patients-page {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

.toolbar-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
}

.patients-table {
  min-height: 400px;
}

.patients-table :deep(tbody tr) {
  cursor: pointer;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 12px;
}

/* Data Table Alignment for Arabic */
:deep(.v-data-table th) {
  text-align: right !important;
}

@media (max-width: 600px) {
  :deep(.v-data-table td) {
    text-align: left !important;
  }

  :deep(.v-data-table td > *) {
    justify-content: flex-start !important;
  }
}

:deep(.v-data-table__mobile-row__header) {
  text-align: right !important;
}

:deep(.v-data-table__mobile-row__cell) {
  text-align: left !important;
}

:deep(.v-data-table__mobile-row__cell > *) {
  justify-content: flex-start !important;
}

/* RTL Support */
[dir="rtl"] .patients-page {
  text-align: right;
}

/* Responsive */
@media (max-width: 960px) {
  .patients-page {
    padding: 16px;
  }
}
</style>
