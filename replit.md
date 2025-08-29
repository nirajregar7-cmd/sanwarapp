# Sanwar - Smart Salon Booking Platform

## Overview
Sanwar is a smart salon booking platform that digitizes salon businesses and simplifies customer bookings. It functions as a comprehensive marketplace, offering real-time slot availability, clear pricing, and instant confirmations, inspired by robust booking systems like IRCTC. The platform aims to provide a seamless, end-to-end solution for the salon industry, enabling digital transformation and enhancing user experience for both salon owners and customers. Key capabilities include comprehensive salon management, intuitive booking and discovery, and integrated payment solutions with automatic revenue sharing.

## Global Platform Features
The platform now supports multiple countries with automatic regional configuration:
- **Country Onboarding**: First-time users select their country for automatic setup
- **Regional Configuration**: Automatic timezone, currency, payment gateway, and language setup based on country selection
- **Supported Countries**: India, USA, UK, Germany, France, UAE, Canada, Australia, Spain, Singapore
- **Payment Gateway Integration**: Cashfree for India, Stripe for international markets
- **Multi-currency Support**: INR, USD, GBP, EUR, AED, CAD, AUD, SGD with proper symbols and formatting
- **Localization**: Support for multiple languages including Hindi, English, German, French, Spanish, Arabic

## User Preferences
Preferred communication style: Simple, everyday language.
Shopkeeper prefers: Single simple slot generation method to avoid confusion.
Individual staff-based slot generation: Implemented with real-time slot counts and staff-specific booking system.
Location-based discovery: Implemented comprehensive geolocation features with automatic permission requests and 30km radius filtering. Fixed location denial handling - when users deny permission, the app respects this choice permanently and shows all India salons without repeated requests.
Promotional offers: Combined popup showing both shopkeeper (top) and customer offers together, appears after 10 seconds, once per session. Fixed button redirects to use correct `/auth` page.

## System Architecture

### Frontend Architecture
The client is built with React and TypeScript, following a component-based architecture. It utilizes shadcn/ui components (based on Radix UI) for a consistent design system, styled with Tailwind CSS. Wouter is used for client-side routing, and TanStack Query for server state management.

#### Location-Based Discovery System
- **useGeolocation Hook**: Custom React hook for managing geolocation state, permissions, and error handling
- **LocationPermissionDialog**: Modal component for requesting location access with clear benefits explanation
- **LocationBasedSalonFilter**: Advanced filtering component with radius selection and status indicators
- **SalonDiscovery Page**: Dedicated page for location-based salon discovery with comprehensive search and filter options
- **Automatic Location Requests**: Smart timing for location permission prompts to improve user experience

### Backend Architecture
The server is built using Express.js and TypeScript, adhering to a RESTful API design. It employs a service-oriented approach, separating concerns into route handlers, storage services, and middleware. Business logic is encapsulated in service classes.

### Database Design
The application uses PostgreSQL as the primary database, with Drizzle ORM for type-safe operations. The schema supports core entities like users, salons, services, working hours, time slots, bookings, and reviews. Enhancements include tables for staff management, customer wallets, wallet transactions, and referral programs. The design supports multi-tenancy with owner-based data isolation.

### Authentication System
The system uses traditional email/password authentication with bcrypt for password hashing and JWT tokens for session management. `express-session` with PostgreSQL storage maintains persistent login states. Role-based access control is implemented, and an automated welcome email system sends personalized onboarding messages to new users.

### File Storage and Media Management
Media uploads are handled via Google Cloud Storage, leveraging Replit's sidecar authentication. Uppy.js provides the file upload interface, and an Access Control List (ACL) ensures fine-grained permissions.

### Development and Build System
Vite is used for fast development builds and hot module replacement. The build process compiles both client and server code, with esbuild handling server-side compilation for production.

### Mobile App Development
The platform supports mobile access via a Progressive Web App and is wrapped for native iOS and Android deployment using Capacitor. Push notifications are integrated via Firebase.

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
- **Nodemailer with Gmail**: Automated welcome email system.
- **Cashfree**: Payment gateway.

### Mobile App Development
- **Capacitor**: Native mobile app wrapper.
- **Firebase**: Push notifications.

### Development Tools
- **Vite**: Build tool and development server.
- **TypeScript**: Type-safe compilation.
- **esbuild**: JavaScript bundler.