# ✅ Authentication System - Implementation Summary

## 📦 What Was Created

### 1. **Services**

- ✅ `src/services/auth.service.js` - Complete authentication service
  - Register, Login, Logout
  - Token management (refresh, auto-refresh)
  - Permission checking helpers
- ✅ `src/services/api.js` - Enhanced Axios client
  - Auto-adds JWT token to requests
  - Handles 401 errors
  - Language header support

### 2. **Stores (Pinia)**

- ✅ `src/stores/authNew.js` - Authentication state management
  - User, clinic, token state
  - Permission/role checking
  - Actions: login, register, logout, etc.

### 3. **Constants**

- ✅ `src/constants/permissions.js` - Permission & role constants
  - **⚠️ IMPORTANT:** Only for string reference
  - **Real permissions come from API**
  - Role names and descriptions (multilingual)

### 4. **Directives**

- ✅ `src/directives/permission.js` - v-permission directive

  ```vue
  <v-btn v-permission="'create-patient'">Create</v-btn>
  <div v-permission:any="['edit', 'delete']">...</div>
  <div v-permission:all="['edit', 'delete']">...</div>
  ```

- ✅ `src/directives/role.js` - v-role directive
  ```vue
  <v-btn v-role="'super_admin'">Admin Only</v-btn>
  <div v-role="['admin', 'doctor']">...</div>
  ```

### 5. **Composables**

- ✅ `src/composables/usePermissions.js` - Permission composable

  ```javascript
  const { hasPermission, isSuperAdmin } = usePermissions();
  ```

- ✅ `src/composables/useLanguage.js` - Language composable
  ```javascript
  const { locale, changeLanguage } = useLanguage();
  ```

### 6. **Views**

- ✅ `src/views/pages/Login.vue` - Login page (updated)
- ✅ `src/views/pages/Register.vue` - Registration page (updated)
- ✅ `src/views/pages/PermissionsExample.vue` - Usage examples

### 7. **Translations**

- ✅ `src/locales/ar.json` - Arabic (updated)
- ✅ `src/locales/en.json` - English (updated)
- ✅ `src/locales/ku.json` - Kurdish (updated)

### 8. **Documentation**

- ✅ `AUTH_IMPLEMENTATION.md` - Complete implementation guide
- ✅ `USAGE_EXAMPLES.md` - This file

---

## 🚀 Quick Start

### 1. Login

```javascript
import { useAuthStore } from "@/stores/authNew";

const authStore = useAuthStore();

const result = await authStore.login("201001234567", "password123");

if (result.success) {
  // User logged in
  // Token saved in localStorage
  // Permissions: authStore.userPermissions
  router.push("/dashboard");
}
```

### 2. Check Permission in Component

```vue
<script setup>
import { usePermissions } from "@/composables/usePermissions";
import { PERMISSIONS } from "@/constants/permissions";

const { hasPermission, isSuperAdmin } = usePermissions();

const canCreate = hasPermission(PERMISSIONS.CREATE_PATIENT);
</script>

<template>
  <v-btn v-if="canCreate">Create Patient</v-btn>
  <v-card v-if="isSuperAdmin">Admin Panel</v-card>
</template>
```

### 3. Use Directives

```vue
<template>
  <!-- Show only if user has permission -->
  <v-btn v-permission="'create-patient'"> Create Patient </v-btn>

  <!-- Show only for specific role -->
  <v-card v-role="'super_admin'"> Admin Only Content </v-card>

  <!-- Multiple permissions (ANY) -->
  <v-btn v-permission:any="['edit-patient', 'delete-patient']"> Manage </v-btn>

  <!-- Multiple permissions (ALL required) -->
  <v-btn v-permission:all="['edit-patient', 'delete-patient']">
    Full Control
  </v-btn>
</template>
```

### 4. Protected Routes

```javascript
// router/index.js
{
  path: '/patients',
  component: PatientsView,
  meta: {
    requiresAuth: true,
    permissions: ['view-clinic-patients', 'view-all-patients']
  }
}

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.permissions) {
    const hasPermission = authStore.hasAnyPermission(to.meta.permissions)
    if (!hasPermission) {
      next('/unauthorized')
    } else {
      next()
    }
  } else {
    next()
  }
})
```

---

## 🎯 Usage Patterns

### Pattern 1: Computed Permission

```vue
<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/stores/authNew";

const authStore = useAuthStore();

const canCreatePatient = computed(() =>
  authStore.hasPermission("create-patient"),
);
</script>

<template>
  <v-btn v-if="canCreatePatient">Create</v-btn>
</template>
```

### Pattern 2: Direct Permission Check

```vue
<script setup>
import { usePermissions } from "@/composables/usePermissions";

const { hasPermission } = usePermissions();
</script>

<template>
  <v-btn v-if="hasPermission('create-patient')"> Create </v-btn>
</template>
```

### Pattern 3: Using Directive (Cleanest)

```vue
<template>
  <v-btn v-permission="'create-patient'"> Create </v-btn>
</template>
```

### Pattern 4: Multiple Conditions

```vue
<script setup>
import { usePermissions } from "@/composables/usePermissions";

const { hasAnyPermission, hasAllPermissions } = usePermissions();

const canManage = hasAnyPermission(["edit-patient", "delete-patient"]);
const canFullControl = hasAllPermissions(["edit-patient", "delete-patient"]);
</script>

<template>
  <v-btn v-if="canManage">Manage</v-btn>
  <v-btn v-if="canFullControl">Full Control</v-btn>
</template>
```

---

## ⚠️ Important Notes

### 1. **Permissions Come from API**

```javascript
// ❌ WRONG - Never do this
const permissions = ["create-patient", "edit-patient"];

// ✅ CORRECT - Always from API
const user = authStore.user;
const permissions = user.permissions; // From API response
```

### 2. **Backend is Source of Truth**

- Frontend checks are for **UI only**
- Backend **MUST** validate every request
- Never trust frontend permission checks for security

### 3. **Check on Both Sides**

**Frontend (UI):**

```vue
<v-btn v-permission="'create-patient'">Create</v-btn>
```

**Backend (Security):**

```php
if (!auth()->user()->can('create-patient')) {
    abort(403);
}
```

### 4. **Token Management**

- Token stored in: `localStorage.auth_token`
- Token expires in: 60 minutes
- Auto-refresh: Enabled
- On 401 error: Redirect to login

---

## 🔒 Security Checklist

- ✅ Permissions come from API response
- ✅ Token validated on every request
- ✅ 401 errors handled (logout + redirect)
- ✅ Token auto-refresh before expiry
- ✅ All auth data cleared on logout
- ✅ Protected routes have guards
- ✅ Backend validates all requests
- ✅ Sensitive data not in localStorage

---

## 📊 Permission List (From Backend)

**Patients:**

- `view-all-patients`, `view-clinic-patients`
- `create-patient`, `edit-patient`, `delete-patient`

**Cases:**

- `view-all-cases`, `view-clinic-cases`, `view-own-cases`
- `create-case`, `edit-case`, `delete-case`

**Bills:**

- `view-all-bills`, `view-clinic-bills`, `view-own-bills`
- `create-bill`, `edit-bill`, `delete-bill`, `mark-bill-paid`

**Clinics:**

- `view-all-clinics`, `view-own-clinic`
- `create-clinic`, `edit-clinic`, `delete-clinic`

**Users:**

- `view-all-users`, `view-clinic-users`
- `create-user`, `edit-user`, `delete-user`

**Reservations:**

- `view-all-reservations`, `view-clinic-reservations`, `view-own-reservations`
- `create-reservation`, `edit-reservation`, `delete-reservation`

**Notes:**

- `view-notes`, `create-note`, `edit-note`, `delete-note`

**Recipes:**

- `view-all-recipes`, `view-own-recipes`
- `create-recipe`, `edit-recipe`, `delete-recipe`

**System:**

- `manage-permissions`, `manage-roles`

---

## 🎭 Roles

### Super Admin (`super_admin`)

- Full system access
- All permissions

### Clinic Super Doctor (`clinic_super_doctor`)

- Owns and manages clinic
- All clinic-level permissions
- Can manage clinic users

### Doctor (`doctor`)

- Can view clinic patients
- Only own cases and bills
- Limited access

### Secretary (`secretary`)

- Manages patients and reservations
- View-only for cases/bills
- No delete permissions

---

## 📝 Testing

```bash
# Start dev server
cd vue3-app
npm run dev

# Open browser
http://localhost:8081

# Test flow:
1. Go to /register
2. Create account
3. Check localStorage for 'auth_token'
4. Check authStore.user.permissions
5. Try v-permission directives
6. Try v-role directives
7. Logout and check token cleared
```

---

## 🎉 You're Ready!

The authentication system is complete with:

- ✅ JWT Token Authentication
- ✅ Role-Based Access Control (RBAC)
- ✅ Permission-Based UI
- ✅ Multi-language Support (Arabic, English, Kurdish)
- ✅ Auto Token Refresh
- ✅ Protected Routes
- ✅ Custom Directives (v-permission, v-role)
- ✅ Composables (usePermissions, useLanguage)
- ✅ Complete Documentation

**Start building your features now!** 🚀
