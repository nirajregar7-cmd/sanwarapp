import { useUser, useAuth as useClerkHook } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function useClerkAuth() {
  const { isLoaded: clerkLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken } = useClerkHook();

  // Query to sync Clerk user with our backend
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/clerk/sync-user'],
    queryFn: async () => {
      if (!clerkUser || !isSignedIn) return null;
      
      const token = await getToken();
      const response = await fetch('/api/clerk/sync-user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync user');
      }
      
      return response.json();
    },
    enabled: clerkLoaded && isSignedIn && !!clerkUser,
    retry: false,
  });

  return {
    user: user || null,
    isLoading: !clerkLoaded || userLoading,
    isAuthenticated: isSignedIn && !!user,
    clerkUser,
  };
}