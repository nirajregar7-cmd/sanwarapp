# Mobile App Build Guide - Sanwar

## 📱 Android App Build Instructions

The Android build files are now ready! Here's how to build your Sanwar mobile app:

### Prerequisites
1. **Android Studio** installed with Android SDK
2. **Java Development Kit (JDK) 17** or higher
3. **Node.js** and **npm** installed

### Build Steps

1. **Navigate to mobile app directory:**
   ```bash
   cd mobile-app
   ```

2. **Install Capacitor dependencies:**
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   ```

3. **Build the web app first:**
   ```bash
   npm run build
   ```

4. **Sync Capacitor:**
   ```bash
   npx cap sync android
   ```

5. **Open in Android Studio:**
   ```bash
   npx cap open android
   ```

6. **Build APK in Android Studio:**
   - Click "Build" → "Build Bundle(s) / APK(s)" → "Build APK(s)"
   - Or use command line: `./gradlew assembleDebug`

### Files Created

✅ **Core Android Files:**
- `android/capacitor.settings.gradle` - Capacitor plugin configuration
- `android/settings.gradle` - Main Gradle settings
- `android/build.gradle` - Root build configuration
- `android/variables.gradle` - Android SDK versions
- `android/gradle.properties` - Gradle properties

✅ **App Configuration:**
- `android/app/build.gradle` - App module build config
- `android/app/capacitor.build.gradle` - Capacitor dependencies
- `android/app/proguard-rules.pro` - Code obfuscation rules

✅ **Android Resources:**
- `AndroidManifest.xml` - App permissions and configuration
- `MainActivity.java` - Main app activity
- `strings.xml`, `styles.xml`, `colors.xml` - App styling
- `splash.xml` - Splash screen configuration

### App Details
- **Package Name:** `com.sanwar.app`
- **App Name:** Sanwar
- **Target SDK:** 34 (Android 14)
- **Min SDK:** 22 (Android 5.1)

### Next Steps
1. Add app icons to mipmap folders (different resolutions)
2. Customize splash screen with your logo
3. Configure signing key for Play Store release
4. Test on physical Android device

### Building Release APK
For production release:
```bash
./gradlew assembleRelease
```

The APK will be generated in: `android/app/build/outputs/apk/`

## 🔧 Configuration Notes

- **Web App URL:** Currently points to your Replit deployment
- **Permissions:** Includes camera, location, storage, notifications
- **Plugins:** Camera, geolocation, push notifications, device info

Your Android app setup is complete and ready for building!