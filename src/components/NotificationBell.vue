<template>
  <v-menu v-model="menuOpen" :close-on-content-click="false" location="bottom end" offset="8">
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
                {{ item.title }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-wrap text-caption mt-1">
                {{ item.body }}
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
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import notificationService from '@/services/notification.service'

const { t, locale } = useI18n()
const router = useRouter()

const menuOpen = ref(false)
const loading = ref(false)
const markingAll = ref(false)
const notifications = ref([])
const unreadCount = ref(0)

let pollTimer = null
const POLL_INTERVAL = 60000 // refresh unread count every 60s

// ==================== Data ====================
const loadUnreadCount = async () => {
  try {
    const res = await notificationService.getUnreadCount()
    unreadCount.value = res?.unread_count ?? 0
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

// Load the full list whenever the menu opens.
watch(menuOpen, (open) => {
  if (open) loadNotifications()
})

onMounted(() => {
  loadUnreadCount()
  pollTimer = setInterval(loadUnreadCount, POLL_INTERVAL)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
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
</style>
