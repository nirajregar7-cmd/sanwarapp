import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Calendar, Clock, MapPin, Star, Heart } from "lucide-react";
import type { Booking } from "@shared/schema";
import { useLocation } from "wouter";
import { Link } from "wouter";

export default function CustomerBookings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: bookings, isLoading, error } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/my"],
    retry: false,
  });

  // Fetch liked salons for the customer
  const { data: likedSalons, isLoading: likedSalonsLoading } = useQuery<any[]>({
    queryKey: ["/api/customer/liked-salons"],
    enabled: !!isAuthenticated,
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [error, toast]);

  if (authLoading || isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <Skeleton className="h-6 sm:h-8 w-32 sm:w-48 mb-2" />
          <Skeleton className="h-3 sm:h-4 w-48 sm:w-64" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
                <div className="space-y-2 mb-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-accent text-white";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-gray-100 text-gray-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmed";
      case "pending":
        return "Pending";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const isUpcoming = (date: string, time: string) => {
    const bookingDateTime = new Date(`${date} ${time}`);
    return bookingDateTime > new Date();
  };

  const handleReschedule = (booking: Booking) => {
    // Navigate to salon detail page with booking data for rescheduling
    setLocation(`/salon/${booking.salonId}?reschedule=${booking.id}`);
  };

  const handleCancel = (booking: Booking) => {
    // TODO: Implement booking cancellation
    toast({
      title: "Cancellation",
      description: "Booking cancellation feature coming soon",
      variant: "default",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">My Bookings</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Manage your salon appointments</p>
        </div>

      {bookings && bookings.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {bookings.map((booking: Booking) => (
            <Card 
              key={booking.id} 
              className={`dark:bg-gray-800 dark:border-gray-700 ${isUpcoming(booking.date || '', booking.startTime || '') ? 'border-l-4 border-l-accent' : ''}`}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 space-y-2 sm:space-y-0">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                      Salon Booking #{booking.id.slice(-6)}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Service booked</p>
                  </div>
                  <Badge className={`${getStatusColor(booking.status || '')} flex-shrink-0 self-start`}>
                    {getStatusText(booking.status || '')}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                    <span>{new Date(booking.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{booking.startTime} - {booking.endTime}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <span>Salon Location</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                  <span className="font-semibold text-primary text-lg">₹{booking.totalAmount}</span>
                  <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                    {booking.status === "completed" ? (
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <Star className="h-4 w-4 mr-1" />
                        Rate & Review
                      </Button>
                    ) : booking.status === "confirmed" || booking.status === "pending" ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full sm:w-auto"
                          onClick={() => handleReschedule(booking)}
                        >
                          Reschedule
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full sm:w-auto text-red-600 hover:text-red-700"
                          onClick={() => handleCancel(booking)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No bookings yet</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">You haven't made any salon appointments yet.</p>
          <Button asChild>
            <a href="/">Find Salons</a>
          </Button>
        </div>
      )}

      {/* Liked Salons Section */}
      <div className="mt-8 sm:mt-12">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              <Heart className="h-5 w-5 text-red-500 mr-2" />
              Liked Salons
            </CardTitle>
          </CardHeader>
          <CardContent>
            {likedSalonsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : likedSalons && likedSalons.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {likedSalons.map((salon: any) => (
                  <Link key={salon.id} href={`/salon/${salon.id}`}>
                    <div className="group cursor-pointer bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="relative h-32 bg-gray-100">
                        {salon.imageUrl ? (
                          <img
                            src={salon.imageUrl}
                            alt={salon.name || 'Salon image'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                            <span className="text-accent text-lg font-semibold">
                              {salon.name?.charAt(0) || 'S'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{salon.name || 'Unknown Salon'}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate mb-2">{salon.address || 'Address not available'}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {salon.averageRating > 0 && (
                              <>
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="text-sm text-gray-600 dark:text-gray-300 ml-1">
                                  {salon.averageRating.toFixed(1)}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <Heart className="h-3 w-3 text-red-500 mr-1" />
                            <span>{salon.likesCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                  <Heart className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">No liked salons yet</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Start exploring and save your favorite salons
                </p>
                <Button variant="outline" size="sm" onClick={() => setLocation("/")}>
                  Discover Salons
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
