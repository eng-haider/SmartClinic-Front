# Doctors Page - Frontend Documentation

## Overview

The Doctors page provides a complete interface for managing doctors in the SmartClinic system. It follows the same design patterns and architecture as the Patients page for consistency.

## Files Created/Modified

### 1. Page Component

- **File**: `src/views/pages/Doctors.vue`
- **Purpose**: Main doctors management page
- **Features**:
  - List all doctors with pagination
  - Search by name, email, or phone
  - Filter by status (active/inactive)
  - Add new doctors
  - Edit existing doctors
  - Delete doctors
  - View doctor details

### 2. Service Layer

- **File**: `src/services/doctor.service.js`
- **Purpose**: API communication for doctor operations
- **Methods**:
  - `getAll(params)` - Get paginated doctors list
  - `getActive()` - Get active doctors only
  - `getByClinic(clinicId)` - Get doctors by clinic
  - `getById(id)` - Get single doctor
  - `create(data)` - Create new doctor
  - `update(id, data)` - Update doctor
  - `delete(id)` - Delete doctor
  - `searchByEmail(email)` - Search by email
  - `searchByPhone(phone)` - Search by phone

### 3. Routes

- **File**: `src/router/index.js` (updated)
- **Route**: `/doctors`
- **Component**: `Doctors.vue`
- **Meta**: `{ title: 'Doctors Management' }`

### 4. Navigation

- **File**: `src/layouts/DashboardLayout.vue` (updated)
- **Menu Item**: Added "الأطباء" with icon `mdi-doctor`

### 5. Translations

Updated all three language files:

- **English**: `src/locales/en.json`
- **Arabic**: `src/locales/ar.json`
- **Kurdish**: `src/locales/ku.json`

## Page Features

### Data Table Columns

1. **Name** - Doctor name with avatar
2. **Email** - Email address with icon
3. **Phone** - Phone number with icon
4. **Role** - Doctor role badge (Doctor / Clinic Super Doctor)
5. **Status** - Active/Inactive badge
6. **Created At** - Registration date
7. **Actions** - View, Edit, Delete buttons

### Filters & Search

- **Search**: Real-time search by name, email, or phone
- **Status Filter**: All / Active / Inactive
- **Per Page**: 15, 25, 50, 100 items

### Add/Edit Doctor Dialog

Fields:

- **Name** (required) - Full name
- **Email** (required) - Must be valid email and unique
- **Phone** (optional) - Phone number
- **Password** (required for new, optional for edit) - Min 8 characters
- **Role** - Doctor or Clinic Super Doctor
- **Active Status** - Toggle switch

### View Doctor Dialog

Displays:

- Doctor avatar
- Name and status badge
- ID
- Email
- Phone
- Role
- Created date
- Edit button

### Delete Confirmation

- Confirmation dialog before deletion
- Shows doctor name
- Cancel/Delete actions

## API Integration

### Endpoints Used

```javascript
GET    /api/doctors           // Get all doctors (paginated)
GET    /api/doctors-active    // Get active doctors
GET    /api/doctors/:id       // Get single doctor
POST   /api/doctors           // Create doctor
PUT    /api/doctors/:id       // Update doctor
DELETE /api/doctors/:id       // Delete doctor
```

### Request Parameters

```javascript
{
  page: 1,
  per_page: 15,
  search: 'search term',
  'filter[is_active]': 1 or 0
}
```

### Request Body (Create/Update)

```javascript
{
  name: "Dr. John Smith",
  email: "john@example.com",
  phone: "+1234567890",
  password: "securepass123",  // Optional on update
  role: "doctor",             // or "clinic_super_doctor"
  is_active: true
}
```

### Response Format

```javascript
{
  success: true,
  message: "Doctors retrieved successfully",
  data: [...],
  pagination: {
    total: 50,
    per_page: 15,
    current_page: 1,
    last_page: 4,
    from: 1,
    to: 15
  }
}
```

## Translations

### English (en.json)

```json
"doctors": {
  "title": "Clinic Doctors",
  "subtitle": "Manage clinic doctors and staff",
  "add": "Add Doctor",
  "add_doctor": "Add New Doctor",
  "edit_doctor": "Edit Doctor",
  "name": "Name",
  "email": "Email",
  "phone": "Phone",
  "password": "Password",
  "role": "Role",
  "doctor": "Doctor",
  "clinic_super_doctor": "Clinic Super Doctor",
  ...
}
```

### Arabic (ar.json)

```json
"doctors": {
  "title": "دكاتره العيادة",
  "subtitle": "إدارة أطباء وموظفي العيادة",
  "add": "إضافة طبيب",
  "add_doctor": "اضافه دكتور جديد",
  "edit_doctor": "تعديل الطبيب",
  ...
}
```

### Kurdish (ku.json)

```json
"doctors": {
  "title": "پزیشکانی کلینیک",
  "subtitle": "بەڕێوەبردنی پزیشکان و کارمەندان",
  "add": "زیادکردنی پزیشک",
  ...
}
```

## UI Components

### Vuetify Components Used

- `v-card` - Container cards
- `v-data-table-server` - Server-side paginated table
- `v-dialog` - Modals for add/edit/view/delete
- `v-form` - Form validation
- `v-text-field` - Input fields
- `v-select` - Dropdown selections
- `v-switch` - Toggle for active status
- `v-chip` - Status badges
- `v-btn` - Buttons
- `v-icon` - Icons
- `v-avatar` - User avatars
- `v-snackbar` - Toast notifications
- `v-alert` - Error messages
- `v-progress-linear` - Loading indicator
- `v-skeleton-loader` - Loading skeleton

## Styling

### Design Patterns

- Follows the same design as Patients page
- Consistent color scheme using Vuetify theme
- Responsive layout (mobile + desktop)
- RTL support for Arabic
- Material Design icons

### Colors

- **Primary**: Blue (from theme)
- **Doctor Role**: Blue badge
- **Clinic Super Doctor**: Purple badge
- **Active Status**: Green badge
- **Inactive Status**: Red badge
- **Actions**: Info (blue), Warning (orange), Error (red)

## Validation Rules

### Client-Side

- **Name**: Required
- **Email**: Required, valid email format
- **Password**: Required for new doctors, min 8 characters
- **Phone**: Optional, no specific format (flexible)

### Server-Side (from API)

- **Email**: Must be unique
- **Phone**: Must be unique if provided
- **Role**: Must be 'doctor' or 'clinic_super_doctor'

## Error Handling

### Types of Errors

1. **Network Errors**: Display error alert
2. **Validation Errors (422)**: Show field-specific errors
3. **Not Found (404)**: Display not found message
4. **Server Errors (500)**: Show generic error

### User Feedback

- Success snackbar on create/update/delete
- Error snackbar on failures
- Loading states during API calls
- Form validation before submission

## Security Features

1. **JWT Authentication**: All API calls require valid token
2. **Password Hashing**: Passwords hashed on server
3. **Role Validation**: Only valid roles accepted
4. **Input Sanitization**: Form validation prevents invalid data

## Responsive Design

### Desktop (>960px)

- Full sidebar navigation
- Wide table layout
- Multiple columns visible

### Mobile (<960px)

- Drawer navigation
- Bottom navigation bar
- Compact table layout
- Stacked form fields

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly
- High contrast colors

## Performance Optimizations

1. **Server-Side Pagination**: Only loads needed data
2. **Debounced Search**: 500ms delay to reduce API calls
3. **Lazy Loading**: Components loaded on demand
4. **Computed Properties**: Cached calculations
5. **V-model Optimizations**: Efficient reactivity

## Testing Checklist

- [ ] Create new doctor
- [ ] Edit existing doctor
- [ ] Delete doctor
- [ ] Search by name
- [ ] Search by email
- [ ] Search by phone
- [ ] Filter by active status
- [ ] Filter by inactive status
- [ ] Pagination navigation
- [ ] Change password for existing doctor
- [ ] Form validation (all fields)
- [ ] Error handling
- [ ] Mobile responsive
- [ ] RTL support
- [ ] All three languages

## Usage Examples

### Navigate to Doctors Page

1. Login to the system
2. Click "الأطباء" in sidebar menu
3. Or navigate to `/doctors`

### Add New Doctor

1. Click "Add Doctor" button
2. Fill in required fields (Name, Email, Password)
3. Optionally fill Phone and select Role
4. Toggle Active status if needed
5. Click "Save"

### Edit Doctor

1. Click pencil icon on doctor row
2. Modify desired fields
3. Password is optional (only if changing)
4. Click "Update"

### Change Password

1. Click pencil icon to edit doctor
2. Click "Change Password" button
3. Enter new password
4. Click "Update"

### Delete Doctor

1. Click delete icon on doctor row
2. Confirm deletion in dialog
3. Doctor is removed

### Search/Filter

1. Type in search box (name, email, or phone)
2. Select status filter (Active/Inactive/All)
3. Results update automatically

## Future Enhancements

- [ ] Bulk actions (delete multiple)
- [ ] Export to Excel/PDF
- [ ] Advanced filters (date range, role)
- [ ] Doctor statistics dashboard
- [ ] Assign patients to doctors
- [ ] Doctor permissions management
- [ ] Profile pictures upload
- [ ] Email notifications
- [ ] Activity logs

## Notes

- Doctors are actually User model instances with specific roles
- The system filters users to show only doctor-related roles
- Clinic filtering is handled server-side based on user role
- Super admins can see all doctors from all clinics
- Regular users only see doctors from their clinic
