# 🎯 Tenant API Integration - Visual Summary

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vue 3)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐        ┌──────────────┐      ┌──────────────┐ │
│  │  Login.vue  │───────▶│ authNew.js   │─────▶│ api.js       │ │
│  │  (07 prefix)│        │  (Pinia      │      │ (Axios +     │ │
│  └─────────────┘        │   Store)     │      │  Interceptor)│ │
│                         └──────────────┘      └──────┬───────┘ │
│  ┌─────────────┐               │                     │          │
│  │Register.vue │───────────────┘                     │          │
│  │  (07 prefix)│                                     │          │
│  └─────────────┘                                     │          │
│                         ┌──────────────┐             │          │
│                         │auth.service  │◀────────────┘          │
│                         │  .js         │                        │
│                         └──────────────┘                        │
│                                │                                 │
└────────────────────────────────┼─────────────────────────────────┘
                                 │
                                 ▼
        ┌────────────────────────────────────────────┐
        │         HTTP REQUEST HEADERS               │
        ├────────────────────────────────────────────┤
        │  Authorization: Bearer {jwt_token}         │
        │  X-Tenant-ID: {tenant_uuid}        ◀────── │ NEW!
        │  Accept-Language: ar                       │
        └────────────────┬───────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────────┐
        │         BACKEND API                        │
        ├────────────────────────────────────────────┤
        │  POST /api/tenants          (Register)     │
        │  POST /api/smart-login      (Login)        │
        │  GET  /api/tenant/patients                 │
        │  POST /api/tenant/cases                    │
        │  GET  /api/tenant/reservations             │
        │  ... all other endpoints                   │
        └────────────────────────────────────────────┘
```

---

## 🔄 Request Flow Comparison

### BEFORE (Old System)

```
┌──────────┐
│  User    │
└────┬─────┘
     │ phone: "201001234567"
     │ password: "****"
     ▼
┌──────────────────┐
│ POST /auth/login │
└────┬─────────────┘
     │
     ▼
┌────────────────────────────┐
│ Response:                  │
│  - token                   │
│  - user                    │
└────┬───────────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ All future requests:        │
│  Authorization: Bearer XXX  │
└─────────────────────────────┘
```

### AFTER (New System)

```
┌──────────┐
│  User    │
└────┬─────┘
     │ phone: "07701234567"  ◀─── Must start with 07
     │ password: "****"
     ▼
┌──────────────────────┐
│ POST /smart-login    │  ◀─────── New endpoint
└────┬─────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ Response:                    │
│  - token                     │
│  - user                      │
│  - tenant_id  ◀─────────────── NEW!
└────┬─────────────────────────┘
     │
     ▼ (Save to localStorage)
┌─────────────────────────────┐
│ localStorage:               │
│  - auth_token               │
│  - tenant_id   ◀──────────── NEW!
│  - user                     │
└────┬────────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ All future requests:         │
│  Authorization: Bearer XXX   │
│  X-Tenant-ID: UUID  ◀────────── NEW! (Auto-added)
└──────────────────────────────┘
```

---

## 📝 Registration Flow

### OLD Registration

```javascript
POST /auth/register
{
  name: "Dr. Ahmed",
  phone: "201001234567",
  email: "ahmed@example.com",
  password: "password123",
  password_confirmation: "password123",
  clinic_name: "My Clinic",
  clinic_address: "123 Street",
  clinic_phone: "201001234567",
  clinic_email: "clinic@example.com"
}
```

### NEW Registration

```javascript
POST /tenants
{
  user_name: "Dr. Ahmed",           ◀─── Changed: name → user_name
  user_phone: "07701234567",        ◀─── Changed: format 07XXXXXXXXX
  phone: "07701234567",             ◀─── NEW: separate phone field
  password: "password123",
  password_confirmation: "password123",

  clinic_name: "My Clinic",
  clinic_name_ar: "عيادتي",        ◀─── NEW: Arabic name
  address: "123 Street",            ◀─── Changed: clinic_address → address
  address_ar: "شارع 123",           ◀─── NEW: Arabic address
  domain: "myclinic"                ◀─── NEW: auto-generated subdomain
}
```

---

## 🔐 localStorage Structure

### BEFORE

```javascript
{
  "auth_token": "eyJhbGc...",
  "user": "{...}",
  "clinic": "{...}",
  "token_expires_at": "1234567890"
}
```

### AFTER

```javascript
{
  "auth_token": "eyJhbGc...",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",  ◀─── NEW!
  "user": "{...}",
  "clinic": "{...}",
  "token_expires_at": "1234567890"
}
```

---

## 🎨 UI Changes

### Login Page

**BEFORE:**

```
┌─────────────────────────────┐
│ Phone: [201001234567     ] │
│ Password: [************  ] │
│ [       LOGIN       ]      │
└─────────────────────────────┘
```

**AFTER:**

```
┌─────────────────────────────┐
│ Phone: 07|[XXXXXXXXX     ] │ ◀─── Prefix shown
│ Password: [************  ] │
│ [       LOGIN       ]      │
└─────────────────────────────┘
```

### Register Page

**BEFORE:**

```
┌─────────────────────────────┐
│ Doctor Phone: [201001234567] │
│ Clinic Phone: [201009876543] │
└─────────────────────────────┘
```

**AFTER:**

```
┌─────────────────────────────┐
│ Doctor Phone: 07|[XXXXXXXXX] │ ◀─── Prefix shown
│ Clinic Phone: 07|[XXXXXXXXX] │ ◀─── Prefix shown
└─────────────────────────────┘
```

---

## 🔍 Network Request Examples

### Before Login

```http
POST https://api.smartclinic.software/api/smart-login
Content-Type: application/json
Accept-Language: ar

{
  "phone": "07701234567",
  "password": "password123"
}
```

### After Login - Any API Call

```http
GET https://api.smartclinic.software/api/tenant/patients
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Tenant-ID: 550e8400-e29b-41d4-a716-446655440000        ◀─── NEW!
Accept-Language: ar
```

---

## ✅ Validation Rules

### Phone Number

**OLD:**

```javascript
/^[0-9]{10,15}$/; // Any 10-15 digits
```

**NEW:**

```javascript
/^07[0-9]{9}$/; // Must start with 07, total 11 digits
```

**Examples:**

```
✅ 07701234567  (Valid)
✅ 07801234567  (Valid)
✅ 07901234567  (Valid)
❌ 0770123456   (Too short)
❌ 077012345678 (Too long)
❌ 08701234567  (Wrong prefix)
❌ 7701234567   (Missing 0)
```

---

## 🚀 Deployment Checklist

- [x] Update `api.js` with X-Tenant-ID interceptor
- [x] Update `auth.service.js` endpoints
- [x] Update `Login.vue` phone format
- [x] Update `Register.vue` phone format
- [x] Add tenant_id to localStorage handling
- [x] Update phone validation rules
- [ ] Test registration flow
- [ ] Test login flow
- [ ] Test API calls with tenant isolation
- [ ] Test logout cleanup
- [ ] Clear existing user sessions (if needed)

---

## 📞 Support Contacts

**Frontend Issues:** Check browser console and Network tab  
**Backend Issues:** Verify API endpoints are deployed  
**Phone Format Issues:** Ensure 07XXXXXXXXX format

---

**Last Updated:** February 3, 2026
