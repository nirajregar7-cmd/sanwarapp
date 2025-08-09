import { createClerkClient } from '@clerk/clerk-sdk-node';
import type { Request, Response, NextFunction } from 'express';

// Initialize Clerk client
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

// Middleware to verify Clerk authentication
export async function withClerkAuth(req: Request & { auth?: any }, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.auth = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the session token
    const sessionToken = await clerkClient.verifyToken(token);
    
    if (sessionToken) {
      req.auth = {
        userId: sessionToken.sub,
        sessionClaims: sessionToken,
      };
    } else {
      req.auth = null;
    }
    
    next();
  } catch (error) {
    console.error('Clerk auth error:', error);
    req.auth = null;
    next();
  }
}

// Middleware to ensure authentication
export function isAuthenticated(req: Request & { auth?: any }, res: Response, next: NextFunction) {
  if (!req.auth?.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

export { clerkClient };