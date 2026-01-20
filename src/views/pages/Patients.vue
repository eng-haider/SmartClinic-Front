<template>
  <div class="patients-page">
    <!-- Page Header -->
    <div class="page-header mb-6">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4">
        <div>
          <h1 class="text-h4 font-weight-bold text-primary">{{ $t('patients.title') }}</h1>
          <p class="text-grey mt-1">{{ $t('patients.subtitle') }}</p>
        </div>
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
            :color="item.sex === 'Male' ? 'blue' : 'pink'"
            size="small"
            variant="tonal"
          >
            <v-icon start size="14">{{ item.sex === 'Male' ? 'mdi-gender-male' : 'mdi-gender-female' }}</v-icon>
            {{ item.sex === 'Male' ? $t('patients.male') : $t('patients.female') }}
          </v-chip>
        </template>

        <!-- Age -->
        <template v-slot:item.age="{ item }">
          <span>{{ item.age || '-' }} {{ $t('patients.years') }}</span>
        </template>

        <!-- Doctor -->
        <template v-slot:item.doctor="{ item }">
          <div class="d-flex align-center ga-2">
            <v-icon size="small" color="primary">mdi-doctor</v-icon>
            <span>{{ item.doctor?.name || '-' }}</span>
          </div>
        </template>

        <!-- Credit Balance -->
        <template v-slot:item.credit_balance="{ item }">
          <v-chip
            :color="getCreditColor(item.credit_balance)"
            size="small"
            variant="flat"
          >
            {{ formatCurrency(item.credit_balance) }}
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
              icon="mdi-eye"
              size="small"
              variant="text"
              color="info"
              @click="viewPatient(item)"
            />
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              color="warning"
              @click="editPatient(item)"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="confirmDelete(item)"
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
              <!-- Name -->
              <v-col cols="12">
                <v-text-field
                  v-model="patientData.name"
                  :label="$t('patients.name') + ' *'"
                  :rules="[v => !!v || $t('validation.required')]"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  :error-messages="formErrors.name"
                />
              </v-col>

              <!-- Birth Date -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="patientData.birth_date"
                  :label="$t('patients.birth_date')"
                  prepend-inner-icon="mdi-calendar-blank"
                  variant="outlined"
                  type="date"
                  :max="new Date().toISOString().split('T')[0]"
                  :error-messages="formErrors.birth_date"
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
                  placeholder="07XXXXXXXXX"
                  maxlength="11"
                  :error-messages="formErrors.phone"
                  @input="formatPhoneNumber"
                />
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
              :color="selectedPatient.sex === 'Male' ? 'blue' : 'pink'"
              size="small"
              variant="tonal"
              class="mt-2"
            >
              {{ selectedPatient.sex === 'Male' ? $t('patients.male') : $t('patients.female') }}
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

const { t } = useI18n()
const router = useRouter()

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
const editMode = ref(false)

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

// Table Headers
const headers = computed(() => [
  { title: t('patients.name'), key: 'name', sortable: false },
  { title: t('patients.phone'), key: 'phone', sortable: false },
  { title: t('patients.gender'), key: 'sex', sortable: false },
  { title: t('patients.age'), key: 'age', sortable: false },
  { title: t('patients.doctor'), key: 'doctor', sortable: false },
  { title: t('patients.credit_balance'), key: 'credit_balance', sortable: false },
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
      sort: sortBy.value
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

// ==================== Helpers ====================

function formatPhoneNumber(event) {
  let value = event.target.value.replace(/\D/g, '') // Remove non-digits
  
  // Ensure it starts with 07
  if (value.length > 0 && !value.startsWith('07')) {
    if (value.startsWith('7')) {
      value = '0' + value
    } else if (value.startsWith('0') && value.length > 1 && value[1] !== '7') {
      value = '07' + value.substring(1)
    } else {
      value = '07' + value
    }
  }
  
  // Limit to 11 digits
  value = value.substring(0, 11)
  
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
    currency: 'USD'
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
