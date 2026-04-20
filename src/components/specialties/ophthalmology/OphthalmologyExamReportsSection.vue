<template>
  <div class="exam-reports-section">
    <!-- Upload Area -->
    <div
      class="drop-zone"
      :class="{ 'drop-zone--active': isDragging, 'drop-zone--loading': uploading }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="!uploading && fileInput?.click()"
    >
      <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="onFileSelect" />
      <v-progress-circular v-if="uploading" indeterminate color="primary" size="28" class="mb-1" />
      <template v-else>
        <v-icon size="36" color="grey-lighten-1" class="mb-1">mdi-cloud-upload-outline</v-icon>
        <p class="text-body-2 text-grey mb-0">اسحب الصور هنا أو انقر للرفع</p>
        <p class="text-caption text-grey-lighten-1">JPG, PNG, TIFF مدعومة</p>
      </template>
    </div>

    <!-- Analyzing indicator -->
    <v-progress-linear
      v-if="isAnalyzing"
      indeterminate
      color="orange"
      height="3"
      class="mt-2 rounded"
    />

    <!-- Reports Grid -->
    <v-row v-if="reports.length" class="mt-3" dense>
      <v-col
        v-for="report in reports"
        :key="report.id"
        cols="4"
        sm="3"
        md="2"
      >
        <v-card
          class="report-thumb"
          rounded="lg"
          elevation="1"
          @click="openPreview(report)"
        >
          <div class="report-thumb-img">
            <v-img
              v-if="getUrl(report)"
              :src="getUrl(report)"
              cover
              height="72"
            >
              <template #error>
                <div class="d-flex align-center justify-center bg-blue-grey-lighten-4" style="height:72px">
                  <v-icon size="28" color="blue-grey">mdi-file-image</v-icon>
                </div>
              </template>
            </v-img>
            <div v-else class="d-flex align-center justify-center bg-blue-grey-lighten-4" style="height:72px">
              <v-icon size="28" color="blue-grey">mdi-file-image</v-icon>
            </div>
          </div>
          <v-card-text class="pa-1 text-center">
            <p class="text-caption font-weight-medium text-truncate mb-0">{{ report.type || report.alt_text || 'صورة' }}</p>
            <p class="text-caption text-grey" style="font-size:10px">{{ formatDate(report.uploadedAt || report.created_at) }}</p>
          </v-card-text>
          <div class="report-thumb-actions">
            <v-btn icon size="x-small" color="error" variant="flat" @click.stop="$emit('remove', report.id)">
              <v-icon size="14">mdi-delete</v-icon>
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty -->
    <div v-else-if="!isDragging && !uploading" class="text-center py-4 text-grey">
      <v-icon size="36" color="grey-lighten-2">mdi-image-off-outline</v-icon>
      <p class="text-caption mt-1">لا توجد صور أو تقارير مرفوعة بعد</p>
    </div>

    <!-- Analyse button (if reports uploaded and not yet done) -->
    <div v-if="reports.length && !isAnalyzing && !aiDone" class="mt-3 d-flex justify-end">
      <v-btn
        color="orange"
        variant="tonal"
        prepend-icon="mdi-robot"
        size="small"
        @click="$emit('analyze')"
      >
        تحليل بالذكاء الاصطناعي
      </v-btn>
    </div>

    <!-- Image Preview Dialog -->
    <v-dialog v-model="previewDialog" max-width="800">
      <v-card>
        <v-toolbar density="compact" color="transparent" flat>
          <v-toolbar-title class="text-body-2">{{ previewItem?.filename || previewItem?.alt_text || 'صورة' }}</v-toolbar-title>
          <v-spacer />
          <v-btn icon size="small" @click="previewDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text class="d-flex justify-center pa-4 bg-grey-lighten-4">
          <v-img
            v-if="getUrl(previewItem)"
            :src="getUrl(previewItem)"
            max-height="600"
            contain
          />
          <div v-else class="d-flex flex-column align-center justify-center" style="width:100%;min-height:300px">
            <v-icon size="80" color="blue-grey">mdi-file-image</v-icon>
            <p class="text-caption text-grey mt-2">{{ previewItem?.filename }}</p>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  reports:    { type: Array,   default: () => [] },
  uploading:  { type: Boolean, default: false    },
  isAnalyzing:{ type: Boolean, default: false    },
  aiDone:     { type: Boolean, default: false    },
})

const emit = defineEmits(['upload', 'remove', 'reanalyze', 'analyze'])

const fileInput     = ref(null)
const isDragging    = ref(false)
const previewDialog = ref(false)
const previewItem   = ref(null)

const getUrl = (report) => report?.url || report?.path || ''

const onDrop = (e) => {
  isDragging.value = false
  const files = Array.from(e.dataTransfer?.files || [])
  files.forEach(f => emit('upload', f))
}

const onFileSelect = (e) => {
  const files = Array.from(e.target.files || [])
  files.forEach(f => emit('upload', f))
  if (fileInput.value) fileInput.value.value = ''
}

const openPreview = (report) => {
  previewItem.value  = report
  previewDialog.value = true
}

const formatDate = (d) => {
  if (!d) return ''
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`
}
</script>

<style scoped>
.drop-zone {
  border: 2px dashed rgba(var(--v-theme-primary), 0.35);
  border-radius: 12px;
  padding: 20px 16px;
  text-align: center;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.drop-zone:hover,
.drop-zone--active {
  background: rgba(var(--v-theme-primary), 0.04);
  border-color: rgba(var(--v-theme-primary), 0.7);
}
.drop-zone--loading {
  cursor: default;
  opacity: 0.7;
}

.report-thumb {
  position: relative;
  cursor: pointer;
  overflow: hidden;
}
.report-thumb-img {
  height: 72px;
  width: 100%;
}
.report-thumb-actions {
  position: absolute;
  top: 4px;
  inset-inline-end: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s;
}
.report-thumb:hover .report-thumb-actions {
  opacity: 1;
}
</style>
