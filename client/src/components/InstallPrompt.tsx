import { useState } from 'react';
import { usePWA, getDeviceType } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone, Share, MoreVertical } from 'lucide-react';

export function InstallPrompt() {
  const { isInstallable, isInstalled, isDismissed, installApp, dismiss } = usePWA();
  const [showIOSSteps, setShowIOSSteps] = useState(false);
  const device = getDeviceType();

  if (!isInstallable || isInstalled || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    if (device === 'ios') {
      setShowIOSSteps(true);
      return;
    }
    const result = await installApp();
    if (result === 'instructions') {
      setShowIOSSteps(true);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="rounded-2xl border border-purple-100 bg-white shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Smartphone className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Install Sanwar App</p>
              <p className="text-purple-200 text-xs">Free · Works offline</p>
            </div>
          </div>
          <button onClick={dismiss} className="text-white/70 hover:text-white p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        {showIOSSteps ? (
          <div className="p-4 space-y-3">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              {device === 'ios' ? 'Add to Home Screen on iOS' : 'Install via browser menu'}
            </p>
            {device === 'ios' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center flex-shrink-0">1</div>
                  <span>Tap the <Share className="inline h-3.5 w-3.5 text-blue-500" /> <strong>Share</strong> button at the bottom of Safari</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center flex-shrink-0">2</div>
                  <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center flex-shrink-0">3</div>
                  <span>Tap <strong>"Add"</strong> — done! 🎉</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center flex-shrink-0">1</div>
                  <span>Tap <MoreVertical className="inline h-3.5 w-3.5" /> <strong>menu</strong> in your browser</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center flex-shrink-0">2</div>
                  <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></span>
                </div>
              </div>
            )}
            <button onClick={() => setShowIOSSteps(false)} className="text-xs text-purple-600 underline mt-1">
              Go back
            </button>
          </div>
        ) : (
          <div className="p-4">
            <p className="text-gray-600 text-xs mb-3">
              Get faster access, offline browsing, and booking notifications — just like a native app.
            </p>
            <Button
              onClick={handleInstall}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white h-9 text-sm font-medium"
            >
              <Download className="mr-2 h-4 w-4" />
              {device === 'ios' ? 'Add to Home Screen' : 'Install App'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
