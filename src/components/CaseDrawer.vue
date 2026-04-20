<template>
  <!-- Mobile: bottom sheet -->
  <v-bottom-sheet
    v-if="isMobile"
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="600"
    scrollable
  >
    <v-card class="case-drawer case-drawer-sheet">
      <!-- Header -->
      <div class="drawer-header">
        <div class="d-flex align-center ga-3">
          <v-avatar :color="statusColor" size="36">
            <v-icon color="white" size="18">mdi-clipboard-text</v-icon>
          </v-avatar>
          <div>
            <div class="text-subtitle-1 font-weight-bold">{{ $t('cases.case_details') }}</div>
            <div class="text-caption text-grey">#{{ caseData?.id }}</div>
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('update:modelValue', false)" />
      </div>

      <v-divider />

      <v-card-text class="pa-0" style="max-height: 70vh; overflow-y: auto;">
        <div v-if="caseData" class="drawer-body">
          <!-- Status + Payment row -->
          <div class="drawer-badges">
            <v-chip :color="statusColor" variant="tonal" size="small">
              <v-icon start size="14">{{ statusIcon }}</v-icon>
              {{ statusLabel }}
            </v-chip>
            <v-chip :color="caseData.is_paid ? 'success' : 'warning'" variant="flat" size="small">
              <v-icon start size="14">{{ caseData.is_paid ? 'mdi-check-circle' : 'mdi-clock-outline' }}</v-icon>
              {{ caseData.is_paid ? $t('cases.paid') : $t('cases.unpaid') }}
            </v-chip>
            <v-chip v-if="caseData.category" variant="tonal" size="small" :color="categoryColor">
              {{ caseData.category?.name || '-' }}
            </v-chip>
          </div>

          <!-- Info Grid -->
          <div class="info-section">
            <div v-if="caseData.patient" class="info-row">
              <div class="info-label"><v-icon size="16" color="grey">mdi-account</v-icon>{{ $t('cases.patient') }}</div>
              <div class="info-value font-weight-medium">{{ caseData.patient?.name || '-' }}</div>
            </div>
            <div class="info-row">
              <div class="info-label"><v-icon size="16" color="grey">mdi-doctor</v-icon>{{ $t('cases.doctor') || $t('common.doctor') }}</div>
              <div class="info-value">{{ caseData.doctor?.name || '-' }}</div>
            </div>
            <div class="info-row">
              <div class="info-label"><v-icon size="16" color="grey">mdi-cash</v-icon>{{ $t('cases.price') }}</div>
              <div class="info-value font-weight-bold">{{ formatCurrency(caseData.price) }}</div>
            </div>
            <div v-if="remainingAmount !== null" class="info-row">
              <div class="info-label"><v-icon size="16" color="grey">mdi-cash-clock</v-icon>{{ $t('patients.remaining') || 'Remaining' }}</div>
              <div class="info-value" :class="remainingAmount > 0 ? 'text-warning' : 'text-success'">{{ formatCurrency(remainingAmount) }}</div>
            </div>
            <div class="info-row">
              <div class="info-label"><v-icon size="16" color="grey">mdi-calendar</v-icon>{{ $t('common.date') }}</div>
              <div class="info-value">{{ formatDate(caseData.case_date || caseData.created_at) }}</div>
            </div>
          </div>

          <v-divider class="my-3" />

          <div class="info-section">
            <div class="section-title text-caption text-uppercase font-weight-bold text-grey mb-2">{{ $t('cases.clinical_details') || 'Clinical Details' }}</div>
            <component v-if="specialtyInfoComponent" :is="specialtyInfoComponent" :caseData="caseData" />
            <div v-else-if="caseData.tooth_num" class="info-row">
              <div class="info-label"><v-icon size="16" color="grey">mdi-tooth</v-icon>{{ $t('cases.tooth_num') || $t('patients.toothNumber') }}</div>
              <div class="info-value">{{ caseData.tooth_num }}</div>
            </div>
          </div>

          <div v-if="caseData.bills && caseData.bills.length" class="info-section mt-3">
            <v-divider class="mb-3" />
            <div class="section-title text-caption text-uppercase font-weight-bold text-grey mb-2">{{ $t('patients.bills') || 'Bills' }}</div>
            <div class="bills-list">
              <div v-for="bill in caseData.bills" :key="bill.id" class="bill-row">
                <v-icon size="14" color="success">mdi-check-circle</v-icon>
                <span class="font-weight-medium">{{ formatCurrency(bill.price) }}</span>
                <span class="text-caption text-grey">{{ formatDate(bill.created_at) }}</span>
              </div>
            </div>
          </div>

          <div v-if="notes && notes.length" class="info-section mt-3">
            <v-divider class="mb-3" />
            <div class="section-title text-caption text-uppercase font-weight-bold text-grey mb-2">{{ $t('patients.notes') || 'Notes' }} ({{ notes.length }})</div>
            <div class="notes-list">
              <div v-for="note in notes" :key="note.id" class="note-item">
                <div class="d-flex align-center justify-space-between">
                  <span class="text-caption font-weight-medium">{{ note.creator?.name || '-' }}</span>
                  <span class="text-caption text-grey">{{ formatDate(note.created_at) }}</span>
                </div>
                <div class="text-body-2 mt-1">{{ note.content }}</div>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-divider />
      <v-card-actions class="drawer-footer">
        <v-btn v-if="showViewFull" color="primary" variant="flat" size="small" prepend-icon="mdi-open-in-new" @click="$emit('view-full', caseData)">
          {{ $t('cases.view_full') || 'View Full Details' }}
        </v-btn>
        <v-btn variant="tonal" size="small" prepend-icon="mdi-pencil" @click="$emit('edit', caseData)">
          {{ $t('common.edit') || 'Edit' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-bottom-sheet>

  <!-- Desktop: side navigation drawer -->
  <v-navigation-drawer
    v-else
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    location="end"
    temporary
    width="520"
    class="case-drawer"
  >
    <!-- Header -->
    <div class="drawer-header">
      <div class="d-flex align-center ga-3">
        <v-avatar :color="statusColor" size="36">
          <v-icon color="white" size="18">mdi-clipboard-text</v-icon>
        </v-avatar>
        <div>
          <div class="text-subtitle-1 font-weight-bold">{{ $t('cases.case_details') }}</div>
          <div class="text-caption text-grey">#{{ caseData?.id }}</div>
        </div>
      </div>
      <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('update:modelValue', false)" />
    </div>

    <v-divider />

    <!-- Content -->
    <div v-if="caseData" class="drawer-body">
      <!-- Status + Payment row -->
      <div class="drawer-badges">
        <v-chip :color="statusColor" variant="tonal" size="small">
          <v-icon start size="14">{{ statusIcon }}</v-icon>
          {{ statusLabel }}
        </v-chip>
        <v-chip :color="caseData.is_paid ? 'success' : 'warning'" variant="flat" size="small">
          <v-icon start size="14">{{ caseData.is_paid ? 'mdi-check-circle' : 'mdi-clock-outline' }}</v-icon>
          {{ caseData.is_paid ? $t('cases.paid') : $t('cases.unpaid') }}
        </v-chip>
        <v-chip v-if="caseData.category" variant="tonal" size="small" :color="categoryColor">
          {{ caseData.category?.name || '-' }}
        </v-chip>
      </div>

      <!-- Info Grid -->
      <div class="info-section">
        <!-- Patient -->
        <div v-if="caseData.patient" class="info-row">
          <div class="info-label">
            <v-icon size="16" color="grey">mdi-account</v-icon>
            {{ $t('cases.patient') }}
          </div>
          <div class="info-value font-weight-medium">{{ caseData.patient?.name || '-' }}</div>
        </div>

        <!-- Doctor -->
        <div class="info-row">
          <div class="info-label">
            <v-icon size="16" color="grey">mdi-doctor</v-icon>
            {{ $t('cases.doctor') || $t('common.doctor') }}
          </div>
          <div class="info-value">{{ caseData.doctor?.name || '-' }}</div>
        </div>

        <!-- Price -->
        <div class="info-row">
          <div class="info-label">
            <v-icon size="16" color="grey">mdi-cash</v-icon>
            {{ $t('cases.price') }}
          </div>
          <div class="info-value font-weight-bold">{{ formatCurrency(caseData.price) }}</div>
        </div>

        <!-- Remaining -->
        <div v-if="remainingAmount !== null" class="info-row">
          <div class="info-label">
            <v-icon size="16" color="grey">mdi-cash-clock</v-icon>
            {{ $t('patients.remaining') || 'Remaining' }}
          </div>
          <div class="info-value" :class="remainingAmount > 0 ? 'text-warning' : 'text-success'">
            {{ formatCurrency(remainingAmount) }}
          </div>
        </div>

        <!-- Date -->
        <div class="info-row">
          <div class="info-label">
            <v-icon size="16" color="grey">mdi-calendar</v-icon>
            {{ $t('common.date') || $t('cases.created_at') }}
          </div>
          <div class="info-value">{{ formatDate(caseData.case_date || caseData.created_at) }}</div>
        </div>
      </div>

      <v-divider class="my-3" />

      <!-- Specialty-Specific Fields -->
      <div class="info-section">
        <div class="section-title text-caption text-uppercase font-weight-bold text-grey mb-2">
          {{ $t('cases.clinical_details') || 'Clinical Details' }}
        </div>
        <component
          v-if="specialtyInfoComponent"
          :is="specialtyInfoComponent"
          :caseData="caseData"
        />
        <!-- Fallback for dental tooth_num if no specialty info component -->
        <div v-else-if="caseData.tooth_num" class="info-row">
          <div class="info-label">
            <v-icon size="16" color="grey">mdi-tooth</v-icon>
            {{ $t('cases.tooth_num') || $t('patients.toothNumber') }}
          </div>
          <div class="info-value">{{ caseData.tooth_num }}</div>
        </div>
      </div>

      <!-- Bills -->
      <div v-if="caseData.bills && caseData.bills.length" class="info-section mt-3">
        <v-divider class="mb-3" />
        <div class="section-title text-caption text-uppercase font-weight-bold text-grey mb-2">
          {{ $t('patients.bills') || 'Bills' }}
        </div>
        <div class="bills-list">
          <div v-for="bill in caseData.bills" :key="bill.id" class="bill-row">
            <v-icon size="14" color="success">mdi-check-circle</v-icon>
            <span class="font-weight-medium">{{ formatCurrency(bill.price) }}</span>
            <span class="text-caption text-grey">{{ formatDate(bill.created_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="notes && notes.length" class="info-section mt-3">
        <v-divider class="mb-3" />
        <div class="section-title text-caption text-uppercase font-weight-bold text-grey mb-2">
          {{ $t('patients.notes') || 'Notes' }} ({{ notes.length }})
        </div>
        <div class="notes-list">
          <div v-for="note in notes" :key="note.id" class="note-item">
            <div class="d-flex align-center justify-space-between">
              <span class="text-caption font-weight-medium">{{ note.creator?.name || '-' }}</span>
              <span class="text-caption text-grey">{{ formatDate(note.created_at) }}</span>
            </div>
            <div class="text-body-2 mt-1">{{ note.content }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <template #append>
      <v-divider />
      <div class="drawer-footer">
        <v-btn
          v-if="showViewFull"
          color="primary"
          variant="flat"
          size="small"
          prepend-icon="mdi-open-in-new"
          @click="$emit('view-full', caseData)"
        >
          {{ $t('cases.view_full') || 'View Full Details' }}
        </v-btn>
        <v-btn
          variant="tonal"
          size="small"
          prepend-icon="mdi-pencil"
          @click="$emit('edit', caseData)"
        >
          {{ $t('common.edit') || 'Edit' }}
        </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
</template>


<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import { specialtyInfos } from '@/config/specialties'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  caseData: { type: Object, default: null },
  notes: { type: Array, default: () => [] },
  showViewFull: { type: Boolean, default: true },
  showPatient: { type: Boolean, default: true },
})

defineEmits(['update:modelValue', 'view-full', 'edit'])

const { t } = useI18n()
const { mobile: isMobile } = useDisplay()
const authStore = useAuthStore()

const specialtyInfoComponent = computed(() => {
  return specialtyInfos[authStore.specialty] || null
})

const statusColor = computed(() => {
  const id = props.caseData?.status?.id
  const map = { 1: 'warning', 2: 'info', 3: 'success', 4: 'error' }
  return map[id] || 'grey'
})

const statusIcon = computed(() => {
  const id = props.caseData?.status?.id
  const map = { 1: 'mdi-clock-outline', 2: 'mdi-progress-wrench', 3: 'mdi-check-circle', 4: 'mdi-close-circle' }
  return map[id] || 'mdi-help-circle'
})

const statusLabel = computed(() => {
  const status = props.caseData?.status
  if (!status) return '-'
  const locale = localStorage.getItem('locale') || 'ar'
  if (locale === 'ar') return status.name_ar || status.name || '-'
  if (locale === 'ku') return status.name_ku || status.name_en || status.name || '-'
  return status.name_en || status.name || '-'
})

const categoryColor = computed(() => {
  const colors = ['primary', 'success', 'warning', 'info', 'error', 'secondary']
  const id = props.caseData?.category?.id || 0
  return colors[id % colors.length]
})

const remainingAmount = computed(() => {
  if (!props.caseData?.bills) return null
  const totalPaid = props.caseData.bills.reduce((sum, b) => sum + (b.price || 0), 0)
  return (props.caseData.price || 0) - totalPaid
})

function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(amount) + ' IQD'
}

function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}
</script>

<style scoped>
.case-drawer {
  font-family: inherit;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
}

.drawer-body {
  padding: 16px 20px;
  overflow-y: auto;
}

.drawer-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-title {
  letter-spacing: 0.5px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}
.info-row:last-child {
  border-bottom: none;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;
}

.info-value {
  font-size: 13px;
  color: #1e293b;
}

.bills-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.bill-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #f8fdf8;
  border-radius: 6px;
  font-size: 13px;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.note-item {
  padding: 8px 12px;
  background: #f8f9fb;
  border-radius: 8px;
  border-left: 3px solid rgb(var(--v-theme-primary));
}

.drawer-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
}
</style>
