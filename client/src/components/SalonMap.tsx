import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { MapPin, Star, Clock, Users, Search, Filter, Navigation } from "lucide-react";
import { useLocation } from "wouter";

interface MapSalon {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  averageRating: number;
  totalReviews: number;
  profileImage?: string;
  availableSlots: number;
  nextAvailableSlot?: string;
  isOpen: boolean;
  distance?: number;
  specialties: string[];
}

interface MapProps {
  salons: MapSalon[];
  selectedSalonId?: string;
  onSalonSelect: (salonId: string) => void;
  userLocation?: { lat: number; lng: number };
}

// Simple map component using CSS Grid to simulate map layout
function SimpleMap({ salons, selectedSalonId, onSalonSelect, userLocation }: MapProps) {
  return (
    <div className="relative h-96 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg overflow-hidden border">
      {/* Map background grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="grid grid-cols-8 grid-rows-6 h-full">
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className="border border-gray-200" />
          ))}
        </div>
      </div>
      
      {/* User location indicator */}
      {userLocation && (
        <div 
          className="absolute w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg z-10"
          style={{
            left: '45%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
        </div>
      )}
      
      {/* Salon markers */}
      {salons.map((salon, index) => {
        // Simulate positioning based on salon data
        const left = 20 + (index % 5) * 15 + Math.random() * 10;
        const top = 15 + Math.floor(index / 5) * 20 + Math.random() * 10;
        
        return (
          <div
            key={salon.id}
            className={`absolute cursor-pointer transform hover:scale-110 transition-all z-20 ${
              selectedSalonId === salon.id ? 'scale-125' : ''
            }`}
            style={{ left: `${left}%`, top: `${top}%` }}
            onClick={() => onSalonSelect(salon.id)}
          >
            {/* Availability indicator ring */}
            <div className={`w-8 h-8 rounded-full border-3 ${
              salon.availableSlots > 0 
                ? 'border-green-400 bg-green-100' 
                : salon.isOpen 
                  ? 'border-yellow-400 bg-yellow-100'
                  : 'border-red-400 bg-red-100'
            } flex items-center justify-center shadow-lg`}>
              <div className={`w-4 h-4 rounded-full ${
                salon.availableSlots > 0 
                  ? 'bg-green-500' 
                  : salon.isOpen 
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}>
                {salon.availableSlots > 0 && (
                  <div className="text-[8px] text-white font-bold flex items-center justify-center w-full h-full">
                    {salon.availableSlots > 9 ? '9+' : salon.availableSlots}
                  </div>
                )}
              </div>
            </div>
            
            {/* Salon name tooltip */}
            {selectedSalonId === salon.id && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap border">
                <div className="font-semibold">{salon.name}</div>
                <div className="text-gray-600">
                  {salon.availableSlots > 0 ? `${salon.availableSlots} slots` : 'Busy'}
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
              </div>
            )}
          </div>
        );
      })}
      
      {/* Map legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs">
        <div className="font-semibold mb-2">Availability</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Available slots</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Open, busy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Closed</span>
          </div>
        </div>
      </div>
      
      {/* Your location indicator */}
      {userLocation && (
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
          <span>Your location</span>
        </div>
      )}
    </div>
  );
}

interface SalonMapProps {
  className?: string;
}

export function SalonMap({ className }: SalonMapProps) {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSalonId, setSelectedSalonId] = useState<string>();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>();
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "availability">("distance");

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log("Location access denied or unavailable");
          // Set a default location (example: city center)
          setUserLocation({ lat: 28.6139, lng: 77.2090 }); // Delhi coordinates
        }
      );
    }
  }, []);

  // Fetch salons with availability data
  const { data: salonsData, isLoading } = useQuery({
    queryKey: ["/api/salons/map", userLocation],
    enabled: !!userLocation,
  });

  // Transform salon data for map display
  const mapSalons: MapSalon[] = salonsData ? salonsData.map((salon: any) => ({
    id: salon.id,
    name: salon.name,
    address: salon.address,
    latitude: parseFloat(salon.latitude) || 0,
    longitude: parseFloat(salon.longitude) || 0,
    averageRating: parseFloat(salon.averageRating) || 0,
    totalReviews: salon.totalReviews || 0,
    profileImage: salon.imageUrl,
    availableSlots: salon.availableSlots || 0,
    nextAvailableSlot: salon.nextAvailableSlot,
    isOpen: salon.isOpen || false,
    distance: salon.distance || 0,
    specialties: salon.specialties || []
  })) : [];

  // Filter and sort salons
  const filteredSalons = mapSalons
    .filter(salon => 
      salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salon.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salon.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "distance":
          return (a.distance || 0) - (b.distance || 0);
        case "rating":
          return b.averageRating - a.averageRating;
        case "availability":
          return b.availableSlots - a.availableSlots;
        default:
          return 0;
      }
    });

  const selectedSalon = mapSalons.find(s => s.id === selectedSalonId);

  const handleSalonSelect = (salonId: string) => {
    setSelectedSalonId(salonId);
  };

  const handleViewSalon = (salonId: string) => {
    setLocation(`/salon/${salonId}`);
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="h-96 bg-gray-100 animate-pulse rounded-lg"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search salons by name, location, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="distance">Sort by Distance</option>
            <option value="rating">Sort by Rating</option>
            <option value="availability">Sort by Availability</option>
          </select>
          
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Interactive Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Salon Discovery Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleMap
            salons={filteredSalons}
            selectedSalonId={selectedSalonId}
            onSalonSelect={handleSalonSelect}
            userLocation={userLocation}
          />
        </CardContent>
      </Card>

      {/* Selected salon details */}
      {selectedSalon && (
        <Card className="border-primary">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{selectedSalon.name}</h3>
                <p className="text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin className="h-4 w-4" />
                  {selectedSalon.address}
                  {selectedSalon.distance && (
                    <span className="ml-2 text-sm">• {selectedSalon.distance.toFixed(1)} km away</span>
                  )}
                </p>
              </div>
              <Button onClick={() => handleViewSalon(selectedSalon.id)}>
                View Details
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-semibold">{selectedSalon.averageRating.toFixed(1)}</span>
                </div>
                <div className="text-xs text-gray-500">{selectedSalon.totalReviews} reviews</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-600">{selectedSalon.availableSlots}</span>
                </div>
                <div className="text-xs text-gray-500">Available slots</div>
              </div>
              
              <div className="text-center">
                <div className={`font-semibold mb-1 ${selectedSalon.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedSalon.isOpen ? 'OPEN' : 'CLOSED'}
                </div>
                <div className="text-xs text-gray-500">
                  {selectedSalon.nextAvailableSlot && `Next: ${selectedSalon.nextAvailableSlot}`}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-600">4.2k</span>
                </div>
                <div className="text-xs text-gray-500">Customers served</div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {selectedSalon.specialties.map((specialty) => (
                <Badge key={specialty} variant="secondary">
                  {specialty}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Salon list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSalons.slice(0, 8).map((salon) => (
          <Card 
            key={salon.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedSalonId === salon.id ? 'border-primary ring-1 ring-primary' : ''
            }`}
            onClick={() => handleSalonSelect(salon.id)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{salon.name}</h4>
                  <p className="text-gray-600 text-sm flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {salon.address}
                  </p>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1 text-yellow-600 mb-1">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-semibold">{salon.averageRating.toFixed(1)}</span>
                  </div>
                  {salon.distance && (
                    <div className="text-xs text-gray-500">{salon.distance.toFixed(1)} km</div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-1 ${
                    salon.availableSlots > 0 ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {salon.availableSlots > 0 
                        ? `${salon.availableSlots} slots available` 
                        : 'Fully booked'}
                    </span>
                  </div>
                  
                  <Badge 
                    variant={salon.isOpen ? "default" : "secondary"}
                    className={salon.isOpen ? "bg-green-100 text-green-800" : ""}
                  >
                    {salon.isOpen ? "Open" : "Closed"}
                  </Badge>
                </div>
                
                <Button 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewSalon(salon.id);
                  }}
                >
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default SalonMap;