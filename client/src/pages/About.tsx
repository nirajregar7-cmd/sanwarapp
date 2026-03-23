import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Target, Award, Heart, Menu, X, Scissors, ChevronRight } from "lucide-react";
import sanwarLogo from "@/assets/sanwar-logo.png";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function About() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo and Brand */}
            <Link href="/" className="flex items-center space-x-3 group cursor-pointer" data-testid="link-logo">
              <div className="relative">
                <img
                  src={sanwarLogo}
                  alt="Sanwar"
                  className="w-14 h-14 object-contain transform group-hover:scale-110 transition-all duration-300"
                />
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
                    className="block px-4 py-3 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all font-semibold mx-2 mt-2 text-center"
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

      {/* Header */}
      <section className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">About Sanwar</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Revolutionizing the beauty and wellness industry through smart technology and seamless booking experiences.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Mission Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              To digitize and simplify the salon booking experience, making beauty and wellness services accessible, 
              convenient, and trustworthy for everyone across India and beyond.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-purple-600" />
                  For Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Discover top-rated salons and spas near you. Book appointments instantly with real-time availability, 
                  transparent pricing, and verified reviews. Experience hassle-free beauty services at your fingertips.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-blue-600" />
                  For Salon Owners
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Grow your business with our comprehensive management platform. Streamline bookings, manage staff schedules, 
                  track analytics, and reach more customers through our trusted marketplace.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Story Section */}
        <div className="mb-16">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Our Story</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 leading-relaxed max-w-4xl mx-auto mb-6">
                Founded by Niraj Regar and Naveen Chopra, alumni of NIT Trichy, Sanwar was born from a simple observation: 
                booking beauty services shouldn't be complicated. Inspired by the success of platforms like Zomato and IRCTC, 
                we envisioned a platform that would bring the same level of convenience and reliability to the salon industry.
              </p>
              <p className="text-gray-600 leading-relaxed max-w-4xl mx-auto">
                Starting in India and expanding globally, we're building a comprehensive ecosystem that serves customers, 
                salon owners, and the entire beauty industry with innovative technology and unwavering commitment to quality.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg text-center">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Heart className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle>Customer First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Every decision we make is driven by our commitment to delivering exceptional customer experiences.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg text-center">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Award className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>Quality Assurance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We maintain the highest standards through verified reviews, quality checks, and continuous improvement.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg text-center">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-indigo-600" />
                </div>
                <CardTitle>Community Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We empower local businesses and create opportunities for growth within the beauty and wellness community.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <CardContent className="py-12">
              <h3 className="text-2xl font-bold mb-4">Join the Sanwar Community</h3>
              <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
                Whether you're looking for your next beauty appointment or want to grow your salon business, 
                we're here to help you succeed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="bg-white text-purple-600 hover:bg-gray-100"
                  data-testid="button-find-salons"
                >
                  <Link href="/discover">Find Salons Near You</Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-white text-white hover:bg-white hover:text-purple-600"
                  data-testid="button-partner"
                >
                  <Link href="/auth">Become a Partner</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}