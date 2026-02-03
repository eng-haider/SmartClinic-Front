/**
 * FULLY AUTOMATIC Route Configuration
 * 
 * HOW TO ADD NEW PAGE (ONLY 1 STEP!):
 * 1. Add route config here with permissionKeywords
 * 2. Navigation menu is AUTO-GENERATED from this!
 * 
 * @author Clinic Management System
 * @version 3.0.0
 */

/**
 * Route Configuration
 * Each route automatically appears in navigation if:
 * - showInNav: true
 * - User has required permissions
 */
export const ROUTES_CONFIG = [
  {
    path: '',
    name: 'Dashboard',
    component: 'views/dashboard/Dashboard.vue',
    meta: {
      title: { ar: 'الرئيسية', en: 'Dashboard', ku: 'سەرەکی' },
      icon: 'mdi-view-dashboard',
      alwaysAllow: true,
      showInNav: true,
      showInBottomNav: true,
      order: 1
    }
  },
  {
    path: 'patients',
    name: 'Patients',
    component: 'views/pages/Patients.vue',
    meta: {
      title: { ar: 'المراجعين', en: 'Patients', ku: 'نەخۆشەکان' },
      icon: 'mdi-account-group',
      permissionKeywords: ['patient'],
      showInNav: true,
      showInBottomNav: true,
      order: 2
    }
  },
  {
    path: 'patients/:id',
    name: 'PatientDetail',
    component: 'views/patients/PatientDetail.vue',
    meta: {
      title: { ar: 'تفاصيل المراجع', en: 'Patient Details', ku: 'وردەکارییەکانی نەخۆش' },
      permissionKeywords: ['patient'],
      showInNav: false // Don't show in menu
    }
  },
  {
    path: 'doctors',
    name: 'Doctors',
    component: 'views/pages/Doctors.vue',
    meta: {
      title: { ar: 'الأطباء', en: 'Doctors', ku: 'دکتۆرەکان' },
      icon: 'mdi-doctor',
      permissionKeywords: ['doctor', 'user'],
      roles: ['super_admin', 'clinic_super_doctor'],
      showInNav: true,
      order: 3
    }
  },
  {
    path: 'secretaries',
    name: 'Secretaries',
    component: 'views/pages/Secretaries.vue',
    meta: {
      title: { ar: 'السكرتارية', en: 'Secretaries', ku: 'سکرتێرەکان' },
      icon: 'mdi-account-tie',
      permissionKeywords: ['secretary', 'user'],
      roles: ['super_admin', 'clinic_super_doctor'],
      showInNav: true,
      order: 4
    }
  },
  {
    path: 'reservations',
    name: 'Reservations',
    component: 'views/pages/Reservations.vue',
    meta: {
      title: { ar: 'المواعيد', en: 'Appointments', ku: 'مەوعیدەکان' },
      icon: 'mdi-calendar-clock',
      permissionKeywords: ['reservation'],
      showInNav: true,
      showInBottomNav: true,
      order: 5
    }
  },
  {
    path: 'waiting-list',
    name: 'WaitingList',
    component: 'views/pages/WaitingList.vue',
    meta: {
      title: { ar: 'قائمة الانتظار', en: 'Waiting List', ku: 'لیستی چاوەڕوانی' },
      icon: 'mdi-clipboard-list',
      permissionKeywords: ['reservation', 'waiting'],
      showInNav: true,
      order: 6
    }
  },
  {
    path: 'cases',
    name: 'Cases',
    component: 'views/pages/Cases.vue',
    meta: {
      title: { ar: 'الحالات', en: 'Cases', ku: 'کەیسەکان' },
      icon: 'mdi-file-document',
      permissionKeywords: ['case'],
      showInNav: true,
      order: 7
    }
  },
  {
    path: 'cases/:id',
    name: 'CaseDetail',
    component: 'views/cases/CaseDetail.vue',
    meta: {
      title: { ar: 'تفاصيل الحالة', en: 'Case Details', ku: 'وردەکارییەکانی کەیس' },
      permissionKeywords: ['case'],
      showInNav: false
    }
  },
  {
    path: 'bills',
    name: 'Bills',
    component: 'views/pages/Bills.vue',
    meta: {
      title: { ar: 'الفواتير', en: 'Bills', ku: 'پسوڵەکان' },
      icon: 'mdi-receipt',
      permissionKeywords: ['bill'],
      showInNav: true,
      order: 8
    }
  },
  {
    path: 'expenses',
    name: 'Expenses',
    component: 'views/pages/Expenses.vue',
    meta: {
      title: { ar: 'المصروفات', en: 'Expenses', ku: 'خەرجییەکان' },
      icon: 'mdi-cash-multiple',
      permissionKeywords: ['expense', 'bill'],
      roles: ['super_admin', 'clinic_super_doctor'],
      showInNav: true,
      order: 9
    }
  },
  {
    path: 'analytics',
    name: 'Analytics',
    component: 'views/dashboard/DashboardAnalytics.vue',
    meta: {
      title: { ar: 'التحليلات', en: 'Analytics', ku: 'شیکاری' },
      icon: 'mdi-chart-line',
      permissionKeywords: ['report', 'analytics'],
      roles: ['super_admin', 'clinic_super_doctor'],
      showInNav: true,
      order: 10
    }
  },
  {
    path: 'settings',
    name: 'Settings',
    component: 'views/pages/Settings.vue',
    meta: {
      title: { ar: 'الإعدادات', en: 'Settings', ku: 'ڕێکخستنەکان' },
      icon: 'mdi-cog',
      alwaysAllow: true,
      showInNav: true,
      showInBottomNav: true,
      order: 11
    }
  },
  {
    path: 'access-denied',
    name: 'AccessDenied',
    component: 'views/pages/AccessDenied.vue',
    meta: {
      title: { ar: 'الوصول مرفوض', en: 'Access Denied', ku: 'دەستگەیشتن ڕەتکراوەتەوە' },
      alwaysAllow: true,
      showInNav: false
    }
  }
]

/**
 * Auto-generate navigation items from routes
 * @param {string} lang - Current language
 * @param {Function} canAccess - Permission check function
 * @returns {Array} Filtered navigation items
 */
export function generateNavItems(lang = 'ar', canAccess) {
  return ROUTES_CONFIG
    .filter(route => route.meta.showInNav)
    .filter(route => canAccess(route.meta))
    .sort((a, b) => (a.meta.order || 999) - (b.meta.order || 999))
    .map(route => ({
      key: route.name.toLowerCase(),
      title: route.meta.title[lang] || route.meta.title.ar,
      icon: route.meta.icon,
      to: `/${route.path}`
    }))
}

/**
 * Auto-generate bottom nav items from routes
 */
export function generateBottomNavItems(lang = 'ar', canAccess) {
  return ROUTES_CONFIG
    .filter(route => route.meta.showInBottomNav)
    .filter(route => canAccess(route.meta))
    .sort((a, b) => (a.meta.order || 999) - (b.meta.order || 999))
    .map(route => ({
      key: route.name.toLowerCase(),
      title: route.meta.title[lang] || route.meta.title.ar,
      icon: route.meta.icon,
      to: `/${route.path}`
    }))
}

/**
 * Auto-generate Vue Router routes
 */
export function generateVueRoutes() {
  return ROUTES_CONFIG.map(route => {
    const vueRoute = {
      path: route.path,
      name: route.name,
      component: () => import(`@/${route.component}`),
      meta: route.meta
    }
    
    if (route.children) {
      vueRoute.children = route.children
    }
    
    return vueRoute
  })
}
