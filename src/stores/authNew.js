/**
 * Enhanced Authentication Store (Pinia)
 * Complete auth state management with roles & permissions
 * 
 * @author Clinic Management System
 * @version 3.0.0
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authService from '../services/auth.service'
import { ROLES } from '../constants/permissions'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const clinic = ref(null)
  const token = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Computed
  const isAuthenticated = computed(() => {
    // Check both store token and localStorage token
    return !!(token.value || authService.getToken())
  })
  
  const userRole = computed(() => {
    if (!user.value || !user.value.roles || user.value.roles.length === 0) {
      return null
    }
    return user.value.roles[0]
  })

  const userPermissions = computed(() => {
    if (!user.value || !user.value.permissions) {
      return []
    }
    return user.value.permissions
  })

  const isSuperAdmin = computed(() => userRole.value === ROLES.SUPER_ADMIN)
  const isClinicSuperDoctor = computed(() => userRole.value === ROLES.CLINIC_SUPER_DOCTOR)
  const isDoctor = computed(() => userRole.value === ROLES.DOCTOR)
  const isSecretary = computed(() => userRole.value === ROLES.SECRETARY)

  // Actions
  
  /**
   * Register new user
   */
  async function register(userData) {
    loading.value = true
    error.value = null
    
    try {
      const result = await authService.register(userData)
      
      if (result.success) {
        user.value = result.data.user
        clinic.value = result.data.clinic
        token.value = result.data.token
      } else {
        error.value = result.message
      }
      
      return result
    } catch (err) {
      error.value = err.message
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Login user
   */
  async function login(phone, password) {
    loading.value = true
    error.value = null
    
    try {
      const result = await authService.login(phone, password)
      
      if (result.success) {
        user.value = result.data.user
        token.value = result.data.token
        
        // Load clinic if available
        const storedClinic = authService.getClinic()
        if (storedClinic) {
          clinic.value = storedClinic
        }
      } else {
        error.value = result.message
      }
      
      return result
    } catch (err) {
      error.value = err.message
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Load current user from API
   */
  async function loadUser() {
    if (!authService.isAuthenticated()) {
      return { success: false, message: 'Not authenticated' }
    }

    loading.value = true
    
    try {
      const result = await authService.getCurrentUser()
      
      if (result.success) {
        user.value = result.data
      }
      
      return result
    } catch (err) {
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Refresh JWT token
   */
  async function refreshToken() {
    try {
      const result = await authService.refreshToken()
      
      if (result.success) {
        token.value = result.data.token
      }
      
      return result
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  /**
   * Change password
   */
  async function changePassword(passwordData) {
    loading.value = true
    error.value = null
    
    try {
      const result = await authService.changePassword(passwordData)
      
      if (!result.success) {
        error.value = result.message
      }
      
      return result
    } catch (err) {
      error.value = err.message
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Logout user
   */
  async function logout() {
    loading.value = true
    
    try {
      await authService.logout()
    } finally {
      user.value = null
      clinic.value = null
      token.value = null
      error.value = null
      loading.value = false
      
      // Redirect to login page
      window.location.href = '/login'
    }
  }

  /**
   * Initialize auth state from storage
   */
  function initializeAuth() {
    const storedUser = authService.getUser()
    const storedClinic = authService.getClinic()
    const storedToken = authService.getToken()

    if (storedUser) user.value = storedUser
    if (storedClinic) clinic.value = storedClinic
    if (storedToken) token.value = storedToken

    // Auto-refresh token if needed
    authService.autoRefreshToken()
  }

  /**
   * Check if user has specific role
   */
  function hasRole(role) {
    return authService.hasRole(role)
  }

  /**
   * Check if user has specific permission
   */
  function hasPermission(permission) {
    return authService.hasPermission(permission)
  }

  /**
   * Check if user has any of the permissions
   */
  function hasAnyPermission(permissions) {
    return authService.hasAnyPermission(permissions)
  }

  /**
   * Check if user has all of the permissions
   */
  function hasAllPermissions(permissions) {
    return authService.hasAllPermissions(permissions)
  }

  /**
   * Clear error message
   */
  function clearError() {
    error.value = null
  }

  return {
    // State
    user,
    clinic,
    token,
    loading,
    error,
    
    // Computed
    isAuthenticated,
    userRole,
    userPermissions,
    isSuperAdmin,
    isClinicSuperDoctor,
    isDoctor,
    isSecretary,
    
    // Actions
    register,
    login,
    logout,
    loadUser,
    refreshToken,
    changePassword,
    initializeAuth,
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    clearError
  }
})
