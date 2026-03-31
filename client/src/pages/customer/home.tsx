import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star,
  Clock,
  MapPin,
  Search,
  Heart,
  Percent,
  Gift,
} from "lucide-react";
import type { Salon } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingWalkthrough } from "@/components/OnboardingWalkthrough";
import SalonLikeButton from "@/components/SalonLikeButton";
import OffersDisplayCard from "@/components/OffersDisplayCard";
import LocationPermissionDialog from "@/components/LocationPermissionDialog";
import { useLocation } from "@/contexts/LocationContext";
import SalonCard from "@/components/SalonCard";
export default function CustomerHome() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const {
    shouldShowOnboarding,
    onboardingSteps,
    completeOnboarding,
    skipOnboarding,
  } = useOnboarding("customer");
  const {
    locationPreference,
    showLocationDialog,
    setShowLocationDialog,
    requestLocationOnce,
    denyLocationPermission,
  } = useLocation();

  // Fetch salons based on user's location preference - optimized
  const { data: salons, isLoading } = useQuery<Salon[]>({
    queryKey: [
      "/api/salons/featured",
      locationPreference?.lat,
      locationPreference?.lng,
      locationPreference?.radius,
    ],
    queryFn: async () => {
      let url = "/api/salons/featured";
      const permissionDenied =
        localStorage.getItem("sanwar_permission_denied") === "true";

      // If user denied location permission, show all salons across India
      // If user has location preference, use it for radius filtering
      if (locationPreference && !permissionDenied) {
        url += `?lat=${locationPreference.lat}&lng=${locationPreference.lng}&radius=${locationPreference.radius}`;
      } else if (permissionDenied) {
        // Show all salons across India without location filter
        console.log(
          "Showing all salons across India (location permission denied)",
        );
      }

      const response = await fetch(url);
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const { data: offers, isLoading: isLoadingOffers } = useQuery({
    queryKey: ["/api/public/offers"],
    staleTime: 10 * 60 * 1000, // 10 minutes cache - offers don't change frequently
  });

  // Handle location permission
  const handleLocationAllow = async () => {
    await requestLocationOnce();
  };

  const handleLocationDeny = () => {
    denyLocationPermission();
    // Force re-fetch to show all salons across India
    window.location.reload();
  };

  // Debug function to clear location preferences (remove in production)
  const clearLocationData = () => {
    localStorage.removeItem("sanwar_location_preference");
    localStorage.removeItem("sanwar_permission_asked");
    window.location.reload();
  };

  // Handle search functionality
  const handleSearch = () => {
    const query = searchQuery.trim();
    if (query) {
      window.location.href = `/discover?location=${encodeURIComponent(query)}`;
    } else {
      window.location.href = "/discover";
    }
  };

  if (isLoading) {
    return (
      <div className="interface-panel">
        {/* Hero Section */}
        <section className="gradient-primary text-white py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6">
              Book Your Perfect Salon Experience
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 opacity-90 px-4">
              Discover top-rated salons near you and book appointments instantly
            </p>

            {/* Search Bar */}
            <div
              className="max-w-2xl mx-auto bg-white rounded-lg p-2 flex flex-col sm:flex-row gap-2"
              data-testid="search-input"
            >
              <div className="flex-1 flex items-center px-3 sm:px-4 py-2 sm:py-0">
                <MapPin className="text-gray-400 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                <Input
                  type="text"
                  placeholder="Enter your location"
                  value={searchQuery || ""}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full text-gray-700 text-sm sm:text-lg bg-transparent border-none outline-none focus:ring-0"
                />
              </div>
              <Button
                className="bg-primary text-white px-6 sm:px-8 py-2 sm:py-3 hover:bg-primary/90 text-sm sm:text-base flex items-center"
                onClick={handleSearch}
              >
                <Search className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Find Salons</span>
                <span className="sm:hidden">Find</span>
              </Button>
            </div>
          </div>
        </section>

        {/* Loading Skeleton */}
        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                Featured Salons Near You
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 px-4">
                Discover the best salon services in your area
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="w-full h-48" />
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <div className="flex gap-2 mb-4">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="interface-panel">
      {/* Hero Section */}
      <section className="gradient-primary text-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6 px-2">
            Book Your Perfect Salon Experience
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 opacity-90 px-4">
            Discover top-rated salons near you and book appointments instantly
          </p>

          {/* Search Bar */}
          <div
            className="max-w-2xl mx-auto bg-white rounded-xl p-2 sm:p-3 flex flex-col sm:flex-row gap-2 sm:gap-3 shadow-2xl"
            data-testid="search-input"
          >
            <div className="flex-1 flex items-center px-3 sm:px-4 py-2 sm:py-0">
              <MapPin className="text-gray-400 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
              <Input
                type="text"
                placeholder="Enter your location"
                value={searchQuery || ""}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="w-full text-gray-700 text-sm sm:text-lg bg-transparent border-none outline-none focus:ring-0"
              />
            </div>
            <Button
              className="bg-primary text-white px-6 sm:px-8 py-2 sm:py-3 hover:bg-primary/90 rounded-lg font-semibold text-sm sm:text-base flex items-center"
              onClick={handleSearch}
            >
              <Search className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Find Salons</span>
              <span className="sm:hidden">Find</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Salons */}
      <section className="py-8 sm:py-12 lg:py-16" data-testid="featured-salons">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="text-center mb-8 sm:mb-12">
            {locationPreference &&
            localStorage.getItem("sanwar_permission_denied") !== "true" ? (
              <>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">
                  Featured Salons Near You
                </h2>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 px-2">
                  Discover the best salon services in your area
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">
                  Featured Salons Across India
                </h2>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 px-2">
                  Discover the best salon services across India
                </p>
              </>
            )}
          </div>

          {salons && salons.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-6 sm:mb-8">
              {salons.map((salon) => (
                <SalonCard key={salon.id} salon={salon} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                No salons found in your area.
              </p>
              <p className="text-gray-500 mt-2">
                Check back later or try a different location.
              </p>
            </div>
          )}

          {salons && salons.length > 6 && (
            <div className="text-center">
              <Button variant="outline" size="lg">
                Load More Salons
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Staff Registration Banner */}
      <section className="px-4 sm:px-6 lg:px-8 py-10 max-w-6xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white p-7 sm:p-12 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
                  🔥 New Feature
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold mb-3">
                  Sanwar Staff Registration
                </h2>
                <p className="text-blue-100 text-base sm:text-lg mb-4">
                  Are you a barber, stylist, beautician, or makeup artist? Register your professional profile and get discovered by verified salons.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {["Barbers", "Hair Stylists", "Beauticians", "Nail Artists", "Makeup Artists", "Helpers"].map((role) => (
                    <span key={role} className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                      {role}
                    </span>
                  ))}
                </div>
                <Link href="/staff-registration">
                  <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-8 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105">
                    Register as a Professional →
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center flex-shrink-0">
                {[
                  { step: "1", label: "Fill your profile" },
                  { step: "2", label: "Add your skills" },
                  { step: "3", label: "Set salary range" },
                  { step: "4", label: "Get hired!" },
                ].map((item) => (
                  <div key={item.step} className="bg-white/15 rounded-2xl p-4 w-28">
                    <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-2">
                      {item.step}
                    </div>
                    <p className="text-xs font-medium leading-tight">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location Permission Dialog is now handled on the main landing page */}

      {/* Onboarding Walkthrough */}
      {shouldShowOnboarding && (
        <OnboardingWalkthrough
          steps={onboardingSteps}
          userType="customer"
          onComplete={completeOnboarding}
          onSkip={skipOnboarding}
        />
      )}
    </div>
  );
}
