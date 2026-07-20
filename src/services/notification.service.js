import api from './api'

/**
 * Notification Service
 * Maps to the backend tenant notification endpoints.
 *
 * The API client's response interceptor returns the raw JSON body, so each
 * call below resolves to the backend payload (e.g. { success, data, unread_count }).
 *
 * @author Clinic Management System
 */
const notificationService = {
  /**
   * List notifications for the authenticated user.
   * @param {Object} params - Optional filters: { is_read, type, priority, limit }
   * @returns {Promise<{ success:boolean, data:Array, unread_count:number }>}
   */
  async getAll(params = {}) {
    return await api.get('/notifications', { params })
  },

  /**
   * Unread notifications count for the authenticated user.
   * @returns {Promise<{ success:boolean, unread_count:number }>}
   */
  async getUnreadCount() {
    return await api.get('/notifications/unread-count')
  },

  /**
   * Mark a single notification as read.
   */
  async markAsRead(id) {
    return await api.post(`/notifications/${id}/read`)
  },

  /**
   * Mark all notifications as read.
   */
  async markAllAsRead() {
    return await api.post('/notifications/mark-all-read')
  },

  /**
   * Delete a notification.
   */
  async remove(id) {
    return await api.delete(`/notifications/${id}`)
  }
}

export default notificationService
