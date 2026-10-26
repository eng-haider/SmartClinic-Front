<template>
  <v-card class="chart-card" variant="flat">
    <div class="chart-card__header d-flex align-center justify-space-between">
      <div class="chart-card__title">{{ title }}</div>
      <div class="chart-card__legend">
        <span class="legend-dot" style="background:#38A169"></span>{{ revenueLabel }}
        <span class="legend-dot ms-3" style="background:#E53E3E"></span>{{ expensesLabel }}
      </div>
    </div>
    <div class="chart-card__body">
      <template v-if="loading">
        <v-skeleton-loader type="image" height="220" />
      </template>
      <template v-else-if="!hasData">
        <div class="chart-card__empty">
          <v-icon size="40" color="grey-lighten-1">mdi-chart-line</v-icon>
          <span>{{ $t('common.no_data') }}</span>
        </div>
      </template>
      <template v-else>
        <canvas ref="chartCanvas" height="220"></canvas>
      </template>
    </div>
  </v-card>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Chart, registerables } from 'chart.js'
import { formatCurrency } from '@/utils/reportFormatters'

Chart.register(...registerables)

const { t } = useI18n()

const props = defineProps({
  title: { type: String, required: true },
  data: { type: Array, default: () => [] }, // [{ period, revenue, expenses }]
  period: { type: String, default: 'day' },
  currency: { type: String, default: 'IQD' },
  loading: { type: Boolean, default: false }
})

const revenueLabel = computed(() => t('reports.overview.revenue'))
const expensesLabel = computed(() => t('reports.overview.expenses'))

const chartCanvas = ref(null)
let chartInstance = null

const hasData = computed(() => props.data && props.data.length > 0)

const formatLabel = (raw) => {
  if (raw === null || raw === undefined || raw === '') return ''
  const s = String(raw)
  const [y, b, c] = s.split('-')
  if (props.period === 'month') {
    return (y && b) ? new Date(Number(y), Number(b) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : s
  }
  return (y && b && c) ? new Date(Number(y), Number(b) - 1, Number(c)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : s
}

const chartData = computed(() => ({
  labels: props.data.map((d) => formatLabel(d.period)),
  datasets: [
    {
      label: revenueLabel.value,
      data: props.data.map((d) => Number(d.revenue) || 0),
      borderColor: '#38A169',
      backgroundColor: '#38A16920',
      fill: true,
      tension: 0.35,
      borderWidth: 2,
      pointRadius: 3,
    },
    {
      label: expensesLabel.value,
      data: props.data.map((d) => Number(d.expenses) || 0),
      borderColor: '#E53E3E',
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.35,
      borderWidth: 2,
      pointRadius: 3,
      borderDash: [4, 3],
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: 10,
      cornerRadius: 6,
      callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#999' } },
    y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 }, color: '#999' }, beginAtZero: true },
  },
}

const renderChart = async () => {
  if (!hasData.value) {
    if (chartInstance) { chartInstance.destroy(); chartInstance = null }
    return
  }
  await nextTick()
  if (!chartCanvas.value) return
  if (chartInstance) chartInstance.destroy()
  chartInstance = new Chart(chartCanvas.value, { type: 'line', data: chartData.value, options: chartOptions })
}

watch(() => [props.data, props.loading], renderChart, { deep: true })
onMounted(renderChart)
onUnmounted(() => { if (chartInstance) chartInstance.destroy() })
</script>

<style scoped>
.chart-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 12px; padding: 16px 20px;
}
.chart-card__header { margin-bottom: 16px; }
.chart-card__title { font-size: 0.9rem; font-weight: 600; }
.chart-card__legend { font-size: 0.72rem; color: rgba(var(--v-theme-on-surface), 0.6); display: flex; align-items: center; }
.legend-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-inline-end: 4px; }
.chart-card__body { position: relative; min-height: 220px; }
.chart-card__empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 220px; gap: 8px; color: rgba(var(--v-theme-on-surface), 0.4); font-size: 0.85rem;
}
</style>
