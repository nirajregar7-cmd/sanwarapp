import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Scissors, Sparkles, Users, Heart, Clock, Shield, CheckCircle } from "lucide-react";
import PublicNav from "@/components/PublicNav";

export default function Services() {
  const services = [
    {
      category: "Hair Services",
      icon: <Scissors className="h-6 w-6" />,
      services: ["Haircut & Styling", "Hair Coloring", "Hair Treatment", "Hair Spa", "Keratin Treatment", "Rebonding"]
    },
    {
      category: "Skin Care",
      icon: <Sparkles className="h-6 w-6" />,
      services: ["Facial Treatment", "Clean Up", "Skin Analysis", "Anti-Aging Treatment", "Acne Treatment", "Brightening Treatment"]
    },
    {
      category: "Beauty Services",
      icon: <Heart className="h-6 w-6" />,
      services: ["Makeup", "Bridal Makeup", "Party Makeup", "Eyebrow Threading", "Eyelash Extension", "Nail Art"]
    },
    {
      category: "Body Treatments",
      icon: <Users className="h-6 w-6" />,
      services: ["Body Massage", "Body Polishing", "Waxing", "Manicure", "Pedicure", "Body Spa"]
    }
  ];

  const features = [
    {
      icon: <Clock className="h-8 w-8 text-blue-600" />,
      title: "Real-time Booking",
      description: "Book appointments instantly with live availability updates"
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: "Verified Salons",
      description: "All partner salons are verified and quality-checked"
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-purple-600" />,
      title: "Instant Confirmation",
      description: "Get immediate booking confirmation via email and SMS"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <PublicNav />

      {/* Header */}
      <section className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Our Services</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Discover a wide range of beauty and wellness services available through our trusted partner salons.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Staff Registration Banner — top of page */}
        <div className="mb-14">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white p-8 sm:p-12 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
                    🔥 New Feature
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">
                    Sanwar Staff Registration
                  </h2>
                  <p className="text-blue-100 text-lg mb-4">
                    Are you a barber, stylist, beautician, or makeup artist? Register your professional profile and get discovered by verified salons.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {["Barbers", "Hair Stylists", "Beauticians", "Nail Artists", "Makeup Artists", "Helpers"].map((role) => (
                      <span key={role} className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                        {role}
                      </span>
                    ))}
                  </div>
                  <Link href="/staff-registration">
                    <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-8 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105">
                      Register as a Professional →
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center flex-shrink-0">
                  {[
                    { step: "1", label: "Fill your profile" },
                    { step: "2", label: "Add your skills" },
                    { step: "3", label: "Set salary range" },
                    { step: "4", label: "Get hired!" },
                  ].map((item) => (
                    <div key={item.step} className="bg-white/15 rounded-2xl p-4 w-28">
                      <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-2">
                        {item.step}
                      </div>
                      <p className="text-xs font-medium leading-tight">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Why Choose Sanwar?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg text-center">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Service Categories */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Popular Service Categories</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {services.map((category, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-purple-600">
                    {category.icon}
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {category.services.map((service, serviceIndex) => (
                      <Badge key={serviceIndex} variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-4 text-white font-bold text-xl">
                  1
                </div>
                <CardTitle>Find Salons</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Search and discover top-rated salons and spas near your location with detailed profiles and reviews.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4 text-white font-bold text-xl">
                  2
                </div>
                <CardTitle>Book Appointment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Select your preferred service, choose a convenient time slot, and book instantly with no charges.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mb-4 text-white font-bold text-xl">
                  3
                </div>
                <CardTitle>Enjoy Service</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Visit the salon at your booked time, enjoy professional service, and pay the service fee directly at the salon.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pricing Information */}
        <div className="mb-16">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-100 to-blue-100">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Simple & Transparent Pricing</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-6">
                <div className="text-2xl font-semibold text-gray-700 mb-2">Service Fees</div>
                <div className="text-gray-600">Paid directly at the salon according to their pricing</div>
              </div>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Book your appointments completely free! Service prices are set by individual salons and clearly displayed before booking. 
                Pay directly at the salon for the services you receive.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <CardContent className="py-12">
              <h3 className="text-2xl font-bold mb-4">Ready to Experience Premium Beauty Services?</h3>
              <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
                Join thousands of satisfied customers who trust Sanwar for their beauty and wellness needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="bg-white text-purple-600 hover:bg-gray-100"
                  data-testid="button-book-now"
                >
                  <Link href="/discover">Book Your Appointment</Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-white text-white hover:bg-white hover:text-purple-600"
                  data-testid="button-learn-more"
                >
                  <Link href="/about">Learn More About Us</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}