/**
 * Patient Service - API methods for patient management
 * Includes public profile management for QR code feature
 * 
 * @author SmartClinic
 * @version 1.0.0
 */

import api from './api'

export const patientService = {
  /**
   * Get all patients with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  async getAll(params = {}) {
    return await api.get('/patients', { params })
  },

  /**
   * Get a single patient by ID
   * @param {number} id - Patient ID
   * @returns {Promise}
   */
  async getById(id) {
    return await api.get(`/patients/${id}`)
  },

  /**
   * Create a new patient
   * @param {Object} patientData - Patient data
   * @returns {Promise}
   */
  async create(patientData) {
    return await api.post('/patients', patientData)
  },

  /**
   * Update an existing patient
   * @param {number} id - Patient ID
   * @param {Object} patientData - Updated patient data
   * @returns {Promise}
   */
  async update(id, patientData) {
    return await api.put(`/patients/${id}`, patientData)
  },

  /**
   * Delete a patient
   * @param {number} id - Patient ID
   * @returns {Promise}
   */
  async delete(id) {
    return await api.delete(`/patients/${id}`)
  },

  /**
   * Search patients by name or phone
   * @param {string} query - Search query
   * @param {Object} params - Additional parameters
   * @returns {Promise}
   */
  async search(query, params = {}) {
    return await api.get('/patients/search', { 
      params: { q: query, ...params } 
    })
  },

  /**
   * Get patient cases
   * @param {number} id - Patient ID
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  async getCases(id, params = {}) {
    return await api.get(`/patients/${id}/cases`, { params })
  },

  /**
   * Get patient bills
   * @param {number} id - Patient ID
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  async getBills(id, params = {}) {
    return await api.get(`/patients/${id}/bills`, { params })
  },

  /**
   * Get patient images
   * @param {number} id - Patient ID
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  async getImages(id, params = {}) {
    return await api.get(`/patients/${id}/images`, { params })
  },

  /**
   * Get patient reservations
   * @param {number} id - Patient ID
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  async getReservations(id, params = {}) {
    return await api.get(`/patients/${id}/reservations`, { params })
  },

  // ============================================
  // PUBLIC PROFILE ENDPOINTS (QR Code Feature)
  // ============================================

  /**
   * Get public profile settings for a patient
   * @param {number} patientId - Patient ID
   * @returns {Promise} - Public profile data including token and URL
   */
  async getPublicProfile(patientId) {
    return await api.get(`/patients/${patientId}/public-profile`)
  },

  /**
   * Enable public profile for a patient
   * Makes the patient's profile accessible via QR code
   * @param {number} patientId - Patient ID
   * @returns {Promise} - Enabled profile data with token and URL
   */
  async enablePublicProfile(patientId) {
    return await api.post(`/patients/${patientId}/public-profile/enable`)
  },

  /**
   * Disable public profile for a patient
   * The QR code will no longer work until re-enabled
   * @param {number} patientId - Patient ID
   * @returns {Promise}
   */
  async disablePublicProfile(patientId) {
    return await api.post(`/patients/${patientId}/public-profile/disable`)
  },

  /**
   * Regenerate public token for a patient
   * WARNING: This invalidates all existing QR codes
   * @param {number} patientId - Patient ID
   * @returns {Promise} - New profile data with new token and URL
   */
  async regeneratePublicToken(patientId) {
    return await api.post(`/patients/${patientId}/public-profile/regenerate-token`)
  },

  /**
   * Get QR code data for a patient
   * Returns the URL to encode in a QR code
   * @param {number} patientId - Patient ID
   * @returns {Promise} - QR code data including content URL
   */
  async getQrCodeData(patientId) {
    return await api.get(`/patients/${patientId}/qr-code`)
  },

  // ============================================
  // PUBLIC ENDPOINTS (No Authentication)
  // ============================================

  /**
   * Get public patient profile by token
   * This endpoint is accessed via QR code scanning
   * @param {string} token - Public profile token (UUID)
   * @returns {Promise} - Public patient data
   */
  async getPublicPatientByToken(token) {
    return await api.get(`/public/patients/${token}`)
  },

  /**
   * Get public patient cases by token
   * @param {string} token - Public profile token (UUID)
   * @returns {Promise} - Patient cases
   */
  async getPublicPatientCases(token) {
    return await api.get(`/public/patients/${token}/cases`)
  },

  /**
   * Get public patient images by token
   * @param {string} token - Public profile token (UUID)
   * @returns {Promise} - Patient images
   */
  async getPublicPatientImages(token) {
    return await api.get(`/public/patients/${token}/images`)
  },

  /**
   * Get public patient reservations by token
   * @param {string} token - Public profile token (UUID)
   * @returns {Promise} - Patient upcoming reservations
   */
  async getPublicPatientReservations(token) {
    return await api.get(`/public/patients/${token}/reservations`)
  }
}

export default patientService
