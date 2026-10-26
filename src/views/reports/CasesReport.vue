<template>
  <v-container fluid class="app-page">
    <ReportHeader
      :title="$t('reports.cases.title')"
      :subtitle="$t('reports.cases.subtitle')"
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

    <SmartTable
      :columns="columns"
      :items="rows"
      :loading="loading.table"
      :empty-text="$t('reports.common.noData')"
      :empty-subtext="$t('reports.common.noDataHint')"
      clickable
      @click:row="openCategory"
    >
      <template #item.total_value="{ item }">{{ formatCurrency(item.total_value, currency) }}</template>
      <template #item.paid_amount="{ item }"><span class="text-success">{{ formatCurrency(item.paid_amount, currency) }}</span></template>
      <template #item.remaining_amount="{ item }">
        <span :class="item.remaining_amount > 0 ? 'text-warning font-weight-medium' : 'text-medium-emphasis'">
          {{ formatCurrency(item.remaining_amount, currency) }}
        </span>
      </template>
      <template #item.avg_price="{ item }">{{ formatCurrency(item.avg_price, currency) }}</template>
      <template #item.percentage="{ item }">{{ formatPercent(item.percentage) }}</template>
    </SmartTable>

    <!-- Drill-down: cases within a category -->
    <v-dialog v-model="detailOpen" max-width="900" scrollable>
      <v-card v-if="selectedCategory">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>{{ selectedCategory.category_name }}</span>
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
import { ReportHeader } from '@/components/reports'
import { useReportDateRange } from '@/composables/useReportDateRange'
import { useReportDoctorFilter } from '@/composables/useReportDoctorFilter'
import { useClinicSettings } from '@/composables/useClinicSettings'
import reportsService from '@/services/reports.service'
import { formatCurrency, formatNumber, formatDate, formatPercent } from '@/utils/reportFormatters'
import { exportReportPdf, exportReportExcel } from '@/utils/reportExport'

const { t } = useI18n()
const { period, range, rangeLabel, setPreset, setCustomRange } = useReportDateRange('cases', 'month')
const { doctorParam } = useReportDoctorFilter()
const { getSettingByKey, clinicInfo } = useClinicSettings()
const currency = computed(() => getSettingByKey('currency') || 'IQD')

const loading = reactive({ table: false })
const rows = ref([])
const summary = ref(null)
const exportingPdf = ref(false)
const exportingExcel = ref(false)

const columns = computed(() => [
  { key: 'category_name', label: t('reports.cases.col.type'), sortable: true },
  { key: 'case_count', label: t('reports.cases.col.cases'), align: 'center', sortable: true },
  { key: 'patient_count', label: t('reports.cases.col.patients'), align: 'center' },
  { key: 'doctor_count', label: t('reports.cases.col.doctors'), align: 'center' },
  { key: 'total_value', label: t('reports.cases.col.totalValue'), align: 'end', sortable: true },
  { key: 'paid_amount', label: t('reports.cases.col.paid'), align: 'end' },
  { key: 'remaining_amount', label: t('reports.cases.col.remaining'), align: 'end' },
  { key: 'avg_price', label: t('reports.cases.col.avgPrice'), align: 'end' },
  { key: 'percentage', label: t('reports.cases.col.percentage'), align: 'end' }
])

const detailColumns = computed(() => [
  { key: 'patient.name', label: t('reports.cases.detail.patient') },
  { key: 'doctor.name', label: t('reports.cases.detail.doctor') },
  { key: 'tooth_num', label: t('reports.cases.detail.tooth') },
  { key: 'price', label: t('reports.cases.detail.price'), align: 'end' },
  { key: 'paid_amount', label: t('reports.cases.detail.paid'), align: 'end' },
  { key: 'remaining_amount', label: t('reports.cases.detail.remaining'), align: 'end' },
  { key: 'case_date', label: t('reports.cases.detail.date') }
])

const kpis = computed(() => [
  { label: t('reports.cases.kpi.total'), value: summary.value?.case_count, icon: 'mdi-clipboard-text-outline', iconColor: 'primary' },
  { label: t('reports.cases.kpi.types'), value: summary.value?.category_count, icon: 'mdi-shape-outline', iconColor: 'secondary' },
  { label: t('reports.cases.kpi.totalValue'), value: summary.value?.total_value, icon: 'mdi-cash-multiple', iconColor: 'info', format: 'currency' },
  { label: t('reports.cases.kpi.remaining'), value: summary.value?.remaining_amount, icon: 'mdi-cash-clock', iconColor: 'warning', format: 'currency' }
])

async function fetchRows() {
  loading.table = true
  try {
    const res = await reportsService.caseCategories.list({ date_from: range.from, date_to: range.to, doctor_id: doctorParam.value })
    rows.value = res.data || []
    summary.value = res.summary || null
  } catch (e) {
    console.error('Failed to load cases report:', e)
    rows.value = []
  } finally {
    loading.table = false
  }
}

const detailOpen = ref(false)
const detailLoading = ref(false)
const selectedCategory = ref(null)
const detailRows = ref([])

async function openCategory(row) {
  selectedCategory.value = row
  detailOpen.value = true
  detailLoading.value = true
  try {
    const res = await reportsService.caseCategories.detail(row.category_id, { date_from: range.from, date_to: range.to, doctor_id: doctorParam.value, per_page: 50 })
    detailRows.value = res.data || []
  } catch (e) {
    console.error('Failed to load category detail:', e)
    detailRows.value = []
  } finally {
    detailLoading.value = false
  }
}

async function onExportPdf() {
  exportingPdf.value = true
  try {
    await exportReportPdf({
      filename: `cases-by-category-${range.from}_${range.to}`,
      clinicInfo: clinicInfo.value,
      title: t('reports.cases.title'),
      periodLabel: rangeLabel.value,
      kpis: kpis.value.map((k) => ({ label: k.label, value: k.format === 'currency' ? formatCurrency(k.value, currency.value) : formatNumber(k.value) })),
      columns: [
        { key: 'category_name', label: t('reports.cases.col.type') },
        { key: 'case_count', label: t('reports.cases.col.cases') },
        { key: 'total_value', label: t('reports.cases.col.totalValue') },
        { key: 'remaining_amount', label: t('reports.cases.col.remaining') },
        { key: 'percentage', label: t('reports.cases.col.percentage') }
      ],
      rows: rows.value.map((r) => ({
        category_name: r.category_name, case_count: formatNumber(r.case_count),
        total_value: formatCurrency(r.total_value, currency.value),
        remaining_amount: formatCurrency(r.remaining_amount, currency.value),
        percentage: formatPercent(r.percentage)
      })),
      totals: [
        { label: t('reports.cases.kpi.totalValue'), value: formatCurrency(summary.value?.total_value, currency.value) },
        { label: t('reports.cases.kpi.remaining'), value: formatCurrency(summary.value?.remaining_amount, currency.value) }
      ]
    })
  } finally {
    exportingPdf.value = false
  }
}

async function onExportExcel() {
  exportingExcel.value = true
  try {
    await exportReportExcel({
      filename: `cases-by-category-${range.from}_${range.to}`,
      sheetName: t('reports.cases.title'),
      columns: [
        { key: 'category_name', header: t('reports.cases.col.type'), width: 24 },
        { key: 'case_count', header: t('reports.cases.col.cases'), width: 10 },
        { key: 'patient_count', header: t('reports.cases.col.patients'), width: 12 },
        { key: 'doctor_count', header: t('reports.cases.col.doctors'), width: 12 },
        { key: 'total_value', header: t('reports.cases.col.totalValue'), width: 16 },
        { key: 'paid_amount', header: t('reports.cases.col.paid'), width: 16 },
        { key: 'remaining_amount', header: t('reports.cases.col.remaining'), width: 16 },
        { key: 'percentage', header: t('reports.cases.col.percentage'), width: 10 }
      ],
      rows: rows.value,
      totalsRow: {
        category_name: t('reports.common.total'),
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

onMounted(fetchRows)
watch(() => [range.from, range.to, doctorParam.value], fetchRows)
</script>

<script>
export default { name: 'CasesReport' }
</script>
