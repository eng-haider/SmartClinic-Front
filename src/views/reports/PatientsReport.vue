<template>
  <v-container fluid class="app-page">
    <ReportHeader
      :title="$t('reports.patients.title')"
      :subtitle="$t('reports.patients.subtitle')"
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
      :search-placeholder="$t('reports.patients.searchPlaceholder')"
      :filters="[{ key: 'status', label: $t('reports.patients.filterLabel'), modelValue: paymentStatus, items: statusItems }]"
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
      <template #item.unpaid_amount="{ item }">
        <span :class="item.unpaid_amount > 0 ? 'text-warning font-weight-medium' : 'text-medium-emphasis'">
          {{ formatCurrency(item.unpaid_amount, currency) }}
        </span>
      </template>
      <template #item.payment_percentage="{ item }">
        <div class="d-flex align-center ga-2" style="min-width: 90px;">
          <v-progress-linear :model-value="item.payment_percentage" height="6" rounded :color="item.payment_percentage >= 100 ? 'success' : 'warning'" style="max-width: 60px;" />
          <span class="text-caption">{{ formatPercent(item.payment_percentage) }}</span>
        </div>
      </template>
      <template #item.last_payment_at="{ item }">{{ formatDate(item.last_payment_at) }}</template>
      <template #item.last_visit_at="{ item }">{{ formatDate(item.last_visit_at) }}</template>
    </SmartTable>

    <!-- Drill-down: patient payment/account history -->
    <v-dialog v-model="detailOpen" max-width="900" scrollable>
      <v-card v-if="selectedPatient">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>{{ selectedPatient.name }}</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="detailOpen = false" />
        </v-card-title>
        <v-card-text>
          <v-row class="mb-3" dense>
            <v-col cols="4"><div class="text-caption text-medium-emphasis">{{ $t('reports.patients.detail.total') }}</div><div class="text-subtitle-2 font-weight-bold">{{ formatCurrency(patientBalance?.total_price, currency) }}</div></v-col>
            <v-col cols="4"><div class="text-caption text-medium-emphasis">{{ $t('reports.patients.detail.paid') }}</div><div class="text-subtitle-2 font-weight-bold text-success">{{ formatCurrency(patientBalance?.paid_amount, currency) }}</div></v-col>
            <v-col cols="4"><div class="text-caption text-medium-emphasis">{{ $t('reports.patients.detail.remaining') }}</div><div class="text-subtitle-2 font-weight-bold text-warning">{{ formatCurrency(patientBalance?.unpaid_amount, currency) }}</div></v-col>
          </v-row>
          <v-progress-linear v-if="detailLoading" indeterminate class="mb-3" />
          <SmartTable
            v-else
            :columns="detailColumns"
            :items="detailRows"
            :empty-text="$t('reports.common.noData')"
            :clickable="false"
          >
            <template #item.category="{ item }">{{ item.billable?.category?.name || '—' }}</template>
            <template #item.tooth_num="{ item }">{{ item.billable?.tooth_num || '—' }}</template>
            <template #item.case_price="{ item }">{{ formatCurrency(item.billable?.price, currency) }}</template>
            <template #item.price="{ item }">{{ formatCurrency(item.price, currency) }}</template>
            <template #item.status="{ item }">{{ item.billable?.status?.name || '—' }}</template>
            <template #item.bill_date="{ item }">{{ formatDate(item.bill_date) }}</template>
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
import { formatCurrency, formatNumber, formatDate, formatPercent } from '@/utils/reportFormatters'
import { exportReportPdf, exportReportExcel } from '@/utils/reportExport'

const { t } = useI18n()
const { period, range, rangeLabel, setPreset, setCustomRange } = useReportDateRange('patients', 'month')
const { doctorParam } = useReportDoctorFilter()
const { getSettingByKey, clinicInfo } = useClinicSettings()
const currency = computed(() => getSettingByKey('currency') || 'IQD')

const loading = reactive({ table: false })
const rows = ref([])
const summary = ref(null)
const search = ref('')
const paymentStatus = ref(null)
const page = ref(1)
const perPage = ref(15)
const total = ref(0)
const exportingPdf = ref(false)
const exportingExcel = ref(false)

const statusItems = computed(() => [
  { label: t('reports.patients.filterAll'), value: null },
  { label: t('reports.patients.filterUnpaid'), value: 'unpaid' },
  { label: t('reports.patients.filterPaid'), value: 'paid' }
])

const columns = computed(() => [
  { key: 'name', label: t('reports.patients.col.name'), sortable: true },
  { key: 'phone', label: t('reports.patients.col.phone') },
  { key: 'case_count', label: t('reports.patients.col.cases'), align: 'center' },
  { key: 'total_price', label: t('reports.patients.col.total'), align: 'end' },
  { key: 'paid_amount', label: t('reports.patients.col.paid'), align: 'end' },
  { key: 'unpaid_amount', label: t('reports.patients.col.remaining'), align: 'end' },
  { key: 'payment_percentage', label: t('reports.patients.col.percentage') },
  { key: 'last_payment_at', label: t('reports.patients.col.lastPayment') },
  { key: 'last_visit_at', label: t('reports.patients.col.lastVisit') }
])

const detailColumns = computed(() => [
  { key: 'category', label: t('reports.patients.detail.category') },
  { key: 'tooth_num', label: t('reports.patients.detail.tooth') },
  { key: 'case_price', label: t('reports.patients.detail.casePrice'), align: 'end' },
  { key: 'price', label: t('reports.patients.detail.payment'), align: 'end' },
  { key: 'status', label: t('reports.patients.detail.status') },
  { key: 'bill_date', label: t('reports.patients.detail.date') }
])

const kpis = computed(() => [
  { label: t('reports.patients.kpi.count'), value: summary.value?.patient_count, icon: 'mdi-account-group-outline', iconColor: 'primary' },
  { label: t('reports.patients.kpi.total'), value: summary.value?.total_price, icon: 'mdi-cash-multiple', iconColor: 'info', format: 'currency' },
  { label: t('reports.patients.kpi.paid'), value: summary.value?.paid_amount, icon: 'mdi-cash-check', iconColor: 'success', format: 'currency' },
  { label: t('reports.patients.kpi.remaining'), value: summary.value?.unpaid_amount, icon: 'mdi-cash-clock', iconColor: 'warning', format: 'currency' }
])

async function fetchRows() {
  loading.table = true
  try {
    const res = await reportsService.patientAccounts.list({
      date_from: range.from, date_to: range.to, doctor_id: doctorParam.value, search: search.value || undefined,
      payment_status: paymentStatus.value || undefined,
      page: page.value, per_page: perPage.value
    })
    rows.value = res.data || []
    summary.value = res.summary || null
    total.value = res.pagination?.total || 0
  } catch (e) {
    console.error('Failed to load patient accounts report:', e)
    rows.value = []
  } finally {
    loading.table = false
  }
}

function onSearch(val) { search.value = val; page.value = 1; fetchRows() }
function onFilter({ value }) { paymentStatus.value = value; page.value = 1; fetchRows() }

const detailOpen = ref(false)
const detailLoading = ref(false)
const selectedPatient = ref(null)
const detailRows = ref([])
const patientBalance = ref(null)

async function openPatient(row) {
  selectedPatient.value = row
  detailOpen.value = true
  detailLoading.value = true
  try {
    const res = await reportsService.patientAccounts.detail(row.id, { per_page: 50, doctor_id: doctorParam.value })
    detailRows.value = res.data || []
    patientBalance.value = res.patient_balance || row
  } catch (e) {
    console.error('Failed to load patient detail:', e)
    detailRows.value = []
  } finally {
    detailLoading.value = false
  }
}

async function onExportPdf() {
  exportingPdf.value = true
  try {
    await exportReportPdf({
      filename: `patient-accounts-${range.from}_${range.to}`,
      clinicInfo: clinicInfo.value,
      title: t('reports.patients.title'),
      periodLabel: rangeLabel.value,
      kpis: kpis.value.map((k) => ({ label: k.label, value: k.format === 'currency' ? formatCurrency(k.value, currency.value) : formatNumber(k.value) })),
      columns: [
        { key: 'name', label: t('reports.patients.col.name') },
        { key: 'total_price', label: t('reports.patients.col.total') },
        { key: 'paid_amount', label: t('reports.patients.col.paid') },
        { key: 'unpaid_amount', label: t('reports.patients.col.remaining') }
      ],
      rows: rows.value.map((r) => ({
        name: r.name, total_price: formatCurrency(r.total_price, currency.value),
        paid_amount: formatCurrency(r.paid_amount, currency.value),
        unpaid_amount: formatCurrency(r.unpaid_amount, currency.value)
      })),
      totals: [
        { label: t('reports.patients.kpi.total'), value: formatCurrency(summary.value?.total_price, currency.value) },
        { label: t('reports.patients.kpi.remaining'), value: formatCurrency(summary.value?.unpaid_amount, currency.value) }
      ]
    })
  } finally {
    exportingPdf.value = false
  }
}

async function onExportExcel() {
  exportingExcel.value = true
  try {
    const res = await reportsService.patientAccounts.list({
      date_from: range.from, date_to: range.to, doctor_id: doctorParam.value, search: search.value || undefined,
      payment_status: paymentStatus.value || undefined, page: 1, per_page: 2000
    })
    await exportReportExcel({
      filename: `patient-accounts-${range.from}_${range.to}`,
      sheetName: t('reports.patients.title'),
      columns: [
        { key: 'name', header: t('reports.patients.col.name'), width: 26 },
        { key: 'phone', header: t('reports.patients.col.phone'), width: 16 },
        { key: 'case_count', header: t('reports.patients.col.cases'), width: 10 },
        { key: 'total_price', header: t('reports.patients.col.total'), width: 16 },
        { key: 'paid_amount', header: t('reports.patients.col.paid'), width: 16 },
        { key: 'unpaid_amount', header: t('reports.patients.col.remaining'), width: 16 }
      ],
      rows: res.data || [],
      totalsRow: {
        name: t('reports.common.total'),
        total_price: summary.value?.total_price,
        paid_amount: summary.value?.paid_amount,
        unpaid_amount: summary.value?.unpaid_amount
      }
    })
  } finally {
    exportingExcel.value = false
  }
}

onMounted(fetchRows)
watch(() => [range.from, range.to, doctorParam.value], () => { page.value = 1; fetchRows() })
</script>

<script>
export default { name: 'PatientsReport' }
</script>
