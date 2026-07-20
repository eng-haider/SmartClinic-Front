/**
 * useBookingRequests Composable
 *
 * Shares a single reactive "pending booking requests" count across the app
 * (nav drawer badge + inbox page) using a module-scoped singleton ref, so
 * every consumer sees the same value without a full Pinia store.
 *
 * @author Clinic Management System
 */
import { ref } from 'vue'
import bookingRequestService from '@/services/bookingRequest.service'

// Module-scoped singletons — shared by every component that imports the composable.
const pendingCount = ref(0)
const loading = ref(false)

/**
 * Refresh the pending count from the API.
 * Fails silently so the nav badge can never break the layout.
 */
async function refreshPendingCount() {
  loading.value = true
  try {
    pendingCount.value = await bookingRequestService.pendingCount()
  } catch (err) {
    console.warn('Failed to load pending booking requests count', err)
  } finally {
    loading.value = false
  }
}

export function useBookingRequests() {
  return {
    pendingCount,
    loading,
    refreshPendingCount,
  }
}
