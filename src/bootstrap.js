// Keep the entry small and free of CSS imports so the HTML loading screen can
// paint while Vite fetches the application's JavaScript and styles together.
import('./main.js').catch((error) => {
  console.error('Failed to load the app:', error)
  window.dispatchEvent(new Event('app:startup-error'))
})
