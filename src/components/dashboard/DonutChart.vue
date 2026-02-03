<template>
  <v-card class="chart-card" variant="flat">
    <div class="chart-card__header">
      <div class="chart-card__title">{{ title }}</div>
    </div>
    <div class="chart-card__body">
      <template v-if="loading">
        <v-skeleton-loader type="image" height="220" />
      </template>
      <template v-else-if="!hasData">
        <div class="chart-card__empty">
          <v-icon size="40" color="grey-lighten-1">mdi-chart-donut</v-icon>
          <span>{{ $t('common.no_data') }}</span>
        </div>
      </template>
      <template v-else>
        <div class="donut-wrapper">
          <canvas ref="chartCanvas"></canvas>
          <div v-if="centerLabel" class="donut-center">
            <div class="donut-center__value">{{ centerValue }}</div>
            <div class="donut-center__label">{{ centerLabel }}</div>
          </div>
        </div>
        <div class="donut-legend">
          <div v-for="(item, i) in legendItems" :key="i" class="legend-item">
            <span class="legend-dot" :style="{ backgroundColor: item.color }"></span>
            <span class="legend-label">{{ item.label }}</span>
            <span class="legend-value">{{ item.value }} ({{ item.percentage }}%)</span>
          </div>
        </div>
      </template>
    </div>
  </v-card>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  title: { type: String, required: true },
  data: { type: Array, default: () => [] },
  labelKey: { type: String, default: 'status_name' },
  valueKey: { type: String, default: 'count' },
  colorKey: { type: String, default: 'color' },
  centerLabel: { type: String, default: null },
  loading: { type: Boolean, default: false }
})

const chartCanvas = ref(null)
let chartInstance = null

const defaultColors = ['#4F8CF1', '#48BB78', '#F6AD55', '#FC8181', '#9F7AEA', '#4FD1C5']

const hasData = computed(() => props.data && props.data.length > 0)

const total = computed(() => props.data.reduce((sum, d) => sum + (d[props.valueKey] || 0), 0))

const centerValue = computed(() => new Intl.NumberFormat('ar-IQ').format(total.value))

const legendItems = computed(() => props.data.map((d, i) => ({
  label: d[props.labelKey],
  value: d[props.valueKey],
  percentage: total.value ? ((d[props.valueKey] / total.value) * 100).toFixed(1) : 0,
  color: d[props.colorKey] || defaultColors[i % defaultColors.length]
})))

const chartData = computed(() => ({
  labels: props.data.map(d => d[props.labelKey]),
  datasets: [{
    data: props.data.map(d => d[props.valueKey]),
    backgroundColor: props.data.map((d, i) => d[props.colorKey] || defaultColors[i % defaultColors.length]),
    borderWidth: 0,
    hoverOffset: 4
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  cutout: '65%',
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: 10,
      cornerRadius: 6,
      callbacks: {
        label: (ctx) => {
          const pct = total.value ? ((ctx.raw / total.value) * 100).toFixed(1) : 0
          return `${ctx.label}: ${ctx.raw} (${pct}%)`
        }
      }
    }
  }
}

const renderChart = () => {
  if (!chartCanvas.value || !hasData.value) return
  if (chartInstance) chartInstance.destroy()
  
  chartInstance = new Chart(chartCanvas.value, {
    type: 'doughnut',
    data: chartData.value,
    options: chartOptions
  })
}

watch(() => props.data, renderChart, { deep: true })
onMounted(() => { if (hasData.value) renderChart() })
onUnmounted(() => { if (chartInstance) chartInstance.destroy() })
</script>

<style scoped>
.chart-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 12px; padding: 16px 20px;
}
.chart-card__header { margin-bottom: 12px; }
.chart-card__title { font-size: 0.9rem; font-weight: 600; }
.chart-card__body { position: relative; }
.chart-card__empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 220px; gap: 8px; color: rgba(var(--v-theme-on-surface), 0.4); font-size: 0.85rem;
}
.donut-wrapper { position: relative; max-width: 180px; margin: 0 auto 16px; }
.donut-center {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  text-align: center;
}
.donut-center__value { font-size: 1.1rem; font-weight: 600; }
.donut-center__label { font-size: 0.65rem; color: rgba(var(--v-theme-on-surface), 0.5); text-transform: uppercase; }
.donut-legend { display: flex; flex-direction: column; gap: 6px; }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.legend-label { flex: 1; color: rgba(var(--v-theme-on-surface), 0.8); }
.legend-value { font-weight: 500; font-size: 0.75rem; color: rgba(var(--v-theme-on-surface), 0.6); }
</style>
