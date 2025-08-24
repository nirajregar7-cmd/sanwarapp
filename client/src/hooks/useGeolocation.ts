import { useState, useEffect, useCallback } from "react";

export interface GeolocationPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export interface UseGeolocationReturn {
  position: GeolocationPosition | null;
  error: GeolocationError | null;
  loading: boolean;
  permissionState: PermissionState | null;
  requestLocation: () => Promise<void>;
  watchLocation: () => void;
  stopWatching: () => void;
  clearLocation: () => void;
  isSupported: boolean;
}

export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const isSupported = 'geolocation' in navigator;

  // Check permission state
  useEffect(() => {
    if (!isSupported) return;

    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(result => {
          setPermissionState(result.state);
          result.addEventListener('change', () => {
            setPermissionState(result.state);
          });
        })
        .catch(() => {
          // Permissions API not supported
          setPermissionState(null);
        });
    }
  }, [isSupported]);

  const handleSuccess = useCallback((pos: globalThis.GeolocationPosition) => {
    const location: GeolocationPosition = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      timestamp: pos.timestamp
    };
    setPosition(location);
    setError(null);
    setLoading(false);
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    const errorInfo: GeolocationError = {
      code: err.code,
      message: getErrorMessage(err.code)
    };
    setError(errorInfo);
    setPosition(null);
    setLoading(false);
  }, []);

  const requestLocation = useCallback(async () => {
    if (!isSupported) {
      setError({
        code: 0,
        message: "Geolocation is not supported by this browser"
      });
      return;
    }

    setLoading(true);
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      options
    );
  }, [isSupported, handleSuccess, handleError]);

  const watchLocation = useCallback(() => {
    if (!isSupported || watchId !== null) return;

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 60000 // 1 minute
    };

    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );

    setWatchId(id);
  }, [isSupported, watchId, handleSuccess, handleError]);

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  const clearLocation = useCallback(() => {
    setPosition(null);
    setError(null);
    setLoading(false);
    stopWatching();
  }, [stopWatching]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return {
    position,
    error,
    loading,
    permissionState,
    requestLocation,
    watchLocation,
    stopWatching,
    clearLocation,
    isSupported
  };
}

function getErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return "Location access denied by user";
    case 2:
      return "Location information unavailable";
    case 3:
      return "Location request timeout";
    default:
      return "An unknown error occurred while retrieving location";
  }
}