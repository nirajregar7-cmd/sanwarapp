import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type DeviceType = 'ios' | 'android' | 'desktop';

export function getDeviceType(): DeviceType {
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|iphone|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'desktop';
}

const DISMISS_KEY = 'pwa-prompt-dismissed-at';
const REDISPLAY_DAYS = 7;

function wasDismissedRecently(): boolean {
  const dismissedAt = localStorage.getItem(DISMISS_KEY);
  if (!dismissedAt) return false;
  const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
  return daysSince < REDISPLAY_DAYS;
}

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(wasDismissedRecently);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const installed = isStandalone || isInWebAppiOS;
    setIsInstalled(installed);

    if (!installed) {
      setIsInstallable(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async (): Promise<'installed' | 'instructions' | 'dismissed'> => {
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setIsInstallable(false);
          setInstallPrompt(null);
          return 'installed';
        }
        return 'dismissed';
      } catch {
        return 'instructions';
      }
    }
    return 'instructions';
  };

  const dismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  return {
    isInstallable,
    isInstalled,
    isDismissed,
    installPrompt,
    installApp,
    dismiss,
    deviceType: getDeviceType(),
  };
}
