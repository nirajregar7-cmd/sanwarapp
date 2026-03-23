import { usePWA } from '@/hooks/usePWA';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MobileInstallButton() {
  const { isInstalled } = usePWA();

  if (isInstalled) {
    return null;
  }

  return null;
}
