<template>
  <v-row>
    <!-- ── Settings ── -->
    <v-col cols="12" md="7">
      <div class="text-subtitle-2 mb-2">{{ $t('rx.paper.header_title') }}</div>

      <!-- Either a picture of the clinic's letterhead, or the details typed out -->
      <v-btn-toggle
        v-model="draft.useImageHeader"
        mandatory
        density="comfortable"
        variant="outlined"
        color="primary"
        class="mb-4"
      >
        <v-btn :value="false" size="small" prepend-icon="mdi-format-text">{{ $t('rx.paper.header_as_text') }}</v-btn>
        <v-btn :value="true" size="small" prepend-icon="mdi-image">{{ $t('rx.paper.header_as_image') }}</v-btn>
      </v-btn-toggle>

      <!-- ── Picture ── -->
      <template v-if="draft.useImageHeader">
        <div
          class="rx-tpl__drop mb-3"
          :class="{ 'rx-tpl__drop--over': dragging }"
          @click="fileInput?.click()"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="onDrop"
        >
          <img v-if="draft.headerImage" :src="draft.headerImage" class="rx-tpl__drop-img" alt="" />
          <div v-else class="text-center py-5">
            <v-icon size="36" color="primary">mdi-image-plus</v-icon>
            <div class="text-body-2 mt-2">{{ $t('rx.paper.upload_header') }}</div>
            <div class="text-caption text-medium-emphasis">{{ $t('rx.paper.upload_hint') }}</div>
          </div>
          <input ref="fileInput" type="file" accept="image/*" hidden @change="onPick" />
        </div>

        <template v-if="draft.headerImage">
          <div class="d-flex gap-2 mb-2">
            <v-btn size="small" variant="tonal" prepend-icon="mdi-swap-horizontal" @click="fileInput?.click()">
              {{ $t('rx.paper.replace_header') }}
            </v-btn>
            <v-btn size="small" variant="text" color="error" prepend-icon="mdi-delete" @click="draft.headerImage = ''">
              {{ $t('common.delete') }}
            </v-btn>
          </div>

          <div class="text-subtitle-2 mb-1">
            {{ $t('rx.paper.header_height') }}
            <span class="text-medium-emphasis text-caption">({{ draft.headerHeight }} mm)</span>
          </div>
          <v-slider v-model="draft.headerHeight" :min="15" :max="90" :step="1" density="compact" color="primary" hide-details class="mb-2" />
        </template>
      </template>

      <!-- ── Typed details (prefilled from the clinic settings) ── -->
      <template v-else>
        <v-text-field v-model="draft.clinicName" :label="$t('rx.clinic_name')" variant="outlined" density="compact" class="mb-2" />
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field v-model="draft.doctorName" :label="$t('rx.doctor_name')" variant="outlined" density="compact" />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="draft.specialty" :label="$t('rx.specialty')" variant="outlined" density="compact" />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="draft.phone" :label="$t('rx.phone')" variant="outlined" density="compact" dir="ltr" />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="draft.address" :label="$t('rx.address')" variant="outlined" density="compact" />
          </v-col>
        </v-row>
      </template>

      <v-divider class="my-4" />

      <v-row dense>
        <v-col cols="12" sm="6">
          <v-select v-model="draft.paperSize" :items="paperSizes" :label="$t('rx.paper.paper_size')" variant="outlined" density="compact" />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select v-model="draft.fontSize" :items="fontSizes" :label="$t('rx.paper.font_size')" variant="outlined" density="compact" />
        </v-col>
      </v-row>

      <v-text-field v-model="draft.footerNote" :label="$t('rx.paper.footer_note')" variant="outlined" density="compact" class="mb-2" />

      <div class="d-flex gap-4 flex-wrap">
        <v-switch v-model="draft.showPatientRow" :label="$t('rx.paper.show_patient_row')" color="primary" density="compact" hide-details />
        <v-switch v-model="draft.showSignature" :label="$t('rx.paper.show_signature')" color="primary" density="compact" hide-details />
      </div>

      <div class="text-subtitle-2 mt-4 mb-2">{{ $t('rx.primary_color') }}</div>
      <div class="d-flex gap-2 flex-wrap">
        <v-avatar
          v-for="color in colorOptions"
          :key="color"
          size="30"
          :color="color"
          class="cursor-pointer rx-tpl__swatch"
          :class="{ 'rx-tpl__swatch--active': draft.accent === color }"
          @click="draft.accent = color"
        >
          <v-icon v-if="draft.accent === color" color="white" size="15">mdi-check</v-icon>
        </v-avatar>
      </div>
    </v-col>

    <!-- ── Live preview ── -->
    <v-col cols="12" md="5">
      <div class="text-subtitle-2 mb-2">{{ $t('rx.preview') }}</div>
      <RxPaper
        :template="draft"
        :patient="samplePatient"
        :doctor-name="draft.doctorName"
        :lines="sampleLines"
        :date="today"
        hide-actions
        class="rx-tpl__preview"
      />
    </v-col>
  </v-row>
</template>

<script setup>
/**
 * The prescription paper form. Edits a draft the parent owns, so a dialog can
 * throw it away on cancel while the settings page saves it in place.
 */

import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import RxPaper from './RxPaper.vue'
import { useRxTemplate } from '@/composables/useRxTemplate'

const props = defineProps({
  draft: { type: Object, required: true }
})

const emit = defineEmits(['error'])

const { t, locale } = useI18n()
const { prepareHeaderImage } = useRxTemplate()

const colorOptions = ['#17638D', '#1976d2', '#0d47a1', '#00695c', '#2e7d32', '#4527a0', '#37474f', '#000000']

const fileInput = ref(null)
const dragging = ref(false)

const paperSizes = computed(() => [
  { title: `A5 — ${t('rx.paper.size_a5_hint')}`, value: 'A5' },
  { title: 'A4', value: 'A4' }
])

const fontSizes = computed(() => [
  { title: t('rx.paper.font_small'), value: 'small' },
  { title: t('rx.paper.font_normal'), value: 'normal' },
  { title: t('rx.paper.font_large'), value: 'large' }
])

const today = computed(() =>
  new Date().toLocaleDateString(locale.value === 'ar' ? 'ar-IQ' : 'en-GB')
)

const samplePatient = computed(() => ({ name: t('rx.paper.sample_patient'), age: '32' }))
const sampleLines = ['Paramol 500  2x1  × 5 days', 'Amoxil 500  3x1  × 7 days']

const applyFile = async (file) => {
  if (!file) return
  if (!file.type?.startsWith('image/')) { emit('error', t('rx.paper.not_an_image')); return }
  try {
    props.draft.headerImage = await prepareHeaderImage(file)
    props.draft.useImageHeader = true
  } catch {
    emit('error', t('rx.paper.image_failed'))
  }
}

const onPick = (event) => {
  applyFile(event.target.files?.[0])
  event.target.value = ''
}

const onDrop = (event) => {
  dragging.value = false
  applyFile(event.dataTransfer?.files?.[0])
}
</script>

<style scoped>
.rx-tpl__drop {
  border: 2px dashed rgba(var(--v-theme-primary), 0.35);
  border-radius: 12px;
  padding: 10px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.rx-tpl__drop--over {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.06);
}

.rx-tpl__drop-img {
  display: block;
  width: 100%;
  max-height: 160px;
  object-fit: contain;
}

.rx-tpl__swatch { border: 2px solid transparent; }
.rx-tpl__swatch--active { border-color: rgba(0, 0, 0, 0.4); }

.rx-tpl__preview :deep(.rx-paper-view__host) { zoom: 0.62; }
</style>
