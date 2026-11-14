<template>
  <Teleport to="body">
    <div v-if="modelValue" class="ian-root">
      <div class="ian-topbar">
        <v-btn
          icon
          variant="text"
          color="white"
          size="small"
          :disabled="saving"
          :title="t('imageAnnotator.cancel')"
          :aria-label="t('imageAnnotator.cancel')"
          @click="cancel"
        >
          <v-icon size="22">mdi-close</v-icon>
        </v-btn>
        <span class="ian-title">{{ t('imageAnnotator.title') }}</span>
        <div class="ian-actions">
          <v-btn
            icon
            variant="text"
            color="white"
            size="small"
            :disabled="!items.length || saving"
            :title="t('imageAnnotator.undo')"
            :aria-label="t('imageAnnotator.undo')"
            @click="undo"
          >
            <v-icon size="20">mdi-undo</v-icon>
          </v-btn>
          <v-btn
            icon
            variant="text"
            color="white"
            size="small"
            :disabled="!items.length || saving"
            :title="t('imageAnnotator.clear')"
            :aria-label="t('imageAnnotator.clear')"
            @click="clearAll"
          >
            <v-icon size="20">mdi-delete-sweep-outline</v-icon>
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            size="small"
            class="ms-2"
            :loading="saving"
            :disabled="(!items.length && !draftText.trim()) || status !== 'ready'"
            @click="save"
          >
            <v-icon start size="18">mdi-content-save-outline</v-icon>
            {{ t('imageAnnotator.save') }}
          </v-btn>
        </div>
      </div>

      <div ref="stageEl" class="ian-stage">
        <div v-if="status === 'loading'" class="ian-status">
          <v-progress-circular indeterminate color="white" size="32" />
          <span>{{ t('imageAnnotator.loading') }}</span>
        </div>
        <div v-else-if="status === 'error'" class="ian-status">
          <v-icon size="40" color="white">mdi-image-broken-variant</v-icon>
          <span>{{ t('imageAnnotator.loadFailed') }}</span>
        </div>
        <div
          v-show="status === 'ready'"
          class="ian-board"
          :style="{ width: `${displaySize.w}px`, height: `${displaySize.h}px` }"
        >
          <canvas
            ref="canvasEl"
            class="ian-canvas"
            :class="`ian-canvas--${tool}`"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
            @click="onCanvasClick"
          />
          <!-- Always rendered (just hidden) so it can take focus inside the tap
               itself, which phones require before they show the keyboard -->
          <input
            ref="textInputEl"
            v-model="draftText"
            type="text"
            dir="auto"
            enterkeyhint="done"
            autocomplete="off"
            class="ian-text-input"
            :class="{ 'ian-text-input--active': draft }"
            :tabindex="draft ? 0 : -1"
            :aria-hidden="!draft"
            :aria-label="t('imageAnnotator.text')"
            :placeholder="t('imageAnnotator.textPlaceholder')"
            :style="draftStyle"
            @blur="commitText"
          />
        </div>
      </div>

      <div class="ian-toolbar">
        <div class="ian-group" role="group" :aria-label="t('imageAnnotator.tools')">
          <button
            v-for="item in TOOLS"
            :key="item.id"
            type="button"
            class="ian-tool"
            :class="{ 'ian-tool--active': tool === item.id }"
            :aria-pressed="tool === item.id"
            @mousedown.prevent
            @click="setTool(item.id)"
          >
            <v-icon size="22">{{ item.icon }}</v-icon>
            <span>{{ t(`imageAnnotator.${item.id}`) }}</span>
          </button>
        </div>
        <div class="ian-group" role="group" :aria-label="t('imageAnnotator.color')">
          <button
            v-for="c in COLORS"
            :key="c"
            type="button"
            class="ian-swatch"
            :class="{ 'ian-swatch--active': c === color }"
            :style="{ background: c }"
            :aria-label="`${t('imageAnnotator.color')} ${c}`"
            :aria-pressed="c === color"
            @mousedown.prevent
            @click="color = c"
          />
        </div>
        <div class="ian-group" role="group" :aria-label="t('imageAnnotator.size')">
          <button
            v-for="(s, i) in SIZES"
            :key="i"
            type="button"
            class="ian-size"
            :class="{ 'ian-size--active': i === sizeIndex }"
            :aria-label="`${t('imageAnnotator.size')} ${i + 1}`"
            :aria-pressed="i === sizeIndex"
            @mousedown.prevent
            @click="sizeIndex = i"
          >
            <span v-if="tool === 'text'" class="ian-size-letter" :style="{ fontSize: `${s.text * 0.5}px`, color }">A</span>
            <span v-else class="ian-size-dot" :style="{ width: `${s.line + 4}px`, height: `${s.line + 4}px`, background: color }" />
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const TOOLS = [
  { id: 'pen', icon: 'mdi-draw' },
  { id: 'arrow', icon: 'mdi-arrow-top-right' },
  { id: 'text', icon: 'mdi-format-text' },
]
const COLORS = ['#ef4444', '#facc15', '#22c55e', '#3b82f6', '#ffffff', '#111111']
// Line width and text size in screen pixels, so marks look the same at any image size
const SIZES = [
  { line: 3, text: 20 },
  { line: 6, text: 30 },
  { line: 12, text: 44 },
]
// Keeps the canvas under the browser's limits (iOS caps canvases at ~16M pixels)
const MAX_SIDE = 4096
// Tahoma first: it has good Arabic glyphs on Windows; the rest cover other systems
const FONT_FAMILY = 'Tahoma, "Segoe UI", system-ui, -apple-system, Arial, sans-serif'
const RTL_CHAR = /[֐-ࣿיִ-﷿ﹰ-﻿]/
const STRONG_CHAR = /[A-Za-zÀ-ɏ֐-ࣿיִ-﷿ﹰ-﻿]/

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  src: { type: String, default: '' },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'save'])

const { t } = useI18n()

const stageEl = ref(null)
const canvasEl = ref(null)
const textInputEl = ref(null)
const status = ref('idle') // idle | loading | ready | error
const items = ref([]) // pen strokes, arrows and texts, in drawing order
const tool = ref('pen')
const color = ref(COLORS[0])
const sizeIndex = ref(1)
const displaySize = ref({ w: 0, h: 0 })
const canvasSize = ref({ w: 0, h: 0 })
const draft = ref(null) // text being typed: { x, y } in canvas pixels
const draftText = ref('')

let baseImage = null
let loadToken = 0
let active = null // pen stroke or arrow being drawn
let activePointerId = null
let justCommitted = false
let rafId = 0
let resizeObserver = null
let previousOverflow = ''

// Canvas pixels per screen pixel
const pixelRatio = () => (displaySize.value.w ? canvasSize.value.w / displaySize.value.w : 1)

// Fetched as a blob so the canvas stays readable for export
const load = async () => {
  const token = ++loadToken
  status.value = 'loading'
  items.value = []
  baseImage = null
  try {
    const res = await fetch(props.src, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const objectUrl = URL.createObjectURL(await res.blob())
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new Image()
        el.onload = () => resolve(el)
        el.onerror = reject
        el.src = objectUrl
      })
      if (token !== loadToken) return
      baseImage = img
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
    setupCanvas()
    status.value = 'ready'
    await nextTick()
    fit()
  } catch (err) {
    console.error('Error loading image for drawing:', err)
    if (token === loadToken) status.value = 'error'
  }
}

const setupCanvas = () => {
  const canvas = canvasEl.value
  if (!canvas || !baseImage) return
  const scale = Math.min(1, MAX_SIDE / Math.max(baseImage.naturalWidth, baseImage.naturalHeight))
  canvas.width = Math.round(baseImage.naturalWidth * scale)
  canvas.height = Math.round(baseImage.naturalHeight * scale)
  canvasSize.value = { w: canvas.width, h: canvas.height }
  redraw()
}

// Largest size that fits the stage, keeping the image's proportions
const fit = () => {
  const stage = stageEl.value
  const { w, h } = canvasSize.value
  if (!stage || !w) return
  const pad = 16
  const s = Math.min((stage.clientWidth - pad * 2) / w, (stage.clientHeight - pad * 2) / h)
  displaySize.value = { w: Math.max(0, Math.floor(w * s)), h: Math.max(0, Math.floor(h * s)) }
}

const context = () => {
  const ctx = canvasEl.value.getContext('2d')
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  return ctx
}

// ── Drawing ───────────────────────────────────────────────────
const drawPen = (ctx, item) => {
  const [first, ...rest] = item.points
  ctx.strokeStyle = ctx.fillStyle = item.color
  ctx.lineWidth = item.width
  ctx.beginPath()
  if (!rest.length) {
    // A tap leaves a dot
    ctx.arc(first.x, first.y, item.width / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  ctx.moveTo(first.x, first.y)
  for (const p of rest) ctx.lineTo(p.x, p.y)
  ctx.stroke()
}

const drawArrow = (ctx, item) => {
  const { from, to } = item
  const length = Math.hypot(to.x - from.x, to.y - from.y)
  if (!length) return
  const angle = Math.atan2(to.y - from.y, to.x - from.x)
  const head = Math.min(item.head, length)
  const spread = Math.PI / 7
  ctx.strokeStyle = ctx.fillStyle = item.color
  ctx.lineWidth = item.width
  // The shaft stops inside the head so its round end doesn't poke through the tip
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x - Math.cos(angle) * head * 0.7, to.y - Math.sin(angle) * head * 0.7)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(to.x, to.y)
  ctx.lineTo(to.x - head * Math.cos(angle - spread), to.y - head * Math.sin(angle - spread))
  ctx.lineTo(to.x - head * Math.cos(angle + spread), to.y - head * Math.sin(angle + spread))
  ctx.closePath()
  ctx.fill()
}

const isLightColor = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) > 150
}

const drawText = (ctx, item) => {
  ctx.font = `bold ${item.size}px ${FONT_FAMILY}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.direction = item.dir
  // Outline in the opposite shade keeps text readable on any part of the photo
  ctx.lineWidth = item.size * 0.16
  ctx.strokeStyle = isLightColor(item.color) ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.9)'
  ctx.strokeText(item.text, item.x, item.y)
  ctx.fillStyle = item.color
  ctx.fillText(item.text, item.x, item.y)
}

const drawItem = (ctx, item) => {
  if (item.type === 'arrow') drawArrow(ctx, item)
  else if (item.type === 'text') drawText(ctx, item)
  else drawPen(ctx, item)
}

const redraw = () => {
  const canvas = canvasEl.value
  if (!canvas || !baseImage) return
  const ctx = context()
  // White behind transparent images, since the result is saved as JPEG
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height)
  for (const item of items.value) drawItem(ctx, item)
  if (active?.type === 'arrow') drawArrow(ctx, active)
}

const scheduleRedraw = () => {
  if (!rafId) rafId = requestAnimationFrame(() => { rafId = 0; redraw() })
}

const toCanvasPoint = (e) => {
  const canvas = canvasEl.value
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((e.clientX - rect.left) * canvas.width) / rect.width,
    y: ((e.clientY - rect.top) * canvas.height) / rect.height,
  }
}

// ── Pointer input (pen and arrow) ─────────────────────────────
const onPointerDown = (e) => {
  justCommitted = false
  // A tap while typing just finishes the text
  if (draft.value) {
    commitText()
    justCommitted = true
    return
  }
  if (tool.value === 'text') return // placed on click, see onCanvasClick
  if (status.value !== 'ready' || props.saving || activePointerId !== null) return
  if (e.pointerType === 'mouse' && e.button !== 0) return
  activePointerId = e.pointerId
  canvasEl.value.setPointerCapture?.(e.pointerId)
  const k = pixelRatio()
  const width = SIZES[sizeIndex.value].line * k
  const point = toCanvasPoint(e)
  if (tool.value === 'arrow') {
    active = { type: 'arrow', color: color.value, width, head: width * 3 + 12 * k, from: point, to: point }
  } else {
    active = { type: 'pen', color: color.value, width, points: [point] }
    drawPen(context(), active)
  }
}

const onPointerMove = (e) => {
  if (e.pointerId !== activePointerId || !active) return
  if (active.type === 'arrow') {
    active.to = toCanvasPoint(e)
    scheduleRedraw()
    return
  }
  const ctx = context()
  ctx.strokeStyle = active.color
  ctx.lineWidth = active.width
  // Coalesced events give smoother lines on fast strokes and styluses
  const events = e.getCoalescedEvents?.()
  for (const ev of events?.length ? events : [e]) {
    const last = active.points[active.points.length - 1]
    const point = toCanvasPoint(ev)
    active.points.push(point)
    ctx.beginPath()
    ctx.moveTo(last.x, last.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
  }
}

const onPointerUp = (e) => {
  if (e.pointerId !== activePointerId) return
  const finished = active
  active = null
  activePointerId = null
  if (!finished) return
  if (finished.type === 'arrow') {
    cancelAnimationFrame(rafId)
    rafId = 0
    // A tap or tiny drag is not an arrow
    const length = Math.hypot(finished.to.x - finished.from.x, finished.to.y - finished.from.y)
    if (length >= 10 * pixelRatio()) items.value.push(finished)
    redraw()
    return
  }
  items.value.push(finished)
}

// ── Text ──────────────────────────────────────────────────────
const textDir = (text) => {
  const first = text.match(STRONG_CHAR)?.[0]
  return first && RTL_CHAR.test(first) ? 'rtl' : 'ltr'
}

// Measured with the canvas font, so the box fits the text in any script
// (a `ch`-based width runs short for Arabic and scrolls the first letters away)
let measureCtx = null
const measureWidth = (text, font) => {
  measureCtx ??= document.createElement('canvas').getContext('2d')
  measureCtx.font = font
  return measureCtx.measureText(text).width
}

const draftStyle = computed(() => {
  if (!draft.value || !canvasSize.value.w) return {}
  const size = SIZES[sizeIndex.value].text
  const textWidth = draftText.value
    ? measureWidth(draftText.value, `bold ${size}px ${FONT_FAMILY}`) + size * 0.6
    : measureWidth(t('imageAnnotator.textPlaceholder'), `500 15px ${FONT_FAMILY}`) + 8
  return {
    left: `${(draft.value.x / canvasSize.value.w) * displaySize.value.w}px`,
    top: `${(draft.value.y / canvasSize.value.h) * displaySize.value.h}px`,
    fontSize: `${size}px`,
    color: color.value,
    // + horizontal padding and border
    width: `${Math.ceil(textWidth) + 24}px`,
  }
})

const onCanvasClick = (e) => {
  const skip = justCommitted
  justCommitted = false
  if (tool.value !== 'text' || skip || draft.value || status.value !== 'ready' || props.saving) return
  draft.value = toCanvasPoint(e)
  draftText.value = ''
  // Focus inside the tap itself, or phones won't open the keyboard
  textInputEl.value?.focus({ preventScroll: true })
}

const commitText = () => {
  const position = draft.value
  if (!position) return
  draft.value = null
  const text = draftText.value.trim()
  draftText.value = ''
  textInputEl.value?.blur()
  if (!text) return
  const item = {
    type: 'text',
    text,
    x: position.x,
    y: position.y,
    color: color.value,
    size: SIZES[sizeIndex.value].text * pixelRatio(),
    dir: textDir(text),
  }
  items.value.push(item)
  drawText(context(), item)
}

const discardText = () => {
  draft.value = null
  draftText.value = ''
  textInputEl.value?.blur()
}

const setTool = (id) => {
  commitText()
  tool.value = id
}

// ── Actions ───────────────────────────────────────────────────
const undo = () => {
  items.value.pop()
  redraw()
}

const clearAll = () => {
  items.value = []
  redraw()
}

const close = () => emit('update:modelValue', false)

const cancel = () => {
  if (props.saving) return
  const hasWork = items.value.length || draftText.value.trim()
  if (hasWork && !window.confirm(t('imageAnnotator.discardConfirm'))) return
  close()
}

const save = () => {
  commitText()
  if (props.saving || !items.value.length) return
  canvasEl.value.toBlob((blob) => {
    if (blob) emit('save', blob)
  }, 'image/jpeg', 0.92)
}

// Capture phase, so a viewer open underneath doesn't also react to these keys
const onKeydown = (e) => {
  e.stopPropagation()
  if (draft.value) {
    if (e.isComposing) return
    if (e.key === 'Enter') {
      e.preventDefault()
      commitText()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      discardText()
    }
    return // other keys type into the text box
  }
  if (e.key === 'Escape') cancel()
  else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    undo()
  }
}

const teardown = () => {
  loadToken++
  window.removeEventListener('keydown', onKeydown, true)
  resizeObserver?.disconnect()
  resizeObserver = null
  cancelAnimationFrame(rafId)
  rafId = 0
  baseImage = null
  active = null
  activePointerId = null
  draft.value = null
  draftText.value = ''
  items.value = []
  status.value = 'idle'
}

watch(
  () => [props.modelValue, props.src],
  async ([open], [wasOpen] = []) => {
    if (!open) {
      if (wasOpen) {
        teardown()
        document.body.style.overflow = previousOverflow
      }
      return
    }
    if (!wasOpen) {
      previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', onKeydown, true)
      await nextTick()
      resizeObserver = new ResizeObserver(fit)
      if (stageEl.value) resizeObserver.observe(stageEl.value)
    }
    // Opened before the caller has the URL: show the spinner until it arrives
    if (props.src) load()
    else status.value = 'loading'
  }
)

onBeforeUnmount(() => {
  if (props.modelValue) document.body.style.overflow = previousOverflow
  teardown()
})
</script>

<style scoped>
.ian-root {
  position: fixed;
  inset: 0;
  z-index: 3050;
  background: rgb(10, 10, 14);
  display: flex;
  flex-direction: column;
}

.ian-topbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  flex-shrink: 0;
}
.ian-title {
  flex: 1;
  min-width: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ian-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.ian-stage {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.ian-board {
  position: relative;
  flex-shrink: 0;
}
.ian-canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
  cursor: crosshair;
  border-radius: 4px;
}
.ian-canvas--text {
  cursor: text;
}
.ian-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.ian-text-input {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-50%, -50%);
  min-width: 4ch;
  max-width: 90%;
  padding: 2px 10px;
  border: 2px dashed rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.35);
  outline: none;
  text-align: center;
  font-family: Tahoma, "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
  font-weight: 700;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.6);
  opacity: 0;
  pointer-events: none;
}
.ian-text-input--active {
  opacity: 1;
  pointer-events: auto;
}
.ian-text-input::placeholder {
  color: rgba(255, 255, 255, 0.75);
  font-size: 15px;
  font-weight: 500;
}

.ian-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px 24px;
  padding: 10px 16px 16px;
  flex-shrink: 0;
}
.ian-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ian-tool {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 56px;
  padding: 6px 8px;
  border-radius: 10px;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.ian-tool--active {
  border-color: #fff;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}
.ian-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.35);
  cursor: pointer;
  transition: transform 0.1s;
}
.ian-swatch--active {
  border-color: #fff;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.35);
  transform: scale(1.12);
}
.ian-size {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.ian-size-dot {
  display: block;
  border-radius: 50%;
}
.ian-size-letter {
  font-weight: 700;
  line-height: 1;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.6);
}
.ian-size--active {
  border-color: #fff;
}
.ian-tool:focus-visible,
.ian-swatch:focus-visible,
.ian-size:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
</style>
