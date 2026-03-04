# Registration API - Updated Payload Structure

## Backend Validation Requirements

Based on the backend validation rules, here's the complete structure for the registration endpoint:

### Endpoint

```
POST /api/tenants
```

### Request Payload

```javascript
{
  // Tenant/Clinic data
  "id": null,                          // nullable|string - Tenant ID (usually null for new registrations)
  "name": "Clinic Name",               // required|string|max:255 - Clinic name
  "address": "123 Street, City",       // nullable|string|max:500 - Clinic address
  "rx_img": null,                      // nullable|string - Prescription image/template
  "whatsapp_template_sid": null,       // nullable|string - WhatsApp template SID
  "whatsapp_phone": null,              // nullable|string|max:20 - WhatsApp business phone
  "logo": null,                        // nullable|string - Clinic logo URL/path

  // User data
  "user_name": "Dr. Ahmed Ali",        // required|string|max:255 - Doctor/Admin name
  "user_phone": "07701234567",         // required|string|max:20 - User phone (07XXXXXXXXX format)
  "user_email": "ahmed@example.com",   // nullable|email|max:255 - User email
  "user_password": "password123"       // required|string|min:6 - User password (minimum 6 chars)
}
```

## Field Mapping

### From Frontend Form to API:

| Frontend Field  | API Field       | Validation        | Notes               |
| --------------- | --------------- | ----------------- | ------------------- |
| `clinicName`    | `name`          | required, max 255 | Clinic name         |
| `clinicAddress` | `address`       | optional, max 500 | Clinic address      |
| `name` (doctor) | `user_name`     | required, max 255 | Doctor/user name    |
| `phone`         | `user_phone`    | required, max 20  | Must be 07XXXXXXXXX |
| `email`         | `user_email`    | optional, email   | User email          |
| `password`      | `user_password` | required, min 6   | User password       |

## Changes from Previous Version

### ❌ Removed Fields:

- `clinic_name` → Changed to `name`
- `clinic_name_ar` → Removed
- `domain` → Removed
- `password_confirmation` → Removed
- `address_ar` → Removed
- `user_phone` duplicate → Kept only one

### ✅ Added Fields:

- `id` - Tenant ID (nullable)
- `rx_img` - Prescription template
- `whatsapp_template_sid` - WhatsApp integration
- `whatsapp_phone` - WhatsApp phone number
- `logo` - Clinic logo

### 🔄 Changed Fields:

- `password` → `user_password`
- Password minimum length: 8 → **6 characters**
- `clinic_address` → `address`

## Frontend Implementation

### auth.service.js

```javascript
async register(userData) {
  const response = await apiClient.post('/tenants', {
    // Clinic/Tenant data
    id: userData.tenantId || null,
    name: userData.clinicName,
    address: userData.clinicAddress || null,
    rx_img: userData.rxImg || null,
    whatsapp_template_sid: userData.whatsappTemplateSid || null,
    whatsapp_phone: userData.whatsappPhone || null,
    logo: userData.logo || null,

    // User data
    user_name: userData.name,
    user_phone: userData.phone,
    user_email: userData.email || null,
    user_password: userData.password
  })
}
```

### Register.vue

```javascript
const userData = {
  name: name.value, // Doctor name → user_name
  phone: phone.value, // 07XXXXXXXXX → user_phone
  email: email.value || undefined, // → user_email
  password: password.value, // → user_password (min 6)
  clinicName: clinic.value, // → name
  clinicAddress: clinicAddress.value, // → address
};
```

## Validation Rules

### Phone Number

- **Format:** `07XXXXXXXXX`
- **Length:** 11 digits
- **Pattern:** `/^07[0-9]{9}$/`
- **Required:** Yes

### Password

- **Minimum Length:** 6 characters
- **Required:** Yes
- **Note:** Changed from 8 to 6 to match backend

### Email

- **Format:** Valid email format
- **Required:** No (optional)
- **Pattern:** `/.+@.+\..+/`

### Clinic Name

- **Maximum Length:** 255 characters
- **Required:** Yes

### Clinic Address

- **Maximum Length:** 500 characters
- **Required:** No (optional)

## Response Structure

```javascript
{
  "success": true,
  "message": "Tenant created successfully",
  "data": {
    "tenant": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Clinic Name",
      "address": "123 Street, City",
      // ... other tenant fields
    },
    "user": {
      "id": 1,
      "name": "Dr. Ahmed Ali",
      "phone": "07701234567",
      "email": "ahmed@example.com",
      // ... other user fields
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Error Handling

### Validation Errors

```javascript
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "user_name": ["The user name field is required."],
    "user_phone": ["The user phone field is required."],
    "user_password": ["The user password must be at least 6 characters."],
    "name": ["The name field is required."]
  }
}
```

## Testing Examples

### Minimal Registration

```javascript
{
  "name": "Dr. Test Clinic",
  "user_name": "Dr. Test",
  "user_phone": "07701234567",
  "user_password": "test123"
}
```

### Full Registration

```javascript
{
  "name": "Smart Dental Clinic",
  "address": "123 Main Street, Baghdad",
  "whatsapp_phone": "07701234567",
  "logo": "https://example.com/logo.png",
  "user_name": "Dr. Ahmed Ali",
  "user_phone": "07701234567",
  "user_email": "ahmed@smartdental.com",
  "user_password": "secure123"
}
```

## Migration Notes

### For Existing Code:

1. ✅ Updated `auth.service.js` register method
2. ✅ Password validation changed from 8 to 6 characters
3. ✅ Removed `password_confirmation` field
4. ✅ Simplified payload structure

### Breaking Changes:

- Password confirmation is no longer sent to backend (only frontend validation)
- Arabic field names removed (can be added later if needed)
- Domain auto-generation removed (handled by backend)

---

**Last Updated:** February 3, 2026  
**Version:** 3.1.0
