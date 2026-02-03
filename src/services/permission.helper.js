/**
 * Permission Helper Service
 * Dynamic permission checking without hardcoded permission strings
 * 
 * HOW IT WORKS:
 * - Permissions come from API (user.permissions array)
 * - We check if user has ANY permission containing specific keywords
 * - No need to define all permissions - just use keywords!
 * 
 * EXAMPLE:
 * User has: ['create-patient', 'edit-patient', 'view-clinic-reservations']
 * hasPermissionFor('patient') → true (matches create-patient, edit-patient)
 * hasPermissionFor('reservation') → true (matches view-clinic-reservations)
 * hasPermissionFor('bill') → false (no permission contains 'bill')
 * 
 * @author Clinic Management System
 * @version 3.0.0
 */

import authService from '../services/auth.service'

class PermissionHelper {
  /**
   * Get user's permissions from storage
   * @returns {Array<string>}
   */
  getUserPermissions() {
    const user = authService.getUser()
    return user?.permissions || []
  }

  /**
   * Get user's roles from storage
   * @returns {Array<string>}
   */
  getUserRoles() {
    const user = authService.getUser()
    return user?.roles || []
  }

  /**
   * Check if user has ANY permission containing the keyword
   * @param {string} keyword - Keyword to search for in permissions
   * @returns {boolean}
   * 
   * @example
   * // User has: ['create-patient', 'edit-patient']
   * hasPermissionFor('patient') // true
   * hasPermissionFor('bill') // false
   */
  hasPermissionFor(keyword) {
    const permissions = this.getUserPermissions()
    const lowerKeyword = keyword.toLowerCase()
    
    return permissions.some(permission => 
      permission.toLowerCase().includes(lowerKeyword)
    )
  }

  /**
   * Check if user has ANY permission containing ANY of the keywords
   * @param {Array<string>} keywords - Keywords to search for
   * @returns {boolean}
   * 
   * @example
   * // User has: ['create-patient', 'view-clinic-reservations']
   * hasAnyPermissionFor(['patient', 'bill']) // true (has patient)
   * hasAnyPermissionFor(['expense', 'report']) // false
   */
  hasAnyPermissionFor(keywords) {
    if (!keywords || keywords.length === 0) return true
    return keywords.some(keyword => this.hasPermissionFor(keyword))
  }

  /**
   * Check if user has permissions containing ALL keywords
   * @param {Array<string>} keywords - Keywords that must all be matched
   * @returns {boolean}
   */
  hasAllPermissionsFor(keywords) {
    if (!keywords || keywords.length === 0) return true
    return keywords.every(keyword => this.hasPermissionFor(keyword))
  }

  /**
   * Check if user has exact permission
   * @param {string} permission - Exact permission string
   * @returns {boolean}
   */
  hasExactPermission(permission) {
    return authService.hasPermission(permission)
  }

  /**
   * Check if user has any of the exact permissions
   * @param {Array<string>} permissions - Exact permission strings
   * @returns {boolean}
   */
  hasAnyExactPermission(permissions) {
    return authService.hasAnyPermission(permissions)
  }

  /**
   * Check if user has specific role
   * @param {string} role - Role name
   * @returns {boolean}
   */
  hasRole(role) {
    return authService.hasRole(role)
  }

  /**
   * Check if user has any of the specified roles
   * @param {Array<string>} roles - Role names
   * @returns {boolean}
   */
  hasAnyRole(roles) {
    if (!roles || roles.length === 0) return false
    const userRoles = this.getUserRoles()
    return roles.some(role => userRoles.includes(role))
  }

  /**
   * Check if user can access a nav item
   * @param {Object} item - Navigation item config
   * @returns {boolean}
   */
  canAccessNavItem(item) {
    // Always show items marked as alwaysShow
    if (item.alwaysShow) return true

    // Check role-based access first
    if (item.roleRequired && item.roleRequired.length > 0) {
      if (this.hasAnyRole(item.roleRequired)) {
        return true
      }
    }

    // Check keyword-based permissions
    if (item.permissionKeywords && item.permissionKeywords.length > 0) {
      return this.hasAnyPermissionFor(item.permissionKeywords)
    }

    // If no restrictions defined, allow access
    return true
  }

  /**
   * Check if user can access a route
   * @param {Object} routeConfig - Route configuration from ROUTE_CONFIG
   * @param {string} routeName - Name of the route
   * @returns {boolean}
   */
  canAccessRoute(routeConfig, routeName) {
    // If no config exists, allow access
    if (!routeConfig) return true

    const config = routeConfig[routeName]
    if (!config) return true

    // Always allow routes marked as such
    if (config.alwaysAllow) return true

    // Check role-based access
    if (config.roles && config.roles.length > 0) {
      if (this.hasAnyRole(config.roles)) {
        return true
      }
    }

    // Check keyword-based permissions
    if (config.keywords && config.keywords.length > 0) {
      return this.hasAnyPermissionFor(config.keywords)
    }

    return true
  }

  /**
   * Check if user can perform a feature action
   * @param {string} featureKey - Feature key from FEATURE_CONFIG
   * @param {Object} featureConfig - Feature configuration
   * @returns {boolean}
   */
  canDoFeature(featureKey, featureConfig) {
    const requiredPermissions = featureConfig[featureKey]
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true
    }
    
    // Check if user has any of the exact permissions
    return this.hasAnyExactPermission(requiredPermissions)
  }

  /**
   * Filter navigation items based on user permissions
   * @param {Array} navItems - Navigation items config
   * @param {string} lang - Current language
   * @returns {Array}
   */
  filterNavItems(navItems, lang = 'ar') {
    return navItems
      .filter(item => this.canAccessNavItem(item))
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(item => ({
        key: item.key,
        title: item.title[lang] || item.title.ar || item.title,
        icon: item.icon,
        to: item.to
      }))
  }

  /**
   * Get all user permissions grouped by category
   * Useful for debugging or showing user's permissions
   * @returns {Object}
   */
  getPermissionsByCategory() {
    const permissions = this.getUserPermissions()
    const categories = {}

    permissions.forEach(permission => {
      // Extract category from permission (e.g., 'create-patient' → 'patient')
      const parts = permission.split('-')
      const category = parts.length > 1 ? parts[parts.length - 1] : parts[0]
      
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push(permission)
    })

    return categories
  }

  /**
   * Debug helper - log user's access info
   */
  debugAccess() {
    console.log('🔐 Permission Helper Debug:')
    console.log('  Permissions:', this.getUserPermissions())
    console.log('  Roles:', this.getUserRoles())
    console.log('  By Category:', this.getPermissionsByCategory())
  }
}

export default new PermissionHelper()
