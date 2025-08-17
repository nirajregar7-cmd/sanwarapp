# Sanwar - Smart Salon Booking Platform

## Overview
Sanwar is a smart salon booking platform designed to digitize salon businesses and simplify customer bookings. It functions as a comprehensive marketplace, akin to a "Zomato for salons," offering real-time slot availability, clear pricing, and instant confirmations, inspired by robust booking systems like IRCTC. The platform caters to salon owners seeking digital presence and increased clientele, and customers desiring efficient online booking without queues. Key capabilities include comprehensive salon management for owners, intuitive booking and discovery for customers, and integrated payment solutions with automatic revenue sharing. The project aims to provide a seamless, end-to-end solution for the salon industry, enabling digital transformation and enhancing user experience.

## User Preferences
Preferred communication style: Simple, everyday language.
Shopkeeper prefers: Single simple slot generation method to avoid confusion.
Individual staff-based slot generation: Implemented with real-time slot counts and staff-specific booking system.

## System Architecture

### Frontend Architecture
The client is built with React and TypeScript, following a component-based architecture. It utilizes shadcn/ui components (based on Radix UI) for a consistent design system, styled with Tailwind CSS for utility-first styling and custom theming. Wouter is used for lightweight client-side routing. State management relies on TanStack Query for server state and React's built-in hooks for local component state.

### Backend Architecture
The server is built using Express.js and TypeScript, adhering to a RESTful API design. It employs a service-oriented approach, separating concerns into route handlers, storage services for database operations, and middleware for authentication and logging. Business logic is encapsulated in service classes to promote reusability and maintainability.

### Database Design
The application uses PostgreSQL as the primary database, with Drizzle ORM for type-safe operations. The schema supports core entities like users, salons, services, working hours, time slots, bookings, and reviews. Enhancements include tables for staff management, customer wallets, wallet transactions, referral programs, and platform statistics. The design supports multi-tenancy with owner-based data isolation and includes session storage for authentication. Currently maintains 600+ booking slots across multiple dates, services, and staff members for comprehensive customer booking options.

## Recent Updates (August 17, 2025)
- **Brand Logo Integration**: Added official Sanwar logo with orange gradient design to navigation header and homepage hero section
- **Visual Brand Enhancement**: Replaced generic scissors icons with authentic brand identity across the platform
- **Homepage Offers Display**: Fixed salon cards to properly show promotional offers with green discount badges and detailed savings information
- **SalonCard Component Integration**: Updated homepage to use enhanced SalonCard component for consistent offer display across all salon listings

## Previous Updates (August 16, 2025)
- **Profile Visit Analytics System**: Implemented comprehensive salon profile visit tracking with database schema, API endpoints, and dashboard analytics
- **Analytics Dashboard**: Built analytics page showing total visits (30 days), unique customers, today's visits, and 7-day trend charts for salon owners
- **Visit Tracking Integration**: Added automatic visit tracking on salon detail pages with visitor ID, IP address, and timestamp logging
- **Visit Tracking Bug Fix**: Resolved database column issue preventing profile visits from being recorded properly
- **Navigation Reorganization**: Moved "Offers" from main navigation to lower navigation tabs alongside Overview, Services, Staff, Gallery, Bookings, Messages, and Settings
- **Enhanced Dashboard Tabs**: Added "Offers" and "View Insights" tabs to salon owner dashboard for better organization
- **Offers Visibility Enhancement**: Added offers display on homepage salon cards showing discount badges and promotional information for public visibility
- **Homepage Offers Integration**: Salon cards now display active offers with attractive green badges and detailed offer information
- **Comprehensive Offers Management System**: Implemented full promotional offers functionality allowing salon owners to create, manage, and track marketing campaigns
- **Salon Offers Database Schema**: Added salon_offers and customer_offers tables with comprehensive tracking (usage counts, validity periods, discount types)
- **Offers Creation Interface**: Built complete offers management page for salon owners with form validation and real-time preview
- **Customer Offers Integration**: Added offers display on customer dashboard with attractive cards showing discount details and usage limits
- **API Endpoints**: Implemented complete CRUD operations for offers management with proper authentication and validation

## Previous Updates (August 15, 2025)
- **Dynamic Confirmation Fees**: Implemented salon-specific confirmation fee system allowing each salon owner to set their own confirmation amount (₹1-₹500) instead of fixed ₹3
- **Revenue Splitting Logic**: Added automatic 80/20 revenue split between shopkeeper and platform with proper database tracking  
- **Confirmation Settings Page**: New dashboard section for salon owners to manage their confirmation fees
- **Database Schema Updates**: Added confirmation_amount, admin_revenue_share, and shopkeeper_revenue_share columns to salons table
- **Email System Enhancement**: Updated notification system to use dynamic confirmation amounts per salon
- **Payment Bug Fix**: Resolved issue where payments showed ₹1 instead of salon's custom confirmation fee

### Authentication System
The system uses traditional email/password authentication with bcrypt for secure password hashing and JWT tokens for session management. `express-session` with PostgreSQL storage maintains persistent login states. Users can register as either a customer or salon owner, with role-based access control implemented throughout the application. Social login integration with Google and Facebook OAuth is also supported. An automated welcome email system sends personalized onboarding messages to new users based on their role, integrated across all registration methods.

### File Storage and Media Management
Media uploads are handled via Google Cloud Storage, leveraging Replit's sidecar authentication for secure access. Uppy.js provides a modern file upload interface. An Access Control List (ACL) mechanism ensures fine-grained permissions for uploaded files, allowing for private media access based on user relationships.

### Development and Build System
Vite is used for fast development builds and hot module replacement. The build process compiles both client and server code, with esbuild handling server-side compilation for production. The development environment includes TypeScript checking, Tailwind CSS processing, and PostCSS. Path aliases are configured for improved code organization.

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **Drizzle ORM**: Type-safe database operations.

### Authentication
- **bcrypt**: Password hashing.
- **JWT Tokens**: Session management.
- **Passport.js**: Authentication middleware.

### File Storage
- **Google Cloud Storage**: Object storage for media.
- **Replit Sidecar**: Authentication proxy for GCS.

### Frontend Libraries
- **React**: UI framework.
- **TanStack Query**: Server state management.
- **shadcn/ui**: Component library.
- **Tailwind CSS**: CSS framework.
- **Wouter**: Client-side routing.
- **Uppy.js**: File upload interface.

### Backend Services
- **Express.js**: Web application framework.
- **Replit Runtime**: Hosting and development platform.
- **Vercel Deployment**: Production hosting.
- **Twilio**: SMS OTP for password reset.
- **Nodemailer with Gmail**: Automated welcome email system for new user registrations.
- **Cashfree**: Payment gateway with live production credentials for ₹3 confirmation fee processing and real transaction handling.

### Mobile App Development
- **Capacitor**: Native mobile app wrapper for iOS and Android deployment.
- **Progressive Web App**: Mobile-optimized interface with native app capabilities.
- **Push Notifications**: Firebase integration for booking confirmations and updates.
- **Android Build System**: Complete Gradle configuration with all necessary build files for APK generation.

### Development Tools
- **Vite**: Build tool and development server.
- **TypeScript**: Type-safe compilation.
- **esbuild**: JavaScript bundler.