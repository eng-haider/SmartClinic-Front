<template>
  <v-container fluid class="dashboard pa-4 pa-md-6">
    <!-- ═══════════════════════════════════════════════════════════════════
         1️⃣ HEADER SECTION
         ═══════════════════════════════════════════════════════════════════ -->
    <div class="dashboard__header mb-6">
      <div class="dashboard__header-text">
        <h1 class="text-h5 font-weight-medium">{{ $t('dashboard.title') }}</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">{{ dateRangeText }}</p>
      </div>
      <div class="dashboard__header-actions">
        <v-menu :close-on-content-click="false" location="bottom end">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              variant="outlined"
              color="primary"
              size="small"
              prepend-icon="mdi-calendar-range"
            >
              {{ $t('dashboard.dateRange') }}
            </v-btn>
          </template>
          <v-card min-width="280" class="pa-4">
            <v-text-field
              v-model="tempDateFrom"
              :label="$t('dashboard.from')"
              type="date"
              density="compact"
              variant="outlined"
              class="mb-3"
            />
            <v-text-field
              v-model="tempDateTo"
              :label="$t('dashboard.to')"
              type="date"
              density="compact"
              variant="outlined"
              class="mb-3"
            />
            <v-btn
              block
              color="primary"
              size="small"
              @click="applyDateRange"
            >
              {{ $t('dashboard.apply') }}
            </v-btn>
          </v-card>
        </v-menu>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════
         2️⃣ KPI SUMMARY ROW (Main Statistics)
         ═══════════════════════════════════════════════════════════════════ -->
    <v-row class="mb-6">
      <v-col cols="6" sm="4" md="2">
        <KpiCard
          :label="$t('dashboard.kpi.totalPatients')"
          :value="overview?.patients?.total"
          icon="mdi-account-group-outline"
          icon-color="primary"
          :loading="loading.overview"
        />
      </v-col>
      <v-col cols="6" sm="4" md="2">
        <KpiCard
          :label="$t('dashboard.kpi.totalRevenue')"
          :value="overview?.bills?.total_revenue"
          icon="mdi-cash-multiple"
          icon-color="success"
          format="currency"
          :loading="loading.overview"
        />
      </v-col>
      <v-col cols="6" sm="4" md="2">
        <KpiCard
          :label="$t('dashboard.kpi.totalCases')"
          :value="overview?.cases?.total"
          icon="mdi-clipboard-text-outline"
          icon-color="info"
          :loading="loading.overview"
        />
      </v-col>
      <v-col cols="6" sm="4" md="2">
        <KpiCard
          :label="$t('dashboard.kpi.totalReservations')"
          :value="overview?.reservations?.total"
          icon="mdi-calendar-check-outline"
          icon-color="warning"
          :loading="loading.overview"
        />
      </v-col>
      <v-col cols="6" sm="4" md="2">
        <KpiCard
          :label="$t('dashboard.kpi.totalExpenses')"
          :value="overview?.expenses?.total_amount"
          icon="mdi-receipt-text-outline"
          icon-color="error"
          format="currency"
          :loading="loading.overview"
          trend-reverse
        />
      </v-col>
      <v-col cols="6" sm="4" md="2">
        <KpiCard
          :label="$t('dashboard.kpi.profitLoss')"
          :value="profitLoss"
          icon="mdi-chart-line"
          :icon-color="isProfitable ? 'success' : 'error'"
          format="currency"
          :value-color="isProfitable ? 'success' : 'error'"
          :loading="loading.overview"
        />
      </v-col>
    </v-row>

    <!-- ═══════════════════════════════════════════════════════════════════
         3️⃣ TODAY'S SNAPSHOT
         ═══════════════════════════════════════════════════════════════════ -->
    <div class="section-title mb-3">{{ $t('dashboard.todaySnapshot') }}</div>
    <v-row class="mb-6">
      <v-col cols="6" sm="4" md="2-4">
        <KpiCard
          :label="$t('dashboard.today.newPatients')"
          :value="todayData?.new_patients"
          icon="mdi-account-plus-outline"
          icon-color="primary"
          :loading="loading.today"
        />
      </v-col>
      <v-col cols="6" sm="4" md="2-4">
        <KpiCard
          :label="$t('dashboard.today.reservations')"
          :value="todayData?.reservations_today"
          icon="mdi-calendar-today"
          icon-color="warning"
          :loading="loading.today"
        />
      </v-col>
      <v-col cols="6" sm="4" md="2-4">
        <KpiCard
          :label="$t('dashboard.today.revenue')"
          :value="todayData?.revenue_today"
          icon="mdi-cash"
          icon-color="success"
          format="currency"
          :loading="loading.today"
        />
      </v-col>
      <v-col cols="6" sm="4" md="2-4">
        <KpiCard
          :label="$t('dashboard.today.cases')"
          :value="todayData?.cases_today"
          icon="mdi-clipboard-check-outline"
          icon-color="info"
          :loading="loading.today"
        />
      </v-col>
      <v-col cols="6" sm="4" md="2-4">
        <KpiCard
          :label="$t('dashboard.today.expenses')"
          :value="todayData?.expenses_today"
          icon="mdi-receipt-text-minus-outline"
          icon-color="error"
          format="currency"
          :loading="loading.today"
        />
      </v-col>
    </v-row>

    <!-- ═══════════════════════════════════════════════════════════════════
         4️⃣ TRENDS SECTION
         ═══════════════════════════════════════════════════════════════════ -->
    <div class="section-title mb-3">{{ $t('dashboard.trends') }}</div>
    <v-row class="mb-6">
      <v-col cols="12" md="6">
        <TrendChart
          :title="$t('dashboard.charts.patientsTrend')"
          :data="patientsTrend"
          label-key="period"
          value-key="count"
          color="#4F8CF1"
          :loading="loading.patientsTrend"
        />
      </v-col>
      <v-col cols="12" md="6">
        <TrendChart
          :title="$t('dashboard.charts.casesTrend')"
          :data="casesTrend"
          label-key="period"
          value-key="count"
          color="#48BB78"
          :loading="loading.casesTrend"
        />
      </v-col>
      <v-col cols="12" md="6">
        <TrendChart
          :title="$t('dashboard.charts.revenueTrend')"
          :data="revenueTrend"
          label-key="period"
          value-key="total"
          type="area"
          color="#38A169"
          :loading="loading.revenueTrend"
          :format-value="formatCurrency"
        />
      </v-col>
      <v-col cols="12" md="6">
        <TrendChart
          :title="$t('dashboard.charts.profitLossTrend')"
          :data="profitLossTrend"
          label-key="period"
          value-key="profit_loss"
          type="area"
          color="#805AD5"
          :loading="loading.profitLossTrend"
          :format-value="formatCurrency"
        />
      </v-col>
    </v-row>

    <!-- ═══════════════════════════════════════════════════════════════════
         5️⃣ DISTRIBUTION SECTION
         ═══════════════════════════════════════════════════════════════════ -->
    <div class="section-title mb-3">{{ $t('dashboard.distributions') }}</div>
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <DonutChart
          :title="$t('dashboard.charts.casesByStatus')"
          :data="casesByStatus"
          label-key="status_name"
          value-key="count"
          color-key="color"
          :center-label="$t('dashboard.total')"
          :loading="loading.casesByStatus"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <DonutChart
          :title="$t('dashboard.charts.reservationsByStatus')"
          :data="reservationsByStatus"
          label-key="status_name"
          value-key="count"
          color-key="color"
          :center-label="$t('dashboard.total')"
          :loading="loading.reservationsByStatus"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <DonutChart
          :title="$t('dashboard.charts.billsByPayment')"
          :data="formattedBillsByPayment"
          label-key="label"
          value-key="count"
          color-key="color"
          :center-label="$t('dashboard.total')"
          :loading="loading.billsByPayment"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <BarChart
          :title="$t('dashboard.charts.expensesByCategory')"
          :data="expensesByCategory"
          label-key="category_name"
          value-key="total_amount"
          :horizontal="true"
          color="#FC8181"
          :loading="loading.expensesByCategory"
        />
      </v-col>
    </v-row>

    <!-- ═══════════════════════════════════════════════════════════════════
         6️⃣ DOCTOR PERFORMANCE TABLE
         ═══════════════════════════════════════════════════════════════════ -->
    <div class="section-title mb-3">{{ $t('dashboard.doctorPerformance') }}</div>
    <v-card variant="flat" class="performance-table">
      <v-data-table
        :headers="performanceHeaders"
        :items="doctorPerformance"
        :loading="loading.doctorPerformance"
        density="comfortable"
        :items-per-page="10"
        :no-data-text="$t('common.no_data')"
        class="elevation-0"
      >
        <template v-slot:item.doctor_name="{ item }">
          <div class="d-flex align-center gap-2">
            <v-avatar size="32" color="primary" variant="tonal">
              <span class="text-caption font-weight-medium">
                {{ getInitials(item.doctor_name) }}
              </span>
            </v-avatar>
            <span class="font-weight-medium">{{ item.doctor_name }}</span>
          </div>
        </template>
        <template v-slot:item.total_patients="{ item }">
          {{ formatNumber(item.total_patients) }}
        </template>
        <template v-slot:item.total_cases="{ item }">
          {{ formatNumber(item.total_cases) }}
        </template>
        <template v-slot:item.total_reservations="{ item }">
          {{ formatNumber(item.total_reservations) }}
        </template>
        <template v-slot:item.total_revenue="{ item }">
          <span class="text-success font-weight-medium">
            {{ formatCurrency(item.total_revenue) }}
          </span>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDashboard } from '@/composables/useDashboard'
import { KpiCard, TrendChart, DonutChart, BarChart } from '@/components/dashboard'

const { t } = useI18n()

const {
  dateRange,
  dateRangeText,
  loading,
  overview,
  todayData,
  patientsTrend,
  casesTrend,
  revenueTrend,
  profitLossTrend,
  casesByStatus,
  reservationsByStatus,
  billsByPayment,
  expensesByCategory,
  doctorPerformance,
  fetchAll,
  setDateRange,
  initFromStorage,
  formatCurrency,
  formatNumber
} = useDashboard()

// Temp date range for picker
const tempDateFrom = ref('')
const tempDateTo = ref('')

// Computed
const profitLoss = computed(() => {
  if (!overview.value?.bills || !overview.value?.expenses) return null
  return (overview.value.bills.total_revenue || 0) - (overview.value.expenses.total_amount || 0)
})

const isProfitable = computed(() => profitLoss.value !== null && profitLoss.value >= 0)

const formattedBillsByPayment = computed(() => {
  if (!billsByPayment.value) return []
  return billsByPayment.value.map(item => ({
    ...item,
    label: item.status === 'paid' ? t('dashboard.paid') : t('dashboard.unpaid'),
    color: item.status === 'paid' ? '#48BB78' : '#FC8181'
  }))
})

const performanceHeaders = computed(() => [
  { title: t('dashboard.table.doctor'), key: 'doctor_name', sortable: true },
  { title: t('dashboard.table.patients'), key: 'total_patients', sortable: true, align: 'center' },
  { title: t('dashboard.table.cases'), key: 'total_cases', sortable: true, align: 'center' },
  { title: t('dashboard.table.reservations'), key: 'total_reservations', sortable: true, align: 'center' },
  { title: t('dashboard.table.revenue'), key: 'total_revenue', sortable: true, align: 'end' }
])

// Methods
const applyDateRange = () => {
  if (tempDateFrom.value && tempDateTo.value) {
    setDateRange(tempDateFrom.value, tempDateTo.value)
  }
}

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

// Lifecycle
onMounted(() => {
  initFromStorage()
  tempDateFrom.value = dateRange.from
  tempDateTo.value = dateRange.to
  fetchAll()
})
</script>

<style scoped>
.dashboard {
  background: rgb(var(--v-theme-background));
  min-height: 100vh;
}

.dashboard__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.dashboard__header-text h1 {
  color: rgb(var(--v-theme-on-background));
}

.section-title {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.performance-table {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 12px;
  overflow: hidden;
}

:deep(.v-data-table) {
  background: transparent !important;
}

:deep(.v-data-table__tr:hover) {
  background: rgba(var(--v-theme-primary), 0.04) !important;
}

:deep(.v-data-table-header__content) {
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .dashboard__header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .dashboard__header-actions {
    align-self: flex-end;
  }
}
</style>
