<template>
  <div>
    <!-- Editor -->
    <div v-if="editing" class="face-editor">
      <div class="d-flex flex-wrap align-center ga-2 mb-2">
        <v-btn variant="text" prepend-icon="mdi-arrow-right" @click="closeEditor">رجوع</v-btn>
        <v-chip color="primary" variant="tonal" size="small">{{ VIEW_AR[view] }}</v-chip>
        <v-text-field v-model="title" :readonly="!canManage" density="compact" variant="outlined" hide-details style="max-width:240px" />
        <v-text-field v-model="analysisDate" :readonly="!canManage" type="date" density="compact" variant="outlined" hide-details style="max-width:170px" />
        <v-spacer />
        <v-btn v-if="canManage && view !== 'profile'" color="deep-purple" variant="tonal" :loading="detecting" prepend-icon="mdi-face-recognition" @click="detect">كشف النقاط (MediaPipe)</v-btn>
        <v-btn v-if="canManage && current && !dirty" :color="current.status === 'reviewed' ? 'grey' : 'success'" variant="tonal" :loading="reviewing" @click="toggleReview">
          {{ current.status === 'reviewed' ? 'إلغاء الاعتماد' : 'اعتماد' }}
        </v-btn>
        <v-btn v-if="canManage" color="primary" :loading="saving" :disabled="!dirty" prepend-icon="mdi-content-save" @click="save">حفظ</v-btn>
      </div>
      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-2" closable @click:close="error = ''">{{ error }}</v-alert>
      <v-alert v-if="suggested.length" type="warning" variant="tonal" density="compact" class="mb-2">
        {{ suggested.length }} نقطة مقترحة من نموذج الوجه (بإطار متقطع). نقاط الشبكة ليست نقاطاً تشريحية دقيقة: راجع كل نقطة وحرّكها، ثم أكّدها.
        <template #append><v-btn size="small" variant="tonal" @click="confirmSuggested">تأكيد</v-btn></template>
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
              <v-btn value="place" size="small">وضع النقاط</v-btn>
              <v-btn value="pan" size="small">تحريك</v-btn>
              <v-btn value="calibrate" size="small">معايرة بمسطرة</v-btn>
            </v-btn-toggle>
            <v-btn size="small" variant="tonal" :color="showOverlay ? 'primary' : undefined" prepend-icon="mdi-vector-line" @click="showOverlay = !showOverlay">الخطوط المرجعية</v-btn>
            <v-btn size="small" variant="tonal" :color="showLabels ? 'primary' : undefined" icon="mdi-label-outline" @click="showLabels = !showLabels" />
            <v-text-field v-if="mode === 'calibrate'" v-model.number="calibration.known_mm" type="number" min="0" step="0.5" label="طول المسطرة (ملم)" density="compact" variant="outlined" hide-details style="max-width:170px" />
          </div>
        </div>
        <div class="face-side">
          <v-tabs v-model="sideTab" density="compact" grow color="primary">
            <v-tab value="points">النقاط</v-tab>
            <v-tab value="results">القياسات</v-tab>
          </v-tabs>
          <v-divider />
          <div class="face-scroll">
            <v-list v-if="sideTab === 'points'" density="compact" nav>
              <v-list-item v-for="d in defs" :key="d.code" :active="d.code === activeCode" color="primary" rounded="lg" @click="activeCode = d.code; mode = 'place'">
                <template #prepend>
                  <v-icon size="16" :color="landmarks[d.code] ? (suggested.includes(d.code) ? 'warning' : 'success') : 'grey'">{{ landmarks[d.code] ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                </template>
                <v-list-item-title class="text-body-2">{{ d.ar }}</v-list-item-title>
                <v-list-item-subtitle v-if="d.manualOnly" class="text-caption">يدوي فقط</v-list-item-subtitle>
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
        قياسات الصور تقريبية (منظور العدسة وزاوية التصوير وتعابير الوجه تؤثر فيها). النسب والزوايا لا تحتاج معايرة؛ القيم بالملم تظهر فقط بعد معايرة بمسطرة في مستوى الوجه، وتبقى تقريبية وتحتاج تفسير الطبيب.
      </div>
    </div>

    <!-- List -->
    <template v-else>
      <div class="d-flex flex-wrap align-center ga-2 mb-4">
        <div>
          <div class="text-h6">تحليل الوجه والابتسامة</div>
          <div class="text-caption text-medium-emphasis">أثلاث الوجه · التناظر · خط المنتصف · الابتسامة · الملف الجانبي · قبل/بعد</div>
        </div>
        <v-spacer />
        <v-btn v-if="selected.length === 2" color="secondary" variant="tonal" prepend-icon="mdi-compare" @click="startCompare">قبل / بعد</v-btn>
        <v-menu v-if="canManage">
          <template #activator="{ props: mp }"><v-btn v-bind="mp" color="primary" prepend-icon="mdi-plus">تحليل جديد</v-btn></template>
          <v-list density="compact">
            <v-list-item v-for="(label, v) in VIEW_AR" :key="v" :title="label" @click="pickView(v)" />
          </v-list>
        </v-menu>
      </div>
      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">{{ error }}</v-alert>

      <!-- Before / after -->
      <v-card v-if="compare" variant="outlined" rounded="xl" class="mb-4 pa-3">
        <div class="d-flex align-center mb-2">
          <div class="text-subtitle-1">قبل / بعد</div>
          <v-spacer />
          <v-btn icon="mdi-close" size="small" variant="text" @click="compare = null" />
        </div>
        <v-row>
          <v-col v-for="(c, i) in compare.items" :key="c.analysis.id" cols="12" md="6">
            <div class="text-caption mb-1">{{ i === 0 ? 'قبل' : 'بعد' }} · {{ c.analysis.analysis_date }}</div>
            <div style="height:360px">
              <LandmarkCanvas :src="c.url" :landmarks="c.analysis.data.landmarks || {}" :definitions="defsFor(c.analysis.data.view)" :extra-lines="linesFor(c.analysis.data)" mode="pan" readonly />
            </div>
          </v-col>
        </v-row>
        <v-table density="compact" class="mt-2">
          <thead><tr><th>القياس</th><th class="text-center">قبل</th><th class="text-center">بعد</th><th class="text-center">الفرق</th></tr></thead>
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
              <v-card-title class="text-subtitle-1">{{ a.title || VIEW_AR[a.results?.view] }}</v-card-title>
              <v-card-subtitle>{{ VIEW_AR[a.results?.view] }} · {{ a.analysis_date }}</v-card-subtitle>
              <template #append>
                <v-chip :color="a.status === 'reviewed' ? 'success' : 'grey'" size="x-small" variant="tonal">{{ a.status === 'reviewed' ? 'معتمد' : 'مسودة' }}</v-chip>
              </template>
            </v-card-item>
          </v-card>
        </v-col>
      </v-row>
      <div v-else class="text-center text-medium-emphasis py-10">
        <v-icon size="48" color="grey-lighten-1">mdi-face-man-outline</v-icon>
        <div class="mt-2">لا توجد تحليلات وجه بعد</div>
      </div>
    </template>

    <OrthoFilePicker v-model="picker" :case-id="caseId" :kinds="[FILE_KIND[pendingView]]" :title="VIEW_AR[pendingView]" icon="mdi-face-recognition" :can-manage="canManage" @selected="startNew" />
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

const props = defineProps({ caseId: { type: [Number, String], required: true }, canManage: Boolean })
const emit = defineEmits(['dirty', 'changed'])

const VIEW_AR = { frontal: 'صورة أمامية', smile: 'ابتسامة أمامية', profile: 'ملف جانبي' }
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
  title.value = analysis?.title || VIEW_AR[v]
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
    error.value = orthoError(e, 'تعذر تحميل الصورة')
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
  if (dirty.value && !window.confirm('هناك تعديلات غير محفوظة. الخروج وتجاهلها؟')) return
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
    if (!Object.keys(found).length) { error.value = 'لم يُكتشف وجه في الصورة. ضع النقاط يدوياً.'; return }
    landmarks.value = { ...landmarks.value, ...found }
    const s = { ...sources.value }
    for (const c of Object.keys(found)) s[c] = 'auto'
    sources.value = s
  } catch (e) {
    error.value = 'تعذر تشغيل كشف النقاط: ' + (e?.message || e)
  } finally {
    detecting.value = false
  }
}

async function save () {
  if (suggested.value.length) { error.value = 'أكّد النقاط المقترحة أو حرّكها قبل الحفظ.'; return }
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
    error.value = e?.response?.status === 409 ? 'عُدّل التحليل من مستخدم آخر. أعد فتحه قبل الحفظ.' : orthoError(e)
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
      error.value = 'اختر تحليلين من نفس نوع الصورة للمقارنة.'
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
  const pick = (r, path) => path.split('.').reduce((o, k) => o?.[k], r) ?? null
  const rows = a.view === 'profile'
    ? [['الزاوية الأنفية الشفوية (°)', 'profile.nasolabial_angle'], ['تحدب الوجه (°)', 'profile.facial_convexity'], ['الشفة العليا - خط E', 'profile.upper_lip_E'], ['الشفة السفلى - خط E', 'profile.lower_lip_E']]
    : [['الثلث الأوسط / السفلي', 'thirds.middle_to_lower'], ['عدم تناظر زوايا الفم %', 'symmetry.cheilion.asymmetry_pct'], ['ميل خط الفم (°)', 'symmetry.cheilion.cant_deg'], ['انحراف الذقن عن المنتصف', 'midline_deviation.PogS'], ['عرض الابتسامة / بين البؤبؤين', 'smile.smile_to_interpupillary'], ['الممر الشدقي %', 'smile.buccal_corridor_pct']]
  return rows.map(([label, path]) => ({ label, a: pick(a, path), b: pick(b, path) }))
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
          row('الزاوية الأنفية الشفوية', pr.nasolabial_angle, '°'),
          h('div', { class: 'text-caption text-medium-emphasis' }, 'Legan & Burstone 1980: 102 ± 8°'),
          row('تحدب الوجه (G–Sn–Pog′)', pr.facial_convexity, '°'),
          h('div', { class: 'text-caption text-medium-emphasis' }, 'Legan & Burstone 1980: 12 ± 4°'),
          row('الشفة العليا إلى خط E', pr.upper_lip_E, u),
          row('الشفة السفلى إلى خط E', pr.lower_lip_E, u),
          h('div', { class: 'text-caption text-medium-emphasis' }, 'Ricketts: −2 ± 2 mm (البالغين). سالب = خلف الخط.')
        ])
      }
      const t = r.thirds || {}
      const rows = [
        h('div', { class: 'text-subtitle-2 mt-1' }, 'أثلاث الوجه'),
        row('العلوي %', t.upper_pct, '%'), row('الأوسط %', t.middle_pct, '%'), row('السفلي %', t.lower_pct, '%'),
        row('الأوسط / السفلي', t.middle_to_lower), row('Sn–Sto / Sto–Me′', t.upper_lip_to_lower_face),
        h('div', { class: 'text-subtitle-2 mt-3' }, 'التناظر (المسافة عن المنتصف)')
      ]
      for (const [name, s] of Object.entries(r.symmetry || {})) {
        rows.push(row(`${SYM_AR[name] || name}: عدم تناظر`, s.asymmetry_pct, '%'))
        if (name !== 'pupils') rows.push(row(`${SYM_AR[name] || name}: الميل`, s.cant_deg, '°'))
      }
      rows.push(h('div', { class: 'text-subtitle-2 mt-3' }, 'الانحراف عن خط المنتصف (+ نحو يسار المريض)'))
      for (const [code, v] of Object.entries(r.midline_deviation || {})) rows.push(row(code, v, u))
      rows.push(h('div', { class: 'text-subtitle-2 mt-3' }, 'نسب'))
      rows.push(row('مؤشر الوجه', r.proportions?.facial_index), row('بين العينين / عرض الأنف', r.proportions?.intercanthal_to_alar), row('عرض الفم / بين البؤبؤين', r.proportions?.mouth_to_interpupillary))
      if (r.smile) {
        rows.push(h('div', { class: 'text-subtitle-2 mt-3' }, 'الابتسامة'))
        rows.push(row('عرض الابتسامة', r.smile.smile_width, u), row('الابتسامة / بين البؤبؤين', r.smile.smile_to_interpupillary), row('الممر الشدقي', r.smile.buccal_corridor_pct, '%'), row('ظهور القاطع', r.smile.incisor_display, u), row('ظهور اللثة', r.smile.gingival_display, u), row('انحراف منتصف الأسنان', r.smile.dental_midline_deviation, u))
      }
      return h('div', rows)
    }
  }
})
const SYM_AR = { pupils: 'البؤبؤان', exocanthion: 'زوايا العين الخارجية', endocanthion: 'زوايا العين الداخلية', alare: 'جناحا الأنف', cheilion: 'زاويتا الفم', zygion: 'عرض الوجه', gonion: 'زاويتا الفك' }

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
