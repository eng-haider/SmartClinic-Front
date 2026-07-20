<template>
  <v-navigation-drawer
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :location="drawerLocation"
    temporary
    width="440"
    class="ai-insight-drawer"
  >
    <!-- Header -->
    <div class="ai-drawer-header">
      <div class="ai-drawer-header-left">
        <div class="ai-drawer-avatar">
          <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
            <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7v1h1a1 1 0 110 2h-1v1a3 3 0 01-3 3H6a3 3 0 01-3-3v-1H2a1 1 0 110-2h1v-1a7 7 0 017-7h1V5.73A2 2 0 0112 2z" fill="white"/>
            <circle cx="9" cy="14" r="1.5" fill="#0ea5e9"/>
            <circle cx="15" cy="14" r="1.5" fill="#0ea5e9"/>
          </svg>
        </div>
        <div>
          <h3 class="ai-drawer-title">{{ t('ai.insightTitle') }}</h3>
          <span class="ai-drawer-subtitle">{{ title }}</span>
        </div>
      </div>
      <v-btn icon variant="text" size="small" color="white" @click="$emit('update:modelValue', false)">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>

    <!-- Body -->
    <div class="ai-drawer-body">
      <!-- Image upload / preview -->
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style="display:none"
        @change="onFileSelected"
      />

      <div v-if="imagePreview" class="ai-image-bar">
        <img :src="imagePreview" alt="upload" class="ai-image-thumb" />
        <span class="ai-image-name">{{ imageName }}</span>
        <v-btn
          color="primary"
          size="small"
          variant="flat"
          :disabled="loading"
          @click="emitAnalyzeImage"
        >
          <v-icon start size="16">mdi-creation</v-icon>
          {{ t('ai.analyzeImage') }}
        </v-btn>
        <v-btn icon variant="text" size="x-small" :disabled="loading" @click="clearImage">
          <v-icon size="16">mdi-close</v-icon>
        </v-btn>
      </div>
      <button
        v-else
        type="button"
        class="ai-upload-zone"
        :disabled="loading"
        @click="fileInput?.click()"
      >
        <v-icon size="20" color="primary">mdi-image-plus</v-icon>
        <span>{{ t('ai.uploadImage') }}</span>
      </button>

      <!-- Existing patient images — click to analyze automatically -->
      <div v-if="patientImages.length" class="ai-patient-images">
        <div class="ai-patient-images-label">
          <v-icon size="14" color="primary">mdi-image-multiple</v-icon>
          {{ t('ai.patientImages') }}
        </div>
        <div class="ai-thumb-row">
          <button
            v-for="img in patientImages"
            :key="img.id"
            type="button"
            class="ai-thumb"
            :disabled="loading"
            :title="t('ai.analyzeImage')"
            @click="analyzeExisting(img)"
          >
            <img :src="img.url" alt="patient image" />
            <span class="ai-thumb-overlay"><v-icon size="16" color="white">mdi-creation</v-icon></span>
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="ai-state ai-loading">
        <div class="ai-thinking-orb">
          <span class="orb-ring"></span>
          <svg viewBox="0 0 24 24" fill="none" width="30" height="30">
            <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7v1h1a1 1 0 110 2h-1v1a3 3 0 01-3 3H6a3 3 0 01-3-3v-1H2a1 1 0 110-2h1v-1a7 7 0 017-7h1V5.73A2 2 0 0112 2z" fill="#0ea5e9"/>
            <circle cx="9" cy="14" r="1.5" fill="white"/>
            <circle cx="15" cy="14" r="1.5" fill="white"/>
          </svg>
        </div>
        <p class="ai-loading-text">{{ t('ai.analyzing') }}</p>
        <div class="typing-indicator">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="ai-state ai-error">
        <v-icon size="48" color="error">mdi-alert-circle-outline</v-icon>
        <p class="ai-error-text">{{ error }}</p>
        <v-btn color="primary" variant="tonal" prepend-icon="mdi-refresh" @click="$emit('retry')">
          {{ t('ai.retry') }}
        </v-btn>
      </div>

      <!-- Result -->
      <div v-else-if="response" class="ai-result">
        <img v-if="analyzedImage" :src="analyzedImage" alt="analyzed" class="ai-analyzed-image" />
        <div class="ai-result-card">
          <div class="ai-result-content" v-html="parseMarkdown(response)"></div>
        </div>

        <div v-if="sources && sources.length" class="ai-sources">
          <v-icon size="14" color="primary">mdi-database-search</v-icon>
          <span>{{ t('ai.sourcesUsed', { n: sources.length }) }}</span>
        </div>

        <div class="ai-result-actions">
          <v-btn variant="text" size="small" prepend-icon="mdi-refresh" @click="$emit('retry')">
            {{ t('ai.regenerate') }}
          </v-btn>
          <v-btn variant="text" size="small" prepend-icon="mdi-content-copy" @click="copyResponse">
            {{ copied ? t('ai.copied') : t('ai.copy') }}
          </v-btn>
        </div>
      </div>

      <!-- Idle / empty -->
      <div v-else class="ai-state">
        <v-icon size="48" color="grey-lighten-1">mdi-robot-outline</v-icon>
        <p class="ai-loading-text">{{ t('ai.idle') }}</p>
      </div>

      <!-- Data that was sent (collapsible) -->
      <v-expansion-panels v-if="contextText" flat class="ai-context-panel mt-4">
        <v-expansion-panel>
          <v-expansion-panel-title class="ai-context-title">
            <v-icon size="16" class="me-2">mdi-file-document-outline</v-icon>
            {{ t('ai.dataSent') }}
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <pre class="ai-context-pre">{{ contextText }}</pre>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <!-- Footer: close button + disclaimer -->
    <template #append>
      <div class="ai-drawer-append">
        <v-btn
          block
          variant="tonal"
          color="grey-darken-1"
          prepend-icon="mdi-close"
          class="ai-close-btn"
          @click="$emit('update:modelValue', false)"
        >
          {{ t('common.close') }}
        </v-btn>
        <div class="ai-drawer-footer">
          <v-icon size="14" color="grey">mdi-information-outline</v-icon>
          <span>{{ t('ai.disclaimer') }}</span>
        </div>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { parseMarkdown } from '@/utils/aiMarkdown'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  response: { type: String, default: '' },
  error: { type: String, default: '' },
  sources: { type: Array, default: () => [] },
  contextText: { type: String, default: '' },
  // Image shown alongside the result (set by parent once analysis returns)
  analyzedImage: { type: String, default: '' },
  // Existing patient images ({ id, url }) offered for one-click analysis
  patientImages: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue', 'retry', 'analyze-image', 'error'])

const { t, locale } = useI18n()
const copied = ref(false)
const drawerLocation = computed(() => locale.value?.startsWith('ar') ? 'left' : 'right')

// ===== Image upload =====
const fileInput = ref(null)
const imagePreview = ref('')
const imageName = ref('')

const onFileSelected = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    emit('error', t('ai.imageTypeError'))
    event.target.value = ''
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    emit('error', t('ai.imageSizeError'))
    event.target.value = ''
    return
  }

  imageName.value = file.name
  const reader = new FileReader()
  reader.onload = (e) => { imagePreview.value = e.target.result }
  reader.readAsDataURL(file)
  event.target.value = ''
}

const clearImage = () => {
  imagePreview.value = ''
  imageName.value = ''
}

const emitAnalyzeImage = () => {
  if (!imagePreview.value) return
  emit('analyze-image', { imageBase64: imagePreview.value, fileName: imageName.value })
}

// Analyze an existing patient image (only a URL is available)
const analyzeExisting = (img) => {
  if (!img?.url || props.loading) return
  clearImage()
  emit('analyze-image', { imageUrl: img.url })
}

const copyResponse = async () => {
  try {
    await navigator.clipboard.writeText(props.response || '')
    copied.value = true
    setTimeout(() => { copied.value = false }, 1800)
  } catch (e) {
    /* clipboard unavailable — ignore */
  }
}

defineExpose({ clearImage })
</script>

<style scoped>
.ai-insight-drawer :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
}

/* Header */
.ai-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%);
  color: white;
  flex-shrink: 0;
}

.ai-drawer-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-drawer-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ai-drawer-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
  font-family: 'Cairo', sans-serif;
}

.ai-drawer-subtitle {
  font-size: 12px;
  opacity: 0.9;
}

/* Body */
.ai-drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* Image upload */
.ai-upload-zone {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  margin-bottom: 12px;
  border: 1.5px dashed rgba(14, 165, 233, 0.4);
  border-radius: 12px;
  background: rgba(14, 165, 233, 0.04);
  color: #0ea5e9;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Cairo', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ai-upload-zone:hover:not(:disabled) {
  background: rgba(14, 165, 233, 0.1);
  border-color: #0ea5e9;
}

.ai-upload-zone:disabled {
  opacity: 0.5;
  cursor: default;
}

.ai-image-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  margin-bottom: 12px;
  background: rgba(14, 165, 233, 0.06);
  border: 1px solid rgba(14, 165, 233, 0.18);
  border-radius: 12px;
}

.ai-image-thumb {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.ai-image-name {
  flex: 1;
  font-size: 12px;
  color: #475569;
  font-family: 'Cairo', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ai-analyzed-image {
  width: 100%;
  max-height: 220px;
  object-fit: contain;
  border-radius: 12px;
  margin-bottom: 12px;
  background: #0f172a;
}

/* Existing patient images */
.ai-patient-images {
  margin-bottom: 14px;
}

.ai-patient-images-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 6px;
  font-family: 'Cairo', sans-serif;
}

.ai-thumb-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.ai-thumb {
  position: relative;
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  border: 1px solid rgba(203, 213, 225, 0.7);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  padding: 0;
  background: #f1f5f9;
  transition: all 0.2s ease;
}

.ai-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ai-thumb-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(14, 165, 233, 0.55);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.ai-thumb:hover:not(:disabled) {
  border-color: #0ea5e9;
  transform: translateY(-2px);
}

.ai-thumb:hover:not(:disabled) .ai-thumb-overlay {
  opacity: 1;
}

.ai-thumb:disabled {
  opacity: 0.5;
  cursor: default;
}

/* States */
.ai-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
  padding: 48px 16px;
}

.ai-loading-text {
  font-size: 14px;
  color: #475569;
  font-family: 'Cairo', sans-serif;
  margin: 0;
}

.ai-error-text {
  font-size: 13.5px;
  color: #991b1b;
  font-family: 'Cairo', sans-serif;
  margin: 0;
}

/* Thinking orb */
.ai-thinking-orb {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e0f2fe, #ede9fe);
}

.orb-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: #0ea5e9;
  border-right-color: #6366f1;
  animation: orbSpin 1s linear infinite;
}

@keyframes orbSpin {
  to { transform: rotate(360deg); }
}

.typing-indicator {
  display: flex;
  gap: 5px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
  animation: typingBounce 1.4s ease-in-out infinite;
}

.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* Result */
.ai-result-card {
  background: rgba(241, 245, 249, 0.7);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 14px;
  padding: 14px 16px;
  animation: msgAppear 0.3s ease-out;
}

@keyframes msgAppear {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.ai-result-content {
  font-size: 13.5px;
  line-height: 1.7;
  color: #1e293b;
  font-family: 'Cairo', sans-serif;
  word-wrap: break-word;
}

.ai-result-content :deep(strong) { font-weight: 700; }
.ai-result-content :deep(ul) { padding: 0; margin: 6px 0; }
.ai-result-content :deep(li) { margin-inline-start: 18px; }

.ai-sources {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  font-size: 11px;
  color: #0ea5e9;
  font-weight: 600;
}

.ai-result-actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  flex-wrap: wrap;
}

/* Context panel */
.ai-context-panel :deep(.v-expansion-panel) {
  background: transparent;
  border: 1px dashed rgba(148, 163, 184, 0.5);
  border-radius: 12px;
}

.ai-context-title {
  font-size: 12.5px;
  font-weight: 600;
  color: #64748b;
  min-height: 40px;
}

.ai-context-pre {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 11.5px;
  line-height: 1.6;
  color: #475569;
  font-family: 'Cairo', monospace;
  margin: 0;
}

/* Footer */
.ai-drawer-append {
  border-top: 1px solid rgba(226, 232, 240, 0.7);
  background: rgba(248, 250, 252, 0.9);
}

.ai-close-btn {
  margin: 10px 16px 0;
  width: calc(100% - 32px);
}

.ai-drawer-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px 10px;
  font-size: 10.5px;
  color: #94a3b8;
  line-height: 1.4;
}
</style>
