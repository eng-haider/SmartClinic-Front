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
    title: { ar: 'الرئيسية', en: 'Dashboard', ku: 'سەرەکی', pl: 'Panel główny' },
    icon: 'mdi-view-dashboard',
    to: '/',
    alwaysShow: true, // Dashboard always visible
    order: 1
  },
  {
    key: 'patients',
    title: { ar: 'المراجعين', en: 'Patients', ku: 'نەخۆشەکان', pl: 'Pacjenci' },
    icon: 'mdi-account-group',
    to: '/patients',
    permissionKeywords: ['patient'], // matches: create-patient, edit-patient, view-clinic-patients, etc.
    order: 2
  },
  {
    key: 'doctors',
    title: { ar: 'الأطباء', en: 'Doctors', ku: 'دکتۆرەکان', pl: 'Lekarze' },
    icon: 'mdi-doctor',
    to: '/doctors',
    permissionKeywords: ['doctor', 'user'], // matches: view-doctors, create-user, etc.
    roleRequired: ['super_admin', 'clinic_super_doctor'], // OR role-based access
    order: 3
  },
  {
    key: 'secretaries',
    title: { ar: 'السكرتارية', en: 'Secretaries', ku: 'سکرتێرەکان', pl: 'Sekretarki' },
    icon: 'mdi-account-tie',
    to: '/secretaries',
    permissionKeywords: ['secretary', 'user'],
    roleRequired: ['super_admin', 'clinic_super_doctor'],
    order: 4
  },
  {
    key: 'reservations',
    title: { ar: 'المواعيد', en: 'Appointments', ku: 'مەوعیدەکان', pl: 'Wizyty' },
    icon: 'mdi-calendar-clock',
    to: '/reservations',
    permissionKeywords: ['reservation'], // matches: create-reservation, view-clinic-reservations, etc.
    order: 3
  },
  {
    key: 'waiting-list',
    title: { ar: 'قائمة الانتظار', en: 'Waiting List', ku: 'لیستی چاوەڕوانی', pl: 'Lista oczekujących' },
    icon: 'mdi-clipboard-list',
    to: '/waiting-list',
    permissionKeywords: ['reservation', 'waiting'],
    order: 6
  },
  {
    key: 'booking-requests',
    title: { ar: 'طلبات الحجز', en: 'Booking Requests', ku: 'داواکاری حجزکردن', pl: 'Prośby o rezerwację' },
    icon: 'mdi-calendar-question',
    to: '/booking-requests',
    permissionKeywords: ['reservation', 'booking'],
    order: 7
  },
  {
    key: 'cases',
    title: { ar: 'الحالات', en: 'Cases', ku: 'کەیسەکان', pl: 'Przypadki' },
    icon: 'mdi-file-document',
    to: '/cases',
    permissionKeywords: ['case'], // matches: create-case, view-clinic-cases, etc.
    order: 2
  },
  {
    key: 'bills',
    title: { ar: 'الفواتير', en: 'Bills', ku: 'پسوڵەکان', pl: 'Rachunki' },
    icon: 'mdi-receipt',
    to: '/bills',
    permissionKeywords: ['bill'], // matches: create-bill, view-clinic-bills, etc.
    order: 4
  },
  {
    key: 'recipes',
    title: { ar: 'الوصفات الطبية', en: 'Prescriptions', ku: 'داواکاریەکان', pl: 'Recepty' },
    icon: 'mdi-pill',
    to: '/recipes',
    permissionKeywords: ['recipe', 'prescription'],
    order: 9
  },
  {
    key: 'medications',
    title: { ar: 'مكتبة الأدوية', en: 'Medication Library', ku: 'كتێبخانەی دەرمان', pl: 'Biblioteka leków' },
    icon: 'mdi-pill-multiple',
    to: '/medications',
    permissionKeywords: ['recipe', 'medication'],
    order: 10
  },
  {
    key: 'expenses',
    title: { ar: 'المصروفات', en: 'Expenses', ku: 'خەرجییەکان', pl: 'Wydatki' },
    icon: 'mdi-cash-multiple',
    to: '/expenses',
    permissionKeywords: ['expense', 'bill'],
    roleRequired: ['super_admin', 'clinic_super_doctor'],
    order: 11
  },
  {
    key: 'warehouse',
    title: { ar: 'المخزن', en: 'Warehouse', ku: 'کۆگا', pl: 'Magazyn' },
    icon: 'mdi-warehouse',
    to: '/warehouse',
    permissionKeywords: ['warehouse'],
    roleRequired: ['super_admin', 'clinic_super_doctor'],
    order: 12
  },
  // {
  //   key: 'messaging',
  //   title: { ar: 'المراسلات', en: 'Messaging', ku: 'نامەنێردن' },
  //   icon: 'mdi-message-text',
  //   permissionKeywords: ['message', 'whatsapp', 'automation'],
  //   order: 12,
  //   children: [
  //     {
  //       key: 'messaging-conversations',
  //       title: { ar: 'المحادثات', en: 'Conversations', ku: 'گفتوگۆکان' },
  //       icon: 'mdi-message-processing',
  //       to: '/messaging/conversations',
  //       permissionKeywords: ['message', 'conversation', 'whatsapp']
  //     },
  //     {
  //       key: 'messaging-templates',
  //       title: { ar: 'القوالب', en: 'Templates', ku: 'قاڵبەکان' },
  //       icon: 'mdi-file-document-outline',
  //       to: '/messaging/templates',
  //       permissionKeywords: ['message', 'template', 'automation']
  //     },
  //     {
  //       key: 'messaging-rules',
  //       title: { ar: 'قواعد الأتمتة', en: 'Automation Rules', ku: 'ڕێسەکانی ئۆتۆماسیۆن' },
  //       icon: 'mdi-robot',
  //       to: '/messaging/rules',
  //       permissionKeywords: ['message', 'automation', 'rule']
  //     },
  //     {
  //       key: 'messaging-targets',
  //       title: { ar: 'الأهداف', en: 'Targets', ku: 'ئامانجەکان' },
  //       icon: 'mdi-bullseye-arrow',
  //       to: '/messaging/targets',
  //       permissionKeywords: ['message', 'automation', 'target']
  //     },
  //     {
  //       key: 'messaging-settings',
  //       title: { ar: 'إعدادات الرسائل', en: 'Messaging Settings', ku: 'ڕێکخستنی نامەنێردن' },
  //       icon: 'mdi-cog-outline',
  //       to: '/messaging/settings',
  //       permissionKeywords: ['message', 'whatsapp', 'automation']
  //     }
  //   ]
  // },
  { 
    key: 'settings',
    title: { ar: 'الإعدادات', en: 'Settings', ku: 'ڕێکخستنەکان', pl: 'Ustawienia' },
    icon: 'mdi-cog',
    to: '/settings',
    alwaysShow: true, // Settings always visible
    order: 13
  }
]

/**
 * Bottom Navigation Items (Mobile)
 */
export const BOTTOM_NAV_CONFIG = [
  {
    key: 'dashboard',
    title: { ar: 'الرئيسية', en: 'Home', ku: 'سەرەکی', pl: 'Strona główna' },
    icon: 'mdi-home',
    to: '/',
    alwaysShow: true
  },
  {
    key: 'patients',
    title: { ar: 'المراجعين', en: 'Patients', ku: 'نەخۆشەکان', pl: 'Pacjenci' },
    icon: 'mdi-account-group',
    to: '/patients',
    permissionKeywords: ['patient']
  },
  {
    key: 'reservations',
    title: { ar: 'المواعيد', en: 'Appointments', ku: 'مەوعیدەکان', pl: 'Wizyty' },
    icon: 'mdi-calendar-clock',
    to: '/reservations',
    permissionKeywords: ['reservation']
  },
  {
    key: 'settings',
    title: { ar: 'الإعدادات', en: 'Settings', ku: 'ڕێکخستنەکان', pl: 'Ustawienia' },
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
  'BookingRequests': { keywords: ['reservation', 'booking'] },
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
