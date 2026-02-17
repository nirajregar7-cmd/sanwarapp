import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Search,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SalonCard from "@/components/SalonCard";
import type { Salon } from "@shared/schema";

interface SalonWithDistance extends Salon {
  distance?: number;
}

export default function SalonSearchPage() {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);
  const [searchRadius, setSearchRadius] = useState([5]); // km
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "price">(
    "distance",
  );
  const [searchFilters, setSearchFilters] = useState({
    name: "",
    location: "",
    minRating: 0,
    maxPrice: 1000,
  });

  // Get location query from URL on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const locationQuery = urlParams.get("location");
    if (locationQuery) {
      setSearchFilters((prev) => ({ ...prev, location: locationQuery }));
    }
  }, []);

  // Fetch salons based on location
  const {
    data: salons,
    isLoading,
  } = useQuery<SalonWithDistance[]>({
    queryKey: [
      "/api/salons/search",
      userLocation,
      searchRadius[0],
      searchFilters,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (userLocation) {
        params.append("lat", userLocation.lat.toString());
        params.append("lng", userLocation.lng.toString());
        params.append("radius", searchRadius[0].toString());
      }

      if (searchFilters.name) {
        params.append("name", searchFilters.name);
      }

      if (searchFilters.location) {
        params.append("location", searchFilters.location);
      }

      if (searchFilters.minRating > 0) {
        params.append("minRating", searchFilters.minRating.toString());
      }

      if (searchFilters.maxPrice < 1000) {
        params.append("maxPrice", searchFilters.maxPrice.toString());
      }

      const response = await fetch(`/api/salons/search?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch salons");
      return response.json();
    },
    enabled: true,
  });

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };

  // Sort salons based on selected criteria
  const sortedSalons = React.useMemo(() => {
    if (!salons) return [];

    let sorted = [...salons];

    // Add distance calculation if user location is available
    if (userLocation) {
      sorted = sorted.map((salon) => ({
        ...salon,
        distance:
          salon.latitude && salon.longitude
            ? calculateDistance(
                userLocation.lat,
                userLocation.lng,
                parseFloat(salon.latitude),
                parseFloat(salon.longitude),
              )
            : undefined,
      }));
    }

    // Apply sorting
    sorted.sort((a, b) => {
      switch (sortBy) {
        case "distance":
          if (!a.distance) return 1;
          if (!b.distance) return -1;
          return a.distance - b.distance;
        case "rating":
          const ratingA = a.averageRating ? parseFloat(a.averageRating) : 0;
          const ratingB = b.averageRating ? parseFloat(b.averageRating) : 0;
          return ratingB - ratingA;
        case "price":
          return a.confirmationAmount - b.confirmationAmount;
        default:
          return 0;
      }
    });

    return sorted;
  }, [salons, sortBy, userLocation]);

  useEffect(() => {
    // Try to get user's location on page load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: "Your Current Location",
          });
        },
        (error) => {
          console.log("Geolocation not available:", error);
          // Continue without location - show all salons
        },
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        {/* Compact Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Salon name..."
              value={searchFilters.name}
              onChange={(e) =>
                setSearchFilters((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              className="pl-10 h-11 bg-white border-gray-200 text-primary placeholder:text-primary/60"
            />
          </div>

          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Chennai, Trichy, etc..."
              value={searchFilters.location}
              onChange={(e) =>
                setSearchFilters((prev) => ({
                  ...prev,
                  location: e.target.value,
                }))
              }
              className="pl-10 h-11 bg-white border-gray-200"
            />
          </div>

          <Select
            value={sortBy}
            onValueChange={(value: any) => setSortBy(value)}
          >
            <SelectTrigger className="w-full sm:w-[160px] h-11 bg-white border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="distance">Distance</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="price">Price</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
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
                  primaryImageUrl: salon.imageUrl,
                }}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Salons Found
              </h3>
              <p className="text-gray-600 mb-4">
                {userLocation
                  ? "No salons found in your selected area. Try increasing the search radius or changing your location."
                  : "Try searching for a specific location to find nearby salons."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
