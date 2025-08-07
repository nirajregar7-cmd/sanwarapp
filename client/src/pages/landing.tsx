import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";

export default function Landing() {
  return (
    <div className="interface-panel">
      {/* Hero Section */}
      <section className="gradient-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Book Your Perfect Salon Experience
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Discover top-rated salons near you and book appointments instantly
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto bg-white rounded-lg p-2 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center px-4">
              <MapPin className="text-gray-400 mr-3 h-5 w-5" />
              <Input 
                type="text" 
                placeholder="Enter your location" 
                className="w-full text-gray-700 text-lg bg-transparent border-none outline-none focus:ring-0"
              />
            </div>
            <Button className="bg-primary text-white px-8 py-3 hover:bg-primary/90">
              <Search className="h-4 w-4 mr-2" />
              Find Salons
            </Button>
          </div>

          <div className="mt-8">
            <Button size="lg" asChild>
              <a href="/api/login">Get Started</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Sanwar?</h2>
            <p className="text-xl text-gray-600">Everything you need for a perfect salon experience</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Discovery</h3>
              <p className="text-gray-600">Find the best salons near you with detailed profiles and reviews</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Booking</h3>
              <p className="text-gray-600">Book appointments in real-time with available time slots</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600">Safe and secure online payments with multiple options</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
