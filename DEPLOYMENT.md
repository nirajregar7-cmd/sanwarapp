# Deployment Guide for Sanwar

## Quick Start - Vercel Deployment

### 1. Prerequisites
- GitHub account with your code repository
- Vercel account (free at vercel.com)
- PostgreSQL database (Neon/Supabase recommended)

### 2. Database Setup

**Option A: Neon Database (Recommended)**
1. Visit [neon.tech](https://neon.tech) and create account
2. Create new project → Copy connection string
3. Use this as your `DATABASE_URL`

**Option B: Supabase**
1. Visit [supabase.com](https://supabase.com) and create account  
2. Create new project → Settings → Database → Copy connection string

### 3. Deploy to Vercel

1. **Connect Repository:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project" → Import from GitHub
   - Select your Sanwar repository

2. **Environment Variables:**
   Add these in Vercel dashboard (Settings → Environment Variables):

   ```
   DATABASE_URL=postgresql://your-connection-string-here
   SESSION_SECRET=your-random-secret-key-minimum-32-characters
   RAZORPAY_KEY_ID=your-razorpay-key-id  
   RAZORPAY_KEY_SECRET=your-razorpay-secret
   NODE_ENV=production
   ```

3. **Deploy:**
   - Click "Deploy" 
   - Wait for build to complete
   - Your app will be live at `your-project.vercel.app`

### 4. Database Migration

After deployment, run this once to set up database tables:

```bash
# Install Drizzle CLI globally
npm install -g drizzle-kit

# Set your production database URL
export DATABASE_URL="your-production-database-url"

# Push schema to database
drizzle-kit push
```

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes |
| `SESSION_SECRET` | Random string for session security | ✅ Yes |
| `RAZORPAY_KEY_ID` | Razorpay payment key | ✅ Yes |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key | ✅ Yes |
| `NODE_ENV` | Set to `production` | ✅ Yes |

## Troubleshooting

**Build Fails:**
- Check all environment variables are set
- Ensure DATABASE_URL is valid
- Check Vercel function logs

**Database Connection Issues:**
- Verify DATABASE_URL format: `postgresql://user:pass@host:port/db`
- Ensure database allows external connections
- Check if you need to run `drizzle-kit push`

**Payment Issues:**
- Verify Razorpay keys are correct
- Check Razorpay dashboard for test vs live mode

## Custom Domain (Optional)

1. In Vercel dashboard → Settings → Domains
2. Add your domain
3. Update DNS as instructed

## Support

- Email: nirajregar7@gmail.com
- Phone: +91 95875 59061

## Features Included

✅ Salon owner dashboard with booking management
✅ Customer salon discovery and booking
✅ Real-time time slot management  
✅ Razorpay payment integration
✅ User authentication system
✅ Mobile responsive design
✅ Review and rating system
✅ Gallery management
✅ Revenue tracking and analytics