/**
 * Reports & Analytics Service
 * API client for dashboard and statistics endpoints
 */

import apiClient from './api'

const buildParams = (params = {}) => {
  const filtered = {}
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      filtered[key] = value
    }
  })
  return filtered
}

export const dashboardReports = {
  getOverview: (params = {}) => 
    apiClient.get('/reports/dashboard/overview', { params: buildParams(params) }),
  
  getToday: () => 
    apiClient.get('/reports/dashboard/today')
}

export const patientReports = {
  getSummary: (params = {}) => 
    apiClient.get('/reports/patients/summary', { params: buildParams(params) }),
  
  getBySource: (params = {}) => 
    apiClient.get('/reports/patients/by-source', { params: buildParams(params) }),
  
  getByDoctor: (params = {}) => 
    apiClient.get('/reports/patients/by-doctor', { params: buildParams(params) }),
  
  getTrend: (params = {}) => 
    apiClient.get('/reports/patients/trend', { params: buildParams(params) }),
  
  getAgeDistribution: () => 
    apiClient.get('/reports/patients/age-distribution')
}

export const caseReports = {
  getSummary: (params = {}) => 
    apiClient.get('/reports/cases/summary', { params: buildParams(params) }),
  
  getByCategory: (params = {}) => 
    apiClient.get('/reports/cases/by-category', { params: buildParams(params) }),
  
  getByStatus: (params = {}) => 
    apiClient.get('/reports/cases/by-status', { params: buildParams(params) }),
  
  getByDoctor: (params = {}) => 
    apiClient.get('/reports/cases/by-doctor', { params: buildParams(params) }),
  
  getTrend: (params = {}) => 
    apiClient.get('/reports/cases/trend', { params: buildParams(params) })
}

export const reservationReports = {
  getSummary: (params = {}) => 
    apiClient.get('/reports/reservations/summary', { params: buildParams(params) }),
  
  getByStatus: (params = {}) => 
    apiClient.get('/reports/reservations/by-status', { params: buildParams(params) }),
  
  getByDoctor: (params = {}) => 
    apiClient.get('/reports/reservations/by-doctor', { params: buildParams(params) }),
  
  getTrend: (params = {}) => 
    apiClient.get('/reports/reservations/trend', { params: buildParams(params) })
}

export const financialReports = {
  getBillsSummary: (params = {}) => 
    apiClient.get('/reports/financial/bills/summary', { params: buildParams(params) }),
  
  getRevenueByDoctor: (params = {}) => 
    apiClient.get('/reports/financial/revenue/by-doctor', { params: buildParams(params) }),
  
  getRevenueTrend: (params = {}) => 
    apiClient.get('/reports/financial/revenue/trend', { params: buildParams(params) }),
  
  getBillsByPaymentStatus: (params = {}) => 
    apiClient.get('/reports/financial/bills/by-payment-status', { params: buildParams(params) }),
  
  getExpensesSummary: (params = {}) => 
    apiClient.get('/reports/financial/expenses/summary', { params: buildParams(params) }),
  
  getExpensesByCategory: (params = {}) => 
    apiClient.get('/reports/financial/expenses/by-category', { params: buildParams(params) }),
  
  getExpensesTrend: (params = {}) => 
    apiClient.get('/reports/financial/expenses/trend', { params: buildParams(params) }),
  
  getProfitLoss: (params = {}) => 
    apiClient.get('/reports/financial/profit-loss', { params: buildParams(params) }),
  
  getProfitLossTrend: (params = {}) => 
    apiClient.get('/reports/financial/profit-loss/trend', { params: buildParams(params) }),
  
  getDoctorPerformance: (params = {}) => 
    apiClient.get('/reports/financial/doctor-performance', { params: buildParams(params) })
}

export default {
  dashboard: dashboardReports,
  patients: patientReports,
  cases: caseReports,
  reservations: reservationReports,
  financial: financialReports
}
