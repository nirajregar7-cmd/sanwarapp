#!/bin/bash

# Sanwar Android Release Build Script
echo "🚀 Building Sanwar Android Release..."

# Step 1: Sync Capacitor
echo "📱 Syncing Capacitor files..."
npx cap sync android

# Step 2: Open Android Studio for manual build
echo "🔧 Opening Android Studio..."
echo ""
echo "Manual steps in Android Studio:"
echo "1. Wait for Gradle sync to complete"
echo "2. Go to Build → Generate Signed Bundle/APK"
echo "3. Select 'Android App Bundle' (recommended for Play Store)"
echo "4. Create or select your signing key"
echo "5. Choose 'release' build variant"
echo "6. Click 'Finish'"
echo ""
echo "Your release AAB will be generated in:"
echo "android/app/build/outputs/bundle/release/"
echo ""

npx cap open android