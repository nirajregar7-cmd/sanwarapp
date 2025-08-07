import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error, isError } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
    enabled: true, // Always enabled but won't refetch due to settings above
  });

  // If we get a 401 error, the user is not authenticated
  const isAuthenticated = !!user && !isError;

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}
