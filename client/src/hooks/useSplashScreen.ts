import { useState, useEffect } from 'react';

export function useSplashScreen() {
  const [showSplash, setShowSplash] = useState(() => {
    // Check if splash was already shown in this session
    const splashShown = sessionStorage.getItem('sanwar_splash_shown');
    // Clear session storage to show splash with new logo
    sessionStorage.removeItem('sanwar_splash_shown');
    return true;
  });

  const hideSplash = () => {
    setShowSplash(false);
    sessionStorage.setItem('sanwar_splash_shown', 'true');
  };

  return {
    showSplash,
    hideSplash
  };
}