import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OAuthTestSimple() {
  const { toast } = useToast();
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "कॉपी हो गया!",
        description: "URL क्लिपबोर्ड में कॉपी हो गया है",
      });
    });
  };

  const oauthUrl = window.location.origin + '/api/auth/google';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-4">
      <Card className="w-full max-w-lg bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Google OAuth Test
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Direct link to test Google authentication
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">Step 1: Copy this URL</h3>
            <div className="bg-white p-3 rounded border text-sm font-mono break-all text-gray-700">
              {oauthUrl}
            </div>
            <Button 
              onClick={() => copyToClipboard(oauthUrl)}
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              data-testid="button-copy-url"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy URL
            </Button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3">Step 2: Open in new tab</h3>
            <p className="text-sm text-green-700 mb-3">
              1. Copy the URL above<br/>
              2. Open a new browser tab<br/>
              3. Paste and press Enter<br/>
              4. Complete Google sign in
            </p>
            <a 
              href={oauthUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              data-testid="link-open-oauth"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Google OAuth
            </a>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Expected Flow:</h3>
            <ol className="text-sm text-gray-700 space-y-1">
              <li>1. Redirect to Google login page</li>
              <li>2. Sign in with your Google account</li>
              <li>3. Return to Sanwar app</li>
              <li>4. Select your user type (Customer/Salon Owner)</li>
              <li>5. Complete registration</li>
            </ol>
          </div>

          <div className="text-center">
            <a 
              href="/auth" 
              className="text-sm text-gray-500 hover:text-gray-700 underline"
              data-testid="link-back-auth"
            >
              ← Back to main auth page
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}