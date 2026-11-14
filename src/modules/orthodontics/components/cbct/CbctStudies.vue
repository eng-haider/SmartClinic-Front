<template>
  <div>
    <CBCTViewer v-if="openStudy" :key="openStudy.id" :case-id="caseId" :study="openStudy" :can-manage="canManage" @close="openStudy = null" @saved="$emit('changed')" />
    <template v-else>
      <div class="d-flex flex-wrap align-center ga-2 mb-4">
        <div>
          <div class="text-h6">تحليل CBCT</div>
          <div class="text-caption text-medium-emphasis">مقاطع محورية/إكليلية/سهمية، حجمي 3D، بانوراما ومقاطع عرضية، قياسات العظم وتخطيط الزرعات</div>
        </div>
        <v-spacer />
        <v-btn v-if="canManage" color="primary" prepend-icon="mdi-cloud-upload-outline" @click="uploader = true">رفع دراسة</v-btn>
      </div>
      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">{{ error }}</v-alert>
      <v-alert v-if="driver === 'local'" type="info" variant="tonal" density="compact" class="mb-3">
        تُحفظ ملفات DICOM في التخزين الخاص بالعيادة على الخادم. يمكن ربط خادم Orthanc معزول من إعدادات الخادم.
      </v-alert>
      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-3" />
      <v-row v-if="studies.length">
        <v-col v-for="s in studies" :key="s.id" cols="12" sm="6" lg="4">
          <v-card rounded="xl" variant="outlined" :disabled="s.status !== 'ready'" @click="s.status === 'ready' && (openStudy = s)">
            <v-card-item>
              <template #prepend><v-icon color="primary" size="32">mdi-cube-scan</v-icon></template>
              <v-card-title class="text-subtitle-1">{{ s.description || 'دراسة CBCT' }}</v-card-title>
              <v-card-subtitle>{{ s.study_date || s.created_at?.slice(0, 10) }} · {{ s.instances_count }} شريحة · {{ bytes(s.total_size) }}</v-card-subtitle>
              <template #append>
                <v-chip :color="{ ready: 'success', uploading: 'warning', failed: 'error' }[s.status]" size="x-small" variant="tonal">{{ STATUS_AR[s.status] }}</v-chip>
              </template>
            </v-card-item>
            <v-card-actions v-if="canManage">
              <v-spacer />
              <v-btn size="small" variant="text" color="error" prepend-icon="mdi-delete-outline" @click.stop="remove(s)">حذف</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
      <div v-else-if="!loading" class="text-center text-medium-emphasis py-10">
        <v-icon size="48" color="grey-lighten-1">mdi-cube-scan</v-icon>
        <div class="mt-2">لا توجد دراسات CBCT لهذه الحالة</div>
      </div>
    </template>
    <CbctUploader v-model="uploader" :case-id="caseId" @uploaded="onUploaded" />
  </div>
</template>

<script setup>
import { defineAsyncComponent, onMounted, ref } from 'vue'
import CbctUploader from './CbctUploader.vue'
import { orthoApi, orthoError } from '../../api.js'
import { bytes } from '../../utils/format.js'

// The viewer pulls in Cornerstone3D; load it only when a study is opened.
const CBCTViewer = defineAsyncComponent(() => import('./CBCTViewer.vue'))

const props = defineProps({ caseId: { type: [Number, String], required: true }, canManage: Boolean, driver: { type: String, default: 'local' } })
const emit = defineEmits(['changed'])
const STATUS_AR = { ready: 'جاهزة', uploading: 'قيد الرفع', failed: 'فشلت' }

const studies = ref([])
const loading = ref(false)
const error = ref('')
const uploader = ref(false)
const openStudy = ref(null)

async function load () {
  loading.value = true
  error.value = ''
  try {
    studies.value = (await orthoApi.cbctStudies(props.caseId)).data || []
  } catch (e) {
    error.value = orthoError(e)
  } finally {
    loading.value = false
  }
}

function onUploaded (study) {
  emit('changed')
  load().then(() => { if (study?.status === 'ready') openStudy.value = study })
}

async function remove (s) {
  if (!window.confirm('حذف هذه الدراسة من القائمة؟ تبقى الملفات المكتملة محفوظة على الخادم.')) return
  try {
    await orthoApi.deleteCbctStudy(props.caseId, s.id)
    emit('changed')
    load()
  } catch (e) {
    error.value = orthoError(e)
  }
}

onMounted(load)
</script>
