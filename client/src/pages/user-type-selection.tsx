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
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Who are you?</h1>
          <p className="text-xl text-white/90">Choose your account type to get started with Sanwar</p>
        </div>

        {/* User Type Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Customer Card */}
          <div
            onClick={() => setUserType("customer")}
            className={`bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:scale-105 ${
              userType === 'customer' ? 'ring-4 ring-white/50 shadow-2xl' : 'hover:shadow-xl'
            }`}
          >
            <div className="text-center mb-6">
              <div className="bg-blue-500 rounded-2xl p-4 inline-block mb-4">
                <Users className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">I'm a Customer</h2>
              <p className="text-blue-100">I want to discover and book salon services</p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center text-white">
                <CheckCircle className="h-5 w-5 mr-3 text-green-300" />
                <span>Find nearby salons</span>
              </div>
              <div className="flex items-center text-white">
                <CheckCircle className="h-5 w-5 mr-3 text-green-300" />
                <span>Book appointments instantly</span>
              </div>
              <div className="flex items-center text-white">
                <CheckCircle className="h-5 w-5 mr-3 text-green-300" />
                <span>Manage bookings</span>
              </div>
              <div className="flex items-center text-white">
                <CheckCircle className="h-5 w-5 mr-3 text-green-300" />
                <span>Leave reviews & earn rewards</span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={updateUserTypeMutation.isPending || userType !== 'customer'}
              className={`w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold py-3 mb-4 ${
                userType === 'customer' ? 'block' : 'hidden'
              }`}
            >
              {updateUserTypeMutation.isPending ? "Setting up..." : "Sign Up / Login as Customer"}
            </Button>

            <Button
              variant="outline"
              className="w-full bg-blue-500/30 border-blue-300 text-white hover:bg-blue-500/50"
              data-testid="button-refer-earn-customer"
            >
              <Gift className="h-4 w-4 mr-2" />
              Refer & Earn
            </Button>
          </div>

          {/* Salon Owner Card */}
          <div
            onClick={() => setUserType("salon_owner")}
            className={`bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:scale-105 ${
              userType === 'salon_owner' ? 'ring-4 ring-white/50 shadow-2xl' : 'hover:shadow-xl'
            }`}
          >
            <div className="text-center mb-6">
              <div className="bg-pink-500 rounded-2xl p-4 inline-block mb-4">
                <Store className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">I'm a Salon Owner</h2>
              <p className="text-purple-100">I want to manage my salon business online</p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center text-white">
                <CheckCircle className="h-5 w-5 mr-3 text-green-300" />
                <span>Setup salon profile</span>
              </div>
              <div className="flex items-center text-white">
                <CheckCircle className="h-5 w-5 mr-3 text-green-300" />
                <span>Manage services & staff</span>
              </div>
              <div className="flex items-center text-white">
                <CheckCircle className="h-5 w-5 mr-3 text-green-300" />
                <span>Create time slots</span>
              </div>
              <div className="flex items-center text-white">
                <CheckCircle className="h-5 w-5 mr-3 text-green-300" />
                <span>Handle bookings & earnings</span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={updateUserTypeMutation.isPending || userType !== 'salon_owner'}
              className={`w-full bg-white text-purple-600 hover:bg-purple-50 font-semibold py-3 mb-4 ${
                userType === 'salon_owner' ? 'block' : 'hidden'
              }`}
            >
              {updateUserTypeMutation.isPending ? "Setting up..." : "Sign Up / Login as Salon Owner"}
            </Button>

            <Button
              variant="outline"
              className="w-full bg-purple-500/30 border-purple-300 text-white hover:bg-purple-500/50"
              data-testid="button-refer-earn-salon"
            >
              <Gift className="h-4 w-4 mr-2" />
              Refer & Earn
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}