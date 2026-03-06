import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar, Clock, MapPin, Star, Heart, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type { BookingWithDetails } from "@shared/schema";

// Extended type for grouped bookings
interface GroupedBooking extends BookingWithDetails {
  servicesList: string[];
  servicesCount: number;
  totalGroupAmount: number;
  allBookingIds: string[];
  groupStatus: string;
}
import { useLocation } from "wouter";
import { Link } from "wouter";

export default function CustomerBookings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Group bookings by appointment (same customer, date, time) for multiple services
  const groupBookingsByAppointment = (bookings: BookingWithDetails[]): GroupedBooking[] => {
    const groups = new Map<string, BookingWithDetails[]>();
    
    bookings.forEach(booking => {
      const key = `${booking.date}-${booking.startTime}-${booking.endTime}-${booking.salonId}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(booking);
    });
    
    // Helper function to aggregate status
    const getGroupStatus = (group: BookingWithDetails[]): string => {
      const statuses = group.map(b => b.status);
      const uniqueStatuses = [...new Set(statuses)];
      
      if (uniqueStatuses.length === 1) {
        return uniqueStatuses[0] || 'unknown';
      }
      
      // Mixed statuses - prioritize based on importance
      if (statuses.includes('cancelled')) {
        return 'partially cancelled';
      }
      if (statuses.includes('pending')) {
        return 'pending';
      }
      if (statuses.includes('confirmed')) {
        return 'confirmed';
      }
      return 'mixed status';
    };
    
    // Convert groups to array and sort by date/time
    return Array.from(groups.values())
      .map(group => {
        // Sort services within group and return the primary booking with services list
        const sortedGroup = group.sort((a, b) => 
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );
        const primaryBooking = sortedGroup[0];
        
        return {
          ...primaryBooking,
          servicesList: sortedGroup.map(b => b.service?.name || 'Service'),
          servicesCount: sortedGroup.length,
          totalGroupAmount: sortedGroup.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
          allBookingIds: sortedGroup.map(b => b.id),
          groupStatus: getGroupStatus(sortedGroup)
        } as GroupedBooking;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.startTime}`);
        const dateB = new Date(`${b.date} ${b.startTime}`);
        return dateB.getTime() - dateA.getTime();
      });
  };

  const { data: rawBookings, isLoading, error } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings/my"],
    retry: false,
  });

  // Group the bookings for display
  const bookings = rawBookings ? groupBookingsByAppointment(rawBookings) : [];

  // Fetch liked salons for the customer
  const { data: likedSalons, isLoading: likedSalonsLoading } = useQuery<any[]>({
    queryKey: ["/api/customer/liked-salons"],
    enabled: !!isAuthenticated,
    retry: false,
  });

  // Move the cancelBookingMutation hook here, before any early returns
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return await apiRequest("PATCH", `/api/customer/bookings/${bookingId}/cancel`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my"] });
      toast({ title: "Booking cancelled", description: "Your booking has been cancelled successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Cancellation failed", description: error.message || "Failed to cancel booking", variant: "destructive" });
    },
  });

  // Respond to owner's suggested time
  const respondSuggestionMutation = useMutation({
    mutationFn: async ({ bookingId, action }: { bookingId: string; action: "accept" | "decline" }) => {
      return await apiRequest("PATCH", `/api/bookings/${bookingId}/respond`, { action });
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my"] });
      toast({
        title: action === "accept" ? "Time accepted!" : "Booking declined",
        description: action === "accept" ? "Your appointment has been confirmed with the new time." : "The booking has been cancelled.",
      });
    },
    onError: (error: any) => {
      toast({ title: "Failed to respond", description: error.message, variant: "destructive" });
    },
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
      case "confirmed": return "bg-accent text-white";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-gray-100 text-gray-700";
      case "cancelled": return "bg-red-100 text-red-700";
      case "owner_suggested": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed": return "Confirmed";
      case "pending": return "⏳ Awaiting Confirmation";
      case "completed": return "Completed";
      case "cancelled": return "Cancelled";
      case "owner_suggested": return "⏰ New Time Suggested";
      default: return status;
    }
  };

  const isUpcoming = (date: string, time: string) => {
    const bookingDateTime = new Date(`${date} ${time}`);
    return bookingDateTime > new Date();
  };

  const handleReschedule = (booking: BookingWithDetails) => {
    // Navigate to salon detail page with booking data for rescheduling
    setLocation(`/salon/${booking.salonId}?reschedule=${booking.id}`);
  };

  const handleCancel = (booking: BookingWithDetails) => {
    // Check if booking can be cancelled
    const bookingDateTime = new Date(`${booking.date} ${booking.startTime}`);
    const now = new Date();
    
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      toast({
        title: "Cannot cancel",
        description: `This booking is already ${booking.status}`,
        variant: "destructive",
      });
      return;
    }
    
    if (bookingDateTime <= now) {
      toast({
        title: "Cannot cancel",
        description: "Cannot cancel past bookings",
        variant: "destructive",
      });
      return;
    }

    if (confirm("Are you sure you want to cancel this booking?")) {
      cancelBookingMutation.mutate(booking.id);
    }
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
          {bookings.map((booking: BookingWithDetails) => (
            <Card 
              key={booking.id} 
              className={`dark:bg-gray-800 dark:border-gray-700 ${isUpcoming(booking.date || '', booking.startTime || '') ? 'border-l-4 border-l-accent' : ''}`}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 space-y-2 sm:space-y-0">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {booking.servicesList ? 
                        booking.servicesList.join(', ') + 
                        (booking.servicesCount > 1 ? ` (${booking.servicesCount} services)` : '') :
                        (booking.service?.name || 'Salon Service')
                      } #{booking.id.slice(-6)}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {booking.salon?.name || 'Salon Booking'}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(booking.groupStatus || booking.status || '')} flex-shrink-0 self-start`}>
                    {getStatusText(booking.groupStatus || booking.status || '')}
                  </Badge>
                </div>
                
                {/* Pending awaiting confirmation banner */}
                {(booking as any).status === "pending" && (
                  <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center gap-2 text-sm text-yellow-800">
                    <Clock className="h-4 w-4 flex-shrink-0 text-yellow-600" />
                    <span>Your booking request has been sent. Waiting for the salon to confirm your appointment.</span>
                  </div>
                )}

                {/* Owner suggested time banner */}
                {(booking as any).status === "owner_suggested" && (booking as any).suggestedDate && (
                  <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-orange-800 text-sm mb-1">Salon suggested a new time</p>
                        <div className="flex flex-wrap gap-3 text-sm text-orange-700 mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date((booking as any).suggestedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {(booking as any).suggestedTime}
                          </span>
                        </div>
                        {(booking as any).ownerNote && (
                          <p className="text-xs text-orange-600 italic mb-3">"{(booking as any).ownerNote}"</p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => respondSuggestionMutation.mutate({ bookingId: booking.id, action: "accept" })}
                            disabled={respondSuggestionMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => respondSuggestionMutation.mutate({ bookingId: booking.id, action: "decline" })}
                            disabled={respondSuggestionMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        Appointment: {new Date(booking.date).toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="text-xs text-gray-500">
                        Booked on: {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'Unknown'} {booking.createdAt ? 'at ' + new Date(booking.createdAt).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="font-medium">{booking.startTime} - {booking.endTime}</span>
                  </div>
                  {booking.staff?.name && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span>Staff: {booking.staff.name}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{booking.salon?.address || 'Salon Location'}</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                  <span className="font-semibold text-primary text-lg">₹{booking.totalGroupAmount || booking.totalAmount}</span>
                  <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                    {booking.status === "completed" ? (
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <Star className="h-4 w-4 mr-1" />
                        Rate & Review
                      </Button>
                    ) : (booking.status === "confirmed" || booking.status === "pending") ? (
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
