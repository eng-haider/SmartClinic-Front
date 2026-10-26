<template>
  <v-dialog v-model="open" max-width="900" scrollable>
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary">
        <div class="d-flex align-center gap-2">
          <v-icon color="white">mdi-file-image-outline</v-icon>
          <span class="text-white text-h6">{{ $t('rx.paper.template') }}</span>
        </div>
        <v-btn icon="mdi-close" variant="text" color="white" @click="open = false" />
      </v-card-title>

      <v-card-text class="pa-5">
        <RxPaperSettings :draft="draft" @error="showError" />
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-4">
        <v-btn variant="text" color="error" @click="handleReset">{{ $t('rx.reset_defaults') }}</v-btn>
        <v-spacer />
        <v-btn variant="text" @click="open = false">{{ $t('common.cancel') }}</v-btn>
        <v-btn color="primary" variant="elevated" @click="handleSave">{{ $t('common.save') }}</v-btn>
      </v-card-actions>
    </v-card>

    <v-snackbar v-model="toast.show" color="error" :timeout="3500">{{ toast.message }}</v-snackbar>
  </v-dialog>
</template>

<script setup>
/**
 * The paper form as a dialog, for editing it without leaving a prescription.
 * The same form also lives on its own tab in Settings.
 */

import { reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import RxPaperSettings from './RxPaperSettings.vue'
import { useRxTemplate } from '@/composables/useRxTemplate'
import { DEFAULT_RX_TEMPLATE } from '@/utils/rxPaper'

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { t } = useI18n()
const { template, makeDraft, save, reset } = useRxTemplate()

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

// Edited on a copy so closing without saving leaves the live paper untouched.
const draft = reactive(makeDraft())
const toast = reactive({ show: false, message: '' })

watch(open, (isOpen) => {
  if (isOpen) Object.assign(draft, makeDraft())
})

const showError = (message) => Object.assign(toast, { show: true, message })

const handleSave = () => {
  Object.assign(template, draft)
  if (!save()) {
    // The letterhead was too large for this browser's storage; everything else
    // was kept, so say what was dropped rather than pretending it saved.
    draft.headerImage = ''
    showError(t('rx.paper.storage_full'))
    return
  }
  emit('saved', { ...template })
  open.value = false
}

const handleReset = () => {
  reset()
  Object.assign(draft, DEFAULT_RX_TEMPLATE)
}
</script>
