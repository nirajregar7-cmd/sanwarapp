import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Users } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function UserTypeSelection() {
  const [selectedType, setSelectedType] = useState<"customer" | "salon_owner" | null>(null);
  const { toast } = useToast();

  const setUserTypeMutation = useMutation({
    mutationFn: async (userType: "customer" | "salon_owner") => {
      return await apiRequest("/api/auth/set-user-type", {
        method: "POST",
        body: { userType },
      });
    },
    onSuccess: () => {
      toast({
        title: "Welcome!",
        description: "Your account has been set up successfully.",
      });
      // Invalidate the user query to refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to set user type. Please try again.",
        variant: "destructive",
      });
      console.error("Error setting user type:", error);
    },
  });

  const handleContinue = () => {
    if (selectedType) {
      setUserTypeMutation.mutate(selectedType);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Scissors className="h-12 w-12 text-white mr-4" />
            <h1 className="text-4xl font-bold text-white">Welcome to Sanwar</h1>
          </div>
          <p className="text-xl text-white/90">
            Choose your account type to get started
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedType === "customer" 
                ? "ring-4 ring-white shadow-xl" 
                : "hover:shadow-md"
            }`}
            onClick={() => setSelectedType("customer")}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-10 w-10 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">I'm a Customer</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                I want to discover and book salon services
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Find nearby salons</li>
                <li>• Book appointments instantly</li>
                <li>• Manage bookings</li>
                <li>• Leave reviews</li>
                <li>• Earn referral rewards</li>
              </ul>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedType === "salon_owner" 
                ? "ring-4 ring-white shadow-xl" 
                : "hover:shadow-md"
            }`}
            onClick={() => setSelectedType("salon_owner")}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Scissors className="h-10 w-10 text-purple-600" />
              </div>
              <CardTitle className="text-2xl">I'm a Salon Owner</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                I want to manage my salon business online
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Setup salon profile</li>
                <li>• Manage services & staff</li>
                <li>• Create time slots</li>
                <li>• Handle bookings</li>
                <li>• Track earnings</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="bg-white text-purple-600 hover:bg-gray-100 px-12 py-4 text-lg font-semibold rounded-xl"
            onClick={handleContinue}
            disabled={!selectedType || setUserTypeMutation.isPending}
          >
            {setUserTypeMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                Setting up...
              </>
            ) : (
              "Continue"
            )}
          </Button>
          
          {!selectedType && (
            <p className="text-white/80 text-sm mt-2">
              Please select an account type to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}