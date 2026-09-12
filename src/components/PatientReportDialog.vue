<template>
  <v-dialog v-model="internalDialog" :max-width="isPhone ? undefined : 900" :fullscreen="isPhone" scrollable>
    <!-- Always light: the report is a printable document, never dark-themed -->
    <v-card theme="light" :rounded="isPhone ? 0 : 'xl'" class="report-dialog">
      <!-- Header -->
      <v-card-title class="d-flex align-center justify-space-between pa-4 report-toolbar">
        <span class="text-white text-h6 d-flex align-center ga-2">
          <v-icon>mdi-file-document-multiple-outline</v-icon>
          {{ $t('report.title') }}
        </span>
        <v-btn icon="mdi-close" variant="text" color="white" @click="handleClose" />
      </v-card-title>

      <v-card-text class="pa-4 report-scroll">
        <!-- ===== Printable / exportable report sheet ===== -->
        <div ref="reportContent" class="report-sheet" :class="{ 'is-phone': isPhone }" :dir="isRtl ? 'rtl' : 'ltr'">
          <!-- Accent bar -->
          <div class="sheet-accent"></div>

          <!-- Clinic + report header -->
          <div class="sheet-head">
            <div class="clinic-block">
              <div class="clinic-logo">
                <img v-if="clinicLogo" :src="clinicLogo" alt="logo" class="logo-img" />
                <div v-else class="logo-fallback">
                  <v-icon size="40" color="primary">mdi-hospital-building</v-icon>
                </div>
              </div>
              <div class="clinic-text">
                <h1 class="clinic-name">{{ clinicName }}</h1>
                <p v-if="clinicAddress" class="clinic-line">
                  <v-icon size="13">mdi-map-marker</v-icon> {{ clinicAddress }}
                </p>
                <p v-if="clinicPhone" class="clinic-line" dir="ltr">
                  <v-icon size="13">mdi-phone</v-icon> {{ clinicPhone }}
                </p>
              </div>
            </div>
            <div class="report-badge">
              <div class="report-badge-title">{{ $t('report.subtitle') }}</div>
              <div class="report-badge-id">#{{ patient?.id || '—' }}</div>
              <div class="report-badge-date" dir="ltr">{{ currentDate }}</div>
            </div>
          </div>

          <!-- Patient info -->
          <div class="section-label">
            <v-icon size="16">mdi-account-circle-outline</v-icon>
            {{ $t('report.patientInfo') }}
          </div>
          <div class="patient-grid">
            <div class="pg-item pg-name">
              <span class="pg-label">{{ $t('bill.patient_name') }}</span>
              <span class="pg-value">{{ patient?.name || '—' }}</span>
            </div>
            <div class="pg-item">
              <span class="pg-label">{{ $t('report.age') }}</span>
              <span class="pg-value">{{ patientAge }}</span>
            </div>
            <div class="pg-item">
              <span class="pg-label">{{ $t('report.gender') }}</span>
              <span class="pg-value">
                <span class="gender-chip" :class="genderClass">{{ sexLabel }}</span>
              </span>
            </div>
            <div class="pg-item" v-if="patient?.phone">
              <span class="pg-label">{{ $t('bill.phone') }}</span>
              <span class="pg-value" dir="ltr">{{ patient.phone }}</span>
            </div>
            <div class="pg-item" v-if="patient?.address">
              <span class="pg-label">{{ $t('report.address') }}</span>
              <span class="pg-value">{{ patient.address }}</span>
            </div>
            <div class="pg-item" v-if="patient?.note || patient?.notes">
              <span class="pg-label">{{ $t('report.notes') }}</span>
              <span class="pg-value">{{ patient.note || patient.notes }}</span>
            </div>
          </div>

          <!-- Stat cards -->
          <div class="stats-row">
            <div class="stat-card stat-primary">
              <div class="stat-num">{{ totalCases }}</div>
              <div class="stat-cap">{{ $t('report.totalCases') }}</div>
            </div>
            <div class="stat-card stat-info">
              <div class="stat-num">{{ formatCurrency(totalAmount) }}</div>
              <div class="stat-cap">{{ $t('report.totalAmount') }}</div>
            </div>
            <div class="stat-card stat-success">
              <div class="stat-num">{{ formatCurrency(totalPaid) }}</div>
              <div class="stat-cap">{{ $t('report.paid') }}</div>
            </div>
            <div class="stat-card stat-warning">
              <div class="stat-num">{{ formatCurrency(totalRemaining) }}</div>
              <div class="stat-cap">{{ $t('report.remaining') }}</div>
            </div>
          </div>

          <!-- Teeth chart (dental, when available) -->
          <template v-if="hasTeeth">
            <div class="section-label">
              <v-icon size="16">mdi-tooth-outline</v-icon>
              {{ $t('report.dentalChart') }}
            </div>
            <div class="teeth-wrap">
              <TeethChart
                v-if="hasPermanentTeeth"
                :patient-data="{ tooth_details: toothDetails }"
                :show-color-picker="false"
                :patient-cases="[]"
                :categories="[]"
              />
              <TeethChart
                v-if="hasBabyTeeth"
                dentition="primary"
                :patient-data="{ tooth_details: toothDetails }"
                :show-color-picker="false"
                :patient-cases="[]"
                :categories="[]"
              />

              <!-- Color legend + simple stats -->
              <div v-if="uniqueColors.length" class="color-legend">
                <div v-for="col in uniqueColors" :key="col.color" class="legend-item">
                  <span class="legend-dot" :style="{ backgroundColor: col.color }"></span>
                  <span class="legend-name">{{ col.name }}</span>
                  <span class="legend-count">{{ col.count }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- Medical cases -->
          <div class="section-label">
            <v-icon size="16">mdi-clipboard-text-outline</v-icon>
            {{ $t('report.medicalCases') }}
          </div>

          <!-- Desktop / tablet (and the exported image): table -->
          <table class="report-table cases-table">
            <thead>
              <tr>
                <th>{{ $t('report.category') }}</th>
                <th>{{ $t('report.tooth') }}</th>
                <th>{{ $t('report.doctor') }}</th>
                <th>{{ $t('report.status') }}</th>
                <th class="num">{{ $t('report.price') }}</th>
                <th class="num">{{ $t('report.paid') }}</th>
                <th>{{ $t('report.date') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in cases" :key="c.id">
                <td>{{ caseCategoryName(c) }}</td>
                <td>{{ formatToothLabel(c.tooth_num) || '—' }}</td>
                <td>{{ c.doctor?.name || '—' }}</td>
                <td>
                  <span class="status-pill" :class="caseDone(c) ? 'is-done' : 'is-pending'">
                    {{ caseDone(c) ? $t('common.completed') : $t('common.pending') }}
                  </span>
                </td>
                <td class="num" dir="ltr">{{ formatNum(c.price) }}</td>
                <td class="num" dir="ltr">{{ formatNum(casePaid(c)) }}</td>
                <td dir="ltr">{{ formatDate(c.case_date || c.created_at) }}</td>
              </tr>
              <tr v-if="!cases.length">
                <td colspan="7" class="empty-row">{{ $t('report.noCases') }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Phone: one card per case -->
          <div class="case-cards">
            <div v-for="c in cases" :key="c.id" class="case-card">
              <div class="cc-head">
                <span class="cc-cat">{{ caseCategoryName(c) }}</span>
                <span class="status-pill" :class="caseDone(c) ? 'is-done' : 'is-pending'">
                  {{ caseDone(c) ? $t('common.completed') : $t('common.pending') }}
                </span>
              </div>
              <div class="cc-grid">
                <div class="cc-item">
                  <span class="cc-label">{{ $t('report.tooth') }}</span>
                  <span class="cc-val">{{ formatToothLabel(c.tooth_num) || '—' }}</span>
                </div>
                <div class="cc-item">
                  <span class="cc-label">{{ $t('report.doctor') }}</span>
                  <span class="cc-val">{{ c.doctor?.name || '—' }}</span>
                </div>
                <div class="cc-item">
                  <span class="cc-label">{{ $t('report.price') }}</span>
                  <span class="cc-val" dir="ltr">{{ formatNum(c.price) }}</span>
                </div>
                <div class="cc-item">
                  <span class="cc-label">{{ $t('report.paid') }}</span>
                  <span class="cc-val cc-paid" dir="ltr">{{ formatNum(casePaid(c)) }}</span>
                </div>
                <div class="cc-item cc-span">
                  <span class="cc-label">{{ $t('report.date') }}</span>
                  <span class="cc-val" dir="ltr">{{ formatDate(c.case_date || c.created_at) }}</span>
                </div>
              </div>
            </div>
            <div v-if="!cases.length" class="empty-row">{{ $t('report.noCases') }}</div>
          </div>

          <!-- Case images -->
          <template v-if="images.length">
            <div class="section-label">
              <v-icon size="16">mdi-image-multiple-outline</v-icon>
              {{ $t('report.caseImages') }}
            </div>
            <div class="img-grid">
              <div v-for="img in images" :key="img.id" class="img-cell">
                <img :src="img.url" class="case-img" alt="case image" />
              </div>
            </div>
          </template>

          <!-- Financial summary -->
          <div class="section-label">
            <v-icon size="16">mdi-cash-multiple</v-icon>
            {{ $t('report.financialSummary') }}
          </div>
          <div class="finance-box">
            <div class="finance-row">
              <span>{{ $t('report.totalAmount') }}</span>
              <span dir="ltr">{{ formatCurrency(totalAmount) }}</span>
            </div>
            <div class="finance-row finance-paid">
              <span>{{ $t('report.paid') }}</span>
              <span dir="ltr">{{ formatCurrency(totalPaid) }}</span>
            </div>
            <div class="finance-row finance-total">
              <span>{{ $t('report.remaining') }}</span>
              <span dir="ltr">{{ formatCurrency(totalRemaining) }}</span>
            </div>
          </div>

          <!-- Paid bills -->
          <template v-if="bills.length">
            <div class="section-label">
              <v-icon size="16">mdi-cash-check</v-icon>
              {{ $t('report.paidBills') }}
            </div>
            <table class="report-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{{ $t('report.category') }}</th>
                  <th>{{ $t('report.date') }}</th>
                  <th class="num">{{ $t('report.amount') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="b in bills" :key="b.id">
                  <td dir="ltr">{{ b.id }}</td>
                  <td>{{ billCategoryName(b) }}</td>
                  <td dir="ltr">{{ formatDate(b.bill_date || b.created_at) }}</td>
                  <td class="num" dir="ltr">{{ formatNum(b.price) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bills-total-row">
                  <td colspan="3">{{ $t('report.paid') }}</td>
                  <td class="num" dir="ltr">{{ formatNum(totalPaid) }} IQD</td>
                </tr>
              </tfoot>
            </table>
          </template>

          <!-- Footer -->
          <div class="sheet-footer">
            <p class="footer-thanks">{{ $t('bill.thank_you') }}</p>
            <p class="footer-stamp" dir="ltr">{{ currentDateTime }}</p>
          </div>
        </div>
      </v-card-text>

      <v-divider />

      <!-- Actions -->
      <v-card-actions class="pa-4 d-flex flex-wrap ga-2 justify-center report-actions">
        <v-btn color="primary" variant="tonal" prepend-icon="mdi-printer" :loading="printing" @click="printReport">
          {{ $t('report.print') }}
        </v-btn>
        <v-btn color="success" variant="tonal" prepend-icon="mdi-image-outline" :loading="savingImage" @click="saveAsImage">
          {{ $t('report.saveImage') }}
        </v-btn>
        <v-btn color="teal" variant="flat" prepend-icon="mdi-whatsapp" :loading="sharing" elevation="2" class="wa-btn" @click.stop="shareViaWhatsApp">
          {{ $t('report.shareWhatsapp') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import TeethChart from '@/components/teeth/TeethChart.vue'
import { isBabyToothNumber } from '@/components/teeth/toothNotation'
import { useClinicSettings, resolveLogoUrl } from '@/composables/useClinicSettings'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  patient: { type: Object, default: null },
  cases: { type: Array, default: () => [] },
  bills: { type: Array, default: () => [] },
  images: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] },
  clinicSettings: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'close'])
const { t, locale } = useI18n()
const { width } = useDisplay()
const isPhone = computed(() => width.value < 600)
const { loadSettings, toothConditionColors, clinicInfo: sharedClinic, formatToothLabel } = useClinicSettings()

onMounted(() => { loadSettings() })

const reportContent = ref(null)
const printing = ref(false)
const savingImage = ref(false)
const sharing = ref(false)

const internalDialog = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const isRtl = computed(() => locale.value === 'ar' || locale.value === 'ku')

/* ---------- Clinic ---------- */
// Prop first, then the shared clinic settings, so the header renders
// even when the parent did not pass anything down.
const clinicName = computed(() =>
  props.clinicSettings?.name || props.clinicSettings?.clinic_name ||
  sharedClinic.value.name || '')
const clinicAddress = computed(() =>
  props.clinicSettings?.address || props.clinicSettings?.clinic_address ||
  sharedClinic.value.address || '')
const clinicPhone = computed(() =>
  props.clinicSettings?.phone || props.clinicSettings?.clinic_phone ||
  sharedClinic.value.phone || '')
const clinicLogo = computed(() => {
  const logo = props.clinicSettings?.logo || props.clinicSettings?.clinic_logo ||
    sharedClinic.value.logo
  return resolveLogoUrl(logo) || null
})

/* ---------- Patient ---------- */
const patientAge = computed(() => {
  const bd = props.patient?.birth_date
  if (!bd) return '—'
  const today = new Date()
  const birth = new Date(bd)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return `${age} ${t('report.years')}`
})

// Robust gender detection — handles number (1/2), string ('1'/'male'), boolean, etc.
const sexValue = computed(() => props.patient?.sex ?? props.patient?.gender)
const isMale = computed(() => {
  const s = sexValue.value
  if (s === undefined || s === null || s === '') return false
  const v = String(s).toLowerCase()
  return v === '1' || v === 'male' || v === 'm' || v === 'true' || v === 'ذكر'
})
const sexKnown = computed(() => sexValue.value !== undefined && sexValue.value !== null && sexValue.value !== '')
const sexLabel = computed(() => {
  if (!sexKnown.value) return '—'
  return isMale.value ? t('patients.male') : t('patients.female')
})
const genderClass = computed(() => !sexKnown.value ? 'g-unknown' : (isMale.value ? 'g-male' : 'g-female'))

const toothDetails = computed(() => props.patient?.tooth_details || props.patient?.tooth_parts || [])
const hasTeeth = computed(() => Array.isArray(toothDetails.value) && toothDetails.value.length > 0)
/* Baby teeth use FDI 51-85, so a patient can have both charts worth of data */
const hasBabyTeeth = computed(() => toothDetails.value.some(d => isBabyToothNumber(d.tooth_number)))
const hasPermanentTeeth = computed(() => toothDetails.value.some(d => !isBabyToothNumber(d.tooth_number)))

/* Resolve a tooth color hex -> readable condition name (from clinic settings) */
const getColorName = (color) => {
  if (!color) return '—'
  const norm = String(color).toLowerCase()
  const match = (toothConditionColors.value || []).find(tc => String(tc.color || '').toLowerCase() === norm)
  return match ? match.name : color
}

/* Each used color with its count -> the legend / simple stats under the chart */
const uniqueColors = computed(() => {
  const map = new Map()
  toothDetails.value.forEach(d => {
    const c = String(d.color || '').toLowerCase()
    if (c) map.set(c, (map.get(c) || 0) + 1)
  })
  return Array.from(map.entries()).map(([color, count]) => ({ color, count, name: getColorName(color) }))
})

/* ---------- Totals ---------- */
const totalCases = computed(() => props.cases.length)
const totalAmount = computed(() => props.cases.reduce((s, c) => s + (Number(c.price) || 0), 0))
const totalPaid = computed(() => props.bills.reduce((s, b) => s + (Number(b.price) || 0), 0))
const totalRemaining = computed(() => Math.max(0, totalAmount.value - totalPaid.value))

/* ---------- Case helpers ---------- */
const caseCategoryName = (c) => {
  const cat = c.category || props.categories.find(x => x.id === (c.case_categores_id || c.category_id))
  if (!cat) return '—'
  if (locale.value === 'ar') return cat.name_ar || cat.name || cat.name_en || '—'
  if (locale.value === 'ku') return cat.name_ku || cat.name_en || cat.name || '—'
  return cat.name_en || cat.name || '—'
}

const caseDone = (c) => {
  const s = c.status
  if (s && typeof s === 'object') return s.id === 3
  if (typeof s === 'number') return s === 3
  if (typeof s === 'string') return s === '3' || s === 'completed'
  return false
}

const casePaid = (c) => (c.bills || []).reduce((s, b) => s + (Number(b.price) || 0), 0)

/* Category label for a paid bill (falls back to the case it belongs to) */
const billCategoryName = (b) => {
  const cat = b.billable?.category
  if (!cat) {
    if (b.billable?.tooth_num) return `${t('report.tooth')} ${formatToothLabel(b.billable.tooth_num)}`
    return '—'
  }
  if (locale.value === 'ar') return cat.name_ar || cat.name || cat.name_en || '—'
  if (locale.value === 'ku') return cat.name_ku || cat.name_en || cat.name || '—'
  return cat.name_en || cat.name || '—'
}

/* ---------- Formatters ---------- */
const formatNum = (v) => {
  if (!v && v !== 0) return '—'
  return new Intl.NumberFormat('en-US').format(v)
}
const formatCurrency = (v) => `${new Intl.NumberFormat('en-US').format(v || 0)} IQD`
const formatDate = (d) => {
  if (!d) return '—'
  try {
    const dt = new Date(d)
    const day = String(dt.getDate()).padStart(2, '0')
    const mon = String(dt.getMonth() + 1).padStart(2, '0')
    return `${day}/${mon}/${dt.getFullYear()}`
  } catch { return '—' }
}
const currentDate = computed(() =>
  new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))
const currentDateTime = computed(() =>
  new Date().toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }))

/* ---------- Export core ---------- */
const EXPORT_WIDTH = 820   // fixed desktop width -> wide & short shared image
const EXPORT_SCALE = 2     // 2x for crisp, high-resolution output

const renderToDataUrl = async () => {
  // Wait until the report element is actually mounted (v-dialog renders lazily)
  let tries = 0
  while (!reportContent.value && tries < 30) { await new Promise(r => setTimeout(r, 50)); tries++ }
  if (!reportContent.value) throw new Error('Report element not ready')

  const domtoimage = await import('dom-to-image-more')
  await document.fonts.ready
  await new Promise(r => setTimeout(r, 350))

  // Render from an OFF-SCREEN CLONE forced to the desktop layout & a fixed width.
  // This keeps the shared image wide/short/high-res even when captured on a phone,
  // and the on-screen report never flickers.
  const clone = reportContent.value.cloneNode(true)
  clone.classList.remove('is-phone')
  clone.style.width = `${EXPORT_WIDTH}px`
  clone.style.maxWidth = 'none'
  clone.style.margin = '0'
  clone.style.position = 'fixed'
  clone.style.top = '0'
  clone.style.left = '-10000px'
  clone.style.colorScheme = 'only light'
  clone.style.background = '#ffffff'
  document.body.appendChild(clone)

  try {
    await new Promise(r => setTimeout(r, 60)) // let the clone lay out
    const height = clone.getBoundingClientRect().height || clone.scrollHeight
    return await domtoimage.toPng(clone, {
      quality: 1,
      bgcolor: '#ffffff',
      width: EXPORT_WIDTH * EXPORT_SCALE,
      height: height * EXPORT_SCALE,
      style: {
        transform: `scale(${EXPORT_SCALE})`,
        transformOrigin: 'top left',
        width: `${EXPORT_WIDTH}px`,
        height: `${height}px`,
        fontFamily: "'Cairo', Arial, Tahoma, sans-serif",
      },
    })
  } finally {
    document.body.removeChild(clone)
  }
}

// Build the report image as a shareable File
const buildShareFile = async () => {
  const dataUrl = await renderToDataUrl()
  const blob = await (await fetch(dataUrl)).blob()
  return new File([blob], `${fileName.value}.png`, { type: 'image/png' })
}

// Pre-render the image as soon as the dialog opens, so the WhatsApp/native share
// can be triggered SYNCHRONOUSLY on tap (mobile browsers drop the user-gesture
// permission if you do heavy async work before calling navigator.share()).
const cachedShareFile = ref(null)
watch(() => props.modelValue, async (open) => {
  cachedShareFile.value = null
  if (!open) return
  await nextTick()
  try { cachedShareFile.value = await buildShareFile() } catch (e) { /* will render on demand */ }
})

const handleClose = () => {
  internalDialog.value = false
  emit('close')
}

const fileName = computed(() =>
  `report-${(props.patient?.name || 'patient').replace(/\s+/g, '-')}-${props.patient?.id || ''}`)

const saveAsImage = async () => {
  savingImage.value = true
  try {
    const dataUrl = await renderToDataUrl()
    const link = document.createElement('a')
    link.download = `${fileName.value}.png`
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (e) {
    console.error('Save image error:', e)
    alert(t('errors.saveFailed') || 'Error saving image')
  } finally {
    savingImage.value = false
  }
}

const printReport = async () => {
  printing.value = true
  try {
    const dataUrl = await renderToDataUrl()
    const w = window.open('', '_blank', 'width=900,height=1000')
    if (!w) { alert(t('bill.popup_blocked') || 'Please allow popups for printing'); return }
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${t('report.title')}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}
      body{display:flex;justify-content:center;background:#fff}
      img{width:100%;max-width:900px;height:auto}
      @media print{@page{margin:8mm}}</style></head>
      <body><img src="${dataUrl}" /></body></html>`)
    w.document.close()
    w.onload = () => setTimeout(() => { w.print(); w.close() }, 400)
  } catch (e) {
    console.error('Print error:', e)
  } finally {
    printing.value = false
  }
}

const shareText = () => `${t('report.subtitle')} - ${props.patient?.name || ''}`

const shareViaWhatsApp = async () => {
  // FAST PATH — image already rendered: call share() synchronously so the mobile
  // user-gesture is still valid and the picture is attached to the WhatsApp chat.
  const ready = cachedShareFile.value
  if (ready && navigator.canShare && navigator.canShare({ files: [ready] })) {
    try {
      await navigator.share({ files: [ready], title: t('report.title'), text: shareText() })
      return
    } catch (err) {
      if (err?.name === 'AbortError') return
    }
  }

  // SLOW PATH — cache not ready yet (build it), then try native share, else fall back.
  sharing.value = true
  try {
    const file = cachedShareFile.value || await buildShareFile()

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: t('report.title'), text: shareText() })
        return
      } catch (err) {
        if (err?.name === 'AbortError') return
      }
    }

    // Desktop fallback: copy the image to clipboard (or download), then open the chat.
    let copied = false
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': file })])
      copied = true
    } catch {
      const url = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    let phone = (props.patient?.phone || '').replace(/\D/g, '')
    if (phone.startsWith('0')) phone = phone.substring(1)
    if (phone && !phone.startsWith('964')) phone = '964' + phone
    window.open(phone ? `https://wa.me/${phone}` : 'https://wa.me/', '_blank')

    alert(copied
      ? (t('bill.paste_image_instruction') || 'Report image copied! Open WhatsApp and press Ctrl+V to paste it.')
      : (t('bill.image_downloaded_share') || 'Report image downloaded. Attach it in WhatsApp.'))
  } catch (e) {
    console.error('Share error:', e)
    alert(t('errors.shareFailed') || 'Failed to share the report')
  } finally {
    sharing.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');

/* color-scheme: only light -> stops Chrome / Android WebView "Auto Dark Theme"
   from force-darkening the report on devices with OS dark mode enabled. */
.report-dialog {
  font-family: 'Cairo', 'Arial', 'Segoe UI', Tahoma, sans-serif;
  color-scheme: only light;
  background: #ffffff;
}
.report-toolbar { background: linear-gradient(135deg, #1976d2, #42a5f5); }
.report-scroll { background: #eef2f7; color-scheme: only light; }

/* ===== Sheet ===== */
.report-sheet {
  position: relative;
  max-width: 820px;
  margin: 0 auto;
  background: #fff;
  border-radius: 16px;
  padding: 28px 30px 22px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  color: #2b3445;
  color-scheme: only light;
  font-family: 'Cairo', 'Arial', Tahoma, sans-serif;
}
.report-sheet * { font-family: inherit !important; }
.sheet-accent {
  position: absolute;
  top: 0; inset-inline-start: 0; right: 0; left: 0;
  height: 7px;
  background: linear-gradient(90deg, #1976d2, #42a5f5, #26c6da);
}

/* ===== Header ===== */
.sheet-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.clinic-block { display: flex; align-items: center; gap: 14px; }
.logo-img { width: 64px; height: 64px; object-fit: contain; border-radius: 12px; }
.logo-fallback {
  width: 64px; height: 64px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; background: #e3f2fd;
}
.clinic-name { font-size: 20px; font-weight: 800; color: #1565c0; margin-bottom: 3px; }
.clinic-line {
  font-size: 12px; color: #6b7480; display: flex; align-items: center; gap: 4px; margin-bottom: 1px;
}
.report-badge {
  text-align: center; padding: 10px 18px; border-radius: 12px; color: #fff;
  background: linear-gradient(135deg, #1976d2, #42a5f5); min-width: 130px;
}
.report-badge-title { font-size: 13px; font-weight: 700; }
.report-badge-id { font-size: 16px; font-weight: 800; margin-top: 2px; }
.report-badge-date { font-size: 11px; opacity: 0.9; margin-top: 2px; }

/* ===== Section label ===== */
.section-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 14px; font-weight: 700; color: #1565c0;
  margin: 22px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #e3f0fb;
}

/* ===== Patient grid ===== */
.patient-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
  background: #f6f9fc; border: 1px solid #e7eef5; border-radius: 12px; padding: 14px;
}
.pg-item { display: flex; flex-direction: column; gap: 2px; }
.pg-name { grid-column: span 1; }
.pg-label { font-size: 11px; color: #8a93a0; font-weight: 600; }
.pg-value { font-size: 14px; color: #2b3445; font-weight: 700; }
.gender-chip {
  display: inline-block; padding: 2px 14px; border-radius: 20px;
  font-size: 12.5px; font-weight: 700;
}
.g-male { background: #e3f2fd; color: #1565c0; }
.g-female { background: #fce4ec; color: #c2185b; }
.g-unknown { background: #eceff1; color: #607d8b; }
/* Align values (incl. the dir="ltr" phone) to the sheet's reading side */
.report-sheet[dir="rtl"] .pg-label,
.report-sheet[dir="rtl"] .pg-value { text-align: right; }
.report-sheet[dir="ltr"] .pg-label,
.report-sheet[dir="ltr"] .pg-value { text-align: left; }

/* ===== Stats ===== */
.stats-row {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 18px;
}
.stat-card {
  border-radius: 14px; padding: 14px 10px; text-align: center; color: #fff;
}
.stat-num { font-size: 18px; font-weight: 800; line-height: 1.2; }
.stat-cap { font-size: 11px; opacity: 0.95; margin-top: 4px; font-weight: 600; }
.stat-primary { background: linear-gradient(135deg, #1976d2, #42a5f5); }
.stat-info    { background: linear-gradient(135deg, #0097a7, #26c6da); }
.stat-success { background: linear-gradient(135deg, #2e7d32, #66bb6a); }
.stat-warning { background: linear-gradient(135deg, #ef6c00, #ffa726); }

/* ===== Teeth ===== */
.teeth-wrap { padding: 8px; border: 1px solid #e7eef5; border-radius: 12px; }
.teeth-wrap :deep(.teeth-chart) { pointer-events: none; }

/* Color legend / simple stats under the chart */
.color-legend {
  display: flex; flex-wrap: wrap; gap: 8px;
  margin-top: 12px; padding-top: 12px; border-top: 1px dashed #e0e7ef;
}
.legend-item {
  display: flex; align-items: center; gap: 6px;
  background: #f6f9fc; border: 1px solid #e7eef5; border-radius: 20px;
  padding: 4px 12px; font-size: 12.5px; font-weight: 600; color: #4a5460;
}
.legend-dot {
  width: 14px; height: 14px; border-radius: 50%;
  border: 1.5px solid rgba(0, 0, 0, 0.12); flex-shrink: 0;
}
.legend-name { color: #2b3445; }
.legend-count {
  background: #1976d2; color: #fff; border-radius: 12px;
  min-width: 20px; text-align: center; padding: 0 6px; font-size: 11px; font-weight: 700;
}

/* ===== Table ===== */
.report-table { width: 100%; border-collapse: collapse; font-size: 12.5px; overflow: hidden; border-radius: 10px; }
.report-table thead th {
  background: #1976d2; color: #fff; font-weight: 700; padding: 9px 8px; text-align: start;
}
.report-table .num { text-align: end; }
/* Right-align the whole table for RTL (ar/ku) */
.report-sheet[dir="rtl"] .report-table th,
.report-sheet[dir="rtl"] .report-table td { text-align: right; }

/* Case images grid */
.img-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.img-cell {
  border: 1px solid #e7eef5; border-radius: 10px; overflow: hidden; aspect-ratio: 1; background: #f6f9fc;
}
.case-img { width: 100%; height: 100%; object-fit: cover; display: block; }
@media (max-width: 700px) { .img-grid { grid-template-columns: repeat(3, 1fr); } }
.report-table tbody td { padding: 9px 8px; border-bottom: 1px solid #eceff3; word-break: break-word; }
.report-table tbody tr:nth-child(even) { background: #f8fbfe; }
.empty-row { text-align: center; color: #9aa3af; padding: 16px !important; }
.status-pill { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }
.status-pill.is-done { background: #e8f5e9; color: #2e7d32; }
.status-pill.is-pending { background: #fff3e0; color: #ef6c00; }

/* ===== Case cards (shown on phone only; hidden by default & in the export) ===== */
.case-cards { display: none; flex-direction: column; gap: 10px; }
.case-card {
  border: 1px solid #e7eef5; border-radius: 12px; padding: 12px;
  background: #fff; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.cc-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #f0f3f7;
}
.cc-cat { font-size: 14px; font-weight: 800; color: #1565c0; word-break: break-word; }
.cc-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 12px; }
.cc-item { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.cc-item.cc-span { grid-column: 1 / -1; }
.cc-label { font-size: 10px; color: #8a93a0; font-weight: 600; }
.cc-val { font-size: 13px; color: #2b3445; font-weight: 700; word-break: break-word; }
.cc-paid { color: #2e7d32; }
.report-sheet[dir="rtl"] .cc-item { text-align: right; }
.report-table tfoot .bills-total-row td {
  background: #eef6ff; font-weight: 800; color: #1565c0; border-top: 2px solid #cfe0f0;
}
.report-table tfoot .bills-total-row td:first-child { text-align: end; }

/* ===== Finance ===== */
.finance-box {
  background: #f6f9fc; border: 1px solid #e7eef5; border-radius: 12px; padding: 14px 16px;
}
.finance-row {
  display: flex; justify-content: space-between; font-size: 14px; padding: 5px 0; font-weight: 600; color: #4a5460;
}
.finance-row.finance-paid { color: #2e7d32; }
.finance-row.finance-total {
  font-size: 17px; font-weight: 800; color: #1565c0;
  border-top: 2px dashed #cfe0f0; margin-top: 6px; padding-top: 10px;
}

/* ===== Footer ===== */
.sheet-footer { text-align: center; margin-top: 22px; padding-top: 14px; border-top: 1px dashed #d4dce5; }
.footer-thanks { font-size: 14px; font-weight: 700; color: #1565c0; }
.footer-stamp { font-size: 11px; color: #9aa3af; margin-top: 4px; }

/* ===== WhatsApp button ===== */
.wa-btn :deep(.v-btn__overlay) { pointer-events: none; }

/* =====================================================================
   Phone layout — class-driven (.is-phone) NOT @media, so the off-screen
   export clone can drop the class and render the full desktop layout
   (wide & short) even when captured on a phone.
   ===================================================================== */
.report-sheet.is-phone { padding: 16px 12px; border-radius: 12px; }

/* Header: keep clinic (logo + name) and the report badge on the SAME row */
.report-sheet.is-phone .sheet-head { flex-direction: row; align-items: center; gap: 10px; flex-wrap: nowrap; }
.report-sheet.is-phone .clinic-block { gap: 8px; min-width: 0; flex: 1 1 auto; }
.report-sheet.is-phone .clinic-text { min-width: 0; }
.report-sheet.is-phone .logo-img,
.report-sheet.is-phone .logo-fallback { width: 44px; height: 44px; border-radius: 10px; }
.report-sheet.is-phone .clinic-name {
  font-size: 14px; line-height: 1.25; margin-bottom: 1px;
  overflow: hidden; text-overflow: ellipsis;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.report-sheet.is-phone .clinic-line { font-size: 10px; }
.report-sheet.is-phone .report-badge { min-width: 0; width: auto; flex: 0 0 auto; padding: 8px 12px; }
.report-sheet.is-phone .report-badge-title { font-size: 11px; }
.report-sheet.is-phone .report-badge-id { font-size: 14px; }
.report-sheet.is-phone .report-badge-date { font-size: 9.5px; }

/* Compact info + stats */
.report-sheet.is-phone .patient-grid { grid-template-columns: repeat(2, 1fr); }
.report-sheet.is-phone .stats-row { grid-template-columns: repeat(2, 1fr); }
.report-sheet.is-phone .stat-card { padding: 10px 6px; border-radius: 10px; }
.report-sheet.is-phone .stat-num { font-size: 14px; }
.report-sheet.is-phone .stat-cap { font-size: 9.5px; }
.report-sheet.is-phone .pg-value { font-size: 13px; }

/* Cases: cards instead of the table */
.report-sheet.is-phone .cases-table { display: none; }
.report-sheet.is-phone .case-cards { display: flex; }

/* Remaining tables (e.g. Paid Bills) shrink to fit */
.report-sheet.is-phone .report-table { font-size: 11px; }
.report-sheet.is-phone .report-table thead th,
.report-sheet.is-phone .report-table tbody td,
.report-sheet.is-phone .report-table tfoot td { padding: 6px 5px; }

/* Images + finance + legend */
.report-sheet.is-phone .img-grid { grid-template-columns: repeat(3, 1fr); gap: 6px; }
.report-sheet.is-phone .finance-row { font-size: 12.5px; }
.report-sheet.is-phone .finance-row.finance-total { font-size: 15px; }
.report-sheet.is-phone .legend-item { font-size: 11px; padding: 3px 9px; }

/* ===== Dialog chrome on phones (outside the captured sheet) ===== */
@media (max-width: 600px) {
  .report-scroll { padding: 10px !important; }
  .report-toolbar { padding: 12px !important; }
  .report-toolbar .text-h6 { font-size: 1rem !important; }
  .report-actions { flex-direction: column; }
  .report-actions .v-btn { width: 100%; }
}
</style>
