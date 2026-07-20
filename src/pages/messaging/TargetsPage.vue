<template>
  <v-container fluid class="py-6">
    <v-card>
      <v-card-title class="text-h6">متابعة الأهداف الآلية</v-card-title>
      <v-divider />

      <v-card-text>
        <v-row class="mb-2">
          <v-col cols="12" md="4">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="الحالة"
              variant="outlined"
              clearable
              @update:model-value="applyFilters"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filters.patient_id"
              label="Patient ID"
              type="number"
              variant="outlined"
              clearable
              @change="applyFilters"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filters.rule_id"
              label="Rule ID"
              type="number"
              variant="outlined"
              clearable
              @change="applyFilters"
            />
          </v-col>
        </v-row>

        <v-skeleton-loader v-if="store.loading" type="table" />

        <v-data-table v-else :headers="headers" :items="enrichedTargets" item-value="id">
          <template #item.scheduled_for="{ item }">
            {{ formatDate(item.scheduled_for) }}
          </template>

          <template #item.status="{ item }">
            <v-chip size="small" :color="statusColor(item.status)">{{ item.status }}</v-chip>
          </template>

          <template #item.error="{ item }">
            <v-tooltip v-if="item.error" location="top">
              <template #activator="{ props }">
                <v-icon v-bind="props" color="error" size="20">mdi-alert-circle</v-icon>
              </template>
              <span>{{ item.error }}</span>
            </v-tooltip>
            <span v-else>-</span>
          </template>

          <template #item.actions="{ item }">
            <v-btn
              v-if="item.status === 'pending'"
              size="small"
              color="warning"
              variant="tonal"
              :loading="store.cancelling"
              @click="cancel(item.id)"
            >
              Cancel
            </v-btn>
          </template>

          <template #no-data>
            <div class="text-center py-8 text-medium-emphasis">لا توجد بيانات أهداف حالياً.</div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="bottom end" timeout="4000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useMessagingTargetsStore } from '@/stores/messaging/targetsStore'
import { useMessagingRulesStore } from '@/stores/messaging/rulesStore'

const store = useMessagingTargetsStore()
const rulesStore = useMessagingRulesStore()

const filters = ref({
  status: '',
  patient_id: '',
  rule_id: ''
})

const snackbar = ref({ show: false, message: '', color: 'error' })

const statusOptions = ['pending', 'sent', 'failed', 'cancelled']

const headers = [
  { title: 'Patient ID', key: 'patient_id' },
  { title: 'Rule Name', key: 'rule_name' },
  { title: 'Scheduled For', key: 'scheduled_for' },
  { title: 'Status', key: 'status' },
  { title: 'Attempts', key: 'attempt_count' },
  { title: 'Error', key: 'error', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false }
]

const rulesMap = computed(() => {
  return Object.fromEntries(rulesStore.rules.map((rule) => [rule.id, rule.name]))
})

const enrichedTargets = computed(() => {
  return store.targets.map((target) => ({
    ...target,
    rule_name: rulesMap.value[target.rule_id] || `#${target.rule_id || '-'}`
  }))
})

function notify(message, color = 'error') {
  snackbar.value = { show: true, message, color }
}

function statusColor(status) {
  if (status === 'pending') return 'warning'
  if (status === 'sent') return 'success'
  if (status === 'failed') return 'error'
  if (status === 'cancelled') return 'grey'
  return 'grey'
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('ar')
}

async function applyFilters() {
  try {
    store.setFilters(filters.value)
    await store.fetchTargets()
  } catch (error) {
    notify(error.message)
  }
}

async function cancel(id) {
  try {
    await store.cancelTarget(id)
    notify('تم إلغاء الهدف بنجاح', 'success')
  } catch (error) {
    notify(error.message)
  }
}

onMounted(async () => {
  try {
    await Promise.all([rulesStore.fetchRules(), store.fetchTargets()])
  } catch (error) {
    notify(error.message)
  }
})
</script>
