/**
 * Authentication Service
 * Handles user authentication, registration, and token management
 * 
 * @author Clinic Management System
 * @version 3.0.0
 */

import apiClient from './api'

const AUTH_TOKEN_KEY = 'auth_token'
const USER_KEY = 'user'
const CLINIC_KEY = 'clinic'
const TOKEN_EXPIRES_KEY = 'token_expires_at'

class AuthService {
  /**
   * Register new user and clinic
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration response with token
   */
  async register(userData) {
    try {
      const response = await apiClient.post('/auth/register', {
        name: userData.name,
        phone: userData.phone,
        email: userData.email,
        password: userData.password,
        password_confirmation: userData.passwordConfirmation,
        clinic_name: userData.clinicName,
        clinic_address: userData.clinicAddress,
        clinic_phone: userData.clinicPhone,
        clinic_email: userData.clinicEmail
      })

      if (response.success && response.data) {
        this.saveAuthData(response.data)
      }

      return {
        success: true,
        data: response.data,
        message: response.message
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Login user with phone and password
   * @param {string} phone - User phone number
   * @param {string} password - User password
   * @returns {Promise<Object>} Login response with token
   */
  async login(phone, password) {
    try {
      console.log('auth.service.login called with phone:', phone)
      
      const response = await apiClient.post('/auth/login', {
        phone,
        password
      })
      
      console.log('API response:', response)

      if (response.success && response.data) {
        this.saveAuthData(response.data)
      }

      return {
        success: true,
        data: response.data,
        message: response.message
      }
    } catch (error) {
      console.error('auth.service.login error:', error)
      console.error('Error response:', error.response?.data)
      return this.handleError(error)
    }
  }

  /**
   * Get current authenticated user
   * @returns {Promise<Object>} User data
   */
  async getCurrentUser() {
    try {
      const response = await apiClient.get('/auth/me')
      
      if (response.success && response.data) {
        localStorage.setItem(USER_KEY, JSON.stringify(response.data))
      }

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Refresh JWT token
   * @returns {Promise<Object>} New token
   */
  async refreshToken() {
    try {
      const response = await apiClient.post('/auth/refresh')

      if (response.success && response.data) {
        const token = response.data.token
        const expiresIn = response.data.expires_in || 3600

        localStorage.setItem(AUTH_TOKEN_KEY, token)
        
        const expiresAt = Date.now() + (expiresIn * 1000)
        localStorage.setItem(TOKEN_EXPIRES_KEY, expiresAt.toString())
      }

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Change user password
   * @param {Object} passwordData - Password change data
   * @returns {Promise<Object>} Success response
   */
  async changePassword(passwordData) {
    try {
      const response = await apiClient.post('/auth/change-password', {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        new_password_confirmation: passwordData.newPasswordConfirmation
      })

      return {
        success: true,
        message: response.message
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Logout user
   * @returns {Promise<Object>} Logout response
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      this.clearAuthData()
    }

    return {
      success: true,
      message: 'Logged out successfully'
    }
  }

  /**
   * Save authentication data to localStorage
   * @param {Object} data - Auth data (user, token, clinic)
   */
  saveAuthData(data) {
    if (data.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, data.token)
    }

    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    }

    if (data.clinic) {
      localStorage.setItem(CLINIC_KEY, JSON.stringify(data.clinic))
    }

    if (data.expires_in) {
      const expiresAt = Date.now() + (data.expires_in * 1000)
      localStorage.setItem(TOKEN_EXPIRES_KEY, expiresAt.toString())
    }
  }

  /**
   * Clear all authentication data
   */
  clearAuthData() {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(CLINIC_KEY)
    localStorage.removeItem(TOKEN_EXPIRES_KEY)
    
    // Clear old token keys for backward compatibility
    localStorage.removeItem('tokinn')
    localStorage.removeItem('tctate_token')
  }

  /**
   * Get stored auth token
   * @returns {string|null} JWT token
   */
  getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  }

  /**
   * Get stored user data
   * @returns {Object|null} User object
   */
  getUser() {
    const userStr = localStorage.getItem(USER_KEY)
    return userStr ? JSON.parse(userStr) : null
  }

  /**
   * Get stored clinic data
   * @returns {Object|null} Clinic object
   */
  getClinic() {
    const clinicStr = localStorage.getItem(CLINIC_KEY)
    return clinicStr ? JSON.parse(clinicStr) : null
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    const token = this.getToken()
    const expiresAt = localStorage.getItem(TOKEN_EXPIRES_KEY)
    
    if (!token) return false
    
    if (expiresAt) {
      const now = Date.now()
      return parseInt(expiresAt) > now
    }
    
    return true
  }

  /**
   * Check if token is about to expire (within 5 minutes)
   * @returns {boolean} True if token needs refresh
   */
  shouldRefreshToken() {
    const expiresAt = localStorage.getItem(TOKEN_EXPIRES_KEY)
    
    if (!expiresAt) return false
    
    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000
    
    return (parseInt(expiresAt) - now) < fiveMinutes
  }

  /**
   * Auto-refresh token if needed
   * @returns {Promise<void>}
   */
  async autoRefreshToken() {
    if (this.shouldRefreshToken()) {
      await this.refreshToken()
    }
  }

  /**
   * Handle API errors
   * @param {Error} error - Error object
   * @returns {Object} Formatted error response
   */
  handleError(error) {
    const response = error.response?.data || {}
    
    return {
      success: false,
      message: response.message || error.message || 'An error occurred',
      errors: response.errors || {}
    }
  }

  /**
   * Check if user has specific role
   * @param {string} role - Role name
   * @returns {boolean} True if user has role
   */
  hasRole(role) {
    const user = this.getUser()
    if (!user || !user.roles) return false
    
    return user.roles.includes(role)
  }

  /**
   * Check if user has specific permission
   * @param {string} permission - Permission name
   * @returns {boolean} True if user has permission
   */
  hasPermission(permission) {
    const user = this.getUser()
    if (!user || !user.permissions) return false
    
    return user.permissions.includes(permission)
  }

  /**
   * Check if user has any of the specified permissions
   * @param {Array<string>} permissions - Array of permission names
   * @returns {boolean} True if user has any permission
   */
  hasAnyPermission(permissions) {
    return permissions.some(permission => this.hasPermission(permission))
  }

  /**
   * Check if user has all of the specified permissions
   * @param {Array<string>} permissions - Array of permission names
   * @returns {boolean} True if user has all permissions
   */
  hasAllPermissions(permissions) {
    return permissions.every(permission => this.hasPermission(permission))
  }
}

export default new AuthService()
