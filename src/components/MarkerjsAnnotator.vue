<template>
  <Teleport to="body">
    <div v-if="modelValue" class="mja-root" @keydown.stop>
      <div class="mja-topbar">
        <v-btn
          icon
          variant="text"
          color="white"
          size="small"
          :disabled="busy"
          :title="t('imageAnnotator.cancel')"
          :aria-label="t('imageAnnotator.cancel')"
          @click="cancel"
        >
          <v-icon size="22">mdi-close</v-icon>
        </v-btn>
        <span class="mja-title">{{ t('imageAnnotator.title') }}</span>
        <div class="mja-actions">
          <v-btn
            v-if="hasSelection"
            icon
            variant="text"
            color="white"
            size="small"
            :disabled="busy"
            :title="t('imageAnnotator.deleteSelected')"
            :aria-label="t('imageAnnotator.deleteSelected')"
            @click="deleteSelected"
          >
            <v-icon size="20">mdi-trash-can-outline</v-icon>
          </v-btn>
          <v-btn
            icon
            variant="text"
            color="white"
            size="small"
            :disabled="!canUndo || busy"
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
            :disabled="!canRedo || busy"
            :title="t('imageAnnotator.redo')"
            :aria-label="t('imageAnnotator.redo')"
            @click="redo"
          >
            <v-icon size="20">mdi-redo</v-icon>
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            size="small"
            class="ms-2"
            :loading="busy"
            :disabled="!markerCount || status !== 'ready'"
            @click="save"
          >
            <v-icon start size="18">mdi-content-save-outline</v-icon>
            {{ t('imageAnnotator.save') }}
          </v-btn>
        </div>
      </div>

      <div class="mja-stage">
        <div v-if="status === 'loading'" class="mja-status">
          <v-progress-circular indeterminate color="white" size="32" />
          <span>{{ t('imageAnnotator.loading') }}</span>
        </div>
        <div v-else-if="status === 'error'" class="mja-status">
          <v-icon size="40" color="white">mdi-image-broken-variant</v-icon>
          <span>{{ t('imageAnnotator.loadFailed') }}</span>
        </div>
        <!-- marker.js mounts its editor here -->
        <div v-show="status === 'ready'" ref="areaHostEl" class="mja-area-host" />
      </div>

      <div class="mja-toolbar">
        <div class="mja-group" role="group" :aria-label="t('imageAnnotator.tools')">
          <button
            v-for="item in TOOLS"
            :key="item.id"
            type="button"
            class="mja-tool"
            :class="{ 'mja-tool--active': tool === item.id }"
            :aria-pressed="tool === item.id"
            :disabled="status !== 'ready'"
            @click="setTool(item.id)"
          >
            <v-icon size="22">{{ item.icon }}</v-icon>
            <span>{{ t(`imageAnnotator.${item.id}`) }}</span>
          </button>
        </div>
        <div class="mja-group" role="group" :aria-label="t('imageAnnotator.color')">
          <button
            v-for="c in COLORS"
            :key="c"
            type="button"
            class="mja-swatch"
            :class="{ 'mja-swatch--active': c === color }"
            :style="{ background: c }"
            :aria-label="`${t('imageAnnotator.color')} ${c}`"
            :aria-pressed="c === color"
            @click="setColor(c)"
          />
        </div>
        <div class="mja-group" role="group" :aria-label="t('imageAnnotator.size')">
          <button
            v-for="(s, i) in SIZES"
            :key="i"
            type="button"
            class="mja-size"
            :class="{ 'mja-size--active': i === sizeIndex }"
            :aria-label="`${t('imageAnnotator.size')} ${i + 1}`"
            :aria-pressed="i === sizeIndex"
            @click="setSize(i)"
          >
            <span v-if="tool === 'text'" class="mja-size-letter" :style="{ fontSize: `${s.text * 0.5}px`, color }">A</span>
            <span v-else class="mja-size-dot" :style="{ width: `${s.line + 4}px`, height: `${s.line + 4}px`, background: color }" />
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
// Trial of marker.js 3 (https://markerjs.com) behind our own simple toolbar.
// Free under its linkware license, which keeps a small "Powered by marker.js"
// logo in the editor corner; a paid license removes it.
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const TOOLS = [
  { id: 'select', icon: 'mdi-cursor-default-outline' },
  { id: 'pen', icon: 'mdi-draw' },
  { id: 'arrow', icon: 'mdi-arrow-top-right' },
  { id: 'text', icon: 'mdi-format-text' },
]
const MARKER_TYPES = { pen: 'FreehandMarker', arrow: 'ArrowMarker', text: 'TextMarker' }
const COLORS = ['#ef4444', '#facc15', '#22c55e', '#3b82f6', '#ffffff', '#111111']
// Line width and text size in screen pixels; converted to image pixels on use
const SIZES = [
  { line: 3, text: 20 },
  { line: 6, text: 30 },
  { line: 12, text: 44 },
]
const MAX_SIDE = 4096
const FONT_FAMILY = 'Tahoma, "Segoe UI", system-ui, -apple-system, Arial, sans-serif'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  src: { type: String, default: '' },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'save'])

const { t } = useI18n()

const areaHostEl = ref(null)
const status = ref('idle') // idle | loading | ready | error
const tool = ref('pen')
const color = ref(COLORS[0])
const sizeIndex = ref(1)
const canUndo = ref(false)
const canRedo = ref(false)
const hasSelection = ref(false)
const markerCount = ref(0)
const rendering = ref(false)
const busy = ref(false)

let lib = null // the marker.js module, loaded on first use
let area = null
let image = null
let objectUrl = ''
let sourceType = ''
let loadToken = 0
let previousOverflow = ''

watch([() => props.saving, rendering], ([saving, r]) => { busy.value = saving || r })

const isText = (editor) => editor?.marker?.typeName === 'TextMarker'

// marker.js works in image pixels, which the screen shows at `zoomLevel`
const toImagePx = (screenPx) => Math.max(1, Math.round(screenPx / (area?.zoomLevel || 1)))

const applyStyle = (editor) => {
  const size = SIZES[sizeIndex.value]
  if (isText(editor)) {
    editor.color = color.value
    editor.fontFamily = FONT_FAMILY
    editor.fontSize = { value: toImagePx(size.text), units: 'px', step: 1 }
  } else {
    editor.strokeColor = color.value
    editor.strokeWidth = toImagePx(size.line)
  }
}

const sync = () => {
  if (!area) return
  canUndo.value = area.isUndoPossible
  canRedo.value = area.isRedoPossible
  markerCount.value = area.editors.length
  hasSelection.value = area.selectedMarkerEditors.length > 0
}

// Gets the area ready to draw the next mark with the current tool
const arm = () => {
  if (!area) return
  if (tool.value === 'select') {
    area.switchToSelectMode()
    return
  }
  const editor = area.createMarker(MARKER_TYPES[tool.value])
  if (editor) applyStyle(editor)
}

const onMarkerCreate = (e) => {
  sync()
  // Pen and arrow stay armed for the next mark. After text, switch to move so a
  // tap elsewhere finishes typing instead of starting another text box.
  if (isText(e.detail.markerEditor)) {
    tool.value = 'select'
    // The new box holds a placeholder word; select it so typing replaces it.
    // Delayed past the click a phone fires after a tap, which would move the caret.
    setTimeout(() => area?.shadowRoot?.querySelector('textarea')?.select(), 150)
  } else {
    arm()
  }
}

// A text box left empty would be an invisible mark
const onMarkerDeselect = (e) => {
  const editor = e.detail.markerEditor
  if (isText(editor) && !editor.marker.text?.trim()) area?.deleteMarker(editor, true)
  sync()
}

// marker.js copies the typed text only on keyup. Phone keyboards' word
// suggestions, Arabic input and paste can change the text with no keyup, and
// that text would be lost, so every input is turned into the keyup it expects.
const onTextInput = (e) => {
  const target = e.composedPath()[0]
  if (target?.tagName === 'TEXTAREA') target.dispatchEvent(new KeyboardEvent('keyup'))
}

// Phones follow a tap with emulated mouse events, whose mousedown lands on the
// image and pulls focus off the text box marker.js just opened, closing it.
// Cancelling touchend drops those emulated events; marker.js only needs the
// pointer events, which have already fired. Taps inside the text box are left
// alone so the caret can still be placed.
const onTouchEnd = (e) => {
  const target = e.composedPath()[0]
  if (e.cancelable && !target?.closest?.('textarea')) e.preventDefault()
}

const onAreaShow = () => {
  // marker.js records its first undo step before it has measured the image
  // (0×0), so the first mark would replace it and could never be undone.
  // Re-recording the empty state at the real size fixes that.
  area.restoreState(area.getState())
  sync()
  // Armed on the next frame: a marker created inside areashow is drawn into a
  // layer marker.js is still setting up, and its first stroke never shows
  requestAnimationFrame(arm)
}

// Sizes depend on the zoom, which marker.js may still be fitting when a tool is
// armed (and which pinch-zoom changes), so they are set again as drawing starts.
// Capture phase runs this before marker.js handles the same pointerdown.
const onPointerDownCapture = () => {
  const pending = area?.currentMarkerEditor
  if (pending?.state === 'new') applyStyle(pending)
}

const load = async () => {
  const token = ++loadToken
  status.value = 'loading'
  try {
    lib ??= await import('@markerjs/markerjs3')
    lib.TextMarker.DEFAULT_TEXT = t('imageAnnotator.text')
    // Fetched as a blob so the rendered result is not blocked by CORS
    const res = await fetch(props.src, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    if (token !== loadToken) return
    sourceType = blob.type
    objectUrl = URL.createObjectURL(blob)
    image = new Image()
    image.src = objectUrl
    await image.decode()
    if (token !== loadToken) return

    status.value = 'ready'
    await nextTick()
    area = new lib.MarkerArea()
    area.autoZoomIn = true
    area.autoZoomOut = true
    // Built-in outline keeps marks readable on both dark and bright parts of an X-ray
    area.defaultFilter = 'url(#outline)'
    area.targetImage = image
    area.style.width = '100%'
    area.style.height = '100%'
    for (const name of ['areastatechange', 'markerselect', 'markerdelete', 'markerchange', 'arearestorestate']) {
      area.addEventListener(name, sync)
    }
    area.addEventListener('markerdeselect', onMarkerDeselect)
    area.addEventListener('markercreate', onMarkerCreate)
    area.addEventListener('areashow', onAreaShow, { once: true })
    areaHostEl.value.appendChild(area)
    area.shadowRoot?.addEventListener('input', onTextInput, true)
    area.shadowRoot?.addEventListener('touchend', onTouchEnd, { capture: true, passive: false })
    area.shadowRoot?.addEventListener('pointerdown', onPointerDownCapture, true)
  } catch (err) {
    console.error('Error loading image for drawing:', err)
    if (token === loadToken) status.value = 'error'
  }
}

// ── Toolbar ───────────────────────────────────────────────────
const setTool = (id) => {
  tool.value = id
  arm()
}

// With marks selected, color and size change them; otherwise they set the next mark
const restyleSelected = () => {
  if (!area) return
  const selected = area.selectedMarkerEditors
  if (selected.length) {
    selected.forEach(applyStyle)
    return
  }
  const pending = area.currentMarkerEditor
  if (pending && pending.state === 'new') applyStyle(pending)
}

const setColor = (c) => {
  color.value = c
  restyleSelected()
}

const setSize = (i) => {
  sizeIndex.value = i
  restyleSelected()
}

const deleteSelected = () => {
  area?.deleteSelectedMarkers()
  sync()
}

const undo = () => {
  area?.undo()
  sync()
  arm()
}

const redo = () => {
  area?.redo()
  sync()
  arm()
}

const close = () => emit('update:modelValue', false)

const cancel = () => {
  if (busy.value) return
  if (markerCount.value && !window.confirm(t('imageAnnotator.discardConfirm'))) return
  close()
}

const save = async () => {
  if (!area || busy.value) return
  // Ends any text still being typed so it is part of the state
  area.switchToSelectMode()
  const state = area.getState()
  if (!state.markers.length) return
  rendering.value = true
  try {
    const renderer = new lib.Renderer()
    renderer.targetImage = image
    renderer.defaultFilter = area.defaultFilter
    const longest = Math.max(image.naturalWidth, image.naturalHeight)
    if (longest > MAX_SIDE) {
      const scale = MAX_SIDE / longest
      renderer.naturalSize = false
      renderer.width = Math.round(image.naturalWidth * scale)
      renderer.height = Math.round(image.naturalHeight * scale)
    } else {
      renderer.naturalSize = true
    }
    // Keep PNG for PNG sources (X-rays), JPEG for photos
    renderer.imageType = sourceType === 'image/png' ? 'image/png' : 'image/jpeg'
    renderer.imageQuality = 0.92
    const dataUrl = await renderer.rasterize(state)
    const blob = await (await fetch(dataUrl)).blob()
    emit('save', blob)
  } catch (err) {
    console.error('Error rendering drawing:', err)
  } finally {
    rendering.value = false
    arm()
  }
}

// Capture phase, so a viewer open underneath doesn't also react to these keys.
// Keys typed into marker.js' text box are left alone here; it lives in a shadow
// root, so the real target comes from composedPath() (e.target is the host).
// Those keys still stop at the root element (@keydown.stop in the template).
const onKeydown = (e) => {
  const target = e.composedPath?.()[0] || e.target
  if (target?.closest?.('input, textarea, [contenteditable]')) return
  e.stopPropagation()
  const mod = e.ctrlKey || e.metaKey
  if (e.key === 'Escape') cancel()
  else if (mod && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    e.shiftKey ? redo() : undo()
  } else if (mod && e.key.toLowerCase() === 'y') {
    e.preventDefault()
    redo()
  } else if ((e.key === 'Delete' || e.key === 'Backspace') && hasSelection.value) {
    e.preventDefault()
    deleteSelected()
  }
}

const teardown = () => {
  loadToken++
  window.removeEventListener('keydown', onKeydown, true)
  area?.remove()
  area = null
  image = null
  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = ''
  tool.value = 'pen'
  canUndo.value = canRedo.value = hasSelection.value = false
  markerCount.value = 0
  status.value = 'idle'
}

watch(
  () => [props.modelValue, props.src],
  ([open], [wasOpen] = []) => {
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
    } else {
      // New image while open: start over
      area?.remove()
      area = null
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      objectUrl = ''
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
.mja-root {
  position: fixed;
  inset: 0;
  z-index: 3050;
  background: rgb(10, 10, 14);
  display: flex;
  flex-direction: column;
}

.mja-topbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  flex-shrink: 0;
}
.mja-title {
  flex: 1;
  min-width: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mja-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.mja-stage {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.mja-area-host {
  width: 100%;
  height: 100%;
}
.mja-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.mja-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px 24px;
  padding: 10px 16px 16px;
  flex-shrink: 0;
}
.mja-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mja-tool {
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
.mja-tool:disabled {
  opacity: 0.4;
  cursor: default;
}
.mja-tool--active {
  border-color: #fff;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}
.mja-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.35);
  cursor: pointer;
  transition: transform 0.1s;
}
.mja-swatch--active {
  border-color: #fff;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.35);
  transform: scale(1.12);
}
.mja-size {
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
.mja-size-dot {
  display: block;
  border-radius: 50%;
}
.mja-size-letter {
  font-weight: 700;
  line-height: 1;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.6);
}
.mja-size--active {
  border-color: #fff;
}
.mja-tool:focus-visible,
.mja-swatch:focus-visible,
.mja-size:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
</style>
