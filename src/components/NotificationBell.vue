<template>
  <v-menu v-bind="$attrs" v-model="menuOpen" :close-on-content-click="false" location="bottom end" offset="8">
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" icon variant="text" color="white">
        <v-badge
          :content="unreadCount"
          :model-value="unreadCount > 0"
          color="error"
          max="99"
        >
          <v-icon>mdi-bell-outline</v-icon>
        </v-badge>
        <v-tooltip activator="parent" location="bottom">{{ t('notifications.title') }}</v-tooltip>
      </v-btn>
    </template>

    <v-card min-width="340" max-width="420" class="notification-menu">
      <!-- Header -->
      <v-card-title class="d-flex align-center py-2 px-4">
        <span class="text-subtitle-1 font-weight-bold">{{ t('notifications.title') }}</span>
        <v-spacer />
        <v-btn
          v-if="unreadCount > 0"
          variant="text"
          size="small"
          color="primary"
          :loading="markingAll"
          @click="markAllRead"
        >
          {{ t('notifications.markAllRead') }}
        </v-btn>
      </v-card-title>

      <v-divider />

      <!-- Browser notifications: offer to enable, or explain they are blocked -->
      <div v-if="pushPermission === 'default'" class="d-flex align-center px-4 py-2 push-banner">
        <v-icon color="primary" class="me-2">mdi-bell-ring-outline</v-icon>
        <span class="text-caption flex-grow-1">{{ t('notifications.enablePushHint') }}</span>
        <v-btn size="small" color="primary" variant="flat" :loading="enablingPush" @click="enablePush">
          {{ t('notifications.enablePush') }}
        </v-btn>
      </div>
      <div v-else-if="pushPermission === 'denied'" class="d-flex align-center px-4 py-2 push-banner">
        <v-icon color="warning" class="me-2">mdi-bell-off-outline</v-icon>
        <span class="text-caption">{{ t('notifications.pushBlocked') }}</span>
      </div>
      <!-- Allowed, but this device could not be registered: say why, so it can be fixed -->
      <div v-else-if="pushPermission === 'granted' && pushError" class="d-flex align-center px-4 py-2 push-banner">
        <v-icon color="error" class="me-2">mdi-bell-alert-outline</v-icon>
        <div class="flex-grow-1">
          <div class="text-caption">{{ t('notifications.pushFailed') }}</div>
          <div class="text-caption text-medium-emphasis push-error-detail" dir="ltr">{{ pushError }}</div>
        </div>
        <v-btn size="small" color="primary" variant="tonal" :loading="enablingPush" @click="syncPush">
          {{ t('common.retry') }}
        </v-btn>
      </div>
      <v-divider v-if="pushPermission === 'default' || pushPermission === 'denied' || (pushPermission === 'granted' && pushError)" />

      <!-- Body -->
      <div class="notification-list">
        <div v-if="loading" class="d-flex justify-center py-6">
          <v-progress-circular indeterminate color="primary" size="28" />
        </div>

        <v-list v-else-if="notifications.length" density="compact" class="py-0">
          <template v-for="(item, index) in notifications" :key="item.id">
            <v-list-item
              :class="{ 'notification-unread': !item.is_read }"
              @click="onNotificationClick(item)"
            >
              <template v-slot:prepend>
                <v-avatar :color="iconColor(item)" size="36" variant="tonal">
                  <v-icon size="20">{{ iconFor(item) }}</v-icon>
                </v-avatar>
              </template>

              <v-list-item-title class="text-wrap text-body-2 font-weight-medium">
                {{ titleOf(item) }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-wrap text-caption mt-1">
                {{ bodyOf(item) }}
              </v-list-item-subtitle>
              <div class="text-caption text-medium-emphasis mt-1">
                {{ formatTime(item.created_at) }}
              </div>

              <template v-slot:append>
                <v-btn
                  icon="mdi-close"
                  size="x-small"
                  variant="text"
                  @click.stop="removeNotification(item)"
                />
              </template>
            </v-list-item>
            <v-divider v-if="index < notifications.length - 1" />
          </template>
        </v-list>

        <div v-else class="d-flex flex-column align-center justify-center py-8 text-medium-emphasis">
          <v-icon size="40" class="mb-2">mdi-bell-off-outline</v-icon>
          <span class="text-body-2">{{ t('notifications.empty') }}</span>
        </div>
      </div>
    </v-card>
  </v-menu>

  <!-- In-app popup for each new notification. Shows while the app is open even when the
       OS hides browser notifications (e.g. macOS notifications off for Chrome). -->
  <v-snackbar
    v-model="toastOpen"
    :location="toastLocation"
    :timeout="8000"
    color="surface"
    elevation="8"
    multi-line
  >
    <div v-if="currentToast" class="d-flex align-start ga-3 toast-body" @click="openToast">
      <v-avatar :color="iconColor(currentToast)" size="36" variant="tonal">
        <v-icon size="20">{{ iconFor(currentToast) }}</v-icon>
      </v-avatar>
      <div>
        <div class="text-body-2 font-weight-bold">{{ titleOf(currentToast) }}</div>
        <div class="text-caption mt-1">{{ bodyOf(currentToast) }}</div>
      </div>
    </div>
    <template v-slot:actions>
      <v-btn icon="mdi-close" size="small" variant="text" @click="toastOpen = false" />
    </template>
  </v-snackbar>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useRtl } from 'vuetify'
import notificationService from '@/services/notification.service'
import pushService from '@/services/push.service'
import { initNotificationSound, playNotificationSound } from '@/utils/notificationSound'

// Two root nodes (menu + popup): keep passing the parent's attrs to the menu as before
defineOptions({ inheritAttrs: false })

const { t, locale } = useI18n()
const router = useRouter()

const menuOpen = ref(false)
const loading = ref(false)
const markingAll = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const pushPermission = ref(pushService.permission())
const enablingPush = ref(false)
const pushError = ref('') // why this device could not be registered for push, if it failed

let pollTimer = null
// Pushes refresh the bell instantly; polling is the fallback when they are off or blocked
const POLL_INTERVAL = 30000
let countLoaded = false

// The API stores one title/body (English); the Arabic copy rides along in data.
const titleOf = (item) => (locale.value === 'ar' && item.data?.title_ar) || item.title
const bodyOf = (item) => (locale.value === 'ar' && item.data?.body_ar) || item.body

// ==================== Data ====================
// Chime whenever the server count goes up (a push or a poll found something new). Local
// read/delete actions only lower the count, so they never chime.
const applyServerCount = (count) => {
  if (countLoaded && count > unreadCount.value) {
    playNotificationSound()
    showNewToasts()
    if (menuOpen.value) loadNotifications()
  }
  unreadCount.value = count
  countLoaded = true
}

// ==================== Popup ====================
// Newest notification id already seen; null until the first fetch sets the baseline,
// so notifications that existed before the page loaded never pop up.
let lastSeenId = null
const toastQueue = []
const toastOpen = ref(false)
const currentToast = ref(null)
let nextToastTimer = null

// Vuetify mirrors left/right in RTL; keep the popup on the screen's right like OS notifications
const { isRtl } = useRtl()
const toastLocation = computed(() => (isRtl.value ? 'bottom left' : 'bottom right'))

const showNextToast = () => {
  currentToast.value = toastQueue.shift() || null
  toastOpen.value = !!currentToast.value
}

const queueToast = (item) => {
  toastQueue.push(item)
  if (!toastOpen.value && !nextToastTimer) showNextToast()
}

// One popup at a time: after one closes, let its leave transition finish, then show the next
watch(toastOpen, (open) => {
  if (!open && toastQueue.length && !nextToastTimer) {
    nextToastTimer = setTimeout(() => {
      nextToastTimer = null
      showNextToast()
    }, 300)
  }
})

const showNewToasts = async () => {
  try {
    const res = await notificationService.getAll({ limit: 5 })
    const latest = res?.data ?? []
    if (lastSeenId !== null) {
      latest
        .filter((n) => n.id > lastSeenId && !n.is_read)
        .reverse() // oldest first
        .forEach(queueToast)
    }
    lastSeenId = Math.max(lastSeenId ?? 0, ...latest.map((n) => n.id))
  } catch (err) {
    console.warn('Failed to load new notifications', err)
  }
}

const openToast = () => {
  const item = currentToast.value
  toastOpen.value = false
  if (item) onNotificationClick(item)
}

const loadUnreadCount = async () => {
  try {
    const res = await notificationService.getUnreadCount()
    applyServerCount(res?.unread_count ?? 0)
  } catch (err) {
    // Silent: the bell should never break the layout.
    console.warn('Failed to load notification count', err)
  }
}

const loadNotifications = async () => {
  loading.value = true
  try {
    const res = await notificationService.getAll({ limit: 30 })
    notifications.value = res?.data ?? []
    if (typeof res?.unread_count === 'number') {
      unreadCount.value = res.unread_count
    }
  } catch (err) {
    console.warn('Failed to load notifications', err)
    notifications.value = []
  } finally {
    loading.value = false
  }
}

// ==================== Actions ====================
const onNotificationClick = async (item) => {
  if (!item.is_read) {
    try {
      await notificationService.markAsRead(item.id)
      item.is_read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch (err) {
      console.warn('Failed to mark notification as read', err)
    }
  }

  if (item.action_url) {
    menuOpen.value = false
    // Only follow in-app relative links to avoid leaving the SPA.
    if (item.action_url.startsWith('/')) {
      router.push(item.action_url)
    }
  }
}

const markAllRead = async () => {
  markingAll.value = true
  try {
    await notificationService.markAllAsRead()
    notifications.value.forEach((n) => { n.is_read = true })
    unreadCount.value = 0
  } catch (err) {
    console.warn('Failed to mark all as read', err)
  } finally {
    markingAll.value = false
  }
}

const removeNotification = async (item) => {
  try {
    await notificationService.remove(item.id)
    const wasUnread = !item.is_read
    notifications.value = notifications.value.filter((n) => n.id !== item.id)
    if (wasUnread) {
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  } catch (err) {
    console.warn('Failed to delete notification', err)
  }
}

// ==================== Presentation ====================
const iconFor = (item) => {
  switch (item.type) {
    case 'alert': return 'mdi-alert-outline'
    case 'appointment': return 'mdi-calendar-clock'
    case 'payment': return 'mdi-cash'
    case 'case': return 'mdi-clipboard-text-outline'
    case 'reminder': return 'mdi-bell-ring-outline'
    default: return 'mdi-information-outline'
  }
}

const iconColor = (item) => {
  if (item.priority === 'urgent' || item.priority === 'high') return 'error'
  if (item.type === 'payment') return 'success'
  return 'primary'
}

const formatTime = (iso) => {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const localeMap = { ar: 'ar', ku: 'ar', en: 'en', pl: 'pl' }
  const intlLocale = localeMap[locale.value] || 'en'
  return date.toLocaleString(intlLocale, {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

// ==================== Browser push ====================
const enablePush = async () => {
  enablingPush.value = true
  pushError.value = ''
  try {
    pushPermission.value = await pushService.enable()
  } catch (err) {
    console.warn('Failed to enable browser notifications', err)
    pushError.value = err?.message || String(err)
  } finally {
    pushPermission.value = pushService.permission()
    enablingPush.value = false
  }
}

// Link this browser to whoever is logged in (no prompt; only once permission is granted)
const syncPush = async () => {
  if (!pushService.isSupported()) return
  enablingPush.value = true
  try {
    await pushService.sync()
    pushError.value = ''
  } catch (err) {
    console.warn('Failed to sync push subscription', err)
    pushError.value = err?.message || String(err)
  } finally {
    pushPermission.value = pushService.permission()
    enablingPush.value = false
  }
}

// Messages from the service worker (public/push-sw.js)
const onServiceWorkerMessage = (event) => {
  if (event.data?.type === 'push-notification') {
    loadUnreadCount()
  } else if (event.data?.type === 'push-notification-click' && event.data.url?.startsWith('/')) {
    router.push(event.data.url)
  }
}

// Load the full list whenever the menu opens; retry a failed push registration too.
watch(menuOpen, (open) => {
  if (!open) return
  loadNotifications()
  if (pushError.value) syncPush()
})

// The push text follows the UI language
watch(locale, () => {
  syncPush()
})

onMounted(() => {
  initNotificationSound()
  loadUnreadCount()
  showNewToasts() // sets the baseline only
  pollTimer = setInterval(loadUnreadCount, POLL_INTERVAL)

  if (pushService.isSupported()) {
    navigator.serviceWorker.addEventListener('message', onServiceWorkerMessage)
    // Re-link this browser to whoever is logged in now (no prompt; only if already allowed)
    syncPush()
  }
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (nextToastTimer) clearTimeout(nextToastTimer)
  if (pushService.isSupported()) {
    navigator.serviceWorker.removeEventListener('message', onServiceWorkerMessage)
  }
})
</script>

<style scoped>
.notification-list {
  max-height: 60vh;
  overflow-y: auto;
}
.notification-unread {
  background-color: rgba(var(--v-theme-primary), 0.06);
}
.push-banner {
  background-color: rgba(var(--v-theme-primary), 0.04);
  gap: 4px;
}
.toast-body {
  cursor: pointer;
}
.push-error-detail {
  word-break: break-word;
}
</style>
