# 🚀 Quick Start — Running SmartClinic Mobile

## ✅ Setup Complete!

iOS and Android platforms have been successfully added to your project.

---

## 📱 Running on Mobile

### Option 1: Web (Development)

```bash
npm run dev
# Opens at http://localhost:8080
```

### Option 2: iOS (Native)

```bash
npm run mobile:ios
```

This will:

1. Build your web app
2. Sync to iOS project
3. Open Xcode

**Then in Xcode:**

- Select a simulator (e.g., iPhone 15 Pro)
- Click ▶️ Run

### Option 3: Android (Native)

```bash
npm run mobile:android
```

This will:

1. Build your web app
2. Sync to Android project
3. Open Android Studio

**Then in Android Studio:**

- Select an emulator or connected device
- Click ▶️ Run

---

## 🔄 Workflow

Whenever you make changes to your web code:

```bash
# 1. Build the web app
npm run build

# 2. Sync to native platforms
npm run mobile:sync

# 3. Re-run from Xcode/Android Studio
```

---

## 📦 What Was Installed

| Package                    | Purpose                             |
| -------------------------- | ----------------------------------- |
| `@ionic/vue`               | Ionic components for Vue            |
| `@ionic/vue-router`        | Router with native page transitions |
| `@capacitor/core`          | Capacitor core library              |
| `@capacitor/ios`           | iOS platform                        |
| `@capacitor/android`       | Android platform                    |
| `@capacitor/app`           | App lifecycle, back button          |
| `@capacitor/status-bar`    | Native status bar control           |
| `@capacitor/splash-screen` | Splash screen control               |
| `@capacitor/haptics`       | Vibration/haptic feedback           |
| `@capacitor/keyboard`      | Keyboard events                     |
| `@capacitor/preferences`   | Secure native storage               |

---

## 📁 Project Structure

```
SmartClinic-Front/
├── src/                    # Vue source code
│   ├── composables/
│   │   └── useMobile.js    # 👈 Use this for native features
│   └── styles/
│       └── mobile.css      # Mobile-specific styles
├── dist/                   # Web build output
├── ios/                    # Native iOS project (Xcode)
├── android/                # Native Android project (Android Studio)
└── capacitor.config.ts     # Mobile app configuration
```

---

## 🎯 Using Native Features

```vue
<script setup>
import { useMobile } from "@/composables/useMobile";

const {
  isNative, // true on iOS/Android
  hapticLight, // Button tap feedback
  hapticSuccess, // Success vibration
  useKeyboard, // Track keyboard visibility
  useBackButton, // Handle Android back button
} = useMobile();

const handleSave = async () => {
  await saveData();
  hapticSuccess(); // Native vibration
};
</script>
```

---

## 🛠️ Requirements

| Platform    | Requires                      |
| ----------- | ----------------------------- |
| **Web**     | Node.js 18+                   |
| **iOS**     | macOS + Xcode 15+ + CocoaPods |
| **Android** | Android Studio + JDK 17+      |

---

## 🎨 App Customization

Edit `capacitor.config.ts` to change:

- App ID: `com.smartclinic.app`
- App Name: `SmartClinic`
- Splash screen color
- Status bar style
- Keyboard behavior

---

## 📚 Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Ionic Vue Docs](https://ionicframework.com/docs/vue/overview)
- [Mobile SDK Guide](./MOBILE_SDK_GUIDE.md) — Full documentation

---

**Ready to go! 🎉**
