import { useState, useEffect } from 'react';

export function useSplashScreen() {
  const [showSplash, setShowSplash] = useState(() => {
    // Check if splash was already shown in this session
    const splashShown = sessionStorage.getItem('sanwar_splash_shown');
    return !splashShown;
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