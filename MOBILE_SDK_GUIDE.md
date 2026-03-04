# 📱 SmartClinic Mobile SDK — Ionic + Capacitor Setup

## Overview

The SmartClinic web app has been integrated with **Ionic Framework** and **Capacitor** to enable native iOS and Android builds from the same codebase.

### Architecture

```
┌──────────────────────────────────────┐
│          SmartClinic App             │
│   Vue 3 + Vuetify + Ionic + i18n    │
├──────────────────────────────────────┤
│        Capacitor Bridge             │
│  (Native APIs: Camera, Storage…)    │
├───────────────┬──────────────────────┤
│   iOS (Swift) │  Android (Kotlin)   │
└───────────────┴──────────────────────┘
```

---

## What Changed

| File                           | Change                                      |
| ------------------------------ | ------------------------------------------- |
| `package.json`                 | Added Ionic/Capacitor deps + mobile scripts |
| `main.js`                      | Registered `IonicVue` plugin + Ionic CSS    |
| `App.vue`                      | Wrapped in `<ion-app>` for native container |
| `router/index.js`              | Using `@ionic/vue-router`                   |
| `index.html`                   | Added mobile viewport meta tags             |
| `capacitor.config.ts`          | Capacitor configuration (app ID, plugins)   |
| `src/composables/useMobile.js` | Native features composable                  |
| `src/styles/mobile.css`        | Mobile-specific styles + safe areas         |

---

## Quick Start

### 1. Run on Web (unchanged)

```bash
npm run dev
```

### 2. Add Native Platforms

```bash
# Add iOS (requires macOS + Xcode)
npm run mobile:add:ios

# Add Android (requires Android Studio)
npm run mobile:add:android
```

### 3. Build & Open in IDE

```bash
# Build + open in Xcode
npm run mobile:ios

# Build + open in Android Studio
npm run mobile:android
```

### 4. Sync After Changes

```bash
npm run mobile:sync
```

---

## Using Mobile Features

### In any component:

```vue
<script setup>
import { useMobile } from "@/composables/useMobile";

const {
  isNative,
  isIOS,
  isAndroid,
  hapticLight,
  hapticSuccess,
  hapticError,
  useKeyboard,
  useBackButton,
} = useMobile();

// Haptic feedback on button press
const handleSave = async () => {
  await saveData();
  hapticSuccess(); // Vibration on native, no-op on web
};

// Keyboard tracking
const { keyboardVisible, keyboardHeight } = useKeyboard();

// Android back button
useBackButton((canGoBack) => {
  if (canGoBack) {
    window.history.back();
  }
});
</script>
```

### Secure Storage:

```js
import { useMobile } from "@/composables/useMobile";

const { setPreference, getPreference, removePreference } = useMobile();

// Store auth token securely
await setPreference("auth_token", token);

// Retrieve it
const token = await getPreference("auth_token");

// Remove it
await removePreference("auth_token");
```

---

## Available NPM Scripts

| Script                       | Description                        |
| ---------------------------- | ---------------------------------- |
| `npm run dev`                | Start dev server (web)             |
| `npm run build`              | Production build                   |
| `npm run mobile:sync`        | Sync web build to native platforms |
| `npm run mobile:ios`         | Build + open in Xcode              |
| `npm run mobile:android`     | Build + open in Android Studio     |
| `npm run mobile:add:ios`     | Add iOS platform                   |
| `npm run mobile:add:android` | Add Android platform               |

---

## Capacitor Config

Edit `capacitor.config.ts` to customize:

- **appId**: `com.smartclinic.app` (change for App Store)
- **Splash Screen**: Color, duration, spinner
- **Status Bar**: Style, background color
- **Keyboard**: Resize behavior

---

## Requirements

| Platform    | Requirements                  |
| ----------- | ----------------------------- |
| **Web**     | Any modern browser            |
| **iOS**     | macOS + Xcode 15+ + CocoaPods |
| **Android** | Android Studio + JDK 17+      |

---

## Notes

- **Vuetify is preserved** — all existing UI components continue to work
- **Ionic provides** the native app shell (`IonApp`) and page transitions
- **Capacitor** bridges native device APIs (camera, storage, haptics, etc.)
- Safe area insets are handled automatically via `mobile.css`
- The app detects platform automatically — no code changes needed per platform
