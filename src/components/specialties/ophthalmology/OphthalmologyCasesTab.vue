<template>
  <div class="cases-tab">

    <!-- ── Add Case toggle ──────────────────────────────────── -->
    <div class="d-flex justify-end mb-3">
      <v-btn
        :color="showForm ? 'error' : 'primary'"
        :prepend-icon="showForm ? 'mdi-close' : 'mdi-plus'"
        :variant="showForm ? 'tonal' : 'elevated'"
        @click="toggleForm"
      >
        {{ showForm ? 'إلغاء' : 'إضافة حالة' }}
      </v-btn>
    </div>

    <!-- ── Inline Add-Case Form ────────────────────────────────── -->
    <v-expand-transition>
      <v-card
        v-if="showForm"
        class="add-case-card mb-4"
        rounded="lg"
        elevation="2"
        border="primary sm"
      >
        <v-card-title class="d-flex align-center ga-2 py-3 px-4 text-subtitle-2">
          <v-icon size="18" color="primary">mdi-eye-plus-outline</v-icon>
          إضافة حالة جديدة
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">

          <!-- Row 1: Base fields -->
          <v-row dense>
            <v-col cols="12" sm="6" md="3">
              <v-select
                v-model="form.doctor_id"
                :items="doctors"
                item-title="name"
                item-value="id"
                label="الطبيب"
                variant="outlined"
                density="compact"
                hide-details
                clearable
              />
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-select
                v-model="form.eye_side"
                :items="eyeSideOptions"
                item-title="title"
                item-value="value"
                label="العين"
                variant="outlined"
                density="compact"
                hide-details
                clearable
              />
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-text-field
                v-model="form.case_date"
                label="التاريخ"
                type="date"
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-text-field
                :model-value="formatNumberWithCommas(form.price)"
                @update:model-value="form.price = parseRaw($event)"
                label="السعر"
                variant="outlined"
                density="compact"
                hide-details
                suffix="IQD"
                inputmode="numeric"
              />
            </v-col>
            <v-col cols="12" sm="9">
              <v-textarea
                v-model="form.notes"
                label="ملاحظات"
                variant="outlined"
                density="compact"
                rows="1"
                auto-grow
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="3">
              <v-select
                v-model="form.category_id"
                :items="allCategories"
                item-title="name"
                item-value="id"
                label="الفئة (اختياري)"
                variant="outlined"
                density="compact"
                hide-details
                clearable
              />
            </v-col>
          </v-row>

          <!-- Ophthalmology exam fields divider -->
          <div class="section-label mt-4 mb-3">
            <v-icon size="14" color="primary" class="me-1">mdi-eye-settings-outline</v-icon>
            بيانات الفحص (اختياري)
          </div>

          <!-- Row 2: Visual Acuity -->
          <v-row dense>
            <v-col cols="6" sm="3">
              <v-text-field v-model="form.visual_acuity_left"  label="حدة البصر يسار" variant="outlined" density="compact" hide-details />
            </v-col>
            <v-col cols="6" sm="3">
              <v-text-field v-model="form.visual_acuity_right" label="حدة البصر يمين" variant="outlined" density="compact" hide-details />
            </v-col>
            <v-col cols="6" sm="3">
              <v-text-field v-model.number="form.iop_left"  label="IOP يسار (mmHg)" type="number" variant="outlined" density="compact" hide-details />
            </v-col>
            <v-col cols="6" sm="3">
              <v-text-field v-model.number="form.iop_right" label="IOP يمين (mmHg)" type="number" variant="outlined" density="compact" hide-details />
            </v-col>
            <v-col cols="6" sm="3">
              <v-text-field v-model="form.refraction_left"  label="انكسار يسار" variant="outlined" density="compact" hide-details />
            </v-col>
            <v-col cols="6" sm="3">
              <v-text-field v-model="form.refraction_right" label="انكسار يمين" variant="outlined" density="compact" hide-details />
            </v-col>
            <v-col cols="12" sm="6">
              <v-textarea v-model="form.anterior_segment"  label="الجزء الأمامي" variant="outlined" density="compact" rows="2" auto-grow hide-details />
            </v-col>
            <v-col cols="12" sm="6">
              <v-textarea v-model="form.posterior_segment" label="الجزء الخلفي"  variant="outlined" density="compact" rows="2" auto-grow hide-details />
            </v-col>
          </v-row>

          <!-- Photos upload section -->
          <div class="section-label mt-4 mb-3">
            <v-icon size="14" color="primary" class="me-1">mdi-image-multiple-outline</v-icon>
            الصور والتقارير (اختياري)
          </div>

          <!-- Drop zone -->
          <div
            class="drop-zone"
            :class="{ 'drop-zone--active': isDragOver }"
            @dragover.prevent="isDragOver = true"
            @dragleave.prevent="isDragOver = false"
            @drop.prevent="handleFileDrop"
            @click="fileInputRef.click()"
          >
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              multiple
              class="d-none"
              @change="handleFileInput"
            />
            <v-icon size="32" :color="isDragOver ? 'primary' : 'grey-lighten-1'">mdi-cloud-upload-outline</v-icon>
            <p class="text-body-2 text-grey mt-1 mb-0">
              {{ isDragOver ? 'أفلت الصور هنا' : 'اسحب وأفلت الصور، أو انقر للاختيار' }}
            </p>
            <p class="text-caption text-grey-lighten-1">PNG, JPG, JPEG, TIFF</p>
          </div>

          <!-- Thumbnails -->
          <div v-if="uploadedPhotos.length" class="photo-grid mt-3">
            <div
              v-for="(photo, idx) in uploadedPhotos"
              :key="idx"
              class="photo-thumb"
            >
              <v-img
                :src="photo.url"
                aspect-ratio="1"
                cover
                class="rounded"
              />
              <v-btn
                class="photo-remove-btn"
                icon
                size="x-small"
                color="error"
                variant="elevated"
                @click.stop="removePhoto(idx)"
              >
                <v-icon size="12">mdi-close</v-icon>
              </v-btn>
              <div class="photo-name text-caption">{{ photo.name }}</div>
            </div>
          </div>

        </v-card-text>

        <v-card-actions class="px-4 pb-4 pt-0 d-flex justify-end ga-2">
          <v-btn variant="text" @click="resetForm">إعادة تعيين</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            prepend-icon="mdi-content-save"
            :disabled="!form.category_id"
            @click="submitForm"
          >
            حفظ الحالة
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-expand-transition>

    <!-- ── Results count ──────────────────────────────────────── -->
    <div v-if="filteredCases.length" class="text-caption text-grey mb-2">
      {{ filteredCases.length }} حالة
    </div>

    <!-- ── Case Cards ──────────────────────────────────────────── -->
    <OphthalmologyCaseCard
      v-for="c in filteredCases"
      :key="c.id"
      :case-item="c"
      :patient-id="patientId"
      :patient="patient"
      :categories="categories"
      @edit="handleEditCase"
      @reanalyze="(cid) => $emit('reanalyze', cid)"
      @analyze="(cid) => $emit('analyze', cid)"
      @update-field="(cid, field, val) => $emit('update-field', cid, field, val)"
      @mark-ready="(cid) => $emit('mark-ready', cid)"
      @save-diagnosis="(cid, d, n) => $emit('save-diagnosis', cid, d, n)"
    />

    <!-- ── Empty state ─────────────────────────────────────────── -->
    <div v-if="!filteredCases.length" class="text-center py-10">
      <v-icon size="56" color="grey-lighten-2">mdi-eye-off-outline</v-icon>
      <p class="text-body-2 text-grey mt-3">لا توجد حالات تطابق هذا البحث</p>
      <v-btn color="primary" variant="tonal" class="mt-2" prepend-icon="mdi-plus" @click="showForm = true">
        إضافة أول حالة
      </v-btn>
    </div>

  </div>

  <!-- ── Edit Case Modal ──────────────────────────────────────── -->
  <OphthalmologyAddCaseModal
    v-model="editModalOpen"
    :patient-id="patientId"
    :editing-case="editingCaseData"
    :categories="categories"
    :doctors="doctors"
    @success="handleEditSuccess"
  />

</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import OphthalmologyCaseCard from './OphthalmologyCaseCard.vue'
import OphthalmologyAddCaseModal from './OphthalmologyAddCaseModal.vue'

const props = defineProps({
  filteredCases:  { type: Array,  default: () => [] },
  categories:     { type: Array,  default: () => [] },
  doctors:        { type: Array,  default: () => [] },
  patientId:      { type: [Number, String], default: null },
  patient:        { type: Object, default: () => null },
})

const emit = defineEmits([
  'add-case',
  'refresh-cases',
  'upload-report',
  'remove-report',
  'reanalyze',
  'analyze',
  'update-field',
  'mark-ready',
  'save-diagnosis',
])

// ── Edit modal state ──────────────────────────────────────────
const editModalOpen   = ref(false)
const editingCaseData = ref(null)

const handleEditCase = (caseItem) => {
  editingCaseData.value = caseItem
  editModalOpen.value   = true
}

const handleEditSuccess = () => {
  editModalOpen.value   = false
  editingCaseData.value = null
  emit('refresh-cases')
}

// All categories = prop list (comes from page)
const allCategories = computed(() => props.categories)

const eyeSideOptions = [
  { title: 'يسار',          value: 'left'  },
  { title: 'يمين',          value: 'right' },
  { title: 'كلا العينين',   value: 'both'  },
]

// ── Inline form state ─────────────────────────────────────────
const showForm      = ref(false)
const isDragOver    = ref(false)
const fileInputRef  = ref(null)
const uploadedPhotos = ref([])

const defaultForm = () => ({
  category_id:         null,
  doctor_id:           null,
  eye_side:            null,
  case_date:           new Date().toISOString().split('T')[0],
  price:               0,
  notes:               '',
  visual_acuity_left:  '',
  visual_acuity_right: '',
  iop_left:            null,
  iop_right:           null,
  refraction_left:     '',
  refraction_right:    '',
  anterior_segment:    '',
  posterior_segment:   '',
})

const form = reactive(defaultForm())

const toggleForm = () => {
  showForm.value = !showForm.value
  if (!showForm.value) resetForm()
}

const resetForm = () => {
  Object.assign(form, defaultForm())
  uploadedPhotos.value.forEach(p => URL.revokeObjectURL(p.url))
  uploadedPhotos.value = []
}

const addFiles = (files) => {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue
    uploadedPhotos.value.push({ name: file.name, url: URL.createObjectURL(file), file })
  }
}

const handleFileDrop = (e) => {
  isDragOver.value = false
  addFiles(e.dataTransfer.files)
}

const handleFileInput = (e) => {
  addFiles(e.target.files)
  e.target.value = ''
}

const removePhoto = (idx) => {
  URL.revokeObjectURL(uploadedPhotos.value[idx].url)
  uploadedPhotos.value.splice(idx, 1)
}

const submitForm = () => {
  if (!form.category_id) return
  emit('add-case', { ...form, photos: uploadedPhotos.value.map(p => p.file) })
  resetForm()
  showForm.value = false
}

// ── Helpers ───────────────────────────────────────────────────
const formatNumberWithCommas = (v) =>
  v ? new Intl.NumberFormat('en-US').format(v) : ''

const parseRaw = (v) => {
  const n = parseInt(String(v).replace(/,/g, ''), 10)
  return isNaN(n) ? 0 : n
}
</script>

<style scoped>
.add-case-card {
  border: 1px solid rgba(var(--v-theme-primary), 0.3) !important;
  background: rgba(var(--v-theme-primary), 0.02);
}
.section-label {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  color: rgba(0,0,0,0.5);
}

/* Drop zone */
.drop-zone {
  border: 2px dashed rgba(var(--v-theme-primary), 0.35);
  border-radius: 10px;
  padding: 20px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  background: transparent;
  user-select: none;
}
.drop-zone:hover,
.drop-zone--active {
  background: rgba(var(--v-theme-primary), 0.06);
  border-color: rgba(var(--v-theme-primary), 0.7);
}

/* Thumbnail grid */
.photo-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.photo-thumb {
  position: relative;
  width: 80px;
}
.photo-thumb .v-img {
  width: 80px;
  height: 80px;
  border: 1px solid rgba(0,0,0,0.1);
}
.photo-remove-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  z-index: 1;
}
.photo-name {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgba(0,0,0,0.45);
  margin-top: 2px;
  text-align: center;
}
</style>

