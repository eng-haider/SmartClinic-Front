<template>
  <v-card class="ortho-workspace" rounded="xl" elevation="2">
    <div class="ow-header">
      <v-icon size="28" color="white">mdi-tooth-outline</v-icon>
      <div class="flex-grow-1">
        <div class="text-h6 text-white font-weight-bold">{{ t('workspace.title') }}</div>
        <div v-if="overview" class="text-caption ow-sub">{{ overview.case.patient?.name }} · {{ overview.case.category?.name }}</div>
      </div>
      <v-chip v-if="overview && !canManage" color="white" variant="outlined" size="small">{{ t('workspace.viewOnly') }}</v-chip>
    </div>

    <div v-if="loading" class="pa-10 d-flex justify-center"><v-progress-circular indeterminate color="primary" /></div>
    <v-alert v-else-if="blocked" :type="blocked.type" variant="tonal" class="ma-4">{{ blocked.message }}</v-alert>

    <template v-else-if="overview">
      <v-tabs v-model="tab" color="primary" show-arrows density="comfortable" class="ow-tabs">
        <v-tab v-for="item in TABS" :key="item.value" :value="item.value" :prepend-icon="item.icon">{{ t(`workspace.tabs.${item.value}`) }}</v-tab>
      </v-tabs>
      <v-divider />
      <div class="pa-4">
        <!-- Only the active tab is mounted, so each imaging library loads on demand. -->
        <component
          :is="components[tab]"
          :key="tab + refreshKey"
          :case-id="caseId"
          :can-manage="canManage"
          :overview="overview"
          :detection-available="!!overview.capabilities?.landmark_detection"
          :driver="overview.capabilities?.cbct_driver"
          @dirty="v => (dirty = v)"
          @changed="reloadOverview"
          @go="goTab"
        />
      </div>
    </template>

    <v-dialog v-model="leaveDialog" max-width="420">
      <v-card rounded="xl">
        <v-card-title>{{ t('common.unsavedChanges') }}</v-card-title>
        <v-card-text>{{ t('workspace.leaveText') }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="leaveDialog = false">{{ t('common.stay') }}</v-btn>
          <v-btn color="error" @click="confirmLeave">{{ t('workspace.discardAndLeave') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { orthoApi, orthoError } from '../api.js'
import { releaseObjectUrls } from '../utils/blob.js'
import { useOrthodontics } from '../composables/useOrthodontics.js'
import { useOrthoI18n } from '../i18n.js'

const props = defineProps({
  caseId: { type: [Number, String], required: true },
  initialTab: { type: String, default: 'plan' }
})
const emit = defineEmits(['dirty'])
const { t } = useOrthoI18n()

// The treatment plan comes first and is the tab that opens by default.
const TABS = [
  { value: 'plan', icon: 'mdi-clipboard-text-outline' },
  { value: 'overview', icon: 'mdi-view-dashboard-outline' },
  { value: 'ceph', icon: 'mdi-radiology-box-outline' },
  { value: 'cast', icon: 'mdi-cube-scan' },
  { value: 'cbct', icon: 'mdi-scan-helper' },
  { value: 'face', icon: 'mdi-face-recognition' },
  { value: 'reports', icon: 'mdi-file-chart-outline' }
]

const components = {
  overview: defineAsyncComponent(() => import('./OrthoOverviewTab.vue')),
  ceph: defineAsyncComponent(() => import('./ceph/CephAnalysisViewer.vue')),
  cast: defineAsyncComponent(() => import('./cast/DentalCastViewer.vue')),
  cbct: defineAsyncComponent(() => import('./cbct/CbctStudies.vue')),
  face: defineAsyncComponent(() => import('./face/FacialAnalysisViewer.vue')),
  plan: defineAsyncComponent(() => import('./OrthodonticTreatmentPlan.vue')),
  reports: defineAsyncComponent(() => import('./OrthodonticReports.vue'))
}

const { canManage: hasManagePermission } = useOrthodontics()
const overview = ref(null)
const loading = ref(true)
const blocked = ref(null)
const tab = ref(TABS.some(item => item.value === props.initialTab) ? props.initialTab : TABS[0].value)
const dirty = ref(false)
const leaveDialog = ref(false)
const pendingTab = ref(null)
const refreshKey = ref(0)
let lastTab = tab.value

// The server decides (permission + case); the stored permission list only
// hides buttons early.
const canManage = computed(() => !!overview.value?.can_manage && hasManagePermission.value !== false)

watch(dirty, v => emit('dirty', v))

// Ask before leaving a tab with unsaved work.
watch(tab, (next, prev) => {
  if (next === lastTab) return
  if (dirty.value) {
    pendingTab.value = next
    tab.value = prev
    leaveDialog.value = true
    return
  }
  lastTab = next
})

function confirmLeave () {
  leaveDialog.value = false
  dirty.value = false
  lastTab = pendingTab.value
  tab.value = pendingTab.value
}

function goTab (next) { tab.value = next }

async function reloadOverview () {
  try {
    overview.value = (await orthoApi.overview(props.caseId)).data
  } catch (_) { /* keep the last summary */ }
}

async function load () {
  loading.value = true
  blocked.value = null
  try {
    overview.value = (await orthoApi.overview(props.caseId)).data
  } catch (e) {
    const code = e?.response?.data?.code
    blocked.value = {
      type: code === 'orthodontics_not_eligible' || code === 'orthodontics_disabled' ? 'info' : 'error',
      message: code === 'orthodontics_not_eligible' ? t('workspace.notEligible') : orthoError(e)
    }
  } finally {
    loading.value = false
  }
}

function beforeUnload (e) {
  if (dirty.value) { e.preventDefault(); e.returnValue = '' }
}

onMounted(() => {
  load()
  window.addEventListener('beforeunload', beforeUnload)
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnload)
  releaseObjectUrls(props.caseId)
})

defineExpose({ isDirty: () => dirty.value })
</script>

<style scoped>
.ow-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)), #1e88a8);
}
.ow-sub { color: rgba(255, 255, 255, 0.85); }
.ow-tabs :deep(.v-tab) { text-transform: none; letter-spacing: 0; }
</style>
