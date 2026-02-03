/**
 * Clinic Settings Composable
 * Provides clinic settings data across the application
 * 
 * @author Clinic Management System
 * @version 1.0.0
 */

import { ref, computed, readonly } from 'vue'
import { getClinicSettings } from '@/services/clinicSettings.service'

// Shared state (singleton pattern)
const settings = ref(null)
const loading = ref(false)
const error = ref(null)
const lastFetched = ref(null)

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

/**
 * Composable for accessing clinic settings across the app
 */
export function useClinicSettings() {
  
  /**
   * Load clinic settings from API
   * @param {boolean} force - Force refresh even if cached
   */
  const loadSettings = async (force = false) => {
    // Check if we have cached data that's still fresh
    if (!force && settings.value && lastFetched.value) {
      const timeSinceLastFetch = Date.now() - lastFetched.value
      if (timeSinceLastFetch < CACHE_DURATION) {
        return settings.value
      }
    }

    loading.value = true
    error.value = null

    try {
      const response = await getClinicSettings()
      
      if (response.success && response.data) {
        settings.value = response.data
        lastFetched.value = Date.now()
        
        // Store in localStorage for persistence
        localStorage.setItem('clinic_settings', JSON.stringify(response.data))
        localStorage.setItem('clinic_settings_timestamp', Date.now().toString())
      }
      
      return settings.value
    } catch (err) {
      console.error('Error loading clinic settings:', err)
      error.value = err.message || 'Failed to load settings'
      
      // Try to load from localStorage as fallback
      const cached = localStorage.getItem('clinic_settings')
      if (cached) {
        try {
          settings.value = JSON.parse(cached)
        } catch (e) {
          console.error('Error parsing cached settings:', e)
        }
      }
      
      return settings.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Get a specific setting by category and key
   * @param {string} category - Category name (general, appointment, medical, etc.)
   * @param {string} key - Setting key
   * @returns {any} Setting value
   */
  const getSetting = (category, key) => {
    if (!settings.value || !settings.value[category]) return null
    
    const categorySetting = settings.value[category]
    if (!categorySetting.settings) return null
    
    const setting = categorySetting.settings.find(s => s.setting_key === key)
    return setting ? setting.setting_value : null
  }

  /**
   * Get all settings in a category
   * @param {string} category - Category name
   * @returns {Object} Flattened settings object
   */
  const getCategorySettings = (category) => {
    if (!settings.value || !settings.value[category]) return {}
    
    const categorySetting = settings.value[category]
    if (!categorySetting.settings) return {}
    
    return categorySetting.settings.reduce((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value
      return acc
    }, {})
  }

  // ==================== MEDICAL SETTINGS ====================

  /**
   * Get tooth condition colors from settings
   */
  const toothConditionColors = computed(() => {
    const colors = getSetting('medical', 'tooth_condition_colors')
    if (!colors || !Array.isArray(colors)) {
      // Default colors if not set
      return [
        { id: 1, name: 'Red', color: '#FF5252', hex_code: '#FF5252' },
        { id: 2, name: 'Blue', color: '#2196F3', hex_code: '#2196F3' },
        { id: 3, name: 'Green', color: '#4CAF50', hex_code: '#4CAF50' },
        { id: 4, name: 'Yellow', color: '#FFEB3B', hex_code: '#FFEB3B' },
        { id: 5, name: 'Orange', color: '#FF9800', hex_code: '#FF9800' },
        { id: 6, name: 'Purple', color: '#9C27B0', hex_code: '#9C27B0' }
      ]
    }
    return colors
  })

  /**
   * Get tooth statuses from settings
   */
  const toothStatuses = computed(() => {
    const statuses = getSetting('medical', 'tooth_statuses')
    if (!statuses || !Array.isArray(statuses)) {
      // Default statuses if not set
      return [
        { id: 1, name: 'Healthy', color: '#22C55E', icon: '✓', is_active: true },
        { id: 2, name: 'Cavity', color: '#EF4444', icon: '⚠', is_active: true },
        { id: 3, name: 'Filled', color: '#3B82F6', icon: '■', is_active: true },
        { id: 4, name: 'Missing', color: '#6B7280', icon: '✗', is_active: true },
        { id: 5, name: 'Crown', color: '#F59E0B', icon: '♔', is_active: true },
        { id: 6, name: 'Root Canal', color: '#8B5CF6', icon: '⊕', is_active: true },
        { id: 7, name: 'Implant', color: '#14B8A6', icon: '⊛', is_active: true },
        { id: 8, name: 'Bridge', color: '#EC4899', icon: '⊞', is_active: true }
      ]
    }
    return statuses.filter(s => s.is_active !== false)
  })

  // ==================== GENERAL SETTINGS ====================

  const clinicName = computed(() => getSetting('general', 'clinic_name') || '')
  const clinicPhone = computed(() => getSetting('general', 'phone') || '')
  const clinicEmail = computed(() => getSetting('general', 'email') || '')
  const clinicAddress = computed(() => getSetting('general', 'address') || '')
  const clinicWebsite = computed(() => getSetting('general', 'website') || '')
  const clinicLogo = computed(() => getSetting('general', 'logo') || '')

  // ==================== APPOINTMENT SETTINGS ====================

  const appointmentDuration = computed(() => getSetting('appointment', 'appointment_duration') || 30)
  const enableOnlineBooking = computed(() => getSetting('appointment', 'enable_online_booking') || false)
  const bookingBuffer = computed(() => getSetting('appointment', 'booking_buffer') || 15)
  const maxDailyAppointments = computed(() => getSetting('appointment', 'max_daily_appointments') || 20)
  const workingHours = computed(() => getSetting('appointment', 'working_hours') || {})

  // ==================== FINANCIAL SETTINGS ====================

  const currency = computed(() => getSetting('financial', 'currency') || 'IQD')
  const taxRate = computed(() => getSetting('financial', 'tax_rate') || 0)

  // ==================== DISPLAY SETTINGS ====================

  const themeColor = computed(() => getSetting('display', 'theme_color') || '#1976D2')
  const language = computed(() => getSetting('display', 'language') || 'ar')
  const dateFormat = computed(() => getSetting('display', 'date_format') || 'DD/MM/YYYY')
  const timeFormat = computed(() => getSetting('display', 'time_format') || '12h')

  // ==================== NOTIFICATION SETTINGS ====================

  const enableSms = computed(() => getSetting('notification', 'enable_sms') || false)
  const enableEmail = computed(() => getSetting('notification', 'enable_email') || false)
  const enableWhatsapp = computed(() => getSetting('notification', 'enable_whatsapp') || false)
  const reminderHours = computed(() => getSetting('notification', 'reminder_hours') || 24)

  // ==================== SOCIAL SETTINGS ====================

  const socialMedia = computed(() => ({
    facebook: getSetting('social', 'facebook') || '',
    instagram: getSetting('social', 'instagram') || '',
    twitter: getSetting('social', 'twitter') || '',
    whatsapp: getSetting('social', 'whatsapp') || ''
  }))

  /**
   * Clear cached settings (for use after updates)
   */
  const clearCache = () => {
    settings.value = null
    lastFetched.value = null
    localStorage.removeItem('clinic_settings')
    localStorage.removeItem('clinic_settings_timestamp')
  }

  /**
   * Reset cache and reload settings
   * Use this after updating settings to ensure changes are reflected
   */
  const resetCache = async () => {
    clearCache()
    await loadSettings(true)
  }

  /**
   * Initialize settings on first use (load from cache if available)
   */
  const initSettings = () => {
    if (!settings.value) {
      // Try to load from localStorage first
      const cached = localStorage.getItem('clinic_settings')
      const timestamp = localStorage.getItem('clinic_settings_timestamp')
      
      if (cached && timestamp) {
        try {
          const timeSinceCache = Date.now() - parseInt(timestamp)
          if (timeSinceCache < CACHE_DURATION) {
            settings.value = JSON.parse(cached)
            lastFetched.value = parseInt(timestamp)
          }
        } catch (e) {
          console.error('Error loading cached settings:', e)
        }
      }
    }
  }

  // Initialize on first use
  initSettings()

  return {
    // State
    settings: readonly(settings),
    loading: readonly(loading),
    error: readonly(error),
    
    // Methods
    loadSettings,
    getSetting,
    getCategorySettings,
    clearCache,
    resetCache,
    
    // Medical Settings
    toothConditionColors,
    toothStatuses,
    
    // General Settings
    clinicName,
    clinicPhone,
    clinicEmail,
    clinicAddress,
    clinicWebsite,
    clinicLogo,
    
    // Appointment Settings
    appointmentDuration,
    enableOnlineBooking,
    bookingBuffer,
    maxDailyAppointments,
    workingHours,
    
    // Financial Settings
    currency,
    taxRate,
    
    // Display Settings
    themeColor,
    language,
    dateFormat,
    timeFormat,
    
    // Notification Settings
    enableSms,
    enableEmail,
    enableWhatsapp,
    reminderHours,
    
    // Social Settings
    socialMedia
  }
}

export default useClinicSettings
