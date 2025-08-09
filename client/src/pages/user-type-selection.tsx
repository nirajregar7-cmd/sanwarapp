import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Users, Store } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { useClerkAuth } from "@/hooks/useClerkAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function UserTypeSelection() {
  const [userType, setUserType] = useState<"customer" | "salon_owner">("customer");
  const { isSignedIn } = useAuth();
  const { user } = useClerkAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const updateUserTypeMutation = useMutation({
    mutationFn: async (selectedUserType: "customer" | "salon_owner") => {
      const response = await apiRequest("PUT", "/api/user/type", {
        userType: selectedUserType,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Account Setup Complete!",
        description: `Welcome to Sanwar as a ${userType === 'customer' ? 'customer' : 'salon owner'}!`,
      });
      
      // Navigate based on user type
      if (userType === 'customer') {
        navigate('/customer/home');
      } else {
        navigate('/salon-owner/dashboard');
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    updateUserTypeMutation.mutate(userType);
  };

  // Redirect if not signed in
  if (!isSignedIn) {
    navigate('/clerk-signin');
    return null;
  }

  // If user already has a type, redirect to appropriate page
  if (user?.userType && user.userType !== 'customer') {
    if (user.userType === 'salon_owner') {
      navigate('/salon-owner/dashboard');
    } else if (user.userType === 'admin' || user.userType === 'super_admin') {
      navigate('/admin/dashboard');
    }
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Choose Your Account Type
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Help us personalize your Sanwar experience
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <RadioGroup value={userType} onValueChange={(value) => setUserType(value as "customer" | "salon_owner")}>
              <div className="space-y-4">
                {/* Customer Option */}
                <Label
                  htmlFor="customer"
                  className={`flex items-center space-x-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    userType === 'customer'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <RadioGroupItem value="customer" id="customer" />
                  <Users className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Customer</div>
                    <div className="text-sm text-gray-600">
                      Book salon appointments and discover new services
                    </div>
                  </div>
                </Label>

                {/* Salon Owner Option */}
                <Label
                  htmlFor="salon_owner"
                  className={`flex items-center space-x-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    userType === 'salon_owner'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <RadioGroupItem value="salon_owner" id="salon_owner" />
                  <Store className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Salon Owner</div>
                    <div className="text-sm text-gray-600">
                      Manage your salon, services, and bookings
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            <Button
              onClick={handleSubmit}
              disabled={updateUserTypeMutation.isPending}
              className="w-full"
            >
              {updateUserTypeMutation.isPending ? "Setting up..." : "Continue"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}