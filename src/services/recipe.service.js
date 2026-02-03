/**
 * Recipe Service
 * Handles all recipe/prescription-related API calls
 * 
 * @author Clinic Management System
 * @version 1.0.0
 */

import api from './api'

const RecipeService = {
  /**
   * Get all recipes (paginated)
   * @param {Object} params - Query parameters (search, per_page, page, filters)
   * @returns {Promise}
   */
  async getAll(params = {}) {
    return api.get('/recipes', { params })
  },

  /**
   * Get a single recipe by ID
   * @param {Number} id
   * @returns {Promise}
   */
  async getById(id) {
    return api.get(`/recipes/${id}`, {
      params: {
        include: 'patient,doctor,recipeItems'
      }
    })
  },

  /**
   * Create a new recipe
   * @param {Object} data - Recipe data with recipe_items
   * @returns {Promise}
   */
  async create(data) {
    return api.post('/recipes', data)
  },

  /**
   * Update a recipe
   * @param {Number} id
   * @param {Object} data - Updated recipe data
   * @returns {Promise}
   */
  async update(id, data) {
    return api.put(`/recipes/${id}`, data)
  },

  /**
   * Delete a recipe
   * @param {Number} id
   * @returns {Promise}
   */
  async delete(id) {
    return api.delete(`/recipes/${id}`)
  },

  /**
   * Get recipes for a specific patient
   * @param {Number} patientId
   * @param {Object} params - Additional query parameters
   * @returns {Promise}
   */
  async getPatientRecipes(patientId, params = {}) {
    return api.get('/recipes', {
      params: {
        'filter[patient_id]': patientId,
        include: 'recipeItems,doctor',
        sort: '-created_at',
        ...params
      }
    })
  },

  /**
   * Get recipes for a specific doctor
   * @param {Number} doctorId
   * @param {Object} params - Additional query parameters
   * @returns {Promise}
   */
  async getDoctorRecipes(doctorId, params = {}) {
    return api.get('/recipes', {
      params: {
        'filter[doctors_id]': doctorId,
        include: 'patient,recipeItems',
        sort: '-created_at',
        ...params
      }
    })
  }
}

export default RecipeService
