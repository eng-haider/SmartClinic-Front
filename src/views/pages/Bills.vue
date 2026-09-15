<template>
  <div class="bills-page">
    <!-- Page Header -->
    <div class="page-header mb-6 mobile-page-heading">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4">
        <div>
          <h1 class="text-h4 font-weight-bold text-primary">{{ $t('bills.title') }}</h1>
          <p class="text-grey mt-1">{{ $t('bills.subtitle') }}</p>
        </div>
      </div>
    </div>

    <!-- Filters Toolbar - All in One Row -->
    <v-card class="toolbar-card mb-6" elevation="2" rounded="xl">
      <v-card-text>
        <v-row align="center">
          <!-- Search -->
          <!-- <v-col cols="12" sm="6" md="2">
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
          </v-col> -->

          <!-- Date From -->
          <v-col cols="12" sm="6" md="2">
            <v-text-field
              v-model="filters.date_from"
              :label="$t('bills.date_from')"
              type="date"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              prepend-inner-icon="mdi-calendar-start"
              @update:model-value="applyDateFilters"
            />
          </v-col>

          <!-- Date To -->
          <v-col cols="12" sm="6" md="2">
            <v-text-field
              v-model="filters.date_to"
              :label="$t('bills.date_to')"
              type="date"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              prepend-inner-icon="mdi-calendar-end"
              @update:model-value="applyDateFilters"
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
              @update:model-value="applyDateFilters"
            />
          </v-col>

          <!-- Per Page -->
          <v-col cols="6" sm="6" md="1">
            <v-select
              v-model="perPage"
              :label="$t('bills.per_page')"
              :items="[10, 15, 25, 50, 100]"
              variant="outlined"
              density="comfortable"
              hide-details
              @update:model-value="onPerPageChange"
            />
          </v-col>

          <!-- Clear Filters Button -->
          <v-col cols="6" sm="6" md="1">
            <v-btn
              color="error"
              variant="tonal"
              icon="mdi-filter-remove"
              @click="clearDateFilters"
              :disabled="!filters.date_from && !filters.date_to"
              size="large"
            >
              <v-icon>mdi-filter-remove</v-icon>
              <v-tooltip activator="parent" location="top">
                {{ $t('bills.clear_filters') }}
              </v-tooltip>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Statistics Cards -->
    <v-row class="mb-6">
      <!-- Total Price Card -->
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="3" rounded="xl">
          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-grey-darken-1 mb-1 text-uppercase font-weight-medium">
                  {{ $t('bills.stats.total_price') || 'Total Price' }}
                </p>
                <h2 class="text-h5 font-weight-bold text-primary">
                  {{ formatCurrency(stats.total_price || 0) }}
                </h2>
                <div class="d-flex align-center mt-2">
                  <v-icon size="16" color="primary" class="me-1">mdi-calculator</v-icon>
                  <span class="text-caption text-primary">{{ $t('bills.stats.total_amount') || 'Total Amount' }}</span>
                </div>
              </div>
              <v-avatar color="primary" size="56" variant="tonal">
                <v-icon size="28">mdi-calculator</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Total Paid Price Card -->
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="3" rounded="xl">
          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-grey-darken-1 mb-1 text-uppercase font-weight-medium">
                  {{ $t('bills.stats.total_paid_price') || 'Total Paid' }}
                </p>
                <h2 class="text-h5 font-weight-bold text-success">
                  {{ formatCurrency(stats.total_paid_price || 0) }}
                </h2>
                <div class="d-flex align-center mt-2">
                  <v-icon size="16" color="success" class="me-1">mdi-cash-check</v-icon>
                  <span class="text-caption text-success">{{ $t('bills.stats.paid_amount') || 'Paid Amount' }}</span>
                </div>
              </div>
              <v-avatar color="success" size="56" variant="tonal">
                <v-icon size="28">mdi-cash-check</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Total Unpaid Price Card (click to list remaining amounts per patient) -->
      <v-col cols="12" sm="6" md="3">
        <v-card
          class="stat-card stat-card--clickable"
          :class="{ 'stat-card--active': showRemaining }"
          elevation="3"
          rounded="xl"
          @click="toggleRemaining"
        >
          <v-tooltip activator="parent" location="top">
            {{ showRemaining ? $t('bills.stats.all_bills') : $t('bills.stats.click_to_view') }}
          </v-tooltip>
          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-grey-darken-1 mb-1 text-uppercase font-weight-medium">
                  {{ $t('bills.stats.total_unpaid_price') || 'Total Unpaid' }}
                </p>
                <h2 class="text-h5 font-weight-bold text-warning">
                  {{ formatCurrency(stats.total_unpaid_price || 0) }}
                </h2>
                <div class="d-flex align-center mt-2">
                  <v-icon size="16" color="warning" class="me-1">mdi-cash-clock</v-icon>
                  <span class="text-caption text-warning">{{ $t('bills.stats.outstanding') || 'Outstanding Amount' }}</span>
                  <v-icon size="14" color="warning" class="ms-1">
                    {{ showRemaining ? 'mdi-eye-off-outline' : 'mdi-format-list-bulleted' }}
                  </v-icon>
                </div>
              </div>
              <v-avatar color="warning" size="56" variant="tonal">
                <v-icon size="28">mdi-clock-outline</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Total Expenses Card -->
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="3" rounded="xl">
          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-grey-darken-1 mb-1 text-uppercase font-weight-medium">
                  {{ $t('bills.stats.total_expenses') || 'Total Expenses' }}
                </p>
                <h2 class="text-h5 font-weight-bold text-error">
                  {{ formatCurrency(stats.total_expenses || 0) }}
                </h2>
                <div class="d-flex align-center mt-2">
                  <v-icon size="16" color="error" class="me-1">mdi-arrow-down</v-icon>
                  <span class="text-caption text-error">{{ $t('bills.stats.expenses') || 'Expenses' }}</span>
                </div>
              </div>
              <v-avatar color="error" size="56" variant="tonal">
                <v-icon size="28">mdi-cash-minus</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Bills Table (hidden while the remaining-amounts view is open) -->
    <v-card v-show="!showRemaining" elevation="2" rounded="xl">
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
        hide-default-footer
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

        <!-- Category -->
        <template v-slot:item.category="{ item }">
          <v-chip 
            v-if="item.billable?.category?.name"
            color="purple" 
            size="small" 
            variant="tonal"
          >
            <v-icon start size="14">mdi-shape</v-icon>
            {{ item.billable.category.name }}
          </v-chip>
          <span v-else class="text-grey">-</span>
        </template>

        <!-- Price -->
        <template v-slot:item.price="{ item }">
          <span class="font-weight-bold text-primary">{{ formatCurrency(item.price) }}</span>
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

    <!-- Remaining Amounts (per-patient balances, same date/doctor scope as the cards) -->
    <v-card v-if="showRemaining" class="remaining-card" elevation="2" rounded="xl">
      <v-progress-linear v-if="remainingLoading" indeterminate color="warning" />

      <v-card-text class="pa-4">
        <!-- Search -->
        <v-text-field
          v-model="remainingSearch"
          :placeholder="$t('bills.workspace.search_patient')"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          class="mb-3"
          @update:model-value="debouncedRemainingSearch"
        />

        <v-alert v-if="remainingError" type="error" variant="tonal" density="compact" class="mb-3">
          {{ remainingError }}
        </v-alert>

        <!-- Balances Table -->
        <v-data-table-server
          :items-per-page="perPage"
          :page="remainingPage"
          :headers="remainingHeaders"
          :items="remainingPatients"
          :items-length="remainingTotal"
          :loading="remainingLoading"
          class="remaining-table"
          density="compact"
          mobile-breakpoint="md"
          hover
          hide-default-footer
          @click:row="(_, { item }) => openPatientFile(item)"
        >
          <!-- Patient -->
          <template v-slot:item.patient="{ item }">
            <div class="d-flex align-center ga-3 py-2">
              <v-avatar :color="getAvatarColor(item.name)" size="36">
                <span class="text-white font-weight-bold text-caption">{{ getInitials(item.name) }}</span>
              </v-avatar>
              <div>
                <div class="font-weight-medium">{{ item.name || '-' }}</div>
                <div class="text-caption text-grey" dir="ltr">{{ item.phone || '-' }}</div>
              </div>
            </div>
          </template>

          <!-- Cases count -->
          <template v-slot:item.case_count="{ item }">
            <v-chip size="small" color="purple" variant="tonal">{{ item.case_count }}</v-chip>
          </template>

          <!-- Remaining -->
          <template v-slot:item.unpaid_amount="{ item }">
            <span class="font-weight-bold text-warning">{{ formatCurrency(item.unpaid_amount) }}</span>
          </template>

          <!-- Open patient file -->
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon="mdi-account-arrow-right"
              size="small"
              variant="text"
              color="info"
              :title="$t('bills.workspace.open_patient')"
              @click.stop="openPatientFile(item)"
            />
          </template>

          <template v-slot:no-data>
            <div class="text-center py-10">
              <v-icon size="64" color="grey-lighten-2">mdi-cash-check</v-icon>
              <p class="text-grey mt-3 mb-0">{{ $t('bills.workspace.empty_patients') }}</p>
            </div>
          </template>

          <template v-slot:loading>
            <v-skeleton-loader type="table-row@5" />
          </template>
        </v-data-table-server>
      </v-card-text>

      <!-- Pagination -->
      <v-divider />
      <div class="d-flex align-center justify-space-between pa-4">
        <div class="text-caption text-grey">
          {{ $t('bills.showing') }} {{ remainingPagination.from }}-{{ remainingPagination.to }}
          {{ $t('bills.of') }} {{ remainingPagination.total }}
        </div>
        <v-pagination
          v-model="remainingPage"
          :length="remainingPagination.lastPage"
          :total-visible="5"
          density="compact"
          @update:model-value="loadRemaining"
        />
      </div>
    </v-card>

    <!-- View Bill Dialog -->
    <v-dialog v-model="viewDialog" max-width="600">
      <v-card rounded="xl" v-if="selectedBill">
        <v-card-title class="d-flex align-center pa-4 bg-primary">
          <v-icon class="me-3" color="white">mdi-receipt</v-icon>
          <span class="text-white">{{ $t('bills.bill_details') }}</span>

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
import { useRouter, useRoute } from 'vue-router'
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
const router = useRouter()
const route = useRoute()

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
const currentPage = ref(Number(route.query.page) || 1)
const perPage = ref(Number(route.query.per_page) || 15)
const totalBills = ref(0)

// Filters
const search = ref(route.query.search || '')
const filters = ref({
  date_from: route.query.date_from || '',
  date_to: route.query.date_to || '',
  doctor_id: route.query.doctor_id ? Number(route.query.doctor_id) : null
})

function syncUrl() {
  const q = {}
  if (currentPage.value > 1) q.page = String(currentPage.value)
  if (perPage.value !== 15) q.per_page = String(perPage.value)
  if (search.value) q.search = search.value
  if (filters.value.date_from) q.date_from = filters.value.date_from
  if (filters.value.date_to) q.date_to = filters.value.date_to
  if (filters.value.doctor_id) q.doctor_id = String(filters.value.doctor_id)
  if (showRemaining.value) q.view = 'remaining'
  router.replace({ query: q })
}

// Dialogs
const viewDialog = ref(false)
const deleteDialog = ref(false)

// Remaining amounts view (per-patient balances from /bills/patient-balances).
// Replaces the bills table while open; shares the toolbar date/doctor/per-page filters.
const showRemaining = ref(route.query.view === 'remaining')
const remainingLoading = ref(false)
const remainingError = ref('')
const remainingSearch = ref('')
const remainingPage = ref(1)
const remainingTotal = ref(0)
const remainingPatients = ref([])

// Selected items
const selectedBill = ref(null)
const billToDelete = ref(null)

// ==================== Computed ====================
const headers = computed(() => [
  { title: '#', key: 'id', sortable: false, width: '80px' },
  { title: t('bills.patient'), key: 'patient', sortable: false },
  { title: t('cases.category') || 'Category', key: 'category', sortable: false },
  { title: t('bills.price'), key: 'price', sortable: true },
  { title: t('bills.doctor'), key: 'doctor', sortable: false },
  { title: t('bills.date'), key: 'created_at', sortable: true },
  { title: t('common.actions'), key: 'actions', sortable: false, align: 'center', width: '150px' }
])



const paginationInfo = computed(() => ({
  from: ((currentPage.value - 1) * perPage.value) + 1,
  to: Math.min(currentPage.value * perPage.value, totalBills.value),
  total: totalBills.value,
  lastPage: Math.ceil(totalBills.value / perPage.value) || 1
}))

const remainingHeaders = computed(() => [
  { title: t('bills.patient'), key: 'patient', sortable: false },
  { title: t('bills.workspace.case_count'), key: 'case_count', sortable: false, align: 'center' },
  { title: t('bills.workspace.unpaid_amount'), key: 'unpaid_amount', sortable: false, align: 'end' },
  { title: '', key: 'actions', sortable: false, align: 'center', width: '64px' }
])

const remainingPagination = computed(() => ({
  from: remainingTotal.value ? ((remainingPage.value - 1) * perPage.value) + 1 : 0,
  to: Math.min(remainingPage.value * perPage.value, remainingTotal.value),
  total: remainingTotal.value,
  lastPage: Math.ceil(remainingTotal.value / perPage.value) || 1
}))

// ==================== Methods ====================
const loadBills = async () => {
  syncUrl()
  loading.value = true
  error.value = ''
  
  try {
    const params = {
      page: currentPage.value,
      per_page: perPage.value,
      include: 'patient,doctor,billable,billable.category',
      sort: '-created_at',
      'filter[billable_type]': 'App\\Models\\Case'
    }

    if (search.value) {
      params.search = search.value
    }

    if (filters.value.doctor_id) {
      params['filter[doctor_id]'] = filters.value.doctor_id
    }
    
    // Add date filters to bills API
    if (filters.value.date_from) {
      params['filter[date_from]'] = filters.value.date_from
    }
    if (filters.value.date_to) {
      params['filter[date_to]'] = filters.value.date_to
    }

    const response = await billService.getAll(params)
    bills.value = response.data || []
    totalBills.value = response.pagination?.total || response.meta?.total || 0
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
    
    // Add date filters to statistics API
    if (filters.value.date_from) {
      params.date_from = filters.value.date_from
    }
    if (filters.value.date_to) {
      params.date_to = filters.value.date_to
    }
    if (filters.value.doctor_id) {
      params.doctor_id = filters.value.doctor_id
    }

    const response = await billService.getStatistics(params)
    stats.value = response.data.data || response.data
  } catch (err) {
    console.error('Error loading statistics:', err)
  }
}

const applyDateFilters = async () => {
  currentPage.value = 1
  loading.value = true
  
  try {
    // Load bills, statistics and (when open) remaining amounts with the same filters
    remainingPage.value = 1
    await Promise.all([
      loadBills(),
      loadStatistics(),
      showRemaining.value ? loadRemaining() : Promise.resolve()
    ])
  } finally {
    loading.value = false
  }
}

const onPerPageChange = () => {
  loadBills()
  if (showRemaining.value) {
    remainingPage.value = 1
    loadRemaining()
  }
}

const clearDateFilters = () => {
  filters.value.date_from = ''
  filters.value.date_to = ''
  applyDateFilters()
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
  syncUrl()
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

// Remaining Amounts View
const loadRemaining = async () => {
  remainingLoading.value = true
  remainingError.value = ''

  try {
    const params = {
      payment_status: 'unpaid',
      sort: '-unpaid_amount',
      page: remainingPage.value,
      per_page: perPage.value
    }

    if (remainingSearch.value) {
      params.search = remainingSearch.value
    }

    // Same scope as the statistics cards: doctor + cases created in the date range
    if (filters.value.doctor_id) {
      params.doctor_id = filters.value.doctor_id
    }
    if (filters.value.date_from) {
      params.case_date_from = filters.value.date_from
    }
    if (filters.value.date_to) {
      params.case_date_to = filters.value.date_to
    }

    const response = await billService.getPatientBalances(params)
    remainingPatients.value = response.data || []
    remainingTotal.value = response.pagination?.total || 0
  } catch (err) {
    console.error('Error loading remaining amounts:', err)
    remainingError.value = t('errors.fetchFailed')
  } finally {
    remainingLoading.value = false
  }
}

const toggleRemaining = () => {
  showRemaining.value = !showRemaining.value
  syncUrl()
  if (showRemaining.value) {
    remainingSearch.value = ''
    remainingPage.value = 1
    loadRemaining()
  }
}

const debouncedRemainingSearch = debounce(() => {
  remainingPage.value = 1
  loadRemaining()
}, 400)

const openPatientFile = (patient) => {
  router.push({ name: 'PatientDetail', params: { id: patient.id } })
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
onMounted(async () => {
  await loadDoctors()
  await loadStatistics()
  await loadBills()
  if (showRemaining.value) {
    await loadRemaining()
  }
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

.stat-card--clickable {
  cursor: pointer;
}

.stat-card--clickable:hover {
  border-color: rgba(var(--v-theme-warning), 0.4);
}

.stat-card--active {
  border-color: rgb(var(--v-theme-warning));
  box-shadow: 0 0 0 3px rgba(var(--v-theme-warning), 0.2) !important;
}

.remaining-card {
  border: 1px solid rgba(var(--v-theme-warning), 0.3);
}

.remaining-table :deep(tbody tr) {
  cursor: pointer;
}

.remaining-table :deep(tbody tr:hover) {
  background-color: rgba(var(--v-theme-warning), 0.06) !important;
}

/* Phone/tablet card view: the header only holds a "Sort by" select nobody needs
   here, and cells need more room and a larger font for simple use. */
:deep(.v-data-table-headers--mobile) {
  display: none !important;
}
/* Separate rule: a browser without :has() must not drop the fallback above. */
:deep(.v-data-table thead:has(.v-data-table-headers--mobile)) {
  display: none !important;
}

:deep(.v-data-table__tr--mobile) {
  display: block !important;
  margin: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  border-radius: 12px !important;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.remaining-table :deep(.v-data-table__tr--mobile) {
  border-color: rgba(var(--v-theme-warning), 0.35) !important;
}

:deep(.v-data-table__tr--mobile .v-data-table__td) {
  display: flex !important;
  flex-wrap: wrap;
  justify-content: space-between !important;
  align-items: center !important;
  row-gap: 8px;
  padding: 12px 14px !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06) !important;
  font-size: 15px;
  line-height: 1.5;
}

:deep(.v-data-table__tr--mobile .v-data-table__td:last-child) {
  border-bottom: none !important;
}

:deep(.v-data-table__tr--mobile .v-data-table__td-title) {
  font-weight: 700;
  color: #37474f;
  font-size: 15px;
  min-width: 96px;
}

:deep(.v-data-table__tr--mobile .v-data-table__td-value) {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 15px;
  text-align: end;
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
