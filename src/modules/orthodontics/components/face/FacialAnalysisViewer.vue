<template>
  <div>
    <!-- Editor -->
    <div v-if="editing" class="face-editor">
      <div class="d-flex flex-wrap align-center ga-2 mb-2">
        <v-btn variant="text" :prepend-icon="backIcon" @click="closeEditor">{{ t('common.back') }}</v-btn>
        <v-chip color="primary" variant="tonal" size="small">{{ viewLabel(view) }}</v-chip>
        <v-text-field v-model="title" :readonly="!canManage" density="compact" variant="outlined" hide-details style="max-width:240px" />
        <v-text-field v-model="analysisDate" :readonly="!canManage" type="date" density="compact" variant="outlined" hide-details style="max-width:170px" />
        <v-spacer />
        <v-btn v-if="canManage && view !== 'profile'" color="deep-purple" variant="tonal" :loading="detecting" prepend-icon="mdi-face-recognition" @click="detect">{{ t('face.detect') }}</v-btn>
        <v-btn v-if="canManage && current && !dirty" :color="current.status === 'reviewed' ? 'grey' : 'success'" variant="tonal" :loading="reviewing" @click="toggleReview">
          {{ current.status === 'reviewed' ? t('common.unapprove') : t('common.approve') }}
        </v-btn>
        <v-btn v-if="canManage" color="primary" :loading="saving" :disabled="!dirty" prepend-icon="mdi-content-save" @click="save">{{ t('common.save') }}</v-btn>
      </div>
      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-2" closable @click:close="error = ''">{{ error }}</v-alert>
      <v-alert v-if="suggested.length" type="warning" variant="tonal" density="compact" class="mb-2">
        {{ t('face.suggested', { n: suggested.length }) }}
        <template #append><v-btn size="small" variant="tonal" @click="confirmSuggested">{{ t('common.confirm') }}</v-btn></template>
      </v-alert>

      <div class="face-body">
        <div class="face-canvas">
          <LandmarkCanvas
            ref="canvasRef"
            v-model:landmarks="landmarks"
            v-model:active-code="activeCode"
            v-model:calibration="calibration"
            :src="imageUrl"
            :definitions="defs"
            :extra-lines="overlayLines"
            :mode="mode"
            :suggested="suggested"
            :readonly="!canManage"
            :show-labels="showLabels"
            @placed="advance"
          />
          <div class="d-flex flex-wrap align-center ga-2 mt-2">
            <v-btn-toggle v-model="mode" mandatory density="compact" variant="outlined" divided color="primary">
              <v-btn value="place" size="small">{{ t('common.placePoints') }}</v-btn>
              <v-btn value="pan" size="small">{{ t('common.pan') }}</v-btn>
              <v-btn value="calibrate" size="small">{{ t('face.calibrateRuler') }}</v-btn>
            </v-btn-toggle>
            <v-btn size="small" variant="tonal" :color="showOverlay ? 'primary' : undefined" prepend-icon="mdi-vector-line" @click="showOverlay = !showOverlay">{{ t('face.overlay') }}</v-btn>
            <v-btn size="small" variant="tonal" :color="showLabels ? 'primary' : undefined" icon="mdi-label-outline" @click="showLabels = !showLabels" />
            <v-text-field v-if="mode === 'calibrate'" v-model.number="calibration.known_mm" type="number" min="0" step="0.5" :label="t('face.rulerLength')" density="compact" variant="outlined" hide-details style="max-width:170px" />
          </div>
        </div>
        <div class="face-side">
          <v-tabs v-model="sideTab" density="compact" grow color="primary">
            <v-tab value="points">{{ t('common.landmarks') }}</v-tab>
            <v-tab value="results">{{ t('common.measurements') }}</v-tab>
          </v-tabs>
          <v-divider />
          <div class="face-scroll">
            <v-list v-if="sideTab === 'points'" density="compact" nav>
              <v-list-item v-for="d in defs" :key="d.code" :active="d.code === activeCode" color="primary" rounded="lg" @click="activeCode = d.code; mode = 'place'">
                <template #prepend>
                  <v-icon size="16" :color="landmarks[d.code] ? (suggested.includes(d.code) ? 'warning' : 'success') : 'grey'">{{ landmarks[d.code] ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                </template>
                <v-list-item-title class="text-body-2">{{ pick(d) }}</v-list-item-title>
                <v-list-item-subtitle v-if="d.manualOnly" class="text-caption">{{ t('face.manualOnly') }}</v-list-item-subtitle>
                <template #append>
                  <v-btn v-if="landmarks[d.code] && canManage" icon="mdi-close" size="x-small" variant="text" @click.stop="remove(d.code)" />
                </template>
              </v-list-item>
            </v-list>
            <FaceResults v-else :result="result" class="pa-3" />
          </div>
        </div>
      </div>
      <div class="text-caption text-medium-emphasis mt-2">
        {{ t('face.footer') }}
      </div>
    </div>

    <!-- List -->
    <template v-else>
      <div class="d-flex flex-wrap align-center ga-2 mb-4">
        <div>
          <div class="text-h6">{{ t('face.title') }}</div>
          <div class="text-caption text-medium-emphasis">{{ t('face.subtitle') }}</div>
        </div>
        <v-spacer />
        <v-btn v-if="selected.length === 2" color="secondary" variant="tonal" prepend-icon="mdi-compare" @click="startCompare">{{ t('common.beforeAfter') }}</v-btn>
        <v-menu v-if="canManage">
          <template #activator="{ props: mp }"><v-btn v-bind="mp" color="primary" prepend-icon="mdi-plus">{{ t('common.newAnalysis') }}</v-btn></template>
          <v-list density="compact">
            <v-list-item v-for="v in VIEWS" :key="v" :title="viewLabel(v)" @click="pickView(v)" />
          </v-list>
        </v-menu>
      </div>
      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">{{ error }}</v-alert>

      <!-- Before / after -->
      <v-card v-if="compare" variant="outlined" rounded="xl" class="mb-4 pa-3">
        <div class="d-flex align-center mb-2">
          <div class="text-subtitle-1">{{ t('common.beforeAfter') }}</div>
          <v-spacer />
          <v-btn icon="mdi-close" size="small" variant="text" @click="compare = null" />
        </div>
        <v-row>
          <v-col v-for="(c, i) in compare.items" :key="c.analysis.id" cols="12" md="6">
            <div class="text-caption mb-1">{{ i === 0 ? t('common.before') : t('common.after') }} · {{ c.analysis.analysis_date }}</div>
            <div style="height:360px">
              <LandmarkCanvas :src="c.url" :landmarks="c.analysis.data.landmarks || {}" :definitions="defsFor(c.analysis.data.view)" :extra-lines="linesFor(c.analysis.data)" mode="pan" readonly />
            </div>
          </v-col>
        </v-row>
        <v-table density="compact" class="mt-2">
          <thead><tr><th>{{ t('common.measurement') }}</th><th class="text-center">{{ t('common.before') }}</th><th class="text-center">{{ t('common.after') }}</th><th class="text-center">{{ t('common.difference') }}</th></tr></thead>
          <tbody>
            <tr v-for="row in compareRows" :key="row.label">
              <td>{{ row.label }}</td>
              <td class="text-center" dir="ltr">{{ fmt(row.a, 2) }}</td>
              <td class="text-center" dir="ltr">{{ fmt(row.b, 2) }}</td>
              <td class="text-center font-weight-bold" dir="ltr">{{ row.a !== null && row.b !== null ? fmt(row.b - row.a, 2) : '—' }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card>

      <v-row v-if="list.length">
        <v-col v-for="a in list" :key="a.id" cols="12" sm="6" lg="4">
          <v-card rounded="xl" variant="outlined" @click="open(a)">
            <v-card-item>
              <template #prepend><v-checkbox-btn v-model="selected" :value="a.id" density="compact" @click.stop /></template>
              <v-card-title class="text-subtitle-1">{{ a.title || viewLabel(a.results?.view) }}</v-card-title>
              <v-card-subtitle>{{ viewLabel(a.results?.view) }} · {{ a.analysis_date }}</v-card-subtitle>
              <template #append>
                <v-chip :color="a.status === 'reviewed' ? 'success' : 'grey'" size="x-small" variant="tonal">{{ a.status === 'reviewed' ? t('common.reviewed') : t('common.draft') }}</v-chip>
              </template>
            </v-card-item>
          </v-card>
        </v-col>
      </v-row>
      <div v-else class="text-center text-medium-emphasis py-10">
        <v-icon size="48" color="grey-lighten-1">mdi-face-man-outline</v-icon>
        <div class="mt-2">{{ t('face.empty') }}</div>
      </div>
    </template>

    <OrthoFilePicker v-model="picker" :case-id="caseId" :kinds="[FILE_KIND[pendingView]]" :title="viewLabel(pendingView)" icon="mdi-face-recognition" :can-manage="canManage" @selected="startNew" />
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, ref, watch } from 'vue'
import LandmarkCanvas from '../LandmarkCanvas.vue'
import OrthoFilePicker from '../OrthoFilePicker.vue'
import { FACE_LANDMARKS, analyzeFace } from '../../analysis/face.js'
import { orthoApi, orthoError } from '../../api.js'
import { fileObjectUrl, loadImage } from '../../utils/blob.js'
import { fmt } from '../../utils/format.js'
import { useOrthoI18n } from '../../i18n.js'

const props = defineProps({ caseId: { type: [Number, String], required: true }, canManage: Boolean })
const emit = defineEmits(['dirty', 'changed'])

const { t, pick, backIcon } = useOrthoI18n()
const VIEWS = ['frontal', 'smile', 'profile']
const viewLabel = v => (VIEWS.includes(v) ? t(`face.views.${v}`) : '')
const FILE_KIND = { frontal: 'face_frontal', smile: 'face_smile', profile: 'face_profile' }
const defsFor = v => FACE_LANDMARKS.filter(l => l.views.includes(v || 'frontal')).map(l => ({ ...l, short: l.code, color: l.manualOnly ? '#fbbf24' : '#34d399' }))

const list = ref([])
const error = ref('')
const picker = ref(false)
const pendingView = ref('frontal')
const selected = ref([])
const compare = ref(null)

const editing = ref(false)
const current = ref(null)
const view = ref('frontal')
const fileId = ref(null)
const imageUrl = ref('')
const title = ref('')
const analysisDate = ref('')
const landmarks = ref({})
const sources = ref({})
const calibration = ref({})
const activeCode = ref(null)
const mode = ref('place')
const sideTab = ref('points')
const showOverlay = ref(true)
const showLabels = ref(false)
const detecting = ref(false)
const saving = ref(false)
const reviewing = ref(false)
const savedSnapshot = ref('')
const canvasRef = ref(null)

const defs = computed(() => defsFor(view.value))
const suggested = computed(() => Object.keys(sources.value).filter(c => sources.value[c] === 'auto' && landmarks.value[c]))
const payload = computed(() => ({ view: view.value, landmarks: landmarks.value, landmark_sources: sources.value, calibration: { ...calibration.value } }))
const result = computed(() => analyzeFace(payload.value))
const serialized = () => JSON.stringify({ p: payload.value, t: title.value, d: analysisDate.value })
const dirty = computed(() => editing.value && (current.value ? serialized() !== savedSnapshot.value : Object.keys(landmarks.value).length > 0))
watch(dirty, v => emit('dirty', v))

// Reference lines: facial midline, thirds, commissure line; E-line in profile.
function linesFor (data) {
  const l = data?.landmarks || {}
  const out = []
  if (data?.view === 'profile') {
    if (l.Prn && l.PogS) out.push(line(l.Prn, l.PogS, '#34d399', 'E', true))
    if (l.Cm && l.Sn && l.Ls) { out.push(line(l.Cm, l.Sn, '#f472b6')); out.push(line(l.Sn, l.Ls, '#f472b6')) }
    if (l.G && l.Sn && l.PogS) { out.push(line(l.G, l.Sn, '#38bdf8', null, true)); out.push(line(l.Sn, l.PogS, '#38bdf8', null, true)) }
    return out
  }
  const r = l.PupR || l.EnR; const lf = l.PupL || l.EnL
  if (r && lf) {
    const o = { x: (r.x + lf.x) / 2, y: (r.y + lf.y) / 2 }
    const ax = lf.x - r.x; const ay = lf.y - r.y; const n = Math.hypot(ax, ay) || 1
    const down = { x: -ay / n, y: ax / n }
    const len = n * 3
    out.push({ a: [o.x - down.x * len * 0.6, o.y - down.y * len * 0.6], b: [o.x + down.x * len, o.y + down.y * len], color: '#facc15', label: 'midline', dashed: true })
    for (const code of ['Tr', 'G', 'Sn', 'MeS']) {
      const p = l[code]
      if (p) out.push({ a: [p.x - (ax / n) * n, p.y - (ay / n) * n], b: [p.x + (ax / n) * n, p.y + (ay / n) * n], color: '#94a3b8', dashed: true })
    }
    out.push(line(r, lf, '#22d3ee'))
  }
  if (l.ChR && l.ChL) out.push(line(l.ChR, l.ChL, '#f472b6'))
  return out
}
const line = (a, b, color, label = null, dashed = false) => ({ a: [a.x, a.y], b: [b.x, b.y], color, label, dashed })
const overlayLines = computed(() => (showOverlay.value ? linesFor(payload.value) : []))

async function load () {
  try {
    list.value = (await orthoApi.analyses(props.caseId, 'face')).data || []
  } catch (e) {
    error.value = orthoError(e)
  }
}

function pickView (v) {
  pendingView.value = v
  picker.value = true
}

async function startEditor ({ analysis = null, file = null, v }) {
  current.value = analysis
  view.value = v
  fileId.value = analysis?.file_id || file?.id
  title.value = analysis?.title || viewLabel(v)
  analysisDate.value = analysis?.analysis_date || file?.meta?.captured_at || new Date().toISOString().slice(0, 10)
  landmarks.value = { ...(analysis?.data?.landmarks || {}) }
  sources.value = { ...(analysis?.data?.landmark_sources || {}) }
  calibration.value = { ...(analysis?.data?.calibration || {}) }
  activeCode.value = defsFor(v).find(d => !landmarks.value[d.code])?.code || null
  editing.value = true
  savedSnapshot.value = serialized()
  try {
    imageUrl.value = await fileObjectUrl(props.caseId, fileId.value)
  } catch (e) {
    error.value = orthoError(e, t('face.imageLoadFailed'))
  }
}

const startNew = file => startEditor({ file, v: pendingView.value })

async function open (a) {
  try {
    const full = (await orthoApi.analysis(props.caseId, a.id)).data
    startEditor({ analysis: full, v: full.data?.view || 'frontal' })
  } catch (e) {
    error.value = orthoError(e)
  }
}

function closeEditor () {
  if (dirty.value && !window.confirm(t('face.leaveConfirm'))) return
  editing.value = false
  emit('dirty', false)
}

function advance (code) {
  sources.value = { ...sources.value, [code]: 'manual' }
  activeCode.value = defs.value.find(d => !landmarks.value[d.code])?.code || null
}
function remove (code) {
  const l = { ...landmarks.value }; delete l[code]; landmarks.value = l
  const s = { ...sources.value }; delete s[code]; sources.value = s
}
function confirmSuggested () {
  const s = { ...sources.value }
  for (const c of suggested.value) s[c] = 'confirmed'
  sources.value = s
}
watch(landmarks, (now, before) => {
  for (const c of Object.keys(now)) {
    if (before?.[c] && sources.value[c] === 'auto' && (before[c].x !== now[c].x || before[c].y !== now[c].y)) sources.value = { ...sources.value, [c]: 'manual' }
  }
})

async function detect () {
  detecting.value = true
  error.value = ''
  try {
    const { detectFaceLandmarks } = await import('./mediapipe.js')
    const img = await loadImage(imageUrl.value)
    const codes = defs.value.filter(d => !d.manualOnly && !landmarks.value[d.code]).map(d => d.code)
    const found = await detectFaceLandmarks(img, codes)
    if (!Object.keys(found).length) { error.value = t('face.noFace'); return }
    landmarks.value = { ...landmarks.value, ...found }
    const s = { ...sources.value }
    for (const c of Object.keys(found)) s[c] = 'auto'
    sources.value = s
  } catch (e) {
    error.value = t('face.detectFailed') + (e?.message || e)
  } finally {
    detecting.value = false
  }
}

async function save () {
  if (suggested.value.length) { error.value = t('face.confirmBeforeSave'); return }
  saving.value = true
  error.value = ''
  try {
    const body = { title: title.value, analysis_date: analysisDate.value, data: payload.value }
    const res = current.value
      ? await orthoApi.updateAnalysis(props.caseId, current.value.id, { ...body, expected_revision: current.value.revision })
      : await orthoApi.createAnalysis(props.caseId, { ...body, type: 'face', file_id: fileId.value })
    current.value = res.data
    savedSnapshot.value = serialized()
    emit('changed')
    load()
  } catch (e) {
    error.value = e?.response?.status === 409 ? t('face.conflict') : orthoError(e)
  } finally {
    saving.value = false
  }
}

async function toggleReview () {
  reviewing.value = true
  try {
    current.value = (await orthoApi.reviewAnalysis(props.caseId, current.value.id, current.value.status !== 'reviewed')).data
    emit('changed')
    load()
  } catch (e) {
    error.value = orthoError(e)
  } finally {
    reviewing.value = false
  }
}

async function startCompare () {
  try {
    const all = (await orthoApi.analyses(props.caseId, 'face', true)).data || []
    const chosen = all.filter(a => selected.value.includes(a.id)).sort((a, b) => (a.analysis_date || '').localeCompare(b.analysis_date || ''))
    if (chosen.length !== 2 || chosen[0].data?.view !== chosen[1].data?.view) {
      error.value = t('face.sameView')
      return
    }
    const items = await Promise.all(chosen.map(async a => ({ analysis: a, url: await fileObjectUrl(props.caseId, a.file_id) })))
    compare.value = { items }
  } catch (e) {
    error.value = orthoError(e)
  }
}

const compareRows = computed(() => {
  if (!compare.value) return []
  const [a, b] = compare.value.items.map(i => analyzeFace(i.analysis.data))
  const valueAt = (r, path) => path.split('.').reduce((o, k) => o?.[k], r) ?? null
  const rows = a.view === 'profile'
    ? [['nasolabial', 'profile.nasolabial_angle'], ['convexity', 'profile.facial_convexity'], ['upperLipE', 'profile.upper_lip_E'], ['lowerLipE', 'profile.lower_lip_E']]
    : [['middleLower', 'thirds.middle_to_lower'], ['mouthAsym', 'symmetry.cheilion.asymmetry_pct'], ['mouthCant', 'symmetry.cheilion.cant_deg'], ['chinDeviation', 'midline_deviation.PogS'], ['smileIpd', 'smile.smile_to_interpupillary'], ['buccalPct', 'smile.buccal_corridor_pct']]
  return rows.map(([key, path]) => ({ label: t(`face.compareRows.${key}`), a: valueAt(a, path), b: valueAt(b, path) }))
})

// Compact results panel.
const FaceResults = defineComponent({
  props: { result: Object },
  setup (p) {
    const row = (label, value, unit = '') => h('div', { class: 'd-flex justify-space-between py-1', style: 'border-bottom:1px dashed rgba(0,0,0,.08)' }, [
      h('span', { class: 'text-body-2' }, label),
      h('span', { class: 'font-weight-bold', dir: 'ltr' }, value === null || value === undefined ? '—' : `${fmt(value, 2)}${unit}`)
    ])
    return () => {
      const r = p.result
      const u = r.length_unit === 'mm' ? ' mm' : ' px'
      if (r.view === 'profile') {
        const pr = r.profile
        return h('div', [
          row(t('face.results.nasolabial'), pr.nasolabial_angle, '°'),
          h('div', { class: 'text-caption text-medium-emphasis' }, 'Legan & Burstone 1980: 102 ± 8°'),
          row(t('face.results.convexity'), pr.facial_convexity, '°'),
          h('div', { class: 'text-caption text-medium-emphasis' }, 'Legan & Burstone 1980: 12 ± 4°'),
          row(t('face.results.upperLipE'), pr.upper_lip_E, u),
          row(t('face.results.lowerLipE'), pr.lower_lip_E, u),
          h('div', { class: 'text-caption text-medium-emphasis' }, t('face.results.rickettsNote'))
        ])
      }
      const th = r.thirds || {}
      const rows = [
        h('div', { class: 'text-subtitle-2 mt-1' }, t('face.results.thirds')),
        row(t('face.results.upperPct'), th.upper_pct, '%'), row(t('face.results.middlePct'), th.middle_pct, '%'), row(t('face.results.lowerPct'), th.lower_pct, '%'),
        row(t('face.results.middleToLower'), th.middle_to_lower), row('Sn–Sto / Sto–Me′', th.upper_lip_to_lower_face),
        h('div', { class: 'text-subtitle-2 mt-3' }, t('face.results.symmetry'))
      ]
      for (const [name, s] of Object.entries(r.symmetry || {})) {
        rows.push(row(t('face.results.asymmetry', { name: symName(name) }), s.asymmetry_pct, '%'))
        if (name !== 'pupils') rows.push(row(t('face.results.cant', { name: symName(name) }), s.cant_deg, '°'))
      }
      rows.push(h('div', { class: 'text-subtitle-2 mt-3' }, t('face.results.midline')))
      for (const [code, v] of Object.entries(r.midline_deviation || {})) rows.push(row(code, v, u))
      rows.push(h('div', { class: 'text-subtitle-2 mt-3' }, t('face.results.ratios')))
      rows.push(row(t('face.results.facialIndex'), r.proportions?.facial_index), row(t('face.results.intercanthalAlar'), r.proportions?.intercanthal_to_alar), row(t('face.results.mouthIpd'), r.proportions?.mouth_to_interpupillary))
      if (r.smile) {
        rows.push(h('div', { class: 'text-subtitle-2 mt-3' }, t('face.results.smile')))
        rows.push(row(t('face.results.smileWidth'), r.smile.smile_width, u), row(t('face.results.smileIpd'), r.smile.smile_to_interpupillary), row(t('face.results.buccal'), r.smile.buccal_corridor_pct, '%'), row(t('face.results.incisorDisplay'), r.smile.incisor_display, u), row(t('face.results.gingivalDisplay'), r.smile.gingival_display, u), row(t('face.results.dentalMidline'), r.smile.dental_midline_deviation, u))
      }
      return h('div', rows)
    }
  }
})
const SYMMETRY = ['pupils', 'exocanthion', 'endocanthion', 'alare', 'cheilion', 'zygion', 'gonion']
const symName = name => (SYMMETRY.includes(name) ? t(`face.symmetry.${name}`) : name)

onMounted(load)
</script>

<style scoped>
.face-body { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 12px; }
.face-canvas > :first-child { height: min(72vh, 820px); }
.face-side { border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); border-radius: 12px; display: flex; flex-direction: column; max-height: min(80vh, 900px); }
.face-scroll { overflow-y: auto; flex: 1; }
@media (max-width: 960px) {
  .face-body { grid-template-columns: 1fr; }
  .face-canvas > :first-child { height: 60vh; }
  .face-side { max-height: none; }
}
</style>
