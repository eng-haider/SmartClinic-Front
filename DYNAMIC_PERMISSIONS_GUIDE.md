# Dynamic Permission System Guide

## نظام الصلاحيات الديناميكي - دليل الاستخدام

## Overview

This system automatically handles permissions from the API without needing to manually update permission files every time new permissions are added.

## How It Works

### The Magic: Keyword-Based Matching

Instead of defining every exact permission, we use **keyword matching**:

```javascript
// User has these permissions from API:
[
  "create-patient",
  "edit-patient",
  "view-clinic-patients",
  "create-reservation",
];

// Keyword matching:
hasPermissionFor("patient"); // ✅ true - matches create-patient, edit-patient, view-clinic-patients
hasPermissionFor("reservation"); // ✅ true - matches create-reservation
hasPermissionFor("bill"); // ❌ false - no permission contains 'bill'
```

## Adding New Pages

### Step 1: Add Route in `router/index.js`

```javascript
{
  path: 'new-feature',
  name: 'NewFeature',
  component: () => import('@/views/pages/NewFeature.vue'),
  meta: {
    title: 'New Feature',
    permissionKeywords: ['feature'] // Matches any permission containing 'feature'
  }
}
```

### Step 2: Add Navigation Item in `config/navigation.js`

```javascript
{
  key: 'new-feature',
  title: { ar: 'ميزة جديدة', en: 'New Feature', ku: 'تایبەتمەندی نوێ' },
  icon: 'mdi-star',
  to: '/new-feature',
  permissionKeywords: ['feature'], // Matches any permission containing 'feature'
  order: 11
}
```

### That's It!

When the API returns permissions like `create-feature`, `edit-feature`, `view-feature`, etc., the system automatically shows the page!

## Using Permissions in Components

### In Templates with Directives

```vue
<!-- Exact permission check -->
<v-btn v-permission="'create-patient'">Create Patient</v-btn>

<!-- Keyword-based check (RECOMMENDED) -->
<v-btn v-can="'patient'">Patient Actions</v-btn>

<!-- Multiple keywords (shows if user has ANY) -->
<v-btn v-can="['patient', 'reservation']">Actions</v-btn>

<!-- Role-based check -->
<div v-role="'doctor'">Doctor Only Content</div>
<div v-role="['doctor', 'super_admin']">Doctor or Admin</div>
```

### In Script with Composable

```vue
<script setup>
import { usePermissions } from "@/composables/usePermissions";

const {
  hasPermissionFor, // Keyword matching
  hasPermission, // Exact match
  canFor, // Computed keyword check
  can, // Computed exact check
  hasRole,
  userPermissions,
  filteredNavItems,
} = usePermissions();

// Keyword-based (RECOMMENDED - auto-works with new permissions)
if (hasPermissionFor("patient")) {
  // User has any patient-related permission
}

// Exact permission
if (hasPermission("create-patient")) {
  // User has exactly 'create-patient' permission
}

// Reactive/Computed
const canPatient = canFor("patient"); // Reactive ref
</script>

<template>
  <v-btn v-if="canFor('patient').value">Patient Actions</v-btn>
</template>
```

## Configuration Files

### `config/navigation.js`

Main navigation configuration with keyword-based permissions:

```javascript
export const NAV_CONFIG = [
  {
    key: "patients",
    title: { ar: "المراجعين", en: "Patients", ku: "نەخۆشەکان" },
    icon: "mdi-account-group",
    to: "/patients",
    permissionKeywords: ["patient"], // Shows if user has ANY patient permission
    order: 2,
  },
  {
    key: "doctors",
    title: { ar: "الأطباء", en: "Doctors", ku: "دکتۆرەکان" },
    icon: "mdi-doctor",
    to: "/doctors",
    permissionKeywords: ["doctor", "user"], // Shows if user has doctor OR user permission
    roleRequired: ["super_admin", "clinic_super_doctor"], // OR if user has these roles
    order: 3,
  },
];
```

### `services/permission.helper.js`

Core permission checking logic:

```javascript
// Check if user has ANY permission containing keyword
permissionHelper.hasPermissionFor("patient");

// Check multiple keywords (OR logic)
permissionHelper.hasAnyPermissionFor(["patient", "reservation"]);

// Check if user has specific role
permissionHelper.hasRole("doctor");
permissionHelper.hasAnyRole(["doctor", "super_admin"]);
```

## Features for UI Elements

For buttons and actions, use `FEATURE_CONFIG` in `config/navigation.js`:

```javascript
export const FEATURE_CONFIG = {
  CREATE_PATIENT: ["create-patient"],
  EDIT_PATIENT: ["edit-patient"],
  DELETE_PATIENT: ["delete-patient"],
};
```

Usage:

```vue
<v-btn v-if="canDoFeature('CREATE_PATIENT')">Create</v-btn>
```

## Example: User Response from API

```json
{
  "success": true,
  "data": {
    "id": 11,
    "name": "haider",
    "roles": ["secretary"],
    "permissions": [
      "create-patient",
      "edit-patient",
      "search-patient",
      "create-reservation",
      "edit-reservation",
      "delete-reservation",
      "view-clinic-patients",
      "view-clinic-reservations"
    ]
  }
}
```

This user will see:

- ✅ Dashboard (always visible)
- ✅ Patients (has 'patient' permissions)
- ✅ Reservations (has 'reservation' permissions)
- ✅ Waiting List (has 'reservation' permissions)
- ✅ Settings (always visible)
- ❌ Doctors (no 'doctor' or 'user' permission, not super_admin/clinic_super_doctor)
- ❌ Secretaries (no 'secretary' or 'user' permission, not super_admin/clinic_super_doctor)
- ❌ Cases (no 'case' permission)
- ❌ Bills (no 'bill' permission)
- ❌ Expenses (no 'expense' permission)

## Debug

In development mode, call `debugPermissions()` to see user's permissions:

```javascript
const { debugPermissions } = usePermissions();
debugPermissions();
// Console output:
// 🔐 Permission Helper Debug:
//   Permissions: ['create-patient', 'edit-patient', ...]
//   Roles: ['secretary']
//   By Category: { patient: [...], reservation: [...] }
```

## Summary

1. **No more updating `permissions.js`** when adding new permissions
2. **Use keywords** to match groups of permissions
3. **Add new pages** in just 2 places: router + navigation config
4. **API is the source of truth** - permissions come from backend
