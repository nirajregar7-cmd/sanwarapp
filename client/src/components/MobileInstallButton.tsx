import { useState } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Download, Smartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function MobileInstallButton() {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [showInstructions, setShowInstructions] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    const success = await installApp();
    if (!success) {
      setShowInstructions(true);
    }
  };

  const getInstallInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return {
        title: "Install on iOS",
        steps: [
          "1. Tap the Share button (↗️) at the bottom",
          "2. Scroll down and tap 'Add to Home Screen'",
          "3. Tap 'Add' to install the app"
        ]
      };
    } else if (userAgent.includes('android')) {
      return {
        title: "Install on Android",
        steps: [
          "1. Tap the menu (⋮) in your browser",
          "2. Look for 'Install app' or 'Add to Home screen'",
          "3. Tap to install the Sanwar app"
        ]
      };
    } else {
      return {
        title: "Install on Desktop",
        steps: [
          "1. Look for the install icon (⊞) in the address bar",
          "2. Or use browser menu → 'Install Sanwar'",
          "3. Click 'Install' to add the app"
        ]
      };
    }
  };

  if (showInstructions) {
    const instructions = getInstallInstructions();
    return (
      <Card className="fixed inset-4 z-50 max-w-sm mx-auto my-auto bg-white dark:bg-gray-900 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            {instructions.title}
          </CardTitle>
          <CardDescription>
            Follow these steps to install Sanwar app:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {instructions.steps.map((step, index) => (
            <p key={index} className="text-sm">{step}</p>
          ))}
          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowInstructions(false)}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Button 
      onClick={handleInstall}
      className="fixed bottom-4 right-4 z-40 rounded-full h-14 w-14 p-0 shadow-lg bg-primary hover:bg-primary/90"
      title="Install Sanwar App"
    >
      <Download className="h-6 w-6" />
    </Button>
  );
}