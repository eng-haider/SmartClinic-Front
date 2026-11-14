<template>
  <v-dialog :model-value="true" fullscreen persistent scrollable>
    <v-card class="pano">
      <v-toolbar density="compact" color="surface">
        <v-btn icon="mdi-close" @click="$emit('close')" />
        <v-toolbar-title>البانوراما والمقاطع العرضية وتخطيط الزرعات</v-toolbar-title>
        <v-spacer />
        <v-btn v-if="canManage" color="primary" variant="flat" :disabled="!curve" prepend-icon="mdi-content-save" class="me-2" @click="save">حفظ في الحالة</v-btn>
      </v-toolbar>
      <v-card-text class="pa-3">
        <div v-if="!geometry" class="d-flex flex-column align-center justify-center" style="min-height:50vh">
          <v-progress-circular indeterminate color="primary" />
          <div class="mt-2">جارٍ تجهيز بيانات الحجم…</div>
        </div>
        <template v-else>
          <div class="d-flex flex-wrap ga-3 align-center mb-2">
            <div class="d-flex align-center ga-2" style="min-width:260px">
              <span class="text-caption">النافذة</span>
              <v-range-slider v-model="voi" :min="dataRange[0]" :max="dataRange[1]" :step="1" hide-details density="compact" color="primary" />
            </div>
            <v-text-field v-model.number="thicknessMm" type="number" min="0" max="40" step="1" label="سماكة البانوراما (ملم)" density="compact" variant="outlined" hide-details style="max-width:170px" />
            <v-text-field v-model.number="stepMm" type="number" min="0.1" max="2" step="0.1" label="دقة العينة (ملم)" density="compact" variant="outlined" hide-details style="max-width:150px" />
            <v-btn color="primary" variant="tonal" :disabled="controlPoints.length < 2" prepend-icon="mdi-panorama-horizontal-outline" @click="build">بناء البانوراما</v-btn>
          </div>

          <div class="pano-grid">
            <!-- Axial: draw the arch curve -->
            <v-card variant="outlined" rounded="lg" class="pa-2">
              <div class="d-flex align-center ga-2 mb-1">
                <span class="text-subtitle-2">1. منحنى القوس على المقطع المحوري</span>
                <v-spacer />
                <v-btn size="x-small" variant="text" @click="controlPoints.pop()">تراجع</v-btn>
                <v-btn size="x-small" variant="text" color="error" @click="controlPoints = []">مسح</v-btn>
              </div>
              <canvas ref="axialCanvas" class="pano-canvas" @click="onAxialClick" />
              <div class="d-flex align-center ga-2">
                <span class="text-caption">الشريحة</span>
                <v-slider v-model="sliceK" :min="0" :max="geometry.dims[2] - 1" :step="1" hide-details density="compact" />
                <span class="text-caption" dir="ltr">{{ sliceK }}</span>
              </div>
              <div class="text-caption text-medium-emphasis">انقر على مركز العظم السنخي من جهة إلى الأخرى ({{ controlPoints.length }} نقطة).</div>
            </v-card>

            <!-- Panoramic -->
            <v-card variant="outlined" rounded="lg" class="pa-2 pano-wide">
              <div class="text-subtitle-2 mb-1">2. البانوراما المعاد بناؤها <span v-if="curve" class="text-caption" dir="ltr">({{ curve.lengthMm.toFixed(1) }} mm)</span></div>
              <canvas ref="panoCanvas" class="pano-canvas" @click="onPanoClick" />
              <div class="text-caption text-medium-emphasis">انقر على موضع لعرض المقطع العرضي فيه.</div>
            </v-card>

            <!-- Cross-section -->
            <v-card variant="outlined" rounded="lg" class="pa-2">
              <div class="d-flex align-center ga-2 mb-1 flex-wrap">
                <span class="text-subtitle-2">3. المقطع العرضي <span v-if="section" class="text-caption" dir="ltr">@ {{ section.sample.distMm.toFixed(1) }} mm</span></span>
                <v-spacer />
                <v-btn-toggle v-model="xsTool" density="compact" variant="outlined" divided color="primary" :disabled="!canManage">
                  <v-btn value="height" size="x-small">ارتفاع العظم</v-btn>
                  <v-btn value="width" size="x-small">عرض العظم</v-btn>
                  <v-btn value="implant" size="x-small">زرعة</v-btn>
                </v-btn-toggle>
              </div>
              <canvas ref="xsCanvas" class="pano-canvas" @click="onXsClick" />
              <div v-if="xsTool === 'implant'" class="d-flex flex-wrap ga-2 mt-1">
                <v-text-field v-model.number="implant.diameter" type="number" min="2" max="8" step="0.1" label="القطر (ملم)" density="compact" variant="outlined" hide-details style="max-width:110px" />
                <v-text-field v-model.number="implant.length" type="number" min="4" max="20" step="0.5" label="الطول (ملم)" density="compact" variant="outlined" hide-details style="max-width:110px" />
                <v-text-field v-model.number="implant.angle" type="number" min="-45" max="45" step="1" label="الميل (°)" density="compact" variant="outlined" hide-details style="max-width:100px" />
                <v-text-field v-model="implant.tooth" label="السن" density="compact" variant="outlined" hide-details style="max-width:90px" />
                <v-btn-toggle v-model="implant.jaw" mandatory density="compact" variant="outlined" divided>
                  <v-btn value="mandible" size="x-small">سفلي</v-btn>
                  <v-btn value="maxilla" size="x-small">علوي</v-btn>
                </v-btn-toggle>
              </div>
              <div class="text-caption text-medium-emphasis mt-1">{{ xsHint }}</div>
            </v-card>
          </div>

          <v-row class="mt-2">
            <v-col cols="12" md="6">
              <div class="text-subtitle-2 mb-1">قياسات العظم</div>
              <v-table density="compact">
                <tbody>
                  <tr v-for="(m, i) in crossSections" :key="i">
                    <td>{{ m.kind === 'bone_height' ? 'ارتفاع' : 'عرض' }}</td>
                    <td dir="ltr">@ {{ m.position_mm.toFixed(1) }} mm</td>
                    <td dir="ltr" class="font-weight-bold">{{ m.value.toFixed(2) }} mm</td>
                    <td><v-btn v-if="canManage" icon="mdi-close" size="x-small" variant="text" @click="crossSections.splice(i, 1); drawXs()" /></td>
                  </tr>
                </tbody>
              </v-table>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-subtitle-2 mb-1">الزرعات المخططة</div>
              <v-table density="compact">
                <tbody>
                  <tr v-for="(im, i) in implants" :key="i">
                    <td>{{ im.label }}<span v-if="im.tooth"> ({{ im.tooth }})</span></td>
                    <td dir="ltr">Ø {{ im.diameter_mm }} × {{ im.length_mm }} mm</td>
                    <td dir="ltr">{{ im.section.angle_deg }}°</td>
                    <td><v-btn v-if="canManage" icon="mdi-close" size="x-small" variant="text" @click="implants.splice(i, 1); drawXs()" /></td>
                  </tr>
                </tbody>
              </v-table>
            </v-col>
          </v-row>
          <v-alert type="info" variant="tonal" density="compact" class="mt-2">
            إعادة بناء منحنية من بيانات الحجم نفسها؛ أبعاد البكسل معروفة بالملم. تخطيط الزرعات هنا أداة مساعدة للتصوّر والقياس فقط، وليس دليلاً جراحياً ولا يغني عن تقييم الطبيب والتحقق السريري.
          </v-alert>
        </template>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { archCurve, autoWindow, axialImage, crossSection, indexToWorld, panoramicImage, toRgba } from './panoramic.js'

const props = defineProps({ volumeLoader: { type: Function, required: true }, saved: { type: Object, default: () => ({}) }, canManage: Boolean })
const emit = defineEmits(['close', 'save'])

const geometry = shallowRef(null)
const dataRange = ref([0, 1])
const voi = ref([0, 1])
const sliceK = ref(0)
const thicknessMm = ref(props.saved.panoramic?.thickness_mm ?? 10)
const stepMm = ref(props.saved.panoramic?.step_mm ?? 0.3)
const controlPoints = ref(props.saved.arch_curve_index?.points || [])
const curve = shallowRef(null)
const pano = shallowRef(null)
const sectionIndex = ref(null)
const section = shallowRef(null)
const xsTool = ref('height')
const pending = ref(null)
// Saved rows keep only points + pixel size; the value is recomputed.
const crossSections = ref((props.saved.cross_sections || []).map(m => ({
  ...m,
  value: Math.hypot((m.points[1][0] - m.points[0][0]) * m.spacing_mm[0], (m.points[1][1] - m.points[0][1]) * m.spacing_mm[1])
})))
const implants = ref([...(props.saved.implants || [])])
const implant = reactive({ diameter: 4, length: 10, angle: 0, tooth: '', jaw: 'mandible' })

const axialCanvas = ref(null)
const panoCanvas = ref(null)
const xsCanvas = ref(null)

const xsHint = computed(() => xsTool.value === 'implant'
  ? 'انقر موضع منصة الزرعة (أعلى الزرعة). الاتجاه حسب الفك والميل.'
  : (pending.value ? 'انقر النقطة الثانية' : 'انقر نقطتين لقياس العظم بالملم'))

// ---- drawing helpers (canvases are drawn in mm so the aspect is true) ------
function paint (canvas, img, pxMm, overlay) {
  if (!canvas || !img) return
  const wMm = img.width * pxMm[0]
  const hMm = img.height * pxMm[1]
  const cssW = canvas.parentElement.clientWidth - 16
  const scale = Math.max(0.5, cssW / wMm)
  canvas.width = Math.round(wMm * scale)
  canvas.height = Math.round(hMm * scale)
  canvas.style.width = `${canvas.width}px`
  canvas.style.height = `${canvas.height}px`
  const off = document.createElement('canvas')
  off.width = img.width
  off.height = img.height
  off.getContext('2d').putImageData(new ImageData(toRgba(img, voi.value[0], voi.value[1]), img.width, img.height), 0, 0)
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(off, 0, 0, canvas.width, canvas.height)
  canvas.dataset.scale = String(scale)
  overlay?.(ctx, scale)
}
const clickMm = (canvas, e) => {
  const r = canvas.getBoundingClientRect()
  const scale = Number(canvas.dataset.scale)
  const k = canvas.width / (r.width || canvas.width) // CSS may shrink the canvas
  return [((e.clientX - r.left) * k) / scale, ((e.clientY - r.top) * k) / scale]
}

function drawAxial () {
  const g = geometry.value
  if (!g) return
  const img = axialImage(g, sliceK.value, 1)
  paint(axialCanvas.value, img, [g.spacing[0], g.spacing[1]], (ctx, s) => {
    const toPx = ([i, j]) => [i * g.spacing[0] * s, j * g.spacing[1] * s]
    if (curve.value) {
      ctx.strokeStyle = '#a855f7'
      ctx.lineWidth = 2
      ctx.beginPath()
      curve.value.samples.forEach((p, n) => { const [x, y] = toPx(p.pos); n ? ctx.lineTo(x, y) : ctx.moveTo(x, y) })
      ctx.stroke()
      if (section.value) {
        const { posMm, normal } = section.value.sample
        ctx.strokeStyle = '#facc15'
        ctx.beginPath()
        ctx.moveTo((posMm[0] - normal[0] * 15) * s, (posMm[1] - normal[1] * 15) * s)
        ctx.lineTo((posMm[0] + normal[0] * 15) * s, (posMm[1] + normal[1] * 15) * s)
        ctx.stroke()
      }
    }
    ctx.fillStyle = '#22d3ee'
    for (const p of controlPoints.value) { const [x, y] = toPx(p); ctx.beginPath(); ctx.arc(x, y, 4, 0, 2 * Math.PI); ctx.fill() }
  })
}

function drawPano () {
  if (!pano.value) return
  paint(panoCanvas.value, pano.value, pano.value.pixelMm, (ctx, s) => {
    if (sectionIndex.value === null) return
    const x = sectionIndex.value * pano.value.pixelMm[0] * s
    ctx.strokeStyle = '#facc15'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ctx.canvas.height); ctx.stroke()
  })
}

function drawXs () {
  const xs = section.value
  if (!xs) return
  const here = m => Math.abs(m.position_mm - xs.sample.distMm) < curve.value.stepMm / 2
  paint(xsCanvas.value, xs, xs.pixelMm, (ctx, s) => {
    const P = ([c, r]) => [c * xs.pixelMm[0] * s, r * xs.pixelMm[1] * s]
    ctx.lineWidth = 2
    ctx.font = '12px system-ui'
    for (const m of crossSections.value.filter(here)) {
      const [a, b] = m.points.map(P)
      ctx.strokeStyle = m.kind === 'bone_height' ? '#22c55e' : '#38bdf8'
      ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke()
      ctx.fillStyle = '#f8fafc'
      ctx.fillText(`${m.value.toFixed(1)} mm`, (a[0] + b[0]) / 2 + 6, (a[1] + b[1]) / 2)
    }
    if (pending.value) { const [x, y] = P(pending.value); ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(x, y, 4, 0, 2 * Math.PI); ctx.fill() }
    for (const im of implants.value.filter(i => here(i.section))) drawImplant(ctx, s, xs, im)
  })
}

function drawImplant (ctx, s, xs, im) {
  const { col, row, angle_deg: ang, apex_down: down } = im.section
  const x0 = col * xs.pixelMm[0] * s
  const y0 = row * xs.pixelMm[1] * s
  const t = (ang * Math.PI) / 180
  const dir = [Math.sin(t), (down ? 1 : -1) * Math.cos(t)]
  const perp = [-dir[1], dir[0]]
  const L = im.length_mm * s
  const r = (im.diameter_mm / 2) * s
  ctx.fillStyle = 'rgba(250, 204, 21, 0.35)'
  ctx.strokeStyle = '#facc15'
  ctx.beginPath()
  ctx.moveTo(x0 + perp[0] * r, y0 + perp[1] * r)
  ctx.lineTo(x0 + perp[0] * r + dir[0] * L, y0 + perp[1] * r + dir[1] * L)
  ctx.lineTo(x0 - perp[0] * r + dir[0] * L, y0 - perp[1] * r + dir[1] * L)
  ctx.lineTo(x0 - perp[0] * r, y0 - perp[1] * r)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
}

// ---- interactions -------------------------------------------------------------
function onAxialClick (e) {
  if (!props.canManage) return
  const g = geometry.value
  const [xMm, yMm] = clickMm(axialCanvas.value, e)
  controlPoints.value = [...controlPoints.value, [xMm / g.spacing[0], yMm / g.spacing[1]]]
  drawAxial()
}

function build () {
  const g = geometry.value
  curve.value = archCurve(g, controlPoints.value, Math.max(0.1, stepMm.value || 0.3))
  pano.value = panoramicImage(g, curve.value, { thicknessMm: Math.max(0, thicknessMm.value || 0), mode: 'mip' })
  selectSection(Math.floor(curve.value.samples.length / 2))
  nextTick(() => { drawPano(); drawAxial() })
}

function selectSection (index) {
  sectionIndex.value = index
  section.value = crossSection(geometry.value, curve.value, index, { halfWidthMm: 15, stepMm: Math.min(...geometry.value.spacing.slice(0, 2)) })
  pending.value = null
  nextTick(() => { drawXs(); drawPano(); drawAxial() })
}

function onPanoClick (e) {
  if (!pano.value) return
  const [xMm] = clickMm(panoCanvas.value, e)
  selectSection(Math.max(0, Math.min(curve.value.samples.length - 1, Math.round(xMm / pano.value.pixelMm[0]))))
}

function onXsClick (e) {
  const xs = section.value
  if (!xs || !props.canManage) return
  const [xMm, yMm] = clickMm(xsCanvas.value, e)
  const pt = [xMm / xs.pixelMm[0], yMm / xs.pixelMm[1]]
  if (xsTool.value === 'implant') {
    const ang = Number(implant.angle) || 0
    const down = implant.jaw === 'mandible'
    // Unit vectors of the image axes in world mm, from the exact mapping.
    const o = xs.toWorld(pt[0], pt[1])
    const unit = v => { const n = Math.hypot(...v) || 1; return v.map(x => x / n) }
    const eCol = unit(xs.toWorld(pt[0] + 1, pt[1]).map((v, i) => v - o[i]))
    const eRow = unit(xs.toWorld(pt[0], pt[1] + 1).map((v, i) => v - o[i]))
    const t = (ang * Math.PI) / 180
    const direction = eCol.map((v, i) => Math.sin(t) * v + (down ? 1 : -1) * Math.cos(t) * eRow[i])
    implants.value.push({
      label: `زرعة ${implants.value.length + 1}`,
      tooth: implant.tooth || null,
      position: o.map(v => +v.toFixed(3)),
      direction: direction.map(v => +v.toFixed(5)),
      diameter_mm: Number(implant.diameter),
      length_mm: Number(implant.length),
      section: { position_mm: xs.sample.distMm, col: pt[0], row: pt[1], angle_deg: ang, apex_down: down }
    })
    drawXs()
    return
  }
  if (!pending.value) { pending.value = pt; drawXs(); return }
  const a = pending.value
  const value = Math.hypot((pt[0] - a[0]) * xs.pixelMm[0], (pt[1] - a[1]) * xs.pixelMm[1])
  crossSections.value.push({
    label: xsTool.value === 'height' ? 'ارتفاع العظم' : 'عرض العظم',
    kind: xsTool.value === 'height' ? 'bone_height' : 'bone_width',
    position_mm: xs.sample.distMm,
    spacing_mm: xs.pixelMm,
    points: [a, pt],
    world: [xs.toWorld(...a), xs.toWorld(...pt)].map(p => p.map(v => +v.toFixed(3))),
    value
  })
  pending.value = null
  drawXs()
}

function save () {
  const g = geometry.value
  emit('save', {
    arch_curve_index: { slice: sliceK.value, points: controlPoints.value },
    arch_curve: controlPoints.value.map(([i, j]) => indexToWorld(g, [i, j, sliceK.value]).map(v => +v.toFixed(3))),
    panoramic: { thickness_mm: thicknessMm.value, step_mm: stepMm.value, length_mm: curve.value?.lengthMm ?? null },
    cross_sections: crossSections.value.map(({ value, ...rest }) => rest),
    implants: implants.value
  })
}

watch([voi, sliceK], () => { drawAxial(); drawPano(); drawXs() })

onMounted(async () => {
  const g = await props.volumeLoader()
  geometry.value = g
  sliceK.value = props.saved.arch_curve_index?.slice ?? Math.floor(g.dims[2] / 2)
  const w = autoWindow(g.scalars)
  dataRange.value = [Math.floor(w[0]) - 500, Math.ceil(w[1]) + 500]
  voi.value = [w[0], w[1]]
  await nextTick()
  drawAxial()
  if (controlPoints.value.length >= 2) build()
})
</script>

<style scoped>
.pano-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1fr); gap: 10px; align-items: start; }
.pano-canvas { display: block; background: #000; border-radius: 6px; cursor: crosshair; max-width: 100%; }
@media (max-width: 1100px) { .pano-grid { grid-template-columns: 1fr; } }
</style>
