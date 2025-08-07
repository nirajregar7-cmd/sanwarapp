import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { 
  Store, Users, Calendar, IndianRupee, Clock, Star, Plus, 
  Edit, Trash2, Eye, Phone, MapPin, TrendingUp, Activity,
  BarChart3, DollarSign, UserPlus, Settings, Scissors
} from "lucide-react";
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
      return apiRequest(endpoint, method, {
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
      return apiRequest(endpoint, method, data);
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
      return apiRequest(endpoint, method, data);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {salon ? salon.name : "Setup Your Salon"}
              </h1>
              <p className="text-gray-600">
                {salon ? "Manage your salon and grow your business" : "Create your salon profile to get started"}
              </p>
            </div>
            {!salon && (
              <Button onClick={() => setSalonDialogOpen(true)} size="lg">
                <Store className="h-4 w-4 mr-2" />
                Create Salon Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      {!salon ? (
        // Salon Setup Screen
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <Scissors className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Sanwar!</h2>
            <p className="text-lg text-gray-600">Let's set up your salon profile to start attracting customers</p>
          </div>
          
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Setup Your Salon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Complete your salon profile to appear on our platform and start receiving bookings from customers.
                  </p>
                  <Button onClick={() => setSalonDialogOpen(true)} size="lg" className="w-full">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
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

            <TabsContent value="bookings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Bookings</CardTitle>
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
                        <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">Customer Booking</p>
                            <p className="text-sm text-gray-600">
                              {booking.date} at {booking.startTime} - {booking.endTime}
                            </p>
                            <p className="text-xs text-gray-500">
                              Booking ID: {booking.id.slice(0, 8)}...
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
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Salon Form Dialog */}
      <Dialog open={salonDialogOpen} onOpenChange={setSalonDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{salon ? "Edit Salon" : "Create Salon Profile"}</DialogTitle>
          </DialogHeader>
          <Form {...salonForm}>
            <form onSubmit={salonForm.handleSubmit((data) => salonMutation.mutate(data))} className="space-y-4">
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
              
              <div className="grid grid-cols-2 gap-4">
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
                    <FormLabel>Salon Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/salon-image.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setSalonDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={salonMutation.isPending}>
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