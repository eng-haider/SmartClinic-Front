<template>
  <div class="cmt">
    <v-select v-model="group" :items="groupItems" density="compact" variant="outlined" hide-details class="ma-2" />
    <v-alert v-if="!result.calibration?.mm_per_px" type="info" variant="tonal" density="compact" class="mx-2 mb-2">
      الصورة غير معايرة: المسافات بالبكسل ولا تُقارن بالمرجع. الزوايا لا تتأثر بالمعايرة.
    </v-alert>
    <v-table density="compact" class="cmt-table">
      <thead>
        <tr>
          <th>القياس</th>
          <th class="text-center">القيمة</th>
          <th class="text-center">المرجع</th>
          <th class="text-center"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.key">
          <td>
            <div class="text-body-2" dir="ltr" style="text-align:start">{{ row.m.name }}</div>
            <div v-if="row.m.missing.length" class="text-caption text-medium-emphasis">ينقص: <span dir="ltr">{{ row.m.missing.join(', ') }}</span></div>
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
      المرجع: متوسط ± انحراف معياري أو مدى منشور لمؤلف التحليل (عينات بالغين غالباً). المقارنة رقمية فقط وليست تشخيصاً.
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { CEPH_ANALYSES, formatNorm } from '../../analysis/ceph.js'
import { fmt, statusColor, statusLabel } from '../../utils/format.js'

const props = defineProps({ result: { type: Object, required: true } })
const group = ref('steiner')
const groupItems = Object.entries(CEPH_ANALYSES).map(([value, g]) => ({ value, title: g.ar }))
const rows = computed(() => (props.result.analyses?.[group.value] || []).map(r => ({ ...r, m: props.result.measurements[r.key] })))
</script>

<style scoped>
.cmt-table :deep(td), .cmt-table :deep(th) { padding: 6px 8px !important; }
</style>
