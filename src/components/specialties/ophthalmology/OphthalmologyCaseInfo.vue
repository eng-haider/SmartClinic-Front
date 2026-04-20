<template>
  <!-- Full-width block rendered inside CaseDetail's v-row -->
  <v-col cols="12">

    <!-- Row 1: Metric cards — Eye Side, Visual Acuity, IOP, Refraction -->
    <v-row dense>

      <!-- Eye Side -->
      <v-col cols="6" sm="3">
        <div class="oph-card">
          <div class="oph-card-header">
            <v-icon size="14" color="info" class="me-1">mdi-eye</v-icon>
            {{ $t('cases.eye_side') || 'Eye Side' }}
          </div>
          <div class="oph-card-body">
            <v-chip :color="eyeSideColor" size="small" variant="flat" class="font-weight-semibold">
              {{ eyeSide || '—' }}
            </v-chip>
          </div>
        </div>
      </v-col>

      <!-- Visual Acuity -->
      <v-col cols="6" sm="3">
        <div class="oph-card">
          <div class="oph-card-header">
            <v-icon size="14" color="primary" class="me-1">mdi-eye-outline</v-icon>
            {{ $t('cases.section_vision') || 'Visual Acuity' }}
          </div>
          <div class="oph-lr-grid">
            <div class="oph-eye">
              <span class="oph-eye-tag">L</span>
              <span class="oph-eye-val">{{ vaLeft || '—' }}</span>
            </div>
            <div class="oph-vdivider" />
            <div class="oph-eye">
              <span class="oph-eye-tag">R</span>
              <span class="oph-eye-val">{{ vaRight || '—' }}</span>
            </div>
          </div>
        </div>
      </v-col>

      <!-- IOP -->
      <v-col cols="6" sm="3">
        <div class="oph-card">
          <div class="oph-card-header">
            <v-icon size="14" color="warning" class="me-1">mdi-gauge</v-icon>
            {{ $t('cases.section_iop') || 'IOP (mmHg)' }}
          </div>
          <div class="oph-lr-grid">
            <div class="oph-eye">
              <span class="oph-eye-tag">L</span>
              <span class="oph-eye-val">{{ iopLeft || '—' }}</span>
            </div>
            <div class="oph-vdivider" />
            <div class="oph-eye">
              <span class="oph-eye-tag">R</span>
              <span class="oph-eye-val">{{ iopRight || '—' }}</span>
            </div>
          </div>
        </div>
      </v-col>

      <!-- Refraction -->
      <v-col cols="6" sm="3">
        <div class="oph-card">
          <div class="oph-card-header">
            <v-icon size="14" color="secondary" class="me-1">mdi-glasses</v-icon>
            {{ $t('cases.section_refraction') || 'Refraction' }}
          </div>
          <div class="oph-lr-grid">
            <div class="oph-eye">
              <span class="oph-eye-tag">L</span>
              <span class="oph-eye-val">{{ refLeft || '—' }}</span>
            </div>
            <div class="oph-vdivider" />
            <div class="oph-eye">
              <span class="oph-eye-tag">R</span>
              <span class="oph-eye-val">{{ refRight || '—' }}</span>
            </div>
          </div>
        </div>
      </v-col>

    </v-row>

    <!-- Row 2: Text fields — Diagnosis, Anterior Segment, Posterior Segment -->
    <v-row dense class="mt-2">

      <v-col cols="12" sm="4">
        <div class="oph-text-card">
          <div class="oph-card-header">
            <v-icon size="14" color="error" class="me-1">mdi-stethoscope</v-icon>
            {{ $t('cases.diagnosis') || 'Diagnosis' }}
          </div>
          <p class="oph-text-body">{{ diagnosis || '—' }}</p>
        </div>
      </v-col>

      <v-col cols="12" sm="4">
        <div class="oph-text-card">
          <div class="oph-card-header">
            <v-icon size="14" color="teal" class="me-1">mdi-eye-check-outline</v-icon>
            {{ $t('cases.anterior_segment') || 'Anterior Segment' }}
          </div>
          <p class="oph-text-body">{{ anteriorSegment || '—' }}</p>
        </div>
      </v-col>

      <v-col cols="12" sm="4">
        <div class="oph-text-card">
          <div class="oph-card-header">
            <v-icon size="14" color="deep-purple" class="me-1">mdi-text-box-check-outline</v-icon>
            {{ $t('cases.posterior_segment') || 'Posterior Segment' }}
          </div>
          <p class="oph-text-body">{{ posteriorSegment || '—' }}</p>
        </div>
      </v-col>

    </v-row>
  </v-col>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  caseData: {
    type: Object,
    required: true
  }
})

// Support both flat API fields and nested ophthalmology_encounter_details
const oed = computed(() => props.caseData?.ophthalmology_encounter_details || {})

const eyeSide         = computed(() => props.caseData?.eye_side              || oed.value.eye_side              || '')
const vaLeft          = computed(() => props.caseData?.visual_acuity_left    || oed.value.visual_acuity_left    || '')
const vaRight         = computed(() => props.caseData?.visual_acuity_right   || oed.value.visual_acuity_right   || '')
const iopLeft         = computed(() => props.caseData?.iop_left              || oed.value.iop_left              || '')
const iopRight        = computed(() => props.caseData?.iop_right             || oed.value.iop_right             || '')
const refLeft         = computed(() => props.caseData?.refraction_left       || oed.value.refraction_left       || '')
const refRight        = computed(() => props.caseData?.refraction_right      || oed.value.refraction_right      || '')
const diagnosis       = computed(() => props.caseData?.diagnosis             || oed.value.diagnosis             || '')
const anteriorSegment = computed(() => props.caseData?.anterior_segment      || oed.value.anterior_segment      || '')
const posteriorSegment= computed(() => props.caseData?.posterior_segment     || oed.value.posterior_segment     || '')

const eyeSideColor = computed(() => {
  const v = eyeSide.value?.toLowerCase()
  if (v === 'left')  return 'info'
  if (v === 'right') return 'primary'
  if (v === 'both')  return 'success'
  return 'grey'
})
</script>

<style scoped>
/* ── Shared header bar ─────────────────────────────────── */
.oph-card-header {
  display: flex;
  align-items: center;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #8a94a6;
  margin-bottom: 8px;
}

/* ── Metric card (Eye Side / VA / IOP / Refraction) ────── */
.oph-card {
  background: #f5f7fa;
  border: 1px solid #e4e9f0;
  border-radius: 10px;
  padding: 10px 12px 10px;
  height: 100%;
}

.oph-card-body {
  display: flex;
  align-items: center;
  min-height: 28px;
}

/* L / R pair inside a metric card */
.oph-lr-grid {
  display: flex;
  align-items: center;
  gap: 6px;
}

.oph-eye {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.oph-eye-tag {
  font-size: 10px;
  font-weight: 700;
  color: #a0aab8;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  flex-shrink: 0;
}

.oph-eye-val {
  font-size: 13.5px;
  font-weight: 600;
  color: #2d3748;
  font-variant-numeric: tabular-nums;
}

.oph-vdivider {
  width: 1px;
  height: 18px;
  background: #d8dde6;
  flex-shrink: 0;
}

/* ── Text card (Diagnosis / Anterior / Posterior) ──────── */
.oph-text-card {
  background: #f5f7fa;
  border: 1px solid #e4e9f0;
  border-radius: 10px;
  padding: 10px 12px;
  height: 100%;
  min-height: 62px;
}

.oph-text-body {
  font-size: 12.5px;
  color: #2d3748;
  margin: 0;
  line-height: 1.45;
  word-break: break-word;
}
</style>
