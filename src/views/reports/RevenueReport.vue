<template>
  <v-container fluid class="app-page">
    <ReportHeader
      :title="$t('reports.revenue.title')"
      :subtitle="$t('reports.revenue.subtitle')"
      :period="period"
      :from="range.from"
      :to="range.to"
      :range-label="rangeLabel"
      :exporting-pdf="exportingPdf"
      :exporting-excel="exportingExcel"
      :disable-export="!rows.length"
      @update:period="setPreset"
      @update:range="({ from, to }) => setCustomRange(from, to)"
      @export-pdf="onExportPdf"
      @export-excel="onExportExcel"
    />

    <ReportKpiRow :kpis="kpis" :currency="currency" :loading="loading.kpi" />

    <v-row class="mb-4">
      <v-col cols="6" sm="3">
        <KpiCard :label="$t('reports.revenue.kpi.paymentCount')" :value="paymentsSummary?.payment_count" icon="mdi-receipt-outline" icon-color="info" :loading="loading.table" />
      </v-col>
      <v-col cols="6" sm="3">
        <KpiCard :label="$t('reports.revenue.kpi.avgPayment')" :value="paymentsSummary?.avg_payment" icon="mdi-cash" icon-color="secondary" format="currency" :currency="currency" :loading="loading.table" />
      </v-col>
    </v-row>

    <TrendChart
      :title="$t('reports.revenue.trend')"
      :data="trend"
      label-key="period"
      value-key="total"
      type="area"
      color="#38A169"
      :period="trendPeriod"
      :loading="loading.trend"
      :format-value="(v) => formatCurrency(v, currency)"
      class="mb-6"
    />

    <ReportSearchBar
      :search="search"
      :search-placeholder="$t('reports.revenue.searchPlaceholder')"
      @update:search="onSearch"
    />

    <SmartTable
      :columns="columns"
      :items="rows"
      :loading="loading.table"
      :pagination="{ page, perPage, total }"
      :empty-text="$t('reports.common.noData')"
      :empty-subtext="$t('reports.common.noDataHint')"
      :clickable="false"
      @update:page="(p) => { page = p; fetchRows() }"
      @update:per-page="(pp) => { perPage = pp; page = 1; fetchRows() }"
    >
      <template #item.payment_date="{ item }">{{ formatDate(item.payment_date) }}</template>
      <template #item.patient="{ item }">{{ item.patient?.name || '—' }}</template>
      <template #item.doctor="{ item }">{{ item.doctor?.name || '—' }}</template>
      <template #item.case_price="{ item }">{{ formatCurrency(item.case_price, currency) }}</template>
      <template #item.payment_amount="{ item }"><span class="text-success">{{ formatCurrency(item.payment_amount, currency) }}</span></template>
      <template #item.remaining_amount="{ item }">
        <span :class="item.remaining_amount > 0 ? 'text-warning' : 'text-medium-emphasis'">{{ formatCurrency(item.remaining_amount, currency) }}</span>
      </template>
    </SmartTable>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SmartTable from '@/components/SmartTable.vue'
import { KpiCard, TrendChart } from '@/components/dashboard'
import { ReportHeader, ReportKpiRow, ReportSearchBar } from '@/components/reports'
import { useReportDateRange } from '@/composables/useReportDateRange'
import { useReportDoctorFilter } from '@/composables/useReportDoctorFilter'
import { useClinicSettings } from '@/composables/useClinicSettings'
import reportsService from '@/services/reports.service'
import { formatCurrency, formatNumber, formatDate } from '@/utils/reportFormatters'
import { exportReportPdf, exportReportExcel } from '@/utils/reportExport'

const { t } = useI18n()
const { period, range, rangeLabel, trendPeriod, setPreset, setCustomRange } = useReportDateRange('revenue', 'month')
const { doctorParam } = useReportDoctorFilter()
const { getSettingByKey, clinicInfo } = useClinicSettings()
const currency = computed(() => getSettingByKey('currency') || 'IQD')

const loading = reactive({ kpi: false, table: false, trend: false })
const rows = ref([])
const paymentsSummary = ref(null)
const billsSummary = ref(null)
const caseSummary = ref(null)
const outstandingTotal = ref(null)
const trend = ref([])
const search = ref('')
const page = ref(1)
const perPage = ref(15)
const total = ref(0)
const exportingPdf = ref(false)
const exportingExcel = ref(false)

const columns = computed(() => [
  { key: 'payment_date', label: t('reports.revenue.col.date') },
  { key: 'patient', label: t('reports.revenue.col.patient') },
  { key: 'doctor', label: t('reports.revenue.col.doctor') },
  { key: 'case_category', label: t('reports.revenue.col.case') },
  { key: 'case_price', label: t('reports.revenue.col.caseValue'), align: 'end' },
  { key: 'payment_amount', label: t('reports.revenue.col.payment'), align: 'end' },
  { key: 'remaining_amount', label: t('reports.revenue.col.remaining'), align: 'end' }
])

const kpis = computed(() => [
  { label: t('reports.revenue.kpi.caseValue'), value: caseSummary.value?.total_value, icon: 'mdi-clipboard-text-outline', iconColor: 'secondary', format: 'currency' },
  { label: t('reports.revenue.kpi.collected'), value: billsSummary.value?.total_revenue, icon: 'mdi-cash-multiple', iconColor: 'success', format: 'currency' },
  { label: t('reports.revenue.kpi.remaining'), value: outstandingTotal.value, icon: 'mdi-cash-clock', iconColor: 'warning', format: 'currency' }
])

async function fetchKpis() {
  loading.kpi = true
  try {
    const [bills, cases, outstanding] = await Promise.all([
      reportsService.financial.getBillsSummary({ date_from: range.from, date_to: range.to, doctor_id: doctorParam.value }),
      reportsService.cases.getSummary({ date_from: range.from, date_to: range.to, doctor_id: doctorParam.value }),
      reportsService.outstandingBalances.list({ per_page: 1, doctor_id: doctorParam.value })
    ])
    billsSummary.value = bills.data || null
    caseSummary.value = cases.data || null
    outstandingTotal.value = outstanding.summary?.unpaid_amount ?? 0
  } catch (e) {
    console.error('Failed to load revenue KPIs:', e)
  } finally {
    loading.kpi = false
  }
}

async function fetchTrend() {
  loading.trend = true
  try {
    const res = await reportsService.financial.getRevenueTrend({ date_from: range.from, date_to: range.to, doctor_id: doctorParam.value, period: trendPeriod.value })
    trend.value = res.data || []
  } catch (e) {
    console.error('Failed to load revenue trend:', e)
  } finally {
    loading.trend = false
  }
}

async function fetchRows() {
  loading.table = true
  try {
    const res = await reportsService.revenue.payments({
      date_from: range.from, date_to: range.to, doctor_id: doctorParam.value, search: search.value || undefined,
      page: page.value, per_page: perPage.value
    })
    rows.value = res.data || []
    paymentsSummary.value = res.summary || null
    total.value = res.pagination?.total || 0
  } catch (e) {
    console.error('Failed to load revenue payments:', e)
    rows.value = []
  } finally {
    loading.table = false
  }
}

function onSearch(val) { search.value = val; page.value = 1; fetchRows() }

async function onExportPdf() {
  exportingPdf.value = true
  try {
    await exportReportPdf({
      filename: `revenue-payments-${range.from}_${range.to}`,
      clinicInfo: clinicInfo.value,
      title: t('reports.revenue.title'),
      periodLabel: rangeLabel.value,
      kpis: kpis.value.map((k) => ({ label: k.label, value: formatCurrency(k.value, currency.value) })),
      columns: [
        { key: 'payment_date', label: t('reports.revenue.col.date') },
        { key: 'patient', label: t('reports.revenue.col.patient') },
        { key: 'payment_amount', label: t('reports.revenue.col.payment') }
      ],
      rows: rows.value.map((r) => ({
        payment_date: formatDate(r.payment_date), patient: r.patient?.name,
        payment_amount: formatCurrency(r.payment_amount, currency.value)
      })),
      totals: [{ label: t('reports.revenue.kpi.collected'), value: formatCurrency(paymentsSummary.value?.paid_amount, currency.value) }]
    })
  } finally {
    exportingPdf.value = false
  }
}

async function onExportExcel() {
  exportingExcel.value = true
  try {
    const res = await reportsService.revenue.payments({ date_from: range.from, date_to: range.to, doctor_id: doctorParam.value, search: search.value || undefined, page: 1, per_page: 2000 })
    await exportReportExcel({
      filename: `revenue-payments-${range.from}_${range.to}`,
      sheetName: t('reports.revenue.title'),
      columns: [
        { key: 'payment_date', header: t('reports.revenue.col.date'), width: 14 },
        { key: 'patient_name', header: t('reports.revenue.col.patient'), width: 24 },
        { key: 'doctor_name', header: t('reports.revenue.col.doctor'), width: 20 },
        { key: 'case_category', header: t('reports.revenue.col.case'), width: 18 },
        { key: 'case_price', header: t('reports.revenue.col.caseValue'), width: 16 },
        { key: 'payment_amount', header: t('reports.revenue.col.payment'), width: 16 },
        { key: 'remaining_amount', header: t('reports.revenue.col.remaining'), width: 16 }
      ],
      rows: (res.data || []).map((r) => ({
        payment_date: r.payment_date, patient_name: r.patient?.name, doctor_name: r.doctor?.name,
        case_category: r.case_category, case_price: r.case_price, payment_amount: r.payment_amount,
        remaining_amount: r.remaining_amount
      })),
      totalsRow: { patient_name: t('reports.common.total'), payment_amount: paymentsSummary.value?.paid_amount }
    })
  } finally {
    exportingExcel.value = false
  }
}

onMounted(() => { fetchKpis(); fetchTrend(); fetchRows() })
watch(() => [range.from, range.to, doctorParam.value], () => { page.value = 1; fetchKpis(); fetchTrend(); fetchRows() })
</script>

<script>
export default { name: 'RevenueReport' }
</script>
