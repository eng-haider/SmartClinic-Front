<template>
  <v-container fluid class="py-6">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span class="text-h6">قواعد الأتمتة</span>
        <v-btn color="primary" @click="openCreateDialog">إضافة قاعدة</v-btn>
      </v-card-title>
      <v-divider />

      <v-card-text>
        <v-skeleton-loader v-if="store.loading" type="table" />

        <v-data-table v-else :headers="headers" :items="store.rules" item-value="id">
          <template #item.trigger_type="{ item }">
            <v-chip size="small" variant="tonal">{{ item.trigger_type }}</v-chip>
          </template>

          <template #item.delay_info="{ item }">
            <span>{{ delayInfo(item) }}</span>
          </template>

          <template #item.is_active="{ item }">
            <v-chip
              size="small"
              :color="item.is_active ? 'success' : 'grey'"
              @click="openEditDialog(item)"
            >
              {{ item.is_active ? 'مفعّل' : 'معطّل' }}
            </v-chip>
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex ga-2 flex-wrap">
              <v-btn size="small" color="primary" variant="text" @click="openEditDialog(item)">
                تعديل
              </v-btn>
              <v-btn
                v-if="item.trigger_type === 'manual'"
                size="small"
                color="info"
                variant="text"
                @click="openManualTriggerDialog(item)"
              >
                Manual Trigger
              </v-btn>
              <v-btn size="small" color="error" variant="text" @click="openDeleteDialog(item)">
                حذف
              </v-btn>
            </div>
          </template>

          <template #no-data>
            <div class="text-center py-8 text-medium-emphasis">لا توجد قواعد أتمتة حالياً.</div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="editorDialog" max-width="860">
      <v-card>
        <v-card-title>{{ isEditMode ? 'تعديل قاعدة' : 'إنشاء قاعدة' }}</v-card-title>
        <v-card-text>
          <v-form ref="form" @submit.prevent="saveRule">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="formData.name" label="Name" :rules="[requiredRule]" variant="outlined" />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.trigger_type"
                  label="Trigger Type"
                  :items="triggerOptions"
                  :rules="[requiredRule]"
                  variant="outlined"
                />
              </v-col>

              <v-col v-if="showDelayFields" cols="12" md="6">
                <v-text-field v-model.number="formData.delay_days" type="number" label="Delay Days" variant="outlined" />
              </v-col>

              <v-col v-if="showDelayFields" cols="12" md="6">
                <v-text-field v-model.number="formData.delay_minutes" type="number" label="Delay Minutes" variant="outlined" />
              </v-col>

              <v-col v-if="formData.trigger_type === 'custom_date'" cols="12" md="6">
                <v-text-field v-model="formData.exact_datetime" type="datetime-local" label="Exact Datetime" variant="outlined" />
              </v-col>

              <v-col v-if="formData.trigger_type === 'periodic'" cols="12" md="6">
                <v-text-field
                  v-model.number="formData.periodic_interval_days"
                  type="number"
                  label="Periodic Interval Days"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="formData.template_key"
                  :items="templateItems"
                  item-title="name"
                  item-value="key"
                  label="Template Key"
                  :rules="[requiredRule]"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.channel"
                  :items="channelOptions"
                  label="Channel"
                  :rules="[requiredRule]"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-switch v-model="formData.is_active" label="مفعّلة" color="success" />
              </v-col>

              <v-col cols="12">
                <v-expansion-panels>
                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      Advanced: Conditions (optional)
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-row>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model.number="conditionFields.category_id"
                            type="number"
                            label="category_id"
                            variant="outlined"
                          />
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model.number="conditionFields.status_id"
                            type="number"
                            label="status_id"
                            variant="outlined"
                          />
                        </v-col>
                      </v-row>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="editorDialog = false">إلغاء</v-btn>
          <v-btn color="primary" :loading="store.saving" @click="saveRule">حفظ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="manualDialog" max-width="480">
      <v-card>
        <v-card-title>Manual Trigger</v-card-title>
        <v-card-text>
          <v-form ref="manualForm" @submit.prevent="submitManualTrigger">
            <v-text-field
              v-model.number="manualTriggerData.patient_id"
              type="number"
              label="Patient ID"
              :rules="[requiredRule]"
              variant="outlined"
            />
            <v-text-field
              v-model.number="manualTriggerData.case_id"
              type="number"
              label="Case ID (optional)"
              variant="outlined"
            />
            <v-text-field
              v-model="manualTriggerData.scheduled_for"
              type="datetime-local"
              label="Scheduled For"
              variant="outlined"
            />
          </v-form>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="manualDialog = false">إلغاء</v-btn>
          <v-btn color="primary" :loading="store.triggering" @click="submitManualTrigger">Trigger</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title>تأكيد الحذف</v-card-title>
        <v-card-text>هل تريد حذف القاعدة {{ selectedRule?.name }}؟</v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="deleteDialog = false">إلغاء</v-btn>
          <v-btn color="error" :loading="store.deleting" @click="confirmDelete">حذف</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="bottom end" timeout="4000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useMessagingRulesStore } from '@/stores/messaging/rulesStore'

const store = useMessagingRulesStore()
const form = ref(null)
const manualForm = ref(null)

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Trigger', key: 'trigger_type' },
  { title: 'Channel', key: 'channel' },
  { title: 'Delay/Schedule info', key: 'delay_info', sortable: false },
  { title: 'Active', key: 'is_active' },
  { title: 'Actions', key: 'actions', sortable: false }
]

const triggerOptions = ['case_created', 'case_completed', 'manual', 'custom_date', 'periodic']
const channelOptions = ['whatsapp', 'email', 'push']

const editorDialog = ref(false)
const deleteDialog = ref(false)
const manualDialog = ref(false)

const selectedRule = ref(null)
const formData = ref(defaultForm())
const conditionFields = ref({ category_id: null, status_id: null })
const manualTriggerData = ref({ patient_id: null, case_id: null, scheduled_for: '' })

const snackbar = ref({ show: false, message: '', color: 'error' })

const requiredRule = (v) => !!v || 'هذا الحقل مطلوب'
const isEditMode = computed(() => !!selectedRule.value?.id)
const showDelayFields = computed(() => ['case_created', 'case_completed'].includes(formData.value.trigger_type))
const templateItems = computed(() => store.templates)

function defaultForm() {
  return {
    name: '',
    trigger_type: 'case_created',
    delay_days: 0,
    delay_minutes: 0,
    exact_datetime: '',
    periodic_interval_days: null,
    is_periodic: false,
    template_key: '',
    channel: 'whatsapp',
    is_active: true,
    conditions_json: null
  }
}

watch(
  () => formData.value.trigger_type,
  (value) => {
    formData.value.is_periodic = value === 'periodic'
  }
)

function notify(message, color = 'error') {
  snackbar.value = { show: true, message, color }
}

function delayInfo(item) {
  if (['case_created', 'case_completed'].includes(item.trigger_type)) {
    return `${item.delay_days || 0} يوم / ${item.delay_minutes || 0} دقيقة`
  }
  if (item.trigger_type === 'custom_date') return item.exact_datetime || '-'
  if (item.trigger_type === 'periodic') return `كل ${item.periodic_interval_days || 0} يوم`
  return 'Manual trigger'
}

function openCreateDialog() {
  selectedRule.value = null
  formData.value = defaultForm()
  conditionFields.value = { category_id: null, status_id: null }
  editorDialog.value = true
}

function openEditDialog(item) {
  selectedRule.value = item
  formData.value = {
    ...defaultForm(),
    ...item,
    is_active: !!item.is_active
  }
  conditionFields.value = {
    category_id: item?.conditions_json?.category_id ?? null,
    status_id: item?.conditions_json?.status_id ?? null
  }
  editorDialog.value = true
}

function buildConditionsJson() {
  const payload = {}
  if (conditionFields.value.category_id) payload.category_id = conditionFields.value.category_id
  if (conditionFields.value.status_id) payload.status_id = conditionFields.value.status_id
  return Object.keys(payload).length ? payload : null
}

async function saveRule() {
  const validation = await form.value?.validate()
  if (!validation?.valid) return

  const payload = {
    ...formData.value,
    conditions_json: buildConditionsJson()
  }

  try {
    if (isEditMode.value) {
      await store.updateRule(selectedRule.value.id, payload)
      notify('تم تحديث القاعدة', 'success')
    } else {
      await store.createRule(payload)
      notify('تم إنشاء القاعدة', 'success')
    }
    editorDialog.value = false
  } catch (error) {
    notify(error.message)
  }
}

function openDeleteDialog(item) {
  selectedRule.value = item
  deleteDialog.value = true
}

async function confirmDelete() {
  try {
    await store.deleteRule(selectedRule.value.id)
    deleteDialog.value = false
    notify('تم حذف القاعدة', 'success')
  } catch (error) {
    notify(error.message)
  }
}

function openManualTriggerDialog(item) {
  selectedRule.value = item
  manualTriggerData.value = { patient_id: null, case_id: null, scheduled_for: '' }
  manualDialog.value = true
}

async function submitManualTrigger() {
  const validation = await manualForm.value?.validate()
  if (!validation?.valid) return

  try {
    await store.triggerRule(
      selectedRule.value.id,
      manualTriggerData.value.patient_id,
      manualTriggerData.value.case_id,
      manualTriggerData.value.scheduled_for || null
    )
    manualDialog.value = false
    notify('تم تنفيذ trigger بنجاح', 'success')
  } catch (error) {
    notify(error.message)
  }
}

onMounted(async () => {
  try {
    await Promise.all([store.fetchRules(), store.fetchTemplates()])
  } catch (error) {
    notify(error.message)
  }
})
</script>
