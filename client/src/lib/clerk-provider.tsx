import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Only initialize Clerk if we have a valid publishable key
const isClerkEnabled = publishableKey && publishableKey.startsWith('pk_');

export function AppClerkProvider({ children }: { children: React.ReactNode }) {
  // If Clerk is not enabled or configured, just render children without Clerk
  if (!isClerkEnabled) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      {children}
    </ClerkProvider>
  );
}