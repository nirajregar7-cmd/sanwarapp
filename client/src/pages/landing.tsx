import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MapPin,
  Star,
  Clock,
  Users,
  Scissors,
  Calendar,
  Shield,
  Smartphone,
  CheckCircle,
  TrendingUp,
  IndianRupee,
  Gift,
  Navigation,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { PlatformStats, Salon } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import SalonCard from "@/components/SalonCard";
import sanwarLogo from "@/assets/sanwar-logo.png";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import LocationPermissionDialog from "@/components/LocationPermissionDialog";
import LocationBasedSalonFilter from "@/components/LocationBasedSalonFilter";
import { useLocation } from "@/contexts/LocationContext";
import { VirtualTryOn } from "@/components/VirtualTryOn";
import { TypewriterEffect } from "@/components/TypewriterEffect";
import { FadeInSection } from "@/components/FadeInSection";

export default function Landing() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [searchRadius, setSearchRadius] = useState(30);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const topRowScrollRef = useRef<HTMLDivElement>(null);
  const bottomRowScrollRef = useRef<HTMLDivElement>(null);

  // Scroll functions for top row
  const scrollTopRow = (direction: "left" | "right") => {
    if (topRowScrollRef.current) {
      const scrollAmount = 370; // Approximate width of one salon card + gap
      const newScrollPosition =
        direction === "left"
          ? topRowScrollRef.current.scrollLeft - scrollAmount
          : topRowScrollRef.current.scrollLeft + scrollAmount;

      topRowScrollRef.current.scrollTo({
        left: newScrollPosition,
        behavior: "smooth",
      });
    }
  };

  // Scroll functions for bottom row
  const scrollBottomRow = (direction: "left" | "right") => {
    if (bottomRowScrollRef.current) {
      const scrollAmount = 370; // Approximate width of one salon card + gap
      const newScrollPosition =
        direction === "left"
          ? bottomRowScrollRef.current.scrollLeft - scrollAmount
          : bottomRowScrollRef.current.scrollLeft + scrollAmount;

      bottomRowScrollRef.current.scrollTo({
        left: newScrollPosition,
        behavior: "smooth",
      });
    }
  };

  // Use the new LocationContext for unified location management
  const {
    showLocationDialog,
    setShowLocationDialog,
    requestLocationOnce,
    denyLocationPermission,
    locationPreference,
  } = useLocation();

  // Use location preference from context if available
  useEffect(() => {
    if (locationPreference) {
      setUserLocation({
        lat: locationPreference.lat,
        lng: locationPreference.lng,
      });
      setSearchRadius(locationPreference.radius);
    }
  }, [locationPreference]);

  // Add comprehensive SEO structured data for homepage
  useEffect(() => {
    // Set comprehensive SEO meta tags
    document.title =
      "Sanwar - Smart Salon Booking Platform | Book Beauty Appointments Online";

    // Add/update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Book beauty appointments online with Sanwar. Find top salons, spas & parlours near you. Real-time booking, verified reviews, instant confirmation. India's leading salon booking platform.",
      );
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content =
        "Book beauty appointments online with Sanwar. Find top salons, spas & parlours near you. Real-time booking, verified reviews, instant confirmation. India's leading salon booking platform.";
      document.head.appendChild(meta);
    }

    // Add structured data for organization
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Sanwar",
      description:
        "India's leading smart salon booking platform connecting customers with top beauty salons and spas",
      url: "https://sanwarhub.in",
      logo: {
        "@type": "ImageObject",
        url: "https://sanwarhub.in/logo.png",
      },
      foundingDate: "2024",
      founder: [
        {
          "@type": "Person",
          name: "Niraj Regar",
        },
        {
          "@type": "Person",
          name: "Naveen Chopra",
        },
      ],
      sameAs: [
        "https://www.instagram.com/vishal14104",
        "https://facebook.com/sanwarhub",
        "https://twitter.com/sanwarhub",
        "https://linkedin.com/company/sanwarhub",
      ],
      address: {
        "@type": "PostalAddress",
        addressCountry: "IN",
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        availableLanguage: ["Hindi", "English"],
      },
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      // Cleanup structured data on unmount
      const scripts = document.head.querySelectorAll(
        'script[type="application/ld+json"]',
      );
      scripts.forEach((script) => {
        if (script.textContent?.includes("SanwarHub")) {
          script.remove();
        }
      });
    };
  }, []);

  const handleLocationAllow = async () => {
    await requestLocationOnce();
    toast({
      title: "Location Found",
      description: `Now showing salons within ${searchRadius}km of your location`,
    });
  };

  const handleLocationDeny = () => {
    denyLocationPermission();
    // Clear any existing location data to force showing all salons
    setUserLocation(null);
    // Invalidate and refetch salons query to show all India salons
    queryClient.invalidateQueries({ queryKey: ["/api/salons/featured"] });
    toast({
      title: "Location Disabled",
      description:
        "Showing all salons across India. You can enable location access anytime.",
    });
  };

  // Handle refer & earn button clicks
  const handleReferEarnClick = (userType: string) => {
    if (isAuthenticated) {
      // User is logged in, redirect to refer & earn page
      window.location.href = "/refer-earn";
    } else {
      // User not logged in, redirect to auth with return path
      window.location.href = "/auth?returnTo=/refer-earn";
    }
  };
  // Fetch platform statistics
  const { data: stats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ["/api/platform/stats"],
    queryFn: async () => {
      const response = await fetch("/api/platform/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  // Fetch top-rated salons (filtered by location if available, all India if denied)
  const { data: topSalons, isLoading: salonsLoading } = useQuery<Salon[]>({
    queryKey: [
      "/api/salons/featured",
      userLocation?.lat,
      userLocation?.lng,
      searchRadius,
      localStorage.getItem("sanwar_permission_denied"),
    ],
    queryFn: async () => {
      let url = "/api/salons/featured";
      const permissionDenied =
        localStorage.getItem("sanwar_permission_denied") === "true";

      // If user denied location permission, show all salons across India
      // If user has location, use it for radius filtering
      if (userLocation && !permissionDenied) {
        url += `?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${searchRadius}`;
        console.log("Fetching salons within radius:", searchRadius);
      } else if (permissionDenied) {
        // Show all salons across India without location filter
        console.log(
          "Location permission denied - showing all salons across India",
        );
      } else {
        // No location and no denial - show all salons (default)
        console.log("No location available - showing all salons");
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch salons");
      return response.json();
    },
  });

  return (
    <div className="interface-panel">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo and Brand */}
            <Link
              href="/"
              className="flex items-center space-x-3 group cursor-pointer"
              data-testid="link-logo"
            >
              <div className="relative">
                <img
                  src={sanwarLogo}
                  alt="Sanwar"
                  className="w-16 h-16 object-contain transform group-hover:scale-110 transition-all duration-300"
                />
                <div className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <span className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 bg-clip-text text-transparent group-hover:from-purple-700 group-hover:via-pink-600 group-hover:to-blue-700 transition-all duration-300">
                  Sanwar
                </span>
                <p className="text-xs text-gray-500 font-medium -mt-1">
                  Smart Salon Booking
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                href="/"
                className="relative px-4 py-2 text-gray-700 hover:text-purple-600 transition-all font-semibold group"
                data-testid="link-home"
              >
                Home
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link
                href="/services"
                className="relative px-4 py-2 text-gray-700 hover:text-purple-600 transition-all font-semibold group"
                data-testid="link-services"
              >
                Services
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link
                href="/about"
                className="relative px-4 py-2 text-gray-700 hover:text-purple-600 transition-all font-semibold group"
                data-testid="link-about"
              >
                About Us
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link
                href="/contact"
                className="relative px-4 py-2 text-gray-700 hover:text-purple-600 transition-all font-semibold group"
                data-testid="link-contact"
              >
                Contact
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="ml-4 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 text-white px-6 py-2.5 rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
                  data-testid="link-dashboard"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/auth"
                  className="ml-4 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 text-white px-6 py-2.5 rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold flex items-center space-x-2"
                  data-testid="link-login"
                >
                  <span>Login / Register</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:text-gray-900"
                data-testid="button-mobile-menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden animate-fade-in-up">
              <div className="px-2 pt-2 pb-3 space-y-2 bg-gradient-to-br from-white to-purple-50 border-t border-gray-200 shadow-inner">
                <Link
                  href="/"
                  className="block px-4 py-3 text-gray-700 hover:text-purple-600 hover:bg-white rounded-xl transition-all font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="link-home-mobile"
                >
                  Home
                </Link>
                <Link
                  href="/services"
                  className="block px-4 py-3 text-gray-700 hover:text-purple-600 hover:bg-white rounded-xl transition-all font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="link-services-mobile"
                >
                  Services
                </Link>
                <Link
                  href="/about"
                  className="block px-4 py-3 text-gray-700 hover:text-purple-600 hover:bg-white rounded-xl transition-all font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="link-about-mobile"
                >
                  About Us
                </Link>
                <Link
                  href="/contact"
                  className="block px-4 py-3 text-gray-700 hover:text-purple-600 hover:bg-white rounded-xl transition-all font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="link-contact-mobile"
                >
                  Contact
                </Link>
                {isAuthenticated ? (
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 transition-all font-medium mx-3 mt-3 text-center"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="link-dashboard-mobile"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/auth"
                    className="block px-4 py-3 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all font-semibold mx-2 mt-2 text-center"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="link-login-mobile"
                  >
                    Login / Register
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-200 via-blue-100 to-slate-300 text-gray-900 py-12 sm:py-16 lg:py-24 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-white/10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-20 h-20 bg-slate-300/30 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-blue-200/40 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-slate-400/30 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-center mb-4 sm:mb-6 animate-fade-in">
              <img
                src={sanwarLogo}
                alt="Sanwar - Smart Salon Booking Platform"
                className="h-16 w-auto sm:h-20 md:h-24 lg:h-32 rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl mb-3 sm:mb-4 opacity-95 font-medium min-h-[2em]">
              <TypewriterEffect
                text={t("hero.title")}
                delay={500}
                speed={80}
                className="font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
              />
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 opacity-85 px-4 max-w-3xl mx-auto animate-fade-in-up">
              {t("hero.subtitle")}
            </p>
          </div>

          {/* Platform Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl p-4 sm:p-5 hover:bg-white/90 transition-all duration-300 group hover:scale-105 shadow-md animate-bounce-in animation-delay-200 hover-lift">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                  😊
                </div>
                <div className="text-sm sm:text-base font-bold text-gray-900 mb-1">
                  Many Happy
                </div>
                <div className="text-xs sm:text-xs text-gray-700 font-medium">
                  Customers
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl p-4 sm:p-5 hover:bg-white/90 transition-all duration-300 group hover:scale-105 shadow-md animate-bounce-in animation-delay-400 hover-lift">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                  🏠
                </div>
                <div className="text-sm sm:text-base font-bold text-gray-900 mb-1">
                  Multiple Partner
                </div>
                <div className="text-xs sm:text-xs text-gray-700 font-medium">
                  Salons
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl p-4 sm:p-5 hover:bg-white/90 transition-all duration-300 group hover:scale-105 shadow-md animate-bounce-in animation-delay-600 hover-lift">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                  📅
                </div>
                <div className="text-sm sm:text-base font-bold text-gray-900 mb-1">
                  Many Bookings
                </div>
                <div className="text-xs sm:text-xs text-gray-700 font-medium">
                  Already
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl p-4 sm:p-5 hover:bg-white/90 transition-all duration-300 group hover:scale-105 shadow-md animate-bounce-in animation-delay-800 hover-lift">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                  ✨
                </div>
                <div className="text-sm sm:text-base font-bold text-gray-900 mb-1">
                  Wide Range of
                </div>
                <div className="text-xs sm:text-xs text-gray-700 font-medium">
                  Services
                </div>
              </div>
            </div>
          </div>

          {/* Location Status & Search Bar */}
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Location Status */}
            <div className="text-center">
              {userLocation ? (
                <div className="flex items-center justify-center text-gray-700">
                  <MapPin className="h-4 w-4 mr-2 text-green-600" />
                  <span className="text-sm">
                    Showing salons within {searchRadius}km of your location
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLocationDialog(true)}
                    className="bg-white/90 border-gray-300 hover:bg-white text-gray-700"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Enable Location
                  </Button>
                  <span className="text-gray-600 text-sm">
                    to find salons near you
                  </span>
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-2 sm:p-3 flex flex-col sm:flex-row gap-2 sm:gap-3 shadow-2xl border border-white/20">
              <div className="flex-1 flex items-center px-3 sm:px-4 py-2 sm:py-0">
                <MapPin className="text-gray-500 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                <Input
                  type="text"
                  placeholder={
                    userLocation
                      ? "Search salons near you..."
                      : "Enter your location (e.g., Chennai, Trichy)"
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-gray-700 text-sm sm:text-lg bg-transparent border-none outline-none focus:ring-0 placeholder:text-gray-500"
                />
              </div>
              <Button
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 sm:px-8 py-2 sm:py-3 hover:from-purple-700 hover:to-blue-700 rounded-xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                onClick={() => {
                  const query = searchQuery.trim();
                  if (query) {
                    window.location.href = `/discover?location=${encodeURIComponent(query)}`;
                  } else {
                    window.location.href = "/discover";
                  }
                }}
              >
                <Search className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Find Salons</span>
                <span className="sm:hidden">Find</span>
              </Button>
            </div>
          </div>

          {/* User Type Selection */}
          <div className="mt-8 sm:mt-12 max-w-4xl mx-auto px-4">
            <div className="text-center mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                {t("hero.who_are_you")}
              </h3>
              <p className="text-gray-700 text-sm sm:text-base">
                {t("hero.choose_account_type")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Customer Card */}
              <div
                className="bg-white rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group hover:scale-105 border-2 border-gray-200 hover:border-gray-300"
                onClick={() => (window.location.href = "/auth")}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">
                    {t("hero.customer_title")}
                  </h4>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {t("hero.customer_desc")}
                  </p>
                  <ul className="text-gray-700 text-sm space-y-2 mb-6 text-left">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Find nearby salons
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Book appointments instantly
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Manage bookings
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Leave reviews & earn rewards
                    </li>
                  </ul>
                  <div className="space-y-3">
                    <Button
                      size="lg"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <span className="text-white">
                        {t("hero.signup_customer")}
                      </span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full bg-gray-50 border-gray-300 hover:bg-gray-100 text-gray-700 font-medium py-2 rounded-xl transition-all duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReferEarnClick("customer");
                      }}
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      Refer & Earn
                    </Button>
                  </div>
                </div>
              </div>

              {/* Salon Owner Card */}
              <div
                className="bg-white rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group hover:scale-105 border-2 border-gray-200 hover:border-gray-300"
                onClick={() => (window.location.href = "/auth")}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Scissors className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">
                    {t("hero.owner_title")}
                  </h4>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {t("hero.owner_desc")}
                  </p>
                  <ul className="text-gray-700 text-sm space-y-2 mb-6 text-left">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Setup salon profile
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Manage services & staff
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Create time slots
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Handle bookings & earnings
                    </li>
                  </ul>
                  <div className="space-y-3">
                    <Button
                      size="lg"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <span className="text-white">
                        {t("hero.signup_owner")}
                      </span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full bg-gray-50 border-gray-300 hover:bg-gray-100 text-gray-700 font-medium py-2 rounded-xl transition-all duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReferEarnClick("salon_owner");
                      }}
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      Refer & Earn
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location Permission Dialog */}
        <LocationPermissionDialog
          isOpen={showLocationDialog}
          onClose={() => setShowLocationDialog(false)}
          onAllow={handleLocationAllow}
          onDeny={handleLocationDeny}
        />
      </section>

      {/* Location-Based Salon Filter */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LocationBasedSalonFilter
            onLocationChange={setUserLocation}
            onRadiusChange={setSearchRadius}
            currentRadius={searchRadius}
            salonCount={topSalons?.length || 0}
            isLoading={salonsLoading}
          />
        </div>
      </section>

      {/* Local SEO Near Me Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection direction="up" delay={100}>
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                Best Salon Near Me
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-3xl mx-auto px-4">
                Find top-rated beauty salons near you. Instant booking, verified
                reviews, professional services.
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                title: "Salon Near Me",
                desc: "Discover verified salons in your neighborhood",
                icon: MapPin,
              },
              {
                title: "Haircut Near Me",
                desc: "Professional haircuts for men, women & kids",
                icon: Scissors,
              },
              {
                title: "Spa Near Me",
                desc: "Relaxing spa treatments and wellness services",
                icon: Star,
              },
              {
                title: "Bridal Makeup Near Me",
                desc: "Professional bridal makeup artists",
                icon: Users,
              },
              {
                title: "Facial Near Me",
                desc: "Professional skin care and facial treatments",
                icon: Shield,
              },
              {
                title: "Beauty Salon Near Me",
                desc: "Complete beauty services and treatments",
                icon: CheckCircle,
              },
            ].map((service, index) => (
              <FadeInSection key={index} direction="up" delay={index * 100}>
                <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group cursor-pointer hover-lift">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                      <service.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                      {service.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm">{service.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>

          <div className="text-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              asChild
            >
              <Link href="/discover">
                <MapPin className="h-5 w-5 mr-2" />
                Discover Local Salons
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Available Services Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection direction="up" delay={100}>
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                Available Services
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-3xl mx-auto px-4">
                Discover a wide range of beauty and grooming services at your
                fingertips
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {[
              {
                icon: Scissors,
                name: "Haircut & Styling",
                color: "bg-blue-100 text-blue-600",
              },
              {
                icon: Star,
                name: "Facial Treatment",
                color: "bg-pink-100 text-pink-600",
              },
              {
                icon: Users,
                name: "Bridal Package",
                color: "bg-purple-100 text-purple-600",
              },
              {
                icon: Calendar,
                name: "Hair Color",
                color: "bg-green-100 text-green-600",
              },
              {
                icon: Shield,
                name: "Spa & Massage",
                color: "bg-indigo-100 text-indigo-600",
              },
              {
                icon: Smartphone,
                name: "Manicure & Pedicure",
                color: "bg-yellow-100 text-yellow-600",
              },
            ].map((service, index) => (
              <FadeInSection key={index} direction="up" delay={index * 80}>
                <div className="text-center group cursor-pointer">
                  <div
                    className={`mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full ${service.color} flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}
                  >
                    <service.icon className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-xs sm:text-sm lg:text-base">
                    {service.name}
                  </h3>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Live Salon Previews */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              {(() => {
                const permissionDenied =
                  localStorage.getItem("sanwar_permission_denied") === "true";
                if (permissionDenied) return "Top Rated Salons Across India";
                return userLocation
                  ? "Top Rated Salons Near You"
                  : "Top Rated Salons";
              })()}
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-3xl mx-auto px-4">
              {(() => {
                const permissionDenied =
                  localStorage.getItem("sanwar_permission_denied") === "true";
                if (permissionDenied)
                  return "Discover the best salon services from verified partners across India";
                return userLocation
                  ? "Book instantly with verified partner salons within 30km of your location"
                  : "Book instantly with verified partner salons offering premium beauty services";
              })()}
            </p>
          </div>

          <div className="space-y-6">
            {salonsLoading ? (
              <>
                {/* Top Row Loading */}
                <div className="relative group">
                  <button
                    onClick={() => scrollTopRow("left")}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 hover:bg-white shadow-lg rounded-full p-3 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 -ml-5"
                    aria-label="Scroll top row left"
                    data-testid="button-scroll-top-left"
                  >
                    <ChevronLeft className="h-6 w-6 text-purple-600" />
                  </button>
                  <button
                    onClick={() => scrollTopRow("right")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 hover:bg-white shadow-lg rounded-full p-3 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 -mr-5"
                    aria-label="Scroll top row right"
                    data-testid="button-scroll-top-right"
                  >
                    <ChevronRight className="h-6 w-6 text-purple-600" />
                  </button>
                  <div
                    ref={topRowScrollRef}
                    className="overflow-x-auto pb-4 custom-scrollbar scroll-smooth"
                  >
                    <div className="flex gap-4 sm:gap-6">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Card
                          key={index}
                          className="overflow-hidden animate-pulse w-[300px] sm:w-[350px] flex-shrink-0"
                        >
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
                </div>

                {/* Bottom Row Loading */}
                <div className="relative group">
                  <button
                    onClick={() => scrollBottomRow("left")}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 hover:bg-white shadow-lg rounded-full p-3 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 -ml-5"
                    aria-label="Scroll bottom row left"
                    data-testid="button-scroll-bottom-left"
                  >
                    <ChevronLeft className="h-6 w-6 text-purple-600" />
                  </button>
                  <button
                    onClick={() => scrollBottomRow("right")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 hover:bg-white shadow-lg rounded-full p-3 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 -mr-5"
                    aria-label="Scroll bottom row right"
                    data-testid="button-scroll-bottom-right"
                  >
                    <ChevronRight className="h-6 w-6 text-purple-600" />
                  </button>
                  <div
                    ref={bottomRowScrollRef}
                    className="overflow-x-auto pb-4 custom-scrollbar scroll-smooth"
                  >
                    <div className="flex gap-4 sm:gap-6">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Card
                          key={index}
                          className="overflow-hidden animate-pulse w-[300px] sm:w-[350px] flex-shrink-0"
                        >
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
                </div>
              </>
            ) : topSalons && topSalons.length > 0 ? (
              <>
                {/* Top Row */}
                <div className="relative group">
                  <button
                    onClick={() => scrollTopRow("left")}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 hover:bg-white shadow-lg rounded-full p-3 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 -ml-5"
                    aria-label="Scroll top row left"
                    data-testid="button-scroll-top-left"
                  >
                    <ChevronLeft className="h-6 w-6 text-purple-600" />
                  </button>
                  <button
                    onClick={() => scrollTopRow("right")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 hover:bg-white shadow-lg rounded-full p-3 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 -mr-5"
                    aria-label="Scroll top row right"
                    data-testid="button-scroll-top-right"
                  >
                    <ChevronRight className="h-6 w-6 text-purple-600" />
                  </button>
                  <div
                    ref={topRowScrollRef}
                    className="overflow-x-auto overflow-y-visible pt-6 pb-6 px-2 custom-scrollbar scroll-smooth"
                  >
                    <div className="flex gap-4 sm:gap-6">
                      {topSalons
                        .slice(0, Math.ceil(topSalons.length / 2))
                        .map((salon) => (
                          <div
                            key={salon.id}
                            className="w-[280px] sm:w-[320px] flex-shrink-0"
                          >
                            <SalonCard salon={salon as any} />
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Row */}
                {topSalons.length > 1 && (
                  <div className="relative group">
                    <button
                      onClick={() => scrollBottomRow("left")}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 hover:bg-white shadow-lg rounded-full p-3 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 -ml-5"
                      aria-label="Scroll bottom row left"
                      data-testid="button-scroll-bottom-left"
                    >
                      <ChevronLeft className="h-6 w-6 text-purple-600" />
                    </button>
                    <button
                      onClick={() => scrollBottomRow("right")}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 hover:bg-white shadow-lg rounded-full p-3 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 -mr-5"
                      aria-label="Scroll bottom row right"
                      data-testid="button-scroll-bottom-right"
                    >
                      <ChevronRight className="h-6 w-6 text-purple-600" />
                    </button>
                    <div
                      ref={bottomRowScrollRef}
                      className="overflow-x-auto overflow-y-visible pt-6 pb-6 px-2 custom-scrollbar scroll-smooth"
                    >
                      <div className="flex gap-4 sm:gap-6">
                        {topSalons
                          .slice(Math.ceil(topSalons.length / 2))
                          .map((salon) => (
                            <div
                              key={salon.id}
                              className="w-[280px] sm:w-[320px] flex-shrink-0"
                            >
                              <SalonCard salon={salon as any} />
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // No salons found state
              <div className="col-span-full text-center py-12">
                <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {userLocation ? "No Salons Found Nearby" : "No Salons Yet"}
                </h3>
                <p className="text-gray-700 mb-6">
                  {userLocation
                    ? "No salons found within 30km of your location. Try expanding your search or check back later."
                    : "Be the first salon owner to join our platform!"}
                </p>
                {userLocation ? (
                  <Button
                    onClick={() => setUserLocation(null)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    View All Salons
                  </Button>
                ) : (
                  <Button asChild className="bg-primary hover:bg-primary/90">
                    <Link href="/auth">
                      <Scissors className="h-4 w-4 mr-2" />
                      Register Your Salon
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Upcoming Features Section */}
      <UpcomingFeaturesSection />

      {/* Virtual Try-On Section */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection direction="up" delay={100}>
            <VirtualTryOn />
          </FadeInSection>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection direction="up" delay={100}>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How Sanwar Works
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Simple steps to book your perfect salon experience
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: "Find & Choose",
                description:
                  "Browse salons near you, compare services, prices, and read reviews",
                icon: Search,
              },
              {
                step: 2,
                title: "Book Instantly",
                description:
                  "Select your preferred time slot and pay the confirmation amount to secure your booking",
                icon: Calendar,
              },
              {
                step: 3,
                title: "Enjoy Service",
                description:
                  "Visit the salon at your booked time, enjoy premium services, and pay the remaining amount",
                icon: CheckCircle,
              },
            ].map((item, index) => (
              <FadeInSection key={index} direction="up" delay={index * 200}>
                <div className="text-center hover-lift">
                  <div className="relative mb-6">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{
                        backgroundColor: "hsl(248.0645, 92.8571%, 61.1765%)",
                      }}
                    >
                      <item.icon className="h-8 w-8 text-white" />
                    </div>
                    <div
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{
                        backgroundColor: "hsl(328.1818, 84.8485%, 60.5882%)",
                      }}
                    >
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-700">{item.description}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Comprehensive Features Explanation Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection direction="up" delay={100}>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Complete Platform Features
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Everything you need to know about how Sanwar works for customers
              </p>
            </div>
          </FadeInSection>

          <div className="max-w-3xl mx-auto">
            {/* Customer Features */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  For Customers
                </h3>
                <p className="text-gray-600">
                  Everything you need for the perfect salon experience
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Search className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Discover Nearby Salons
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Find salons within 30km using GPS location, view detailed
                      profiles, photos, and real customer reviews
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Calendar className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Real-Time Booking
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Book available time slots instantly, choose specific staff
                      members, select services with clear pricing
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <IndianRupee className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Flexible Payments
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Pay small confirmation amount (₹50-100) to secure booking,
                      pay remaining amount at salon after service
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Gift className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Rewards & Referrals
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Earn money by referring friends, get exclusive offers,
                      track your booking history and reviews
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Shield className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Safe & Secure
                    </h4>
                    <p className="text-gray-600 text-sm">
                      All salons are verified, secure payment processing,
                      customer support available, easy rescheduling
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Navigation className="h-4 w-4 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Email Notifications
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Receive instant booking confirmations, reminders, and
                      updates via email for all your appointments
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <h5 className="font-semibold text-gray-900 mb-3">
                  How Customers Use Sanwar:
                </h5>
                <ol className="text-sm text-gray-600 space-y-2">
                  <li>
                    <span className="font-medium text-blue-600">1.</span> Open
                    app and allow location access to find nearby salons
                  </li>
                  <li>
                    <span className="font-medium text-blue-600">2.</span> Browse
                    salon profiles, view photos, read reviews, compare prices
                  </li>
                  <li>
                    <span className="font-medium text-blue-600">3.</span> Select
                    salon, choose services, pick preferred staff and time slot
                  </li>
                  <li>
                    <span className="font-medium text-blue-600">4.</span> Pay
                    small confirmation amount online to secure your booking
                  </li>
                  <li>
                    <span className="font-medium text-blue-600">5.</span>{" "}
                    Receive instant email confirmation and booking reminders
                  </li>
                  <li>
                    <span className="font-medium text-blue-600">6.</span> Visit
                    salon at booked time, enjoy service, pay remaining amount
                  </li>
                  <li>
                    <span className="font-medium text-blue-600">7.</span> Rate
                    and review your experience, refer friends to earn rewards
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Key Benefits Section */}
          <FadeInSection direction="up" delay={200}>
            <div className="mt-16 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">
                Why Choose Sanwar?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Instant Booking
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Book appointments in seconds with real-time availability
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Verified Salons
                  </h4>
                  <p className="text-gray-600 text-sm">
                    All partner salons are verified for quality and safety
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IndianRupee className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Fair Pricing
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Transparent pricing with no hidden charges
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="h-6 w-6 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Mobile First
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Seamless experience on mobile and desktop
                  </p>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-gradient-to-br from-slate-200 via-blue-100 to-slate-300 text-gray-900 py-16 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-white/10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-blue-200/30 rounded-full blur-2xl animate-pulse"></div>
        </div>
        <FadeInSection direction="up" delay={100}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 min-h-[3em]">
              <TypewriterEffect
                text="Ready to Transform Your Beauty Experience?"
                delay={300}
                speed={80}
                loop={true}
                pauseAfterComplete={3000}
              />
            </h2>
            <p className="text-xl mb-8 text-gray-700 animate-fade-in-up animation-delay-400">
              Join thousands of satisfied customers and partner salons on Sanwar
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white hover:bg-gray-100 text-lg px-8 py-4 rounded-xl font-semibold"
                style={{ color: "hsl(248.0645, 92.8571%, 61.1765%)" }}
                onClick={() =>
                  (window.location.href = "/api/login?user_intent=customer")
                }
              >
                Start Booking Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 border-white/40 text-white hover:bg-white hover:text-purple-700 text-lg px-8 py-4 rounded-xl font-semibold transition-all duration-300"
                onClick={() =>
                  (window.location.href = "/api/login?user_intent=salon_owner")
                }
              >
                <span className="text-white hover:text-purple-700">
                  Partner With Us
                </span>
              </Button>
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src={sanwarLogo} alt="Sanwar" className="w-12 h-12 object-contain" />
                <span className="text-2xl font-bold">Sanwar</span>
              </div>
              <p className="text-gray-400">
                India's premier salon booking platform connecting customers with
                top-rated salons.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Customers</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Find Salons
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Book Services
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Manage Bookings
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Refer & Earn
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>
              &copy; 2024 Sanwar. All rights reserved. Built for Indian salons.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function UpcomingFeaturesSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { data: videos } = useQuery<any[]>({
    queryKey: ["/api/upcoming-features"],
    queryFn: async () => {
      const response = await fetch("/api/upcoming-features");
      if (!response.ok) throw new Error("Failed to fetch videos");
      return response.json();
    },
    retry: false,
  });

  const activeVideos = videos?.filter((v: any) => v.isActive) || [];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % activeVideos.length);
  };

  const prevSlide = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + activeVideos.length) % activeVideos.length,
    );
  };

  if (!activeVideos.length) return null;

  return (
    <section className="py-16 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection direction="up" delay={100}>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Upcoming Features
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the future of beauty services with our innovative
              features
            </p>
          </div>
        </FadeInSection>

        <div className="relative" style={{ minHeight: "400px" }}>
          {/* Carousel Container with Center Focus and Side Peeks */}
          <div className="overflow-hidden">
            <div
              className="relative flex items-center justify-center"
              style={{ height: "500px" }}
            >
              {activeVideos.map((video: any, index: number) => {
                const offset = index - currentIndex;
                const isCenter = offset === 0;
                const isLeft =
                  offset === -1 ||
                  (currentIndex === 0 && index === activeVideos.length - 1);
                const isRight =
                  offset === 1 ||
                  (currentIndex === activeVideos.length - 1 && index === 0);
                const isVisible = isCenter || isLeft || isRight;

                if (!isVisible) return null;

                return (
                  <div
                    key={video.id}
                    className={`absolute transition-all duration-500 ease-out ${
                      isCenter
                        ? "z-20 scale-100 opacity-100"
                        : "z-10 scale-75 opacity-40"
                    }`}
                    style={{
                      transform: `translateX(${
                        isCenter ? "0%" : isLeft ? "-95%" : "95%"
                      })`,
                      width: isCenter ? "85%" : "70%",
                      maxWidth: isCenter ? "1000px" : "800px",
                    }}
                  >
                    <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
                      <video
                        src={video.videoUrl}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        data-testid={`video-${video.id}`}
                        onEnded={isCenter ? nextSlide : undefined}
                      />

                      {/* Video Overlay Info - Only show on center video */}
                      {isCenter && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                          <h3 className="text-white text-2xl font-bold mb-2">
                            {video.title}
                          </h3>
                          {video.description && (
                            <p className="text-gray-200 text-sm">
                              {video.description}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Play Indicator - Only on center video */}
                      {isCenter && (
                        <div className="absolute top-4 right-4 z-20 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center space-x-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          <span>LIVE</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Arrows */}
          {activeVideos.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-300 group"
                data-testid="btn-prev-video"
                aria-label="Previous video"
              >
                <ChevronLeft className="h-6 w-6 text-gray-800 group-hover:text-purple-600" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-300 group"
                data-testid="btn-next-video"
                aria-label="Next video"
              >
                <ChevronRight className="h-6 w-6 text-gray-800 group-hover:text-purple-600" />
              </button>
            </>
          )}

          {/* Video Indicators */}
          {activeVideos.length > 1 && (
            <div className="flex justify-center space-x-2 mt-6">
              {activeVideos.map((_, index: number) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "bg-purple-600 w-8"
                      : "bg-gray-300 w-2 hover:bg-gray-400"
                  }`}
                  data-testid={`indicator-${index}`}
                  aria-label={`Go to video ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
