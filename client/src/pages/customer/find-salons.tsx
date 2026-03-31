import { useState, useEffect } from "react";
import { useLocation as useRouter, Link } from "wouter";
import {
  Search,
  Scissors,
  Palette,
  Sparkles,
  HandMetal,
  Waves,
  Crown,
  ShoppingBag,
  Users,
  MapPin,
  Filter,
} from "lucide-react";
import PublicNav from "@/components/PublicNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import type { Salon } from "@/../../shared/schema";
import SalonCard from "@/components/SalonCard";
import { useLocation } from "@/contexts/LocationContext";
import LocationPermissionDialog from "@/components/LocationPermissionDialog";
import { TypewriterEffect } from "@/components/TypewriterEffect";

export default function FindSalons() {
  const [, setRoute] = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const { locationPreference, requestLocationOnce, showLocationDialog, setShowLocationDialog, denyLocationPermission } = useLocation();

  // Fetch nearby salons if location is available
  const { data: nearbySalons = [] } = useQuery<Salon[]>({
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
    staleTime: 2 * 60 * 1000,
  });

  // Fetch featured salons for top rated section
  const { data: featuredSalons = [] } = useQuery<Salon[]>({
    queryKey: ["/api/salons/featured"],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const handleUseMyLocation = async () => {
    setIsRequestingLocation(true);
    try {
      await requestLocationOnce();
      // Navigate to salon discovery page after getting location
      setTimeout(() => {
        setIsRequestingLocation(false);
        setRoute("/salons");
      }, 500);
    } catch (error) {
      console.error("Failed to get location:", error);
      setIsRequestingLocation(false);
    }
  };

  // Choose which salons to display: nearby salons if location is enabled, otherwise featured salons
  const displaySalons = locationPreference?.lat && locationPreference?.lng && nearbySalons.length > 0
    ? nearbySalons
    : featuredSalons;

  // Filter displayed salons by search query (salon name or address)
  const filteredSalons = displaySalons.filter((salon) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const salonName = salon.name?.toLowerCase() || "";
    const address = salon.address?.toLowerCase() || "";

    return salonName.includes(query) || address.includes(query);
  });

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
      description:
        "No more waiting. Pick a slot and walk in when your service starts.",
    },
    {
      title: "Verified Reviews & Prices",
      description:
        "Transparent pricing and real reviews so you choose with confidence.",
    },
    {
      title: "Trusted by Local Salons",
      description:
        "Easy salon management for owners and better traffic from our platform.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-gray-50">
      {/* LOCATION PERMISSION DIALOG */}
      <LocationPermissionDialog
        isOpen={showLocationDialog}
        onClose={() => setShowLocationDialog(false)}
        onAllow={requestLocationOnce}
        onDeny={denyLocationPermission}
      />

      <PublicNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* HERO */}
        <Card className="mb-6 shadow-lg border-0 bg-white/95 backdrop-blur">
          <CardContent className="p-6">
            <div className="w-full">
              {/* Header */}
              <div className="text-center mb-3">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 bg-clip-text text-transparent">
                  <TypewriterEffect 
                    text="India's Smart Salon Booking Platform" 
                    speed={80}
                    pauseAfterComplete={3000}
                    loop={true}
                  />
                </h1>
              </div>

              <p className="text-gray-700 text-sm mb-4 text-center font-medium">
                Like Zomato for Salons • Real-time slots like IRCTC • Instant confirmations
              </p>
              <div className="mb-4 flex items-center justify-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-sm font-medium text-purple-700 bg-purple-50 px-4 py-2 rounded-full border border-purple-200">
                  <span className="text-purple-600">💰</span>
                  <span>Compare prices</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-blue-700 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                  <span className="text-blue-600">⭐</span>
                  <span>Reviews & offers</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-green-700 bg-green-50 px-4 py-2 rounded-full border border-green-200">
                  <span className="text-green-600">⚡</span>
                  <span>Save time — skip the wait</span>
                </div>
              </div>

              <div
                className="flex gap-3"
                role="search"
                aria-label="Search salons"
              >
                <Input
                  className="flex-1 h-12 px-4 rounded-xl border-gray-200 bg-blue-50/50 focus:bg-white transition-colors"
                  placeholder="Search by salon name, city, or area (e.g., 'Looks Salon', 'Chennai', 'Anna Nagar')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-salons"
                />
                <Button
                  onClick={handleUseMyLocation}
                  disabled={isRequestingLocation}
                  className="h-12 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  data-testid="button-use-location"
                >
                  {isRequestingLocation ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Getting Location...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4" />
                      Use My Location
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TOP RATED SALONS */}
        <section className="mb-8" aria-label="Top salons">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">Top Rated Salons</h2>
            <p className="text-gray-600 text-sm">
              Book instantly with verified partner salons offering premium
              beauty services
            </p>

            {searchQuery.trim() && (
              <p className="text-sm text-purple-600 font-medium mt-2">
                {filteredSalons.length} salon
                {filteredSalons.length !== 1 ? "s" : ""} found
              </p>
            )}
          </div>

          {filteredSalons.length > 0 ? (
            <div className="space-y-6">
              {/* FIRST ROW */}
              <div className="overflow-x-auto pb-6 pt-2 -mx-4 px-4 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-gray-100">
                <div className="flex gap-4 min-w-max">
                  {filteredSalons
                    .slice(0, Math.ceil(filteredSalons.length / 2))
                    .map((salon) => (
                      <div
                        key={salon.id}
                        className="w-[320px] flex-shrink-0"
                      >
                        <SalonCard salon={salon} />
                      </div>
                    ))}
                </div>
              </div>

              {/* SECOND ROW */}
              {filteredSalons.length >
                Math.ceil(filteredSalons.length / 2) && (
                <div className="overflow-x-auto pb-6 pt-2 -mx-4 px-4 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-gray-100">
                  <div className="flex gap-4 min-w-max">
                    {filteredSalons
                      .slice(Math.ceil(filteredSalons.length / 2))
                      .map((salon) => (
                        <div
                          key={salon.id}
                          className="w-[320px] flex-shrink-0"
                        >
                          <SalonCard salon={salon} />
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 text-lg font-medium mb-2">
                No salons found
              </p>
              <p className="text-gray-500 text-sm">
                Try a different search term or{" "}
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-purple-600 hover:underline font-medium"
                >
                  clear your search
                </button>
              </p>
            </div>
          )}
        </section>

        {/* JOBS MARKETPLACE */}
        <section className="mb-8" aria-label="Jobs Marketplace">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-3">
              🔥 New Feature
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
              Sanwar Jobs Marketplace
            </h2>
            <p className="text-gray-500 text-sm max-w-lg mx-auto">
              Whether you're a salon owner looking for skilled staff, or a beauty professional looking for your next role — we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">

            {/* Card 1 — Get Salon Job */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white p-7 shadow-xl flex flex-col">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
              <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
              <div className="relative z-10 flex-1 flex flex-col">
                <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold mb-3 w-fit">
                  👤 For Professionals
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold mb-2">Get Salon Job</h3>
                <p className="text-blue-100 text-sm mb-3 flex-1">
                  Are you a barber, stylist, beautician, or makeup artist? Register your profile and get discovered by verified salons.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {["Barbers", "Hair Stylists", "Beauticians", "Nail Artists", "Makeup Artists", "Helpers"].map((role) => (
                    <span key={role} className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {role}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2 mb-5">
                  {[
                    { step: "1", label: "Fill profile" },
                    { step: "2", label: "Add skills" },
                    { step: "3", label: "Set salary" },
                    { step: "4", label: "Get hired!" },
                  ].map((item) => (
                    <div key={item.step} className="bg-white/15 rounded-xl p-2.5 text-center">
                      <div className="w-7 h-7 bg-white/30 rounded-full flex items-center justify-center font-bold text-xs mx-auto mb-1">
                        {item.step}
                      </div>
                      <p className="text-[10px] font-medium leading-tight">{item.label}</p>
                    </div>
                  ))}
                </div>
                <Link href="/staff-registration">
                  <Button size="sm" className="w-full bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-full shadow-md hover:shadow-lg transition-all">
                    Register as a Professional →
                  </Button>
                </Link>
              </div>
            </div>

            {/* Card 2 — Hire Skilled Staff */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white p-7 shadow-xl flex flex-col">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
              <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
              <div className="relative z-10 flex-1 flex flex-col">
                <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold mb-3 w-fit">
                  🏪 For Salon Owners
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold mb-2">Hire Skilled Staff</h3>
                <p className="text-green-50 text-sm mb-3 flex-1">
                  Find verified, experienced beauty professionals for your salon. Browse profiles, check skills & salary expectations, and hire the perfect fit.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {["Post a Job", "Browse Profiles", "Verified Skills", "Salary Filters", "Instant Connect", "Free Listing"].map((tag) => (
                    <span key={tag} className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2 mb-5">
                  {[
                    { step: "1", label: "List vacancy" },
                    { step: "2", label: "Browse" },
                    { step: "3", label: "Shortlist" },
                    { step: "4", label: "Hire & grow!" },
                  ].map((item) => (
                    <div key={item.step} className="bg-white/15 rounded-xl p-2.5 text-center">
                      <div className="w-7 h-7 bg-white/30 rounded-full flex items-center justify-center font-bold text-xs mx-auto mb-1">
                        {item.step}
                      </div>
                      <p className="text-[10px] font-medium leading-tight">{item.label}</p>
                    </div>
                  ))}
                </div>
                <Link href="/hire-staff">
                  <Button size="sm" className="w-full bg-white text-emerald-700 hover:bg-green-50 font-bold rounded-full shadow-md hover:shadow-lg transition-all">
                    Start Hiring Now →
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* SERVICES */}
        <section className="mb-6" aria-label="Services">
          <h2 className="text-xl font-bold mb-4">Services You Can Book</h2>

          <div
            className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3"
            role="list"
          >
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Card
                  key={service.name}
                  className="text-center p-4 hover:shadow-lg transition-all cursor-pointer border-0 bg-gradient-to-b from-white to-blue-50/30"
                  role="listitem"
                  data-testid={`service-${service.name.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Icon className={`h-7 w-7 mx-auto mb-2 ${service.color}`} />
                  <div className="text-xs font-medium text-gray-700">
                    {service.name}
                  </div>
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
              <Card
                key={index}
                className="border-0 shadow-md bg-white/95 backdrop-blur"
              >
                <CardContent className="p-5">
                  <h3 className="font-semibold text-base mb-2">
                    {reason.title}
                  </h3>
                  <p className="text-sm text-gray-600">{reason.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* AI TRY-ON & SALON OWNER CTA */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
          aria-label="Extras"
        >
          <Card className="border-0 shadow-md bg-white/95 backdrop-blur">
            <CardContent className="p-5">
              <h3 className="font-semibold text-base mb-2">
                🔮 AI Try-On — Coming Soon
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Preview hairstyles on your photo and choose before you arrive.
                Small beta available for select salons.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white/95 backdrop-blur">
            <CardContent className="p-5">
              <h3 className="font-semibold text-base mb-2">
                🏪 For Salon Owners
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                List your salon, manage bookings, loyalty, QR discounts &
                messaging. Quick setup — no coding.
              </p>
              <Button
                variant="outline"
                className="font-semibold"
                onClick={() => setRoute("/auth")}
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
            <a href="#" className="hover:text-purple-600 transition-colors">
              About
            </a>
            <a href="#" className="hover:text-purple-600 transition-colors">
              Contact
            </a>
            <a href="#" className="hover:text-purple-600 transition-colors">
              Privacy
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
