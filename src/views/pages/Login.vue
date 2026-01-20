<template>
  <div class="login-page">
    <div class="bg-animation">
      <div class="circle c1"></div>
      <div class="circle c2"></div>
      <div class="circle c3"></div>
    </div>
    
    <div class="language-selector">
      <LanguageSwitcher />
    </div>
    
    <v-container fluid class="fill-height">
      <v-row class="fill-height" align="center" justify="center">
        <v-col cols="12" sm="8" md="6" lg="4">
          <v-card class="login-card pa-8" rounded="xl" elevation="20">
            <div class="text-center mb-6">
              <v-avatar size="80" color="primary" class="mb-4">
                <v-icon size="50" color="white">mdi-hospital-building</v-icon>
              </v-avatar>
              <h1 class="text-h5 font-weight-bold">{{ $t('app_name') }}</h1>
              <p class="text-grey">{{ $t('login.subtitle') }}</p>
            </div>
            
            <v-alert v-if="error" type="error" variant="tonal" class="mb-4" closable>
              {{ error }}
            </v-alert>
            
            <v-form @submit.prevent="login">
              <v-text-field
                v-model="phone"
                :label="$t('login.phone')"
                prepend-inner-icon="mdi-phone"
                variant="outlined"
                class="mb-3"
              ></v-text-field>
              
              <v-text-field
                v-model="password"
                :label="$t('login.password')"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="show ? 'mdi-eye-off' : 'mdi-eye'"
                :type="show ? 'text' : 'password'"
                variant="outlined"
                @click:append-inner="show = !show"
                class="mb-3"
              ></v-text-field>
              
              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                :loading="loading"
                class="mt-4"
              >
                {{ $t('login.submit') }}
              </v-btn>
            </v-form>
            
            <div class="text-center mt-6">
              <span>{{ $t('login.no_account') }}</span>
              <router-link to="/register" class="text-primary font-weight-bold ms-1">
                {{ $t('login.register_link') }}
              </router-link>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authNew'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const phone = ref('')
const password = ref('')
const show = ref(false)
const loading = ref(false)
const error = ref('')

async function login() {
  console.log('Login function called')
  console.log('Phone:', phone.value)
  console.log('Password:', password.value ? '***' : 'empty')
  
  // Validate inputs
  if (!phone.value || !password.value) {
    error.value = t('validation.required')
    console.log('Validation failed: missing phone or password')
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    console.log('Calling authStore.login...')
    const result = await authStore.login(phone.value, password.value)
    console.log('Login result:', result)
    
    if (result.success) {
      console.log('Login successful, redirecting to dashboard')
      console.log('isAuthenticated:', authStore.isAuthenticated)
      console.log('Token in localStorage:', localStorage.getItem('auth_token'))
      console.log('Token in store:', authStore.token)
      
      // Force reload to ensure auth state is fresh
      window.location.href = '/dashboard'
    } else {
      console.log('Login failed:', result.message)
      error.value = result.message || t('login.error')
    }
  } catch (e) {
    console.error('Login error:', e)
    error.value = t('login.error')
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
.login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  animation: float 15s infinite;
}

.c1 { width: 300px; height: 300px; top: -100px; right: -100px; }
.c2 { width: 200px; height: 200px; bottom: 50px; left: 50px; animation-delay: -5s; }
.c3 { width: 150px; height: 150px; top: 50%; left: 30%; animation-delay: -10s; }

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, -30px); }
}

.login-card {
  background: rgba(255,255,255,0.95) !important;
  backdrop-filter: blur(10px);
}
</style>
