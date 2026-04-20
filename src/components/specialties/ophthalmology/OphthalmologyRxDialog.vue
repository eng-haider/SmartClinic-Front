<template>
  <v-dialog v-model="isOpen" max-width="760" persistent scrollable>
    <v-card class="rx-dialog-card" rounded="xl">

      <!-- ═══ TOOLBAR ══════════════════════════════════════════════ -->
      <v-toolbar color="primary" density="comfortable" flat>
        <v-icon class="ms-4" color="white">mdi-prescription</v-icon>
        <v-toolbar-title class="text-white font-weight-bold ms-2">وصفة طبية</v-toolbar-title>
        <v-spacer />
        <v-chip
          v-if="localDrugs.length"
          color="white"
          variant="flat"
          size="small"
          class="me-2 text-primary font-weight-bold"
        >
          {{ localDrugs.length }} دواء
        </v-chip>
        <v-btn icon color="white" variant="text" class="me-1" @click="isOpen = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <!-- ═══ SCROLLABLE BODY ══════════════════════════════════════ -->
      <v-card-text class="pa-0 overflow-y-auto">
        <div ref="printAreaRef" class="rx-paper">

          <!-- ── Clinic Header ───────────────────────────────────── -->
          <div class="rx-clinic-header">
            <div class="rx-clinic-logo">
              <v-img
                v-if="clinicLogo"
                :src="clinicLogo"
                width="48"
                height="48"
                cover
                rounded="lg"
              />
              <v-icon v-else size="32" color="primary">mdi-hospital-building</v-icon>
            </div>
            <div class="rx-clinic-info">
              <div class="rx-clinic-name">{{ clinicName || 'العيادة التخصصية' }}</div>
              <div class="rx-clinic-specialty">طب وجراحة العيون</div>
              <div v-if="clinicPhone" class="rx-clinic-contact">
                <v-icon size="11">mdi-phone-outline</v-icon>
                {{ clinicPhone }}
              </div>
            </div>
            <div class="rx-header-rx">℞</div>
          </div>

          <div class="rx-hr" />

          <!-- ── Patient + Doctor Info ───────────────────────────── -->
          <div class="rx-patient-row">
            <div class="rx-info-block">
              <div class="rx-info-label">اسم المريض</div>
              <div class="rx-info-value">{{ patient?.name || '—' }}</div>
            </div>
            <div class="rx-info-block">
              <div class="rx-info-label">العمر</div>
              <div class="rx-info-value">{{ patientAge != null ? patientAge + ' سنة' : '—' }}</div>
            </div>
            <div class="rx-info-block">
              <div class="rx-info-label">التاريخ</div>
              <div class="rx-info-value">{{ todayFormatted }}</div>
            </div>
            <div class="rx-info-block">
              <div class="rx-info-label">الطبيب المعالج</div>
              <div class="rx-info-value">د. {{ caseItem?.doctor?.name || '—' }}</div>
            </div>
            <div class="rx-info-block">
              <div class="rx-info-label">التشخيص</div>
              <div class="rx-info-value rx-info-value--diagnosis">{{ caseItem?.diagnosis || '—' }}</div>
            </div>
          </div>

          <!-- ── Medications Section ─────────────────────────────── -->
          <div class="rx-section">
            <div class="rx-section-title">
              <span class="rx-section-dot rx-section-dot--blue" />
              الأدوية الموصوفة
            </div>

            <!-- Empty state -->
            <div v-if="!localDrugs.length" class="rx-no-meds">
              <v-icon size="32" color="grey-lighten-2" class="mb-2">mdi-pill-multiple</v-icon>
              لم تتم إضافة أي أدوية بعد
            </div>

            <!-- Drugs table -->
            <table v-else class="rx-table">
              <thead>
                <tr>
                  <th class="rx-th rx-th--num">#</th>
                  <th class="rx-th">اسم الدواء</th>
                  <th class="rx-th">الجرعة</th>
                  <th class="rx-th">المدة</th>
                  <th class="rx-th rx-th--action" />
                </tr>
              </thead>
              <tbody>
                <tr v-for="(drug, i) in localDrugs" :key="i" class="rx-tr">
                  <td class="rx-td rx-td--num">{{ i + 1 }}</td>
                  <td class="rx-td rx-td--name">{{ drug.name }}</td>
                  <td class="rx-td">{{ drug.dose || '—' }}</td>
                  <td class="rx-td">{{ drug.duration || '—' }}</td>
                  <td class="rx-td rx-td--action">
                    <button class="rx-del-btn" @click="removeDrug(i)">
                      <v-icon size="14" color="error">mdi-trash-can-outline</v-icon>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Add drug form -->
            <v-expand-transition>
              <div v-if="showAddDrug" class="rx-add-form mt-3">
                <v-row dense>
                  <v-col cols="12" sm="5">
                    <v-text-field
                      v-model="drugForm.name"
                      label="اسم الدواء *"
                      variant="outlined"
                      density="compact"
                      hide-details
                      autofocus
                      rounded="lg"
                    />
                  </v-col>
                  <v-col cols="6" sm="3">
                    <v-text-field
                      v-model="drugForm.dose"
                      label="الجرعة"
                      variant="outlined"
                      density="compact"
                      hide-details
                      rounded="lg"
                    />
                  </v-col>
                  <v-col cols="6" sm="3">
                    <v-text-field
                      v-model="drugForm.duration"
                      label="المدة"
                      variant="outlined"
                      density="compact"
                      hide-details
                      rounded="lg"
                    />
                  </v-col>
                  <v-col cols="12" sm="1" class="d-flex align-center">
                    <v-btn
                      color="primary"
                      variant="elevated"
                      size="small"
                      rounded="lg"
                      :disabled="!drugForm.name.trim()"
                      block
                      @click="commitDrug"
                    >
                      <v-icon size="16">mdi-plus</v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </div>
            </v-expand-transition>

            <v-btn
              :color="showAddDrug ? 'error' : 'primary'"
              :variant="showAddDrug ? 'text' : 'tonal'"
              :prepend-icon="showAddDrug ? 'mdi-close' : 'mdi-plus'"
              size="small"
              rounded="lg"
              class="mt-3"
              @click="showAddDrug = !showAddDrug"
            >
              {{ showAddDrug ? 'إلغاء' : 'إضافة دواء' }}
            </v-btn>
          </div>

          <!-- ── Doctor Notes ─────────────────────────────────────── -->
          <div class="rx-section">
            <div class="rx-section-title">
              <span class="rx-section-dot rx-section-dot--grey" />
              ملاحظات الطبيب
            </div>
            <v-textarea
              v-model="localNotes"
              placeholder="تعليمات أو ملاحظات إضافية للمريض..."
              variant="outlined"
              density="compact"
              rows="3"
              hide-details
              rounded="lg"
            />
          </div>

          <!-- ── Signature Footer ────────────────────────────────── -->
          <div class="rx-footer">
            <div class="rx-footer-left">
              <div class="rx-footer-line" />
              <div class="rx-footer-label">توقيع وختم الطبيب</div>
              <div class="rx-footer-name">د. {{ caseItem?.doctor?.name || '' }}</div>
            </div>
            <div class="rx-footer-stamp">℞</div>
          </div>

        </div>
      </v-card-text>

      <!-- ═══ ACTIONS ══════════════════════════════════════════════ -->
      <v-divider />
      <v-card-actions class="pa-4 gap-2">
        <v-btn variant="text" color="grey-darken-1" @click="isOpen = false">إلغاء</v-btn>
        <v-spacer />
        <v-btn
          variant="tonal"
          color="primary"
          prepend-icon="mdi-content-save-outline"
          :loading="saving"
          @click="saveRx"
        >
          حفظ الوصفة
        </v-btn>
        <v-btn
          variant="elevated"
          color="primary"
          prepend-icon="mdi-printer-outline"
          @click="printRx"
        >
          طباعة الوصفة
        </v-btn>
      </v-card-actions>

    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useClinicSettings } from '@/composables/useClinicSettings'


// ── Props ──────────────────────────────────────────────────────
const props = defineProps({
  modelValue:   { type: Boolean, default: false },
  caseItem:     { type: Object,  default: () => ({}) },
  patient:      { type: Object,  default: () => null },
  initialDrugs: { type: Array,   default: () => [] },
  initialNotes: { type: String,  default: '' },
})

const emit = defineEmits(['update:modelValue', 'save'])

// ── v-model ────────────────────────────────────────────────────
const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

// ── Clinic settings ────────────────────────────────────────────
const { clinicName, clinicPhone, clinicLogo, loadSettings } = useClinicSettings()
loadSettings()

// ── Local state ────────────────────────────────────────────────
const localDrugs  = ref([...props.initialDrugs])
const localNotes  = ref(props.initialNotes)
const showAddDrug = ref(false)
const saving      = ref(false)
const drugForm    = reactive({ name: '', dose: '', duration: '' })
const printAreaRef = ref(null)

// Reset when dialog opens
watch(() => props.modelValue, (val) => {
  if (val) {
    localDrugs.value  = [...props.initialDrugs]
    localNotes.value  = props.initialNotes
    showAddDrug.value = false
    Object.assign(drugForm, { name: '', dose: '', duration: '' })
  }
})

// ── Computed ───────────────────────────────────────────────────
const todayFormatted = computed(() => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
})

const patientAge = computed(() => {
  const bd = props.patient?.birth_date
  if (!bd) return null
  const birth = new Date(bd)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
})

// ── Drug actions ───────────────────────────────────────────────
const commitDrug = () => {
  if (!drugForm.name.trim()) return
  localDrugs.value.push({ name: drugForm.name, dose: drugForm.dose, duration: drugForm.duration })
  Object.assign(drugForm, { name: '', dose: '', duration: '' })
  showAddDrug.value = false
}

const removeDrug = (idx) => localDrugs.value.splice(idx, 1)

// ── Save ───────────────────────────────────────────────────────
const saveRx = async () => {
  saving.value = true
  await new Promise(r => setTimeout(r, 200))
  emit('save', { drugs: [...localDrugs.value], notes: localNotes.value })
  isOpen.value = false
  saving.value = false
}

// ── Print ──────────────────────────────────────────────────────
const printRx = () => {
  const pName   = props.patient?.name  || '—'
  const pAge    = patientAge.value != null ? patientAge.value + ' سنة' : '—'
  const doctor  = `د. ${props.caseItem?.doctor?.name || '—'}`
  const clinic  = clinicName.value  || 'العيادة التخصصية'
  const phone   = clinicPhone.value || ''
  const diag    = props.caseItem?.diagnosis || '—'
  const date    = todayFormatted.value
  const notes   = localNotes.value || ''

  const drugRows = localDrugs.value.map((d, i) => `
    <tr>
      <td style="width:32px;color:#888;font-weight:700;text-align:center">${i+1}</td>
      <td style="font-weight:700;color:#1a1a2e">${d.name}</td>
      <td style="color:#444">${d.dose || '—'}</td>
      <td style="color:#444">${d.duration || '—'}</td>
    </tr>`
  ).join('')

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>وصفة طبية — ${pName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Cairo','Segoe UI',Tahoma,Arial,sans-serif;
      direction: rtl;
      background: #fff;
      color: #1a1a2e;
      font-size: 13px;
      line-height: 1.6;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 18mm 16mm 12mm;
      display: flex;
      flex-direction: column;
    }
    /* ── Header ── */
    .clinic-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 8mm;
      border-bottom: 2.5px solid #1565C0;
      margin-bottom: 8mm;
    }
    .clinic-name { font-size: 21px; font-weight: 900; color: #1565C0; }
    .clinic-sub  { font-size: 12px; color: #666; margin-top: 3px; }
    .clinic-phone{ font-size: 11px; color: #888; margin-top: 2px; }
    .rx-symbol   { font-size: 60px; font-weight: 900; color: rgba(21,101,192,0.12); line-height: 1; }
    /* ── Patient row ── */
    .patient-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      background: #f5f8ff;
      border: 1px solid #dce8ff;
      border-radius: 8px;
      padding: 5mm 6mm;
      margin-bottom: 8mm;
    }
    .info-block { flex: 1; min-width: 80px; }
    .info-label { font-size: 9px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px; }
    .info-value { font-size: 13px; font-weight: 700; color: #1a1a2e; }
    /* ── Section heading ── */
    .section-heading {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 800;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 4mm;
    }
    .section-dot {
      display: inline-block;
      width: 4px; height: 16px;
      background: #1565C0;
      border-radius: 2px;
    }
    /* ── Meds table ── */
    table { width: 100%; border-collapse: collapse; margin-bottom: 8mm; }
    thead tr { background: #1565C0; }
    thead th { padding: 7px 12px; color: #fff; font-weight: 700; font-size: 12px; text-align: right; }
    tbody tr:nth-child(even) { background: #f5f8ff; }
    tbody td { padding: 8px 12px; border-bottom: 1px solid #e8eef8; font-size: 13px; }
    .no-meds { color: #aaa; font-style: italic; font-size: 13px; margin-bottom: 8mm; }
    /* ── Notes ── */
    .notes-box {
      padding: 4mm 5mm;
      background: #fafafa;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      min-height: 18mm;
      margin-bottom: 16mm;
      color: #444;
      white-space: pre-wrap;
      font-size: 13px;
    }
    /* ── Footer ── */
    .rx-footer {
      margin-top: auto;
      display: flex;
      justify-content: flex-end;
      padding-top: 8mm;
      border-top: 1px dashed #ccc;
    }
    .sig-block { text-align: center; }
    .sig-line  { width: 56mm; border-bottom: 1px solid #555; margin-bottom: 4px; }
    .sig-label { font-size: 11px; color: #888; }
    .sig-name  { font-size: 13px; font-weight: 700; color: #1565C0; margin-top: 2px; }
    @media print { body { margin:0; } .page { padding: 12mm; } }
  </style>
</head>
<body>
<div class="page">
  <div class="clinic-header">
    <div>
      <div class="clinic-name">${clinic}</div>
      <div class="clinic-sub">طب وجراحة العيون</div>
      ${phone ? `<div class="clinic-phone">☎ ${phone}</div>` : ''}
    </div>
    <div class="rx-symbol">℞</div>
  </div>

  <div class="patient-row">
    <div class="info-block"><div class="info-label">اسم المريض</div><div class="info-value">${pName}</div></div>
    <div class="info-block"><div class="info-label">العمر</div><div class="info-value">${pAge}</div></div>
    <div class="info-block"><div class="info-label">التاريخ</div><div class="info-value">${date}</div></div>
    <div class="info-block"><div class="info-label">الطبيب</div><div class="info-value">${doctor}</div></div>
    <div class="info-block"><div class="info-label">التشخيص</div><div class="info-value">${diag}</div></div>
  </div>

  <div class="section-heading"><span class="section-dot"></span>الأدوية الموصوفة</div>
  ${localDrugs.value.length
    ? `<table>
        <thead><tr><th>#</th><th>اسم الدواء</th><th>الجرعة</th><th>المدة</th></tr></thead>
        <tbody>${drugRows}</tbody>
      </table>`
    : `<p class="no-meds">لا توجد أدوية موصوفة</p>`
  }

  <div class="section-heading"><span class="section-dot" style="background:#666"></span>ملاحظات الطبيب</div>
  <div class="notes-box">${notes || ' '}</div>

  <div class="rx-footer">
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-label">توقيع وختم الطبيب</div>
      <div class="sig-name">${doctor}</div>
    </div>
  </div>
</div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=860,height=1100')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.onload = () => { win.focus(); win.print(); win.close() }
}
</script>

<style scoped>
/* ─── DIALOG CARD ────────────────────────────────────────────── */
.rx-dialog-card { overflow: hidden; font-family: 'Cairo', sans-serif; }

/* ─── PRINTABLE PAPER ────────────────────────────────────────── */
.rx-paper {
  padding: 28px 32px;
  background: #fff;
  min-height: 420px;
}

/* ─── CLINIC HEADER ──────────────────────────────────────────── */
.rx-clinic-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.rx-clinic-logo {
  width: 56px; height: 56px;
  background: rgba(21,101,192,0.07);
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  border: 1px solid rgba(21,101,192,0.12);
}
.rx-clinic-info { flex: 1; min-width: 0; }
.rx-clinic-name {
  font-size: 20px; font-weight: 900; color: #1565C0;
  letter-spacing: -0.3px;
}
.rx-clinic-specialty { font-size: 13px; color: rgba(0,0,0,0.45); margin-top: 2px; }
.rx-clinic-contact {
  font-size: 12px; color: rgba(0,0,0,0.38);
  display: flex; align-items: center; gap: 4px; margin-top: 2px;
}
.rx-header-rx {
  font-size: 64px; font-weight: 900;
  color: rgba(21,101,192,0.10);
  line-height: 1;
  user-select: none;
}

/* ─── DIVIDER ────────────────────────────────────────────────── */
.rx-hr {
  height: 2px;
  background: linear-gradient(90deg, #1565C0, rgba(21,101,192,0.15));
  margin: 0 0 20px;
  border-radius: 2px;
}

/* ─── PATIENT ROW ────────────────────────────────────────────── */
.rx-patient-row {
  display: flex;
  gap: 0;
  flex-wrap: wrap;
  background: #f5f8ff;
  border: 1px solid rgba(21,101,192,0.14);
  border-radius: 14px;
  padding: 14px 20px;
  margin-bottom: 24px;
}
.rx-info-block {
  flex: 1;
  min-width: 110px;
  padding: 0 12px;
  border-left: 1px solid rgba(21,101,192,0.10);
}
.rx-info-block:last-child { border-left: none; }
.rx-info-label {
  font-size: 10px; font-weight: 700;
  color: rgba(0,0,0,0.38);
  text-transform: uppercase; letter-spacing: 0.06em;
  margin-bottom: 4px;
}
.rx-info-value {
  font-size: 14px; font-weight: 700;
  color: rgba(0,0,0,0.82);
}
.rx-info-value--diagnosis {
  font-size: 13px;
  color: rgba(21,101,192,0.85);
}

/* ─── SECTION ────────────────────────────────────────────────── */
.rx-section { margin-bottom: 24px; }
.rx-section-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; font-weight: 800;
  color: rgba(0,0,0,0.45);
  text-transform: uppercase; letter-spacing: 0.08em;
  margin-bottom: 12px;
}
.rx-section-dot {
  width: 4px; height: 18px;
  border-radius: 2px;
  flex-shrink: 0;
}
.rx-section-dot--blue { background: #1565C0; }
.rx-section-dot--grey { background: #9e9e9e; }

/* ─── MEDS TABLE ─────────────────────────────────────────────── */
.rx-no-meds {
  display: flex; flex-direction: column; align-items: center;
  padding: 24px; color: rgba(0,0,0,0.3); font-style: italic; font-size: 14px;
  background: #fafafa; border-radius: 10px;
  border: 1px dashed rgba(0,0,0,0.10);
}
.rx-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 12px;
  overflow: hidden;
}
.rx-th {
  padding: 10px 14px;
  background: #1565C0;
  color: #fff;
  font-weight: 700;
  font-size: 12px;
  text-align: right;
}
.rx-th--num    { width: 40px; text-align: center; }
.rx-th--action { width: 40px; }
.rx-tr:nth-child(even) { background: #f7f9ff; }
.rx-tr:hover { background: rgba(21,101,192,0.04); }
.rx-td {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  font-size: 14px;
  color: rgba(0,0,0,0.7);
}
.rx-td--num    { text-align: center; color: rgba(0,0,0,0.3); font-weight: 700; }
.rx-td--name   { font-weight: 700; color: rgba(0,0,0,0.85); }
.rx-td--action { text-align: center; }
.rx-del-btn {
  background: none; border: none; cursor: pointer;
  padding: 4px 6px; border-radius: 6px;
  transition: background 0.12s;
}
.rx-del-btn:hover { background: rgba(244,67,54,0.08); }

/* ─── ADD DRUG FORM ──────────────────────────────────────────── */
.rx-add-form {
  background: rgba(21,101,192,0.03);
  border: 1px solid rgba(21,101,192,0.15);
  border-radius: 12px;
  padding: 14px;
}

/* ─── FOOTER ─────────────────────────────────────────────────── */
.rx-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px dashed rgba(0,0,0,0.12);
  margin-top: 8px;
}
.rx-footer-left { text-align: center; }
.rx-footer-line {
  width: 160px; height: 1px;
  background: rgba(0,0,0,0.28);
  margin-bottom: 6px;
}
.rx-footer-label { font-size: 11px; color: rgba(0,0,0,0.4); }
.rx-footer-name  { font-size: 14px; font-weight: 700; color: #1565C0; margin-top: 2px; }
.rx-footer-stamp {
  font-size: 52px; font-weight: 900;
  color: rgba(21,101,192,0.08);
  line-height: 1;
  user-select: none;
}

/* ─── ACTIONS ────────────────────────────────────────────────── */
.gap-2 { gap: 8px; }
</style>
