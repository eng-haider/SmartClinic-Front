<template>
  <div>
    <div v-if="!disabled" class="nia-type-row">
      <span class="nia-type-label">نوع الصورة التالية:</span>
      <v-chip-group
        :model-value="selectedType"
        mandatory
        selected-class="text-white bg-primary"
        @update:model-value="emit('update:selectedType', $event)"
      >
        <v-chip
          v-for="opt in noteImageTypeOptions"
          :key="opt.value"
          :value="opt.value"
          size="x-small"
          variant="outlined"
          filter
        >
          <v-icon size="12" class="me-1">{{ opt.icon }}</v-icon>{{ opt.label }}
        </v-chip>
      </v-chip-group>
    </div>

    <div class="nia-grid">
      <div
        v-for="(img, idx) in images"
        :key="img.key"
        class="nia-thumb"
        @click="img.status !== 'uploading' && emit('open', idx)"
      >
        <img :src="img.url" :alt="img.name || ''" loading="lazy" />

        <div v-if="img.status === 'uploading'" class="nia-thumb__progress">
          <v-progress-circular :model-value="img.progress || 0" size="30" width="3" color="white">
            <span class="nia-thumb__pct">{{ img.progress || 0 }}</span>
          </v-progress-circular>
        </div>

        <div v-else-if="img.status === 'error'" class="nia-thumb__error">
          <v-icon size="20" color="white">mdi-alert-circle-outline</v-icon>
        </div>

        <span v-if="typeMeta(img.type)" class="nia-thumb__type">
          <v-icon size="11" class="me-1">{{ typeMeta(img.type).icon }}</v-icon>{{ typeMeta(img.type).label }}
        </span>

        <button
          v-if="!disabled"
          type="button"
          class="nia-thumb__remove"
          :aria-label="'remove'"
          @click.stop="emit('remove', img.key)"
        >
          <v-icon size="14" color="white">mdi-close</v-icon>
        </button>
      </div>

      <div
        v-if="!disabled"
        class="nia-add"
        :class="{ 'nia-add--drag': dragActive }"
        @click="inputEl?.click()"
        @dragover.prevent="dragActive = true"
        @dragleave.prevent="dragActive = false"
        @drop.prevent="onDrop"
      >
        <input
          ref="inputEl"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          @change="onFileInput"
        />
        <v-icon size="22" color="grey-darken-1">mdi-image-plus-outline</v-icon>
        <span class="nia-add__label">{{ addLabel }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { extractImageFiles, noteImageTypeOptions, noteImageTypeMeta } from '@/utils/imageFiles'

const props = defineProps({
  images: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
  addLabel: { type: String, default: 'إضافة صورة' },
  selectedType: { type: String, default: 'other' },
})

const emit = defineEmits(['add-files', 'remove', 'open', 'update:selectedType'])

const inputEl = ref(null)
const dragActive = ref(false)
const typeMeta = (type) => noteImageTypeMeta(type)

const onFileInput = (e) => {
  const files = Array.from(e.target.files || [])
  if (files.length) emit('add-files', { files, type: props.selectedType })
  e.target.value = ''
}

const onDrop = (e) => {
  dragActive.value = false
  const files = extractImageFiles(e.dataTransfer)
  if (files.length) emit('add-files', { files, type: props.selectedType })
}
</script>

<style scoped>
.nia-type-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  margin-bottom: 2px;
  /* Label drops above the chips rather than forcing the row wider than a phone */
  flex-wrap: wrap;
}
.nia-type-label {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  white-space: nowrap;
}
/* A chip-group lays its six chips out on one non-wrapping line and reports that
   full width (~286px) as its minimum. Nested inside every note card, that alone
   dragged the notes panel out to 528px — wider than any phone. min-width:0 is not
   enough on its own (a flex item's min-content contribution still follows its
   content), so let the chips wrap onto a second line instead of scrolling
   sideways — which also beats a hidden horizontal scroll on touch. */
.nia-type-row :deep(.v-chip-group) {
  margin-top: -6px;
  min-width: 0;
  flex: 1 1 0;
}
/* The slide-group's scroll container sizes its content to max-content, so the
   content needs a bounded width before flex-wrap has anything to wrap against —
   and the container's own clipping has to go, or the last chip is cut mid-word. */
.nia-type-row :deep(.v-slide-group__container) {
  overflow: visible;
}
.nia-type-row :deep(.v-slide-group__content) {
  flex: 1 1 auto;
  flex-wrap: wrap;
  row-gap: 4px;
}
.nia-type-row :deep(.v-chip) {
  font-size: 11px;
}

.nia-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.nia-thumb {
  position: relative;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  background: #f1f5f9;
}
.nia-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.nia-thumb__progress,
.nia-thumb__error {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}
.nia-thumb__pct {
  font-size: 9px;
  color: white;
  font-weight: 700;
}
.nia-thumb__type {
  position: absolute;
  bottom: 4px;
  inset-inline-start: 4px;
  display: inline-flex;
  align-items: center;
  background: rgba(15, 23, 42, 0.65);
  color: white;
  font-size: 9.5px;
  font-weight: 600;
  border-radius: 999px;
  padding: 2px 6px;
  line-height: 1;
}
.nia-thumb__remove {
  position: absolute;
  top: 4px;
  inset-inline-end: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
}
.nia-thumb:hover .nia-thumb__remove {
  opacity: 1;
}

.nia-add {
  aspect-ratio: 1;
  border: 1.5px dashed rgba(0, 0, 0, 0.18);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.nia-add:hover,
.nia-add--drag {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.05);
}
.nia-add__label {
  font-size: 10px;
  color: #64748b;
  text-align: center;
  line-height: 1.2;
  padding: 0 4px;
}
</style>
