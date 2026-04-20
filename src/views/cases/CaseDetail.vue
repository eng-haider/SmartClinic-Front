<template>
  <div class="case-detail-page">
    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center align-center" style="min-height: 400px;">
      <v-progress-circular indeterminate color="primary" size="64" />
    </div>

    <!-- Error State -->
    <v-alert v-else-if="error" type="error" variant="tonal" class="ma-4">
      {{ error }}
      <template v-slot:append>
        <v-btn variant="text" @click="loadCase">{{ $t('common.retry') }}</v-btn>
      </template>
    </v-alert>

    <!-- Case Content -->
    <template v-else-if="caseData">
      <!-- Page Header -->
      <div class="page-header mb-6">
        <div class="d-flex flex-wrap align-center justify-space-between ga-4">
          <div class="d-flex align-center ga-3">
            <v-btn
              icon="mdi-arrow-left"
              variant="text"
              @click="goBack"
            />
            <div>
              <h1 class="text-h4 font-weight-bold text-primary">
                {{ $t('cases.case_details') }} #{{ caseData.id }}
              </h1>
              <p class="text-grey mt-1">{{ formatDate(caseData.created_at) }}</p>
            </div>
          </div>
          <div class="d-flex ga-2">
            <v-chip
              :color="caseData.is_paid ? 'success' : 'warning'"
              size="large"
              variant="flat"
            >
              <v-icon start>{{ caseData.is_paid ? 'mdi-check-circle' : 'mdi-clock-outline' }}</v-icon>
              {{ caseData.is_paid ? $t('cases.paid') : $t('cases.unpaid') }}
            </v-chip>
          </div>
        </div>
      </div>

      <v-row>
        <!-- Main Info Card -->
        <v-col cols="12" md="8">
          <v-card elevation="2" rounded="xl" class="mb-6">
            <v-card-title class="pa-4 bg-primary">
              <span class="text-white">{{ $t('cases.case_info') }}</span>
            </v-card-title>
            <v-card-text class="pa-6">
              <v-row>
                <!-- Category -->
                <v-col cols="12" md="6">
                  <div class="info-item">
                    <v-icon color="primary" size="24">mdi-folder</v-icon>
                    <div>
                      <div class="text-caption text-grey">{{ $t('cases.category') }}</div>
                      <div class="font-weight-medium text-h6">{{ caseData.category?.name || '-' }}</div>
                    </div>
                  </div>
                </v-col>

                <!-- Specialty Info specific fields -->
                <component 
                  v-if="specialtyInfos[authStore.specialty]"
                  :is="specialtyInfos[authStore.specialty]" 
                  :caseData="caseData" 
                />

                <!-- Price -->
                <v-col cols="12" md="6">
                  <div class="info-item">
                    <v-icon color="success" size="24">mdi-currency-usd</v-icon>
                    <div>
                      <div class="text-caption text-grey">{{ $t('cases.price') }}</div>
                      <div class="font-weight-medium text-h6">{{ formatCurrency(caseData.price) }}</div>
                    </div>
                  </div>
                </v-col>

                <!-- Status -->
                <v-col cols="12" md="6">
                  <div class="info-item">
                    <v-icon :color="getStatusColor(caseData.status?.id)" size="24">mdi-flag</v-icon>
                    <div>
                      <div class="text-caption text-grey">{{ $t('cases.status') }}</div>
                      <v-chip :color="getStatusColor(caseData.status?.id)" size="small" variant="tonal">
                        {{ caseData.status?.name || '-' }}
                      </v-chip>
                    </div>
                  </div>
                </v-col>

                <!-- Notes -->
                <v-col cols="12" v-if="caseData.notes">
                  <div class="info-item">
                    <v-icon color="grey" size="24">mdi-note-text</v-icon>
                    <div>
                      <div class="text-caption text-grey">{{ $t('cases.notes') }}</div>
                      <div class="font-weight-medium">{{ caseData.notes }}</div>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Bills Section -->
          <v-card v-if="canViewBills" elevation="2" rounded="xl">
            <v-card-title class="pa-4 d-flex align-center justify-space-between">
              <div class="d-flex align-center ga-2">
                <v-icon color="success">mdi-receipt</v-icon>
                <span>{{ $t('cases.bills') }}</span>
                <v-chip size="x-small" color="primary" variant="tonal">
                  {{ (caseData.bills || []).length }}
                </v-chip>
              </div>
            </v-card-title>
            <v-divider />

            <!-- Bills Summary Row -->
            <v-card-text class="pa-4 pb-2">
              <v-row dense>
                <v-col cols="4">
                  <div class="text-center pa-3 rounded-lg bg-blue-lighten-5">
                    <div class="text-caption text-grey">{{ $t('cases.price') }}</div>
                    <div class="font-weight-bold text-body-1 text-primary">{{ formatCurrency(caseData.price) }}</div>
                  </div>
                </v-col>
                <v-col cols="4">
                  <div class="text-center pa-3 rounded-lg bg-green-lighten-5">
                    <div class="text-caption text-grey">{{ $t('patients.paidBills') }}</div>
                    <div class="font-weight-bold text-body-1 text-success">{{ formatCurrency(totalPaid) }}</div>
                  </div>
                </v-col>
                <v-col cols="4">
                  <div class="text-center pa-3 rounded-lg" :class="remaining > 0 ? 'bg-orange-lighten-5' : 'bg-green-lighten-5'">
                    <div class="text-caption text-grey">{{ $t('patients.remaining') }}</div>
                    <div class="font-weight-bold text-body-1" :class="remaining > 0 ? 'text-warning' : 'text-success'">
                      {{ remaining > 0 ? formatCurrency(remaining) : $t('patients.fullyPaid') }}
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>

            <v-divider />

            <!-- Bills List -->
            <div v-if="caseData.bills && caseData.bills.length > 0">
              <v-list density="compact">
                <v-list-item
                  v-for="bill in caseData.bills"
                  :key="bill.id"
                  class="px-4 py-2"
                >
                  <template v-slot:prepend>
                    <v-icon :color="bill.is_paid ? 'success' : 'warning'" size="20">
                      {{ bill.is_paid ? 'mdi-check-circle' : 'mdi-clock-outline' }}
                    </v-icon>
                  </template>
                  <v-list-item-title class="font-weight-medium">
                    {{ formatCurrency(bill.price) }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-caption">
                    {{ formatDate(bill.created_at) }}
                  </v-list-item-subtitle>
                  <template v-slot:append>
                    <v-chip
                      :color="bill.is_paid ? 'success' : 'warning'"
                      size="small"
                      variant="flat"
                    >
                      {{ bill.is_paid ? $t('cases.paid') : $t('cases.unpaid') }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </div>
            <div v-else class="text-center py-6 text-grey">
              <v-icon size="36" color="grey-lighten-2">mdi-receipt-text-outline</v-icon>
              <p class="text-caption mt-1">{{ $t('patients.no_bills') }}</p>
            </div>
          </v-card>
        </v-col>

        <!-- Side Cards -->
        <v-col cols="12" md="4">
          <!-- Patient Card -->
          <v-card elevation="2" rounded="xl" class="mb-6">
            <v-card-title class="pa-4">
              <v-icon start color="primary">mdi-account</v-icon>
              {{ $t('cases.patient') }}
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-4">
              <div class="d-flex align-center ga-3 mb-4">
                <v-avatar :color="getAvatarColor(caseData.patient?.name)" size="56">
                  <span class="text-white font-weight-bold text-h6">
                    {{ getInitials(caseData.patient?.name) }}
                  </span>
                </v-avatar>
                <div>
                  <div class="font-weight-bold text-h6">{{ caseData.patient?.name || '-' }}</div>
                  <div class="text-caption text-grey">ID: {{ caseData.patient?.id || '-' }}</div>
                </div>
              </div>
              <v-btn
                v-if="canViewPatient && caseData.patient?.id"
                color="primary"
                variant="tonal"
                block
                @click="goToPatient"
              >
                <v-icon start>mdi-eye</v-icon>
                {{ $t('cases.view_patient') }}
              </v-btn>
            </v-card-text>
          </v-card>

          <!-- Doctor Card -->
          <v-card elevation="2" rounded="xl" class="mb-6">
            <v-card-title class="pa-4">
              <v-icon start color="info">mdi-doctor</v-icon>
              {{ $t('cases.doctor') }}
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-4">
              <div class="d-flex align-center ga-3">
                <v-avatar color="info" size="48">
                  <v-icon color="white">mdi-doctor</v-icon>
                </v-avatar>
                <div>
                  <div class="font-weight-bold">{{ caseData.doctor?.name || '-' }}</div>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- Dates Card -->
          <v-card elevation="2" rounded="xl">
            <v-card-title class="pa-4">
              <v-icon start color="grey">mdi-calendar</v-icon>
              {{ $t('cases.dates') }}
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-4">
              <div class="mb-3">
                <div class="text-caption text-grey">{{ $t('cases.created_at') }}</div>
                <div class="font-weight-medium">{{ formatDateTime(caseData.created_at) }}</div>
              </div>
              <div>
                <div class="text-caption text-grey">{{ $t('cases.updated_at') }}</div>
                <div class="font-weight-medium">{{ formatDateTime(caseData.updated_at) }}</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'
import { usePermissions } from '@/composables/usePermissions'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuthStore } from '@/stores/auth'
import { specialtyInfos } from '@/config/specialties'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

// Permissions
const { hasPermissionFor, hasPermission } = usePermissions()

// Permission computed refs for template
const canViewBills = computed(() => hasPermissionFor('bill'))
const canViewPatient = computed(() => hasPermissionFor('patient'))

// State
const loading = ref(true)
const error = ref('')
const caseData = ref(null)

// Bills computed
const totalPaid = computed(() => {
  const bills = caseData.value?.bills || []
  return bills.filter(b => b.is_paid).reduce((sum, b) => sum + (b.price || 0), 0)
})

const remaining = computed(() => {
  return (caseData.value?.price || 0) - totalPaid.value
})

// Load Case
async function loadCase() {
  loading.value = true
  error.value = ''
  
  try {
    const response = await api.get(`/cases/${route.params.id}`, {
      params: {
        include: 'patient,doctor,category,status,bills,ophthalmologyEncounterDetails'
      }
    })
    
    if (response.success) {
      caseData.value = response.data
    } else {
      throw new Error(response.message || 'Failed to load case')
    }
  } catch (err) {
    console.error('Error loading case:', err)
    error.value = err.response?.data?.message || err.message || t('cases.error_loading')
  } finally {
    loading.value = false
  }
}

// Navigation
function goBack() {
  router.back()
}

function goToPatient() {
  if (caseData.value?.patient?.id) {
    router.push(`/patients/${caseData.value.patient.id}`)
  }
}

// Helpers
function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getAvatarColor(name) {
  if (!name) return 'grey'
  const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info']
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

function getStatusColor(id) {
  const statusColors = {
    1: 'warning',
    2: 'info',
    3: 'success',
    4: 'error',
  }
  return statusColors[id] || 'grey'
}

function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateTime(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Lifecycle
onMounted(() => {
  loadCase()
})
</script>

<style scoped>
.case-detail-page {
  padding: 24px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 12px;
}

/* RTL Support */
[dir="rtl"] .case-detail-page {
  text-align: right;
}

/* Responsive */
@media (max-width: 960px) {
  .case-detail-page {
    padding: 16px;
  }
}
</style>
