<template>
  <v-card variant="outlined" rounded="lg" class="rx-patient-info">
    <v-card-text class="pa-4">
      <div class="rx-patient-info__grid">
        <!-- Patient Name -->
        <div class="rx-patient-info__cell rx-patient-info__cell--name">
          <v-icon size="18" color="primary" class="me-2">mdi-account</v-icon>
          <div>
            <span class="rx-patient-info__label">{{ $t('rx.patient_name') }}</span>
            <span class="rx-patient-info__value rx-patient-info__value--bold">{{ name || '—' }}</span>
          </div>
        </div>

        <!-- Age / Gender -->
        <div class="rx-patient-info__cell">
          <v-icon size="18" color="primary" class="me-2">mdi-calendar-account</v-icon>
          <div>
            <span class="rx-patient-info__label">{{ $t('rx.age_gender') }}</span>
            <span class="rx-patient-info__value">
              <template v-if="age">{{ age }}</template>
              <template v-if="age && gender"> / </template>
              <template v-if="gender">{{ gender }}</template>
              <template v-if="!age && !gender">—</template>
            </span>
          </div>
        </div>

        <!-- Date -->
        <div class="rx-patient-info__cell">
          <v-icon size="18" color="primary" class="me-2">mdi-calendar</v-icon>
          <div>
            <span class="rx-patient-info__label">{{ $t('rx.date') }}</span>
            <span class="rx-patient-info__value">{{ formattedDate }}</span>
          </div>
        </div>

        <!-- Case ID -->
        <div v-if="caseId" class="rx-patient-info__cell">
          <v-icon size="18" color="primary" class="me-2">mdi-identifier</v-icon>
          <div>
            <span class="rx-patient-info__label">{{ $t('rx.case_id') }}</span>
            <span class="rx-patient-info__value">#{{ caseId }}</span>
          </div>
        </div>

        <!-- Phone -->
        <div v-if="phone" class="rx-patient-info__cell">
          <v-icon size="18" color="primary" class="me-2">mdi-phone</v-icon>
          <div>
            <span class="rx-patient-info__label">{{ $t('rx.phone') }}</span>
            <span class="rx-patient-info__value" dir="ltr">{{ phone }}</span>
          </div>
        </div>

        <!-- Doctor -->
        <div v-if="doctorName" class="rx-patient-info__cell">
          <v-icon size="18" color="primary" class="me-2">mdi-doctor</v-icon>
          <div>
            <span class="rx-patient-info__label">{{ $t('rx.doctor') }}</span>
            <span class="rx-patient-info__value">{{ doctorName }}</span>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  name: { type: String, default: '' },
  age: { type: [String, Number], default: '' },
  gender: { type: String, default: '' },
  date: { type: String, default: '' },
  caseId: { type: [String, Number], default: '' },
  phone: { type: String, default: '' },
  doctorName: { type: String, default: '' }
})

const { locale } = useI18n()

const formattedDate = computed(() => {
  if (!props.date) {
    return new Date().toLocaleDateString(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  }
  const d = new Date(props.date)
  return d.toLocaleDateString(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
})
</script>

<style scoped>
.rx-patient-info {
  border-color: rgba(var(--v-theme-primary), 0.15) !important;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.02), transparent);
}

.rx-patient-info__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px 24px;
}

.rx-patient-info__cell {
  display: flex;
  align-items: flex-start;
}

.rx-patient-info__label {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 1px;
}

.rx-patient-info__value {
  display: block;
  font-size: 0.9rem;
  color: #333;
}

.rx-patient-info__value--bold {
  font-weight: 700;
  font-size: 0.95rem;
}

@media (max-width: 600px) {
  .rx-patient-info__grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .rx-patient-info__cell--name {
    grid-column: 1 / -1;
  }
}

@media print {
  .rx-patient-info {
    border: 1.5px solid #ddd !important;
    box-shadow: none !important;
  }
}
</style>
