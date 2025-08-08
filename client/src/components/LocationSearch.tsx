import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LocationSearchProps {
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
  className?: string;
}

export default function LocationSearch({ onLocationSelect, className = "" }: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationSelect({ 
          lat: latitude, 
          lng: longitude,
          address: 'Your Current Location'
        });
        toast({
          title: "Location Found",
          description: "Using your current location for salon search",
        });
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "Location Error",
          description: "Unable to get your location. Please search manually.",
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

  // Search for location using Nominatim API (OpenStreetMap)
  const searchLocation = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=in`
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const results = await response.json();
      
      if (results.length === 0) {
        toast({
          title: "Location Not Found",
          description: "Please try a different search term",
          variant: "destructive",
        });
        return;
      }

      const result = results[0];
      onLocationSelect({
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        address: result.display_name,
      });

      toast({
        title: "Location Found",
        description: `Searching salons near ${result.display_name.split(',')[0]}`,
      });
    } catch (error) {
      console.error('Location search error:', error);
      toast({
        title: "Search Error",
        description: "Unable to search for location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchLocation(searchQuery);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search location (e.g., Connaught Place, Delhi)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            type="submit" 
            disabled={isSearching || !searchQuery.trim()}
            className="flex-shrink-0"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Search'
            )}
          </Button>
        </form>
        
        <Button
          variant="outline"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="flex items-center gap-2 flex-shrink-0"
        >
          {isGettingLocation ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
          Use My Location
        </Button>
      </div>
      
      <div className="text-xs text-gray-500">
        Search for a specific area or use your current location to find nearby salons
      </div>
    </div>
  );
}