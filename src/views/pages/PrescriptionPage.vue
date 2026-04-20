<template>
  <v-container fluid class="rx-page pa-4 pa-md-6">
    <!-- ═══════════ Page Header ═══════════ -->
    <div class="rx-page__header mb-5">
      <div class="d-flex align-center justify-space-between flex-wrap gap-3">
        <div>
          <h1 class="rx-page__title">
            <v-icon start size="32" color="primary">mdi-pill</v-icon>
            {{ $t('rx.title') }}
          </h1>
          <p class="rx-page__subtitle">{{ $t('rx.subtitle') }}</p>
        </div>
        <v-btn color="primary" size="large" prepend-icon="mdi-plus" elevation="0" rounded="lg" @click="openAddDialog">
          {{ $t('rx.new_prescription') }}
        </v-btn>
      </div>
    </div>

    <!-- ═══════════ Filters ═══════════ -->
    <v-card class="mb-5 rx-page__filters" elevation="0" rounded="xl">
      <v-card-text class="pa-4">
        <v-row dense align="center">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              :label="$t('rx.search')"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @update:model-value="debouncedSearch"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="selectedDoctor"
              :items="doctors"
              :label="$t('rx.filter_by_doctor')"
              item-title="name"
              item-value="id"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              prepend-inner-icon="mdi-doctor"
              @update:model-value="fetchRecipes"
            />
          </v-col>
          <v-col cols="6" md="2">
            <v-text-field v-model="dateFrom" :label="$t('rx.date_from')" type="date" variant="outlined" density="compact" hide-details @change="fetchRecipes" />
          </v-col>
          <v-col cols="6" md="2">
            <v-text-field v-model="dateTo" :label="$t('rx.date_to')" type="date" variant="outlined" density="compact" hide-details @change="fetchRecipes" />
          </v-col>
          <v-col cols="12" md="1" class="d-flex justify-end">
            <v-btn icon="mdi-refresh" variant="tonal" :loading="loading" @click="fetchRecipes" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- ═══════════ Prescription List ═══════════ -->
    <v-card elevation="0" rounded="xl" class="rx-page__list">
      <v-progress-linear v-if="loading" indeterminate color="primary" />

      <!-- Desktop Table -->
      <v-data-table
        v-if="!$vuetify.display.mobile"
        :headers="headers"
        :items="recipes"
        :items-per-page="itemsPerPage"
        :loading="loading"
        class="elevation-0"
        density="comfortable"
      >
        <template #item.patient="{ item }">
          <div class="d-flex align-center gap-2">
            <v-avatar size="36" color="primary" variant="tonal">
              <span class="text-primary text-caption font-weight-bold">{{ getInitials(item.patient?.name) }}</span>
            </v-avatar>
            <div>
              <div class="font-weight-medium">{{ item.patient?.name || '—' }}</div>
              <div class="text-caption text-grey" dir="ltr">{{ item.patient?.phone }}</div>
            </div>
          </div>
        </template>

        <template #item.doctor="{ item }">
          <v-chip size="small" color="info" variant="tonal">
            <v-icon start size="14">mdi-doctor</v-icon>
            {{ item.doctor?.name || '—' }}
          </v-chip>
        </template>

        <template #item.medications="{ item }">
          <v-chip size="small" color="primary" variant="flat">
            <v-icon start size="14">mdi-pill</v-icon>
            {{ (item.recipe_items || item.recipeItems)?.length || 0 }}
          </v-chip>
        </template>

        <template #item.notes="{ item }">
          <div class="text-truncate" style="max-width: 200px">{{ item.notes || '—' }}</div>
        </template>

        <template #item.created_at="{ item }">
          <span class="text-caption">
            <v-icon size="14" class="me-1">mdi-calendar</v-icon>
            {{ formatDate(item.created_at) }}
          </span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <v-btn icon="mdi-eye" variant="text" size="small" color="info" @click="openPreview(item)" />
            <v-btn icon="mdi-printer" variant="text" size="small" color="success" @click="directPrint(item)" />
            <v-btn icon="mdi-pencil" variant="text" size="small" color="primary" @click="editRecipe(item)" />
            <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="confirmDelete(item)" />
          </div>
        </template>

        <template #no-data>
          <div class="text-center py-10">
            <v-icon size="64" color="grey-lighten-1">mdi-pill-off</v-icon>
            <p class="text-h6 text-grey mt-4">{{ $t('rx.no_prescriptions') }}</p>
            <v-btn color="primary" variant="tonal" class="mt-4" prepend-icon="mdi-plus" @click="openAddDialog">
              {{ $t('rx.add_first') }}
            </v-btn>
          </div>
        </template>
      </v-data-table>

      <!-- Mobile Cards -->
      <div v-else class="pa-4">
        <div v-if="!recipes.length && !loading" class="text-center py-10">
          <v-icon size="64" color="grey-lighten-1">mdi-pill-off</v-icon>
          <p class="text-h6 text-grey mt-4">{{ $t('rx.no_prescriptions') }}</p>
          <v-btn color="primary" variant="tonal" class="mt-4" prepend-icon="mdi-plus" @click="openAddDialog">
            {{ $t('rx.add_first') }}
          </v-btn>
        </div>

        <v-card
          v-for="recipe in recipes"
          :key="recipe.id"
          variant="outlined"
          class="mb-3 rx-page__mobile-card"
          rounded="lg"
          @click="openPreview(recipe)"
        >
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="d-flex align-center gap-2">
                <v-avatar size="40" color="primary" variant="tonal">
                  <span class="text-primary font-weight-bold">{{ getInitials(recipe.patient?.name) }}</span>
                </v-avatar>
                <div>
                  <div class="font-weight-medium">{{ recipe.patient?.name }}</div>
                  <div class="text-caption text-grey" dir="ltr">{{ recipe.patient?.phone }}</div>
                </div>
              </div>
              <v-chip size="small" color="primary" variant="flat">
                <v-icon start size="12">mdi-pill</v-icon>
                {{ (recipe.recipe_items || recipe.recipeItems)?.length || 0 }}
              </v-chip>
            </div>
            <div class="d-flex align-center gap-2 mb-2">
              <v-chip size="x-small" color="info" variant="tonal">
                <v-icon start size="12">mdi-doctor</v-icon>
                {{ recipe.doctor?.name }}
              </v-chip>
              <v-chip size="x-small" variant="outlined">
                <v-icon start size="12">mdi-calendar</v-icon>
                {{ formatDate(recipe.created_at) }}
              </v-chip>
            </div>
            <div v-if="recipe.notes" class="text-caption text-grey text-truncate mb-3">{{ recipe.notes }}</div>
            <v-divider class="mb-3" />
            <div class="d-flex justify-end gap-2">
              <v-btn icon="mdi-printer" variant="tonal" size="small" color="success" @click.stop="directPrint(recipe)" />
              <v-btn icon="mdi-pencil" variant="tonal" size="small" color="primary" @click.stop="editRecipe(recipe)" />
              <v-btn icon="mdi-delete" variant="tonal" size="small" color="error" @click.stop="confirmDelete(recipe)" />
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- Pagination -->
      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-pagination v-model="currentPage" :length="totalPages" :total-visible="5" size="small" @update:model-value="fetchRecipes" />
        <v-spacer />
      </v-card-actions>
    </v-card>

    <!-- ═══════════ Create/Edit Dialog ═══════════ -->
    <v-dialog v-model="rxDialog" max-width="1000" persistent scrollable>
      <v-card rounded="xl" class="rx-page__dialog">
        <v-card-title class="d-flex align-center justify-space-between pa-4 rx-page__dialog-header">
          <div class="d-flex align-center gap-2">
            <v-icon color="white">mdi-pill</v-icon>
            <span class="text-white text-h6">
              {{ isEditing ? $t('rx.edit_prescription') : $t('rx.new_prescription') }}
            </span>
          </div>
          <v-btn icon="mdi-close" variant="text" color="white" @click="closeDialog" />
        </v-card-title>

        <v-card-text class="pa-6">
          <v-form ref="rxFormRef" v-model="formValid">
            <!-- Patient -->
            <v-alert v-if="rxForm.patientInfo" type="info" variant="tonal" density="compact" class="mb-4">
              <div class="d-flex align-center gap-2">
                <v-icon>mdi-account</v-icon>
                <span class="font-weight-medium">{{ rxForm.patientInfo.name }}</span>
                <span v-if="rxForm.patientInfo.phone" class="text-caption">• {{ rxForm.patientInfo.phone }}</span>
              </div>
            </v-alert>

            <v-autocomplete
              v-if="!rxForm.patientInfo"
              v-model="rxForm.patient"
              v-model:search="patientSearch"
              :items="patientOptions"
              :label="$t('rx.select_patient')"
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
              <template #item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps">
                  <template #prepend>
                    <v-avatar color="primary" size="36" variant="tonal">
                      <span class="text-primary text-caption">{{ getInitials(item.raw.name) }}</span>
                    </v-avatar>
                  </template>
                  <template #subtitle>
                    <span dir="ltr">{{ item.raw.phone }}</span>
                  </template>
                </v-list-item>
              </template>
              <template #no-data>
                <v-list-item>
                  <v-list-item-title>
                    {{ patientSearch?.length >= 3 ? $t('rx.no_patients_found') : $t('rx.type_to_search') }}
                  </v-list-item-title>
                </v-list-item>
              </template>
            </v-autocomplete>

            <!-- Doctor -->
            <v-select
              v-model="rxForm.doctors_id"
              :items="doctors"
              :label="$t('rx.select_doctor')"
              item-title="name"
              item-value="id"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-doctor"
              :rules="[rules.required]"
              class="mb-4"
            />

            <!-- Notes -->
            <v-textarea
              v-model="rxForm.notes"
              :label="$t('rx.prescription_notes')"
              :placeholder="$t('rx.notes_placeholder')"
              variant="outlined"
              density="comfortable"
              rows="2"
              auto-grow
              class="mb-4"
              prepend-inner-icon="mdi-note-text"
            />

            <v-divider class="mb-4" />

            <!-- Medication Form -->
            <MedicationForm
              :edit-item="editingMedication"
              :edit-index="editingMedIndex"
              class="mb-4"
              @add="addMedication"
              @update="updateMedication"
              @cancel-edit="cancelMedEdit"
            />

            <!-- Medication Table -->
            <MedicationTable
              :medications="rxForm.recipe_items"
              editable
              @edit="startMedEdit"
              @remove="removeMedication"
            />
          </v-form>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">{{ $t('common.cancel') }}</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="saving"
            :disabled="!formValid || !rxForm.recipe_items.length"
            prepend-icon="mdi-content-save"
            @click="handleSave"
          >
            {{ $t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ═══════════ Preview Dialog ═══════════ -->
    <v-dialog v-model="previewDialog" max-width="900" scrollable>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between pa-4 rx-page__dialog-header">
          <div class="d-flex align-center gap-2">
            <v-icon color="white">mdi-file-document</v-icon>
            <span class="text-white">{{ $t('rx.preview') }}</span>
          </div>
          <v-btn icon="mdi-close" variant="text" color="white" @click="previewDialog = false" />
        </v-card-title>
        <v-card-text class="pa-6">
          <RxPreview
            ref="rxPreviewRef"
            :prescription="previewPrescription"
            :patient="previewPatient"
            :medications="previewMedications"
            :settings="rxPrintSettings"
            @open-settings="openPrintSettings"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- ═══════════ Print Settings Dialog ═══════════ -->
    <v-dialog v-model="settingsDialog" max-width="600" persistent scrollable>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between pa-4 rx-page__dialog-header">
          <div class="d-flex align-center gap-2">
            <v-icon color="white">mdi-cog</v-icon>
            <span class="text-white">{{ $t('rx.print_settings') }}</span>
          </div>
          <v-btn icon="mdi-close" variant="text" color="white" @click="settingsDialog = false" />
        </v-card-title>
        <v-card-text class="pa-6">
          <v-row dense>
            <!-- Logo Upload -->
            <v-col cols="12">
              <div class="text-subtitle-2 mb-2">{{ $t('rx.clinic_logo') }}</div>
              <div class="d-flex align-center gap-4">
                <v-avatar size="72" :color="rxPrintSettings.logo ? 'transparent' : 'primary'" rounded="lg" class="border">
                  <v-img v-if="rxPrintSettings.logo" :src="rxPrintSettings.logo" cover />
                  <v-icon v-else size="36" color="white">mdi-hospital-building</v-icon>
                </v-avatar>
                <div>
                  <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-upload" @click="triggerLogoUpload">
                    {{ $t('rx.upload_logo') }}
                  </v-btn>
                  <v-btn v-if="rxPrintSettings.logo" size="small" variant="text" color="error" class="ms-2" @click="rxPrintSettings.logo = ''">
                    {{ $t('common.delete') }}
                  </v-btn>
                  <input ref="logoInputRef" type="file" accept="image/*" hidden @change="onLogoUpload" />
                </div>
              </div>
            </v-col>

            <v-col cols="12" class="mt-4">
              <v-text-field v-model="rxPrintSettings.clinicName" :label="$t('rx.clinic_name')" variant="outlined" density="compact" prepend-inner-icon="mdi-hospital-building" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="rxPrintSettings.doctorName" :label="$t('rx.doctor_name')" variant="outlined" density="compact" prepend-inner-icon="mdi-doctor" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="rxPrintSettings.specialty" :label="$t('rx.specialty')" variant="outlined" density="compact" prepend-inner-icon="mdi-stethoscope" />
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="rxPrintSettings.address" :label="$t('rx.address')" variant="outlined" density="compact" prepend-inner-icon="mdi-map-marker" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="rxPrintSettings.phone" :label="$t('rx.phone')" variant="outlined" density="compact" prepend-inner-icon="mdi-phone" dir="ltr" />
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-subtitle-2 mb-2">{{ $t('rx.primary_color') }}</div>
              <div class="d-flex gap-2 flex-wrap">
                <v-avatar
                  v-for="color in colorOptions"
                  :key="color"
                  size="32"
                  :color="color"
                  class="cursor-pointer rx-page__color-swatch"
                  :class="{ 'rx-page__color-swatch--active': rxPrintSettings.primaryColor === color }"
                  @click="rxPrintSettings.primaryColor = color"
                >
                  <v-icon v-if="rxPrintSettings.primaryColor === color" color="white" size="16">mdi-check</v-icon>
                </v-avatar>
              </div>
            </v-col>
            <v-col cols="12">
              <v-textarea v-model="rxPrintSettings.disclaimer" :label="$t('rx.disclaimer_text')" variant="outlined" density="compact" rows="2" auto-grow prepend-inner-icon="mdi-text-box" />
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-btn variant="text" color="error" @click="resetPrintSettings">{{ $t('rx.reset_defaults') }}</v-btn>
          <v-spacer />
          <v-btn variant="text" @click="settingsDialog = false">{{ $t('common.cancel') }}</v-btn>
          <v-btn variant="elevated" color="primary" @click="savePrintSettings">{{ $t('common.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ═══════════ Delete Confirmation ═══════════ -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="text-h6 pa-4">
          <v-icon color="error" class="me-2">mdi-alert</v-icon>
          {{ $t('common.confirmDelete') }}
        </v-card-title>
        <v-card-text>{{ $t('rx.delete_confirmation') }}</v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">{{ $t('common.cancel') }}</v-btn>
          <v-btn color="error" variant="elevated" :loading="deleting" @click="deleteRecipe">{{ $t('common.delete') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ═══════════ Snackbar ═══════════ -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="bottom">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import RecipeService from '@/services/recipe.service'
import MedicationService from '@/services/medication.service'
import api from '@/services/api'
import { MedicationTable, MedicationForm, RxPreview } from '@/components/prescription'

const { t, locale } = useI18n()
const authStore = useAuthStore()

const SETTINGS_KEY = 'rx_print_settings'
const colorOptions = ['#17638D', '#1976d2', '#0d47a1', '#00695c', '#2e7d32', '#4527a0', '#37474f', '#000000']

// ─── State ───
const loading = ref(false)
const recipes = ref([])
const doctors = ref([])

// Filters
const search = ref('')
const selectedDoctor = ref(null)
const dateFrom = ref('')
const dateTo = ref('')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(15)
const totalItems = ref(0)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

// Dialogs
const rxDialog = ref(false)
const previewDialog = ref(false)
const settingsDialog = ref(false)
const deleteDialog = ref(false)

// Form
const rxFormRef = ref(null)
const formValid = ref(false)
const saving = ref(false)
const isEditing = ref(false)
const editingRecipeId = ref(null)

const defaultRxForm = () => ({
  patient: null,
  patientInfo: null,
  doctors_id: null,
  notes: '',
  recipe_items: []
})
const rxForm = ref(defaultRxForm())

// Medication edit state
const editingMedication = ref(null)
const editingMedIndex = ref(-1)

// Patient search
const patientSearch = ref('')
const patientOptions = ref([])
const searchingPatients = ref(false)

// Preview
const rxPreviewRef = ref(null)
const previewRecipe = ref(null)
const previewPrescription = computed(() => ({
  notes: previewRecipe.value?.notes || '',
  date: previewRecipe.value?.created_at || '',
  caseId: previewRecipe.value?.id
}))
const previewPatient = computed(() => ({
  name: previewRecipe.value?.patient?.name || '',
  age: previewRecipe.value?.patient?.age || '',
  gender: previewRecipe.value?.patient?.gender || '',
  phone: previewRecipe.value?.patient?.phone || ''
}))
const previewMedications = computed(() => {
  const items = previewRecipe.value?.recipe_items || previewRecipe.value?.recipeItems || []
  return Array.isArray(items) ? items : []
})

// Delete
const recipeToDelete = ref(null)
const deleting = ref(false)

// Print Settings
const rxPrintSettings = ref({
  logo: '',
  clinicName: '',
  doctorName: '',
  specialty: '',
  phone: '',
  address: '',
  primaryColor: '#17638D',
  disclaimer: ''
})
const logoInputRef = ref(null)

// Snackbar
const snackbar = ref({ show: false, message: '', color: 'success' })

// ─── Validation ───
const rules = { required: v => !!v || t('rx.field_required') }

const headers = computed(() => [
  { title: t('rx.patient'), key: 'patient', sortable: false },
  { title: t('rx.doctor'), key: 'doctor', sortable: false },
  { title: t('rx.medications'), key: 'medications', sortable: false, align: 'center' },
  { title: t('rx.notes'), key: 'notes', sortable: false },
  { title: t('rx.date'), key: 'created_at', sortable: true },
  { title: t('common.actions'), key: 'actions', sortable: false, align: 'center' }
])

// ─── Helpers ───
const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

const showSnackbar = (message, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

// ─── Data Fetching ───
const fetchRecipes = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      per_page: itemsPerPage.value,
      include: 'patient,doctor,recipeItems',
      sort: '-created_at'
    }
    if (search.value) params.search = search.value
    if (selectedDoctor.value) params['filter[doctors_id]'] = selectedDoctor.value
    if (dateFrom.value) params['filter[date_from]'] = dateFrom.value
    if (dateTo.value) params['filter[date_to]'] = dateTo.value

    const response = await RecipeService.getAll(params)
    recipes.value = response.data?.data || response.data || []
    totalItems.value = response.pagination?.total || response.meta?.total || recipes.value.length
  } catch {
    showSnackbar(t('rx.error_fetch'), 'error')
  } finally {
    loading.value = false
  }
}

const fetchDoctors = async () => {
  try {
    const response = await api.get('/doctors-active')
    doctors.value = response.data || response || []
  } catch { /* silent */ }
}

let searchTimeout = null
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { currentPage.value = 1; fetchRecipes() }, 500)
}

// Patient search
watch(patientSearch, (val) => {
  if (!val || val.length < 3) { patientOptions.value = []; return }
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    searchingPatients.value = true
    try {
      const res = await api.get('/patients', { params: { search: val, per_page: 10 } })
      patientOptions.value = res.data?.data || res.data || []
    } catch { /* silent */ }
    searchingPatients.value = false
  }, 400)
})

// ─── Create/Edit Dialog ───
const openAddDialog = () => {
  isEditing.value = false
  editingRecipeId.value = null
  rxForm.value = defaultRxForm()
  rxForm.value.doctors_id = authStore.user?.id || null
  editingMedication.value = null
  editingMedIndex.value = -1
  rxDialog.value = true
}

const editRecipe = async (recipe) => {
  isEditing.value = true
  editingRecipeId.value = recipe.id
  try {
    const response = await RecipeService.getById(recipe.id)
    const full = response.data?.data || response.data || response
    const items = full.recipe_items || full.recipeItems || []
    rxForm.value = {
      patient: null,
      patientInfo: full.patient,
      doctors_id: full.doctors_id || full.doctor?.id,
      notes: full.notes || '',
      recipe_items: items.map(i => ({
        medication_name: i.medication_name,
        dosage: i.dosage || '',
        form: i.form || '',
        frequency: i.frequency || '',
        duration: i.duration || '',
        instructions: i.instructions || ''
      }))
    }
  } catch {
    rxForm.value = {
      patient: null,
      patientInfo: recipe.patient,
      doctors_id: recipe.doctors_id || recipe.doctor?.id,
      notes: recipe.notes || '',
      recipe_items: (recipe.recipe_items || recipe.recipeItems || []).map(i => ({
        medication_name: i.medication_name,
        dosage: i.dosage || '',
        form: i.form || '',
        frequency: i.frequency || '',
        duration: i.duration || '',
        instructions: i.instructions || ''
      }))
    }
  }
  editingMedication.value = null
  editingMedIndex.value = -1
  rxDialog.value = true
}

const closeDialog = () => {
  rxDialog.value = false
  rxForm.value = defaultRxForm()
}

const handleSave = async () => {
  const { valid } = await rxFormRef.value.validate()
  if (!valid || !rxForm.value.recipe_items.length) return

  saving.value = true
  try {
    const payload = {
      patient_id: rxForm.value.patientInfo?.id || rxForm.value.patient?.id,
      doctors_id: rxForm.value.doctors_id,
      notes: rxForm.value.notes,
      recipe_items: rxForm.value.recipe_items.map(m => ({
        medication_name: m.medication_name,
        dosage: m.dosage,
        form: m.form,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions
      }))
    }

    if (isEditing.value && editingRecipeId.value) {
      await RecipeService.update(editingRecipeId.value, payload)
    } else {
      await RecipeService.create(payload)
    }

    // Silently save new medication names to library
    for (const item of rxForm.value.recipe_items) {
      if (item.medication_name) {
        try { await MedicationService.create(item.medication_name) } catch { /* ignore duplicates */ }
      }
    }

    showSnackbar(t('rx.saved_success'))
    closeDialog()
    await fetchRecipes()
  } catch (err) {
    showSnackbar(err.response?.data?.message || t('rx.error_save'), 'error')
  } finally {
    saving.value = false
  }
}

// ─── Medication CRUD ───
const addMedication = (med) => {
  rxForm.value.recipe_items.push({ ...med })
}

const updateMedication = (index, med) => {
  rxForm.value.recipe_items[index] = { ...med }
  editingMedication.value = null
  editingMedIndex.value = -1
}

const removeMedication = (index) => {
  rxForm.value.recipe_items.splice(index, 1)
}

const startMedEdit = (index) => {
  editingMedication.value = { ...rxForm.value.recipe_items[index] }
  editingMedIndex.value = index
}

const cancelMedEdit = () => {
  editingMedication.value = null
  editingMedIndex.value = -1
}

// ─── Preview & Print ───
const openPreview = async (recipe) => {
  try {
    const response = await RecipeService.getById(recipe.id)
    const full = response.data?.data || response.data || response
    if (!full.recipe_items && full.recipeItems) full.recipe_items = full.recipeItems
    previewRecipe.value = full
  } catch {
    previewRecipe.value = recipe
  }
  previewDialog.value = true
}

const directPrint = async (recipe) => {
  try {
    const response = await RecipeService.getById(recipe.id)
    const full = response.data?.data || response.data || response
    if (!full.recipe_items && full.recipeItems) full.recipe_items = full.recipeItems
    previewRecipe.value = full
  } catch {
    previewRecipe.value = recipe
  }
  previewDialog.value = true
  setTimeout(() => {
    rxPreviewRef.value?.printRx()
  }, 300)
}

// ─── Delete ───
const confirmDelete = (recipe) => {
  recipeToDelete.value = recipe
  deleteDialog.value = true
}

const deleteRecipe = async () => {
  if (!recipeToDelete.value) return
  deleting.value = true
  try {
    await RecipeService.delete(recipeToDelete.value.id)
    showSnackbar(t('rx.deleted_success'))
    deleteDialog.value = false
    await fetchRecipes()
  } catch {
    showSnackbar(t('rx.error_delete'), 'error')
  } finally {
    deleting.value = false
  }
}

// ─── Print Settings ───
const loadPrintSettings = () => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) Object.assign(rxPrintSettings.value, JSON.parse(stored))
  } catch { /* ignore */ }

  // Fill from clinic settings if empty
  try {
    const clinicStr = localStorage.getItem('clinic_settings') || localStorage.getItem('clinic')
    if (clinicStr) {
      const clinic = JSON.parse(clinicStr)
      if (!rxPrintSettings.value.clinicName) rxPrintSettings.value.clinicName = clinic.name || clinic.clinic_name || ''
      if (!rxPrintSettings.value.phone) rxPrintSettings.value.phone = clinic.phone || clinic.clinic_phone || ''
      if (!rxPrintSettings.value.address) rxPrintSettings.value.address = clinic.address || clinic.clinic_address || ''
    }
  } catch { /* ignore */ }
}

const openPrintSettings = () => { settingsDialog.value = true }

const savePrintSettings = () => {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(rxPrintSettings.value)) } catch { /* ignore */ }
  settingsDialog.value = false
}

const resetPrintSettings = () => {
  rxPrintSettings.value = {
    logo: '', clinicName: '', doctorName: '', specialty: '',
    phone: '', address: '', primaryColor: '#17638D', disclaimer: ''
  }
  localStorage.removeItem(SETTINGS_KEY)
}

const triggerLogoUpload = () => { logoInputRef.value?.click() }

const onLogoUpload = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    showSnackbar(t('rx.logo_too_large'), 'error')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => { rxPrintSettings.value.logo = e.target.result }
  reader.readAsDataURL(file)
}

// ─── Lifecycle ───
onMounted(() => {
  fetchRecipes()
  fetchDoctors()
  loadPrintSettings()
})
</script>

<style scoped>
.rx-page {
  max-width: 1400px;
  margin: 0 auto;
}

.rx-page__title {
  font-size: 1.6rem;
  font-weight: 800;
  color: rgb(var(--v-theme-primary));
  margin: 0;
}

.rx-page__subtitle {
  font-size: 0.85rem;
  color: #888;
  margin: 4px 0 0;
}

.rx-page__filters {
  border: 1px solid #eee;
}

.rx-page__list {
  border: 1px solid #eee;
}

.rx-page__mobile-card {
  transition: transform 0.15s, box-shadow 0.15s;
}
.rx-page__mobile-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08) !important;
}

.rx-page__dialog-header {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)), rgba(var(--v-theme-primary), 0.85));
}

.rx-page__color-swatch {
  cursor: pointer;
  transition: transform 0.15s;
}
.rx-page__color-swatch:hover {
  transform: scale(1.15);
}
.rx-page__color-swatch--active {
  outline: 3px solid currentColor;
  outline-offset: 2px;
}

.cursor-pointer { cursor: pointer; }
.border { border: 2px solid #e0e0e0 !important; }
</style>
