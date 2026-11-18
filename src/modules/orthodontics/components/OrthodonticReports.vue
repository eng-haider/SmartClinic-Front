<template>
  <div>
    <v-row>
      <v-col cols="12" md="4">
        <v-card rounded="xl" variant="outlined">
          <v-card-title>{{ t('reports.setup') }}</v-card-title>
          <v-card-text>
            <v-radio-group v-model="kind" density="compact">
              <v-radio value="final" :label="t('reports.final')" />
              <v-radio value="draft" :label="t('reports.draft')" />
            </v-radio-group>
            <v-select v-model="analysisId" :items="analysisItems" :label="t('reports.scope')" variant="outlined" density="comfortable" />
            <div class="text-subtitle-2 mb-1">{{ t('reports.sections') }}</div>
            <v-checkbox v-for="key in SECTION_KEYS" :key="key" v-model="sections[key]" :label="t(`reports.sectionNames.${key}`)" density="compact" hide-details />
            <v-checkbox v-model="includeImage" :label="t('reports.attachImage')" density="compact" hide-details />
            <v-select v-model="locale" :items="[{ title: 'العربية', value: 'ar' }, { title: 'English', value: 'en' }]" :label="t('reports.language')" variant="outlined" density="comfortable" class="mt-3" />
            <v-alert v-if="kind === 'final' && unreviewed" type="info" variant="tonal" density="compact" class="mb-2">
              {{ t('reports.unreviewed', { n: unreviewed }) }}
            </v-alert>
            <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-2">{{ error }}</v-alert>
            <div class="d-flex ga-2">
              <v-btn color="primary" variant="tonal" :loading="loading" prepend-icon="mdi-eye-outline" @click="preview">{{ t('reports.preview') }}</v-btn>
              <v-btn color="primary" :loading="loading" :disabled="!html" prepend-icon="mdi-file-pdf-box" @click="print">{{ t('reports.print') }}</v-btn>
            </div>
            <div class="text-caption text-medium-emphasis mt-2">{{ t('reports.printHelp') }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="8">
        <v-card rounded="xl" variant="outlined" class="preview">
          <iframe v-if="html" :srcdoc="html" title="report preview" class="preview-frame" />
          <div v-else class="text-center text-medium-emphasis py-16">
            <v-icon size="48">mdi-file-document-outline</v-icon>
            <div class="mt-2">{{ t('reports.empty') }}</div>
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
import { useOrthoI18n } from '../i18n.js'

const props = defineProps({ caseId: { type: [Number, String], required: true }, initialAnalysisId: { type: [Number, String], default: null } })
const { t, lang } = useOrthoI18n()
const SECTION_KEYS = ['ceph', 'cast', 'cbct', 'face', 'plan']

const kind = ref('final')
const analysisId = ref(props.initialAnalysisId || 'all')
const sections = reactive({ ceph: true, cast: true, cbct: true, face: true, plan: true })
const includeImage = ref(true)
const locale = ref(lang.value)
const analyses = ref([])
const unreviewed = ref(0)
const html = ref('')
const loading = ref(false)
const error = ref('')
const typeLabel = type => (['ceph', 'cast', 'cbct', 'face'].includes(type) ? t(`reports.types.${type}`) : type)
const analysisItems = computed(() => [{ title: t('reports.wholeCase'), value: 'all' }, ...analyses.value.map(a => ({ title: `${typeLabel(a.type)}: ${a.title || ''} · ${a.analysis_date}${a.status === 'reviewed' ? ' ✓' : ''}`, value: a.id }))])

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
      error.value = kind.value === 'final' ? t('reports.noReviewed') : t('reports.noData')
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
