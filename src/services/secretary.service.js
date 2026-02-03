/**
 * Secretary Service
 * Handles all secretary-related API calls
 * 
 * @author Clinic Management System
 * @version 1.0.0
 */

import api from './api'

const SecretaryService = {
  /**
   * Get all secretaries (paginated)
   * @param {Object} params - Query parameters (search, per_page, page, is_active, sort, direction)
   * @returns {Promise}
   */
  async getAll(params = {}) {
    return api.get('/secretaries', { params })
  },

  /**
   * Get a single secretary by ID
   * @param {Number} id
   * @returns {Promise}
   */
  async getById(id) {
    return api.get(`/secretaries/${id}`)
  },

  /**
   * Create a new secretary
   * @param {Object} data - Secretary data (name, email, phone, password, is_active, permissions)
   * @returns {Promise}
   */
  async create(data) {
    return api.post('/secretaries', data)
  },

  /**
   * Update a secretary
   * @param {Number} id
   * @param {Object} data - Updated secretary data
   * @returns {Promise}
   */
  async update(id, data) {
    return api.put(`/secretaries/${id}`, data)
  },

  /**
   * Update secretary permissions only
   * @param {Number} id
   * @param {Array} permissions - Array of permission names
   * @returns {Promise}
   */
  async updatePermissions(id, permissions) {
    return api.patch(`/secretaries/${id}/permissions`, { permissions })
  },

  /**
   * Toggle secretary active status
   * @param {Number} id
   * @returns {Promise}
   */
  async toggleStatus(id) {
    return api.patch(`/secretaries/${id}/toggle-status`)
  },

  /**
   * Delete a secretary
   * @param {Number} id
   * @returns {Promise}
   */
  async delete(id) {
    return api.delete(`/secretaries/${id}`)
  },

  /**
   * Get available permissions for secretaries
   * @returns {Promise}
   */
  async getAvailablePermissions() {
    return api.get('/secretaries/available-permissions')
  }
}

export default SecretaryService
