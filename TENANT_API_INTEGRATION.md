# Tenant API Integration - Implementation Summary

## Overview

This document summarizes the changes made to integrate the new tenant-based authentication system into the SmartClinic frontend application.

## Changes Made

### 1. API Client (`src/services/api.js`)

**Updated Request Interceptor:**

- Added `X-Tenant-ID` header to all API requests
- Retrieves `tenant_id` from localStorage
- Automatically attached to every request after login

**Updated Response Interceptor:**

- Added `tenant_id` cleanup on 401 (Unauthorized) errors
- Ensures tenant_id is removed when session expires

```javascript
// Request Interceptor now includes:
const tenantId = localStorage.getItem("tenant_id");
if (tenantId) {
  config.headers["X-Tenant-ID"] = tenantId;
}

// Response Interceptor cleanup includes:
localStorage.removeItem("tenant_id");
```

---

### 2. Authentication Service (`src/services/auth.service.js`)

#### Register Method

**Changed from:** `POST /auth/register`  
**Changed to:** `POST /tenants`

**New Request Payload:**

```javascript
{
  clinic_name: userData.clinicName,
  clinic_name_ar: userData.clinicName,
  domain: userData.clinicName.toLowerCase().replace(/\s+/g, ''),
  password: userData.password,
  password_confirmation: userData.passwordConfirmation,
  phone: userData.phone,
  address: userData.clinicAddress,
  address_ar: userData.clinicAddress,
  user_name: userData.name,
  user_phone: userData.phone
}
```

**Response Handling:**

- Extracts `tenant_id` from response.data.tenant.id
- Saves tenant_id along with token and user data

#### Login Method

**Changed from:** `POST /auth/login`  
**Changed to:** `POST /smart-login`

**Request Payload:**

```javascript
{
  phone: phone,
  password: password
}
```

**Response Handling:**

- Extracts `tenant_id` directly from response
- Saves tenant_id to localStorage immediately
- Handles both nested and flat response structures

#### saveAuthData Method

**Updated to handle:**

- `data.tenant_id` - stores in localStorage as 'tenant_id'
- `data.tenant` - stores tenant object in 'clinic' key
- Maintains backward compatibility with existing structure

#### clearAuthData Method

**Updated to remove:**

- `tenant_id` from localStorage
- All existing auth-related keys

---

### 3. Register Page (`src/views/pages/Register.vue`)

#### Phone Field Updates

- Added `prefix="07"` to phone input field
- Changed placeholder to `"07XXXXXXXXX"`
- Updated validation to Iraqi format: `07XXXXXXXXX` (11 digits)

**Validation Rules:**

```javascript
const phoneRules = [
  (v) => !!v || t("validation.required"),
  (v) => /^07[0-9]{9}$/.test(v) || "Phone must be 11 digits starting with 07",
];
```

**Inline Validation:**

```javascript
if (!/^07[0-9]{9}$/.test(phone.value)) {
  errors.value = ["Phone must be 11 digits starting with 07"];
  return;
}
```

---

### 4. Login Page (`src/views/pages/Login.vue`)

#### Phone Field Updates

- Added `prefix="07"` to phone input field
- Changed placeholder to `"07XXXXXXXXX"`
- Visual indicator for Iraqi phone format

---

## API Request Flow

### Registration Flow

```
1. User fills registration form with phone (07XXXXXXXXX format)
2. Frontend sends POST /api/tenants with clinic and user data
3. Backend creates tenant and returns:
   {
     success: true,
     data: {
       tenant: { id: "uuid", ... },
       user: { ... },
       token: "jwt_token"
     }
   }
4. Frontend saves:
   - localStorage.setItem('auth_token', token)
   - localStorage.setItem('tenant_id', tenant.id)
   - localStorage.setItem('user', JSON.stringify(user))
   - localStorage.setItem('clinic', JSON.stringify(tenant))
5. Redirect to /dashboard
```

### Login Flow

```
1. User enters phone (07XXXXXXXXX format) and password
2. Frontend sends POST /api/smart-login
3. Backend returns:
   {
     success: true,
     token: "jwt_token",
     user: { ... },
     tenant_id: "uuid"
   }
4. Frontend saves:
   - localStorage.setItem('auth_token', token)
   - localStorage.setItem('tenant_id', tenant_id)
   - localStorage.setItem('user', JSON.stringify(user))
5. Redirect to /dashboard
```

### Subsequent API Requests

```
1. User makes any API call (e.g., GET /api/tenant/patients)
2. Axios interceptor automatically adds headers:
   - Authorization: Bearer {token}
   - X-Tenant-ID: {tenant_id}
   - Accept-Language: {locale}
3. Backend validates tenant_id and returns tenant-specific data
```

---

## Phone Format Standard

**Iraqi Mobile Format:**

- Pattern: `07XXXXXXXXX`
- Length: 11 digits
- Prefix: Always starts with `07`
- Examples: `07701234567`, `07801234567`, `07901234567`

**Validation Regex:** `/^07[0-9]{9}$/`

---

## Testing Checklist

### Registration

- [ ] Phone field shows "07" prefix
- [ ] Can only enter 11 digit phone starting with 07
- [ ] Registration sends to `/api/tenants`
- [ ] `tenant_id` is saved to localStorage after successful registration
- [ ] Redirects to dashboard after registration

### Login

- [ ] Phone field shows "07" prefix
- [ ] Login sends to `/api/smart-login`
- [ ] `tenant_id` is saved to localStorage after successful login
- [ ] Redirects to dashboard after login

### API Calls

- [ ] All API requests include `X-Tenant-ID` header
- [ ] Can fetch patients, cases, reservations, etc.
- [ ] Tenant isolation works (only see own clinic data)
- [ ] 401 errors properly clear tenant_id and redirect to login

### Logout

- [ ] Logout clears `tenant_id` from localStorage
- [ ] Logout clears `auth_token` from localStorage
- [ ] Redirects to login page

---

## Environment Configuration

Make sure your `.env` file or `vite.config.js` has the correct API base URL:

```env
VITE_API_BASE_URL=https://api.smartclinic.software/api
```

The API client is configured to use this base URL, and all endpoints are relative to this base.

---

## Backward Compatibility

The implementation maintains backward compatibility by:

1. Keeping old token keys cleanup in `clearAuthData()`
2. Supporting both flat and nested response structures
3. Maintaining existing localStorage key names where possible
4. Not breaking existing API service methods

---

## Security Notes

1. **tenant_id** is stored in localStorage and sent with every request
2. Backend should validate tenant_id matches the authenticated user
3. JWT token still serves as the primary authentication mechanism
4. X-Tenant-ID is an additional isolation layer for multi-tenancy

---

## Migration Notes

**For existing users:**

- Existing users will need to log in again after this update
- Old sessions will be cleared automatically
- No data migration needed (handled by backend)

**For development:**

- Clear localStorage before testing: `localStorage.clear()`
- Test with fresh registration to verify tenant creation
- Verify X-Tenant-ID header in browser DevTools Network tab

---

## Support

If you encounter issues:

1. Check browser console for error messages
2. Verify `tenant_id` exists in localStorage after login
3. Check Network tab for X-Tenant-ID header in requests
4. Ensure backend API is updated to support new endpoints

---

## Files Modified

1. `src/services/api.js` - Added X-Tenant-ID header interceptor
2. `src/services/auth.service.js` - Updated login/register endpoints and tenant_id handling
3. `src/views/pages/Login.vue` - Added 07 phone prefix
4. `src/views/pages/Register.vue` - Added 07 phone prefix and validation

---

**Last Updated:** February 3, 2026  
**Version:** 3.0.0  
**Author:** SmartClinic Team
