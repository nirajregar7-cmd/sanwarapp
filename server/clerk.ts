import { ClerkExpressRequireAuth, ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import type { Request, Response, NextFunction } from 'express';

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error("CLERK_SECRET_KEY environment variable must be set");
}

// Initialize Clerk middleware
export const clerkAuth = ClerkExpressWithAuth();

// Custom middleware to extract user info and make it compatible with existing code
export const withClerkAuth = (req: any, res: Response, next: NextFunction) => {
  clerkAuth(req, res, (err: any) => {
    if (err) {
      return next(err);
    }

    // If user is authenticated, extract user info from Clerk
    if (req.auth?.userId) {
      // Transform Clerk user to match existing user structure
      req.user = {
        id: req.auth.userId,
        email: req.auth.sessionClaims?.email || '',
        firstName: req.auth.sessionClaims?.firstName || '',
        lastName: req.auth.sessionClaims?.lastName || '',
        phone: req.auth.sessionClaims?.phoneNumber || '',
        role: req.auth.sessionClaims?.role || 'customer',
        profileImageUrl: req.auth.sessionClaims?.imageUrl || null
      };
    }

    // Helper method to check authentication
    req.isAuthenticated = () => !!req.auth?.userId;

    next();
  });
};

// Middleware that requires authentication and extracts user info
export const isAuthenticated = (req: any, res: Response, next: NextFunction) => {
  ClerkExpressRequireAuth()(req, res, (err: any) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Extract user info from Clerk
    req.user = {
      id: req.auth.userId,
      email: req.auth.sessionClaims?.email || '',
      firstName: req.auth.sessionClaims?.firstName || '',
      lastName: req.auth.sessionClaims?.lastName || '',
      phone: req.auth.sessionClaims?.phoneNumber || '',
      role: req.auth.sessionClaims?.role || 'customer',
      profileImageUrl: req.auth.sessionClaims?.imageUrl || null
    };

    next();
  });
};