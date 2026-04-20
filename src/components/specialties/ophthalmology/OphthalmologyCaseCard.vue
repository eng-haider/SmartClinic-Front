<template>
  <!-- ─── CASE ROW ──────────────────────────────────────────────── -->
  <div class="case-row mb-3" :class="{ 'case-row--open': expanded }">

    <!-- ══ ROW HEADER ══════════════════════════════════════════════ -->
    <div class="row-header" @click="expanded = !expanded">

      <!-- LEFT: icon dot -->
      <div class="row-icon" :style="{ background: eyeGradient }">
        <v-icon size="14" color="white">mdi-eye-outline</v-icon>
      </div>

      <!-- CENTER: main info -->
      <div class="row-body">
        <div class="row-top">
          <span class="row-category">{{ caseItem.category?.name || 'بدون فئة' }}</span>
          <span class="row-eye-chip" :class="`row-eye-chip--${caseItem.eye_side || 'left'}`">{{ eyeSideLabel }}</span>
          <span v-if="localReports.length" class="row-img-badge">
            <v-icon size="10">mdi-image-outline</v-icon> {{ localReports.length }}
          </span>
        </div>
        <div class="row-meta">
          <span><v-icon size="10" class="me-1" style="opacity:.5">mdi-doctor</v-icon>{{ caseItem.doctor?.name || '—' }}</span>
          <span class="row-meta-sep">·</span>
          <span><v-icon size="10" class="me-1" style="opacity:.5">mdi-calendar-outline</v-icon>{{ formatDate(caseItem.case_date) }}</span>
        </div>
      </div>

      <!-- RIGHT: price + status + actions -->
      <div class="row-right">
        <span class="row-price">{{ formatCurrency(caseItem.price) }}<span class="row-price-unit"> IQD</span></span>
        <span class="row-status" :style="{ background: (caseItem.status?.color || '#9e9e9e') + '22', color: caseItem.status?.color || '#9e9e9e' }">
          {{ caseItem.status?.name_ar || '—' }}
        </span>
        <button class="row-action-btn" @click.stop="$emit('edit', caseItem)" title="تعديل">
          <v-icon size="14">mdi-pencil-outline</v-icon>
        </button>
        <v-icon size="15" class="row-chevron" :class="{ 'row-chevron--open': expanded }">mdi-chevron-down</v-icon>
      </div>

    </div>

    <!-- ══ EXPANDED DASHBOARD ═════════════════════════════════════ -->
    <v-expand-transition>
      <div v-if="expanded" class="case-dashboard">

        <!-- Dashboard tabs -->
        <div class="dashboard-tabs">
          <button v-for="t in tabs" :key="t.value" class="dtab" :class="{ 'dtab--active': innerTab === t.value }" @click="innerTab = t.value">
            <v-icon size="14" class="me-1">{{ t.icon }}</v-icon>{{ t.label }}
          </button>
        </div>

        <!-- ══ DETAILS ══════════════════════════════════════════════ -->
        <div v-show="innerTab === 'details'" class="tab-panel">

          <!-- CASE SUMMARY HERO -->
          <div class="details-hero" :style="{ borderColor: (caseItem.status?.color || '#1565C0') + '33' }">
            <div class="dh-avatar" :style="{ background: eyeGradient }">
              <v-icon size="22" color="white">mdi-eye-outline</v-icon>
            </div>
            <div class="dh-info">
              <div class="dh-category">{{ caseItem.category?.name || 'بدون فئة' }}</div>
              <div class="dh-sub">
                <span>{{ eyeSideLabel }}</span>
                <span class="dh-sep">·</span>
                <span>{{ formatDate(caseItem.case_date) }}</span>
                <span class="dh-sep">·</span>
                <span>د. {{ caseItem.doctor?.name || '—' }}</span>
              </div>
            </div>
            <div class="dh-right">
              <div class="dh-price">{{ formatCurrency(caseItem.price) }}<span class="dh-price-unit"> IQD</span></div>
              <span class="dh-status" :style="{ background: (caseItem.status?.color || '#9e9e9e') + '22', color: caseItem.status?.color || '#9e9e9e' }">
                {{ caseItem.status?.name_ar || '—' }}
              </span>
            </div>
          </div>

          <div v-if="caseItem.notes" class="notes-strip">
            <v-icon size="14" color="primary" class="me-2">mdi-note-text-outline</v-icon>
            <span>{{ caseItem.notes }}</span>
          </div>

          <!-- B. QUICK STATS -->
          <div v-if="hasExamData" class="stats-section">
            <div class="section-title"><span class="section-dot" style="background:#0097A7"></span>نتائج الفحص السريري</div>
            <div class="stats-grid">
              <div v-if="caseItem.visual_acuity_left || caseItem.visual_acuity_right" class="stat-group">
                <div class="stat-group-title"><v-icon size="12" color="teal">mdi-eye-check-outline</v-icon>حدة البصر</div>
                <div class="stat-pair">
                  <div class="stat-card stat-card--left"><div class="stat-side-label">يسار</div><div class="stat-value">{{ caseItem.visual_acuity_left || '—' }}</div></div>
                  <div class="stat-card stat-card--right"><div class="stat-side-label">يمين</div><div class="stat-value">{{ caseItem.visual_acuity_right || '—' }}</div></div>
                </div>
              </div>
              <div v-if="caseItem.iop_left != null || caseItem.iop_right != null" class="stat-group">
                <div class="stat-group-title"><v-icon size="12" color="teal">mdi-gauge</v-icon>ضغط العين (IOP)</div>
                <div class="stat-pair">
                  <div class="stat-card stat-card--left">
                    <div class="stat-side-label">يسار</div>
                    <div class="stat-value">{{ caseItem.iop_left ?? '—' }}<span v-if="caseItem.iop_left != null" class="stat-unit">mmHg</span></div>
                  </div>
                  <div class="stat-card stat-card--right">
                    <div class="stat-side-label">يمين</div>
                    <div class="stat-value">{{ caseItem.iop_right ?? '—' }}<span v-if="caseItem.iop_right != null" class="stat-unit">mmHg</span></div>
                  </div>
                </div>
              </div>
              <div v-if="caseItem.refraction_left || caseItem.refraction_right" class="stat-group">
                <div class="stat-group-title"><v-icon size="12" color="teal">mdi-magnify-scan</v-icon>الانكسار</div>
                <div class="stat-pair">
                  <div class="stat-card stat-card--left"><div class="stat-side-label">يسار</div><div class="stat-value">{{ caseItem.refraction_left || '—' }}</div></div>
                  <div class="stat-card stat-card--right"><div class="stat-side-label">يمين</div><div class="stat-value">{{ caseItem.refraction_right || '—' }}</div></div>
                </div>
              </div>
            </div>
          </div>

          <!-- C. CLINICAL FINDINGS -->
          <div v-if="caseItem.anterior_segment || caseItem.posterior_segment" class="findings-section">
            <div class="section-title"><span class="section-dot" style="background:#00796B"></span>الموجودات السريرية</div>
            <div class="findings-grid">
              <div v-if="caseItem.anterior_segment" class="finding-card finding-card--anterior">
                <div class="finding-header">
                  <div class="finding-icon"><v-icon size="16" color="teal-darken-2">mdi-eye-circle-outline</v-icon></div>
                  <div class="finding-title">الجزء الأمامي</div>
                </div>
                <div class="finding-body">{{ caseItem.anterior_segment }}</div>
              </div>
              <div v-if="caseItem.posterior_segment" class="finding-card finding-card--posterior">
                <div class="finding-header">
                  <div class="finding-icon"><v-icon size="16" color="teal-darken-3">mdi-eye-circle</v-icon></div>
                  <div class="finding-title">الجزء الخلفي</div>
                </div>
                <div class="finding-body">{{ caseItem.posterior_segment }}</div>
              </div>
            </div>
          </div>

       

          <!-- D. IMAGES & REPORTS -->
          <div class="images-section">
            <div class="section-title">
              <span class="section-dot" style="background:#1565C0"></span>الصور والتقارير
              <v-chip v-if="localReports.length" size="x-small" color="info" variant="flat" class="ms-2">{{ localReports.length }}</v-chip>
            </div>
            <OphthalmologyExamReportsSection
              :reports="localReports"
              :uploading="uploadingPhoto"
              :is-analyzing="caseItem.aiStatus === 'analyzing'"
              :ai-done="!!caseItem.aiStatus && caseItem.aiStatus !== 'analyzing'"
              @upload="handleUploadPhoto"
              @remove="handleDeletePhoto"
              @reanalyze="$emit('reanalyze', caseItem.id)"
              @analyze="$emit('analyze', caseItem.id)"
            />
            <v-alert v-if="uploadError" type="error" density="compact" variant="tonal" class="mt-2">{{ uploadError }}</v-alert>
          </div>

          <!-- E. AI SECTION -->
          <div class="ai-section">
            <div class="ai-header">
              <div class="ai-icon-wrap"><v-icon size="18" color="white">mdi-robot-outline</v-icon></div>
              <div>
                <div class="ai-title">تحليل الذكاء الاصطناعي</div>
                <div class="ai-subtitle">نتائج مستخرجة تلقائياً من الصور</div>
              </div>
              <v-chip v-if="caseItem.aiStatus" size="x-small"
                :color="caseItem.aiStatus === 'done' || caseItem.aiStatus === 'extracted' ? 'success' : caseItem.aiStatus === 'analyzing' ? 'warning' : caseItem.aiStatus === 'error' ? 'error' : 'grey'"
                variant="flat" class="ms-auto">
                {{ caseItem.aiStatus === 'done' || caseItem.aiStatus === 'extracted' ? 'مكتمل' : caseItem.aiStatus === 'analyzing' ? 'جاري التحليل' : caseItem.aiStatus === 'error' ? 'خطأ' : caseItem.aiStatus === 'no_images' ? 'لا توجد صور' : 'في الانتظار' }}
              </v-chip>
            </div>
            <div class="ai-body">
              <OphthalmologyAIResultsSection
                :ai-status="caseItem.aiStatus"
                :diagnosis-suggestion="caseItem.diagnosisSuggestion"
                :ai-notes="caseItem.aiNotes"
                :model-value="examFields"
                @update="(field, val) => $emit('update-field', caseItem.id, field, val)"
              />
            </div>
          </div>

          <!-- F. DOCTOR REVIEW -->
          <div class="doctor-section">
            <div class="doctor-header">
              <div class="doctor-icon-wrap"><v-icon size="18" color="white">mdi-stethoscope</v-icon></div>
              <div>
                <div class="doctor-title">تقييم الطبيب</div>
                <div class="doctor-subtitle">الخطوة النهائية في الحالة</div>
              </div>
            </div>
            <div class="doctor-body">

              <!-- Category selector (for doctor to fill if missing) -->
              <div class="category-selector-row">
                <v-icon size="16" color="primary" class="me-2">mdi-tag-outline</v-icon>
                <span class="category-selector-label">فئة الحالة</span>
                <v-select
                  v-model="localCategoryId"
                  :items="categories"
                  item-title="name"
                  item-value="id"
                  :placeholder="caseItem.category?.name || 'اختر الفئة…'"
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
                  :loading="categorySaving"
                  class="category-select"
                  @update:model-value="saveCategoryId"
                />
                <v-snackbar v-model="categorySnackbar.show" :color="categorySnackbar.color" :timeout="2500" location="bottom end">
                  {{ categorySnackbar.message }}
                </v-snackbar>
              </div>
              <OphthalmologyDoctorReviewSection
                :diagnosis="caseItem.diagnosis"
                :notes="caseItem.notes"
                :is-completed="isCompleted"
                :status-loading="statusLoading"
                :saving="diagnosisSaving"
                @toggle-status="toggleStatus"
                @save="handleSaveDiagnosis"
              />
              <v-snackbar v-model="diagnosisSnackbar.show" :color="diagnosisSnackbar.color" :timeout="3000" location="bottom end">
                {{ diagnosisSnackbar.message }}
              </v-snackbar>
            </div>
          </div>

        </div>

        <!-- ══ BILL ════════════════════════════════════════════════ -->
        <div v-show="innerTab === 'bill'" class="tab-panel">

          <!-- Payment summary -->
          <div class="bill-summary-bar mb-4">
            <div class="bsb-item">
              <v-icon size="15" color="primary" class="bsb-icon">mdi-cash-multiple</v-icon>
              <div class="bsb-content">
                <span class="bsb-label">إجمالي الحالة</span>
                <span class="bsb-value bsb-value--primary">{{ formatCurrency(caseItem.price) }}</span>
              </div>
            </div>
            <div class="bsb-sep" />
            <div class="bsb-item">
              <v-icon size="15" color="success" class="bsb-icon">mdi-cash-check</v-icon>
              <div class="bsb-content">
                <span class="bsb-label">المدفوع</span>
                <span class="bsb-value bsb-value--success">{{ formatCurrency(totalPaid) }}</span>
              </div>
            </div>
            <div class="bsb-sep" />
            <div class="bsb-item">
              <v-icon size="15" :color="remaining > 0 ? 'warning' : 'success'" class="bsb-icon">{{ remaining > 0 ? 'mdi-clock-alert-outline' : 'mdi-check-circle-outline' }}</v-icon>
              <div class="bsb-content">
                <span class="bsb-label">المتبقي</span>
                <span class="bsb-value" :class="remaining > 0 ? 'bsb-value--warning' : 'bsb-value--success'">{{ formatCurrency(remaining) }}</span>
              </div>
            </div>
            <!-- progress bar -->
            <div class="bsb-progress">
              <div class="bsb-progress-fill" :style="{ width: Math.min(100, caseItem.price > 0 ? (totalPaid / caseItem.price) * 100 : 0) + '%' }" />
            </div>
          </div>

          <!-- Bills list -->
          <div v-if="localBills.length" class="mt-4">
            <div class="section-title">
              <span class="section-dot" style="background:#1565C0"></span>
              الفواتير المسجلة
              <v-chip size="x-small" color="primary" variant="tonal" class="ms-2">{{ localBills.length }}</v-chip>
            </div>
            <v-table density="compact" class="bills-table rounded-lg" style="background:#fff;border:1px solid rgba(0,0,0,0.07)">
              <thead>
                <tr>
                  <th class="text-right">التاريخ</th>
                  <th class="text-right">المبلغ</th>
                  <th class="text-right">الحالة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="bill in localBills" :key="bill.id">
                  <td>{{ formatDate(bill.bill_date || bill.created_at) }}</td>
                  <td class="font-weight-bold">{{ formatCurrency(bill.price) }} IQD</td>
                  <td>
                    <v-chip size="x-small" :color="bill.is_paid ? 'success' : 'warning'" variant="flat">
                      {{ bill.is_paid ? 'مدفوع' : 'غير مدفوع' }}
                    </v-chip>
                  </td>
                  <td>
                    <v-btn
                      v-if="!bill.is_paid"
                      size="x-small"
                      color="success"
                      variant="tonal"
                      :loading="bill._marking"
                      @click="markBillPaid(bill)"
                    >
                      تسجيل الدفع
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>

          <div v-else class="text-center py-4 text-grey text-body-2">
            لا توجد فواتير مسجلة لهذه الحالة
          </div>

          <!-- Add Bill Section -->
          <div class="mt-3">
            <v-tooltip v-if="!showAddBillForm && isBillFullyCovered" location="top">
              <template #activator="{ props: tip }">
                <span v-bind="tip">
                  <v-btn
                    color="primary"
                    variant="tonal"
                    prepend-icon="mdi-plus"
                    size="small"
                    rounded="lg"
                    disabled
                  >
                    إضافة فاتورة
                  </v-btn>
                </span>
              </template>
              تم تغطية إجمالي الحالة بالكامل
            </v-tooltip>
            <v-btn
              v-else-if="!showAddBillForm"
              color="primary"
              variant="tonal"
              prepend-icon="mdi-plus"
              size="small"
              rounded="lg"
              @click="openAddBillForm"
            >
              إضافة فاتورة
            </v-btn>

            <v-card v-else variant="outlined" class="pa-3 mt-2" rounded="lg">
              <div class="text-caption font-weight-bold mb-2">فاتورة جديدة</div>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="billForm.price"
                    label="المبلغ *"
                    type="number"
                    variant="outlined"
                    density="compact"
                    hide-details
                    suffix="IQD"
                    min="0"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="billForm.bill_date"
                    label="التاريخ"
                    type="date"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </v-col>
              </v-row>
              <div class="d-flex justify-end gap-2 mt-3">
                <v-btn variant="text" size="small" :disabled="addBillLoading" @click="showAddBillForm = false">
                  إلغاء
                </v-btn>
                <v-btn
                  color="primary"
                  variant="elevated"
                  size="small"
                  :loading="addBillLoading"
                  :disabled="!billForm.price"
                  @click="submitAddBill"
                >
                  حفظ الفاتورة
                </v-btn>
              </div>
              <v-alert v-if="billError" type="error" density="compact" class="mt-2" variant="tonal">
                {{ billError }}
              </v-alert>
            </v-card>
          </div>

          <!-- Print action -->
          <div class="bill-actions mt-3">
            <v-btn variant="outlined" color="grey" prepend-icon="mdi-printer-outline" size="small" rounded="lg">
              طباعة الفاتورة
            </v-btn>
          </div>
        </div>

        <!-- ══ PRESCRIPTION ════════════════════════════════════════ -->
        <div v-show="innerTab === 'recipe'" class="tab-panel">

          <!-- Header: title + "إضافة وصفة" -->
          <div class="rx-tab-header">
            <div class="rx-tab-title">
              <v-icon size="17" color="primary" class="me-2">mdi-pill-outline</v-icon>
              الوصفات الطبية
            </div>
            <v-btn
              color="primary"
              variant="elevated"
              prepend-icon="mdi-prescription"
              size="small"
              rounded="lg"
              elevation="0"
              @click="showRxDialog = true"
            >
              إضافة وصفة
            </v-btn>
          </div>

          <div class="rx-empty">
            <v-icon size="44" color="grey-lighten-2">mdi-pill-multiple</v-icon>
            <p class="text-body-2 text-grey mt-2 mb-0">اضغط "إضافة وصفة" لإنشاء وصفة طبية مع إمكانية الطباعة</p>
          </div>

        </div>

      </div>
    </v-expand-transition>

    <!-- ══ RX DIALOG ══════════════════════════════════════════════ -->
    <RecipeDialog
      v-model="showRxDialog"
      :patient-id="Number(patientId || caseItem.patient?.id || 0)"
      :patient-info="rxPatientInfo"
      :doctors="caseItem.doctor ? [caseItem.doctor] : []"
      :default-doctor-id="caseItem.doctor?.id || null"
      @saved="showRxDialog = false"
    />

  </div>

</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import OphthalmologyExamReportsSection  from './OphthalmologyExamReportsSection.vue'
import OphthalmologyAIResultsSection    from './OphthalmologyAIResultsSection.vue'
import OphthalmologyDoctorReviewSection from './OphthalmologyDoctorReviewSection.vue'
import RecipeDialog                     from '@/components/RecipeDialog.vue'
import { billService } from '@/services/bill.service'
import api from '@/services/api'

const props = defineProps({
  caseItem:   { type: Object, required: true },
  patientId:  { type: [Number, String], default: null },
  categories: { type: Array, default: () => [] },
  patient:    { type: Object, default: () => null },
})

defineEmits([
  'edit',
  'reanalyze', 'analyze',
  'update-field', 'mark-ready', 'save-diagnosis',
])

// ── State ─────────────────────────────────────────────────────
const expanded = ref(false)
const innerTab = ref('details')

// ── Images ────────────────────────────────────────────────────
const localReports   = ref([...(props.caseItem.uploadedReports || [])]) 
const uploadingPhoto = ref(false)
const uploadError    = ref(null)
const imagesFetched  = ref(false)

const fetchImages = async () => {
  if (imagesFetched.value || !props.caseItem.id) return
  imagesFetched.value = true
  try {
    const res = await api.get('/images/by-imageable', {
      params: { imageable_type: 'Case', imageable_id: props.caseItem.id }
    })
    localReports.value = res?.data?.data ?? res?.data ?? []
  } catch (err) {
    console.error('Error fetching images:', err)
  }
}

const handleUploadPhoto = async (file) => {
  uploadError.value    = null
  uploadingPhoto.value = true
  try {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('imageable_type', 'Case')
    formData.append('imageable_id', props.caseItem.id)
    formData.append('type', 'document')
    const res = await api.post('/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    const saved = res?.data || res
    localReports.value.push(saved)
  } catch (err) {
    uploadError.value =
      err?.response?.data?.message ||
      Object.values(err?.response?.data?.errors || {}).flat()[0] ||
      'فشل رفع الصورة'
  } finally {
    uploadingPhoto.value = false
  }
}

const handleDeletePhoto = async (imageId) => {
  try {
    await api.delete(`/images/${imageId}`)
    localReports.value = localReports.value.filter(r => r.id !== imageId)
  } catch (err) {
    console.error('Error deleting image:', err)
  }
}

// Fetch images when the card expands
watch(expanded, (val) => { if (val) fetchImages() })

// ── Status switch ─────────────────────────────────────────────
const localStatus   = ref(props.caseItem.status?.id === 3 ? 'completed' : 'pending')
const statusLoading = ref(false)
const isCompleted   = computed({
  get: () => localStatus.value === 'completed',
  set: () => {},
})

const toggleStatus = async (val) => {
  statusLoading.value = true
  const newStatusId   = val ? 3 : 2
  try {
    const res = await api.put(`/cases/${props.caseItem.id}`, {
      patient_id:        props.patientId || props.caseItem.patient?.id,
      doctor_id:         props.caseItem.doctor?.id,
      case_categores_id: props.caseItem.category?.id,
      price:             props.caseItem.price,
      status_id:         newStatusId,
      case_date:         props.caseItem.case_date
        ? new Date(props.caseItem.case_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      notes:             props.caseItem.notes || '',
      eye_side:          props.caseItem.eye_side || '',
      visual_acuity_left:  props.caseItem.visual_acuity_left  || '',
      visual_acuity_right: props.caseItem.visual_acuity_right || '',
      iop_left:            props.caseItem.iop_left  ?? null,
      iop_right:           props.caseItem.iop_right ?? null,
      refraction_left:     props.caseItem.refraction_left  || '',
      refraction_right:    props.caseItem.refraction_right || '',
      anterior_segment:    props.caseItem.anterior_segment  || '',
      posterior_segment:   props.caseItem.posterior_segment || '',
      diagnosis:           props.caseItem.diagnosis || '',
    })
    const updated = res?.data || res
    localStatus.value      = newStatusId === 3 ? 'completed' : 'pending'
    // Patch the in-place case status so parent list reflects the change
    if (updated?.status) {
      props.caseItem.status = {
        ...updated.status,
        icon: newStatusId === 3 ? 'mdi-check-circle' : 'mdi-clock-outline',
      }
    }
  } catch (err) {
    // revert switch
    localStatus.value = val ? 'pending' : 'completed'
    console.error('Error updating status:', err)
  } finally {
    statusLoading.value = false
  }
}

const tabs = [
  { value: 'details', label: 'تفاصيل',  icon: 'mdi-clipboard-text-outline' },
  { value: 'bill',    label: 'فاتورة',   icon: 'mdi-receipt-text-outline'   },
  { value: 'recipe',  label: 'وصفة',     icon: 'mdi-pill-outline'           },
]

// ── Prescription ──────────────────────────────────────────────
const showRxDialog = ref(false)

// ── Bills ─────────────────────────────────────────────────────
const localBills     = ref([...(props.caseItem.bills || [])])
const showAddBillForm = ref(false)
const addBillLoading  = ref(false)
const billError       = ref(null)
const billForm = reactive({
  price:     props.caseItem.price || 0,
  bill_date: new Date().toISOString().split('T')[0],
})

watch(() => props.caseItem.bills, (newBills) => {
  if (newBills) localBills.value = [...newBills]
}, { deep: true })

const totalPaid = computed(() =>
  localBills.value
    .filter(b => b.is_paid)
    .reduce((s, b) => s + (Number(b.price) || 0), 0)
)
const totalBillsSum = computed(() =>
  localBills.value.reduce((s, b) => s + (Number(b.price) || 0), 0)
)
const remaining = computed(() =>
  Math.max(0, (Number(props.caseItem.price) || 0) - totalPaid.value)
)
const isBillFullyCovered = computed(() =>
  (Number(props.caseItem.price) || 0) > 0 &&
  totalBillsSum.value >= (Number(props.caseItem.price) || 0)
)

const openAddBillForm = () => {
  billForm.price     = remaining.value || props.caseItem.price || 0
  billForm.bill_date = new Date().toISOString().split('T')[0]
  billError.value    = null
  showAddBillForm.value = true
}

const markBillPaid = async (bill) => {
  bill._marking = true
  try {
    await billService.markAsPaid(bill.id)
    bill.is_paid        = true
    bill.payment_status = 'Paid'
  } catch (err) {
    console.error('Error marking bill as paid:', err)
  } finally {
    bill._marking = false
  }
}

const submitAddBill = async () => {
  if (!billForm.price) return
  addBillLoading.value = true
  billError.value      = null
  try {
    const patId = props.patientId || props.caseItem.patient?.id
    const res = await api.post('/bills', {
      patient_id:    patId,
      billable_type: 'Case',
      billable_id:   props.caseItem.id,
      price:         billForm.price,
      doctor_id:     props.caseItem.doctor?.id || null,
      bill_date:     billForm.bill_date + ' 00:00:00',
    })
    const newBill = res?.data || res
    localBills.value.push(newBill)
    showAddBillForm.value = false
  } catch (err) {
    billError.value =
      err?.response?.data?.message ||
      Object.values(err?.response?.data?.errors || {}).flat()[0] ||
      'حدث خطأ أثناء إضافة الفاتورة'
  } finally {
    addBillLoading.value = false
  }
}

// ── Category update ───────────────────────────────────────────
const localCategoryId   = ref(props.caseItem.category?.id || null)
const categorySaving    = ref(false)
const categorySnackbar  = ref({ show: false, message: '', color: 'success' })

const saveCategoryId = async (newId) => {
  if (!newId || newId === props.caseItem.category?.id) return
  categorySaving.value = true
  try {
    const patId = props.patientId || props.caseItem.patient?.id
    await api.put(`/cases/${props.caseItem.id}`, {
      patient_id:        patId,
      doctor_id:         props.caseItem.doctor?.id,
      case_categores_id: newId,
      price:             props.caseItem.price,
      status_id:         props.caseItem.status?.id || 2,
      case_date:         props.caseItem.case_date
        ? new Date(props.caseItem.case_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      notes:             props.caseItem.notes || '',
      eye_side:          props.caseItem.eye_side || '',
      visual_acuity_left:  props.caseItem.visual_acuity_left  || '',
      visual_acuity_right: props.caseItem.visual_acuity_right || '',
      iop_left:            props.caseItem.iop_left  ?? null,
      iop_right:           props.caseItem.iop_right ?? null,
      refraction_left:     props.caseItem.refraction_left  || '',
      refraction_right:    props.caseItem.refraction_right || '',
      anterior_segment:    props.caseItem.anterior_segment  || '',
      posterior_segment:   props.caseItem.posterior_segment || '',
      diagnosis:           props.caseItem.diagnosis || '',
    })
    // patch local caseItem so the row header updates live
    const found = props.categories.find(c => c.id === newId)
    if (found) props.caseItem.category = found
    categorySnackbar.value = { show: true, message: 'تم تحديث الفئة بنجاح', color: 'success' }
  } catch (err) {
    localCategoryId.value = props.caseItem.category?.id || null // revert
    const msg = err?.response?.data?.message
      || Object.values(err?.response?.data?.errors || {}).flat()[0]
      || 'حدث خطأ'
    categorySnackbar.value = { show: true, message: msg, color: 'error' }
  } finally {
    categorySaving.value = false
  }
}

// ── Diagnosis save ────────────────────────────────────────────
const diagnosisSaving   = ref(false)
const diagnosisSnackbar = ref({ show: false, message: '', color: 'success' })

const handleSaveDiagnosis = async (diagnosis, doctorNotes) => {
  diagnosisSaving.value = true
  try {
    const patId = props.patientId || props.caseItem.patient?.id
    await api.put(`/cases/${props.caseItem.id}`, {
      patient_id:        patId,
      doctor_id:         props.caseItem.doctor?.id,
      case_categores_id: props.caseItem.category?.id,
      price:             props.caseItem.price,
      status_id:         props.caseItem.status?.id || 2,
      case_date:         props.caseItem.case_date
        ? new Date(props.caseItem.case_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      notes:             doctorNotes || props.caseItem.notes || '',
      eye_side:          props.caseItem.eye_side || '',
      visual_acuity_left:  props.caseItem.visual_acuity_left  || '',
      visual_acuity_right: props.caseItem.visual_acuity_right || '',
      iop_left:            props.caseItem.iop_left  ?? null,
      iop_right:           props.caseItem.iop_right ?? null,
      refraction_left:     props.caseItem.refraction_left  || '',
      refraction_right:    props.caseItem.refraction_right || '',
      anterior_segment:    props.caseItem.anterior_segment  || '',
      posterior_segment:   props.caseItem.posterior_segment || '',
      diagnosis:           diagnosis || '',
    })
    // Update local state
    props.caseItem.diagnosis = diagnosis
    props.caseItem.notes     = doctorNotes
    diagnosisSnackbar.value  = { show: true, message: 'تم حفظ التشخيص بنجاح', color: 'success' }
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      Object.values(err?.response?.data?.errors || {}).flat()[0] ||
      'حدث خطأ أثناء حفظ التشخيص'
    diagnosisSnackbar.value = { show: true, message: msg, color: 'error' }
  } finally {
    diagnosisSaving.value = false
  }
}
const eyeMap         = { left: 'يسار', right: 'يمين', both: 'كلا العينين' }
const eyeColorMap    = { left: 'blue', right: 'cyan', both: 'teal' }
const eyeGradientMap = {
  left:  'linear-gradient(135deg,#1565C0,#0288D1)',
  right: 'linear-gradient(135deg,#00838F,#0097A7)',
  both:  'linear-gradient(135deg,#00695C,#00897B)',
}

const eyeSideLabel = computed(() => eyeMap[props.caseItem.eye_side] || props.caseItem.eye_side || '—')
const eyeColor     = computed(() => eyeColorMap[props.caseItem.eye_side] || 'primary')
const eyeGradient  = computed(() => eyeGradientMap[props.caseItem.eye_side] || eyeGradientMap.left)

const rxPatientInfo = computed(() => {
  const p = props.patient || props.caseItem?.patient || null
  if (!p) return null
  let age = null
  if (p.birth_date) {
    const born = new Date(p.birth_date)
    age = new Date().getFullYear() - born.getFullYear()
  }
  return { name: p.name || '', phone: p.phone || '', age, gender: p.sex === 1 ? 'male' : 'female' }
})

// ── Exam data ─────────────────────────────────────────────────
const hasExamData = computed(() =>
  props.caseItem.visual_acuity_left  || props.caseItem.visual_acuity_right ||
  props.caseItem.iop_left   != null  || props.caseItem.iop_right   != null  ||
  props.caseItem.refraction_left     || props.caseItem.refraction_right ||
  props.caseItem.anterior_segment    || props.caseItem.posterior_segment
)

const examFields = computed(() => ({
  visual_acuity_left:  props.caseItem.visual_acuity_left,
  visual_acuity_right: props.caseItem.visual_acuity_right,
  iop_left:            props.caseItem.iop_left,
  iop_right:           props.caseItem.iop_right,
  refraction_left:     props.caseItem.refraction_left,
  refraction_right:    props.caseItem.refraction_right,
  anterior_segment:    props.caseItem.anterior_segment,
  posterior_segment:   props.caseItem.posterior_segment,
}))

// ── Helpers ──────────────────────────────────────────────────
const getImageUrl = (report) => report?.url || report?.path || ''

const formatDate = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`
}
const formatCurrency = (v) => v ? new Intl.NumberFormat('en-US').format(v) : '0'
</script>

<style scoped>
/* ─── CASE ROW ─────────────────────────────────────────────── */
.case-row {
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.08);
  background: #fff;
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.case-row:hover {
  border-color: rgba(21,101,192,0.22);
  box-shadow: 0 2px 10px rgba(21,101,192,0.09);
}
.case-row--open {
  border-color: rgba(21,101,192,0.32) !important;
  box-shadow: 0 2px 14px rgba(21,101,192,0.11) !important;
}

/* ─── ROW HEADER ───────────────────────────────────────────── */
.row-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  user-select: none;
}

/* LEFT */
.row-icon {
  width: 30px; height: 30px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

/* CENTER */
.row-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }

.row-top {
  display: flex; align-items: center; gap: 6px;
}
.row-category {
  font-size: 15px; font-weight: 700;
  color: rgba(0,0,0,0.85);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 200px;
}
.row-eye-chip {
  font-size: 11px; font-weight: 700; line-height: 1;
  padding: 3px 8px; border-radius: 20px;
  flex-shrink: 0;
}
.row-eye-chip--left  { background: rgba(21,101,192,0.10); color: #1565C0; }
.row-eye-chip--right { background: rgba(0,131,143,0.10);  color: #00838F; }
.row-eye-chip--both  { background: rgba(0,105,91,0.10);   color: #00695C; }

.row-img-badge {
  display: flex; align-items: center; gap: 2px;
  font-size: 10px; color: rgba(0,0,0,0.38);
  flex-shrink: 0;
}

.row-meta {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px; color: rgba(0,0,0,0.4);
  white-space: nowrap;
}
.row-meta span { display: flex; align-items: center; }
.row-meta-sep { color: rgba(0,0,0,0.2); font-size: 10px; }

/* RIGHT */
.row-right {
  display: flex; align-items: center; gap: 8px;
  flex-shrink: 0;
}
.row-price {
  font-size: 15px; font-weight: 800;
  color: rgba(0,0,0,0.82); letter-spacing: -0.3px;
  white-space: nowrap;
}
.row-price-unit { font-size: 11px; font-weight: 500; color: rgba(0,0,0,0.35); }

.row-status {
  font-size: 11px; font-weight: 700; line-height: 1;
  padding: 3px 9px; border-radius: 20px;
  white-space: nowrap; flex-shrink: 0;
}

.row-action-btn {
  display: flex; align-items: center; justify-content: center;
  width: 24px; height: 24px;
  border: none; background: transparent;
  border-radius: 5px; cursor: pointer;
  color: rgba(0,0,0,0.3);
  transition: background 0.12s, color 0.12s;
}
.row-action-btn:hover { background: rgba(var(--v-theme-primary), 0.08); color: rgb(var(--v-theme-primary)); }

.row-chevron { color: rgba(0,0,0,0.22); transition: transform 0.22s ease; flex-shrink: 0; }
.row-chevron--open { transform: rotate(180deg); }

/* ─── STATUS SWITCH ───────────────────────────────────────── */
.status-switch-row {
  display: flex;
  align-items: center;
  background: linear-gradient(90deg, rgba(255,152,0,0.07), rgba(76,175,80,0.07));
  border: 1px solid rgba(0,0,0,0.09);
  border-radius: 12px;
  padding: 10px 16px;
}
.status-switch-label {
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}
.label--active { color: rgba(0,0,0,0.8); }
.label--active.label--success { color: #2e7d32; }
.label--inactive { color: rgba(0,0,0,0.3); }

/* ─── DETAILS HERO ─────────────────────────────────────────── */
.details-hero {
  display: flex; align-items: center; gap: 14px;
  background: linear-gradient(135deg, rgba(21,101,192,0.05) 0%, rgba(2,136,209,0.03) 100%);
  border: 1px solid rgba(0,0,0,0.07);
  border-right: 4px solid #1565C0;
  border-radius: 14px; padding: 16px 18px; margin-bottom: 16px;
  box-shadow: 0 2px 10px rgba(21,101,192,0.08);
}
.dh-avatar {
  width: 46px; height: 46px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.dh-info { flex: 1; min-width: 0; }
.dh-category { font-size: 18px; font-weight: 800; color: rgba(0,0,0,0.85); letter-spacing: -0.3px; margin-bottom: 3px; }
.dh-sub { font-size: 13px; color: rgba(0,0,0,0.45); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.dh-sep { color: rgba(0,0,0,0.2); }
.dh-right { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; flex-shrink: 0; }
.dh-price { font-size: 22px; font-weight: 900; color: #1565C0; letter-spacing: -0.5px; line-height: 1; }
.dh-price-unit { font-size: 12px; font-weight: 500; color: rgba(21,101,192,0.55); }
.dh-status {
  font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; line-height: 1;
}

/* ─── EXPANDED SHELL ───────────────────────────────────────── */
.case-dashboard { border-top: 1px solid rgba(0,0,0,0.06);  }

.dashboard-tabs {
  display: flex; gap: 2px;
  padding: 10px 16px 0;
  background: #fff;
  border-bottom: 1px solid rgba(0,0,0,0.07);
}
.dtab {
  display: flex; align-items: center; gap: 5px;
  padding: 8px 16px;
  border: none; background: transparent;
  border-bottom: 2px solid transparent;
  font-size: 13px; font-weight: 600; color: rgba(0,0,0,0.45);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
  font-family: 'Cairo', sans-serif;
  border-radius: 6px 6px 0 0;
  margin-bottom: -1px;
}
.dtab:hover { color: rgba(var(--v-theme-primary), 1); background: rgba(var(--v-theme-primary), 0.04); }
.dtab--active { color: rgb(var(--v-theme-primary)); border-bottom-color: rgb(var(--v-theme-primary)); background: rgba(var(--v-theme-primary), 0.06); font-weight: 700; }

.tab-panel { padding: 20px; }

/* ─── SECTION TITLE ────────────────────────────────────────── */
.section-title {
  display: flex; align-items: center;
  font-size: 13px; font-weight: 800; color: rgba(0,0,0,0.5);
  text-transform: uppercase; letter-spacing: 0.08em;
  margin-bottom: 14px;
}
.section-dot { width: 6px; height: 6px; border-radius: 50%; margin-left: 8px; }

/* ─── A. HERO ──────────────────────────────────────────────── */
.hero-section {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 20px;
  background: #fff; border-radius: 16px; padding: 20px;
  border: 1px solid rgba(0,0,0,0.07); margin-bottom: 16px; flex-wrap: wrap;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}
.hero-identity { display: flex; align-items: flex-start; gap: 14px; flex: 1; min-width: 200px; }
.hero-avatar { width: 50px; height: 50px; border-radius: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.hero-category { font-size: 17px; font-weight: 800; color: rgba(0,0,0,0.85); margin-bottom: 4px; }
.hero-meta { display: flex; align-items: center; gap: 12px; font-size: 12px; color: rgba(0,0,0,0.45); margin-bottom: 10px; }
.hero-meta span { display: flex; align-items: center; }
.hero-badges { display: flex; flex-wrap: wrap; gap: 6px; }

.hero-right { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; flex-shrink: 0; }
.hero-price-card {
  display: flex; flex-direction: column; align-items: flex-end;
  background: linear-gradient(135deg,rgba(21,101,192,0.08),rgba(2,136,209,0.05));
  border: 1px solid rgba(21,101,192,0.15); border-radius: 14px; padding: 12px 16px;
}
.hero-price-label { font-size: 10px; font-weight: 700; color: rgba(21,101,192,0.7); margin-bottom: 2px; letter-spacing: 0.05em; }
.hero-price-value { font-size: 26px; font-weight: 900; color: rgba(21,101,192,1); line-height: 1; letter-spacing: -1px; }
.hero-price-unit  { font-size: 11px; font-weight: 600; color: rgba(21,101,192,0.6); margin-top: 2px; }
.hero-diagnosis {
  display: flex; align-items: center; font-size: 12px; font-weight: 600;
  color: rgba(0,0,0,0.6); background: rgba(var(--v-theme-primary),0.05);
  border-radius: 8px; padding: 6px 10px; max-width: 220px;
}

.notes-strip {
  display: flex; align-items: center;
  background: rgba(21,101,192,0.04);
  border: 1px solid rgba(0,0,0,0.07);
  border-right: 3px solid rgb(var(--v-theme-primary));
  border-radius: 10px; padding: 12px 16px;
  font-size: 14px; color: rgba(0,0,0,0.65); margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

/* ─── B. QUICK STATS ───────────────────────────────────────── */
.stats-section {
  background: linear-gradient(135deg, rgba(0,151,167,0.07) 0%, rgba(0,188,212,0.03) 100%);
  border-radius: 16px;
  border: 1px solid rgba(0,0,0,0.07);
  border-top: 3px solid #0097A7;
  padding: 18px 20px; margin-bottom: 16px;
  box-shadow: 0 2px 10px rgba(0,151,167,0.08);
}
.stats-grid { display: flex; flex-wrap: wrap; gap: 14px; }
.stat-group { flex: 1; min-width: 160px; }
.stat-group-title { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; color: rgba(0,128,128,0.7); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.06em; }
.stat-pair { display: flex; gap: 8px; }
.stat-card {
  flex: 1; border-radius: 12px; padding: 12px 10px;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.08);
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.stat-card--left  { border-top: 3px solid #1565C0; background: rgba(21,101,192,0.06); }
.stat-card--right { border-top: 3px solid #0097A7; background: rgba(0,151,167,0.06); }
.stat-side-label {
  font-size: 10px; font-weight: 700; color: rgba(0,0,0,0.35);
  text-transform: uppercase; letter-spacing: 0.05em;
}
.stat-value { font-size: 26px; font-weight: 900; color: rgba(0,0,0,0.82); line-height: 1; letter-spacing: -0.5px; }
.stat-unit { font-size: 11px; font-weight: 500; color: rgba(0,0,0,0.35); margin-right: 2px; }

/* ─── C. CLINICAL FINDINGS ─────────────────────────────────── */
.findings-section { margin-bottom: 16px; }
.findings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap: 12px; }
.finding-card {
  border-radius: 14px; padding: 16px;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.07);
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}
.finding-card--anterior { border-right: 3px solid #00796B; background: linear-gradient(135deg, rgba(0,121,107,0.07) 0%, rgba(0,150,136,0.03) 100%); }
.finding-card--posterior { border-right: 3px solid #0097A7; background: linear-gradient(135deg, rgba(0,151,167,0.07) 0%, rgba(2,136,209,0.03) 100%); }
.finding-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.finding-icon { width: 34px; height: 34px; border-radius: 10px; background: rgba(0,121,107,0.10); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.finding-card--posterior .finding-icon { background: rgba(0,151,167,0.10); }
.finding-title { font-size: 14px; font-weight: 700; color: rgba(0,0,0,0.72); }
.finding-body { font-size: 13px; color: rgba(0,0,0,0.6); line-height: 1.7; white-space: pre-wrap; }

/* ─── D. IMAGES ────────────────────────────────────────────── */
.images-section {
  background: linear-gradient(135deg, rgba(21,101,192,0.05) 0%, rgba(2,136,209,0.03) 100%);
  border-radius: 16px;
  border: 1px solid rgba(0,0,0,0.07);
  border-top: 3px solid #1565C0;
  padding: 18px 20px; margin-bottom: 16px;
  box-shadow: 0 2px 10px rgba(21,101,192,0.07);
}

/* ─── E. AI ─────────────────────────────────────────────────── */
.ai-section {
  border-radius: 16px;
  border: 1px solid rgba(0,0,0,0.07);
  background: linear-gradient(160deg, rgba(255,152,0,0.05) 0%, rgba(255,249,240,0.8) 100%);
  overflow: hidden; margin-bottom: 16px;
  box-shadow: 0 2px 10px rgba(245,124,0,0.07);
}
.ai-header {
  display: flex; align-items: center; gap: 14px; padding: 14px 18px;
  background: rgba(255,152,0,0.05);
  border-bottom: 1px solid rgba(245,124,0,0.09);
  border-right: 4px solid #F57C00;
}
.ai-icon-wrap { width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg,#F57C00,#FFB300); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ai-title { font-size: 15px; font-weight: 800; color: rgba(0,0,0,0.82); }
.ai-subtitle { font-size: 12px; color: rgba(0,0,0,0.42); margin-top: 1px; }
.ai-body { padding: 16px 18px; }

/* ─── F. DOCTOR REVIEW ──────────────────────────────────────── */
.doctor-section {
  border-radius: 16px;
  border: 1px solid rgba(0,0,0,0.07);
  background: linear-gradient(160deg, rgba(var(--v-theme-primary),0.05) 0%, rgba(255,255,255,0.9) 100%);
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(var(--v-theme-primary),0.07);
}
.doctor-header {
  display: flex; align-items: center; gap: 14px; padding: 14px 18px;
  background: rgba(var(--v-theme-primary),0.04);
  border-bottom: 1px solid rgba(var(--v-theme-primary),0.09);
  border-right: 4px solid rgb(var(--v-theme-primary));
}
.doctor-icon-wrap { width: 38px; height: 38px; border-radius: 10px; background: rgb(var(--v-theme-primary)); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.doctor-title { font-size: 15px; font-weight: 800; color: rgba(0,0,0,0.82); }
.doctor-subtitle { font-size: 12px; color: rgba(0,0,0,0.42); margin-top: 1px; }
.doctor-body { padding: 16px 18px; }

/* ─── CATEGORY SELECTOR ───────────────────────────────────── */
.category-selector-row {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  background: rgba(var(--v-theme-primary), 0.04);
  border: 1px solid rgba(var(--v-theme-primary), 0.15);
  border-radius: 10px; padding: 10px 14px; margin-bottom: 16px;
}
.category-selector-label {
  font-size: 14px; font-weight: 700; color: rgba(0,0,0,0.65);
  white-space: nowrap; flex-shrink: 0;
}
.category-select { flex: 1; min-width: 180px; }

/* ─── BILL TAB ──────────────────────────────────────────────── */
.bill-hero { display: flex; align-items: center; justify-content: space-between; background: #fff; border-radius: 16px; border: 1px solid rgba(0,0,0,0.07); padding: 20px 24px; margin-bottom: 16px; flex-wrap: wrap; gap: 16px; }
.bill-service-label { font-size: 10px; font-weight: 700; color: rgba(0,0,0,0.4); letter-spacing: 0.08em; margin-bottom: 4px; text-transform: uppercase; }
.bill-service-name  { font-size: 20px; font-weight: 800; color: rgba(0,0,0,0.85); margin-bottom: 8px; }
.bill-meta { display: flex; align-items: center; gap: 12px; font-size: 12px; color: rgba(0,0,0,0.45); }
.bill-meta span { display: flex; align-items: center; }
.bill-invoice-num { font-family: monospace; background: rgba(0,0,0,0.05); padding: 2px 8px; border-radius: 6px; }
.bill-hero-price { display: flex; flex-direction: column; align-items: flex-end; }
.bill-price-value { font-size: 32px; font-weight: 900; color: rgba(46,125,50,1); letter-spacing: -1px; line-height: 1; }
.bill-price-unit  { font-size: 12px; font-weight: 600; color: rgba(46,125,50,0.6); margin-top: 2px; }
.bill-actions { display: flex; justify-content: flex-end; gap: 10px; }

/* ─── BILL SUMMARY BAR ─────────────────────────────────────── */
.bill-summary-bar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0;
  background: linear-gradient(135deg, rgba(21,101,192,0.05) 0%, rgba(46,125,50,0.04) 100%);
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 14px;
  padding: 14px 18px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}
.bsb-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.bsb-icon { flex-shrink: 0; opacity: 0.85; }
.bsb-content { display: flex; flex-direction: column; min-width: 0; }
.bsb-label {
  font-size: 10px;
  font-weight: 600;
  color: rgba(0,0,0,0.4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}
.bsb-value {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.3px;
  white-space: nowrap;
  line-height: 1.2;
}
.bsb-value--primary { color: rgb(var(--v-theme-primary)); }
.bsb-value--success { color: #2e7d32; }
.bsb-value--warning { color: #e65100; }
.bsb-sep {
  width: 1px;
  height: 36px;
  background: rgba(0,0,0,0.08);
  margin: 0 12px;
  flex-shrink: 0;
}
.bsb-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(0,0,0,0.06);
  border-radius: 0 0 14px 14px;
}
.bsb-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, rgb(var(--v-theme-primary)), #2e7d32);
  border-radius: 0 0 14px 14px;
  transition: width 0.5s ease;
}

/* ─── PRESCRIPTION TAB ─────────────────────────────────────── */
.rx-tab-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px;
}
.rx-tab-title {
  font-size: 15px; font-weight: 700;
  color: rgba(0,0,0,0.72);
  display: flex; align-items: center;
}
.drug-list { display: flex; flex-direction: column; gap: 8px; }
.drug-row {
  display: flex; align-items: center; gap: 12px;
  background: #fff; border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.07);
  padding: 11px 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  transition: box-shadow 0.12s;
}
.drug-row:hover { box-shadow: 0 2px 8px rgba(21,101,192,0.09); }
.drug-number {
  width: 24px; height: 24px;
  border-radius: 50%;
  background: rgba(21,101,192,0.10);
  color: #1565C0;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800;
  flex-shrink: 0;
}
.drug-name { font-size: 14px; font-weight: 700; color: rgba(0,0,0,0.82); flex: 1; }
.drug-detail { display: flex; align-items: center; gap: 10px; font-size: 12px; color: rgba(0,0,0,0.45); }
.drug-detail span { display: flex; align-items: center; }
.drug-form { background: #fff; border-radius: 14px; border: 1px solid rgba(21,101,192,0.20); padding: 16px; box-shadow: 0 2px 8px rgba(21,101,192,0.06); }
.rx-empty {
  display: flex; flex-direction: column; align-items: center; padding: 32px 16px;
  background: #fff;
  border-radius: 14px;
  border: 1px dashed rgba(0,0,0,0.12);
  margin-bottom: 16px;
  text-align: center;
}
.gap-2 { gap: 8px; }
</style>
