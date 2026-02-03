<template>
  <v-container fluid class="recipes-page pa-4" style="font-family: 'Cairo', sans-serif;">
    <!-- Page Header -->
    <div class="page-header mb-4">
      <div class="d-flex align-center justify-space-between flex-wrap gap-3">
        <div>
          <h1 class="text-h4 text-md-h3 font-weight-bold text-primary">
            <v-icon start size="36">mdi-pill</v-icon>
            {{ $t('recipes.title') }}
          </h1>
          <p class="text-subtitle-1 text-grey mt-1">{{ $t('recipes.subtitle') }}</p>
        </div>
        <v-btn
          color="primary"
          size="large"
          prepend-icon="mdi-plus"
          elevation="2"
          @click="openAddDialog"
        >
          {{ $t('recipes.add_recipe') }}
        </v-btn>
      </div>
    </div>

    <!-- Filters Card -->
    <v-card class="mb-4" elevation="2" rounded="xl">
      <v-card-text class="pa-4">
        <v-row dense align="center">
          <!-- Search -->
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              :label="$t('recipes.search')"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @update:model-value="debouncedSearch"
            />
          </v-col>

          <!-- Doctor Filter -->
          <v-col cols="12" md="3">
            <v-select
              v-model="selectedDoctor"
              :items="doctors"
              :label="$t('recipes.filter_by_doctor')"
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

          <!-- Date Range -->
          <v-col cols="6" md="2">
            <v-text-field
              v-model="dateFrom"
              :label="$t('recipes.date_from')"
              type="date"
              variant="outlined"
              density="compact"
              hide-details
              @change="fetchRecipes"
            />
          </v-col>

          <v-col cols="6" md="2">
            <v-text-field
              v-model="dateTo"
              :label="$t('recipes.date_to')"
              type="date"
              variant="outlined"
              density="compact"
              hide-details
              @change="fetchRecipes"
            />
          </v-col>

          <!-- Refresh -->
          <v-col cols="12" md="1" class="d-flex justify-end">
            <v-btn
              icon="mdi-refresh"
              variant="tonal"
              :loading="loading"
              @click="fetchRecipes"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Recipes Table/Cards -->
    <v-card elevation="2" rounded="xl">
      <v-progress-linear v-if="loading" indeterminate color="primary" />

      <!-- Desktop Table View -->
      <v-data-table
        v-if="!$vuetify.display.mobile"
        :headers="headers"
        :items="recipes"
        :items-per-page="itemsPerPage"
        :loading="loading"
        class="elevation-0"
        density="comfortable"
      >
        <!-- Patient Column -->
        <template #item.patient="{ item }">
          <div class="d-flex align-center gap-2">
            <v-avatar size="36" color="primary">
              <span class="text-white text-caption">{{ getInitials(item.patient?.name) }}</span>
            </v-avatar>
            <div>
              <div class="font-weight-medium">{{ item.patient?.name || '-' }}</div>
              <div class="text-caption text-grey" dir="ltr">{{ item.patient?.phone }}</div>
            </div>
          </div>
        </template>

        <!-- Doctor Column -->
        <template #item.doctor="{ item }">
          <v-chip size="small" color="info" variant="tonal">
            <v-icon start size="14">mdi-doctor</v-icon>
            {{ item.doctor?.name || '-' }}
          </v-chip>
        </template>

        <!-- Medications Count -->
        <template #item.medications="{ item }">
          <v-chip size="small" color="primary" variant="flat">
            <v-icon start size="14">mdi-pill</v-icon>
            {{ item.recipe_items?.length || 0 }}
          </v-chip>
        </template>

        <!-- Notes -->
        <template #item.notes="{ item }">
          <div class="text-truncate" style="max-width: 200px;">
            {{ item.notes || '-' }}
          </div>
        </template>

        <!-- Date -->
        <template #item.created_at="{ item }">
          <div class="text-caption">
            <v-icon size="14" class="me-1">mdi-calendar</v-icon>
            {{ formatDate(item.created_at) }}
          </div>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <v-btn
              icon="mdi-eye"
              variant="text"
              size="small"
              color="info"
              @click="viewRecipe(item)"
            />
            <v-btn
              icon="mdi-printer"
              variant="text"
              size="small"
              color="success"
              @click="printRecipe(item)"
            />
            <v-btn
              icon="mdi-pencil"
              variant="text"
              size="small"
              color="primary"
              @click="editRecipe(item)"
            />
            <v-btn
              icon="mdi-delete"
              variant="text"
              size="small"
              color="error"
              @click="confirmDelete(item)"
            />
          </div>
        </template>

        <!-- Empty State -->
        <template #no-data>
          <div class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1">mdi-pill-off</v-icon>
            <p class="text-h6 text-grey mt-4">{{ $t('recipes.no_recipes') }}</p>
            <v-btn
              color="primary"
              variant="tonal"
              class="mt-4"
              prepend-icon="mdi-plus"
              @click="openAddDialog"
            >
              {{ $t('recipes.add_first_recipe') }}
            </v-btn>
          </div>
        </template>
      </v-data-table>

      <!-- Mobile Cards View -->
      <div v-else class="pa-4">
        <div v-if="recipes.length === 0 && !loading" class="text-center py-8">
          <v-icon size="64" color="grey-lighten-1">mdi-pill-off</v-icon>
          <p class="text-h6 text-grey mt-4">{{ $t('recipes.no_recipes') }}</p>
          <v-btn
            color="primary"
            variant="tonal"
            class="mt-4"
            prepend-icon="mdi-plus"
            @click="openAddDialog"
          >
            {{ $t('recipes.add_first_recipe') }}
          </v-btn>
        </div>

        <v-card
          v-for="recipe in recipes"
          :key="recipe.id"
          variant="outlined"
          class="mb-3 recipe-card"
          rounded="lg"
          @click="viewRecipe(recipe)"
        >
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="d-flex align-center gap-2">
                <v-avatar size="40" color="primary">
                  <span class="text-white">{{ getInitials(recipe.patient?.name) }}</span>
                </v-avatar>
                <div>
                  <div class="font-weight-medium">{{ recipe.patient?.name }}</div>
                  <div class="text-caption text-grey" dir="ltr">{{ recipe.patient?.phone }}</div>
                </div>
              </div>
              <v-chip size="small" color="primary" variant="flat">
                <v-icon start size="12">mdi-pill</v-icon>
                {{ recipe.recipe_items?.length || 0 }}
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

            <div v-if="recipe.notes" class="text-caption text-grey text-truncate">
              {{ recipe.notes }}
            </div>

            <v-divider class="my-3" />

            <div class="d-flex justify-end gap-2">
              <v-btn
                icon="mdi-printer"
                variant="tonal"
                size="small"
                color="success"
                @click.stop="printRecipe(recipe)"
              />
              <v-btn
                icon="mdi-pencil"
                variant="tonal"
                size="small"
                color="primary"
                @click.stop="editRecipe(recipe)"
              />
              <v-btn
                icon="mdi-delete"
                variant="tonal"
                size="small"
                color="error"
                @click.stop="confirmDelete(recipe)"
              />
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- Pagination -->
      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="5"
          size="small"
          @update:model-value="fetchRecipes"
        />
        <v-spacer />
      </v-card-actions>
    </v-card>

    <!-- Recipe Dialog -->
    <RecipeDialog
      v-model="recipeDialog"
      :doctors="doctors"
      :recipe="selectedRecipe"
      :default-doctor-id="defaultDoctorId"
      @saved="handleRecipeSaved"
      @error="handleRecipeError"
    />

    <!-- View Recipe Dialog -->
    <v-dialog v-model="viewDialog" max-width="700" scrollable>
      <v-card rounded="xl" v-if="selectedRecipe">
        <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary">
          <div class="d-flex align-center gap-2">
            <v-icon color="white">mdi-pill</v-icon>
            <span class="text-white">{{ $t('recipes.view_recipe') }}</span>
          </div>
          <div class="d-flex gap-1">
            <v-btn
              icon="mdi-printer"
              variant="text"
              color="white"
              @click="printRecipe(selectedRecipe)"
            />
            <v-btn
              icon="mdi-close"
              variant="text"
              color="white"
              @click="viewDialog = false"
            />
          </div>
        </v-card-title>

        <v-card-text class="pa-6">
          <!-- Patient & Doctor Info -->
          <v-row class="mb-4">
            <v-col cols="12" md="6">
              <div class="d-flex align-center gap-3">
                <v-avatar size="50" color="primary">
                  <span class="text-white">{{ getInitials(selectedRecipe.patient?.name) }}</span>
                </v-avatar>
                <div>
                  <div class="text-caption text-grey">{{ $t('recipes.patient') }}</div>
                  <div class="font-weight-bold">{{ selectedRecipe.patient?.name }}</div>
                  <div class="text-caption" dir="ltr">{{ selectedRecipe.patient?.phone }}</div>
                </div>
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="d-flex align-center gap-3">
                <v-avatar size="50" color="info">
                  <v-icon color="white">mdi-doctor</v-icon>
                </v-avatar>
                <div>
                  <div class="text-caption text-grey">{{ $t('recipes.doctor') }}</div>
                  <div class="font-weight-bold">{{ selectedRecipe.doctor?.name }}</div>
                  <div class="text-caption">{{ formatDate(selectedRecipe.created_at) }}</div>
                </div>
              </div>
            </v-col>
          </v-row>

          <!-- Notes -->
          <v-alert
            v-if="selectedRecipe.notes"
            type="info"
            variant="tonal"
            class="mb-4"
          >
            <div class="text-caption text-grey mb-1">{{ $t('recipes.prescription_notes') }}</div>
            {{ selectedRecipe.notes }}
          </v-alert>

          <!-- Medications -->
          <h4 class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center gap-2">
            <v-icon color="primary">mdi-pill</v-icon>
            {{ $t('recipes.medications') }}
          </h4>

          <v-table density="compact" class="rounded-lg">
            <thead>
              <tr>
                <th>#</th>
                <th>{{ $t('recipes.medication_name') }}</th>
                <th>{{ $t('recipes.dosage') }}</th>
                <th>{{ $t('recipes.frequency') }}</th>
                <th>{{ $t('recipes.duration') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in selectedRecipe.recipe_items" :key="item.id">
                <td>{{ index + 1 }}</td>
                <td class="font-weight-medium">{{ item.medication_name }}</td>
                <td>{{ item.dosage }}</td>
                <td>{{ item.frequency }}</td>
                <td>{{ item.duration }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="viewDialog = false">
            {{ $t('common.close') }}
          </v-btn>
          <v-btn color="success" variant="elevated" prepend-icon="mdi-printer" @click="printRecipe(selectedRecipe)">
            {{ $t('recipes.print') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="text-h6 pa-4">
          <v-icon color="error" class="me-2">mdi-alert</v-icon>
          {{ $t('common.confirmDelete') }}
        </v-card-title>
        <v-card-text>
          {{ $t('recipes.delete_confirmation') }}
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn color="error" variant="elevated" :loading="deleting" @click="deleteRecipe">
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Print Component (Hidden) -->
    <RecipePrint
      ref="recipePrintRef"
      :recipe="recipeToPrint"
      :clinic-settings="clinicSettings"
    />

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="bottom"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import RecipeService from '@/services/recipe.service'
import RecipeDialog from '@/components/RecipeDialog.vue'
import RecipePrint from '@/components/RecipePrint.vue'
import api from '@/services/api'

const { t, locale } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

// State
const loading = ref(false)
const recipes = ref([])
const doctors = ref([])
const clinicSettings = ref(null)

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
const recipeDialog = ref(false)
const viewDialog = ref(false)
const deleteDialog = ref(false)
const selectedRecipe = ref(null)
const recipeToDelete = ref(null)
const deleting = ref(false)

// Print
const recipePrintRef = ref(null)
const recipeToPrint = ref(null)

// Snackbar
const snackbar = ref({ show: false, message: '', color: 'success' })

// Computed
const defaultDoctorId = computed(() => authStore.user?.id)

const headers = computed(() => [
  { title: t('recipes.patient'), key: 'patient', sortable: false },
  { title: t('recipes.doctor'), key: 'doctor', sortable: false },
  { title: t('recipes.medications'), key: 'medications', sortable: false, align: 'center' },
  { title: t('recipes.notes'), key: 'notes', sortable: false },
  { title: t('recipes.date'), key: 'created_at', sortable: true },
  { title: t('common.actions'), key: 'actions', sortable: false, align: 'center' }
])

// Methods
const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const fetchRecipes = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      per_page: itemsPerPage.value,
      include: 'patient,doctor,recipeItems',
      sort: '-created_at'
    }

    if (search.value) {
      params.search = search.value
    }
    if (selectedDoctor.value) {
      params['filter[doctors_id]'] = selectedDoctor.value
    }
    if (dateFrom.value) {
      params['filter[date_from]'] = dateFrom.value
    }
    if (dateTo.value) {
      params['filter[date_to]'] = dateTo.value
    }

    const response = await RecipeService.getAll(params)
    recipes.value = response.data?.data || response.data || []
    totalItems.value = response.pagination?.total || response.meta?.total || recipes.value.length
  } catch (error) {
    console.error('Error fetching recipes:', error)
    showSnackbar(t('errors.fetchFailed'), 'error')
  } finally {
    loading.value = false
  }
}

const fetchDoctors = async () => {
  try {
    const response = await api.get('/doctors-active')
    doctors.value = response.data || response || []
  } catch (error) {
    console.error('Error fetching doctors:', error)
  }
}

const fetchClinicSettings = async () => {
  try {
    // Try to get clinic settings from localStorage first
    const storedClinic = localStorage.getItem('clinic')
    if (storedClinic) {
      clinicSettings.value = JSON.parse(storedClinic)
      return
    }

    // Fallback: fetch from API
    const response = await api.get('/settings/clinic')
    clinicSettings.value = response.data || response || null
  } catch (error) {
    console.error('Error fetching clinic settings:', error)
    // Use default settings
    clinicSettings.value = {
      name: 'Smart Clinic',
      address: '',
      phone: '',
      logo: null
    }
  }
}

let searchTimeout = null
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchRecipes()
  }, 500)
}

const openAddDialog = () => {
  selectedRecipe.value = null
  recipeDialog.value = true
}

const editRecipe = (recipe) => {
  selectedRecipe.value = { ...recipe }
  recipeDialog.value = true
}

const viewRecipe = (recipe) => {
  selectedRecipe.value = recipe
  viewDialog.value = true
}

const confirmDelete = (recipe) => {
  recipeToDelete.value = recipe
  deleteDialog.value = true
}

const deleteRecipe = async () => {
  if (!recipeToDelete.value) return

  try {
    deleting.value = true
    await RecipeService.delete(recipeToDelete.value.id)
    showSnackbar(t('recipes.deleted_success'), 'success')
    deleteDialog.value = false
    await fetchRecipes()
  } catch (error) {
    console.error('Error deleting recipe:', error)
    showSnackbar(t('errors.deleteFailed'), 'error')
  } finally {
    deleting.value = false
  }
}

const printRecipe = (recipe) => {
  recipeToPrint.value = recipe
  // Wait for component to update, then print
  setTimeout(() => {
    if (recipePrintRef.value) {
      recipePrintRef.value.print()
    }
  }, 100)
}

const handleRecipeSaved = (recipe) => {
  showSnackbar(t('recipes.saved_success'), 'success')
  fetchRecipes()
}

const handleRecipeError = (error) => {
  showSnackbar(error.response?.data?.message || t('errors.saveFailed'), 'error')
}

const showSnackbar = (message, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

// Lifecycle
onMounted(() => {
  fetchRecipes()
  fetchDoctors()
  fetchClinicSettings()
})
</script>

<style scoped>
.recipes-page {
  max-width: 1400px;
  margin: 0 auto;
}

.recipe-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.recipe-card:hover {
  border-color: rgb(var(--v-theme-primary));
  transform: translateY(-2px);
}
</style>
