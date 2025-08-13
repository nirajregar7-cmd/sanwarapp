# Sanwar Mobile App - Quick Start Guide

Transform your Sanwar web app into native iOS/Android apps in under 30 minutes.

## Prerequisites
- Node.js installed locally
- Android Studio (for Android)
- Your Replit project URL

## 5-Step Setup

### Step 1: Create Mobile App
```bash
mkdir sanwar-mobile
cd sanwar-mobile
npm init @capacitor/app
```

**When prompted:**
- App name: `Sanwar`
- App ID: `com.sanwar.app`
- Framework: `None`

### Step 2: Configure Your Replit URL
Edit `capacitor.config.json`:

```json
{
  "appId": "com.sanwar.app",
  "appName": "Sanwar",
  "webDir": "dist",
  "server": {
    "url": "https://your-replit-url.replit.dev",
    "cleartext": true
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#8B5CF6"
    }
  }
}
```

**Replace URL**: Use your actual Replit deployment URL

### Step 3: Add Platforms
```bash
npx cap add android
# npx cap add ios  (for iOS)
```

### Step 4: Build & Test
```bash
npx cap sync android
npx cap open android
```

Android Studio opens → Click "Run" → Your app installs on device/emulator

### Step 5: App Store Ready
In Android Studio:
- Build → Generate Signed Bundle/APK
- Upload to Google Play Console

## Your App Features
✅ All existing Sanwar functionality  
✅ Native mobile performance  
✅ Payment processing (Razorpay)  
✅ Staff booking system  
✅ Real-time availability  
✅ Push notifications ready  

## Next Steps
1. Test the app thoroughly
2. Add app icon (1024x1024 PNG)
3. Create app store listing
4. Submit for review

Your mobile app will automatically stay updated with your Replit backend changes!