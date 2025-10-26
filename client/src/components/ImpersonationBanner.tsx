import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ImpersonationBanner() {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalAdmin, setOriginalAdmin] = useState<any>(null);
  const [exitingImpersonation, setExitingImpersonation] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkImpersonationStatus = async () => {
      try {
        const response = await fetch('/api/auth/session-check', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (response.ok) {
          const sessionData = await response.json();
          setIsImpersonating(sessionData.isImpersonating || false);
          setOriginalAdmin(sessionData.originalAdmin || null);
        }
      } catch (error) {
        console.error('Error checking impersonation status:', error);
      }
    };

    checkImpersonationStatus();
  }, []);

  const exitImpersonation = async () => {
    try {
      setExitingImpersonation(true);
      
      const response = await fetch('/api/admin/exit-impersonation', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: "Returned to Admin Account",
          description: "You have successfully returned to your admin account",
        });
        
        // Redirect to admin dashboard
        window.location.href = '/admin/dashboard';
      } else {
        throw new Error('Failed to exit impersonation');
      }
    } catch (error) {
      console.error('Error exiting impersonation:', error);
      toast({
        title: "Exit Failed",
        description: "Unable to return to admin account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExitingImpersonation(false);
    }
  };

  if (!isImpersonating) {
    return null;
  }

  return (
    <>
      <div className="bg-yellow-500 text-black px-4 py-3 shadow-lg fixed top-0 left-0 right-0 z-[9999] border-b-2 border-yellow-600">
        <div className="container mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">
              Admin Mode: You are viewing as another user
            </span>
            {originalAdmin && (
              <span className="text-sm opacity-90">
                (Logged in as: {originalAdmin.email})
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={exitImpersonation}
            disabled={exitingImpersonation}
            data-testid="btn-exit-impersonation"
            className="bg-white hover:bg-gray-100 text-black font-semibold"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {exitingImpersonation ? 'Exiting...' : 'Return to Admin'}
          </Button>
        </div>
      </div>
      {/* Spacer to push content down */}
      <div className="h-[60px]" />
    </>
  );
}
