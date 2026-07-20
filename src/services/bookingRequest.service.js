import api from './api'

/**
 * Booking Request Service
 * خدمة طلبات الحجز
 *
 * Covers both sides of the Public Booking Requests feature:
 *  - Public (no-auth) submissions from a clinic's public website.
 *  - Staff review endpoints (JWT) inside the dashboard.
 *
 * The API client's response interceptor returns the raw JSON body, so each
 * call resolves to the backend payload, e.g.
 *   { success, message, data, pagination }.
 *
 * @author Clinic Management System
 */
const bookingRequestService = {
  // ==================== Public (no authentication) ====================

  /**
   * Submit a public booking request for a specific clinic (tenant).
   * The clinic is identified via the `?clinic=` query param and the
   * X-Tenant-ID / X-Clinic-ID headers. The API client skips auth/tenant
   * headers for `/tenant/public/*` paths, so we attach them explicitly here.
   *
   * @param {number|string} clinicId - The public clinic (tenant) id.
   * @param {Object} payload - { name, phone, preferred_date, preferred_time?, note? }
   * @returns {Promise<{ success:boolean, message:string, message_ar:string, data:Object }>}
   */
  async submitPublic(clinicId, payload) {
    return await api.post('/tenant/public/booking-requests', payload, {
      params: { clinic: clinicId },
      headers: {
        'X-Tenant-ID': clinicId,
        'X-Clinic-ID': clinicId,
      },
    })
  },

  // ==================== Staff review (JWT required) ====================

  /**
   * List booking requests.
   * @param {Object} params - { status, from_date, to_date, per_page, page }
   *   status: pending (default) | approved | rejected | all
   * @returns {Promise<{ success:boolean, data:Array, pagination:Object }>}
   */
  async list(params = {}) {
    return await api.get('/booking-requests', { params })
  },

  /**
   * Fetch a single booking request (404 if not found).
   * @param {number} id
   */
  async get(id) {
    return await api.get(`/booking-requests/${id}`)
  },

  /**
   * Approve a request — creates/links a patient + reservation.
   * Body is optional; every field is a staff override for the reservation.
   * @param {number} id
   * @param {Object} overrides - { doctor_id, status_id, reservation_date,
   *   reservation_time, notes, is_waiting }
   */
  async approve(id, overrides = {}) {
    return await api.post(`/booking-requests/${id}/approve`, overrides)
  },

  /**
   * Reject a request.
   * @param {number} id
   * @param {string} [rejectionReason] - optional, max 1000 chars.
   */
  async reject(id, rejectionReason = '') {
    return await api.post(`/booking-requests/${id}/reject`, {
      rejection_reason: rejectionReason,
    })
  },

  /**
   * Soft-delete a booking request.
   * @param {number} id
   */
  async remove(id) {
    return await api.delete(`/booking-requests/${id}`)
  },

  /**
   * Lightweight helper for the pending badge/count.
   * Requests a single row and reads pagination.total.
   * @returns {Promise<number>}
   */
  async pendingCount() {
    const res = await this.list({ status: 'pending', per_page: 1 })
    return res?.pagination?.total ?? (res?.data?.length ?? 0)
  },
}

export default bookingRequestService
