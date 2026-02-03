<template>
  <v-card class="kpi-card" variant="flat" :class="{ 'kpi-card--clickable': clickable }" @click="$emit('click')">
    <div class="kpi-card__content">
      <div v-if="icon" class="kpi-card__icon" :style="{ backgroundColor: iconBg }">
        <v-icon :color="iconColor" size="22">{{ icon }}</v-icon>
      </div>
      <div class="kpi-card__text">
        <div class="kpi-card__label">{{ label }}</div>
        <template v-if="loading">
          <v-skeleton-loader type="text" width="70" class="mt-1" />
        </template>
        <template v-else>
          <div class="kpi-card__value" :class="valueClass">{{ formattedValue }}</div>
        </template>
        <div v-if="subtitle || trend !== null" class="kpi-card__footer">
          <template v-if="trend !== null && trend !== 0">
            <v-icon size="14" :color="trendColor" class="me-1">
              {{ trend > 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}
            </v-icon>
            <span :class="`text-${trendColor}`">{{ Math.abs(trend) }}%</span>
          </template>
          <span v-if="subtitle" class="kpi-card__subtitle">{{ subtitle }}</span>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], default: 0 },
  icon: { type: String, default: null },
  iconColor: { type: String, default: 'primary' },
  format: { type: String, default: 'number' }, // number, currency, percentage
  currency: { type: String, default: 'د.ع' },
  trend: { type: Number, default: null },
  trendReverse: { type: Boolean, default: false },
  subtitle: { type: String, default: null },
  loading: { type: Boolean, default: false },
  clickable: { type: Boolean, default: false },
  valueColor: { type: String, default: null }
})

defineEmits(['click'])

const iconBg = computed(() => `rgba(var(--v-theme-${props.iconColor}), 0.1)`)

const formattedValue = computed(() => {
  if (props.value === null || props.value === undefined) return '—'
  const num = typeof props.value === 'string' ? parseFloat(props.value) : props.value
  if (isNaN(num)) return props.value
  
  if (props.format === 'currency') {
    return new Intl.NumberFormat('ar-IQ').format(num) + ' ' + props.currency
  }
  if (props.format === 'percentage') {
    return num.toFixed(1) + '%'
  }
  return new Intl.NumberFormat('ar-IQ').format(num)
})

const trendColor = computed(() => {
  if (!props.trend || props.trend === 0) return 'grey'
  const isPositive = props.trend > 0
  return props.trendReverse ? (isPositive ? 'error' : 'success') : (isPositive ? 'success' : 'error')
})

const valueClass = computed(() => props.valueColor ? `text-${props.valueColor}` : '')
</script>

<style scoped>
.kpi-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 12px;
  padding: 16px 20px;
  height: 100%;
}
.kpi-card--clickable { cursor: pointer; }
.kpi-card--clickable:hover { border-color: rgba(var(--v-theme-primary), 0.3); }
.kpi-card__content { display: flex; align-items: flex-start; gap: 14px; }
.kpi-card__icon {
  width: 44px; height: 44px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.kpi-card__text { flex: 1; min-width: 0; }
.kpi-card__label {
  font-size: 0.7rem; font-weight: 500; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.55); letter-spacing: 0.4px; margin-bottom: 2px;
}
.kpi-card__value { font-size: 1.5rem; font-weight: 600; line-height: 1.2; }
.kpi-card__footer { display: flex; align-items: center; gap: 4px; font-size: 0.7rem; margin-top: 4px; }
.kpi-card__subtitle { color: rgba(var(--v-theme-on-surface), 0.5); }
</style>
