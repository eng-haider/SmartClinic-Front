/**
 * Permission & Role Constants
 * These are ONLY constant strings for reference in code
 * ACTUAL permissions come from API (user.permissions array)
 * 
 * ⚠️ SECURITY NOTE:
 * - Never trust these constants for authorization decisions
 * - Always check user.permissions from API response
 * - Backend is the single source of truth
 * 
 * @author Clinic Management System
 * @version 3.0.0
 */

// ========================================
// PERMISSION STRING CONSTANTS (For Reference Only)
// ========================================
// These are just strings to avoid typos in code
// Real permissions come from API: user.permissions[]

export const PERMISSIONS = {
  // Patients
  VIEW_ALL_PATIENTS: 'view-all-patients',
  VIEW_CLINIC_PATIENTS: 'view-clinic-patients',
  CREATE_PATIENT: 'create-patient',
  EDIT_PATIENT: 'edit-patient',
  DELETE_PATIENT: 'delete-patient',
  SEARCH_PATIENT: 'search-patient',

  // Cases
  VIEW_ALL_CASES: 'view-all-cases',
  VIEW_CLINIC_CASES: 'view-clinic-cases',
  VIEW_OWN_CASES: 'view-own-cases',
  CREATE_CASE: 'create-case',
  EDIT_CASE: 'edit-case',
  DELETE_CASE: 'delete-case',

  // Bills
  VIEW_ALL_BILLS: 'view-all-bills',
  VIEW_CLINIC_BILLS: 'view-clinic-bills',
  VIEW_OWN_BILLS: 'view-own-bills',
  CREATE_BILL: 'create-bill',
  EDIT_BILL: 'edit-bill',
  DELETE_BILL: 'delete-bill',
  MARK_BILL_PAID: 'mark-bill-paid',

  // Clinics
  VIEW_ALL_CLINICS: 'view-all-clinics',
  VIEW_OWN_CLINIC: 'view-own-clinic',
  CREATE_CLINIC: 'create-clinic',
  EDIT_CLINIC: 'edit-clinic',
  DELETE_CLINIC: 'delete-clinic',

  // Users
  VIEW_ALL_USERS: 'view-all-users',
  VIEW_CLINIC_USERS: 'view-clinic-users',
  CREATE_USER: 'create-user',
  EDIT_USER: 'edit-user',
  DELETE_USER: 'delete-user',

  // Reservations
  VIEW_ALL_RESERVATIONS: 'view-all-reservations',
  VIEW_CLINIC_RESERVATIONS: 'view-clinic-reservations',
  VIEW_OWN_RESERVATIONS: 'view-own-reservations',
  CREATE_RESERVATION: 'create-reservation',
  EDIT_RESERVATION: 'edit-reservation',
  DELETE_RESERVATION: 'delete-reservation',

  // Notes
  VIEW_NOTES: 'view-notes',
  CREATE_NOTE: 'create-note',
  EDIT_NOTE: 'edit-note',
  DELETE_NOTE: 'delete-note',

  // Recipes
  VIEW_ALL_RECIPES: 'view-all-recipes',
  VIEW_OWN_RECIPES: 'view-own-recipes',
  CREATE_RECIPE: 'create-recipe',
  EDIT_RECIPE: 'edit-recipe',
  DELETE_RECIPE: 'delete-recipe',

  // Recipe Items
  VIEW_RECIPE_ITEMS: 'view-recipe-items',
  CREATE_RECIPE_ITEM: 'create-recipe-item',
  EDIT_RECIPE_ITEM: 'edit-recipe-item',
  DELETE_RECIPE_ITEM: 'delete-recipe-item',

  // Clinic Settings
  VIEW_CLINIC_SETTINGS: 'view-clinic-settings',
  EDIT_CLINIC_SETTINGS: 'edit-clinic-settings',

  // System
  MANAGE_PERMISSIONS: 'manage-permissions',
  MANAGE_ROLES: 'manage-roles'
}

// ========================================
// ROLE STRING CONSTANTS
// ========================================

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  CLINIC_SUPER_DOCTOR: 'clinic_super_doctor',
  DOCTOR: 'doctor',
  SECRETARY: 'secretary'
}

// Role Display Names (for UI only)
export const ROLE_NAMES = {
  [ROLES.SUPER_ADMIN]: {
    ar: 'مدير النظام',
    en: 'Super Admin',
    ku: 'بەڕێوەبەری سیستەم'
  },
  [ROLES.CLINIC_SUPER_DOCTOR]: {
    ar: 'طبيب رئيسي للعيادة',
    en: 'Clinic Super Doctor',
    ku: 'دکتۆری سەرەکی کلینیک'
  },
  [ROLES.DOCTOR]: {
    ar: 'طبيب',
    en: 'Doctor',
    ku: 'دکتۆر'
  },
  [ROLES.SECRETARY]: {
    ar: 'سكرتير',
    en: 'Secretary',
    ku: 'سکرتێر'
  }
}

// Role Descriptions (for UI only)
export const ROLE_DESCRIPTIONS = {
  [ROLES.SUPER_ADMIN]: {
    ar: 'وصول كامل لجميع العيادات والمراجعين والحالات والفواتير',
    en: 'Full access to all clinics, patients, cases, and bills',
    ku: 'دەستپێگەیشتنی تەواو بۆ هەموو کلینیکەکان، نەخۆشەکان، کەیسەکان و پسوڵەکان'
  },
  [ROLES.CLINIC_SUPER_DOCTOR]: {
    ar: 'إدارة العيادة - يمكنه رؤية جميع المراجعين والحالات والفواتير الخاصة بعيادته',
    en: 'Manages their clinic - can see all patients, cases, and bills for their clinic',
    ku: 'بەڕێوەبردنی کلینیک - دەتوانێت هەموو نەخۆشەکان، کەیسەکان و پسوڵەکانی کلینیکەکەی ببینێت'
  },
  [ROLES.DOCTOR]: {
    ar: 'يمكنه رؤية مراجعين العيادة ولكن فقط حالاته وفواتيره الخاصة',
    en: 'Can see clinic patients but only their own cases and bills',
    ku: 'دەتوانێت نەخۆشەکانی کلینیک ببینێت بەڵام تەنها کەیسەکان و پسوڵەکانی خۆی'
  },
  [ROLES.SECRETARY]: {
    ar: 'يمكنه إدارة المراجعين والحجوزات، ورؤية المعلومات الأساسية',
    en: 'Can manage patients and reservations, view basic information',
    ku: 'دەتوانێت نەخۆشەکان و نۆرەکان بەڕێوە ببات، زانیاری بنەڕەتی ببینێت'
  }
}

// ========================================
// ROUTE PERMISSIONS MAPPING
// Maps routes to required permissions
// ========================================
export const ROUTE_PERMISSIONS = {
  // Dashboard - accessible to all authenticated users
  'Dashboard': [],
  'DashboardAlt': [],
  
  // Patients
  'Patients': [PERMISSIONS.VIEW_CLINIC_PATIENTS, PERMISSIONS.VIEW_ALL_PATIENTS],
  'PatientDetail': [PERMISSIONS.VIEW_CLINIC_PATIENTS, PERMISSIONS.VIEW_ALL_PATIENTS],
  
  // Doctors - typically admin/super doctor only
  'Doctors': [PERMISSIONS.VIEW_ALL_USERS, PERMISSIONS.VIEW_CLINIC_USERS],
  
  // Secretaries - typically admin/super doctor only
  'Secretaries': [PERMISSIONS.VIEW_ALL_USERS, PERMISSIONS.VIEW_CLINIC_USERS],
  
  // Cases
  'Cases': [PERMISSIONS.VIEW_CLINIC_CASES, PERMISSIONS.VIEW_ALL_CASES, PERMISSIONS.VIEW_OWN_CASES],
  'CaseDetail': [PERMISSIONS.VIEW_CLINIC_CASES, PERMISSIONS.VIEW_ALL_CASES, PERMISSIONS.VIEW_OWN_CASES],
  
  // Reservations
  'Reservations': [PERMISSIONS.VIEW_CLINIC_RESERVATIONS, PERMISSIONS.VIEW_ALL_RESERVATIONS, PERMISSIONS.VIEW_OWN_RESERVATIONS, PERMISSIONS.CREATE_RESERVATION],
  'WaitingList': [PERMISSIONS.VIEW_CLINIC_RESERVATIONS, PERMISSIONS.VIEW_ALL_RESERVATIONS, PERMISSIONS.VIEW_OWN_RESERVATIONS],
  
  // Bills
  'Bills': [PERMISSIONS.VIEW_CLINIC_BILLS, PERMISSIONS.VIEW_ALL_BILLS, PERMISSIONS.VIEW_OWN_BILLS],
  
  // Expenses - typically admin/super doctor only
  'Expenses': [PERMISSIONS.VIEW_ALL_BILLS, PERMISSIONS.VIEW_CLINIC_BILLS],
  
  // Settings
  'Settings': [],
  
  // Analytics
  'Analytics': [PERMISSIONS.VIEW_ALL_PATIENTS, PERMISSIONS.VIEW_ALL_BILLS]
}

// ========================================
// NAVIGATION ITEMS CONFIGURATION
// Centralized nav config with permissions
// ========================================
export const NAV_ITEMS = [
  { 
    key: 'dashboard',
    title: { ar: 'الرئيسية', en: 'Dashboard', ku: 'سەرەکی' },
    icon: 'mdi-view-dashboard', 
    to: '/',
    permissions: [], // Accessible to all
    order: 1
  },
  { 
    key: 'patients',
    title: { ar: 'المراجعين', en: 'Patients', ku: 'نەخۆشەکان' },
    icon: 'mdi-account-group', 
    to: '/patients',
    permissions: [PERMISSIONS.VIEW_CLINIC_PATIENTS, PERMISSIONS.VIEW_ALL_PATIENTS, PERMISSIONS.CREATE_PATIENT, PERMISSIONS.SEARCH_PATIENT],
    order: 2
  },
  { 
    key: 'doctors',
    title: { ar: 'الأطباء', en: 'Doctors', ku: 'دکتۆرەکان' },
    icon: 'mdi-doctor', 
    to: '/doctors',
    permissions: [PERMISSIONS.VIEW_ALL_USERS, PERMISSIONS.VIEW_CLINIC_USERS],
    roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_SUPER_DOCTOR],
    order: 3
  },
  { 
    key: 'secretaries',
    title: { ar: 'السكرتارية', en: 'Secretaries', ku: 'سکرتێرەکان' },
    icon: 'mdi-account-tie', 
    to: '/secretaries',
    permissions: [PERMISSIONS.VIEW_ALL_USERS, PERMISSIONS.VIEW_CLINIC_USERS],
    roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_SUPER_DOCTOR],
    order: 4
  },
  { 
    key: 'reservations',
    title: { ar: 'المواعيد', en: 'Appointments', ku: 'مەوعیدەکان' },
    icon: 'mdi-calendar-clock', 
    to: '/reservations',
    permissions: [PERMISSIONS.VIEW_CLINIC_RESERVATIONS, PERMISSIONS.VIEW_ALL_RESERVATIONS, PERMISSIONS.VIEW_OWN_RESERVATIONS, PERMISSIONS.CREATE_RESERVATION],
    order: 5
  },
  { 
    key: 'waiting-list',
    title: { ar: 'قائمة الانتظار', en: 'Waiting List', ku: 'لیستی چاوەڕوانی' },
    icon: 'mdi-clipboard-list', 
    to: '/waiting-list',
    permissions: [PERMISSIONS.VIEW_CLINIC_RESERVATIONS, PERMISSIONS.VIEW_ALL_RESERVATIONS, PERMISSIONS.VIEW_OWN_RESERVATIONS],
    order: 6
  },
  { 
    key: 'cases',
    title: { ar: 'الحالات', en: 'Cases', ku: 'کەیسەکان' },
    icon: 'mdi-file-document', 
    to: '/cases',
    permissions: [PERMISSIONS.VIEW_CLINIC_CASES, PERMISSIONS.VIEW_ALL_CASES, PERMISSIONS.VIEW_OWN_CASES, PERMISSIONS.CREATE_CASE],
    order: 7
  },
  { 
    key: 'bills',
    title: { ar: 'الفواتير', en: 'Bills', ku: 'پسوڵەکان' },
    icon: 'mdi-receipt', 
    to: '/bills',
    permissions: [PERMISSIONS.VIEW_CLINIC_BILLS, PERMISSIONS.VIEW_ALL_BILLS, PERMISSIONS.VIEW_OWN_BILLS, PERMISSIONS.CREATE_BILL],
    order: 8
  },
  { 
    key: 'expenses',
    title: { ar: 'المصروفات', en: 'Expenses', ku: 'خەرجییەکان' },
    icon: 'mdi-cash-multiple', 
    to: '/expenses',
    permissions: [PERMISSIONS.VIEW_ALL_BILLS, PERMISSIONS.VIEW_CLINIC_BILLS],
    roles: [ROLES.SUPER_ADMIN, ROLES.CLINIC_SUPER_DOCTOR],
    order: 9
  },
  { 
    key: 'settings',
    title: { ar: 'الإعدادات', en: 'Settings', ku: 'ڕێکخستنەکان' },
    icon: 'mdi-cog', 
    to: '/settings',
    permissions: [], // Accessible to all
    order: 10
  }
]

// ========================================
// BOTTOM NAV ITEMS (Mobile)
// ========================================
export const BOTTOM_NAV_ITEMS = [
  { 
    key: 'dashboard',
    title: { ar: 'الرئيسية', en: 'Home', ku: 'سەرەکی' },
    icon: 'mdi-home', 
    to: '/',
    permissions: []
  },
  { 
    key: 'patients',
    title: { ar: 'المراجعين', en: 'Patients', ku: 'نەخۆشەکان' },
    icon: 'mdi-account-group', 
    to: '/patients',
    permissions: [PERMISSIONS.VIEW_CLINIC_PATIENTS, PERMISSIONS.VIEW_ALL_PATIENTS, PERMISSIONS.CREATE_PATIENT, PERMISSIONS.SEARCH_PATIENT]
  },
  { 
    key: 'reservations',
    title: { ar: 'المواعيد', en: 'Appointments', ku: 'مەوعیدەکان' },
    icon: 'mdi-calendar-clock', 
    to: '/reservations',
    permissions: [PERMISSIONS.VIEW_CLINIC_RESERVATIONS, PERMISSIONS.VIEW_ALL_RESERVATIONS, PERMISSIONS.CREATE_RESERVATION]
  },
  { 
    key: 'settings',
    title: { ar: 'الإعدادات', en: 'Settings', ku: 'ڕێکخستنەکان' },
    icon: 'mdi-cog', 
    to: '/settings',
    permissions: []
  }
]

// ========================================
// FEATURE PERMISSIONS
// For hiding/showing UI features
// ========================================
export const FEATURE_PERMISSIONS = {
  // Patient features
  CREATE_PATIENT_BTN: [PERMISSIONS.CREATE_PATIENT],
  EDIT_PATIENT_BTN: [PERMISSIONS.EDIT_PATIENT],
  DELETE_PATIENT_BTN: [PERMISSIONS.DELETE_PATIENT],
  SEARCH_PATIENT_BTN: [PERMISSIONS.SEARCH_PATIENT],
  
  // Reservation features
  CREATE_RESERVATION_BTN: [PERMISSIONS.CREATE_RESERVATION],
  EDIT_RESERVATION_BTN: [PERMISSIONS.EDIT_RESERVATION],
  DELETE_RESERVATION_BTN: [PERMISSIONS.DELETE_RESERVATION],
  
  // Case features
  CREATE_CASE_BTN: [PERMISSIONS.CREATE_CASE],
  EDIT_CASE_BTN: [PERMISSIONS.EDIT_CASE],
  DELETE_CASE_BTN: [PERMISSIONS.DELETE_CASE],
  
  // Bill features
  CREATE_BILL_BTN: [PERMISSIONS.CREATE_BILL],
  EDIT_BILL_BTN: [PERMISSIONS.EDIT_BILL],
  DELETE_BILL_BTN: [PERMISSIONS.DELETE_BILL],
  MARK_BILL_PAID_BTN: [PERMISSIONS.MARK_BILL_PAID],
  
  // User management
  CREATE_USER_BTN: [PERMISSIONS.CREATE_USER],
  EDIT_USER_BTN: [PERMISSIONS.EDIT_USER],
  DELETE_USER_BTN: [PERMISSIONS.DELETE_USER]
}

