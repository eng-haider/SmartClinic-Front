/**
 * Vue Router - Vue 3
 * Dynamic permission-based routing
 * 
 * HOW IT WORKS:
 * - Routes have permissionKeywords in meta
 * - System checks if user has ANY permission containing those keywords
 * - No need to hardcode exact permissions!
 * 
 * @author Clinic Management System
 * @version 3.0.0
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authNew'
import permissionHelper from '@/services/permission.helper'
import { ROUTE_CONFIG } from '@/config/navigation'

// ==================== Route Components ====================
const routes = [
  // Public Patient Profile (No Auth Required)
  {
    path: '/public/patient/:token',
    name: 'PublicPatientProfile',
    component: () => import('@/views/PublicPatientProfile.vue'),
    meta: {
      public: true,
      layout: 'blank'
    }
  },

  // NOTE: The public booking form is a standalone static page served at
  // /booking.html (public/booking.html) so it loads instantly without the
  // SPA bundle. It is intentionally NOT a Vue route.

  // Login Page
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/pages/Login.vue'),
    meta: { guest: true }
  },
  
  // Register Page
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/pages/Register.vue'),
    meta: { guest: true }
  },
  
  // Dashboard Layout
  {
    path: '/',
    component: () => import('@/layouts/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Dashboard.vue'),
        meta: { alwaysAllow: true }
      },
      {
        path: 'dashboard',
        name: 'DashboardAlt',
        component: () => import('@/views/dashboard/Dashboard.vue'),
        meta: { alwaysAllow: true }
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/dashboard/DashboardAnalytics.vue'),
        meta: { 
          title: 'Analytics Dashboard',
          permissionKeywords: ['report', 'analytics'],
          roles: ['super_admin', 'clinic_super_doctor']
        }
      },
      {
        path: 'patients',
        name: 'Patients',
        component: () => import('@/views/pages/Patients.vue'),
        meta: { 
          title: 'Patients Management',
          permissionKeywords: ['patient']
        }
      },
      {
        path: 'patients/ophthalmology/:id',
        name: 'OphthalmologyPatientDetail',
        component: () => import('@/views/patients/OphthalmologyPatientPage.vue'),
        meta: {
          title: 'Ophthalmology Patient Details',
          permissionKeywords: ['patient']
        }
      },
      {
        path: 'patients/:id',
        name: 'PatientDetail',
        component: () => import('@/views/patients/PatientDetail.vue'),
        meta: { 
          title: 'Patient Details',
          permissionKeywords: ['patient']
        }
      },
      {
        path: 'doctors',
        name: 'Doctors',
        component: () => import('@/views/pages/Doctors.vue'),
        meta: { 
          title: 'Doctors Management',
          permissionKeywords: ['doctor', 'user'],
          roles: ['super_admin', 'clinic_super_doctor']
        }
      },
      {
        path: 'cases',
        name: 'Cases',
        component: () => import('@/views/pages/Cases.vue'),
        meta: { 
          title: 'Cases Management',
          permissionKeywords: ['case']
        }
      },
      {
        path: 'cases/:id',
        name: 'CaseDetail',
        component: () => import('@/views/cases/CaseDetail.vue'),
        meta: { 
          title: 'Case Details',
          permissionKeywords: ['case']
        }
      },
      {
        path: 'reservations',
        name: 'Reservations',
        component: () => import('@/views/pages/Reservations.vue'),
        meta: { 
          title: 'Appointments Calendar',
          requiresAuth: true,
          permissionKeywords: ['reservation']
        }
      },
      {
        path: 'waiting-list',
        name: 'WaitingList',
        component: () => import('@/views/pages/WaitingList.vue'),
        meta: {
          title: 'Waiting List',
          requiresAuth: true,
          permissionKeywords: ['reservation', 'waiting']
        }
      },
      {
        path: 'booking-requests',
        name: 'BookingRequests',
        component: () => import('@/views/pages/BookingRequests.vue'),
        meta: {
          title: 'Booking Requests',
          requiresAuth: true,
          permissionKeywords: ['reservation', 'booking']
        }
      },
      {
        path: 'bills',
        name: 'Bills',
        component: () => import('@/views/pages/Bills.vue'),
        meta: { 
          title: 'Bills Management',
          requiresAuth: true,
          permissionKeywords: ['bill']
        }
      },
      {
        path: 'recipes',
        name: 'Recipes',
        component: () => import('@/views/pages/PrescriptionPage.vue'),
        meta: { 
          title: 'Prescriptions Management',
          requiresAuth: true,
          permissionKeywords: ['recipe', 'prescription']
        }
      },
      {
        path: 'medications',
        name: 'MedicationLibrary',
        component: () => import('@/views/pages/MedicationLibrary.vue'),
        meta: {
          title: 'Medication Library',
          requiresAuth: true,
          permissionKeywords: ['recipe', 'medication']
        }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/pages/Settings.vue'),
        meta: { 
          title: 'Settings',
          requiresAuth: true,
          alwaysAllow: true
        }
      },
      {
        path: 'messaging/settings',
        name: 'MessagingSettings',
        component: () => import('@/pages/messaging/SettingsPage.vue'),
        meta: {
          title: 'Messaging Settings',
          requiresAuth: true,
          permissionKeywords: ['message', 'whatsapp', 'automation']
        }
      },
      {
        path: 'messaging/templates',
        name: 'MessagingTemplates',
        component: () => import('@/pages/messaging/TemplatesPage.vue'),
        meta: {
          title: 'Messaging Templates',
          requiresAuth: true,
          permissionKeywords: ['message', 'template', 'automation']
        }
      },
      {
        path: 'messaging/rules',
        name: 'MessagingAutomationRules',
        component: () => import('@/pages/messaging/AutomationRulesPage.vue'),
        meta: {
          title: 'Messaging Automation Rules',
          requiresAuth: true,
          permissionKeywords: ['message', 'automation', 'rule']
        }
      },
      {
        path: 'messaging/targets',
        name: 'MessagingTargets',
        component: () => import('@/pages/messaging/TargetsPage.vue'),
        meta: {
          title: 'Messaging Targets',
          requiresAuth: true,
          permissionKeywords: ['message', 'automation', 'target']
        }
      },
      {
        path: 'messaging/conversations',
        name: 'MessagingConversations',
        component: () => import('@/pages/messaging/ConversationsPage.vue'),
        meta: {
          title: 'Messaging Conversations',
          requiresAuth: true,
          permissionKeywords: ['message', 'conversation', 'whatsapp']
        }
      },
      {
        path: 'expenses',
        name: 'Expenses',
        component: () => import('@/views/pages/Expenses.vue'),
        meta: { 
          title: 'Expenses Management',
          requiresAuth: true,
          permissionKeywords: ['expense', 'bill'],
          roles: ['super_admin', 'clinic_super_doctor']
        }
      },
      {
        path: 'warehouse',
        name: 'Warehouse',
        component: () => import('@/views/pages/Warehouse.vue'),
        meta: {
          title: 'Warehouse Management',
          requiresAuth: true,
          permissionKeywords: ['warehouse'],
          roles: ['super_admin', 'clinic_super_doctor']
        }
      },
      {
        path: 'secretaries',
        name: 'Secretaries',
        component: () => import('@/views/pages/Secretaries.vue'),
        meta: { 
          title: 'Secretaries Management',
          requiresAuth: true,
          permissionKeywords: ['secretary', 'user'],
          roles: ['super_admin', 'clinic_super_doctor']
        }
      },
      // AI Assistant route removed – replaced by floating AiChatWidget in DashboardLayout
      // Access Denied page
      {
        path: 'access-denied',
        name: 'AccessDenied',
        component: () => import('@/views/pages/AccessDenied.vue'),
        meta: { 
          title: 'Access Denied',
          alwaysAllow: true
        }
      }
    ]
  },
  
  // Catch all - Redirect to Dashboard (for authenticated) or Login
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

// ==================== Router Instance ====================
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Restore saved position if navigating back
    if (savedPosition) {
      return savedPosition
    }
    // Scroll to top on navigation
    return { top: 0, left: 0 }
  }
})

// Additional scroll handling for Vuetify v-main component
router.afterEach(() => {
  window.scrollTo(0, 0)

  const selectors = ['.v-main', '.v-main__wrap']
  for (const sel of selectors) {
    const el = document.querySelector(sel)
    if (el) el.scrollTop = 0
  }
})

/**
 * Check if user has permission to access route using keywords
 * @param {Object} meta - Route meta
 * @returns {boolean}
 */
function checkRoutePermission(meta) {
  // Always allow routes marked as such
  if (meta.alwaysAllow) return true

  // Check role-based access first
  if (meta.roles && meta.roles.length > 0) {
    if (permissionHelper.hasAnyRole(meta.roles)) {
      return true
    }
  }

  // Check keyword-based permissions
  if (meta.permissionKeywords && meta.permissionKeywords.length > 0) {
    return permissionHelper.hasAnyPermissionFor(meta.permissionKeywords)
  }

  // If no restrictions, allow access
  return true
}

// ==================== Navigation Guards ====================
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Always check localStorage directly — this is the source of truth and works
  // even before Pinia persistence has hydrated the store reactive state
  const tokenInStorage = localStorage.getItem('auth_token')
  const isAuthenticated = !!(tokenInStorage || authStore.isAuthenticated)
  
  console.log('🚦 Router Guard:', {
    to: to.name,
    from: from.name,
    isAuthenticated,
    requiresAuth: to.meta?.requiresAuth,
    isGuest: to.meta?.guest,
    isPublic: to.meta?.public,
    permissionKeywords: to.meta?.permissionKeywords
  })
  
  // Update document title
  document.title = to.meta?.title || to.name || 'Clinic Management'
  
  // Allow public routes without authentication
  if (to.meta?.public) {
    console.log('🌐 Public route, allowing access')
    next()
    return
  }
  
  // Check if route requires authentication
  if (to.meta?.requiresAuth && !isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to Login')
    next({ name: 'Login' })
    return
  }
  
  // Redirect authenticated users away from guest pages
  if (to.meta?.guest && isAuthenticated) {
    console.log('✅ Already authenticated, redirecting to Dashboard')
    next({ name: 'Dashboard' })
    return
  }
  
  // Check route permissions for authenticated users (using dynamic keyword system)
  if (isAuthenticated && to.meta) {
    // Ensure user data is loaded
    if (!authStore.user) {
      console.log('📡 Loading user data...')
      await authStore.loadUser()
    }
    
    // Periodically refresh permissions on navigation (every 2 minutes of activity)
    const lastRefresh = sessionStorage.getItem('last_permission_refresh')
    const now = Date.now()
    const twoMinutes = 2 * 60 * 1000
    
    if (!lastRefresh || (now - parseInt(lastRefresh)) > twoMinutes) {
      console.log('🔄 Refreshing permissions on navigation...')
      await authStore.refreshPermissions()
      sessionStorage.setItem('last_permission_refresh', now.toString())
    }
    
    // Check permissions using keyword-based system
    if (!checkRoutePermission(to.meta)) {
      console.log('🚫 Access denied - insufficient permissions', {
        permissionKeywords: to.meta.permissionKeywords,
        roles: to.meta.roles,
        userPermissions: permissionHelper.getUserPermissions(),
        userRoles: permissionHelper.getUserRoles()
      })
      next({ name: 'AccessDenied' })
      return
    }
  }
  
  // Redirect ophthalmology patients to the dedicated page
  if (to.name === 'PatientDetail') {
    const specialty = authStore.specialty || localStorage.getItem('clinic_specialty')
    if (specialty === 'ophthalmology') {
      next({ name: 'OphthalmologyPatientDetail', params: to.params, query: to.query, replace: true })
      return
    }
  }

  console.log('✅ Navigation allowed')
  next()
})

// Scroll to top on route change
router.afterEach(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

export default router
