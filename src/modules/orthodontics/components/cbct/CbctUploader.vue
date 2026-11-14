<template>
  <v-dialog v-model="open" max-width="620" persistent>
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center ga-2 pa-4">
        <v-icon color="primary">mdi-cloud-upload-outline</v-icon>
        رفع دراسة CBCT (DICOM)
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-4">
        <template v-if="phase === 'select'">
          <v-text-field v-model="description" label="وصف الدراسة (اختياري)" variant="outlined" density="comfortable" class="mb-2" />
          <div class="d-flex flex-wrap ga-2 mb-3">
            <v-btn variant="tonal" prepend-icon="mdi-file-multiple-outline" @click="filesInput.click()">ملفات DICOM</v-btn>
            <v-btn variant="tonal" prepend-icon="mdi-folder-open-outline" @click="folderInput.click()">مجلد كامل</v-btn>
            <v-btn variant="tonal" prepend-icon="mdi-folder-zip-outline" @click="zipInput.click()">ملف ZIP</v-btn>
          </div>
          <input ref="filesInput" type="file" multiple hidden @change="onPick($event.target.files)">
          <input ref="folderInput" type="file" webkitdirectory multiple hidden @change="onPick($event.target.files)">
          <input ref="zipInput" type="file" accept=".zip,application/zip" hidden @change="onPick($event.target.files)">
          <v-progress-linear v-if="scanning" indeterminate color="primary" class="mb-2" />
          <div v-if="candidates.length || ignored" class="text-body-2">
            {{ candidates.length }} ملف DICOM جاهز ({{ bytes(totalBytes) }})
            <span v-if="ignored" class="text-medium-emphasis"> · تم تجاهل {{ ignored }} ملف ليس DICOM</span>
          </div>
          <div class="text-caption text-medium-emphasis mt-2">
            تُرفع الملفات على دفعات عبر اتصال مشفّر إلى خادم العيادة فقط، ولا تُنشأ لها روابط عامة.
          </div>
        </template>

        <template v-else>
          <div class="d-flex justify-space-between text-body-2 mb-1">
            <span>{{ phaseLabel }}</span>
            <span dir="ltr">{{ uploadedCount }} / {{ candidates.length }}</span>
          </div>
          <v-progress-linear :model-value="overall * 100" color="primary" height="10" rounded />
          <v-alert v-if="skipped.length" type="warning" variant="tonal" density="compact" class="mt-3">
            تم رفض {{ skipped.length }} ملف:
            <ul class="mt-1" style="max-height:120px;overflow:auto">
              <li v-for="(s, i) in skipped.slice(0, 50)" :key="i" class="text-caption"><span dir="ltr">{{ s.file }}</span> - {{ s.reason }}</li>
            </ul>
          </v-alert>
        </template>
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-3">{{ error }}</v-alert>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-btn v-if="phase !== 'done'" variant="text" :disabled="phase === 'completing'" @click="cancel">إلغاء</v-btn>
        <v-spacer />
        <v-btn v-if="phase === 'select'" color="primary" :disabled="!candidates.length || scanning" prepend-icon="mdi-upload" @click="start">بدء الرفع</v-btn>
        <v-btn v-if="phase === 'done'" color="primary" @click="finish">تم</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { orthoApi, orthoError } from '../../api.js'
import { bytes } from '../../utils/format.js'

const props = defineProps({ modelValue: Boolean, caseId: { type: [Number, String], required: true } })
const emit = defineEmits(['update:modelValue', 'uploaded'])
const open = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) })

// Keep each request well under typical PHP upload limits.
const MAX_BATCH_BYTES = 24 * 1024 * 1024
const MAX_BATCH_FILES = 60

const filesInput = ref(null)
const folderInput = ref(null)
const zipInput = ref(null)
const description = ref('')
const candidates = ref([])
const ignored = ref(0)
const scanning = ref(false)
const phase = ref('select') // select | uploading | completing | done
const uploadedBytes = ref(0)
const uploadedCount = ref(0)
const batchProgress = ref(0)
const currentBatchBytes = ref(0)
const skipped = ref([])
const error = ref('')
const study = ref(null)
let cancelled = false

const totalBytes = computed(() => candidates.value.reduce((n, f) => n + f.size, 0))
const overall = computed(() => totalBytes.value ? Math.min(1, (uploadedBytes.value + currentBatchBytes.value * batchProgress.value) / totalBytes.value) : 0)
const phaseLabel = computed(() => ({ uploading: 'جارٍ الرفع…', completing: 'جارٍ إنهاء الدراسة…', done: 'اكتمل الرفع' }[phase.value] || ''))

// A DICOM Part 10 file has "DICM" at byte 128.
async function isDicom (file) {
  if (file.size < 132) return false
  const head = new Uint8Array(await file.slice(128, 132).arrayBuffer())
  return head[0] === 0x44 && head[1] === 0x49 && head[2] === 0x43 && head[3] === 0x4d
}

async function onPick (fileList) {
  const list = Array.from(fileList || [])
  if (!list.length) return
  scanning.value = true
  error.value = ''
  try {
    const out = []
    let skippedCount = 0
    for (const f of list) {
      if (/\.zip$/i.test(f.name)) {
        // Unzipped in the browser, so the server only ever receives DICOM files.
        const { unzip } = await import('fflate')
        const entries = await new Promise((resolve, reject) => {
          f.arrayBuffer().then(buf => unzip(new Uint8Array(buf), (err, res) => (err ? reject(err) : resolve(res))), reject)
        })
        for (const [name, data] of Object.entries(entries)) {
          if (name.endsWith('/') || !data.length) continue
          const file = new File([data], name.split('/').pop(), { type: 'application/dicom' })
          if (await isDicom(file)) out.push(file); else skippedCount++
        }
      } else if (await isDicom(f)) out.push(f)
      else skippedCount++
    }
    candidates.value = out
    ignored.value = skippedCount
  } catch (e) {
    error.value = 'تعذر قراءة الملفات: ' + (e?.message || e)
  } finally {
    scanning.value = false
  }
}

function batches () {
  const out = []
  let cur = []
  let size = 0
  for (const f of candidates.value) {
    if (cur.length && (size + f.size > MAX_BATCH_BYTES || cur.length >= MAX_BATCH_FILES)) { out.push(cur); cur = []; size = 0 }
    cur.push(f)
    size += f.size
  }
  if (cur.length) out.push(cur)
  return out
}

async function start () {
  phase.value = 'uploading'
  error.value = ''
  cancelled = false
  skipped.value = []
  try {
    study.value = (await orthoApi.createCbctStudy(props.caseId, description.value || null)).data
    for (const batch of batches()) {
      if (cancelled) return
      currentBatchBytes.value = batch.reduce((n, f) => n + f.size, 0)
      batchProgress.value = 0
      const res = await orthoApi.uploadCbctBatch(props.caseId, study.value.id, batch, p => { batchProgress.value = p })
      skipped.value.push(...(res.data?.skipped || []))
      uploadedBytes.value += currentBatchBytes.value
      uploadedCount.value += batch.length
      currentBatchBytes.value = 0
    }
    phase.value = 'completing'
    study.value = (await orthoApi.completeCbctStudy(props.caseId, study.value.id)).data
    phase.value = 'done'
  } catch (e) {
    error.value = orthoError(e, 'فشل الرفع')
    phase.value = 'select'
  }
}

async function cancel () {
  cancelled = true
  // An unfinished study is removed with its partial files.
  if (study.value && study.value.status !== 'ready') {
    try { await orthoApi.deleteCbctStudy(props.caseId, study.value.id) } catch (_) {}
  }
  reset()
  open.value = false
}

function finish () {
  emit('uploaded', study.value)
  reset()
  open.value = false
}

function reset () {
  phase.value = 'select'
  candidates.value = []
  ignored.value = 0
  uploadedBytes.value = 0
  uploadedCount.value = 0
  skipped.value = []
  study.value = null
  description.value = ''
  error.value = ''
}

watch(open, v => { if (v) reset() })
</script>
