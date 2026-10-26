<template>
  <v-container fluid class="app-page">
    <ReportHeader
      :title="$t('reports.doctors.title')"
      :subtitle="$t('reports.doctors.subtitle')"
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
      :search-placeholder="$t('reports.doctors.searchPlaceholder')"
      @update:search="onSearch"
    />

    <SmartTable
      :columns="columns"
      :items="rows"
      :loading="loading.table"
      :server-sort="true"
      :pagination="{ page, perPage, total }"
      :empty-text="$t('reports.common.noData')"
      :empty-subtext="$t('reports.common.noDataHint')"
      clickable
      @click:row="openDoctor"
      @sort="onSort"
      @update:page="(p) => { page = p; fetchRows() }"
      @update:per-page="(pp) => { perPage = pp; page = 1; fetchRows() }"
    >
      <template #item.total_value="{ item }">
        <span class="font-weight-medium">{{ formatCurrency(item.total_value, currency) }}</span>
      </template>
      <template #item.paid_amount="{ item }">
        <span class="text-success">{{ formatCurrency(item.paid_amount, currency) }}</span>
      </template>
      <template #item.remaining_amount="{ item }">
        <span :class="item.remaining_amount > 0 ? 'text-warning font-weight-medium' : 'text-medium-emphasis'">
          {{ formatCurrency(item.remaining_amount, currency) }}
        </span>
      </template>
      <template #item.avg_case_value="{ item }">
        {{ formatCurrency(item.avg_case_value, currency) }}
      </template>
    </SmartTable>

    <!-- Drill-down: doctor's cases -->
    <v-dialog v-model="detailOpen" max-width="900" scrollable>
      <v-card v-if="selectedDoctor">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>{{ selectedDoctor.name }}</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="detailOpen = false" />
        </v-card-title>
        <v-card-text>
          <v-progress-linear v-if="detailLoading" indeterminate class="mb-3" />
          <SmartTable
            v-else
            :columns="detailColumns"
            :items="detailRows"
            :empty-text="$t('reports.common.noData')"
            :clickable="false"
          >
            <template #item.price="{ item }">{{ formatCurrency(item.price, currency) }}</template>
            <template #item.paid_amount="{ item }">{{ formatCurrency(item.paid_amount, currency) }}</template>
            <template #item.remaining_amount="{ item }">{{ formatCurrency(item.remaining_amount, currency) }}</template>
            <template #item.case_date="{ item }">{{ formatDate(item.case_date) }}</template>
          </SmartTable>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SmartTable from '@/components/SmartTable.vue'
import { ReportHeader, ReportKpiRow, ReportSearchBar } from '@/components/reports'
import { useReportDateRange } from '@/composables/useReportDateRange'
import { useReportDoctorFilter } from '@/composables/useReportDoctorFilter'
import { useClinicSettings } from '@/composables/useClinicSettings'
import reportsService from '@/services/reports.service'
import { formatCurrency, formatNumber, formatDate } from '@/utils/reportFormatters'
import { exportReportPdf, exportReportExcel } from '@/utils/reportExport'

const { t } = useI18n()
const { period, range, rangeLabel, setPreset, setCustomRange } = useReportDateRange('doctors', 'month')
const { doctorParam } = useReportDoctorFilter()
const { getSettingByKey, clinicInfo } = useClinicSettings()
const currency = computed(() => getSettingByKey('currency') || 'IQD')

const loading = reactive({ table: false })
const rows = ref([])
const summary = ref(null)

const search = ref('')
const sortKey = ref('total_value')
const sortDir = ref('desc')
const page = ref(1)
const perPage = ref(15)
const total = ref(0)

const exportingPdf = ref(false)
const exportingExcel = ref(false)

const columns = computed(() => [
  { key: 'name', label: t('reports.doctors.col.name'), sortable: true },
  { key: 'phone', label: t('reports.doctors.col.phone') },
  { key: 'patient_count', label: t('reports.doctors.col.patients'), align: 'center' },
  { key: 'case_count', label: t('reports.doctors.col.cases'), align: 'center', sortable: true },
  { key: 'completed_count', label: t('reports.doctors.col.completed'), align: 'center' },
  { key: 'in_progress_count', label: t('reports.doctors.col.inProgress'), align: 'center' },
  { key: 'total_value', label: t('reports.doctors.col.totalValue'), align: 'end', sortable: true },
  { key: 'paid_amount', label: t('reports.doctors.col.paid'), align: 'end', sortable: true },
  { key: 'remaining_amount', label: t('reports.doctors.col.remaining'), align: 'end', sortable: true },
  { key: 'avg_case_value', label: t('reports.doctors.col.avgValue'), align: 'end' }
])

const detailColumns = computed(() => [
  { key: 'patient.name', label: t('reports.doctors.detail.patient') },
  { key: 'category', label: t('reports.doctors.detail.category') },
  { key: 'tooth_num', label: t('reports.doctors.detail.tooth') },
  { key: 'price', label: t('reports.doctors.detail.price'), align: 'end' },
  { key: 'paid_amount', label: t('reports.doctors.detail.paid'), align: 'end' },
  { key: 'remaining_amount', label: t('reports.doctors.detail.remaining'), align: 'end' },
  { key: 'case_date', label: t('reports.doctors.detail.date') }
])

const kpis = computed(() => [
  { label: t('reports.doctors.kpi.doctorCount'), value: summary.value?.doctor_count, icon: 'mdi-doctor', iconColor: 'primary' },
  { label: t('reports.doctors.kpi.caseCount'), value: summary.value?.case_count, icon: 'mdi-clipboard-text-outline', iconColor: 'info' },
  { label: t('reports.doctors.kpi.totalValue'), value: summary.value?.total_value, icon: 'mdi-cash-multiple', iconColor: 'secondary', format: 'currency' },
  { label: t('reports.doctors.kpi.paid'), value: summary.value?.paid_amount, icon: 'mdi-cash-check', iconColor: 'success', format: 'currency' }
])

async function fetchRows() {
  loading.table = true
  try {
    const res = await reportsService.doctors.list({
      date_from: range.from, date_to: range.to, doctor_id: doctorParam.value, search: search.value || undefined,
      sort: `${sortDir.value === 'desc' ? '-' : ''}${sortKey.value}`,
      page: page.value, per_page: perPage.value
    })
    rows.value = res.data || []
    summary.value = res.summary || null
    total.value = res.pagination?.total || 0
  } catch (e) {
    console.error('Failed to load doctors report:', e)
    rows.value = []
  } finally {
    loading.table = false
  }
}

function onSearch(val) {
  search.value = val
  page.value = 1
  fetchRows()
}

function onSort({ key }) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'desc' }
  fetchRows()
}

// Drill-down
const detailOpen = ref(false)
const detailLoading = ref(false)
const selectedDoctor = ref(null)
const detailRows = ref([])

async function openDoctor(row) {
  selectedDoctor.value = row
  detailOpen.value = true
  detailLoading.value = true
  try {
    const res = await reportsService.doctors.detail(row.id, { date_from: range.from, date_to: range.to, doctor_id: doctorParam.value, per_page: 50 })
    detailRows.value = res.data || []
  } catch (e) {
    console.error('Failed to load doctor detail:', e)
    detailRows.value = []
  } finally {
    detailLoading.value = false
  }
}

async function onExportPdf() {
  exportingPdf.value = true
  try {
    await exportReportPdf({
      filename: `doctors-report-${range.from}_${range.to}`,
      clinicInfo: clinicInfo.value,
      title: t('reports.doctors.title'),
      periodLabel: rangeLabel.value,
      kpis: kpis.value.map((k) => ({ label: k.label, value: k.format === 'currency' ? formatCurrency(k.value, currency.value) : formatNumber(k.value) })),
      columns: [
        { key: 'name', label: t('reports.doctors.col.name') },
        { key: 'case_count', label: t('reports.doctors.col.cases') },
        { key: 'total_value', label: t('reports.doctors.col.totalValue') },
        { key: 'paid_amount', label: t('reports.doctors.col.paid') },
        { key: 'remaining_amount', label: t('reports.doctors.col.remaining') }
      ],
      rows: rows.value.map((r) => ({
        name: r.name, case_count: formatNumber(r.case_count),
        total_value: formatCurrency(r.total_value, currency.value),
        paid_amount: formatCurrency(r.paid_amount, currency.value),
        remaining_amount: formatCurrency(r.remaining_amount, currency.value)
      })),
      totals: [
        { label: t('reports.doctors.kpi.totalValue'), value: formatCurrency(summary.value?.total_value, currency.value) },
        { label: t('reports.doctors.kpi.paid'), value: formatCurrency(summary.value?.paid_amount, currency.value) }
      ]
    })
  } finally {
    exportingPdf.value = false
  }
}

async function onExportExcel() {
  exportingExcel.value = true
  try {
    const allRows = await fetchAllRowsForExport()
    await exportReportExcel({
      filename: `doctors-report-${range.from}_${range.to}`,
      sheetName: t('reports.doctors.title'),
      columns: [
        { key: 'name', header: t('reports.doctors.col.name'), width: 26 },
        { key: 'phone', header: t('reports.doctors.col.phone'), width: 16 },
        { key: 'patient_count', header: t('reports.doctors.col.patients'), width: 12 },
        { key: 'case_count', header: t('reports.doctors.col.cases'), width: 12 },
        { key: 'completed_count', header: t('reports.doctors.col.completed'), width: 12 },
        { key: 'total_value', header: t('reports.doctors.col.totalValue'), width: 16 },
        { key: 'paid_amount', header: t('reports.doctors.col.paid'), width: 16 },
        { key: 'remaining_amount', header: t('reports.doctors.col.remaining'), width: 16 }
      ],
      rows: allRows,
      totalsRow: {
        name: t('reports.common.total'),
        case_count: summary.value?.case_count,
        total_value: summary.value?.total_value,
        paid_amount: summary.value?.paid_amount,
        remaining_amount: summary.value?.remaining_amount
      }
    })
  } finally {
    exportingExcel.value = false
  }
}

// Export must include ALL filtered records, not just the current page.
async function fetchAllRowsForExport() {
  const res = await reportsService.doctors.list({
    date_from: range.from, date_to: range.to, doctor_id: doctorParam.value, search: search.value || undefined,
    sort: `${sortDir.value === 'desc' ? '-' : ''}${sortKey.value}`,
    page: 1, per_page: 1000
  })
  return res.data || []
}

onMounted(fetchRows)
watch(() => [range.from, range.to, doctorParam.value], () => { page.value = 1; fetchRows() })
</script>

<script>
export default { name: 'DoctorsReport' }
</script>
