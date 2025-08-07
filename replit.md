# Sanwar - Salon Booking Application

## Overview

Sanwar is a comprehensive salon booking application that connects customers with salon owners through a seamless appointment scheduling platform. The application supports two distinct user types: customers who can discover and book salon services, and salon owners who can manage their businesses through a dedicated dashboard. Built with modern web technologies, it features real-time booking management, integrated payment processing, file uploads for salon media, and a responsive design that works across devices.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client is built with React and TypeScript using a component-based architecture. The UI framework leverages shadcn/ui components built on Radix UI primitives, providing a consistent and accessible design system. Styling is handled through Tailwind CSS with custom design tokens and CSS variables for theming. The application uses Wouter for client-side routing, which provides a lightweight alternative to React Router. State management is handled through TanStack Query (React Query) for server state and React's built-in hooks for local component state.

### Backend Architecture  
The server follows a RESTful API design built with Express.js and TypeScript. The architecture separates concerns through distinct modules: route handlers for API endpoints, storage services for database operations, and middleware for cross-cutting concerns like authentication and request logging. The application uses a service-oriented approach where business logic is encapsulated in service classes, promoting code reuse and maintainability.

### Database Design
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The schema includes tables for users, salons, services, working hours, time slots, bookings, and reviews. The database design supports multi-tenancy through owner-based data isolation and includes session storage for authentication. Key relationships include salon-to-owner (one-to-many), salon-to-services (one-to-many), and booking relationships that connect customers, salons, services, and time slots.

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