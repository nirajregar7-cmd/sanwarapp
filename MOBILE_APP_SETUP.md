# Sanwar Mobile App Setup with Capacitor

Transform your existing Sanwar web application into native iOS and Android apps using Capacitor. This approach keeps your backend and all features working exactly as they do now.

## Prerequisites
- Node.js installed on your development machine
- Android Studio (for Android)
- Xcode (for iOS, Mac only)
- Your Replit project running live

## Step 1: Initialize Capacitor App

Create a new directory for your mobile app:

```bash
mkdir sanwar-mobile
cd sanwar-mobile
npm init @capacitor/app
```

When prompted, enter:
- **App name**: `Sanwar`
- **App ID**: `com.sanwar.app` (or use your own domain like `com.yourdomain.sanwar`)
- **Framework**: Select "None" (we'll use your existing Replit site)

## Step 2: Configure Your Replit URL

Edit `capacitor.config.json` in your project root:

```json
{
  "appId": "com.sanwar.app",
  "appName": "Sanwar",
  "webDir": "dist",
  "server": {
    "url": "https://your-replit-project-url.replit.dev",
    "cleartext": true
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#8B5CF6",
      "showSpinner": true,
      "androidSpinnerStyle": "small",
      "iosSpinnerStyle": "small",
      "spinnerColor": "#ffffff"
    },
    "StatusBar": {
      "style": "DARK",
      "backgroundColor": "#8B5CF6"
    }
  }
}
```

**Replace the URL**: Update `https://your-replit-project-url.replit.dev` with your actual Replit live URL.

## Step 3: Add Mobile Platforms

```bash
# Add Android platform
npx cap add android

# Add iOS platform (Mac only)
npx cap add ios
```

## Step 4: Install Essential Plugins

```bash
# Core plugins for better mobile experience
npm install @capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar @capacitor/splash-screen

# For push notifications (optional)
npm install @capacitor/push-notifications

# For camera/file uploads (optional)
npm install @capacitor/camera @capacitor/filesystem

# For geolocation (for finding nearby salons)
npm install @capacitor/geolocation
```

## Step 5: Configure App Icons and Splash Screen

### App Icons
1. Create a 1024x1024 PNG icon for your app
2. Save it as `icon.png` in your project root
3. Generate platform-specific icons:

```bash
# Install icon generator
npm install -g @capacitor/assets

# Generate icons
npx capacitor-assets generate --iconBackgroundColor '#8B5CF6' --iconBackgroundColorDark '#8B5CF6' --splashBackgroundColor '#8B5CF6' --splashBackgroundColorDark '#8B5CF6'
```

### Splash Screen
Create a `splash.png` (2732x2732) with your Sanwar logo centered on a purple background.

## Step 6: Build and Test

### For Android:

```bash
# Sync files and open Android Studio
npx cap sync android
npx cap open android
```

In Android Studio:
1. Wait for Gradle sync to complete
2. Select a device/emulator
3. Click "Run" button
4. Your Sanwar app will install and launch

### For iOS (Mac only):

```bash
# Sync files and open Xcode
npx cap sync ios
npx cap open ios
```

In Xcode:
1. Select a device/simulator
2. Click "Play" button
3. Your Sanwar app will install and launch

## Step 7: Enable Push Notifications (Optional)

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use existing
3. Add Android app (use your app ID: `com.sanwar.app`)
4. Download `google-services.json` → place in `android/app/`
5. Add iOS app → download `GoogleService-Info.plist` → place in `ios/App/App/`

### 2. Configure Push Notifications

Add to your `capacitor.config.json`:

```json
{
  "plugins": {
    "PushNotifications": {
      "presentationOptions": ["badge", "sound", "alert"]
    }
  }
}
```

### 3. Update Your Web App

Add this to your main frontend JavaScript:

```javascript
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

// Only run on mobile
if (Capacitor.isNativePlatform()) {
  // Request permission
  PushNotifications.requestPermissions().then(result => {
    if (result.receive === 'granted') {
      PushNotifications.register();
    }
  });

  // Handle registration
  PushNotifications.addListener('registration', token => {
    console.log('Push registration success, token: ' + token.value);
    // Send token to your backend
    fetch('/api/push/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.value })
    });
  });

  // Handle incoming notifications
  PushNotifications.addListener('pushNotificationReceived', notification => {
    console.log('Push received: ', notification);
  });
}
```

## Step 8: App Store Preparation

### For Google Play Store:

1. In Android Studio: **Build → Generate Signed Bundle/APK**
2. Create a signing key (keep it safe!)
3. Generate release AAB file
4. Upload to [Google Play Console](https://play.google.com/console)

### For Apple App Store:

1. In Xcode: **Product → Archive**
2. **Distribute App → App Store Connect**
3. Upload to [App Store Connect](https://appstoreconnect.apple.com)

## Step 9: App Store Listings

### App Description Template:

**Sanwar - Smart Salon Booking**

Book salon appointments instantly with real-time availability. Sanwar connects you with local salons for seamless booking experiences.

**Features:**
- ⏰ Real-time slot availability
- 💳 Secure payment processing
- 📱 Push notifications for booking confirmations
- 🎯 Staff-specific booking system
- 📍 Location-based salon discovery
- ⭐ Reviews and ratings
- 💰 Referral rewards program

**For Salon Owners:**
- 📊 Complete business dashboard
- 👥 Staff management system
- 💸 Automated revenue sharing
- 📈 Analytics and insights

Transform your salon experience with Sanwar!

### Keywords:
salon booking, hair salon, beauty appointments, barber shop, spa booking, appointment scheduler

## Step 10: Maintenance and Updates

When you update your Replit application:
1. Your mobile app automatically gets the updates (since it loads your live site)
2. For native feature changes, rebuild and republish
3. Use Capacitor's live updates for minor changes

## Advanced Features

### Location Services
```javascript
import { Geolocation } from '@capacitor/geolocation';

const getCurrentPosition = async () => {
  const coordinates = await Geolocation.getCurrentPosition();
  // Use coordinates to find nearby salons
};
```

### Camera Integration
```javascript
import { Camera, CameraResultType } from '@capacitor/camera';

const takePicture = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    resultType: CameraResultType.Uri
  });
  // Upload image to your backend
};
```

### Haptic Feedback
```javascript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const hapticsImpact = async () => {
  await Haptics.impact({ style: ImpactStyle.Light });
};
```

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure your Replit backend allows your mobile app origin
2. **Network Requests**: Use absolute URLs for API calls
3. **File Uploads**: May need platform-specific handling
4. **Authentication**: Test login flows on mobile devices

### Debug on Device:

**Android**: Use Chrome DevTools → `chrome://inspect`
**iOS**: Use Safari Developer → Develop menu

## Deployment Checklist

- [ ] App icons generated and configured
- [ ] Splash screen created
- [ ] Push notifications configured (if needed)
- [ ] App store metadata prepared
- [ ] Privacy policy created
- [ ] Testing completed on real devices
- [ ] App store accounts set up
- [ ] Signing certificates configured

Your Sanwar mobile app will now provide native mobile experience while maintaining all your existing backend functionality!