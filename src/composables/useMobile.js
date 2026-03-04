/**
 * Mobile Utilities Composable
 * أدوات الموبايل - Capacitor Native Features
 * 
 * Provides native mobile features when running on iOS/Android via Capacitor.
 * Falls back gracefully on web.
 * 
 * @version 1.0.0
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Capacitor } from '@capacitor/core'

// ==================== Platform Detection ====================

/** Check if running as a native mobile app */
const isNative = Capacitor.isNativePlatform()

/** Check if running on iOS */
const isIOS = Capacitor.getPlatform() === 'ios'

/** Check if running on Android */
const isAndroid = Capacitor.getPlatform() === 'android'

/** Check if running on web */
const isWeb = Capacitor.getPlatform() === 'web'

// ==================== Status Bar ====================

/**
 * Configure the native status bar
 */
async function setStatusBar(options = {}) {
  if (!isNative) return

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')

    const defaults = {
      style: Style.Light,
      color: '#17638D',
    }
    const config = { ...defaults, ...options }

    await StatusBar.setStyle({ style: config.style })

    if (isAndroid) {
      await StatusBar.setBackgroundColor({ color: config.color })
    }
  } catch (e) {
    console.warn('StatusBar plugin not available:', e)
  }
}

/**
 * Show the status bar
 */
async function showStatusBar() {
  if (!isNative) return
  try {
    const { StatusBar } = await import('@capacitor/status-bar')
    await StatusBar.show()
  } catch (e) {
    console.warn('StatusBar show failed:', e)
  }
}

/**
 * Hide the status bar
 */
async function hideStatusBar() {
  if (!isNative) return
  try {
    const { StatusBar } = await import('@capacitor/status-bar')
    await StatusBar.hide()
  } catch (e) {
    console.warn('StatusBar hide failed:', e)
  }
}

// ==================== Splash Screen ====================

/**
 * Hide the splash screen
 */
async function hideSplash() {
  if (!isNative) return
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  } catch (e) {
    console.warn('SplashScreen hide failed:', e)
  }
}

/**
 * Show the splash screen
 */
async function showSplash(options = {}) {
  if (!isNative) return
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.show({
      showDuration: 2000,
      autoHide: true,
      ...options,
    })
  } catch (e) {
    console.warn('SplashScreen show failed:', e)
  }
}

// ==================== Haptics ====================

/**
 * Trigger a light haptic feedback (for button taps)
 */
async function hapticLight() {
  if (!isNative) return
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch (e) {
    // Silently fail - haptics are optional
  }
}

/**
 * Trigger a medium haptic feedback (for toggles, selections)
 */
async function hapticMedium() {
  if (!isNative) return
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({ style: ImpactStyle.Medium })
  } catch (e) {
    // Silently fail
  }
}

/**
 * Trigger a success notification haptic
 */
async function hapticSuccess() {
  if (!isNative) return
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics')
    await Haptics.notification({ type: NotificationType.Success })
  } catch (e) {
    // Silently fail
  }
}

/**
 * Trigger an error notification haptic
 */
async function hapticError() {
  if (!isNative) return
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics')
    await Haptics.notification({ type: NotificationType.Error })
  } catch (e) {
    // Silently fail
  }
}

// ==================== Keyboard ====================

/**
 * Set up keyboard listeners for adjusting layout
 */
function useKeyboard() {
  const keyboardVisible = ref(false)
  const keyboardHeight = ref(0)

  let showListener = null
  let hideListener = null

  onMounted(async () => {
    if (!isNative) return
    try {
      const { Keyboard } = await import('@capacitor/keyboard')

      showListener = await Keyboard.addListener('keyboardWillShow', (info) => {
        keyboardVisible.value = true
        keyboardHeight.value = info.keyboardHeight
      })

      hideListener = await Keyboard.addListener('keyboardWillHide', () => {
        keyboardVisible.value = false
        keyboardHeight.value = 0
      })
    } catch (e) {
      console.warn('Keyboard plugin not available:', e)
    }
  })

  onUnmounted(() => {
    showListener?.remove()
    hideListener?.remove()
  })

  return { keyboardVisible, keyboardHeight }
}

// ==================== App Lifecycle ====================

/**
 * Listen for app state changes (foreground/background)
 */
function useAppState() {
  const isActive = ref(true)

  let stateListener = null

  onMounted(async () => {
    if (!isNative) return
    try {
      const { App } = await import('@capacitor/app')

      stateListener = await App.addListener('appStateChange', ({ isActive: active }) => {
        isActive.value = active
      })
    } catch (e) {
      console.warn('App plugin not available:', e)
    }
  })

  onUnmounted(() => {
    stateListener?.remove()
  })

  return { isActive }
}

/**
 * Handle hardware back button (Android)
 */
function useBackButton(callback) {
  let backListener = null

  onMounted(async () => {
    if (!isNative) return
    try {
      const { App } = await import('@capacitor/app')

      backListener = await App.addListener('backButton', ({ canGoBack }) => {
        if (callback) {
          callback(canGoBack)
        } else if (canGoBack) {
          window.history.back()
        } else {
          App.exitApp()
        }
      })
    } catch (e) {
      console.warn('App backButton listener failed:', e)
    }
  })

  onUnmounted(() => {
    backListener?.remove()
  })
}

// ==================== Secure Storage ====================

/**
 * Store a value securely using Capacitor Preferences
 */
async function setPreference(key, value) {
  try {
    const { Preferences } = await import('@capacitor/preferences')
    await Preferences.set({ key, value: JSON.stringify(value) })
  } catch (e) {
    // Fallback to localStorage on web
    localStorage.setItem(key, JSON.stringify(value))
  }
}

/**
 * Get a value from secure storage
 */
async function getPreference(key) {
  try {
    const { Preferences } = await import('@capacitor/preferences')
    const { value } = await Preferences.get({ key })
    return value ? JSON.parse(value) : null
  } catch (e) {
    // Fallback to localStorage on web
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  }
}

/**
 * Remove a value from secure storage
 */
async function removePreference(key) {
  try {
    const { Preferences } = await import('@capacitor/preferences')
    await Preferences.remove({ key })
  } catch (e) {
    localStorage.removeItem(key)
  }
}

// ==================== Initialize ====================

/**
 * Initialize all mobile-specific features on app startup.
 * Called from main.js after app mount.
 */
async function initMobileApp() {
  if (!isNative) {
    console.log('📱 Running on web — native features disabled')
    return
  }

  console.log(`📱 Running on ${Capacitor.getPlatform()} — initializing native features`)

  // Configure status bar
  await setStatusBar()

  // Hide splash screen after a short delay
  setTimeout(() => hideSplash(), 500)
}

// ==================== Composable Export ====================

/**
 * Main composable for mobile features
 * Usage: const { isNative, hapticLight, ... } = useMobile()
 */
export function useMobile() {
  return {
    // Platform
    isNative,
    isIOS,
    isAndroid,
    isWeb,

    // Status Bar
    setStatusBar,
    showStatusBar,
    hideStatusBar,

    // Splash Screen
    hideSplash,
    showSplash,

    // Haptics
    hapticLight,
    hapticMedium,
    hapticSuccess,
    hapticError,

    // Keyboard
    useKeyboard,

    // App Lifecycle
    useAppState,
    useBackButton,

    // Storage
    setPreference,
    getPreference,
    removePreference,
  }
}

// Named export for initialization
export { initMobileApp }

export default useMobile
