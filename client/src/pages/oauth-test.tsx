import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OAuthTest() {
  const testGoogleOAuth = () => {
    // Direct navigation to Google OAuth - this should work in Replit
    const authUrl = `/api/auth/google`;
    console.log('Navigating to:', authUrl);
    window.location.assign(authUrl);
  };

  const openInNewTab = () => {
    // Try opening in new tab with proper target
    const authUrl = `/api/auth/google`;
    window.open(authUrl, '_blank', 'width=500,height=600,scrollbars=yes,resizable=yes');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>OAuth Testing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Testing different approaches to Google OAuth in Replit environment:
          </p>
          
          <Button 
            onClick={testGoogleOAuth}
            className="w-full"
            data-testid="button-direct-oauth"
          >
            Direct OAuth Navigation
          </Button>
          
          <Button 
            onClick={openInNewTab}
            className="w-full"
            variant="outline"
            data-testid="button-new-tab-oauth"
          >
            Open OAuth in New Tab
          </Button>
          
          <div className="text-xs text-gray-500 space-y-1">
            <p>• First button uses window.location.assign()</p>
            <p>• Second button uses window.open() with specific dimensions</p>
            <p>• Check console for navigation logs</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}