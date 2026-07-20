/**
 * Expenses Summary Service
 * API client for clinic expenses summary endpoint
 * 
 * @author SmartClinic
 * @version 1.0.0
 */

import api from './api'

const expensesSummaryService = {
  /**
   * Get clinic expenses summary for a specific date or date range
   * @param {Object} params - Query parameters
   * @param {string} params.date - Single day (e.g. '2026-06-02')
   * @param {string} params.from - Start date for range
   * @param {string} params.to - End date for range
   * @returns {Promise} Response with summary data
   */
  async getSummary(params = {}) {
    try {
      const response = await api.get('/clinic-expenses-summary', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching expenses summary:', error)
      throw error
    }
  },

  /**
   * Get today's expenses summary (default)
   * @returns {Promise}
   */
  async getToday() {
    return this.getSummary()
  },

  /**
   * Get expenses summary for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise}
   */
  async getByDate(date) {
    return this.getSummary({ date })
  },

  /**
   * Get expenses summary for a date range
   * @param {string} from - Start date in YYYY-MM-DD format
   * @param {string} to - End date in YYYY-MM-DD format
   * @returns {Promise}
   */
  async getByDateRange(from, to) {
    return this.getSummary({ from, to })
  },

  /**
   * Get tenant-specific expenses summary
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  async getTenantSummary(params = {}) {
    try {
      const response = await api.get('/tenant/clinic-expenses-summary', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching tenant expenses summary:', error)
      throw error
    }
  }
}

export default expensesSummaryService
