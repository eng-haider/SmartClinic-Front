<template>
  <v-dialog :model-value="modelValue" max-width="780" scrollable @update:model-value="close">
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center ga-2 pt-4">
        <v-icon color="deep-purple">mdi-account-multiple-check</v-icon>
        {{ t('patients.merge.title') }}
      </v-card-title>

      <v-card-text>
        <p class="text-body-2 text-medium-emphasis mb-3">{{ t('patients.merge.hint') }}</p>

        <v-autocomplete
          v-model="otherId"
          v-model:search="search"
          :items="results"
          :loading="searching"
          item-title="name"
          item-value="id"
          :label="t('patients.merge.search')"
          :no-data-text="search ? t('patients.merge.noResults') : t('patients.merge.typeToSearch')"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          no-filter
          clearable
          hide-details
          class="mb-4"
        >
          <template #item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps" :subtitle="[item.raw.phone, item.raw.phone2].filter(Boolean).join(' · ')" />
          </template>
        </v-autocomplete>

        <v-progress-linear v-if="loadingPreview" indeterminate color="deep-purple" class="mb-4" />

        <template v-if="preview">
          <v-row dense>
            <v-col v-for="side in sides" :key="side.key" cols="12" md="6">
              <v-card variant="outlined" rounded="lg" class="h-100" :style="{ borderColor: side.color, borderWidth: '2px' }">
                <v-card-text>
                  <v-chip :color="side.color" size="small" variant="flat" class="mb-2">
                    <v-icon start size="16">{{ side.icon }}</v-icon>{{ side.label }}
                  </v-chip>
                  <div class="text-subtitle-1 font-weight-bold">{{ side.data.name }}</div>
                  <div class="text-body-2 text-medium-emphasis mb-2" dir="ltr" style="text-align: start">
                    {{ [side.data.phone, side.data.phone2].filter(Boolean).join(' · ') || '-' }}
                  </div>
                  <div v-for="row in summaryRows(side.data)" :key="row.label" class="d-flex justify-space-between text-body-2 py-1">
                    <span class="text-medium-emphasis">{{ row.label }}</span>
                    <span class="font-weight-medium">{{ row.value }}</span>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <div class="d-flex justify-center my-2">
            <v-btn variant="text" color="deep-purple" prepend-icon="mdi-swap-horizontal" :disabled="merging" @click="swap">
              {{ t('patients.merge.swap') }}
            </v-btn>
          </div>

          <v-alert type="info" variant="tonal" density="compact" class="mb-2">{{ t('patients.merge.explain') }}</v-alert>
          <v-alert type="warning" variant="tonal" density="compact" class="mb-2">{{ t('patients.merge.irreversible') }}</v-alert>
          <v-checkbox v-model="confirmed" :label="t('patients.merge.confirm')" color="deep-purple" hide-details />
        </template>

        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-3">{{ error }}</v-alert>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" :disabled="merging" @click="close(false)">{{ t('common.cancel') }}</v-btn>
        <v-btn color="deep-purple" variant="flat" :loading="merging" :disabled="!preview || !confirmed" @click="merge">
          {{ t('patients.merge.action') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import patientService from '@/services/patient.service'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // The patient page this was opened from; kept by default
  patient: { type: Object, required: true }
})

const emit = defineEmits(['update:modelValue', 'merged'])
const { t } = useI18n()

const search = ref('')
const results = ref([])
const searching = ref(false)
const otherId = ref(null)
const keepId = ref(null)
const preview = ref(null)
const loadingPreview = ref(false)
const confirmed = ref(false)
const merging = ref(false)
const error = ref('')

const sides = computed(() => [
  { key: 'keep', data: preview.value.keep, label: t('patients.merge.keep'), color: 'success', icon: 'mdi-check-circle' },
  { key: 'merge', data: preview.value.merge, label: t('patients.merge.remove'), color: 'error', icon: 'mdi-call-merge' }
])

const number = value => Number(value || 0).toLocaleString('en-US')

const summaryRows = data => [
  { label: t('patients.merge.cases'), value: number(data.cases) },
  { label: t('patients.merge.bills'), value: `${number(data.bills)} (${number(data.paid)})` },
  { label: t('patients.merge.reservations'), value: number(data.reservations) },
  { label: t('patients.merge.images'), value: number(data.images) },
  { label: t('patients.merge.created'), value: data.created_at || '-' }
]

const errorMessage = err => err?.response?.data?.message_ar || err?.response?.data?.message || t('patients.merge.error')

// Server-side search by name or phone; the open patient is never offered
let searchTimer = null
watch(search, value => {
  clearTimeout(searchTimer)
  if (!value || value.length < 2 || results.value.some(p => p.name === value)) return
  searchTimer = setTimeout(async () => {
    searching.value = true
    try {
      const res = await patientService.getAll({ search: value, per_page: 10 })
      results.value = (res?.data || []).filter(p => p.id !== props.patient.id)
    } catch {
      results.value = []
    } finally {
      searching.value = false
    }
  }, 300)
})

watch(otherId, id => {
  keepId.value = props.patient.id
  loadPreview(id)
})

async function loadPreview(id) {
  preview.value = null
  confirmed.value = false
  error.value = ''
  if (!id) return
  loadingPreview.value = true
  try {
    const mergeId = keepId.value === id ? props.patient.id : id
    const res = await patientService.mergePreview(keepId.value, mergeId)
    preview.value = res.data
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loadingPreview.value = false
  }
}

// Keep the other record instead
function swap() {
  keepId.value = keepId.value === props.patient.id ? otherId.value : props.patient.id
  loadPreview(otherId.value)
}

async function merge() {
  merging.value = true
  error.value = ''
  try {
    await patientService.merge(preview.value.keep.id, preview.value.merge.id)
    emit('merged', preview.value.keep.id)
    close(false)
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    merging.value = false
  }
}

function close(value) {
  if (value) return
  emit('update:modelValue', false)
  search.value = ''
  results.value = []
  otherId.value = null
  preview.value = null
  confirmed.value = false
  error.value = ''
}
</script>
