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
  ArrowLeft, Star, MapPin, Phone, Mail, Clock, Users, Calendar as CalendarIcon,
  Scissors, Heart, Share2, CheckCircle, IndianRupee, User, Camera, X, Eye,
  ChevronLeft, ChevronRight, Video, HelpCircle, ChevronDown, ChevronUp, Crown, Building2, MessageSquare, Edit, Trash2, Navigation
} from "lucide-react";
import { SiInstagram } from "react-icons/si";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Salon, Service, Staff, WorkingHours, TimeSlot, Review, ReviewWithReplies, ReviewReply, SalonOffer } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MoodRatingDisplay } from "@/components/MoodRatingSelector";
import { ReviewPhotoGallery } from "@/components/ReviewPhotoGallery";
import { ReviewForm } from "./review-form";
import { ReplyForm } from "@/components/ReplyForm";
import { ReferralCodeInput } from "@/components/ReferralCodeInput";
import { CustomerSalonMap } from "@/components/CustomerSalonMap";
import { EmergencyBookingBanner } from "@/components/EmergencyBookingBanner";
import { ServiceSpecificOffers } from "@/components/ServiceSpecificOffers";

const bookingSchema = z.object({
  serviceIds: z.array(z.string()).min(1, "Please select at least one service"),
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
  const [selectedStaffBio, setSelectedStaffBio] = useState<Staff | null>(null);
  const [expandedFaqs, setExpandedFaqs] = useState<Set<string>>(new Set());
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  
  // Ref to track if we've already processed the pending booking
  const hasProcessedPendingBooking = useRef(false);
  
  // State for next slot countdown timer
  const [nextSlotCountdown, setNextSlotCountdown] = useState<{
    minutes: number;
    seconds: number;
    slotTime: string;
  } | null>(null);
  
  // Toggle FAQ expansion
  const toggleFaqExpansion = (faqId: string) => {
    setExpandedFaqs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(faqId)) {
        newSet.delete(faqId);
      } else {
        newSet.add(faqId);
      }
      return newSet;
    });
  };
  
  // Check if this is a reschedule operation
  const searchParams = new URLSearchParams(window.location.search);
  const rescheduleBookingId = searchParams.get('reschedule');

  // Track video error state
  const [videoError, setVideoError] = useState(false);

  // Fetch salon details with optimized settings
  const { data: salon, isLoading: salonLoading, error: salonError } = useQuery<Salon>({
    queryKey: [`/api/salons/${salonId}`],
    enabled: !!salonId,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Use cache first
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Get actual UUID from salon data (important for slug URLs)
  const resolvedSalonId = salon?.id || salonId;

  // Profile visit tracking mutation
  const trackVisitMutation = useMutation({
    mutationFn: async () => {
      if (!salon?.id) return;
      return await apiRequest("POST", `/api/salons/${salon.id}/profile-visit`, {
        pageViewed: 'profile'
      });
    },
    onError: (error) => {
      // Silently ignore tracking errors - don't show to user
      console.log('Visit tracking error:', error);
    }
  });

  // Track profile visit when salon data is loaded
  useEffect(() => {
    if (salon?.id && !trackVisitMutation.isSuccess) {
      trackVisitMutation.mutate();
    }
  }, [salon?.id]);

  // Always scroll to top when component mounts to ensure page starts from Experience Our Salon section
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [salonId]);

  // Type for category with services
  type CategoryWithServices = {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    services: Service[];
  };

  // Fetch salon services organized by categories - parallel loading
  const { data: servicesByCategory = [], isLoading: servicesLoading } = useQuery<CategoryWithServices[]>({
    queryKey: [`/api/salons/${resolvedSalonId}/services-by-category`],
    enabled: !!resolvedSalonId && !!salon,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });

  // Flatten services for compatibility with existing booking logic
  const services = servicesByCategory.flatMap(category => category.services || []);

  // Fetch salon staff with their assigned services - parallel loading
  const { data: staff = [], isLoading: staffLoading } = useQuery<Staff[]>({
    queryKey: [`/api/salons/${resolvedSalonId}/staff`],
    enabled: !!resolvedSalonId && !!salon,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });

  // Fetch staff slot counts - optimized refresh
  const { data: staffSlotCounts = {} } = useQuery<Record<string, number>>({
    queryKey: [`/api/salons/${resolvedSalonId}/public-staff-slot-counts`],
    enabled: !!resolvedSalonId && !!salon,
    refetchInterval: 60000, // Reduced to 60 seconds to improve performance
    staleTime: 30 * 1000, // 30 seconds cache
  });

  // Fetch salon reviews with replies - parallel loading
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<ReviewWithReplies[]>({
    queryKey: [`/api/salons/${resolvedSalonId}/reviews`],
    enabled: !!resolvedSalonId && !!salon,
    staleTime: 15 * 60 * 1000, // 15 minutes cache - reviews don't change often
  });

  // Fetch salon media gallery - parallel loading
  const { data: gallery = [], isLoading: galleryLoading } = useQuery<any[]>({
    queryKey: [`/api/salons/${resolvedSalonId}/media`],
    enabled: !!resolvedSalonId && !!salon,
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
    queryKey: [`/api/salons/${resolvedSalonId}/working-hours`],
    enabled: !!resolvedSalonId && !!salon,
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
    queryKey: [`/api/salons/${resolvedSalonId}/facilities`],
    enabled: !!resolvedSalonId && !!salon,
    staleTime: 30 * 60 * 1000, // 30 minutes cache - facilities don't change often
  });

  // Fetch salon products - parallel loading
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: [`/api/salons/${resolvedSalonId}/products`],
    enabled: !!resolvedSalonId && !!salon,
    staleTime: 30 * 60 * 1000, // 30 minutes cache - products don't change often
  });

  // Fetch salon offers - parallel loading
  const { data: offers = [], isLoading: offersLoading } = useQuery({
    queryKey: [`/api/salons/${resolvedSalonId}/offers`],
    enabled: !!resolvedSalonId && !!salon,
    staleTime: 10 * 60 * 1000, // 10 minutes cache - offers change more frequently
  });

  // Fetch salon FAQs for customers - parallel loading
  const { data: faqs = [], isLoading: faqsLoading } = useQuery({
    queryKey: [`/api/salons/${resolvedSalonId}/faqs`],
    enabled: !!resolvedSalonId && !!salon,
    staleTime: 15 * 60 * 1000, // 15 minutes cache - FAQs don't change often
  });

  // Fetch available time slots for selected date and staff (ignore service filter since slots are service-agnostic)
  const { data: timeSlots = [], isLoading: timeSlotsLoading } = useQuery({
    queryKey: [`/api/salons/${resolvedSalonId}/time-slots`, selectedDate?.toISOString().split('T')[0], selectedStaff],
    enabled: !!resolvedSalonId && !!salon && !!selectedDate,
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
    queryKey: [`/api/salons/${resolvedSalonId}/like-status`],
    enabled: !!resolvedSalonId && !!salon && !!isAuthenticated && user?.userType === 'customer',
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
      serviceIds: [],
      staffId: "",
      date: new Date(),
      timeSlotId: "",
    },
  });

  // Pay at Salon mutation for multiple services
  const payAtSalonMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      if (!isAuthenticated) {
        throw new Error("Please log in to book an appointment");
      }

      // Send all services in a single API call
      const primaryServiceId = data.serviceIds[0];
      const additionalServices = data.serviceIds.length > 1 ? data.serviceIds.slice(1) : undefined;
      
      const response = await apiRequest("POST", "/api/bookings/create-pay-at-salon", {
        salonId,
        serviceId: primaryServiceId,
        additionalServices: additionalServices,
        staffId: data.staffId || null,
        timeSlotId: data.timeSlotId,
        date: data.date.toISOString().split('T')[0],
        notes: `Pay at salon booking - ${data.serviceIds.length} service${data.serviceIds.length > 1 ? 's' : ''} selected`
      });
      
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Booking Confirmed!",
        description: "Your appointment is booked! Please pay the full service amount when you visit the salon.",
      });
      
      setBookingDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${resolvedSalonId}/time-slots`] });
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
      
      // Send all services in a single API call
      const primaryServiceId = formData.serviceIds[0];
      const additionalServices = formData.serviceIds.length > 1 ? formData.serviceIds.slice(1) : undefined;
      
      const response = await apiRequest("POST", "/api/bookings/create-pay-at-salon", {
        salonId,
        serviceId: primaryServiceId,
        additionalServices: additionalServices,
        staffId: formData.staffId || null,
        timeSlotId: formData.timeSlotId,
        date: formData.date.toISOString().split('T')[0],
        notes: `Pay at salon - Online payment failed (${formData.serviceIds.length} service${formData.serviceIds.length > 1 ? 's' : ''} selected)`
      });
      
      const result = await response.json();
      
      toast({
        title: "Booking Confirmed!",
        description: "Your appointment is booked! Please pay the full service amount when you visit the salon.",
      });
      
      setBookingDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${resolvedSalonId}/time-slots`] });
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
      console.log('[BOOKING] Mutation started');
      console.log('[BOOKING] Is authenticated:', isAuthenticated);
      console.log('[BOOKING] User:', user);
      
      if (!isAuthenticated) {
        throw new Error("Please log in to book an appointment");
      }

      // Direct booking without payment
      const primaryServiceId = data.serviceIds[0];
      console.log('[BOOKING] Creating booking with:', {
        salonId,
        serviceId: primaryServiceId,
        staffId: data.staffId || null,
        timeSlotId: data.timeSlotId,
        date: data.date.toISOString().split('T')[0],
        additionalServices: data.serviceIds.slice(1),
      });
      
      const bookingResponse = await apiRequest("POST", "/api/bookings", {
        salonId,
        serviceIds: data.serviceIds,
        staffId: data.staffId || null,
        timeSlotId: data.timeSlotId,
        date: data.date.toISOString().split('T')[0],
        referralCode: appliedReferralCode?.code || null,
      });

      const bookingData = await bookingResponse.json();
      console.log("Booking created:", bookingData);
      
      if (!bookingResponse.ok) {
        throw new Error(bookingData.message || "Failed to create booking");
      }
      
      return bookingData;
    },
    onSuccess: (result) => {
      toast({
        title: "Appointment Booked!",
        description: "Your appointment has been successfully booked. You'll receive a confirmation shortly.",
      });
      setBookingDialogOpen(false);
      setAppliedReferralCode(null); // Reset referral code
      form.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${resolvedSalonId}/time-slots`] });
      
      // Clear pending booking data from localStorage
      localStorage.removeItem('pendingBooking');
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
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${resolvedSalonId}/like-status`] });
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
      navigate(`/auth?redirect=${window.location.pathname}`);
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

  // Function to calculate discounted price for a service
  const calculateServiceDiscountedPrice = (service: any) => {
    if (!offers || !Array.isArray(offers) || offers.length === 0) return null;

    let bestDiscount = 0;
    let discountType = 'percentage';
    let bestOfferTitle = '';
    
    offers.forEach((offer: any) => {
      if (!offer.isActive || !offer.isVisible) return;
      
      // Check if offer is currently valid
      const now = new Date();
      const validFrom = new Date(offer.validFrom);
      const validUntil = new Date(offer.validUntil);
      if (now < validFrom || now > validUntil) return;
      
      let applicableDiscount = 0;
      
      // Check if offer applies to all services
      if (offer.isApplicableToAllServices) {
        applicableDiscount = parseFloat(offer.discountValue);
        discountType = offer.discountType;
      } 
      // Check if offer applies to this specific service
      else if (offer.applicableServices && offer.applicableServices.includes(service.id)) {
        // Check for service-specific discount first
        if (offer.serviceSpecificDiscounts) {
          try {
            const serviceDiscounts = typeof offer.serviceSpecificDiscounts === 'string' 
              ? JSON.parse(offer.serviceSpecificDiscounts) 
              : offer.serviceSpecificDiscounts;
            
            if (serviceDiscounts[service.id]) {
              applicableDiscount = parseFloat(serviceDiscounts[service.id]);
              discountType = offer.discountType;
            }
          } catch (e) {
            console.warn('Failed to parse service specific discounts:', e);
          }
        }
        
        // Fall back to general discount if no service-specific discount
        if (applicableDiscount === 0) {
          applicableDiscount = parseFloat(offer.discountValue);
          discountType = offer.discountType;
        }
      }
      
      // Keep track of the best discount (highest percentage or amount)
      if (applicableDiscount > bestDiscount) {
        bestDiscount = applicableDiscount;
        bestOfferTitle = offer.title || 'Special Offer';
      }
    });
    
    if (bestDiscount === 0) return null;
    
    const originalPrice = parseFloat(service.price);
    let discountedPrice = originalPrice;
    
    if (discountType === 'percentage') {
      discountedPrice = originalPrice * (1 - bestDiscount / 100);
    } else {
      discountedPrice = originalPrice - bestDiscount;
    }
    
    // Ensure discounted price is not negative
    discountedPrice = Math.max(0, discountedPrice);
    
    return {
      originalPrice,
      discountedPrice,
      discountPercentage: bestDiscount,
      discountType,
      offerTitle: bestOfferTitle
    };
  };

  const onSubmit = (data: BookingFormData) => {
    console.log('[BOOKING] Form submitted with data:', data);
    console.log('[BOOKING] Form validation errors:', form.formState.errors);
    
    // Always use regular payment flow to ensure confirmation fee is paid online
    // Whether single or multiple services, customer pays confirmation fee online
    // Service fees will be paid at salon for multiple services
    try {
      bookingMutation.mutate(data);
    } catch (error) {
      console.error('[BOOKING] Mutation error:', error);
      toast({
        title: "Booking Error",
        description: "Failed to initiate booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Auto-submit pending booking after login/signup
  useEffect(() => {
    if (isAuthenticated && salonId && !hasProcessedPendingBooking.current) {
      const pendingBookingStr = localStorage.getItem('pendingBooking');
      if (pendingBookingStr) {
        // Mark as processed and clear localStorage IMMEDIATELY to prevent duplicate submissions
        hasProcessedPendingBooking.current = true;
        localStorage.removeItem('pendingBooking');
        
        try {
          const pendingBooking = JSON.parse(pendingBookingStr);
          
          // Check if this pending booking is for the current salon
          if (pendingBooking.salonId === salonId) {
            console.log('[AUTO-BOOKING] Processing pending booking:', pendingBooking);
            
            // Set form values and submit automatically
            const bookingData: BookingFormData = {
              serviceIds: pendingBooking.serviceIds,
              staffId: pendingBooking.staffId || undefined,
              date: new Date(pendingBooking.date),
              timeSlotId: pendingBooking.timeSlotId,
            };
            
            // Update form values
            form.setValue('serviceIds', bookingData.serviceIds);
            form.setValue('staffId', bookingData.staffId || '');
            form.setValue('date', bookingData.date);
            form.setValue('timeSlotId', bookingData.timeSlotId);
            
            // Set referral code if exists
            if (pendingBooking.referralCode) {
              setAppliedReferralCode({ code: pendingBooking.referralCode });
            }
            
            // Open booking dialog and submit automatically after a brief delay
            setBookingDialogOpen(true);
            setTimeout(() => {
              console.log('[AUTO-BOOKING] Submitting booking mutation');
              bookingMutation.mutate(bookingData);
            }, 500);
          }
        } catch (error) {
          console.error('Failed to process pending booking:', error);
        }
      }
    }
  }, [isAuthenticated, salonId]);

  // Calculate and update countdown for next available slot
  useEffect(() => {
    // Get current date in IST
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const todayDateStr = istNow.toISOString().split('T')[0];
    
    // Function to find next available slot
    const findNextSlot = () => {
      if (!timeSlots || timeSlots.length === 0) {
        setNextSlotCountdown(null);
        return;
      }
      
      // Get current time in minutes since midnight (IST)
      const currentMinutes = istNow.getHours() * 60 + istNow.getMinutes();
      
      // Find the next available slot that's in the future
      const nextSlot = timeSlots.find((slot: TimeSlot) => {
        if (!slot.isAvailable) return false;
        
        // Parse slot time (format: "HH:MM" or "HH:MM:SS")
        const [hours, minutes] = slot.startTime.split(':').map(Number);
        const slotMinutes = hours * 60 + minutes;
        
        return slotMinutes > currentMinutes;
      });
      
      if (nextSlot) {
        // Calculate time difference
        const [hours, minutes] = nextSlot.startTime.split(':').map(Number);
        const slotMinutes = hours * 60 + minutes;
        const diffMinutes = slotMinutes - currentMinutes;
        
        return {
          totalSeconds: diffMinutes * 60,
          slotTime: nextSlot.startTime
        };
      }
      
      return null;
    };
    
    // Initial calculation
    const nextSlotData = findNextSlot();
    if (!nextSlotData) {
      setNextSlotCountdown(null);
      return;
    }
    
    let remainingSeconds = nextSlotData.totalSeconds;
    
    // Update countdown every second
    const interval = setInterval(() => {
      remainingSeconds -= 1;
      
      if (remainingSeconds <= 0) {
        // Recalculate next slot when countdown reaches zero
        const newNextSlotData = findNextSlot();
        if (newNextSlotData) {
          remainingSeconds = newNextSlotData.totalSeconds;
          setNextSlotCountdown({
            minutes: Math.floor(remainingSeconds / 60),
            seconds: remainingSeconds % 60,
            slotTime: newNextSlotData.slotTime
          });
        } else {
          setNextSlotCountdown(null);
        }
      } else {
        setNextSlotCountdown({
          minutes: Math.floor(remainingSeconds / 60),
          seconds: remainingSeconds % 60,
          slotTime: nextSlotData.slotTime
        });
      }
    }, 1000);
    
    // Set initial countdown
    setNextSlotCountdown({
      minutes: Math.floor(remainingSeconds / 60),
      seconds: remainingSeconds % 60,
      slotTime: nextSlotData.slotTime
    });
    
    return () => clearInterval(interval);
  }, [timeSlots, selectedDate]);

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
  
  // Get data for all selected services for booking summary
  const selectedServicesData = form.watch("serviceIds")?.map(serviceId => 
    services.find(s => s.id === serviceId)
  ).filter(Boolean) || [];
  
  const totalSelectedPrice = selectedServicesData.reduce((total, service) => 
    total + parseFloat(service?.price || '0'), 0
  );

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

      {/* Next Slot Countdown Banner */}
      {nextSlotCountdown && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b-2 border-orange-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-orange-200">
                  <Clock className="h-5 w-5 text-orange-600 animate-pulse" />
                  <span className="font-semibold text-orange-900">
                    Next slot in {nextSlotCountdown.minutes}:{nextSlotCountdown.seconds.toString().padStart(2, '0')}
                  </span>
                </div>
                <span className="text-sm text-gray-700 hidden sm:block">
                  Available at <span className="font-semibold text-orange-700">{nextSlotCountdown.slotTime}</span>
                </span>
              </div>
              <Button 
                onClick={() => {
                  setBookingDialogOpen(true);
                  // Scroll to booking section
                  setTimeout(() => {
                    const bookingSection = document.querySelector('[data-testid="book-appointment-section"]');
                    if (bookingSection) {
                      bookingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }, 100);
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2 rounded-full shadow-md hover:shadow-lg transition-all"
                data-testid="countdown-book-now"
              >
                BOOK NOW
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Experience Our Salon Section - Always First */}
            <Card data-testid="experience-salon-section">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Video className="h-5 w-5 mr-2" />
                    Experience Our Salon
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Take a virtual tour and see what makes us special
                  </p>
                </CardHeader>
                <CardContent>
                  {salon.promotionalVideoUrl ? (
                    <div className="rounded-lg overflow-hidden bg-black relative">
                      <video 
                        src={salon.promotionalVideoUrl} 
                        className="w-full h-64 sm:h-80 object-contain"
                        poster=""
                        preload="metadata"
                        autoPlay
                        loop
                        muted
                        playsInline
                        onError={() => {
                          console.log("Promotional video failed to load");
                          setVideoError(true);
                        }}
                        onLoadedData={() => {
                          setVideoError(false); // Reset error state on successful load
                        }}
                        ref={(video) => {
                          if (video) {
                            // Ensure video plays when loaded
                            video.addEventListener('loadeddata', () => {
                              video.play().catch(() => {
                                // If autoplay fails, we'll show play button
                              });
                            });
                          }
                        }}
                      >
                        Your browser does not support the video tag.
                      </video>
                      
                      {/* Video error overlay */}
                      {videoError && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                          <div className="text-center text-white p-4">
                            <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p className="text-lg font-medium mb-2">Video Temporarily Unavailable</p>
                            <p className="text-sm opacity-75">
                              The promotional video is currently being processed. Please check back later.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Custom controls overlay */}
                      <div className="absolute bottom-2 right-2 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const video = e.currentTarget.parentElement?.parentElement?.querySelector('video');
                            if (video) {
                              if (video.paused) {
                                video.play();
                              } else {
                                video.pause();
                              }
                            }
                          }}
                          className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                          data-testid="video-play-pause-button"
                        >
                          <Video className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const video = e.currentTarget.parentElement?.parentElement?.querySelector('video');
                            if (video) {
                              video.muted = !video.muted;
                            }
                          }}
                          className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                          data-testid="video-audio-button"
                        >
                          {/* Audio icon - will be muted by default */}
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6 10l4-4v12l-4-4H3a1 1 0 01-1-1v-2a1 1 0 011-1h3z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Fallback when no promotional video is available
                    <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                      <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Promotional Video Coming Soon</h3>
                      <p className="text-gray-600 mb-4">
                        We're preparing an exciting video tour of our salon to show you our beautiful space and talented team.
                      </p>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-medium text-gray-900 mb-2">What to Expect:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Professional salon atmosphere</li>
                          <li>• State-of-the-art equipment</li>
                          <li>• Skilled team at work</li>
                          <li>• Clean and modern facilities</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  <div className="mt-3 text-center">
                    <p className="text-sm text-gray-600">
                      Get a feel for our salon's atmosphere and see our professional workspace
                    </p>
                  </div>
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
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
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
                    
                    {/* Scroll indicator for gallery */}
                    {gallery.length > 8 && (
                      <div className="text-center pt-4 border-t border-gray-100 mt-4">
                        <p className="text-sm text-gray-500">
                          Showing all {gallery.length} images • Scroll to see more
                        </p>
                      </div>
                    )}
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

            {/* Services & Pricing */}
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
                ) : servicesByCategory.length > 0 ? (
                  <div className="space-y-4">
                    {/* Category Filter Buttons */}
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                      <button
                        onClick={() => setSelectedCategoryFilter("all")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selectedCategoryFilter === "all"
                            ? "bg-primary text-white shadow-md"
                            : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                        }`}
                        data-testid="filter-category-all"
                      >
                        All Services
                      </button>
                      {servicesByCategory.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategoryFilter(category.id)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center space-x-2 ${
                            selectedCategoryFilter === category.id
                              ? "text-white shadow-md"
                              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                          }`}
                          style={{
                            backgroundColor: selectedCategoryFilter === category.id ? category.color || '#3B82F6' : undefined
                          }}
                          data-testid={`filter-category-${category.id}`}
                        >
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ 
                              backgroundColor: selectedCategoryFilter === category.id ? "rgba(255,255,255,0.3)" : category.color || '#3B82F6' 
                            }}
                          />
                          <span>{category.name}</span>
                        </button>
                      ))}
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      <div className="space-y-6">
                        {servicesByCategory
                          .filter(category => selectedCategoryFilter === "all" || category.id === selectedCategoryFilter)
                          .map((category) => (
                            <div key={category.id} className="space-y-3">
                              {/* Category Header */}
                              <div className="flex items-center space-x-3 pb-2 border-b border-gray-200">
                                <div 
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                                  style={{ backgroundColor: category.color || '#3B82F6' }}
                                >
                                  {category.icon === 'Scissors' ? '✂️' : 
                                   category.icon === 'Sparkles' ? '✨' : 
                                   category.icon === 'Palette' ? '🎨' :
                                   category.icon === 'Heart' ? '❤️' :
                                   category.icon === 'Star' ? '⭐' : '💫'}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 text-lg">{category.name}</h3>
                                  {category.description && (
                                    <p className="text-sm text-gray-600">{category.description}</p>
                                  )}
                                </div>
                              </div>
                              
                              {/* Services in this category */}
                              <div className="space-y-3">
                                {category.services && category.services.length > 0 ? category.services.map((service: Service) => (
                                  <div key={service.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 space-y-2 sm:space-y-0 ml-4">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-blue-600 text-sm sm:text-base">{service.name}</h4>
                                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{service.description}</p>
                                      <div className="flex items-center mt-1 text-xs sm:text-sm text-gray-500">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {service.duration} mins
                                      </div>
                                    </div>
                                    <div className="text-left sm:text-right flex-shrink-0">
                                      {(() => {
                                        const discountInfo = calculateServiceDiscountedPrice(service);
                                        if (discountInfo) {
                                          return (
                                            <div className="space-y-1">
                                              <div className="text-sm text-red-500 line-through">
                                                ₹{discountInfo.originalPrice.toFixed(2)}
                                              </div>
                                              <div className="text-lg font-semibold text-green-600">
                                                ₹{discountInfo.discountedPrice.toFixed(2)}
                                              </div>
                                              <div className="text-xs text-red-600 font-medium">
                                                {discountInfo.discountType === 'percentage' 
                                                  ? `${discountInfo.discountPercentage}% OFF` 
                                                  : `₹${discountInfo.discountPercentage} OFF`}
                                              </div>
                                              {discountInfo.offerTitle && (
                                                <div className="text-xs text-purple-600 font-medium mt-1">
                                                  {discountInfo.offerTitle}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        } else {
                                          return (
                                            <div className="text-lg font-semibold text-green-600">
                                              ₹{service.price}
                                            </div>
                                          );
                                        }
                                      })()}
                                    </div>
                                  </div>
                                )) : (
                                  <div className="text-sm text-gray-500 ml-4 py-2">
                                    No services in this category
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                    
                    {/* Scroll indicator for services */}
                    {services.length > 3 && (
                      <div className="text-center pt-4 border-t border-gray-100 mt-4">
                        <p className="text-sm text-gray-500">
                          Showing all {services.length} services across {servicesByCategory.length} categories • Scroll to see more
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No services available</p>
                )}
              </CardContent>
            </Card>

            {/* Customer Reviews */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Star className="h-5 w-5 mr-2" />
                    Customer Reviews
                  </CardTitle>
                  {user && (
                    <ReviewForm 
                      salonId={salonId!} 
                      trigger={
                        <Button size="sm" className="bg-amber-600 hover:bg-amber-700" data-testid="button-write-review">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Write a Review
                        </Button>
                      }
                    />
                  )}
                </div>
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
                  <div className="max-h-96 overflow-y-auto space-y-6 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-4">
                          {/* Customer Profile Picture */}
                          <div className="flex-shrink-0">
                            {(review as any).customerProfileImage ? (
                              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                                <img 
                                  src={(review as any).customerProfileImage} 
                                  alt="Customer" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-white font-semibold text-lg border-2 border-amber-200">
                                {((review as any).customerName || (review as any).customerFirstName || "Customer")[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                          
                          {/* Review Content */}
                          <div className="flex-1 min-w-0">
                            {/* Rating and Name */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {/* Star rating */}
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
                                <span className="font-semibold text-gray-900">
                                  {(review as any).customerName || 
                                   ((review as any).customerFirstName && (review as any).customerLastName ? 
                                    `${(review as any).customerFirstName} ${(review as any).customerLastName}`.trim() : 
                                    (review as any).customerFirstName) || 
                                   "Customer Review"}
                                </span>
                              </div>
                              <span className="text-sm text-gray-500 flex-shrink-0">
                                {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', {
                                  day: 'numeric',
                                  month: 'numeric', 
                                  year: 'numeric'
                                }) : "Recently"}
                              </span>
                            </div>
                            
                            {/* Review Text */}
                            <p className="text-gray-700 leading-relaxed mb-3">{review.comment}</p>
                            
                            {/* Service Information */}
                            {(review as any).serviceName && (
                              <p className="text-sm text-gray-500 mb-3">
                                Service: {(review as any).serviceName}
                              </p>
                            )}
                            
                            {/* Display review photos */}
                            {review.photos && review.photos.length > 0 && (
                              <ReviewPhotoGallery 
                                photos={review.photos}
                                reviewId={review.id}
                                className="mt-3"
                              />
                            )}
                            
                            {/* Display salon owner replies */}
                            {review.replies && review.replies.length > 0 && (
                              <div className="mt-4 border-t border-gray-100 pt-4">
                                {review.replies.map((reply) => (
                                  <div key={reply.id} className="bg-blue-50 border border-blue-100 rounded-lg p-3 ml-4">
                                    <div className="flex items-start space-x-3">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                        <Building2 className="h-4 w-4" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center space-x-2">
                                            <span className="font-semibold text-blue-900 text-sm">Salon Owner</span>
                                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Reply</span>
                                          </div>
                                          <span className="text-xs text-blue-600">
                                            {reply.createdAt ? new Date(reply.createdAt).toLocaleDateString('en-US', {
                                              day: 'numeric',
                                              month: 'numeric',
                                              year: 'numeric'
                                            }) : 'Recently'}
                                          </span>
                                        </div>
                                        <p className="text-blue-800 text-sm leading-relaxed">
                                          {reply.replyText}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Reply form for salon owners */}
                            {isAuthenticated && user?.userType === 'salon_owner' && salon?.ownerId === user?.id && (
                              <div className="mt-4 border-t border-gray-100 pt-4">
                                <ReplyForm 
                                  reviewId={review.id} 
                                  existingReply={review.replies?.[0]}
                                  onReplySuccess={() => {
                                    // Invalidate the reviews cache to refresh data
                                    queryClient.invalidateQueries({ queryKey: [`/api/salons/${resolvedSalonId}/reviews`] });
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Scroll indicator */}
                    {reviews.length > 3 && (
                      <div className="text-center pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                          Showing all {reviews.length} reviews • Scroll to see more
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No reviews yet. Be the first to review!</p>
                  </div>
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
                  <div className="max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
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
                            
                            {/* Bio preview with Know More button */}
                            {member.bio && member.bio.trim() !== '' && (
                              <div className="mb-3">
                                <p className="text-gray-700 text-sm line-clamp-2">
                                  {member.bio.length > 100 ? `${member.bio.substring(0, 100)}...` : member.bio}
                                </p>
                                {member.bio.length > 100 && (
                                  <Button
                                    size="sm"
                                    className="rounded-full bg-green-500 hover:bg-green-600 text-black px-4 py-2"
                                    onClick={() => setSelectedStaffBio(member)}
                                  >
                                    Meet {member.name.split(' ')[0]}
                                  </Button>
                                )}
                              </div>
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
                    
                    {/* Scroll indicator for team */}
                    {staff.length > 4 && (
                      <div className="text-center pt-4 border-t border-gray-100 mt-4">
                        <p className="text-sm text-gray-500">
                          Showing all {staff.length} team members • Scroll to see more
                        </p>
                      </div>
                    )}
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

            {/* Location & Salon Info - Last Section */}
            <Card data-testid="location-info-section">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Location & Info
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                    <div className="w-full md:w-48 h-48 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
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
                          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{salon.name}</h1>
                          <div className="flex items-center mb-2">
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            <span className="ml-1 text-lg font-medium">
                              {salon.averageRating ? Number(salon.averageRating).toFixed(1) : "New"}
                            </span>
                            <span className="ml-1 text-gray-500">
                              ({salon.totalReviews || 0} reviews)
                            </span>
                          </div>
                          <div className="flex flex-col gap-2 mb-4">
                            <div className="flex items-center text-gray-600">
                              <MapPin className="h-4 w-4 mr-2" />
                              <span className="break-words">{salon.address}</span>
                            </div>
                            {salon.googleMapsLink && (
                              <a
                                href={salon.googleMapsLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium w-fit"
                                data-testid="link-get-directions"
                              >
                                <Navigation className="h-4 w-4" />
                                Get Directions on Google Maps
                              </a>
                            )}
                          </div>
                          
                          {salon.description && (
                            <div className="mb-4">
                              <h3 className="font-medium text-gray-900 mb-2">About This Salon</h3>
                              <p className="text-gray-700 text-sm leading-relaxed">{salon.description}</p>
                            </div>
                          )}
                          
                          {/* Additional salon details */}
                          <div className="space-y-3">
                            {salon.phone && (
                              <div className="flex items-center text-gray-600">
                                <span className="mr-2">📞</span>
                                <span className="text-sm">{salon.phone}</span>
                              </div>
                            )}
                            
                          </div>
                          
                          {/* Location Map */}
                          {salon.latitude && salon.longitude && (
                            <div className="mt-6">
                              <h3 className="font-medium text-gray-900 mb-3">Location Map</h3>
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
                    </div>
                  </div>
                  
                  {/* Scroll indicator */}
                  <div className="text-center pt-4 border-t border-gray-100 mt-4">
                    <p className="text-sm text-gray-500">
                      Scroll to view all location details and map
                    </p>
                  </div>
                </div>
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

            {/* Working Hours & Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Working Hours & Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Working Hours */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Business Hours</h4>
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
                </div>
                
                {/* Contact Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-3">
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
                  </div>
                </div>
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
                <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                      <Crown className="h-4 w-4 mr-2" />
                      Book an Luxury
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
                            name="serviceIds"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Select Services</FormLabel>
                                <div className="space-y-3 max-h-48 overflow-y-auto border rounded-lg p-3">
                                  {services.map((service) => {
                                    const discountInfo = calculateServiceDiscountedPrice(service);
                                    const originalPrice = parseFloat(service.price);
                                    const isSelected = field.value?.includes(service.id) || false;
                                    
                                    return (
                                      <div key={service.id} className="flex items-center space-x-3 p-2 rounded border hover:bg-gray-50">
                                        <input
                                          type="checkbox"
                                          id={`service-${service.id}`}
                                          checked={isSelected}
                                          onChange={(e) => {
                                            const currentValues = field.value || [];
                                            if (e.target.checked) {
                                              const newValues = [...currentValues, service.id];
                                              field.onChange(newValues);
                                            } else {
                                              const newValues = currentValues.filter((id: string) => id !== service.id);
                                              field.onChange(newValues);
                                            }
                                          }}
                                          className="h-4 w-4 text-primary"
                                          data-testid={`checkbox-service-${service.id}`}
                                        />
                                        <label htmlFor={`service-${service.id}`} className="flex-1 cursor-pointer">
                                          <div className="flex justify-between items-center">
                                            <div>
                                              <span className="font-medium text-blue-600">{service.name}</span>
                                            </div>
                                            <div className="text-right">
                                              {discountInfo ? (
                                                <div className="space-y-1">
                                                  <div className="text-sm text-red-500 line-through">
                                                    ₹{originalPrice}
                                                  </div>
                                                  <div className="text-green-600 font-bold">
                                                    ₹{discountInfo.discountedPrice}
                                                  </div>
                                                  <div className="text-xs text-purple-600">
                                                    {discountInfo.offerTitle}
                                                  </div>
                                                </div>
                                              ) : (
                                                <span className="text-green-600 font-semibold">₹{service.price}</span>
                                              )}
                                            </div>
                                          </div>
                                        </label>
                                      </div>
                                    );
                                  })}
                                </div>
                                {field.value && field.value.length > 0 && (
                                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                                    <div className="text-sm font-medium text-blue-900">Selected Services ({field.value.length}):</div>
                                    <div className="mt-1 text-sm text-blue-800">
                                      Total Price: ₹{services
                                        .filter(service => field.value.includes(service.id))
                                        .map(service => {
                                          const discountInfo = calculateServiceDiscountedPrice(service);
                                          return discountInfo ? discountInfo.discountedPrice : parseFloat(service.price);
                                        })
                                        .reduce((total, price) => total + price, 0)
                                        .toFixed(0)}
                                    </div>
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

                          {form.watch("serviceIds")?.length > 0 && selectedDate && (
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
                          {form.watch("serviceIds")?.length > 0 && selectedDate && (
                            <EmergencyBookingBanner
                              salon={salon}
                              service={services.find(s => form.watch("serviceIds")?.[0])}
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

                          {selectedServicesData.length > 0 && (
                            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                              <h4 className="font-semibold mb-2 text-sm sm:text-base">Booking Summary</h4>
                              <div className="space-y-1 text-xs sm:text-sm">
                                <div className="flex justify-between">
                                  <span>Services ({selectedServicesData.length}):</span>
                                  <span className="truncate ml-2 text-right">
                                    {selectedServicesData.map(service => service?.name || 'Unknown Service').join(", ")}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Total Duration:</span>
                                  <span>{selectedServicesData.reduce((total, service) => total + (service?.duration || 0), 0)} mins</span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                  <span>Total Price:</span>
                                  <span>₹{totalSelectedPrice}</span>
                                </div>
                                {appliedReferralCode && (
                                  <>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between text-green-600">
                                      <span>Applied Referral Code:</span>
                                      <span>{appliedReferralCode.code}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          {!isAuthenticated ? (
                            <Button 
                              type="button"
                              className="w-full bg-primary hover:bg-primary/90" 
                              onClick={() => {
                                // Save booking details to localStorage before redirecting to login
                                const formData = form.getValues();
                                const pendingBooking = {
                                  salonId,
                                  serviceIds: formData.serviceIds,
                                  staffId: formData.staffId || null,
                                  timeSlotId: formData.timeSlotId,
                                  date: formData.date.toISOString(),
                                  referralCode: appliedReferralCode?.code || null,
                                };
                                localStorage.setItem('pendingBooking', JSON.stringify(pendingBooking));
                                
                                setBookingDialogOpen(false);
                                navigate(`/auth?redirect=${window.location.pathname}`);
                              }}
                            >
                              Login to Confirm Booking
                            </Button>
                          ) : (
                            <Button 
                              type="submit" 
                              className="w-full" 
                              disabled={bookingMutation.isPending}
                            >
                              {bookingMutation.isPending 
                                ? (
                                    <span className="flex items-center justify-center gap-2">
                                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                      Booking...
                                    </span>
                                  )
                                : (rescheduleBookingId ? "Reschedule Booking" : "Book Appointment")}
                            </Button>
                          )}
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
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

            {/* Service-Specific Offers Section - New Enhanced Display */}
            {Array.isArray(offers) && offers.length > 0 && (
              <ServiceSpecificOffers offers={offers} services={services} />
            )}

            {/* Frequently Asked Questions Section - Collapsible */}
            {Array.isArray(faqs) && faqs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    Frequently Asked Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {faqs
                      .filter((faq: any) => faq.isActive)
                      .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
                      .map((faq: any, index: number) => {
                        const isExpanded = expandedFaqs.has(faq.id);
                        return (
                          <div key={faq.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* Question - Clickable */}
                            <button
                              onClick={() => toggleFaqExpansion(faq.id)}
                              className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
                              data-testid={`button-faq-${index + 1}`}
                            >
                              <div className="flex items-start gap-3 flex-1">
                                <span className="text-primary font-bold text-sm bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {index + 1}
                                </span>
                                <h3 className="font-medium text-gray-900 text-sm">
                                  {faq.question}
                                </h3>
                              </div>
                              <div className="flex-shrink-0 ml-2">
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                )}
                              </div>
                            </button>
                            
                            {/* Answer - Expandable */}
                            {isExpanded && (
                              <div className="px-4 py-3 bg-white border-t border-gray-100">
                                <p className="text-gray-700 text-sm leading-relaxed ml-9">
                                  {faq.answer}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
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

      {/* Staff Bio Modal */}
      <Dialog open={!!selectedStaffBio} onOpenChange={() => setSelectedStaffBio(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Meet {selectedStaffBio?.name}</DialogTitle>
            <DialogDescription>Learn more about our team member</DialogDescription>
          </DialogHeader>
          {selectedStaffBio && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedStaffBio.photoUrl || ""} alt={selectedStaffBio.name} className="object-cover" />
                  <AvatarFallback className="text-xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {selectedStaffBio.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedStaffBio.name}</h2>
                  <p className="text-blue-600 font-medium">{selectedStaffBio.role}</p>
                  {selectedStaffBio.experience && (
                    <p className="text-gray-600 text-sm mt-1">{selectedStaffBio.experience}</p>
                  )}
                  <div className="flex items-center mt-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="text-sm font-medium text-gray-700">
                      {selectedStaffBio.rating ? Number(selectedStaffBio.rating).toFixed(1) : "0.0"}
                    </span>
                    {selectedStaffBio.totalReviews && selectedStaffBio.totalReviews > 0 && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({selectedStaffBio.totalReviews})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Specialties */}
              {(selectedStaffBio as any).services && (selectedStaffBio as any).services.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {(selectedStaffBio as any).services.map((service: any, index: number) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {service.serviceName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {selectedStaffBio.bio && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About {selectedStaffBio.name}</h3>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {selectedStaffBio.bio}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedStaffBio.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{selectedStaffBio.phone}</span>
                    </div>
                  )}
                  {selectedStaffBio.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{selectedStaffBio.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mobile Sticky Book Appointment Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-md mx-auto">
          {!isAuthenticated ? (
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
              onClick={() => navigate(`/auth?redirect=${window.location.pathname}`)}
              data-testid="button-mobile-login-to-book"
            >
              <Crown className="h-4 w-4 mr-2" />
              Book an Luxury
            </Button>
          ) : (
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
              onClick={() => setBookingDialogOpen(true)}
              data-testid="button-mobile-book-now"
            >
              <Crown className="h-4 w-4 mr-2" />
              Book an Luxury
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
