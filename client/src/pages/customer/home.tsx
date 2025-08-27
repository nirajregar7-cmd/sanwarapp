import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Clock, MapPin, Search, Heart, Percent, Gift } from "lucide-react";
import type { Salon } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingWalkthrough } from "@/components/OnboardingWalkthrough";
import SalonLikeButton from "@/components/SalonLikeButton";
import OffersDisplayCard from "@/components/OffersDisplayCard";
import LocationPermissionDialog from "@/components/LocationPermissionDialog";
import { useLocation } from "@/contexts/LocationContext";
import SalonCard from "@/components/SalonCard";
import { PromoPopup } from "@/components/PromoPopup";

export default function CustomerHome() {
  const { user } = useAuth();
  const { shouldShowOnboarding, onboardingSteps, completeOnboarding, skipOnboarding } = useOnboarding('customer');
  const { 
    locationPreference, 
    showLocationDialog, 
    setShowLocationDialog, 
    requestLocationOnce,
    denyLocationPermission
  } = useLocation();

  // Fetch salons based on user's location preference - optimized
  const { data: salons, isLoading } = useQuery<Salon[]>({
    queryKey: [
      "/api/salons/featured",
      locationPreference?.lat,
      locationPreference?.lng,
      locationPreference?.radius
    ],
    queryFn: async () => {
      let url = "/api/salons/featured";
      const permissionDenied = localStorage.getItem('sanwar_permission_denied') === 'true';
      
      // If user denied location permission, show all salons across India
      // If user has location preference, use it for radius filtering
      if (locationPreference && !permissionDenied) {
        url += `?lat=${locationPreference.lat}&lng=${locationPreference.lng}&radius=${locationPreference.radius}`;
      } else if (permissionDenied) {
        // Show all salons across India without location filter
        console.log('Showing all salons across India (location permission denied)');
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
    localStorage.removeItem('sanwar_location_preference');
    localStorage.removeItem('sanwar_permission_asked');
    window.location.reload();
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
            <div className="max-w-2xl mx-auto bg-white rounded-lg p-2 flex flex-col sm:flex-row gap-2" data-testid="search-input">
              <div className="flex-1 flex items-center px-3 sm:px-4 py-2 sm:py-0">
                <MapPin className="text-gray-400 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                <Input 
                  type="text" 
                  placeholder="Enter your location" 
                  className="w-full text-gray-700 text-sm sm:text-lg bg-transparent border-none outline-none focus:ring-0"
                />
              </div>
              <Button className="bg-primary text-white px-6 sm:px-8 py-2 sm:py-3 hover:bg-primary/90 text-sm sm:text-base">
                <Search className="h-4 w-4 mr-2" />
                <span className="hidden xs:inline">Find Salons</span>
                <span className="xs:hidden">Find</span>
              </Button>
            </div>
          </div>
        </section>

        {/* Loading Skeleton */}
        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Featured Salons Near You</h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 px-4">Discover the best salon services in your area</p>
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
          <div className="max-w-2xl mx-auto bg-white rounded-xl p-2 sm:p-3 flex flex-col sm:flex-row gap-2 sm:gap-3 shadow-2xl" data-testid="search-input">
            <div className="flex-1 flex items-center px-3 sm:px-4 py-2 sm:py-0">
              <MapPin className="text-gray-400 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
              <Input 
                type="text" 
                placeholder="Enter your location" 
                className="w-full text-gray-700 text-sm sm:text-lg bg-transparent border-none outline-none focus:ring-0"
              />
            </div>
            <Button className="bg-primary text-white px-6 sm:px-8 py-2 sm:py-3 hover:bg-primary/90 rounded-lg font-semibold text-sm sm:text-base">
              <Search className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Find Salons</span>
              <span className="xs:hidden">Find</span>
            </Button>
          </div>
        </div>
      </section>



      {/* Featured Salons */}
      <section className="py-8 sm:py-12 lg:py-16" data-testid="featured-salons">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="text-center mb-8 sm:mb-12">
            {locationPreference && localStorage.getItem('sanwar_permission_denied') !== 'true' ? (
              <>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">Featured Salons Near You</h2>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 px-2">Discover the best salon services in your area</p>
              </>
            ) : (
              <>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">Featured Salons Across India</h2>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 px-2">Discover the best salon services across India</p>
              </>
            )}
          </div>

          {salons && salons.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
              {salons.map((salon) => (
                <SalonCard key={salon.id} salon={salon} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No salons found in your area.</p>
              <p className="text-gray-500 mt-2">Check back later or try a different location.</p>
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

      {/* Promotional Popup - Shows both offers after 10 seconds */}
      <PromoPopup />
    </div>
  );
}
