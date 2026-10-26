/*
 * Web Push handler, pulled into the Workbox-generated service worker through
 * workbox.importScripts in vite.config.js.
 *
 * The backend (App\Services\WebPushService) sends { notification_id, type, title, body, url }.
 * Every push is shown as a system notification (browsers require one per push), and open tabs
 * are told about it so NotificationBell refreshes and plays its sound without a page reload.
 */
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { body: event.data ? event.data.text() : '' }
  }

  const notify = self.registration.showNotification(data.title || 'SmartClinic', {
    body: data.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    dir: 'auto',
    // One entry per notification, so a re-delivered push does not show twice
    tag: data.notification_id ? `notification-${data.notification_id}` : undefined,
    data: { url: data.url || '/', notification_id: data.notification_id }
  })

  const tellTabs = self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((tabs) => tabs.forEach((tab) => tab.postMessage({ type: 'push-notification', payload: data })))

  event.waitUntil(Promise.all([notify, tellTabs]))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  // Only in-app links; anything else opens the dashboard
  const target = event.notification.data?.url || '/'
  const path = target.startsWith('/') ? target : '/'

  event.waitUntil((async () => {
    const tabs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const tab = tabs.find((t) => t.url.startsWith(self.location.origin))

    if (tab) {
      // Let the SPA route there (NotificationBell) instead of reloading the page
      await tab.focus()
      tab.postMessage({ type: 'push-notification-click', url: path })
      return
    }

    await self.clients.openWindow(path)
  })())
})
