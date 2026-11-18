<template>
  <v-card rounded="xl" variant="outlined">
    <v-card-title class="d-flex align-center ga-2">
      <v-icon color="primary">mdi-compare-horizontal</v-icon>
      {{ t('ceph.compareTitle') }}
      <v-spacer />
      <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('close')" />
    </v-card-title>
    <v-divider />
    <v-card-text>
      <v-alert v-if="mixedUnits" type="warning" variant="tonal" density="compact" class="mb-3">
        {{ t('ceph.mixedUnits') }}
      </v-alert>
      <div class="d-flex flex-wrap ga-4">
        <!-- SN superimposition registered at S -->
        <div class="cc-overlay">
          <svg :viewBox="viewBox" width="100%" height="100%">
            <g v-for="(t, i) in tracings" :key="t.id">
              <line v-for="(seg, j) in t.segments" :key="j" :x1="seg[0][0]" :y1="seg[0][1]" :x2="seg[1][0]" :y2="seg[1][1]" :stroke="COLORS[i % COLORS.length]" :stroke-width="viewSize / 350" stroke-linecap="round" />
              <circle v-for="(p, code) in t.points" :key="code" :cx="p[0]" :cy="p[1]" :r="viewSize / 220" :fill="COLORS[i % COLORS.length]" />
            </g>
          </svg>
          <div class="text-caption text-center mt-1">{{ t('ceph.superimposition') }} {{ allCalibrated ? t('ceph.inMm') : t('ceph.inPx') }}</div>
        </div>
        <div class="flex-grow-1" style="min-width:280px">
          <v-table density="compact">
            <thead>
              <tr>
                <th>{{ t('common.measurement') }}</th>
                <th v-for="(a, i) in analyses" :key="a.id" class="text-center">
                  <span class="cc-dot" :style="{ background: COLORS[i % COLORS.length] }" />{{ a.analysis_date }}
                </th>
                <th v-if="analyses.length === 2" class="text-center">{{ t('common.difference') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="key in keys" :key="key">
                <td dir="ltr" style="text-align:start">{{ CEPH_DEFINITIONS[key].name }}</td>
                <td v-for="(r, i) in results" :key="i" class="text-center" dir="ltr">{{ cell(r, key) }}</td>
                <td v-if="analyses.length === 2" class="text-center font-weight-bold" dir="ltr">{{ delta(key) }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { CEPH_DEFINITIONS, CEPH_TRACING, analyzeCeph } from '../../analysis/ceph.js'
import { fmt } from '../../utils/format.js'
import { useOrthoI18n } from '../../i18n.js'

const props = defineProps({ analyses: { type: Array, required: true } })
defineEmits(['close'])
const { t } = useOrthoI18n()
const COLORS = ['#0ea5e9', '#f43f5e', '#22c55e', '#f59e0b']
const keys = ['SNA', 'SNB', 'ANB', 'wits', 'FMA', 'SN_GoGn', 'IMPA', 'interincisal', 'U1_SN', 'facial_axis', 'Y_axis', 'LAFH', 'Co_Gn', 'lower_lip_E']

const results = computed(() => props.analyses.map(a => analyzeCeph(a.data || {})))
const allCalibrated = computed(() => results.value.every(r => r.calibration.mm_per_px))
const mixedUnits = computed(() => !allCalibrated.value && results.value.some(r => r.calibration.mm_per_px))
const cell = (r, key) => { const m = r.measurements[key]; return m.value === null ? '—' : `${fmt(m.value)} ${m.unit}` }
function delta (key) {
  const [a, b] = results.value.map(r => r.measurements[key])
  if (a.value === null || b.value === null || a.unit !== b.unit) return '—'
  const d = b.value - a.value
  return `${d > 0 ? '+' : ''}${fmt(d)} ${a.unit}`
}

// Each tracing in a frame with S at the origin and SN along +x (patient facing
// right, y down), in mm when every analysis is calibrated.
const tracings = computed(() => props.analyses.map((a, idx) => {
  const lm = a.data?.landmarks || {}
  const r = results.value[idx]
  if (!lm.S || !lm.N) return { id: a.id, segments: [], points: {} }
  const k = allCalibrated.value ? r.calibration.mm_per_px : 1
  const flip = r.facing === 'left' ? -1 : 1
  const ang = Math.atan2(lm.N.y - lm.S.y, (lm.N.x - lm.S.x) * flip)
  const cos = Math.cos(-ang); const sin = Math.sin(-ang)
  const tf = p => { const x = (p.x - lm.S.x) * flip * k; const y = (p.y - lm.S.y) * k; return [x * cos - y * sin, x * sin + y * cos] }
  const points = Object.fromEntries(Object.entries(lm).map(([c, p]) => [c, tf(p)]))
  const segments = CEPH_TRACING.filter(t => lm[t.from] && lm[t.to]).map(t => [points[t.from], points[t.to]])
  return { id: a.id, segments, points }
}))

const bounds = computed(() => {
  const pts = tracings.value.flatMap(t => Object.values(t.points))
  if (!pts.length) return { x: -10, y: -10, w: 20, h: 20 }
  const xs = pts.map(p => p[0]); const ys = pts.map(p => p[1])
  const pad = (Math.max(...xs) - Math.min(...xs)) * 0.08 + 1
  return { x: Math.min(...xs) - pad, y: Math.min(...ys) - pad, w: Math.max(...xs) - Math.min(...xs) + 2 * pad, h: Math.max(...ys) - Math.min(...ys) + 2 * pad }
})
const viewBox = computed(() => `${bounds.value.x} ${bounds.value.y} ${bounds.value.w} ${bounds.value.h}`)
const viewSize = computed(() => Math.max(bounds.value.w, bounds.value.h))
</script>

<style scoped>
.cc-overlay { width: 360px; max-width: 100%; aspect-ratio: 1; background: #0b1220; border-radius: 12px; padding: 8px; }
.cc-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-inline-end: 4px; }
</style>
