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
    
    if (savedPreference) {
      try {
        const preference = JSON.parse(savedPreference);
        setLocationPreference(preference);
      } catch (error) {
        console.error('Failed to parse saved location preference:', error);
      }
    }
    
    if (savedPermissionAsked === 'true') {
      setHasAskedPermission(true);
    }
  }, []);

  // Show location dialog for new users who haven't been asked before
  useEffect(() => {
    if (isAuthenticated && user?.userType === 'customer' && !hasAskedPermission && !locationPreference) {
      // Only show if we haven't asked before and user doesn't have saved location
      const timer = setTimeout(() => {
        setShowLocationDialog(true);
      }, 2000); // Show after 2 seconds
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, hasAskedPermission, locationPreference]);

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
      await requestLocation();
      setHasAskedPermission(true);
      localStorage.setItem('sanwar_permission_asked', 'true');
      setShowLocationDialog(false);
      
      // If successful, save as preference
      if (position) {
        const preference: LocationPreference = {
          lat: position.lat,
          lng: position.lng,
          radius: 30, // Default 30km radius
          lastUpdated: new Date().toISOString()
        };
        updateLocationPreference(preference);
      }
    } catch (error) {
      console.error('Location request failed:', error);
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