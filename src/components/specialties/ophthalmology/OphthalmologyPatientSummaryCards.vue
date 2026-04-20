<template>
  <v-row dense class="mb-4">
    <v-col v-for="card in cards" :key="card.key" cols="6" sm="4" md>
      <v-card elevation="1" rounded="lg" class="fill-height summary-card" :class="`summary-card--${card.key}`">
        <v-card-text class="pa-3 text-center">
          <v-icon size="26" :color="card.color">{{ card.icon }}</v-icon>
          <div class="text-h5 font-weight-bold mt-1">{{ card.value }}</div>
          <div class="text-caption text-grey" style="line-height: 1.2">{{ card.label }}</div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  totalCases:         { type: Number, default: 0 },
  totalBills:         { type: Number, default: 0 },
  unpaidAmount:       { type: Number, default: 0 },
  readyForDoctorCount:{ type: Number, default: 0 },
  completedCount:     { type: Number, default: 0 },
})

const formatCurrency = (v) => {
  if (!v) return '0'
  return new Intl.NumberFormat('en-US').format(v)
}

const cards = computed(() => [
  {
    key: 'cases',
    icon: 'mdi-eye-outline',
    color: 'primary',
    value: props.totalCases,
    label: t('patients.totalCases') || 'إجمالي الحالات',
  },
  {
    key: 'bills',
    icon: 'mdi-cash-multiple',
    color: 'info',
    value: formatCurrency(props.totalBills),
    label: t('patients.totalBills') || 'إجمالي الفواتير',
  },
  {
    key: 'unpaid',
    icon: 'mdi-cash-clock',
    color: 'warning',
    value: formatCurrency(props.unpaidAmount),
    label: t('patients.remainingAmount') || 'المبلغ المتبقي',
  },
  {
    key: 'ready',
    icon: 'mdi-doctor',
    color: 'success',
    value: props.readyForDoctorCount,
    label: 'جاهز للطبيب',
  },
  {
    key: 'completed',
    icon: 'mdi-check-circle',
    color: 'teal',
    value: props.completedCount,
    label: t('common.completed') || 'مكتمل',
  },
])
</script>

<style scoped>
.summary-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
}
</style>
