<template>
  <div class="cases-page">
    <!-- Page Header -->
    <div class="page-header mb-5">
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

      <SmartTable
        :columns="columns"
        :items="cases"
        :actions="tableActions"
        :loading="loading"
        :pagination="pagination"
        :empty-text="$t('cases.no_cases')"
        :empty-subtext="$t('cases.no_cases_desc')"
        empty-icon="mdi-folder-search-outline"
        :actions-label="$t('common.actions') || ''"
        server-sort
        @click:row="openDrawer"
        @action="handleAction"
        @update:page="onPageChange"
        @update:per-page="onPerPageChange"
      />
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
import SmartTable from '@/components/SmartTable.vue'
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

const pagination = computed(() => ({
  page: currentPage.value,
  perPage: perPage.value,
  total: totalCases.value,
}))

const tableActions = computed(() => [
  { key: 'view', label: t('common.view') || 'View', icon: 'mdi-eye-outline', color: 'info' },
])

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
      include: 'patient,doctor,category,status,ophthalmologyEncounterDetails',
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

function handleAction({ key, item }) {
  if (key === 'view') openDrawer(item)
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
</style>
