<template>
  <div class="cbct-viewer">
    <div class="d-flex flex-wrap align-center ga-2 mb-2">
      <v-btn variant="text" :prepend-icon="backIcon" @click="$emit('close')">{{ t('common.back') }}</v-btn>
      <div>
        <div class="text-subtitle-1 font-weight-bold">{{ study.description || t('cbct.defaultTitle') }}</div>
        <div class="text-caption text-medium-emphasis">{{ study.study_date || '' }} · {{ t('cbct.slices', { n: study.instances_count }) }} · {{ study.modality || '' }}</div>
      </div>
      <v-spacer />
      <template v-if="ready">
        <v-btn-toggle v-model="tool" mandatory density="compact" variant="outlined" divided color="primary">
          <v-btn value="WindowLevel" size="small" :title="t('cbct.tools.windowLevel')"><v-icon>mdi-contrast-circle</v-icon></v-btn>
          <v-btn value="Pan" size="small" :title="t('cbct.tools.pan')"><v-icon>mdi-hand-back-right-outline</v-icon></v-btn>
          <v-btn value="Zoom" size="small" :title="t('cbct.tools.zoom')"><v-icon>mdi-magnify</v-icon></v-btn>
          <v-btn value="Length" size="small" :title="t('cbct.tools.length')"><v-icon>mdi-ruler</v-icon></v-btn>
          <v-btn value="Angle" size="small" :title="t('cbct.tools.angle')"><v-icon>mdi-angle-acute</v-icon></v-btn>
          <v-btn value="Crosshairs" size="small" :title="t('cbct.tools.crosshairs')"><v-icon>mdi-crosshairs</v-icon></v-btn>
        </v-btn-toggle>
        <v-menu>
          <template #activator="{ props: mp }"><v-btn v-bind="mp" size="small" variant="tonal" prepend-icon="mdi-tune-variant">{{ t('cbct.window') }}</v-btn></template>
          <v-list density="compact">
            <v-list-item v-for="p in PRESETS" :key="p.title" :title="p.title" @click="viewer.setVOI(p.lower, p.upper)" />
          </v-list>
        </v-menu>
        <v-btn size="small" variant="tonal" icon="mdi-restore" :title="t('cbct.reset')" @click="viewer.resetViews()" />
        <v-btn size="small" variant="tonal" color="deep-purple" prepend-icon="mdi-panorama-horizontal-outline" @click="showPanoramic = true">{{ t('cbct.panoramic') }}</v-btn>
        <v-btn v-if="canManage" size="small" color="primary" :loading="saving" prepend-icon="mdi-content-save" @click="save">{{ t('cbct.saveMeasurements') }}</v-btn>
      </template>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-2">{{ error }}</v-alert>

    <div v-if="!ready && !error" class="cbct-loading">
      <v-progress-circular :model-value="progress * 100" size="72" width="6" color="primary">{{ Math.round(progress * 100) }}%</v-progress-circular>
      <div class="mt-3">{{ stageLabel }}</div>
      <div class="text-caption text-medium-emphasis">{{ t('cbct.secure') }}</div>
    </div>

    <div v-show="ready" class="cbct-layout">
      <div class="cbct-grid" :class="{ 'cbct-grid--single': single }">
        <div v-for="vp in VIEWPORT_LIST" v-show="!single || single === vp.id" :key="vp.id" class="cbct-cell">
          <div :ref="el => (elements[vp.id] = el)" class="cbct-element" @contextmenu.prevent />
          <div class="cbct-label">{{ vp.label }}</div>
          <v-btn class="cbct-max" size="x-small" variant="tonal" :icon="single === vp.id ? 'mdi-arrow-collapse' : 'mdi-arrow-expand'" @click="toggleSingle(vp.id)" />
        </div>
      </div>
      <div class="cbct-side">
        <div class="text-subtitle-2 mb-2">{{ t('cbct.measurementsCount', { n: measurements.length }) }}</div>
        <v-list v-if="measurements.length" density="compact" class="pa-0">
          <v-list-item v-for="(m, i) in measurements" :key="i">
            <v-text-field v-model="labels[i]" :placeholder="m.type === 'angle' ? t('cbct.angle') : t('cbct.distance')" density="compact" variant="plain" hide-details />
            <template #append><span dir="ltr" class="font-weight-bold">{{ m.display }}</span></template>
          </v-list-item>
        </v-list>
        <div v-else class="text-caption text-medium-emphasis">{{ t('cbct.useTools') }}</div>
        <v-divider class="my-3" />
        <div class="text-caption text-medium-emphasis">
          {{ t('cbct.help', { voxel: voxelText }) }}
        </div>
        <v-btn v-if="canManage && measurements.length" size="small" variant="text" color="error" class="mt-2" @click="viewer.clearMeasurements(); refreshMeasurements()">{{ t('cbct.clearAll') }}</v-btn>
      </div>
    </div>

    <CbctPanoramic
      v-if="showPanoramic"
      :volume-loader="getGeometry"
      :saved="analysis?.data || {}"
      :can-manage="canManage"
      @close="showPanoramic = false"
      @save="savePanoramic"
    />
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, markRaw, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { orthoApi, orthoError } from '../../api.js'
import { fmt } from '../../utils/format.js'
import { useOrthoI18n } from '../../i18n.js'

const CbctPanoramic = defineAsyncComponent(() => import('./CbctPanoramic.vue'))

const props = defineProps({ caseId: { type: [Number, String], required: true }, study: { type: Object, required: true }, canManage: Boolean })
const emit = defineEmits(['close', 'saved'])

const { t, backIcon } = useOrthoI18n()
const PRESETS = computed(() => [
  { title: t('cbct.presets.bone'), lower: -500, upper: 1500 },
  { title: t('cbct.presets.teeth'), lower: -500, upper: 2500 },
  { title: t('cbct.presets.soft'), lower: -160, upper: 240 },
  { title: t('cbct.presets.wide'), lower: -1000, upper: 3000 }
])
const VIEWPORT_LIST = computed(() => [
  { id: 'ortho-axial', label: t('cbct.viewports.axial') },
  { id: 'ortho-coronal', label: t('cbct.viewports.coronal') },
  { id: 'ortho-sagittal', label: t('cbct.viewports.sagittal') },
  { id: 'ortho-3d', label: t('cbct.viewports.volume') }
])

// Plain object on purpose: Cornerstone needs the real DOM elements, not
// reactive proxies of them.
const elements = {}
const viewer = shallowRef(null)
let cs = null
let loaded = null
let stopListening = null
const ready = ref(false)
const progress = ref(0)
const stage = ref('download')
const error = ref('')
const tool = ref('WindowLevel')
const single = ref(null)
const measurements = ref([])
const labels = ref([])
const saving = ref(false)
const analysis = ref(null)
const showPanoramic = ref(false)
const spacing = ref(null)

const stageLabel = computed(() => (['download', 'decode', 'render'].includes(stage.value) ? t(`cbct.stage.${stage.value}`) : ''))
const voxelText = computed(() => spacing.value ? spacing.value.map(v => v.toFixed(2)).join(' × ') + ' mm' : '—')

watch(tool, t => viewer.value?.setPrimaryTool(viewer.value.tools[t]))

function toggleSingle (id) {
  single.value = single.value === id ? null : id
  nextTick(() => viewer.value?.resize())
}

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
function angle (a, b, c) {
  const u = a.map((v, i) => v - b[i]); const w = c.map((v, i) => v - b[i])
  const d = u[0] * w[0] + u[1] * w[1] + u[2] * w[2]
  return (Math.acos(Math.max(-1, Math.min(1, d / (Math.hypot(...u) * Math.hypot(...w))))) * 180) / Math.PI
}

function refreshMeasurements () {
  const list = viewer.value?.exportMeasurements() || []
  measurements.value = list.map(m => ({ ...m, display: m.type === 'angle' ? `${fmt(angle(...m.points.slice(0, 3)))}°` : `${fmt(dist(m.points[0], m.points[1]), 2)} mm` }))
  labels.value = list.map((m, i) => labels.value[i] ?? m.label ?? '')
}

async function getGeometry () {
  return cs.volumeGeometry(loaded.volume)
}

async function load () {
  try {
    const [{ data: detail }, lib, analyses] = await Promise.all([
      orthoApi.cbctStudy(props.caseId, props.study.id),
      import('./cornerstone.js'),
      orthoApi.analyses(props.caseId, 'cbct', true)
    ])
    cs = lib
    analysis.value = (analyses.data || []).find(a => a.cbct_study_id === props.study.id) || null

    stage.value = 'download'
    loaded = await cs.loadStudyVolume({ caseId: props.caseId, study: props.study, instances: detail.instances, onProgress: p => { progress.value = p * 0.6 } })
    spacing.value = loaded.volume.spacing

    stage.value = 'render'
    ready.value = true
    await nextTick()
    viewer.value = markRaw(await cs.createViewer({ ...elements }, loaded.volumeId))

    stage.value = 'decode'
    const loading = cs.whenVolumeLoaded(loaded.volume, p => { progress.value = 0.6 + p * 0.4 })
    if (props.study.viewer_state?.viewports) viewer.value.applyState(props.study.viewer_state)
    stopListening = viewer.value.onAnnotationsChanged(refreshMeasurements)
    await loading
    if (analysis.value?.data?.measurements?.length) {
      labels.value = analysis.value.data.measurements.map(m => m.label || '')
      viewer.value.restoreMeasurements(analysis.value.data.measurements)
    }
    refreshMeasurements()
  } catch (e) {
    error.value = e?.response ? orthoError(e) : (e?.message || t('cbct.openFailed'))
    ready.value = false
  }
}

async function persist (patch) {
  const data = { ...(analysis.value?.data || {}), ...patch }
  const res = analysis.value
    ? await orthoApi.updateAnalysis(props.caseId, analysis.value.id, { data, expected_revision: analysis.value.revision })
    : await orthoApi.createAnalysis(props.caseId, { type: 'cbct', cbct_study_id: props.study.id, title: props.study.description || t('cbct.measurementsTitle'), data })
  analysis.value = res.data
  emit('saved', res.data)
}

async function save () {
  saving.value = true
  error.value = ''
  try {
    refreshMeasurements()
    await persist({ measurements: measurements.value.map((m, i) => ({ type: m.type, label: labels.value[i] || '', points: m.points, annotation: m.annotation })) })
    await orthoApi.saveCbctViewerState(props.caseId, props.study.id, viewer.value.getState())
  } catch (e) {
    error.value = e?.response?.status === 409 ? t('cbct.conflict') : orthoError(e)
  } finally {
    saving.value = false
  }
}

async function savePanoramic (patch) {
  try {
    await persist(patch)
  } catch (e) {
    error.value = orthoError(e)
  }
}

onMounted(load)
onBeforeUnmount(() => {
  stopListening?.()
  viewer.value?.dispose()
  loaded?.release()
})
</script>

<style scoped>
.cbct-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 420px; }
.cbct-layout { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 12px; }
.cbct-grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 6px; height: min(78vh, 860px); min-height: 420px; }
.cbct-grid--single { grid-template-columns: 1fr; grid-template-rows: 1fr; }
.cbct-cell { position: relative; background: #000; border-radius: 10px; overflow: hidden; min-height: 0; }
.cbct-element { position: absolute; inset: 0; }
.cbct-label { position: absolute; top: 6px; inset-inline-start: 8px; color: #e2e8f0; font-size: 12px; background: rgba(0, 0, 0, 0.5); padding: 2px 8px; border-radius: 999px; pointer-events: none; }
.cbct-max { position: absolute; top: 6px; inset-inline-end: 6px; }
.cbct-side { border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); border-radius: 12px; padding: 12px; overflow-y: auto; max-height: min(78vh, 860px); }
@media (max-width: 960px) {
  .cbct-layout { grid-template-columns: 1fr; }
  .cbct-grid { grid-template-columns: 1fr; grid-template-rows: repeat(4, 60vw); height: auto; }
  .cbct-grid--single { grid-template-rows: 70vh; }
  .cbct-side { max-height: none; }
}
</style>
