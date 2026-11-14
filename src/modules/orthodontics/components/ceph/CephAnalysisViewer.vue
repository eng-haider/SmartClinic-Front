<template>
  <div>
    <!-- Editor -->
    <CephLandmarkEditor
      v-if="editing"
      :key="editorKey"
      :case-id="caseId"
      :analysis="editing.analysis"
      :file="editing.file"
      :can-manage="canManage"
      :detection-available="detectionAvailable"
      @dirty="v => emit('dirty', v)"
      @saved="onSaved"
      @close="closeEditor"
    />

    <!-- List -->
    <template v-else>
      <div class="d-flex flex-wrap align-center ga-2 mb-4">
        <div>
          <div class="text-h6">تحليل الأشعة السيفالومترية</div>
          <div class="text-caption text-medium-emphasis">Steiner · Downs · Tweed · Ricketts · McNamara · Wits · Björk-Jarabak</div>
        </div>
        <v-spacer />
        <v-btn v-if="selected.length >= 2" color="secondary" variant="tonal" prepend-icon="mdi-compare-horizontal" @click="startCompare">مقارنة ({{ selected.length }})</v-btn>
        <v-btn v-if="canManage" color="primary" prepend-icon="mdi-plus" @click="picker = true">تحليل جديد</v-btn>
      </div>

      <CephCompare v-if="comparing.length" :analyses="comparing" class="mb-4" @close="comparing = []" />

      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">{{ error }}</v-alert>
      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-3" />

      <v-row v-if="list.length">
        <v-col v-for="a in list" :key="a.id" cols="12" sm="6" lg="4">
          <v-card rounded="xl" variant="outlined" class="h-100" @click="open(a)">
            <v-card-item>
              <template #prepend>
                <v-checkbox-btn v-model="selected" :value="a.id" density="compact" @click.stop />
              </template>
              <v-card-title class="text-subtitle-1">{{ a.title || 'تحليل سيفالومتري' }}</v-card-title>
              <v-card-subtitle>{{ a.analysis_date }} · {{ a.created_by?.name || '' }}</v-card-subtitle>
              <template #append>
                <v-chip :color="a.status === 'reviewed' ? 'success' : 'grey'" size="x-small" variant="tonal">{{ a.status === 'reviewed' ? 'معتمد' : 'مسودة' }}</v-chip>
              </template>
            </v-card-item>
            <v-card-text class="pt-0">
              <div class="d-flex ga-3 flex-wrap" dir="ltr">
                <div v-for="k in ['SNA', 'SNB', 'ANB', 'FMA']" :key="k" class="kv">
                  <span class="kv-k">{{ k }}</span>
                  <span class="kv-v">{{ val(a, k) }}</span>
                </div>
              </div>
            </v-card-text>
            <v-card-actions v-if="canManage" class="pt-0">
              <v-spacer />
              <v-btn size="small" variant="text" color="error" prepend-icon="mdi-delete-outline" @click.stop="askDelete(a)">حذف</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
      <div v-else-if="!loading" class="text-center text-medium-emphasis py-10">
        <v-icon size="48" color="grey-lighten-1">mdi-radiology-box-outline</v-icon>
        <div class="mt-2">لا توجد تحليلات سيفالومترية لهذه الحالة بعد</div>
      </div>
    </template>

    <OrthoFilePicker v-model="picker" :case-id="caseId" :kinds="['ceph_xray']" title="صورة أشعة سيفالومترية جانبية" icon="mdi-radiology-box-outline" :can-manage="canManage" @selected="newAnalysis" />

    <v-dialog v-model="confirmDelete" max-width="420">
      <v-card rounded="xl">
        <v-card-title>حذف التحليل؟</v-card-title>
        <v-card-text>يُخفى التحليل من القائمة ويبقى محفوظاً مع كل مراجعاته في السجل.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmDelete = false">إلغاء</v-btn>
          <v-btn color="error" :loading="deleting" @click="doDelete">حذف</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="confirmLeave" max-width="420">
      <v-card rounded="xl">
        <v-card-title>تغييرات غير محفوظة</v-card-title>
        <v-card-text>هناك تعديلات على النقاط لم تُحفظ. هل تريد الخروج وتجاهلها؟</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmLeave = false">البقاء</v-btn>
          <v-btn color="error" @click="forceClose">تجاهل التعديلات</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import CephLandmarkEditor from './CephLandmarkEditor.vue'
import CephCompare from './CephCompare.vue'
import OrthoFilePicker from '../OrthoFilePicker.vue'
import { orthoApi, orthoError } from '../../api.js'
import { fmt } from '../../utils/format.js'

const props = defineProps({ caseId: { type: [Number, String], required: true }, canManage: Boolean, detectionAvailable: Boolean })
const emit = defineEmits(['dirty', 'changed'])

const list = ref([])
const loading = ref(false)
const error = ref('')
const editing = ref(null)
const editorKey = ref(0)
const picker = ref(false)
const selected = ref([])
const comparing = ref([])
const confirmDelete = ref(false)
const confirmLeave = ref(false)
const deleting = ref(false)
const toDelete = ref(null)

const val = (a, k) => { const m = a.results?.measurements?.[k]; return m && m.value !== null ? `${fmt(m.value)}${m.unit === '°' ? '°' : ' ' + m.unit}` : '—' }

async function load () {
  loading.value = true
  error.value = ''
  try {
    list.value = (await orthoApi.analyses(props.caseId, 'ceph')).data || []
  } catch (e) {
    error.value = orthoError(e)
  } finally {
    loading.value = false
  }
}

async function open (a) {
  try {
    const res = await orthoApi.analysis(props.caseId, a.id)
    editing.value = { analysis: res.data, file: null }
    editorKey.value++
  } catch (e) {
    error.value = orthoError(e)
  }
}

function newAnalysis (file) {
  editing.value = { analysis: null, file }
  editorKey.value++
}

function onSaved () {
  emit('changed')
  load()
}

function closeEditor ({ dirty }) {
  if (dirty) { confirmLeave.value = true; return }
  forceClose()
}
function forceClose () {
  confirmLeave.value = false
  editing.value = null
  emit('dirty', false)
}

async function startCompare () {
  try {
    const all = (await orthoApi.analyses(props.caseId, 'ceph', true)).data || []
    comparing.value = all.filter(a => selected.value.includes(a.id)).sort((a, b) => (a.analysis_date || '').localeCompare(b.analysis_date || '')).slice(0, 4)
  } catch (e) {
    error.value = orthoError(e)
  }
}

function askDelete (a) { toDelete.value = a; confirmDelete.value = true }
async function doDelete () {
  deleting.value = true
  try {
    await orthoApi.deleteAnalysis(props.caseId, toDelete.value.id)
    confirmDelete.value = false
    emit('changed')
    load()
  } catch (e) {
    error.value = orthoError(e)
  } finally {
    deleting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.kv { display: flex; flex-direction: column; align-items: center; min-width: 56px; }
.kv-k { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.6); }
.kv-v { font-weight: 700; }
</style>
