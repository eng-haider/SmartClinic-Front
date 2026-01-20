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

