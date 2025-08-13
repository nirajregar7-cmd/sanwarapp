#!/bin/bash

# Sanwar iOS Release Build Script
echo "🚀 Building Sanwar iOS Release..."

# Step 1: Sync Capacitor
echo "📱 Syncing Capacitor files..."
npx cap sync ios

# Step 2: Open Xcode for manual build
echo "🔧 Opening Xcode..."
echo ""
echo "Manual steps in Xcode:"
echo "1. Select 'Any iOS Device' as target"
echo "2. Go to Product → Archive"
echo "3. Wait for build to complete"
echo "4. In Organizer window, click 'Distribute App'"
echo "5. Select 'App Store Connect'"
echo "6. Follow the wizard to upload"
echo ""
echo "Your app will be uploaded to App Store Connect for review"
echo ""

npx cap open ios