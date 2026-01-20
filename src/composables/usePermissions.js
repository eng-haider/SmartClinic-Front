/**
 * usePermissions Composable
 * Reactive permission checking for components
 * 
 * @author Clinic Management System
 * @version 3.0.0
 */

import { computed } from 'vue'
import { useAuthStore } from '../stores/authNew'

export function usePermissions() {
  const authStore = useAuthStore()

  /**
   * Check if user has specific permission
   * @param {string} permission - Permission name
   * @returns {boolean}
   */
  const hasPermission = (permission) => {
    return authStore.hasPermission(permission)
  }

  /**
   * Check if user has any of the permissions
   * @param {Array<string>} permissions - Array of permission names
   * @returns {boolean}
   */
  const hasAnyPermission = (permissions) => {
    return authStore.hasAnyPermission(permissions)
  }

  /**
   * Check if user has all of the permissions
   * @param {Array<string>} permissions - Array of permission names
   * @returns {boolean}
   */
  const hasAllPermissions = (permissions) => {
    return authStore.hasAllPermissions(permissions)
  }

  /**
   * Check if user has specific role
   * @param {string} role - Role name
   * @returns {boolean}
   */
  const hasRole = (role) => {
    return authStore.hasRole(role)
  }

  /**
   * Get computed permission checker
   * @param {string} permission - Permission name
   * @returns {ComputedRef<boolean>}
   */
  const can = (permission) => {
    return computed(() => authStore.hasPermission(permission))
  }

  /**
   * Get computed role checker
   * @param {string} role - Role name  
   * @returns {ComputedRef<boolean>}
   */
  const is = (role) => {
    return computed(() => authStore.hasRole(role))
  }

  return {
    // Direct checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    
    // Computed refs
    can,
    is,
    
    // Shortcuts
    userPermissions: computed(() => authStore.userPermissions),
    userRole: computed(() => authStore.userRole),
    isSuperAdmin: computed(() => authStore.isSuperAdmin),
    isClinicSuperDoctor: computed(() => authStore.isClinicSuperDoctor),
    isDoctor: computed(() => authStore.isDoctor),
    isSecretary: computed(() => authStore.isSecretary)
  }
}
