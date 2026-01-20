# 🔐 Authentication & Authorization Implementation Guide

## Overview

Complete JWT-based authentication system with role-based access control (RBAC) for the Clinic Management System.

---

## 🏗️ Architecture

### Backend (Laravel)

- **JWT Token Authentication** via `tymon/jwt-auth`
- **Roles & Permissions** managed in database
- **API Endpoint:** `http://localhost:8000/api/auth`

### Frontend (Vue 3)

- **Pinia Store** for state management
- **Axios** for API requests
- **Vue Router** guards for protected routes
- **Permission-based UI** rendering

---

## 📁 Project Structure

```
vue3-app/src/
├── services/
│   ├── api.js                 # Axios instance with interceptors
│   └── auth.service.js        # Authentication service (login, register, etc.)
├── stores/
│   └── authNew.js             # Pinia auth store
├── constants/
│   └── permissions.js         # Permission/Role string constants (REFERENCE ONLY)
├── composables/
│   └── useLanguage.js         # Multi-language support
└── views/pages/
    ├── Login.vue              # Login page
    └── Register.vue           # Registration page
```

---

## 🔑 How It Works

### 1. **User Registration**

```javascript
// User fills registration form
const userData = {
  name: "Dr. Ahmed",
  phone: "201001234567",
  email: "ahmed@example.com",
  password: "password123",
  passwordConfirmation: "password123",
  clinicName: "Smart Clinic",
  clinicAddress: "123 Main St",
  clinicPhone: "201001234567",
  clinicEmail: "info@clinic.com",
};

// Call auth store
const result = await authStore.register(userData);

if (result.success) {
  // User is registered and logged in
  // Token saved in localStorage: 'auth_token'
  // User data: authStore.user
  // Clinic data: authStore.clinic
  // Permissions: authStore.user.permissions[]
  // Role: authStore.user.roles[0]
}
```

**API Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "Dr. Ahmed",
      "phone": "201001234567",
      "email": "ahmed@example.com",
      "roles": ["clinic_super_doctor"],
      "permissions": [
        "view-clinic-patients",
        "create-patient",
        "edit-patient",
        "delete-patient",
        "view-clinic-cases",
        "create-case"
        // ... more permissions
      ]
    },
    "clinic": {
      "id": 1,
      "name": "Smart Clinic",
      "address": "123 Main St"
    },
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "bearer",
    "expires_in": 3600
  }
}
```

### 2. **User Login**

```javascript
const result = await authStore.login(phone, password);

if (result.success) {
  // User authenticated
  // Token saved automatically
  // Redirect to dashboard
  router.push("/dashboard");
}
```

### 3. **Permission Checking**

#### ⚠️ **IMPORTANT: Permissions come from API, NOT from JS constants!**

```javascript
// ✅ CORRECT WAY - Check from user object (from API)
const user = authStore.user;
if (user.permissions.includes("create-patient")) {
  // User can create patients
}

// ✅ Using auth service helper
if (authService.hasPermission("create-patient")) {
  // User can create patients
}

// ✅ Using auth store helper
if (authStore.hasPermission("create-patient")) {
  // User can create patients
}

// ✅ Check multiple permissions (any)
if (authStore.hasAnyPermission(["view-clinic-patients", "view-all-patients"])) {
  // User can view patients
}

// ✅ Check multiple permissions (all)
if (authStore.hasAllPermissions(["create-patient", "edit-patient"])) {
  // User can create AND edit patients
}

// ❌ WRONG WAY - Never trust frontend constants for authorization
import { PERMISSIONS } from "@/constants/permissions";
// These are just strings for reference, not actual permissions!
```

### 4. **Role Checking**

```javascript
// Check user role
if (authStore.isSuperAdmin) {
  // User is super admin
}

if (authStore.isClinicSuperDoctor) {
  // User is clinic owner
}

if (authStore.isDoctor) {
  // User is doctor
}

if (authStore.isSecretary) {
  // User is secretary
}

// Or use helper
if (authStore.hasRole("clinic_super_doctor")) {
  // User has this role
}
```

### 5. **Protected Routes**

```javascript
// router/index.js
import { useAuthStore } from '@/stores/authNew'

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // Not authenticated, redirect to login
      next('/login')
      return
    }

    // Check permissions
    if (to.meta.permissions) {
      const hasPermission = authStore.hasAnyPermission(to.meta.permissions)
      if (!hasPermission) {
        // User doesn't have required permission
        next('/unauthorized')
        return
      }
    }
  }

  next()
})

// Define route with permissions
{
  path: '/patients',
  component: PatientsView,
  meta: {
    requiresAuth: true,
    permissions: ['view-clinic-patients', 'view-all-patients']
  }
}
```

### 6. **Conditional UI Rendering**

```vue
<template>
  <!-- Show button only if user has permission -->
  <v-btn v-if="canCreatePatient" @click="createPatient">
    {{ $t("patients.create") }}
  </v-btn>

  <!-- Show based on role -->
  <v-card v-if="authStore.isClinicSuperDoctor">
    <v-card-title>Admin Panel</v-card-title>
  </v-card>

  <!-- Show for multiple permissions -->
  <v-btn v-if="canManagePatients"> Manage Patients </v-btn>
</template>

<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/stores/authNew";
import { PERMISSIONS } from "@/constants/permissions";

const authStore = useAuthStore();

const canCreatePatient = computed(() =>
  authStore.hasPermission(PERMISSIONS.CREATE_PATIENT),
);

const canManagePatients = computed(() =>
  authStore.hasAnyPermission([
    PERMISSIONS.CREATE_PATIENT,
    PERMISSIONS.EDIT_PATIENT,
    PERMISSIONS.DELETE_PATIENT,
  ]),
);
</script>
```

---

## 🛡️ Security Best Practices

### ✅ DO's

1. **Always check permissions on backend**

   ```php
   // Laravel
   if (!auth()->user()->can('create-patient')) {
       abort(403, 'Unauthorized');
   }
   ```

2. **Use permission helpers**

   ```javascript
   if (authStore.hasPermission("create-patient")) {
   }
   ```

3. **Auto-refresh token before expiry**

   ```javascript
   authService.autoRefreshToken();
   ```

4. **Clear all auth data on logout**

   ```javascript
   await authStore.logout();
   ```

5. **Check authentication on app init**
   ```javascript
   // main.js
   authStore.initializeAuth();
   ```

### ❌ DON'Ts

1. **Never trust frontend permissions for authorization**

   - Frontend is for UI only
   - Backend must validate every request

2. **Don't store sensitive data in localStorage**

   - Only store: token, user ID, non-sensitive info
   - Never store: passwords, credit cards, etc.

3. **Don't hardcode permissions in frontend**

   - Use `user.permissions[]` from API

4. **Don't skip token validation**
   - Always send token with requests
   - Handle 401 responses properly

---

## 📊 Available Permissions (From Backend)

These are managed in Laravel database, returned by API:

### Patients

- `view-all-patients` - View all patients (super admin)
- `view-clinic-patients` - View clinic patients
- `create-patient` - Create new patient
- `edit-patient` - Edit patient
- `delete-patient` - Delete patient
- `search-patient` - Search patients

### Cases

- `view-all-cases` - View all cases
- `view-clinic-cases` - View clinic cases
- `view-own-cases` - View only own cases
- `create-case` - Create case
- `edit-case` - Edit case
- `delete-case` - Delete case

### Bills

- `view-all-bills` - View all bills
- `view-clinic-bills` - View clinic bills
- `view-own-bills` - View own bills
- `create-bill` - Create bill
- `edit-bill` - Edit bill
- `delete-bill` - Delete bill
- `mark-bill-paid` - Mark as paid

### Clinics

- `view-all-clinics` - View all clinics
- `view-own-clinic` - View own clinic
- `create-clinic` - Create clinic
- `edit-clinic` - Edit clinic
- `delete-clinic` - Delete clinic

### Users

- `view-all-users` - View all users
- `view-clinic-users` - View clinic users
- `create-user` - Create user
- `edit-user` - Edit user
- `delete-user` - Delete user

### Reservations

- `view-all-reservations` - View all reservations
- `view-clinic-reservations` - View clinic reservations
- `view-own-reservations` - View own reservations
- `create-reservation` - Create reservation
- `edit-reservation` - Edit reservation
- `delete-reservation` - Delete reservation

### Notes

- `view-notes` - View notes
- `create-note` - Create note
- `edit-note` - Edit note
- `delete-note` - Delete note

### Recipes

- `view-all-recipes` - View all recipes
- `view-own-recipes` - View own recipes
- `create-recipe` - Create recipe
- `edit-recipe` - Edit recipe
- `delete-recipe` - Delete recipe
- `view-recipe-items` - View recipe items
- `create-recipe-item` - Create recipe item
- `edit-recipe-item` - Edit recipe item
- `delete-recipe-item` - Delete recipe item

### System

- `manage-permissions` - Manage permissions
- `manage-roles` - Manage roles

---

## 🎭 Roles & Their Permissions

### Super Admin (`super_admin`)

- Full access to everything
- All permissions above

### Clinic Super Doctor (`clinic_super_doctor`)

- Manages their own clinic
- All clinic-level permissions
- Can see all clinic patients/cases/bills
- Can manage clinic users

### Doctor (`doctor`)

- Can view clinic patients
- Can only see/edit their own cases and bills
- Limited access

### Secretary (`secretary`)

- Can manage patients and reservations
- View-only access to cases/bills
- Cannot delete data

---

## 🔄 Token Management

### Token Lifecycle

1. **Token Created** - On login/register (60 minutes)
2. **Token Stored** - In `localStorage.auth_token`
3. **Token Sent** - With every API request (Authorization header)
4. **Token Refreshed** - Before expiry (auto or manual)
5. **Token Expired** - User logged out, redirect to login

### Auto-Refresh Strategy

```javascript
// Check every minute
setInterval(() => {
  authService.autoRefreshToken();
}, 60000);

// Or manually
const result = await authStore.refreshToken();
```

---

## 🌍 Multi-Language Support

System supports:

- 🇸🇦 Arabic (RTL)
- 🇬🇧 English (LTR)
- Kurdish (RTL)

Language stored in: `localStorage.locale`

```javascript
import { useLanguage } from "@/composables/useLanguage";

const { locale, changeLanguage } = useLanguage();

changeLanguage("ar"); // Switch to Arabic
changeLanguage("en"); // Switch to English
changeLanguage("ku"); // Switch to Kurdish
```

---

## 🚀 Quick Start

### 1. Initialize Auth Store

```javascript
// main.js
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { useAuthStore } from "./stores/authNew";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

// Initialize auth state
const authStore = useAuthStore();
authStore.initializeAuth();

app.mount("#app");
```

### 2. Use in Components

```vue
<script setup>
import { useAuthStore } from "@/stores/authNew";
import { PERMISSIONS } from "@/constants/permissions";

const authStore = useAuthStore();

// Check permission
const canEdit = authStore.hasPermission(PERMISSIONS.EDIT_PATIENT);

// Check role
const isAdmin = authStore.isSuperAdmin;

// Get user info
const userName = authStore.user?.name;
const userRole = authStore.userRole;
</script>
```

---

## 📝 Testing

### Manual Testing

1. **Register new user**

   - Go to `/register`
   - Fill form
   - Check token in localStorage
   - Check user data in store

2. **Login**

   - Go to `/login`
   - Enter credentials
   - Check redirect to dashboard
   - Verify permissions in store

3. **Test permissions**

   - Try accessing protected routes
   - Check UI elements visibility
   - Test API calls

4. **Test token refresh**

   - Wait until token near expiry
   - Check auto-refresh
   - Verify new token saved

5. **Test logout**
   - Click logout
   - Verify token cleared
   - Check redirect to login

---

## 🐛 Troubleshooting

### Token not working?

- Check if token exists: `localStorage.getItem('auth_token')`
- Check expiry: `localStorage.getItem('token_expires_at')`
- Try manual refresh: `authStore.refreshToken()`

### Permissions not showing?

- Check `authStore.userPermissions`
- Verify API response includes permissions
- Check backend user has correct role

### 401 Unauthorized?

- Token expired - try refresh
- Token invalid - login again
- User deactivated - contact admin

---

## 📚 Further Reading

- [JWT Authentication Docs](https://jwt.io)
- [Pinia Store Docs](https://pinia.vuejs.org)
- [Vue Router Guards](https://router.vuejs.org/guide/advanced/navigation-guards.html)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)

---

**Last Updated:** January 17, 2026  
**Version:** 3.0.0
