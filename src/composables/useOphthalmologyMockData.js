/**
 * Ophthalmology Mock Data & State Composable
 * Provides mock case/report data and local state management
 * for the Ophthalmology Patient Page.
 *
 * Replace API calls here when backend is ready.
 */
import { ref, computed } from 'vue'

// ── Status Definitions ──────────────────────────────────────────
export const OPHTHAL_STATUSES = {
  AWAITING_UPLOAD: { id: 1, key: 'awaiting_upload', name_ar: 'بانتظار الرفع', name_en: 'Awaiting Upload', color: '#9E9E9E', icon: 'mdi-cloud-upload-outline' },
  UPLOADED:        { id: 2, key: 'uploaded',        name_ar: 'تم الرفع',       name_en: 'Uploaded',        color: '#2196F3', icon: 'mdi-cloud-check-outline' },
  ANALYZING:       { id: 3, key: 'analyzing',       name_ar: 'قيد التحليل',    name_en: 'Analyzing',       color: '#FF9800', icon: 'mdi-robot-outline' },
  EXTRACTED:       { id: 4, key: 'extracted',        name_ar: 'تم الاستخراج',   name_en: 'Extracted',       color: '#00BCD4', icon: 'mdi-text-box-check-outline' },
  NEEDS_REVIEW:    { id: 5, key: 'needs_review',     name_ar: 'بحاجة مراجعة',   name_en: 'Needs Review',    color: '#FF5722', icon: 'mdi-account-eye-outline' },
  READY_FOR_DOCTOR:{ id: 6, key: 'ready_for_doctor', name_ar: 'جاهز للطبيب',    name_en: 'Ready for Doctor',color: '#4CAF50', icon: 'mdi-doctor' },
  DIAGNOSED:       { id: 7, key: 'diagnosed',        name_ar: 'تم التشخيص',     name_en: 'Diagnosed',       color: '#673AB7', icon: 'mdi-stethoscope' },
  COMPLETED:       { id: 8, key: 'completed',        name_ar: 'مكتمل',          name_en: 'Completed',       color: '#388E3C', icon: 'mdi-check-circle' },
}

const statusList = Object.values(OPHTHAL_STATUSES)

// ── Mock Reports / Images ───────────────────────────────────────
const makeMockReports = (caseId) => {
  if (caseId === 1) {
    return [
      { id: 101, caseId: 1, filename: 'oct_scan_left.jpg',  url: '/mock/oct_left.jpg',  uploadedAt: '2026-03-25 10:30:00', type: 'OCT Scan' },
      { id: 102, caseId: 1, filename: 'fundus_left.jpg',    url: '/mock/fundus_left.jpg', uploadedAt: '2026-03-25 10:32:00', type: 'Fundus Photo' },
    ]
  }
  if (caseId === 2) {
    return [
      { id: 201, caseId: 2, filename: 'visual_field_right.jpg', url: '/mock/vf_right.jpg', uploadedAt: '2026-03-26 09:00:00', type: 'Visual Field' },
    ]
  }
  return []
}

// ── Mock Cases ──────────────────────────────────────────────────
const generateMockCases = () => [
  {
    id: 1,
    doctor: { id: 1, name: 'د.أحمد الجراح' },
    category: { id: 1, name: 'فحص شامل', name_en: 'General Checkup', color: '#1976D2' },
    status: OPHTHAL_STATUSES.READY_FOR_DOCTOR,
    notes: null,
    price: 400000,
    is_paid: true,
    payment_status: 'Paid',
    case_date: '2026-03-25 00:00:00',
    eye_side: 'left',
    visual_acuity_left: '6/12',
    visual_acuity_right: '6/6',
    iop_left: 18,
    iop_right: 16,
    refraction_left: '-2.50',
    refraction_right: '-1.00',
    anterior_segment: 'Clear cornea, normal anterior chamber depth',
    posterior_segment: 'Cup-to-disc ratio 0.4, healthy macula',
    diagnosis: null,
    // UI-only fields
    hasReports: true,
    reportCount: 2,
    aiStatus: 'extracted',
    isReadyForDoctor: true,
    diagnosisSuggestion: 'Myopia – Left eye moderate, Right eye mild. Recommend corrective lenses.',
    aiNotes: 'OCT scan shows normal retinal layers. No signs of glaucoma.',
    uploadedReports: makeMockReports(1),
  },
  {
    id: 2,
    doctor: { id: 2, name: 'د.سارة العيون' },
    category: { id: 2, name: 'قياس النظر', name_en: 'Refraction Test', color: '#00897B' },
    status: OPHTHAL_STATUSES.NEEDS_REVIEW,
    notes: 'المريض يشكو من ضبابية الرؤية',
    price: 250000,
    is_paid: false,
    payment_status: 'Unpaid',
    case_date: '2026-03-26 00:00:00',
    eye_side: 'right',
    visual_acuity_left: null,
    visual_acuity_right: '6/18',
    iop_left: null,
    iop_right: 22,
    refraction_left: null,
    refraction_right: '-3.25',
    anterior_segment: null,
    posterior_segment: null,
    diagnosis: null,
    hasReports: true,
    reportCount: 1,
    aiStatus: 'extracted',
    isReadyForDoctor: false,
    diagnosisSuggestion: 'Possible high myopia right eye. IOP borderline – glaucoma screening recommended.',
    aiNotes: 'Visual field test indicates mild peripheral loss.',
    uploadedReports: makeMockReports(2),
  },
  {
    id: 3,
    doctor: { id: 1, name: 'د.أحمد الجراح' },
    category: { id: 3, name: 'جراحة ساد', name_en: 'Cataract Surgery', color: '#E65100' },
    status: OPHTHAL_STATUSES.DIAGNOSED,
    notes: null,
    price: 1500000,
    is_paid: false,
    payment_status: 'Unpaid',
    case_date: '2026-03-20 00:00:00',
    eye_side: 'both',
    visual_acuity_left: '6/24',
    visual_acuity_right: '6/36',
    iop_left: 14,
    iop_right: 15,
    refraction_left: '+1.75',
    refraction_right: '+2.50',
    anterior_segment: 'Nuclear sclerosis grade II bilateral',
    posterior_segment: 'Normal fundus bilaterally',
    diagnosis: 'Bilateral cataracts – Grade II nuclear sclerosis. Phacoemulsification planned.',
    hasReports: false,
    reportCount: 0,
    aiStatus: null,
    isReadyForDoctor: false,
    diagnosisSuggestion: null,
    aiNotes: null,
    uploadedReports: [],
  },
  {
    id: 4,
    doctor: { id: 2, name: 'د.سارة العيون' },
    category: { id: 4, name: 'فحص قاع العين', name_en: 'Fundus Exam', color: '#7B1FA2' },
    status: OPHTHAL_STATUSES.AWAITING_UPLOAD,
    notes: null,
    price: 300000,
    is_paid: false,
    payment_status: 'Unpaid',
    case_date: '2026-03-27 00:00:00',
    eye_side: 'left',
    visual_acuity_left: null,
    visual_acuity_right: null,
    iop_left: null,
    iop_right: null,
    refraction_left: null,
    refraction_right: null,
    anterior_segment: null,
    posterior_segment: null,
    diagnosis: null,
    hasReports: false,
    reportCount: 0,
    aiStatus: null,
    isReadyForDoctor: false,
    diagnosisSuggestion: null,
    aiNotes: null,
    uploadedReports: [],
  },
  {
    id: 5,
    doctor: { id: 1, name: 'د.أحمد الجراح' },
    category: { id: 1, name: 'فحص شامل', name_en: 'General Checkup', color: '#1976D2' },
    status: OPHTHAL_STATUSES.COMPLETED,
    notes: 'فحص متابعة بعد العملية',
    price: 200000,
    is_paid: true,
    payment_status: 'Paid',
    case_date: '2026-03-10 00:00:00',
    eye_side: 'both',
    visual_acuity_left: '6/6',
    visual_acuity_right: '6/6',
    iop_left: 14,
    iop_right: 14,
    refraction_left: '0.00',
    refraction_right: '0.00',
    anterior_segment: 'Clear, IOL in place bilaterally',
    posterior_segment: 'Healthy macula, normal optic disc',
    diagnosis: 'Post-cataract surgery follow-up – excellent visual recovery bilateral.',
    hasReports: true,
    reportCount: 3,
    aiStatus: 'extracted',
    isReadyForDoctor: false,
    diagnosisSuggestion: null,
    aiNotes: null,
    uploadedReports: [
      { id: 501, caseId: 5, filename: 'post_op_left.jpg', url: '/mock/post_left.jpg', uploadedAt: '2026-03-10 11:00:00', type: 'Post-Op Photo' },
      { id: 502, caseId: 5, filename: 'post_op_right.jpg', url: '/mock/post_right.jpg', uploadedAt: '2026-03-10 11:02:00', type: 'Post-Op Photo' },
      { id: 503, caseId: 5, filename: 'oct_followup.jpg', url: '/mock/oct_fu.jpg', uploadedAt: '2026-03-10 11:05:00', type: 'OCT Scan' },
    ],
  },
]

// ── Mock Patient ────────────────────────────────────────────────
const generateMockPatient = () => ({
  id: 42,
  name: 'محمد علي حسين',
  sex: 1,
  phone: '07701234567',
  phone2: '07809876543',
  email: 'mohammed.ali@email.com',
  birth_date: '1985-06-15',
  address: 'بغداد - الكرادة',
  photo: null,
  notes: 'مريض متابعة دورية - لديه تاريخ عائلي بالزرق',
  last_visit: '2026-03-27',
  created_at: '2025-01-10',
})

// ── Composable ──────────────────────────────────────────────────
export function useOphthalmologyMockData() {
  const patient = ref(generateMockPatient())
  const cases = ref(generateMockCases())
  const loading = ref(false)
  const error = ref(null)

  // ── Filters ─────────────────────────────
  const searchQuery = ref('')
  const statusFilter = ref(null)
  const categoryFilter = ref(null)
  const sortOrder = ref('desc') // 'asc' | 'desc'

  // ── Computed ─────────────────────────────
  const filteredCases = computed(() => {
    let result = [...cases.value]

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(c =>
        c.doctor?.name?.toLowerCase().includes(q) ||
        c.category?.name?.toLowerCase().includes(q) ||
        c.category?.name_en?.toLowerCase().includes(q) ||
        c.diagnosis?.toLowerCase().includes(q) ||
        c.eye_side?.toLowerCase().includes(q) ||
        String(c.id).includes(q)
      )
    }

    if (statusFilter.value) {
      result = result.filter(c => c.status?.key === statusFilter.value)
    }

    if (categoryFilter.value) {
      result = result.filter(c => c.category?.id === categoryFilter.value)
    }

    result.sort((a, b) => {
      const da = new Date(a.case_date).getTime()
      const db = new Date(b.case_date).getTime()
      return sortOrder.value === 'desc' ? db - da : da - db
    })

    return result
  })

  const uniqueCategories = computed(() => {
    const map = new Map()
    cases.value.forEach(c => {
      if (c.category) map.set(c.category.id, c.category)
    })
    return Array.from(map.values())
  })

  // ── Summary Stats ───────────────────────
  const totalCases = computed(() => cases.value.length)

  const totalBills = computed(() =>
    cases.value.reduce((sum, c) => sum + (c.price || 0), 0)
  )

  const unpaidAmount = computed(() =>
    cases.value
      .filter(c => !c.is_paid)
      .reduce((sum, c) => sum + (c.price || 0), 0)
  )

  const readyForDoctorCount = computed(() =>
    cases.value.filter(c => c.status?.key === 'ready_for_doctor').length
  )

  const completedCount = computed(() =>
    cases.value.filter(c =>
      c.status?.key === 'completed' || c.status?.key === 'diagnosed'
    ).length
  )

  // ── Actions (local state only) ──────────
  const updateCaseField = (caseId, field, value) => {
    const c = cases.value.find(x => x.id === caseId)
    if (c) c[field] = value
  }

  const markReadyForDoctor = (caseId) => {
    const c = cases.value.find(x => x.id === caseId)
    if (c) {
      c.status = OPHTHAL_STATUSES.READY_FOR_DOCTOR
      c.isReadyForDoctor = true
    }
  }

  const saveDoctorDiagnosis = (caseId, diagnosis, doctorNotes) => {
    const c = cases.value.find(x => x.id === caseId)
    if (c) {
      c.diagnosis = diagnosis
      c.notes = doctorNotes
      c.status = OPHTHAL_STATUSES.DIAGNOSED
    }
  }

  const addMockReport = (caseId, file) => {
    const c = cases.value.find(x => x.id === caseId)
    if (!c) return
    const newReport = {
      id: Date.now(),
      caseId,
      filename: file.name || 'uploaded_report.jpg',
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      type: 'Uploaded',
    }
    c.uploadedReports.push(newReport)
    c.hasReports = true
    c.reportCount = c.uploadedReports.length
    if (c.status?.key === 'awaiting_upload') {
      c.status = OPHTHAL_STATUSES.UPLOADED
    }
  }

  const removeMockReport = (caseId, reportId) => {
    const c = cases.value.find(x => x.id === caseId)
    if (!c) return
    c.uploadedReports = c.uploadedReports.filter(r => r.id !== reportId)
    c.reportCount = c.uploadedReports.length
    c.hasReports = c.uploadedReports.length > 0
  }

  const triggerMockAnalysis = (caseId) => {
    const c = cases.value.find(x => x.id === caseId)
    if (!c) return

    c.status = OPHTHAL_STATUSES.ANALYZING
    c.aiStatus = 'analyzing'

    // Simulate async AI processing
    setTimeout(() => {
      c.aiStatus = 'extracted'
      c.status = OPHTHAL_STATUSES.NEEDS_REVIEW
      c.diagnosisSuggestion = c.diagnosisSuggestion || 'AI-generated suggestion: Normal findings per uploaded reports.'
      c.aiNotes = c.aiNotes || 'Automated analysis complete. All parameters within normal range.'
      // Fill in some mock extracted values if empty
      if (!c.visual_acuity_left) c.visual_acuity_left = '6/9'
      if (!c.visual_acuity_right) c.visual_acuity_right = '6/6'
      if (!c.iop_left) c.iop_left = 16
      if (!c.iop_right) c.iop_right = 15
    }, 2500)
  }

  const addCase = (formData, categoriesList, doctorsList) => {
    const category = categoriesList.find(c => c.id === formData.category_id) || null
    const doctor   = doctorsList.find(d => d.id === formData.doctor_id)   || null
    const newCase  = {
      id: Date.now(),
      doctor,
      category,
      status: OPHTHAL_STATUSES.AWAITING_UPLOAD,
      notes: formData.notes || null,
      price: formData.price || 0,
      is_paid: false,
      payment_status: 'Unpaid',
      case_date: formData.case_date || new Date().toISOString(),
      eye_side: formData.eye_side || null,
      visual_acuity_left:  formData.visual_acuity_left  || null,
      visual_acuity_right: formData.visual_acuity_right || null,
      iop_left:            formData.iop_left            || null,
      iop_right:           formData.iop_right           || null,
      refraction_left:     formData.refraction_left     || null,
      refraction_right:    formData.refraction_right    || null,
      anterior_segment:    formData.anterior_segment    || null,
      posterior_segment:   formData.posterior_segment   || null,
      diagnosis: null,
      hasReports: false,
      reportCount: 0,
      aiStatus: null,
      isReadyForDoctor: false,
      diagnosisSuggestion: null,
      aiNotes: null,
      uploadedReports: [],
    }
    cases.value.unshift(newCase)
    return newCase
  }

  return {
    patient,
    cases,
    loading,
    error,
    // Filters
    searchQuery,
    statusFilter,
    categoryFilter,
    sortOrder,
    filteredCases,
    uniqueCategories,
    // Stats
    totalCases,
    totalBills,
    unpaidAmount,
    readyForDoctorCount,
    completedCount,
    // Actions
    updateCaseField,
    markReadyForDoctor,
    saveDoctorDiagnosis,
    addMockReport,
    removeMockReport,
    triggerMockAnalysis,
    addCase,
    // Constants
    statusList,
  }
}
