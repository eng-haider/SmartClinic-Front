<template>
  <v-card class="chart-card" variant="flat">
    <div class="chart-card__header">
      <div class="chart-card__title">{{ title }}</div>
      <div v-if="subtitle" class="chart-card__subtitle">{{ subtitle }}</div>
    </div>
    <div class="chart-card__body">
      <template v-if="loading">
        <v-skeleton-loader type="image" height="200" />
      </template>
      <template v-else-if="!hasData">
        <div class="chart-card__empty">
          <v-icon size="40" color="grey-lighten-1">mdi-chart-line</v-icon>
          <span>{{ $t('common.no_data') }}</span>
        </div>
      </template>
      <template v-else>
        <canvas ref="chartCanvas" :height="height"></canvas>
      </template>
    </div>
  </v-card>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: null },
  data: { type: Array, default: () => [] },
  labelKey: { type: String, default: 'period' },
  valueKey: { type: String, default: 'count' },
  type: { type: String, default: 'line' }, // line, area
  color: { type: String, default: '#4F8CF1' },
  height: { type: Number, default: 200 },
  loading: { type: Boolean, default: false },
  formatValue: { type: Function, default: (v) => v },
  period: { type: String, default: 'day' } // day | week | month | year
})

const chartCanvas = ref(null)
let chartInstance = null

const hasData = computed(() => props.data && props.data.length > 0)

// Turn the raw API period key into a readable, unambiguous axis label.
// The backend emits "YYYY-MM-DD" (day), "YYYY-WW" (week) and "YYYY-MM" (month) —
// week and month look identical ("2026-01"), so format them distinctly here.
const formatLabel = (raw) => {
  if (raw === null || raw === undefined || raw === '') return ''
  const s = String(raw)
  const [y, b, c] = s.split('-')
  if (props.period === 'week') {
    return b !== undefined ? `W${Number(b)} '${String(y).slice(-2)}` : s
  }
  if (props.period === 'year') return s
  if (props.period === 'month') {
    return (y && b)
      ? new Date(Number(y), Number(b) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : s
  }
  // day
  return (y && b && c)
    ? new Date(Number(y), Number(b) - 1, Number(c)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : s
}

const chartData = computed(() => {
  // With a short range, monthly/weekly grouping can collapse to 1-2 points,
  // which a line/area chart draws as a near-invisible dot. Enlarge the markers
  // so sparse data is clearly visible instead of looking like an empty chart.
  const sparse = props.data.length <= 2
  return {
    labels: props.data.map(d => formatLabel(d[props.labelKey])),
    datasets: [{
      // Coerce to Number — the API returns SUM() aggregates as strings
      // (e.g. "12345.00"), which Chart.js cannot plot (renders as an empty line).
      data: props.data.map(d => Number(d[props.valueKey]) || 0),
      borderColor: props.color,
      backgroundColor: props.type === 'area' ? `${props.color}20` : 'transparent',
      fill: props.type === 'area',
      tension: 0.35,
      borderWidth: 2,
      pointRadius: sparse ? 6 : 3,
      pointHoverRadius: sparse ? 9 : 5,
      pointBackgroundColor: props.color
    }]
  }
})

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
      titleFont: { size: 12 },
      bodyFont: { size: 13 },
      callbacks: { label: (ctx) => props.formatValue(ctx.raw) }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 }, color: '#999' }
    },
    y: {
      grid: { color: 'rgba(0,0,0,0.04)' },
      ticks: { font: { size: 11 }, color: '#999' },
      beginAtZero: true
    }
  }
}

const renderChart = async () => {
  // Nothing to draw — tear down any existing chart.
  if (!hasData.value) {
    if (chartInstance) { chartInstance.destroy(); chartInstance = null }
    return
  }
  // The canvas sits behind a v-if (loading/empty). After a re-fetch the
  // watcher fires before Vue re-inserts the canvas, so chartCanvas.value is
  // still null — wait for the DOM to flush before creating the chart.
  await nextTick()
  if (!chartCanvas.value) return
  if (chartInstance) chartInstance.destroy()

  chartInstance = new Chart(chartCanvas.value, {
    type: 'line',
    data: chartData.value,
    options: chartOptions
  })
}

// Re-render on data changes AND when loading flips off (canvas re-mounts).
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
.chart-card__subtitle { font-size: 0.75rem; color: rgba(var(--v-theme-on-surface), 0.5); margin-top: 2px; }
.chart-card__body { position: relative; min-height: 200px; }
.chart-card__empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 200px; gap: 8px; color: rgba(var(--v-theme-on-surface), 0.4); font-size: 0.85rem;
}
</style>
