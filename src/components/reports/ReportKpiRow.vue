<template>
  <v-row class="mb-6">
    <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" sm="6" md="3">
      <KpiCard
        :label="kpi.label"
        :value="kpi.value"
        :icon="kpi.icon"
        :icon-color="kpi.iconColor || 'primary'"
        :format="kpi.format || 'number'"
        :currency="currency"
        :value-color="kpi.valueColor"
        :loading="loading"
      />
    </v-col>
  </v-row>
</template>

<script setup>
import { KpiCard } from '@/components/dashboard'

defineProps({
  // [{ label, value, icon, iconColor, format: 'number'|'currency'|'percentage', valueColor }]
  kpis: { type: Array, required: true },
  currency: { type: String, default: 'IQD' },
  loading: { type: Boolean, default: false }
})
</script>
