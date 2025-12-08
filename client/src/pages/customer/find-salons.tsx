import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Star, MapPin, Scissors, Palette, Sparkles, HandMetal, Waves, Crown, ShoppingBag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { Salon } from "@/../../shared/schema";

export default function FindSalons() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch featured salons for top rated section
  const { data: featuredSalons = [] } = useQuery<Salon[]>({
    queryKey: ['/api/salons/featured'],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setLocation(`/salons?search=${encodeURIComponent(searchQuery)}`);
    } else {
      setLocation('/salons');
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* HERO */}
        <Card className="mb-6 shadow-lg border-0 bg-white/95 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex items-center">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  S
                </div>
              </div>
              
              <div className="flex-1 w-full">
                <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Find the Best Salons Near You — Book Instantly
                </h1>
                <p className="text-gray-600 text-sm mb-4">
                  Compare prices, reviews & offers. Save time — skip the wait.
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
            </div>
          </CardContent>
        </Card>

        {/* TOP RATED SALONS */}
        <section className="mb-6" aria-label="Top salons">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            Top Rated Salons Near You
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
            {featuredSalons.slice(0, 3).map((salon) => (
              <Card 
                key={salon.id} 
                className="overflow-hidden hover:shadow-xl transition-all cursor-pointer border-0 shadow-md"
                onClick={() => setLocation(`/salon/${salon.id}`)}
                role="listitem"
                data-testid={`card-salon-${salon.id}`}
              >
                <div className="aspect-[16/9] overflow-hidden">
                  <img 
                    src={salon.imageUrl || "https://images.unsplash.com/photo-1556228720-63f9d4ff7d97?auto=format&fit=crop&w=800&q=60"} 
                    alt={salon.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-base mb-2">{salon.name}</h3>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      {salon.rating || "4.8"} ★
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {salon.city}
                    </span>
                  </div>
                  <Button 
                    className="w-full mt-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-bold"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/salon/${salon.id}`);
                    }}
                    data-testid={`button-book-${salon.id}`}
                  >
                    Book Now
                  </Button>
                </CardContent>
              </Card>
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
                onClick={() => setLocation('/auth')}
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
