import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, UserCheck, ArrowLeft, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ImpersonatePageProps {}

export default function ImpersonatePage({}: ImpersonatePageProps) {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetUser, setTargetUser] = useState<any>(null);
  const { toast } = useToast();

  // Get user ID from URL path
  const userId = window.location.pathname.split('/').pop();

  useEffect(() => {
    if (!userId) {
      setError("Invalid user ID");
      setLoading(false);
      return;
    }

    impersonateUser(userId);
  }, [userId]);

  const impersonateUser = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/impersonate/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setTargetUser(data.targetUser);
        
        toast({
          title: "Impersonation Started",
          description: `You are now logged in as ${data.targetUser.firstName} ${data.targetUser.lastName}`,
        });

        // Redirect to salon owner dashboard after 2 seconds
        setTimeout(() => {
          setLocation("/shopkeeper/dashboard");
        }, 2000);
      } else {
        throw new Error(data.message || "Failed to impersonate user");
      }
    } catch (error: any) {
      console.error("Impersonation error:", error);
      setError(error.message || "Failed to impersonate user");
      toast({
        title: "Impersonation Failed",
        description: error.message || "Unable to impersonate the selected user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-lg font-semibold mb-2">Starting Impersonation</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Switching to salon owner account...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Impersonation Failed
            </CardTitle>
            <CardDescription>
              Unable to access the salon owner's account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setLocation("/admin/salons")}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
              <Button
                onClick={() => impersonateUser(userId!)}
                className="flex-1"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (targetUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <UserCheck className="h-8 w-8 mx-auto mb-4 text-green-600" />
            <h2 className="text-lg font-semibold mb-2">Impersonation Active</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You are now logged in as:
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                {targetUser.firstName} {targetUser.lastName}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                {targetUser.email}
              </p>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Redirecting to salon dashboard...
            </p>
            <Button
              onClick={() => setLocation("/shopkeeper/dashboard")}
              className="w-full"
            >
              Go to Dashboard Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}