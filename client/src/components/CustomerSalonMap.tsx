import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Navigation, MapPin, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomerSalonMapProps {
  shopLat: number;
  shopLng: number;
  shopName: string;
  shopAddress: string;
  showNavigationButton?: boolean;
}

export function CustomerSalonMap({ 
  shopLat, 
  shopLng, 
  shopName, 
  shopAddress, 
  showNavigationButton = true 
}: CustomerSalonMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [distance, setDistance] = useState<string>('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const { toast } = useToast();

  // Dynamically load Leaflet
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');

        // Fix for default markers in Leaflet with Webpack
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        (window as any).L = L;
        setLeafletLoaded(true);
      } catch (error) {
        console.error('Failed to load Leaflet:', error);
      }
    };

    if (!(window as any).L) {
      loadLeaflet();
    } else {
      setLeafletLoaded(true);
    }
  }, []);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    try {
      const map = L.map(mapRef.current).setView([shopLat, shopLng], 15);
      mapInstanceRef.current = map;

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add shop marker (red)
      const shopIcon = L.divIcon({
        className: 'shop-marker',
        html: `
          <div style="
            width: 40px; 
            height: 40px; 
            background: #dc2626; 
            border: 4px solid white; 
            border-radius: 50% 50% 50% 0; 
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          ">
            <div style="
              width: 12px; 
              height: 12px; 
              background: white; 
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      const shopMarker = L.marker([shopLat, shopLng], { icon: shopIcon }).addTo(map);

      // Add popup for shop
      shopMarker.bindPopup(`
        <div class="p-2">
          <h3 class="font-semibold text-lg">${shopName}</h3>
          <p class="text-sm text-gray-600 mb-2">${shopAddress}</p>
        </div>
      `);

    } catch (error) {
      console.error('Error initializing customer map:', error);
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (error) {
          console.error('Error cleaning up customer map:', error);
        }
      }
    };
  }, [leafletLoaded, shopLat, shopLng, shopName, shopAddress]);

  // Add user location marker when available
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current || !userLocation) return;

    const L = (window as any).L;
    if (!L) return;

    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `
        <div style="
          width: 20px; 
          height: 20px; 
          background: #3b82f6; 
          border: 3px solid white; 
          border-radius: 50%; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          position: relative;
        ">
          <div style="
            width: 30px; 
            height: 30px; 
            background: rgba(59, 130, 246, 0.2); 
            border-radius: 50%; 
            position: absolute;
            top: -8px;
            left: -8px;
            animation: pulse 2s infinite;
          "></div>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup('Your Location');

    // Calculate and display distance
    const dist = calculateDistance(userLocation.lat, userLocation.lng, shopLat, shopLng);
    setDistance(dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`);

    // Fit map to show both locations
    const group = L.featureGroup([
      L.marker([shopLat, shopLng]),
      L.marker([userLocation.lat, userLocation.lng])
    ]);
    mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));

  }, [leafletLoaded, userLocation, shopLat, shopLng]);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setIsGettingLocation(false);
        toast({
          title: "Location found",
          description: "Your location has been marked on the map",
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "Location error",
          description: "Unable to get your location. Please try again.",
          variant: "destructive",
        });
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  const openInMaps = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let mapsUrl = '';
    
    if (isIOS) {
      // Apple Maps for iOS
      mapsUrl = `maps://maps.google.com/maps?daddr=${shopLat},${shopLng}&dirflg=d`;
    } else if (isAndroid) {
      // Google Maps for Android
      mapsUrl = `geo:${shopLat},${shopLng}?q=${shopLat},${shopLng}(${encodeURIComponent(shopName)})`;
    } else {
      // Fallback to Google Maps web
      mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${shopLat},${shopLng}&travelmode=driving`;
    }
    
    // Try to open native app first
    const link = document.createElement('a');
    link.href = mapsUrl;
    link.click();
    
    // Fallback to web version after a short delay
    setTimeout(() => {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${shopLat},${shopLng}&travelmode=driving`, '_blank');
    }, 1000);
  };

  if (!leafletLoaded) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Location</h3>
        </div>
        <div className="w-full h-64 rounded-lg border flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading map...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Location</h3>
        <div className="flex gap-2">
          {!userLocation && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={getUserLocation}
              disabled={isGettingLocation}
              className="flex items-center gap-2"
            >
              {isGettingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
              {isGettingLocation ? "Getting Location..." : "Show My Location"}
            </Button>
          )}
          {showNavigationButton && (
            <Button 
              onClick={openInMaps}
              className="flex items-center gap-2"
              size="sm"
            >
              <Navigation className="w-4 h-4" />
              Get Directions
            </Button>
          )}
        </div>
      </div>

      {distance && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span>Distance from your location: <span className="font-semibold text-blue-800 dark:text-blue-200">{distance}</span></span>
        </div>
      )}

      <div className="relative">
        <div 
          ref={mapRef} 
          className="w-full h-64 rounded-lg border relative z-10"
          style={{ minHeight: '256px' }}
        />
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-900 px-3 py-2 rounded-lg shadow-md text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full border border-white"></div>
            <span className="font-medium">{shopName}</span>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
        <p className="flex items-start gap-2">
          <MapPin className="w-4 h-4 mt-0.5 text-gray-500" />
          {shopAddress}
        </p>
      </div>

      {/* Pulse animation is handled by CSS */}
    </div>
  );
}