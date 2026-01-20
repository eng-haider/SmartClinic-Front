/**
 * Role Directive  
 * v-role directive to show/hide elements based on user role
 * 
 * Usage:
 * <v-btn v-role="'super_admin'">Admin Only</v-btn>
 * <div v-role="['super_admin', 'clinic_super_doctor']">...</div>
 * 
 * @author Clinic Management System
 * @version 3.0.0
 */

import authService from '../services/auth.service'

export default {
  mounted(el, binding) {
    checkRole(el, binding)
  },
  
  updated(el, binding) {
    checkRole(el, binding)
  }
}

function checkRole(el, binding) {
  const roles = Array.isArray(binding.value) ? binding.value : [binding.value]
  
  // Check if user has any of the specified roles
  const hasRole = roles.some(role => authService.hasRole(role))
  
  if (!hasRole) {
    // Remove element from DOM if user doesn't have role
    el.style.display = 'none'
    el.disabled = true
  } else {
    // Show element if user has role
    el.style.display = ''
    el.disabled = false
  }
}
