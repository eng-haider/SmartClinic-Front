# Quick Reference - Tenant API Integration

## 🔑 Key Changes at a Glance

### 1. Registration Endpoint

```javascript
// OLD: POST /auth/register
// NEW: POST /tenants

// Payload Structure:
{
  clinic_name: "Clinic Name",
  clinic_name_ar: "اسم العيادة",
  domain: "clinicname",
  password: "password123",
  password_confirmation: "password123",
  phone: "07701234567",        // Must start with 07
  address: "Clinic Address",
  address_ar: "عنوان العيادة",
  user_name: "Doctor Name",
  user_phone: "07701234567"
}
```

### 2. Login Endpoint

```javascript
// OLD: POST /auth/login
// NEW: POST /smart-login

// Payload:
{
  phone: "07701234567",  // Must start with 07
  password: "password123"
}

// Response includes tenant_id:
{
  success: true,
  token: "jwt_token",
  user: { ... },
  tenant_id: "uuid-here"  // ⚠️ Important: Save this!
}
```

### 3. All Other API Calls

```javascript
// Add X-Tenant-ID header (automatic via interceptor)
axios.get("/tenant/patients");
// Headers automatically include:
// - Authorization: Bearer {token}
// - X-Tenant-ID: {tenant_id}
// - Accept-Language: {locale}
```

## 📱 Phone Format

**Iraqi Format Only:**

- Pattern: `07XXXXXXXXX`
- Length: 11 digits
- Must start with: `07`
- Example: `07701234567`

## 🗄️ localStorage Keys

After login/register, these keys are set:

```javascript
localStorage.getItem("auth_token"); // JWT token
localStorage.getItem("tenant_id"); // Tenant UUID
localStorage.getItem("user"); // User object (JSON)
localStorage.getItem("clinic"); // Tenant/clinic object (JSON)
```

## 🔧 How to Test

### 1. Clear Storage

```javascript
localStorage.clear();
```

### 2. Register New Tenant

- Go to `/register`
- Fill form with phone starting with `07`
- Check localStorage for `tenant_id` after success

### 3. Login

- Go to `/login`
- Enter phone (07XXXXXXXXX) and password
- Check localStorage for `tenant_id`

### 4. Make API Call

- Open DevTools Network tab
- Make any API call (e.g., view patients)
- Check request headers for `X-Tenant-ID`

## ⚠️ Common Issues

### Issue: "tenant_id not found in headers"

**Solution:** User needs to login again. tenant_id is only set after new login.

### Issue: "Phone validation failed"

**Solution:** Ensure phone starts with 07 and is exactly 11 digits.

### Issue: "Cannot access tenant data"

**Solution:** Check that X-Tenant-ID header is present in request.

## 🎯 Code Examples

### Check if tenant_id exists:

```javascript
const tenantId = localStorage.getItem("tenant_id");
if (!tenantId) {
  console.error("User needs to login again");
}
```

### Manual API call with tenant header:

```javascript
import apiClient from "@/services/api";

// Headers are added automatically by interceptor
const patients = await apiClient.get("/tenant/patients");
```

### Get current user's tenant:

```javascript
import authService from "@/services/auth.service";

const clinic = authService.getClinic();
console.log("Tenant:", clinic);
```

## 📝 Testing Credentials Format

```
Phone: 07701234567
Password: password123

Phone: 07801234567
Password: test1234
```

## 🔄 Migration from Old System

Users with old sessions:

1. Will be logged out automatically
2. Need to login again
3. tenant_id will be set on new login
4. All subsequent requests will work with multi-tenancy

---

**Quick Command:** Clear storage and test

```javascript
// Browser Console:
localStorage.clear();
window.location.href = "/login";
```
