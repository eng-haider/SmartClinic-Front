<template>
  <div>
    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-3" closable @click:close="error = ''">{{ error }}</v-alert>
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-3" />

    <v-row>
      <v-col cols="12" lg="7">
        <v-card rounded="xl" variant="outlined" class="mb-4">
          <v-card-title class="d-flex align-center ga-2">
            <v-icon color="primary">mdi-stethoscope</v-icon> {{ t('plan.assessment') }}
            <v-spacer />
            <span v-if="plan.revision" class="text-caption text-medium-emphasis">{{ t('common.revision', { n: plan.revision }) }}</span>
          </v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="12"><v-textarea v-model="form.chief_complaint" :label="t('plan.chiefComplaint')" rows="2" auto-grow variant="outlined" density="comfortable" :readonly="ro" /></v-col>
              <v-col cols="12"><v-textarea v-model="form.clinical_examination" :label="t('plan.clinicalExamination')" rows="2" auto-grow variant="outlined" density="comfortable" :readonly="ro" /></v-col>
              <v-col cols="12"><v-textarea v-model="form.diagnosis" :label="t('plan.diagnosis')" rows="2" auto-grow variant="outlined" density="comfortable" :readonly="ro" /></v-col>
              <v-col cols="12" sm="4"><v-select v-model="form.skeletal_class" :items="['I', 'II', 'III']" :label="t('plan.skeletalClass')" clearable variant="outlined" density="comfortable" :readonly="ro" /></v-col>
              <v-col cols="6" sm="4"><v-select v-model="form.molar_class_right" :items="CLASSES" :label="t('plan.molarRight')" clearable variant="outlined" density="comfortable" :readonly="ro" /></v-col>
              <v-col cols="6" sm="4"><v-select v-model="form.molar_class_left" :items="CLASSES" :label="t('plan.molarLeft')" clearable variant="outlined" density="comfortable" :readonly="ro" /></v-col>
              <v-col cols="6" sm="4"><v-select v-model="form.canine_class_right" :items="CLASSES" :label="t('plan.canineRight')" clearable variant="outlined" density="comfortable" :readonly="ro" /></v-col>
              <v-col cols="6" sm="4"><v-select v-model="form.canine_class_left" :items="CLASSES" :label="t('plan.canineLeft')" clearable variant="outlined" density="comfortable" :readonly="ro" /></v-col>
              <v-col cols="6" sm="4"><v-text-field v-model.number="form.overjet_mm" type="number" step="0.5" :label="t('plan.overjet')" variant="outlined" density="comfortable" :readonly="ro" /></v-col>
              <v-col cols="6" sm="4"><v-text-field v-model.number="form.overbite_mm" type="number" step="0.5" :label="t('plan.overbite')" variant="outlined" density="comfortable" :readonly="ro" /></v-col>
              <v-col cols="6" sm="4"><v-text-field v-model.number="form.crowding_upper_mm" type="number" step="0.5" :label="t('plan.crowdingUpper')" variant="outlined" density="comfortable" :readonly="ro" /></v-col>
              <v-col cols="6" sm="4"><v-text-field v-model.number="form.crowding_lower_mm" type="number" step="0.5" :label="t('plan.crowdingLower')" variant="outlined" density="comfortable" :readonly="ro" /></v-col>
              <v-col cols="12" sm="4"><v-text-field v-model="form.crossbite" :label="t('plan.crossbite')" variant="outlined" density="comfortable" :readonly="ro" /></v-col>
              <v-col cols="6" sm="4"><v-text-field v-model.number="form.midline_upper_mm" type="number" step="0.5" :label="t('plan.midlineUpper')" variant="outlined" density="comfortable" :readonly="ro" :hint="t('plan.midlineHint')" /></v-col>
              <v-col cols="6" sm="4"><v-text-field v-model.number="form.midline_lower_mm" type="number" step="0.5" :label="t('plan.midlineLower')" variant="outlined" density="comfortable" :readonly="ro" :hint="t('plan.midlineHint')" /></v-col>
            </v-row>
            <div class="text-subtitle-2 mt-2 mb-1">{{ t('plan.extraNotes') }}</div>
            <div v-for="(o, i) in form.observations" :key="'o' + i" class="d-flex ga-2 mb-2">
              <v-text-field v-model="o.label" :label="t('plan.noteTitle')" variant="outlined" density="compact" hide-details :readonly="ro" style="max-width:220px" />
              <v-text-field v-model="o.value" :label="t('plan.noteValue')" variant="outlined" density="compact" hide-details :readonly="ro" />
              <v-btn v-if="!ro" icon="mdi-close" size="small" variant="text" @click="form.observations.splice(i, 1)" />
            </div>
            <v-btn v-if="!ro" size="small" variant="text" prepend-icon="mdi-plus" @click="form.observations.push({ label: '', value: '' })">{{ t('plan.addNote') }}</v-btn>
          </v-card-text>
        </v-card>

        <v-card rounded="xl" variant="outlined">
          <v-card-title class="d-flex align-center ga-2"><v-icon color="primary">mdi-clipboard-text-outline</v-icon> {{ t('plan.title') }}</v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="12"><v-textarea v-model="form.objectives" :label="t('plan.objectives')" rows="2" auto-grow variant="outlined" density="comfortable" :readonly="ro" /></v-col>
              <v-col cols="12"><v-textarea v-model="form.planned_treatment" :label="t('plan.plannedTreatment')" rows="2" auto-grow variant="outlined" density="comfortable" :readonly="ro" /></v-col>
              <v-col cols="12" sm="6"><v-combobox v-model="form.appliance_type" :items="APPLIANCES" :label="t('plan.applianceType')" variant="outlined" density="comfortable" :readonly="ro" /></v-col>
              <v-col cols="6" sm="3"><v-text-field v-model.number="form.estimated_duration_months" type="number" min="0" :label="t('plan.duration')" variant="outlined" density="comfortable" :readonly="ro" /></v-col>
              <v-col cols="6" sm="3"><v-text-field v-model="form.start_date" type="date" :label="t('plan.startDate')" variant="outlined" density="comfortable" :readonly="ro" /></v-col>
              <v-col cols="12" sm="6"><v-select v-model="form.status" :items="STATUSES" :label="t('plan.status')" variant="outlined" density="comfortable" :readonly="ro" /></v-col>
            </v-row>
            <div class="text-subtitle-2 mb-1">{{ t('plan.stages') }}</div>
            <div v-for="(st, i) in form.stages" :key="'s' + i" class="stage">
              <div class="d-flex ga-2 align-center">
                <v-chip size="small" variant="tonal">{{ i + 1 }}</v-chip>
                <v-text-field v-model="st.title" :label="t('plan.stage')" variant="outlined" density="compact" hide-details :readonly="ro" />
                <v-select v-model="st.status" :items="STAGE_STATUS" variant="outlined" density="compact" hide-details :readonly="ro" style="max-width:150px" />
                <v-text-field v-model="st.target_date" type="date" variant="outlined" density="compact" hide-details :readonly="ro" style="max-width:160px" />
                <v-btn v-if="!ro" icon="mdi-close" size="small" variant="text" @click="form.stages.splice(i, 1)" />
              </div>
              <v-textarea v-model="st.description" :placeholder="t('plan.stageDetails')" rows="1" auto-grow variant="outlined" density="compact" hide-details class="mt-1" :readonly="ro" />
            </div>
            <v-btn v-if="!ro" size="small" variant="text" prepend-icon="mdi-plus" @click="form.stages.push({ title: '', description: '', status: 'pending', target_date: null })">{{ t('plan.addStage') }}</v-btn>
            <v-textarea v-model="form.doctor_notes" :label="t('plan.doctorNotes')" rows="2" auto-grow variant="outlined" density="comfortable" class="mt-3" :readonly="ro" />
          </v-card-text>
          <v-card-actions v-if="!ro" class="pa-4">
            <span v-if="dirty" class="text-caption text-warning">{{ t('common.unsavedChanges') }}</span>
            <v-spacer />
            <v-btn color="primary" :loading="saving" :disabled="!dirty" prepend-icon="mdi-content-save" @click="save">{{ t('plan.savePlan') }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Follow-up: the case's existing notes (sessions) -->
      <v-col cols="12" lg="5">
        <v-card rounded="xl" variant="outlined">
          <v-card-title class="d-flex align-center ga-2"><v-icon color="primary">mdi-calendar-check-outline</v-icon> {{ t('plan.sessions') }}</v-card-title>
          <v-card-subtitle>{{ t('plan.sessionsSub') }}</v-card-subtitle>
          <v-card-text>
            <div v-if="canAddSession" class="session-form mb-4">
              <OrthoQuickfields :meta="session" />
              <v-row dense class="mt-2">
                <v-col cols="12" sm="6"><v-text-field v-model="session.wire" :label="t('plan.wire')" variant="outlined" density="compact" hide-details /></v-col>
                <v-col cols="12" sm="6"><v-text-field v-model="session.elastics" :label="t('plan.elastics')" variant="outlined" density="compact" hide-details /></v-col>
                <v-col cols="12" sm="6"><v-text-field v-model="session.adjustment" :label="t('plan.adjustment')" variant="outlined" density="compact" hide-details /></v-col>
                <v-col cols="12" sm="6"><v-text-field v-model="session.next" :label="t('plan.next')" variant="outlined" density="compact" hide-details /></v-col>
                <v-col cols="12"><v-textarea v-model="session.text" :label="t('plan.progress')" rows="2" auto-grow variant="outlined" density="compact" hide-details /></v-col>
              </v-row>
              <div class="d-flex justify-end mt-2">
                <v-btn color="primary" variant="tonal" :loading="savingSession" :disabled="!sessionContent" prepend-icon="mdi-plus" @click="addSession">{{ t('plan.addSession') }}</v-btn>
              </div>
            </div>
            <div v-if="!sessions.length" class="text-caption text-medium-emphasis">{{ t('plan.noSessions') }}</div>
            <div v-for="n in sessions" :key="n.id" class="session">
              <div class="d-flex align-center ga-2">
                <span class="text-caption text-medium-emphasis">{{ (n.created_at || '').slice(0, 10) }}</span>
                <span class="text-caption">{{ n.creator?.name || '' }}</span>
              </div>
              <OrthoMetaBadges v-if="n.parsed.meta" :meta="n.parsed.meta" />
              <div class="text-body-2" style="white-space:pre-wrap">{{ stripTags(n.parsed.text) }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import api from '@/services/api'
import OrthoQuickfields from '@/components/patients/OrthoQuickfields.vue'
import OrthoMetaBadges from '@/components/patients/OrthoMetaBadges.vue'
import { composeNoteContent, parseOrthoLine } from '@/utils/orthoNote'
import { parseImageTag } from '@/utils/noteImageTag'
import { useAuthStore } from '@/stores/authNew'
import { orthoApi, orthoError } from '../api.js'
import { useOrthoI18n } from '../i18n.js'

const props = defineProps({ caseId: { type: [Number, String], required: true }, canManage: Boolean })
const emit = defineEmits(['dirty', 'changed'])
const authStore = useAuthStore()
const { t } = useOrthoI18n()

const CLASSES = [{ title: 'Class I', value: 'I' }, { title: 'Class II', value: 'II' }, { title: 'Class II div 1', value: 'II_div1' }, { title: 'Class II div 2', value: 'II_div2' }, { title: 'Class III', value: 'III' }]
const STATUSES = computed(() => ['planned', 'active', 'retention', 'completed', 'discontinued'].map(value => ({ title: t(`planStatus.${value}`), value })))
const STAGE_STATUS = computed(() => ['pending', 'in_progress', 'done'].map(value => ({ title: t(`plan.stageStatus.${value}`), value })))
// Suggestions only: the appliance is free text, stored as typed.
const APPLIANCES = computed(() => t('plan.appliances'))
const FIELDS = ['chief_complaint', 'clinical_examination', 'diagnosis', 'skeletal_class', 'molar_class_right', 'molar_class_left', 'canine_class_right', 'canine_class_left', 'crowding_upper_mm', 'crowding_lower_mm', 'overjet_mm', 'overbite_mm', 'crossbite', 'midline_upper_mm', 'midline_lower_mm', 'objectives', 'planned_treatment', 'appliance_type', 'estimated_duration_months', 'doctor_notes', 'start_date', 'status']

const empty = () => ({ ...Object.fromEntries(FIELDS.map(f => [f, null])), status: 'planned', observations: [], stages: [] })
const form = reactive(empty())
const plan = ref({})
const saved = ref(JSON.stringify(empty()))
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const ro = computed(() => !props.canManage)
const dirty = computed(() => JSON.stringify(form) !== saved.value)
watch(dirty, v => emit('dirty', v), { immediate: true })

const notes = ref([])
const sessions = computed(() => notes.value.map(n => ({ ...n, parsed: parseOrthoLine(n.content || '') })))
const canAddSession = computed(() => authStore.hasPermission('create-note'))
const session = reactive({ noteDate: new Date().toISOString().slice(0, 10), appliance: null, phase: null, duration: null, wire: '', elastics: '', adjustment: '', next: '', text: '' })
const savingSession = ref(false)
const sessionContent = computed(() => {
  const extra = [
    session.wire && t('plan.noteWire', { v: session.wire }),
    session.elastics && t('plan.noteElastics', { v: session.elastics }),
    session.adjustment && t('plan.noteAdjustment', { v: session.adjustment }),
    session.next && t('plan.noteNext', { v: session.next })
  ].filter(Boolean).join(' | ')
  const text = [extra, session.text?.trim()].filter(Boolean).join('\n')
  return composeNoteContent(session, text)
})
// The patient page's hidden image tag is not shown as text.
const stripTags = t => parseImageTag(t || '').text

async function load () {
  loading.value = true
  try {
    const [p, n] = await Promise.all([
      orthoApi.treatmentPlan(props.caseId),
      api.get(`/notes/case/${props.caseId}`, { params: { include: 'creator' } }).catch(() => ({ data: [] }))
    ])
    plan.value = p.data || {}
    Object.assign(form, empty(), p.data ? Object.fromEntries([...FIELDS, 'observations', 'stages'].map(f => [f, p.data[f] ?? (f === 'observations' || f === 'stages' ? [] : null)])) : {})
    saved.value = JSON.stringify(form)
    notes.value = (n.data?.data || n.data || []).slice().sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
  } catch (e) {
    error.value = orthoError(e)
  } finally {
    loading.value = false
  }
}

async function save () {
  saving.value = true
  error.value = ''
  try {
    const body = { ...JSON.parse(JSON.stringify(form)), expected_revision: plan.value.revision || undefined }
    body.observations = body.observations.filter(o => o.label?.trim())
    body.stages = body.stages.filter(s => s.title?.trim())
    const res = await orthoApi.saveTreatmentPlan(props.caseId, body)
    plan.value = res.data
    Object.assign(form, Object.fromEntries([...FIELDS, 'observations', 'stages'].map(f => [f, res.data[f] ?? (f === 'observations' || f === 'stages' ? [] : null)])))
    saved.value = JSON.stringify(form)
    emit('changed')
  } catch (e) {
    error.value = e?.response?.status === 409 ? t('plan.conflict') : orthoError(e)
  } finally {
    saving.value = false
  }
}

async function addSession () {
  savingSession.value = true
  try {
    await api.post('/notes', { noteable_id: Number(props.caseId), noteable_type: 'App\\Models\\CaseModel', content: sessionContent.value })
    Object.assign(session, { appliance: null, phase: null, duration: null, wire: '', elastics: '', adjustment: '', next: '', text: '' })
    await load()
  } catch (e) {
    error.value = orthoError(e)
  } finally {
    savingSession.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.stage { border: 1px dashed rgba(var(--v-border-color), 0.6); border-radius: 10px; padding: 8px; margin-bottom: 8px; }
.session { border-inline-start: 3px solid rgb(var(--v-theme-primary)); padding: 6px 10px; margin-bottom: 10px; background: rgba(var(--v-theme-primary), 0.04); border-radius: 6px; }
.session-form { border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); border-radius: 12px; padding: 10px; }
</style>
