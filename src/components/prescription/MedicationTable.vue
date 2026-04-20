<template>
  <div class="rx-med-table">
    <div class="rx-med-table__header">
      <div class="d-flex align-center gap-2">
        <v-icon color="primary">mdi-pill</v-icon>
        <h3 class="rx-med-table__title">{{ $t('rx.medications') }}</h3>
        <v-chip size="x-small" color="primary" variant="tonal" class="ms-1">
          {{ medications.length }}
        </v-chip>
      </div>
    </div>

    <!-- ═══ Screen: Desktop Table (hidden in print) ═══ -->
    <div class="rx-med-table__screen-view d-none d-sm-block">
      <div class="rx-med-table__wrap" v-if="medications.length">
        <table class="rx-med-table__table">
          <thead>
            <tr>
              <th class="rx-med-table__th rx-med-table__th--num">#</th>
              <th class="rx-med-table__th rx-med-table__th--name">{{ $t('rx.medication_name') }}</th>
              <th class="rx-med-table__th">{{ $t('rx.dosage') }}</th>
              <th class="rx-med-table__th">{{ $t('rx.form') }}</th>
              <th class="rx-med-table__th">{{ $t('rx.frequency') }}</th>
              <th class="rx-med-table__th">{{ $t('rx.duration') }}</th>
              <th class="rx-med-table__th rx-med-table__th--instr">{{ $t('rx.instructions') }}</th>
              <th v-if="editable" class="rx-med-table__th rx-med-table__th--actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(med, idx) in medications" :key="idx" class="rx-med-table__row">
              <td class="rx-med-table__td rx-med-table__td--num">{{ idx + 1 }}</td>
              <td class="rx-med-table__td rx-med-table__td--name">
                <span class="rx-med-table__pill-icon">💊</span>
                {{ med.medication_name }}
              </td>
              <td class="rx-med-table__td">{{ med.dosage || '—' }}</td>
              <td class="rx-med-table__td">
                <v-chip v-if="med.form" size="x-small" variant="tonal" color="primary">{{ med.form }}</v-chip>
                <span v-else>—</span>
              </td>
              <td class="rx-med-table__td">{{ med.frequency || '—' }}</td>
              <td class="rx-med-table__td">{{ med.duration || '—' }}</td>
              <td class="rx-med-table__td rx-med-table__td--instr">{{ med.instructions || '—' }}</td>
              <td v-if="editable" class="rx-med-table__td rx-med-table__td--actions">
                <v-btn icon="mdi-pencil" variant="text" size="x-small" color="primary" @click="$emit('edit', idx)" />
                <v-btn icon="mdi-delete" variant="text" size="x-small" color="error" @click="$emit('remove', idx)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ═══ Screen: Mobile Cards (hidden in print) ═══ -->
    <div class="rx-med-table__screen-view d-sm-none">
      <v-card
        v-for="(med, idx) in medications"
        :key="idx"
        variant="outlined"
        rounded="lg"
        class="rx-med-table__card mb-3"
      >
        <v-card-text class="pa-3">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="d-flex align-center gap-2">
              <v-avatar size="28" color="primary" variant="tonal">
                <span class="text-caption font-weight-bold">{{ idx + 1 }}</span>
              </v-avatar>
              <span class="font-weight-bold text-body-2">
                💊 {{ med.medication_name }}
              </span>
            </div>
            <div v-if="editable" class="d-flex">
              <v-btn icon="mdi-pencil" variant="text" size="x-small" color="primary" @click="$emit('edit', idx)" />
              <v-btn icon="mdi-delete" variant="text" size="x-small" color="error" @click="$emit('remove', idx)" />
            </div>
          </div>
          <div class="rx-med-table__card-grid">
            <div v-if="med.dosage" class="rx-med-table__card-field">
              <span class="rx-med-table__card-label">{{ $t('rx.dosage') }}</span>
              <span>{{ med.dosage }}</span>
            </div>
            <div v-if="med.form" class="rx-med-table__card-field">
              <span class="rx-med-table__card-label">{{ $t('rx.form') }}</span>
              <v-chip size="x-small" variant="tonal" color="primary">{{ med.form }}</v-chip>
            </div>
            <div v-if="med.frequency" class="rx-med-table__card-field">
              <span class="rx-med-table__card-label">{{ $t('rx.frequency') }}</span>
              <span>{{ med.frequency }}</span>
            </div>
            <div v-if="med.duration" class="rx-med-table__card-field">
              <span class="rx-med-table__card-label">{{ $t('rx.duration') }}</span>
              <span>{{ med.duration }}</span>
            </div>
            <div v-if="med.instructions" class="rx-med-table__card-field" style="grid-column: 1 / -1">
              <span class="rx-med-table__card-label">{{ $t('rx.instructions') }}</span>
              <span>{{ med.instructions }}</span>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- ═══ Print: Compact Rx-style rows ═══ -->
    <div class="rx-med-table__print-view" v-if="medications.length">
      <div
        v-for="(med, idx) in medications"
        :key="'p-' + idx"
        class="rx-med-print-row"
      >
        <span class="rx-med-print-row__num">{{ idx + 1 }}</span>
        <div class="rx-med-print-row__body">
          <!-- Line 1: Drug name + dosage -->
          <div class="rx-med-print-row__drug">
            <span class="rx-med-print-row__name">{{ med.medication_name }}</span>
            <span v-if="med.dosage" class="rx-med-print-row__dose">{{ med.dosage }}</span>
          </div>
          <!-- Line 2: form + frequency × duration — instructions -->
          <div class="rx-med-print-row__regimen">
            <span v-if="med.form">{{ med.form }}</span>
            <span v-if="med.form && med.frequency" class="rx-med-print-row__sep">—</span>
            <span v-if="med.frequency">{{ med.frequency }}</span>
            <span v-if="med.duration"> × {{ med.duration }}</span>
            <span v-if="med.instructions" class="rx-med-print-row__sep">—</span>
            <span v-if="med.instructions" class="rx-med-print-row__instr">{{ med.instructions }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!medications.length" class="rx-med-table__empty">
      <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-pill-off</v-icon>
      <p class="text-grey">{{ $t('rx.no_medications_added') }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  medications: {
    type: Array,
    default: () => []
  },
  editable: {
    type: Boolean,
    default: false
  }
})

defineEmits(['edit', 'remove'])
</script>

<style scoped>
.rx-med-table__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.rx-med-table__title {
  font-size: 1rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

/* ===== Table ===== */
.rx-med-table__wrap {
  overflow-x: auto;
  border: 1.5px solid rgba(var(--v-theme-primary), 0.12);
  border-radius: 10px;
}

.rx-med-table__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.rx-med-table__th {
  padding: 10px 14px;
  text-align: start;
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  background: rgb(var(--v-theme-primary));
  color: #fff;
  white-space: nowrap;
}
.rx-med-table__th--num {
  width: 40px;
  text-align: center;
}
.rx-med-table__th--name {
  min-width: 150px;
}
.rx-med-table__th--instr {
  min-width: 120px;
}
.rx-med-table__th--actions {
  width: 80px;
}

.rx-med-table__td {
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
  color: #444;
  vertical-align: middle;
}
.rx-med-table__td--num {
  text-align: center;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
}
.rx-med-table__td--name {
  font-weight: 600;
  color: #222;
}
.rx-med-table__td--instr {
  font-size: 0.8rem;
  color: #666;
}
.rx-med-table__td--actions {
  white-space: nowrap;
}

.rx-med-table__pill-icon {
  margin-inline-end: 6px;
}

.rx-med-table__row:nth-child(even) {
  background: #f8fafc;
}
.rx-med-table__row:last-child .rx-med-table__td {
  border-bottom: none;
}
.rx-med-table__row:hover {
  background: rgba(var(--v-theme-primary), 0.03);
}

/* ===== Mobile Cards ===== */
.rx-med-table__card {
  border-color: rgba(var(--v-theme-primary), 0.12) !important;
}

.rx-med-table__card-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.rx-med-table__card-field {
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-size: 0.82rem;
}

.rx-med-table__card-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* ===== Empty ===== */
.rx-med-table__empty {
  text-align: center;
  padding: 40px 20px;
}

/* ===== Print Card Layout (hidden on screen) ===== */
.rx-med-table__print-view {
  display: none;
}

/* ===== Print ===== */
@media print {
  .rx-med-table__screen-view { display: none !important; }
  .rx-med-table__print-view { display: block !important; }
}
</style>
