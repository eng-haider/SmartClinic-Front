<template>
  <!--
    Radiograph / photo with an SVG overlay for landmarks and tracing.
    Coordinates are always natural image pixels (x right, y down), whatever
    the zoom - that is what gets saved and measured.
  -->
  <div
    ref="viewport"
    class="lc-viewport"
    :class="{ 'lc-viewport--place': mode === 'place' && activeCode && !readonly, 'lc-viewport--calibrate': mode === 'calibrate' }"
    tabindex="0"
    @wheel.prevent="onWheel"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @keydown="onKey"
  >
    <div v-if="!loaded" class="lc-loading">
      <v-progress-circular indeterminate color="primary" />
    </div>
    <div class="lc-stage" :style="stageStyle">
      <img
        v-if="src"
        ref="imgEl"
        :src="src"
        class="lc-image"
        :style="imageStyle"
        draggable="false"
        alt=""
        @load="onImageLoad"
      >
      <svg v-if="loaded" class="lc-overlay" :width="size.w" :height="size.h" :viewBox="`0 0 ${size.w} ${size.h}`">
        <!-- Tracing lines between landmarks -->
        <g v-if="showTracing">
          <template v-for="(ln, i) in tracingSegments" :key="'t' + i">
            <line :x1="ln.a[0]" :y1="ln.a[1]" :x2="ln.b[0]" :y2="ln.b[1]" :stroke="ln.color" :stroke-width="2 * inv" :stroke-dasharray="ln.dashed ? `${8 * inv} ${6 * inv}` : null" stroke-linecap="round" />
            <text v-if="ln.label && showLabels" :x="(ln.a[0] + ln.b[0]) / 2" :y="(ln.a[1] + ln.b[1]) / 2 - 6 * inv" :font-size="12 * inv" :fill="ln.color" class="lc-text">{{ ln.label }}</text>
          </template>
        </g>
        <!-- Calibration ruler -->
        <g v-if="calPoints.length">
          <line v-if="calPoints.length === 2" :x1="calPoints[0][0]" :y1="calPoints[0][1]" :x2="calPoints[1][0]" :y2="calPoints[1][1]" stroke="#fde047" :stroke-width="2 * inv" />
          <circle v-for="(c, i) in calPoints" :key="'c' + i" :cx="c[0]" :cy="c[1]" :r="6 * inv" fill="none" stroke="#fde047" :stroke-width="2 * inv" />
        </g>
        <!-- Landmarks -->
        <g v-for="lm in placed" :key="lm.code" class="lc-point" :class="{ 'lc-point--active': lm.code === activeCode }" @pointerdown.stop="startDrag($event, lm.code)">
          <circle :cx="lm.x" :cy="lm.y" :r="10 * inv" fill="transparent" />
          <circle :cx="lm.x" :cy="lm.y" :r="(lm.code === activeCode ? 6 : 4.5) * inv" :fill="lm.suggested ? 'transparent' : pointColor(lm.code)" :stroke="lm.suggested ? '#fbbf24' : '#0f172a'" :stroke-width="(lm.suggested ? 2.5 : 1.2) * inv" :stroke-dasharray="lm.suggested ? `${3 * inv} ${2 * inv}` : null" />
          <text v-if="showLabels" :x="lm.x + 8 * inv" :y="lm.y - 8 * inv" :font-size="13 * inv" class="lc-text" fill="#f8fafc">{{ lm.label }}</text>
        </g>
      </svg>
    </div>

    <div class="lc-toolbar" @pointerdown.stop>
      <v-btn icon="mdi-magnify-plus-outline" size="small" variant="tonal" density="comfortable" title="تكبير" @click="zoomBy(1.25)" />
      <v-btn icon="mdi-magnify-minus-outline" size="small" variant="tonal" density="comfortable" title="تصغير" @click="zoomBy(0.8)" />
      <v-btn icon="mdi-fit-to-screen-outline" size="small" variant="tonal" density="comfortable" title="ملاءمة" @click="fit" />
      <span class="lc-zoom">{{ Math.round(scale * 100) }}%</span>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

const props = defineProps({
  src: { type: String, default: '' },
  landmarks: { type: Object, default: () => ({}) },
  definitions: { type: Array, default: () => [] }, // [{ code, ar|label, color? }]
  activeCode: { type: String, default: null },
  tracing: { type: Array, default: () => [] }, // [{ from, to, color, dashed, label }]
  extraLines: { type: Array, default: () => [] }, // [{ a:[x,y], b:[x,y], color, dashed, label }]
  mode: { type: String, default: 'place' }, // place | pan | calibrate
  calibration: { type: Object, default: null }, // { p1:{x,y}, p2:{x,y} }
  filters: { type: Object, default: () => ({ brightness: 100, contrast: 100, invert: false }) },
  suggested: { type: Array, default: () => [] },
  readonly: Boolean,
  showLabels: { type: Boolean, default: true },
  showTracing: { type: Boolean, default: true }
})
const emit = defineEmits(['update:landmarks', 'update:activeCode', 'update:calibration', 'placed', 'loaded'])

const viewport = ref(null)
const imgEl = ref(null)
const loaded = ref(false)
const size = reactive({ w: 0, h: 0 })
const scale = ref(1)
const tx = ref(0)
const ty = ref(0)
const inv = computed(() => 1 / scale.value)

const stageStyle = computed(() => ({ transform: `translate(${tx.value}px, ${ty.value}px) scale(${scale.value})`, width: `${size.w}px`, height: `${size.h}px` }))
const imageStyle = computed(() => ({
  filter: `brightness(${props.filters.brightness ?? 100}%) contrast(${props.filters.contrast ?? 100}%)${props.filters.invert ? ' invert(1)' : ''}`
}))

const defByCode = computed(() => Object.fromEntries(props.definitions.map(d => [d.code, d])))
const placed = computed(() => Object.entries(props.landmarks || {})
  .filter(([, p]) => p && Number.isFinite(p.x) && Number.isFinite(p.y))
  .map(([code, p]) => ({ code, x: p.x, y: p.y, label: defByCode.value[code]?.short || code, suggested: props.suggested.includes(code) })))

const tracingSegments = computed(() => {
  const l = props.landmarks || {}
  const segs = props.tracing
    .filter(t => l[t.from] && l[t.to])
    .map(t => ({ a: [l[t.from].x, l[t.from].y], b: [l[t.to].x, l[t.to].y], color: t.color, dashed: t.dashed, label: t.label }))
  return segs.concat(props.extraLines)
})

const calPoints = computed(() => ['p1', 'p2'].map(k => props.calibration?.[k]).filter(p => p && Number.isFinite(p.x)).map(p => [p.x, p.y]))

const GROUP_COLORS = { cranial: '#22d3ee', maxilla: '#f472b6', mandible: '#facc15', dental: '#f87171', soft: '#34d399' }
const pointColor = code => defByCode.value[code]?.color || GROUP_COLORS[defByCode.value[code]?.group] || '#38bdf8'

function onImageLoad () {
  size.w = imgEl.value.naturalWidth
  size.h = imgEl.value.naturalHeight
  loaded.value = true
  fit()
  emit('loaded', { width: size.w, height: size.h })
}

function fit () {
  const el = viewport.value
  if (!el || !size.w) return
  const s = Math.min(el.clientWidth / size.w, el.clientHeight / size.h) * 0.96
  scale.value = s
  tx.value = (el.clientWidth - size.w * s) / 2
  ty.value = (el.clientHeight - size.h * s) / 2
}

function zoomAt (factor, cx, cy) {
  const next = Math.min(20, Math.max(0.05, scale.value * factor))
  const k = next / scale.value
  tx.value = cx - (cx - tx.value) * k
  ty.value = cy - (cy - ty.value) * k
  scale.value = next
}

function zoomBy (factor) {
  const el = viewport.value
  zoomAt(factor, el.clientWidth / 2, el.clientHeight / 2)
}

function onWheel (e) {
  const rect = viewport.value.getBoundingClientRect()
  zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - rect.left, e.clientY - rect.top)
}

function toImage (e) {
  const rect = viewport.value.getBoundingClientRect()
  return { x: (e.clientX - rect.left - tx.value) / scale.value, y: (e.clientY - rect.top - ty.value) / scale.value }
}

const inside = p => p.x >= 0 && p.y >= 0 && p.x <= size.w && p.y <= size.h
const round1 = v => Math.round(v * 10) / 10

// ---- pointer handling: pan, drag, place, pinch ---------------------------
const pointers = new Map()
let drag = null // { type: 'pan'|'point'|'pinch', ... }

function setPoint (code, p) {
  emit('update:landmarks', { ...props.landmarks, [code]: { x: round1(p.x), y: round1(p.y) } })
}

function startDrag (e, code) {
  if (props.readonly || props.mode === 'calibrate') return onPointerDown(e)
  // While a not-yet-placed landmark is selected, a click near an existing one
  // places the new landmark (close pairs such as U1T/L1T, U6/L6) instead of
  // grabbing the old one. Existing points are moved by selecting them first.
  if (props.mode === 'place' && props.activeCode && props.activeCode !== code && !props.landmarks?.[props.activeCode]) {
    return onPointerDown(e)
  }
  viewport.value.setPointerCapture?.(e.pointerId)
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  emit('update:activeCode', code)
  drag = { type: 'point', code, moved: false }
}

function onPointerDown (e) {
  if (!loaded.value) return
  viewport.value.focus({ preventScroll: true })
  viewport.value.setPointerCapture?.(e.pointerId)
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()]
    drag = { type: 'pinch', dist: Math.hypot(a.x - b.x, a.y - b.y) }
    return
  }
  drag = { type: 'pan', startX: e.clientX, startY: e.clientY, tx: tx.value, ty: ty.value, moved: false, point: toImage(e) }
}

function onPointerMove (e) {
  if (!drag || !pointers.has(e.pointerId)) return
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (drag.type === 'pinch' && pointers.size === 2) {
    const [a, b] = [...pointers.values()]
    const dist = Math.hypot(a.x - b.x, a.y - b.y)
    const rect = viewport.value.getBoundingClientRect()
    zoomAt(dist / drag.dist, (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top)
    drag.dist = dist
  } else if (drag.type === 'point') {
    const p = toImage(e)
    if (inside(p)) { setPoint(drag.code, p); drag.moved = true }
  } else if (drag.type === 'pan') {
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true
    if (drag.moved) { tx.value = drag.tx + dx; ty.value = drag.ty + dy }
  }
}

function onPointerUp (e) {
  pointers.delete(e.pointerId)
  if (!drag) return
  const d = drag
  if (pointers.size === 0) drag = null
  // A click (no movement) places a point or a calibration end.
  if (d.type === 'pan' && !d.moved && inside(d.point) && !props.readonly) {
    if (props.mode === 'calibrate') {
      const cal = { ...(props.calibration || {}) }
      const pt = { x: round1(d.point.x), y: round1(d.point.y) }
      if (!cal.p1 || (cal.p1 && cal.p2)) { cal.p1 = pt; delete cal.p2 } else cal.p2 = pt
      emit('update:calibration', cal)
    } else if (props.mode === 'place' && props.activeCode) {
      setPoint(props.activeCode, d.point)
      emit('placed', props.activeCode)
    }
  }
}

// Arrow keys nudge the selected landmark by 1 px (Shift: 10 px).
function onKey (e) {
  const code = props.activeCode
  const p = code && props.landmarks?.[code]
  if (!p || props.readonly) return
  const step = e.shiftKey ? 10 : 1
  const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key]
  if (!delta) return
  e.preventDefault()
  setPoint(code, { x: p.x + delta[0], y: p.y + delta[1] })
}

/** Centre the view on a landmark. */
function focusPoint (code) {
  const p = props.landmarks?.[code]
  const el = viewport.value
  if (!p || !el) return
  tx.value = el.clientWidth / 2 - p.x * scale.value
  ty.value = el.clientHeight / 2 - p.y * scale.value
}

/** Snapshot (image + overlay) as a PNG data URL, for reports. */
async function snapshot (maxWidth = 1400) {
  if (!loaded.value) return null
  const k = Math.min(1, maxWidth / size.w)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(size.w * k)
  canvas.height = Math.round(size.h * k)
  const ctx = canvas.getContext('2d')
  ctx.filter = imageStyle.value.filter
  ctx.drawImage(imgEl.value, 0, 0, canvas.width, canvas.height)
  ctx.filter = 'none'
  const svg = viewport.value.querySelector('svg').cloneNode(true)
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  const blobUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }))
  try {
    const overlay = await new Promise((resolve, reject) => { const im = new Image(); im.onload = () => resolve(im); im.onerror = reject; im.src = blobUrl })
    ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height)
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
  return canvas.toDataURL('image/png')
}

let resizeObserver = null
onMounted(() => {
  resizeObserver = new ResizeObserver(() => { if (loaded.value) fit() })
  resizeObserver.observe(viewport.value)
})
onBeforeUnmount(() => resizeObserver?.disconnect())
watch(() => props.src, () => { loaded.value = false })

defineExpose({ fit, focusPoint, snapshot, zoomBy })
</script>

<style scoped>
.lc-viewport {
  position: relative;
  overflow: hidden;
  background: #0b1220;
  border-radius: 12px;
  height: 100%;
  min-height: 360px;
  touch-action: none;
  cursor: grab;
  outline: none;
  user-select: none;
}
.lc-viewport--place { cursor: crosshair; }
.lc-viewport--calibrate { cursor: cell; }
.lc-stage { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
.lc-image { display: block; pointer-events: none; image-rendering: auto; }
.lc-overlay { position: absolute; left: 0; top: 0; overflow: visible; }
.lc-point { cursor: move; }
.lc-text { font-family: system-ui, sans-serif; font-weight: 600; paint-order: stroke; stroke: #0f172a; stroke-width: 3px; direction: ltr; }
.lc-loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
.lc-toolbar {
  position: absolute;
  inset-inline-end: 10px;
  top: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(15, 23, 42, 0.7);
  padding: 4px 8px;
  border-radius: 999px;
  color: #e2e8f0;
}
.lc-zoom { font-size: 12px; min-width: 40px; text-align: center; direction: ltr; }
</style>
