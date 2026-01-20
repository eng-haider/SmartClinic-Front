/**
 * Vue Router - Vue 3
 * إعدادات الراوتر
 * 
 * @author Clinic Management System
 * @version 3.0.0
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authNew'

// ==================== Route Components ====================
const routes = [
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
        component: () => import('@/views/dashboard/Dashboard.vue')
      },
      {
        path: 'dashboard',
        name: 'DashboardAlt',
        component: () => import('@/views/dashboard/Dashboard.vue')
      },
      {
        path: 'patients',
        name: 'Patients',
        component: () => import('@/views/pages/Patients.vue'),
        meta: { title: 'Patients Management' }
      },
      {
        path: 'patients/:id',
        name: 'PatientDetail',
        component: () => import('@/views/patients/PatientDetail.vue'),
        meta: { title: 'Patient Details' }
      },
      {
        path: 'cases',
        name: 'Cases',
        component: () => import('@/views/pages/Cases.vue'),
        meta: { title: 'Cases Management' }
      },
      {
        path: 'cases/:id',
        name: 'CaseDetail',
        component: () => import('@/views/cases/CaseDetail.vue'),
        meta: { title: 'Case Details' }
      }
    ]
  },
  
  // Catch all - Redirect to login
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

// ==================== Router Instance ====================
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

// ==================== Navigation Guards ====================
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated
  
  console.log('🚦 Router Guard:', {
    to: to.name,
    from: from.name,
    isAuthenticated,
    requiresAuth: to.meta?.requiresAuth,
    isGuest: to.meta?.guest
  })
  
  // Update document title
  document.title = to.meta?.title || to.name || 'Clinic Management'
  
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
  
  console.log('✅ Navigation allowed')
  next()
})

export default router
