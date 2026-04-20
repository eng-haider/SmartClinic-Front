<template>
  <div class="rx-preview" :data-theme="activeTheme">
    <!-- Toolbar -->
    <div class="rx-preview__toolbar no-print">
      <!-- Row 1: Header templates + actions -->
      <div class="rx-preview__toolbar-row">
        <v-btn-toggle v-model="headerTemplate" mandatory density="compact" variant="outlined" color="primary">
          <v-btn value="minimal" size="small">{{ $t('rx.template_minimal') }}</v-btn>
          <v-btn value="classic" size="small">{{ $t('rx.template_classic') }}</v-btn>
          <v-btn value="modern" size="small">{{ $t('rx.template_modern') }}</v-btn>
        </v-btn-toggle>

        <div class="d-flex gap-2">
          <v-btn variant="tonal" color="grey" size="small" prepend-icon="mdi-cog" @click="$emit('open-settings')">
            {{ $t('rx.settings') }}
          </v-btn>
          <v-btn variant="elevated" color="primary" size="small" prepend-icon="mdi-file-pdf-box" @click="exportPdf">
            {{ $t('rx.export_pdf') }}
          </v-btn>
          <v-btn variant="elevated" color="success" size="small" prepend-icon="mdi-printer" @click="printRx">
            {{ $t('rx.print') }}
          </v-btn>
        </div>
      </div>

      <!-- Row 2: Theme switcher -->
      <div class="rx-preview__themes">
        <span class="rx-preview__themes-label">
          <v-icon size="16" class="me-1">mdi-palette</v-icon>
          {{ $t('rx.theme') }}
        </span>
        <div class="rx-preview__theme-pills">
          <button
            v-for="th in themes"
            :key="th.id"
            class="rx-preview__theme-pill"
            :class="{ 'rx-preview__theme-pill--active': activeTheme === th.id }"
            :style="{ background: th.swatch, borderColor: activeTheme === th.id ? th.accent : 'transparent' }"
            :title="$t('rx.theme_' + th.id)"
            @click="activeTheme = th.id"
          >
            <span class="rx-preview__theme-dot" :style="{ background: th.accent }"></span>
            <span class="rx-preview__theme-name">{{ $t('rx.theme_' + th.id) }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Preview Canvas with themed background -->
    <div class="rx-preview__canvas">
      <div class="rx-preview__bg-pattern"></div>
      <div class="rx-preview__bg-glow"></div>
      <div ref="rxSheetRef" class="rx-preview__sheet" :class="{ 'rx-preview__sheet--rtl': isRtl }" :data-theme="activeTheme">
        <RxHeader
          :template="headerTemplate"
          :logo="settings.logo"
          :clinic-name="settings.clinicName"
          :doctor-name="settings.doctorName"
          :specialty="settings.specialty"
          :phone="settings.phone"
          :address="settings.address"
        />

        <PatientInfo
          :name="patient.name"
          :age="patient.age"
          :gender="patient.gender"
          :date="prescription.date"
          :case-id="prescription.caseId"
          :phone="patient.phone"
          :doctor-name="settings.doctorName"
        />

        <div class="my-4">
          <MedicationTable :medications="medications" />
        </div>

        <RxFooter
          :notes="prescription.notes"
          :doctor-name="settings.doctorName"
          :disclaimer="settings.disclaimer"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import RxHeader from './RxHeader.vue'
import PatientInfo from './PatientInfo.vue'
import MedicationTable from './MedicationTable.vue'
import RxFooter from './RxFooter.vue'

/* ═══════════════════════════════════════════
   Theme Definitions
   ═══════════════════════════════════════════ */
const themes = [
  { id: 'clean-blue',    swatch: 'linear-gradient(135deg, #e8f4fd, #dbeafe)', accent: '#17638D',
    primary: '#17638D', bg: '#f0f7fc', card: '#ffffff', cardBorder: 'rgba(23,99,141,0.12)',
    text: '#1a2e3b', textSecondary: '#5a7d8f', shadow: '0 4px 24px rgba(23,99,141,0.08)',
    barGrad: 'linear-gradient(135deg,#17638D,#1a7ab5)', notesBg: '#e8f4fd', notesBorder: '#17638D',
    rxBg: 'linear-gradient(160deg,#f0f7fc 0%,#dbeafe 40%,#e8f4fd 100%)',
    glowColor: 'rgba(23,99,141,0.06)', patternOpacity: '0.03' },
  { id: 'soft-medical',  swatch: 'linear-gradient(135deg, #f8fbff, #eef5fb)', accent: '#4a90c4',
    primary: '#4a90c4', bg: '#fafcff', card: '#ffffff', cardBorder: 'rgba(74,144,196,0.10)',
    text: '#2c3e50', textSecondary: '#7094b0', shadow: '0 4px 20px rgba(74,144,196,0.06)',
    barGrad: 'linear-gradient(135deg,#4a90c4,#68aed8)', notesBg: '#f0f6fc', notesBorder: '#4a90c4',
    rxBg: 'linear-gradient(160deg,#fafcff 0%,#f0f6fc 40%,#e8f2fa 100%)',
    glowColor: 'rgba(74,144,196,0.05)', patternOpacity: '0.02' },
  { id: 'royal-purple',  swatch: 'linear-gradient(135deg, #f3eef8, #ece5f5)', accent: '#6c3fa0',
    primary: '#6c3fa0', bg: '#f7f3fb', card: '#ffffff', cardBorder: 'rgba(108,63,160,0.10)',
    text: '#2d1f4e', textSecondary: '#8a6fb0', shadow: '0 4px 24px rgba(108,63,160,0.07)',
    barGrad: 'linear-gradient(135deg,#6c3fa0,#8b5fc7)', notesBg: '#f3eef8', notesBorder: '#6c3fa0',
    rxBg: 'linear-gradient(160deg,#f7f3fb 0%,#ece5f5 40%,#f3eef8 100%)',
    glowColor: 'rgba(108,63,160,0.05)', patternOpacity: '0.025' },
  { id: 'emerald-green', swatch: 'linear-gradient(135deg, #e8f5e9, #dcedc8)', accent: '#2e7d56',
    primary: '#2e7d56', bg: '#f2f9f4', card: '#ffffff', cardBorder: 'rgba(46,125,86,0.10)',
    text: '#1b3a2a', textSecondary: '#5e9b7a', shadow: '0 4px 24px rgba(46,125,86,0.07)',
    barGrad: 'linear-gradient(135deg,#2e7d56,#3da06e)', notesBg: '#e8f5e9', notesBorder: '#2e7d56',
    rxBg: 'linear-gradient(160deg,#f2f9f4 0%,#e8f5e9 40%,#dcedc8 100%)',
    glowColor: 'rgba(46,125,86,0.05)', patternOpacity: '0.025' },
  { id: 'warm-light',    swatch: 'linear-gradient(135deg, #fdf8f0, #fef3e2)', accent: '#b8860b',
    primary: '#b8860b', bg: '#fdfaf5', card: '#ffffff', cardBorder: 'rgba(184,134,11,0.10)',
    text: '#3d2e0a', textSecondary: '#a08450', shadow: '0 4px 24px rgba(184,134,11,0.06)',
    barGrad: 'linear-gradient(135deg,#b8860b,#d4a017)', notesBg: '#fdf8f0', notesBorder: '#b8860b',
    rxBg: 'linear-gradient(160deg,#fdfaf5 0%,#fef3e2 40%,#fdf8f0 100%)',
    glowColor: 'rgba(184,134,11,0.05)', patternOpacity: '0.025' },
]

const props = defineProps({
  prescription: {
    type: Object,
    default: () => ({ notes: '', date: '', caseId: '' })
  },
  patient: {
    type: Object,
    default: () => ({ name: '', age: '', gender: '', phone: '' })
  },
  medications: {
    type: Array,
    default: () => []
  },
  settings: {
    type: Object,
    default: () => ({
      logo: '',
      clinicName: 'Smart Clinic',
      doctorName: '',
      specialty: '',
      phone: '',
      address: '',
      primaryColor: '#17638D',
      disclaimer: ''
    })
  }
})

defineEmits(['open-settings'])

const { locale } = useI18n()
const rxSheetRef = ref(null)
const headerTemplate = ref('modern')
const activeTheme = ref('clean-blue')

const isRtl = computed(() => locale.value === 'ar' || locale.value === 'ku')
const currentTheme = computed(() => themes.find(t => t.id === activeTheme.value) || themes[0])

// Persist theme preference
watch(activeTheme, (val) => {
  try { localStorage.setItem('rx_theme', val) } catch { /* ignore */ }
})
try {
  const saved = localStorage.getItem('rx_theme')
  if (saved && themes.some(t => t.id === saved)) activeTheme.value = saved
} catch { /* ignore */ }

/* ═══════════════════════════════════════════
   Print Helpers
   ═══════════════════════════════════════════ */
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return `${parseInt(h.substring(0, 2), 16)}, ${parseInt(h.substring(2, 4), 16)}, ${parseInt(h.substring(4, 6), 16)}`
}

function buildPrintCSS(th, direction, fontFamily, rtl) {
  const c = hexToRgb(th.primary)
  return `
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  :root { --v-theme-primary: ${c}; }
  body {
    font-family: ${fontFamily};
    direction: ${direction};
    background: ${th.bg};
    color: ${th.text};
    line-height: 1.6;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .rx-sheet {
    max-width: 780px;
    margin: 0 auto;
    padding: 28px 36px;
    background: ${th.card};
    border: 1px solid ${th.cardBorder};
    border-radius: 20px;
    box-shadow: ${th.shadow};
    position: relative;
  }
  .rx-sheet::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 20px;
    background: radial-gradient(ellipse at 20% 0%, ${th.glowColor}, transparent 60%);
    pointer-events: none;
  }

  /* Header */
  .rx-header { margin-bottom: 16px; }
  .rx-header__modern-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .rx-header__modern-left { display: flex; align-items: center; gap: 14px; }
  .rx-header__modern-right { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
  .rx-header__logo { width: 56px; height: 56px; object-fit: contain; border-radius: 50%; border: 2px solid ${th.cardBorder}; }
  .rx-header__logo--lg { width: 68px; height: 68px; border-radius: 12px; }
  .rx-header__logo--round { border-radius: 50%; }
  .rx-header__clinic-name { font-size: 1.4rem; font-weight: 800; color: ${th.primary}; line-height: 1.2; }
  .rx-header__clinic-name--lg { font-size: 1.65rem; }
  .rx-header__doctor { font-size: 0.85rem; color: ${th.textSecondary}; margin: 2px 0 0; }
  .rx-header__specialty { color: ${th.textSecondary}; opacity: 0.8; }
  .rx-header__meta-item { display: inline-flex; align-items: center; gap: 5px; font-size: 0.78rem; color: ${th.textSecondary}; }
  .rx-header__contact { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 4px; }
  .rx-header__contact-item { display: inline-flex; align-items: center; font-size: 0.75rem; color: ${th.textSecondary}; }
  .rx-header__rx-bar, .rx-header__rx-bar--modern {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    background: ${th.barGrad}; color: #fff; padding: 10px 0;
    border-radius: 12px; margin-top: 12px;
    box-shadow: 0 2px 12px rgba(${c}, 0.2);
  }
  .rx-header__rx-bar-inner { display: flex; align-items: center; gap: 10px; }
  .rx-header__rx-symbol { font-size: 1.6rem; font-weight: 700; font-style: italic; }
  .rx-header__rx-text { font-size: 0.95rem; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
  .rx-header__minimal { display: flex; align-items: center; gap: 14px; padding: 8px 0; }
  .rx-header__classic-top { display: flex; align-items: center; gap: 16px; padding-bottom: 8px; }

  /* Patient Info */
  .rx-patient-info {
    border: 1.5px solid ${th.cardBorder};
    border-radius: 14px;
    background: ${th.notesBg};
  }
  .rx-patient-info .v-card-text, .pa-4 { padding: 18px; }
  .rx-patient-info__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px 24px; }
  .rx-patient-info__cell { display: flex; align-items: flex-start; }
  .rx-patient-info__label { display: block; font-size: 0.68rem; font-weight: 700; color: ${th.primary}; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 2px; }
  .rx-patient-info__value { display: block; font-size: 0.9rem; color: ${th.text}; }
  .rx-patient-info__value--bold { font-weight: 700; font-size: 0.95rem; }
  .me-2 { margin-${rtl ? 'left' : 'right'}: 8px; }
  .mdi::before { font-size: 18px; color: ${th.primary}; vertical-align: middle; }

  /* Medications */
  .rx-med-table { margin: 18px 0; }
  .rx-med-table__header { display: flex; align-items: center; margin-bottom: 14px; }
  .rx-med-table__title { font-size: 1rem; font-weight: 700; color: ${th.text}; margin: 0 8px; }
  .rx-med-table__screen-view { display: none !important; }
  .rx-med-table__print-view { display: block !important; }
  .v-chip { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 0.7rem; background: rgba(${c}, 0.1); color: ${th.primary}; font-weight: 600; }

  .rx-med-print-row {
    display: flex; align-items: flex-start; gap: 14px; padding: 14px 0;
    border-bottom: 1px solid rgba(${c}, 0.08); page-break-inside: avoid;
  }
  .rx-med-print-row:last-child { border-bottom: none; }
  .rx-med-print-row__num {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 28px; height: 28px; border-radius: 50%;
    background: ${th.barGrad}; color: #fff; font-size: 0.75rem; font-weight: 700;
    flex-shrink: 0; margin-top: 2px; box-shadow: 0 2px 8px rgba(${c}, 0.2);
  }
  .rx-med-print-row__body { flex: 1; }
  .rx-med-print-row__drug { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
  .rx-med-print-row__name { font-size: 1.05rem; font-weight: 700; color: ${th.text}; }
  .rx-med-print-row__dose { font-size: 0.95rem; font-weight: 600; color: ${th.primary}; }
  .rx-med-print-row__regimen { margin-top: 4px; font-size: 0.85rem; color: ${th.textSecondary}; line-height: 1.5; }
  .rx-med-print-row__sep { margin: 0 5px; color: rgba(${c}, 0.3); }
  .rx-med-print-row__instr { color: #b8860b; font-style: italic; }

  /* Footer */
  .rx-footer { margin-top: 36px; }
  .rx-footer__notes {
    background: ${th.notesBg};
    border-${rtl ? 'right' : 'left'}: 4px solid ${th.notesBorder};
    border-radius: 10px; padding: 12px 18px; margin-bottom: 18px;
  }
  .rx-footer__notes-label { font-size: 0.75rem; font-weight: 700; color: ${th.primary}; text-transform: uppercase; margin-bottom: 4px; display: flex; align-items: center; }
  .rx-footer__notes-text { font-size: 0.85rem; color: ${th.textSecondary}; margin: 0; line-height: 1.6; white-space: pre-wrap; }
  .rx-footer__signature { text-align: ${rtl ? 'left' : 'right'}; margin-bottom: 20px; }
  .rx-footer__sig-line { width: 200px; border-bottom: 2px solid ${th.text}; margin-${rtl ? 'right' : 'left'}: auto; margin-bottom: 6px; }
  .rx-footer__sig-label { font-size: 0.7rem; color: ${th.textSecondary}; margin: 0; }
  .rx-footer__sig-name { font-size: 0.82rem; font-weight: 600; color: ${th.text}; margin: 2px 0 0; }
  .rx-footer__disclaimer { text-align: center; font-size: 0.68rem; color: ${th.textSecondary}; opacity: 0.7; font-style: italic; line-height: 1.6; margin: 0; padding-top: 10px; border-top: 1px solid ${th.cardBorder}; }

  .my-4 { margin-top: 18px; margin-bottom: 18px; }
  hr, .v-divider { border: none; border-top: 1px dashed rgba(${c}, 0.15); margin: 16px 0; }

  @media print {
    @page { margin: 12mm 15mm; size: A4; }
    body { background: #fff !important; padding: 0; }
    .rx-sheet { padding: 20px 28px; max-width: none; box-shadow: none; border: none; border-radius: 0; }
    .rx-sheet::before { display: none; }
  }`
}

const printRx = () => {
  if (!rxSheetRef.value) return

  const content = rxSheetRef.value.innerHTML
  const direction = isRtl.value ? 'rtl' : 'ltr'
  const fontFamily = isRtl.value
    ? "'Cairo', 'Tajawal', sans-serif"
    : "'Inter', 'Segoe UI', sans-serif"
  const th = currentTheme.value

  const printWindow = window.open('', '_blank', 'width=800,height=900')
  if (!printWindow) return

  printWindow.document.write(`<!DOCTYPE html>
<html dir="${direction}" lang="${locale.value}">
<head>
<meta charset="UTF-8">
<title>${props.settings.clinicName} - Rx</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/@mdi/font@7/css/materialdesignicons.min.css" rel="stylesheet">
<style>${buildPrintCSS(th, direction, fontFamily, isRtl.value)}</style>
</head>
<body>
  <div class="rx-sheet">${content}</div>
</body>
</html>`)

  printWindow.document.close()
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }
}

const exportPdf = () => { printRx() }

defineExpose({ printRx, exportPdf, activeTheme, themes })
</script>

<style scoped>
/* ═══════════════════════════════════════════
   Theme CSS Variables (defaults = clean-blue)
   ═══════════════════════════════════════════ */
.rx-preview {
  --rx-primary: #17638D;
  --rx-bg: #f0f7fc;
  --rx-card: #ffffff;
  --rx-card-border: rgba(23,99,141,0.12);
  --rx-text: #1a2e3b;
  --rx-text-2: #5a7d8f;
  --rx-shadow: 0 4px 24px rgba(23,99,141,0.08);
  --rx-bar-grad: linear-gradient(135deg,#17638D,#1a7ab5);
  --rx-notes-bg: #e8f4fd;
  --rx-notes-border: #17638D;
  --rx-glow: rgba(23,99,141,0.06);
  --rx-bg-grad: linear-gradient(160deg,#f0f7fc 0%,#dbeafe 40%,#e8f4fd 100%);
  --rx-pattern-opacity: 0.03;
}

/* ─── clean-blue ─── */
.rx-preview[data-theme="clean-blue"] {
  --rx-primary: #17638D; --rx-bg: #f0f7fc; --rx-card: #ffffff;
  --rx-card-border: rgba(23,99,141,0.12); --rx-text: #1a2e3b; --rx-text-2: #5a7d8f;
  --rx-shadow: 0 4px 24px rgba(23,99,141,0.08);
  --rx-bar-grad: linear-gradient(135deg,#17638D,#1a7ab5);
  --rx-notes-bg: #e8f4fd; --rx-notes-border: #17638D;
  --rx-glow: rgba(23,99,141,0.06);
  --rx-bg-grad: linear-gradient(160deg,#f0f7fc 0%,#dbeafe 40%,#e8f4fd 100%);
  --rx-pattern-opacity: 0.03;
}

/* ─── soft-medical ─── */
.rx-preview[data-theme="soft-medical"] {
  --rx-primary: #4a90c4; --rx-bg: #fafcff; --rx-card: #ffffff;
  --rx-card-border: rgba(74,144,196,0.10); --rx-text: #2c3e50; --rx-text-2: #7094b0;
  --rx-shadow: 0 4px 20px rgba(74,144,196,0.06);
  --rx-bar-grad: linear-gradient(135deg,#4a90c4,#68aed8);
  --rx-notes-bg: #f0f6fc; --rx-notes-border: #4a90c4;
  --rx-glow: rgba(74,144,196,0.05);
  --rx-bg-grad: linear-gradient(160deg,#fafcff 0%,#f0f6fc 40%,#e8f2fa 100%);
  --rx-pattern-opacity: 0.02;
}

/* ─── royal-purple ─── */
.rx-preview[data-theme="royal-purple"] {
  --rx-primary: #6c3fa0; --rx-bg: #f7f3fb; --rx-card: #ffffff;
  --rx-card-border: rgba(108,63,160,0.10); --rx-text: #2d1f4e; --rx-text-2: #8a6fb0;
  --rx-shadow: 0 4px 24px rgba(108,63,160,0.07);
  --rx-bar-grad: linear-gradient(135deg,#6c3fa0,#8b5fc7);
  --rx-notes-bg: #f3eef8; --rx-notes-border: #6c3fa0;
  --rx-glow: rgba(108,63,160,0.05);
  --rx-bg-grad: linear-gradient(160deg,#f7f3fb 0%,#ece5f5 40%,#f3eef8 100%);
  --rx-pattern-opacity: 0.025;
}

/* ─── emerald-green ─── */
.rx-preview[data-theme="emerald-green"] {
  --rx-primary: #2e7d56; --rx-bg: #f2f9f4; --rx-card: #ffffff;
  --rx-card-border: rgba(46,125,86,0.10); --rx-text: #1b3a2a; --rx-text-2: #5e9b7a;
  --rx-shadow: 0 4px 24px rgba(46,125,86,0.07);
  --rx-bar-grad: linear-gradient(135deg,#2e7d56,#3da06e);
  --rx-notes-bg: #e8f5e9; --rx-notes-border: #2e7d56;
  --rx-glow: rgba(46,125,86,0.05);
  --rx-bg-grad: linear-gradient(160deg,#f2f9f4 0%,#e8f5e9 40%,#dcedc8 100%);
  --rx-pattern-opacity: 0.025;
}

/* ─── warm-light ─── */
.rx-preview[data-theme="warm-light"] {
  --rx-primary: #b8860b; --rx-bg: #fdfaf5; --rx-card: #ffffff;
  --rx-card-border: rgba(184,134,11,0.10); --rx-text: #3d2e0a; --rx-text-2: #a08450;
  --rx-shadow: 0 4px 24px rgba(184,134,11,0.06);
  --rx-bar-grad: linear-gradient(135deg,#b8860b,#d4a017);
  --rx-notes-bg: #fdf8f0; --rx-notes-border: #b8860b;
  --rx-glow: rgba(184,134,11,0.05);
  --rx-bg-grad: linear-gradient(160deg,#fdfaf5 0%,#fef3e2 40%,#fdf8f0 100%);
  --rx-pattern-opacity: 0.025;
}

/* ═══════════════════════════════════════════
   Toolbar
   ═══════════════════════════════════════════ */
.rx-preview__toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  padding: 14px 18px;
  background: #f8f9fa;
  border-radius: 14px;
  border: 1px solid #eee;
}
.rx-preview__toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

/* ─── Theme Switcher ─── */
.rx-preview__themes {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.rx-preview__themes-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #777;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}
.rx-preview__theme-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.rx-preview__theme-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px 5px 8px;
  border-radius: 20px;
  border: 2px solid transparent;
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 600;
  font-family: inherit;
  transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.rx-preview__theme-pill:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 12px rgba(0,0,0,0.08);
}
.rx-preview__theme-pill--active {
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}
.rx-preview__theme-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.rx-preview__theme-name {
  color: #444;
  white-space: nowrap;
}
.rx-preview__theme-pill--active .rx-preview__theme-name {
  font-weight: 700;
}

/* ═══════════════════════════════════════════
   Canvas (Themed Background)
   ═══════════════════════════════════════════ */
.rx-preview__canvas {
  position: relative;
  border-radius: 24px;
  padding: 32px;
  background: var(--rx-bg-grad);
  min-height: 600px;
  overflow: hidden;
  transition: background 0.5s cubic-bezier(0.4,0,0.2,1);
}

/* Subtle medical dot pattern */
.rx-preview__bg-pattern {
  position: absolute;
  inset: 0;
  opacity: var(--rx-pattern-opacity);
  background-image:
    radial-gradient(circle at 25% 25%, var(--rx-primary) 1px, transparent 1px),
    radial-gradient(circle at 75% 75%, var(--rx-primary) 0.5px, transparent 0.5px);
  background-size: 40px 40px, 20px 20px;
  pointer-events: none;
  transition: opacity 0.5s;
}

/* Radial glow effect */
.rx-preview__bg-glow {
  position: absolute;
  top: -20%;
  right: -10%;
  width: 60%;
  height: 60%;
  border-radius: 50%;
  background: radial-gradient(ellipse, var(--rx-glow), transparent 70%);
  pointer-events: none;
  transition: background 0.5s;
}

/* ═══════════════════════════════════════════
   Sheet (A4 Card — elevated, rounded)
   ═══════════════════════════════════════════ */
.rx-preview__sheet {
  position: relative;
  background: var(--rx-card);
  border: 1px solid var(--rx-card-border);
  border-radius: 20px;
  padding: 32px 36px;
  box-shadow: var(--rx-shadow);
  max-width: 780px;
  margin: 0 auto;
  z-index: 1;
  transition: all 0.5s cubic-bezier(0.4,0,0.2,1);
}

/* Soft inner glow */
.rx-preview__sheet::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 20px;
  background: radial-gradient(ellipse at 20% 0%, var(--rx-glow), transparent 60%);
  pointer-events: none;
}

/* ═══════════════════════════════════════════
   Deep child component theme overrides
   ═══════════════════════════════════════════ */
.rx-preview__sheet :deep(.rx-header__clinic-name) {
  color: var(--rx-primary);
  transition: color 0.4s;
}
.rx-preview__sheet :deep(.rx-header__doctor),
.rx-preview__sheet :deep(.rx-header__specialty) {
  color: var(--rx-text-2);
}
.rx-preview__sheet :deep(.rx-header__meta-item),
.rx-preview__sheet :deep(.rx-header__contact-item) {
  color: var(--rx-text-2);
}
.rx-preview__sheet :deep(.rx-header__rx-bar),
.rx-preview__sheet :deep(.rx-header__rx-bar--modern) {
  background: var(--rx-bar-grad);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  transition: background 0.4s;
}
.rx-preview__sheet :deep(.rx-patient-info) {
  border-color: var(--rx-card-border) !important;
  background: var(--rx-notes-bg) !important;
  border-radius: 14px;
  transition: all 0.4s;
}
.rx-preview__sheet :deep(.rx-patient-info__label) {
  color: var(--rx-primary);
  transition: color 0.4s;
}
.rx-preview__sheet :deep(.rx-patient-info__value) {
  color: var(--rx-text);
}
.rx-preview__sheet :deep(.rx-med-table__title) {
  color: var(--rx-text);
  transition: color 0.4s;
}
.rx-preview__sheet :deep(.rx-med-table__th) {
  background: var(--rx-primary);
}
.rx-preview__sheet :deep(.rx-med-table__td--num) {
  color: var(--rx-primary);
}
.rx-preview__sheet :deep(.rx-med-table__wrap) {
  border-color: var(--rx-card-border);
}
.rx-preview__sheet :deep(.rx-med-print-row) {
  border-color: var(--rx-card-border);
}
.rx-preview__sheet :deep(.rx-med-print-row__name) {
  color: var(--rx-text);
}
.rx-preview__sheet :deep(.rx-med-print-row__dose) {
  color: var(--rx-primary);
}
.rx-preview__sheet :deep(.rx-med-print-row__num) {
  background: var(--rx-bar-grad);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.rx-preview__sheet :deep(.rx-med-print-row__regimen) {
  color: var(--rx-text-2);
}
.rx-preview__sheet :deep(.rx-footer__notes) {
  background: var(--rx-notes-bg);
  border-color: var(--rx-notes-border);
  border-radius: 10px;
}
.rx-preview__sheet :deep(.rx-footer__notes-label) {
  color: var(--rx-primary);
}
.rx-preview__sheet :deep(.rx-footer__notes-text) {
  color: var(--rx-text-2);
}
.rx-preview__sheet :deep(.rx-footer__disclaimer) {
  color: var(--rx-text-2);
  border-color: var(--rx-card-border);
}
.rx-preview__sheet :deep(.rx-footer__sig-name) {
  color: var(--rx-text);
}

/* ═══════════════════════════════════════════
   Responsive
   ═══════════════════════════════════════════ */
@media (max-width: 600px) {
  .rx-preview__toolbar-row {
    flex-direction: column;
    align-items: stretch;
  }
  .rx-preview__canvas {
    padding: 16px;
    border-radius: 16px;
  }
  .rx-preview__sheet {
    padding: 18px;
    border-radius: 14px;
  }
}

/* ═══════════════════════════════════════════
   Print — clean output
   ═══════════════════════════════════════════ */
@media print {
  .rx-preview__toolbar,
  .rx-preview__bg-pattern,
  .rx-preview__bg-glow,
  .no-print { display: none !important; }
  .rx-preview__canvas { padding: 0; background: none !important; border-radius: 0; }
  .rx-preview__sheet { box-shadow: none; border: none; border-radius: 0; padding: 0; }
  .rx-preview__sheet::before { display: none; }
}
</style>
