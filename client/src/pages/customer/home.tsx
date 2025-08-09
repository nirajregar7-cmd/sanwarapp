import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Clock, MapPin, Search, Heart } from "lucide-react";
import type { Salon } from "@shared/schema";

export default function CustomerHome() {
  const { data: salons, isLoading } = useQuery<Salon[]>({
    queryKey: ["/api/salons"],
    queryFn: async () => {
      const response = await fetch("/api/salons");
      if (!response.ok) throw new Error("Failed to fetch salons");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="interface-panel">
        {/* Hero Section */}
        <section className="gradient-primary text-white py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6">
              Book Your Perfect Salon Experience
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 opacity-90 px-4">
              Discover top-rated salons near you and book appointments instantly
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto bg-white rounded-lg p-2 flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center px-3 sm:px-4 py-2 sm:py-0">
                <MapPin className="text-gray-400 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                <Input 
                  type="text" 
                  placeholder="Enter your location" 
                  className="w-full text-gray-700 text-sm sm:text-lg bg-transparent border-none outline-none focus:ring-0"
                />
              </div>
              <Button className="bg-primary text-white px-6 sm:px-8 py-2 sm:py-3 hover:bg-primary/90 text-sm sm:text-base">
                <Search className="h-4 w-4 mr-2" />
                <span className="hidden xs:inline">Find Salons</span>
                <span className="xs:hidden">Find</span>
              </Button>
            </div>
          </div>
        </section>

        {/* Loading Skeleton */}
        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Featured Salons Near You</h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 px-4">Discover the best salon services in your area</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="w-full h-48" />
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <div className="flex gap-2 mb-4">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="interface-panel">
      {/* Hero Section */}
      <section className="gradient-primary text-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6 px-2">
            Book Your Perfect Salon Experience
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 opacity-90 px-4">
            Discover top-rated salons near you and book appointments instantly
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto bg-white rounded-xl p-2 sm:p-3 flex flex-col sm:flex-row gap-2 sm:gap-3 shadow-2xl">
            <div className="flex-1 flex items-center px-3 sm:px-4 py-2 sm:py-0">
              <MapPin className="text-gray-400 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
              <Input 
                type="text" 
                placeholder="Enter your location" 
                className="w-full text-gray-700 text-sm sm:text-lg bg-transparent border-none outline-none focus:ring-0"
              />
            </div>
            <Button className="bg-primary text-white px-6 sm:px-8 py-2 sm:py-3 hover:bg-primary/90 rounded-lg font-semibold text-sm sm:text-base">
              <Search className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Find Salons</span>
              <span className="xs:hidden">Find</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Salons */}
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">Featured Salons Near You</h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 px-2">Discover the best salon services in your area</p>
          </div>

          {salons && salons.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
              {salons.map((salon) => (
                <Card key={salon.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="relative">
                    <img 
                      src={salon.imageUrl || "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=240"} 
                      alt={salon.name} 
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{salon.name}</h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center text-yellow-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="ml-1 text-gray-600">
                            {salon.averageRating ? Number(salon.averageRating).toFixed(1) : "New"}
                          </span>
                        </div>
                        {(salon as any).likesCount > 0 && (
                          <div className="flex items-center text-red-500">
                            <Heart className="h-4 w-4 fill-current" />
                            <span className="ml-1 text-gray-600 text-sm">
                              {(salon as any).likesCount}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">{salon.address}</p>
                    
                    <div className="flex items-center mb-4">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Open now</span>
                      <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700">
                        Available
                      </Badge>
                    </div>
                    
                    <Link href={`/salon/${salon.id}`}>
                      <Button className="w-full bg-primary hover:bg-primary/90">
                        View Details & Book
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No salons found in your area.</p>
              <p className="text-gray-500 mt-2">Check back later or try a different location.</p>
            </div>
          )}

          {salons && salons.length > 6 && (
            <div className="text-center">
              <Button variant="outline" size="lg">
                Load More Salons
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
