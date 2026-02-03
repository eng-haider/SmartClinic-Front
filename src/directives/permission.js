/**
 * Permission Directive
 * v-permission directive to show/hide elements based on user permissions
 * 
 * DYNAMIC PERMISSION CHECKING:
 * - Use exact permission: v-permission="'create-patient'"
 * - Use keyword matching: v-permission.keyword="'patient'" (matches ANY permission with 'patient')
 * - Use array: v-permission="['edit-patient', 'delete-patient']"
 * 
 * MODIFIERS:
 * - .any (default): User needs ANY of the permissions
 * - .all: User needs ALL permissions
 * - .keyword: Use keyword matching instead of exact match
 * - .hide: Use visibility:hidden instead of display:none
 * 
 * @example
 * <v-btn v-permission="'create-patient'">Create</v-btn>
 * <v-btn v-permission.keyword="'patient'">Patient Actions</v-btn>
 * <div v-permission="['edit-patient', 'delete-patient']">...</div>
 * <div v-permission.all="['edit-patient', 'delete-patient']">...</div>
 * 
 * @author Clinic Management System
 * @version 3.0.0
 */

import permissionHelper from '../services/permission.helper'

export default {
  mounted(el, binding) {
    checkPermission(el, binding)
  },
  
  updated(el, binding) {
    checkPermission(el, binding)
  }
}

function checkPermission(el, binding) {
  const value = binding.value
  const modifiers = binding.modifiers || {}
  
  // Determine check mode
  const useKeyword = modifiers.keyword === true
  const checkAll = modifiers.all === true
  const hideMode = modifiers.hide === true
  
  let hasPermission = false
  
  // If no value specified, allow access
  if (value === undefined || value === null || value === '') {
    hasPermission = true
  } else if (useKeyword) {
    // Keyword-based matching
    const keywords = Array.isArray(value) ? value : [value]
    if (checkAll) {
      hasPermission = permissionHelper.hasAllPermissionsFor(keywords)
    } else {
      hasPermission = permissionHelper.hasAnyPermissionFor(keywords)
    }
  } else {
    // Exact permission matching
    const permissions = Array.isArray(value) ? value : [value]
    if (checkAll) {
      hasPermission = permissions.every(p => permissionHelper.hasExactPermission(p))
    } else {
      hasPermission = permissionHelper.hasAnyExactPermission(permissions)
    }
  }
  
  applyVisibility(el, hasPermission, hideMode)
}

function applyVisibility(el, hasPermission, hideMode) {
  if (!hasPermission) {
    // Store original display value for restoration
    if (!el.dataset.originalDisplay) {
      el.dataset.originalDisplay = el.style.display || ''
    }
    
    if (hideMode) {
      // Use visibility hidden (element takes space but not visible)
      el.style.visibility = 'hidden'
      el.style.pointerEvents = 'none'
    } else {
      // Remove element from flow (default)
      el.style.display = 'none'
    }
    el.disabled = true
    el.setAttribute('aria-hidden', 'true')
  } else {
    // Restore element visibility
    el.style.display = el.dataset.originalDisplay || ''
    el.style.visibility = ''
    el.style.pointerEvents = ''
    el.disabled = false
    el.removeAttribute('aria-hidden')
  }
}

/**
 * Role Directive
 * v-role directive to show/hide elements based on user role
 * 
 * @example
 * <div v-role="'doctor'">Doctor only</div>
 * <div v-role="['doctor', 'super_admin']">Doctor or Admin</div>
 */
export const roleDirective = {
  mounted(el, binding) {
    checkRole(el, binding)
  },
  
  updated(el, binding) {
    checkRole(el, binding)
  }
}

function checkRole(el, binding) {
  const roles = Array.isArray(binding.value) ? binding.value : [binding.value]
  const hideMode = binding.modifiers?.hide === true
  
  let hasRole = false
  
  if (!roles || roles.length === 0 || roles[0] === undefined) {
    hasRole = true
  } else {
    hasRole = permissionHelper.hasAnyRole(roles)
  }
  
  applyVisibility(el, hasRole, hideMode)
}

/**
 * Keyword Permission Directive
 * v-can directive for keyword-based permission checking
 * 
 * @example
 * <v-btn v-can="'patient'">Patient Actions</v-btn> (shows if user has ANY patient permission)
 * <v-btn v-can="['patient', 'reservation']">...</v-btn>
 */
export const canDirective = {
  mounted(el, binding) {
    checkKeywordPermission(el, binding)
  },
  
  updated(el, binding) {
    checkKeywordPermission(el, binding)
  }
}

function checkKeywordPermission(el, binding) {
  const keywords = Array.isArray(binding.value) ? binding.value : [binding.value]
  const checkAll = binding.modifiers?.all === true
  const hideMode = binding.modifiers?.hide === true
  
  let hasPermission = false
  
  if (!keywords || keywords.length === 0 || keywords[0] === undefined) {
    hasPermission = true
  } else if (checkAll) {
    hasPermission = permissionHelper.hasAllPermissionsFor(keywords)
  } else {
    hasPermission = permissionHelper.hasAnyPermissionFor(keywords)
  }
  
  applyVisibility(el, hasPermission, hideMode)
}
