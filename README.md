# 🚀 Vue 3 Clinic Management System

## ✅ What's Implemented

### 🔐 **Complete Authentication System**

- JWT Token-based authentication
- User registration with clinic creation
- Login/Logout functionality
- Auto token refresh
- Protected routes

### 👥 **Role-Based Access Control (RBAC)**

- 4 Roles: Super Admin, Clinic Super Doctor, Doctor, Secretary
- Dynamic permissions from API
- Permission-based UI rendering
- Custom directives: `v-permission`, `v-role`

### 🌍 **Multi-Language Support**

- Arabic (RTL) 🇸🇦
- English (LTR) 🇬🇧
- Kurdish (RTL)
- Dynamic language switching
- Persistent language selection

### 🎨 **Beautiful UI**

- Vuetify 3 Material Design
- Animated login/register pages
- Responsive design
- Dark/Light theme support
- Modern glassmorphism effects

---

## 📁 Project Structure

```
vue3-app/
├── src/
│   ├── components/
│   │   └── LanguageSwitcher.vue     # Language dropdown
│   ├── composables/
│   │   ├── useLanguage.js           # Language composable
│   │   └── usePermissions.js        # Permission composable
│   ├── constants/
│   │   └── permissions.js           # Permission constants (reference only)
│   ├── directives/
│   │   ├── permission.js            # v-permission directive
│   │   └── role.js                  # v-role directive
│   ├── layouts/
│   │   └── DashboardLayout.vue      # Main layout
│   ├── locales/
│   │   ├── ar.json                  # Arabic translations
│   │   ├── en.json                  # English translations
│   │   └── ku.json                  # Kurdish translations
│   ├── router/
│   │   └── index.js                 # Vue Router
│   ├── services/
│   │   ├── api.js                   # Axios client
│   │   └── auth.service.js          # Auth service
│   ├── stores/
│   │   ├── auth.js                  # Old auth store
│   │   └── authNew.js               # NEW auth store ✅
│   ├── styles/
│   │   └── main.css                 # Global styles
│   ├── views/
│   │   ├── dashboard/
│   │   │   └── Dashboard.vue        # Dashboard view
│   │   └── pages/
│   │       ├── Login.vue            # Login page ✅
│   │       ├── Register.vue         # Register page ✅
│   │       └── PermissionsExample.vue  # Usage examples
│   ├── App.vue                      # Root component
│   └── main.js                      # Entry point
├── AUTH_IMPLEMENTATION.md           # Complete guide
├── USAGE_EXAMPLES.md               # Usage patterns
├── package.json
├── vite.config.js
└── index.html
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd vue3-app
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Open Browser

```
http://localhost:8081
```

### 4. Test Authentication

#### Register New Account:

1. Go to `/register`
2. Fill in:
   - Doctor Name: `Dr. Ahmed`
   - Phone: `201001234567`
   - Email: `ahmed@example.com` (optional)
   - Clinic Name: `Smart Dental Clinic`
   - Clinic Address: `123 Main Street`
   - Password: `password123`
3. Click **Register**
4. You'll be logged in automatically
5. Check `localStorage.auth_token`

#### Login:

1. Go to `/login`
2. Enter phone and password
3. Click **Login**
4. Redirected to dashboard

---

## 🔑 How to Use Permissions

### Method 1: Using Directive (Recommended)

```vue
<template>
  <!-- Show button only if user has permission -->
  <v-btn v-permission="'create-patient'"> Create Patient </v-btn>

  <!-- Show for specific role -->
  <v-card v-role="'super_admin'"> Admin Only </v-card>

  <!-- Multiple permissions (ANY) -->
  <v-btn v-permission:any="['edit-patient', 'delete-patient']"> Manage </v-btn>

  <!-- Multiple permissions (ALL required) -->
  <v-btn v-permission:all="['edit-patient', 'delete-patient']">
    Full Control
  </v-btn>
</template>
```

### Method 2: Using Composable

```vue
<script setup>
import { usePermissions } from "@/composables/usePermissions";
import { PERMISSIONS } from "@/constants/permissions";

const { hasPermission, isSuperAdmin } = usePermissions();
</script>

<template>
  <v-btn v-if="hasPermission(PERMISSIONS.CREATE_PATIENT)"> Create </v-btn>

  <v-card v-if="isSuperAdmin"> Admin Panel </v-card>
</template>
```

### Method 3: Using Store Directly

```vue
<script setup>
import { useAuthStore } from "@/stores/authNew";

const authStore = useAuthStore();
</script>

<template>
  <v-btn v-if="authStore.hasPermission('create-patient')"> Create </v-btn>
</template>
```

---

## 🛡️ Security

### ⚠️ IMPORTANT: Permissions from API

```javascript
// ❌ WRONG - Never trust frontend constants
const canCreate = true; // Hardcoded

// ✅ CORRECT - Always from API
const user = authStore.user;
const canCreate = user.permissions.includes("create-patient");
```

**Why?**

- Frontend checks are for **UI only**
- Backend **MUST** validate every request
- Users can modify frontend code
- Backend is the **single source of truth**

### Backend Validation (Laravel)

```php
// Always check on backend
if (!auth()->user()->can('create-patient')) {
    abort(403, 'Unauthorized');
}
```

---

## 📊 Available Permissions

### From API Response:

```json
{
  "user": {
    "permissions": [
      "view-clinic-patients",
      "create-patient",
      "edit-patient",
      "delete-patient",
      "view-clinic-cases",
      "create-case"
      // ... more
    ]
  }
}
```

### Categories:

- **Patients:** view, create, edit, delete
- **Cases:** view, create, edit, delete
- **Bills:** view, create, edit, delete, mark-paid
- **Clinics:** view, create, edit, delete
- **Users:** view, create, edit, delete
- **Reservations:** view, create, edit, delete
- **Notes:** view, create, edit, delete
- **Recipes:** view, create, edit, delete
- **System:** manage-permissions, manage-roles

---

## 🎭 Roles

### 1. Super Admin (`super_admin`)

- **Full system access**
- All permissions
- Manage all clinics

### 2. Clinic Super Doctor (`clinic_super_doctor`)

- **Owns clinic**
- All clinic permissions
- Manage clinic users
- View all clinic data

### 3. Doctor (`doctor`)

- **Medical staff**
- View clinic patients
- Only own cases/bills
- Limited management

### 4. Secretary (`secretary`)

- **Front desk**
- Manage patients
- Manage reservations
- View-only for cases/bills

---

## 🌍 Change Language

```javascript
import { useLanguage } from "@/composables/useLanguage";

const { changeLanguage } = useLanguage();

// Switch language
changeLanguage("ar"); // Arabic
changeLanguage("en"); // English
changeLanguage("ku"); // Kurdish
```

Or use the Language Switcher component in the UI.

---

## 🔄 Token Management

### Token Lifecycle:

1. **Created** - On login/register (60 min)
2. **Stored** - `localStorage.auth_token`
3. **Sent** - With every API request
4. **Refreshed** - Auto before expiry
5. **Expired** - Logout + redirect to login

### Manual Refresh:

```javascript
const authStore = useAuthStore();
await authStore.refreshToken();
```

### Auto-Refresh:

Already configured in `auth.service.js`

---

## 📚 Documentation

- **[AUTH_IMPLEMENTATION.md](./AUTH_IMPLEMENTATION.md)** - Complete implementation guide
- **[USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md)** - Usage patterns and examples
- **[PermissionsExample.vue](./src/views/pages/PermissionsExample.vue)** - Live examples

---

## 🐛 Troubleshooting

### Token Not Working?

```javascript
// Check token exists
console.log(localStorage.getItem("auth_token"));

// Check expiry
console.log(localStorage.getItem("token_expires_at"));

// Try refresh
await authStore.refreshToken();
```

### Permissions Not Showing?

```javascript
// Check user permissions
console.log(authStore.userPermissions);

// Verify API response
await authStore.loadUser();
```

### 401 Unauthorized?

- Token expired → Login again
- Invalid token → Clear localStorage
- User deactivated → Contact admin

---

## 📝 API Endpoints

### Authentication:

- `POST /api/auth/register` - Register user + clinic
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/change-password` - Change password

### Base URL:

```
Development: http://localhost:8000/api
Production: https://your-api.com/api
```

Update in `src/services/api.js`:

```javascript
const BASE_URL = "http://localhost:8000/api";
```

---

## 🎨 Customize

### Colors (Vuetify Theme):

Edit `src/main.js`:

```javascript
theme: {
  themes: {
    light: {
      colors: {
        primary: '#17638D',    // Your primary color
        secondary: '#ff0000',  // Your secondary color
        // ...
      }
    }
  }
}
```

### Add New Permission Check:

```javascript
// 1. Import
import { PERMISSIONS } from "@/constants/permissions";

// 2. Use
<v-btn v-permission="PERMISSIONS.CREATE_PATIENT">Create</v-btn>;
```

### Add New Route Guard:

```javascript
// router/index.js
{
  path: '/patients',
  component: PatientsView,
  meta: {
    requiresAuth: true,
    permissions: ['view-clinic-patients']
  }
}
```

---

## ✅ Checklist

Before deploying:

- [ ] Update API base URL in `src/services/api.js`
- [ ] Test registration flow
- [ ] Test login flow
- [ ] Test token refresh
- [ ] Test logout
- [ ] Test permission directives
- [ ] Test role directives
- [ ] Test language switching
- [ ] Test protected routes
- [ ] Verify all permissions work
- [ ] Test on different devices
- [ ] Test RTL/LTR layouts

---

## 🎉 You're Ready!

The system is complete with:

- ✅ JWT Authentication
- ✅ Role-Based Access Control
- ✅ Permission-Based UI
- ✅ Multi-Language Support
- ✅ Beautiful Material Design
- ✅ Complete Documentation

**Happy Coding!** 🚀

---

**Version:** 3.0.0  
**Last Updated:** January 17, 2026  
**Author:** Clinic Management System Team
