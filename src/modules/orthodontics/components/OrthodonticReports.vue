<template>
  <div>
    <v-row>
      <v-col cols="12" md="4">
        <v-card rounded="xl" variant="outlined">
          <v-card-title>إعداد التقرير</v-card-title>
          <v-card-text>
            <v-radio-group v-model="kind" density="compact">
              <v-radio value="final" label="تقرير نهائي (التحليلات المعتمدة فقط)" />
              <v-radio value="draft" label="مسودة (كل التحليلات، مع علامة مسودة)" />
            </v-radio-group>
            <v-select v-model="analysisId" :items="analysisItems" label="النطاق" variant="outlined" density="comfortable" />
            <div class="text-subtitle-2 mb-1">الأقسام</div>
            <v-checkbox v-for="(label, key) in SECTIONS" :key="key" v-model="sections[key]" :label="label" density="compact" hide-details />
            <v-checkbox v-model="includeImage" label="إرفاق صورة الأشعة مع التتبع" density="compact" hide-details />
            <v-select v-model="locale" :items="[{ title: 'العربية', value: 'ar' }, { title: 'English', value: 'en' }]" label="لغة التقرير" variant="outlined" density="comfortable" class="mt-3" />
            <v-alert v-if="kind === 'final' && unreviewed" type="info" variant="tonal" density="compact" class="mb-2">
              {{ unreviewed }} تحليل غير معتمد لن يظهر في التقرير النهائي. اعتمد التحليل من شاشته بعد مراجعته.
            </v-alert>
            <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-2">{{ error }}</v-alert>
            <div class="d-flex ga-2">
              <v-btn color="primary" variant="tonal" :loading="loading" prepend-icon="mdi-eye-outline" @click="preview">معاينة</v-btn>
              <v-btn color="primary" :loading="loading" :disabled="!html" prepend-icon="mdi-file-pdf-box" @click="print">طباعة / PDF</v-btn>
            </div>
            <div class="text-caption text-medium-emphasis mt-2">اختر «حفظ كـ PDF» في نافذة الطباعة. يحافظ المتصفح على اتجاه النص العربي وتشكيل الحروف.</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="8">
        <v-card rounded="xl" variant="outlined" class="preview">
          <iframe v-if="html" :srcdoc="html" title="report preview" class="preview-frame" />
          <div v-else class="text-center text-medium-emphasis py-16">
            <v-icon size="48">mdi-file-document-outline</v-icon>
            <div class="mt-2">اضغط «معاينة» لإنشاء التقرير</div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { orthoApi, orthoError } from '../api.js'
import { buildReportHtml } from '../utils/reportHtml.js'
import { printHtml } from '../utils/print.js'

const props = defineProps({ caseId: { type: [Number, String], required: true }, initialAnalysisId: { type: [Number, String], default: null } })
const SECTIONS = { ceph: 'التحليل السيفالومتري', cast: 'تحليل الموديلات', cbct: 'قياسات CBCT', face: 'تحليل الوجه', plan: 'الخطة العلاجية' }

const kind = ref('final')
const analysisId = ref(props.initialAnalysisId || 'all')
const sections = reactive({ ceph: true, cast: true, cbct: true, face: true, plan: true })
const includeImage = ref(true)
const locale = ref(localStorage.getItem('locale') === 'en' ? 'en' : 'ar')
const analyses = ref([])
const unreviewed = ref(0)
const html = ref('')
const loading = ref(false)
const error = ref('')
const TYPE_AR = { ceph: 'سيفالومتري', cast: 'موديلات', cbct: 'CBCT', face: 'وجه' }
const analysisItems = computed(() => [{ title: 'تقرير شامل للحالة', value: 'all' }, ...analyses.value.map(a => ({ title: `${TYPE_AR[a.type]}: ${a.title || ''} · ${a.analysis_date}${a.status === 'reviewed' ? ' ✓' : ''}`, value: a.id }))])

const blobToDataUrl = blob => new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(blob) })

async function preview () {
  loading.value = true
  error.value = ''
  try {
    const params = { final: kind.value === 'final' ? 1 : 0 }
    if (analysisId.value !== 'all') params.analysis_id = analysisId.value
    const report = (await orthoApi.report(props.caseId, params)).data
    unreviewed.value = report.unreviewed_count || 0
    const images = {}
    if (includeImage.value && sections.ceph) {
      for (const a of report.analyses.filter(x => x.type === 'ceph' && x.file_id)) {
        try { images[a.file_id] = await blobToDataUrl(await orthoApi.fileContent(props.caseId, a.file_id)) } catch (_) { /* tracing without image */ }
      }
    }
    if (!report.analyses.length && !(sections.plan && report.treatment_plan)) {
      error.value = kind.value === 'final' ? 'لا توجد تحليلات معتمدة لعرضها.' : 'لا توجد بيانات لعرضها.'
    }
    html.value = buildReportHtml(report, { locale: locale.value, sections, images })
  } catch (e) {
    error.value = orthoError(e)
  } finally {
    loading.value = false
  }
}

function print () {
  printHtml(html.value, `ortho-report-${props.caseId}`)
}

watch([kind, analysisId, locale, includeImage, () => ({ ...sections })], () => { html.value = '' })

onMounted(async () => {
  try {
    analyses.value = (await orthoApi.analyses(props.caseId)).data || []
    unreviewed.value = analyses.value.filter(a => a.status !== 'reviewed').length
  } catch (e) {
    error.value = orthoError(e)
  }
})
</script>

<style scoped>
.preview { min-height: 70vh; overflow: hidden; }
.preview-frame { width: 100%; height: 78vh; border: 0; background: #fff; }
</style>
