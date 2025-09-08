import { useParams, useLocation, Link, useLocation as useWouterLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Star, MapPin, Phone, Clock, Users, Calendar as CalendarIcon,
  Scissors, Heart, Share2, CheckCircle, IndianRupee, User, Camera, X, Eye,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { SiInstagram } from "react-icons/si";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Salon, Service, Staff, WorkingHours, TimeSlot, Review, SalonOffer } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { MoodRatingDisplay } from "@/components/MoodRatingSelector";
import { ReviewPhotoGallery } from "@/components/ReviewPhotoGallery";
import { ReviewForm } from "./review-form";
import { ReferralCodeInput } from "@/components/ReferralCodeInput";
import { CustomerSalonMap } from "@/components/CustomerSalonMap";
import { EmergencyBookingBanner } from "@/components/EmergencyBookingBanner";
import { ServiceSpecificOffers } from "@/components/ServiceSpecificOffers";
import { loadCashfreeSDK } from "@/lib/payment";

// Declare Cashfree types for window
declare global {
  interface Window {
    Cashfree: any;
  }
}

const bookingSchema = z.object({
  serviceId: z.string().min(1, "Please select a service"),
  staffId: z.string().optional(),
  date: z.date({
    required_error: "Please select a date",
  }),
  timeSlotId: z.string().min(1, "Please select a time slot"),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export default function SalonDetail() {
  const { salonId } = useParams<{ salonId: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    // Get current date in IST
    const now = new Date();
    return new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  });
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [appliedReferralCode, setAppliedReferralCode] = useState<any>(null);
  const [viewingMedia, setViewingMedia] = useState<any>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  // Check if this is a reschedule operation
  const searchParams = new URLSearchParams(window.location.search);
  const rescheduleBookingId = searchParams.get('reschedule');

  // Profile visit tracking mutation
  const trackVisitMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/salons/${salonId}/profile-visit`, {
        pageViewed: 'profile'
      });
    },
    onError: (error) => {
      // Silently ignore tracking errors - don't show to user
      console.log('Visit tracking error:', error);
    }
  });

  // Track profile visit when component mounts
  useEffect(() => {
    if (salonId && !trackVisitMutation.isSuccess) {
      trackVisitMutation.mutate();
    }
  }, [salonId]);



  // Fetch salon details with optimized settings
  const { data: salon, isLoading: salonLoading, error: salonError } = useQuery<Salon>({
    queryKey: [`/api/salons/${salonId}`],
    enabled: !!salonId,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Use cache first
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Fetch salon services - parallel loading
  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: [`/api/salons/${salonId}/services`],
    enabled: !!salonId,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });

  // Fetch salon staff with their assigned services - parallel loading
  const { data: staff = [], isLoading: staffLoading } = useQuery<Staff[]>({
    queryKey: [`/api/salons/${salonId}/staff`],
    enabled: !!salonId,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });

  // Fetch staff slot counts - optimized refresh
  const { data: staffSlotCounts = {} } = useQuery<Record<string, number>>({
    queryKey: [`/api/salons/${salonId}/public-staff-slot-counts`],
    enabled: !!salonId,
    refetchInterval: 60000, // Reduced to 60 seconds to improve performance
    staleTime: 30 * 1000, // 30 seconds cache
  });

  // Fetch salon reviews - parallel loading
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: [`/api/salons/${salonId}/reviews`],
    enabled: !!salonId,
    staleTime: 15 * 60 * 1000, // 15 minutes cache - reviews don't change often
  });

  // Fetch salon media gallery - parallel loading
  const { data: gallery = [], isLoading: galleryLoading } = useQuery<any[]>({
    queryKey: [`/api/salons/${salonId}/media`],
    enabled: !!salonId,
    staleTime: 30 * 60 * 1000, // 30 minutes cache - media doesn't change often
  });

  // Gallery navigation functions
  const openMediaViewer = (media: any, index: number) => {
    setViewingMedia(media);
    setCurrentMediaIndex(index);
  };

  const navigateToPrevious = () => {
    if (gallery && gallery.length > 0) {
      const newIndex = currentMediaIndex > 0 ? currentMediaIndex - 1 : gallery.length - 1;
      setCurrentMediaIndex(newIndex);
      setViewingMedia(gallery[newIndex]);
    }
  };

  const navigateToNext = () => {
    if (gallery && gallery.length > 0) {
      const newIndex = currentMediaIndex < gallery.length - 1 ? currentMediaIndex + 1 : 0;
      setCurrentMediaIndex(newIndex);
      setViewingMedia(gallery[newIndex]);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (viewingMedia) {
        if (e.key === 'ArrowLeft') {
          navigateToPrevious();
        } else if (e.key === 'ArrowRight') {
          navigateToNext();
        } else if (e.key === 'Escape') {
          setViewingMedia(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [viewingMedia, currentMediaIndex, gallery]);

  // Fetch working hours from staff schedule data - parallel loading
  const { data: workingHours = [], isLoading: hoursLoading } = useQuery<any[]>({
    queryKey: [`/api/salons/${salonId}/working-hours`],
    enabled: !!salonId,
    staleTime: 60 * 60 * 1000, // 1 hour cache - working hours rarely change
  });

  // Helper function to format working hours display for customer view
  const formatWorkingHoursForDisplay = () => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return dayNames.map((dayName, index) => {
      const daySchedule = workingHours.find(wh => wh.dayOfWeek === index);
      
      if (!daySchedule || !daySchedule.isOpen) {
        return {
          day: dayName,
          hours: 'Closed',
          isOpen: false
        };
      }
      
      const formatTime = (time: string) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
      };
      
      let hoursText = '';
      if (daySchedule.openTime && daySchedule.closeTime) {
        hoursText = `${formatTime(daySchedule.openTime)} - ${formatTime(daySchedule.closeTime)}`;
      }
      
      return {
        day: dayName,
        hours: hoursText || '9:00 AM - 8:00 PM', // fallback to default
        isOpen: true
      };
    });
  };

  // Fetch salon facilities - parallel loading
  const { data: facilities = [], isLoading: facilitiesLoading } = useQuery({
    queryKey: [`/api/salons/${salonId}/facilities`],
    enabled: !!salonId,
    staleTime: 30 * 60 * 1000, // 30 minutes cache - facilities don't change often
  });

  // Fetch salon products - parallel loading
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: [`/api/salons/${salonId}/products`],
    enabled: !!salonId,
    staleTime: 30 * 60 * 1000, // 30 minutes cache - products don't change often
  });

  // Fetch salon offers - parallel loading
  const { data: offers = [], isLoading: offersLoading } = useQuery({
    queryKey: [`/api/salons/${salonId}/offers`],
    enabled: !!salonId,
    staleTime: 10 * 60 * 1000, // 10 minutes cache - offers change more frequently
  });

  // Fetch available time slots for selected date and staff (ignore service filter since slots are service-agnostic)
  const { data: timeSlots = [], isLoading: timeSlotsLoading } = useQuery({
    queryKey: [`/api/salons/${salonId}/time-slots`, selectedDate?.toISOString().split('T')[0], selectedStaff],
    enabled: !!salonId && !!selectedDate,
    queryFn: async (): Promise<TimeSlot[]> => {
      if (!selectedDate) return [];
      const dateStr = selectedDate.toISOString().split('T')[0];
      let url = `/api/salons/${salonId}/time-slots?date=${dateStr}`;
      if (selectedStaff) {
        url += `&staffId=${selectedStaff}`;
      }
      const response = await apiRequest("GET", url);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch salon like status for authenticated customers - optimized
  const { data: likeStatus } = useQuery({
    queryKey: [`/api/salons/${salonId}/like-status`],
    enabled: !!salonId && !!isAuthenticated && user?.userType === 'customer',
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/salons/${salonId}/like-status`);
      return await response.json();
    },
    retry: false,
    staleTime: 2 * 60 * 1000, // 2 minutes cache - like status can change
  });

  // Update local state when like status is fetched
  useEffect(() => {
    if (likeStatus) {
      setIsLiked(likeStatus.isLiked || false);
      setLikesCount(likeStatus.likesCount || 0);
    }
  }, [likeStatus]);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      serviceId: "",
      staffId: "",
      date: new Date(),
      timeSlotId: "",
    },
  });

  // Pay at Salon mutation
  const payAtSalonMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      if (!isAuthenticated) {
        throw new Error("Please log in to book an appointment");
      }

      const response = await apiRequest("POST", "/api/bookings/create-pay-at-salon", {
        salonId,
        serviceId: data.serviceId,
        staffId: data.staffId || null,
        timeSlotId: data.timeSlotId,
        date: data.date.toISOString().split('T')[0],
        notes: "Pay at salon booking"
      });
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Confirmed!",
        description: "Your appointment is booked! Please pay the full service amount when you visit the salon.",
      });
      
      setBookingDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salonId}/time-slots`] });
    },
    onError: (error) => {
      console.error("Pay at salon booking failed:", error);
      toast({
        title: "Booking Failed",
        description: "Unable to create booking. Please try again or contact the salon directly.",
        variant: "destructive",
      });
    }
  });

  // Handler for Pay at Salon button
  const handlePayAtSalon = (data: BookingFormData) => {
    payAtSalonMutation.mutate(data);
  };

  // Alternative "Pay at Salon" booking when online payment fails
  const handlePayAtSalonBooking = async () => {
    try {
      const formData = form.getValues();
      const response = await apiRequest("POST", "/api/bookings/create-pay-at-salon", {
        salonId,
        serviceId: formData.serviceId,
        staffId: formData.staffId || null,
        timeSlotId: formData.timeSlotId,
        date: formData.date.toISOString().split('T')[0],
        notes: "Pay at salon - Online payment failed due to security checks"
      });
      
      const booking = await response.json();
      
      toast({
        title: "Booking Confirmed!",
        description: "Your appointment is booked! Please pay the full service amount when you visit the salon.",
      });
      
      setBookingDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salonId}/time-slots`] });
    } catch (error) {
      console.error("Pay at salon booking failed:", error);
      toast({
        title: "Booking Failed",
        description: "Unable to create booking. Please try again or contact the salon directly.",
        variant: "destructive",
      });
    }
  };

  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      if (!isAuthenticated) {
        throw new Error("Please log in to book an appointment");
      }

      // Step 1: Create payment order (with referral code support)
      const orderResponse = await apiRequest("POST", "/api/bookings/create-payment-order", {
        salonId,
        serviceId: data.serviceId,
        staffId: data.staffId || null,
        timeSlotId: data.timeSlotId,
        date: data.date.toISOString().split('T')[0],
        referralCode: appliedReferralCode?.code || null,
      });

      const orderData = await orderResponse.json();
      console.log("Order data received:", orderData);
      
      // Remove payment adjustment notification
      
      // Handle free bookings (when referral code covers full amount OR user has free credits)
      if (orderData.isFreeBooking || orderData.freeBooking) {
        let endpoint = "/api/bookings/create-free";
        let payload: any = {
          salonId,
          serviceId: data.serviceId,
          staffId: data.staffId || null,
          timeSlotId: data.timeSlotId,
          date: data.date.toISOString().split('T')[0],
        };

        // Handle referral code free booking
        if (orderData.isFreeBooking && orderData.referralCodeData) {
          payload.referralCodeData = orderData.referralCodeData;
        }
        
        // Handle free credit booking
        if (orderData.freeBooking && orderData.creditUsed) {
          endpoint = "/api/bookings/complete-free-credit";
          payload = {
            bookingData: orderData.bookingData,
            creditUsed: orderData.creditUsed,
          };
        }
        
        const freeBookingResponse = await apiRequest("POST", endpoint, payload);
        const freeBookingData = await freeBookingResponse.json();
        
        if (!freeBookingResponse.ok) {
          throw new Error(freeBookingData.message || "Failed to create free booking");
        }
        
        return freeBookingData;
      }
      
      // Step 2: Initialize Cashfree payment
      return new Promise(async (resolve, reject) => {
        try {
          // Load Cashfree SDK if not already loaded
          if (!window.Cashfree) {
            await loadCashfreeSDK();
          }
          
          const cashfree = window.Cashfree({
            mode: process.env.NODE_ENV === 'production' ? 'production' : 'production' // Always use production for production keys
          });

          const checkoutOptions = {
            paymentSessionId: orderData.paymentSessionId,
            redirectTarget: '_self', // Use _self for better mobile compatibility
            theme: {
              color: '#8B5CF6',
              backgroundColor: '#ffffff'
            }
          };

          // Open Cashfree checkout - this will redirect to payment callback
          const result = await cashfree.checkout(checkoutOptions);
          
          if (result.error) {
            console.error('Cashfree payment error:', result.error);
            reject(new Error(result.error.message || 'Payment failed'));
            return;
          }
          
          // For redirect mode, we don't get result.paymentDetails
          // The payment callback page will handle verification
          console.log('Payment initiated, redirecting to payment gateway...');
          resolve({ redirected: true });
        } catch (error) {
          console.error('Cashfree payment initialization failed:', error);
          reject(new Error(error instanceof Error ? error.message : 'Payment initialization failed'));
        }
      });
    },
    onSuccess: (result) => {
      const isFreebook = result?.referralCodeUsed;
      toast({
        title: isFreebook ? "Free Booking Confirmed!" : "Booking Confirmed!",
        description: isFreebook 
          ? `Your appointment has been booked for free using referral code ${result.referralCodeUsed}!`
          : "Your appointment has been successfully booked and payment received. You'll receive a confirmation shortly.",
      });
      setBookingDialogOpen(false);
      setAppliedReferralCode(null); // Reset referral code
      form.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salonId}/time-slots`] });
    },
    onError: (error: Error) => {
      console.error("Booking mutation error:", error);
      
      // Provide more specific error messages based on error content
      let title = "Booking Failed";
      let description = error.message;
      
      if (error.message.includes('risk_check_failed') || error.message.includes('payment_risk_check_failed')) {
        title = "Payment Security Check";
        description = "Payment was flagged by security checks. You can still book by paying at the salon.";
        
        // Show "Pay at Salon" option as a fallback
        setTimeout(() => {
          if (confirm("Would you like to book this appointment and pay at the salon instead?")) {
            handlePayAtSalonBooking();
          }
        }, 1500);
        
      } else if (error.message.includes('timeout') || error.message.includes('taking too long')) {
        title = "Payment Timeout";
        description = "The payment is taking longer than expected. Please check your internet connection and try again.";
      } else if (error.message.includes('cancelled')) {
        title = "Payment Cancelled";
        description = "Payment was cancelled. No charges were made.";
      } else if (error.message.includes('slot')) {
        title = "Time Slot Unavailable";
        description = error.message;
      } else if (error.message.includes('not available')) {
        title = "Payment System Issue";
        description = "Payment system is temporarily unavailable. Please refresh the page and try again.";
      } else if (error.message.includes('BAD_REQUEST_ERROR')) {
        title = "Payment Processing Error";
        description = "There was an issue processing your payment. Please try a different payment method or contact support.";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    },
  });

  // Like toggle mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/salons/${salonId}/like`);
      return await response.json();
    },
    onSuccess: (data) => {
      setIsLiked(data.isLiked);
      setLikesCount(data.likesCount);
      toast({
        title: data.isLiked ? "Salon Saved!" : "Salon Removed",
        description: data.message,
      });
      // Invalidate the like status query to refresh
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salonId}/like-status`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Share functionality
  const handleShare = async () => {
    try {
      const response = await apiRequest("GET", `/api/salons/${salonId}/share`);
      const data = await response.json();
      
      if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
        // Use native share API on mobile
        await navigator.share({
          title: data.salonName,
          text: data.message,
          url: data.shareableLink,
        });
      } else {
        // Copy to clipboard on desktop
        await navigator.clipboard.writeText(data.shareableLink);
        toast({
          title: "Link Copied!",
          description: "Salon link copied to clipboard. Share it with friends!",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast({
        title: "Share Failed",
        description: "Could not share salon link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLikeToggle = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to save salons to your favorites.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    if (user?.userType !== 'customer') {
      toast({
        title: "Customer Account Required",
        description: "Only customers can save salons.",
        variant: "destructive",
      });
      return;
    }
    
    likeMutation.mutate();
  };

  const onSubmit = (data: BookingFormData) => {
    bookingMutation.mutate(data);
  };

  if (salonLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-8">
          <div className="animate-pulse space-y-3 sm:space-y-4">
            <div className="h-6 sm:h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="h-48 sm:h-64 bg-gray-300 rounded"></div>
            <div className="h-4 sm:h-6 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 sm:h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Scissors className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Salon Not Found</h2>
          <p className="text-gray-600 mb-6">This salon may not exist or has been removed.</p>
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const selectedServiceData = services.find(s => s.id === selectedService);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => navigate("/")} className="flex items-center w-fit">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Salons
            </Button>
            <div className="flex items-center gap-2 sm:space-x-2">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 sm:flex-none" 
                onClick={handleLikeToggle}
                disabled={likeMutation.isPending}
              >
                <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                {isLiked ? 'Saved' : 'Save'}
                {likesCount > 0 && (
                  <span className="ml-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
                    {likesCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Salon Header */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                  <div className="w-full md:w-48 h-48 bg-gray-200 rounded-lg overflow-hidden">
                    {salon.imageUrl ? (
                      <img
                        src={salon.imageUrl}
                        alt={salon.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Scissors className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
                      <div className="flex-1 min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 truncate">{salon.name}</h1>
                        <div className="flex items-center mb-2">
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          <span className="ml-1 text-lg font-medium">
                            {salon.averageRating ? Number(salon.averageRating).toFixed(1) : "New"}
                          </span>
                          <span className="ml-1 text-gray-500">
                            ({salon.totalReviews || 0} reviews)
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600 mb-4">
                          <MapPin className="h-4 w-4 mr-2" />
                          {salon.address}
                        </div>
                        {/* Location Map */}
                        {salon.latitude && salon.longitude && (
                          <div className="mt-4">
                            <CustomerSalonMap
                              shopLat={Number(salon.latitude)}
                              shopLng={Number(salon.longitude)}
                              shopName={salon.name}
                              shopAddress={salon.address}
                            />
                          </div>
                        )}
                      </div>
                      {salon.isPremium && (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white flex-shrink-0">
                          Premium
                        </Badge>
                      )}
                    </div>
                    
                    {salon.description && (
                      <p className="text-gray-700 mb-4">{salon.description}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Scissors className="h-5 w-5 mr-2" />
                  Services & Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                {servicesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : services.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {services.map((service) => (
                      <div key={service.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 space-y-2 sm:space-y-0">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{service.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{service.description}</p>
                          <div className="flex items-center mt-1 text-xs sm:text-sm text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {service.duration} mins
                          </div>
                        </div>
                        <div className="text-left sm:text-right flex-shrink-0">
                          <div className="text-lg font-semibold text-green-600">
                            ₹{service.price}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No services available</p>
                )}
              </CardContent>
            </Card>

            {/* Our Team */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Our Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                {staffLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="border rounded-lg p-4 animate-pulse">
                        <div className="flex items-start space-x-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-5 bg-gray-200 rounded w-32"></div>
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                            <div className="h-3 bg-gray-200 rounded w-20"></div>
                            <div className="h-3 bg-gray-200 rounded w-40"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : staff.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {staff.map((member) => (
                      <div key={member.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-4">
                          <Avatar className="h-16 w-16 flex-shrink-0">
                            <AvatarImage src={member.photoUrl || ""} alt={member.name} className="object-cover" />
                            <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-lg">{member.name}</h4>
                            
                            {/* Assigned Services as subtitle */}
                            {(member as any).services && (member as any).services.length > 0 ? (
                              <p className="text-blue-600 text-sm mb-1">
                                {(member as any).services.map((service: any) => service.serviceName).join(', ')}
                              </p>
                            ) : member.specialties && member.specialties.length > 0 ? (
                              <p className="text-blue-600 text-sm mb-1">
                                {member.specialties.join(', ')}
                              </p>
                            ) : (
                              <p className="text-blue-600 font-medium text-sm mb-1">{member.role}</p>
                            )}
                            
                            {/* Experience below services */}
                            {member.experience && member.experience.trim() !== '' && (
                              <p className="text-gray-600 text-sm mb-2">
                                {member.experience}
                              </p>
                            )}
                            
                            {/* Rating */}
                            <div className="flex items-center">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                              <span className="text-sm font-medium text-gray-700">
                                {member.rating ? Number(member.rating).toFixed(1) : "0.0"}
                              </span>
                              {member.totalReviews && member.totalReviews > 0 && (
                                <span className="text-xs text-gray-500 ml-1">
                                  ({member.totalReviews})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg font-medium">Our Team Information Coming Soon</p>
                    <p className="text-gray-500 text-sm mt-2">We're updating our staff profiles to show you detailed information about our talented team.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gallery */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Gallery
                </CardTitle>
              </CardHeader>
              <CardContent>
                {galleryLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : gallery.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {gallery.map((media, index) => (
                      <div 
                        key={media.id} 
                        className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => openMediaViewer(media, index)}
                        data-testid={`media-item-${media.id}`}
                      >
                        {media.fileType === "video" ? (
                          <video 
                            src={media.fileUrl} 
                            className="w-full h-full object-cover"
                            controls={false}
                            preload="metadata"
                            onMouseEnter={(e) => e.currentTarget.play()}
                            onMouseLeave={(e) => e.currentTarget.pause()}
                            data-testid={`video-media-${media.id}`}
                          />
                        ) : (
                          <img 
                            src={media.fileUrl} 
                            alt={media.title || media.fileName || "Gallery image"} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            data-testid={`img-media-${media.id}`}
                          />
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="h-8 w-8 text-white" />
                          </div>
                        </div>
                        {media.isPrimary && (
                          <div className="absolute top-2 right-2">
                            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">Primary</span>
                          </div>
                        )}
                        {(media.title || media.category) && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                            {media.title && <p className="text-white text-sm font-medium">{media.title}</p>}
                            {media.category && <p className="text-white text-xs capitalize">{media.category}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Images Yet</h3>
                    <p className="text-gray-600">
                      This salon hasn't uploaded any images of their work yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Customer Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviewsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.slice(0, 5).map((review) => (
                      <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            {/* Show mood rating if available */}
                            {review.moodRating && (
                              <MoodRatingDisplay mood={review.moodRating} size="sm" />
                            )}
                            {/* Traditional star rating */}
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="font-medium">Customer Review</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "Recently"}
                          </span>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                        {/* Display review photos */}
                        {review.photos && review.photos.length > 0 && (
                          <ReviewPhotoGallery 
                            photos={review.photos}
                            reviewId={review.id}
                            className="mt-3"
                          />
                        )}
                      </div>
                    ))}
                    
                    {/* Add Review Button for logged in customers */}
                    {isAuthenticated && user?.userType === 'customer' && (
                      <div className="pt-4 border-t border-gray-200">
                        <ReviewForm salonId={salonId!} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No reviews yet. Be the first to review!</p>
                    {isAuthenticated && user?.userType === 'customer' && (
                      <ReviewForm salonId={salonId!} />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Booking Card */}
            <Card className="lg:sticky lg:top-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Book Appointment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                {!isAuthenticated ? (
                  <div className="text-center py-4 sm:py-6">
                    <p className="text-gray-600 mb-4 text-sm sm:text-base">Please log in to book an appointment</p>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => navigate("/auth")}
                      data-testid="button-login-to-book"
                    >
                      Log In to Book
                    </Button>
                  </div>
                ) : (
                  <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Book Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {rescheduleBookingId ? "Reschedule Your Appointment" : "Book Your Appointment"}
                        </DialogTitle>
                        <DialogDescription>
                          {rescheduleBookingId 
                            ? `Select new service, date and time for your appointment at ${salon.name}` 
                            : `Choose your service, date and time to book an appointment at ${salon.name}`}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="serviceId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Select Service</FormLabel>
                                <Select 
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    setSelectedService(value);
                                    if (!value) {
                                      setSelectedStaff(""); // Reset staff when no service selected
                                    }
                                  }} 
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choose a service" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {services.map((service) => (
                                      <SelectItem key={service.id} value={service.id}>
                                        <div className="flex justify-between items-center w-full">
                                          <span>{service.name}</span>
                                          <span className="text-green-600 font-semibold ml-2">₹{service.price}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {selectedService && (
                                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                                    <strong>Price: ₹{selectedServiceData?.price || 0}</strong>
                                  </div>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="staffId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Select Staff Member</FormLabel>
                                <Select 
                                  onValueChange={(value) => {
                                    const staffValue = value === "any" ? "" : value;
                                    field.onChange(staffValue);
                                    setSelectedStaff(staffValue);
                                  }} 
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choose staff member" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="any">Any available staff</SelectItem>
                                    {staff
                                      .filter(member => member.isActive)
                                      .map((member) => (
                                      <SelectItem key={member.id} value={member.id}>
                                        <div className="flex items-center justify-between w-full">
                                          <span>{member.name} - {member.role}</span>
                                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full ml-2">
                                            {staffSlotCounts[member.id] || 0} slots
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Select Date</FormLabel>
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(date) => {
                                    field.onChange(date);
                                    setSelectedDate(date);
                                  }}
                                  disabled={(date) => {
                                    // Compare with current IST date
                                    const now = new Date();
                                    const istDate = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
                                    istDate.setHours(0, 0, 0, 0); // Start of day in IST
                                    return date < istDate || date.getDay() === 0;
                                  }}
                                  className="rounded-md border w-full"
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {selectedService && selectedDate && (
                            <FormField
                              control={form.control}
                              name="timeSlotId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Available Time Slots</FormLabel>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {timeSlotsLoading ? (
                                      <>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                          <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                                        ))}
                                      </>
                                    ) : timeSlots && timeSlots.length > 0 ? (
                                      // Filter and show only available slots with enhanced styling
                                      timeSlots
                                        .filter((slot: TimeSlot) => slot.isAvailable)
                                        .map((slot: TimeSlot) => (
                                          <div
                                            key={slot.id}
                                            onClick={() => field.onChange(slot.id)}
                                            className={`
                                              relative border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-md
                                              ${field.value === slot.id 
                                                ? 'border-primary bg-primary/5 shadow-sm' 
                                                : 'border-gray-200 bg-white hover:border-primary/50'
                                              }
                                            `}
                                          >
                                            <div className="text-center">
                                              <div className="text-sm font-medium text-gray-900 mb-1">
                                                {slot.startTime} - {slot.endTime}
                                              </div>
                                              <div className={`text-xs px-2 py-1 rounded-full inline-flex items-center
                                                ${field.value === slot.id 
                                                  ? 'bg-primary text-white' 
                                                  : 'bg-green-100 text-green-700'
                                                }
                                              `}>
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Available
                                              </div>
                                            </div>
                                            {field.value === slot.id && (
                                              <div className="absolute top-2 right-2">
                                                <CheckCircle className="h-4 w-4 text-primary" />
                                              </div>
                                            )}
                                          </div>
                                        ))
                                    ) : (
                                      <div className="col-span-1 sm:col-span-2 lg:col-span-4 text-center py-8">
                                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-lg font-medium text-gray-600 mb-2">
                                          No time slots available
                                        </p>
                                        <p className="text-sm text-gray-500">
                                          Please select a different date or contact the salon
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          {/* Emergency Booking Banner */}
                          {selectedService && selectedDate && (
                            <EmergencyBookingBanner
                              salon={salon}
                              service={services.find(s => s.id === selectedService)}
                              selectedDate={selectedDate.toISOString().split('T')[0]}
                              hasAvailableSlots={timeSlots?.some((slot: TimeSlot) => slot.isAvailable) || false}
                            />
                          )}

                          {/* Referral Code Input */}
                          <ReferralCodeInput
                            onCodeApplied={setAppliedReferralCode}
                            onCodeRemoved={() => setAppliedReferralCode(null)}
                            appliedCode={appliedReferralCode}
                            disabled={bookingMutation.isPending}
                          />

                          {selectedServiceData && (
                            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                              <h4 className="font-semibold mb-2 text-sm sm:text-base">Booking Summary</h4>
                              <div className="space-y-1 text-xs sm:text-sm">
                                <div className="flex justify-between">
                                  <span>Service:</span>
                                  <span className="truncate ml-2">{selectedServiceData.name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Duration:</span>
                                  <span>{selectedServiceData.duration} mins</span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                  <span>Price:</span>
                                  <span>₹{selectedServiceData.price}</span>
                                </div>
                                {appliedReferralCode && (
                                  <>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between text-green-600">
                                      <span>Referral Discount:</span>
                                      <span>
                                        {appliedReferralCode.discountType === 'free' 
                                          ? 'FREE BOOKING' 
                                          : appliedReferralCode.discountType === 'percentage'
                                          ? `${appliedReferralCode.discountValue}% OFF`
                                          : `₹${appliedReferralCode.discountValue} OFF`
                                        }
                                      </span>
                                    </div>
                                    <div className="flex justify-between font-semibold">
                                      <span>Final Amount:</span>
                                      <span>
                                        {appliedReferralCode.discountType === 'free' 
                                          ? '₹0 (FREE)' 
                                          : '₹10 (Confirmation)'
                                        }
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={bookingMutation.isPending}
                          >
                            {bookingMutation.isPending 
                              ? (
                                  <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    Processing...
                                  </span>
                                )
                              : appliedReferralCode?.discountType === 'free'
                              ? "Book for FREE!"
                              : (rescheduleBookingId ? "Reschedule Booking" : "Pay Confirmation Fee")}
                          </Button>
                          
                          {bookingMutation.isPending && (
                            <div className="text-xs text-gray-500 text-center mt-2">
                              Please wait while we process your payment. This may take up to 2 minutes.
                            </div>
                          )}
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-3 text-gray-400" />
                  <span>{salon.phone || "Contact via booking"}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-3 text-gray-400" />
                  <span className="text-sm">{salon.address}</span>
                </div>
                {salon.instagramId && (
                  <div className="flex items-center">
                    <SiInstagram className="h-4 w-4 mr-3 text-gray-400" />
                    <a 
                      href={`https://www.instagram.com/${salon.instagramId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 transition-colors text-sm flex items-center"
                      data-testid="link-instagram"
                    >
                      @{salon.instagramId}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Working Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Working Hours</CardTitle>
              </CardHeader>
              <CardContent>
                {hoursLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : workingHours.length > 0 ? (
                  <div className="space-y-2 text-sm">
                    {formatWorkingHoursForDisplay().map((dayInfo, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{dayInfo.day}</span>
                        <span className={dayInfo.isOpen ? 'text-gray-600' : 'text-red-500'}>
                          {dayInfo.hours}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Hours not specified</p>
                )}
              </CardContent>
            </Card>

            {/* Facilities */}
            {Array.isArray(facilities) && facilities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="mr-2">🏢</span>
                    Facilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {facilities.map((facility: any) => (
                      <div
                        key={facility.id}
                        className={`flex items-center p-3 rounded-lg border ${
                          facility.isAvailable
                            ? "bg-green-50 border-green-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{facility.icon || "🔧"}</span>
                            <span className="font-medium">{facility.name}</span>
                          </div>
                          {facility.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {facility.description}
                            </p>
                          )}
                        </div>
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            facility.isAvailable
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {facility.isAvailable ? "Available" : "Unavailable"}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Products */}
            {Array.isArray(products) && products.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="mr-2">🛍️</span>
                    Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product: any) => (
                      <div
                        key={product.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-32 object-cover rounded-md mb-3"
                          />
                        )}
                        <div className="space-y-2">
                          <h4 className="font-semibold">{product.name}</h4>
                          {product.brand && (
                            <p className="text-sm text-gray-600">Brand: {product.brand}</p>
                          )}
                          {product.category && (
                            <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block">
                              {product.category}
                            </p>
                          )}
                          {product.description && (
                            <p className="text-sm text-gray-700">{product.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            {product.price && (
                              <span className="font-bold text-primary">₹{product.price}</span>
                            )}
                            <div
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                product.inStock
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {product.inStock ? "In Stock" : "Out of Stock"}
                            </div>
                          </div>
                          {product.stockQuantity > 0 && (
                            <p className="text-xs text-gray-500">
                              {product.stockQuantity} units available
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Service-Specific Offers Section - New Enhanced Display */}
            {Array.isArray(offers) && offers.length > 0 && (
              <ServiceSpecificOffers offers={offers} services={services} />
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Media Viewer Modal with Navigation */}
      <Dialog open={!!viewingMedia} onOpenChange={() => setViewingMedia(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {viewingMedia?.title || viewingMedia?.fileName || "Salon Media Viewer"}
            </DialogTitle>
            <DialogDescription>
              View {viewingMedia?.fileType === "video" ? "video" : "image"} from salon gallery
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            {/* Close button */}
            <button
              onClick={() => setViewingMedia(null)}
              className="absolute top-4 right-4 z-50 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors"
              data-testid="button-close-viewer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Previous navigation button */}
            {gallery.length > 1 && (
              <button
                onClick={navigateToPrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 bg-black bg-opacity-50 text-white rounded-full p-3 hover:bg-opacity-70 transition-colors"
                data-testid="button-prev-image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Next navigation button */}
            {gallery.length > 1 && (
              <button
                onClick={navigateToNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 bg-black bg-opacity-50 text-white rounded-full p-3 hover:bg-opacity-70 transition-colors"
                data-testid="button-next-image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
            
            {viewingMedia && (
              <div className="relative">
                {viewingMedia.fileType === "video" ? (
                  <video
                    src={viewingMedia.fileUrl}
                    className="w-full h-auto max-h-[80vh] object-contain"
                    controls
                    autoPlay
                    data-testid={`video-viewer-${viewingMedia.id}`}
                  />
                ) : (
                  <img
                    src={viewingMedia.fileUrl}
                    alt={viewingMedia.title || "Salon media"}
                    className="w-full h-auto max-h-[80vh] object-contain"
                    data-testid={`img-viewer-${viewingMedia.id}`}
                  />
                )}
                
                {/* Media info overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                  <div className="text-white">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold" data-testid="text-viewer-title">
                          {viewingMedia.title || viewingMedia.fileName || "Salon Image"}
                        </h3>
                        {viewingMedia.category && (
                          <p className="text-sm opacity-80 capitalize" data-testid="text-viewer-category">
                            {viewingMedia.category.replace("_", " ")}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-sm opacity-80 mt-2">
                          <span>{viewingMedia.fileType === "video" ? "Video" : "Photo"}</span>
                          {viewingMedia.fileSize && (
                            <span>{(viewingMedia.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                          )}
                          {viewingMedia.isPrimary && (
                            <span className="bg-yellow-500 px-2 py-1 rounded text-xs">Primary</span>
                          )}
                        </div>
                      </div>
                      {/* Image counter */}
                      {gallery.length > 1 && (
                        <div className="text-sm opacity-80 bg-black bg-opacity-30 px-3 py-1 rounded">
                          {currentMediaIndex + 1} / {gallery.length}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
