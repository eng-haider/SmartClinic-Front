<template>
  <v-container fluid class="ophthal-patient-page pa-4" style="font-family:'Cairo',sans-serif">

    <!-- Loading -->
    <div v-if="loading" class="d-flex justify-center align-center" style="min-height:400px">
      <v-progress-circular indeterminate color="primary" size="64" />
    </div>

    <!-- Error -->
    <v-alert v-else-if="error" type="error" class="mb-4" closable @click:close="error = null">
      {{ error }}
    </v-alert>

    <template v-else>
      <!-- ── Patient Header ──────────────────────────────────────── -->
      <OphthalmologyPatientHeader
        :patient="patient"
        @edit="editDialog = true"
        @bill="openBillDialog"
        @recipe="openRecipeDialog"
      />

      <!-- ── Summary Cards ──────────────────────────────────────── -->
      <OphthalmologyPatientSummaryCards
        :total-cases="totalCases"
        :total-bills="totalBills"
        :unpaid-amount="unpaidAmount"
        :ready-for-doctor-count="readyForDoctorCount"
        :completed-count="completedCount"
      />

      <!-- ── Cases ─────────────────────────────────────────────── -->
      <OphthalmologyCasesTab
        :filtered-cases="filteredCases"
        :categories="categories"
        :doctors="doctors"
        :patient-id="patientId"
        :patient="patient"
        @add-case="handleAddCase"
        @refresh-cases="loadCases"
        @upload-report="addMockReport"
        @remove-report="removeMockReport"
        @analyze="triggerAnalysis"
        @reanalyze="triggerAnalysis"
        @update-field="updateCaseField"
        @mark-ready="markReadyForDoctor"
        @save-diagnosis="handleSaveDiagnosis"
      />
    </template>

    <!-- ── Snackbar ────────────────────────────────────────────── -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="bottom end">
      {{ snackbar.message }}
    </v-snackbar>

    <!-- ── Edit Patient Dialog ────────────────────────────────── -->
    <v-dialog v-model="editDialog" max-width="600" scrollable>
      <PatientEditDialog
        v-if="editDialog"
        :patient="patient"
        @close="editDialog = false"
        @saved="onPatientSaved"
      />
    </v-dialog>

    <!-- ── Bill Preview Dialog ────────────────────────────────── -->
    <BillPreviewDialog
      v-model="billDialog"
      :reservation="billReservation"
      :bills="patientBills"
      :clinic-settings="clinicSettings"
      @close="billDialog = false"
    />

    <!-- ── Recipe Dialog ──────────────────────────────────────── -->
    <RecipeDialog
      v-model="recipeDialog"
      :patient-id="patientId"
      :patient-info="patient"
      :doctors="doctors"
      :recipe="selectedRecipe"
      @saved="showSnackbar('تم حفظ الوصفة بنجاح')"
      @error="(e) => showSnackbar(e?.response?.data?.message || 'حدث خطأ', 'error')"
    />

    <!-- ── Recipe Print (hidden) ──────────────────────────────── -->
    <RecipePrint ref="recipePrintRef" :recipe="recipeToPrint" :clinic-settings="clinicSettings" />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import OphthalmologyPatientHeader        from '@/components/specialties/ophthalmology/OphthalmologyPatientHeader.vue'
import OphthalmologyPatientSummaryCards  from '@/components/specialties/ophthalmology/OphthalmologyPatientSummaryCards.vue'
import OphthalmologyCasesTab             from '@/components/specialties/ophthalmology/OphthalmologyCasesTab.vue'
import PatientEditDialog                 from '@/components/PatientEditDialog.vue'
import BillPreviewDialog                 from '@/components/BillPreviewDialog.vue'
import RecipeDialog                      from '@/components/RecipeDialog.vue'
import RecipePrint                       from '@/components/RecipePrint.vue'
import { useOphthalmologyData } from '@/composables/useOphthalmologyData.js'
import api from '@/services/api'
import billService from '@/services/bill.service'

const route = useRoute()
const patientId = computed(() => route.params.id)

// ── Local UI state ────────────────────────────────────────────
const snackbar = ref({ show: false, message: '', color: 'success' })

const showSnackbar = (msg, color = 'success') => {
  snackbar.value = { show: true, message: msg, color }
}

// ── Dialog state ──────────────────────────────────────────────
const editDialog    = ref(false)
const billDialog    = ref(false)
const recipeDialog  = ref(false)
const billReservation = ref(null)
const patientBills    = ref([])
const clinicSettings  = ref(null)
const selectedRecipe  = ref(null)
const recipePrintRef  = ref(null)
const recipeToPrint   = ref(null)

// ── Dialog actions ────────────────────────────────────────────
const onPatientSaved = (updatedPatient) => {
  patient.value = updatedPatient
  editDialog.value = false
  showSnackbar('تم تحديث بيانات المريض بنجاح')
}

const openBillDialog = () => {
  billReservation.value = {
    id: patient.value?.id,
    patient: patient.value,
    reservation_start_date: new Date().toISOString().split('T')[0],
    doctor: doctors.value[0] || null,
  }
  billDialog.value = true
}

const openRecipeDialog = () => {
  selectedRecipe.value = null
  recipeDialog.value = true
}

const fetchPatientBills = async () => {
  if (!patientId.value) return
  try {
    const response = await billService.getByPatient(patientId.value, { include: 'billable', sort: '-created_at' })
    patientBills.value = response.data || response
  } catch (err) {
    console.error('Error loading bills:', err)
  }
}

const fetchClinicSettings = async () => {
  try {
    const stored = localStorage.getItem('clinic')
    if (stored) { clinicSettings.value = JSON.parse(stored); return }
    const response = await api.get('/settings/clinic')
    clinicSettings.value = response.data || response || { name: 'Smart Clinic', address: '', phone: '', logo: null }
  } catch {
    clinicSettings.value = { name: 'Smart Clinic', address: '', phone: '', logo: null }
  }
}

// ── Real data composable ──────────────────────────────────────
const {
  patient,
  loading,
  error,
  categories,
  doctors,
  filteredCases,
  // Stats
  totalCases,
  totalBills,
  unpaidAmount,
  readyForDoctorCount,
  completedCount,
  // Data loading
  loadData,
  loadCases,
  // Case actions
  addCase,
  // Report / AI actions (in-memory)
  updateCaseField,
  markReadyForDoctor,
  saveDoctorDiagnosis,
  addMockReport,
  removeMockReport,
  triggerAnalysis,
} = useOphthalmologyData(patientId)

onMounted(async () => {
  await loadData()
  fetchPatientBills()
  fetchClinicSettings()
})

// ── Helpers ───────────────────────────────────────────────────
const handleAddCase = async (formData) => {
  try {
    await addCase(formData)
    showSnackbar('تم إضافة الحالة بنجاح')
  } catch (err) {
    showSnackbar(
      err?.response?.data?.message ||
      Object.values(err?.response?.data?.errors || {}).flat()[0] ||
      'حدث خطأ أثناء إضافة الحالة',
      'error'
    )
  }
}

const handleSaveDiagnosis = async (caseId, diagnosis, doctorNotes) => {
  try {
    await saveDoctorDiagnosis(caseId, diagnosis, doctorNotes)
    showSnackbar('تم حفظ التشخيص بنجاح')
  } catch (err) {
    showSnackbar(
      err?.response?.data?.message ||
      Object.values(err?.response?.data?.errors || {}).flat()[0] ||
      'حدث خطأ أثناء حفظ التشخيص',
      'error'
    )
  }
}
</script>

<style scoped>
.ophthal-patient-page {
  max-width: 1200px;
  margin: 0 auto;
}
.border-b {
  border-bottom: 1px solid rgba(0,0,0,0.08);
}
.border {
  border: 1px solid rgba(0,0,0,0.08) !important;
}
</style>
