<template>
  <v-container fluid class="app-page">
    <ReportHeader
      :title="$t('reports.overview.title')"
      :subtitle="$t('reports.overview.subtitle')"
      :period="period"
      :from="range.from"
      :to="range.to"
      :range-label="rangeLabel"
      :show-export="false"
      @update:period="setPreset"
      @update:range="({ from, to }) => setCustomRange(from, to)"
    />

    <ReportKpiRow :kpis="kpis" :currency="currency" :loading="loading.overview" />

    <RevenueExpenseChart
      :title="$t('reports.overview.revenueVsExpenses')"
      :data="trend"
      :period="trendPeriod"
      :currency="currency"
      :loading="loading.trend"
      class="mb-6"
    />

    <div class="section-title mb-3">{{ $t('reports.overview.reportCategories') }}</div>
    <v-row class="mb-6">
      <v-col v-for="card in categoryCards" :key="card.to" cols="12" sm="6" md="4" lg="3">
        <v-card variant="flat" class="category-card" @click="$router.push(card.to)">
          <div class="category-card__icon" :style="{ backgroundColor: `rgba(var(--v-theme-${card.color}), 0.1)` }">
            <v-icon :color="card.color" size="22">{{ card.icon }}</v-icon>
          </div>
          <div class="category-card__body">
            <div class="category-card__title">{{ card.title }}</div>
            <div class="category-card__desc">{{ card.description }}</div>
            <div class="category-card__value">
              <v-skeleton-loader v-if="loading.cards" type="text" width="70" />
              <span v-else>{{ card.value }}</span>
            </div>
          </div>
          <v-icon class="category-card__arrow" size="18">{{ isRtl ? 'mdi-chevron-left' : 'mdi-chevron-right' }}</v-icon>
        </v-card>
      </v-col>
    </v-row>

    <div class="section-title mb-3">{{ $t('reports.overview.clinicSummary') }}</div>
    <v-row>
      <v-col v-for="item in clinicSummaryItems" :key="item.label" cols="6" sm="3">
        <KpiCard :label="item.label" :value="item.value" :icon="item.icon" :icon-color="item.color" :loading="loading.overview" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { KpiCard } from '@/components/dashboard'
import { ReportHeader, ReportKpiRow, RevenueExpenseChart } from '@/components/reports'
import { useReportDateRange } from '@/composables/useReportDateRange'
import { useReportDoctorFilter } from '@/composables/useReportDoctorFilter'
import { useClinicSettings } from '@/composables/useClinicSettings'
import reportsService from '@/services/reports.service'
import { formatCurrency, formatNumber } from '@/utils/reportFormatters'

const { t, locale } = useI18n()
const isRtl = computed(() => locale.value === 'ar' || locale.value === 'ku')

const { period, range, rangeLabel, trendPeriod, setPreset, setCustomRange } = useReportDateRange('overview', 'month')
const { doctorParam } = useReportDoctorFilter()
const { getSettingByKey } = useClinicSettings()
const currency = computed(() => getSettingByKey('currency') || 'IQD')

const loading = reactive({ overview: false, trend: false, cards: false })
const overview = ref(null)
const trend = ref([])
const cardCounts = reactive({
  doctors: null, patients: null, cases: null, expenses: null, outstanding: null
})

const kpis = computed(() => [
  { label: t('reports.overview.revenue'), value: overview.value?.revenue, icon: 'mdi-cash-multiple', iconColor: 'success', format: 'currency' },
  { label: t('reports.overview.expenses'), value: overview.value?.expenses, icon: 'mdi-receipt-text-outline', iconColor: 'error', format: 'currency' },
  {
    label: t('reports.overview.netIncome'),
    value: overview.value?.net_income,
    icon: 'mdi-chart-line',
    iconColor: (overview.value?.net_income ?? 0) >= 0 ? 'success' : 'error',
    valueColor: (overview.value?.net_income ?? 0) >= 0 ? 'success' : 'error',
    format: 'currency'
  },
  { label: t('reports.overview.outstanding'), value: overview.value?.outstanding_balance, icon: 'mdi-cash-clock', iconColor: 'warning', format: 'currency' }
])

const clinicSummaryItems = computed(() => [
  { label: t('reports.overview.newPatients'), value: formatNumber(overview.value?.clinic_summary?.new_patients), icon: 'mdi-account-plus-outline', color: 'primary' },
  { label: t('reports.overview.newCases'), value: formatNumber(overview.value?.clinic_summary?.new_cases), icon: 'mdi-clipboard-plus-outline', color: 'info' },
  { label: t('reports.overview.appointments'), value: formatNumber(overview.value?.clinic_summary?.appointments), icon: 'mdi-calendar-check-outline', color: 'warning' },
  { label: t('reports.overview.completedCases'), value: formatNumber(overview.value?.clinic_summary?.completed_cases), icon: 'mdi-check-circle-outline', color: 'success' }
])

const categoryCards = computed(() => [
  {
    to: '/reports/doctors', icon: 'mdi-doctor', color: 'primary',
    title: t('reports.nav.doctors'), description: t('reports.overview.doctorsDesc'),
    value: cardCounts.doctors === null ? '—' : `${formatNumber(cardCounts.doctors)} ${t('reports.overview.unitDoctor')}`
  },
  {
    to: '/reports/patients', icon: 'mdi-account-cash-outline', color: 'info',
    title: t('reports.nav.patients'), description: t('reports.overview.patientsDesc'),
    value: cardCounts.patients === null ? '—' : `${formatNumber(cardCounts.patients)} ${t('reports.overview.unitPatient')}`
  },
  {
    to: '/reports/cases', icon: 'mdi-clipboard-text-multiple-outline', color: 'secondary',
    title: t('reports.nav.cases'), description: t('reports.overview.casesDesc'),
    value: cardCounts.cases === null ? '—' : `${formatNumber(cardCounts.cases)} ${t('reports.overview.unitCase')}`
  },
  {
    to: '/reports/revenue', icon: 'mdi-cash-multiple', color: 'success',
    title: t('reports.nav.revenue'), description: t('reports.overview.revenueDesc'),
    value: cardCounts.revenue === null || cardCounts.revenue === undefined ? '—' : formatCurrency(cardCounts.revenue, currency.value)
  },
  {
    to: '/reports/expenses', icon: 'mdi-cash-minus', color: 'error',
    title: t('reports.nav.expenses'), description: t('reports.overview.expensesDesc'),
    value: cardCounts.expenses === null ? '—' : formatCurrency(cardCounts.expenses, currency.value)
  },
  {
    to: '/reports/outstanding', icon: 'mdi-cash-clock', color: 'deep-orange',
    title: t('reports.nav.outstanding'), description: t('reports.overview.outstandingDesc'),
    value: cardCounts.outstanding === null ? '—' : `${formatNumber(cardCounts.outstanding)} ${t('reports.overview.unitPatient')}`
  }
])

async function fetchOverview() {
  loading.overview = true
  try {
    const res = await reportsService.overview.get({ date_from: range.from, date_to: range.to, doctor_id: doctorParam.value })
    overview.value = res.data || null
  } catch (e) {
    console.error('Failed to load reports overview:', e)
  } finally {
    loading.overview = false
  }
}

async function fetchTrend() {
  loading.trend = true
  try {
    const res = await reportsService.financial.getProfitLossTrend({ date_from: range.from, date_to: range.to, doctor_id: doctorParam.value, period: trendPeriod.value })
    trend.value = res.data || []
  } catch (e) {
    console.error('Failed to load revenue/expense trend:', e)
  } finally {
    loading.trend = false
  }
}

async function fetchCardCounts() {
  loading.cards = true
  try {
    const [doctors, patients, cases, expenses, outstanding] = await Promise.all([
      reportsService.doctors.list({ date_from: range.from, date_to: range.to, doctor_id: doctorParam.value, per_page: 1 }).catch(() => null),
      reportsService.patientAccounts.list({ date_from: range.from, date_to: range.to, doctor_id: doctorParam.value, per_page: 1 }).catch(() => null),
      reportsService.caseCategories.list({ date_from: range.from, date_to: range.to, doctor_id: doctorParam.value }).catch(() => null),
      reportsService.expenses.list({ date_from: range.from, date_to: range.to, doctor_id: doctorParam.value, per_page: 1 }).catch(() => null),
      reportsService.outstandingBalances.list({ per_page: 1, doctor_id: doctorParam.value }).catch(() => null)
    ])
    cardCounts.doctors = doctors?.summary?.doctor_count ?? 0
    cardCounts.patients = patients?.summary?.patient_count ?? 0
    cardCounts.cases = cases?.summary?.case_count ?? 0
    cardCounts.revenue = overview.value?.revenue ?? 0
    cardCounts.expenses = expenses?.summary?.total_amount ?? 0
    cardCounts.outstanding = outstanding?.summary?.patient_count ?? 0
  } catch (e) {
    console.error('Failed to load report category counts:', e)
  } finally {
    loading.cards = false
  }
}

async function refresh() {
  await fetchOverview()
  await Promise.all([fetchTrend(), fetchCardCounts()])
}

onMounted(refresh)
watch(() => [range.from, range.to, doctorParam.value], refresh)
</script>

<script>
export default { name: 'ReportsOverview' }
</script>

<style scoped>
.section-title {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
.category-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  height: 100%;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.15s;
}
.category-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.3);
}
.category-card__icon {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.category-card__body { flex: 1; min-width: 0; }
.category-card__title { font-size: 0.9rem; font-weight: 600; }
.category-card__desc { font-size: 0.72rem; color: rgba(var(--v-theme-on-surface), 0.55); margin-top: 2px; }
.category-card__value { font-size: 0.85rem; font-weight: 600; margin-top: 8px; color: rgb(var(--v-theme-primary)); }
.category-card__arrow { align-self: center; color: rgba(var(--v-theme-on-surface), 0.35); }
</style>
