import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, ArrowRight } from "lucide-react";

export default function OAuthRedirect() {
  const handleDirectOAuth = () => {
    // Direct window navigation - most reliable in Replit
    window.location.href = '/api/auth/google';
  };

  const handleNewTabOAuth = () => {
    // Open in new tab/window
    window.open('/api/auth/google', '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Complete Google Sign In
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Choose how to proceed with Google authentication
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Option 1: Same Window</h3>
            <p className="text-sm text-blue-700 mb-3">
              Redirect to Google authentication in this window
            </p>
            <Button 
              onClick={handleDirectOAuth}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-same-window-oauth"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Continue with Google
            </Button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Option 2: New Tab</h3>
            <p className="text-sm text-green-700 mb-3">
              Open Google authentication in a new tab
            </p>
            <Button 
              onClick={handleNewTabOAuth}
              variant="outline"
              className="w-full border-green-600 text-green-700 hover:bg-green-50"
              data-testid="button-new-tab-oauth"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </Button>
          </div>

          <div className="text-center">
            <a 
              href="/auth" 
              className="text-sm text-gray-500 hover:text-gray-700 underline"
              data-testid="link-back-auth"
            >
              ← Back to sign in page
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}