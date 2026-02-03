<template>
  <v-card class="chart-card" variant="flat">
    <div class="chart-card__header">
      <div class="chart-card__title">{{ title }}</div>
    </div>
    <div class="chart-card__body">
      <template v-if="loading">
        <v-skeleton-loader type="image" height="200" />
      </template>
      <template v-else-if="!hasData">
        <div class="chart-card__empty">
          <v-icon size="40" color="grey-lighten-1">mdi-chart-bar</v-icon>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  title: { type: String, required: true },
  data: { type: Array, default: () => [] },
  labelKey: { type: String, default: 'category_name' },
  valueKey: { type: String, default: 'total_amount' },
  horizontal: { type: Boolean, default: false },
  color: { type: String, default: '#4F8CF1' },
  height: { type: Number, default: 200 },
  loading: { type: Boolean, default: false }
})

const chartCanvas = ref(null)
let chartInstance = null

const hasData = computed(() => props.data && props.data.length > 0)

const chartData = computed(() => ({
  labels: props.data.map(d => d[props.labelKey]),
  datasets: [{
    data: props.data.map(d => d[props.valueKey]),
    backgroundColor: props.color + '80',
    borderColor: props.color,
    borderWidth: 1,
    borderRadius: 4,
    barThickness: props.horizontal ? 18 : 24
  }]
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: props.horizontal ? 'y' : 'x',
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: 10,
      cornerRadius: 6
    }
  },
  scales: {
    x: {
      grid: { display: props.horizontal },
      ticks: { font: { size: 11 }, color: '#999' }
    },
    y: {
      grid: { display: !props.horizontal, color: 'rgba(0,0,0,0.04)' },
      ticks: { font: { size: 11 }, color: '#999' },
      beginAtZero: true
    }
  }
}))

const renderChart = () => {
  if (!chartCanvas.value || !hasData.value) return
  if (chartInstance) chartInstance.destroy()
  
  chartInstance = new Chart(chartCanvas.value, {
    type: 'bar',
    data: chartData.value,
    options: chartOptions.value
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
.chart-card__header { margin-bottom: 16px; }
.chart-card__title { font-size: 0.9rem; font-weight: 600; }
.chart-card__body { position: relative; min-height: 200px; }
.chart-card__empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 200px; gap: 8px; color: rgba(var(--v-theme-on-surface), 0.4); font-size: 0.85rem;
}
</style>
