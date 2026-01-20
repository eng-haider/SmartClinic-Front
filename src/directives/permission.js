/**
 * Permission Directive
 * v-permission directive to show/hide elements based on user permissions
 * 
 * Usage:
 * <v-btn v-permission="'create-patient'">Create</v-btn>
 * <div v-permission="['edit-patient', 'delete-patient']">...</div>
 * <div v-permission:any="['edit-patient', 'delete-patient']">...</div>
 * <div v-permission:all="['edit-patient', 'delete-patient']">...</div>
 * 
 * @author Clinic Management System
 * @version 3.0.0
 */

import authService from '../services/auth.service'

export default {
  mounted(el, binding) {
    checkPermission(el, binding)
  },
  
  updated(el, binding) {
    checkPermission(el, binding)
  }
}

function checkPermission(el, binding) {
  const permissions = Array.isArray(binding.value) ? binding.value : [binding.value]
  const modifier = Object.keys(binding.modifiers)[0] || 'any'
  
  let hasPermission = false
  
  if (modifier === 'all') {
    // User must have ALL permissions
    hasPermission = authService.hasAllPermissions(permissions)
  } else {
    // User must have ANY permission (default)
    hasPermission = authService.hasAnyPermission(permissions)
  }
  
  if (!hasPermission) {
    // Remove element from DOM if user doesn't have permission
    el.style.display = 'none'
    el.disabled = true
  } else {
    // Show element if user has permission
    el.style.display = ''
    el.disabled = false
  }
}
