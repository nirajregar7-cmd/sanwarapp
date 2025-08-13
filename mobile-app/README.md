# Sanwar Mobile App

Transform your Sanwar web application into native iOS and Android apps using Capacitor.

## Quick Setup (5 Minutes)

### 1. Prerequisites
- Node.js 16+ installed
- Android Studio (for Android)
- Xcode (for iOS, Mac only)

### 2. Initialize Project
```bash
git clone <this-mobile-app-folder>
cd mobile-app
npm install
```

### 3. Configure Your Backend URL
Edit `capacitor.config.json`:
```json
{
  "server": {
    "url": "https://your-actual-replit-url.replit.dev"
  }
}
```

### 4. Build for Platforms
```bash
# Add Android platform
npx cap add android

# Add iOS platform (Mac only)
npx cap add ios

# Sync files
npx cap sync
```

### 5. Open in IDE
```bash
# Open Android Studio
npx cap open android

# Open Xcode (Mac only)
npx cap open ios
```

## App Features

Your mobile app will include:
- ✅ All web app functionality
- ✅ Native performance
- ✅ Push notifications ready
- ✅ Camera integration
- ✅ Geolocation services
- ✅ Haptic feedback
- ✅ App store ready

## Development

### Test on Device
```bash
# Run on Android device
npm run android

# Run on iOS device
npm run ios
```

### Build for Production

#### Android (APK/AAB)
1. Open Android Studio
2. Build → Generate Signed Bundle/APK
3. Follow signing wizard
4. Upload to Google Play Store

#### iOS (IPA)
1. Open Xcode
2. Product → Archive
3. Distribute App → App Store Connect
4. Upload to App Store

## App Store Submission

### App Information
- **Name**: Sanwar - Smart Salon Booking
- **Category**: Lifestyle / Business
- **Keywords**: salon, booking, appointments, beauty, barber

### Description Template
Book salon appointments instantly with Sanwar! Our smart booking platform connects you with local salons for seamless appointment scheduling.

**Features:**
• Real-time appointment availability
• Secure payment processing
• Staff-specific booking system
• Push notifications for confirmations
• Location-based salon discovery
• Reviews and ratings system
• Referral rewards program

**For Salon Owners:**
• Complete business management dashboard
• Staff scheduling system
• Automated payment processing
• Analytics and insights

Transform your salon experience with Sanwar!

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure your backend allows mobile app origin
2. **Network Issues**: Check internet connectivity
3. **Build Failures**: Update Android SDK/Xcode versions

### Debug on Device
- **Android**: Chrome DevTools → `chrome://inspect`
- **iOS**: Safari → Develop Menu → Your Device

## Support
For technical support, contact the development team or refer to [Capacitor Documentation](https://capacitorjs.com/docs).