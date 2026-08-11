<template>
  <v-app :class="{ 'flutter-app': isFlutterApp }">
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

    <!-- App Bar (shown on all screens, hidden in Flutter WebView) -->
    <v-app-bar v-if="!isFlutterApp" color="primary" elevation="2">
      <v-app-bar-nav-icon @click="drawer = !drawer" class="d-md-none"></v-app-bar-nav-icon>
      
      <v-toolbar-title>
        <v-img src="/logo-white.png" alt="SmartClinic" height="76" width="76" class="ms-1" />
      </v-toolbar-title>
      
      <v-spacer></v-spacer>
      
      <!-- Refresh Button -->
      <v-btn icon variant="text" color="white" class="me-1" @click="reloadPage">
        <v-icon>mdi-refresh</v-icon>
        <v-tooltip activator="parent" location="bottom">تحديث الصفحة</v-tooltip>
      </v-btn>

      <!-- Notifications -->
      <NotificationBell class="me-1" />

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
            <v-list-item-title>{{ t('layout.logout') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <!-- No click-to-expand on the drawer itself: on a tablet the rail is the
         resting state, so tapping a nav icon must navigate and leave the rail
         alone. Expanding is the toggle button below, and nothing else. -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      :permanent="!isMobile"
    >
      <!-- Rail: just the toggle, since a title/append would be clipped away -->
      <v-list-item v-if="rail" nav @click.stop="rail = false">
        <template v-slot:prepend>
          <v-icon>mdi-menu</v-icon>
        </template>
      </v-list-item>

      <v-list-item
        v-else
        :title="t('layout.dashboard')"
        nav
      >
        <template v-slot:prepend>
          <v-img src="/logo.png" alt="SmartClinic" width="28" height="28" class="me-3" />
        </template>
        <template v-slot:append>
          <v-btn
            variant="text"
            icon="mdi-menu-open"
            @click.stop="rail = true"
          ></v-btn>
        </template>
      </v-list-item>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <template v-for="item in filteredNavItems" :key="item.key">
          <!-- Group item with children -->
          <v-list-group v-if="item.children && item.children.length" :value="item.key">
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                :prepend-icon="item.icon"
                :title="item.title"
                color="primary"
              ></v-list-item>
            </template>
            <v-list-item
              v-for="child in item.children"
              :key="child.to"
              :to="child.to"
              :prepend-icon="child.icon"
              :title="child.title"
              color="primary"
            ></v-list-item>
          </v-list-group>
          <!-- Regular item -->
          <v-list-item
            v-else
            :to="item.to"
            :prepend-icon="item.icon"
            :title="item.title"
            color="primary"
          >
            <template v-if="item.key === 'booking-requests' && bookingPendingCount > 0" #append>
              <v-badge :content="bookingPendingCount" color="error" inline max="99" />
            </template>
          </v-list-item>
        </template>
      </v-list>

      <!-- Logout button (mobile only) -->
      <v-divider  class="my-2"></v-divider>
      <v-list  density="compact">
        <v-list-item @click="handleLogout" prepend-icon="mdi-logout">
          <v-list-item-title>{{ t('layout.logout') }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <router-view></router-view>
    </v-main>

    <!-- AI Chatbot Widget -->
    <AiChatWidget ref="aiChatRef" />

    <!-- Bottom Tab Bar (mobile only, hidden in Flutter WebView) -->
    <div v-if="isMobile && !isFlutterApp" class="bottom-tab-bar">
      <!-- Hamburger menu button -->
      <button
        class="tab-item"
        @click="drawer = !drawer"
      >
        <v-icon size="22">mdi-menu</v-icon>
        <span class="tab-label">القائمة</span>
      </button>
      <button
        v-for="item in filteredBottomNavItems"
        :key="item.to"
        class="tab-item"
        :class="{ 'tab-active': isActiveRoute(item.to) }"
        @click="navigateTo(item.to)"
      >
        <v-icon size="22">{{ item.icon }}</v-icon>
        <span class="tab-label">{{ item.title }}</span>
      </button>
      <!-- AI Chatbot Tab -->
      <button
        class="tab-item"
        @click="aiChatRef?.openChat()"
      >
        <v-icon size="22">mdi-robot</v-icon>
        <span class="tab-label">المساعد</span>
      </button>
    </div>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authNew'
import { usePermissions } from '@/composables/usePermissions'
import { useBookingRequests } from '@/composables/useBookingRequests'
import { setupPermissionWatcher } from '@/utils/permissionWatcher'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import NotificationBell from '@/components/NotificationBell.vue'
import AiChatWidget from '@/components/AiChatWidget.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
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
const isTablet = ref(false)
const aiChatRef = ref(null)

// Pending booking requests badge (shared count + polling)
const { pendingCount: bookingPendingCount, refreshPendingCount } = useBookingRequests()
let bookingPollTimer = null
const BOOKING_POLL_INTERVAL = 60000 // refresh pending count every 60s

// Detect Flutter WebView: persists for the session
const isFlutterApp = ref(false)
const initFlutterDetection = () => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('source') === 'app') {
    sessionStorage.setItem('source', 'app')
  }
  isFlutterApp.value = sessionStorage.getItem('source') === 'app'
}
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

// Check if current route is active (for tab highlighting)
const isActiveRoute = (path) => {
  if (path === '/' || path === '/dashboard') {
    return route.path === '/' || route.path === '/dashboard'
  }
  return route.path.startsWith(path)
}

// Navigate to route
const navigateTo = (path) => {
  router.push(path)
}

// Methods
const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const reloadPage = () => {
  window.location.reload()
}

// Tablet = iPad-sized landscape (iPad 1024, Air 1180, Pro 11" 1194). Below 960 the
// drawer is already a mobile overlay; 1280+ has room for the labelled list.
const TABLET_MIN = 960
const TABLET_MAX = 1280

let lastBreakpoint = null

const checkMobile = () => {
  const width = window.innerWidth
  isMobile.value = width < TABLET_MIN
  isTablet.value = width >= TABLET_MIN && width < TABLET_MAX

  const breakpoint = isMobile.value ? 'mobile' : isTablet.value ? 'tablet' : 'desktop'
  // Only react when the size class actually changes — iPad fires resize when the
  // browser chrome hides on scroll, and re-railing there would undo a manual toggle.
  if (breakpoint !== lastBreakpoint) {
    lastBreakpoint = breakpoint
    rail.value = breakpoint === 'tablet'
  }

  if (isMobile.value) {
    drawer.value = false
  }
}

// Load user data on mount
onMounted(async () => {
  initFlutterDetection()
  checkMobile()
  window.addEventListener('resize', checkMobile)
  
  // Ensure user data is loaded for permission checks
  if (authStore.isAuthenticated && !authStore.user) {
    await authStore.loadUser()
  }

  // Load + poll pending booking requests count for the nav badge
  refreshPendingCount()
  bookingPollTimer = setInterval(refreshPendingCount, BOOKING_POLL_INTERVAL)

  // Debug permissions in development
  if (import.meta.env.DEV) {
    debugPermissions()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  if (bookingPollTimer) clearInterval(bookingPollTimer)
})
</script>

<style scoped>
/* ==================== App Bar (Safe Area Support) ==================== */
:deep(.v-toolbar) {
  padding-top: env(safe-area-inset-top, 0px);
}

/* ==================== Navigation Drawer (Safe Area Support) ==================== */
:deep(.v-navigation-drawer) {
  padding-top: env(safe-area-inset-top, 0px) !important;
}

@media (max-width: 959px) {
  :deep(.v-navigation-drawer) {
    margin-top: 0 !important;
    top: 0 !important;
  }
}

/* ==================== Main Content (Enable Scroll) ==================== */
:deep(.v-main) {
  padding-bottom: calc(65px + env(safe-area-inset-bottom, 0px)) !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  -webkit-overflow-scrolling: touch !important;
  height: 100vh !important;
}

@media (max-width: 959px) {
  :deep(.v-main) {
    padding-top: calc(56px + env(safe-area-inset-top, 0px)) !important;
  }
}

/* Remove app bar & bottom bar padding when in Flutter WebView */
.flutter-app :deep(.v-main) {
  padding-top: 0px !important;
  padding-bottom: 0px !important;
}

:deep(.v-main__wrap) {
  overflow-y: auto !important;
  overflow-x: hidden !important;
  -webkit-overflow-scrolling: touch !important;
}

/* ==================== Bottom Tab Bar ==================== */
.bottom-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
  background: #17638D;
  height: calc(60px + env(safe-area-inset-bottom, 0px));
  padding-top: 6px;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.15);
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 54px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 4px 2px;
  transition: color 0.2s;
  -webkit-tap-highlight-color: transparent;
  outline: none;
}

.tab-item:active {
  transform: scale(0.93);
}

.tab-item.tab-active {
  color: #ffffff;
}

.tab-item.tab-active .tab-label {
  font-weight: 700;
}

.tab-label {
  font-size: 10px;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 72px;
  font-family: "Cairo", sans-serif;
}
</style>
