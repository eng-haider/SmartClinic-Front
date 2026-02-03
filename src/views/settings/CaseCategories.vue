<template>
  <v-container fluid class="pa-6">
    <!-- Header with Add Button -->
    <v-row class="mb-4">
      <v-col cols="12" md="8">
        <h2 class="text-h5">{{ $t('caseCategories.title') }}</h2>
        <p class="text-body-2 text-medium-emphasis">
          {{ $t('caseCategories.subtitle') }}
        </p>
      </v-col>
      <v-col cols="12" md="4" class="text-end">
        <v-btn
          v-permission="PERMISSIONS.CREATE_CASE"
          color="primary"
          prepend-icon="mdi-plus"
          @click="openCreateDialog"
        >
          {{ $t('caseCategories.addCategory') }}
        </v-btn>
      </v-col>
    </v-row>

    <!-- Search and Filters -->
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          :label="$t('common.search')"
          variant="outlined"
          density="compact"
          clearable
          @input="debouncedSearch"
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="sortBy"
          :items="sortOptions"
          :label="$t('common.sortBy')"
          variant="outlined"
          density="compact"
          @update:modelValue="loadCategories"
        ></v-select>
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="itemsPerPage"
          :items="[10, 15, 20, 50]"
          :label="$t('common.itemsPerPage')"
          variant="outlined"
          density="compact"
          @update:modelValue="loadCategories"
        ></v-select>
      </v-col>
    </v-row>

    <!-- Data Table -->
    <v-card>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="categories"
          :loading="loading"
          :items-per-page="itemsPerPage"
          hide-default-footer
          density="compact"
          mobile-breakpoint="md"
        >
          <!-- Item Cost Column -->
          <template v-slot:item.item_cost="{ item }">
            <v-chip color="success" size="small">
              {{ formatCurrency(item.item_cost) }}
            </v-chip>
          </template>

          <!-- Actions Column -->
          <template v-slot:item.actions="{ item }">
            <v-btn
              v-permission="PERMISSIONS.EDIT_CASE"
              icon
              size="small"
              variant="text"
              @click="openEditDialog(item)"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn
              v-permission="PERMISSIONS.DELETE_CASE"
              icon
              size="small"
              variant="text"
              color="error"
              @click="confirmDelete(item)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>

          <!-- Loading -->
          <template v-slot:loading>
            <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
          </template>

          <!-- No Data -->
          <template v-slot:no-data>
            <v-alert type="info" variant="tonal" class="my-4">
              {{ $t('common.noData') }}
            </v-alert>
          </template>
        </v-data-table>
      </v-card-text>

      <!-- Pagination -->
      <v-card-actions v-if="totalPages > 1">
        <v-spacer></v-spacer>
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="7"
          @update:modelValue="loadCategories"
        ></v-pagination>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600px" persistent>
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white">
          {{ isEditing ? $t('caseCategories.editCategory') : $t('caseCategories.addCategory') }}
        </v-card-title>

        <v-card-text class="pt-4">
          <v-form ref="form" v-model="formValid">
            <v-text-field
              v-model="formData.name"
              :label="$t('caseCategories.categoryName')"
              :rules="[rules.required]"
              variant="outlined"
              prepend-inner-icon="mdi-tag"
              class="mb-3"
            ></v-text-field>

            <v-text-field
              v-model.number="formData.order"
              :label="$t('caseCategories.displayOrder')"
              type="number"
              :rules="[rules.required, rules.minValue(0)]"
              variant="outlined"
              prepend-inner-icon="mdi-order-numeric-ascending"
              class="mb-3"
            ></v-text-field>

            <v-text-field
              v-model.number="formData.item_cost"
              :label="$t('caseCategories.defaultCost')"
              type="number"
              :rules="[rules.minValue(0)]"
              variant="outlined"
              prepend-inner-icon="mdi-currency-usd"
              suffix="IQD"
              class="mb-3"
            ></v-text-field>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="closeDialog"
          >
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="saving"
            :disabled="!formValid"
            @click="saveCategory"
          >
            {{ $t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">
          {{ $t('common.confirmDelete') }}
        </v-card-title>
        <v-card-text>
          {{ $t('caseCategories.deleteConfirmation', { name: categoryToDelete?.name }) }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="deleteDialog = false"
          >
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :loading="deleting"
            @click="deleteCategory"
          >
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="3000"
    >
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar = false"
        >
          {{ $t('common.close') }}
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/authNew'
import { PERMISSIONS } from '@/constants/permissions'
import {
  getCaseCategories,
  createCaseCategory,
  updateCaseCategory,
  deleteCaseCategory
} from '@/services/caseCategory.service'

const { t } = useI18n()
const authStore = useAuthStore()

// State
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const categories = ref([])
const search = ref('')
const sortBy = ref('order')
const itemsPerPage = ref(15)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)

// Dialog state
const dialog = ref(false)
const deleteDialog = ref(false)
const formValid = ref(false)
const isEditing = ref(false)
const categoryToDelete = ref(null)

// Form data
const formData = ref({
  name: '',
  order: 0,
  clinic_id: null,
  item_cost: 0
})

// Snackbar
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Form validation rules
const rules = {
  required: (value) => !!value || t('validation.required'),
  minValue: (min) => (value) => (value >= min) || t('validation.minValue', { min })
}

// Sort options
const sortOptions = computed(() => [
  { title: t('caseCategories.sortByOrder'), value: 'order' },
  { title: t('caseCategories.sortByName'), value: 'name' },
  { title: t('caseCategories.sortByNewest'), value: '-created_at' },
  { title: t('caseCategories.sortByOldest'), value: 'created_at' }
])

// Table headers
const headers = computed(() => [
  { title: t('caseCategories.categoryName'), key: 'name', align: 'start' },
  { title: t('caseCategories.displayOrder'), key: 'order', align: 'center' },
  { title: t('caseCategories.defaultCost'), key: 'item_cost', align: 'center' },
  { title: t('common.actions'), key: 'actions', align: 'center', sortable: false }
])

// Methods
const loadCategories = async () => {
  loading.value = true
  try {
    const params = {
      per_page: itemsPerPage.value,
      page: currentPage.value,
      sort: sortBy.value
    }

    if (search.value) {
      params.search = search.value
    }

    console.log('📡 Fetching case categories with params:', params)
    const response = await getCaseCategories(params)
    console.log('✅ API Response:', response)
    
    if (response.success) {
      categories.value = response.data
      if (response.pagination) {
        totalPages.value = response.pagination.last_page
        totalItems.value = response.pagination.total
      }
      console.log('✅ Categories loaded:', categories.value.length, 'items')
    }
  } catch (error) {
    console.error('❌ Error loading categories:', error)
    showSnackbar(t('errors.fetchFailed'), 'error')
  } finally {
    loading.value = false
  }
}

let searchTimeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadCategories()
  }, 500)
}

const openCreateDialog = () => {
  isEditing.value = false
  formData.value = {
    name: '',
    order: categories.value.length + 1,
    clinic_id: authStore.user?.clinic_id || null,
    item_cost: 0
  }
  dialog.value = true
}

const openEditDialog = (category) => {
  isEditing.value = true
  formData.value = { ...category }
  dialog.value = true
}

const closeDialog = () => {
  dialog.value = false
  formData.value = {
    name: '',
    order: 0,
    clinic_id: null,
    item_cost: 0
  }
}

const saveCategory = async () => {
  saving.value = true
  try {
    let response

    if (isEditing.value) {
      response = await updateCaseCategory(formData.value.id, formData.value)
    } else {
      response = await createCaseCategory(formData.value)
    }

    if (response.success) {
      showSnackbar(
        isEditing.value 
          ? t('messages.categoryUpdated') 
          : t('messages.categoryCreated'),
        'success'
      )
      closeDialog()
      loadCategories()
    }
  } catch (error) {
    showSnackbar(t('errors.saveFailed'), 'error')
  } finally {
    saving.value = false
  }
}

const confirmDelete = (category) => {
  categoryToDelete.value = category
  deleteDialog.value = true
}

const deleteCategory = async () => {
  deleting.value = true
  try {
    const response = await deleteCaseCategory(categoryToDelete.value.id)
    
    if (response.success) {
      showSnackbar(t('messages.categoryDeleted'), 'success')
      deleteDialog.value = false
      categoryToDelete.value = null
      loadCategories()
    }
  } catch (error) {
    showSnackbar(t('errors.deleteFailed'), 'error')
  } finally {
    deleting.value = false
  }
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IQ', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0
  }).format(amount)
}

const showSnackbar = (text, color = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

// Lifecycle
onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
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
</style>
