import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Users, Store, CheckCircle, Gift } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-blue-100 to-slate-300 flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🔥 UPDATED VERSION 🔥</h1>
          <p className="text-lg text-gray-600">Choose your account type to get started with Sanwar</p>
        </div>

        {/* User Type Cards - Updated Design */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Customer Card */}
          <div
            onClick={() => setUserType("customer")}
            className={`bg-white rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
              userType === 'customer' ? 'border-blue-500 shadow-xl' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center mb-6">
              <div className="bg-blue-500 rounded-full p-3 inline-block mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">I'm a Customer</h2>
              <p className="text-gray-600 text-sm">I want to discover and book salon services</p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center text-gray-700">
                <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                <span className="text-sm">Find nearby salons</span>
              </div>
              <div className="flex items-center text-gray-700">
                <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                <span className="text-sm">Book appointments instantly</span>
              </div>
              <div className="flex items-center text-gray-700">
                <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                <span className="text-sm">Manage bookings</span>
              </div>
              <div className="flex items-center text-gray-700">
                <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                <span className="text-sm">Leave reviews & earn rewards</span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={updateUserTypeMutation.isPending || userType !== 'customer'}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 mb-4 ${
                userType === 'customer' ? 'block' : 'hidden'
              }`}
            >
              {updateUserTypeMutation.isPending ? "Setting up..." : "Sign Up / Login as Customer"}
            </Button>

            <div className="text-center">
              <button className="text-gray-500 text-sm hover:text-gray-700" data-testid="button-refer-earn-customer">
                Refer & Earn
              </button>
            </div>
          </div>

          {/* Salon Owner Card */}
          <div
            onClick={() => setUserType("salon_owner")}
            className={`bg-white rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
              userType === 'salon_owner' ? 'border-blue-500 shadow-xl' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center mb-6">
              <div className="bg-blue-500 rounded-full p-3 inline-block mb-4">
                <Store className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">I'm a Salon Owner</h2>
              <p className="text-gray-600 text-sm">I want to manage my salon business online</p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center text-gray-700">
                <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                <span className="text-sm">Setup salon profile</span>
              </div>
              <div className="flex items-center text-gray-700">
                <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                <span className="text-sm">Manage services & staff</span>
              </div>
              <div className="flex items-center text-gray-700">
                <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                <span className="text-sm">Create time slots</span>
              </div>
              <div className="flex items-center text-gray-700">
                <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                <span className="text-sm">Handle bookings & earnings</span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={updateUserTypeMutation.isPending || userType !== 'salon_owner'}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 mb-4 ${
                userType === 'salon_owner' ? 'block' : 'hidden'
              }`}
            >
              {updateUserTypeMutation.isPending ? "Setting up..." : "Sign Up / Login as Salon Owner"}
            </Button>

            <div className="text-center">
              <button className="text-gray-500 text-sm hover:text-gray-700" data-testid="button-refer-earn-salon">
                Refer & Earn
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}