<template>
  <div class="rx-paper-view">
    <div v-if="!hideActions" class="rx-paper-view__bar no-print">
      <v-btn
        :variant="hasHeaderImage ? 'text' : 'tonal'"
        :color="hasHeaderImage ? undefined : 'primary'"
        size="small"
        :prepend-icon="hasHeaderImage ? 'mdi-file-image-outline' : 'mdi-image-plus'"
        @click="$emit('open-template')"
      >
        {{ hasHeaderImage ? $t('rx.paper.template') : $t('rx.paper.add_header_image') }}
      </v-btn>
      <v-spacer />
      <v-btn variant="tonal" size="small" color="primary" prepend-icon="mdi-image-outline" :loading="savingImage" @click="saveImage">
        {{ $t('rx.paper.save_image') }}
      </v-btn>
      <v-btn v-if="canShare" variant="tonal" size="small" color="info" prepend-icon="mdi-share-variant" :loading="sharing" @click="shareImage">
        {{ $t('rx.paper.share') }}
      </v-btn>
      <v-btn variant="elevated" size="small" color="success" prepend-icon="mdi-printer" @click="print">
        {{ $t('rx.print') }}
      </v-btn>
    </div>

    <div class="rx-paper-view__scroll">
      <!-- eslint-disable-next-line vue/no-v-html -- built by rxPaper.js, every value escaped there -->
      <div class="rx-paper-view__host" v-html="markup"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { buildRxPaperCss, buildRxSheetHtml, printRxPaper } from '@/utils/rxPaper'
import { useCardImageExport } from '@/composables/useCardImageExport'

const props = defineProps({
  template: { type: Object, required: true },
  patient: { type: Object, default: () => ({}) },
  doctorName: { type: String, default: '' },
  lines: { type: Array, default: () => [] },
  notes: { type: String, default: '' },
  date: { type: String, default: '' },
  hideActions: { type: Boolean, default: false }
})

const emit = defineEmits(['open-template', 'error'])

const { t, locale } = useI18n()
const { downloadAsImage, elementToBlob } = useCardImageExport()

const savingImage = ref(false)
const sharing = ref(false)

const isRtl = computed(() => locale.value === 'ar' || locale.value === 'ku')
const canShare = computed(() => typeof navigator !== 'undefined' && !!navigator.canShare)
const hasHeaderImage = computed(() => !!props.template?.useImageHeader && !!props.template?.headerImage)

const labels = computed(() => ({
  patient: t('rx.paper.label_patient'),
  age: t('rx.paper.label_age'),
  date: t('rx.paper.label_date'),
  notes: t('rx.paper.label_notes'),
  signature: t('rx.paper.label_signature'),
  prescription: t('rx.prescription')
}))

const sheetOptions = computed(() => ({
  template: props.template,
  patient: props.patient,
  doctorName: props.doctorName,
  lines: props.lines,
  notes: props.notes,
  date: props.date,
  isRtl: isRtl.value,
  labels: labels.value
}))

const markup = computed(() =>
  `<style>${buildRxPaperCss(props.template, isRtl.value)}</style>${buildRxSheetHtml(sheetOptions.value)}`
)

const fileName = computed(() => {
  const who = (props.patient?.name || 'rx').replace(/[^\w؀-ۿ-]+/g, '-')
  return `rx-${who}-${props.date || new Date().toISOString().slice(0, 10)}.png`
})

/**
 * Capture works off a throwaway copy of the sheet rather than the one on
 * screen: the preview is shrunk with CSS `zoom`, and the exporter measures the
 * zoomed box while painting at natural size, which crops the result. A detached
 * copy is always full size and unaffected by whatever the page did to it.
 */
const withOffscreenSheet = async (run) => {
  const holder = document.createElement('div')
  holder.style.cssText = 'position:fixed;top:0;left:-10000px;background:#fff;'
  holder.dir = isRtl.value ? 'rtl' : 'ltr'
  holder.innerHTML = markup.value
  document.body.appendChild(holder)

  try {
    const sheet = holder.querySelector('.rx-paper')
    if (!sheet) return null

    // A letterhead is a data URL, but it still has to decode before painting.
    await Promise.all(
      [...holder.querySelectorAll('img')].map((img) =>
        img.complete ? Promise.resolve() : img.decode().catch(() => {})
      )
    )
    return await run(sheet)
  } finally {
    holder.remove()
  }
}

const print = () => {
  const ok = printRxPaper({ ...sheetOptions.value, lang: locale.value })
  if (!ok) emit('error', t('rx.paper.popup_blocked'))
}

const saveImage = async () => {
  savingImage.value = true
  try {
    await withOffscreenSheet((sheet) => downloadAsImage(sheet, fileName.value, { scale: 2 }))
  } catch {
    emit('error', t('rx.paper.image_failed'))
  } finally {
    savingImage.value = false
  }
}

const shareImage = async () => {
  sharing.value = true
  try {
    await withOffscreenSheet(async (sheet) => {
      const blob = await elementToBlob(sheet, { scale: 2 })
      const file = new File([blob], fileName.value, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: t('rx.prescription') })
      } else {
        // Sharing files isn't offered here — hand over the download instead.
        await downloadAsImage(sheet, fileName.value, { scale: 2 })
      }
    })
  } catch (err) {
    if (err?.name !== 'AbortError') emit('error', t('rx.paper.image_failed'))
  } finally {
    sharing.value = false
  }
}

defineExpose({ print, saveImage, shareImage })
</script>

<style scoped>
.rx-paper-view__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.rx-paper-view__scroll {
  overflow: auto;
  background: #eceff1;
  border-radius: 10px;
  padding: 14px;
}

.rx-paper-view__host :deep(.rx-paper) {
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.12);
}

@media print {
  .no-print { display: none !important; }
}
</style>
