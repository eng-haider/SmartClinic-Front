<template>
  <v-app>
    <!-- Permission Change Notification -->
    <v-snackbar
      v-model="showPermissionNotification"
      :timeout="6000"
      color="info"
      location="top"
    >
      <v-icon start>mdi-shield-refresh</v-icon>
      {{ permissionNotificationMessage }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="reloadPage"
        >
          تحديث
        </v-btn>
        <v-btn
          color="white"
          variant="text"
          @click="showPermissionNotification = false"
        >
          إغلاق
        </v-btn>
      </template>
    </v-snackbar>

    <!-- App Bar -->
    <v-app-bar color="primary" elevation="2">
      <v-app-bar-nav-icon @click="drawer = !drawer" class="d-md-none"></v-app-bar-nav-icon>
      
      <v-toolbar-title class="text-white font-weight-bold">
        منصة العياده الذكيه
      </v-toolbar-title>
      
      <v-spacer></v-spacer>
      
      <!-- Language Switcher -->
      <LanguageSwitcher class="me-2" />
      
      <!-- User Menu -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-avatar color="white" size="36">
              <span class="primary--text font-weight-bold">
                {{ userInitials }}
              </span>
            </v-avatar>
          </v-btn>
        </template>
        <v-list>
          <v-list-item>
            <v-list-item-title>{{ userName }}</v-list-item-title>
            <v-list-item-subtitle>{{ userPhone }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <v-list-item-subtitle class="text-caption">
              {{ userRoleDisplay }}
            </v-list-item-subtitle>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item @click="handleLogout" prepend-icon="mdi-logout">
            <v-list-item-title>تسجيل الخروج</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      :permanent="!isMobile"
      @click="rail = false"
    >
      <v-list-item
        prepend-icon="mdi-hospital-building"
        title="لوحة التحكم"
        nav
      >
        <template v-slot:append>
          <v-btn
            variant="text"
            icon="mdi-chevron-left"
            @click.stop="rail = !rail"
          ></v-btn>
        </template>
      </v-list-item>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item
          v-for="item in filteredNavItems"
          :key="item.to"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          color="primary"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <router-view></router-view>
    </v-main>

    <!-- Mobile Bottom Navigation -->
    <v-bottom-navigation
      v-if="isMobile"
      grow
      color="primary"
      class="d-md-none"
    >
      <v-btn
        v-for="item in filteredBottomNavItems"
        :key="item.to"
        :to="item.to"
      >
        <v-icon>{{ item.icon }}</v-icon>
        <span>{{ item.title }}</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authNew'
import { usePermissions } from '@/composables/usePermissions'
import { setupPermissionWatcher } from '@/utils/permissionWatcher'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const router = useRouter()
const authStore = useAuthStore()
const { 
  filteredNavItems, 
  filteredBottomNavItems, 
  userRole, 
  setLanguage,
  debugPermissions 
} = usePermissions()

// Reactive state
const drawer = ref(true)
const rail = ref(false)
const isMobile = ref(false)
const currentLang = ref(localStorage.getItem('lang') || 'ar')
const showPermissionNotification = ref(false)
const permissionNotificationMessage = ref('')

// Watch for language changes
watch(() => localStorage.getItem('lang'), (newLang) => {
  if (newLang) {
    currentLang.value = newLang
    setLanguage(newLang)
  }
})

// Setup permission change watcher
setupPermissionWatcher((changes) => {
  const lang = currentLang.value
  const messages = {
    ar: 'تم تحديث صلاحياتك. يرجى إعادة تحميل الصفحة.',
    en: 'Your permissions have been updated. Please reload the page.',
    ku: 'مۆڵەتەکانت نوێکراونەتەوە. تکایە پەڕەکە نوێ بکەرەوە.'
  }
  
  permissionNotificationMessage.value = messages[lang] || messages.ar
  showPermissionNotification.value = true
  
  console.log('🔔 Permission changes detected:', changes)
})

// Role display names
const roleNames = {
  super_admin: { ar: 'مدير النظام', en: 'Super Admin', ku: 'بەڕێوەبەری سیستەم' },
  clinic_super_doctor: { ar: 'طبيب رئيسي', en: 'Clinic Super Doctor', ku: 'دکتۆری سەرەکی' },
  doctor: { ar: 'طبيب', en: 'Doctor', ku: 'دکتۆر' },
  secretary: { ar: 'سكرتير', en: 'Secretary', ku: 'سکرتێر' }
}

// Computed
const userName = computed(() => authStore.user?.name || 'المستخدم')
const userPhone = computed(() => authStore.user?.phone || '')
const userInitials = computed(() => {
  const name = authStore.user?.name || 'U'
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
})

// Get role display name based on current language
const userRoleDisplay = computed(() => {
  const role = userRole.value
  if (!role) return ''
  
  const names = roleNames[role]
  if (names) {
    return names[currentLang.value] || names.ar || role
  }
  return role
})

// Methods
const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 960
  if (isMobile.value) {
    drawer.value = false
  }
}

const reloadPage = () => {
  window.location.reload()
}

// Load user data on mount
onMounted(async () => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  // Ensure user data is loaded for permission checks
  if (authStore.isAuthenticated && !authStore.user) {
    await authStore.loadUser()
  }
  
  // Debug permissions in development
  if (import.meta.env.DEV) {
    debugPermissions()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.v-main {
  background-color: #f5f5f5;
}
</style>
