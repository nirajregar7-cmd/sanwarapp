# Build Instructions for Vercel

## Overview
This project is configured to deploy on Vercel with the following structure:
- Frontend: React app built with Vite (serves static files)
- Backend: Express.js API as serverless functions

## Build Process

### 1. Client Build
```bash
vite build
```
- Compiles React TypeScript code
- Bundles CSS with Tailwind
- Outputs to `dist/` directory
- Generates static HTML, CSS, JS files

### 2. Server Build
```bash
# API functions are built automatically by Vercel
# Uses the api/index.ts as entry point
```

## Deployment Configuration

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "package.json", 
      "use": "@vercel/static-build"
    }
  ]
}
```

### Routes
- `/api/*` → Server functions
- `/*` → Static frontend files

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `RAZORPAY_KEY_ID`: Payment gateway key
- `RAZORPAY_KEY_SECRET`: Payment gateway secret

## Database Setup
After deployment, run:
```bash
npx drizzle-kit push
```

## File Structure
```
/
├── api/
│   └── index.ts          # Vercel serverless entry
├── dist/                 # Built frontend files
├── server/               # Express.js backend
├── client/               # React frontend
├── shared/               # Shared TypeScript types
├── vercel.json          # Vercel config
└── package.json         # Dependencies
```

## Build Commands
- `npm run build`: Builds both client and server
- `npm run dev`: Development server
- `npm run db:push`: Database migration