/**
 * usePermissions Composable
 * Dynamic permission checking for components
 * Works with ANY permission from API - no hardcoding needed!
 * 
 * HOW IT WORKS:
 * - Uses keyword matching: hasPermissionFor('patient') matches 'create-patient', 'edit-patient', etc.
 * - Automatically filters navigation based on user permissions
 * - No need to update constants when adding new permissions!
 * 
 * @author Clinic Management System
 * @version 3.0.0
 */

import { computed, ref } from 'vue'
import { useAuthStore } from '../stores/authNew'
import permissionHelper from '../services/permission.helper'
import { NAV_CONFIG, BOTTOM_NAV_CONFIG, FEATURE_CONFIG } from '../config/navigation'

export function usePermissions() {
  const authStore = useAuthStore()
  const currentLang = ref(localStorage.getItem('lang') || 'ar')

  // ==================== Direct Permission Checks ====================

  /**
   * Check if user has exact permission
   * @param {string} permission - Exact permission string
   */
  const hasPermission = (permission) => {
    return authStore.hasPermission(permission)
  }

  /**
   * Check if user has ANY permission containing the keyword
   * This is the MAGIC - no need to know exact permission names!
   * @param {string} keyword - Keyword to match
   * 
   * @example
   * hasPermissionFor('patient') // true if user has ANY patient permission
   * hasPermissionFor('reservation') // true if user has ANY reservation permission
   */
  const hasPermissionFor = (keyword) => {
    return permissionHelper.hasPermissionFor(keyword)
  }

  /**
   * Check if user has ANY permission containing ANY of the keywords
   * @param {Array<string>} keywords
   */
  const hasAnyPermissionFor = (keywords) => {
    return permissionHelper.hasAnyPermissionFor(keywords)
  }

  /**
   * Check if user has any of the exact permissions
   */
  const hasAnyPermission = (permissions) => {
    return authStore.hasAnyPermission(permissions)
  }

  /**
   * Check if user has all of the exact permissions
   */
  const hasAllPermissions = (permissions) => {
    return authStore.hasAllPermissions(permissions)
  }

  /**
   * Check if user has specific role
   */
  const hasRole = (role) => {
    return authStore.hasRole(role)
  }

  /**
   * Check if user has any of the roles
   */
  const hasAnyRole = (roles) => {
    return permissionHelper.hasAnyRole(roles)
  }

  // ==================== Computed Permission Refs ====================

  /**
   * Get computed permission checker for exact permission
   */
  const can = (permission) => {
    return computed(() => authStore.hasPermission(permission))
  }

  /**
   * Get computed permission checker for keyword
   * @example
   * const canPatient = canFor('patient') // reactive, true if has any patient permission
   */
  const canFor = (keyword) => {
    return computed(() => permissionHelper.hasPermissionFor(keyword))
  }

  /**
   * Get computed role checker
   */
  const is = (role) => {
    return computed(() => authStore.hasRole(role))
  }

  // ==================== Navigation Helpers ====================

  /**
   * Check if a nav item should be visible
   */
  const canAccessNavItem = (item) => {
    return permissionHelper.canAccessNavItem(item)
  }

  /**
   * Get filtered navigation items based on user permissions
   * Automatically filters based on permissionKeywords!
   */
  const filteredNavItems = computed(() => {
    const lang = currentLang.value
    return permissionHelper.filterNavItems(NAV_CONFIG, lang)
  })

  /**
   * Get filtered bottom navigation items
   */
  const filteredBottomNavItems = computed(() => {
    const lang = currentLang.value
    return permissionHelper.filterNavItems(BOTTOM_NAV_CONFIG, lang)
  })

  /**
   * Update language and refresh nav items
   */
  const setLanguage = (lang) => {
    currentLang.value = lang
  }

  // ==================== Feature Access ====================

  /**
   * Check if user can perform a feature action
   * @param {string} featureKey - Key from FEATURE_CONFIG
   */
  const canDoFeature = (featureKey) => {
    return permissionHelper.canDoFeature(featureKey, FEATURE_CONFIG)
  }

  /**
   * Get computed feature checker
   */
  const canFeature = (featureKey) => {
    return computed(() => canDoFeature(featureKey))
  }

  // ==================== User Info ====================

  const userPermissions = computed(() => authStore.userPermissions || [])
  const userRole = computed(() => authStore.userRole)
  const userRoles = computed(() => permissionHelper.getUserRoles())
  
  // Role shortcuts
  const isSuperAdmin = computed(() => authStore.isSuperAdmin)
  const isClinicSuperDoctor = computed(() => authStore.isClinicSuperDoctor)
  const isDoctor = computed(() => authStore.isDoctor)
  const isSecretary = computed(() => authStore.isSecretary)

  // ==================== Debug ====================

  /**
   * Debug helper - call this to see user's permissions in console
   */
  const debugPermissions = () => {
    permissionHelper.debugAccess()
  }

  return {
    // Keyword-based checks (RECOMMENDED - dynamic!)
    hasPermissionFor,
    hasAnyPermissionFor,
    canFor,

    // Exact permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,

    // Role checks
    hasRole,
    hasAnyRole,
    is,

    // Navigation
    canAccessNavItem,
    filteredNavItems,
    filteredBottomNavItems,
    setLanguage,

    // Features
    canDoFeature,
    canFeature,

    // User info
    userPermissions,
    userRole,
    userRoles,
    isSuperAdmin,
    isClinicSuperDoctor,
    isDoctor,
    isSecretary,

    // Debug
    debugPermissions
  }
}
