import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useGeolocation, type GeolocationPosition } from "@/hooks/useGeolocation";
import { useAuth } from "@/hooks/useAuth";

interface LocationPreference {
  lat: number;
  lng: number;
  radius: number;
  address?: string;
  lastUpdated: string;
}

interface LocationContextType {
  userLocation: GeolocationPosition | null;
  locationPreference: LocationPreference | null;
  hasAskedPermission: boolean;
  showLocationDialog: boolean;
  setShowLocationDialog: (show: boolean) => void;
  updateLocationPreference: (preference: LocationPreference) => void;
  clearLocationPreference: () => void;
  requestLocationOnce: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { position, requestLocation, permissionState } = useGeolocation();
  const [locationPreference, setLocationPreference] = useState<LocationPreference | null>(null);
  const [hasAskedPermission, setHasAskedPermission] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);

  // Load saved location preference from localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('sanwar_location_preference');
    const savedPermissionAsked = localStorage.getItem('sanwar_permission_asked');
    const savedPermissionDenied = localStorage.getItem('sanwar_permission_denied');
    
    console.log('LocationContext: Loading from localStorage', {
      savedPreference: !!savedPreference,
      savedPermissionAsked,
      savedPermissionDenied,
      isAuthenticated,
      userType: user?.userType
    });
    
    if (savedPreference) {
      try {
        const preference = JSON.parse(savedPreference);
        setLocationPreference(preference);
        console.log('LocationContext: Loaded location preference:', preference);
      } catch (error) {
        console.error('Failed to parse saved location preference:', error);
      }
    }
    
    // If permission was asked (either granted or denied), don't ask again
    if (savedPermissionAsked === 'true' || savedPermissionDenied === 'true') {
      setHasAskedPermission(true);
      console.log('LocationContext: Permission already asked/denied, not showing dialog');
    }
  }, [isAuthenticated, user]);

  // Show location dialog for first-time visitors (not authenticated users)
  useEffect(() => {
    console.log('LocationContext: Checking if should show dialog', {
      isAuthenticated,
      hasAskedPermission,
      hasLocationPreference: !!locationPreference,
      showLocationDialog
    });
    
    // Only show for first-time visitors who haven't been asked permission before
    // This will appear on the main landing page, not after login
    if (
      !isAuthenticated && // Show only for non-authenticated users
      !hasAskedPermission && 
      !locationPreference &&
      !showLocationDialog // Prevent showing multiple times
    ) {
      console.log('LocationContext: Will show location dialog for first-time visitor in 3 seconds');
      const timer = setTimeout(() => {
        console.log('LocationContext: Actually showing location dialog now');
        setShowLocationDialog(true);
      }, 3000); // Show after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, hasAskedPermission, locationPreference, showLocationDialog]);

  const updateLocationPreference = (preference: LocationPreference) => {
    setLocationPreference(preference);
    localStorage.setItem('sanwar_location_preference', JSON.stringify(preference));
  };

  const clearLocationPreference = () => {
    setLocationPreference(null);
    localStorage.removeItem('sanwar_location_preference');
  };

  const requestLocationOnce = async () => {
    try {
      console.log('Requesting location permission...');
      await requestLocation();
      
      // Mark as asked regardless of result
      setHasAskedPermission(true);
      localStorage.setItem('sanwar_permission_asked', 'true');
      setShowLocationDialog(false);
      
      console.log('Location permission request completed');
    } catch (error) {
      console.error('Location request failed:', error);
      // Still mark as asked to prevent repeated requests
      setHasAskedPermission(true);
      localStorage.setItem('sanwar_permission_asked', 'true');
      setShowLocationDialog(false);
    }
  };

  // Update preference when position changes
  useEffect(() => {
    if (position && hasAskedPermission) {
      const preference: LocationPreference = {
        lat: position.lat,
        lng: position.lng,
        radius: locationPreference?.radius || 30,
        address: locationPreference?.address,
        lastUpdated: new Date().toISOString()
      };
      updateLocationPreference(preference);
    }
  }, [position, hasAskedPermission]);

  const contextValue: LocationContextType = {
    userLocation: position,
    locationPreference,
    hasAskedPermission,
    showLocationDialog,
    setShowLocationDialog,
    updateLocationPreference,
    clearLocationPreference,
    requestLocationOnce
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}