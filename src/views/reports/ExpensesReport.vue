<template>
  <v-container fluid class="app-page">
    <ReportHeader
      :title="$t('reports.expenses.title')"
      :subtitle="$t('reports.expenses.subtitle')"
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

    <v-row class="mb-6">
      <v-col cols="12" md="6">
        <BarChart
          :title="$t('reports.expenses.byCategory')"
          :data="byCategory"
          label-key="category_name"
          value-key="total_amount"
          :horizontal="true"
          color="#FC8181"
          :loading="loading.charts"
        />
      </v-col>
      <v-col cols="12" md="6">
        <TrendChart
          :title="$t('reports.expenses.overTime')"
          :data="trend"
          label-key="period"
          value-key="total"
          type="area"
          color="#E53E3E"
          :period="trendPeriod"
          :loading="loading.charts"
          :format-value="(v) => formatCurrency(v, currency)"
        />
      </v-col>
    </v-row>

    <ReportSearchBar
      :search="search"
      :search-placeholder="$t('reports.expenses.searchPlaceholder')"
      :filters="[{ key: 'category', label: $t('reports.expenses.categoryFilter'), modelValue: categoryId, items: categoryItems }]"
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
      :clickable="false"
      @update:page="(p) => { page = p; fetchRows() }"
      @update:per-page="(pp) => { perPage = pp; page = 1; fetchRows() }"
    >
      <template #item.date="{ item }">{{ formatDate(item.date) }}</template>
      <template #item.amount="{ item }"><span class="font-weight-medium">{{ formatCurrency(item.amount, currency) }}</span></template>
    </SmartTable>

    <div class="text-end text-subtitle-2 font-weight-bold mt-3">
      {{ $t('reports.expenses.total') }}: {{ formatCurrency(summary?.total_amount, currency) }}
    </div>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SmartTable from '@/components/SmartTable.vue'
import { BarChart, TrendChart } from '@/components/dashboard'
import { ReportHeader, ReportKpiRow, ReportSearchBar } from '@/components/reports'
import { useReportDateRange } from '@/composables/useReportDateRange'
import { useReportDoctorFilter } from '@/composables/useReportDoctorFilter'
import { useClinicSettings } from '@/composables/useClinicSettings'
import reportsService from '@/services/reports.service'
import expenseService from '@/services/expense.service'
import { formatCurrency, formatNumber, formatDate } from '@/utils/reportFormatters'
import { exportReportPdf, exportReportExcel } from '@/utils/reportExport'

const { t } = useI18n()
const { period, range, rangeLabel, trendPeriod, setPreset, setCustomRange } = useReportDateRange('expenses', 'month')
const { doctorParam } = useReportDoctorFilter()
const { getSettingByKey, clinicInfo } = useClinicSettings()
const currency = computed(() => getSettingByKey('currency') || 'IQD')

const loading = reactive({ table: false, charts: false })
const rows = ref([])
const summary = ref(null)
const byCategory = ref([])
const trend = ref([])
const categories = ref([])
const search = ref('')
const categoryId = ref(null)
const page = ref(1)
const perPage = ref(15)
const total = ref(0)
const exportingPdf = ref(false)
const exportingExcel = ref(false)

const categoryItems = computed(() => [
  { label: t('reports.expenses.allCategories'), value: null },
  ...categories.value.map((c) => ({ label: c.name, value: c.id }))
])

const columns = computed(() => [
  { key: 'date', label: t('reports.expenses.col.date') },
  { key: 'category', label: t('reports.expenses.col.category') },
  { key: 'name', label: t('reports.expenses.col.description') },
  { key: 'amount', label: t('reports.expenses.col.amount'), align: 'end' },
  { key: 'creator', label: t('reports.expenses.col.addedBy') }
])

const topCategory = computed(() => (byCategory.value.length ? [...byCategory.value].sort((a, b) => b.total_amount - a.total_amount)[0] : null))

const kpis = computed(() => [
  { label: t('reports.expenses.kpi.total'), value: summary.value?.total_amount, icon: 'mdi-cash-minus', iconColor: 'error', format: 'currency' },
  { label: t('reports.expenses.kpi.count'), value: summary.value?.expense_count, icon: 'mdi-receipt-text-outline', iconColor: 'primary' },
  { label: t('reports.expenses.kpi.avg'), value: summary.value?.avg_amount, icon: 'mdi-calculator-variant-outline', iconColor: 'info', format: 'currency' },
  { label: t('reports.expenses.kpi.topCategory'), value: topCategory.value?.category_name || '—', icon: 'mdi-star-outline', iconColor: 'warning', format: 'text' }
])

async function fetchCategories() {
  try {
    categories.value = await expenseService.getActiveCategories()
  } catch (e) {
    console.error('Failed to load expense categories:', e)
  }
}

async function fetchRows() {
  loading.table = true
  try {
    const res = await reportsService.expenses.list({
      date_from: range.from, date_to: range.to, doctor_id: doctorParam.value, search: search.value || undefined,
      category_id: categoryId.value || undefined, page: page.value, per_page: perPage.value
    })
    rows.value = res.data || []
    summary.value = res.summary || null
    total.value = res.pagination?.total || 0
  } catch (e) {
    console.error('Failed to load expenses report:', e)
    rows.value = []
  } finally {
    loading.table = false
  }
}

async function fetchCharts() {
  loading.charts = true
  try {
    const [cat, trendRes] = await Promise.all([
      reportsService.financial.getExpensesByCategory({ date_from: range.from, date_to: range.to, doctor_id: doctorParam.value }),
      reportsService.financial.getExpensesTrend({ date_from: range.from, date_to: range.to, doctor_id: doctorParam.value, period: trendPeriod.value })
    ])
    byCategory.value = cat.data || []
    trend.value = trendRes.data || []
  } catch (e) {
    console.error('Failed to load expense charts:', e)
  } finally {
    loading.charts = false
  }
}

function onSearch(val) { search.value = val; page.value = 1; fetchRows() }
function onFilter({ value }) { categoryId.value = value; page.value = 1; fetchRows() }

async function onExportPdf() {
  exportingPdf.value = true
  try {
    await exportReportPdf({
      filename: `expenses-report-${range.from}_${range.to}`,
      clinicInfo: clinicInfo.value,
      title: t('reports.expenses.title'),
      periodLabel: rangeLabel.value,
      kpis: kpis.value.map((k) => ({ label: k.label, value: k.format === 'currency' ? formatCurrency(k.value, currency.value) : formatNumber(k.value) })),
      columns: [
        { key: 'date', label: t('reports.expenses.col.date') },
        { key: 'category', label: t('reports.expenses.col.category') },
        { key: 'name', label: t('reports.expenses.col.description') },
        { key: 'amount', label: t('reports.expenses.col.amount') }
      ],
      rows: rows.value.map((r) => ({ date: formatDate(r.date), category: r.category, name: r.name, amount: formatCurrency(r.amount, currency.value) })),
      totals: [{ label: t('reports.expenses.kpi.total'), value: formatCurrency(summary.value?.total_amount, currency.value) }]
    })
  } finally {
    exportingPdf.value = false
  }
}

async function onExportExcel() {
  exportingExcel.value = true
  try {
    const res = await reportsService.expenses.list({
      date_from: range.from, date_to: range.to, doctor_id: doctorParam.value, search: search.value || undefined,
      category_id: categoryId.value || undefined, page: 1, per_page: 2000
    })
    await exportReportExcel({
      filename: `expenses-report-${range.from}_${range.to}`,
      sheetName: t('reports.expenses.title'),
      columns: [
        { key: 'date', header: t('reports.expenses.col.date'), width: 14 },
        { key: 'category', header: t('reports.expenses.col.category'), width: 20 },
        { key: 'name', header: t('reports.expenses.col.description'), width: 26 },
        { key: 'amount', header: t('reports.expenses.col.amount'), width: 16 },
        { key: 'creator', header: t('reports.expenses.col.addedBy'), width: 18 }
      ],
      rows: res.data || [],
      totalsRow: { name: t('reports.common.total'), amount: summary.value?.total_amount }
    })
  } finally {
    exportingExcel.value = false
  }
}

onMounted(() => { fetchCategories(); fetchRows(); fetchCharts() })
watch(() => [range.from, range.to, doctorParam.value], () => { page.value = 1; fetchRows(); fetchCharts() })
</script>

<script>
export default { name: 'ExpensesReport' }
</script>
