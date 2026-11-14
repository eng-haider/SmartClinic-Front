/**
 * Department Service
 * API service for clinic departments (e.g. Orthodontics, Cosmetic). Case
 * categories belong to a department, and cases and bills are filtered by it.
 */

import apiClient from './api'

const BASE_URL = '/departments'

/**
 * Get all departments
 * @returns {Promise} API response with departments
 */
export const getDepartments = async (params = {}) => {
  return await apiClient.get(BASE_URL, { params })
}

/**
 * Create a department
 * @param {Object} data - { name }
 */
export const createDepartment = async (data) => {
  return await apiClient.post(BASE_URL, data)
}

/**
 * Update a department
 * @param {number} id - Department ID
 * @param {Object} data - { name }
 */
export const updateDepartment = async (id, data) => {
  return await apiClient.put(`${BASE_URL}/${id}`, data)
}

/**
 * Delete a department. Its categories stay, without a department.
 * @param {number} id - Department ID
 */
export const deleteDepartment = async (id) => {
  return await apiClient.delete(`${BASE_URL}/${id}`)
}
