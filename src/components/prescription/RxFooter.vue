<template>
  <div class="rx-footer">
    <!-- Notes -->
    <div v-if="notes" class="rx-footer__notes">
      <div class="rx-footer__notes-label">
        <v-icon size="16" class="me-1">mdi-note-text</v-icon>
        {{ $t('rx.doctor_notes') }}
      </div>
      <p class="rx-footer__notes-text">{{ notes }}</p>
    </div>

    <v-divider class="my-4" style="border-style: dashed" />

    <!-- Signature -->
    <div class="rx-footer__signature">
      <div class="rx-footer__sig-line"></div>
      <p class="rx-footer__sig-label">{{ $t('rx.doctor_signature') }}</p>
      <p v-if="doctorName" class="rx-footer__sig-name">{{ doctorName }}</p>
    </div>

    <!-- Disclaimer -->
    <p class="rx-footer__disclaimer">
      {{ disclaimer || $t('rx.default_disclaimer') }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  notes: { type: String, default: '' },
  doctorName: { type: String, default: '' },
  disclaimer: { type: String, default: '' }
})
</script>

<style scoped>
.rx-footer {
  margin-top: 32px;
}

/* ===== Notes ===== */
.rx-footer__notes {
  background: #fffde7;
  border-inline-start: 4px solid #ffc107;
  border-radius: 6px;
  padding: 10px 16px;
  margin-bottom: 16px;
}

.rx-footer__notes-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #b8860b;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}

.rx-footer__notes-text {
  font-size: 0.85rem;
  color: #555;
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
}

/* ===== Signature ===== */
.rx-footer__signature {
  text-align: end;
  margin-bottom: 20px;
}

.rx-footer__sig-line {
  width: 200px;
  border-bottom: 1.5px solid #333;
  margin-inline-start: auto;
  margin-bottom: 6px;
}

.rx-footer__sig-label {
  font-size: 0.7rem;
  color: #888;
  margin: 0;
}

.rx-footer__sig-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #444;
  margin: 2px 0 0;
}

/* ===== Disclaimer ===== */
.rx-footer__disclaimer {
  text-align: center;
  font-size: 0.68rem;
  color: #aaa;
  font-style: italic;
  line-height: 1.6;
  margin: 0;
  padding-top: 8px;
  border-top: 1px solid #eee;
}

@media print {
  .rx-footer__notes {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>
