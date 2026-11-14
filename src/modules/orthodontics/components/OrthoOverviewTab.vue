<template>
  <div>
    <v-row>
      <v-col v-for="c in cards" :key="c.key" cols="6" md="3">
        <v-card rounded="xl" variant="tonal" :color="c.color" class="pa-3 h-100" @click="$emit('go', c.tab)">
          <div class="d-flex align-center ga-2">
            <v-icon size="28">{{ c.icon }}</v-icon>
            <div>
              <div class="text-h5 font-weight-bold">{{ c.count }}</div>
              <div class="text-caption">{{ c.label }}</div>
            </div>
          </div>
          <div v-if="c.sub" class="text-caption mt-1">{{ c.sub }}</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-2">
      <v-col cols="12" md="6">
        <v-card rounded="xl" variant="outlined">
          <v-card-title class="text-subtitle-1">آخر تحليل سيفالومتري</v-card-title>
          <v-card-text>
            <div v-if="latestCeph" dir="ltr" class="d-flex flex-wrap ga-4">
              <div v-for="k in KEYS" :key="k" class="kv">
                <span class="kv-k">{{ k }}</span>
                <span class="kv-v">{{ val(latestCeph, k) }}</span>
              </div>
            </div>
            <div v-else class="text-medium-emphasis text-body-2">لا يوجد تحليل بعد.</div>
            <div v-if="latestCeph" class="text-caption text-medium-emphasis mt-2">{{ latestCeph.analysis_date }} · {{ latestCeph.status === 'reviewed' ? 'معتمد' : 'مسودة' }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card rounded="xl" variant="outlined">
          <v-card-title class="text-subtitle-1">الخطة العلاجية</v-card-title>
          <v-card-text>
            <template v-if="overview.treatment_plan">
              <v-chip color="primary" variant="tonal" size="small">{{ PLAN_AR[overview.treatment_plan.status] || overview.treatment_plan.status }}</v-chip>
              <span v-if="overview.treatment_plan.start_date" class="text-caption ms-2">البدء: {{ overview.treatment_plan.start_date }}</span>
            </template>
            <div v-else class="text-medium-emphasis text-body-2">لم تُسجَّل خطة بعد.</div>
            <v-btn size="small" variant="text" color="primary" class="mt-2" @click="$emit('go', 'plan')">فتح الخطة</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-alert type="info" variant="tonal" density="compact" class="mt-4">
      أدوات التحليل تحسب القيم هندسياً من نقاط يضعها الطبيب أو يؤكدها، ولم تُعتمد سريرياً كجهاز طبي. يجب أن يراجع الطبيب المختص كل تحليل ويعتمده قبل استخدامه في تقرير نهائي.
      <span v-if="!overview.capabilities?.landmark_detection">الكشف الآلي عن نقاط الأشعة غير مفعّل في هذا التثبيت.</span>
    </v-alert>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { orthoApi } from '../api.js'
import { fmt } from '../utils/format.js'

const props = defineProps({ caseId: { type: [Number, String], required: true }, overview: { type: Object, required: true } })
defineEmits(['go'])
const KEYS = ['SNA', 'SNB', 'ANB', 'wits', 'FMA', 'IMPA', 'interincisal']
const PLAN_AR = { planned: 'مخطط', active: 'قيد العلاج', retention: 'التثبيت', completed: 'مكتمل', discontinued: 'متوقف' }

const latestCeph = ref(null)
const count = t => props.overview.analyses?.[t]?.total || 0
const reviewed = t => props.overview.analyses?.[t]?.reviewed || 0
const cards = computed(() => [
  { key: 'ceph', tab: 'ceph', icon: 'mdi-radiology-box-outline', color: 'primary', label: 'تحليلات Ceph', count: count('ceph'), sub: `${reviewed('ceph')} معتمد` },
  { key: 'cast', tab: 'cast', icon: 'mdi-cube-scan', color: 'indigo', label: 'تحليلات الموديلات', count: count('cast'), sub: `${reviewed('cast')} معتمد` },
  { key: 'cbct', tab: 'cbct', icon: 'mdi-scan-helper', color: 'deep-purple', label: 'دراسات CBCT', count: props.overview.cbct_studies || 0, sub: `${count('cbct')} مجموعة قياسات` },
  { key: 'face', tab: 'face', icon: 'mdi-face-recognition', color: 'teal', label: 'تحليلات الوجه', count: count('face'), sub: `${reviewed('face')} معتمد` }
])
const val = (a, k) => { const m = a.results?.measurements?.[k]; return m && m.value !== null ? `${fmt(m.value)}${m.unit === '°' ? '°' : ' ' + m.unit}` : '—' }

onMounted(async () => {
  try {
    const list = (await orthoApi.analyses(props.caseId, 'ceph')).data || []
    latestCeph.value = list[0] || null
  } catch (_) { /* summary only */ }
})
</script>

<style scoped>
.kv { display: flex; flex-direction: column; align-items: center; min-width: 60px; }
.kv-k { font-size: 11px; opacity: 0.7; }
.kv-v { font-weight: 700; font-size: 16px; }
</style>
