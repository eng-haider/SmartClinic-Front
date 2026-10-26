<template>
  <v-dialog :model-value="modelValue" max-width="600" @update:model-value="close">
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between pa-4 bg-success">
        <div class="d-flex align-center ga-2">
          <v-icon color="white" size="28">mdi-whatsapp</v-icon>
          <span class="text-white">{{ $t('patients.send_whatsapp') }}</span>
        </div>
        <div class="d-flex align-center">
          <!-- Each clinic keeps its own templates on the messaging templates page -->
          <v-btn
            v-if="canManageTemplates"
            icon="mdi-playlist-edit"
            variant="text"
            color="white"
            @click="goToTemplates"
          >
            <v-icon>mdi-playlist-edit</v-icon>
            <v-tooltip activator="parent" location="bottom">{{ $t('patients.manage_templates') }}</v-tooltip>
          </v-btn>
          <v-btn icon="mdi-close" variant="text" color="white" @click="close(false)" />
        </div>
      </v-card-title>

      <v-card-text class="pa-6">
        <!-- Patient Info -->
        <v-alert v-if="patient" type="info" variant="tonal" class="mb-4">
          <div class="d-flex align-center ga-3">
            <v-avatar :color="avatarColor" size="40">
              <span class="text-white">{{ initials }}</span>
            </v-avatar>
            <div>
              <div class="font-weight-medium">{{ patient.name }}</div>
              <div class="text-caption" dir="ltr">{{ patient.phone }}</div>
            </div>
          </div>
        </v-alert>

        <!-- Clinic's own templates -->
        <div v-if="templatesLoading || clinicTemplates.length" class="mb-4">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="text-subtitle-2">{{ $t('patients.clinic_templates') }}</div>
            <v-btn
              v-if="canManageTemplates"
              size="x-small"
              variant="text"
              color="primary"
              prepend-icon="mdi-pencil-outline"
              @click="goToTemplates"
            >
              {{ $t('patients.manage_templates') }}
            </v-btn>
          </div>
          <v-progress-linear v-if="templatesLoading" indeterminate color="success" class="mb-2" />
          <v-chip-group v-else v-model="selectedTemplate" column mandatory>
            <v-chip
              v-for="template in clinicTemplates"
              :key="template.id"
              :value="template.id"
              filter
              color="success"
              variant="outlined"
              @click="selectTemplate(template)"
            >
              {{ template.title }}
            </v-chip>
          </v-chip-group>
        </div>

        <!-- Built-in suggestions -->
        <div class="mb-4">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="text-subtitle-2">
              {{ clinicTemplates.length ? $t('patients.suggested_templates') : $t('patients.message_templates') }}
            </div>
            <v-btn
              v-if="canManageTemplates && !clinicTemplates.length && !templatesLoading"
              size="x-small"
              variant="text"
              color="primary"
              prepend-icon="mdi-plus"
              @click="goToTemplates"
            >
              {{ $t('patients.manage_templates') }}
            </v-btn>
          </div>
          <v-chip-group v-model="selectedTemplate" column mandatory>
            <v-chip
              v-for="template in defaultTemplates"
              :key="template.id"
              :value="template.id"
              filter
              variant="outlined"
              @click="selectTemplate(template)"
            >
              {{ template.title }}
            </v-chip>
          </v-chip-group>
        </div>

        <!-- Custom Message -->
        <v-textarea
          v-model="message"
          :label="$t('patients.message')"
          variant="outlined"
          rows="6"
          auto-grow
          prepend-inner-icon="mdi-message-text"
          :hint="$t('patients.message_hint')"
          persistent-hint
        />

        <!-- Character Count -->
        <div class="text-caption text-right text-grey mt-1">
          {{ message.length }} {{ $t('patients.characters') }}
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="close(false)">
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn
          color="success"
          variant="elevated"
          prepend-icon="mdi-whatsapp"
          :disabled="!message || !patient?.phone"
          @click="send"
        >
          {{ $t('patients.send') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
/**
 * WhatsApp message dialog with template suggestions.
 *
 * Two template sources:
 *  - the clinic's own templates (messaging templates page, `{{variable}}`
 *    syntax, rendered here with the patient / case / clinic values), and
 *  - the built-in i18n suggestions.
 *
 * Pass the patient ({ id, name, phone, public_token? }) and optionally the
 * case ({ category, doctor, case_date, notes }) for the case variables.
 * Emits `sent` after WhatsApp is opened and `error` when the phone/message is
 * missing, so the page can show its own snackbar.
 */
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useClinicSettings } from '@/composables/useClinicSettings'
import { usePermissions } from '@/composables/usePermissions'
import { useMessagingTemplatesStore } from '@/stores/messaging/templatesStore'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  patient: { type: Object, default: null },
  caseData: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'sent', 'error'])

const { t } = useI18n()
const router = useRouter()
const { clinicName } = useClinicSettings()
const { hasAnyPermissionFor } = usePermissions()
const templatesStore = useMessagingTemplatesStore()

const message = ref('')
const selectedTemplate = ref(null)
const templatesLoading = ref(false)
let templatesLoaded = false

// Same keywords the messaging templates route is guarded with.
const canManageTemplates = computed(() => hasAnyPermissionFor(['message', 'template', 'automation']))

// The clinic's own name for patient-facing messages, with a neutral wording
// (never the product name) when the clinic has not set one yet.
const whatsappClinicName = computed(() => clinicName.value || t('patients.clinic_name'))

const patientName = computed(() => props.patient?.name || '')

const initials = computed(() => {
  const name = patientName.value
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
})

const avatarColor = computed(() => {
  const colors = ['primary', 'secondary', 'success', 'warning', 'info', 'error']
  const name = patientName.value
  return colors[name ? name.charCodeAt(0) % colors.length : 0]
})

// ==================== Clinic templates ====================

// Variable map mirroring the backend TemplateEngine so a template renders the
// same here as it does in automated messages.
const templateVariables = computed(() => {
  const c = props.caseData
  return {
    patient_name: patientName.value,
    patient_phone: props.patient?.phone || '',
    clinic_name: whatsappClinicName.value,
    profile_url: profileUrl(),
    case_name: c?.category?.name || '',
    case_date: c?.case_date ? String(c.case_date).slice(0, 10) : '',
    case_notes: c?.notes || '',
    doctor_name: c?.doctor?.name || ''
  }
})

function renderTemplate(body) {
  return String(body || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) =>
    key in templateVariables.value ? templateVariables.value[key] : match
  )
}

const clinicTemplates = computed(() =>
  (templatesStore.templates || [])
    .filter(tpl => tpl.is_active && (!tpl.channel || tpl.channel === 'whatsapp'))
    .map(tpl => ({ id: `clinic-${tpl.id}`, title: tpl.name, text: renderTemplate(tpl.body) }))
)

async function loadClinicTemplates() {
  if (templatesLoaded) return
  templatesLoading.value = true
  try {
    await templatesStore.fetchTemplates()
    templatesLoaded = true
  } catch (err) {
    // Clinics without the messaging module simply see the built-in suggestions.
    console.warn('Failed to load clinic message templates', err)
  } finally {
    templatesLoading.value = false
  }
}

function goToTemplates() {
  close(false)
  router.push({ name: 'Settings', query: { tab: 'whatsappTemplates' } })
}

// ==================== Built-in suggestions ====================

// Public profile link for the patient (used by both template sources).
function profileUrl() {
  const patient = props.patient
  if (!patient) return ''
  const frontendBaseUrl = window.location.origin
  return patient.public_token
    ? `${frontendBaseUrl}/public/patient/${patient.public_token}`
    : `${frontendBaseUrl}/public/patient/patient-${patient.id}`
}

function generateProfileLinkMessage() {
  if (!props.patient) return ''
  return t('patients.template_profile_link_text', {
    name: props.patient.name,
    clinic: whatsappClinicName.value,
    url: profileUrl()
  })
}

const defaultTemplates = computed(() => [
  {
    id: 'default-reminder',
    title: t('patients.template_reminder'),
    text: t('patients.template_reminder_text', { name: patientName.value, clinic: whatsappClinicName.value })
  },
  { id: 'default-followup', title: t('patients.template_followup'), text: t('patients.template_followup_text', { name: patientName.value }) },
  { id: 'default-checkup', title: t('patients.template_checkup'), text: t('patients.template_checkup_text', { name: patientName.value }) },
  { id: 'default-results', title: t('patients.template_results'), text: t('patients.template_results_text', { name: patientName.value }) },
  { id: 'default-profile', title: t('patients.template_profile_link'), text: generateProfileLinkMessage() },
  { id: 'default-greeting', title: t('patients.template_greeting'), text: t('patients.template_greeting_text', { name: patientName.value }) }
])

function selectTemplate(template) {
  if (!template?.text) return
  selectedTemplate.value = template.id
  message.value = template.text
}

// Every open starts from the first available template for the current patient:
// the clinic's own first, otherwise the first built-in suggestion.
watch(() => props.modelValue, async (open) => {
  if (!open) return
  selectTemplate(defaultTemplates.value[0])
  await loadClinicTemplates()
  if (clinicTemplates.value.length) selectTemplate(clinicTemplates.value[0])
})

function close(value = false) {
  emit('update:modelValue', value)
}

function send() {
  if (!props.patient?.phone || !message.value) {
    emit('error')
    return
  }

  // Iraq numbers: strip formatting, swap the leading 0 for the country code.
  let phone = props.patient.phone.replace(/\D/g, '')
  if (!phone.startsWith('964')) {
    phone = '964' + (phone.startsWith('0') ? phone.substring(1) : phone)
  }

  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message.value)}`, '_blank')
  emit('sent')
  close(false)
}
</script>
