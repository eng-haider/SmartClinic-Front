<template>
  <v-app>
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
          v-for="item in navItems"
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
        v-for="item in bottomNavItems"
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const router = useRouter()
const authStore = useAuthStore()

// Reactive state
const drawer = ref(true)
const rail = ref(false)
const isMobile = ref(false)

// Navigation items
const navItems = [
  { title: 'الرئيسية', icon: 'mdi-view-dashboard', to: '/' },
  { title: 'المراجعين', icon: 'mdi-account-group', to: '/patients' },
  { title: 'المواعيد', icon: 'mdi-calendar', to: '/appointments' },
  { title: 'الحالات', icon: 'mdi-file-document', to: '/cases' },
  { title: 'الفواتير', icon: 'mdi-receipt', to: '/bills' },
  { title: 'الإعدادات', icon: 'mdi-cog', to: '/settings' }
]

const bottomNavItems = [
  { title: 'الرئيسية', icon: 'mdi-home', to: '/' },
  { title: 'المراجعين', icon: 'mdi-account-group', to: '/patients' },
  { title: 'المواعيد', icon: 'mdi-calendar', to: '/appointments' },
  { title: 'الإعدادات', icon: 'mdi-cog', to: '/settings' }
]

// Computed
const userName = computed(() => authStore.user?.name || 'المستخدم')
const userPhone = computed(() => authStore.user?.phone || '')
const userInitials = computed(() => {
  const name = authStore.user?.name || 'U'
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
})

// Methods
const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 960
  if (isMobile.value) {
    drawer.value = false
  }
}

// Lifecycle
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
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
