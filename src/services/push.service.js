import api from './api'

/**
 * Free browser push notifications (standard Web Push + VAPID, no third-party account).
 *
 * This browser subscribes with the backend's VAPID public key, and the subscription is stored
 * for the logged-in user. The backend then pushes every new notification; public/push-sw.js
 * shows it as a system notification and tells open tabs (NotificationBell listens).
 */

// The first install on a phone precaches the whole app, which can take well over 10s
const SW_READY_TIMEOUT = 30000

const isSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window

/** 'granted' | 'denied' | 'default' | 'unsupported' */
const permission = () => (isSupported() ? Notification.permission : 'unsupported')

const urlBase64ToUint8Array = (base64) => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

const sameKey = (buffer, key) => {
  const a = new Uint8Array(buffer)
  return a.length === key.length && a.every((byte, i) => byte === key[i])
}

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))])

// The PWA service worker (registered by PwaUpdatePrompt) carries the push handler
const readyRegistration = () => withTimeout(navigator.serviceWorker.ready, SW_READY_TIMEOUT)

/**
 * Make sure this browser's subscription is stored for the logged-in user. Safe to call on every
 * app load: it re-links the browser after another user logged in, refreshes the language, and
 * re-subscribes when the server keys changed. Does nothing until permission is granted.
 */
async function sync() {
  if (permission() !== 'granted') return false

  // Each step names itself in the error, so the bell can show where it broke (on a phone the
  // console is out of reach)
  const step = async (name, fn) => {
    try {
      return await fn()
    } catch (err) {
      const status = err?.response?.status
      const detail = err?.response?.data?.message || err?.message || String(err)
      throw new Error(`${name}${status ? ` (HTTP ${status})` : ''}: ${detail}`)
    }
  }

  const res = await step('server key', () => api.get('/notifications/push/public-key'))
  if (!res?.enabled || !res.public_key) throw new Error('server key: push is not configured on the server')
  const key = urlBase64ToUint8Array(res.public_key)

  const registration = await step('service worker', readyRegistration)
  let subscription = await step('browser subscription', () => registration.pushManager.getSubscription())

  // Subscribed with old server keys: pushes signed with the new ones would be rejected
  if (subscription?.options?.applicationServerKey && !sameKey(subscription.options.applicationServerKey, key)) {
    await subscription.unsubscribe()
    subscription = null
  }

  if (!subscription) {
    subscription = await step('browser subscription', () =>
      registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })
    )
  }

  const json = subscription.toJSON()
  await step('save on server', () => api.post('/notifications/push/subscribe', {
    endpoint: json.endpoint,
    keys: json.keys,
    content_encoding: (PushManager.supportedContentEncodings || []).includes('aes128gcm') ? 'aes128gcm' : 'aesgcm',
    locale: localStorage.getItem('locale') || 'ar'
  }))

  return true
}

/**
 * Ask for permission and subscribe. Must be called from a click (Safari and Firefox only
 * show the permission prompt in response to a user action).
 * @returns {Promise<'granted'|'denied'|'default'|'unsupported'>}
 */
async function enable() {
  if (!isSupported()) return 'unsupported'

  const result = await Notification.requestPermission()
  if (result === 'granted') {
    await sync()
  }

  return result
}

/**
 * Stop pushing to this browser for the current user. Call before the auth token is cleared on
 * logout, so a shared clinic PC does not keep receiving the previous user's notifications.
 * The browser subscription itself is kept, so the next login re-links it without a new prompt.
 */
async function unsubscribeCurrentUser() {
  if (!isSupported()) return

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    const subscription = await registration?.pushManager.getSubscription()
    if (subscription) {
      await withTimeout(api.post('/notifications/push/unsubscribe', { endpoint: subscription.endpoint }), 3000)
    }
  } catch (err) {
    console.warn('Failed to unlink push subscription', err)
  }
}

export default { isSupported, permission, sync, enable, unsubscribeCurrentUser }
