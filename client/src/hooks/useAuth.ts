import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error, isError } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: false,
    refetchOnWindowFocus: false,
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
  });

  // If we get a 401 error, the user is not authenticated
  const isAuthenticated = !!user && !isError;

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}
