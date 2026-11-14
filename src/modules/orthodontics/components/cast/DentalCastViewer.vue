<template>
  <div class="cast">
    <div class="d-flex flex-wrap align-center ga-2 mb-3">
      <div>
        <div class="text-h6">تحليل الموديلات ثلاثية الأبعاد</div>
        <div class="text-caption text-medium-emphasis">Bolton · Space / Carey · Pont · Tanaka-Johnston · Moyers · Curve of Spee</div>
      </div>
      <v-spacer />
      <v-select v-model="selectedAnalysisId" :items="analysisItems" label="التحليل" density="compact" variant="outlined" hide-details style="max-width:260px" />
      <v-btn v-if="canManage" color="primary" variant="tonal" prepend-icon="mdi-cube-scan" @click="picker = true">إضافة نموذج</v-btn>
      <v-btn v-if="canManage" color="primary" :loading="saving" :disabled="!dirty" prepend-icon="mdi-content-save" @click="save">حفظ</v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-2" closable @click:close="error = ''">{{ error }}</v-alert>
    <v-alert v-if="unitsWarning" type="warning" variant="tonal" density="compact" class="mb-2">{{ unitsWarning }}</v-alert>

    <div class="cast-body">
      <div class="cast-left">
        <!-- Loaded models -->
        <div class="d-flex flex-wrap ga-2 mb-2">
          <v-chip v-for="m in models" :key="m.file.id" :color="m.visible ? 'primary' : undefined" variant="tonal" size="small" @click="toggleModel(m)">
            <v-icon start size="16">{{ m.visible ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
            {{ KIND_AR[m.file.kind] }} · {{ m.file.meta?.units_confirmed ? `${unitLabel(m.file.meta)}` : 'الوحدة غير مؤكدة' }}
            <v-icon end size="16" @click.stop="openUnits(m)">mdi-ruler-square</v-icon>
          </v-chip>
        </div>

        <div ref="sceneEl" class="cast-scene" @pointerdown="onDown" @pointerup="onUp">
          <div v-if="loadingModels" class="cast-overlay">
            <v-progress-circular :model-value="loadProgress * 100" color="primary" size="56">{{ Math.round(loadProgress * 100) }}%</v-progress-circular>
          </div>
          <div v-else-if="!models.length" class="cast-overlay text-medium-emphasis">
            <v-icon size="48">mdi-cube-outline</v-icon>
            <div>أضف نموذج الفك العلوي و/أو السفلي (STL / PLY / OBJ)</div>
          </div>
          <div v-if="pickHint" class="cast-hint">{{ pickHint }}</div>
        </div>

        <div class="d-flex flex-wrap align-center ga-2 mt-2">
          <v-btn-toggle density="compact" variant="outlined" divided>
            <v-btn v-for="v in VIEWS" :key="v.value" size="small" @click="scene?.setView(v.value)">{{ v.title }}</v-btn>
          </v-btn-toggle>
          <div class="d-flex align-center ga-1" style="width:200px">
            <v-icon size="18">mdi-opacity</v-icon>
            <v-slider v-model="opacity" :min="0.15" :max="1" :step="0.05" hide-details density="compact" color="primary" />
          </div>
        </div>
      </div>

      <div class="cast-side">
        <v-tabs v-model="sideTab" density="compact" grow color="primary">
          <v-tab value="tools">القياس</v-tab>
          <v-tab value="results">النتائج</v-tab>
        </v-tabs>
        <v-divider />
        <div class="cast-side-scroll pa-3">
          <template v-if="sideTab === 'tools'">
            <v-select v-model="tool" :items="TOOLS" label="أداة الاختيار" density="compact" variant="outlined" hide-details class="mb-3" :disabled="!canManage" />

            <!-- Tooth widths -->
            <template v-if="tool === 'tooth'">
              <div class="text-caption mb-1">اختر السن ثم انقر على نقطة التماس الأنسية ثم الوحشية</div>
              <div v-for="row in TOOTH_ROWS" :key="row.label" class="mb-2">
                <div class="text-caption text-medium-emphasis">{{ row.label }}</div>
                <div class="d-flex flex-wrap ga-1" dir="ltr">
                  <v-chip v-for="t in row.teeth" :key="t" size="small" :color="t === activeTooth ? 'primary' : (data.teeth[t] ? 'success' : undefined)" :variant="t === activeTooth ? 'flat' : 'tonal'" @click="activeTooth = t; toothStep = 'mesial'">{{ t }}</v-chip>
                </div>
              </div>
              <div v-if="activeTooth" class="d-flex align-center ga-2 mt-2">
                <v-text-field v-model.number="manualWidth" type="number" min="0" step="0.1" :label="`عرض ${activeTooth} بالمسماك (ملم)`" density="compact" variant="outlined" hide-details />
                <v-btn size="small" variant="tonal" @click="setManualWidth">تطبيق</v-btn>
                <v-btn size="small" variant="text" color="error" icon="mdi-close" @click="clearTooth(activeTooth)" />
              </div>
            </template>

            <!-- Named points -->
            <template v-if="tool === 'point'">
              <v-btn-toggle v-model="arch" mandatory density="compact" variant="outlined" divided class="mb-2">
                <v-btn value="upper" size="small">الفك العلوي</v-btn>
                <v-btn value="lower" size="small">الفك السفلي</v-btn>
              </v-btn-toggle>
              <v-list density="compact" nav class="pa-0">
                <v-list-item v-for="p in pointList" :key="p.key" :active="p.key === activePoint" color="primary" rounded="lg" @click="activePoint = p.key">
                  <template #prepend><v-icon size="16" :color="data.points[arch]?.[p.key] ? 'success' : 'grey'">{{ data.points[arch]?.[p.key] ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon></template>
                  <v-list-item-title class="text-body-2">{{ p.ar }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </template>

            <!-- Perimeter -->
            <template v-if="tool === 'perimeter'">
              <v-btn-toggle v-model="arch" mandatory density="compact" variant="outlined" divided class="mb-2">
                <v-btn value="upper" size="small">العلوي</v-btn>
                <v-btn value="lower" size="small">السفلي</v-btn>
              </v-btn-toggle>
              <div class="text-caption mb-2">انقر نقاط التماس بالترتيب من أنسي الرحى الأولى إلى أنسي الرحى الأولى المقابلة.</div>
              <div class="d-flex ga-2">
                <v-chip size="small">{{ (data.arch_perimeter[arch] || []).length }} نقطة</v-chip>
                <v-btn size="small" variant="text" @click="undoLast(data.arch_perimeter, arch)">تراجع</v-btn>
                <v-btn size="small" variant="text" color="error" @click="data.arch_perimeter[arch] = []">مسح</v-btn>
              </div>
            </template>

            <!-- Curve of Spee -->
            <template v-if="tool === 'spee'">
              <v-select v-model="speeTarget" :items="SPEE_TARGETS" density="compact" variant="outlined" hide-details class="mb-2" />
              <div class="text-caption">يُبنى المستوى من نقطة القواطع والحدبتين الوحشيتين للرحى الأخيرة، ثم يُقاس أعمق بُعد للحدبات الشدقية.</div>
              <div class="d-flex ga-2 mt-2">
                <v-chip size="small">يمين: {{ (data.spee.cusps_right || []).length }}</v-chip>
                <v-chip size="small">يسار: {{ (data.spee.cusps_left || []).length }}</v-chip>
                <v-btn size="small" variant="text" color="error" @click="data.spee = {}">مسح</v-btn>
              </div>
            </template>

            <!-- Segments (mixed dentition available space) -->
            <template v-if="tool === 'segment'">
              <v-select v-model="segment" :items="SEGMENTS" density="compact" variant="outlined" hide-details class="mb-2" />
              <div class="text-caption">المسافة المتاحة للناب والضواحك: من وحشي القاطع الجانبي إلى أنسي الرحى الأولى (نقرتان أو أكثر).</div>
              <v-btn size="small" variant="text" color="error" class="mt-1" @click="data.segments[segment] = []">مسح</v-btn>
            </template>

            <!-- Free distances -->
            <template v-if="tool === 'distance'">
              <div class="text-caption mb-2">انقر نقطتين على النموذج لقياس المسافة بينهما.</div>
              <v-list density="compact" class="pa-0">
                <v-list-item v-for="(d, i) in results.distances" :key="i">
                  <v-text-field v-model="data.distances[i].label" density="compact" variant="plain" hide-details />
                  <template #append>
                    <span dir="ltr" class="font-weight-bold me-2">{{ fmt(d.value, 2) }} {{ d.unit === 'mm' ? 'mm' : 'u' }}</span>
                    <v-btn icon="mdi-close" size="x-small" variant="text" @click="data.distances.splice(i, 1)" />
                  </template>
                </v-list-item>
              </v-list>
            </template>
          </template>
          <DentalCastMeasurements v-else :results="results" />
        </div>
      </div>
    </div>

    <OrthoFilePicker v-model="picker" :case-id="caseId" :kinds="['model_upper', 'model_lower', 'model_combined']" title="نماذج ثلاثية الأبعاد" icon="mdi-cube-scan" :can-manage="canManage" @selected="addModelFile" />

    <!-- Units confirmation -->
    <v-dialog v-model="unitsDialog" max-width="460">
      <v-card v-if="unitsModel" rounded="xl">
        <v-card-title>تأكيد وحدة النموذج</v-card-title>
        <v-card-text>
          <p class="text-body-2 mb-2">ملفات STL لا تحفظ الوحدة. حدّد الوحدة التي صُدّر بها النموذج من الماسح أو البرنامج - لا تُحسب أي قيمة بالملم قبل التأكيد.</p>
          <div class="text-caption mb-2" dir="ltr">Bounding box: {{ unitsModel.size.map(v => v.toFixed(2)).join(' × ') }} (model units)</div>
          <v-alert v-if="unitsGuess" type="info" variant="tonal" density="compact" class="mb-3">{{ unitsGuess }}</v-alert>
          <v-radio-group v-model="unitsChoice" :disabled="!canManage">
            <v-radio value="mm" label="ملم (mm)" />
            <v-radio value="cm" label="سنتيمتر (cm)" />
            <v-radio value="inch" label="إنش (inch)" />
            <v-radio value="m" label="متر (m)" />
            <v-radio value="custom" label="معامل مخصص" />
          </v-radio-group>
          <v-text-field v-if="unitsChoice === 'custom'" v-model.number="unitsCustom" type="number" min="0" step="0.0001" label="ملم لكل وحدة نموذج" density="compact" variant="outlined" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="unitsDialog = false">إلغاء</v-btn>
          <v-btn v-if="canManage" color="primary" :loading="savingUnits" :disabled="!unitsChoice" @click="confirmUnits">تأكيد</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, markRaw, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import OrthoFilePicker from '../OrthoFilePicker.vue'
import DentalCastMeasurements from './DentalCastMeasurements.vue'
import { CAST_POINTS, analyzeCast } from '../../analysis/cast.js'
import { orthoApi, orthoError } from '../../api.js'
import { fmt } from '../../utils/format.js'

const props = defineProps({ caseId: { type: [Number, String], required: true }, canManage: Boolean })
const emit = defineEmits(['dirty', 'changed'])

const KIND_AR = { model_upper: 'الفك العلوي', model_lower: 'الفك السفلي', model_combined: 'نموذج مدمج' }
const VIEWS = [{ value: 'front', title: 'أمامي' }, { value: 'top', title: 'علوي' }, { value: 'bottom', title: 'سفلي' }, { value: 'right', title: 'يمين' }, { value: 'left', title: 'يسار' }, { value: 'iso', title: 'منظور' }]
const TOOLS = [
  { value: 'none', title: 'تصفح فقط' }, { value: 'tooth', title: 'عرض الأسنان (Bolton / المسافة)' }, { value: 'point', title: 'نقاط القوس' },
  { value: 'perimeter', title: 'محيط القوس' }, { value: 'spee', title: 'منحنى سبي' }, { value: 'segment', title: 'المسافة المتاحة (أسنان مختلطة)' }, { value: 'distance', title: 'قياس مسافة' }
]
const TOOTH_ROWS = [
  { label: 'العلوي', teeth: [17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27] },
  { label: 'السفلي', teeth: [47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37] }
]
const SPEE_TARGETS = [
  { value: 'incisal', title: 'نقطة القواطع السفلية' }, { value: 'molar_right', title: 'الحدبة الوحشية للرحى الأخيرة - يمين' },
  { value: 'molar_left', title: 'الحدبة الوحشية للرحى الأخيرة - يسار' }, { value: 'cusps_right', title: 'حدبات شدقية - يمين (إضافة)' }, { value: 'cusps_left', title: 'حدبات شدقية - يسار (إضافة)' }
]
const SEGMENTS = [{ value: 'upper_right', title: 'علوي يمين' }, { value: 'upper_left', title: 'علوي يسار' }, { value: 'lower_right', title: 'سفلي يمين' }, { value: 'lower_left', title: 'سفلي يسار' }]

const emptyData = () => ({ teeth: {}, points: { upper: {}, lower: {} }, arch_perimeter: { upper: [], lower: [] }, spee: {}, segments: {}, distances: [], model_file_ids: {} })

const sceneEl = ref(null)
const scene = shallowRef(null)
const models = ref([]) // { file, visible, size }
const analyses = ref([])
const selectedAnalysisId = ref('new')
const current = ref(null)
const data = reactive(emptyData())
const savedSnapshot = ref(JSON.stringify(emptyData()))
const tool = ref('none')
const arch = ref('upper')
const activeTooth = ref(null)
const toothStep = ref('mesial')
const manualWidth = ref(null)
const activePoint = ref('incisal')
const speeTarget = ref('incisal')
const segment = ref('upper_right')
const pendingDistance = ref(null)
const opacity = ref(1)
const sideTab = ref('tools')
const picker = ref(false)
const loadingModels = ref(false)
const loadProgress = ref(0)
const saving = ref(false)
const error = ref('')
const unitsDialog = ref(false)
const unitsModel = ref(null)
const unitsChoice = ref(null)
const unitsCustom = ref(null)
const savingUnits = ref(false)

const analysisItems = computed(() => [{ value: 'new', title: 'تحليل جديد' }, ...analyses.value.map(a => ({ value: a.id, title: `${a.title || 'تحليل موديلات'} · ${a.analysis_date}${a.status === 'reviewed' ? ' ✓' : ''}` }))])
const pointList = computed(() => CAST_POINTS.filter(p => !p.arch || p.arch === arch.value))

// One scale for the whole analysis: every visible model must be confirmed
// with the same units.
const scaleToMm = computed(() => {
  const ms = models.value.map(m => m.file.meta || {})
  if (!ms.length || ms.some(m => !m.units_confirmed)) return null
  const scales = [...new Set(ms.map(m => Number(m.scale_to_mm)))]
  return scales.length === 1 ? scales[0] : null
})
const unitsWarning = computed(() => {
  if (!models.value.length) return ''
  if (models.value.some(m => !m.file.meta?.units_confirmed)) return 'وحدة أحد النماذج غير مؤكدة: القياسات معروضة بوحدات النموذج وليست بالملم. اضغط أيقونة المسطرة على النموذج لتأكيد الوحدة.'
  if (scaleToMm.value === null) return 'النماذج مؤكدة بوحدات مختلفة؛ لا يمكن جمع قياساتها في تحليل واحد.'
  return ''
})
const unitLabel = meta => ({ mm: 'ملم', cm: 'سم', inch: 'إنش', m: 'متر', custom: `×${meta.scale_to_mm}` }[meta.units] || '')

const payload = computed(() => ({ ...JSON.parse(JSON.stringify(data)), scale_to_mm: scaleToMm.value }))
const results = computed(() => analyzeCast(payload.value))
const dirty = computed(() => JSON.stringify(data) !== savedSnapshot.value)
watch(dirty, v => emit('dirty', v), { immediate: true })

const pickHint = computed(() => {
  if (!canPick.value) return ''
  if (tool.value === 'tooth' && activeTooth.value) return `السن ${activeTooth.value}: انقر نقطة التماس ${toothStep.value === 'mesial' ? 'الأنسية' : 'الوحشية'}`
  if (tool.value === 'point') return `انقر: ${CAST_POINTS.find(p => p.key === activePoint.value)?.ar}`
  if (tool.value === 'distance') return pendingDistance.value ? 'انقر النقطة الثانية' : 'انقر النقطة الأولى'
  return ''
})
const canPick = computed(() => props.canManage && tool.value !== 'none' && models.value.length > 0)

// ---- scene / models ---------------------------------------------------------
async function ensureScene () {
  if (scene.value) return scene.value
  const { createCastScene } = await import('./castScene.js')
  scene.value = markRaw(createCastScene(sceneEl.value))
  return scene.value
}

async function loadModel (file) {
  if (models.value.some(m => m.file.id === file.id)) return
  loadingModels.value = true
  loadProgress.value = 0
  try {
    const s = await ensureScene()
    const blob = await orthoApi.fileContent(props.caseId, file.id, p => { loadProgress.value = p })
    const info = s.addModel(file.id, file.kind, await blob.arrayBuffer(), file.extension || 'stl')
    models.value.push({ file, visible: true, size: info.size })
    s.setView('front')
    if (!file.meta?.units_confirmed && props.canManage) openUnits(models.value[models.value.length - 1])
  } catch (e) {
    error.value = orthoError(e, 'تعذر تحميل النموذج')
  } finally {
    loadingModels.value = false
  }
}

function addModelFile (file) {
  const archKey = file.kind === 'model_upper' ? 'upper' : file.kind === 'model_lower' ? 'lower' : 'combined'
  data.model_file_ids[archKey] = file.id
  loadModel(file)
}

function toggleModel (m) {
  m.visible = !m.visible
  scene.value?.setModelStyle(m.file.id, { visible: m.visible })
}
watch(opacity, o => models.value.forEach(m => scene.value?.setModelStyle(m.file.id, { opacity: o })))

// ---- units -----------------------------------------------------------------
function openUnits (m) {
  unitsModel.value = m
  unitsChoice.value = m.file.meta?.units || null
  unitsCustom.value = m.file.meta?.units === 'custom' ? m.file.meta.scale_to_mm : null
  unitsDialog.value = true
}
// A hint from the model's size only - the doctor still has to choose.
const unitsGuess = computed(() => {
  const max = Math.max(...(unitsModel.value?.size || [0]))
  if (max >= 30 && max <= 130) return `أبعاد النموذج (${max.toFixed(1)}) تقارب حجم قوس سني بالملم - تقدير فقط، تحقق من مصدر الملف.`
  if (max >= 3 && max <= 13) return `أبعاد النموذج (${max.toFixed(2)}) تقارب حجم قوس سني بالسنتيمتر - تقدير فقط.`
  if (max >= 1.2 && max <= 5) return `أبعاد النموذج (${max.toFixed(2)}) قد تكون بالإنش - تقدير فقط.`
  return ''
})
async function confirmUnits () {
  savingUnits.value = true
  try {
    const res = await orthoApi.updateFile(props.caseId, unitsModel.value.file.id, { units: unitsChoice.value, scale_to_mm: unitsChoice.value === 'custom' ? unitsCustom.value : undefined, bounding_box: unitsModel.value.size })
    unitsModel.value.file = res.data
    unitsDialog.value = false
  } catch (e) {
    error.value = orthoError(e)
  } finally {
    savingUnits.value = false
  }
}

// ---- picking ------------------------------------------------------------------
let downAt = null
function onDown (e) { downAt = { x: e.clientX, y: e.clientY } }
function onUp (e) {
  if (!downAt || !canPick.value) return
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 5
  downAt = null
  if (moved) return
  const hit = scene.value?.pick(e.clientX, e.clientY)
  if (hit) applyPick(hit)
}

function archOf (hit) {
  if (hit.kind === 'model_upper') return 'upper'
  if (hit.kind === 'model_lower') return 'lower'
  return arch.value
}

function applyPick ({ point, kind }) {
  const t = tool.value
  if (t === 'tooth' && activeTooth.value) {
    const entry = { ...(data.teeth[activeTooth.value] || {}) }
    delete entry.manual_mm
    entry[toothStep.value] = point
    data.teeth[activeTooth.value] = entry
    toothStep.value = toothStep.value === 'mesial' ? 'distal' : 'mesial'
    if (toothStep.value === 'mesial') nextTooth()
  } else if (t === 'point') {
    const a = archOf({ kind })
    data.points[a] = { ...(data.points[a] || {}), [activePoint.value]: point }
    const order = pointList.value.map(p => p.key)
    activePoint.value = order.find(k => !data.points[a]?.[k]) || activePoint.value
  } else if (t === 'perimeter') {
    const a = archOf({ kind })
    data.arch_perimeter[a] = [...(data.arch_perimeter[a] || []), point]
  } else if (t === 'spee') {
    if (speeTarget.value.startsWith('cusps')) data.spee[speeTarget.value] = [...(data.spee[speeTarget.value] || []), point]
    else data.spee[speeTarget.value] = point
  } else if (t === 'segment') {
    data.segments[segment.value] = [...(data.segments[segment.value] || []), point]
  } else if (t === 'distance') {
    if (!pendingDistance.value) pendingDistance.value = point
    else {
      data.distances.push({ label: `قياس ${data.distances.length + 1}`, a: pendingDistance.value, b: point })
      pendingDistance.value = null
    }
  }
}

function nextTooth () {
  const all = TOOTH_ROWS.flatMap(r => r.teeth)
  const i = all.indexOf(activeTooth.value)
  activeTooth.value = all.slice(i + 1).find(t => !data.teeth[t]) || null
}
function setManualWidth () {
  if (!activeTooth.value || !(manualWidth.value > 0)) return
  data.teeth[activeTooth.value] = { manual_mm: manualWidth.value }
  manualWidth.value = null
  nextTooth()
}
function clearTooth (t) { delete data.teeth[t] }
function undoLast (obj, key) { obj[key] = (obj[key] || []).slice(0, -1) }

// Markers follow the data.
const markerItems = computed(() => {
  const items = []
  const P = (p, color, size) => p && items.push({ type: 'point', p, color, size })
  for (const t of Object.values(data.teeth)) {
    P(t.mesial, '#22c55e'); P(t.distal, '#ef4444')
    if (t.mesial && t.distal) items.push({ type: 'line', points: [t.mesial, t.distal], color: '#facc15' })
  }
  for (const a of ['upper', 'lower']) {
    for (const p of Object.values(data.points[a] || {})) P(p, '#38bdf8', 1.3)
    const per = data.arch_perimeter[a] || []
    per.forEach(p => P(p, '#a855f7'))
    if (per.length > 1) items.push({ type: 'line', points: per, color: '#a855f7' })
  }
  for (const v of Object.values(data.spee)) {
    if (Array.isArray(v?.[0])) v.forEach(p => P(p, '#f97316')); else P(v, '#fb7185', 1.4)
  }
  for (const seg of Object.values(data.segments)) {
    seg.forEach(p => P(p, '#14b8a6'))
    if (seg.length > 1) items.push({ type: 'line', points: seg, color: '#14b8a6' })
  }
  for (const d of data.distances) { P(d.a, '#f43f5e'); P(d.b, '#f43f5e'); items.push({ type: 'line', points: [d.a, d.b], color: '#f43f5e' }) }
  P(pendingDistance.value, '#fde047', 1.4)
  return items
})
watch(markerItems, items => scene.value?.setMarkers(items), { deep: true })

// ---- analyses -----------------------------------------------------------------------
async function loadAnalyses () {
  try {
    analyses.value = (await orthoApi.analyses(props.caseId, 'cast')).data || []
  } catch (e) {
    error.value = orthoError(e)
  }
}

async function openAnalysis (id) {
  current.value = null
  Object.assign(data, emptyData())
  if (id !== 'new') {
    try {
      current.value = (await orthoApi.analysis(props.caseId, id)).data
      const d = current.value.data || {}
      Object.assign(data, emptyData(), {
        teeth: d.teeth || {}, points: { upper: {}, lower: {}, ...(d.points || {}) },
        arch_perimeter: { upper: [], lower: [], ...(d.arch_perimeter || {}) }, spee: d.spee || {},
        segments: d.segments || {}, distances: d.distances || [], model_file_ids: d.model_file_ids || {}
      })
      const files = (await orthoApi.files(props.caseId, 'model_upper,model_lower,model_combined')).data || []
      for (const fid of Object.values(data.model_file_ids)) {
        const f = files.find(x => x.id === fid)
        if (f) await loadModel(f)
      }
    } catch (e) {
      error.value = orthoError(e)
    }
  }
  savedSnapshot.value = JSON.stringify(data)
  scene.value?.setMarkers(markerItems.value)
}
watch(selectedAnalysisId, openAnalysis)

async function save () {
  saving.value = true
  error.value = ''
  try {
    const body = { title: current.value?.title || 'تحليل الموديلات', data: payload.value }
    const res = current.value
      ? await orthoApi.updateAnalysis(props.caseId, current.value.id, { ...body, expected_revision: current.value.revision })
      : await orthoApi.createAnalysis(props.caseId, { ...body, type: 'cast', file_id: data.model_file_ids.upper || data.model_file_ids.lower || data.model_file_ids.combined || null })
    current.value = res.data
    savedSnapshot.value = JSON.stringify(data)
    await loadAnalyses()
    selectedAnalysisId.value = res.data.id
    emit('changed')
  } catch (e) {
    error.value = e?.response?.status === 409 ? 'عدّل مستخدم آخر هذا التحليل. أعد فتحه قبل الحفظ.' : orthoError(e)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await ensureScene()
  await loadAnalyses()
})
onBeforeUnmount(() => scene.value?.dispose())

defineExpose({ snapshot: () => scene.value?.snapshot(), dirty })
</script>

<style scoped>
.cast-body { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 12px; }
.cast-left { min-width: 0; }
.cast-scene { position: relative; height: min(68vh, 760px); min-height: 360px; border-radius: 12px; overflow: hidden; background: #0f172a; touch-action: none; }
.cast-scene :deep(canvas) { display: block; width: 100% !important; height: 100% !important; }
.cast-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #cbd5e1; pointer-events: none; z-index: 2; }
.cast-hint { position: absolute; top: 10px; inset-inline-start: 10px; background: rgba(15, 23, 42, 0.8); color: #fde047; padding: 4px 10px; border-radius: 999px; font-size: 13px; z-index: 2; pointer-events: none; }
.cast-side { border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); border-radius: 12px; display: flex; flex-direction: column; max-height: min(80vh, 880px); }
.cast-side-scroll { overflow-y: auto; flex: 1; }
@media (max-width: 960px) {
  .cast-body { grid-template-columns: 1fr; }
  .cast-scene { height: 55vh; }
  .cast-side { max-height: none; }
}
</style>
