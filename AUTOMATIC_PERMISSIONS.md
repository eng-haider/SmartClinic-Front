# 100% Automatic Permission System - Quick Start

## What's Automatic? EVERYTHING! 🎉

### ✅ Automatic Permission Checking

- API returns permissions → System automatically checks them
- Use keyword matching → No need to define exact permissions
- Add new permission in backend → Frontend automatically works

### ✅ Automatic Navigation Generation

- Add route → Navigation menu automatically appears
- User gets permission → Menu item automatically shows
- No separate navigation config needed!

---

## How to Add a New Page (1 STEP!)

### Edit ONE file: `src/config/routes.config.js`

```javascript
{
  path: 'my-new-feature',
  name: 'MyNewFeature',
  component: 'views/pages/MyNewFeature.vue',
  meta: {
    title: { ar: 'ميزة جديدة', en: 'New Feature', ku: 'تایبەتمەندی نوێ' },
    icon: 'mdi-star',
    permissionKeywords: ['feature'], // Matches any permission with 'feature'
    showInNav: true, // Auto-appears in navigation
    order: 12
  }
}
```

**That's it!** 🎯

- Route is automatically created
- Navigation item automatically appears (if user has permission)
- Permission checking is automatic
- Mobile bottom nav is automatic (if you add `showInBottomNav: true`)

---

## Real Example: Secretary User

### API Response:

```json
{
  "permissions": [
    "create-patient",
    "edit-patient",
    "view-clinic-patients",
    "create-reservation",
    "view-clinic-reservations"
  ]
}
```

### What User Sees (AUTOMATIC):

- ✅ Dashboard (always visible)
- ✅ Patients (has 'patient' keywords)
- ✅ Reservations (has 'reservation' keywords)
- ✅ Settings (always visible)
- ❌ Doctors (no 'doctor' or 'user' permission)
- ❌ Cases (no 'case' permission)
- ❌ Bills (no 'bill' permission)

**All automatic!** No code changes needed.

---

## Backend Adds New Permission

### Backend adds: `approve-prescription`

### Frontend (NO CHANGES NEEDED!):

```javascript
// In routes.config.js - just use keyword
{
  path: 'prescriptions',
  name: 'Prescriptions',
  component: 'views/pages/Prescriptions.vue',
  meta: {
    title: { ar: 'الوصفات', en: 'Prescriptions', ku: 'ڕێچکە' },
    icon: 'mdi-pill',
    permissionKeywords: ['prescription'], // Automatically matches!
    showInNav: true,
    order: 11
  }
}
```

When API returns `approve-prescription`, `create-prescription`, `edit-prescription` - they all automatically work!

---

## Using Permissions in Components

### Template (Use Keyword):

```vue
<!-- Shows if user has ANY permission containing 'patient' -->
<v-btn v-can="'patient'">Patient Actions</v-btn>

<!-- Shows if user has exact permission -->
<v-btn v-permission="'create-patient'">Create Patient</v-btn>

<!-- Shows for specific role -->
<div v-role="'doctor'">Doctor Only Content</div>
```

### Script (Use Keyword):

```vue
<script setup>
import { usePermissions } from "@/composables/usePermissions";

const { hasPermissionFor, filteredNavItems } = usePermissions();

// Check if user has ANY patient permission (automatic!)
if (hasPermissionFor("patient")) {
  // User can access patient features
}

// Navigation items are automatically filtered
console.log(filteredNavItems.value); // Only shows what user can access
</script>
```

---

## Summary: What You Do vs What's Automatic

### You Do (ONCE per new feature):

1. Add route config in `routes.config.js` (5 lines)

### System Does Automatically:

1. ✅ Creates Vue Router route
2. ✅ Adds to navigation menu (if user has permission)
3. ✅ Adds to mobile bottom nav (if configured)
4. ✅ Checks permissions on route access
5. ✅ Shows/hides navigation items based on user permissions
6. ✅ Handles new permissions from API without code changes
7. ✅ Matches permission keywords automatically

---

## Permission Keyword Examples

| Keyword         | Matches These Permissions                                                                             |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| `'patient'`     | create-patient, edit-patient, delete-patient, view-all-patients, view-clinic-patients, search-patient |
| `'reservation'` | create-reservation, edit-reservation, delete-reservation, view-clinic-reservations                    |
| `'bill'`        | create-bill, edit-bill, view-all-bills, mark-bill-paid                                                |
| `'case'`        | create-case, edit-case, view-own-cases                                                                |

**No need to define these!** The system automatically checks if user's permissions contain the keyword.

---

## Debug

See what permissions user has:

```javascript
const { debugPermissions } = usePermissions();
debugPermissions();

// Console shows:
// 🔐 Permission Helper Debug:
//   Permissions: ['create-patient', 'edit-patient', ...]
//   Roles: ['secretary']
//   By Category: { patient: [...], reservation: [...] }
```

---

## The Magic Formula

```
Backend Permission → Keyword Match → Auto Show/Hide
```

**Example:**

- Backend adds: `approve-patient-record`
- Your config uses keyword: `'patient'`
- System automatically detects match
- Feature appears for users with that permission
- **No frontend code change needed!**
