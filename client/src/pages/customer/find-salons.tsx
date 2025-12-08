import { useState, useEffect } from "react";
import { useLocation as useRouter } from "wouter";
import { Search, Scissors, Palette, Sparkles, HandMetal, Waves, Crown, ShoppingBag, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { Salon } from "@/../../shared/schema";
import SalonCard from "@/components/SalonCard";
import { useLocation } from "@/contexts/LocationContext";

export default function FindSalons() {
  const [, setRoute] = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { locationPreference, requestLocationOnce } = useLocation();

  // Fetch featured salons for top rated section
  const { data: featuredSalons = [] } = useQuery<Salon[]>({
    queryKey: ['/api/salons/featured'],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
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
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setRoute('/')}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md">
                <Scissors className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xl font-bold text-purple-600">
                  Sanwar
                </div>
                <div className="text-xs text-gray-600">Smart Salon Booking</div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => setRoute('/')}
                className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
                data-testid="nav-home"
              >
                Home
              </button>
              <button 
                onClick={() => setRoute('/services')}
                className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
                data-testid="nav-services"
              >
                Services
              </button>
              <button 
                onClick={() => setRoute('/about')}
                className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
                data-testid="nav-about"
              >
                About Us
              </button>
              <button 
                onClick={() => setRoute('/contact')}
                className="text-gray-700 hover:text-purple-600 font-medium transition-colors"
                data-testid="nav-contact"
              >
                Contact
              </button>
            </div>

            {/* Login/Register Button */}
            <Button 
              onClick={() => setRoute('/auth')}
              className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-6 py-2 rounded-full font-semibold shadow-md"
              data-testid="button-login-register"
            >
              Login / Register →
            </Button>
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
