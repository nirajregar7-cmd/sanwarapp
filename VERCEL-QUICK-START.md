# Vercel Quick Start Guide

## 🚀 Deploy Sanwar to Vercel in 5 Minutes

### Step 1: Prepare Database
1. Go to [neon.tech](https://neon.tech) (free PostgreSQL)
2. Create new project
3. Copy connection string (starts with `postgresql://`)

### Step 2: Deploy to Vercel
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repository
4. Add environment variables:

```
DATABASE_URL=postgresql://your-connection-string
SESSION_SECRET=your-random-32-char-secret
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
NODE_ENV=production
```

5. Click Deploy!

### Step 3: Setup Database
After deployment, run once:
```bash
# Set your database URL
export DATABASE_URL="your-production-database-url"

# Push database schema
npx drizzle-kit push
```

### Step 4: Test Your App
Visit `your-project.vercel.app` and:
1. Register as a salon owner
2. Create salon profile  
3. Add services and time slots
4. Test customer booking flow

## Environment Variables

| Variable | Where to Get | Required |
|----------|--------------|----------|
| `DATABASE_URL` | Neon.tech dashboard | ✅ |
| `SESSION_SECRET` | Generate random 32+ chars | ✅ |
| `RAZORPAY_KEY_ID` | Razorpay dashboard | ✅ |
| `RAZORPAY_KEY_SECRET` | Razorpay dashboard | ✅ |

## Features Included
- 📱 Mobile-responsive design
- 🏪 Salon owner dashboard 
- 👤 Customer booking system
- 💳 Razorpay payment integration
- ⭐ Review and rating system
- 📊 Analytics and reporting
- 📅 Real-time slot management
- 🖼️ Gallery management

## Support
- Email: nirajregar7@gmail.com
- Phone: +91 95875 59061

That's it! Your salon booking platform is live! 🎉