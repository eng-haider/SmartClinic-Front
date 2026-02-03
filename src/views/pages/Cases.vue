<template>
  <div class="cases-page">
    <!-- Page Header -->
    <div class="page-header mb-6">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4">
        <div>
          <h1 class="text-h4 font-weight-bold text-primary">{{ $t('cases.title') }}</h1>
          <p class="text-grey mt-1">{{ $t('cases.subtitle') }}</p>
        </div>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <v-card class="toolbar-card mb-6" elevation="2" rounded="xl">
      <v-card-text>
        <v-row align="center">
          <!-- Search -->
          <v-col cols="12" md="3">
            <v-text-field
              v-model="search"
              :label="''"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              @update:model-value="debouncedSearch"
            />
          </v-col>

          <!-- Status Filter -->
          <v-col cols="6" md="2">
            <v-select
              v-model="filters.status_id"
              :label="$t('cases.status')"
              :items="statusOptions"
              item-title="text"
              item-value="value"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              @update:model-value="loadCases"
            />
          </v-col>

          <!-- Payment Filter -->
          <v-col cols="6" md="2">
            <v-select
              v-model="filters.is_paid"
              :label="$t('cases.payment_status')"
              :items="paymentOptions"
              item-title="text"
              item-value="value"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              @update:model-value="loadCases"
            />
          </v-col>

          <!-- Category Filter -->
          <v-col cols="6" md="2">
            <v-select
              v-model="filters.case_categores_id"
              :label="$t('cases.category')"
              :items="categories"
              item-title="name"
              item-value="id"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              @update:model-value="loadCases"
            />
          </v-col>

          <!-- Doctor Filter -->
          <v-col cols="6" md="2">
            <v-select
              v-model="filters.doctor_id"
              :label="$t('cases.doctor')"
              :items="doctors"
              item-title="name"
              item-value="id"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              @update:model-value="loadCases"
            />
          </v-col>

    

       
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Cases Table -->
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
        :items="cases"
        :items-length="totalCases"
        :loading="loading"
        class="cases-table"
        density="compact"
        mobile-breakpoint="md"
        hover
        @update:page="loadCases"
        @update:items-per-page="loadCases"
        @click:row="(event, { item }) => goToCase(item)"
      >
        <!-- Patient Name -->
        <template v-slot:item.patient="{ item }">
          <div class="d-flex align-center ga-3 py-2">
            <v-avatar :color="getAvatarColor(item.patient?.name)" size="38">
              <span class="text-white font-weight-bold text-caption">{{ getInitials(item.patient?.name) }}</span>
            </v-avatar>
            <div>
              <div class="font-weight-medium">{{ item.patient?.name || '-' }}</div>
              <div class="text-caption text-grey">ID: {{ item.patient?.id || '-' }}</div>
            </div>
          </div>
        </template>

        <!-- Category -->
        <template v-slot:item.category="{ item }">
          <v-chip
            :color="getCategoryColor(item.category?.id)"
            size="small"
            variant="tonal"
          >
            {{ item.category?.name || '-' }}
          </v-chip>
        </template>

        <!-- Tooth Number -->
        <template v-slot:item.tooth_num="{ item }">
          <v-chip
            v-if="item.tooth_num"
            color="info"
            size="small"
            variant="flat"
          >
            <v-icon start size="14">mdi-tooth</v-icon>
            {{ item.tooth_num }}
          </v-chip>
          <span v-else class="text-grey">-</span>
        </template>

        <!-- Price -->
        <template v-slot:item.price="{ item }">
          <span class="font-weight-medium">{{ formatCurrency(item.price) }}</span>
        </template>

        <!-- Payment Status -->
        <template v-slot:item.is_paid="{ item }">
          <v-chip
            :color="item.is_paid ? 'success' : 'warning'"
            size="small"
            variant="flat"
          >
            <v-icon start size="14">{{ item.is_paid ? 'mdi-check-circle' : 'mdi-clock-outline' }}</v-icon>
            {{ item.is_paid ? $t('cases.paid') : $t('cases.unpaid') }}
          </v-chip>
        </template>

        <!-- Status -->
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status?.id)"
            size="small"
            variant="tonal"
          >
            {{ getStatusName(item.status) }}
          </v-chip>
        </template>

        <!-- Doctor -->
        <template v-slot:item.doctor="{ item }">
          <div class="d-flex align-center ga-2">
            <v-icon size="small" color="primary">mdi-doctor</v-icon>
            <span>{{ item.doctor?.name || '-' }}</span>
          </div>
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
              @click.stop="viewCase(item)"
            />
          </div>
        </template>

        <!-- Empty State -->
        <template v-slot:no-data>
          <div class="text-center py-12">
            <v-icon size="80" color="grey-lighten-2">mdi-folder-search</v-icon>
            <h3 class="text-h6 mt-4 text-grey">{{ $t('cases.no_cases') }}</h3>
            <p class="text-grey-darken-1">{{ $t('cases.no_cases_desc') }}</p>
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
          {{ $t('cases.showing') }} {{ paginationInfo.from }}-{{ paginationInfo.to }} 
          {{ $t('cases.of') }} {{ paginationInfo.total }} {{ $t('cases.cases') }}
        </div>
      </div>
    </v-card>

    <!-- View Case Dialog -->
    <v-dialog v-model="viewDialog" max-width="600" scrollable>
      <v-card rounded="xl" v-if="selectedCase">
        <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary">
          <span class="text-white">{{ $t('cases.case_details') }}</span>
          <v-btn icon="mdi-close" variant="text" color="white" @click="viewDialog = false" />
        </v-card-title>

        <v-card-text class="pa-6">
          <v-row>
            <!-- Patient -->
            <v-col cols="12">
              <div class="info-item">
                <v-icon color="primary" size="20">mdi-account</v-icon>
                <div>
                  <div class="text-caption text-grey">{{ $t('cases.patient') }}</div>
                  <div class="font-weight-medium">{{ selectedCase.patient?.name || '-' }}</div>
                </div>
              </div>
            </v-col>

            <!-- Category -->
            <v-col cols="6">
              <div class="info-item">
                <v-icon color="grey" size="20">mdi-folder</v-icon>
                <div>
                  <div class="text-caption text-grey">{{ $t('cases.category') }}</div>
                  <div class="font-weight-medium">{{ selectedCase.category?.name || '-' }}</div>
                </div>
              </div>
            </v-col>

            <!-- Tooth Number -->
            <v-col cols="6">
              <div class="info-item">
                <v-icon color="grey" size="20">mdi-tooth</v-icon>
                <div>
                  <div class="text-caption text-grey">{{ $t('cases.tooth_num') }}</div>
                  <div class="font-weight-medium">{{ selectedCase.tooth_num || '-' }}</div>
                </div>
              </div>
            </v-col>

            <!-- Price -->
            <v-col cols="6">
              <div class="info-item">
                <v-icon color="grey" size="20">mdi-currency-usd</v-icon>
                <div>
                  <div class="text-caption text-grey">{{ $t('cases.price') }}</div>
                  <div class="font-weight-medium">{{ formatCurrency(selectedCase.price) }}</div>
                </div>
              </div>
            </v-col>

            <!-- Payment Status -->
            <v-col cols="6">
              <div class="info-item">
                <v-icon :color="selectedCase.is_paid ? 'success' : 'warning'" size="20">
                  {{ selectedCase.is_paid ? 'mdi-check-circle' : 'mdi-clock-outline' }}
                </v-icon>
                <div>
                  <div class="text-caption text-grey">{{ $t('cases.payment_status') }}</div>
                  <div class="font-weight-medium">
                    {{ selectedCase.is_paid ? $t('cases.paid') : $t('cases.unpaid') }}
                  </div>
                </div>
              </div>
            </v-col>

            <!-- Doctor -->
            <v-col cols="6">
              <div class="info-item">
                <v-icon color="grey" size="20">mdi-doctor</v-icon>
                <div>
                  <div class="text-caption text-grey">{{ $t('cases.doctor') }}</div>
                  <div class="font-weight-medium">{{ selectedCase.doctor?.name || '-' }}</div>
                </div>
              </div>
            </v-col>

            <!-- Status -->
            <v-col cols="6">
              <div class="info-item">
                <v-icon color="grey" size="20">mdi-flag</v-icon>
                <div>
                  <div class="text-caption text-grey">{{ $t('cases.status') }}</div>
                  <div class="font-weight-medium">{{ getStatusName(selectedCase.status) }}</div>
                </div>
              </div>
            </v-col>

            <!-- Notes -->
            <v-col cols="12" v-if="selectedCase.notes">
              <div class="info-item">
                <v-icon color="grey" size="20">mdi-note-text</v-icon>
                <div>
                  <div class="text-caption text-grey">{{ $t('cases.notes') }}</div>
                  <div class="font-weight-medium">{{ selectedCase.notes }}</div>
                </div>
              </div>
            </v-col>

            <!-- Created Date -->
            <v-col cols="12">
              <div class="info-item">
                <v-icon color="grey" size="20">mdi-calendar</v-icon>
                <div>
                  <div class="text-caption text-grey">{{ $t('cases.created_at') }}</div>
                  <div class="font-weight-medium">{{ formatDate(selectedCase.created_at) }}</div>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="viewDialog = false">
            {{ $t('common.close') }}
          </v-btn>
          <v-btn color="primary" variant="flat" @click="goToCase(selectedCase)">
            {{ $t('cases.view_full') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
const error = ref('')
const search = ref('')
const cases = ref([])
const categories = ref([])
const doctors = ref([])
const currentPage = ref(1)
const perPage = ref(15)
const totalCases = ref(0)

// Dialogs
const viewDialog = ref(false)
const selectedCase = ref(null)

// Filters
const filters = reactive({
  status_id: null,
  is_paid: null,
  case_categores_id: null,
  doctor_id: null,
})

// ==================== Computed ====================
const statusOptions = computed(() => [

  { text: t('cases.status_in_progress'), value: 2 },
  { text: t('cases.status_completed'), value: 3 },

])

const paymentOptions = computed(() => [
  { text: t('cases.paid'), value: 1 },
  { text: t('cases.unpaid'), value: 0 },
])

const headers = computed(() => [
  { title: t('cases.patient'), key: 'patient', sortable: false },
  { title: t('cases.category'), key: 'category', sortable: false },
  { title: t('cases.tooth_num'), key: 'tooth_num', sortable: true },
  { title: t('cases.price'), key: 'price', sortable: true },
  { title: t('cases.payment_status'), key: 'is_paid', sortable: true },
  { title: t('cases.status'), key: 'status', sortable: false },
  { title: t('cases.doctor'), key: 'doctor', sortable: false },
  { title: t('cases.created_at'), key: 'created_at', sortable: true },
  { title: t('cases.actions'), key: 'actions', sortable: false, align: 'center' },
])

const paginationInfo = computed(() => ({
  from: ((currentPage.value - 1) * perPage.value) + 1,
  to: Math.min(currentPage.value * perPage.value, totalCases.value),
  total: totalCases.value
}))

// ==================== Methods ====================
let searchTimeout = null
function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadCases()
  }, 500)
}

// Load Cases
async function loadCases() {
  loading.value = true
  error.value = ''

  try {
    const params = {
      page: currentPage.value,
      per_page: perPage.value,
      include: 'patient,doctor,category,status',
    }

    // Add search filter
    if (search.value) {
      params['filter[notes]'] = search.value
    }

    // Add status filter
    if (filters.status_id !== null) {
      params['filter[status_id]'] = filters.status_id
    }

    // Add payment filter
    if (filters.is_paid !== null) {
      params['filter[is_paid]'] = filters.is_paid
    }

    // Add category filter
    if (filters.case_categores_id !== null) {
      params['filter[case_categores_id]'] = filters.case_categores_id
    }

    // Add doctor filter
    if (filters.doctor_id !== null) {
      params['filter[doctor_id]'] = filters.doctor_id
    }

    // Sort by created_at descending
    params.sort = '-created_at'

    const response = await api.get('/cases', { params })
    
    if (response.success) {
      cases.value = response.data
      totalCases.value = response.pagination?.total || 0
    } else {
      throw new Error(response.message || 'Failed to load cases')
    }
  } catch (err) {
    console.error('Error loading cases:', err)
    error.value = err.response?.data?.message || err.message || t('cases.error_loading')
  } finally {
    loading.value = false
  }
}

// Load Categories
async function loadCategories() {
  try {
    const response = await api.get('/case-categories')
    // Handle different response formats
    if (response.success) {
      categories.value = response.data || []
    } else if (Array.isArray(response)) {
      categories.value = response
    } else if (response.data) {
      categories.value = response.data
    } else {
      categories.value = []
    }
  } catch (err) {
    console.error('Error loading categories:', err)
    categories.value = []
  }
}

// Load Doctors
async function loadDoctors() {
  try {
    const response = await api.get('/doctors')
    // Handle different response formats
    if (response.success) {
      doctors.value = response.data || []
    } else if (Array.isArray(response)) {
      doctors.value = response
    } else if (response.data) {
      doctors.value = response.data
    } else {
      doctors.value = []
    }
  } catch (err) {
    console.error('Error loading doctors:', err)
    doctors.value = []
  }
}

// Go to Case Detail
function goToCase(caseItem) {
  router.push(`/cases/${caseItem.id}`)
}

// View Case in Dialog
function viewCase(caseItem) {
  selectedCase.value = caseItem
  viewDialog.value = true
}

// ==================== Helpers ====================
function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getAvatarColor(name) {
  if (!name) return 'grey'
  const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info']
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

function getCategoryColor(id) {
  const colors = ['primary', 'secondary', 'success', 'warning', 'info', 'error']
  return colors[(id || 0) % colors.length]
}

function getStatusColor(id) {
  const statusColors = {
    1: 'warning',    // Pending
    2: 'info',       // In Progress
    3: 'success',    // Completed
    4: 'error',      // Cancelled
  }
  return statusColors[id] || 'grey'
}

function getStatusName(status) {
  if (!status) return '-'
  // Check current locale and return appropriate name
  const locale = localStorage.getItem('locale') || 'ar'
  
  if (locale === 'ar') {
    return status.name_ar || status.name || '-'
  } else if (locale === 'en') {
    return status.name_en || status.name || '-'
  } else if (locale === 'ku') {
    return status.name_ku || status.name_en || status.name || '-'
  }
  
  return status.name || '-'
}

function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// ==================== Lifecycle ====================
onMounted(() => {
  loadCases()
  loadCategories()
  loadDoctors()
})
</script>

<style scoped>
.cases-page {
  padding: 24px;
}

.toolbar-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
}

.cases-table {
  min-height: 400px;
}

.cases-table :deep(tbody tr) {
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
[dir="rtl"] .cases-page {
  text-align: right;
}

/* Responsive */
@media (max-width: 960px) {
  .cases-page {
    padding: 16px;
  }
}
</style>
