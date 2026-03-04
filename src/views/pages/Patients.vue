<template>
  <div class="patients-page">
    <!-- Page Header (hidden on mobile) -->
    <div class="page-header mb-6 d-none d-sm-block">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4">
        <!-- Title: hidden on mobile -->
        <div class="d-none d-sm-block">
          <h1 class="text-h4 font-weight-bold text-primary">{{ $t('patients.title') }}</h1>
          <p class="text-grey mt-1">{{ $t('patients.subtitle') }}</p>
        </div>
        <!-- Action buttons: hidden on mobile (replaced by FABs) -->
        <div class="d-none d-sm-flex ga-2">
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

    <!-- Mobile Search Bar (visible on mobile only) -->
    <div class="d-sm-none mb-4">
      <v-text-field
        v-model="search"
        :label="$t('patients.search')"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="comfortable"
        hide-details
        clearable
        bg-color="white"
        rounded="xl"
        @update:model-value="debouncedSearch"
      />
    </div>

    <!-- Filters & Search Toolbar (hidden on mobile) -->
    <v-card class="toolbar-card mb-6 d-none d-sm-block" elevation="2" rounded="xl">
      <v-card-text>
        <v-row align="center">
          <!-- Search -->
          <v-col cols="12" sm="6" md="4">
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

          <!-- Payment Status Filter -->
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filters.payment_status"
              :label="$t('patients.payment_status')"
              :items="paymentStatusOptions"
              item-title="text"
              item-value="value"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              prepend-inner-icon="mdi-cash-check"
              @update:model-value="loadPatients"
            />
          </v-col>

          <!-- Per Page -->
          <v-col cols="6" sm="6" md="2">
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

          <!-- Clear Filters Button -->
          <v-col cols="6" sm="6" md="3" class="d-flex justify-end">
            <v-btn
              color="error"
              variant="tonal"
              prepend-icon="mdi-filter-remove"
              @click="clearFilters"
              :disabled="!search && !filters.payment_status"
            >
              {{ $t('patients.clear_filters') }}
            </v-btn>
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
        hide-default-footer
        @update:page="handlePageChange"
        @update:items-per-page="handleItemsPerPageChange"
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

      <!-- Numbered Pagination -->
      <v-divider />
      <div class="d-flex align-center justify-space-between pa-3">
        <div class="text-caption text-grey">
          {{ $t('patients.showing') || 'Showing' }}
          {{ paginationInfo.from }}-{{ paginationInfo.to }}
          {{ $t('patients.of') || 'of' }}
          {{ paginationInfo.total }}
        </div>
        <v-pagination
          v-model="currentPage"
          :length="paginationInfo.lastPage"
          :total-visible="7"
          density="compact"
          @update:model-value="handlePageChange"
        />
      </div>
    </v-card>

    <!-- Add/Edit Patient Dialog -->
    <PatientFormDialog
      v-model="patientDialog"
      :edit-mode="editMode"
      :patient="selectedPatient"
      :doctors="doctors"
      @saved="handlePatientSaved"
      @error="handlePatientError"
    />
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

    <!-- Floating Action Buttons (mobile only) -->
    <div class="d-sm-none fab-container">
      <!-- QR Scan FAB -->
      <v-btn
        color="purple"
        size="large"
        icon
        elevation="4"
        variant="tonal"
        class="fab-btn"
        @click="openScanner"
      >
        <v-icon>mdi-qrcode-scan</v-icon>
        <v-tooltip activator="parent" location="top">{{ $t('patients.scanQr') }}</v-tooltip>
      </v-btn>
      <!-- Add Patient FAB -->
      <v-btn
        color="primary"
        size="large"
        icon
        elevation="6"
        class="fab-btn"
        @click="openAddDialog"
      >
        <v-icon>mdi-plus</v-icon>
        <v-tooltip activator="parent" location="top">{{ $t('patients.add') }}</v-tooltip>
      </v-btn>
    </div>

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
import { useRouter, useRoute } from 'vue-router'
import api from '@/services/api'
import BookingDialog from '@/components/BookingDialog.vue'
import PatientFormDialog from '@/components/PatientFormDialog.vue'
import PatientIdCard from '@/components/PatientIdCard.vue'
import QrScanner from '@/components/QrScanner.vue'
import { useClinicSettings } from '@/composables/useClinicSettings'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { clinicSettings } = useClinicSettings()

// ==================== State ====================
const loading = ref(false)
const deleting = ref(false)
const error = ref('')
const search = ref(route.query.search || '')
const patients = ref([])
const doctors = ref([])
const currentPage = ref(Number(route.query.page) || 1)
const perPage = ref(Number(route.query.per_page) || 15)
const totalPatients = ref(0)

// Filters
const filters = reactive({
  sex: route.query.sex || null,
  doctor_id: route.query.doctor_id ? Number(route.query.doctor_id) : null,
  clinics_id: route.query.clinics_id ? Number(route.query.clinics_id) : null,
  payment_status: route.query.payment_status || null
})



const sortBy = ref('-created_at') // Default sorting by newest

// Sync current state into URL
function syncUrl() {
  const q = {}
  if (currentPage.value > 1) q.page = String(currentPage.value)
  if (perPage.value !== 15) q.per_page = String(perPage.value)
  if (search.value) q.search = search.value
  if (filters.payment_status) q.payment_status = filters.payment_status
  if (filters.sex) q.sex = filters.sex
  if (filters.doctor_id) q.doctor_id = String(filters.doctor_id)
  if (filters.clinics_id) q.clinics_id = String(filters.clinics_id)
  router.replace({ query: q })
}

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

// Selected Patient
const selectedPatient = ref(null)
const patientToDelete = ref(null)

// ==================== Computed Properties ====================
// Payment Status Filter Options
const paymentStatusOptions = computed(() => [
  { text: t('patients.all_patients'), value: null },
  { text: t('patients.has_unpaid_cases'), value: 'has_unpaid_cases' },
  { text: t('patients.all_cases_paid'), value: 'all_cases_paid' }
])

// Snackbar
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success'
})

// ==================== Options ====================
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
  total: totalPatients.value,
  lastPage: Math.ceil(totalPatients.value / perPage.value) || 1
}))

// ==================== Methods ====================

// Handle page change
function handlePageChange(page) {
  currentPage.value = page
  syncUrl()
  loadPatients()
}

// Handle items per page change
function handleItemsPerPageChange(itemsPerPage) {
  perPage.value = itemsPerPage
  currentPage.value = 1
  syncUrl()
  loadPatients()
}

// Debounced Search
let searchTimeout = null
function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    syncUrl()
    loadPatients()
  }, 500)
}

// Load Patients
async function loadPatients() {
  loading.value = true
  error.value = ''

  console.log('🔄 Loading patients - Page:', currentPage.value, 'Per page:', perPage.value)

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

    // Payment status filters (scope filters)
    if (filters.payment_status === 'has_unpaid_cases') {
      params['filter[has_unpaid_cases]'] = 1
    } else if (filters.payment_status === 'all_cases_paid') {
      params['filter[all_cases_paid]'] = 1
    }

    const response = await api.get('/patients', { params })
    
    console.log('📊 API Response:', response)
    
    patients.value = response.data || []
    
    // Check multiple possible locations for total count
    totalPatients.value = response.pagination?.total || 
                          response.meta?.total || 
                          response.total || 
                          0
    
    console.log('✅ Loaded patients:', patients.value.length)
    console.log('📈 Total patients:', totalPatients.value)
    console.log('📄 Current page:', currentPage.value)
    console.log('📋 Per page:', perPage.value)
    
  } catch (err) {
    console.error('Failed to load patients:', err)
    error.value = t('patients.load_error')
  } finally {
    loading.value = false
  }
}

// Clear Filters
function clearFilters() {
  search.value = ''
  filters.payment_status = null
  filters.sex = null
  filters.doctor_id = null
  filters.clinics_id = null
  currentPage.value = 1
  syncUrl()
  loadPatients()
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

// Open Add Dialog
function openAddDialog() {
  editMode.value = false
  selectedPatient.value = null
  patientDialog.value = true
}

// Edit Patient
function editPatient(patient) {
  editMode.value = true
  selectedPatient.value = patient
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

// Handle PatientFormDialog saved event
function handlePatientSaved({ message, color }) {
  showSnackbar(message, color || 'success')
  loadPatients()
}

// Handle PatientFormDialog error event
function handlePatientError({ message, color }) {
  showSnackbar(message, color || 'error')
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

/* Floating Action Buttons */
.fab-container {
  position: fixed;
  bottom: calc(70px + env(safe-area-inset-bottom, 0px));
  inset-inline-end: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 999;
}

.fab-btn {
  width: 56px !important;
  height: 56px !important;
}
</style>
