import { defineAsyncComponent } from 'vue'

export const specialtyForms = {
  dental: defineAsyncComponent(() => import('@/components/specialties/dental/DentalCaseForm.vue')),
  ophthalmology: defineAsyncComponent(() => import('@/components/specialties/ophthalmology/OphthalmologyCaseForm.vue')),
}

export const addCaseModals = {
  dental: defineAsyncComponent(() => import('@/components/specialties/dental/DentalAddCaseModal.vue')),
  ophthalmology: defineAsyncComponent(() => import('@/components/specialties/ophthalmology/OphthalmologyAddCaseModal.vue')),
}

export const specialtyViews = {
  dental: defineAsyncComponent(() => import('@/components/specialties/dental/DentalPatientView.vue')),
  // Ophthalmology uses its own full page (OphthalmologyPatientPage.vue).
  // Returning null here keeps PatientDetail.vue from rendering a specialty chart for ophthalmology.
  ophthalmology: null,
}

export const specialtyInfos = {
  dental: defineAsyncComponent(() => import('@/components/specialties/dental/DentalCaseInfo.vue')),
  ophthalmology: defineAsyncComponent(() => import('@/components/specialties/ophthalmology/OphthalmologyCaseInfo.vue')),
}

// ==================== SmartTable Column Configs ====================

// Specialty-specific columns injected between shared columns
const specialtyCaseColumns = {
  dental: (t) => [
    {
      key: 'tooth_num',
      label: t('patients.toothNumber') || 'Tooth',
      type: 'chip',
      icon: 'mdi-tooth',
      color: 'info',
      sortable: true,
      width: '90px',
    },
  ],
  ophthalmology: (t) => [
    {
      key: 'eye_side',
      label: t('cases.eye_side') || 'Eye',
      type: 'chip',
      sortable: true,
      width: '90px',
      // Dynamic color/icon via getter
      getter: (row) => row.eye_side || row.ophthalmology_encounter_details?.eye_side || null,
      color: (row) => {
        const v = row.eye_side || row.ophthalmology_encounter_details?.eye_side
        return v === 'both' ? 'success' : 'info'
      },
      icon: 'mdi-eye',
    },
    {
      key: 'visual_acuity',
      label: t('cases.visual_acuity') || 'VA',
      type: 'text',
      sortable: false,
      width: '110px',
      getter: (row) => {
        const d = row.ophthalmology_encounter_details || row
        const l = d.visual_acuity_left || '-'
        const r = d.visual_acuity_right || '-'
        return `L ${l} / R ${r}`
      },
    },
    {
      key: 'diagnosis',
      label: t('cases.diagnosis') || 'Diagnosis',
      type: 'truncate',
      sortable: false,
      maxWidth: '150px',
      getter: (row) => row.diagnosis || row.ophthalmology_encounter_details?.diagnosis || null,
    },
  ],
}

// For Cases.vue (all-cases page) — includes patient column
export const getSmartCaseColumns = (specialty, t) => {
  const specCols = (specialtyCaseColumns[specialty] || specialtyCaseColumns.dental)(t)

  return [
    {
      key: 'patient',
      label: t('cases.patient') || 'Patient',
      type: 'avatar',
      getter: (row) => row.patient?.name || '-',
      subtitleGetter: (row) => `ID: ${row.patient?.id || '-'}`,
      sortable: false,
      minWidth: '160px',
    },
    {
      key: 'category',
      label: t('cases.category') || 'Category',
      type: 'badge',
      getter: (row) => row.category?.name || '-',
      rawValueGetter: (row) => row.category?.id,
      colorMap: {},
      color: (row) => {
        const colors = ['primary', 'secondary', 'success', 'warning', 'info', 'error']
        return colors[(row.category?.id || 0) % colors.length]
      },
      sortable: false,
    },
    ...specCols,
    {
      key: 'price',
      label: t('cases.price') || 'Price',
      type: 'currency',
      sortable: true,
      width: '110px',
    },
    {
      key: 'is_paid',
      label: t('cases.payment_status') || 'Payment',
      type: 'chip',
      sortable: true,
      width: '100px',
      getter: (row) => row.is_paid ? (t('cases.paid') || 'Paid') : (t('cases.unpaid') || 'Unpaid'),
      icon: (row) => row.is_paid ? 'mdi-check-circle' : 'mdi-clock-outline',
      color: (row) => row.is_paid ? 'success' : 'warning',
    },
    {
      key: 'status',
      label: t('cases.status') || 'Status',
      type: 'badge',
      sortable: false,
      width: '110px',
      getter: (row) => {
        const s = row.status
        if (!s) return '-'
        const locale = localStorage.getItem('locale') || 'ar'
        if (locale === 'ar') return s.name_ar || s.name || '-'
        if (locale === 'ku') return s.name_ku || s.name_en || s.name || '-'
        return s.name_en || s.name || '-'
      },
      rawValueGetter: (row) => row.status?.id,
      colorMap: { 1: 'warning', 2: 'info', 3: 'success', 4: 'error' },
    },
    {
      key: 'doctor',
      label: t('cases.doctor') || t('common.doctor') || 'Doctor',
      type: 'icon-text',
      icon: 'mdi-doctor',
      iconColor: 'primary',
      getter: (row) => row.doctor?.name || '-',
      sortable: false,
    },
    {
      key: 'created_at',
      label: t('cases.created_at') || 'Date',
      type: 'date',
      sortable: true,
      width: '110px',
    },
  ]
}

// For PatientDetail.vue — no patient column, adds bills/remaining/notes badge
export const getSmartPatientCaseColumns = (specialty, t) => {
  const specCols = (specialtyCaseColumns[specialty] || specialtyCaseColumns.dental)(t)

  return [
    ...specCols,
    {
      key: 'category',
      label: t('patients.category') || 'Category',
      type: 'badge',
      getter: (row) => row.category?.name || '-',
      rawValueGetter: (row) => row.category?.id,
      color: (row) => {
        const colors = ['primary', 'success', 'warning', 'info', 'error', 'secondary']
        return colors[(row.category?.id || 0) % colors.length]
      },
      sortable: true,
    },
    {
      key: 'doctor',
      label: t('common.doctor') || 'Doctor',
      type: 'icon-text',
      icon: 'mdi-doctor',
      iconColor: 'primary',
      getter: (row) => row.doctor?.name || '-',
      sortable: true,
    },
    {
      key: 'price',
      label: t('cases.price') || 'Price',
      type: 'currency',
      sortable: true,
      width: '110px',
    },
    {
      key: 'remaining',
      label: t('patients.remaining') || 'Remaining',
      type: 'chip',
      sortable: false,
      width: '120px',
      getter: (row) => {
        const bills = row.bills || []
        const totalPaid = bills.reduce((sum, b) => sum + (b.price || 0), 0)
        const rem = (row.price || 0) - totalPaid
        return rem > 0 ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(rem) + ' IQD' : (t('patients.fullyPaid') || 'Paid')
      },
      icon: (row) => {
        const bills = row.bills || []
        const totalPaid = bills.reduce((sum, b) => sum + (b.price || 0), 0)
        return (row.price || 0) - totalPaid > 0 ? 'mdi-cash-clock' : 'mdi-check-circle'
      },
      color: (row) => {
        const bills = row.bills || []
        const totalPaid = bills.reduce((sum, b) => sum + (b.price || 0), 0)
        return (row.price || 0) - totalPaid > 0 ? 'warning' : 'success'
      },
    },
    {
      key: 'status',
      label: t('patients.status') || 'Status',
      type: 'badge',
      sortable: true,
      width: '110px',
      getter: (row) => {
        const s = row.status
        if (!s) return '-'
        const locale = localStorage.getItem('locale') || 'ar'
        if (locale === 'ar') return s.name_ar || s.name || '-'
        if (locale === 'ku') return s.name_ku || s.name_en || s.name || '-'
        return s.name_en || s.name || '-'
      },
      rawValueGetter: (row) => row.status?.id,
      colorMap: { 1: 'warning', 2: 'info', 3: 'success', 4: 'error' },
    },
    {
      key: 'case_date',
      label: t('common.date') || 'Date',
      type: 'date',
      sortable: true,
      width: '110px',
      getter: (row) => row.case_date || row.created_at,
    },
  ]
}

// ==================== Legacy Column Helpers (backward compat) ====================

export const getSpecialtyCaseColumns = (specialty, t) => {
  const isOph = specialty === 'ophthalmology'
  
  const hdrs = [
    { title: t('cases.patient') || t('patients.patient') || 'Patient', key: 'patient', sortable: false },
    { title: t('cases.category') || t('patients.category') || 'Category', key: 'category', sortable: false },
  ]

  if (!isOph) {
    hdrs.push({ title: t('cases.tooth_num') || t('patients.toothNumber') || 'Tooth Num', key: 'tooth_num', sortable: true })
  } else {
    hdrs.push(
      { title: t('cases.eye_side') || 'Eye Side', key: 'eye_side', sortable: true },
      { title: t('cases.visual_acuity') || 'Visual Acuity', key: 'visual_acuity', sortable: false },
      { title: t('cases.diagnosis') || 'Diagnosis', key: 'diagnosis', sortable: false }
    )
  }

  hdrs.push(
    { title: t('cases.price') || 'Price', key: 'price', sortable: true },
    { title: t('cases.payment_status') || 'Payment', key: 'is_paid', sortable: true },
    { title: t('cases.status') || t('patients.status') || 'Status', key: 'status', sortable: false },
    { title: t('cases.doctor') || t('common.doctor') || 'Doctor', key: 'doctor', sortable: false },
    { title: t('cases.created_at') || 'Date', key: 'created_at', sortable: true },
    { title: t('cases.actions') || t('common.actions') || 'Actions', key: 'actions', sortable: false, align: 'center' }
  )

  return hdrs
}

export const getPatientDetailCaseColumns = (specialty, t) => {
  const isOph = specialty === 'ophthalmology'
  const headers = []
  
  if (!isOph) {
    headers.push({ title: t('patients.toothNumber') || 'Tooth Num', key: 'tooth_num', sortable: true })
  } else {
    headers.push(
      { title: t('cases.eye_side') || 'Eye Side', key: 'eye_side', sortable: true },
      { title: t('cases.visual_acuity') || 'Visual Acuity', key: 'visual_acuity', sortable: false },
      { title: t('cases.diagnosis') || 'Diagnosis', key: 'diagnosis', sortable: false }
    )
  }
  
  headers.push(
    { title: t('patients.category') || 'Category', key: 'category', sortable: true },
    { title: t('common.doctor') || 'Doctor', key: 'doctor', sortable: true },
    { title: t('cases.price') || 'Price', key: 'price', sortable: true },
    { title: t('patients.bills') || 'الفواتير' || 'Bills', key: 'bills', sortable: false },
    { title: t('patients.remaining') || 'Remaining', key: 'remaining', sortable: false },
    { title: t('patients.status') || 'Status', key: 'status', sortable: true },
    { title: t('common.date') || 'Date', key: 'case_date', sortable: true },
    { title: t('patients.notes') || 'Notes', key: 'notes', sortable: false },
    { title: t('common.actions') || 'Actions', key: 'actions', sortable: false, align: 'center' }
  )
  return headers
}
