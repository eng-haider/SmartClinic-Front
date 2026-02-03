/**
 * Dashboard Composable
 * Handles all data fetching and state management for dashboard analytics
 */

import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import reportsService from '@/services/reports.service'

export function useDashboard() {
  const { t, locale } = useI18n()

  // Date Range State (default: current month)
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const dateRange = reactive({
    from: formatDate(firstDayOfMonth),
    to: formatDate(today)
  })

  // Loading States
  const loading = reactive({
    overview: false,
    today: false,
    patientsTrend: false,
    casesTrend: false,
    revenueTrend: false,
    profitLossTrend: false,
    casesByStatus: false,
    reservationsByStatus: false,
    billsByPayment: false,
    expensesByCategory: false,
    doctorPerformance: false
  })

  // Data States
  const overview = ref(null)
  const todayData = ref(null)
  const patientsTrend = ref([])
  const casesTrend = ref([])
  const revenueTrend = ref([])
  const profitLossTrend = ref([])
  const casesByStatus = ref([])
  const reservationsByStatus = ref([])
  const billsByPayment = ref([])
  const expensesByCategory = ref([])
  const doctorPerformance = ref([])

  // Error state
  const error = ref(null)

  // Computed: formatted date range display
  const dateRangeText = computed(() => {
    const from = new Date(dateRange.from).toLocaleDateString(locale.value === 'ar' ? 'ar-IQ' : 'en-US', { 
      month: 'short', day: 'numeric' 
    })
    const to = new Date(dateRange.to).toLocaleDateString(locale.value === 'ar' ? 'ar-IQ' : 'en-US', { 
      month: 'short', day: 'numeric', year: 'numeric' 
    })
    return `${from} - ${to}`
  })

  // Helper function
  function formatDate(date) {
    return date.toISOString().split('T')[0]
  }

  // Fetch Methods
  async function fetchOverview() {
    loading.overview = true
    try {
      const response = await reportsService.dashboard.getOverview({
        date_from: dateRange.from,
        date_to: dateRange.to
      })
      overview.value = response.data || response
    } catch (e) {
      console.error('Failed to fetch overview:', e)
      error.value = e
    } finally {
      loading.overview = false
    }
  }

  async function fetchToday() {
    loading.today = true
    try {
      const response = await reportsService.dashboard.getToday()
      todayData.value = response.data || response
    } catch (e) {
      console.error('Failed to fetch today:', e)
    } finally {
      loading.today = false
    }
  }

  async function fetchPatientsTrend() {
    loading.patientsTrend = true
    try {
      const response = await reportsService.patients.getTrend({
        date_from: dateRange.from,
        date_to: dateRange.to,
        period: 'month'
      })
      patientsTrend.value = response.data || []
    } catch (e) {
      console.error('Failed to fetch patients trend:', e)
    } finally {
      loading.patientsTrend = false
    }
  }

  async function fetchCasesTrend() {
    loading.casesTrend = true
    try {
      const response = await reportsService.cases.getTrend({
        date_from: dateRange.from,
        date_to: dateRange.to,
        period: 'month'
      })
      casesTrend.value = response.data || []
    } catch (e) {
      console.error('Failed to fetch cases trend:', e)
    } finally {
      loading.casesTrend = false
    }
  }

  async function fetchRevenueTrend() {
    loading.revenueTrend = true
    try {
      const response = await reportsService.financial.getRevenueTrend({
        date_from: dateRange.from,
        date_to: dateRange.to,
        period: 'month'
      })
      revenueTrend.value = response.data || []
    } catch (e) {
      console.error('Failed to fetch revenue trend:', e)
    } finally {
      loading.revenueTrend = false
    }
  }

  async function fetchProfitLossTrend() {
    loading.profitLossTrend = true
    try {
      const response = await reportsService.financial.getProfitLossTrend({
        date_from: dateRange.from,
        date_to: dateRange.to,
        period: 'month'
      })
      profitLossTrend.value = response.data || []
    } catch (e) {
      console.error('Failed to fetch profit/loss trend:', e)
    } finally {
      loading.profitLossTrend = false
    }
  }

  async function fetchCasesByStatus() {
    loading.casesByStatus = true
    try {
      const response = await reportsService.cases.getByStatus({
        date_from: dateRange.from,
        date_to: dateRange.to
      })
      casesByStatus.value = response.data || []
    } catch (e) {
      console.error('Failed to fetch cases by status:', e)
    } finally {
      loading.casesByStatus = false
    }
  }

  async function fetchReservationsByStatus() {
    loading.reservationsByStatus = true
    try {
      const response = await reportsService.reservations.getByStatus({
        date_from: dateRange.from,
        date_to: dateRange.to
      })
      reservationsByStatus.value = response.data || []
    } catch (e) {
      console.error('Failed to fetch reservations by status:', e)
    } finally {
      loading.reservationsByStatus = false
    }
  }

  async function fetchBillsByPayment() {
    loading.billsByPayment = true
    try {
      const response = await reportsService.financial.getBillsByPaymentStatus({
        date_from: dateRange.from,
        date_to: dateRange.to
      })
      billsByPayment.value = response.data || []
    } catch (e) {
      console.error('Failed to fetch bills by payment:', e)
    } finally {
      loading.billsByPayment = false
    }
  }

  async function fetchExpensesByCategory() {
    loading.expensesByCategory = true
    try {
      const response = await reportsService.financial.getExpensesByCategory({
        date_from: dateRange.from,
        date_to: dateRange.to
      })
      expensesByCategory.value = response.data || []
    } catch (e) {
      console.error('Failed to fetch expenses by category:', e)
    } finally {
      loading.expensesByCategory = false
    }
  }

  async function fetchDoctorPerformance() {
    loading.doctorPerformance = true
    try {
      const response = await reportsService.financial.getDoctorPerformance({
        date_from: dateRange.from,
        date_to: dateRange.to
      })
      doctorPerformance.value = response.data || []
    } catch (e) {
      console.error('Failed to fetch doctor performance:', e)
    } finally {
      loading.doctorPerformance = false
    }
  }

  // Fetch all data
  async function fetchAll() {
    await Promise.all([
      fetchOverview(),
      fetchToday(),
      fetchPatientsTrend(),
      fetchCasesTrend(),
      fetchRevenueTrend(),
      fetchProfitLossTrend(),
      fetchCasesByStatus(),
      fetchReservationsByStatus(),
      fetchBillsByPayment(),
      fetchExpensesByCategory(),
      fetchDoctorPerformance()
    ])
  }

  // Set date range and refresh
  function setDateRange(from, to) {
    dateRange.from = from
    dateRange.to = to
    // Save to localStorage
    localStorage.setItem('dashboard_date_from', from)
    localStorage.setItem('dashboard_date_to', to)
    fetchAll()
  }

  // Initialize from localStorage
  function initFromStorage() {
    const savedFrom = localStorage.getItem('dashboard_date_from')
    const savedTo = localStorage.getItem('dashboard_date_to')
    if (savedFrom && savedTo) {
      dateRange.from = savedFrom
      dateRange.to = savedTo
    }
  }

  // Format currency helper
  function formatCurrency(value, currency = 'د.ع') {
    if (!value && value !== 0) return '—'
    return new Intl.NumberFormat('ar-IQ').format(value) + ' ' + currency
  }

  // Format number helper
  function formatNumber(value) {
    if (!value && value !== 0) return '—'
    return new Intl.NumberFormat('ar-IQ').format(value)
  }

  return {
    // State
    dateRange,
    dateRangeText,
    loading,
    error,
    
    // Data
    overview,
    todayData,
    patientsTrend,
    casesTrend,
    revenueTrend,
    profitLossTrend,
    casesByStatus,
    reservationsByStatus,
    billsByPayment,
    expensesByCategory,
    doctorPerformance,
    
    // Methods
    fetchAll,
    setDateRange,
    initFromStorage,
    formatCurrency,
    formatNumber
  }
}
