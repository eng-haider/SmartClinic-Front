<template>
  <div class="doctors-page">
    <!-- Page Header -->
    <div class="page-header mb-6">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4">
        <div>
          <h1 class="text-h4 font-weight-bold text-primary">{{ $t('doctors.title') }}</h1>
          <p class="text-grey mt-1">{{ $t('doctors.subtitle') }}</p>
        </div>
        <v-btn
          color="primary"
          size="large"
          prepend-icon="mdi-plus"
          @click="openAddDialog"
          elevation="2"
        >
          {{ $t('doctors.add') }}
        </v-btn>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <v-card class="toolbar-card mb-6" elevation="2" rounded="xl">
      <v-card-text>
        <v-row align="center">
          <!-- Search -->
          <v-col cols="12" md="6">
            <v-text-field
              v-model="search"
              :label="$t('doctors.search')"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              @update:model-value="debouncedSearch"
            />
          </v-col>

          <!-- Status Filter -->
          <v-col cols="6" md="3">
            <v-select
              v-model="filters.is_active"
              :label="$t('doctors.status')"
              :items="statusOptions"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              @update:model-value="loadDoctors"
            />
          </v-col>

          <!-- Per Page -->
          <v-col cols="6" md="3">
            <v-select
              v-model="perPage"
              :label="$t('doctors.per_page')"
              :items="[15, 25, 50, 100]"
              variant="outlined"
              density="comfortable"
              hide-details
              @update:model-value="loadDoctors"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Doctors Table -->
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
        :items="doctors"
        :items-length="totalDoctors"
        :loading="loading"
        class="doctors-table"
        density="compact"
        mobile-breakpoint="md"
        hover
        @update:page="loadDoctors"
        @update:items-per-page="loadDoctors"
      >
        <!-- Avatar & Name -->
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center ga-3 py-2">
            <v-avatar :color="getAvatarColor(item.name)" size="42">
              <v-icon color="white">mdi-doctor</v-icon>
            </v-avatar>
            <div>
              <div class="font-weight-medium">{{ item.name }}</div>
              <div class="text-caption text-grey">ID: {{ item.id }}</div>
            </div>
          </div>
        </template>

        <!-- Email -->
        <template v-slot:item.email="{ item }">
          <div class="d-flex align-center ga-2">
            <v-icon size="small" color="grey">mdi-email</v-icon>
            <span dir="ltr">{{ item.email }}</span>
          </div>
        </template>

        <!-- Phone -->
        <template v-slot:item.phone="{ item }">
          <div class="d-flex align-center ga-2">
            <v-icon size="small" color="grey">mdi-phone</v-icon>
            <span dir="ltr">{{ item.phone || '-' }}</span>
          </div>
        </template>

        <!-- Role Badge -->
        <template v-slot:item.role="{ item }">
          <v-chip
            :color="getRoleColor(item.roles?.[0])"
            size="small"
            variant="tonal"
          >
            <v-icon start size="14">{{ getRoleIcon(item.roles?.[0]) }}</v-icon>
            {{ getRoleLabel(item.roles?.[0]) }}
          </v-chip>
        </template>

        <!-- Status Badge -->
        <template v-slot:item.is_active="{ item }">
          <v-chip
            :color="item.is_active ? 'success' : 'error'"
            size="small"
            variant="flat"
          >
            <v-icon start size="14">{{ item.is_active ? 'mdi-check-circle' : 'mdi-close-circle' }}</v-icon>
            {{ item.is_active ? $t('doctors.active') : $t('doctors.inactive') }}
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
              @click="viewDoctor(item)"
            />
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              color="warning"
              @click="editDoctor(item)"
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
            <v-icon size="80" color="grey-lighten-2">mdi-doctor</v-icon>
            <h3 class="text-h6 mt-4 text-grey">{{ $t('doctors.no_doctors') }}</h3>
            <p class="text-grey-darken-1">{{ $t('doctors.no_doctors_desc') }}</p>
            <v-btn
              color="primary"
              class="mt-4"
              prepend-icon="mdi-plus"
              @click="openAddDialog"
            >
              {{ $t('doctors.add_first') }}
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
          {{ $t('doctors.showing') }} {{ paginationInfo.from }}-{{ paginationInfo.to }} 
          {{ $t('doctors.of') }} {{ paginationInfo.total }} {{ $t('doctors.doctors') }}
        </div>
      </div>
    </v-card>

    <!-- Add/Edit Doctor Dialog -->
    <v-dialog v-model="doctorDialog" max-width="700" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary">
          <span class="text-white">
            {{ editMode ? $t('doctors.edit_doctor') : $t('doctors.add_doctor') }}
          </span>
          <v-btn icon="mdi-close" variant="text" color="white" @click="closeDialog" />
        </v-card-title>

        <v-card-text class="pa-6">
          <v-form ref="doctorForm" @submit.prevent="saveDoctor">
            <v-row>
              <!-- Name -->
              <v-col cols="12">
                <v-text-field
                  v-model="doctorData.name"
                  :label="$t('doctors.name') + ' *'"
                  :rules="[v => !!v || $t('validation.required')]"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  :error-messages="formErrors.name"
                />
              </v-col>

              <!-- Email -->
              <!-- <v-col cols="12" md="6">
                <v-text-field
                  v-model="doctorData.email"
                  :label="$t('doctors.email') + ' *'"
                  :rules="[
                    v => !!v || $t('validation.required'),
                    v => /.+@.+\..+/.test(v) || $t('validation.email')
                  ]"
                  prepend-inner-icon="mdi-email"
                  variant="outlined"
                  type="email"
                  dir="ltr"
                  :error-messages="formErrors.email"
                />
              </v-col> -->

              <!-- Phone -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="doctorData.phone"
                  :label="$t('doctors.phone')"
                  prepend-inner-icon="mdi-phone"
                  variant="outlined"
                  dir="ltr"
                  placeholder="+1234567890"
                  :error-messages="formErrors.phone"
                />
              </v-col>

              <!-- Password (only for new doctors or when changing) -->
              <v-col cols="12" md="6" v-if="!editMode || showPasswordField">
                <v-text-field
                  v-model="doctorData.password"
                  :label="$t('doctors.password') + (editMode ? '' : ' *')"
                  :rules="editMode ? [] : [v => !!v || $t('validation.required'), v => v.length >= 8 || $t('validation.minLength', { min: 8 })]"
                  prepend-inner-icon="mdi-lock"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  :type="showPassword ? 'text' : 'password'"
                  variant="outlined"
                  :error-messages="formErrors.password"
                  @click:append-inner="showPassword = !showPassword"
                />
              </v-col>

              <!-- Change Password Toggle (edit mode only) -->
              <v-col cols="12" md="6" v-if="editMode && !showPasswordField">
                <v-btn
                  variant="outlined"
                  color="primary"
                  block
                  height="56"
                  @click="showPasswordField = true"
                >
                  <v-icon start>mdi-lock-reset</v-icon>
                  {{ $t('doctors.change_password') }}
                </v-btn>
              </v-col>

              <!-- Role -->
              <v-col cols="12" md="6">
                <v-select
                  v-model="doctorData.role"
                  :label="$t('doctors.role')"
                  :items="roleOptions"
                  prepend-inner-icon="mdi-shield-account"
                  variant="outlined"
                  :error-messages="formErrors.role"
                />
              </v-col>

              <!-- Status -->
              <v-col cols="12" md="6">
                <v-switch
                  v-model="doctorData.is_active"
                  :label="$t('doctors.is_active')"
                  color="success"
                  hide-details
                  inset
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
            @click="saveDoctor"
          >
            {{ editMode ? $t('common.update') : $t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- View Doctor Dialog -->
    <v-dialog v-model="viewDialog" max-width="600">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary">
          <span class="text-white">{{ $t('doctors.doctor_details') }}</span>
          <v-btn icon="mdi-close" variant="text" color="white" @click="viewDialog = false" />
        </v-card-title>

        <v-card-text class="pa-6" v-if="selectedDoctor">
          <v-row>
            <!-- Avatar -->
            <v-col cols="12" class="text-center">
              <v-avatar :color="getAvatarColor(selectedDoctor.name)" size="80">
                <v-icon color="white" size="50">mdi-doctor</v-icon>
              </v-avatar>
              <h2 class="text-h5 mt-4">{{ selectedDoctor.name }}</h2>
              <v-chip
                :color="selectedDoctor.is_active ? 'success' : 'error'"
                size="small"
                class="mt-2"
              >
                {{ selectedDoctor.is_active ? $t('doctors.active') : $t('doctors.inactive') }}
              </v-chip>
            </v-col>

            <!-- Details -->
            <v-col cols="12">
              <v-list lines="two">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-identifier</v-icon>
                  </template>
                  <v-list-item-title>{{ $t('doctors.id') }}</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedDoctor.id }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-email</v-icon>
                  </template>
                  <v-list-item-title>{{ $t('doctors.email') }}</v-list-item-title>
                  <v-list-item-subtitle dir="ltr">{{ selectedDoctor.email }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="selectedDoctor.phone">
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-phone</v-icon>
                  </template>
                  <v-list-item-title>{{ $t('doctors.phone') }}</v-list-item-title>
                  <v-list-item-subtitle dir="ltr">{{ selectedDoctor.phone }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-shield-account</v-icon>
                  </template>
                  <v-list-item-title>{{ $t('doctors.role') }}</v-list-item-title>
                  <v-list-item-subtitle>{{ getRoleLabel(selectedDoctor.roles?.[0]) }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary">mdi-calendar</v-icon>
                  </template>
                  <v-list-item-title>{{ $t('doctors.created_at') }}</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(selectedDoctor.created_at) }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-btn
            variant="outlined"
            color="warning"
            prepend-icon="mdi-pencil"
            @click="editFromView"
          >
            {{ $t('common.edit') }}
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="viewDialog = false">
            {{ $t('common.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="text-h6 pa-4">
          {{ $t('doctors.delete_doctor') }}
        </v-card-title>
        <v-card-text>
          {{ $t('doctors.delete_confirm') }}
          <strong>{{ doctorToDelete?.name }}</strong>?
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
            @click="deleteDoctor"
          >
            {{ $t('common.delete') }}
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
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import DoctorService from '@/services/doctor.service'

// ==================== Composables ====================
const { t } = useI18n()

// ==================== State ====================
const doctors = ref([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const error = ref('')
const search = ref('')
const perPage = ref(15)
const currentPage = ref(1)
const totalDoctors = ref(0)

// Dialogs
const doctorDialog = ref(false)
const viewDialog = ref(false)
const deleteDialog = ref(false)
const editMode = ref(false)
const selectedDoctor = ref(null)
const doctorToDelete = ref(null)

// Form
const doctorForm = ref(null)
const showPassword = ref(false)
const showPasswordField = ref(false)

const doctorData = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'doctor',
  is_active: true
})

const formErrors = reactive({})

const filters = reactive({
  is_active: null
})

// Snackbar
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success'
})

// ==================== Computed ====================
const headers = computed(() => [
  { title: t('doctors.name'), key: 'name', align: 'start', sortable: true },
  { title: t('doctors.email'), key: 'email', align: 'start', sortable: true },
  { title: t('doctors.phone'), key: 'phone', align: 'start', sortable: false },
  { title: t('doctors.role'), key: 'role', align: 'center', sortable: false },
  { title: t('doctors.status'), key: 'is_active', align: 'center', sortable: true },
  { title: t('doctors.created_at'), key: 'created_at', align: 'start', sortable: true },
  { title: t('common.actions'), key: 'actions', align: 'center', sortable: false }
])

const statusOptions = computed(() => [
  { title: t('doctors.all_status'), value: null },
  { title: t('doctors.active'), value: true },
  { title: t('doctors.inactive'), value: false }
])

const roleOptions = computed(() => [
  { title: t('doctors.doctor'), value: 'doctor' },
  { title: t('doctors.clinic_super_doctor'), value: 'clinic_super_doctor' }
])

const paginationInfo = computed(() => {
  const from = (currentPage.value - 1) * perPage.value + 1
  const to = Math.min(currentPage.value * perPage.value, totalDoctors.value)
  return {
    from: totalDoctors.value > 0 ? from : 0,
    to: totalDoctors.value > 0 ? to : 0,
    total: totalDoctors.value
  }
})

// ==================== Methods ====================

// Debounced Search
let searchTimeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadDoctors()
  }, 500)
}

// Load Doctors
async function loadDoctors() {
  loading.value = true
  error.value = ''

  try {
    const params = {
      page: currentPage.value,
      per_page: perPage.value
    }

    if (search.value) {
      params.search = search.value
    }

    if (filters.is_active !== null && filters.is_active !== undefined) {
      params['filter[is_active]'] = filters.is_active ? 1 : 0
    }

    const response = await DoctorService.getAll(params)
    
    doctors.value = response.data || []
    totalDoctors.value = response.pagination?.total || response.total || 0
    
  } catch (err) {
    console.error('Failed to load doctors:', err)
    error.value = t('doctors.load_error')
  } finally {
    loading.value = false
  }
}

// Open Add Dialog
function openAddDialog() {
  editMode.value = false
  showPasswordField.value = false
  resetForm()
  doctorDialog.value = true
}

// Edit Doctor
function editDoctor(doctor) {
  editMode.value = true
  showPasswordField.value = false
  selectedDoctor.value = doctor
  
  Object.assign(doctorData, {
    name: doctor.name,
    email: doctor.email,
    phone: doctor.phone || '',
    password: '',
    role: doctor.roles?.[0] || 'doctor',
    is_active: doctor.is_active
  })
  
  doctorDialog.value = true
}

// Edit from View Dialog
function editFromView() {
  viewDialog.value = false
  editDoctor(selectedDoctor.value)
}

// View Doctor
function viewDoctor(doctor) {
  selectedDoctor.value = doctor
  viewDialog.value = true
}

// Close Dialog
function closeDialog() {
  doctorDialog.value = false
  resetForm()
}

// Reset Form
function resetForm() {
  Object.assign(doctorData, {
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'doctor',
    is_active: true
  })
  Object.keys(formErrors).forEach(key => delete formErrors[key])
  showPassword.value = false
}

// Save Doctor
async function saveDoctor() {
  // Validate form
  const { valid } = await doctorForm.value.validate()
  if (!valid) return

  saving.value = true
  Object.keys(formErrors).forEach(key => delete formErrors[key])

  try {
    const payload = { ...doctorData }
    
    // Don't send password if not changing in edit mode
    if (editMode.value && !showPasswordField.value) {
      delete payload.password
    }

    // Don't send empty password
    if (!payload.password) {
      delete payload.password
    }
    
    let response
    if (editMode.value) {
      response = await DoctorService.update(selectedDoctor.value.id, payload)
    } else {
      response = await DoctorService.create(payload)
    }

    showSnackbar(
      editMode.value ? t('doctors.updated') : t('doctors.created'),
      'success'
    )
    
    closeDialog()
    loadDoctors()
    
  } catch (err) {
    console.error('Failed to save doctor:', err)
    
    if (err.response?.status === 422) {
      const errors = err.response.data.errors
      Object.keys(errors).forEach(key => {
        formErrors[key] = errors[key][0]
      })
    } else {
      showSnackbar(t('doctors.save_error'), 'error')
    }
  } finally {
    saving.value = false
  }
}

// Confirm Delete
function confirmDelete(doctor) {
  doctorToDelete.value = doctor
  viewDialog.value = false
  deleteDialog.value = true
}

// Delete Doctor
async function deleteDoctor() {
  deleting.value = true

  try {
    await DoctorService.delete(doctorToDelete.value.id)
    
    showSnackbar(t('doctors.deleted'), 'success')
    deleteDialog.value = false
    loadDoctors()
    
  } catch (err) {
    console.error('Failed to delete doctor:', err)
    showSnackbar(t('doctors.delete_error'), 'error')
  } finally {
    deleting.value = false
  }
}

// ==================== Helpers ====================

function getAvatarColor(name) {
  const colors = ['primary', 'secondary', 'success', 'warning', 'info', 'error']
  const index = name ? name.charCodeAt(0) % colors.length : 0
  return colors[index]
}

function getRoleColor(role) {
  const colors = {
    'doctor': 'blue',
    'clinic_super_doctor': 'purple'
  }
  return colors[role] || 'grey'
}

function getRoleIcon(role) {
  const icons = {
    'doctor': 'mdi-doctor',
    'clinic_super_doctor': 'mdi-shield-star'
  }
  return icons[role] || 'mdi-account'
}

function getRoleLabel(role) {
  const labels = {
    'doctor': t('doctors.doctor'),
    'clinic_super_doctor': t('doctors.clinic_super_doctor')
  }
  return labels[role] || role
}

function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function showSnackbar(message, color = 'success') {
  snackbar.message = message
  snackbar.color = color
  snackbar.show = true
}

// ==================== Lifecycle ====================
onMounted(() => {
  loadDoctors()
})
</script>

<style scoped>
.doctors-page {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

.toolbar-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
}

.doctors-table {
  min-height: 400px;
}

.doctors-table :deep(tbody tr) {
  cursor: pointer;
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
[dir="rtl"] .doctors-page {
  text-align: right;
}

/* Responsive */
@media (max-width: 960px) {
  .doctors-page {
    padding: 16px;
  }
}
</style>
