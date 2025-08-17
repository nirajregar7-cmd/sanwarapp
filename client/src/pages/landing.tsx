import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Clock, Users, Scissors, Calendar, Shield, Smartphone, CheckCircle, TrendingUp, IndianRupee, Gift } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { PlatformStats, Salon } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import SalonCard from "@/components/SalonCard";
import sanwarLogo from "@assets/WhatsApp Image 2025-08-17 at 18.09.29_dd534b02_1755434431399.jpg";

export default function Landing() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();

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

  // Fetch top-rated salons (real data only)
  const { data: topSalons, isLoading: salonsLoading } = useQuery<Salon[]>({
    queryKey: ["/api/salons/featured"],
    queryFn: async () => {
      const response = await fetch("/api/salons/featured");
      if (!response.ok) throw new Error("Failed to fetch salons");
      return response.json();
    },
  });

  return (
    <div className="interface-panel">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white py-12 sm:py-16 lg:py-24 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-purple-300/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-blue-300/20 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <img 
                src={sanwarLogo} 
                alt="Sanwar - Smart Salon Booking Platform" 
                className="h-16 w-auto sm:h-20 md:h-24 lg:h-32 rounded-xl shadow-lg"
              />
            </div>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-3 sm:mb-4 opacity-95 font-medium">
              {t('hero.title')}
            </p>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 opacity-85 px-4 max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>
          </div>

          {/* Platform Statistics */}
          {!statsLoading && stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12 max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-white/25 to-white/15 backdrop-blur-md border border-white/40 rounded-xl p-4 sm:p-5 hover:from-white/30 hover:to-white/20 transition-all duration-300 group">
                <div className="text-lg sm:text-2xl md:text-3xl font-bold text-white group-hover:scale-110 transition-transform duration-300">{stats.totalCustomers}+</div>
                <div className="text-xs sm:text-sm text-white/95 font-medium">{t('stats.customers')}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-400/25 to-purple-600/15 backdrop-blur-md border border-purple-300/40 rounded-xl p-4 sm:p-5 hover:from-purple-400/30 hover:to-purple-600/20 transition-all duration-300 group">
                <div className="text-lg sm:text-2xl md:text-3xl font-bold text-white group-hover:scale-110 transition-transform duration-300">{stats.totalSalons}+</div>
                <div className="text-xs sm:text-sm text-white/95 font-medium">{t('stats.salons')}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-400/25 to-blue-600/15 backdrop-blur-md border border-blue-300/40 rounded-xl p-4 sm:p-5 hover:from-blue-400/30 hover:to-blue-600/20 transition-all duration-300 group">
                <div className="text-lg sm:text-2xl md:text-3xl font-bold text-white group-hover:scale-110 transition-transform duration-300">{stats.totalBookings}+</div>
                <div className="text-xs sm:text-sm text-white/95 font-medium">{t('stats.bookings')}</div>
              </div>
              <div className="bg-gradient-to-br from-indigo-400/25 to-indigo-600/15 backdrop-blur-md border border-indigo-300/40 rounded-xl p-4 sm:p-5 hover:from-indigo-400/30 hover:to-indigo-600/20 transition-all duration-300 group">
                <div className="text-lg sm:text-2xl md:text-3xl font-bold text-white group-hover:scale-110 transition-transform duration-300">{stats.totalServices}+</div>
                <div className="text-xs sm:text-sm text-white/95 font-medium">{t('stats.services')}</div>
              </div>
            </div>
          )}
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto bg-white/95 backdrop-blur-sm rounded-2xl p-2 sm:p-3 flex flex-col sm:flex-row gap-2 sm:gap-3 shadow-2xl border border-white/20">
            <div className="flex-1 flex items-center px-3 sm:px-4 py-2 sm:py-0">
              <MapPin className="text-gray-500 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
              <Input 
                type="text" 
                placeholder={t('search.placeholder')} 
                className="w-full text-gray-700 text-sm sm:text-lg bg-transparent border-none outline-none focus:ring-0 placeholder:text-gray-500"
              />
            </div>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 sm:px-8 py-2 sm:py-3 hover:from-purple-700 hover:to-blue-700 rounded-xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300">
              <Search className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">{t('nav.find_salons')}</span>
              <span className="xs:hidden">{t('search.find')}</span>
            </Button>
          </div>

          {/* User Type Selection */}
          <div className="mt-8 sm:mt-12 max-w-4xl mx-auto px-4">
            <div className="text-center mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                {t('hero.who_are_you')}
              </h3>
              <p className="text-white/90 text-sm sm:text-base">
                {t('hero.choose_account_type')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Customer Card */}
              <div className="bg-gradient-to-br from-blue-500/25 to-cyan-600/15 backdrop-blur-md border border-blue-300/40 rounded-2xl p-6 hover:from-blue-500/35 hover:to-cyan-600/25 transition-all duration-300 cursor-pointer group hover:scale-105"
                   onClick={() => window.location.href = '/auth'}>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">{t('hero.customer_title')}</h4>
                  <p className="text-white/85 text-sm mb-4 leading-relaxed">
                    {t('hero.customer_desc')}
                  </p>
                  <ul className="text-white/90 text-sm space-y-2 mb-6 text-left">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-300" />
                      Find nearby salons
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-300" />
                      Book appointments instantly
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-300" />
                      Manage bookings
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-300" />
                      Leave reviews & earn rewards
                    </li>
                  </ul>
                  <div className="space-y-3">
                    <Button 
                      size="lg" 
                      className="w-full bg-white hover:bg-gray-50 text-blue-700 font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <span className="text-blue-700">{t('hero.signup_customer')}</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full bg-white/15 border-white/40 hover:bg-white/25 text-white font-medium py-2 rounded-xl transition-all duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReferEarnClick('customer');
                      }}
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      Refer & Earn
                    </Button>
                  </div>
                </div>
              </div>

              {/* Salon Owner Card */}
              <div className="bg-gradient-to-br from-purple-500/25 to-pink-600/15 backdrop-blur-md border border-purple-300/40 rounded-2xl p-6 hover:from-purple-500/35 hover:to-pink-600/25 transition-all duration-300 cursor-pointer group hover:scale-105"
                   onClick={() => window.location.href = '/auth'}>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Scissors className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">{t('hero.owner_title')}</h4>
                  <p className="text-white/85 text-sm mb-4 leading-relaxed">
                    {t('hero.owner_desc')}
                  </p>
                  <ul className="text-white/90 text-sm space-y-2 mb-6 text-left">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-300" />
                      Setup salon profile
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-300" />
                      Manage services & staff
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-300" />
                      Create time slots
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-300" />
                      Handle bookings & earnings
                    </li>
                  </ul>
                  <div className="space-y-3">
                    <Button 
                      size="lg" 
                      className="w-full bg-white hover:bg-gray-50 text-purple-700 font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <span className="text-purple-700">{t('hero.signup_owner')}</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full bg-white/15 border-white/40 hover:bg-white/25 text-white font-medium py-2 rounded-xl transition-all duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReferEarnClick('salon_owner');
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
      </section>

      {/* Available Services Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Available Services
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-3xl mx-auto px-4">
              Discover a wide range of beauty and grooming services at your fingertips
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {[
              { icon: Scissors, name: "Haircut & Styling", color: "bg-blue-100 text-blue-600" },
              { icon: Star, name: "Facial Treatment", color: "bg-pink-100 text-pink-600" },
              { icon: Users, name: "Bridal Package", color: "bg-purple-100 text-purple-600" },
              { icon: Calendar, name: "Hair Color", color: "bg-green-100 text-green-600" },
              { icon: Shield, name: "Spa & Massage", color: "bg-indigo-100 text-indigo-600" },
              { icon: Smartphone, name: "Manicure & Pedicure", color: "bg-yellow-100 text-yellow-600" },
            ].map((service, index) => (
              <div key={index} className="text-center group cursor-pointer">
                <div className={`mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full ${service.color} flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}>
                  <service.icon className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
                <h3 className="font-semibold text-gray-900 text-xs sm:text-sm lg:text-base">{service.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Salon Previews */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Top Rated Salons Near You
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-3xl mx-auto px-4">
              Book instantly with our partner salons offering premium services
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {salonsLoading ? (
              // Loading skeleton for salons
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="overflow-hidden animate-pulse">
                  <div className="aspect-video bg-gray-300"></div>
                  <CardContent className="p-4">
                    <div className="h-6 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))
            ) : topSalons && topSalons.length > 0 ? (
              topSalons.map((salon) => (
                <SalonCard key={salon.id} salon={salon} />
              ))
            ) : (
              // No salons found state
              <div className="col-span-full text-center py-12">
                <Scissors className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Salons Yet</h3>
                <p className="text-gray-700 mb-6">Be the first salon owner to join our platform!</p>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/owner">
                    <Scissors className="h-4 w-4 mr-2" />
                    Register Your Salon
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Sanwar Works
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Simple steps to book your perfect salon experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: "Find & Choose",
                description: "Browse salons near you, compare services, prices, and read reviews",
                icon: Search
              },
              {
                step: 2,
                title: "Book Instantly",
                description: "Select your preferred time slot and pay the confirmation amount to secure your booking",
                icon: Calendar
              },
              {
                step: 3,
                title: "Enjoy Service",
                description: "Visit the salon at your booked time, enjoy premium services, and pay the remaining amount",
                icon: CheckCircle
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: 'hsl(248.0645, 92.8571%, 61.1765%)'}}>
                    <item.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{backgroundColor: 'hsl(328.1818, 84.8485%, 60.5882%)'}}>
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-700">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Sanwar?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Clock,
                title: "Real-time Slots",
                description: "Live availability like IRCTC booking system"
              },
              {
                icon: Shield,
                title: "Secure Payments",
                description: "Safe and encrypted payment processing"
              },
              {
                icon: Star,
                title: "Verified Reviews",
                description: "Authentic reviews from real customers"
              },
              {
                icon: Smartphone,
                title: "Mobile Friendly",
                description: "Book anytime, anywhere from your mobile"
              }
            ].map((feature, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-700 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white py-16 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-300/20 rounded-full blur-2xl"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Beauty Experience?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of satisfied customers and partner salons on Sanwar
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white hover:bg-gray-100 text-lg px-8 py-4 rounded-xl font-semibold" 
              style={{color: 'hsl(248.0645, 92.8571%, 61.1765%)'}} 
              onClick={() => window.location.href = '/api/login?user_intent=customer'}
            >
              Start Booking Now
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white/10 border-white/40 text-white hover:bg-white hover:text-purple-700 text-lg px-8 py-4 rounded-xl font-semibold transition-all duration-300" 
              onClick={() => window.location.href = '/api/login?user_intent=salon_owner'}
            >
              <span className="text-white hover:text-purple-700">Partner With Us</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 text-2xl font-bold mb-4">
                <Scissors className="h-6 w-6" />
                <span>Sanwar</span>
              </div>
              <p className="text-gray-400">
                India's premier salon booking platform connecting customers with top-rated salons.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Customers</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Find Salons</a></li>
                <li><a href="#" className="hover:text-white">Book Services</a></li>
                <li><a href="#" className="hover:text-white">Manage Bookings</a></li>
                <li><a href="#" className="hover:text-white">Refer & Earn</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Salon Owners</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">List Your Salon</a></li>
                <li><a href="#" className="hover:text-white">Manage Bookings</a></li>
                <li><a href="#" className="hover:text-white">Business Analytics</a></li>
                <li><a href="#" className="hover:text-white">Staff Management</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Sanwar. All rights reserved. Built for Indian salons.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
