import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Users, Scissors, Store } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function RoleSelection() {
  const [userType, setUserType] = useState<"customer" | "salon_owner" | "brand_owner">("customer");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Get provider from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const provider = urlParams.get('provider');

  const completeRegistrationMutation = useMutation({
    mutationFn: async (selectedUserType: "customer" | "salon_owner" | "brand_owner") => {
      const response = await apiRequest("POST", "/api/auth/complete-social-registration", {
        userType: selectedUserType,
        provider: provider || 'google'
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Account Setup Complete!",
        description: `Welcome to Sanwar as a ${userType === 'customer' ? 'customer' : userType === 'salon_owner' ? 'salon owner' : 'brand owner'}!`,
      });
      
      // Navigate based on user type
      if (userType === 'customer') {
        navigate('/customer/home');
      } else if (userType === 'salon_owner') {
        navigate('/salon-owner/dashboard');
      } else {
        navigate('/brand-owner/dashboard');
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
    completeRegistrationMutation.mutate(userType);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 px-4">
      <div className="max-w-md w-full">
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Get Started
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Sign in to your account or create a new one
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">I am a:</h3>
              <RadioGroup 
                value={userType} 
                onValueChange={(value) => setUserType(value as "customer" | "salon_owner" | "brand_owner")}
                className="space-y-4"
              >
                <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-colors">
                  <RadioGroupItem value="customer" id="customer" />
                  <Users className="h-5 w-5 text-gray-600" />
                  <Label htmlFor="customer" className="flex-1 cursor-pointer font-medium">
                    Customer
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-colors">
                  <RadioGroupItem value="salon_owner" id="salon_owner" />
                  <Scissors className="h-5 w-5 text-gray-600" />
                  <Label htmlFor="salon_owner" className="flex-1 cursor-pointer font-medium">
                    Salon Owner
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-colors">
                  <RadioGroupItem value="brand_owner" id="brand_owner" />
                  <Store className="h-5 w-5 text-gray-600" />
                  <Label htmlFor="brand_owner" className="flex-1 cursor-pointer font-medium">
                    Brand Owner (Multiple Salons)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={completeRegistrationMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200"
            >
              {completeRegistrationMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Setting up your account...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}