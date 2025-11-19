import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Navigation, Filter, Search, Star, Clock, Compass, ArrowLeft, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useToast } from "@/hooks/use-toast";
import SalonCard from "@/components/SalonCard";
import LocationPermissionDialog from "@/components/LocationPermissionDialog";
import { Link } from "wouter";
import type { Salon } from "@shared/schema";

export default function SalonDiscovery() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRadius, setSelectedRadius] = useState(30);
  const [minRating, setMinRating] = useState("0");
  const [maxPrice, setMaxPrice] = useState("10000");
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  
  const {
    position,
    error,
    loading: locationLoading,
    requestLocation,
    clearLocation,
    isSupported
  } = useGeolocation();

  // Auto-request location on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!position && !error && isSupported) {
        setShowLocationDialog(true);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [position, error, isSupported]);

  // Fetch salons based on location and filters
  const { data: salons, isLoading: salonsLoading, refetch } = useQuery<Salon[]>({
    queryKey: ["/api/salons/search", position?.lat, position?.lng, selectedRadius, searchTerm, minRating, maxPrice],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (position) {
        params.append("lat", position.lat.toString());
        params.append("lng", position.lng.toString());
        params.append("radius", selectedRadius.toString());
      }
      
      if (searchTerm) params.append("name", searchTerm);
      if (minRating !== "0") params.append("minRating", minRating);
      if (maxPrice !== "10000") params.append("maxPrice", maxPrice);
      
      const response = await fetch(`/api/salons/search?${params}`);
      if (!response.ok) throw new Error("Failed to fetch salons");
      return response.json();
    },
    enabled: true
  });

  const handleLocationAllow = async () => {
    try {
      await requestLocation();
      setShowLocationDialog(false);
      toast({
        title: "Location Found",
        description: "Now showing salons near your location",
      });
    } catch (error) {
      toast({
        title: "Location Access Failed",
        description: "Please check your browser settings and try again",
        variant: "destructive",
      });
    }
  };

  const handleLocationDeny = () => {
    setShowLocationDialog(false);
    toast({
      title: "Location Disabled",
      description: "Showing all available salons",
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setMinRating("0");
    setMaxPrice("10000");
    setSelectedRadius(30);
  };

  const radiusOptions = [
    { value: 5, label: "5 km" },
    { value: 10, label: "10 km" },
    { value: 20, label: "20 km" },
    { value: 30, label: "30 km" },
    { value: 50, label: "50 km" },
    { value: 100, label: "100 km" }
  ];

  const ratingOptions = [
    { value: "0", label: "Any Rating" },
    { value: "3", label: "3+ Stars" },
    { value: "4", label: "4+ Stars" },
    { value: "4.5", label: "4.5+ Stars" }
  ];

  const priceOptions = [
    { value: "10000", label: "Any Price" },
    { value: "500", label: "Under ₹500" },
    { value: "1000", label: "Under ₹1000" },
    { value: "2000", label: "Under ₹2000" },
    { value: "5000", label: "Under ₹5000" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back to Home Button */}
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center text-white hover:text-white/80 transition-colors" data-testid="link-back-home">
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Back to Home</span>
            </Link>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <Compass className="h-8 w-8 inline mr-3" />
              Discover Salons Near You
            </h1>
            <p className="text-lg opacity-90">
              Find and book the perfect salon with location-based discovery
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Location Status */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {!isSupported ? (
              <div className="text-center py-4">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Location Not Supported
                </h3>
                <p className="text-gray-600">
                  Your browser doesn't support location services
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-center space-x-2 text-red-800">
                    <MapPin className="h-5 w-5" />
                    <span>{error.message}</span>
                  </div>
                </div>
                <Button onClick={() => setShowLocationDialog(true)}>
                  <Navigation className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : position ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Location Found</h3>
                    <p className="text-sm text-gray-600">
                      Accuracy: ±{position.accuracy ? Math.round(position.accuracy) : '?'}m
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={clearLocation}>
                  Clear Location
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <Button 
                  onClick={() => setShowLocationDialog(true)}
                  disabled={locationLoading}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {locationLoading ? (
                    <>
                      <Navigation className="h-4 w-4 mr-2 animate-spin" />
                      Getting Location...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      Enable Location for Better Results
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Search & Filter Salons
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search salon names..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {position && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Radius
                  </label>
                  <Select
                    value={selectedRadius.toString()}
                    onValueChange={(value) => setSelectedRadius(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {radiusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Rating
                </label>
                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ratingOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Price
                </label>
                <Select value={maxPrice} onValueChange={setMaxPrice}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex justify-end">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold text-gray-900">
                {position ? "Nearby Salons" : "Available Salons"}
              </h2>
              {salons && (
                <Badge variant="secondary">
                  {salons.length} salon{salons.length !== 1 ? 's' : ''} found
                </Badge>
              )}
            </div>
            
            {salonsLoading && (
              <div className="flex items-center space-x-2 text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Searching...</span>
              </div>
            )}
          </div>

          {/* Salon Grid with Scrolling */}
          {salonsLoading ? (
            <div className="max-h-[900px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden animate-pulse">
                    <div className="aspect-video bg-gray-300"></div>
                    <CardContent className="p-4">
                      <div className="h-6 bg-gray-300 rounded mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : salons && salons.length > 0 ? (
            <div className="max-h-[900px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {salons.map((salon) => (
                  <SalonCard key={salon.id} salon={salon as any} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Salons Found
              </h3>
              <p className="text-gray-600 mb-6">
                {position 
                  ? `No salons found within ${selectedRadius}km of your location. Try expanding your search radius.`
                  : "No salons match your current filters. Try adjusting your search criteria."
                }
              </p>
              <div className="space-x-4">
                {position && (
                  <Button 
                    onClick={() => setSelectedRadius(100)}
                    variant="outline"
                  >
                    Expand to 100km
                  </Button>
                )}
                <Button onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Location Permission Dialog */}
      <LocationPermissionDialog
        isOpen={showLocationDialog}
        onClose={() => setShowLocationDialog(false)}
        onAllow={handleLocationAllow}
        onDeny={handleLocationDeny}
      />
    </div>
  );
}