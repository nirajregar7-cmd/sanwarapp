import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const STAFF_TOKEN_KEY = "sanwar_staff_token";

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string | null;
  photoUrl: string | null;
  salonId: string;
  salonName?: string;
  experience: string | null;
  specialties: string[] | null;
  bio: string | null;
  isActive: boolean | null;
  rating: string | null;
  totalReviews: number | null;
  canManageSchedule: boolean | null;
  defaultSlotDuration: number | null;
}

export function useStaffAuth() {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(STAFF_TOKEN_KEY);
  });

  const { data: staff, isLoading, error, isError } = useQuery({
    queryKey: ["/api/staff/me"],
    queryFn: async () => {
      const t = localStorage.getItem(STAFF_TOKEN_KEY);
      if (!t) return null;
      const res = await fetch("/api/staff/me", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.status === 401) {
        localStorage.removeItem(STAFF_TOKEN_KEY);
        setToken(null);
        return null;
      }
      if (!res.ok) throw new Error("Failed to fetch staff profile");
      return (await res.json()) as StaffMember;
    },
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: !!token,
  });

  const isAuthenticated = !!staff && !isError;

  const sendOtpMutation = useMutation({
    mutationFn: async (phone: string) => {
      const res = await apiRequest("POST", "/api/staff/send-otp", { phone });
      return await res.json();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send OTP", description: error.message, variant: "destructive" });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async ({ phone, otp }: { phone: string; otp: string }) => {
      const res = await apiRequest("POST", "/api/staff/verify-otp", { phone, otp });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem(STAFF_TOKEN_KEY, data.token);
        setToken(data.token);
        toast({ title: "Login successful!", description: `Welcome, ${data.staff?.name}` });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    },
  });

  const logout = useCallback(() => {
    localStorage.removeItem(STAFF_TOKEN_KEY);
    setToken(null);
    window.location.href = "/staff-login";
  }, []);

  const apiHeaders = useCallback(() => {
    const t = localStorage.getItem(STAFF_TOKEN_KEY);
    return t ? { Authorization: `Bearer ${t}` } : {};
  }, []);

  return {
    staff,
    isLoading,
    isAuthenticated,
    token,
    sendOtpMutation,
    verifyOtpMutation,
    logout,
    apiHeaders,
  };
}
