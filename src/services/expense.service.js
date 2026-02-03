import api from './api'

const expenseService = {
  // ==================== Categories ====================
  
  /**
   * Get all expense categories with pagination and filters
   */
  async getCategories(params = {}) {
    const response = await api.get('/clinic-expense-categories', { params })
    return response.data
  },

  /**
   * Get only active expense categories (for dropdowns)
   */
  async getActiveCategories() {
    const response = await api.get('/clinic-expense-categories-active')
    return response.data
  },

  /**
   * Get single expense category
   */
  async getCategory(id) {
    const response = await api.get(`/clinic-expense-categories/${id}`)
    return response.data
  },

  /**
   * Create new expense category
   */
  async createCategory(data) {
    const response = await api.post('/clinic-expense-categories', data)
    return response.data
  },

  /**
   * Update expense category
   */
  async updateCategory(id, data) {
    const response = await api.put(`/clinic-expense-categories/${id}`, data)
    return response.data
  },

  /**
   * Delete expense category
   */
  async deleteCategory(id) {
    const response = await api.delete(`/clinic-expense-categories/${id}`)
    return response.data
  },

  // ==================== Expenses ====================

  /**
   * Get all expenses with pagination and filters
   * Returns full response with { success, data, summary, pagination }
   */
  async getExpenses(params = {}) {
    const response = await api.get('/clinic-expenses', { params })
    // Return full response to access summary and pagination
    return response
  },

  /**
   * Get single expense
   */
  async getExpense(id) {
    const response = await api.get(`/clinic-expenses/${id}`)
    return response.data
  },

  /**
   * Create new expense
   */
  async createExpense(data) {
    const response = await api.post('/clinic-expenses', data)
    return response.data
  },

  /**
   * Update expense
   */
  async updateExpense(id, data) {
    const response = await api.put(`/clinic-expenses/${id}`, data)
    return response.data
  },

  /**
   * Delete expense
   */
  async deleteExpense(id) {
    const response = await api.delete(`/clinic-expenses/${id}`)
    return response.data
  },

  /**
   * Mark expense as paid
   */
  async markAsPaid(id) {
    const response = await api.patch(`/clinic-expenses/${id}/mark-paid`)
    return response.data
  },

  /**
   * Mark expense as unpaid
   */
  async markAsUnpaid(id) {
    const response = await api.patch(`/clinic-expenses/${id}/mark-unpaid`)
    return response.data
  },

  // ==================== Statistics & Reports ====================

  /**
   * Get expense statistics
   */
  async getStatistics(params = {}) {
    const response = await api.get('/clinic-expenses-statistics', { params })
    return response.data
  },

  /**
   * Get unpaid expenses
   */
  async getUnpaidExpenses(params = {}) {
    const response = await api.get('/clinic-expenses-unpaid', { params })
    return response.data
  },

  /**
   * Get expenses by date range
   */
  async getExpensesByDateRange(startDate, endDate) {
    const response = await api.get('/clinic-expenses-by-date-range', {
      params: { start_date: startDate, end_date: endDate }
    })
    return response.data
  }
}

export default expenseService
