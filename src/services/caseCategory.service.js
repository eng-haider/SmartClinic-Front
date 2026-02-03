/**
 * Case Category Service
 * API service for managing case categories
 * 
 * @author Clinic Management System
 * @version 1.0.0
 */

import apiClient from './api'

const BASE_URL = '/case-categories'

/**
 * Get all case categories with pagination and filters
 * @param {Object} params - Query parameters
 * @param {number} params.per_page - Items per page
 * @param {number} params.page - Page number
 * @param {string} params.search - Search term
 * @param {string} params.sort - Sort field (prefix with - for desc)
 * @param {Object} params.filter - Additional filters
 * @returns {Promise} API response with case categories
 */
export const getCaseCategories = async (params = {}) => {
  try {
    const response = await apiClient.get(BASE_URL, { params })
    return response // Already unwrapped by interceptor
  } catch (error) {
    console.error('❌ Error fetching case categories:', error)
    throw error
  }
}

/**
 * Get a single case category by ID
 * @param {number} id - Case category ID
 * @returns {Promise} API response with case category data
 */
export const getCaseCategory = async (id) => {
  try {
    const response = await apiClient.get(`${BASE_URL}/${id}`)
    return response // Already unwrapped by interceptor
  } catch (error) {
    console.error(`❌ Error fetching case category ${id}:`, error)
    throw error
  }
}

/**
 * Create a new case category
 * @param {Object} data - Case category data
 * @param {string} data.name - Category name
 * @param {number} data.clinic_id - Clinic ID
 * @param {number} data.order - Display order
 * @param {number} data.item_cost - Default cost
 * @returns {Promise} API response with created case category
 */
export const createCaseCategory = async (data) => {
  try {
    const response = await apiClient.post(BASE_URL, data)
    return response // Already unwrapped by interceptor
  } catch (error) {
    console.error('❌ Error creating case category:', error)
    throw error
  }
}

/**
 * Update an existing case category
 * @param {number} id - Case category ID
 * @param {Object} data - Updated case category data
 * @returns {Promise} API response with updated case category
 */
export const updateCaseCategory = async (id, data) => {
  try {
    const response = await apiClient.put(`${BASE_URL}/${id}`, data)
    return response // Already unwrapped by interceptor
  } catch (error) {
    console.error(`❌ Error updating case category ${id}:`, error)
    throw error
  }
}

/**
 * Delete a case category
 * @param {number} id - Case category ID
 * @returns {Promise} API response
 */
export const deleteCaseCategory = async (id) => {
  try {
    const response = await apiClient.delete(`${BASE_URL}/${id}`)
    return response // Already unwrapped by interceptor
  } catch (error) {
    console.error(`❌ Error deleting case category ${id}:`, error)
    throw error
  }
}

export default {
  getCaseCategories,
  getCaseCategory,
  createCaseCategory,
  updateCaseCategory,
  deleteCaseCategory
}
