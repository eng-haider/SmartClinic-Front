<template>
  <div class="bills-page">
    <!-- Page Header -->
    <div class="page-header mb-6">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4">
        <div>
          <h1 class="text-h4 font-weight-bold text-primary">{{ $t('bills.title') }}</h1>
          <p class="text-grey mt-1">{{ $t('bills.subtitle') }}</p>
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <v-row class="mb-6">
      <!-- Total Bills Card -->
      <v-col cols="12" sm="6" lg="4" xl="2">
        <v-card class="stat-card" elevation="3" rounded="xl">
          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-grey-darken-1 mb-1 text-uppercase font-weight-medium">
                  {{ $t('bills.stats.total_bills') }}
                </p>
                <h2 class="text-h5 font-weight-bold text-primary">
                  {{ stats.total_bills || 0 }}
                </h2>
                <div class="d-flex align-center mt-2">
                  <v-icon size="16" color="primary" class="me-1">mdi-file-document-multiple</v-icon>
                  <span class="text-caption text-primary">{{ $t('bills.stats.all_bills') }}</span>
                </div>
              </div>
              <v-avatar color="primary" size="56" variant="tonal">
                <v-icon size="28">mdi-receipt-text</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Paid Bills Card -->
      <v-col cols="12" sm="6" lg="4" xl="2">
        <v-card class="stat-card" elevation="3" rounded="xl">
          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-grey-darken-1 mb-1 text-uppercase font-weight-medium">
                  {{ $t('bills.stats.paid_bills') }}
                </p>
                <h2 class="text-h5 font-weight-bold text-success">
                  {{ stats.paid_bills || 0 }}
                </h2>
                <div class="d-flex align-center mt-2">
                  <v-icon size="16" color="success" class="me-1">mdi-check-circle</v-icon>
                  <span class="text-caption text-success">{{ $t('bills.stats.completed') }}</span>
                </div>
              </div>
              <v-avatar color="success" size="56" variant="tonal">
                <v-icon size="28">mdi-check-decagram</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Unpaid Bills Card -->
      <v-col cols="12" sm="6" lg="4" xl="2">
        <v-card class="stat-card" elevation="3" rounded="xl">
          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-grey-darken-1 mb-1 text-uppercase font-weight-medium">
                  {{ $t('bills.stats.unpaid_bills') }}
                </p>
                <h2 class="text-h5 font-weight-bold text-error">
                  {{ stats.unpaid_bills || 0 }}
                </h2>
                <div class="d-flex align-center mt-2">
                  <v-icon size="16" color="error" class="me-1">mdi-clock-alert</v-icon>
                  <span class="text-caption text-error">{{ $t('bills.stats.pending') }}</span>
                </div>
              </div>
              <v-avatar color="error" size="56" variant="tonal">
                <v-icon size="28">mdi-alert-circle</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Total Paid Price Card -->
      <v-col cols="12" sm="6" lg="4" xl="2">
        <v-card class="stat-card" elevation="3" rounded="xl">
          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-grey-darken-1 mb-1 text-uppercase font-weight-medium">
                  {{ $t('bills.stats.total_paid_price') }}
                </p>
                <h2 class="text-h5 font-weight-bold text-success">
                  {{ formatCurrency(stats.total_paid_price || 0) }}
                </h2>
                <div class="d-flex align-center mt-2">
                  <v-icon size="16" color="success" class="me-1">mdi-cash-check</v-icon>
                  <span class="text-caption text-success">{{ $t('bills.stats.collected') }}</span>
                </div>
              </div>
              <v-avatar color="success" size="56" variant="tonal">
                <v-icon size="28">mdi-cash-multiple</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Total Unpaid Price Card -->
      <v-col cols="12" sm="6" lg="4" xl="2">
        <v-card class="stat-card" elevation="3" rounded="xl">
          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-grey-darken-1 mb-1 text-uppercase font-weight-medium">
                  {{ $t('bills.stats.total_unpaid_price') }}
                </p>
                <h2 class="text-h5 font-weight-bold text-error">
                  {{ formatCurrency(stats.total_unpaid_price || 0) }}
                </h2>
                <div class="d-flex align-center mt-2">
                  <v-icon size="16" color="error" class="me-1">mdi-cash-remove</v-icon>
                  <span class="text-caption text-error">{{ $t('bills.stats.outstanding') }}</span>
                </div>
              </div>
              <v-avatar color="error" size="56" variant="tonal">
                <v-icon size="28">mdi-cash-off</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Total Outstanding Card -->
      <v-col cols="12" sm="6" lg="4" xl="2">
        <v-card class="stat-card" elevation="3" rounded="xl">
          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-grey-darken-1 mb-1 text-uppercase font-weight-medium">
                  {{ $t('bills.stats.total_outstanding') }}
                </p>
                <h2 class="text-h5 font-weight-bold text-warning">
                  {{ formatCurrency(stats.total_outstanding || 0) }}
                </h2>
                <div class="d-flex align-center mt-2">
                  <v-icon size="16" color="warning" class="me-1">mdi-alert</v-icon>
                  <span class="text-caption text-warning">{{ $t('bills.stats.remaining') }}</span>
                </div>
              </div>
              <v-avatar color="warning" size="56" variant="tonal">
                <v-icon size="28">mdi-clock-alert</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filters & Search Toolbar -->
    <v-card class="toolbar-card mb-6" elevation="2" rounded="xl">
      <v-card-text>
        <v-row align="center">
          <!-- Search -->
          <v-col cols="12" md="3">
            <v-text-field
              v-model="search"
              :label="$t('bills.search')"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              @update:model-value="debouncedSearch"
            />
          </v-col>

          <!-- Date Range -->
          <v-col cols="12" sm="6" md="2">
            <v-text-field
              v-model="filters.date_from"
              :label="$t('bills.date_from')"
              type="date"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              @update:model-value="loadBills"
            />
          </v-col>

          <v-col cols="12" sm="6" md="2">
            <v-text-field
              v-model="filters.date_to"
              :label="$t('bills.date_to')"
              type="date"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              @update:model-value="loadBills"
            />
          </v-col>

          <!-- Payment Status Filter -->
          <v-col cols="12" sm="6" md="2">
            <v-select
              v-model="filters.is_paid"
              :label="$t('bills.payment_status')"
              :items="paymentStatusOptions"
              item-title="text"
              item-value="value"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              @update:model-value="loadBills"
            />
          </v-col>

          <!-- Doctor Filter -->
          <v-col cols="12" sm="6" md="2">
            <v-select
              v-model="filters.doctor_id"
              :label="$t('bills.doctor')"
              :items="doctors"
              item-title="name"
              item-value="id"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              @update:model-value="loadBills"
            />
          </v-col>

          <!-- Per Page -->
          <v-col cols="6" md="1">
            <v-select
              v-model="perPage"
              :label="$t('bills.per_page')"
              :items="[10, 15, 25, 50, 100]"
              variant="outlined"
              density="comfortable"
              hide-details
              @update:model-value="loadBills"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Bills Table -->
    <v-card elevation="2" rounded="xl">
      <!-- Loading State -->
      <v-progress-linear v-if="loading" indeterminate color="primary" />

      <!-- Error State -->
      <v-alert v-if="error" type="error" variant="tonal" class="ma-4" closable @click:close="error = ''">
        {{ error }}
      </v-alert>

      <!-- Success Message -->
      <v-snackbar v-model="showSuccess" color="success" :timeout="3000" location="top">
        {{ successMessage }}
        <template v-slot:actions>
          <v-btn variant="text" @click="showSuccess = false">{{ $t('common.close') }}</v-btn>
        </template>
      </v-snackbar>

      <!-- Data Table -->
      <v-data-table-server
        v-model:items-per-page="perPage"
        v-model:page="currentPage"
        :headers="headers"
        :items="bills"
        :items-length="totalBills"
        :loading="loading"
        class="bills-table"
        density="compact"
        mobile-breakpoint="md"
        hover
        @update:page="loadBills"
        @update:items-per-page="loadBills"
      >
        <!-- Bill ID -->
        <template v-slot:item.id="{ item }">
          <v-chip size="small" color="primary" variant="tonal">
            #{{ item.id }}
          </v-chip>
        </template>

        <!-- Patient Info -->
        <template v-slot:item.patient="{ item }">
          <div class="d-flex align-center ga-3 py-2">
            <v-avatar :color="getAvatarColor(item.patient?.name)" size="38">
              <span class="text-white font-weight-bold text-caption">
                {{ getInitials(item.patient?.name) }}
              </span>
            </v-avatar>
            <div>
              <div class="font-weight-medium">{{ item.patient?.name || '-' }}</div>
              <div class="text-caption text-grey" dir="ltr">{{ item.patient?.phone || '-' }}</div>
            </div>
          </div>
        </template>

        <!-- Billable Type -->
        <template v-slot:item.billable_type="{ item }">
          <v-chip 
            :color="getBillableColor(item.billable_type)" 
            size="small" 
            variant="tonal"
          >
            <v-icon start size="14">{{ getBillableIcon(item.billable_type) }}</v-icon>
            {{ getBillableLabel(item.billable_type) }}
          </v-chip>
        </template>

        <!-- Price -->
        <template v-slot:item.price="{ item }">
          <span class="font-weight-bold text-primary">{{ formatCurrency(item.price) }}</span>
        </template>

        <!-- Payment Status -->
        <template v-slot:item.is_paid="{ item }">
          <v-chip 
            :color="item.is_paid ? 'success' : 'error'" 
            size="small"
            variant="flat"
          >
            <v-icon start size="14">{{ item.is_paid ? 'mdi-check-circle' : 'mdi-clock-alert' }}</v-icon>
            {{ item.is_paid ? $t('bills.paid') : $t('bills.unpaid') }}
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
            <div>{{ formatDate(item.created_at) }}</div>
            <div class="text-grey">{{ formatTime(item.created_at) }}</div>
          </div>
        </template>

        <!-- Actions -->
        <template v-slot:item.actions="{ item }">
          <div class="d-flex ga-1">
            <!-- View Button -->
            <v-btn
              icon="mdi-eye"
              size="small"
              variant="text"
              color="info"
              @click="viewBill(item)"
            />
            <!-- Toggle Payment Status -->
            <v-btn
              :icon="item.is_paid ? 'mdi-cash-remove' : 'mdi-cash-check'"
              size="small"
              variant="text"
              :color="item.is_paid ? 'warning' : 'success'"
              @click="togglePaymentStatus(item)"
              :loading="item.toggling"
            />
            <!-- Delete Button -->
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
            <v-icon size="80" color="grey-lighten-2">mdi-receipt-text-remove</v-icon>
            <h3 class="text-h6 mt-4 text-grey">{{ $t('bills.no_bills') }}</h3>
            <p class="text-grey-darken-1">{{ $t('bills.no_bills_desc') }}</p>
            <v-btn
              color="primary"
              class="mt-4"
              prepend-icon="mdi-plus"
              @click="openCreateDialog"
            >
              {{ $t('bills.add_first') }}
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
          {{ $t('bills.showing') }} {{ paginationInfo.from }}-{{ paginationInfo.to }} 
          {{ $t('bills.of') }} {{ paginationInfo.total }}
        </div>
        <v-pagination
          v-model="currentPage"
          :length="paginationInfo.lastPage"
          :total-visible="5"
          density="compact"
          @update:model-value="loadBills"
        />
      </div>
    </v-card>

    <!-- View Bill Dialog -->
    <v-dialog v-model="viewDialog" max-width="600">
      <v-card rounded="xl" v-if="selectedBill">
        <v-card-title class="d-flex align-center pa-4 bg-primary">
          <v-icon class="me-3" color="white">mdi-receipt</v-icon>
          <span class="text-white">{{ $t('bills.bill_details') }}</span>
          <v-spacer />
          <v-chip 
            :color="selectedBill.is_paid ? 'success' : 'error'" 
            variant="flat"
            size="small"
          >
            {{ selectedBill.is_paid ? $t('bills.paid') : $t('bills.unpaid') }}
          </v-chip>
        </v-card-title>

        <v-card-text class="pa-6">
          <v-row>
            <!-- Bill Info -->
            <v-col cols="12">
              <div class="text-center mb-4">
                <h2 class="text-h4 font-weight-bold text-primary">
                  {{ formatCurrency(selectedBill.price) }}
                </h2>
                <p class="text-caption text-grey">{{ $t('bills.bill_number') }}: #{{ selectedBill.id }}</p>
              </div>
            </v-col>

            <v-col cols="12">
              <v-divider class="mb-4" />
            </v-col>

            <!-- Patient Info -->
            <v-col cols="12" sm="6">
              <div class="d-flex align-center ga-3 mb-4">
                <v-avatar :color="getAvatarColor(selectedBill.patient?.name)" size="48">
                  <span class="text-white font-weight-bold">
                    {{ getInitials(selectedBill.patient?.name) }}
                  </span>
                </v-avatar>
                <div>
                  <p class="text-caption text-grey mb-0">{{ $t('bills.patient') }}</p>
                  <p class="font-weight-medium mb-0">{{ selectedBill.patient?.name || '-' }}</p>
                  <p class="text-caption" dir="ltr">{{ selectedBill.patient?.phone || '-' }}</p>
                </div>
              </div>
            </v-col>

            <!-- Doctor Info -->
            <v-col cols="12" sm="6">
              <div class="d-flex align-center ga-3 mb-4">
                <v-avatar color="primary" size="48" variant="tonal">
                  <v-icon>mdi-doctor</v-icon>
                </v-avatar>
                <div>
                  <p class="text-caption text-grey mb-0">{{ $t('bills.doctor') }}</p>
                  <p class="font-weight-medium mb-0">{{ selectedBill.doctor?.name || '-' }}</p>
                </div>
              </div>
            </v-col>

            <!-- Billable Info -->
            <v-col cols="12" sm="6">
              <v-list-item class="pa-0">
                <template v-slot:prepend>
                  <v-avatar :color="getBillableColor(selectedBill.billable_type)" variant="tonal">
                    <v-icon>{{ getBillableIcon(selectedBill.billable_type) }}</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="text-caption text-grey">{{ $t('bills.type') }}</v-list-item-title>
                <v-list-item-subtitle class="font-weight-medium">
                  {{ getBillableLabel(selectedBill.billable_type) }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-col>

            <!-- Date Info -->
            <v-col cols="12" sm="6">
              <v-list-item class="pa-0">
                <template v-slot:prepend>
                  <v-avatar color="info" variant="tonal">
                    <v-icon>mdi-calendar</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="text-caption text-grey">{{ $t('bills.created_at') }}</v-list-item-title>
                <v-list-item-subtitle class="font-weight-medium">
                  {{ formatDate(selectedBill.created_at) }} - {{ formatTime(selectedBill.created_at) }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-col>

            <!-- Credit Info -->
            <v-col cols="12" v-if="selectedBill.use_credit">
              <v-alert type="info" variant="tonal" density="compact">
                <v-icon start>mdi-wallet</v-icon>
                {{ $t('bills.credit_used') }}
              </v-alert>
            </v-col>

            <!-- Billable Details -->
            <v-col cols="12" v-if="selectedBill.billable">
              <v-expansion-panels variant="accordion">
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <v-icon class="me-2">mdi-information</v-icon>
                    {{ $t('bills.related_details') }}
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <div v-if="selectedBill.billable.notes" class="mb-2">
                      <strong>{{ $t('bills.notes') }}:</strong> {{ selectedBill.billable.notes }}
                    </div>
                    <div v-if="selectedBill.billable.tooth_num">
                      <strong>{{ $t('bills.tooth_number') }}:</strong> {{ selectedBill.billable.tooth_num }}
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-btn 
            :color="selectedBill.is_paid ? 'warning' : 'success'"
            variant="tonal"
            @click="togglePaymentStatus(selectedBill); viewDialog = false"
          >
            <v-icon start>{{ selectedBill.is_paid ? 'mdi-cash-remove' : 'mdi-cash-check' }}</v-icon>
            {{ selectedBill.is_paid ? $t('bills.mark_unpaid') : $t('bills.mark_paid') }}
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="viewDialog = false">{{ $t('common.close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon color="error" class="me-2">mdi-alert-circle</v-icon>
          {{ $t('common.confirmDelete') }}
        </v-card-title>
        <v-card-text>
          {{ $t('bills.delete_confirmation') }}
          <div class="mt-3 pa-3 bg-grey-lighten-4 rounded-lg">
            <strong>{{ $t('bills.bill_number') }}:</strong> #{{ billToDelete?.id }}<br>
            <strong>{{ $t('bills.patient') }}:</strong> {{ billToDelete?.patient?.name }}<br>
            <strong>{{ $t('bills.price') }}:</strong> {{ formatCurrency(billToDelete?.price) }}
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">{{ $t('common.cancel') }}</v-btn>
          <v-btn 
            color="error" 
            variant="elevated"
            :loading="deleting"
            @click="deleteBill"
          >
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { billService } from '@/services/bill.service'
import DoctorService from '@/services/doctor.service'

// Custom debounce function
const debounce = (fn, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

const { t, locale } = useI18n()

// ==================== Reactive State ====================
const loading = ref(false)
const deleting = ref(false)
const error = ref('')
const showSuccess = ref(false)
const successMessage = ref('')

// Data
const bills = ref([])
const doctors = ref([])
const stats = ref({})

// Pagination
const currentPage = ref(1)
const perPage = ref(15)
const totalBills = ref(0)

// Filters
const search = ref('')
const filters = ref({
  date_from: '',
  date_to: '',
  is_paid: null,
  doctor_id: null
})

// Dialogs
const viewDialog = ref(false)
const deleteDialog = ref(false)

// Selected items
const selectedBill = ref(null)
const billToDelete = ref(null)

// ==================== Computed ====================
const headers = computed(() => [
  { title: '#', key: 'id', sortable: false, width: '80px' },
  { title: t('bills.patient'), key: 'patient', sortable: false },
  { title: t('bills.type'), key: 'billable_type', sortable: false },
  { title: t('bills.price'), key: 'price', sortable: true },
  { title: t('bills.status'), key: 'is_paid', sortable: true },
  { title: t('bills.doctor'), key: 'doctor', sortable: false },
  { title: t('bills.date'), key: 'created_at', sortable: true },
  { title: t('common.actions'), key: 'actions', sortable: false, align: 'center', width: '150px' }
])

const paymentStatusOptions = computed(() => [
  { text: t('bills.all'), value: null },
  { text: t('bills.paid'), value: 1 },
  { text: t('bills.unpaid'), value: 0 }
])

const paginationInfo = computed(() => ({
  from: ((currentPage.value - 1) * perPage.value) + 1,
  to: Math.min(currentPage.value * perPage.value, totalBills.value),
  total: totalBills.value,
  lastPage: Math.ceil(totalBills.value / perPage.value) || 1
}))

// ==================== Methods ====================
const loadBills = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const params = {
      page: currentPage.value,
      per_page: perPage.value,
      include: 'patient,doctor,billable',
      sort: '-created_at'
    }

    if (search.value) {
      params.search = search.value
    }
    if (filters.value.is_paid !== null) {
      params['filter[is_paid]'] = filters.value.is_paid
    }
    if (filters.value.doctor_id) {
      params['filter[doctor_id]'] = filters.value.doctor_id
    }

    const response = await billService.getAll(params)
    bills.value = response.data.data || response.data
    totalBills.value = response.data.pagination?.total || response.data.meta?.total || bills.value.length

    // Load statistics with date filters
    await loadStatistics()
  } catch (err) {
    console.error('Error loading bills:', err)
    error.value = t('errors.fetchFailed')
  } finally {
    loading.value = false
  }
}

const loadStatistics = async () => {
  try {
    const params = {}
    if (filters.value.date_from) params.date_from = filters.value.date_from
    if (filters.value.date_to) params.date_to = filters.value.date_to
    if (filters.value.doctor_id) params.doctor_id = filters.value.doctor_id

    const response = await billService.getStatistics(params)
    stats.value = response.data.data || response.data
  } catch (err) {
    console.error('Error loading statistics:', err)
  }
}

const loadDoctors = async () => {
  try {
    const response = await DoctorService.getActive()
    doctors.value = response.data.data || response.data
  } catch (err) {
    console.error('Error loading doctors:', err)
  }
}

const debouncedSearch = debounce(() => {
  currentPage.value = 1
  loadBills()
}, 500)

// Dialog Methods
const viewBill = (bill) => {
  selectedBill.value = bill
  viewDialog.value = true
}

const confirmDelete = (bill) => {
  billToDelete.value = bill
  deleteDialog.value = true
}

const deleteBill = async () => {
  deleting.value = true
  
  try {
    await billService.delete(billToDelete.value.id)
    successMessage.value = t('bills.messages.deleted')
    showSuccess.value = true
    deleteDialog.value = false
    billToDelete.value = null
    await loadBills()
  } catch (err) {
    console.error('Error deleting bill:', err)
    error.value = t('errors.deleteFailed')
  } finally {
    deleting.value = false
  }
}

const togglePaymentStatus = async (bill) => {
  bill.toggling = true
  
  try {
    if (bill.is_paid) {
      await billService.markAsUnpaid(bill.id)
      successMessage.value = t('bills.messages.marked_unpaid')
    } else {
      await billService.markAsPaid(bill.id)
      successMessage.value = t('bills.messages.marked_paid')
    }
    
    showSuccess.value = true
    await loadBills()
  } catch (err) {
    console.error('Error toggling payment status:', err)
    error.value = t('errors.saveFailed')
  } finally {
    bill.toggling = false
  }
}

// Helper Methods
const formatCurrency = (amount) => {
  const value = (amount || 0) 
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0
  }).format(value)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString(locale.value === 'ar' ? 'ar-IQ' : 'en-US')
}

const formatTime = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleTimeString(locale.value === 'ar' ? 'ar-IQ' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getAvatarColor = (name) => {
  if (!name) return 'grey'
  const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'purple', 'teal', 'indigo', 'cyan']
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

const getBillableColor = (type) => {
  if (!type) return 'grey'
  return type.includes('Case') ? 'purple' : 'teal'
}

const getBillableIcon = (type) => {
  if (!type) return 'mdi-file'
  return type.includes('Case') ? 'mdi-file-document' : 'mdi-calendar-clock'
}

const getBillableLabel = (type) => {
  if (!type) return '-'
  return type.includes('Case') ? t('bills.case') : t('bills.reservation')
}

// ==================== Lifecycle ====================
onMounted(() => {
  loadBills()
  loadDoctors()
})
</script>

<style scoped>
.bills-page {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

.stat-card {
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.stat-card:hover {
  transform: translateY(-4px);
  border-color: rgba(var(--v-theme-primary), 0.2);
}

.toolbar-card {
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
}

.bills-table :deep(tr) {
  cursor: pointer;
}

.bills-table :deep(tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.04) !important;
}

@media (max-width: 960px) {
  .bills-page {
    padding: 16px;
  }
}
</style>
