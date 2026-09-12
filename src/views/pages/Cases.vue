<template>
  <div class="cases-page">
    <!-- Page Header -->
    <div class="page-header mb-5 mobile-page-heading">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4">
        <div>
          <h1 class="text-h5 font-weight-bold text-primary">{{ $t('cases.title') }}</h1>
          <p class="text-body-2 text-grey mt-1">{{ $t('cases.subtitle') }}</p>
        </div>
      </div>
    </div>

    <!-- Filters Toolbar -->
    <v-card class="toolbar-card mb-4" elevation="1" rounded="lg">
      <v-card-text class="pa-3">
        <v-row align="center" dense>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              :placeholder="$t('common.search') || 'Search...'"
              @update:model-value="debouncedSearch"
            />
          </v-col>
          <v-col cols="6" md="2">
            <v-select
              v-model="filters.status_id"
              :label="$t('cases.status')"
              :items="statusOptions"
              item-title="text"
              item-value="value"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @update:model-value="loadCases"
            />
          </v-col>
          <v-col cols="6" md="2">
            <v-select
              v-model="filters.is_paid"
              :label="$t('cases.payment_status')"
              :items="paymentOptions"
              item-title="text"
              item-value="value"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @update:model-value="loadCases"
            />
          </v-col>
          <v-col cols="6" md="2">
            <v-select
              v-model="filters.case_categores_id"
              :label="$t('cases.category')"
              :items="categories"
              item-title="name"
              item-value="id"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @update:model-value="loadCases"
            />
          </v-col>
          <v-col cols="6" md="2">
            <v-select
              v-model="filters.doctor_id"
              :label="$t('cases.doctor')"
              :items="doctors"
              item-title="name"
              item-value="id"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @update:model-value="loadCases"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Cases Table -->
    <v-card elevation="1" rounded="lg">
      <v-progress-linear v-if="loading" indeterminate color="primary" height="2" />

      <v-alert v-if="error" type="error" variant="tonal" class="ma-3" closable @click:close="error = ''">
        {{ error }}
      </v-alert>

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
        hide-default-footer
        @update:page="onPageChange"
        @update:items-per-page="onPerPageChange"
        @click:row="(event, { item }) => openDrawer(item)"
      >
        <!-- Generic cell renderer for every config-driven column -->
        <template
          v-for="col in columns"
          :key="col.key"
          v-slot:[`item.${col.key}`]="{ item }"
        >
          <!-- Avatar (patient name + subtitle) -->
          <div v-if="col.type === 'avatar'" class="d-flex align-center ga-3 py-2">
            <v-avatar :color="getAvatarColor(cellValue(item, col))" size="42">
              <span class="text-white font-weight-bold">{{ getInitials(cellValue(item, col)) }}</span>
            </v-avatar>
            <div>
              <div class="font-weight-medium">{{ cellValue(item, col) }}</div>
              <div v-if="col.subtitleGetter" class="text-caption text-grey">{{ col.subtitleGetter(item) }}</div>
            </div>
          </div>

          <!-- Badge / Chip -->
          <v-chip
            v-else-if="col.type === 'badge' || col.type === 'chip'"
            :color="resolveColor(item, col)"
            size="small"
            :variant="col.type === 'chip' ? 'flat' : 'tonal'"
          >
            <v-icon v-if="resolveIcon(item, col)" start size="14">{{ resolveIcon(item, col) }}</v-icon>
            {{ cellValue(item, col) }}
          </v-chip>

          <!-- Currency -->
          <span v-else-if="col.type === 'currency'" class="font-weight-medium">
            {{ formatCurrency(cellValue(item, col), col.suffix) }}
          </span>

          <!-- Date -->
          <div v-else-if="col.type === 'date'" class="text-caption">
            {{ formatDate(cellValue(item, col)) }}
          </div>

          <!-- Icon + text (e.g. doctor) -->
          <div v-else-if="col.type === 'icon-text'" class="d-flex align-center ga-2">
            <v-icon v-if="resolveIcon(item, col)" size="16" :color="col.iconColor || 'primary'">{{ resolveIcon(item, col) }}</v-icon>
            <span>{{ cellValue(item, col) }}</span>
          </div>

          <!-- Plain text / truncate / fallback -->
          <span v-else>{{ cellValue(item, col) || '-' }}</span>
        </template>

        <!-- Actions -->
        <template v-slot:item.actions="{ item }">
          <div class="d-flex ga-1">
            <v-btn
              icon="mdi-eye"
              size="small"
              variant="text"
              color="info"
              @click.stop="openDrawer(item)"
            >
              <v-icon>mdi-eye</v-icon>
              <v-tooltip activator="parent" location="top">
                {{ $t('common.view') || 'View' }}
              </v-tooltip>
            </v-btn>
          </div>
        </template>

        <!-- Empty State -->
        <template v-slot:no-data>
          <div class="text-center py-12">
            <v-icon size="80" color="grey-lighten-2">mdi-folder-search-outline</v-icon>
            <h3 class="text-h6 mt-4 text-grey">{{ $t('cases.no_cases') }}</h3>
            <p class="text-grey-darken-1">{{ $t('cases.no_cases_desc') }}</p>
          </div>
        </template>

        <!-- Loading Skeleton -->
        <template v-slot:loading>
          <v-skeleton-loader type="table-row@10" />
        </template>
      </v-data-table-server>

      <!-- Numbered Pagination -->
      <v-divider />
      <div class="d-flex align-center justify-space-between pa-3 flex-wrap ga-3">
        <div class="text-caption text-grey">
          {{ $t('patients.showing') || 'Showing' }}
          {{ paginationInfo.from }}-{{ paginationInfo.to }}
          {{ $t('patients.of') || 'of' }}
          {{ paginationInfo.total }}
        </div>
        <v-pagination
          v-if="paginationInfo.lastPage > 1"
          v-model="currentPage"
          :length="paginationInfo.lastPage"
          :total-visible="5"
          density="compact"
          size="small"
          @update:model-value="onPageChange"
        />
        <v-select
          v-model="perPage"
          :items="[10, 15, 25, 50]"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 90px;"
          @update:model-value="onPerPageChange"
        />
      </div>
    </v-card>

    <!-- Case Detail Drawer -->
    <CaseDrawer
      v-model="drawerOpen"
      :case-data="selectedCase"
      :notes="selectedCaseNotes"
      @view-full="goToCase"
      @edit="goToCase"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { getSmartCaseColumns } from '@/config/specialties'
import CaseDrawer from '@/components/CaseDrawer.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// ==================== State ====================
const loading = ref(false)
const error = ref('')
const search = ref(route.query.search || '')
const cases = ref([])
const categories = ref([])
const doctors = ref([])
const currentPage = ref(Number(route.query.page) || 1)
const perPage = ref(Number(route.query.per_page) || 15)
const totalCases = ref(0)

// Drawer
const drawerOpen = ref(false)
const selectedCase = ref(null)
const selectedCaseNotes = ref([])

// Filters
const filters = reactive({
  status_id: route.query.status_id ? Number(route.query.status_id) : null,
  is_paid: route.query.is_paid !== undefined ? Number(route.query.is_paid) : null,
  case_categores_id: route.query.case_categores_id ? Number(route.query.case_categores_id) : null,
  doctor_id: route.query.doctor_id ? Number(route.query.doctor_id) : null,
})

function syncUrl() {
  const q = {}
  if (currentPage.value > 1) q.page = String(currentPage.value)
  if (perPage.value !== 15) q.per_page = String(perPage.value)
  if (search.value) q.search = search.value
  if (filters.status_id !== null) q.status_id = String(filters.status_id)
  if (filters.is_paid !== null) q.is_paid = String(filters.is_paid)
  if (filters.case_categores_id !== null) q.case_categores_id = String(filters.case_categores_id)
  if (filters.doctor_id !== null) q.doctor_id = String(filters.doctor_id)
  router.replace({ query: q })
}

// ==================== Computed ====================
const statusOptions = computed(() => [
  { text: t('cases.status_in_progress'), value: 2 },
  { text: t('cases.status_completed'), value: 3 },
])

const paymentOptions = computed(() => [
  { text: t('cases.paid'), value: 1 },
  { text: t('cases.unpaid'), value: 0 },
])

const columns = computed(() => getSmartCaseColumns(authStore.specialty, t))

// Vuetify data-table headers derived from the config-driven columns (+ actions)
const headers = computed(() => [
  ...columns.value.map(col => ({
    title: col.label,
    key: col.key,
    sortable: false,
    align: col.align || 'start',
    width: col.width,
    minWidth: col.minWidth,
  })),
  { title: t('common.actions') || 'Actions', key: 'actions', sortable: false, align: 'center' },
])

const paginationInfo = computed(() => ({
  from: totalCases.value === 0 ? 0 : (currentPage.value - 1) * perPage.value + 1,
  to: Math.min(currentPage.value * perPage.value, totalCases.value),
  total: totalCases.value,
  lastPage: Math.ceil(totalCases.value / perPage.value) || 1,
}))

// ==================== Cell helpers ====================
function cellValue(row, col) {
  if (col.getter) return col.getter(row)
  const key = col.key
  if (!key.includes('.')) return row[key]
  return key.split('.').reduce((obj, k) => obj?.[k], row)
}

function resolveColor(row, col) {
  if (col.type === 'badge' && col.colorMap) {
    const raw = col.rawValueGetter ? col.rawValueGetter(row) : cellValue(row, col)
    if (col.colorMap[raw]) return col.colorMap[raw]
  }
  return typeof col.color === 'function' ? col.color(row) : (col.color || (col.type === 'chip' ? 'primary' : 'grey'))
}

function resolveIcon(row, col) {
  return typeof col.icon === 'function' ? col.icon(row) : (col.icon || null)
}

function formatCurrency(val, suffix) {
  if (val === null || val === undefined || val === '') return '-'
  const formatted = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(val)
  return `${formatted} ${suffix || 'IQD'}`
}

function formatDate(val) {
  if (!val) return '-'
  return new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getAvatarColor(name) {
  const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info']
  if (!name) return 'grey'
  return colors[name.charCodeAt(0) % colors.length]
}

// ==================== Methods ====================
let searchTimeout = null
function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    syncUrl()
    loadCases()
  }, 500)
}

function onPageChange(page) {
  currentPage.value = page
  loadCases()
}

function onPerPageChange(val) {
  perPage.value = val
  currentPage.value = 1
  loadCases()
}

async function loadCases() {
  syncUrl()
  loading.value = true
  error.value = ''

  try {
    const params = {
      page: currentPage.value,
      per_page: perPage.value,
      include: 'patient,doctor,category,status,warehouseItems,ophthalmologyEncounterDetails',
    }

    if (search.value) params['filter[notes]'] = search.value
    if (filters.status_id !== null) params['filter[status_id]'] = filters.status_id
    if (filters.is_paid !== null) params['filter[is_paid]'] = filters.is_paid
    if (filters.case_categores_id !== null) params['filter[case_categores_id]'] = filters.case_categores_id
    if (filters.doctor_id !== null) params['filter[doctor_id]'] = filters.doctor_id
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

async function loadCategories() {
  try {
    const response = await api.get('/case-categories')
    if (response.success) categories.value = response.data || []
    else if (Array.isArray(response)) categories.value = response
    else if (response.data) categories.value = response.data
    else categories.value = []
  } catch (err) {
    console.error('Error loading categories:', err)
    categories.value = []
  }
}

async function loadDoctors() {
  try {
    const response = await api.get('/doctors')
    if (response.success) doctors.value = response.data || []
    else if (Array.isArray(response)) doctors.value = response
    else if (response.data) doctors.value = response.data
    else doctors.value = []
  } catch (err) {
    console.error('Error loading doctors:', err)
    doctors.value = []
  }
}

function goToCase(caseItem) {
  router.push(`/cases/${caseItem.id}`)
}

function openDrawer(caseItem) {
  selectedCase.value = caseItem
  selectedCaseNotes.value = []
  drawerOpen.value = true
  fetchCaseNotes(caseItem.id)
}

async function fetchCaseNotes(caseId) {
  try {
    const response = await api.get(`/notes/case/${caseId}`, { params: { include: 'creator' } })
    selectedCaseNotes.value = response.data?.data || response.data || []
  } catch (err) {
    console.error('Error fetching notes:', err)
    selectedCaseNotes.value = []
  }
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
  max-width: 1400px;
  margin: 0 auto;
}
.toolbar-card {
  background: #fff;
}
.cases-table {
  min-height: 400px;
}
.cases-table :deep(tbody tr) {
  cursor: pointer;
}
</style>
