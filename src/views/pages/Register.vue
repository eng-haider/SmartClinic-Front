<template>
  <div class="register-page">
    <div class="bg-animation">
      <div class="circle c1"></div>
      <div class="circle c2"></div>
      <div class="circle c3"></div>
      <div class="circle c4"></div>
    </div>
    
    <div class="language-selector">
      <LanguageSwitcher />
    </div>
    
    <v-container fluid class="fill-height">
      <v-row class="fill-height" align="center" justify="center">
        <v-col cols="12" sm="10" md="8" lg="5">
          <v-card class="register-card pa-8" rounded="xl" elevation="20">
            <div class="text-center mb-6">
              <v-avatar size="80" color="success" class="mb-4">
                <v-icon size="50" color="white">mdi-account-plus</v-icon>
              </v-avatar>
              <h1 class="text-h5 font-weight-bold">{{ $t('register.title') }}</h1>
              <p class="text-grey">{{ $t('register.subtitle') }}</p>
            </div>
            
            <v-alert v-if="errors.length" type="error" variant="tonal" class="mb-4">
              <div v-for="(e, i) in errors" :key="i">{{ e }}</div>
            </v-alert>
            
            <v-form @submit.prevent="register">
              <v-row>
                <!-- Doctor Name -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="name"
                    :label="$t('register.doctor_name')"
                    prepend-inner-icon="mdi-doctor"
                    variant="outlined"
                    :rules="[v => !!v || $t('validation.required')]"
                  ></v-text-field>
                </v-col>
                
                <!-- Doctor Phone -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="phone"
                    :label="$t('register.phone')"
                    prepend-inner-icon="mdi-phone"
                    variant="outlined"
                    type="tel"
                    :rules="phoneRules"
                    placeholder="201001234567"
                  ></v-text-field>
                </v-col>
                
                <!-- Doctor Email (Optional) -->
                <v-col cols="12">
                  <v-text-field
                    v-model="email"
                    :label="$t('register.email')"
                    prepend-inner-icon="mdi-email"
                    variant="outlined"
                    type="email"
                    :rules="emailRules"
                    placeholder="doctor@example.com"
                  ></v-text-field>
                </v-col>
                
                <!-- Clinic Name -->
                <v-col cols="12">
                  <v-text-field
                    v-model="clinic"
                    :label="$t('register.clinic_name')"
                    prepend-inner-icon="mdi-hospital-building"
                    variant="outlined"
                    :rules="[v => !!v || $t('validation.required')]"
                  ></v-text-field>
                </v-col>
                
                <!-- Clinic Address -->
                <v-col cols="12">
                  <v-textarea
                    v-model="clinicAddress"
                    :label="$t('register.clinic_address')"
                    prepend-inner-icon="mdi-map-marker"
                    variant="outlined"
                    rows="2"
                    :rules="[v => !!v || $t('validation.required')]"
                  ></v-textarea>
                </v-col>
                
                <!-- Clinic Phone (Optional) -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="clinicPhone"
                    :label="$t('register.clinic_phone')"
                    prepend-inner-icon="mdi-phone-classic"
                    variant="outlined"
                    type="tel"
                    hint="Optional - will use your phone if empty"
                  ></v-text-field>
                </v-col>
                
                <!-- Clinic Email (Optional) -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="clinicEmail"
                    :label="$t('register.clinic_email')"
                    prepend-inner-icon="mdi-email-outline"
                    variant="outlined"
                    type="email"
                    hint="Optional - will use your email if empty"
                  ></v-text-field>
                </v-col>
                
                <!-- Password -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="password"
                    :label="$t('register.password')"
                    prepend-inner-icon="mdi-lock"
                    :append-inner-icon="show1 ? 'mdi-eye-off' : 'mdi-eye'"
                    :type="show1 ? 'text' : 'password'"
                    variant="outlined"
                    :rules="passRules"
                    @click:append-inner="show1 = !show1"
                  ></v-text-field>
                </v-col>
                
                <!-- Confirm Password -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="confirmPass"
                    :label="$t('register.confirm_password')"
                    prepend-inner-icon="mdi-lock-check"
                    :append-inner-icon="show2 ? 'mdi-eye-off' : 'mdi-eye'"
                    :type="show2 ? 'text' : 'password'"
                    variant="outlined"
                    :rules="confirmRules"
                    @click:append-inner="show2 = !show2"
                  ></v-text-field>
                </v-col>
              </v-row>
              
              <v-btn
                type="submit"
                color="success"
                size="large"
                block
                :loading="loading"
                class="mt-4"
              >
                <v-icon start>mdi-account-check</v-icon>
                {{ $t('register.submit') }}
              </v-btn>
            </v-form>
            
            <div class="text-center mt-6">
              <span>{{ $t('register.have_account') }}</span>
              <router-link to="/login" class="text-primary font-weight-bold ms-1">
                {{ $t('register.login_link') }}
              </router-link>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authNew'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const name = ref('')
const email = ref('')
const clinic = ref('')
const clinicAddress = ref('')
const clinicPhone = ref('')
const clinicEmail = ref('')
const phone = ref('')
const password = ref('')
const confirmPass = ref('')
const show1 = ref(false)
const show2 = ref(false)
const loading = ref(false)
const errors = ref([])

// Validation Rules
const phoneRules = [
  v => !!v || t('validation.required'),
  v => /^[0-9]{10,15}$/.test(v) || t('validation.phone_format')
]

const emailRules = [
  v => !v || /.+@.+\..+/.test(v) || t('validation.email_format')
]

const passRules = [
  v => !!v || t('validation.required'),
  v => (v && v.length >= 8) || t('validation.password_min_8')
]

const confirmRules = computed(() => [
  v => !!v || t('validation.required'),
  v => v === password.value || t('validation.password_mismatch')
])

async function register() {
  // Validate required fields
  if (!name.value || !phone.value || !clinic.value || !clinicAddress.value || !password.value || !confirmPass.value) {
    errors.value = [t('validation.required')]
    return
  }
  
  // Validate phone format
  if (!/^[0-9]{10,15}$/.test(phone.value)) {
    errors.value = [t('validation.phone_format')]
    return
  }
  
  // Validate email format if provided
  if (email.value && !/.+@.+\..+/.test(email.value)) {
    errors.value = [t('validation.email_format')]
    return
  }
  
  // Validate password length
  if (password.value.length < 8) {
    errors.value = [t('validation.password_min_8')]
    return
  }
  
  // Validate password confirmation
  if (password.value !== confirmPass.value) {
    errors.value = [t('validation.password_mismatch')]
    return
  }
  
  loading.value = true
  errors.value = []
  
  try {
    const userData = {
      name: name.value,
      phone: phone.value,
      email: email.value || undefined,
      password: password.value,
      passwordConfirmation: confirmPass.value,
      clinicName: clinic.value,
      clinicAddress: clinicAddress.value,
      clinicPhone: clinicPhone.value || phone.value,
      clinicEmail: clinicEmail.value || email.value
    }
    
    const result = await authStore.register(userData)
    
    if (result.success) {
      // Registration successful, redirect to dashboard
      router.push('/dashboard')
    } else {
      // Show error messages
      if (result.errors && typeof result.errors === 'object') {
        // Format validation errors
        Object.keys(result.errors).forEach(key => {
          if (Array.isArray(result.errors[key])) {
            errors.value.push(...result.errors[key])
          } else {
            errors.value.push(result.errors[key])
          }
        })
      } else {
        errors.value = [result.message || t('register.error')]
      }
    }
  } catch (e) {
    errors.value = [t('register.error')]
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Initialize auth store
  authStore.initializeAuth()
  
  // Redirect if already authenticated
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  }
})
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.language-selector {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 100;
}

[dir="ltr"] .language-selector {
  right: auto;
  left: 20px;
}

.bg-animation {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  animation: float 18s infinite;
}

.c1 { width: 350px; height: 350px; top: -150px; right: -100px; }
.c2 { width: 200px; height: 200px; bottom: 100px; left: 50px; animation-delay: -4s; }
.c3 { width: 150px; height: 150px; top: 40%; left: 20%; animation-delay: -8s; }
.c4 { width: 100px; height: 100px; bottom: 20%; right: 20%; animation-delay: -12s; }

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(20px, -20px) scale(1.05); }
}

.register-card {
  background: rgba(255,255,255,0.95) !important;
  backdrop-filter: blur(10px);
}
</style>
