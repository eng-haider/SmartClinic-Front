/**
 * Navigation Configuration
 * Dynamic navigation with automatic permission handling
 * 
 * HOW IT WORKS:
 * - Each nav item has a `permissionPrefix` that matches API permissions
 * - The system automatically checks if user has ANY permission starting with that prefix
 * - Example: permissionPrefix: 'patient' matches 'create-patient', 'edit-patient', 'view-clinic-patients', etc.
 * 
 * ADDING NEW PAGES:
 * 1. Add the route in router/index.js
 * 2. Add nav item here with appropriate permissionPrefix
 * 3. That's it! Permissions come from API automatically
 * 
 * @author Clinic Management System
 * @version 3.0.0
 */

/**
 * Main Navigation Items
 * permissionPrefix: matches any permission containing this keyword
 * permissionKeywords: array of keywords - user needs permission matching ANY of them
 * alwaysShow: true = show to all authenticated users
 */
export const NAV_CONFIG = [
  { 
    key: 'dashboard',
    title: { ar: 'الرئيسية', en: 'Dashboard', ku: 'سەرەکی' },
    icon: 'mdi-view-dashboard', 
    to: '/',
    alwaysShow: true, // Dashboard always visible
    order: 1
  },
  { 
    key: 'patients',
    title: { ar: 'المراجعين', en: 'Patients', ku: 'نەخۆشەکان' },
    icon: 'mdi-account-group', 
    to: '/patients',
    permissionKeywords: ['patient'], // matches: create-patient, edit-patient, view-clinic-patients, etc.
    order: 2
  },
  { 
    key: 'doctors',
    title: { ar: 'الأطباء', en: 'Doctors', ku: 'دکتۆرەکان' },
    icon: 'mdi-doctor', 
    to: '/doctors',
    permissionKeywords: ['doctor', 'user'], // matches: view-doctors, create-user, etc.
    roleRequired: ['super_admin', 'clinic_super_doctor'], // OR role-based access
    order: 3
  },
  { 
    key: 'secretaries',
    title: { ar: 'السكرتارية', en: 'Secretaries', ku: 'سکرتێرەکان' },
    icon: 'mdi-account-tie', 
    to: '/secretaries',
    permissionKeywords: ['secretary', 'user'],
    roleRequired: ['super_admin', 'clinic_super_doctor'],
    order: 4
  },
  { 
    key: 'reservations',
    title: { ar: 'المواعيد', en: 'Appointments', ku: 'مەوعیدەکان' },
    icon: 'mdi-calendar-clock', 
    to: '/reservations',
    permissionKeywords: ['reservation'], // matches: create-reservation, view-clinic-reservations, etc.
    order: 5
  },
  { 
    key: 'waiting-list',
    title: { ar: 'قائمة الانتظار', en: 'Waiting List', ku: 'لیستی چاوەڕوانی' },
    icon: 'mdi-clipboard-list', 
    to: '/waiting-list',
    permissionKeywords: ['reservation', 'waiting'],
    order: 6
  },
  { 
    key: 'cases',
    title: { ar: 'الحالات', en: 'Cases', ku: 'کەیسەکان' },
    icon: 'mdi-file-document', 
    to: '/cases',
    permissionKeywords: ['case'], // matches: create-case, view-clinic-cases, etc.
    order: 7
  },
  { 
    key: 'bills',
    title: { ar: 'الفواتير', en: 'Bills', ku: 'پسوڵەکان' },
    icon: 'mdi-receipt', 
    to: '/bills',
    permissionKeywords: ['bill'], // matches: create-bill, view-clinic-bills, etc.
    order: 8
  },
  { 
    key: 'recipes',
    title: { ar: 'الوصفات الطبية', en: 'Prescriptions', ku: 'داواکاریەکان' },
    icon: 'mdi-pill', 
    to: '/recipes',
    permissionKeywords: ['recipe', 'prescription'],
    order: 9
  },
  { 
    key: 'expenses',
    title: { ar: 'المصروفات', en: 'Expenses', ku: 'خەرجییەکان' },
    icon: 'mdi-cash-multiple', 
    to: '/expenses',
    permissionKeywords: ['expense', 'bill'],
    roleRequired: ['super_admin', 'clinic_super_doctor'],
    order: 10
  },
  { 
    key: 'settings',
    title: { ar: 'الإعدادات', en: 'Settings', ku: 'ڕێکخستنەکان' },
    icon: 'mdi-cog', 
    to: '/settings',
    alwaysShow: true, // Settings always visible
    order: 10
  }
]

/**
 * Bottom Navigation Items (Mobile)
 */
export const BOTTOM_NAV_CONFIG = [
  { 
    key: 'dashboard',
    title: { ar: 'الرئيسية', en: 'Home', ku: 'سەرەکی' },
    icon: 'mdi-home', 
    to: '/',
    alwaysShow: true
  },
  { 
    key: 'patients',
    title: { ar: 'المراجعين', en: 'Patients', ku: 'نەخۆشەکان' },
    icon: 'mdi-account-group', 
    to: '/patients',
    permissionKeywords: ['patient']
  },
  { 
    key: 'reservations',
    title: { ar: 'المواعيد', en: 'Appointments', ku: 'مەوعیدەکان' },
    icon: 'mdi-calendar-clock', 
    to: '/reservations',
    permissionKeywords: ['reservation']
  },
  { 
    key: 'settings',
    title: { ar: 'الإعدادات', en: 'Settings', ku: 'ڕێکخستنەکان' },
    icon: 'mdi-cog', 
    to: '/settings',
    alwaysShow: true
  }
]

/**
 * Route Permission Config
 * Maps route names to permission keywords
 * If user has ANY permission containing the keyword, they can access the route
 */
export const ROUTE_CONFIG = {
  // Always accessible
  'Dashboard': { alwaysAllow: true },
  'DashboardAlt': { alwaysAllow: true },
  'Settings': { alwaysAllow: true },
  'AccessDenied': { alwaysAllow: true },
  
  // Dynamic permission check based on keywords
  'Patients': { keywords: ['patient'] },
  'PatientDetail': { keywords: ['patient'] },
  'Doctors': { keywords: ['doctor', 'user'], roles: ['super_admin', 'clinic_super_doctor'] },
  'Secretaries': { keywords: ['secretary', 'user'], roles: ['super_admin', 'clinic_super_doctor'] },
  'Cases': { keywords: ['case'] },
  'CaseDetail': { keywords: ['case'] },
  'Reservations': { keywords: ['reservation'] },
  'WaitingList': { keywords: ['reservation', 'waiting'] },
  'Bills': { keywords: ['bill'] },
  'Expenses': { keywords: ['expense', 'bill'], roles: ['super_admin', 'clinic_super_doctor'] },
  'Analytics': { keywords: ['report', 'analytics'], roles: ['super_admin', 'clinic_super_doctor'] }
}

/**
 * Feature Permission Keywords
 * For showing/hiding UI elements like buttons
 * Maps feature keys to permission keywords
 */
export const FEATURE_CONFIG = {
  // Patient features
  CREATE_PATIENT: ['create-patient'],
  EDIT_PATIENT: ['edit-patient'],
  DELETE_PATIENT: ['delete-patient'],
  SEARCH_PATIENT: ['search-patient', 'patient'],
  
  // Reservation features
  CREATE_RESERVATION: ['create-reservation'],
  EDIT_RESERVATION: ['edit-reservation'],
  DELETE_RESERVATION: ['delete-reservation'],
  
  // Case features
  CREATE_CASE: ['create-case'],
  EDIT_CASE: ['edit-case'],
  DELETE_CASE: ['delete-case'],
  
  // Bill features
  CREATE_BILL: ['create-bill'],
  EDIT_BILL: ['edit-bill'],
  DELETE_BILL: ['delete-bill'],
  MARK_BILL_PAID: ['mark-bill-paid', 'bill'],
  
  // User management
  CREATE_USER: ['create-user'],
  EDIT_USER: ['edit-user'],
  DELETE_USER: ['delete-user']
}
