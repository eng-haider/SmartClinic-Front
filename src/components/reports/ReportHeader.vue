<template>
  <div class="report-header mb-6">
    <div class="report-header__top">
      <div class="report-header__text mobile-page-heading">
        <h1 class="text-h5 font-weight-medium">{{ title }}</h1>
        <p v-if="subtitle" class="text-body-2 text-medium-emphasis mt-1">{{ subtitle }}</p>
      </div>
      <div v-if="showExport" class="report-header__export">
        <v-btn
          variant="outlined"
          color="primary"
          size="small"
          prepend-icon="mdi-file-pdf-box"
          :loading="exportingPdf"
          :disabled="disableExport"
          @click="$emit('export-pdf')"
        >
          {{ $t('reports.common.exportPdf') }}
        </v-btn>
        <v-btn
          variant="outlined"
          color="success"
          size="small"
          prepend-icon="mdi-file-excel-box"
          :loading="exportingExcel"
          :disabled="disableExport"
          @click="$emit('export-excel')"
        >
          {{ $t('reports.common.exportExcel') }}
        </v-btn>
      </div>
    </div>

    <div class="report-header__filters">
      <div class="date-tabs">
        <v-btn
          v-for="preset in presets"
          :key="preset.value"
          size="small"
          :variant="period === preset.value ? 'flat' : 'outlined'"
          :color="period === preset.value ? 'primary' : undefined"
          class="date-tab-btn"
          @click="$emit('update:period', preset.value)"
        >
          {{ preset.label }}
        </v-btn>

        <v-menu :close-on-content-click="false" location="bottom start">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              size="small"
              :variant="period === 'custom' ? 'flat' : 'outlined'"
              :color="period === 'custom' ? 'primary' : undefined"
              prepend-icon="mdi-calendar-range"
            >
              {{ $t('reports.common.customRange') }}
            </v-btn>
          </template>
          <v-card min-width="260" class="pa-4">
            <v-text-field
              v-model="tempFrom"
              :label="$t('reports.common.dateFrom')"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              class="mb-3"
            />
            <v-text-field
              v-model="tempTo"
              :label="$t('reports.common.dateTo')"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              class="mb-3"
            />
            <v-btn block color="primary" size="small" @click="applyCustom">
              {{ $t('reports.common.apply') }}
            </v-btn>
          </v-card>
        </v-menu>
      </div>

      <div class="report-header__scope">
        <v-select
          v-if="showDoctorSelect"
          :model-value="doctorId"
          :items="doctors"
          item-title="name"
          item-value="id"
          :label="$t('reports.common.doctor')"
          :placeholder="$t('reports.common.allDoctors')"
          persistent-placeholder
          prepend-inner-icon="mdi-doctor"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          :loading="loadingDoctors"
          class="doctor-select"
          @update:model-value="setDoctorId"
        />
        <div class="range-label text-caption text-medium-emphasis">
          <v-icon size="14" class="me-1">mdi-calendar-blank-outline</v-icon>
          {{ rangeLabel }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useReportDoctorFilter } from '@/composables/useReportDoctorFilter'

const { t } = useI18n()

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: null },
  period: { type: String, default: 'month' },
  from: { type: String, required: true },
  to: { type: String, required: true },
  rangeLabel: { type: String, default: '' },
  exportingPdf: { type: Boolean, default: false },
  exportingExcel: { type: Boolean, default: false },
  disableExport: { type: Boolean, default: false },
  showExport: { type: Boolean, default: true },
  // Doctor selector — only rendered for users allowed to see every doctor.
  showDoctorFilter: { type: Boolean, default: true }
})

const emit = defineEmits(['update:period', 'update:range', 'export-pdf', 'export-excel'])

const presets = [
  { value: 'today', get label() { return t('reports.common.today') } },
  { value: 'week', get label() { return t('reports.common.thisWeek') } },
  { value: 'month', get label() { return t('reports.common.thisMonth') } },
  { value: 'year', get label() { return t('reports.common.thisYear') } }
]

const tempFrom = ref(props.from)
const tempTo = ref(props.to)

watch(() => [props.from, props.to], ([f, t2]) => {
  tempFrom.value = f
  tempTo.value = t2
})

const { doctorId, doctors, loadingDoctors, canFilterByDoctor, setDoctorId, loadDoctors } = useReportDoctorFilter()
const showDoctorSelect = computed(() => props.showDoctorFilter && canFilterByDoctor.value)

onMounted(() => {
  if (showDoctorSelect.value) loadDoctors()
})

function applyCustom() {
  if (tempFrom.value && tempTo.value) {
    emit('update:range', { from: tempFrom.value, to: tempTo.value })
  }
}
</script>

<style scoped>
.report-header__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}
.report-header__export {
  display: flex;
  gap: 8px;
}
.report-header__filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}
.date-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.date-tab-btn {
  min-width: 0;
}
.report-header__scope {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.doctor-select {
  width: 220px;
  flex: 0 0 auto;
}
.range-label {
  display: flex;
  align-items: center;
}

@media (max-width: 600px) {
  .report-header__top {
    flex-direction: column;
    align-items: stretch;
  }
  .report-header__export {
    width: 100%;
  }
  .report-header__export .v-btn {
    flex: 1;
  }
  .report-header__filters {
    flex-direction: column;
    align-items: stretch;
  }
  .date-tabs .v-btn {
    flex: 1;
  }
  .report-header__scope {
    flex-direction: column;
    align-items: stretch;
  }
  .doctor-select {
    width: 100%;
  }
}
</style>
