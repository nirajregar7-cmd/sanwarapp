import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { MapPin, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export function LocationPicker({ initialLat, initialLng, onLocationSelect, disabled }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();

  // Load Google Maps script
  useEffect(() => {
    if (window.google) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    window.initMap = () => {
      setIsLoaded(true);
    };
    
    script.onload = () => {
      setIsLoaded(true);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, []);

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google) return;

    const defaultCenter = initialLat && initialLng 
      ? { lat: initialLat, lng: initialLng }
      : { lat: 28.6139, lng: 77.2090 }; // Default to Delhi

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    setMap(mapInstance);

    // Add marker if initial position is provided
    if (initialLat && initialLng) {
      const initialMarker = new window.google.maps.Marker({
        position: { lat: initialLat, lng: initialLng },
        map: mapInstance,
        draggable: !disabled,
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#dc2626">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
        }
      });
      setMarker(initialMarker);

      if (!disabled) {
        initialMarker.addListener('dragend', () => {
          const position = initialMarker.getPosition();
          onLocationSelect(position.lat(), position.lng());
        });
      }
    }

    // Add click listener to add/move marker
    if (!disabled) {
      mapInstance.addListener('click', (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        if (marker) {
          marker.setPosition({ lat, lng });
        } else {
          const newMarker = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapInstance,
            draggable: true,
            icon: {
              url: 'data:image/svg+xml;base64,' + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#dc2626">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(32, 32),
            }
          });
          
          newMarker.addListener('dragend', () => {
            const position = newMarker.getPosition();
            onLocationSelect(position.lat(), position.lng());
          });
          
          setMarker(newMarker);
        }
        
        onLocationSelect(lat, lng);
      });
    }
  }, [isLoaded, initialLat, initialLng, onLocationSelect, disabled]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Geolocation is not supported by your browser",
        variant: "destructive"
      });
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setCurrentLocation({ lat, lng });
        setIsGettingLocation(false);
        
        if (map) {
          map.setCenter({ lat, lng });
          map.setZoom(16);
          
          if (!disabled) {
            if (marker) {
              marker.setPosition({ lat, lng });
            } else {
              const newMarker = new window.google.maps.Marker({
                position: { lat, lng },
                map: map,
                draggable: true,
                icon: {
                  url: 'data:image/svg+xml;base64,' + btoa(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#dc2626">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  `),
                  scaledSize: new window.google.maps.Size(32, 32),
                }
              });
              
              newMarker.addListener('dragend', () => {
                const position = newMarker.getPosition();
                onLocationSelect(position.lat(), position.lng());
              });
              
              setMarker(newMarker);
            }
            onLocationSelect(lat, lng);
          }
        }
        
        toast({
          title: "Location found",
          description: "Your current location has been set on the map",
        });
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = "Could not get your current location. Please try again or click on the map to set your location manually.";
        
        if (error.code === 1) {
          errorMessage = "Location access denied. Please allow location access in your browser settings or click on the map to set your location manually.";
        } else if (error.code === 2) {
          errorMessage = "Location unavailable. Please check your connection or click on the map to set your location manually.";
        } else if (error.code === 3) {
          errorMessage = "Location request timeout. Please try again or click on the map to set your location manually.";
        }
        
        toast({
          title: "Location error",
          description: errorMessage,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  if (!isLoaded) {
    return (
      <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!disabled && (
        <div className="flex gap-2">
          <Button 
            type="button"
            variant="outline" 
            size="sm"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="flex items-center gap-2"
          >
            {isGettingLocation ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            {isGettingLocation ? "Getting Location..." : "Use Current Location"}
          </Button>
        </div>
      )}
      
      <div className="relative">
        <div 
          ref={mapRef} 
          className="w-full h-64 rounded-lg border"
          style={{ minHeight: '256px' }}
        />
        {!disabled && (
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-900 px-3 py-2 rounded-lg shadow-md text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 text-red-600" />
              Click on map to set location
            </div>
          </div>
        )}
      </div>
    </div>
  );
}