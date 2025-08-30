import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Scissors, Star, ArrowLeft } from "lucide-react";
import { findUSCity, US_CITIES } from "@/data/us-cities";
import { useEffect } from "react";

export default function USCityDetail() {
  const { slug } = useParams<{ slug: string }>();
  const city = findUSCity(slug || "");

  // SEO: Update document title and meta description
  useEffect(() => {
    if (city) {
      document.title = `Book Salons & Barbers in ${city.city} | Sanwar`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute("content", 
          `Find top salons & barbers in ${city.city}. Book haircuts, grooming, spa and beauty services online with Sanwar – fast, easy and reliable.`
        );
      }
    }
  }, [city]);

  if (!city) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">City Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Sorry, we couldn't find the city you're looking for.</p>
          <Link href="/usa">
            <Button>Back to USA Cities</Button>
          </Link>
        </div>
      </div>
    );
  }

  const h1 = `Book Salons & Barbers in ${city.city}`;
  const intro = `Looking for the best salons and barbers in ${city.city}? Sanwar makes it simple to book salon appointments online for haircuts, grooming, spa, and beauty services. Whether you're in ${city.metroAreas.join(", ")}, Sanwar connects you with trusted professionals near you.`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/usa">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to USA Cities
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {h1}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto">
            {intro}
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <Scissors className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Top-rated Pros</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Discover salons and barbers with real reviews and ratings across {city.city}.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <Star className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Booking</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Pick a service, choose staff, and confirm your appointment in minutes.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                  <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Near You</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Popular areas: {city.metroAreas.slice(0, 3).join(", ")}…
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Services Section */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Popular Services in {city.city}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Scissors className="h-5 w-5 text-purple-600 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Men's & Women's Haircuts</span>
                </div>
                <div className="flex items-center">
                  <Scissors className="h-5 w-5 text-purple-600 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Beard Grooming & Styling</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-purple-600 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Makeup & Beauty Parlors</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-purple-600 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Spa & Relaxation Treatments</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metro Areas */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              We Serve All Areas in {city.city}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {city.metroAreas.map((area, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <MapPin className="h-4 w-4 text-purple-600 mr-2" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{area}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white mb-12">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-4">Why choose Sanwar in {city.city}?</h3>
            <p className="text-lg mb-6 opacity-90">
              Avoid waiting lines – browse salons, choose staff by rating, and confirm instantly. 
              Pay securely in USD or INR. Manage bookings, reviews, and reminders in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth?type=salon_owner">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Add Your Salon
                </Button>
              </Link>
              <Link href="/salons">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-purple-600">
                  Find Salons Near Me
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Other Cities */}
        <Card>
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Explore More US Cities
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {US_CITIES
                .filter(c => c.slug !== city.slug)
                .slice(0, 12)
                .map((c) => (
                  <Link key={c.slug} href={`/usa/${c.slug}`}>
                    <div className="block p-3 border rounded-lg hover:shadow-md hover:border-purple-300 transition-all duration-200 cursor-pointer bg-white dark:bg-gray-800 dark:border-gray-700 dark:hover:border-purple-400">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{c.city}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{c.state}</div>
                    </div>
                  </Link>
                ))}
            </div>
            <div className="mt-6 text-center">
              <Link href="/usa">
                <Button variant="outline">View All US Cities</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}