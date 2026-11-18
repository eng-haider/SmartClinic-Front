<template>
  <div class="cmt">
    <v-select v-model="group" :items="groupItems" density="compact" variant="outlined" hide-details class="ma-2" />
    <v-alert v-if="!result.calibration?.mm_per_px" type="info" variant="tonal" density="compact" class="mx-2 mb-2">
      {{ t('ceph.uncalibrated') }}
    </v-alert>
    <v-table density="compact" class="cmt-table">
      <thead>
        <tr>
          <th>{{ t('common.measurement') }}</th>
          <th class="text-center">{{ t('common.value') }}</th>
          <th class="text-center">{{ t('common.reference') }}</th>
          <th class="text-center"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.key">
          <td>
            <div class="text-body-2" dir="ltr" style="text-align:start">{{ row.m.name }}</div>
            <div v-if="row.m.missing.length" class="text-caption text-medium-emphasis">{{ t('common.missing') }} <span dir="ltr">{{ row.m.missing.join(', ') }}</span></div>
          </td>
          <td class="text-center font-weight-bold text-no-wrap" dir="ltr">{{ row.m.value === null ? '—' : `${fmt(row.m.value)} ${row.m.unit}` }}</td>
          <td class="text-center text-caption text-no-wrap" dir="ltr" :title="row.norm?.source">{{ formatNorm(row.norm, row.m.unit === '°' ? '°' : row.m.unit) }}</td>
          <td class="text-center">
            <v-chip v-if="row.comparison" :color="statusColor(row.comparison.status)" size="x-small" variant="tonal">{{ statusLabel(row.comparison.status) }}</v-chip>
          </td>
        </tr>
      </tbody>
    </v-table>
    <div class="text-caption text-medium-emphasis pa-2">
      {{ t('ceph.referenceNote') }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { CEPH_ANALYSES, formatNorm } from '../../analysis/ceph.js'
import { fmt, statusColor, statusLabel } from '../../utils/format.js'
import { useOrthoI18n } from '../../i18n.js'

const props = defineProps({ result: { type: Object, required: true } })
const group = ref('steiner')
const { t, pick } = useOrthoI18n()
const groupItems = computed(() => Object.entries(CEPH_ANALYSES).map(([value, g]) => ({ value, title: pick(g) })))
const rows = computed(() => (props.result.analyses?.[group.value] || []).map(r => ({ ...r, m: props.result.measurements[r.key] })))
</script>

<style scoped>
.cmt-table :deep(td), .cmt-table :deep(th) { padding: 6px 8px !important; }
</style>
