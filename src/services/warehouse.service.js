import api from './api'

/**
 * Warehouse / Inventory Service
 * Maps to the backend warehouse-items endpoints.
 *
 * @author Clinic Management System
 */
const warehouseService = {
  // ==================== Items ====================

  /**
   * List warehouse items (paginated, with filters/sort/include).
   * Returns the full response so callers can read { data, pagination }.
   */
  async getItems(params = {}) {
    return await api.get('/warehouse-items', { params })
  },

  /**
   * Get a single warehouse item.
   */
  async getItem(id, params = {}) {
    const response = await api.get(`/warehouse-items/${id}`, { params })
    return response.data
  },

  /**
   * Create a new warehouse item (opening balance only).
   */
  async createItem(data) {
    const response = await api.post('/warehouse-items', data)
    return response.data
  },

  /**
   * Update an item's metadata (stock is not changed here).
   */
  async updateItem(id, data) {
    const response = await api.put(`/warehouse-items/${id}`, data)
    return response.data
  },

  /**
   * Delete a warehouse item.
   */
  async deleteItem(id) {
    const response = await api.delete(`/warehouse-items/${id}`)
    return response.data
  },

  // ==================== Stock movements ====================

  /**
   * Restock an item: increases stock and records a clinic expense (cash out).
   */
  async restock(id, data) {
    const response = await api.post(`/warehouse-items/${id}/restock`, data)
    return response.data
  },

  /**
   * Manually adjust stock (stock-take correction, breakage, ...).
   * delta can be positive or negative (not zero).
   */
  async adjust(id, delta, reason = null) {
    const response = await api.post(`/warehouse-items/${id}/adjust`, { delta, reason })
    return response.data
  },

  /**
   * Items at or below their low-stock threshold.
   */
  async getLowStock() {
    const response = await api.get('/warehouse-items-low-stock')
    return response.data
  },

  /**
   * Stock movement ledger for an item (paginated).
   * Returns the full response so callers can read { data, pagination }.
   */
  async getTransactions(id, params = {}) {
    return await api.get(`/warehouse-items/${id}/transactions`, { params })
  },

  // ==================== Case-category default kit ====================

  /**
   * Default kit (bill of materials) for a case category.
   */
  async getCategoryKit(categoryId) {
    const response = await api.get(`/case-categories/${categoryId}/warehouse-items`)
    return response.data
  },

  /**
   * Replace the default kit for a case category.
   * @param {Array<{warehouse_item_id:number, quantity:number}>} items
   */
  async syncCategoryKit(categoryId, items) {
    const response = await api.put(`/case-categories/${categoryId}/warehouse-items`, { items })
    return response.data
  }
}

export default warehouseService
