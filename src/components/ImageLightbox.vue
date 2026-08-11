<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      ref="rootEl"
      class="ilb-root"
      @click.self="close"
    >
      <div class="ilb-topbar">
        <span class="ilb-counter">{{ index + 1 }} / {{ images.length }}</span>
        <div class="ilb-actions">
          <v-btn icon variant="text" color="white" size="small" @click="zoomOut" :disabled="scale <= MIN_SCALE">
            <v-icon size="20">mdi-magnify-minus-outline</v-icon>
          </v-btn>
          <span class="ilb-zoom-label">{{ Math.round(scale * 100) }}%</span>
          <v-btn icon variant="text" color="white" size="small" @click="zoomIn" :disabled="scale >= MAX_SCALE">
            <v-icon size="20">mdi-magnify-plus-outline</v-icon>
          </v-btn>
          <v-btn icon variant="text" color="white" size="small" @click="resetZoom" :disabled="scale === 1">
            <v-icon size="20">mdi-backup-restore</v-icon>
          </v-btn>
          <v-btn icon variant="text" color="white" size="small" @click="download">
            <v-icon size="20">mdi-download</v-icon>
          </v-btn>
          <v-btn icon variant="text" color="white" size="small" @click="toggleFullscreen">
            <v-icon size="20">{{ isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
          </v-btn>
          <v-btn icon variant="text" color="white" size="small" @click="close">
            <v-icon size="22">mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <button
        v-if="images.length > 1"
        type="button"
        class="ilb-nav ilb-nav--prev"
        @click.stop="prev"
      >
        <v-icon size="32" color="white">mdi-chevron-left</v-icon>
      </button>
      <button
        v-if="images.length > 1"
        type="button"
        class="ilb-nav ilb-nav--next"
        @click.stop="next"
      >
        <v-icon size="32" color="white">mdi-chevron-right</v-icon>
      </button>

      <div
        class="ilb-stage"
        @wheel.prevent="onWheel"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointerleave="onPointerUp"
        @dblclick="onDoubleClick"
      >
        <img
          v-if="current"
          :src="current.url"
          :alt="current.name || ''"
          class="ilb-image"
          :class="{ 'ilb-image--zoomed': scale > 1 }"
          :style="imageStyle"
          draggable="false"
          @click.stop
        />
      </div>

      <div v-if="current?.name" class="ilb-caption">{{ current.name }}</div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'

const MIN_SCALE = 1
const MAX_SCALE = 4

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  images: { type: Array, default: () => [] },
  index: { type: Number, default: 0 },
})

const emit = defineEmits(['update:modelValue', 'update:index'])

const rootEl = ref(null)
const scale = ref(1)
const translate = ref({ x: 0, y: 0 })
const isFullscreen = ref(false)

const dragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const translateStart = ref({ x: 0, y: 0 })

const current = computed(() => props.images[props.index] || null)

const imageStyle = computed(() => ({
  transform: `translate(${translate.value.x}px, ${translate.value.y}px) scale(${scale.value})`,
}))

const resetZoom = () => {
  scale.value = 1
  translate.value = { x: 0, y: 0 }
}

const close = () => {
  emit('update:modelValue', false)
}

const setIndex = (i) => {
  const len = props.images.length
  if (!len) return
  const next = (i + len) % len
  emit('update:index', next)
  resetZoom()
}

const prev = () => setIndex(props.index - 1)
const next = () => setIndex(props.index + 1)

const zoomIn = () => {
  scale.value = Math.min(MAX_SCALE, +(scale.value + 0.5).toFixed(2))
}
const zoomOut = () => {
  scale.value = Math.max(MIN_SCALE, +(scale.value - 0.5).toFixed(2))
  if (scale.value === MIN_SCALE) translate.value = { x: 0, y: 0 }
}

const onWheel = (e) => {
  if (e.deltaY < 0) zoomIn()
  else zoomOut()
}

const onDoubleClick = () => {
  if (scale.value > 1) resetZoom()
  else scale.value = 2
}

const onPointerDown = (e) => {
  if (scale.value <= 1) return
  dragging.value = true
  dragStart.value = { x: e.clientX, y: e.clientY }
  translateStart.value = { ...translate.value }
}
const onPointerMove = (e) => {
  if (!dragging.value) return
  translate.value = {
    x: translateStart.value.x + (e.clientX - dragStart.value.x),
    y: translateStart.value.y + (e.clientY - dragStart.value.y),
  }
}
const onPointerUp = () => {
  dragging.value = false
}

const download = async () => {
  const img = current.value
  if (!img?.url) return
  try {
    const res = await fetch(img.url)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = img.name || `image-${props.index + 1}.jpg`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(blobUrl)
  } catch {
    // Cross-origin storage without CORS headers — fall back to opening the
    // image directly so the user can save it manually.
    window.open(img.url, '_blank', 'noopener')
  }
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    rootEl.value?.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

const onFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

const onKeydown = (e) => {
  if (!props.modelValue) return
  if (e.key === 'Escape') close()
  else if (e.key === 'ArrowLeft') prev()
  else if (e.key === 'ArrowRight') next()
  else if (e.key === '+' || e.key === '=') zoomIn()
  else if (e.key === '-') zoomOut()
}

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      resetZoom()
      await nextTick()
      document.addEventListener('keydown', onKeydown)
      document.addEventListener('fullscreenchange', onFullscreenChange)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', onKeydown)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.body.style.overflow = ''
      if (document.fullscreenElement) document.exitFullscreen?.()
    }
  }
)
</script>

<style scoped>
.ilb-root {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(10, 10, 14, 0.94);
  display: flex;
  flex-direction: column;
  animation: ilb-fade-in 0.15s ease-out;
}
@keyframes ilb-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.ilb-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  flex-shrink: 0;
}
.ilb-counter {
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  font-weight: 600;
}
.ilb-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}
.ilb-zoom-label {
  color: rgba(255, 255, 255, 0.75);
  font-size: 12px;
  min-width: 40px;
  text-align: center;
}

.ilb-stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  touch-action: none;
}
.ilb-image {
  max-width: 92vw;
  max-height: 78vh;
  object-fit: contain;
  border-radius: 8px;
  cursor: zoom-in;
  transition: transform 0.05s linear;
  user-select: none;
}
.ilb-image--zoomed {
  cursor: grab;
}

.ilb-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
}
.ilb-nav:hover {
  background: rgba(255, 255, 255, 0.18);
}
.ilb-nav--prev { inset-inline-start: 16px; }
.ilb-nav--next { inset-inline-end: 16px; }

.ilb-caption {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12.5px;
  padding: 8px 16px 16px;
  flex-shrink: 0;
}
</style>
