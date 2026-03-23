import { Link } from "wouter";
import sanwarLogo from "@/assets/sanwar-logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  Scissors,
  Building2,
  MapPin,
  Calendar,
  CreditCard,
  Gift,
  Shield,
  Mail,
  Search,
  Clock,
  TrendingUp,
  Eye,
  DollarSign,
  Megaphone,
  Bell,
  CheckCircle,
  Star,
  Smartphone,
  Globe,
  BarChart3,
  Settings,
  Crown,
  Zap,
  Target,
  HeadphonesIcon,
  Menu,
  X
} from "lucide-react";

export default function Features() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-blue-100 to-slate-300">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3 group cursor-pointer" data-testid="link-home-logo">
              <div className="relative">
                <img
                  src={sanwarLogo}
                  alt="Sanwar"
                  className="w-10 h-10 rounded-xl object-cover shadow-md transform group-hover:scale-110 transition-all duration-300"
                />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 bg-clip-text text-transparent">
                  Sanwar
                </span>
                <p className="text-[10px] text-gray-500 font-medium -mt-0.5">Smart Salon Booking</p>
              </div>
            </Link>
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors font-medium" data-testid="link-home">
                Home
              </Link>
              <Link href="/services" className="text-gray-600 hover:text-gray-900 transition-colors font-medium" data-testid="link-services">
                Services
              </Link>
              <Link href="/features" className="text-gray-600 hover:text-gray-900 transition-colors font-medium" data-testid="link-features">
                Features
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors font-medium" data-testid="link-about">
                About Us
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors font-medium" data-testid="link-contact">
                Contact
              </Link>
              {isAuthenticated ? (
                <Link href="/dashboard" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium" data-testid="link-dashboard">
                  Dashboard
                </Link>
              ) : (
                <Link href="/auth" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium" data-testid="link-login">
                  Login
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
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
                <Link 
                  href="/" 
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="link-home-mobile"
                >
                  Home
                </Link>
                <Link 
                  href="/services" 
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="link-services-mobile"
                >
                  Services
                </Link>
                <Link 
                  href="/features" 
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="link-features-mobile"
                >
                  Features
                </Link>
                <Link 
                  href="/about" 
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="link-about-mobile"
                >
                  About Us
                </Link>
                <Link 
                  href="/contact" 
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors font-medium"
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
                    className="block px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 transition-all font-medium mx-3 mt-3 text-center"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="link-login-mobile"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Header Section */}
      <section className="py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8 inline-block">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Scissors className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sanwar</h1>
            <p className="text-orange-600 font-semibold">MANAGE YOUR SALON HERE</p>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            India's Smart Salon Booking Platform
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Like Zomato for Salons • Real-time slots like IRCTC • Instant confirmations
          </p>
        </div>
      </section>

      {/* Main Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* For Customers */}
            <Card className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">For Customers</h2>
                  <p className="text-gray-600">Everything you need for the perfect salon experience</p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Search className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Discover Nearby Salons</h3>
                      <p className="text-sm text-gray-600">Find salons within 30km using GPS location, view detailed profiles, photos, and real customer reviews</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Real-Time Booking</h3>
                      <p className="text-sm text-gray-600">Book available time slots instantly, choose specific staff members, select services with clear pricing</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CreditCard className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Flexible Payments</h3>
                      <p className="text-sm text-gray-600">Pay small confirmation amount (₹50-100) to secure booking, pay remaining amount at salon after service</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Gift className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Rewards & Referrals</h3>
                      <p className="text-sm text-gray-600">Earn money by referring friends, get exclusive offers, track your booking history and reviews</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Safe & Secure</h3>
                      <p className="text-sm text-gray-600">All salons are verified, secure payment processing, customer support available, easy rescheduling</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Email Notifications</h3>
                      <p className="text-sm text-gray-600">Receive instant booking confirmations, reminders, and updates via email for all your appointments</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* For Salon Owners */}
            <Card className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Scissors className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">For Salon Owners</h2>
                  <p className="text-gray-600">Complete business management and growth tools</p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Smartphone className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Digital Salon Profile</h3>
                      <p className="text-sm text-gray-600">Create attractive salon profile with photos/videos, service menu, pricing, staff details, working hours</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Smart Slot Management</h3>
                      <p className="text-sm text-gray-600">Auto-generate time slots based on working hours, manage staff schedules, handle walk-in bookings</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Business Analytics</h3>
                      <p className="text-sm text-gray-600">Track bookings, earnings, customer analytics, staff performance, popular services and growth trends</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Eye className="h-4 w-4 text-cyan-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Daily Visitor Analytics</h3>
                      <p className="text-sm text-gray-600">See exactly how many customers visited your salon profile today, track daily trends and customer interest levels</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <DollarSign className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Revenue Management</h3>
                      <p className="text-sm text-gray-600">Receive 80% of earnings (platform keeps 20%), automatic payment processing, detailed financial reports</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Megaphone className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Marketing Tools</h3>
                      <p className="text-sm text-gray-600">Create service-specific offers, manage promotional campaigns, referral programs, customer retention tools</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bell className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Automated Notifications</h3>
                      <p className="text-sm text-gray-600">Automatic email alerts for new bookings, cancellations, and customer updates to keep you informed</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* For Brand Owners */}
            <Card className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">For Brand Owners</h2>
                  <p className="text-gray-600">Scale your salon chain with enterprise solutions</p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Globe className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Multi-Location Management</h3>
                      <p className="text-sm text-gray-600">Manage multiple salon locations from single dashboard, unified branding, centralized booking system</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Enterprise Analytics</h3>
                      <p className="text-sm text-gray-600">Cross-location performance reports, customer behavior analysis, revenue optimization insights</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Settings className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Centralized Operations</h3>
                      <p className="text-sm text-gray-600">Standardized pricing, service menus, staff training modules, quality control across all locations</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Crown className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Brand Visibility</h3>
                      <p className="text-sm text-gray-600">Featured brand placement, premium listing in search results, brand-specific marketing campaigns</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Growth Acceleration</h3>
                      <p className="text-sm text-gray-600">Franchise management tools, new location onboarding, investor relations dashboard</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Target className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Customer Acquisition</h3>
                      <p className="text-sm text-gray-600">Advanced targeting tools, loyalty programs, cross-location customer retention strategies</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <HeadphonesIcon className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Dedicated Support</h3>
                      <p className="text-sm text-gray-600">24/7 priority support, dedicated account manager, custom integrations, API access</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* How Customers Use Sanwar */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">How Customers Use Sanwar:</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">1</div>
                  <div>
                    <p className="text-gray-700">Open app and allow location access to find nearby salons</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">2</div>
                  <div>
                    <p className="text-gray-700">Browse salon profiles, view photos, read reviews, compare prices</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">3</div>
                  <div>
                    <p className="text-gray-700">Select salon, choose services, pick preferred staff and time slot</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">4</div>
                  <div>
                    <p className="text-gray-700">Pay small confirmation amount online to secure your booking</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">5</div>
                  <div>
                    <p className="text-gray-700">Receive instant email confirmation and booking reminders</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">6</div>
                  <div>
                    <p className="text-gray-700">Visit salon at booked time, enjoy service, pay remaining amount</p>
                  </div>
                </div>
              </div>
            </div>

            {/* How Salon Owners Use Sanwar */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">How Salon Owners Use Sanwar:</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">1</div>
                  <div>
                    <p className="text-gray-700">Register salon and create detailed business profile with photos</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">2</div>
                  <div>
                    <p className="text-gray-700">Add services, pricing, staff details, and working hours</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">3</div>
                  <div>
                    <p className="text-gray-700">Set up automatic time slot generation based on your schedule</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">4</div>
                  <div>
                    <p className="text-gray-700">Receive instant notifications for new bookings and updates</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">5</div>
                  <div>
                    <p className="text-gray-700">Manage bookings, track earnings, and analyze business performance</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">6</div>
                  <div>
                    <p className="text-gray-700">Create offers, run promotions, and grow your customer base</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Sanwar Section */}
      <section className="py-16 bg-gradient-to-br from-slate-200 via-blue-100 to-slate-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Sanwar?</h2>
            <p className="text-xl text-gray-700">The most trusted platform for salon bookings in India</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Instant Booking</h3>
              <p className="text-gray-600">Book appointments in seconds with real-time availability</p>
            </Card>

            <Card className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Verified Salons</h3>
              <p className="text-gray-600">All partner salons are verified for quality and safety</p>
            </Card>

            <Card className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Fair Pricing</h3>
              <p className="text-gray-600">Transparent pricing with no hidden charges</p>
            </Card>

            <Card className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Mobile First</h3>
              <p className="text-gray-600">Seamless experience on mobile and desktop</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-br from-slate-200 via-blue-100 to-slate-300">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Beauty Experience?
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            Join thousands of satisfied customers and partner salons on Sanwar
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              asChild
            >
              <Link href="/auth">
                Start Booking Now
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600 text-lg px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              asChild
            >
              <Link href="/auth">
                Partner With Us
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}