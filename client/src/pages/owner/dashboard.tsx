import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { 
  Store, Users, Calendar, IndianRupee, Clock, Star, Plus, 
  Edit, Trash2, Eye, Phone, MapPin, TrendingUp, Activity,
  BarChart3, DollarSign, UserPlus, Settings, Scissors, CheckCircle, Upload,
  CreditCard, Camera, User, MessageSquare, AlertCircle, Percent, Video, Play, 
  HelpCircle, Edit2, Palette, Tags
} from "lucide-react";
import { Link } from "wouter";
import { ObjectUploader } from "@/components/ObjectUploader";
import { LeafletLocationPicker } from "@/components/LeafletLocationPicker";
import type { UploadResult } from '@uppy/core';
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Salon, Service, Staff, BookingWithDetails, Review, SalonGallery, ServiceCategory, InsertServiceCategory } from "@shared/schema";

// Extended type for grouped bookings
interface GroupedBooking extends BookingWithDetails {
  servicesList: string[];
  servicesCount: number;
  totalGroupAmount: number;
  allBookingIds: string[];
  groupStatus: string;
}
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingWalkthrough } from "@/components/OnboardingWalkthrough";
import { apiRequest } from "@/lib/queryClient";
import { WorkingHoursForm } from "@/components/WorkingHoursForm";

const salonSchema = z.object({
  name: z.string().min(1, "Salon name is required"),
  description: z.string().optional(),
  phone: z.string().min(10, "Valid phone number required"),
  address: z.string().min(1, "Address is required"),
  latitude: z.number({
    required_error: "Please mark your shop location on the map",
  }),
  longitude: z.number({
    required_error: "Please mark your shop location on the map",
  }),
  imageUrl: z.string().optional(),
  instagramId: z.string().optional(),
  confirmationAmount: z.number().min(0),
});

const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  price: z.number().min(1, "Price must be greater than 0"),
  duration: z.number().min(15, "Duration must be at least 15 minutes"),
  categoryId: z.string().optional(),
});

const staffSchema = z.object({
  name: z.string().min(1, "Staff name is required"),
  role: z.string().min(1, "Role is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  photoUrl: z.string().optional(),
});

const gallerySchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.enum(['work', 'staff', 'interior']).default('work'),
});

const faqSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  displayOrder: z.number().optional(),
  isActive: z.boolean().default(true),
});

const serviceCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  icon: z.string().min(1, "Please select an icon"),
  color: z.string().min(4, "Please select a color"),
});

type SalonFormData = z.infer<typeof salonSchema>;
type ServiceFormData = z.infer<typeof serviceSchema>;
type StaffFormData = z.infer<typeof staffSchema>;
type GalleryFormData = z.infer<typeof gallerySchema>;
type FaqFormData = z.infer<typeof faqSchema>;
type ServiceCategoryFormData = z.infer<typeof serviceCategorySchema>;

export default function OwnerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { shouldShowOnboarding, onboardingSteps, completeOnboarding, skipOnboarding } = useOnboarding('salon-owner');
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [salonDialogOpen, setSalonDialogOpen] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [galleryDialogOpen, setGalleryDialogOpen] = useState(false);
  const [promoVideoDialogOpen, setPromoVideoDialogOpen] = useState(false);
  const [faqDialogOpen, setFaqDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [salonLocation, setSalonLocation] = useState<{lat: number, lng: number} | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editingWorkingHours, setEditingWorkingHours] = useState(false);

  // Fetch user's salon - optimized caching
  const { data: salon, isLoading: salonLoading, error: salonError } = useQuery<Salon>({
    queryKey: ['/api/owner/salon'],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (salon not found) - this is expected for new salon owners
      if (error?.status === 404) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
  });

  // Fetch salon services - parallel loading with caching
  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: [`/api/salons/${salon?.id}/services`],
    enabled: !!salon?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });

  // Fetch salon staff - parallel loading with caching
  const { data: staff = [], isLoading: staffLoading } = useQuery<Staff[]>({
    queryKey: [`/api/salons/${salon?.id}/staff`],
    enabled: !!salon?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });

  // Fetch service categories for the salon - parallel loading with caching
  const { data: serviceCategories = [], isLoading: categoriesLoading } = useQuery<any[]>({
    queryKey: [`/api/salons/${salon?.id}/categories`],
    enabled: !!salon?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    retry: false, // Don't retry if endpoint doesn't exist yet
    refetchOnMount: false,
  });

  // Group bookings by customer, date and time slot for multiple services
  const groupBookingsByAppointment = (bookings: BookingWithDetails[]): GroupedBooking[] => {
    const groups = new Map<string, BookingWithDetails[]>();
    
    bookings.forEach(booking => {
      // Create unique customer identifier to avoid collisions
      const customerId = booking.isWalkIn ? 
        `walk-in-${booking.walkInCustomerPhone || booking.walkInCustomerName || booking.id}` : 
        booking.customer?.id || `unknown-${booking.id}`;
      const key = `${customerId}-${booking.date}-${booking.startTime}-${booking.endTime}`;
      
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

  // Fetch salon bookings - optimized refresh
  const { data: rawBookings = [], isLoading: bookingsLoading } = useQuery<BookingWithDetails[]>({
    queryKey: [`/api/owner/bookings`],
    enabled: !!salon?.id,
    staleTime: 0, // No cache - force fresh data for debugging
    gcTime: 0, // Don't cache the response (replaces old cacheTime)
  });

  // Group the bookings for display
  const bookings = groupBookingsByAppointment(rawBookings);

  // Fetch salon reviews - long cache
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: [`/api/salons/${salon?.id}/reviews`],
    enabled: !!salon?.id,
    staleTime: 15 * 60 * 1000, // 15 minutes cache - reviews don't change often
  });

  // Fetch salon gallery - long cache
  const { data: gallery = [], isLoading: galleryLoading } = useQuery<SalonGallery[]>({
    queryKey: [`/api/salons/${salon?.id}/gallery`],
    enabled: !!salon?.id,
    staleTime: 30 * 60 * 1000, // 30 minutes cache - gallery doesn't change often
  });

  // Fetch brand invitations - optimized caching
  const { data: brandInvitationsData, isLoading: invitationsLoading } = useQuery<{sent: any[], received: any[]}>({
    queryKey: [`/api/brand-invitations/${user?.id}`],
    enabled: isAuthenticated && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Fetch brand messages - optimized caching
  const { data: brandMessages = [], isLoading: messagesLoading } = useQuery<any[]>({
    queryKey: ['/api/owner/messages'],
    enabled: isAuthenticated && !!salon?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes cache - messages change more frequently
  });

  // Fetch working hours data
  const { data: workingHours = [], isLoading: workingHoursLoading } = useQuery<any[]>({
    queryKey: [`/api/salons/${salon?.id}/working-hours`],
    enabled: !!salon?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Working hours update mutation
  const updateWorkingHoursMutation = useMutation({
    mutationFn: async (hoursData: any[]) => {
      return await apiRequest("POST", `/api/salons/${salon?.id}/working-hours`, {
        workingHours: hoursData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/working-hours`] });
      setEditingWorkingHours(false);
      toast({
        title: "Success",
        description: "Salon working hours updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update working hours",
        variant: "destructive",
      });
    },
  });

  // FAQ queries and mutations
  const { data: faqs = [], isLoading: faqsLoading } = useQuery<any[]>({
    queryKey: [`/api/owner/salon/faqs`],
    enabled: !!salon?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });

  const createFaqMutation = useMutation({
    mutationFn: async (faqData: FaqFormData) => {
      return await apiRequest("POST", `/api/owner/salon/faqs`, faqData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/owner/salon/faqs`] });
      setFaqDialogOpen(false);
      setEditingItem(null);
      toast({
        title: "Success",
        description: "FAQ created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create FAQ",
        variant: "destructive",
      });
    },
  });

  const updateFaqMutation = useMutation({
    mutationFn: async ({ id, ...faqData }: FaqFormData & { id: string }) => {
      return await apiRequest("PUT", `/api/owner/salon/faqs/${id}`, faqData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/owner/salon/faqs`] });
      setFaqDialogOpen(false);
      setEditingItem(null);
      toast({
        title: "Success",
        description: "FAQ updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update FAQ",
        variant: "destructive",
      });
    },
  });

  const deleteFaqMutation = useMutation({
    mutationFn: async (faqId: string) => {
      return await apiRequest("DELETE", `/api/owner/salon/faqs/${faqId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/owner/salon/faqs`] });
      toast({
        title: "Success",
        description: "FAQ deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete FAQ",
        variant: "destructive",
      });
    },
  });

  // Helper function to format working hours display
  const getWorkingHoursForDay = (dayName: string) => {
    const dayMap: { [key: string]: number } = {
      'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 
      'Friday': 5, 'Saturday': 6, 'Sunday': 0
    };
    
    const dayOfWeek = dayMap[dayName];
    const daySchedule = workingHours.find(wh => wh.dayOfWeek === dayOfWeek);
    
    if (!daySchedule || !daySchedule.isOpen) {
      return { isOpen: false, hours: 'Closed' };
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
      
      // Add break time if available
      if (daySchedule.breakStartTime && daySchedule.breakEndTime) {
        hoursText += ` (Break: ${formatTime(daySchedule.breakStartTime)} - ${formatTime(daySchedule.breakEndTime)})`;
      }
    }
    
    return { 
      isOpen: true, 
      hours: hoursText || '9:00 AM - 8:00 PM' // fallback to default
    };
  };

  const brandInvitations = brandInvitationsData?.received || [];

  const salonForm = useForm<SalonFormData>({
    resolver: zodResolver(salonSchema),
    defaultValues: {
      name: salon?.name || "",
      description: salon?.description || "",
      phone: salon?.phone || "",
      address: salon?.address || "",
      latitude: salon?.latitude ? Number(salon.latitude) : undefined,
      longitude: salon?.longitude ? Number(salon.longitude) : undefined,
      imageUrl: salon?.imageUrl || "",
      confirmationAmount: salon?.confirmationAmount || 0,
    },
  });

  const serviceForm = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      duration: 30,
      categoryId: "",
    },
  });

  const staffForm = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      role: "",
      phone: "",
      email: "",
      photoUrl: "",
    },
  });

  // Mutation for responding to brand invitations
  const respondToInvitationMutation = useMutation({
    mutationFn: async ({ invitationId, status }: { invitationId: string, status: 'accepted' | 'rejected' }) => {
      const response = await apiRequest('PUT', `/api/brand-invitations/${invitationId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/brand-invitations/${user?.id}`] });
      toast({
        title: "Response sent",
        description: "Your response to the brand invitation has been recorded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark message as read mutation
  const markMessageAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiRequest("PUT", `/api/owner/messages/${messageId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/owner/messages'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to mark message as read", description: error.message, variant: "destructive" });
    },
  });

  // Promotional video upload mutation
  const updatePromoVideoMutation = useMutation({
    mutationFn: async (promotionalVideoUrl: string) => {
      return await apiRequest("PUT", `/api/salons/${salon?.id}/promotional-video`, {
        promotionalVideoUrl
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/owner/salon'] });
      toast({
        title: "Video Updated!",
        description: "Your promotional video has been updated successfully.",
      });
      setPromoVideoDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update promotional video",
        variant: "destructive",
      });
    },
  });

  // Fix promotional video ACL mutation
  const fixPromoVideoAclMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/fix-promo-video-acl", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/owner/salon'] });
      toast({
        title: "Video Fixed!",
        description: "Video permissions have been updated and should now play correctly.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to fix video permissions",
        variant: "destructive",
      });
    },
  });

  const galleryForm = useForm<GalleryFormData>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      title: "",
      description: "",
      category: "work",
    },
  });

  // FAQ form hook - moved to top level to avoid hooks violation
  const faqForm = useForm<FaqFormData>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      question: "",
      answer: "",
      isActive: true,
      displayOrder: 0,
    },
  });

  // Category form hook
  const categoryForm = useForm<ServiceCategoryFormData>({
    resolver: zodResolver(serviceCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "Scissors",
      color: "#3B82F6",
    },
  });

  // Category mutation
  const categoryMutation = useMutation({
    mutationFn: async (data: ServiceCategoryFormData) => {
      const endpoint = editingItem ? `/api/categories/${editingItem.id}` : `/api/salons/${salon?.id}/categories`;
      const method = editingItem ? 'PUT' : 'POST';
      return apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      toast({
        title: editingItem ? "Category Updated!" : "Category Added!",
        description: editingItem ? "Service category has been updated." : "New service category has been created.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/categories`] });
      categoryForm.reset();
      setCategoryDialogOpen(false);
      setEditingItem(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to ${editingItem ? 'update' : 'create'} category. Please try again.`,
        variant: "destructive",
      });
    },
  });

  // Reset FAQ form when dialog opens/closes or editing item changes
  useEffect(() => {
    if (faqDialogOpen) {
      if (editingItem) {
        // Pre-populate form for editing
        faqForm.reset({
          question: editingItem.question || "",
          answer: editingItem.answer || "",
          isActive: editingItem.isActive ?? true,
          displayOrder: editingItem.displayOrder || 0,
        });
      } else {
        // Reset form for new FAQ
        faqForm.reset({
          question: "",
          answer: "",
          isActive: true,
          displayOrder: faqs.length,
        });
      }
    }
  }, [faqDialogOpen, editingItem, faqs.length, faqForm]);

  // Salon mutation
  const salonMutation = useMutation({
    mutationFn: async (data: SalonFormData) => {
      const endpoint = salon ? `/api/salons/${salon.id}` : '/api/salons';
      const method = salon ? 'PUT' : 'POST';
      return apiRequest(method, endpoint, {
        ...data,
        // Keep confirmationAmount as is - server expects rupees, not paisa
      });
    },
    onSuccess: (data) => {
      toast({
        title: salon ? "Salon Updated!" : "Salon Created!",
        description: salon ? "Your salon details have been updated." : "Your salon has been created successfully.",
      });
      setSalonDialogOpen(false);
      // Clear the cache and immediately set the new salon data
      queryClient.setQueryData(['/api/owner/salon'], data);
      // Also invalidate to trigger a fresh fetch
      queryClient.invalidateQueries({ queryKey: ['/api/owner/salon'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Service mutation
  const serviceMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      const endpoint = editingItem ? `/api/services/${editingItem.id}` : `/api/salons/${salon?.id}/services`;
      const method = editingItem ? 'PUT' : 'POST';
      
      // Filter out "none" category value and convert to null if needed
      const serviceData = {
        ...data,
        categoryId: data.categoryId === "none" || data.categoryId === "" ? null : data.categoryId
      };
      
      return apiRequest(method, endpoint, serviceData);
    },
    onSuccess: () => {
      toast({
        title: editingItem ? "Service Updated!" : "Service Added!",
        description: editingItem ? "Service has been updated." : "New service has been added to your salon.",
      });
      setServiceDialogOpen(false);
      setEditingItem(null);
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/services`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      return apiRequest('DELETE', `/api/services/${serviceId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Service Deleted!",
        description: "Service has been removed from your salon.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/services`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Staff mutation
  const staffMutation = useMutation({
    mutationFn: async (data: StaffFormData) => {
      console.log('Staff mutation data:', data);
      const endpoint = editingItem ? `/api/staff/${editingItem.id}` : `/api/salons/${salon?.id}/staff`;
      const method = editingItem ? 'PUT' : 'POST';
      console.log('Staff API call:', { method, endpoint, data });
      return apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      toast({
        title: editingItem ? "Staff Updated!" : "Staff Added!",
        description: editingItem ? "Staff member has been updated." : "New staff member has been added.",
      });
      setStaffDialogOpen(false);
      setEditingItem(null);
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/staff`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Gallery mutation
  const galleryMutation = useMutation({
    mutationFn: async (data: { imageUrl: string } & GalleryFormData) => {
      const endpoint = editingItem ? `/api/salons/${salon?.id}/gallery/${editingItem.id}` : `/api/salons/${salon?.id}/gallery`;
      const method = editingItem ? 'PUT' : 'POST';
      return apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      toast({
        title: editingItem ? "Gallery Updated!" : "Image Added!",
        description: editingItem ? "Gallery image has been updated." : "New image has been added to your gallery.",
      });
      setGalleryDialogOpen(false);
      setEditingItem(null);
      galleryForm.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/gallery`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Gallery delete mutation
  const deleteGalleryMutation = useMutation({
    mutationFn: async (imageId: string) => {
      return apiRequest("DELETE", `/api/salons/${salon?.id}/gallery/${imageId}`);
    },
    onSuccess: () => {
      toast({
        title: "Image Deleted",
        description: "The image has been removed from your gallery.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/gallery`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update booking status mutations
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      return apiRequest("PATCH", `/api/bookings/${bookingId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/bookings"] });
      toast({ title: "Booking status updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update booking", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const confirmBooking = (bookingId: string) => {
    updateBookingStatusMutation.mutate({ bookingId, status: "confirmed" });
  };

  const cancelBooking = (bookingId: string) => {
    updateBookingStatusMutation.mutate({ bookingId, status: "cancelled" });
  };

  const completeBooking = (bookingId: string) => {
    updateBookingStatusMutation.mutate({ bookingId, status: "completed" });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Salon Owner Dashboard</h2>
          <p className="text-gray-600 mb-6">Please log in to access your salon dashboard</p>
          <Button asChild>
            <a href="/api/login">Log In</a>
          </Button>
        </div>
      </div>
    );
  }

  if (salonLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleEditService = (service: Service) => {
    setEditingItem(service);
    serviceForm.reset({
      name: service.name,
      description: service.description || "",
      price: Number(service.price),
      duration: service.duration,
      categoryId: (service as any).categoryId || "none",
    });
    setServiceDialogOpen(true);
  };

  const handleDeleteService = (service: Service) => {
    if (window.confirm(`Are you sure you want to delete "${service.name}"? This action cannot be undone.`)) {
      deleteServiceMutation.mutate(service.id);
    }
  };

  const handleEditStaff = (member: Staff) => {
    setEditingItem(member);
    staffForm.reset({
      name: member.name,
      role: member.role,
      phone: member.phone || "",
      email: member.email || "",
      photoUrl: member.photoUrl || "",
    });
    setStaffDialogOpen(true);
  };

  const handleEditGallery = (galleryItem: SalonGallery) => {
    setEditingItem(galleryItem);
    galleryForm.reset({
      title: galleryItem.title || "",
      description: galleryItem.description || "",
      category: (galleryItem.category as "work" | "staff" | "interior") || "work",
    });
    setGalleryDialogOpen(true);
  };

  const handleGalleryUpload = async (): Promise<{ method: "PUT"; url: string }> => {
    try {
      const response = await apiRequest('POST', '/api/objects/upload');
      const data = await response.json() as { uploadURL: string };
      console.log("Upload URL response:", data);
      return {
        method: "PUT",
        url: data.uploadURL,
      };
    } catch (error) {
      console.error("Error getting upload URL:", error);
      throw error;
    }
  };

  const handleGalleryUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    console.log("Upload result:", result);
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      console.log("Uploaded file:", uploadedFile);
      
      // Extract the URL from Uppy's response 
      // After successful upload to S3, the file URL is in the uploadURL field
      const uploadURL = (uploadedFile as any).uploadURL || (uploadedFile as any).response?.uploadURL;
      let imageUrl = uploadURL;
      
      // Remove query parameters to get clean URL for storage
      if (imageUrl && imageUrl.includes('?')) {
        imageUrl = imageUrl.split('?')[0];
      }
      
      // If we still don't have a URL, construct it manually from the original upload URL
      if (!imageUrl) {
        // This should not happen with proper upload, but fallback
        console.error("No image URL found in upload response, checking alternative sources");
        console.log("Upload file object:", uploadedFile);
      }
      
      console.log("Final image URL:", imageUrl);
      
      if (imageUrl) {
        // Submit the form with the uploaded image URL
        const formData = galleryForm.getValues();
        galleryMutation.mutate({
          ...formData,
          imageUrl,
        });
        // Close the dialog
        setGalleryDialogOpen(false);
      } else {
        console.error("No image URL found in upload result");
        alert("Upload failed - no URL found. Please try again.");
      }
    }
  };

  const handleDeleteGallery = (imageId: string) => {
    if (confirm("Are you sure you want to delete this image?")) {
      deleteGalleryMutation.mutate(imageId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col space-y-3 sm:space-y-4 lg:space-y-0 lg:flex-row lg:justify-between lg:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">
                  {salon ? salon.name : "Setup Your Salon"}
                </h1>
                {salon && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Badge 
                      className={
                        salon.verificationStatus === 'approved' 
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                          : salon.verificationStatus === 'rejected'
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }
                    >
                      {salon.verificationStatus === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {salon.verificationStatus === 'approved' ? 'Verified' : 
                       salon.verificationStatus === 'rejected' ? 'Rejected' : 'Pending Review'}
                    </Badge>
                  </div>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base mt-1">
                {salon ? "Manage your salon and grow your business" : "Create your salon profile to get started"}
              </p>
              {salon?.verificationNotes && (
                <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Admin Notes:
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {salon.verificationNotes}
                  </p>
                </div>
              )}
            </div>
            {!salon && (
              <Button 
                onClick={() => setSalonDialogOpen(true)} 
                size="lg"
                className="w-full sm:w-auto lg:w-auto"
              >
                <Store className="h-4 w-4 mr-2" />
                <span className="hidden xs:inline">Create Salon Profile</span>
                <span className="xs:hidden">Create Profile</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {!salon ? (
        // Salon Setup Screen
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center mb-6 sm:mb-8">
            <Scissors className="h-12 w-12 sm:h-16 sm:w-16 text-primary mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Welcome to Sanwar!</h2>
            <p className="text-base sm:text-lg text-gray-600">Let's set up your salon profile to start attracting customers</p>
          </div>
          
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Setup Your Salon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-gray-600 mb-4 text-sm sm:text-base">
                    Complete your salon profile to appear on our platform and start receiving bookings from customers.
                  </p>
                  <Button 
                    onClick={() => setSalonDialogOpen(true)} 
                    size="lg" 
                    className="w-full"
                  >
                    <Store className="h-4 w-4 mr-2" />
                    Create Salon Profile
                  </Button>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">What you'll get:</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 text-green-500 mr-3" />
                      <span className="text-sm">Your salon visible to thousands of customers</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-green-500 mr-3" />
                      <span className="text-sm">Automated booking management system</span>
                    </div>
                    <div className="flex items-center">
                      <IndianRupee className="h-4 w-4 text-green-500 mr-3" />
                      <span className="text-sm">Secure payment processing</span>
                    </div>
                    <div className="flex items-center">
                      <BarChart3 className="h-4 w-4 text-green-500 mr-3" />
                      <span className="text-sm">Business analytics and insights</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Main Dashboard
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="mb-6">
              {/* Mobile Tab Navigation */}
              <div className="block sm:hidden">
                <TabsList className="grid w-full grid-cols-2 gap-1 h-auto p-1">
                  <TabsTrigger value="overview" className="text-xs py-3">Overview</TabsTrigger>
                  <TabsTrigger value="services" className="text-xs py-3" data-testid="services-section">Services</TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-2 gap-1 h-auto p-1 mt-1">
                  <TabsTrigger value="categories" className="text-xs py-3">Categories</TabsTrigger>
                  <TabsTrigger value="staff" className="text-xs py-3" data-testid="staff-tab">Staff</TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-2 gap-1 h-auto p-1 mt-1">
                  <TabsTrigger value="gallery" className="text-xs py-3">Media Gallery</TabsTrigger>
                  <TabsTrigger value="bookings" className="text-xs py-3" data-testid="bookings-tab">Bookings</TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-2 gap-1 h-auto p-1 mt-1">
                  <TabsTrigger value="offers" className="text-xs py-3">Offers</TabsTrigger>
                  <TabsTrigger value="faqs" className="text-xs py-3">FAQs</TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-2 gap-1 h-auto p-1 mt-1">
                  <TabsTrigger value="faqs" className="text-xs py-3">FAQs</TabsTrigger>
                  <TabsTrigger value="messages" className="text-xs py-3 relative">
                    Messages
                    {brandMessages.filter(msg => !msg.isRead).length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {brandMessages.filter(msg => !msg.isRead).length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-1 gap-1 h-auto p-1 mt-1">
                  <TabsTrigger value="settings" className="text-xs py-3" data-testid="settings-tab">Settings</TabsTrigger>
                </TabsList>
              </div>
              
              {/* Desktop Tab Navigation */}
              <div className="hidden sm:block">
                <TabsList className="grid w-full grid-cols-10 gap-1">
                  <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
                  <TabsTrigger value="services" className="text-sm">Services</TabsTrigger>
                  <TabsTrigger value="categories" className="text-sm">Categories</TabsTrigger>
                  <TabsTrigger value="staff" className="text-sm">Staff</TabsTrigger>
                  <TabsTrigger value="gallery" className="text-sm">Media Gallery</TabsTrigger>
                  <TabsTrigger value="bookings" className="text-sm">Bookings</TabsTrigger>
                  <TabsTrigger value="offers" className="text-sm">Offers</TabsTrigger>
                  <TabsTrigger value="faqs" className="text-sm">FAQs</TabsTrigger>
                  <TabsTrigger value="messages" className="text-sm relative">
                    Messages
                    {brandMessages.filter(msg => !msg.isRead).length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {brandMessages.filter(msg => !msg.isRead).length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="text-sm">Settings</TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <Button 
                      variant="outline" 
                      className="flex flex-col items-center justify-center p-4 sm:p-6 h-auto min-h-[120px] sm:min-h-[140px] w-full"
                      onClick={() => setActiveTab('services')}
                    >
                      <Scissors className="h-6 w-6 sm:h-8 sm:w-8 text-pink-600 mb-2 flex-shrink-0" />
                      <div className="text-center w-full px-2">
                        <p className="font-medium text-sm sm:text-base mb-1">Manage Services</p>
                        <p className="text-xs text-gray-600 leading-tight break-words">Add and organize your salon's services and pricing</p>
                      </div>
                    </Button>

                    <Link href="/owner/staff-slot-generator">
                      <Button 
                        variant="outline" 
                        className="flex flex-col items-center justify-center p-4 sm:p-6 h-auto min-h-[120px] sm:min-h-[140px] w-full"
                      >
                        <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mb-2 flex-shrink-0" />
                        <div className="text-center w-full px-2">
                          <p className="font-medium text-sm sm:text-base mb-1">Staff Time Slots</p>
                          <p className="text-xs text-gray-600 leading-tight break-words">Generate individual slots for each staff member</p>
                        </div>
                      </Button>
                    </Link>

                    <Button 
                      variant="outline" 
                      className="flex flex-col items-center justify-center p-4 sm:p-6 h-auto min-h-[120px] sm:min-h-[140px] w-full"
                      onClick={() => setPromoVideoDialogOpen(true)}
                    >
                      <Video className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mb-2 flex-shrink-0" />
                      <div className="text-center w-full px-2">
                        <p className="font-medium text-sm sm:text-base mb-1">Promotional Video</p>
                        <p className="text-xs text-gray-600 leading-tight break-words">Upload a video tour of your salon for customers</p>
                      </div>
                    </Button>
                  </div>
                  
                  <div>
                    <Link href="/owner/staff-management">
                      <Button 
                        variant="outline" 
                        className="flex flex-col items-center justify-center p-4 sm:p-6 h-auto min-h-[120px] sm:min-h-[140px] w-full"
                      >
                        <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mb-2 flex-shrink-0" />
                        <div className="text-center w-full px-2">
                          <p className="font-medium text-sm sm:text-base mb-1">Staff Management</p>
                          <p className="text-xs text-gray-600 leading-tight break-words">Manage staff schedules and service assignments</p>
                        </div>
                      </Button>
                    </Link>

                    <Link href="/owner/account-details">
                      <Button 
                        variant="outline" 
                        className="flex flex-col items-center justify-center p-4 sm:p-6 h-auto min-h-[120px] sm:min-h-[140px] w-full"
                      >
                        <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mb-2 flex-shrink-0" />
                        <div className="text-center w-full px-2">
                          <p className="font-medium text-sm sm:text-base mb-1">Account Details</p>
                          <p className="text-xs text-gray-600 leading-tight break-words">Setup bank account for payment transfers</p>
                        </div>
                      </Button>
                    </Link>

                    <Link href="/owner/confirmation-settings">
                      <Button 
                        variant="outline" 
                        className="flex flex-col items-center justify-center p-4 sm:p-6 h-auto min-h-[120px] sm:min-h-[140px] w-full"
                      >
                        <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mb-2 flex-shrink-0" />
                        <div className="text-center w-full px-2">
                          <p className="font-medium text-sm sm:text-base mb-1">Confirmation Fee</p>
                          <p className="text-xs text-gray-600 leading-tight break-words">Set your booking confirmation amount</p>
                        </div>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6" data-testid="salon-stats">
                <Card>
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center">
                      <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
                      <div className="ml-2 sm:ml-4 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Total Bookings</p>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{bookings.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center">
                      <IndianRupee className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
                      <div className="ml-2 sm:ml-4 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Monthly Revenue</p>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                          ₹{bookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center">
                      <Star className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 flex-shrink-0" />
                      <div className="ml-2 sm:ml-4 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Average Rating</p>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                          {salon.averageRating ? Number(salon.averageRating).toFixed(1) : "New"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center">
                      <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0" />
                      <div className="ml-2 sm:ml-4 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Team Members</p>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{staff.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Salon ID Card for Brand Invitations */}
              <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl flex items-center">
                    <Store className="h-5 w-5 mr-2 text-indigo-600" />
                    Salon ID for Brand Partners
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Your Salon ID</p>
                          <p className="text-lg font-mono bg-gray-100 px-3 py-1 rounded border select-all">
                            {salon?.id}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(salon?.id || '');
                            toast({
                              title: "Copied!",
                              description: "Salon ID copied to clipboard",
                            });
                          }}
                        >
                          Copy ID
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-2">
                      <p className="font-medium">📋 How to use this ID:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Share this ID with brand owners who want to partner with your salon</li>
                        <li>Brand owners can use this ID to send you partnership invitations</li>
                        <li>You'll receive notifications about partnership requests in your dashboard</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Brand Invitations */}
              {brandInvitations.length > 0 && (
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg sm:text-xl flex items-center justify-between">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 mr-2 text-purple-600" />
                        Brand Partnership Requests
                      </div>
                      <Badge variant="secondary">{brandInvitations.filter(inv => inv.status === 'pending').length} pending</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {invitationsLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {brandInvitations.map((invitation) => (
                          <div key={invitation.id} className="bg-white p-4 rounded-lg border">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-gray-900">
                                    {invitation.brandName || 'Brand Owner'}
                                  </h4>
                                  <Badge 
                                    variant={
                                      invitation.status === 'pending' ? 'outline' :
                                      invitation.status === 'accepted' ? 'default' : 'destructive'
                                    }
                                  >
                                    {invitation.status}
                                  </Badge>
                                </div>
                                {invitation.message && (
                                  <p className="text-sm text-gray-600 mb-3">
                                    "{invitation.message}"
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">
                                  Received: {new Date(invitation.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              {invitation.status === 'pending' && (
                                <div className="flex gap-2 ml-4">
                                  <Button
                                    size="sm"
                                    onClick={() => respondToInvitationMutation.mutate({ 
                                      invitationId: invitation.id, 
                                      status: 'accepted' 
                                    })}
                                    disabled={respondToInvitationMutation.isPending}
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => respondToInvitationMutation.mutate({ 
                                      invitationId: invitation.id, 
                                      status: 'rejected' 
                                    })}
                                    disabled={respondToInvitationMutation.isPending}
                                  >
                                    Decline
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Recent Bookings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Recent Bookings
                    <Badge variant="secondary">{bookings.length} total</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  ) : bookings.length > 0 ? (
                    <div className="space-y-4">
                      {bookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-gray-900">
                                {booking.service?.name || 'Service Booking'}
                              </p>
                              <Badge 
                                variant={
                                  booking.status === 'confirmed' ? 'default' :
                                  booking.status === 'completed' ? 'secondary' :
                                  booking.status === 'cancelled' ? 'destructive' : 'outline'
                                }
                              >
                                {booking.status}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-600">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {new Date(booking.date).toLocaleDateString('en-US', { 
                                  weekday: 'short',
                                  month: 'short', 
                                  day: 'numeric'
                                })} at {booking.startTime} - {booking.endTime}
                              </p>
                              {booking.customer?.name && (
                                <p className="text-sm text-gray-600">
                                  Customer: {booking.customer.name}
                                </p>
                              )}
                              {booking.staff?.name && (
                                <p className="text-sm text-gray-600">
                                  Staff: {booking.staff.name}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-lg font-semibold text-green-600">
                              ₹{booking.totalAmount}
                            </p>
                            <p className="text-xs text-gray-500">
                              {booking.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No bookings yet. Customers will appear here once they book your services.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Services & Pricing
                    <Button onClick={() => {
                      setEditingItem(null);
                      serviceForm.reset();
                      setServiceDialogOpen(true);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Service
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {servicesLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  ) : services.length > 0 ? (
                    <div className="space-y-4">
                      {services.map((service) => (
                        <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-semibold">{service.name}</h3>
                            <p className="text-sm text-gray-600">{service.description}</p>
                            <div className="flex items-center mt-1 text-sm text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {service.duration} mins
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <div className="text-lg font-semibold text-green-600">₹{service.price}</div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditService(service)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteService(service)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No services added yet. Add your first service to start accepting bookings.</p>
                      <Button onClick={() => {
                        setEditingItem(null);
                        serviceForm.reset();
                        setServiceDialogOpen(true);
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Service
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">Service Categories</CardTitle>
                      <CardDescription>
                        Organize your services into categories to help customers find what they need
                      </CardDescription>
                    </div>
                    <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={() => {
                          setEditingItem(null);
                          categoryForm.reset({
                            name: "",
                            description: "",
                            icon: "Scissors",
                            color: "#3B82F6",
                          });
                        }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Category
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>
                            {editingItem ? "Edit Category" : "Add New Category"}
                          </DialogTitle>
                          <DialogDescription>
                            Create categories to organize your services and help customers navigate your offerings
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...categoryForm}>
                          <form onSubmit={categoryForm.handleSubmit((data) => {
                            categoryMutation.mutate(data);
                          })}>
                            <div className="space-y-4">
                              <FormField
                                control={categoryForm.control}
                                name="name"
                                render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category Name *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      placeholder="e.g., Hair Care, Facial Treatments, Nail Services"
                                      data-testid="input-category-name"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={categoryForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description (Optional)</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      {...field} 
                                      placeholder="Brief description of services in this category"
                                      rows={2}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={categoryForm.control}
                                name="icon"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Icon *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Choose an icon" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="Scissors">✂️ Scissors</SelectItem>
                                        <SelectItem value="Sparkles">✨ Sparkles</SelectItem>
                                        <SelectItem value="Palette">🎨 Palette</SelectItem>
                                        <SelectItem value="Heart">❤️ Heart</SelectItem>
                                        <SelectItem value="Star">⭐ Star</SelectItem>
                                        <SelectItem value="Crown">👑 Crown</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={categoryForm.control}
                                name="color"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Color *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Choose a color" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="#3B82F6">🔵 Blue</SelectItem>
                                        <SelectItem value="#10B981">🟢 Green</SelectItem>
                                        <SelectItem value="#F59E0B">🟡 Yellow</SelectItem>
                                        <SelectItem value="#EF4444">🔴 Red</SelectItem>
                                        <SelectItem value="#8B5CF6">🟣 Purple</SelectItem>
                                        <SelectItem value="#EC4899">🩷 Pink</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2 mt-6">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setCategoryDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" data-testid="button-save-category">
                              {editingItem ? "Update Category" : "Add Category"}
                            </Button>
                          </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {serviceCategories.length === 0 ? (
                    <div className="text-center py-12">
                      <Tags className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
                      <p className="text-gray-600 mb-4">
                        Create categories to organize your services and make them easier for customers to find
                      </p>
                      <Button onClick={() => setCategoryDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Category
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {serviceCategories.map((category) => (
                        <Card key={category.id} className="p-4">
                          <div className="flex items-start space-x-3">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                              style={{ backgroundColor: category.color || '#3B82F6' }}
                            >
                              {category.icon === 'Scissors' ? '✂️' : 
                               category.icon === 'Sparkles' ? '✨' : 
                               category.icon === 'Palette' ? '🎨' :
                               category.icon === 'Heart' ? '❤️' :
                               category.icon === 'Star' ? '⭐' : 
                               category.icon === 'Crown' ? '👑' : '💫'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 truncate" data-testid={`text-category-name-${category.id}`}>
                                {category.name}
                              </h3>
                              {category.description && (
                                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                              )}
                              <div className="flex justify-end space-x-2 mt-3">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setEditingItem(category);
                                    categoryForm.reset({
                                      name: category.name,
                                      description: category.description || "",
                                      icon: category.icon || "Scissors",
                                      color: category.color || "#3B82F6",
                                    });
                                    setCategoryDialogOpen(true);
                                  }}
                                  data-testid={`button-edit-category-${category.id}`}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete "${category.name}"? Services in this category will become uncategorized.`)) {
                                      // Add delete mutation here
                                      console.log('Delete category:', category.id);
                                    }
                                  }}
                                  data-testid={`button-delete-category-${category.id}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="staff" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Team Management
                    <Button onClick={() => {
                      setEditingItem(null);
                      staffForm.reset();
                      setStaffDialogOpen(true);
                    }}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Staff
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {staffLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  ) : staff.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {staff.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              {member.photoUrl ? (
                                <img 
                                  src={member.photoUrl.startsWith('/objects/') ? member.photoUrl : `/objects/uploads/${member.photoUrl}`} 
                                  alt={member.name} 
                                  className="w-12 h-12 rounded-full object-cover" 
                                />
                              ) : (
                                <Users className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold">{member.name}</h4>
                              <p className="text-sm text-gray-600">{member.role}</p>
                              {member.phone && (
                                <p className="text-xs text-gray-500">{member.phone}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditStaff(member)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No staff members added yet. Add your team to help customers choose their preferred stylist.</p>
                      <Button onClick={() => {
                        setEditingItem(null);
                        staffForm.reset();
                        setStaffDialogOpen(true);
                      }}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Your First Team Member
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

            </TabsContent>

            <TabsContent value="gallery" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Media Gallery Management
                    <Button asChild>
                      <Link href="/shopkeeper/media-gallery">
                        <Camera className="h-4 w-4 mr-2" />
                        Open Media Gallery
                      </Link>
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Manage your salon photos and videos (up to 50 files). Upload high-quality images to showcase your work.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 space-y-6">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                      <Camera className="h-10 w-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Enhanced Media Gallery</h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        Upload up to 50 photos and videos to showcase your salon's work. 
                        Support for images and videos with advanced categorization and management.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg mx-auto text-sm text-gray-600">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        50 files limit
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Photos & Videos
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Categories
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        100MB per file
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Drag & Drop
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Cloud Storage
                      </div>
                    </div>
                    <Button size="lg" asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                      <Link href="/shopkeeper/media-gallery">
                        <Camera className="h-5 w-5 mr-2" />
                        Access Media Gallery
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings" className="space-y-6">
              {/* Booking Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Calendar className="h-8 w-8 text-blue-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Today's Bookings</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {bookings.filter(b => b.date === new Date().toISOString().split('T')[0]).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Clock className="h-8 w-8 text-orange-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Pending</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {bookings.filter(b => b.status === 'pending').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Completed</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {bookings.filter(b => b.status === 'completed').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <IndianRupee className="h-8 w-8 text-purple-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ₹{bookings
                            .filter(b => b.date === new Date().toISOString().split('T')[0])
                            .reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0)
                            .toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* All Bookings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    All Bookings
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        Filter by Date
                      </Button>
                      <Button variant="outline" size="sm">
                        Export
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  ) : bookings.length > 0 ? (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-start space-x-4 flex-1">
                            {/* Customer Profile Picture */}
                            <div className="flex-shrink-0">
                              {booking.isWalkIn ? (
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="h-6 w-6 text-gray-500" />
                                </div>
                              ) : booking.customer?.id ? (
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-6 w-6 text-primary" />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-6 w-6 text-primary" />
                                </div>
                              )}
                            </div>
                            
                            {/* Booking Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {booking.isWalkIn 
                                      ? booking.walkInCustomerName 
                                      : booking.customer?.name || 'Customer'
                                    }
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Booking #{booking.id.slice(0, 8)}
                                  </p>
                                </div>
                                <Badge 
                                  variant={
                                    booking.groupStatus === 'confirmed' ? 'default' :
                                    booking.groupStatus === 'completed' ? 'secondary' :
                                    booking.groupStatus.includes('cancelled') ? 'destructive' : 'outline'
                                  }
                                >
                                  {booking.groupStatus}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Service{booking.servicesCount > 1 ? 's' : ''}:</span> 
                                  {booking.servicesList ? 
                                    booking.servicesList.join(', ') + 
                                    (booking.servicesCount > 1 ? ` (${booking.servicesCount} services)` : '') :
                                    (booking.service?.name || 'Service')
                                  }
                                </div>
                                <div>
                                  <span className="font-medium">Appointment:</span> {booking.date}
                                  <div className="text-xs text-gray-500 mt-1">
                                    Booked: {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric' 
                                    }) : 'Unknown'}
                                  </div>
                                </div>
                                <div>
                                  <span className="font-medium">Time:</span> {booking.startTime} - {booking.endTime}
                                </div>
                                <div>
                                  <span className="font-medium">Amount:</span> ₹{booking.totalGroupAmount || booking.totalAmount}
                                </div>
                                <div>
                                  <span className="font-medium">Payment:</span> 
                                  <Badge variant="outline" className="ml-1">
                                    {booking.paymentStatus || 'Pending'}
                                  </Badge>
                                </div>
                              </div>
                              {booking.isWalkIn && booking.walkInCustomerPhone && (
                                <p className="text-sm text-gray-500 mt-1">
                                  Phone: {booking.walkInCustomerPhone}
                                </p>
                              )}
                              {!booking.isWalkIn && booking.customer?.phone && (
                                <p className="text-sm text-gray-500 mt-1">
                                  Phone: {booking.customer.phone}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {booking.status === 'confirmed' && (
                              <Button 
                                size="sm" 
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => completeBooking(booking.id)}
                                disabled={updateBookingStatusMutation.isPending}
                              >
                                Mark Complete
                              </Button>
                            )}
                            {booking.status === 'completed' && (
                              <Badge variant="secondary" className="px-3 py-1">
                                Service Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
                      <p className="text-gray-600 mb-6">Customers will appear here once they book your services.</p>
                      <div className="space-y-2 text-sm text-gray-500">
                        <p>• Make sure your services are listed with competitive pricing</p>
                        <p>• Add attractive salon photos and descriptions</p>
                        <p>• Configure your working hours and time slots</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      className="h-16 flex-col space-y-2"
                      onClick={() => window.location.href = '/owner/walk-in-bookings'}
                    >
                      <UserPlus className="h-6 w-6" />
                      <span>Add Walk-in Customer</span>
                    </Button>
                    <Button variant="outline" className="h-16 flex-col space-y-2">
                      <Calendar className="h-6 w-6" />
                      <span>Block Time Slot</span>
                    </Button>
                    <Button variant="outline" className="h-16 flex-col space-y-2">
                      <BarChart3 className="h-6 w-6" />
                      <span>View Reports</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="offers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Percent className="h-5 w-5 mr-2" />
                      Promotional Offers Management
                    </div>
                    <Link href="/shopkeeper/offers">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Offer
                      </Button>
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    Create and manage special offers to attract more customers to your salon
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Percent className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Your Offers</h3>
                    <p className="text-gray-600 mb-6">
                      Click "Create New Offer" to set up promotional campaigns for your services.
                      You can create percentage-based or fixed-amount discounts with custom validity periods.
                    </p>
                    <Link href="/shopkeeper/offers">
                      <Button>
                        <Percent className="h-4 w-4 mr-2" />
                        Go to Offers Management
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Brand Messages
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Messages from your brand owner
                  </p>
                </CardHeader>
                <CardContent>
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : brandMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No messages yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {brandMessages.map((message: any) => (
                        <div 
                          key={message.id} 
                          className={`border rounded-lg p-4 transition-colors ${
                            !message.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-purple-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">Brand Owner</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(message.createdAt).toLocaleDateString()} at {' '}
                                  {new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {message.priority === 'high' && (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                              {message.priority === 'medium' && (
                                <Clock className="h-4 w-4 text-yellow-500" />
                              )}
                              {!message.isRead && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markMessageAsReadMutation.mutate(message.id)}
                                  disabled={markMessageAsReadMutation.isPending}
                                >
                                  Mark as Read
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="ml-10">
                            <p className="text-gray-700 leading-relaxed">{message.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="faqs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Frequently Asked Questions
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {faqs.length}/10 FAQs
                      </span>
                      <Button 
                        onClick={() => {
                          if (faqs.length >= 10) {
                            toast({
                              title: "Limit Reached",
                              description: "You can have maximum 10 FAQs to maintain customer focus",
                              variant: "destructive",
                            });
                            return;
                          }
                          setEditingItem(null);
                          setFaqDialogOpen(true);
                        }}
                        disabled={faqs.length >= 10}
                        size="sm"
                        data-testid="button-add-faq"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add FAQ
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Help customers by answering common questions about your salon. This builds trust and reduces repetitive inquiries. You can add up to 10 FAQs.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {faqsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  ) : faqs.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="rounded-full bg-blue-50 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                        <HelpCircle className="h-6 w-6 text-blue-500" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No FAQs yet</h3>
                      <p className="text-gray-600 mb-4">
                        Add frequently asked questions to help your customers and build trust.
                      </p>
                      <Button 
                        onClick={() => {
                          setEditingItem(null);
                          setFaqDialogOpen(true);
                        }}
                        data-testid="button-add-first-faq"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Your First FAQ
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {faqs.map((faq: any, index: number) => (
                        <div key={faq.id} className="border rounded-lg p-4" data-testid={`faq-item-${faq.id}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded">
                                  Q{index + 1}
                                </span>
                                {!faq.isActive && (
                                  <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <h4 className="font-medium text-gray-900 mb-2" data-testid={`faq-question-${faq.id}`}>
                                {faq.question}
                              </h4>
                              <p className="text-gray-600 text-sm leading-relaxed" data-testid={`faq-answer-${faq.id}`}>
                                {faq.answer}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingItem(faq);
                                  setFaqDialogOpen(true);
                                }}
                                data-testid={`button-edit-faq-${faq.id}`}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this FAQ?")) {
                                    deleteFaqMutation.mutate(faq.id);
                                  }
                                }}
                                disabled={deleteFaqMutation.isPending}
                                data-testid={`button-delete-faq-${faq.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Salon Settings
                    <Button onClick={() => {
                      salonForm.reset({
                        name: salon?.name || "",
                        description: salon?.description || "",
                        phone: salon?.phone || "",
                        address: salon?.address || "",
                        latitude: parseFloat(salon?.latitude as string) || 0,
                        longitude: parseFloat(salon?.longitude as string) || 0,
                        imageUrl: salon?.imageUrl || "",
                        instagramId: salon?.instagramId || "",
                        confirmationAmount: salon?.confirmationAmount || 0,
                      });
                      setSalonDialogOpen(true);
                    }}>
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Salon
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{salon.name}</h3>
                      <p className="text-gray-600 mb-4">{salon.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {salon.phone}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          {salon.address}
                        </div>
                        <div className="flex items-center">
                          <IndianRupee className="h-4 w-4 mr-2 text-gray-400" />
                          Confirmation Amount: ₹{salon.confirmationAmount || 0}
                        </div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 mr-2 text-gray-400" />
                          Rating: {salon.averageRating ? Number(salon.averageRating).toFixed(1) : "New"} ({salon.totalReviews} reviews)
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Working Hours Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Working Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workingHoursLoading ? (
                      // Loading state
                      ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <div key={day} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </div>
                      ))
                    ) : (
                      ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                        const dayHours = getWorkingHoursForDay(day);
                        return (
                          <div key={day} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="font-medium">{day}</div>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className={`text-sm ${dayHours.isOpen ? 'text-gray-600' : 'text-red-500'}`}>
                                  {dayHours.hours}
                                </span>
                              </div>
                              <Switch checked={dayHours.isOpen} disabled />
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div className="pt-4 border-t space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => setEditingWorkingHours(true)}
                        data-testid="button-configure-salon-hours"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configure Salon Hours
                      </Button>
                      <Link href="/owner/staff-schedule">
                        <Button variant="ghost" className="w-full text-sm" data-testid="button-configure-staff-schedule">
                          <Users className="h-4 w-4 mr-2" />
                          Manage Staff Schedules
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Business Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        ₹{bookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-green-600">This Month Revenue</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{bookings.length}</div>
                      <div className="text-sm text-blue-600">Total Bookings</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {salon.averageRating ? Number(salon.averageRating).toFixed(1) : "New"}
                      </div>
                      <div className="text-sm text-purple-600">Average Rating</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{staff.length}</div>
                      <div className="text-sm text-orange-600">Team Members</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Salon Form Dialog */}
      <Dialog open={salonDialogOpen} onOpenChange={setSalonDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{salon ? "Edit Salon" : "Create Salon Profile"}</DialogTitle>
            <DialogDescription>
              {salon ? "Update your salon information" : "Create your salon profile to start receiving bookings"}
            </DialogDescription>
          </DialogHeader>
          <Form {...salonForm}>
            <form onSubmit={salonForm.handleSubmit((data) => {
              console.log("Form submitted with data:", data);
              salonMutation.mutate(data);
            })} className="space-y-4">
              <FormField
                control={salonForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salon Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Salon Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={salonForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell customers about your salon..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={salonForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="9876543210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={salonForm.control}
                  name="confirmationAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmation Amount (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="20" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={salonForm.control}
                name="instagramId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram ID (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="yourhandle (without @)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={salonForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Full address with area and city..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location Picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Mark Your Shop Location on Map *
                </label>
                <p className="text-sm text-muted-foreground">
                  Required: Help customers find your exact location by marking it on the map
                </p>
                <LeafletLocationPicker
                  initialLat={salon?.latitude ? Number(salon.latitude) : undefined}
                  initialLng={salon?.longitude ? Number(salon.longitude) : undefined}
                  onLocationSelect={(lat, lng) => {
                    setSalonLocation({ lat, lng });
                    salonForm.setValue('latitude', lat);
                    salonForm.setValue('longitude', lng);
                  }}
                  disabled={false}
                />
              </div>
              
              <FormField
                control={salonForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salon Image</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <Input 
                          placeholder="Or paste image URL..." 
                          {...field} 
                        />
                        <div className="flex items-center justify-center">
                          <span className="text-sm text-gray-500">OR</span>
                        </div>
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={10485760}
                          onGetUploadParameters={async () => {
                            const response = await fetch('/api/objects/upload', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                            });
                            const data = await response.json();
                            return {
                              method: 'PUT' as const,
                              url: data.uploadURL,
                            };
                          }}
                          onComplete={async (result) => {
                            if (result.successful && result.successful.length > 0) {
                              const uploadURL = result.successful[0].uploadURL;
                              if (uploadURL) {
                                try {
                                  // Set ACL policy for the uploaded image
                                  const response = await fetch('/api/salon-images', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ imageUrl: uploadURL }),
                                  });
                                  
                                  if (response.ok) {
                                    const data = await response.json();
                                    field.onChange(data.objectPath);
                                  } else {
                                    field.onChange(uploadURL);
                                  }
                                  
                                  toast({
                                    title: "Image uploaded successfully",
                                    description: "Your salon image has been uploaded.",
                                  });
                                } catch (error) {
                                  console.error("Error setting image ACL:", error);
                                  field.onChange(uploadURL);
                                  toast({
                                    title: "Image uploaded successfully",
                                    description: "Your salon image has been uploaded.",
                                  });
                                }
                              }
                            }
                          }}
                          buttonClassName="w-full"
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <Upload className="h-4 w-4" />
                            <span>Upload Image from Gallery</span>
                          </div>
                        </ObjectUploader>
                        {field.value && (
                          <div className="mt-4">
                            <img 
                              src={field.value} 
                              alt="Salon preview" 
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setSalonDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={salonMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {salonMutation.isPending ? "Saving..." : (salon ? "Update Salon" : "Create Salon")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Service Form Dialog */}
      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Service" : "Add New Service"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update service details and pricing" : "Add a new service to your salon menu"}
            </DialogDescription>
          </DialogHeader>
          <Form {...serviceForm}>
            <form onSubmit={serviceForm.handleSubmit((data) => serviceMutation.mutate(data))} className="space-y-4">
              <FormField
                control={serviceForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Haircut, Facial, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={serviceForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe this service..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Service Category Selection - Always show with option to create categories */}
              <FormField
                control={serviceForm.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={serviceCategories.length > 0 ? "Select a category (optional)" : "No categories yet - leave uncategorized"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Category</SelectItem>
                        {serviceCategories.length > 0 ? (
                          serviceCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-4 h-4 rounded-full flex items-center justify-center text-xs"
                                  style={{ backgroundColor: category.color || '#3B82F6' }}
                                >
                                  {category.icon === 'Scissors' ? '✂️' : 
                                   category.icon === 'Sparkles' ? '✨' : 
                                   category.icon === 'Palette' ? '🎨' :
                                   category.icon === 'Heart' ? '❤️' :
                                   category.icon === 'Star' ? '⭐' : '💫'}
                                </div>
                                <span>{category.name}</span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="create-first" disabled>
                            <span className="text-gray-500 italic">Create categories first to organize services</span>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={serviceForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₹) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="500" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={serviceForm.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (mins) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="30" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setServiceDialogOpen(false);
                  setEditingItem(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={serviceMutation.isPending}>
                  {serviceMutation.isPending ? "Saving..." : (editingItem ? "Update Service" : "Add Service")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Staff Form Dialog */}
      <Dialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Staff Member" : "Add New Staff Member"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update staff member information" : "Add a new team member to your salon"}
            </DialogDescription>
          </DialogHeader>
          <Form {...staffForm}>
            <form onSubmit={staffForm.handleSubmit((data) => staffMutation.mutate(data))} className="space-y-4">
              <FormField
                control={staffForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Staff member name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={staffForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <FormControl>
                      <Input placeholder="Hair Stylist, Makeup Artist, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={staffForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="9876543210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={staffForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="staff@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={staffForm.control}
                name="photoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Picture</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        {field.value && (
                          <div className="flex items-center space-x-4">
                            <img 
                              src={field.value} 
                              alt="Staff preview" 
                              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => field.onChange('')}
                            >
                              Remove Photo
                            </Button>
                          </div>
                        )}
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5242880} // 5MB
                          onGetUploadParameters={async () => {
                            const response = await apiRequest('POST', '/api/objects/upload');
                            const data = await response.json();
                            return {
                              method: 'PUT' as const,
                              url: data.uploadURL,
                            };
                          }}
                          onComplete={(result) => {
                            console.log('Staff photo upload completed:', result);
                            if (result.successful && result.successful.length > 0) {
                              const uploadedFile = result.successful[0];
                              const imageUrl = uploadedFile.uploadURL;
                              console.log('Uploaded file URL:', imageUrl);
                              
                              if (imageUrl) {
                                // Convert Google Storage URL to our object path format
                                let finalUrl = imageUrl;
                                if (imageUrl.startsWith('https://storage.googleapis.com/')) {
                                  // Extract path and convert to /objects/ format
                                  const url = new URL(imageUrl);
                                  const pathParts = url.pathname.split('/');
                                  console.log('URL path parts:', pathParts);
                                  if (pathParts.length >= 4) {
                                    // Extract bucket and object path - avoid double "uploads" 
                                    const objectPath = pathParts.slice(3).join('/');
                                    console.log('Extracted object path:', objectPath);
                                    // Don't add "/uploads/" if it already starts with "uploads/"
                                    if (objectPath.startsWith('uploads/')) {
                                      finalUrl = `/objects/${objectPath}`;
                                    } else {
                                      finalUrl = `/objects/uploads/${objectPath}`;
                                    }
                                  }
                                }
                                
                                console.log('Final URL being set:', finalUrl);
                                field.onChange(finalUrl);
                                toast({
                                  title: "Photo uploaded!",
                                  description: "Staff profile picture has been uploaded successfully.",
                                });
                              }
                            }
                          }}
                          buttonClassName="w-full"
                        >
                          <div className="flex items-center gap-2">
                            <Camera className="h-4 w-4" />
                            <span>{field.value ? 'Change Photo' : 'Upload Photo'}</span>
                          </div>
                        </ObjectUploader>
                        <p className="text-xs text-gray-500">
                          Upload a profile picture for this staff member (max 5MB)
                        </p>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setStaffDialogOpen(false);
                  setEditingItem(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={staffMutation.isPending}>
                  {staffMutation.isPending ? "Saving..." : (editingItem ? "Update Staff" : "Add Staff")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Gallery Form Dialog */}
      <Dialog open={galleryDialogOpen} onOpenChange={setGalleryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Gallery Image" : "Add Gallery Image"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update image details" : "Upload and describe your image"}
            </DialogDescription>
          </DialogHeader>
          <Form {...galleryForm}>
            <form onSubmit={galleryForm.handleSubmit((data) => {
              // For editing, just update the metadata without re-uploading
              if (editingItem) {
                galleryMutation.mutate({
                  ...data,
                  imageUrl: editingItem.imageUrl,
                });
              }
              // For new images, the upload will handle submission via handleGalleryUploadComplete
            })} className="space-y-4">
              {!editingItem && (
                <div>
                  <label className="text-sm font-medium">Upload Image</label>
                  <div className="mt-2">
                    <ObjectUploader
                      onGetUploadParameters={handleGalleryUpload}
                      onComplete={handleGalleryUploadComplete}
                      maxFileSize={10485760} // 10MB
                      buttonClassName="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Image
                    </ObjectUploader>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Max 10MB. JPG, PNG supported.</p>
                </div>
              )}

              <FormField
                control={galleryForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Hair Styling, Bridal Makeup" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={galleryForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe this work..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={galleryForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="work">Work Samples</SelectItem>
                        <SelectItem value="staff">Team Photos</SelectItem>
                        <SelectItem value="interior">Salon Interior</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {editingItem && (
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setGalleryDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={galleryMutation.isPending}>
                    {galleryMutation.isPending ? "Updating..." : "Update Image"}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Promotional Video Upload Dialog */}
      <Dialog open={promoVideoDialogOpen} onOpenChange={setPromoVideoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Promotional Video</DialogTitle>
            <DialogDescription>
              Add a video tour of your salon to give customers a preview of your professional atmosphere
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {salon?.promotionalVideoUrl && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Video</label>
                <div className="relative rounded-lg overflow-hidden bg-black">
                  <video 
                    src={salon.promotionalVideoUrl} 
                    className="w-full max-h-48 object-contain"
                    poster=""
                    autoPlay
                    loop
                    muted
                    playsInline
                    onError={() => {
                      console.log("Video failed to load, attempting to fix permissions...");
                      fixPromoVideoAclMutation.mutate();
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
                  />
                  
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
                      className="bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"
                      data-testid="owner-video-play-pause-button"
                    >
                      <Video className="h-3 w-3" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const video = e.currentTarget.parentElement?.parentElement?.querySelector('video');
                        if (video) {
                          video.muted = !video.muted;
                        }
                      }}
                      className="bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"
                      data-testid="owner-video-audio-button"
                    >
                      {/* Audio icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6 10l4-4v12l-4-4H3a1 1 0 01-1-1v-2a1 1 0 011-1h3z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fixPromoVideoAclMutation.mutate()}
                  disabled={fixPromoVideoAclMutation.isPending}
                  className="text-xs"
                >
                  {fixPromoVideoAclMutation.isPending ? "Fixing..." : "Fix Video Permissions"}
                </Button>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium">
                {salon?.promotionalVideoUrl ? 'Replace Video' : 'Upload Video'}
              </label>
              <div className="mt-2">
                <ObjectUploader
                  onGetUploadParameters={async () => {
                    const response = await apiRequest("POST", "/api/objects/upload");
                    const data = await response.json();
                    return {
                      method: 'PUT' as const,
                      url: data.uploadURL,
                    };
                  }}
                  onComplete={(result) => {
                    if (result.successful && result.successful.length > 0) {
                      const uploadURL = result.successful[0].uploadURL;
                      updatePromoVideoMutation.mutate(uploadURL);
                    }
                  }}
                  maxFileSize={100 * 1024 * 1024} // 100MB for videos
                  buttonClassName="w-full"
                >
                  <Video className="h-4 w-4 mr-2" />
                  {salon?.promotionalVideoUrl ? 'Replace Video' : 'Choose Video'}
                </ObjectUploader>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Upload MP4, WebM, or MOV files up to 100MB. Keep videos under 2 minutes for best customer experience.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* FAQ Form Dialog */}
      <Dialog open={faqDialogOpen} onOpenChange={setFaqDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit FAQ" : "Add New FAQ"}</DialogTitle>
            <DialogDescription>
              {editingItem 
                ? "Update this frequently asked question and its answer." 
                : `Add a helpful question and answer (${faqs.length}/10 FAQs used).`
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...faqForm}>
            <form onSubmit={faqForm.handleSubmit(async (values) => {
                if (editingItem) {
                  updateFaqMutation.mutate({ ...values, id: editingItem.id });
                } else {
                  createFaqMutation.mutate(values);
                }
              })} className="space-y-4">
                
                <FormField
                  control={faqForm.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="What customers frequently ask..."
                          className="min-h-[80px]"
                          data-testid="input-faq-question"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={faqForm.control}
                  name="answer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Answer</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Your helpful response..."
                          className="min-h-[100px]"
                          data-testid="input-faq-answer"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center space-x-2">
                  <FormField
                    control={faqForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                            data-testid="switch-faq-active"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Show to customers</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFaqDialogOpen(false)}
                    data-testid="button-cancel-faq"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createFaqMutation.isPending || updateFaqMutation.isPending}
                    data-testid="button-save-faq"
                  >
                    {createFaqMutation.isPending || updateFaqMutation.isPending ? "Saving..." : 
                     editingItem ? "Update FAQ" : "Add FAQ"}
                  </Button>
                </div>
              </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Working Hours Management Dialog */}
      <Dialog open={editingWorkingHours} onOpenChange={setEditingWorkingHours}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Configure Salon Working Hours</DialogTitle>
            <DialogDescription>
              Set your salon's opening and closing times for each day of the week
            </DialogDescription>
          </DialogHeader>
          <WorkingHoursForm 
            workingHours={workingHours}
            onSave={(hoursData) => updateWorkingHoursMutation.mutate(hoursData)}
            onCancel={() => setEditingWorkingHours(false)}
            isLoading={updateWorkingHoursMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Onboarding Walkthrough */}
      {shouldShowOnboarding && (
        <OnboardingWalkthrough
          steps={onboardingSteps}
          userType="salon-owner"
          onComplete={completeOnboarding}
          onSkip={skipOnboarding}
        />
      )}

    </div>
  );
}