import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Scissors, Star } from "lucide-react";
import { US_CITIES } from "@/data/us-cities";

export default function USAHub() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Book Salons & Barbers Across the USA
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Choose your city to find top-rated salons and barbers. Book haircuts, grooming, spa and beauty services online with Sanwar.
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
              <h3 className="text-lg font-semibold mb-2">Top-rated Professionals</h3>
              <p className="text-gray-600 dark:text-gray-400">Discover salons and barbers with real reviews and ratings across the USA.</p>
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
              <p className="text-gray-600 dark:text-gray-400">Pick a service, choose staff, and confirm your appointment in minutes.</p>
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
              <p className="text-gray-600 dark:text-gray-400">Find salons and barbers in your neighborhood across all major US cities.</p>
            </CardContent>
          </Card>
        </div>

        {/* Cities Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Select Your City</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {US_CITIES.map((city) => (
                <Link key={city.slug} href={`/usa/${city.slug}`}>
                  <div className="block p-4 border rounded-lg hover:shadow-md hover:border-purple-300 transition-all duration-200 cursor-pointer bg-white dark:bg-gray-800 dark:border-gray-700 dark:hover:border-purple-400">
                    <div className="font-medium text-gray-900 dark:text-white">{city.city}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{city.state}</div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Why choose Sanwar in the USA?</h2>
              <p className="text-lg mb-6 opacity-90">
                Avoid waiting lines – browse salons, choose staff by rating, and confirm instantly. 
                Pay securely in USD. Manage bookings, reviews, and reminders in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
        </div>
      </div>
    </div>
  );
}