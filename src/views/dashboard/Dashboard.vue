<template>
  <v-container fluid class="dashboard-container pa-4 pa-md-6">
    <!-- Header with Date Range -->
    <div class="dashboard-header mb-6">
      <div class="header-content">
        <div class="header-text">
          <h1 class="text-h4 font-weight-bold mb-1">{{ $t('dashboard.title') }}</h1>
          <p class="text-body-2 text-medium-emphasis">{{ $t('dashboard.welcome') }}</p>
        </div>
        <div class="header-actions">
          <!-- Date Range Picker -->
          <v-menu :close-on-content-click="false" v-model="dateMenu">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                variant="outlined"
                prepend-icon="mdi-calendar-range"
                class="date-range-btn"
              >
                {{ formatDateRange(dateRange.from, dateRange.to) }}
              </v-btn>
            </template>
            <v-card min-width="300">
              <v-card-text>
                <v-row>
                  <v-col cols="12">
                    <v-text-field
                      v-model="dateRange.from"
                      :label="$t('dashboard.date_from')"
                      type="date"
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="dateRange.to"
                      :label="$t('dashboard.date_to')"
                      type="date"
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </v-col>
                </v-row>
                <div class="d-flex gap-2 mt-3">
                  <v-btn size="small" variant="text" @click="setQuickRange('today')">{{ $t('dashboard.today') }}</v-btn>
                  <v-btn size="small" variant="text" @click="setQuickRange('week')">{{ $t('dashboard.this_week') }}</v-btn>
                  <v-btn size="small" variant="text" @click="setQuickRange('month')">{{ $t('dashboard.this_month') }}</v-btn>
                  <v-btn size="small" variant="text" @click="setQuickRange('year')">{{ $t('dashboard.this_year') }}</v-btn>
                </div>
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="dateMenu = false">{{ $t('common.cancel') }}</v-btn>
                <v-btn color="primary" @click="applyDateRange">{{ $t('dashboard.apply') }}</v-btn>
              </v-card-actions>
            </v-card>
          </v-menu>
          <!-- Refresh Button -->
          <v-btn icon variant="text" @click="refreshAll" :loading="isRefreshing">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Today's Quick Stats -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="section-title mb-3">
          <v-icon color="primary" class="me-2">mdi-clock-outline</v-icon>
          {{ $t('dashboard.today_summary') }}
        </div>
      </v-col>
      <v-col cols="6" sm="4" md="2.4">
        <div class="quick-stat-card">
          <div class="quick-stat-icon bg-primary-light">
            <v-icon color="primary" size="20">mdi-account-plus</v-icon>
          </div>
          <div class="quick-stat-content">
            <div class="quick-stat-value">{{ formatNumber(todayStats.new_patients) }}</div>
            <div class="quick-stat-label">{{ $t('dashboard.new_patients') }}</div>
          </div>
        </div>
      </v-col>
      <v-col cols="6" sm="4" md="2.4">
        <div class="quick-stat-card">
          <div class="quick-stat-icon bg-success-light">
            <v-icon color="success" size="20">mdi-calendar-check</v-icon>
          </div>
          <div class="quick-stat-content">
            <div class="quick-stat-value">{{ formatNumber(todayStats.reservations_today) }}</div>
            <div class="quick-stat-label">{{ $t('dashboard.reservations_today') }}</div>
          </div>
        </div>
      </v-col>
      <v-col cols="6" sm="4" md="2.4">
        <div class="quick-stat-card">
          <div class="quick-stat-icon bg-info-light">
            <v-icon color="info" size="20">mdi-cash</v-icon>
          </div>
          <div class="quick-stat-content">
            <div class="quick-stat-value">{{ formatCurrency(todayStats.revenue_today) }}</div>
            <div class="quick-stat-label">{{ $t('dashboard.revenue_today') }}</div>
          </div>
        </div>
      </v-col>
      <v-col cols="6" sm="4" md="2.4">
        <div class="quick-stat-card">
          <div class="quick-stat-icon bg-warning-light">
            <v-icon color="warning" size="20">mdi-folder-open</v-icon>
          </div>
          <div class="quick-stat-content">
            <div class="quick-stat-value">{{ formatNumber(todayStats.cases_today) }}</div>
            <div class="quick-stat-label">{{ $t('dashboard.cases_today') }}</div>
          </div>
        </div>
      </v-col>
      <v-col cols="6" sm="4" md="2.4">
        <div class="quick-stat-card">
          <div class="quick-stat-icon bg-error-light">
            <v-icon color="error" size="20">mdi-trending-down</v-icon>
          </div>
          <div class="quick-stat-content">
            <div class="quick-stat-value">{{ formatCurrency(todayStats.expenses_today) }}</div>
            <div class="quick-stat-label">{{ $t('dashboard.expenses_today') }}</div>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Main KPI Cards -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="section-title mb-3">
          <v-icon color="primary" class="me-2">mdi-chart-box</v-icon>
          {{ $t('dashboard.overview') }} - {{ formatDateRange(dateRange.from, dateRange.to) }}
        </div>
      </v-col>
      
      <!-- Patients KPI -->
      <v-col cols="12" sm="6" lg="3">
        <v-card class="kpi-card" :loading="loading.overview">
          <div class="kpi-header">
            <div class="kpi-icon bg-primary-light">
              <v-icon color="primary">mdi-account-group</v-icon>
            </div>
            <div class="kpi-title">{{ $t('dashboard.patients') }}</div>
          </div>
          <div class="kpi-body">
            <div class="kpi-main-value">{{ formatNumber(overview?.patients?.total) }}</div>
            <div class="kpi-breakdown">
              <div class="kpi-breakdown-item">
                <span class="dot male"></span>
                <span>{{ $t('dashboard.male') }}: {{ formatNumber(overview?.patients?.male) }} ({{ formatPercent(overview?.patients?.male_percentage) }})</span>
              </div>
              <div class="kpi-breakdown-item">
                <span class="dot female"></span>
                <span>{{ $t('dashboard.female') }}: {{ formatNumber(overview?.patients?.female) }} ({{ formatPercent(overview?.patients?.female_percentage) }})</span>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Bills KPI -->
      <v-col cols="12" sm="6" lg="3">
        <v-card class="kpi-card" :loading="loading.overview">
          <div class="kpi-header">
            <div class="kpi-icon bg-success-light">
              <v-icon color="success">mdi-receipt</v-icon>
            </div>
            <div class="kpi-title">{{ $t('dashboard.bills') }}</div>
          </div>
          <div class="kpi-body">
            <div class="kpi-main-value">{{ formatCurrency(overview?.bills?.total_revenue) }}</div>
            <div class="kpi-breakdown">
              <div class="kpi-breakdown-item">
                <span class="dot paid"></span>
                <span>{{ $t('dashboard.paid') }}: {{ formatNumber(overview?.bills?.paid_bills) }}</span>
              </div>
              <div class="kpi-breakdown-item">
                <span class="dot unpaid"></span>
                <span>{{ $t('dashboard.unpaid') }}: {{ formatNumber(overview?.bills?.unpaid_bills) }}</span>
              </div>
            </div>
            <v-progress-linear
              :model-value="overview?.bills?.collection_rate || 0"
              color="success"
              bg-color="error"
              height="6"
              rounded
              class="mt-2"
            />
            <div class="kpi-progress-label">
              {{ $t('dashboard.collection_rate') }}: {{ formatPercent(overview?.bills?.collection_rate) }}
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Cases KPI -->
      <v-col cols="12" sm="6" lg="3">
        <v-card class="kpi-card" :loading="loading.overview">
          <div class="kpi-header">
            <div class="kpi-icon bg-warning-light">
              <v-icon color="warning">mdi-folder-multiple</v-icon>
            </div>
            <div class="kpi-title">{{ $t('dashboard.cases') }}</div>
          </div>
          <div class="kpi-body">
            <div class="kpi-main-value">{{ formatNumber(overview?.cases?.total) }}</div>
            <div class="kpi-sub-value">{{ $t('dashboard.total_value') }}: {{ formatCurrency(overview?.cases?.total_value) }}</div>
            <div class="kpi-breakdown">
              <div class="kpi-breakdown-item">
                <span class="dot paid"></span>
                <span>{{ $t('dashboard.paid') }}: {{ formatNumber(overview?.cases?.paid) }} ({{ formatPercent(overview?.cases?.paid_percentage) }})</span>
              </div>
              <div class="kpi-breakdown-item">
                <span class="dot unpaid"></span>
                <span>{{ $t('dashboard.unpaid') }}: {{ formatNumber(overview?.cases?.unpaid) }}</span>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Expenses KPI -->
      <v-col cols="12" sm="6" lg="3">
        <v-card class="kpi-card" :loading="loading.overview">
          <div class="kpi-header">
            <div class="kpi-icon bg-error-light">
              <v-icon color="error">mdi-wallet-outline</v-icon>
            </div>
            <div class="kpi-title">{{ $t('dashboard.expenses') }}</div>
          </div>
          <div class="kpi-body">
            <div class="kpi-main-value">{{ formatCurrency(overview?.expenses?.total_amount) }}</div>
            <div class="kpi-breakdown">
              <div class="kpi-breakdown-item">
                <span class="dot paid"></span>
                <span>{{ $t('dashboard.paid') }}: {{ formatCurrency(overview?.expenses?.paid_amount) }}</span>
              </div>
              <div class="kpi-breakdown-item">
                <span class="dot unpaid"></span>
                <span>{{ $t('dashboard.unpaid') }}: {{ formatCurrency(overview?.expenses?.unpaid_amount) }}</span>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Profit/Loss Summary -->
    <v-row class="mb-6">
      <v-col cols="12" md="4">
        <v-card class="profit-card" :class="{ 'profit': profitLoss?.is_profit, 'loss': !profitLoss?.is_profit }" :loading="loading.profitLoss">
          <div class="profit-card-content">
            <div class="profit-icon">
              <v-icon size="32" :color="profitLoss?.is_profit ? 'success' : 'error'">
                {{ profitLoss?.is_profit ? 'mdi-trending-up' : 'mdi-trending-down' }}
              </v-icon>
            </div>
            <div class="profit-details">
              <div class="profit-label">{{ $t('dashboard.profit_loss') }}</div>
              <div class="profit-value" :class="{ 'text-success': profitLoss?.is_profit, 'text-error': !profitLoss?.is_profit }">
                {{ profitLoss?.is_profit ? '+' : '-' }}{{ formatCurrency(Math.abs(profitLoss?.profit_loss || 0)) }}
              </div>
              <div class="profit-margin">
                {{ $t('dashboard.profit_margin') }}: {{ formatPercent(profitLoss?.profit_margin) }}
              </div>
            </div>
          </div>
          <div class="profit-breakdown">
            <div class="profit-breakdown-item">
              <span>{{ $t('dashboard.total_revenue') }}</span>
              <span class="text-success">{{ formatCurrency(profitLoss?.total_revenue) }}</span>
            </div>
            <div class="profit-breakdown-item">
              <span>{{ $t('dashboard.total_expenses') }}</span>
              <span class="text-error">{{ formatCurrency(profitLoss?.total_expenses) }}</span>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Reservations Summary -->
      <v-col cols="12" md="4">
        <v-card class="summary-card" :loading="loading.overview">
          <div class="summary-header">
            <v-icon color="info" class="me-2">mdi-calendar-clock</v-icon>
            {{ $t('dashboard.reservations') }}
          </div>
          <div class="summary-main">{{ formatNumber(overview?.reservations?.total) }}</div>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-item-value text-success">{{ formatNumber(overview?.reservations?.confirmed) }}</div>
              <div class="summary-item-label">{{ $t('dashboard.confirmed') }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-item-value text-warning">{{ formatNumber(overview?.reservations?.waiting) }}</div>
              <div class="summary-item-label">{{ $t('dashboard.waiting') }}</div>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Quick Actions -->
      <v-col cols="12" md="4">
        <v-card class="actions-card">
          <div class="actions-header">
            <v-icon color="primary" class="me-2">mdi-lightning-bolt</v-icon>
            {{ $t('dashboard.quick_actions') }}
          </div>
          <div class="actions-grid">
            <v-btn color="primary" variant="tonal" @click="goTo('/patients')" class="action-btn">
              <v-icon start>mdi-account-plus</v-icon>
              {{ $t('dashboard.add_patient') }}
            </v-btn>
            <v-btn color="success" variant="tonal" @click="goTo('/reservations')" class="action-btn">
              <v-icon start>mdi-calendar-plus</v-icon>
              {{ $t('dashboard.add_reservation') }}
            </v-btn>
            <v-btn color="warning" variant="tonal" @click="goTo('/cases')" class="action-btn">
              <v-icon start>mdi-folder-plus</v-icon>
              {{ $t('dashboard.add_case') }}
            </v-btn>
            <v-btn color="info" variant="tonal" @click="goTo('/bills')" class="action-btn">
              <v-icon start>mdi-receipt</v-icon>
              {{ $t('dashboard.add_bill') }}
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts Row 1 -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="section-title mb-3">
          <v-icon color="primary" class="me-2">mdi-chart-line</v-icon>
          {{ $t('dashboard.trends') }}
        </div>
      </v-col>
      
      <!-- Revenue Trend -->
      <v-col cols="12" lg="8">
        <v-card class="chart-card">
          <div class="chart-header">
            <div class="chart-title">{{ $t('dashboard.revenue_trend') }}</div>
            <v-btn-toggle v-model="revenuePeriod" mandatory density="compact" variant="outlined">
              <v-btn value="day" size="small">{{ $t('dashboard.daily') }}</v-btn>
              <v-btn value="week" size="small">{{ $t('dashboard.weekly') }}</v-btn>
              <v-btn value="month" size="small">{{ $t('dashboard.monthly') }}</v-btn>
            </v-btn-toggle>
          </div>
          <div class="chart-body">
            <TrendChart
              v-if="revenueTrend.length > 0"
              :data="revenueTrend"
              label-key="period"
              value-key="total"
              type="area"
              color="#4CAF50"
              :height="280"
              :loading="loading.revenueTrend"
              :format-value="(v) => formatCurrency(v)"
              title=""
            />
            <div v-else-if="!loading.revenueTrend" class="chart-empty">
              <v-icon size="48" color="grey-lighten-1">mdi-chart-line</v-icon>
              <span>{{ $t('common.no_data') }}</span>
            </div>
            <v-skeleton-loader v-else type="image" height="280" />
          </div>
        </v-card>
      </v-col>

      <!-- Profit/Loss Trend -->
      <v-col cols="12" lg="4">
        <v-card class="chart-card">
          <div class="chart-header">
            <div class="chart-title">{{ $t('dashboard.profit_loss_trend') }}</div>
          </div>
          <div class="chart-body">
            <div v-if="profitLossTrend.length > 0" class="mini-chart-list">
              <div v-for="item in profitLossTrend.slice(-6)" :key="item.period" class="mini-chart-item">
                <div class="mini-chart-period">{{ item.period }}</div>
                <div class="mini-chart-bar-container">
                  <div class="mini-chart-bar revenue" :style="{ width: getBarWidth(item.revenue, maxRevenue) + '%' }"></div>
                  <div class="mini-chart-bar expense" :style="{ width: getBarWidth(item.expenses, maxRevenue) + '%' }"></div>
                </div>
                <div class="mini-chart-value" :class="{ 'text-success': item.profit_loss >= 0, 'text-error': item.profit_loss < 0 }">
                  {{ formatCurrency(item.profit_loss) }}
                </div>
              </div>
            </div>
            <div v-else-if="!loading.profitLossTrend" class="chart-empty">
              <v-icon size="48" color="grey-lighten-1">mdi-chart-bar</v-icon>
              <span>{{ $t('common.no_data') }}</span>
            </div>
            <v-skeleton-loader v-else type="list-item@6" />
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts Row 2 -->
    <v-row class="mb-6">
      <!-- Cases by Status -->
      <v-col cols="12" md="4">
        <v-card class="chart-card">
          <div class="chart-header">
            <div class="chart-title">{{ $t('dashboard.cases_by_status') }}</div>
          </div>
          <div class="chart-body">
            <DonutChart
              v-if="casesByStatus.length > 0"
              :data="casesByStatus"
              label-key="status_name"
              value-key="count"
              color-key="color"
              :center-label="$t('dashboard.total')"
              :loading="loading.casesByStatus"
              title=""
            />
            <div v-else-if="!loading.casesByStatus" class="chart-empty">
              <v-icon size="48" color="grey-lighten-1">mdi-chart-donut</v-icon>
              <span>{{ $t('common.no_data') }}</span>
            </div>
            <v-skeleton-loader v-else type="image" height="220" />
          </div>
        </v-card>
      </v-col>

      <!-- Reservations by Status -->
      <v-col cols="12" md="4">
        <v-card class="chart-card">
          <div class="chart-header">
            <div class="chart-title">{{ $t('dashboard.reservations_by_status') }}</div>
          </div>
          <div class="chart-body">
            <DonutChart
              v-if="reservationsByStatus.length > 0"
              :data="reservationsByStatus"
              label-key="status_name"
              value-key="count"
              color-key="color"
              :center-label="$t('dashboard.total')"
              :loading="loading.reservationsByStatus"
              title=""
            />
            <div v-else-if="!loading.reservationsByStatus" class="chart-empty">
              <v-icon size="48" color="grey-lighten-1">mdi-chart-donut</v-icon>
              <span>{{ $t('common.no_data') }}</span>
            </div>
            <v-skeleton-loader v-else type="image" height="220" />
          </div>
        </v-card>
      </v-col>

      <!-- Expenses by Category -->
      <v-col cols="12" md="4">
        <v-card class="chart-card">
          <div class="chart-header">
            <div class="chart-title">{{ $t('dashboard.expenses_by_category') }}</div>
          </div>
          <div class="chart-body">
            <DonutChart
              v-if="expensesByCategory.length > 0"
              :data="expensesByCategory"
              label-key="category_name"
              value-key="total_amount"
              :center-label="$t('dashboard.total')"
              :loading="loading.expensesByCategory"
              title=""
            />
            <div v-else-if="!loading.expensesByCategory" class="chart-empty">
              <v-icon size="48" color="grey-lighten-1">mdi-chart-donut</v-icon>
              <span>{{ $t('common.no_data') }}</span>
            </div>
            <v-skeleton-loader v-else type="image" height="220" />
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Doctor Performance Table -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card class="table-card">
          <div class="table-header">
            <div class="table-title">
              <v-icon color="primary" class="me-2">mdi-doctor</v-icon>
              {{ $t('dashboard.doctor_performance') }}
            </div>
          </div>
          <v-data-table
            :headers="doctorHeaders"
            :items="doctorPerformance"
            :loading="loading.doctorPerformance"
            density="comfortable"
            class="dashboard-table"
            :no-data-text="$t('common.no_data')"
          >
            <template v-slot:item.doctor_name="{ item }">
              <div class="d-flex align-center gap-2">
                <v-avatar color="primary" size="32">
                  <span class="text-white text-caption">{{ getInitials(item.doctor_name) }}</span>
                </v-avatar>
                <div>
                  <div class="font-weight-medium">{{ item.doctor_name }}</div>
                  <div class="text-caption text-medium-emphasis">{{ item.doctor_email }}</div>
                </div>
              </div>
            </template>
            <template v-slot:item.total_patients="{ item }">
              <span class="numeric-value">{{ formatNumber(item.total_patients) }}</span>
            </template>
            <template v-slot:item.total_cases="{ item }">
              <span class="numeric-value">{{ formatNumber(item.total_cases) }}</span>
            </template>
            <template v-slot:item.total_reservations="{ item }">
              <span class="numeric-value">{{ formatNumber(item.total_reservations) }}</span>
            </template>
            <template v-slot:item.total_revenue="{ item }">
              <span class="numeric-value text-success font-weight-medium">{{ formatCurrency(item.total_revenue) }}</span>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Patient Trends Row -->
    <v-row>
      <!-- Patient Registration Trend -->
      <v-col cols="12" md="6">
        <v-card class="chart-card">
          <div class="chart-header">
            <div class="chart-title">{{ $t('dashboard.patient_trend') }}</div>
          </div>
          <div class="chart-body">
            <TrendChart
              v-if="patientsTrend.length > 0"
              :data="patientsTrend"
              label-key="period"
              value-key="count"
              type="line"
              color="#2196F3"
              :height="220"
              :loading="loading.patientsTrend"
              title=""
            />
            <div v-else-if="!loading.patientsTrend" class="chart-empty">
              <v-icon size="48" color="grey-lighten-1">mdi-chart-line</v-icon>
              <span>{{ $t('common.no_data') }}</span>
            </div>
            <v-skeleton-loader v-else type="image" height="220" />
          </div>
        </v-card>
      </v-col>

      <!-- Cases Trend -->
      <v-col cols="12" md="6">
        <v-card class="chart-card">
          <div class="chart-header">
            <div class="chart-title">{{ $t('dashboard.cases_trend') }}</div>
          </div>
          <div class="chart-body">
            <TrendChart
              v-if="casesTrend.length > 0"
              :data="casesTrend"
              label-key="period"
              value-key="count"
              type="area"
              color="#FF9800"
              :height="220"
              :loading="loading.casesTrend"
              title=""
            />
            <div v-else-if="!loading.casesTrend" class="chart-empty">
              <v-icon size="48" color="grey-lighten-1">mdi-chart-line</v-icon>
              <span>{{ $t('common.no_data') }}</span>
            </div>
            <v-skeleton-loader v-else type="image" height="220" />
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import reportsService from '@/services/reports.service'
import TrendChart from '@/components/dashboard/TrendChart.vue'
import DonutChart from '@/components/dashboard/DonutChart.vue'

const router = useRouter()
const { t, locale } = useI18n()
const authStore = useAuthStore()

// Date Range State
const today = new Date()
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
const dateMenu = ref(false)
const dateRange = reactive({
  from: formatDate(firstDayOfMonth),
  to: formatDate(today)
})

// Loading States
const loading = reactive({
  overview: false,
  today: false,
  patientsTrend: false,
  casesTrend: false,
  revenueTrend: false,
  profitLoss: false,
  profitLossTrend: false,
  casesByStatus: false,
  reservationsByStatus: false,
  expensesByCategory: false,
  doctorPerformance: false
})

const isRefreshing = ref(false)

// Data States
const overview = ref(null)
const todayStats = ref({
  new_patients: 0,
  reservations_today: 0,
  revenue_today: 0,
  cases_today: 0,
  expenses_today: 0
})
const patientsTrend = ref([])
const casesTrend = ref([])
const revenueTrend = ref([])
const profitLoss = ref(null)
const profitLossTrend = ref([])
const casesByStatus = ref([])
const reservationsByStatus = ref([])
const expensesByCategory = ref([])
const doctorPerformance = ref([])

// Period selector for revenue
const revenuePeriod = ref('month')

// Doctor Table Headers
const doctorHeaders = computed(() => [
  { title: t('dashboard.doctor'), key: 'doctor_name', sortable: true },
  { title: t('dashboard.patients'), key: 'total_patients', sortable: true, align: 'center' },
  { title: t('dashboard.cases'), key: 'total_cases', sortable: true, align: 'center' },
  { title: t('dashboard.reservations'), key: 'total_reservations', sortable: true, align: 'center' },
  { title: t('dashboard.revenue'), key: 'total_revenue', sortable: true, align: 'end' }
])

// Computed
const maxRevenue = computed(() => {
  if (!profitLossTrend.value.length) return 1
  return Math.max(...profitLossTrend.value.map(d => Math.max(d.revenue || 0, d.expenses || 0)))
})

// Helper Functions
function formatDate(date) {
  return date.toISOString().split('T')[0]
}

function formatNumber(value) {
  if (value === null || value === undefined) return '0'
  return new Intl.NumberFormat('en-US').format(value)
}

function formatCurrency(value) {
  if (value === null || value === undefined) return '0 IQD'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value) + ' IQD'
}

function formatPercent(value) {
  if (value === null || value === undefined) return '0%'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value) + '%'
}

function formatDateRange(from, to) {
  const fromDate = new Date(from)
  const toDate = new Date(to)
  const options = { month: 'short', day: 'numeric' }
  const yearOptions = { month: 'short', day: 'numeric', year: 'numeric' }
  return `${fromDate.toLocaleDateString('en-US', options)} - ${toDate.toLocaleDateString('en-US', yearOptions)}`
}

function getBarWidth(value, max) {
  if (!max || !value) return 0
  return Math.min((value / max) * 100, 100)
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

function setQuickRange(range) {
  const now = new Date()
  switch (range) {
    case 'today':
      dateRange.from = formatDate(now)
      dateRange.to = formatDate(now)
      break
    case 'week':
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      dateRange.from = formatDate(weekStart)
      dateRange.to = formatDate(now)
      break
    case 'month':
      dateRange.from = formatDate(new Date(now.getFullYear(), now.getMonth(), 1))
      dateRange.to = formatDate(now)
      break
    case 'year':
      dateRange.from = formatDate(new Date(now.getFullYear(), 0, 1))
      dateRange.to = formatDate(now)
      break
  }
}

function applyDateRange() {
  dateMenu.value = false
  fetchAll()
}

function goTo(path) {
  router.push(path)
}

// API Fetch Functions
async function fetchOverview() {
  loading.overview = true
  try {
    const response = await reportsService.dashboard.getOverview({
      date_from: dateRange.from,
      date_to: dateRange.to
    })
    overview.value = response.data || response
  } catch (e) {
    console.error('Failed to fetch overview:', e)
  } finally {
    loading.overview = false
  }
}

async function fetchToday() {
  loading.today = true
  try {
    const response = await reportsService.dashboard.getToday()
    todayStats.value = response.data || response || todayStats.value
  } catch (e) {
    console.error('Failed to fetch today:', e)
  } finally {
    loading.today = false
  }
}

async function fetchPatientsTrend() {
  loading.patientsTrend = true
  try {
    const response = await reportsService.patients.getTrend({
      date_from: dateRange.from,
      date_to: dateRange.to,
      period: 'month'
    })
    patientsTrend.value = response.data || []
  } catch (e) {
    console.error('Failed to fetch patients trend:', e)
  } finally {
    loading.patientsTrend = false
  }
}

async function fetchCasesTrend() {
  loading.casesTrend = true
  try {
    const response = await reportsService.cases.getTrend({
      date_from: dateRange.from,
      date_to: dateRange.to,
      period: 'month'
    })
    casesTrend.value = response.data || []
  } catch (e) {
    console.error('Failed to fetch cases trend:', e)
  } finally {
    loading.casesTrend = false
  }
}

async function fetchRevenueTrend() {
  loading.revenueTrend = true
  try {
    const response = await reportsService.financial.getRevenueTrend({
      date_from: dateRange.from,
      date_to: dateRange.to,
      period: revenuePeriod.value
    })
    revenueTrend.value = response.data || []
  } catch (e) {
    console.error('Failed to fetch revenue trend:', e)
  } finally {
    loading.revenueTrend = false
  }
}

async function fetchProfitLoss() {
  loading.profitLoss = true
  try {
    const response = await reportsService.financial.getProfitLoss({
      date_from: dateRange.from,
      date_to: dateRange.to
    })
    profitLoss.value = response.data || response
  } catch (e) {
    console.error('Failed to fetch profit/loss:', e)
  } finally {
    loading.profitLoss = false
  }
}

async function fetchProfitLossTrend() {
  loading.profitLossTrend = true
  try {
    const response = await reportsService.financial.getProfitLossTrend({
      date_from: dateRange.from,
      date_to: dateRange.to,
      period: 'month'
    })
    profitLossTrend.value = response.data || []
  } catch (e) {
    console.error('Failed to fetch profit/loss trend:', e)
  } finally {
    loading.profitLossTrend = false
  }
}

async function fetchCasesByStatus() {
  loading.casesByStatus = true
  try {
    const response = await reportsService.cases.getByStatus({
      date_from: dateRange.from,
      date_to: dateRange.to
    })
    casesByStatus.value = response.data || []
  } catch (e) {
    console.error('Failed to fetch cases by status:', e)
  } finally {
    loading.casesByStatus = false
  }
}

async function fetchReservationsByStatus() {
  loading.reservationsByStatus = true
  try {
    const response = await reportsService.reservations.getByStatus({
      date_from: dateRange.from,
      date_to: dateRange.to
    })
    reservationsByStatus.value = response.data || []
  } catch (e) {
    console.error('Failed to fetch reservations by status:', e)
  } finally {
    loading.reservationsByStatus = false
  }
}

async function fetchExpensesByCategory() {
  loading.expensesByCategory = true
  try {
    const response = await reportsService.financial.getExpensesByCategory({
      date_from: dateRange.from,
      date_to: dateRange.to
    })
    expensesByCategory.value = response.data || []
  } catch (e) {
    console.error('Failed to fetch expenses by category:', e)
  } finally {
    loading.expensesByCategory = false
  }
}

async function fetchDoctorPerformance() {
  loading.doctorPerformance = true
  try {
    const response = await reportsService.financial.getDoctorPerformance({
      date_from: dateRange.from,
      date_to: dateRange.to
    })
    doctorPerformance.value = response.data || []
  } catch (e) {
    console.error('Failed to fetch doctor performance:', e)
  } finally {
    loading.doctorPerformance = false
  }
}

async function fetchAll() {
  isRefreshing.value = true
  await Promise.all([
    fetchOverview(),
    fetchToday(),
    fetchProfitLoss(),
    fetchPatientsTrend(),
    fetchCasesTrend(),
    fetchRevenueTrend(),
    fetchProfitLossTrend(),
    fetchCasesByStatus(),
    fetchReservationsByStatus(),
    fetchExpensesByCategory(),
    fetchDoctorPerformance()
  ])
  isRefreshing.value = false
}

async function refreshAll() {
  await fetchAll()
}

// Watch revenue period change
watch(revenuePeriod, () => {
  fetchRevenueTrend()
})

// Lifecycle
onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  fetchAll()
})
</script>

<style scoped>
.dashboard-container {
  background: #f8fafc;
  min-height: 100vh;
}

.dashboard-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-range-btn {
  text-transform: none;
  font-weight: 500;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

/* Quick Stats */
.quick-stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  height: 100%;
}

.quick-stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bg-primary-light { background: rgba(33, 150, 243, 0.1); }
.bg-success-light { background: rgba(76, 175, 80, 0.1); }
.bg-info-light { background: rgba(3, 169, 244, 0.1); }
.bg-warning-light { background: rgba(255, 152, 0, 0.1); }
.bg-error-light { background: rgba(244, 67, 54, 0.1); }

.quick-stat-content {
  flex: 1;
  min-width: 0;
}

.quick-stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  font-family: 'Inter', system-ui, sans-serif;
}

.quick-stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* KPI Cards */
.kpi-card {
  border-radius: 16px;
  padding: 20px;
  height: 100%;
  border: 1px solid #e5e7eb;
}

.kpi-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.kpi-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.kpi-body {
  padding-left: 56px;
}

.kpi-main-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
  font-family: 'Inter', system-ui, sans-serif;
}

.kpi-sub-value {
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 8px;
}

.kpi-breakdown {
  margin-top: 8px;
}

.kpi-breakdown-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #4b5563;
  margin-bottom: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot.male { background: #2196F3; }
.dot.female { background: #E91E63; }
.dot.paid { background: #4CAF50; }
.dot.unpaid { background: #F44336; }

.kpi-progress-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 4px;
}

/* Profit Card */
.profit-card {
  border-radius: 16px;
  padding: 20px;
  height: 100%;
  border: 1px solid #e5e7eb;
}

.profit-card-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.profit-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(76, 175, 80, 0.1);
}

.profit-card.loss .profit-icon {
  background: rgba(244, 67, 54, 0.1);
}

.profit-details {
  flex: 1;
}

.profit-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.profit-value {
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'Inter', system-ui, sans-serif;
}

.profit-margin {
  font-size: 0.8rem;
  color: #6b7280;
}

.profit-breakdown {
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
}

.profit-breakdown-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  margin-bottom: 4px;
}

/* Summary Card */
.summary-card {
  border-radius: 16px;
  padding: 20px;
  height: 100%;
  border: 1px solid #e5e7eb;
}

.summary-header {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.summary-main {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16px;
  font-family: 'Inter', system-ui, sans-serif;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.summary-item-value {
  font-size: 1.25rem;
  font-weight: 600;
  font-family: 'Inter', system-ui, sans-serif;
}

.summary-item-label {
  font-size: 0.75rem;
  color: #6b7280;
}

/* Actions Card */
.actions-card {
  border-radius: 16px;
  padding: 20px;
  height: 100%;
  border: 1px solid #e5e7eb;
}

.actions-header {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
}

.actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.action-btn {
  text-transform: none;
  font-weight: 500;
}

/* Chart Card */
.chart-card {
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  background: white;
  overflow: hidden;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
}

.chart-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #374151;
}

.chart-body {
  padding: 16px 20px;
  min-height: 200px;
}

.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #9ca3af;
  gap: 8px;
}

/* Mini Chart List */
.mini-chart-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mini-chart-item {
  display: grid;
  grid-template-columns: 60px 1fr 80px;
  align-items: center;
  gap: 12px;
}

.mini-chart-period {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.mini-chart-bar-container {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mini-chart-bar {
  height: 6px;
  border-radius: 3px;
}

.mini-chart-bar.revenue {
  background: #4CAF50;
}

.mini-chart-bar.expense {
  background: #F44336;
}

.mini-chart-value {
  font-size: 0.8rem;
  font-weight: 600;
  text-align: right;
  font-family: 'Inter', system-ui, sans-serif;
}

/* Table Card */
.table-card {
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  background: white;
  overflow: hidden;
}

.table-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
}

.table-title {
  display: flex;
  align-items: center;
  font-size: 0.95rem;
  font-weight: 600;
  color: #374151;
}

.dashboard-table {
  border: none !important;
}

.numeric-value {
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 960px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: flex-end;
  }
  
  .kpi-body {
    padding-left: 0;
    margin-top: 12px;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .quick-stat-card {
    flex-direction: column;
    text-align: center;
  }
  
  .quick-stat-value {
    font-size: 1.1rem;
  }
}
</style>
