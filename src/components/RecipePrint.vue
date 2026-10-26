<template>
  <div class="recipe-print">
    <RxTemplateDialog v-model="settingsDialog" />
    <v-snackbar v-model="toast.show" color="error" :timeout="3500">{{ toast.message }}</v-snackbar>
  </div>
</template>

<script setup>
/**
 * Printing surface for a saved prescription. Holds no layout of its own — the
 * sheet comes from rxPaper so print output matches the preview in the editor.
 * Kept headless and driven through the ref (`print()` / `openSettings()`) the
 * patient and prescription pages already call.
 */

import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import RxTemplateDialog from '@/components/prescription/RxTemplateDialog.vue'
import { useRxTemplate } from '@/composables/useRxTemplate'
import { printRxPaper } from '@/utils/rxPaper'
import { linesFromItems } from '@/utils/rxLines'

const props = defineProps({
  recipe: { type: Object, default: null },
  clinicSettings: { type: Object, default: null }
})

const { t, locale } = useI18n()
const { resolved } = useRxTemplate()

const settingsDialog = ref(false)
const toast = reactive({ show: false, message: '' })

const isRtl = computed(() => locale.value === 'ar' || locale.value === 'ku')

const template = computed(() => ({
  ...resolved.value,
  clinicName: resolved.value.clinicName || props.clinicSettings?.name || props.clinicSettings?.clinic_name || '',
  phone: resolved.value.phone || props.clinicSettings?.phone || props.clinicSettings?.clinic_phone || '',
  address: resolved.value.address || props.clinicSettings?.address || props.clinicSettings?.clinic_address || ''
}))

const formatDate = (value) => {
  const date = value ? new Date(value) : new Date()
  return date.toLocaleDateString(locale.value === 'ar' ? 'ar-IQ' : 'en-GB')
}

const print = () => {
  if (!props.recipe) return

  const patient = props.recipe.patient || {}
  const ok = printRxPaper({
    template: template.value,
    patient: { name: patient.name || '', age: patient.age || '', phone: patient.phone || '' },
    doctorName: props.recipe.doctor?.name || template.value.doctorName || '',
    lines: linesFromItems(props.recipe.recipe_items || props.recipe.recipeItems || props.recipe.items),
    notes: props.recipe.notes || '',
    date: formatDate(props.recipe.created_at),
    isRtl: isRtl.value,
    lang: locale.value,
    labels: {
      patient: t('rx.paper.label_patient'),
      age: t('rx.paper.label_age'),
      date: t('rx.paper.label_date'),
      notes: t('rx.paper.label_notes'),
      signature: t('rx.paper.label_signature'),
      prescription: t('rx.prescription')
    }
  })

  if (!ok) Object.assign(toast, { show: true, message: t('rx.paper.popup_blocked') })
}

defineExpose({ print, openSettings: () => { settingsDialog.value = true } })
</script>
