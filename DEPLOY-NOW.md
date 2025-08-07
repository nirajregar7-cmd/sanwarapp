# Deploy Sanwar to Vercel - Step by Step

## Step 1: Push to GitHub (2 minutes)

1. **Create GitHub Repository:**
   - Go to [github.com](https://github.com)
   - Click "New repository"
   - Name it "sanwar-salon-booking"
   - Make it public or private
   - Don't initialize with README (we have files already)

2. **Push Your Code:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Sanwar salon booking platform"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/sanwar-salon-booking.git
   git push -u origin main
   ```

## Step 2: Set Up Database (3 minutes)

**Option A: Neon (Recommended - Free)**
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Create new project → Name it "sanwar-db"
4. Copy the connection string (looks like: `postgresql://username:password@hostname/database`)

**Option B: Supabase (Alternative)**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database → Connection string
4. Copy the connection string

## Step 3: Deploy to Vercel (5 minutes)

1. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with GitHub
   - Click "New Project"
   - Import your "sanwar-salon-booking" repository

2. **Add Environment Variables:**
   In Vercel dashboard, go to Settings → Environment Variables and add:

   ```
   DATABASE_URL=paste-your-database-connection-string-here
   SESSION_SECRET=make-this-a-random-32-character-string
   RAZORPAY_KEY_ID=your-razorpay-key-id
   RAZORPAY_KEY_SECRET=your-razorpay-secret-key
   NODE_ENV=production
   ```

3. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your app will be live at `your-project-name.vercel.app`

## Step 4: Initialize Database (1 minute)

After deployment, run this once to create database tables:

```bash
# Install Drizzle CLI
npm install -g drizzle-kit

# Set your database URL (use the same one from Step 2)
export DATABASE_URL="your-database-connection-string"

# Create all database tables
drizzle-kit push
```

## Step 5: Test Your Live App

Visit your Vercel URL and test:
1. Register as salon owner
2. Create salon profile
3. Add services and time slots
4. Register as customer and book appointment
5. Test payment flow

## Getting Razorpay Keys

1. Go to [razorpay.com](https://razorpay.com)
2. Sign up for account
3. Go to Settings → API Keys
4. Generate new key pair
5. Use Test keys for testing, Live keys for production

## Troubleshooting

**Build Fails:**
- Check all environment variables are set correctly
- Verify DATABASE_URL format is correct

**Database Errors:**
- Make sure you ran `drizzle-kit push`
- Check database connection string

**Payment Errors:**
- Verify Razorpay keys are correct
- Check if using test vs live mode

## Support
- Email: nirajregar7@gmail.com
- Phone: +91 95875 59061

Once deployed, your salon booking platform will be live and ready for customers!