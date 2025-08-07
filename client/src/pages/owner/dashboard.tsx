import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  BarChart3, DollarSign, UserPlus, Settings, Scissors, CheckCircle, Upload
} from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from '@uppy/core';
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Salon, Service, Staff, Booking, Review } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

const salonSchema = z.object({
  name: z.string().min(1, "Salon name is required"),
  description: z.string().optional(),
  phone: z.string().min(10, "Valid phone number required"),
  address: z.string().min(1, "Address is required"),
  imageUrl: z.string().optional(),
  confirmationAmount: z.number().min(0),
});

const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  price: z.number().min(1, "Price must be greater than 0"),
  duration: z.number().min(15, "Duration must be at least 15 minutes"),
});

const staffSchema = z.object({
  name: z.string().min(1, "Staff name is required"),
  role: z.string().min(1, "Role is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  photoUrl: z.string().optional(),
});

type SalonFormData = z.infer<typeof salonSchema>;
type ServiceFormData = z.infer<typeof serviceSchema>;
type StaffFormData = z.infer<typeof staffSchema>;

export default function OwnerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [salonDialogOpen, setSalonDialogOpen] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Fetch user's salon
  const { data: salon, isLoading: salonLoading } = useQuery<Salon>({
    queryKey: ['/api/owner/salon'],
    enabled: isAuthenticated,
  });

  // Fetch salon services
  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: [`/api/salons/${salon?.id}/services`],
    enabled: !!salon?.id,
  });

  // Fetch salon staff
  const { data: staff = [], isLoading: staffLoading } = useQuery<Staff[]>({
    queryKey: [`/api/salons/${salon?.id}/staff`],
    enabled: !!salon?.id,
  });

  // Fetch salon bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: [`/api/owner/bookings`],
    enabled: !!salon?.id,
  });

  // Fetch salon reviews
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: [`/api/salons/${salon?.id}/reviews`],
    enabled: !!salon?.id,
  });

  const salonForm = useForm<SalonFormData>({
    resolver: zodResolver(salonSchema),
    defaultValues: {
      name: salon?.name || "",
      description: salon?.description || "",
      phone: salon?.phone || "",
      address: salon?.address || "",
      imageUrl: salon?.imageUrl || "",
      confirmationAmount: salon?.confirmationAmount ? salon.confirmationAmount / 100 : 0,
    },
  });

  const serviceForm = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      duration: 30,
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

  // Salon mutation
  const salonMutation = useMutation({
    mutationFn: async (data: SalonFormData) => {
      const endpoint = salon ? `/api/salons/${salon.id}` : '/api/salons';
      const method = salon ? 'PUT' : 'POST';
      return apiRequest(method, endpoint, {
        ...data,
        confirmationAmount: data.confirmationAmount * 100, // Convert to paise
      });
    },
    onSuccess: () => {
      toast({
        title: salon ? "Salon Updated!" : "Salon Created!",
        description: salon ? "Your salon details have been updated." : "Your salon has been created successfully.",
      });
      setSalonDialogOpen(false);
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
      return apiRequest(method, endpoint, data);
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

  // Staff mutation
  const staffMutation = useMutation({
    mutationFn: async (data: StaffFormData) => {
      const endpoint = editingItem ? `/api/staff/${editingItem.id}` : `/api/salons/${salon?.id}/staff`;
      const method = editingItem ? 'PUT' : 'POST';
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
    });
    setServiceDialogOpen(true);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {salon ? salon.name : "Setup Your Salon"}
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                {salon ? "Manage your salon and grow your business" : "Create your salon profile to get started"}
              </p>
            </div>
            {!salon && (
              <Button 
                onClick={() => setSalonDialogOpen(true)} 
                size="lg"
                className="w-full sm:w-auto"
              >
                <Store className="h-4 w-4 mr-2" />
                Create Salon Profile
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="services" className="text-xs sm:text-sm">Services</TabsTrigger>
              <TabsTrigger value="staff" className="text-xs sm:text-sm">Staff</TabsTrigger>
              <TabsTrigger value="timeslots" className="text-xs sm:text-sm">Slots</TabsTrigger>
              <TabsTrigger value="bookings" className="text-xs sm:text-sm">Bookings</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      variant="outline" 
                      className="flex items-center justify-center p-6 h-auto"
                      onClick={() => window.location.href = '/owner/time-slots'}
                    >
                      <Clock className="h-8 w-8 text-indigo-600 mb-2" />
                      <div className="text-center">
                        <p className="font-medium">Manage Time Slots</p>
                        <p className="text-sm text-gray-600">Create and organize your salon's booking slots</p>
                      </div>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center justify-center p-6 h-auto"
                      onClick={() => setActiveTab('services')}
                    >
                      <Scissors className="h-8 w-8 text-pink-600 mb-2" />
                      <div className="text-center">
                        <p className="font-medium">Manage Services</p>
                        <p className="text-sm text-gray-600">Add or edit your salon's services and pricing</p>
                      </div>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center justify-center p-6 h-auto"
                      onClick={() => setActiveTab('staff')}
                    >
                      <UserPlus className="h-8 w-8 text-cyan-600 mb-2" />
                      <div className="text-center">
                        <p className="font-medium">Manage Staff</p>
                        <p className="text-sm text-gray-600">Add and organize your salon team</p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Calendar className="h-8 w-8 text-blue-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                        <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <IndianRupee className="h-8 w-8 text-green-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ₹{bookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Star className="h-8 w-8 text-yellow-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Average Rating</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {salon.averageRating ? Number(salon.averageRating).toFixed(1) : "New"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-purple-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Team Members</p>
                        <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

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
                        <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">Customer Booking</p>
                            <p className="text-sm text-gray-600">
                              {booking.date} at {booking.startTime}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={
                                booking.status === 'confirmed' ? 'default' :
                                booking.status === 'completed' ? 'secondary' :
                                booking.status === 'cancelled' ? 'destructive' : 'outline'
                              }
                            >
                              {booking.status}
                            </Badge>
                            <p className="text-sm font-medium text-green-600 mt-1">
                              ₹{booking.totalAmount}
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
                                <img src={member.photoUrl} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
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

            <TabsContent value="timeslots" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Time Slot Management
                    <Button onClick={() => {
                      // Generate time slots functionality
                      toast({
                        title: "Generating Time Slots",
                        description: "Time slots will be generated based on your working hours and service durations.",
                      });
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Generate Time Slots
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-blue-600 mr-2" />
                        <div>
                          <h4 className="font-medium text-blue-900">Automatic Time Slot Generation</h4>
                          <p className="text-sm text-blue-700">
                            Time slots are automatically created based on your working hours and service durations. 
                            Each service gets dedicated time slots to avoid conflicts.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Sample time slots display */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { time: "9:00 AM - 10:00 AM", service: "Haircut", available: true },
                        { time: "10:00 AM - 11:30 AM", service: "Facial", available: false },
                        { time: "11:30 AM - 12:30 PM", service: "Haircut", available: true },
                        { time: "2:00 PM - 3:00 PM", service: "Hair Styling", available: true },
                        { time: "3:00 PM - 4:30 PM", service: "Bridal Package", available: false },
                        { time: "4:30 PM - 5:30 PM", service: "Haircut", available: true },
                      ].map((slot, index) => (
                        <div key={index} className={`p-4 border rounded-lg ${
                          slot.available ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                        }`}>
                          <div className="font-medium">{slot.time}</div>
                          <div className="text-sm text-gray-600">{slot.service}</div>
                          <div className="mt-2">
                            <Badge variant={slot.available ? "default" : "secondary"}>
                              {slot.available ? "Available" : "Booked"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Time Slot Settings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Slot Duration
                          </label>
                          <Input defaultValue="30" type="number" className="w-full" />
                          <p className="text-xs text-gray-500 mt-1">Default duration in minutes</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Break Between Slots
                          </label>
                          <Input defaultValue="15" type="number" className="w-full" />
                          <p className="text-xs text-gray-500 mt-1">Minutes between appointments</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Advance Booking Days
                          </label>
                          <Input defaultValue="30" type="number" className="w-full" />
                          <p className="text-xs text-gray-500 mt-1">How many days in advance</p>
                        </div>
                      </div>
                    </div>
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
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium">Customer Booking #{booking.id.slice(0, 8)}</p>
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
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Date:</span> {booking.date}
                              </div>
                              <div>
                                <span className="font-medium">Time:</span> {booking.startTime} - {booking.endTime}
                              </div>
                              <div>
                                <span className="font-medium">Amount:</span> ₹{booking.totalAmount}
                              </div>
                              <div>
                                <span className="font-medium">Payment:</span> 
                                <Badge variant="outline" className="ml-1">
                                  {booking.paymentStatus || 'Pending'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {booking.status === 'pending' && (
                              <>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                  Confirm
                                </Button>
                                <Button variant="outline" size="sm">
                                  Cancel
                                </Button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                Mark Complete
                              </Button>
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
                    <Button className="h-16 flex-col space-y-2">
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
                        imageUrl: salon?.imageUrl || "",
                        confirmationAmount: salon?.confirmationAmount ? salon.confirmationAmount / 100 : 0,
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
                          Confirmation Amount: ₹{salon.confirmationAmount ? salon.confirmationAmount / 100 : 0}
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
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <div key={day} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="font-medium">{day}</div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">9:00 AM - 8:00 PM</span>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 border-t">
                      <Button variant="outline" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure Working Hours
                      </Button>
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
                    <FormLabel>Photo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/photo.jpg" {...field} />
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
    </div>
  );
}