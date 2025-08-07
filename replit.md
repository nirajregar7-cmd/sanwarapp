# Sanwar - Smart Salon Booking Platform

## Overview

Sanwar is a smart salon booking platform that helps local salon shopkeepers digitize their business and allows customers to easily discover and book services. Think of it like Zomato for salons, but with features inspired by IRCTC's booking system — showing live available slots, clear pricing, and instant confirmations. The platform serves two distinct user types: salon owners who want to go digital and attract more customers, and customers who want quick, online salon bookings without waiting lines.

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
- Time slot management system with manual control and auto-generation ✓
- Confirmation amount setting for serious bookings (₹10, ₹20, etc.) ✓
- Booking management dashboard with customer info and payment status ✓
- Manual walk-in customer addition → PENDING
- Ratings and reviews management with reply capability ✓
- Analytics dashboard showing bookings, peak hours, top services, income estimates ✓

### Customer Features ✓ COMPLETED
- Salon browsing by location, rating, distance, or service ✓
- Real-time availability viewing (IRCTC-style time slots) ✓
- Service booking with instant confirmation amount payment ✓
- Comprehensive salon detail pages with booking system ✓
- Booking management (view, cancel, reschedule) ✓
- SMS/Email/WhatsApp confirmations → PENDING
- Rating and review system with photo uploads ✓
- Referral program with wallet credits → PENDING

### Payment Integration
- Razorpay integration for confirmation amounts and full payments
- Digital receipts and invoices
- Wallet system for referral credits

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
Authentication is implemented using Replit's OpenID Connect (OIDC) provider with Passport.js for session management. The system uses express-session with PostgreSQL session storage for persistent login state. User roles are differentiated at the application level with "customer" and "salon_owner" types, enabling role-based access control throughout the application.

### File Storage and Media Management  
The application integrates with Google Cloud Storage for media uploads, using Replit's sidecar authentication for secure access. File uploads are handled through Uppy.js, providing a modern file upload interface with progress tracking and preview capabilities. The system includes an Access Control List (ACL) mechanism for fine-grained permission management on uploaded files, allowing for private media access based on user relationships.

### Development and Build System
The project uses Vite for fast development builds and hot module replacement. The build process compiles both client and server code, with esbuild handling server-side compilation for production. The development environment includes TypeScript checking, Tailwind CSS processing, and PostCSS for additional CSS transformations. Path aliases are configured to simplify imports and improve code organization.

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL database hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations and migrations

### Authentication
- **Replit Auth**: OpenID Connect provider for user authentication
- **Passport.js**: Authentication middleware with OIDC strategy

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
- **Replit Runtime**: Hosting and deployment platform

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type-safe JavaScript compilation
- **esbuild**: Fast JavaScript bundler for production builds