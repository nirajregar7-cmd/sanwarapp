import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { MapPin, Star, Navigation, Filter, Search, Loader2, Map as MapIcon, Heart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import Map from '@/components/Map';
import LocationSearch from '@/components/LocationSearch';
import SalonCard from '@/components/SalonCard';
import { useAuth } from '@/hooks/useAuth';
import type { Salon } from '@shared/schema';

interface SalonWithDistance extends Salon {
  distance?: number;
}

export default function SalonSearchPage() {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [searchRadius, setSearchRadius] = useState([5]); // km
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'price'>('distance');
  const [showMap, setShowMap] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    name: '',
    location: '',
    minRating: 0,
    maxPrice: 1000,
  });

  // Get user's salon if they are a salon owner
  const { data: userSalon } = useQuery({
    queryKey: ['/api/user/salon'],
    enabled: !!user && user.userType === 'salon_owner',
  });

  // Fetch salons based on location
  const { data: salons, isLoading, refetch } = useQuery<SalonWithDistance[]>({
    queryKey: ['/api/salons/search', userLocation, searchRadius[0], searchFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (userLocation) {
        params.append('lat', userLocation.lat.toString());
        params.append('lng', userLocation.lng.toString());
        params.append('radius', searchRadius[0].toString());
      }
      
      if (searchFilters.name) {
        params.append('name', searchFilters.name);
      }
      
      if (searchFilters.location) {
        params.append('location', searchFilters.location);
      }
      
      if (searchFilters.minRating > 0) {
        params.append('minRating', searchFilters.minRating.toString());
      }
      
      if (searchFilters.maxPrice < 1000) {
        params.append('maxPrice', searchFilters.maxPrice.toString());
      }

      const response = await fetch(`/api/salons/search?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch salons');
      return response.json();
    },
    enabled: true,
  });

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

  // Sort salons based on selected criteria
  const sortedSalons = React.useMemo(() => {
    if (!salons) return [];

    let sorted = [...salons];

    // Add distance calculation if user location is available
    if (userLocation) {
      sorted = sorted.map(salon => ({
        ...salon,
        distance: salon.latitude && salon.longitude 
          ? calculateDistance(
              userLocation.lat, 
              userLocation.lng, 
              parseFloat(salon.latitude), 
              parseFloat(salon.longitude)
            )
          : undefined
      }));
    }

    // Apply sorting
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          if (!a.distance) return 1;
          if (!b.distance) return -1;
          return a.distance - b.distance;
        case 'rating':
          const ratingA = a.averageRating ? parseFloat(a.averageRating) : 0;
          const ratingB = b.averageRating ? parseFloat(b.averageRating) : 0;
          return ratingB - ratingA;
        case 'price':
          return a.confirmationAmount - b.confirmationAmount;
        default:
          return 0;
      }
    });

    return sorted;
  }, [salons, sortBy, userLocation]);

  const handleLocationSelect = (location: { lat: number; lng: number; address?: string }) => {
    setUserLocation(location);
    // Clear location filter when using GPS location
    setSearchFilters(prev => ({ ...prev, location: '' }));
  };

  const handleSalonClick = (salon: Salon) => {
    window.location.href = `/salon/${salon.id}`;
  };

  useEffect(() => {
    // Try to get user's location on page load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: 'Your Current Location'
          });
        },
        (error) => {
          console.log('Geolocation not available:', error);
          // Continue without location - show all salons
        }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Find Salons Near You
          </h1>
          <p className="text-gray-600">
            Discover and book appointments at the best salons in your area
          </p>
        </div>

        {/* Location Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Location Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LocationSearch onLocationSelect={handleLocationSelect} />
            
            {/* Manual city/area search */}
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Or search by city/area name
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="e.g., Chennai, Trichy, Anna Nagar..."
                    value={searchFilters.location}
                    onChange={(e) => {
                      setSearchFilters(prev => ({ ...prev, location: e.target.value }));
                      // Clear GPS location when searching by city
                      if (e.target.value) {
                        setUserLocation(null);
                      }
                    }}
                    className="pl-10"
                  />
                </div>
                <Button
                  onClick={() => setSearchFilters(prev => ({ ...prev, location: '' }))}
                  variant="outline"
                  size="sm"
                  className="px-3"
                >
                  Clear
                </Button>
              </div>
              
              {searchFilters.location && (
                <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-800">
                    <Search className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Searching for salons in: {searchFilters.location}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {userLocation && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800">
                  <Navigation className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {userLocation.address || 'Current Location Selected'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters and Controls */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Filters & View
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={showMap ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowMap(!showMap)}
                  className="flex items-center gap-2"
                >
                  <MapIcon className="h-4 w-4" />
                  {showMap ? 'Hide Map' : 'Show Map'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search by name */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Search by name
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Salon name..."
                    value={searchFilters.name}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, name: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Search by location/city */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Search by city/area
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Chennai, Trichy, etc..."
                    value={searchFilters.location}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, location: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Sort by */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Sort by
                </label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search radius */}
              {userLocation && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Search Radius: {searchRadius[0]} km
                  </label>
                  <Slider
                    value={searchRadius}
                    onValueChange={setSearchRadius}
                    max={50}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>
              )}

              {/* Minimum rating */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Min Rating: {searchFilters.minRating}⭐
                </label>
                <Slider
                  value={[searchFilters.minRating]}
                  onValueChange={(value) => setSearchFilters(prev => ({ ...prev, minRating: value[0] }))}
                  max={5}
                  min={0}
                  step={0.5}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map View */}
        {showMap && (
          <Card className="mb-6">
            <CardContent className="p-0">
              <Map
                salons={sortedSalons || []}
                userLocation={userLocation || undefined}
                ownedSalonId={userSalon?.id}
                onSalonClick={handleSalonClick}
                height="500px"
                className="rounded-lg"
              />
            </CardContent>
          </Card>
        )}

        {/* Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="animate-pulse h-full flex flex-col">
                <div className="h-48 bg-gray-300 rounded-t-lg"></div>
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
                  <div className="mt-auto h-8 bg-gray-300 rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : sortedSalons && sortedSalons.length > 0 ? (
            sortedSalons.map((salon) => (
              <SalonCard
                key={salon.id}
                salon={{
                  ...salon,
                  distance: salon.distance,
                  primaryImageUrl: salon.imageUrl
                }}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Salons Found</h3>
              <p className="text-gray-600 mb-4">
                {userLocation 
                  ? "No salons found in your selected area. Try increasing the search radius or changing your location."
                  : "Try searching for a specific location to find nearby salons."
                }
              </p>
              {!userLocation && (
                <Button onClick={() => refetch()}>
                  Show All Salons
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}