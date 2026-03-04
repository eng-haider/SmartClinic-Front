# 🔐 دليل شامل لنظام المصادقة والصلاحيات

## Authentication & Authorization Complete Guide

---

## 📋 جدول المحتويات

1. [المفاهيم الأساسية](#المفاهيم-الأساسية)
2. [كيف يعمل النظام](#كيف-يعمل-النظام)
3. [عملية التسجيل](#عملية-التسجيل-registration)
4. [عملية تسجيل الدخول](#عملية-تسجيل-الدخول-login)
5. [JWT Token](#jwt-token)
6. [الصلاحيات والأدوار](#الصلاحيات-والأدوار)
7. [التحقق من الصلاحيات](#التحقق-من-الصلاحيات)
8. [حماية الصفحات](#حماية-الصفحات)
9. [أمثلة عملية](#أمثلة-عملية)
10. [الأمان](#الأمان)

---

## 📖 المفاهيم الأساسية

### ما هو Authentication (المصادقة)؟

**المصادقة** = التحقق من هوية المستخدم

```
السؤال: من أنت؟
الجواب: أنا الدكتور أحمد (رقم الهاتف + كلمة المرور)
النظام: تحقق من البيانات ✅ مرحباً دكتور أحمد!
```

### ما هو Authorization (التصريح/الصلاحيات)؟

**التصريح** = التحقق من صلاحيات المستخدم

```
السؤال: ماذا يمكنك أن تفعل؟
الجواب: أنا دكتور في العيادة
النظام: يمكنك:
  ✅ إضافة مراجعين
  ✅ عرض الحالات
  ❌ حذف العيادة (ليس لديك صلاحية)
```

### الفرق بينهما:

| المصادقة (Authentication) | التصريح (Authorization) |
| ------------------------- | ----------------------- |
| **من** أنت؟               | **ماذا** يمكنك أن تفعل؟ |
| تسجيل دخول                | الصلاحيات               |
| رقم هاتف + كلمة مرور      | أدوار + صلاحيات         |
| مرة واحدة عند الدخول      | في كل عملية             |

---

## 🔄 كيف يعمل النظام

### الصورة الكاملة:

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   المستخدم   │  ←──→  │   Frontend   │  ←──→  │   Backend   │
│   (المتصفح)  │         │   (Vue 3)    │         │  (Laravel)  │
└─────────────┘         └──────────────┘         └─────────────┘
                               ↓                         ↓
                        ┌──────────────┐         ┌─────────────┐
                        │ localStorage │         │  Database   │
                        │   - Token    │         │  - Users    │
                        │   - User     │         │  - Roles    │
                        │   - Clinic   │         │  - Perms    │
                        └──────────────┘         └─────────────┘
```

### خطوات العمل:

```
1️⃣ المستخدم يدخل رقم الهاتف + كلمة المرور
   ↓
2️⃣ Frontend يرسل البيانات إلى Backend
   POST /api/auth/login
   ↓
3️⃣ Backend يتحقق من البيانات في Database
   ✅ صحيحة؟
   ↓
4️⃣ Backend يُنشئ JWT Token + يرجع بيانات المستخدم
   {
     user: {...},
     token: "eyJhbGc...",
     permissions: [...]
   }
   ↓
5️⃣ Frontend يحفظ البيانات في localStorage
   ↓
6️⃣ في كل طلب API، Frontend يرسل Token
   Headers: { Authorization: "Bearer eyJhbGc..." }
   ↓
7️⃣ Backend يتحقق من Token ويسمح بالوصول
```

---

## 📝 عملية التسجيل (Registration)

### الخطوات بالتفصيل:

#### 1. المستخدم يملأ نموذج التسجيل:

```vue
<template>
  <v-form @submit.prevent="register">
    <v-text-field v-model="name" label="اسم الدكتور" />
    <v-text-field v-model="phone" label="رقم الهاتف" />
    <v-text-field v-model="email" label="البريد الإلكتروني" />
    <v-text-field v-model="clinicName" label="اسم العيادة" />
    <v-text-field v-model="clinicAddress" label="عنوان العيادة" />
    <v-text-field v-model="password" type="password" label="كلمة المرور" />
    <v-btn type="submit">تسجيل</v-btn>
  </v-form>
</template>
```

#### 2. Frontend يرسل البيانات:

```javascript
// في Register.vue
async function register() {
  const userData = {
    name: "د. أحمد حسن",
    phone: "201001234567",
    email: "ahmed@example.com",
    password: "password123",
    passwordConfirmation: "password123",
    clinicName: "عيادة الأسنان الذكية",
    clinicAddress: "شارع الجامعة، القاهرة",
  };

  // إرسال إلى Auth Store
  const result = await authStore.register(userData);

  if (result.success) {
    // تم التسجيل بنجاح
    router.push("/dashboard");
  }
}
```

#### 3. Auth Service يعالج الطلب:

```javascript
// في auth.service.js
async register(userData) {
  try {
    // إرسال POST request إلى Backend
    const response = await apiClient.post('/auth/register', {
      name: userData.name,
      phone: userData.phone,
      email: userData.email,
      password: userData.password,
      password_confirmation: userData.passwordConfirmation,
      clinic_name: userData.clinicName,
      clinic_address: userData.clinicAddress
    })

    // حفظ البيانات
    this.saveAuthData(response.data)

    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, message: error.message }
  }
}
```

#### 4. Backend يعالج التسجيل:

```php
// في Laravel (Backend)
public function register(Request $request) {
    // 1. التحقق من البيانات
    $validated = $request->validate([
        'name' => 'required|string',
        'phone' => 'required|unique:users',
        'email' => 'nullable|email|unique:users',
        'password' => 'required|min:8|confirmed',
        'clinic_name' => 'required|string',
        'clinic_address' => 'required|string'
    ]);

    // 2. إنشاء العيادة
    $clinic = Clinic::create([
        'name' => $validated['clinic_name'],
        'address' => $validated['clinic_address']
    ]);

    // 3. إنشاء المستخدم
    $user = User::create([
        'name' => $validated['name'],
        'phone' => $validated['phone'],
        'email' => $validated['email'],
        'password' => Hash::make($validated['password']),
        'clinic_id' => $clinic->id
    ]);

    // 4. إعطاء الدور الافتراضي
    $user->assignRole('clinic_super_doctor');

    // 5. إنشاء JWT Token
    $token = auth()->login($user);

    // 6. جلب الصلاحيات
    $permissions = $user->getAllPermissions()->pluck('name');

    // 7. إرجاع البيانات
    return response()->json([
        'success' => true,
        'data' => [
            'user' => $user,
            'clinic' => $clinic,
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth()->factory()->getTTL() * 60
        ]
    ], 201);
}
```

#### 5. Frontend يحفظ البيانات:

```javascript
// في auth.service.js
saveAuthData(data) {
  // حفظ Token
  if (data.token) {
    localStorage.setItem('auth_token', data.token)
  }

  // حفظ بيانات المستخدم
  if (data.user) {
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  // حفظ بيانات العيادة
  if (data.clinic) {
    localStorage.setItem('clinic', JSON.stringify(data.clinic))
  }

  // حفظ وقت انتهاء Token
  if (data.expires_in) {
    const expiresAt = Date.now() + (data.expires_in * 1000)
    localStorage.setItem('token_expires_at', expiresAt)
  }
}
```

#### 6. النتيجة النهائية:

```javascript
// localStorage الآن يحتوي على:
{
  auth_token: "eyJ0eXAiOiJKV1QiLCJhbGc...",
  user: {
    id: 1,
    name: "د. أحمد حسن",
    phone: "201001234567",
    email: "ahmed@example.com",
    clinic_id: 1,
    roles: ["clinic_super_doctor"],
    permissions: [
      "view-clinic-patients",
      "create-patient",
      "edit-patient",
      "delete-patient",
      "view-clinic-cases",
      // ... المزيد
    ]
  },
  clinic: {
    id: 1,
    name: "عيادة الأسنان الذكية",
    address: "شارع الجامعة، القاهرة"
  },
  token_expires_at: "1737155400000"
}
```

---

## 🔑 عملية تسجيل الدخول (Login)

### الخطوات المفصلة:

#### 1. المستخدم يدخل بياناته:

```vue
<template>
  <v-form @submit.prevent="login">
    <v-text-field
      v-model="phone"
      label="رقم الهاتف"
      prepend-inner-icon="mdi-phone"
    />
    <v-text-field
      v-model="password"
      type="password"
      label="كلمة المرور"
      prepend-inner-icon="mdi-lock"
    />
    <v-btn type="submit">دخول</v-btn>
  </v-form>
</template>
```

#### 2. Frontend يرسل الطلب:

```javascript
// في Login.vue
async function login() {
  const result = await authStore.login(
    phone.value, // "201001234567"
    password.value, // "password123"
  );

  if (result.success) {
    router.push("/dashboard");
  } else {
    error.value = result.message;
  }
}
```

#### 3. Auth Store يعالج:

```javascript
// في authNew.js (Pinia Store)
async function login(phone, password) {
  loading.value = true;
  error.value = null;

  try {
    // استدعاء Auth Service
    const result = await authService.login(phone, password);

    if (result.success) {
      // حفظ بيانات المستخدم في Store
      user.value = result.data.user;
      token.value = result.data.token;

      // تحميل بيانات العيادة
      const storedClinic = authService.getClinic();
      if (storedClinic) {
        clinic.value = storedClinic;
      }
    } else {
      error.value = result.message;
    }

    return result;
  } catch (err) {
    error.value = err.message;
    return { success: false, message: err.message };
  } finally {
    loading.value = false;
  }
}
```

#### 4. Backend يتحقق:

```php
// في Laravel Controller
public function login(Request $request) {
    // 1. التحقق من البيانات
    $credentials = $request->validate([
        'phone' => 'required',
        'password' => 'required'
    ]);

    // 2. محاولة تسجيل الدخول
    if (!$token = auth()->attempt($credentials)) {
        return response()->json([
            'success' => false,
            'message' => 'رقم الهاتف أو كلمة المرور غير صحيحة'
        ], 401);
    }

    // 3. جلب المستخدم
    $user = auth()->user();

    // 4. التحقق من أن الحساب نشط
    if (!$user->is_active) {
        return response()->json([
            'success' => false,
            'message' => 'الحساب غير مفعّل'
        ], 403);
    }

    // 5. جلب الصلاحيات والأدوار
    $roles = $user->getRoleNames();
    $permissions = $user->getAllPermissions()->pluck('name');

    // 6. إرجاع البيانات
    return response()->json([
        'success' => true,
        'data' => [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'email' => $user->email,
                'clinic_id' => $user->clinic_id,
                'is_active' => $user->is_active,
                'roles' => $roles,
                'permissions' => $permissions
            ],
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth()->factory()->getTTL() * 60
        ]
    ]);
}
```

---

## 🎟️ JWT Token

### ما هو JWT Token؟

**JWT** = JSON Web Token = شهادة رقمية مشفرة

```
تخيل JWT Token مثل بطاقة الهوية الإلكترونية:
- فيها معلوماتك
- مشفرة
- لا يمكن تزويرها
- لها تاريخ انتهاء
```

### تركيبة JWT Token:

```
eyJ0eXAiOiJKV1QiLCJhbGc.eyJpc3MiOiJodHRwOi8v.SflKxwRJSMeKKF2Q
│                      │                      │
│      Header         │      Payload         │    Signature
│    (نوع التشفير)    │   (بيانات المستخدم)  │   (التوقيع)
```

#### 1. Header (الرأس):

```json
{
  "typ": "JWT",
  "alg": "HS256" // خوارزمية التشفير
}
```

#### 2. Payload (البيانات):

```json
{
  "iss": "http://localhost:8000", // من أصدر Token
  "iat": 1737148200, // وقت الإصدار
  "exp": 1737151800, // وقت الانتهاء (60 دقيقة)
  "sub": "1", // ID المستخدم
  "jti": "abc123def456" // ID فريد للـ Token
}
```

#### 3. Signature (التوقيع):

```javascript
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret_key, // مفتاح سري في Backend فقط
);
```

### كيف يُستخدم Token؟

```javascript
// في كل API request:
axios.get("/api/patients", {
  headers: {
    Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJhbGc...",
  },
});

// Backend يتحقق:
// ✅ Token صحيح؟
// ✅ لم ينتهِ وقته؟
// ✅ التوقيع صحيح؟
// إذا كل شيء ✅ → السماح بالوصول
```

### دورة حياة Token:

```
1️⃣ إنشاء Token (عند Login)
   ↓
2️⃣ حفظ في localStorage
   ↓
3️⃣ إرسال مع كل request
   ↓
4️⃣ التحقق في Backend
   ↓
5️⃣ قبل الانتهاء → Refresh
   ↓
6️⃣ عند Logout → حذف Token
```

---

## 👥 الصلاحيات والأدوار

### الهيكل:

```
User (المستخدم)
  ↓
  ├─ Role (الدور)
  │    ├─ super_admin
  │    ├─ clinic_super_doctor
  │    ├─ doctor
  │    └─ secretary
  │
  └─ Permissions (الصلاحيات)
       ├─ view-clinic-patients
       ├─ create-patient
       ├─ edit-patient
       ├─ delete-patient
       └─ ... المزيد
```

### الأدوار الأربعة:

#### 1️⃣ Super Admin (مدير النظام):

```javascript
{
  role: 'super_admin',
  description: 'وصول كامل لجميع العيادات والبيانات',
  permissions: [
    // جميع الصلاحيات ✅
    'view-all-patients',
    'view-all-clinics',
    'manage-system',
    'manage-roles',
    // ... كل شيء
  ]
}
```

**يستطيع:**

- ✅ إدارة جميع العيادات
- ✅ إضافة/حذف/تعديل أي شيء
- ✅ إدارة المستخدمين والأدوار
- ✅ إدارة إعدادات النظام

#### 2️⃣ Clinic Super Doctor (مالك العيادة):

```javascript
{
  role: 'clinic_super_doctor',
  description: 'مالك العيادة - وصول كامل لعيادته فقط',
  permissions: [
    'view-clinic-patients',    // ✅
    'create-patient',          // ✅
    'edit-patient',            // ✅
    'delete-patient',          // ✅
    'view-clinic-cases',       // ✅
    'create-case',             // ✅
    'view-clinic-bills',       // ✅
    'create-bill',             // ✅
    'edit-bill',               // ✅
    'mark-bill-paid',          // ✅
    'manage-clinic-users',     // ✅
    // ... صلاحيات العيادة فقط
  ]
}
```

**يستطيع:**

- ✅ إدارة عيادته الخاصة فقط
- ✅ رؤية جميع مراجعين العيادة
- ✅ رؤية جميع حالات العيادة
- ✅ رؤية جميع فواتير العيادة
- ✅ إضافة/تعديل مستخدمي العيادة
- ❌ لا يستطيع الوصول لعيادات أخرى

#### 3️⃣ Doctor (دكتور):

```javascript
{
  role: 'doctor',
  description: 'طبيب في العيادة - صلاحيات محدودة',
  permissions: [
    'view-clinic-patients',    // ✅ يرى مراجعين العيادة
    'create-patient',          // ✅ يضيف مراجعين
    'edit-patient',            // ✅ يعدل بيانات المراجعين
    'view-own-cases',          // ✅ يرى حالاته فقط
    'create-case',             // ✅ يضيف حالات
    'edit-case',               // ✅ يعدل حالاته
    'view-own-bills',          // ✅ يرى فواتيره فقط
    'create-bill',             // ✅ ينشئ فواتير
    // لا يرى حالات/فواتير الأطباء الآخرين ❌
  ]
}
```

**يستطيع:**

- ✅ رؤية جميع مراجعين العيادة
- ✅ إضافة وتعديل المراجعين
- ✅ رؤية حالاته وفواتيره فقط
- ❌ لا يرى حالات الأطباء الآخرين
- ❌ لا يستطيع حذف البيانات

#### 4️⃣ Secretary (سكرتير):

```javascript
{
  role: 'secretary',
  description: 'موظف استقبال - صلاحيات محدودة',
  permissions: [
    'view-clinic-patients',      // ✅ يرى المراجعين
    'create-patient',            // ✅ يضيف مراجعين
    'edit-patient',              // ✅ يعدل بيانات المراجعين
    'view-clinic-cases',         // ✅ يرى الحالات (قراءة فقط)
    'view-clinic-bills',         // ✅ يرى الفواتير
    'create-bill',               // ✅ ينشئ فواتير
    'mark-bill-paid',            // ✅ يحدد دفع الفواتير
    'view-clinic-reservations',  // ✅ يرى المواعيد
    'create-reservation',        // ✅ يضيف مواعيد
    'edit-reservation',          // ✅ يعدل مواعيد
    // لا يستطيع حذف أي شيء ❌
  ]
}
```

**يستطيع:**

- ✅ إدارة المراجعين والمواعيد
- ✅ رؤية الحالات (قراءة فقط)
- ✅ إنشاء وتحديث الفواتير
- ❌ لا يستطيع حذف البيانات
- ❌ لا يستطيع تعديل الحالات

### مقارنة الأدوار:

| الصلاحية           | Super Admin | Clinic Owner | Doctor | Secretary      |
| ------------------ | ----------- | ------------ | ------ | -------------- |
| إضافة مراجع        | ✅          | ✅           | ✅     | ✅             |
| تعديل مراجع        | ✅          | ✅           | ✅     | ✅             |
| حذف مراجع          | ✅          | ✅           | ❌     | ❌             |
| رؤية جميع الحالات  | ✅          | ✅           | ❌     | ✅ (قراءة فقط) |
| إضافة حالة         | ✅          | ✅           | ✅     | ❌             |
| حذف حالة           | ✅          | ✅           | ❌     | ❌             |
| رؤية جميع الفواتير | ✅          | ✅           | ❌     | ✅             |
| حذف فاتورة         | ✅          | ✅           | ❌     | ❌             |
| إدارة المستخدمين   | ✅          | ✅           | ❌     | ❌             |
| إدارة النظام       | ✅          | ❌           | ❌     | ❌             |

---

## ✅ التحقق من الصلاحيات

### في Frontend:

#### الطريقة 1: استخدام Directive

```vue
<template>
  <!-- يظهر فقط إذا كان لديه صلاحية -->
  <v-btn v-permission="'create-patient'"> إضافة مراجع</v-btn>

  <!-- يظهر إذا كان لديه أي من الصلاحيات -->
  <v-btn v-permission:any="['edit-patient', 'delete-patient']">
    إدارة المراجع
  </v-btn>

  <!-- يظهر فقط إذا كان لديه كل الصلاحيات -->
  <v-btn v-permission:all="['edit-patient', 'delete-patient']">
    تحكم كامل
  </v-btn>

  <!-- يظهر فقط لدور معين -->
  <v-card v-role="'super_admin'"> لوحة المدير </v-card>

  <!-- يظهر لأي من الأدوار -->
  <v-card v-role="['super_admin', 'clinic_super_doctor']">
    لوحة الإدارة
  </v-card>
</template>
```

#### الطريقة 2: استخدام Composable

```vue
<script setup>
import { usePermissions } from "@/composables/usePermissions";
import { PERMISSIONS } from "@/constants/permissions";

const { hasPermission, hasAnyPermission, isSuperAdmin } = usePermissions();

// فحص صلاحية واحدة
const canCreatePatient = hasPermission(PERMISSIONS.CREATE_PATIENT);

// فحص عدة صلاحيات
const canManagePatients = hasAnyPermission([
  PERMISSIONS.EDIT_PATIENT,
  PERMISSIONS.DELETE_PATIENT,
]);
</script>

<template>
  <v-btn v-if="canCreatePatient">إضافة مراجع</v-btn>
  <v-btn v-if="canManagePatients">إدارة المراجعين</v-btn>
  <v-card v-if="isSuperAdmin">لوحة المدير</v-card>
</template>
```

#### الطريقة 3: استخدام Store مباشرة

```vue
<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/stores/authNew";

const authStore = useAuthStore();

const canCreate = computed(() => authStore.hasPermission("create-patient"));

const userRole = computed(() => authStore.userRole);
</script>

<template>
  <v-btn v-if="canCreate">إضافة</v-btn>
  <p>دورك: {{ userRole }}</p>
</template>
```

### في Backend (Laravel):

#### الطريقة 1: في Controller

```php
public function createPatient(Request $request) {
    // التحقق من الصلاحية
    if (!auth()->user()->can('create-patient')) {
        return response()->json([
            'success' => false,
            'message' => 'ليس لديك صلاحية لإضافة مراجعين'
        ], 403);
    }

    // إنشاء المراجع
    $patient = Patient::create($request->all());

    return response()->json([
        'success' => true,
        'data' => $patient
    ]);
}
```

#### الطريقة 2: استخدام Middleware

```php
// في routes/api.php
Route::middleware(['auth:api', 'permission:create-patient'])
    ->post('/patients', [PatientController::class, 'store']);
```

#### الطريقة 3: استخدام Policy

```php
// في PatientPolicy.php
public function create(User $user) {
    return $user->hasPermissionTo('create-patient');
}

// في Controller
public function createPatient(Request $request) {
    $this->authorize('create', Patient::class);

    // إنشاء المراجع
}
```

---

## 🔒 حماية الصفحات (Route Guards)

### إعداد Router Guards:

```javascript
// في router/index.js
import { useAuthStore } from "@/stores/authNew";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "Login",
      component: () => import("@/views/pages/Login.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/dashboard",
      name: "Dashboard",
      component: () => import("@/views/dashboard/Dashboard.vue"),
      meta: {
        requiresAuth: true, // يتطلب تسجيل دخول
      },
    },
    {
      path: "/patients",
      name: "Patients",
      component: () => import("@/views/pages/Patients.vue"),
      meta: {
        requiresAuth: true,
        permissions: ["view-clinic-patients", "view-all-patients"], // أي منها
      },
    },
    {
      path: "/admin",
      name: "Admin",
      component: () => import("@/views/pages/Admin.vue"),
      meta: {
        requiresAuth: true,
        roles: ["super_admin", "clinic_super_doctor"], // أي منها
      },
    },
  ],
});

// Navigation Guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // تهيئة Auth Store
  authStore.initializeAuth();

  // 1. التحقق من تسجيل الدخول
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // غير مسجل دخول → توجيه لصفحة Login
      return next({
        name: "Login",
        query: { redirect: to.fullPath }, // حفظ الصفحة المطلوبة
      });
    }
  }

  // 2. التحقق من الصلاحيات
  if (to.meta.permissions) {
    const hasPermission = authStore.hasAnyPermission(to.meta.permissions);
    if (!hasPermission) {
      // لا يملك الصلاحية → توجيه لصفحة Unauthorized
      return next({ name: "Unauthorized" });
    }
  }

  // 3. التحقق من الدور
  if (to.meta.roles) {
    const hasRole = to.meta.roles.some((role) => authStore.hasRole(role));
    if (!hasRole) {
      // لا يملك الدور → توجيه لصفحة Unauthorized
      return next({ name: "Unauthorized" });
    }
  }

  // 4. إذا مسجل دخول ويحاول الوصول لـ Login
  if (to.name === "Login" && authStore.isAuthenticated) {
    return next({ name: "Dashboard" });
  }

  // 5. السماح بالمرور
  next();
});

export default router;
```

### مثال على هيكل Routes كامل:

```javascript
const routes = [
  // صفحات عامة
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { requiresAuth: false },
  },
  {
    path: "/register",
    name: "Register",
    component: Register,
    meta: { requiresAuth: false },
  },

  // صفحات محمية
  {
    path: "/dashboard",
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: "Dashboard",
        component: Dashboard,
      },
      {
        path: "/patients",
        name: "Patients",
        component: Patients,
        meta: {
          permissions: ["view-clinic-patients"],
        },
      },
      {
        path: "/patients/create",
        name: "CreatePatient",
        component: CreatePatient,
        meta: {
          permissions: ["create-patient"],
        },
      },
      {
        path: "/cases",
        name: "Cases",
        component: Cases,
        meta: {
          permissions: ["view-clinic-cases", "view-own-cases"],
        },
      },
      {
        path: "/bills",
        name: "Bills",
        component: Bills,
        meta: {
          permissions: ["view-clinic-bills", "view-own-bills"],
        },
      },
      {
        path: "/admin/users",
        name: "ManageUsers",
        component: ManageUsers,
        meta: {
          roles: ["super_admin", "clinic_super_doctor"],
        },
      },
    ],
  },

  // صفحة Unauthorized
  {
    path: "/unauthorized",
    name: "Unauthorized",
    component: Unauthorized,
  },

  // 404
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: NotFound,
  },
];
```

---

## 💡 أمثلة عملية

### مثال 1: صفحة المراجعين

```vue
<template>
  <v-container>
    <!-- العنوان -->
    <v-row>
      <v-col>
        <h1>{{ $t("patients.title") }}</h1>
      </v-col>
      <v-col class="text-left">
        <!-- زر إضافة - يظهر فقط لمن لديه صلاحية -->
        <v-btn
          v-permission="PERMISSIONS.CREATE_PATIENT"
          color="primary"
          @click="showCreateDialog = true"
        >
          <v-icon start>mdi-plus</v-icon>
          {{ $t("patients.create") }}
        </v-btn>
      </v-col>
    </v-row>

    <!-- جدول المراجعين -->
    <v-data-table :headers="headers" :items="patients" :loading="loading">
      <!-- الأفعال -->
      <template v-slot:item.actions="{ item }">
        <!-- زر تعديل -->
        <v-btn
          v-permission="PERMISSIONS.EDIT_PATIENT"
          icon="mdi-pencil"
          size="small"
          variant="text"
          @click="editPatient(item)"
        />

        <!-- زر حذف - يظهر فقط للمدير أو مالك العيادة -->
        <v-btn
          v-permission="PERMISSIONS.DELETE_PATIENT"
          icon="mdi-delete"
          size="small"
          variant="text"
          color="error"
          @click="deletePatient(item)"
        />

        <!-- زر عرض - يظهر للجميع -->
        <v-btn
          icon="mdi-eye"
          size="small"
          variant="text"
          @click="viewPatient(item)"
        />
      </template>
    </v-data-table>

    <!-- Dialog إضافة مراجع-->
    <v-dialog v-model="showCreateDialog" max-width="600">
      <v-card>
        <v-card-title>إضافة مراجعجديد</v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-text-field v-model="newPatient.name" label="الاسم" />
            <v-text-field v-model="newPatient.phone" label="الهاتف" />
            <v-text-field v-model="newPatient.age" label="العمر" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showCreateDialog = false">إلغاء</v-btn>
          <v-btn color="primary" @click="createPatient">حفظ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/authNew";
import { usePermissions } from "@/composables/usePermissions";
import { PERMISSIONS } from "@/constants/permissions";
import api from "@/services/api";

const authStore = useAuthStore();
const { hasPermission } = usePermissions();

const patients = ref([]);
const loading = ref(false);
const showCreateDialog = ref(false);
const newPatient = ref({});

const headers = [
  { title: "ID", key: "id" },
  { title: "الاسم", key: "name" },
  { title: "الهاتف", key: "phone" },
  { title: "العمر", key: "age" },
  { title: "الأفعال", key: "actions", sortable: false },
];

// تحميل المراجعين
async function loadPatients() {
  loading.value = true;
  try {
    const response = await api.get("/patients");
    patients.value = response.data;
  } catch (error) {
    console.error("Error loading patients:", error);
  } finally {
    loading.value = false;
  }
}

// إضافة مراجع
async function createPatient() {
  try {
    const response = await api.post("/patients", newPatient.value);
    patients.value.push(response.data);
    showCreateDialog.value = false;
    newPatient.value = {};
  } catch (error) {
    console.error("Error creating patient:", error);
  }
}

// تعديل مراجع
function editPatient(patient) {
  // فتح dialog التعديل
}

// حذف مراجع
async function deletePatient(patient) {
  if (confirm("هل أنت متأكد من الحذف؟")) {
    try {
      await api.delete(`/patients/${patient.id}`);
      patients.value = patients.value.filter((p) => p.id !== patient.id);
    } catch (error) {
      console.error("Error deleting patient:", error);
    }
  }
}

// عرض مراجع
function viewPatient(patient) {
  // الانتقال لصفحة التفاصيل
}

onMounted(() => {
  loadPatients();
});
</script>
```

### مثال 2: Menu بناءً على الصلاحيات

```vue
<template>
  <v-navigation-drawer permanent>
    <v-list>
      <!-- الصفحة الرئيسية - للجميع -->
      <v-list-item
        to="/dashboard"
        prepend-icon="mdi-view-dashboard"
        title="الرئيسية"
      />

      <!-- المراجعين - لمن لديه صلاحية عرض المراجعين -->
      <v-list-item
        v-permission:any="[
          PERMISSIONS.VIEW_CLINIC_PATIENTS,
          PERMISSIONS.VIEW_ALL_PATIENTS,
        ]"
        to="/patients"
        prepend-icon="mdi-account-multiple"
        title="المراجعين"
      />

      <!-- الحالات - بناءً على الدور -->
      <v-list-item
        v-permission:any="[
          PERMISSIONS.VIEW_CLINIC_CASES,
          PERMISSIONS.VIEW_OWN_CASES,
        ]"
        to="/cases"
        prepend-icon="mdi-clipboard-text"
        title="الحالات"
      />

      <!-- الفواتير -->
      <v-list-item
        v-permission:any="[
          PERMISSIONS.VIEW_CLINIC_BILLS,
          PERMISSIONS.VIEW_OWN_BILLS,
        ]"
        to="/bills"
        prepend-icon="mdi-currency-usd"
        title="الفواتير"
      />

      <!-- الحجوزات -->
      <v-list-item
        v-permission:any="[
          PERMISSIONS.VIEW_CLINIC_RESERVATIONS,
          PERMISSIONS.VIEW_OWN_RESERVATIONS,
        ]"
        to="/reservations"
        prepend-icon="mdi-calendar"
        title="الحجوزات"
      />

      <!-- إدارة المستخدمين - للمدير ومالك العيادة فقط -->
      <v-list-group v-role="['super_admin', 'clinic_super_doctor']">
        <template v-slot:activator="{ props }">
          <v-list-item
            v-bind="props"
            prepend-icon="mdi-shield-account"
            title="الإدارة"
          />
        </template>

        <v-list-item
          to="/admin/users"
          title="المستخدمين"
          prepend-icon="mdi-account-group"
        />

        <v-list-item
          v-role="'super_admin'"
          to="/admin/clinics"
          title="العيادات"
          prepend-icon="mdi-hospital-building"
        />

        <v-list-item
          to="/admin/settings"
          title="الإعدادات"
          prepend-icon="mdi-cog"
        />
      </v-list-group>

      <!-- معلومات المستخدم -->
      <v-divider class="my-4" />

      <v-list-item>
        <template v-slot:prepend>
          <v-avatar color="primary">
            <v-icon>mdi-account</v-icon>
          </v-avatar>
        </template>
        <v-list-item-title>{{ userName }}</v-list-item-title>
        <v-list-item-subtitle>{{ userRoleName }}</v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/stores/authNew";
import { useI18n } from "vue-i18n";
import { PERMISSIONS } from "@/constants/permissions";
import { ROLES, ROLE_NAMES } from "@/constants/permissions";

const authStore = useAuthStore();
const { locale } = useI18n();

const userName = computed(() => authStore.user?.name || "");

const userRoleName = computed(() => {
  const role = authStore.userRole;
  if (!role) return "";
  return ROLE_NAMES[role]?.[locale.value] || role;
});
</script>
```

---

## 🛡️ الأمان

### ⚠️ قواعد الأمان الذهبية:

#### 1. Frontend للعرض فقط - Backend للتحقق

```javascript
// ❌ خطأ - لا تثق بالـ Frontend
if (canDelete) {
  // Frontend check
  await api.delete("/patients/1"); // ← أي شخص يستطيع التلاعب
}

// ✅ صحيح - Backend يتحقق دائماً
await api.delete("/patients/1");
// Backend controller:
// if (!auth()->user()->can('delete-patient')) abort(403);
```

#### 2. الصلاحيات من API - ليس من ملفات JS

```javascript
// ❌ خطأ - صلاحيات ثابتة في Frontend
const permissions = ["create-patient", "delete-patient"];

// ✅ صحيح - صلاحيات من API Response
const user = await api.get("/auth/me");
const permissions = user.permissions; // من Database
```

#### 3. Token في localStorage - ليس في Cookie بدون HttpOnly

```javascript
// ✅ صحيح
localStorage.setItem("auth_token", token);

// ⚠️ أفضل (إذا ممكن)
// HttpOnly Cookie من Backend
// (لكن يحتاج CORS configuration)
```

#### 4. HTTPS في Production

```javascript
// ⚠️ Development
const API_URL = "http://localhost:8000"; // OK للتطوير

// ✅ Production
const API_URL = "https://your-domain.com"; // يجب HTTPS
```

#### 5. التحقق من انتهاء Token

```javascript
function isTokenExpired() {
  const expiresAt = localStorage.getItem("token_expires_at");
  if (!expiresAt) return true;

  return Date.now() > parseInt(expiresAt);
}

// استخدام
if (isTokenExpired()) {
  await refreshToken(); // أو logout
}
```

### 🔐 Checklist الأمان:

- ✅ **Backend يتحقق من كل request**
- ✅ **Permissions من API فقط**
- ✅ **Token له وقت انتهاء**
- ✅ **Auto-refresh قبل الانتهاء**
- ✅ **401 Error → Logout تلقائي**
- ✅ **كلمات المرور مشفرة (bcrypt)**
- ✅ **HTTPS في Production**
- ✅ **CORS configured صحيح**
- ✅ **Rate Limiting على Login**
- ✅ **XSS Protection**
- ✅ **CSRF Protection**

### 🚨 ما يجب تجنبه:

- ❌ **لا تحفظ كلمات مرور في Frontend**
- ❌ **لا تثق بـ Frontend للتحقق الأمني**
- ❌ **لا تحفظ بيانات حساسة في localStorage**
- ❌ **لا تستخدم HTTP في Production**
- ❌ **لا تشارك Secret Keys في Frontend**
- ❌ **لا تترك Console.log في Production**

---

## 🎓 ملخص

### العملية الكاملة:

```
1️⃣ User يسجل/يدخل
   ↓
2️⃣ Backend يتحقق من البيانات
   ↓
3️⃣ Backend يُنشئ JWT Token
   ↓
4️⃣ Backend يُرجع: Token + User + Permissions
   ↓
5️⃣ Frontend يحفظ في localStorage
   ↓
6️⃣ Frontend يرسل Token مع كل request
   ↓
7️⃣ Backend يتحقق من Token والصلاحيات
   ↓
8️⃣ Backend يسمح/يرفض الوصول
```

### القواعد الأساسية:

1. **Authentication** = التحقق من الهوية (من أنت؟)
2. **Authorization** = التحقق من الصلاحيات (ماذا يمكنك أن تفعل؟)
3. **JWT Token** = شهادة رقمية مشفرة
4. **Permissions** = صلاحيات محددة (create, edit, delete)
5. **Roles** = مجموعة صلاحيات (super_admin, doctor, secretary)
6. **Frontend** = للعرض فقط
7. **Backend** = المصدر الوحيد للحقيقة

### الملفات المهمة:

```
Frontend:
├── services/auth.service.js     ← خدمة المصادقة
├── stores/authNew.js            ← Store الحالة
├── directives/permission.js     ← v-permission
├── directives/role.js           ← v-role
├── composables/usePermissions.js ← Composable
└── router/index.js              ← Navigation Guards

Backend:
├── AuthController.php           ← Login/Register
├── User.php                     ← Model + Roles
├── permissions.php              ← Config
└── api.php                      ← Routes + Middleware
```

---

## ✅ أنت الآن جاهز!

لديك الآن فهم كامل لـ:

- ✅ كيف تعمل المصادقة (Authentication)
- ✅ كيف تعمل الصلاحيات (Authorization)
- ✅ كيف يعمل JWT Token
- ✅ كيف تحمي الصفحات
- ✅ كيف تتحقق من الصلاحيات
- ✅ كيف تحافظ على الأمان

**ابدأ البرمجة بثقة!** 🚀

---

**Version:** 3.0.0  
**Last Updated:** January 17, 2026  
**Author:** Clinic Management System Team
