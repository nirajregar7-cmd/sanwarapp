# Sanwar - Smart Salon Booking Platform

## Overview

Sanwar is a smart salon booking platform that helps local salon shopkeepers digitize their business and allows customers to easily discover and book services. Think of it like Zomato for salons, but with features inspired by IRCTC's booking system — showing live available slots, clear pricing, and instant confirmations. The platform serves two distinct user types: salon owners who want to go digital and attract more customers, and customers who want quick, online salon bookings without waiting lines.

**Latest Update (August 2025):** Successfully transitioned from Replit Auth to traditional email/password authentication, making the platform accessible to everyone without requiring Replit accounts. Users can now sign up by choosing their role and login with email and password. Implemented complete social login integration with Google and Facebook OAuth. **SMS OTP Password Reset System:** ✓ COMPLETED - Fully operational SMS-based OTP password reset for both customers and salon owners with smart user lookup, Twilio integration, secure 10-minute OTP expiry, and comprehensive database management. **Emoji-Based Mood Rating System:** ✓ COMPLETED - Revolutionary 5-level mood rating system (😞 Very Disappointed to 😍 Absolutely Amazing) alongside traditional star ratings, with interactive selector and display components fully integrated into review system. **Photo Upload System:** ✓ COMPLETED - Full object storage integration with Replit Object Storage, supports up to 3 photos per review (5MB each), responsive mobile-friendly interface, secure ACL policies, and proper image serving through /objects/ endpoints. **Profile Picture System:** ✓ COMPLETED - Complete profile picture upload system for both customers and staff members with ObjectUploader integration, secure storage, validation fix for photo-only updates, and display in booking management dashboard. Platform is now deployment-ready for Render platform with custom domain sanwarhub.in (purchased from Hostinger) ready for connection.

**Admin Verification System:** ✓ COMPLETED - Comprehensive salon verification system allowing admins to view complete salon profiles exactly as customers see them before approval. Features include full profile preview (services, staff, gallery, reviews, working hours), verification notes system, seamless approve/reject workflow from single interface, and real-time status display in salon owner dashboard with admin feedback visibility.

**Break Management Enhancement:** Implemented flexible break system allowing salon owners to add unlimited custom breaks during bulk slot generation. Each break has configurable start time and duration (5-60 minutes), perfect for lunch breaks, tea breaks, prayer times, or any rest periods. System automatically skips break periods during slot creation.

**Navigation System Update:** Implemented complete role-based separation with clean customer interface - salon owners see only Dashboard, Time Slots, and Account Details navigation. Customers see only Home, Find Salons, Bookings, and Refer & Earn with no role switching confusion. Mobile menu button positioned on right side for optimal UX. Both mobile and desktop navigation are role-specific with protected routes preventing cross-access.

**Special Referral Milestone System:** Implemented advanced referral reward system for shopkeepers - when a salon owner refers 5 unique paying customers, they receive 100% of the confirmation fees from those 5 bookings credited to their wallet. Progress tracking shows current status (e.g., "3/5 customers") and automatically resets for the next cycle after completion.

**Important:** The system uses completely manual time slot creation - only slots explicitly created by salon owners appear for customer booking. Bulk generation supports flexible break management with multiple custom breaks (5-60 minutes each) that automatically skip break periods during slot creation.

## User Preferences

Preferred communication style: Simple, everyday language.

## Key Features Required

### Landing Page Features ✓ COMPLETED
- Display statistics: number of customers and salons using the platform
- Show available services (Haircut, Facial, Bridal, etc.)
- Live salon previews with images, ratings, and top services
- Call-to-action buttons: "Join as a Shopkeeper" and "Book a Salon Now"
- Platform explanation and how it works

### Shopkeeper Features ✓ COMPLETED
- Complete salon profile creation with photos and location mapping ✓
- Service management with pricing and duration ✓
- Staff management with photos and roles ✓
- Working hours and break time configuration ✓
- **Time slot management system with 100% manual control and flexible break management** ✓
- Confirmation amount setting for serious bookings (₹10, ₹20, etc.) ✓
- Booking management dashboard with customer info and payment status ✓
- Manual walk-in customer addition → PENDING
- Revenue tracking and account details management ✓
- Ratings and reviews management with emoji mood ratings and reply capability ✓
- Analytics dashboard showing bookings, peak hours, top services, income estimates ✓

### Customer Features ✓ COMPLETED
- Salon browsing by location, rating, distance, or service ✓
- Real-time availability viewing (IRCTC-style time slots) ✓
- Service booking with instant confirmation amount payment ✓
- Comprehensive salon detail pages with booking system ✓
- Booking management (view, cancel, reschedule) ✓
- SMS/Email/WhatsApp confirmations → PENDING
- Rating and review system with photo uploads and emoji-based mood ratings ✓
- Referral program with wallet credits → PENDING

### Payment Integration ✓ COMPLETED
- **Confirmation Amount Payment Flow**: Customers pay only the small booking confirmation amount (set by salon owners) upfront via Razorpay to secure their slot ✓
- **Full Service Payment**: Remaining service amount paid at salon after service completion ✓
- Razorpay integration for confirmation amounts with proper amount handling ✓
- Revenue sharing system: 45% platform, 55% salon owner with automatic calculation ✓
- Digital receipts and invoices → PENDING  
- Wallet system for referral credits ✓

## System Architecture

### Frontend Architecture
The client is built with React and TypeScript using a component-based architecture. The UI framework leverages shadcn/ui components built on Radix UI primitives, providing a consistent and accessible design system. Styling is handled through Tailwind CSS with custom design tokens and CSS variables for theming. The application uses Wouter for client-side routing, which provides a lightweight alternative to React Router. State management is handled through TanStack Query (React Query) for server state and React's built-in hooks for local component state.

### Backend Architecture  
The server follows a RESTful API design built with Express.js and TypeScript. The architecture separates concerns through distinct modules: route handlers for API endpoints, storage services for database operations, and middleware for cross-cutting concerns like authentication and request logging. The application uses a service-oriented approach where business logic is encapsulated in service classes, promoting code reuse and maintainability.

### Database Design
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The enhanced schema now includes:

**Core Tables:**
- users, salons, services, working hours, time slots, bookings, reviews

**New Enhancement Tables (Added Jan 2025):**
- staff: Salon employee management with roles and photos
- wallets: Customer wallet system for referral credits
- walletTransactions: Audit trail for all wallet activities  
- referrals: Referral program tracking with rewards
- platformStats: Real-time platform statistics for landing page

The database design supports multi-tenancy through owner-based data isolation, includes session storage for authentication, and now supports advanced features like staff management, referral programs, and wallet systems with full transaction tracking.

### Authentication System
Authentication is implemented using traditional email/password authentication with bcrypt for secure password hashing and JWT tokens for session management. The system uses express-session with PostgreSQL session storage for persistent login state. Users can sign up by choosing their role (customer or salon owner) and login with their email and password. User roles are differentiated at the application level with "customer" and "salon_owner" types, enabling role-based access control throughout the application.

### File Storage and Media Management  
The application integrates with Google Cloud Storage for media uploads, using Replit's sidecar authentication for secure access. File uploads are handled through Uppy.js, providing a modern file upload interface with progress tracking and preview capabilities. The system includes an Access Control List (ACL) mechanism for fine-grained permission management on uploaded files, allowing for private media access based on user relationships.

### Development and Build System
The project uses Vite for fast development builds and hot module replacement. The build process compiles both client and server code, with esbuild handling server-side compilation for production. The development environment includes TypeScript checking, Tailwind CSS processing, and PostCSS for additional CSS transformations. Path aliases are configured to simplify imports and improve code organization.

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL database hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations and migrations

### Authentication
- **Email/Password Authentication**: Traditional authentication system with secure password hashing
- **bcrypt**: Password hashing and verification
- **JWT Tokens**: Session management and user authentication
- **Passport.js**: Authentication middleware for session handling

### File Storage
- **Google Cloud Storage**: Object storage service for media files
- **Replit Sidecar**: Authentication proxy for secure GCS access

### Frontend Libraries
- **React**: Component-based UI framework
- **TanStack Query**: Server state management and caching
- **shadcn/ui**: Component library built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework
- **Wouter**: Lightweight client-side routing
- **Uppy.js**: Modern file upload interface

### Backend Services  
- **Express.js**: Web application framework
- **Replit Runtime**: Hosting and development platform
- **Vercel Deployment**: Production hosting with serverless functions

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type-safe JavaScript compilation
- **esbuild**: Fast JavaScript bundler for production builds

## Deployment Options

### Vercel Deployment (Production Ready)
The platform is configured for seamless deployment on Vercel with:
- **Serverless Functions**: Express.js API runs as serverless functions
- **Static Frontend**: React app serves as optimized static files
- **Database Integration**: Works with any PostgreSQL database (Neon, Supabase, Railway)
- **Environment Variables**: Secure configuration for production
- **Custom Domains**: Support for custom domain configuration

**Deployment Files:**
- `vercel.json`: Vercel configuration
- `api/index.ts`: Serverless function entry point
- `.env.example`: Environment variables template
- `VERCEL-QUICK-START.md`: Step-by-step deployment guide