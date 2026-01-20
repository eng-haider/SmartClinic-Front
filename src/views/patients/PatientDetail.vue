<template>
  <v-container fluid class="patient-detail-page pa-4">
    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center align-center" style="min-height: 400px">
      <v-progress-circular indeterminate color="primary" size="64" />
    </div>

    <!-- Error State -->
    <v-alert v-else-if="error" type="error" class="mb-4" closable @click:close="error = null">
      {{ error }}
    </v-alert>

    <!-- Patient Content -->
    <template v-else-if="patient">
      <!-- Patient Header Card -->
      <v-card class="mb-4" elevation="2">
        <v-card-text>
          <div class="patient-header">
            <!-- Patient Avatar -->
            <v-avatar size="100" class="patient-avatar">
              <v-img
                v-if="patient.photo"
                :src="getPhotoUrl(patient.photo)"
                :alt="patient.name"
                cover
              />
              <v-icon v-else size="60" color="grey-lighten-1">mdi-account</v-icon>
            </v-avatar>

            <!-- Patient Info -->
            <div class="patient-info flex-grow-1">
              <div class="d-flex align-center flex-wrap gap-2 mb-2">
                <h1 class="text-h5 font-weight-bold">{{ patient.name }}</h1>
                <v-chip
                  size="small"
                  :color="patient.sex === 1 ? 'blue' : 'pink'"
                  variant="flat"
                >
                  <v-icon start size="16">
                    {{ patient.sex === 1 ? 'mdi-gender-male' : 'mdi-gender-female' }}
                  </v-icon>
                  {{ patient.sex === 1 ? $t('patients.male') : $t('patients.female') }}
                </v-chip>
                <v-chip size="small" color="grey" variant="outlined">
                  ID: {{ patient.id }}
                </v-chip>
              </div>

              <div class="info-grid">
                <div class="info-item" v-if="patient.phone">
                  <v-icon size="18" color="primary">mdi-phone</v-icon>
                  <a :href="`tel:${patient.phone}`" class="text-decoration-none">
                    {{ patient.phone }}
                  </a>
                </div>
                <div class="info-item" v-if="patient.phone2">
                  <v-icon size="18" color="primary">mdi-phone-plus</v-icon>
                  <a :href="`tel:${patient.phone2}`" class="text-decoration-none">
                    {{ patient.phone2 }}
                  </a>
                </div>
                <div class="info-item" v-if="patient.email">
                  <v-icon size="18" color="primary">mdi-email</v-icon>
                  <a :href="`mailto:${patient.email}`" class="text-decoration-none">
                    {{ patient.email }}
                  </a>
                </div>
                <div class="info-item" v-if="patient.birth_date">
                  <v-icon size="18" color="primary">mdi-cake-variant</v-icon>
                  <span>{{ formatDate(patient.birth_date) }} ({{ calculateAge(patient.birth_date) }} {{ $t('patients.years') }})</span>
                </div>
                <div class="info-item" v-if="patient.address">
                  <v-icon size="18" color="primary">mdi-map-marker</v-icon>
                  <span>{{ patient.address }}</span>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="patient-actions">
              <v-btn
                color="primary"
                variant="tonal"
                @click="editPatient"
                prepend-icon="mdi-pencil"
              >
                {{ $t('common.edit') }}
              </v-btn>
              <v-btn
                color="success"
                variant="tonal"
                @click="openBooking"
                prepend-icon="mdi-calendar-plus"
              >
                {{ $t('patients.booking') }}
              </v-btn>
              <v-btn
                color="warning"
                variant="tonal"
                @click="openRecipes"
                prepend-icon="mdi-pill"
              >
                {{ $t('patients.recipes') }}
              </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Quick Stats -->
      <v-row class="mb-4">
        <v-col cols="12" sm="6" md="3">
          <v-card elevation="1">
            <v-card-text class="text-center">
              <v-icon size="36" color="primary">mdi-tooth</v-icon>
              <h3 class="text-h5 font-weight-bold mt-2">{{ patientCases.length }}</h3>
              <p class="text-caption text-grey">{{ $t('patients.totalCases') }}</p>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card elevation="1">
            <v-card-text class="text-center">
              <v-icon size="36" color="success">mdi-check-circle</v-icon>
              <h3 class="text-h5 font-weight-bold mt-2">{{ completedCases }}</h3>
              <p class="text-caption text-grey">{{ $t('patients.completedCases') }}</p>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card elevation="1">
            <v-card-text class="text-center">
              <v-icon size="36" color="warning">mdi-cash</v-icon>
              <h3 class="text-h5 font-weight-bold mt-2">{{ formatCurrency(patient.credit_balance || 0) }}</h3>
              <p class="text-caption text-grey">{{ $t('patients.creditBalance') }}</p>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card elevation="1">
            <v-card-text class="text-center">
              <v-icon size="36" color="info">mdi-calendar</v-icon>
              <h3 class="text-h5 font-weight-bold mt-2">{{ formatDate(patient.last_visit) || '-' }}</h3>
              <p class="text-caption text-grey">{{ $t('patients.lastVisit') }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Tabs Section -->
      <v-card elevation="2">
        <v-tabs v-model="activeTab" color="primary" grow>
          <v-tab value="teeth">
            <v-icon start>mdi-tooth</v-icon>
            {{ $t('patients.teethChart') }}
          </v-tab>
          <v-tab value="cases">
            <v-icon start>mdi-clipboard-list</v-icon>
            {{ $t('patients.cases') }}
            <v-badge v-if="patientCases.length" :content="patientCases.length" color="primary" inline />
          </v-tab>
          <v-tab value="notes">
            <v-icon start>mdi-note-text</v-icon>
            {{ $t('patients.notes') }}
          </v-tab>
          <v-tab value="images">
            <v-icon start>mdi-image-multiple</v-icon>
            {{ $t('patients.images') }}
          </v-tab>
        </v-tabs>

        <v-tabs-window v-model="activeTab">
          <!-- Teeth Chart Tab -->
          <v-tabs-window-item value="teeth">
            <v-card-text>
              <TeethChart
                :categories="categories"
                :patient-cases="patientCases"
                :patient-data="patient"
                @tooth-selected="handleToothSelected"
                @tooth-right-click="handleToothRightClick"
                @case-added="handleCaseAdded"
                @general-examination="openGeneralExamination"
              />
            </v-card-text>
          </v-tabs-window-item>

          <!-- Cases Tab -->
          <v-tabs-window-item value="cases">
            <v-card-text>
              <div class="d-flex justify-space-between align-center mb-4">
                <v-text-field
                  v-model="caseSearch"
                  density="compact"
                  variant="outlined"
                  :placeholder="$t('common.search')"
                  prepend-inner-icon="mdi-magnify"
                  hide-details
                  clearable
                  style="max-width: 300px"
                />
                <v-btn
                  color="primary"
                  @click="addNewCase"
                  prepend-icon="mdi-plus"
                >
                  {{ $t('patients.addCase') }}
                </v-btn>
              </div>

              <v-data-table
                :headers="caseHeaders"
                :items="filteredCases"
                :search="caseSearch"
                :items-per-page="10"
                class="elevation-0"
              >
                <template #item.tooth_num="{ item }">
                  <v-chip
                    v-if="item.tooth_num"
                    size="small"
                    color="primary"
                    variant="outlined"
                  >
                    <v-icon start size="14">mdi-tooth</v-icon>
                    {{ item.tooth_num }}
                  </v-chip>
                  <span v-else class="text-grey">{{ $t('patients.general') }}</span>
                </template>

                <template #item.category="{ item }">
                  <v-chip size="small" :color="getCategoryColor(item.category_id)">
                    {{ getCategoryName(item.category_id) }}
                  </v-chip>
                </template>

                <template #item.status="{ item }">
                  <v-chip
                    size="small"
                    :color="item.status === 'completed' ? 'success' : 'warning'"
                    variant="flat"
                  >
                    {{ item.status === 'completed' ? $t('common.completed') : $t('common.pending') }}
                  </v-chip>
                </template>

                <template #item.created_at="{ item }">
                  {{ formatDate(item.created_at) }}
                </template>

                <template #item.actions="{ item }">
                  <v-btn
                    icon
                    variant="text"
                    size="small"
                    color="primary"
                    @click="editCase(item)"
                  >
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    variant="text"
                    size="small"
                    color="error"
                    @click="deleteCase(item)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-card-text>
          </v-tabs-window-item>

          <!-- Notes Tab -->
          <v-tabs-window-item value="notes">
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-card variant="outlined">
                    <v-card-title class="text-body-1 font-weight-bold">
                      <v-icon start color="primary">mdi-medical-bag</v-icon>
                      {{ $t('patients.systemicConditions') }}
                    </v-card-title>
                    <v-card-text>
                      <p v-if="patient.systemic_conditions" class="text-body-2">
                        {{ patient.systemic_conditions }}
                      </p>
                      <p v-else class="text-grey text-body-2">{{ $t('common.noData') }}</p>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" md="6">
                  <v-card variant="outlined">
                    <v-card-title class="text-body-1 font-weight-bold">
                      <v-icon start color="primary">mdi-note-text</v-icon>
                      {{ $t('patients.generalNotes') }}
                    </v-card-title>
                    <v-card-text>
                      <p v-if="patient.notes" class="text-body-2">
                        {{ patient.notes }}
                      </p>
                      <p v-else class="text-grey text-body-2">{{ $t('common.noData') }}</p>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-tabs-window-item>

          <!-- Images Tab -->
          <v-tabs-window-item value="images">
            <v-card-text>
              <div class="d-flex justify-space-between align-center mb-4">
                <h3 class="text-body-1 font-weight-bold">{{ $t('patients.patientImages') }}</h3>
                <v-btn
                  color="primary"
                  variant="tonal"
                  @click="uploadImage"
                  prepend-icon="mdi-upload"
                >
                  {{ $t('patients.uploadImage') }}
                </v-btn>
              </div>

              <v-row v-if="patientImages.length">
                <v-col
                  v-for="(image, index) in patientImages"
                  :key="image.id || index"
                  cols="6"
                  sm="4"
                  md="3"
                  lg="2"
                >
                  <v-card
                    class="image-card"
                    @click="viewImage(image)"
                    hover
                  >
                    <v-img
                      :src="getImageUrl(image)"
                      aspect-ratio="1"
                      cover
                      class="rounded"
                    >
                      <template #placeholder>
                        <div class="d-flex align-center justify-center fill-height">
                          <v-progress-circular indeterminate color="grey-lighten-5" />
                        </div>
                      </template>
                    </v-img>
                    <v-card-text class="pa-2 text-center text-caption">
                      {{ formatDate(image.created_at) }}
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <v-alert v-else type="info" variant="tonal">
                {{ $t('patients.noImages') }}
              </v-alert>
            </v-card-text>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>
    </template>

    <!-- Patient Not Found -->
    <v-alert v-else type="warning">
      {{ $t('patients.notFound') }}
    </v-alert>

    <!-- Edit Patient Dialog -->
    <v-dialog v-model="editDialog" max-width="600" scrollable>
      <PatientEditDialog
        v-if="editDialog"
        :patient="patient"
        @close="editDialog = false"
        @saved="onPatientSaved"
      />
    </v-dialog>

    <!-- Case Dialog -->
    <v-dialog v-model="caseDialog" max-width="500" scrollable>
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>{{ editingCase ? $t('patients.editCase') : $t('patients.addCase') }}</span>
          <v-btn icon variant="text" @click="caseDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="caseFormRef" v-model="caseFormValid">
            <v-select
              v-model="caseForm.category_id"
              :items="categories"
              :item-title="getCategoryItemTitle"
              item-value="id"
              :label="$t('patients.category')"
              :rules="[v => !!v || $t('validation.required')]"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-text-field
              v-model="caseForm.tooth_num"
              :label="$t('patients.toothNumber')"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-textarea
              v-model="caseForm.description"
              :label="$t('patients.description')"
              variant="outlined"
              density="comfortable"
              rows="3"
              class="mb-3"
            />
            <v-select
              v-model="caseForm.status"
              :items="statusOptions"
              :label="$t('patients.status')"
              variant="outlined"
              density="comfortable"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="caseDialog = false">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            :loading="savingCase"
            :disabled="!caseFormValid"
            @click="saveCase"
          >
            {{ $t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>{{ $t('common.confirmDelete') }}</v-card-title>
        <v-card-text>{{ $t('patients.deleteCaseConfirm') }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn color="error" :loading="deletingCase" @click="confirmDeleteCase">
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Image Viewer Dialog -->
    <v-dialog v-model="imageViewerDialog" max-width="900">
      <v-card>
        <v-toolbar color="transparent" flat>
          <v-toolbar-title>{{ $t('patients.imageViewer') }}</v-toolbar-title>
          <v-spacer />
          <v-btn icon @click="imageViewerDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text class="pa-0">
          <v-img
            v-if="selectedImage"
            :src="getImageUrl(selectedImage)"
            max-height="600"
            contain
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'
import TeethChart from '@/components/teeth/TeethChart.vue'
import PatientEditDialog from '@/components/PatientEditDialog.vue'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()

// State
const loading = ref(true)
const error = ref(null)
const patient = ref(null)
const patientCases = ref([])
const patientImages = ref([])
const categories = ref([])
const activeTab = ref('teeth')
const caseSearch = ref('')

// Dialogs
const editDialog = ref(false)
const caseDialog = ref(false)
const deleteDialog = ref(false)
const imageViewerDialog = ref(false)

// Case Form
const caseFormRef = ref(null)
const caseFormValid = ref(false)
const editingCase = ref(null)
const caseForm = ref({
  category_id: null,
  tooth_num: '',
  description: '',
  status: 'pending'
})
const savingCase = ref(false)
const deletingCase = ref(false)
const caseToDelete = ref(null)

// Image Viewer
const selectedImage = ref(null)

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Status Options
const statusOptions = computed(() => [
  { title: t('common.pending'), value: 'pending' },
  { title: t('common.completed'), value: 'completed' }
])

// Case Table Headers
const caseHeaders = computed(() => [
  { title: t('patients.toothNumber'), key: 'tooth_num', sortable: true },
  { title: t('patients.category'), key: 'category', sortable: true },
  { title: t('patients.description'), key: 'description', sortable: false },
  { title: t('patients.status'), key: 'status', sortable: true },
  { title: t('common.date'), key: 'created_at', sortable: true },
  { title: t('common.actions'), key: 'actions', sortable: false, align: 'center' }
])

// Computed
const completedCases = computed(() => {
  return patientCases.value.filter(c => c.status === 'completed').length
})

const filteredCases = computed(() => {
  if (!caseSearch.value) return patientCases.value
  const search = caseSearch.value.toLowerCase()
  return patientCases.value.filter(c => {
    return (
      String(c.tooth_num).includes(search) ||
      c.description?.toLowerCase().includes(search) ||
      getCategoryName(c.category_id).toLowerCase().includes(search)
    )
  })
})

// Methods
const fetchPatient = async () => {
  try {
    loading.value = true
    error.value = null
    const id = route.params.id
    // Using new API: GET /api/patients/{id}
    const response = await api.get(`/patients/${id}`)
    patient.value = response.data.data || response.data
  } catch (err) {
    console.error('Error fetching patient:', err)
    error.value = err.response?.data?.message || t('errors.fetchFailed')
  } finally {
    loading.value = false
  }
}

const fetchPatientCases = async () => {
  try {
    const id = route.params.id
    const response = await api.get(`/cases?patient_id=${id}`)
    patientCases.value = response.data.data || response.data || []
  } catch (err) {
    console.error('Error fetching cases:', err)
  }
}

const fetchPatientImages = async () => {
  try {
    const id = route.params.id
    const response = await api.get(`/patient-images?patient_id=${id}`)
    patientImages.value = response.data.data || response.data || []
  } catch (err) {
    console.error('Error fetching images:', err)
  }
}

const fetchCategories = async () => {
  try {
    const response = await api.get('/case-categories')
    categories.value = response.data.data || response.data || []
  } catch (err) {
    console.error('Error fetching categories:', err)
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value === 'ar' ? 'ar-IQ' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const calculateAge = (birthDate) => {
  if (!birthDate) return '-'
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat(locale.value === 'ar' ? 'ar-IQ' : 'en-US', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0
  }).format(amount)
}

const getPhotoUrl = (photo) => {
  if (!photo) return ''
  if (photo.startsWith('http')) return photo
  return `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8002'}/storage/${photo}`
}

const getImageUrl = (image) => {
  const url = image.url || image.path || image
  if (url.startsWith('http')) return url
  return `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8002'}/storage/${url}`
}

const getCategoryName = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId)
  if (!category) return '-'
  if (locale.value === 'ar') return category.name_ar || category.name
  if (locale.value === 'ku') return category.name_ku || category.name_en || category.name
  return category.name_en || category.name
}

const getCategoryItemTitle = (item) => {
  if (locale.value === 'ar') return item.name_ar || item.name
  if (locale.value === 'ku') return item.name_ku || item.name_en || item.name
  return item.name_en || item.name
}

const getCategoryColor = (categoryId) => {
  const colors = ['primary', 'success', 'warning', 'info', 'error', 'secondary']
  return colors[categoryId % colors.length]
}

// Patient Actions
const editPatient = () => {
  editDialog.value = true
}

const onPatientSaved = (updatedPatient) => {
  patient.value = updatedPatient
  editDialog.value = false
  showSnackbar(t('messages.patientUpdated'), 'success')
}

const openBooking = () => {
  // Placeholder - will be implemented later
  showSnackbar(t('messages.featureComingSoon'), 'info')
}

const openRecipes = () => {
  // Placeholder - will be implemented later
  showSnackbar(t('messages.featureComingSoon'), 'info')
}

// Teeth Chart Handlers
const handleToothSelected = (toothNum) => {
  console.log('Tooth selected:', toothNum)
}

const handleToothRightClick = ({ event, toothNum }) => {
  console.log('Tooth right click:', toothNum)
}

const handleCaseAdded = async ({ toothNum, category }) => {
  caseForm.value = {
    category_id: category.id,
    tooth_num: String(toothNum),
    description: '',
    status: 'pending'
  }
  editingCase.value = null
  caseDialog.value = true
}

const openGeneralExamination = () => {
  caseForm.value = {
    category_id: null,
    tooth_num: '',
    description: '',
    status: 'pending'
  }
  editingCase.value = null
  caseDialog.value = true
}

// Case CRUD
const addNewCase = () => {
  caseForm.value = {
    category_id: null,
    tooth_num: '',
    description: '',
    status: 'pending'
  }
  editingCase.value = null
  caseDialog.value = true
}

const editCase = (caseItem) => {
  editingCase.value = caseItem
  caseForm.value = {
    category_id: caseItem.category_id,
    tooth_num: caseItem.tooth_num || '',
    description: caseItem.description || '',
    status: caseItem.status || 'pending'
  }
  caseDialog.value = true
}

const saveCase = async () => {
  if (!caseFormRef.value?.validate()) return

  try {
    savingCase.value = true
    const payload = {
      patient_id: patient.value.id,
      category_id: caseForm.value.category_id,
      tooth_num: caseForm.value.tooth_num || null,
      description: caseForm.value.description,
      status: caseForm.value.status
    }

    if (editingCase.value) {
      await api.put(`/cases/${editingCase.value.id}`, payload)
      showSnackbar(t('messages.caseUpdated'), 'success')
    } else {
      await api.post('/cases', payload)
      showSnackbar(t('messages.caseCreated'), 'success')
    }

    caseDialog.value = false
    await fetchPatientCases()
  } catch (err) {
    console.error('Error saving case:', err)
    showSnackbar(err.response?.data?.message || t('errors.saveFailed'), 'error')
  } finally {
    savingCase.value = false
  }
}

const deleteCase = (caseItem) => {
  caseToDelete.value = caseItem
  deleteDialog.value = true
}

const confirmDeleteCase = async () => {
  try {
    deletingCase.value = true
    await api.delete(`/cases/${caseToDelete.value.id}`)
    showSnackbar(t('messages.caseDeleted'), 'success')
    deleteDialog.value = false
    await fetchPatientCases()
  } catch (err) {
    console.error('Error deleting case:', err)
    showSnackbar(err.response?.data?.message || t('errors.deleteFailed'), 'error')
  } finally {
    deletingCase.value = false
  }
}

// Images
const viewImage = (image) => {
  selectedImage.value = image
  imageViewerDialog.value = true
}

const uploadImage = () => {
  // Placeholder - will be implemented later
  showSnackbar(t('messages.featureComingSoon'), 'info')
}

// Snackbar
const showSnackbar = (message, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

// Watch route changes
watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchPatient()
    fetchPatientCases()
    fetchPatientImages()
  }
})

// Lifecycle
onMounted(() => {
  fetchPatient()
  fetchPatientCases()
  fetchPatientImages()
  fetchCategories()
})
</script>

<style scoped>
.patient-detail-page {
  max-width: 1400px;
  margin: 0 auto;
}

.patient-header {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.patient-avatar {
  border: 3px solid #e0e0e0;
  flex-shrink: 0;
}

.patient-info {
  min-width: 200px;
}

.info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #616161;
  font-size: 14px;
}

.patient-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-inline-start: auto;
}

.image-card {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.image-card:hover {
  transform: scale(1.02);
}

/* Mobile */
@media (max-width: 768px) {
  .patient-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .patient-info {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .info-grid {
    justify-content: center;
  }

  .patient-actions {
    justify-content: center;
    margin-inline-start: 0;
  }
}
</style>
