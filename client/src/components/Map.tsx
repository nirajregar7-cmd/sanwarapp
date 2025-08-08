import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Salon {
  id: string;
  name: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  averageRating: string | null;
  confirmationAmount: number;
}

interface MapProps {
  salons: Salon[];
  userLocation?: { lat: number; lng: number };
  onSalonClick?: (salon: Salon) => void;
  className?: string;
  height?: string;
}

export default function Map({ salons, userLocation, onSalonClick, className = "", height = "400px" }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([28.6139, 77.2090], 11); // Default to Delhi
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add user location marker if available
    if (userLocation) {
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
          "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('Your Location');
      
      // Center map on user location
      map.setView([userLocation.lat, userLocation.lng], 13);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userLocation]);

  // Update salon markers when salons change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Add salon markers
    const validSalons = salons.filter(salon => 
      salon.latitude && salon.longitude && 
      !isNaN(parseFloat(salon.latitude)) && !isNaN(parseFloat(salon.longitude))
    );

    if (validSalons.length === 0) return;

    validSalons.forEach(salon => {
      const lat = parseFloat(salon.latitude!);
      const lng = parseFloat(salon.longitude!);

      // Create custom salon marker
      const salonIcon = L.divIcon({
        className: 'salon-marker',
        html: `
          <div style="
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            width: 32px;
            height: 32px;
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 12px rgba(0,0,0,0.3);
            cursor: pointer;
          ">
            <div style="
              color: white;
              font-size: 12px;
              font-weight: bold;
            ">✂️</div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([lat, lng], { icon: salonIcon })
        .addTo(mapInstanceRef.current!);

      // Create popup content
      const popupContent = `
        <div class="salon-popup" style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1f2937;">${salon.name}</h3>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; line-height: 1.4;">${salon.address}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
            <div style="display: flex; align-items: center;">
              <span style="color: #f59e0b; margin-right: 4px;">⭐</span>
              <span style="font-size: 14px; color: #374151;">
                ${salon.averageRating ? Number(salon.averageRating).toFixed(1) : 'New'}
              </span>
            </div>
            <div style="color: #10b981; font-weight: bold; font-size: 14px;">
              ₹${salon.confirmationAmount || 0}
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      
      // Add click event
      if (onSalonClick) {
        marker.on('click', () => onSalonClick(salon));
      }

      markersRef.current.push(marker);
    });

    // Fit map to show all salons if no user location
    if (!userLocation && validSalons.length > 0) {
      const group = new L.FeatureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [salons, onSalonClick, userLocation]);

  return (
    <div 
      ref={mapRef} 
      className={`rounded-lg shadow-lg ${className}`}
      style={{ height, width: '100%' }}
    />
  );
}