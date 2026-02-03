/**
 * Clinic Settings Service
 * API service for managing clinic settings
 * 
 * @author Clinic Management System
 * @version 1.0.0
 */

import apiClient from './api'

const BASE_URL = '/clinic-settings'

/**
 * Get all clinic settings grouped by category
 * @returns {Promise} API response with clinic settings
 */
export const getClinicSettings = async () => {
  try {
    const response = await apiClient.get(BASE_URL)
    return response
  } catch (error) {
    console.error('❌ Error fetching clinic settings:', error)
    throw error
  }
}

/**
 * Get a single clinic setting by key
 * @param {string} key - Setting key
 * @returns {Promise} API response with setting data
 */
export const getClinicSetting = async (key) => {
  try {
    const response = await apiClient.get(`${BASE_URL}/${key}`)
    return response
  } catch (error) {
    console.error(`❌ Error fetching clinic setting ${key}:`, error)
    throw error
  }
}

/**
 * Update a single clinic setting
 * @param {string} key - Setting key
 * @param {Object} data - Setting data
 * @param {any} data.setting_value - The value to set
 * @param {string} data.setting_type - Type of setting (string, boolean, integer, json)
 * @param {string} data.description - Optional description
 * @returns {Promise} API response with updated setting
 */
export const updateClinicSetting = async (key, data) => {
  try {
    const response = await apiClient.put(`${BASE_URL}/${key}`, data)
    return response
  } catch (error) {
    console.error(`❌ Error updating clinic setting ${key}:`, error)
    throw error
  }
}

/**
 * Bulk update multiple clinic settings
 * @param {Array} settings - Array of settings to update
 * @param {string} settings[].key - Setting key
 * @param {any} settings[].value - Setting value
 * @param {string} settings[].type - Setting type (optional)
 * @returns {Promise} API response
 */
export const bulkUpdateClinicSettings = async (settings) => {
  try {
    const response = await apiClient.post(`${BASE_URL}/bulk-update`, { settings })
    return response
  } catch (error) {
    console.error('❌ Error bulk updating clinic settings:', error)
    throw error
  }
}

/**
 * Upload clinic logo
 * @param {File} logoFile - The logo image file
 * @returns {Promise} API response with logo URL
 */
export const uploadClinicLogo = async (logoFile) => {
  try {
    const formData = new FormData()
    formData.append('logo', logoFile)
    
    const response = await apiClient.post(`${BASE_URL}/upload-logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response
  } catch (error) {
    console.error('❌ Error uploading clinic logo:', error)
    throw error
  }
}

/**
 * Delete a clinic setting
 * @param {string} key - Setting key to delete
 * @returns {Promise} API response
 */
export const deleteClinicSetting = async (key) => {
  try {
    const response = await apiClient.delete(`${BASE_URL}/${key}`)
    return response
  } catch (error) {
    console.error(`❌ Error deleting clinic setting ${key}:`, error)
    throw error
  }
}

/**
 * Helper function to convert settings object to bulk update format
 * @param {Object} settingsObj - Object with key-value pairs
 * @param {Object} typeMap - Object mapping keys to their types
 * @returns {Array} Array formatted for bulk update
 */
export const formatSettingsForBulkUpdate = (settingsObj, typeMap = {}) => {
  return Object.entries(settingsObj).map(([key, value]) => ({
    key,
    value,
    type: typeMap[key] || inferSettingType(value)
  }))
}

/**
 * Infer setting type from value
 * @param {any} value - The value to check
 * @returns {string} The inferred type
 */
const inferSettingType = (value) => {
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'integer'
  if (typeof value === 'object') return 'json'
  return 'string'
}

export default {
  getClinicSettings,
  getClinicSetting,
  updateClinicSetting,
  bulkUpdateClinicSettings,
  uploadClinicLogo,
  deleteClinicSetting,
  formatSettingsForBulkUpdate
}
