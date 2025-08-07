# Sanwar - Vercel Deployment Guide

This guide explains how to deploy the Sanwar salon booking platform to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Database**: Set up a PostgreSQL database (recommended: Neon, Supabase, or Railway)

## Environment Variables

You'll need to set up these environment variables in your Vercel dashboard:

### Database Configuration
```env
DATABASE_URL=postgresql://username:password@hostname:port/database_name
PGHOST=your-db-host
PGPORT=5432
PGDATABASE=your-db-name
PGUSER=your-db-user
PGPASSWORD=your-db-password
```

### Authentication
```env
SESSION_SECRET=your-super-secret-session-key-here-make-it-long-and-random
```

### Payment Integration (Razorpay)
```env
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret-key
```

### Object Storage (Optional - for file uploads)
```env
DEFAULT_OBJECT_STORAGE_BUCKET_ID=your-bucket-id
PRIVATE_OBJECT_DIR=/your-bucket/private
PUBLIC_OBJECT_SEARCH_PATHS=/your-bucket/public,/your-bucket/assets
```

## Deployment Steps

### 1. Prepare Your Database

**Option A: Neon (Recommended)**
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Run the database migrations:
   ```bash
   npm run db:push
   ```

**Option B: Supabase**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string
5. Run migrations as above

### 2. Deploy to Vercel

**Method 1: Vercel CLI**
```bash
npm install -g vercel
vercel login
vercel --prod
```

**Method 2: GitHub Integration**
1. Connect your GitHub repository to Vercel
2. Import the project in Vercel dashboard
3. Add all environment variables in the dashboard
4. Deploy

### 3. Configure Environment Variables

In your Vercel dashboard:
1. Go to your project → Settings → Environment Variables
2. Add all the variables listed above
3. Redeploy the project

### 4. Database Setup

After deployment, you need to push your schema to the production database:

```bash
# Set your production DATABASE_URL
export DATABASE_URL="your-production-database-url"
npm run db:push
```

## Build Configuration

The project includes these build scripts in `package.json`:

- `build`: Builds both client and server for production
- `build:client`: Builds the React frontend
- `build:server`: Builds the Node.js backend

## Domain Configuration

1. In Vercel dashboard, go to your project → Settings → Domains
2. Add your custom domain (optional)
3. Configure DNS as instructed by Vercel

## Important Notes

1. **Database Migrations**: Always run `npm run db:push` after deploying to sync your database schema
2. **Environment Variables**: Make sure all required environment variables are set in Vercel
3. **Build Process**: The build process compiles TypeScript and bundles the frontend
4. **API Routes**: All API endpoints are served from `/api/*` routes
5. **Static Files**: The React frontend is served as static files from the root

## Troubleshooting

### Build Errors
- Check that all dependencies are listed in `package.json`
- Ensure TypeScript compilation succeeds locally
- Verify all environment variables are set

### Database Connection Issues
- Verify DATABASE_URL format: `postgresql://user:password@host:port/database`
- Check database credentials and network access
- Ensure database allows external connections

### API Errors
- Check Vercel function logs in the dashboard
- Verify all environment variables are properly set
- Test API endpoints locally first

## Support

For deployment issues:
- Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
- Contact: nirajregar7@gmail.com
- Phone: +91 95875 59061