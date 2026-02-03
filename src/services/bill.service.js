/**
 * Bill Service - API methods for billing management
 * 
 * @author SmartClinic
 * @version 1.0.0
 */

import api from './api'

export const billService = {
  /**
   * Get all bills with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  async getAll(params = {}) {
    return await api.get('/bills', { params })
  },

  /**
   * Get a single bill by ID
   * @param {number} id - Bill ID
   * @returns {Promise}
   */
  async getById(id) {
    return await api.get(`/bills/${id}`)
  },

  /**
   * Create a new bill
   * @param {Object} billData - Bill data
   * @returns {Promise}
   */
  async create(billData) {
    return await api.post('/bills', billData)
  },

  /**
   * Update an existing bill
   * @param {number} id - Bill ID
   * @param {Object} billData - Updated bill data
   * @returns {Promise}
   */
  async update(id, billData) {
    return await api.put(`/bills/${id}`, billData)
  },

  /**
   * Delete a bill
   * @param {number} id - Bill ID
   * @returns {Promise}
   */
  async delete(id) {
    return await api.delete(`/bills/${id}`)
  },

  /**
   * Mark a bill as paid
   * @param {number} id - Bill ID
   * @returns {Promise}
   */
  async markAsPaid(id) {
    return await api.patch(`/bills/${id}/mark-paid`)
  },

  /**
   * Mark a bill as unpaid
   * @param {number} id - Bill ID
   * @returns {Promise}
   */
  async markAsUnpaid(id) {
    return await api.patch(`/bills/${id}/mark-unpaid`)
  },

  /**
   * Get all bills for a specific patient
   * @param {number} patientId - Patient ID
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  async getByPatient(patientId, params = {}) {
    return await api.get(`/bills/patient/${patientId}`, { params })
  },

  /**
   * Get billing statistics
   * @param {Object} params - Query parameters (start_date, end_date, clinic_id, doctor_id)
   * @returns {Promise}
   */
  async getStatistics(params = {}) {
    return await api.get('/bills/statistics/summary', { params })
  },

  /**
   * Get bill reports with filters
   * @param {Object} params - Query parameters (date_from, date_to, doctor_id)
   * @returns {Promise}
   */
  async getReports(params = {}) {
    return await api.get('/reports/bills', { params })
  },

  /**
   * Create a bill for a case
   * @param {Object} data - { patient_id, case_id, price, is_paid, use_credit }
   * @returns {Promise}
   */
  async createForCase(data) {
    return await api.post('/bills', {
      patient_id: data.patient_id,
      billable_id: data.case_id,
      billable_type: 'App\\Models\\Case',
      price: data.price,
      is_paid: data.is_paid || false,
      use_credit: data.use_credit || false,
      clinics_id: data.clinics_id || null,
      doctor_id: data.doctor_id || null
    })
  },

  /**
   * Create a bill for a reservation
   * @param {Object} data - { patient_id, reservation_id, price, is_paid, use_credit }
   * @returns {Promise}
   */
  async createForReservation(data) {
    return await api.post('/bills', {
      patient_id: data.patient_id,
      billable_id: data.reservation_id,
      billable_type: 'App\\Models\\Reservation',
      price: data.price,
      is_paid: data.is_paid || false,
      use_credit: data.use_credit || false,
      clinics_id: data.clinics_id || null,
      doctor_id: data.doctor_id || null
    })
  }
}

export default billService
