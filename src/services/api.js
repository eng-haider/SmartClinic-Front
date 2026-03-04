/**
 * API Client - Axios Instance
 * Enhanced with JWT Authentication
 * 
 * @author Clinic Management System
 * @version 3.0.0
 */

import axios from 'axios'

// Use Vite env variable VITE_API_BASE_URL when available, otherwise
// default to the provided production API host. Keep the trailing /api
// because backend endpoints in the app use paths like `/reports/...`.
const BASE_URL = import.meta?.env?.VITE_API_BASE_URL || 'https://api.smartclinic.software/api'

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})


// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const url = config.url || ''
    
    // List of paths that should be excluded from /tenant prefix
    const excludedPaths = ['/login', '/register', '/auth/login', '/auth/register', 'smart-login', '/tenant/public', 'demo-register']
    
    // Check if the URL should be excluded from tenant prefix
    const shouldExclude = excludedPaths.some(path => url.includes(path))
    
    // Add /tenant prefix only if not excluded and doesn't already start with /tenant
    if (!shouldExclude && !url.startsWith('/tenant')) {
      config.url = `/tenant${url.startsWith('/') ? url : '/' + url}`
    }
    
    // Don't add tenant headers for public endpoints
    const isPublicEndpoint = url.includes('/tenant/public') || url.includes('/public')
    
    if (!isPublicEndpoint) {
      // Add JWT token
      const token = localStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      
      // Add Tenant ID header
      const tenantId = localStorage.getItem('tenant_id')
      if (tenantId) {
        config.headers['X-Tenant-ID'] = tenantId
      }
      
      // Add Clinic ID header
      const clinicId = localStorage.getItem('clinic_id')
      if (clinicId) {
        config.headers['X-Clinic-ID'] = clinicId
      }
    }
    
    // Add language header (always)
    const locale = localStorage.getItem('locale') || 'ar'
    config.headers['Accept-Language'] = locale
    
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      localStorage.removeItem('clinic')
      localStorage.removeItem('token_expires_at')
      localStorage.removeItem('tenant_id')
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
