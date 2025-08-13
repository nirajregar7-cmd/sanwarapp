# Sanwar Mobile App - 15 Minute Setup

Transform your Sanwar web app into native iOS and Android apps.

## Prerequisites (5 minutes)
- Node.js installed on your computer
- Android Studio (for Android app)
- Xcode (for iOS app, Mac only)

## Step 1: Use Your Deployed URL ✅
Your app is deployed at:
`https://ac9e5a28-ddcc-43e7-8168-cb0762543f12-00-1m1vjvdmybedf.janeway.replit.dev`

## Step 2: Create Mobile Project (3 minutes)
```bash
# Create new directory
mkdir sanwar-mobile
cd sanwar-mobile

# Initialize Capacitor project
npm create @capacitor/app

# When prompted, enter:
# App name: Sanwar
# Package ID: com.sanwar.app
# Create app? Yes
```

## Step 3: Configure Your App (2 minutes)
Edit `capacitor.config.ts` and replace the server URL:
```typescript
const config: CapacitorConfig = {
  appId: 'com.sanwar.app',
  appName: 'Sanwar',
  webDir: 'dist/public',  // This is where your built app files are located
  server: {
    url: 'https://ac9e5a28-ddcc-43e7-8168-cb0762543f12-00-1m1vjvdmybedf.janeway.replit.dev',
    cleartext: true
  }
};
```

## Step 4: Add Mobile Platforms (3 minutes)
```bash
# Install platform dependencies
npm install @capacitor/android @capacitor/ios

# Add platforms
npx cap add android
npx cap add ios

# Sync files
npx cap sync
```

## Step 5: Test Your App
```bash
# Open Android Studio
npx cap run android

# Open Xcode (Mac only)
npx cap run ios
```

Your mobile app will load your live web application with all functionality!

## App Store Submission (When Ready)

### Android (Google Play)
1. `npx cap open android`
2. Build → Generate Signed Bundle/APK
3. Upload to Google Play Console

### iOS (App Store)
1. `npx cap open ios`  
2. Product → Archive
3. Upload to App Store Connect

## App Features Included
- All your web app functionality
- Native mobile performance
- Push notifications ready
- Camera and location access
- Offline capability
- App store optimization

## Support
Your mobile app automatically updates when you update your web app - no separate deployment needed!

**Total setup time: ~15 minutes**
**Time to app stores: 1-2 days**