/**
 * Doctor Service
 * Handles all doctor-related API calls
 * 
 * @author Clinic Management System
 * @version 1.0.0
 */

import api from './api'

const DoctorService = {
  /**
   * Get all doctors (paginated)
   * @param {Object} params - Query parameters (search, per_page, page, filters)
   * @returns {Promise}
   */
  async getAll(params = {}) {
    return api.get('/doctors', { params })
  },

  /**
   * Get active doctors only
   * @returns {Promise}
   */
  async getActive() {
    return api.get('/doctors-active')
  },

  /**
   * Get doctors by clinic
   * @param {Number} clinicId
   * @returns {Promise}
   */
  async getByClinic(clinicId) {
    return api.get(`/doctors/clinic/${clinicId}`)
  },

  /**
   * Get a single doctor by ID
   * @param {Number} id
   * @returns {Promise}
   */
  async getById(id) {
    return api.get(`/doctors/${id}`)
  },

  /**
   * Create a new doctor
   * @param {Object} data - Doctor data
   * @returns {Promise}
   */
  async create(data) {
    return api.post('/doctors', data)
  },

  /**
   * Update a doctor
   * @param {Number} id
   * @param {Object} data - Updated doctor data
   * @returns {Promise}
   */
  async update(id, data) {
    return api.put(`/doctors/${id}`, data)
  },

  /**
   * Delete a doctor
   * @param {Number} id
   * @returns {Promise}
   */
  async delete(id) {
    return api.delete(`/doctors/${id}`)
  },

  /**
   * Search doctor by email
   * @param {String} email
   * @returns {Promise}
   */
  async searchByEmail(email) {
    return api.get(`/doctors/search/email/${email}`)
  },

  /**
   * Search doctor by phone
   * @param {String} phone
   * @returns {Promise}
   */
  async searchByPhone(phone) {
    return api.get(`/doctors/search/phone/${phone}`)
  }
}

export default DoctorService
