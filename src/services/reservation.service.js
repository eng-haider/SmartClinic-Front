/**
 * Reservation Service
 * خدمة الحجوزات
 * 
 * @author Clinic Management System
 * @version 1.0.0
 */

import apiClient from './api'

export const reservationService = {
  /**
   * Get all reservations with filters
   * @param {Object} params - Query parameters
   */
  async getAll(params = {}) {
    return await apiClient.get('/reservations', { params })
  },

  /**
   * Get reservations for a specific month
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @param {number|null} doctorId - Doctor ID filter
   */
  async getMonthlyReservations(year, month, doctorId = null) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
    
    const params = {
      'from_date': startDate,
      'to_date': endDate,
      'include': 'patient,doctor,status',
      'per_page': 500
    }
    
    if (doctorId) {
      params['filter[doctor_id]'] = doctorId
    }
    
    return await apiClient.get('/reservations', { params })
  },

  /**
   * Get single reservation by ID
   * @param {number} id - Reservation ID
   */
  async getById(id) {
    return await apiClient.get(`/reservations/${id}`, {
      params: { include: 'patient,doctor,clinic,status' }
    })
  },

  /**
   * Create new reservation
   * @param {Object} reservationData - Reservation data
   */
  async create(reservationData) {
    return await apiClient.post('/reservations', reservationData)
  },

  /**
   * Update reservation
   * @param {number} id - Reservation ID
   * @param {Object} reservationData - Updated data
   */
  async update(id, reservationData) {
    return await apiClient.put(`/reservations/${id}`, reservationData)
  },

  /**
   * Delete reservation
   * @param {number} id - Reservation ID
   */
  async delete(id) {
    return await apiClient.delete(`/reservations/${id}`)
  },

  /**
   * Get today's reservations
   */
  async getTodayReservations() {
    const today = new Date().toISOString().split('T')[0]
    return await apiClient.get('/reservations', {
      params: {
        'filter[reservation_start_date]': today,
        'sort': 'reservation_from_time',
        'include': 'patient,doctor,status'
      }
    })
  },

  /**
   * Get doctor's schedule for a specific date
   * @param {number} doctorId - Doctor ID
   * @param {string} date - Date (YYYY-MM-DD)
   */
  async getDoctorSchedule(doctorId, date) {
    return await apiClient.get('/reservations', {
      params: {
        'filter[doctor_id]': doctorId,
        'filter[reservation_start_date]': date,
        'sort': 'reservation_from_time',
        'include': 'patient,status'
      }
    })
  },

  /**
   * Get waiting list
   */
  async getWaitingList() {
    return await apiClient.get('/reservations', {
      params: {
        'filter[is_waiting]': 1,
        'sort': '-created_at',
        'include': 'patient,doctor'
      }
    })
  },

  /**
   * Search patients for booking
   * @param {string} query - Search query
   */
  async searchPatients(query) {
    const params = {
      page: 1,
      per_page: 15,
      sort: '-created_at'
    }
    
    if (query) {
      params.search = query
    }
    
    return await apiClient.get('/patients', { params })
  },

  /**
   * Get doctors list
   */
  async getDoctors() {
    return await apiClient.get('/doctors')
  },

  /**
   * Get clinics list
   */
  async getClinics() {
    return await apiClient.get('/clinics', {
      params: { per_page: 100 }
    })
  },

  /**
   * Get statuses list
   */
  async getStatuses() {
    return await apiClient.get('/statuses', {
      params: { per_page: 100 }
    })
  }
}

export default reservationService
