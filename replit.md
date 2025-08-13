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
- **Razorpay**: Payment gateway with live API keys for real transaction processing and automatic payout system.

### Mobile App Development
- **Capacitor**: Native mobile app wrapper for iOS and Android deployment.
- **Progressive Web App**: Mobile-optimized interface with native app capabilities.
- **Push Notifications**: Firebase integration for booking confirmations and updates.

### Development Tools
- **Vite**: Build tool and development server.
- **TypeScript**: Type-safe compilation.
- **esbuild**: JavaScript bundler.