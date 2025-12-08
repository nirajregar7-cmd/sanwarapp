import { useState, useEffect } from "react";
import { useLocation as useRouter, Link } from "wouter";
import { Search, Scissors, Palette, Sparkles, HandMetal, Waves, Crown, ShoppingBag, Users, MapPin, ChevronRight, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import type { Salon } from "@/../../shared/schema";
import SalonCard from "@/components/SalonCard";
import { useLocation } from "@/contexts/LocationContext";
import { useAuth } from "@/hooks/useAuth";

export default function FindSalons() {
  const [, setRoute] = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [salonNameSearch, setSalonNameSearch] = useState("");
  const [minRating, setMinRating] = useState<string>("any");
  const [maxPrice, setMaxPrice] = useState<string>("any");
  const { locationPreference, requestLocationOnce } = useLocation();
  const { isAuthenticated } = useAuth();

  // Fetch featured salons for top rated section
  const { data: featuredSalons = [] } = useQuery<Salon[]>({
    queryKey: ['/api/salons/featured'],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Fetch all salons
  const { data: allSalons = [] } = useQuery<Salon[]>({
    queryKey: ['/api/salons'],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch nearby salons based on location
  const { data: locationBasedSalons = [], isLoading: locationLoading } = useQuery<Salon[]>({
    queryKey: ['/api/salons/nearby', locationPreference?.lat, locationPreference?.lng, locationPreference?.radius],
    queryFn: async () => {
      if (!locationPreference?.lat || !locationPreference?.lng) {
        return [];
      }
      const response = await fetch(
        `/api/salons/nearby?lat=${locationPreference.lat}&lng=${locationPreference.lng}&radius=${locationPreference.radius || 30}`
      );
      if (!response.ok) return [];
      return await response.json();
    },
    enabled: !!locationPreference?.lat && !!locationPreference?.lng,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
  });

  // Filter salons based on search and filters
  const filteredSalons = allSalons.filter((salon) => {
    // Filter by salon name search
    if (salonNameSearch && !salon.name.toLowerCase().includes(salonNameSearch.toLowerCase())) {
      return false;
    }

    // Filter by minimum rating
    if (minRating !== "any") {
      const minRatingValue = parseFloat(minRating);
      const salonRating = typeof salon.averageRating === 'number' ? salon.averageRating : parseFloat(String(salon.averageRating || 0));
      if (salonRating < minRatingValue) {
        return false;
      }
    }

    // Filter by maximum price (based on minimum service price)
    if (maxPrice !== "any") {
      const maxPriceValue = parseInt(maxPrice);
      // We don't have service prices in the salon object, so we'll skip this for now
      // In a real app, you'd need to fetch services or have price range in salon data
    }

    // Filter by location if location preference is set
    if (locationPreference?.lat && locationPreference?.lng && salon.latitude && salon.longitude) {
      // Check if salon is within radius
      const salonLat = typeof salon.latitude === 'number' ? salon.latitude : parseFloat(String(salon.latitude));
      const salonLng = typeof salon.longitude === 'number' ? salon.longitude : parseFloat(String(salon.longitude));
      
      const distance = calculateDistance(
        locationPreference.lat,
        locationPreference.lng,
        salonLat,
        salonLng
      );
      if (distance > (locationPreference.radius || 30)) {
        return false;
      }
    }

    return true;
  });

  // Helper function to calculate distance between two points (Haversine formula)
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  const clearFilters = () => {
    setSalonNameSearch("");
    setMinRating("any");
    setMaxPrice("any");
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setRoute(`/salons?search=${encodeURIComponent(searchQuery)}`);
    } else {
      setRoute('/salons');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const services = [
    { name: "Haircut", icon: Scissors, color: "text-purple-600" },
    { name: "Beard Trim", icon: HandMetal, color: "text-red-500" },
    { name: "Facial", icon: Sparkles, color: "text-cyan-500" },
    { name: "Hair Color", icon: Palette, color: "text-purple-500" },
    { name: "Spa & Massage", icon: Waves, color: "text-amber-500" },
    { name: "Bridal Makeup", icon: Crown, color: "text-green-500" },
    { name: "Nails", icon: ShoppingBag, color: "text-rose-500" },
    { name: "Men's Grooming", icon: Users, color: "text-indigo-600" },
  ];

  const whyReasons = [
    {
      title: "Save Time — Book Smart",
      description: "No more waiting. Pick a slot and walk in when your service starts."
    },
    {
      title: "Verified Reviews & Prices",
      description: "Transparent pricing and real reviews so you choose with confidence."
    },
    {
      title: "Trusted by Local Salons",
      description: "Easy salon management for owners and better traffic from our platform."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-gray-50">
      {/* NAVIGATION BAR */}
      <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo and Brand */}
            <Link href="/" className="flex items-center space-x-3 group cursor-pointer" data-testid="link-logo">
              <div className="relative">
                <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 text-white rounded-xl w-12 h-12 flex items-center justify-center font-bold text-xl shadow-lg transform group-hover:scale-110 transition-all duration-300 group-hover:rotate-6">
                  <Scissors className="h-6 w-6" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <span className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 bg-clip-text text-transparent group-hover:from-purple-700 group-hover:via-pink-600 group-hover:to-blue-700 transition-all duration-300">
                  Sanwar
                </span>
                <p className="text-xs text-gray-500 font-medium -mt-1">Smart Salon Booking</p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              <Link href="/" className="relative px-4 py-2 text-gray-700 hover:text-purple-600 transition-all font-semibold group" data-testid="link-home">
                Home
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/services" className="relative px-4 py-2 text-gray-700 hover:text-purple-600 transition-all font-semibold group" data-testid="link-services">
                Services
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/about" className="relative px-4 py-2 text-gray-700 hover:text-purple-600 transition-all font-semibold group" data-testid="link-about">
                About Us
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/contact" className="relative px-4 py-2 text-gray-700 hover:text-purple-600 transition-all font-semibold group" data-testid="link-contact">
                Contact
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              {isAuthenticated ? (
                <Link href="/dashboard" className="ml-4 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 text-white px-6 py-2.5 rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold" data-testid="link-dashboard">
                  Dashboard
                </Link>
              ) : (
                <Link href="/auth" className="ml-4 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 text-white px-6 py-2.5 rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold flex items-center space-x-2" data-testid="link-login">
                  <span>Login / Register</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* HERO */}
        <Card className="mb-6 shadow-lg border-0 bg-white/95 backdrop-blur">
          <CardContent className="p-6">
            <div className="w-full">
              <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Find the Best Salons Near You — Book Instantly
              </h1>
              <p className="text-gray-600 text-sm mb-4">
                Like Zomato for Salons • Real-time slots like IRCTC • Instant confirmations
              </p>
                
              <div className="flex gap-3" role="search" aria-label="Search salons">
                <Input
                  className="flex-1 h-12 px-4 rounded-xl border-gray-200 bg-blue-50/50 focus:bg-white transition-colors"
                  placeholder="Search salons near me (e.g., 'haircut, beard, facial')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  data-testid="input-search-salons"
                />
                <Button 
                  onClick={handleSearch}
                  className="h-12 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 font-bold shadow-md"
                  data-testid="button-search"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Find
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEARCH & FILTER SALONS */}
        <Card className="mb-6 shadow-lg border-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-purple-600" />
              <h2 className="text-xl font-bold">Search & Filter Salons</h2>
            </div>

            {/* Search Input */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  className="pl-12 h-12 rounded-xl border-2 border-purple-200 focus:border-purple-500 transition-colors"
                  placeholder="Search salon names..."
                  value={salonNameSearch}
                  onChange={(e) => setSalonNameSearch(e.target.value)}
                  data-testid="input-search-salon-names"
                />
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Minimum Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger className="h-12 border-2 border-gray-200" data-testid="select-min-rating">
                    <SelectValue placeholder="Any Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Rating</SelectItem>
                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                    <SelectItem value="4.0">4.0+ Stars</SelectItem>
                    <SelectItem value="3.5">3.5+ Stars</SelectItem>
                    <SelectItem value="3.0">3.0+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Maximum Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Price
                </label>
                <Select value={maxPrice} onValueChange={setMaxPrice}>
                  <SelectTrigger className="h-12 border-2 border-gray-200" data-testid="select-max-price">
                    <SelectValue placeholder="Any Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Price</SelectItem>
                    <SelectItem value="500">Under ₹500</SelectItem>
                    <SelectItem value="1000">Under ₹1000</SelectItem>
                    <SelectItem value="1500">Under ₹1500</SelectItem>
                    <SelectItem value="2000">Under ₹2000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-gray-600 hover:text-purple-600"
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* LOCATION-BASED NEARBY SALONS */}
        {locationPreference?.lat && locationPreference?.lng && locationBasedSalons.length > 0 && (
          <section className="mb-6" aria-label="Nearby salons">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-600" />
                Showing salons within {locationPreference.radius || 30}km of your location
              </h2>
              <Button 
                variant="outline"
                onClick={() => setRoute('/discover')}
                className="text-sm"
                data-testid="button-view-all-nearby"
              >
                View All Nearby
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
              {locationBasedSalons.slice(0, 3).map((salon) => (
                <SalonCard key={salon.id} salon={salon} />
              ))}
            </div>
          </section>
        )}

        {/* FIND NEAR YOU BUTTON (if no location) */}
        {(!locationPreference?.lat || !locationPreference?.lng) && (
          <section className="mb-6">
            <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardContent className="p-6 text-center">
                <MapPin className="h-12 w-12 mx-auto mb-3 text-purple-600" />
                <h3 className="text-xl font-bold mb-2">Find Salons Near You</h3>
                <p className="text-gray-600 mb-4">
                  Enable location to discover salons within 30km radius
                </p>
                <Button 
                  onClick={requestLocationOnce}
                  className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
                  data-testid="button-enable-location"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Enable Location
                </Button>
              </CardContent>
            </Card>
          </section>
        )}

        {/* TOP RATED SALONS */}
        <section className="mb-6" aria-label="Top salons">
          <h2 className="text-xl font-bold mb-4">⭐ Top Rated Salons Near You</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
            {featuredSalons.slice(0, 6).map((salon) => (
              <SalonCard key={salon.id} salon={salon} />
            ))}
          </div>
        </section>

        {/* SERVICES */}
        <section className="mb-6" aria-label="Services">
          <h2 className="text-xl font-bold mb-4">Services You Can Book</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3" role="list">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Card 
                  key={service.name}
                  className="text-center p-4 hover:shadow-lg transition-all cursor-pointer border-0 bg-gradient-to-b from-white to-blue-50/30"
                  role="listitem"
                  data-testid={`service-${service.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className={`h-7 w-7 mx-auto mb-2 ${service.color}`} />
                  <div className="text-xs font-medium text-gray-700">{service.name}</div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* WHY SANWAR */}
        <section className="mb-6" aria-label="Why Sanwar">
          <h2 className="text-xl font-bold mb-4">Why People Love Sanwar</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {whyReasons.map((reason, index) => (
              <Card key={index} className="border-0 shadow-md bg-white/95 backdrop-blur">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-base mb-2">{reason.title}</h3>
                  <p className="text-sm text-gray-600">{reason.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* AI TRY-ON & SALON OWNER CTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" aria-label="Extras">
          <Card className="border-0 shadow-md bg-white/95 backdrop-blur">
            <CardContent className="p-5">
              <h3 className="font-semibold text-base mb-2">🔮 AI Try-On — Coming Soon</h3>
              <p className="text-sm text-gray-600 mb-3">
                Preview hairstyles on your photo and choose before you arrive. Small beta available for select salons.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white/95 backdrop-blur">
            <CardContent className="p-5">
              <h3 className="font-semibold text-base mb-2">🏪 For Salon Owners</h3>
              <p className="text-sm text-gray-600 mb-3">
                List your salon, manage bookings, loyalty, QR discounts & messaging. Quick setup — no coding.
              </p>
              <Button 
                variant="outline" 
                className="font-semibold"
                onClick={() => setRoute('/auth')}
                data-testid="button-register-salon"
              >
                Register Your Salon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FOOTER */}
        <footer className="pt-6 pb-4 text-sm text-gray-600 flex flex-col sm:flex-row justify-between items-center gap-4 border-t">
          <div>
            © <strong>Sanwar</strong> — Digitalizing India's Salon Industry
          </div>
          <div className="flex gap-4 flex-wrap">
            <a href="#" className="hover:text-purple-600 transition-colors">About</a>
            <a href="#" className="hover:text-purple-600 transition-colors">Contact</a>
            <a href="#" className="hover:text-purple-600 transition-colors">Privacy</a>
          </div>
        </footer>

      </div>
    </div>
  );
}
