import { computed, ref } from 'vue'
import { useMessagingApi } from '@/composables/useMessagingApi'

// Shared across components: the clinic's WhatsApp messaging setting row.
const whatsappSetting = ref(null)
let pending = null

/**
 * Whether the server sends every new booking's confirmation on WhatsApp by
 * itself: the clinic sends by API and has "3. الحجز عبر الواتساب" switched on
 * (WhatsApp settings page). Same rule as BookingRequestMessenger on the API.
 *
 * While it is on, booking screens must not also open WhatsApp on the device.
 */
export function useBookingWhatsAppConfirmation() {
  const messagingApi = useMessagingApi()

  const autoConfirm = computed(() => {
    const setting = whatsappSetting.value
    if (!setting?.is_active) return false
    const meta = setting.meta || {}
    return (meta.send_mode || 'api') === 'api' && !!meta.booking_bot_enabled
  })

  // Re-read on each use so a change on the settings page applies without a reload.
  // A failed read keeps the last known value (off until it was ever read).
  const refresh = () => {
    pending ||= messagingApi.getSettings()
      .then((response) => {
        const rows = [].concat(response?.data ?? response ?? [])
        whatsappSetting.value = rows.find(row => row?.provider === 'whatsapp') || null
      })
      .catch(() => {})
      .finally(() => { pending = null })
    return pending
  }

  return { autoConfirm, refresh }
}
