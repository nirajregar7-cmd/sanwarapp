import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Navigation, MapPin, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShopLocationMapProps {
  shopLat: number;
  shopLng: number;
  shopName: string;
  shopAddress: string;
  showNavigationButton?: boolean;
}

declare global {
  interface Window {
    google: any;
  }
}

export function ShopLocationMap({ 
  shopLat, 
  shopLng, 
  shopName, 
  shopAddress, 
  showNavigationButton = true 
}: ShopLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [distance, setDistance] = useState<string>('');
  const { toast } = useToast();

  // Load Google Maps script
  useEffect(() => {
    if (window.google) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBGne0aJNnXjDlE1KkLFPsQSZfCOTRNZBM&libraries=geometry`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
    };

    document.head.appendChild(script);
  }, []);

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google) return;

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: { lat: shopLat, lng: shopLng },
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    // Add shop marker (red)
    const shopMarker = new window.google.maps.Marker({
      position: { lat: shopLat, lng: shopLng },
      map: mapInstance,
      title: shopName,
      icon: {
        url: 'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#dc2626">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(40, 40),
      }
    });

    // Add info window for shop
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div class="p-2">
          <h3 class="font-semibold text-lg">${shopName}</h3>
          <p class="text-sm text-gray-600 mt-1">${shopAddress}</p>
          <div class="mt-2 flex items-center gap-1 text-red-600">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span class="text-sm font-medium">Salon Location</span>
          </div>
        </div>
      `
    });

    shopMarker.addListener('click', () => {
      infoWindow.open(mapInstance, shopMarker);
    });

    setMap(mapInstance);
  }, [isLoaded, shopLat, shopLng, shopName, shopAddress]);

  const getCurrentLocationAndShowRoute = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Geolocation is not supported by your browser",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        setUserLocation({ lat: userLat, lng: userLng });
        
        if (map && window.google) {
          // Add user location marker (blue)
          const userMarker = new window.google.maps.Marker({
            position: { lat: userLat, lng: userLng },
            map: map,
            title: 'Your Location',
            icon: {
              url: 'data:image/svg+xml;base64,' + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#2563eb">
                  <circle cx="12" cy="12" r="8" fill="#2563eb"/>
                  <circle cx="12" cy="12" r="4" fill="white"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(32, 32),
            }
          });

          // Calculate and display distance
          const userLatLng = new window.google.maps.LatLng(userLat, userLng);
          const shopLatLng = new window.google.maps.LatLng(shopLat, shopLng);
          const distanceInMeters = window.google.maps.geometry.spherical.computeDistanceBetween(userLatLng, shopLatLng);
          const distanceInKm = (distanceInMeters / 1000).toFixed(2);
          setDistance(distanceInKm);

          // Adjust map bounds to show both locations
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend(userLatLng);
          bounds.extend(shopLatLng);
          map.fitBounds(bounds);
          
          // Add padding to bounds
          const padding = { top: 50, right: 50, bottom: 50, left: 50 };
          map.fitBounds(bounds, padding);

          toast({
            title: "Location found",
            description: `Distance to salon: ${distanceInKm} km`,
          });
        }
      },
      (error) => {
        toast({
          title: "Location error",
          description: "Could not get your current location. Please enable location access.",
          variant: "destructive"
        });
      }
    );
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${shopLat},${shopLng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const openInAppleMaps = () => {
    const url = `http://maps.apple.com/?daddr=${shopLat},${shopLng}&dirflg=d`;
    window.open(url, '_blank');
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
      <div className="flex flex-col sm:flex-row gap-2">
        {showNavigationButton && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={getCurrentLocationAndShowRoute}
            className="flex items-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            Show My Location
          </Button>
        )}
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={openInGoogleMaps}
          className="flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Open in Google Maps
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={openInAppleMaps}
          className="flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Open in Apple Maps
        </Button>
      </div>

      {distance && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">
              Distance to salon: {distance} km
            </span>
          </div>
        </div>
      )}
      
      <div className="relative">
        <div 
          ref={mapRef} 
          className="w-full h-64 rounded-lg border"
          style={{ minHeight: '256px' }}
        />
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-900 px-3 py-2 rounded-lg shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span className="text-sm font-medium">{shopName}</span>
          </div>
          {userLocation && (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span className="text-sm text-muted-foreground">Your Location</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}