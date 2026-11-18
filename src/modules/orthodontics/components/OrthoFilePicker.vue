<template>
  <!-- Pick an existing upload of the given kinds, or upload a new one. -->
  <v-dialog v-model="open" max-width="640" scrollable>
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center ga-2 pa-4">
        <v-icon color="primary">{{ icon }}</v-icon>
        <span>{{ title || t('filePicker.chooseFile') }}</span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="open = false" />
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-4">
        <div v-if="canManage" class="mb-4">
          <v-select
            v-if="kinds.length > 1"
            v-model="uploadKind"
            :items="kindItems"
            :label="t('filePicker.fileType')"
            variant="outlined"
            density="comfortable"
            class="mb-2"
          />
          <v-file-input
            v-model="file"
            :accept="accept"
            :label="uploadLabel"
            prepend-icon=""
            prepend-inner-icon="mdi-upload"
            variant="outlined"
            density="comfortable"
            show-size
            hide-details
            :disabled="uploading"
          />
          <v-progress-linear v-if="uploading" :model-value="progress * 100" color="primary" height="6" rounded class="mt-2" />
          <div class="d-flex justify-end mt-2">
            <v-btn color="primary" :loading="uploading" :disabled="!file" prepend-icon="mdi-cloud-upload" @click="upload">{{ t('filePicker.upload') }}</v-btn>
          </div>
        </div>
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">{{ error }}</v-alert>
        <div class="text-subtitle-2 mb-2">{{ t('filePicker.uploadedFiles') }}</div>
        <v-progress-linear v-if="loading" indeterminate color="primary" />
        <v-list v-else-if="files.length" density="compact" lines="two">
          <v-list-item v-for="f in files" :key="f.id" :title="f.meta?.label || f.original_name" @click="choose(f)">
            <template #prepend><v-icon>{{ kindIcon(f.kind) }}</v-icon></template>
            <v-list-item-subtitle>{{ kindLabel(f.kind) }} · {{ fmtDate(f.meta?.captured_at || f.created_at) }} · {{ bytes(f.size) }}</v-list-item-subtitle>
            <template #append><v-icon>{{ forwardIcon }}</v-icon></template>
          </v-list-item>
        </v-list>
        <div v-else class="text-center text-medium-emphasis py-6">{{ t('filePicker.noFiles') }}</div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { orthoApi, orthoError } from '../api.js'
import { bytes, fmtDate } from '../utils/format.js'
import { useOrthoI18n } from '../i18n.js'

const { t, forwardIcon } = useOrthoI18n()
const KINDS = ['ceph_xray', 'face_frontal', 'face_smile', 'face_profile', 'intraoral_photo', 'model_upper', 'model_lower', 'model_combined']
const kindLabel = k => (KINDS.includes(k) ? t(`filePicker.kinds.${k}`) : k)
const kindIcon = k => k.startsWith('model') ? 'mdi-cube-outline' : k === 'ceph_xray' ? 'mdi-radiology-box-outline' : 'mdi-face-recognition'

const props = defineProps({
  modelValue: Boolean,
  caseId: { type: [Number, String], required: true },
  kinds: { type: Array, required: true },
  title: { type: String, default: '' },
  icon: { type: String, default: 'mdi-file-image' },
  canManage: Boolean
})
const emit = defineEmits(['update:modelValue', 'selected'])
const open = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) })

const files = ref([])
const loading = ref(false)
const file = ref(null)
const uploadKind = ref(props.kinds[0])
const uploading = ref(false)
const progress = ref(0)
const error = ref('')
const kindItems = computed(() => props.kinds.map(k => ({ title: kindLabel(k), value: k })))
const isModel = computed(() => uploadKind.value.startsWith('model'))
const accept = computed(() => isModel.value ? '.stl,.ply,.obj' : 'image/jpeg,image/png,image/webp')
const uploadLabel = computed(() => t(isModel.value ? 'filePicker.modelFile' : 'filePicker.imageFile'))

async function load () {
  loading.value = true
  error.value = ''
  try {
    const res = await orthoApi.files(props.caseId, props.kinds.join(','))
    files.value = res.data || []
  } catch (e) {
    error.value = orthoError(e)
  } finally {
    loading.value = false
  }
}

async function upload () {
  const f = Array.isArray(file.value) ? file.value[0] : file.value
  if (!f) return
  uploading.value = true
  progress.value = 0
  error.value = ''
  try {
    const res = await orthoApi.uploadFile(props.caseId, { file: f, kind: uploadKind.value }, p => { progress.value = p })
    file.value = null
    choose(res.data)
  } catch (e) {
    error.value = orthoError(e)
  } finally {
    uploading.value = false
  }
}

function choose (f) {
  emit('selected', f)
  open.value = false
}

watch(open, v => { if (v) { uploadKind.value = props.kinds[0]; load() } })
</script>
