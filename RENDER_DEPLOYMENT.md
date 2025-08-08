# Sanwar Platform - Render Deployment Guide

## Overview
This guide helps you deploy your Sanwar salon booking platform on Render with PostgreSQL database, Express.js backend, and React frontend.

## Prerequisites
1. GitHub account with your Sanwar project repository
2. Render account (free tier available)
3. API keys for Razorpay, Google OAuth, Facebook OAuth

## Deployment Steps

### Step 1: Database Setup
1. **Create PostgreSQL Database**
   - Go to Render Dashboard → "New" → "PostgreSQL"
   - Name: `sanwar-db`
   - Database: `sanwar`
   - Region: Choose closest to your users
   - Plan: Free tier (90 days) or Starter ($7/month for production)

2. **Get Database Connection Details**
   - Copy the **Internal Database URL** from the dashboard
   - Format: `postgres://username:password@hostname:5432/database_name`

### Step 2: Backend API Deployment
1. **Create Web Service**
   - Go to Render Dashboard → "New" → "Web Service"
   - Connect your GitHub repository
   - Name: `sanwar-api`

2. **Configure Build Settings**
   ```
   Build Command: npm install
   Start Command: npm start
   Environment: Node.js
   ```

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   DATABASE_URL=[Your PostgreSQL Internal URL]
   SESSION_SECRET=[Generate a random string]
   RAZORPAY_KEY_ID=[Your Razorpay Key]
   RAZORPAY_KEY_SECRET=[Your Razorpay Secret]
   GOOGLE_CLIENT_ID=[Your Google OAuth Client ID]
   GOOGLE_CLIENT_SECRET=[Your Google OAuth Secret]
   FACEBOOK_APP_ID=[Your Facebook App ID]
   FACEBOOK_APP_SECRET=[Your Facebook App Secret]
   ```

### Step 3: Frontend Deployment
1. **Create Static Site**
   - Go to Render Dashboard → "New" → "Static Site"
   - Connect your GitHub repository
   - Name: `sanwar-frontend`

2. **Configure Build Settings**
   ```
   Build Command: npm install && npm run build
   Publish Directory: client/dist
   ```

3. **Add Redirect Rules** (for React Router)
   - Go to "Redirects/Rewrites" tab
   - Add rule: `/*` → `/index.html` (Status: 200)

### Step 4: Update Frontend Configuration
Update your React app to use production API URL:

```javascript
// client/src/lib/queryClient.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://sanwar-api.onrender.com' 
  : 'http://localhost:5000';
```

### Step 5: Database Migration
Run your database migrations:
```bash
# This will be done automatically during deployment
npm run db:push
```

### Step 6: Domain Configuration (Optional)
1. **Custom Domain Setup**
   - In your Static Site settings, go to "Custom Domains"
   - Add: `sanwarhub.in` (your owned domain)
   - Update DNS records as instructed by Render

2. **API Subdomain** (Optional)
   - For your backend: `api.sanwarhub.in`

## Post-Deployment Configuration

### OAuth Redirect URLs
Update your OAuth app settings:

**Google OAuth Console:**
- Authorized redirect URIs: `https://sanwar-api.onrender.com/api/auth/google/callback`

**Facebook App Settings:**
- Valid OAuth redirect URIs: `https://sanwar-api.onrender.com/api/auth/facebook/callback`

### CORS Configuration
Your backend is already configured for CORS, but verify the origin:

```javascript
// server/routes.ts - Update if needed
app.use(cors({
  origin: ['https://sanwar-frontend.onrender.com', 'https://sanwarhub.in'],
  credentials: true
}));
```

## Expected URLs After Deployment
- **Frontend**: `https://sanwar-frontend.onrender.com` (or your custom domain)
- **Backend API**: `https://sanwar-api.onrender.com`
- **Database**: Internal connection (not publicly accessible)

## Pricing Estimates (2025)
- **Database**: Free tier (90 days) or $7/month
- **Backend Web Service**: Free tier (750 hours/month) or $7/month  
- **Frontend Static Site**: Free (unlimited)
- **Total**: Free for 90 days, then ~$14/month for production

## Monitoring & Maintenance
1. **Logs**: Available in each service dashboard
2. **Metrics**: CPU, memory, and response time monitoring
3. **Auto-Deploy**: Enabled by default on Git push
4. **Health Checks**: Automatic with restart on failure

## Troubleshooting
- **Build Failures**: Check build logs for missing dependencies
- **Database Connections**: Verify DATABASE_URL environment variable
- **API Errors**: Check backend service logs
- **Frontend 404s**: Ensure redirect rules are configured

## Security Notes
- Environment variables are encrypted and secure
- HTTPS is automatically enabled
- Database connections are internal and secure
- Session secrets are automatically generated

Your Sanwar platform will be production-ready on Render with automatic scaling, SSL certificates, and high availability!