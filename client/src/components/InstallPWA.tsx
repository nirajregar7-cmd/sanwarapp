import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app was installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  if (isInstalled || !showInstallButton) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-full p-2">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">Install Sanwar App</p>
            <p className="text-xs text-white/80">Quick access on your home screen</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleInstallClick}
            size="sm"
            className="bg-white text-purple-600 hover:bg-gray-100 font-semibold"
            data-testid="button-install-pwa"
          >
            Install
          </Button>
          <button
            onClick={() => setShowInstallButton(false)}
            className="text-white/80 hover:text-white p-1"
            aria-label="Close install prompt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
