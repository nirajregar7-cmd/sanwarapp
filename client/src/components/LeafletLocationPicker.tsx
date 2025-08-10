import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { MapPin, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LeafletLocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  disabled?: boolean;
}

export function LeafletLocationPicker({ 
  initialLat, 
  initialLng, 
  onLocationSelect, 
  disabled 
}: LeafletLocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const defaultCenter: [number, number] = initialLat && initialLng 
      ? [initialLat, initialLng] 
      : [28.6139, 77.2090]; // Default to Delhi

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        if (!mapRef.current) return;
        
        const map = L.map(mapRef.current).setView(defaultCenter, 13);
        mapInstanceRef.current = map;

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add initial marker if coordinates are provided
        if (initialLat && initialLng) {
          const redIcon = L.divIcon({
            className: 'red-marker',
            html: `
              <div style="
                width: 32px; 
                height: 32px; 
                background: #dc2626; 
                border: 3px solid white; 
                border-radius: 50% 50% 50% 0; 
                transform: rotate(-45deg);
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="
                  width: 8px; 
                  height: 8px; 
                  background: white; 
                  border-radius: 50%;
                  transform: rotate(45deg);
                "></div>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
          });

          const marker = L.marker([initialLat, initialLng], { 
            icon: redIcon,
            draggable: !disabled 
          }).addTo(map);
          
          markerRef.current = marker;

          if (!disabled) {
            marker.on('dragend', () => {
              const position = marker.getLatLng();
              onLocationSelect(position.lat, position.lng);
            });
          }
        }

        // Add click listener to place/move marker
        if (!disabled) {
          map.on('click', (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            
            const redIcon = L.divIcon({
              className: 'red-marker',
              html: `
                <div style="
                  width: 32px; 
                  height: 32px; 
                  background: #dc2626; 
                  border: 3px solid white; 
                  border-radius: 50% 50% 50% 0; 
                  transform: rotate(-45deg);
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                ">
                  <div style="
                    width: 8px; 
                    height: 8px; 
                    background: white; 
                    border-radius: 50%;
                    transform: rotate(45deg);
                  "></div>
                </div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 32],
            });

            if (markerRef.current) {
              markerRef.current.setLatLng([lat, lng]);
            } else {
              const marker = L.marker([lat, lng], { 
                icon: redIcon,
                draggable: true 
              }).addTo(map);
              
              marker.on('dragend', () => {
                const position = marker.getLatLng();
                onLocationSelect(position.lat, position.lng);
              });
              
              markerRef.current = marker;
            }
            
            onLocationSelect(lat, lng);
          });
        }

      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          markerRef.current = null;
        } catch (error) {
          console.error('Error cleaning up map:', error);
        }
      }
    };
  }, [initialLat, initialLng, onLocationSelect, disabled]);

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
        
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          
          if (!disabled) {
            const redIcon = L.divIcon({
              className: 'red-marker',
              html: `
                <div style="
                  width: 32px; 
                  height: 32px; 
                  background: #dc2626; 
                  border: 3px solid white; 
                  border-radius: 50% 50% 50% 0; 
                  transform: rotate(-45deg);
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                ">
                  <div style="
                    width: 8px; 
                    height: 8px; 
                    background: white; 
                    border-radius: 50%;
                    transform: rotate(45deg);
                  "></div>
                </div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 32],
            });

            if (markerRef.current) {
              markerRef.current.setLatLng([lat, lng]);
            } else {
              const marker = L.marker([lat, lng], { 
                icon: redIcon,
                draggable: true 
              }).addTo(mapInstanceRef.current);
              
              marker.on('dragend', () => {
                const position = marker.getLatLng();
                onLocationSelect(position.lat, position.lng);
              });
              
              markerRef.current = marker;
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
      
      {!disabled && currentLocation && (
        <div className="text-sm text-muted-foreground bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-600" />
            <span className="text-green-800 dark:text-green-200">
              Location successfully set to: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}