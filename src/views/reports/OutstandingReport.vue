<template>
  <v-container fluid class="app-page">
    <ReportHeader
      :title="$t('reports.outstanding.title')"
      :subtitle="$t('reports.outstanding.subtitle')"
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

    <ReportKpiRow :kpis="kpis" :currency="currency" :loading="loading.table" />

    <ReportSearchBar
      :search="search"
      :search-placeholder="$t('reports.outstanding.searchPlaceholder')"
      :filters="[{ key: 'range', label: $t('reports.outstanding.rangeFilter'), modelValue: balanceRange, items: rangeItems }]"
      @update:search="onSearch"
      @update:filter="onFilter"
    />

    <SmartTable
      :columns="columns"
      :items="rows"
      :loading="loading.table"
      :pagination="{ page, perPage, total }"
      :empty-text="$t('reports.common.noData')"
      :empty-subtext="$t('reports.common.noDataHint')"
      clickable
      @click:row="openPatient"
      @update:page="(p) => { page = p; fetchRows() }"
      @update:per-page="(pp) => { perPage = pp; page = 1; fetchRows() }"
    >
      <template #item.total_price="{ item }">{{ formatCurrency(item.total_price, currency) }}</template>
      <template #item.paid_amount="{ item }"><span class="text-success">{{ formatCurrency(item.paid_amount, currency) }}</span></template>
      <template #item.unpaid_amount="{ item }"><span class="text-warning font-weight-medium">{{ formatCurrency(item.unpaid_amount, currency) }}</span></template>
      <template #item.last_payment_at="{ item }">{{ formatDate(item.last_payment_at) }}</template>
      <template #item.last_visit_at="{ item }">{{ formatDate(item.last_visit_at) }}</template>
    </SmartTable>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import SmartTable from '@/components/SmartTable.vue'
import { ReportHeader, ReportKpiRow, ReportSearchBar } from '@/components/reports'
import { useReportDateRange } from '@/composables/useReportDateRange'
import { useReportDoctorFilter } from '@/composables/useReportDoctorFilter'
import { useClinicSettings } from '@/composables/useClinicSettings'
import reportsService from '@/services/reports.service'
import { formatCurrency, formatNumber, formatDate } from '@/utils/reportFormatters'
import { exportReportPdf, exportReportExcel } from '@/utils/reportExport'

const { t } = useI18n()
const router = useRouter()
// Outstanding balances is a live snapshot of who currently owes money, not a
// period-bound report — the date filter is kept for header consistency and
// export metadata only, matching the "sorted highest first" nature of the page.
const { period, range, rangeLabel, setPreset, setCustomRange } = useReportDateRange('outstanding', 'month')
const { doctorParam } = useReportDoctorFilter()
const { getSettingByKey, clinicInfo } = useClinicSettings()
const currency = computed(() => getSettingByKey('currency') || 'IQD')

const loading = reactive({ table: false })
const rows = ref([])
const summary = ref(null)
const search = ref('')
const balanceRange = ref(null)
const page = ref(1)
const perPage = ref(15)
const total = ref(0)
const exportingPdf = ref(false)
const exportingExcel = ref(false)

const rangeItems = computed(() => [
  { label: t('reports.outstanding.rangeAll'), value: null },
  { label: t('reports.outstanding.rangeUnder100k'), value: 'under100k' },
  { label: t('reports.outstanding.range100to500k'), value: '100to500k' },
  { label: t('reports.outstanding.rangeOver500k'), value: 'over500k' }
])

function rangeParams() {
  if (balanceRange.value === 'under100k') return { balance_max: 100000 }
  if (balanceRange.value === '100to500k') return { balance_min: 100000, balance_max: 500000 }
  if (balanceRange.value === 'over500k') return { balance_min: 500000 }
  return {}
}

const columns = computed(() => [
  { key: 'name', label: t('reports.outstanding.col.name') },
  { key: 'phone', label: t('reports.outstanding.col.phone') },
  { key: 'unpaid_case_count', label: t('reports.outstanding.col.unpaidCases'), align: 'center' },
  { key: 'total_price', label: t('reports.outstanding.col.total'), align: 'end' },
  { key: 'paid_amount', label: t('reports.outstanding.col.paid'), align: 'end' },
  { key: 'unpaid_amount', label: t('reports.outstanding.col.remaining'), align: 'end' },
  { key: 'last_payment_at', label: t('reports.outstanding.col.lastPayment') },
  { key: 'last_visit_at', label: t('reports.outstanding.col.lastVisit') }
])

const kpis = computed(() => {
  const count = summary.value?.patient_count || 0
  const totalUnpaid = summary.value?.unpaid_amount || 0
  return [
    { label: t('reports.outstanding.kpi.patientCount'), value: count, icon: 'mdi-account-alert-outline', iconColor: 'warning' },
    { label: t('reports.outstanding.kpi.totalRemaining'), value: totalUnpaid, icon: 'mdi-cash-clock', iconColor: 'error', format: 'currency' },
    { label: t('reports.outstanding.kpi.avgRemaining'), value: count > 0 ? Math.round(totalUnpaid / count) : 0, icon: 'mdi-calculator-variant-outline', iconColor: 'info', format: 'currency' },
    { label: t('reports.outstanding.kpi.maxRemaining'), value: rows.value[0]?.unpaid_amount || 0, icon: 'mdi-trending-up', iconColor: 'deep-orange', format: 'currency' }
  ]
})

async function fetchRows() {
  loading.table = true
  try {
    const res = await reportsService.outstandingBalances.list({
      search: search.value || undefined, sort: '-unpaid_amount', doctor_id: doctorParam.value,
      ...rangeParams(), page: page.value, per_page: perPage.value
    })
    rows.value = res.data || []
    summary.value = res.summary || null
    total.value = res.pagination?.total || 0
  } catch (e) {
    console.error('Failed to load outstanding balances:', e)
    rows.value = []
  } finally {
    loading.table = false
  }
}

function onSearch(val) { search.value = val; page.value = 1; fetchRows() }
function openPatient(row) { if (row?.id) router.push({ name: 'PatientDetail', params: { id: row.id } }) }
function onFilter({ value }) { balanceRange.value = value; page.value = 1; fetchRows() }

async function onExportPdf() {
  exportingPdf.value = true
  try {
    await exportReportPdf({
      filename: `outstanding-balances-${range.from}_${range.to}`,
      clinicInfo: clinicInfo.value,
      title: t('reports.outstanding.title'),
      periodLabel: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      kpis: kpis.value.map((k) => ({ label: k.label, value: k.format === 'currency' ? formatCurrency(k.value, currency.value) : formatNumber(k.value) })),
      columns: [
        { key: 'name', label: t('reports.outstanding.col.name') },
        { key: 'total_price', label: t('reports.outstanding.col.total') },
        { key: 'unpaid_amount', label: t('reports.outstanding.col.remaining') }
      ],
      rows: rows.value.map((r) => ({ name: r.name, total_price: formatCurrency(r.total_price, currency.value), unpaid_amount: formatCurrency(r.unpaid_amount, currency.value) })),
      totals: [{ label: t('reports.outstanding.kpi.totalRemaining'), value: formatCurrency(summary.value?.unpaid_amount, currency.value) }]
    })
  } finally {
    exportingPdf.value = false
  }
}

async function onExportExcel() {
  exportingExcel.value = true
  try {
    const res = await reportsService.outstandingBalances.list({ search: search.value || undefined, sort: '-unpaid_amount', doctor_id: doctorParam.value, ...rangeParams(), page: 1, per_page: 2000 })
    await exportReportExcel({
      filename: `outstanding-balances-${range.from}_${range.to}`,
      sheetName: t('reports.outstanding.title'),
      columns: [
        { key: 'name', header: t('reports.outstanding.col.name'), width: 26 },
        { key: 'phone', header: t('reports.outstanding.col.phone'), width: 16 },
        { key: 'unpaid_case_count', header: t('reports.outstanding.col.unpaidCases'), width: 12 },
        { key: 'total_price', header: t('reports.outstanding.col.total'), width: 16 },
        { key: 'paid_amount', header: t('reports.outstanding.col.paid'), width: 16 },
        { key: 'unpaid_amount', header: t('reports.outstanding.col.remaining'), width: 16 }
      ],
      rows: res.data || [],
      totalsRow: { name: t('reports.common.total'), unpaid_amount: summary.value?.unpaid_amount, paid_amount: summary.value?.paid_amount, total_price: summary.value?.total_price }
    })
  } finally {
    exportingExcel.value = false
  }
}

onMounted(fetchRows)
watch(() => [range.from, range.to, doctorParam.value], () => { page.value = 1; fetchRows() })
</script>

<script>
export default { name: 'OutstandingReport' }
</script>
