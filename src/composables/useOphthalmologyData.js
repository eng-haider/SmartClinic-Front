/**
 * Ophthalmology Real Data Composable
 * Replaces useOphthalmologyMockData with live API calls.
 */
import { ref, computed } from 'vue'
import { caseService } from '@/services/case.service'
import { patientService } from '@/services/patient.service'
import { getCaseCategories } from '@/services/caseCategory.service'
import DoctorService from '@/services/doctor.service'
import api from '@/services/api'
import aiService from '@/services/ai.service'

// Map status ID → icon (used in case cards)
const STATUS_ICON_MAP = {
  1: 'mdi-clock-outline',
  2: 'mdi-clock-outline',
  3: 'mdi-check-circle',
}

function normalizeCase(raw) {
  return {
    ...raw,
    status: raw.status
      ? { ...raw.status, icon: STATUS_ICON_MAP[raw.status.id] || 'mdi-circle-small' }
      : null,
    // UI-only fields (populated by report/AI features)
    hasReports: Array.isArray(raw.images) ? raw.images.length > 0 : false,
    reportCount: Array.isArray(raw.images) ? raw.images.length : 0,
    uploadedReports: raw.images || [],
    aiStatus: null,
    isReadyForDoctor: false,
    diagnosisSuggestion: null,
    aiNotes: null,
    // Ensure bills array exists
    bills: raw.bills || [],
  }
}

function buildPayload(patientId, formData) {
  return {
    patient_id: patientId,
    doctor_id: formData.doctor_id,
    case_categores_id: formData.category_id,
    price: formData.price || 0,
    status_id: formData.status === 'completed' ? 3 : 2,
    case_date: formData.case_date || new Date().toISOString().split('T')[0],
    notes: formData.notes || '',
    eye_side: formData.eye_side || '',
    visual_acuity_left: formData.visual_acuity_left || '',
    visual_acuity_right: formData.visual_acuity_right || '',
    iop_left: formData.iop_left ?? null,
    iop_right: formData.iop_right ?? null,
    refraction_left: formData.refraction_left || '',
    refraction_right: formData.refraction_right || '',
    anterior_segment: formData.anterior_segment || '',
    posterior_segment: formData.posterior_segment || '',
    diagnosis: formData.diagnosis || '',
  }
}

export function useOphthalmologyData(patientIdRef) {
  const patient = ref(null)
  const cases = ref([])
  const categories = ref([])
  const doctors = ref([])
  const loading = ref(false)
  const error = ref(null)

  // ── Load all page data ──────────────────────────────────────
  const loadData = async () => {
    if (!patientIdRef.value) return
    loading.value = true
    error.value = null
    try {
      const [patientRes, casesRes, categoriesRes, doctorsRes] = await Promise.all([
        patientService.getById(patientIdRef.value),
        caseService.getByPatient(patientIdRef.value),
        getCaseCategories({ per_page: 100 }),
        DoctorService.getActive(),
      ])

      patient.value = patientRes?.data || patientRes

      const rawCases = casesRes?.data?.data ?? casesRes?.data ?? casesRes ?? []
      cases.value = (Array.isArray(rawCases) ? rawCases : []).map(normalizeCase)

      const rawCategories = categoriesRes?.data?.data ?? categoriesRes?.data ?? categoriesRes ?? []
      categories.value = Array.isArray(rawCategories) ? rawCategories : []

      const rawDoctors = doctorsRes?.data?.data ?? doctorsRes?.data ?? doctorsRes ?? []
      doctors.value = Array.isArray(rawDoctors) ? rawDoctors : []
    } catch (err) {
      error.value = err?.response?.data?.message || err.message || 'حدث خطأ في تحميل البيانات'
    } finally {
      loading.value = false
    }
  }

  // ── Reload cases only (after edit/add) ──────────────────────
  const loadCases = async () => {
    if (!patientIdRef.value) return
    try {
      const res = await caseService.getByPatient(patientIdRef.value)
      const rawCases = res?.data?.data ?? res?.data ?? res ?? []
      cases.value = (Array.isArray(rawCases) ? rawCases : []).map(normalizeCase)
    } catch (err) {
      console.error('Error reloading cases:', err)
    }
  }

  // ── Add a new case ──────────────────────────────────────────
  const addCase = async (formData) => {
    const payload = buildPayload(patientIdRef.value, formData)
    const res = await caseService.create(payload)
    const newCase = normalizeCase(res?.data || res)
    cases.value.unshift(newCase)
    return newCase
  }

  // ── Update an existing case ─────────────────────────────────
  const updateCase = async (id, formData) => {
    const payload = buildPayload(patientIdRef.value, formData)
    const res = await caseService.update(id, payload)
    const updated = normalizeCase(res?.data || res)
    const idx = cases.value.findIndex(c => c.id === id)
    if (idx !== -1) cases.value.splice(idx, 1, updated)
    return updated
  }

  // ── Computed stats ──────────────────────────────────────────
  const filteredCases = computed(() =>
    [...cases.value].sort((a, b) =>
      new Date(b.case_date || b.created_at).getTime() -
      new Date(a.case_date || a.created_at).getTime()
    )
  )

  const totalCases = computed(() => cases.value.length)

  const totalBills = computed(() =>
    cases.value.reduce((s, c) => s + (Number(c.price) || 0), 0)
  )

  const unpaidAmount = computed(() =>
    cases.value
      .filter(c => !c.is_paid)
      .reduce((s, c) => s + (Number(c.price) || 0), 0)
  )

  const readyForDoctorCount = computed(() =>
    cases.value.filter(c => c.isReadyForDoctor).length
  )

  const completedCount = computed(() =>
    cases.value.filter(c => c.status?.id === 3).length
  )

  // ── Local-state actions (reports / AI kept in-memory) ───────
  const updateCaseField = (caseId, field, value) => {
    const c = cases.value.find(x => x.id === caseId)
    if (c) c[field] = value
  }

  const markReadyForDoctor = (caseId) => {
    const c = cases.value.find(x => x.id === caseId)
    if (c) c.isReadyForDoctor = true
  }

  const saveDoctorDiagnosis = async (caseId, diagnosis, doctorNotes) => {
    const c = cases.value.find(x => x.id === caseId)
    if (!c) return
    try {
      await caseService.update(caseId, {
        patient_id:        patientIdRef.value,
        doctor_id:         c.doctor?.id,
        case_categores_id: c.category?.id,
        price:             c.price,
        status_id:         c.status?.id || 2,
        case_date:         c.case_date
          ? new Date(c.case_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        notes:             doctorNotes || c.notes || '',
        eye_side:          c.eye_side || '',
        visual_acuity_left:  c.visual_acuity_left  || '',
        visual_acuity_right: c.visual_acuity_right || '',
        iop_left:            c.iop_left  ?? null,
        iop_right:           c.iop_right ?? null,
        refraction_left:     c.refraction_left  || '',
        refraction_right:    c.refraction_right || '',
        anterior_segment:    c.anterior_segment  || '',
        posterior_segment:   c.posterior_segment || '',
        diagnosis:           diagnosis || '',
      })
      // Update local state on success
      c.diagnosis = diagnosis
      c.notes     = doctorNotes
    } catch (err) {
      console.error('Error saving diagnosis:', err)
      throw err
    }
  }

  const addMockReport = (caseId, file) => {
    const c = cases.value.find(x => x.id === caseId)
    if (!c) return
    const report = {
      id: Date.now(), caseId,
      filename: file.name || 'report.jpg',
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      type: 'Uploaded',
    }
    c.uploadedReports.push(report)
    c.hasReports = true
    c.reportCount = c.uploadedReports.length
  }

  const removeMockReport = (caseId, reportId) => {
    const c = cases.value.find(x => x.id === caseId)
    if (!c) return
    c.uploadedReports = c.uploadedReports.filter(r => r.id !== reportId)
    c.reportCount = c.uploadedReports.length
    c.hasReports = c.uploadedReports.length > 0
  }

  const triggerAnalysis = async (caseId) => {
    const c = cases.value.find(x => x.id === caseId)
    if (!c) return

    // collect images from the case (already loaded in localReports on the card,
    // but we also fetch from the API to be safe)
    let images = c.uploadedReports || []
    if (!images.length) {
      try {
        const res = await api.get('/images/by-imageable', {
          params: { imageable_type: 'Case', imageable_id: caseId }
        })
        images = res?.data?.data ?? res?.data ?? []
      } catch (e) {
        console.error('Could not fetch images for AI analysis:', e)
      }
    }

    if (!images.length) {
      c.aiStatus = 'no_images'
      return
    }

    c.aiStatus = 'analyzing'

    // Use the first image for analysis (most relevant)
    const imageUrl = images[0]?.url || images[0]?.path || ''
    if (!imageUrl) {
      c.aiStatus = 'no_images'
      return
    }

    try {
      // Fetch image as blob and convert to base64
      const imgRes = await fetch(imageUrl)
      const blob = await imgRes.blob()
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })

      const result = await aiService.analyzeXray(base64, Number(patientIdRef.value) || null)
      const analysis = result?.data?.analysis || result?.analysis || {}

      // Map AI response fields → case fields
      const fieldMap = {
        visual_acuity_left:  analysis.visual_acuity_left  || analysis.va_left  || null,
        visual_acuity_right: analysis.visual_acuity_right || analysis.va_right || null,
        iop_left:            analysis.iop_left  ?? null,
        iop_right:           analysis.iop_right ?? null,
        refraction_left:     analysis.refraction_left  || null,
        refraction_right:    analysis.refraction_right || null,
        anterior_segment:    analysis.anterior_segment || null,
        posterior_segment:   analysis.posterior_segment || null,
      }

      // Only overwrite empty fields so doctor's existing data isn't lost
      for (const [field, value] of Object.entries(fieldMap)) {
        if (value !== null && value !== undefined && value !== '' && !c[field]) {
          c[field] = value
        }
      }

      c.diagnosisSuggestion = analysis.diagnosis || analysis.impression || result?.data?.raw_response || null
      c.aiNotes = analysis.notes || analysis.recommendations || null
      c.aiStatus = 'extracted'
    } catch (err) {
      console.error('AI analysis failed:', err)
      c.aiStatus = 'error'
      c.aiNotes = err?.response?.data?.message || err.message || 'فشل تحليل الذكاء الاصطناعي'
    }
  }

  return {
    patient,
    cases,
    categories,
    doctors,
    loading,
    error,
    filteredCases,
    totalCases,
    totalBills,
    unpaidAmount,
    readyForDoctorCount,
    completedCount,
    loadData,
    loadCases,
    addCase,
    updateCase,
    updateCaseField,
    markReadyForDoctor,
    saveDoctorDiagnosis,
    addMockReport,
    removeMockReport,
    triggerAnalysis,
  }
}
