#!/bin/bash
# Render Build Script for Sanwar Platform

echo "🚀 Starting Sanwar Platform build..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the frontend
echo "🎨 Building React frontend..."
npm run build

# The backend doesn't need a separate build step as it runs with tsx
echo "✅ Build completed successfully!"

echo "📋 Build Summary:"
echo "- Frontend: Built and ready in dist/public"
echo "- Backend: Ready to start with 'npm start'"
echo "- Database: Migrations will run automatically"