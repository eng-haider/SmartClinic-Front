<template>
  <div class="ceph-editor">
    <!-- Toolbar -->
    <div class="ceph-toolbar">
      <v-btn variant="text" prepend-icon="mdi-arrow-right" @click="close">رجوع</v-btn>
      <v-text-field v-model="title" :readonly="!canManage" density="compact" variant="outlined" hide-details placeholder="عنوان التحليل" class="ceph-title" />
      <v-text-field v-model="analysisDate" :readonly="!canManage" type="date" density="compact" variant="outlined" hide-details class="ceph-date" />
      <v-spacer />
      <v-chip v-if="current" :color="current.status === 'reviewed' ? 'success' : 'grey'" variant="tonal" size="small">
        <v-icon start size="16">{{ current.status === 'reviewed' ? 'mdi-check-decagram' : 'mdi-pencil-outline' }}</v-icon>
        {{ current.status === 'reviewed' ? 'معتمد من الطبيب' : 'مسودة' }} · مراجعة {{ current.revision }}
      </v-chip>
      <v-btn v-if="canManage && current && !dirty" :color="current.status === 'reviewed' ? 'grey' : 'success'" variant="tonal" :loading="reviewing" prepend-icon="mdi-check-decagram-outline" @click="toggleReview">
        {{ current.status === 'reviewed' ? 'إلغاء الاعتماد' : 'اعتماد التحليل' }}
      </v-btn>
      <v-btn v-if="canManage" color="primary" :loading="saving" :disabled="!dirty && !!current" prepend-icon="mdi-content-save" @click="save">حفظ</v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-2" closable @click:close="error = ''">{{ error }}</v-alert>
    <v-alert v-if="suggestedCodes.length" type="warning" variant="tonal" density="compact" class="mb-2">
      {{ suggestedCodes.length }} نقطة مقترحة آلياً (بإطار متقطع). راجع كل نقطة وحرّكها إذا لزم، ثم اضغط «تأكيد النقاط المقترحة».
      <template #append><v-btn size="small" variant="tonal" @click="confirmSuggested">تأكيد النقاط المقترحة</v-btn></template>
    </v-alert>

    <div class="ceph-body">
      <!-- Canvas -->
      <div class="ceph-canvas">
        <LandmarkCanvas
          ref="canvasRef"
          v-model:landmarks="landmarks"
          v-model:active-code="activeCode"
          v-model:calibration="rulerCal"
          :src="imageUrl"
          :definitions="landmarkDefs"
          :tracing="CEPH_TRACING"
          :extra-lines="derivedLines"
          :mode="mode"
          :filters="filters"
          :suggested="suggestedCodes"
          :readonly="!canManage"
          :show-labels="showLabels"
          :show-tracing="showTracing"
          @placed="advance"
          @loaded="onImageLoaded"
        />
        <div class="ceph-imgtools">
          <v-btn-toggle v-model="mode" mandatory density="compact" color="primary" variant="outlined" divided>
            <v-btn value="place" size="small" prepend-icon="mdi-map-marker-plus-outline">وضع النقاط</v-btn>
            <v-btn value="pan" size="small" prepend-icon="mdi-hand-back-right-outline">تحريك</v-btn>
            <v-btn value="calibrate" size="small" prepend-icon="mdi-ruler">معايرة</v-btn>
          </v-btn-toggle>
          <div class="ceph-slider">
            <v-icon size="18">mdi-brightness-6</v-icon>
            <v-slider v-model="filters.brightness" :min="30" :max="250" :step="5" hide-details density="compact" color="primary" />
          </div>
          <div class="ceph-slider">
            <v-icon size="18">mdi-contrast-box</v-icon>
            <v-slider v-model="filters.contrast" :min="30" :max="300" :step="5" hide-details density="compact" color="primary" />
          </div>
          <v-btn size="small" variant="tonal" :color="filters.invert ? 'primary' : undefined" icon="mdi-invert-colors" title="عكس الألوان" @click="filters.invert = !filters.invert" />
          <v-btn size="small" variant="tonal" :color="showTracing ? 'primary' : undefined" icon="mdi-vector-polyline" title="خطوط التتبع" @click="showTracing = !showTracing" />
          <v-btn size="small" variant="tonal" :color="showLabels ? 'primary' : undefined" icon="mdi-label-outline" title="أسماء النقاط" @click="showLabels = !showLabels" />
          <v-btn v-if="detectionAvailable && canManage" size="small" variant="tonal" color="deep-purple" :loading="detecting" prepend-icon="mdi-auto-fix" @click="detect">اقتراح النقاط آلياً</v-btn>
        </div>

        <!-- Calibration -->
        <v-expand-transition>
          <v-card v-if="mode === 'calibrate'" variant="outlined" rounded="lg" class="pa-3 mt-2">
            <div class="text-body-2 mb-2">
              انقر على طرفي مسطرة المعايرة الظاهرة في الصورة ثم أدخل طولها الحقيقي. بدون معايرة تُعرض المسافات بالبكسل فقط.
            </div>
            <div class="d-flex flex-wrap ga-2 align-center">
              <v-text-field v-model.number="rulerCal.known_mm" type="number" min="0" step="0.5" label="الطول الحقيقي (ملم)" density="compact" variant="outlined" hide-details style="max-width:180px" :readonly="!canManage" />
              <span class="text-caption">أو</span>
              <v-text-field v-model.number="pixelSpacing.mm_per_px" type="number" min="0" step="0.001" label="ملم لكل بكسل (من الجهاز)" density="compact" variant="outlined" hide-details style="max-width:200px" :readonly="!canManage" />
              <v-text-field v-model.number="pixelSpacing.magnification" type="number" min="1" step="0.01" label="معامل التكبير" density="compact" variant="outlined" hide-details style="max-width:150px" :readonly="!canManage" />
              <v-btn size="small" variant="text" color="error" @click="clearCalibration">مسح المعايرة</v-btn>
            </div>
          </v-card>
        </v-expand-transition>
      </div>

      <!-- Side panel -->
      <div class="ceph-side">
        <v-tabs v-model="sideTab" density="compact" color="primary" grow>
          <v-tab value="landmarks">النقاط ({{ placedCount }}/{{ CEPH_LANDMARKS.length }})</v-tab>
          <v-tab value="results">القياسات</v-tab>
        </v-tabs>
        <v-divider />
        <div ref="sideScroll" class="ceph-side-scroll">
          <template v-if="sideTab === 'landmarks'">
            <v-chip-group v-model="groupFilter" class="px-2" selected-class="text-primary">
              <v-chip v-for="g in GROUPS" :key="g.value" :value="g.value" size="small" variant="outlined" filter>{{ g.title }}</v-chip>
            </v-chip-group>
            <v-list density="compact" nav class="py-0">
              <v-list-item
                v-for="lm in visibleLandmarks"
                :key="lm.code"
                :active="lm.code === activeCode"
                color="primary"
                rounded="lg"
                @click="selectLandmark(lm.code)"
              >
                <template #prepend>
                  <v-icon :color="landmarks[lm.code] ? (suggestedCodes.includes(lm.code) ? 'warning' : 'success') : 'grey'" size="18">
                    {{ landmarks[lm.code] ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                  </v-icon>
                </template>
                <v-list-item-title class="text-body-2">{{ lm.ar }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption">{{ lm.hint }}</v-list-item-subtitle>
                <template #append>
                  <v-btn v-if="landmarks[lm.code] && canManage" icon="mdi-close" size="x-small" variant="text" title="حذف النقطة" @click.stop="removeLandmark(lm.code)" />
                </template>
              </v-list-item>
            </v-list>
          </template>
          <template v-else>
            <CephMeasurementsTable :result="result" />
          </template>
        </div>
      </div>
    </div>

    <div class="text-caption text-medium-emphasis mt-2">
      القيم محسوبة هندسياً من النقاط التي يضعها الطبيب، وتُعاد حسابها في الخادم عند الحفظ. القيم المرجعية للمقارنة فقط ولا تمثل تشخيصاً، ويجب مراجعتها من الطبيب المختص.
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import LandmarkCanvas from '../LandmarkCanvas.vue'
import CephMeasurementsTable from './CephMeasurementsTable.vue'
import { CEPH_LANDMARKS, CEPH_TRACING, analyzeCeph } from '../../analysis/ceph.js'
import { orthoApi, orthoError } from '../../api.js'
import { fileObjectUrl } from '../../utils/blob.js'

const props = defineProps({
  caseId: { type: [Number, String], required: true },
  analysis: { type: Object, default: null }, // existing analysis (with data)
  file: { type: Object, default: null },     // ceph_xray file for a new analysis
  canManage: Boolean,
  detectionAvailable: Boolean
})
const emit = defineEmits(['close', 'saved', 'dirty'])

const GROUPS = [
  { value: null, title: 'الكل' }, { value: 'cranial', title: 'القاعدة القحفية' }, { value: 'maxilla', title: 'الفك العلوي' },
  { value: 'mandible', title: 'الفك السفلي' }, { value: 'dental', title: 'الأسنان' }, { value: 'soft', title: 'الأنسجة الرخوة' }
]
const landmarkDefs = CEPH_LANDMARKS.map(l => ({ ...l, short: l.code === 'PogS' ? "Pog'" : l.code }))

const current = ref(props.analysis)
const fileId = computed(() => current.value?.file_id || props.file?.id)
const imageUrl = ref('')
const title = ref(props.analysis?.title || 'تحليل سيفالومتري')
const analysisDate = ref(props.analysis?.analysis_date || new Date().toISOString().slice(0, 10))
const landmarks = ref({ ...(props.analysis?.data?.landmarks || {}) })
const sources = ref({ ...(props.analysis?.data?.landmark_sources || {}) })
const rulerCal = ref(pick(props.analysis?.data?.calibration, ['p1', 'p2', 'known_mm']))
const pixelSpacing = reactive(pick(props.analysis?.data?.calibration, ['mm_per_px', 'magnification']))
const filters = reactive({ brightness: 100, contrast: 100, invert: false, ...(props.analysis?.data?.display || {}) })
const activeCode = ref(null)
const mode = ref('place')
const sideTab = ref('landmarks')
const groupFilter = ref(null)
const showLabels = ref(true)
const showTracing = ref(true)
const saving = ref(false)
const reviewing = ref(false)
const detecting = ref(false)
const error = ref('')
const canvasRef = ref(null)
const sideScroll = ref(null)
const imageSize = ref(null)
const savedSnapshot = ref('')

function pick (obj, keys) {
  const out = {}
  for (const k of keys) if (obj?.[k] !== undefined && obj?.[k] !== null) out[k] = obj[k]
  return out
}

// Each side tab starts at its top.
watch(sideTab, () => { if (sideScroll.value) sideScroll.value.scrollTop = 0 })

const suggestedCodes = computed(() => Object.keys(sources.value).filter(c => sources.value[c] === 'auto' && landmarks.value[c]))
const placedCount = computed(() => CEPH_LANDMARKS.filter(l => landmarks.value[l.code]).length)
const visibleLandmarks = computed(() => CEPH_LANDMARKS.filter(l => !groupFilter.value || l.group === groupFilter.value))

const calibration = computed(() => {
  if (rulerCal.value?.p1 && rulerCal.value?.p2 && Number(rulerCal.value.known_mm) > 0) return { ...rulerCal.value }
  if (Number(pixelSpacing.mm_per_px) > 0) return { mm_per_px: Number(pixelSpacing.mm_per_px), magnification: Number(pixelSpacing.magnification) || 1 }
  return rulerCal.value?.p1 ? { p1: rulerCal.value.p1, p2: rulerCal.value.p2 } : {}
})

const payloadData = computed(() => ({
  landmarks: landmarks.value,
  landmark_sources: sources.value,
  calibration: calibration.value,
  display: { brightness: filters.brightness, contrast: filters.contrast, invert: filters.invert },
  image: imageSize.value
}))
const result = computed(() => analyzeCeph(payloadData.value))

// Occlusal plane (incisal overlap -> molar overlap), drawn for Wits / Downs.
const derivedLines = computed(() => {
  const l = landmarks.value
  const lines = []
  if (l.U1T && l.L1T && l.U6 && l.L6) {
    const a = [(l.U1T.x + l.L1T.x) / 2, (l.U1T.y + l.L1T.y) / 2]
    const b = [(l.U6.x + l.L6.x) / 2, (l.U6.y + l.L6.y) / 2]
    lines.push({ a, b, color: '#e879f9', label: 'OP' })
  }
  return lines
})

// The image size is filled in when the radiograph loads - not an edit.
const serialized = () => {
  const { image, ...data } = payloadData.value
  return JSON.stringify({ d: data, t: title.value, a: analysisDate.value })
}
const dirty = computed(() => current.value ? serialized() !== savedSnapshot.value : placedCount.value > 0)
watch(dirty, v => emit('dirty', v), { immediate: true })

function selectLandmark (code) {
  activeCode.value = code
  mode.value = 'place'
  if (landmarks.value[code]) canvasRef.value?.focusPoint(code)
}

// After a landmark is placed, move on to the next missing one.
function advance (code) {
  sources.value = { ...sources.value, [code]: 'manual' }
  const order = CEPH_LANDMARKS.map(l => l.code)
  const start = order.indexOf(code)
  const next = [...order.slice(start + 1), ...order.slice(0, start)].find(c => !landmarks.value[c])
  activeCode.value = next || null
}

// A dragged suggestion becomes the doctor's own point.
watch(landmarks, (now, before) => {
  for (const code of Object.keys(now)) {
    if (before?.[code] && sources.value[code] === 'auto' && (before[code].x !== now[code].x || before[code].y !== now[code].y)) {
      sources.value = { ...sources.value, [code]: 'manual' }
    }
  }
})

function removeLandmark (code) {
  const next = { ...landmarks.value }
  delete next[code]
  landmarks.value = next
  const s = { ...sources.value }
  delete s[code]
  sources.value = s
}

function clearCalibration () {
  rulerCal.value = {}
  pixelSpacing.mm_per_px = undefined
  pixelSpacing.magnification = undefined
}

function confirmSuggested () {
  const s = { ...sources.value }
  for (const c of suggestedCodes.value) s[c] = 'confirmed'
  sources.value = s
}

async function detect () {
  if (!fileId.value) return
  detecting.value = true
  error.value = ''
  try {
    const res = await orthoApi.detectLandmarks(props.caseId, fileId.value)
    const found = res.data?.landmarks || {}
    const next = { ...landmarks.value }
    const s = { ...sources.value }
    // Never overwrite a point the doctor already placed.
    for (const [code, p] of Object.entries(found)) {
      if (!next[code]) { next[code] = p; s[code] = 'auto' }
    }
    landmarks.value = next
    sources.value = s
  } catch (e) {
    error.value = orthoError(e)
  } finally {
    detecting.value = false
  }
}

function onImageLoaded (sz) {
  imageSize.value = sz
}

async function save () {
  if (!props.canManage) return
  if (suggestedCodes.value.length) {
    error.value = 'أكّد النقاط المقترحة آلياً أو حرّكها قبل الحفظ.'
    return
  }
  saving.value = true
  error.value = ''
  try {
    const body = { title: title.value, analysis_date: analysisDate.value, data: payloadData.value }
    const res = current.value
      ? await orthoApi.updateAnalysis(props.caseId, current.value.id, { ...body, expected_revision: current.value.revision })
      : await orthoApi.createAnalysis(props.caseId, { ...body, type: 'ceph', file_id: fileId.value })
    current.value = res.data
    savedSnapshot.value = serialized()
    emit('saved', res.data)
  } catch (e) {
    error.value = e?.response?.status === 409
      ? 'عدّل مستخدم آخر هذا التحليل. أعد فتحه لرؤية آخر نسخة قبل الحفظ (لم يُحذف شيء).'
      : orthoError(e)
  } finally {
    saving.value = false
  }
}

async function toggleReview () {
  reviewing.value = true
  error.value = ''
  try {
    const res = await orthoApi.reviewAnalysis(props.caseId, current.value.id, current.value.status !== 'reviewed')
    current.value = res.data
    emit('saved', res.data)
  } catch (e) {
    error.value = orthoError(e)
  } finally {
    reviewing.value = false
  }
}

function close () {
  emit('close', { dirty: dirty.value })
}

function beforeUnload (e) {
  if (dirty.value) { e.preventDefault(); e.returnValue = '' }
}

onMounted(async () => {
  if (current.value) savedSnapshot.value = serialized()
  activeCode.value = CEPH_LANDMARKS.find(l => !landmarks.value[l.code])?.code || null
  window.addEventListener('beforeunload', beforeUnload)
  try {
    if (fileId.value) imageUrl.value = await fileObjectUrl(props.caseId, fileId.value)
  } catch (e) {
    error.value = orthoError(e, 'تعذر تحميل صورة الأشعة')
  }
})
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))

defineExpose({ snapshot: () => canvasRef.value?.snapshot(), dirty })
</script>

<style scoped>
.ceph-editor { display: flex; flex-direction: column; gap: 8px; }
.ceph-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.ceph-title { max-width: 260px; min-width: 160px; }
.ceph-date { max-width: 170px; }
.ceph-body { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 12px; }
.ceph-canvas { display: flex; flex-direction: column; min-width: 0; }
.ceph-canvas > :first-child { height: min(72vh, 820px); }
.ceph-imgtools { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 8px; }
.ceph-slider { display: flex; align-items: center; gap: 4px; width: 150px; }
.ceph-side { border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); border-radius: 12px; display: flex; flex-direction: column; max-height: min(80vh, 900px); }
.ceph-side-scroll { overflow-y: auto; flex: 1; }
@media (max-width: 960px) {
  .ceph-body { grid-template-columns: 1fr; }
  .ceph-canvas > :first-child { height: 60vh; }
  .ceph-side { max-height: none; }
}
</style>
