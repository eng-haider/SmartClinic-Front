<template>
  <v-container fluid class="py-6">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span class="text-h6">قوالب الرسائل</span>
        <v-btn color="primary" @click="openCreateDialog">إضافة قالب</v-btn>
      </v-card-title>
      <v-divider />

      <v-card-text>
        <v-skeleton-loader v-if="store.loading" type="table" />

        <template v-else>
          <v-data-table
            :headers="headers"
            :items="store.templates"
            item-value="id"
          >
            <template #item.is_active="{ item }">
              <v-chip :color="item.is_active ? 'success' : 'grey'" size="small">
                {{ item.is_active ? 'مفعّل' : 'معطّل' }}
              </v-chip>
            </template>

            <template #item.actions="{ item }">
              <div class="d-flex ga-2">
                <v-btn size="small" variant="text" color="primary" @click="openEditDialog(item)">
                  تعديل
                </v-btn>
                <v-btn size="small" variant="text" color="info" @click="openPreview(item)">
                  Preview
                </v-btn>
                <v-btn size="small" variant="text" color="error" @click="openDeleteDialog(item)">
                  حذف
                </v-btn>
              </div>
            </template>

            <template #no-data>
              <div class="text-center py-8 text-medium-emphasis">لا توجد قوالب حالياً.</div>
            </template>
          </v-data-table>
        </template>
      </v-card-text>
    </v-card>

    <v-dialog v-model="editorDialog" max-width="800">
      <v-card>
        <v-card-title>{{ isEditMode ? 'تعديل قالب' : 'إضافة قالب' }}</v-card-title>
        <v-card-text>
          <v-form ref="form" @submit.prevent="saveTemplate">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.key"
                  label="Key"
                  :disabled="isEditMode"
                  :rules="[requiredRule]"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.name"
                  label="Name"
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

              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.language"
                  :items="languageOptions"
                  label="Language"
                  :rules="[requiredRule]"
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  ref="bodyTextarea"
                  v-model="formData.body"
                  label="Body"
                  rows="6"
                  :rules="[requiredRule]"
                  variant="outlined"
                  @click="captureCursor"
                  @keyup="captureCursor"
                />
              </v-col>

              <v-col cols="12">
                <v-chip-group>
                  <v-chip
                    v-for="variable in variables"
                    :key="variable"
                    size="small"
                    color="primary"
                    variant="outlined"
                    @click="insertVariable(variable)"
                  >
                    {{ variable }}
                  </v-chip>
                </v-chip-group>
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="formData.is_active"
                  label="تفعيل القالب"
                  color="success"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="editorDialog = false">إلغاء</v-btn>
          <v-btn
            v-if="isEditMode"
            color="info"
            variant="tonal"
            :loading="store.previewLoading"
            @click="previewCurrent"
          >
            Preview
          </v-btn>
          <v-btn color="primary" :loading="store.saving" @click="saveTemplate">حفظ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="previewDialog" max-width="600">
      <v-card>
        <v-card-title>معاينة القالب</v-card-title>
        <v-card-text>
          <div class="preview-box">{{ previewText || 'لا يوجد نص للمعاينة' }}</div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn color="primary" variant="text" @click="previewDialog = false">إغلاق</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title>تأكيد الحذف</v-card-title>
        <v-card-text>هل تريد حذف القالب {{ selectedTemplate?.name }}؟</v-card-text>
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
import { computed, onMounted, ref } from 'vue'
import { useMessagingTemplatesStore } from '@/stores/messaging/templatesStore'

const store = useMessagingTemplatesStore()
const form = ref(null)
const bodyTextarea = ref(null)

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Key', key: 'key' },
  { title: 'Channel', key: 'channel' },
  { title: 'Language', key: 'language' },
  { title: 'Active', key: 'is_active' },
  { title: 'Actions', key: 'actions', sortable: false }
]

const channelOptions = ['whatsapp', 'email', 'push']
const languageOptions = ['ar', 'en']
const variables = [
  '{{patient_name}}',
  '{{patient_phone}}',
  '{{doctor_name}}',
  '{{case_name}}',
  '{{case_date}}',
  '{{case_notes}}',
  '{{clinic_name}}'
]

const editorDialog = ref(false)
const previewDialog = ref(false)
const deleteDialog = ref(false)

const selectedTemplate = ref(null)
const cursorPosition = ref(0)

const formData = ref(defaultForm())

const snackbar = ref({ show: false, message: '', color: 'error' })

const isEditMode = computed(() => !!selectedTemplate.value?.id)
const previewText = computed(() => store.preview)

const requiredRule = (v) => !!v || 'هذا الحقل مطلوب'

function defaultForm() {
  return {
    key: '',
    name: '',
    channel: 'whatsapp',
    language: 'ar',
    body: '',
    is_active: true
  }
}

function notify(message, color = 'error') {
  snackbar.value = { show: true, message, color }
}

function captureCursor(event) {
  cursorPosition.value = event?.target?.selectionStart ?? formData.value.body.length
}

function insertVariable(variable) {
  const body = formData.value.body || ''
  const start = cursorPosition.value
  formData.value.body = `${body.slice(0, start)}${variable}${body.slice(start)}`
  cursorPosition.value = start + variable.length
}

function openCreateDialog() {
  selectedTemplate.value = null
  formData.value = defaultForm()
  editorDialog.value = true
}

function openEditDialog(item) {
  selectedTemplate.value = item
  formData.value = {
    key: item.key,
    name: item.name,
    channel: item.channel,
    language: item.language,
    body: item.body,
    is_active: !!item.is_active
  }
  editorDialog.value = true
}

async function saveTemplate() {
  const validation = await form.value?.validate()
  if (!validation?.valid) return

  try {
    if (isEditMode.value) {
      await store.updateTemplate(selectedTemplate.value.id, formData.value)
      notify('تم تحديث القالب بنجاح', 'success')
    } else {
      await store.createTemplate(formData.value)
      notify('تم إنشاء القالب بنجاح', 'success')
    }
    editorDialog.value = false
  } catch (error) {
    notify(error.message)
  }
}

async function openPreview(item) {
  selectedTemplate.value = item
  await previewCurrent()
}

async function previewCurrent() {
  if (!selectedTemplate.value?.id) {
    notify('المعاينة متاحة فقط للقوالب المحفوظة')
    return
  }

  try {
    await store.previewTemplate(selectedTemplate.value.id)
    previewDialog.value = true
  } catch (error) {
    notify(error.message)
  }
}

function openDeleteDialog(item) {
  selectedTemplate.value = item
  deleteDialog.value = true
}

async function confirmDelete() {
  try {
    await store.deleteTemplate(selectedTemplate.value.id)
    deleteDialog.value = false
    notify('تم حذف القالب', 'success')
  } catch (error) {
    notify(error.message)
  }
}

onMounted(async () => {
  try {
    await store.fetchTemplates()
  } catch (error) {
    notify(error.message)
  }
})
</script>

<style scoped>
.preview-box {
  white-space: pre-wrap;
  line-height: 1.7;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 10px;
  padding: 12px;
}
</style>
