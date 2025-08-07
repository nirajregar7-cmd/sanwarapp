import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import {
  CalendarCheck,
  IndianRupee,
  Star,
  Users,
  Plus,
  Edit,
  Trash2,
  Clock,
  Phone,
  MapPin,
  Camera,
  EllipsisVertical,
} from "lucide-react";
import type { Salon, Service, WorkingHours, Booking } from "@shared/schema";

export default function OwnerDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [showSalonForm, setShowSalonForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

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

  // Fetch user's salons
  const { data: salons, isLoading: salonsLoading, error: salonsError } = useQuery({
    queryKey: ["/api/salons/my"],
    retry: false,
    enabled: isAuthenticated,
  });

  // Fetch services for selected salon
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/salons", selectedSalon?.id, "services"],
    enabled: !!selectedSalon,
  });

  // Fetch working hours for selected salon
  const { data: workingHours, isLoading: workingHoursLoading } = useQuery({
    queryKey: ["/api/salons", selectedSalon?.id, "working-hours"],
    enabled: !!selectedSalon,
  });

  // Fetch bookings for selected salon
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/salons", selectedSalon?.id, "bookings"],
    enabled: !!selectedSalon,
  });

  // Handle unauthorized errors for queries
  useEffect(() => {
    if (salonsError && isUnauthorizedError(salonsError as Error)) {
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
  }, [salonsError, toast]);

  // Set default selected salon
  useEffect(() => {
    if (salons && salons.length > 0 && !selectedSalon) {
      setSelectedSalon(salons[0]);
    }
  }, [salons, selectedSalon]);

  // Mutations
  const createSalonMutation = useMutation({
    mutationFn: async (salonData: any) => {
      return apiRequest("POST", "/api/salons", salonData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Salon created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/salons/my"] });
      setShowSalonForm(false);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateSalonMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PUT", `/api/salons/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Salon updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/salons/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/salons", selectedSalon?.id] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: async (serviceData: any) => {
      return apiRequest("POST", `/api/salons/${selectedSalon?.id}/services`, serviceData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Service created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/salons", selectedSalon?.id, "services"] });
      setShowServiceForm(false);
      setEditingService(null);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PUT", `/api/services/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Service updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/salons", selectedSalon?.id, "services"] });
      setShowServiceForm(false);
      setEditingService(null);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/services/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Service deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/salons", selectedSalon?.id, "services"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateWorkingHoursMutation = useMutation({
    mutationFn: async (workingHourData: any) => {
      return apiRequest("POST", `/api/salons/${selectedSalon?.id}/working-hours`, workingHourData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Working hours updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/salons", selectedSalon?.id, "working-hours"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Image upload handlers
  const handleGetUploadParameters = async () => {
    const response = await fetch("/api/objects/upload", {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleImageUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful.length > 0 && selectedSalon) {
      const uploadURL = result.successful[0].uploadURL;
      try {
        await apiRequest("PUT", `/api/salons/${selectedSalon.id}/image`, { imageURL: uploadURL });
        toast({ title: "Success", description: "Salon image updated successfully!" });
        queryClient.invalidateQueries({ queryKey: ["/api/salons/my"] });
        queryClient.invalidateQueries({ queryKey: ["/api/salons", selectedSalon.id] });
      } catch (error) {
        toast({ title: "Error", description: "Failed to update salon image", variant: "destructive" });
      }
    }
  };

  // Form handlers
  const handleSalonSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const salonData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
    };

    if (selectedSalon) {
      updateSalonMutation.mutate({ id: selectedSalon.id, data: salonData });
    } else {
      createSalonMutation.mutate(salonData);
    }
  };

  const handleServiceSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const serviceData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: formData.get("price") as string,
      duration: parseInt(formData.get("duration") as string),
    };

    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, data: serviceData });
    } else {
      createServiceMutation.mutate(serviceData);
    }
  };

  const handleWorkingHoursSubmit = (dayOfWeek: number, workingHourData: any) => {
    updateWorkingHoursMutation.mutate({ ...workingHourData, dayOfWeek });
  };

  if (authLoading || salonsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-16 rounded-lg mb-4" />
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!salons || salons.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Sanwar</h1>
          <p className="text-gray-600 mb-8">Create your first salon to get started</p>
          <Button onClick={() => setShowSalonForm(true)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Create Salon
          </Button>
        </div>

        {/* Salon Creation Form */}
        {showSalonForm && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <h2 className="text-xl font-semibold">Create New Salon</h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSalonSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Salon Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={3} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" type="tel" />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" name="address" rows={2} required />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createSalonMutation.isPending}>
                    {createSalonMutation.isPending ? "Creating..." : "Create Salon"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowSalonForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const todayBookings = bookings?.filter((booking: Booking) => 
    booking.date === new Date().toISOString().split('T')[0]
  ) || [];

  const todayRevenue = todayBookings.reduce((sum, booking) => 
    sum + parseFloat(booking.totalAmount), 0
  );

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Salon Dashboard</h1>
        <p className="text-gray-600">Manage your salon operations</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Today's Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{todayBookings.length}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <CalendarCheck className="text-primary text-2xl h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Today's Revenue</p>
                <p className="text-3xl font-bold text-gray-900">₹{todayRevenue.toFixed(0)}</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-lg">
                <IndianRupee className="text-accent text-2xl h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Average Rating</p>
                <p className="text-3xl font-bold text-gray-900">
                  {selectedSalon?.averageRating ? Number(selectedSalon.averageRating).toFixed(1) : "0.0"}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="text-yellow-500 text-2xl h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{bookings?.length || 0}</p>
              </div>
              <div className="p-3 bg-secondary/10 rounded-lg">
                <Users className="text-secondary text-2xl h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Bookings & Schedule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Today's Schedule</h2>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Slot
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayBookings.length > 0 ? (
                  todayBookings.map((booking: Booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Customer #{booking.customerId.slice(-6)}</p>
                          <p className="text-sm text-gray-600">Service Booking</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{booking.startTime}</p>
                        <p className="text-sm text-gray-600">₹{booking.totalAmount}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={booking.status === "confirmed" ? "bg-accent text-white" : "bg-yellow-100 text-yellow-800"}>
                          {booking.status === "confirmed" ? "Confirmed" : "Pending"}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <EllipsisVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No bookings scheduled for today</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Services Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Services & Pricing</h2>
                <Button onClick={() => setShowServiceForm(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services?.map((service: Service) => (
                  <div key={service.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{service.name}</h3>
                      <p className="text-sm text-gray-600">{service.description}</p>
                      <p className="text-xs text-gray-500">Duration: {service.duration} minutes</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-semibold text-primary">₹{service.price}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEditingService(service);
                            setShowServiceForm(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteServiceMutation.mutate(service.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Salon Profile & Settings */}
        <div className="space-y-6">
          {/* Salon Profile */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Salon Profile</h2>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <img 
                  src={selectedSalon?.imageUrl || "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=120"} 
                  alt="Salon" 
                  className="w-24 h-24 rounded-lg object-cover mx-auto mb-3"
                />
                
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={10485760}
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleImageUploadComplete}
                  buttonClassName="text-sm text-primary hover:text-primary/80"
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Change Photo
                </ObjectUploader>
              </div>
              
              <form onSubmit={handleSalonSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="salon-name">Salon Name</Label>
                  <Input 
                    id="salon-name" 
                    name="name" 
                    defaultValue={selectedSalon?.name}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="salon-description">Description</Label>
                  <Textarea 
                    id="salon-description" 
                    name="description" 
                    rows={3}
                    defaultValue={selectedSalon?.description || ""}
                  />
                </div>
                
                <div>
                  <Label htmlFor="salon-phone">Phone Number</Label>
                  <Input 
                    id="salon-phone" 
                    name="phone" 
                    type="tel"
                    defaultValue={selectedSalon?.phone || ""}
                  />
                </div>
                
                <div>
                  <Label htmlFor="salon-address">Address</Label>
                  <Textarea 
                    id="salon-address" 
                    name="address" 
                    rows={2}
                    defaultValue={selectedSalon?.address}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={updateSalonMutation.isPending}>
                  {updateSalonMutation.isPending ? "Updating..." : "Update Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Working Hours & Availability</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weekdays.map((day, index) => {
                  const dayWorkingHours = workingHours?.find((wh: WorkingHours) => wh.dayOfWeek === index);
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium text-gray-700 w-20">{day}</span>
                      <div className="flex items-center space-x-2 flex-1">
                        <Input 
                          type="time" 
                          defaultValue={dayWorkingHours?.openTime || "09:00"}
                          className="text-sm"
                          onChange={(e) => {
                            handleWorkingHoursSubmit(index, {
                              isOpen: dayWorkingHours?.isOpen ?? true,
                              openTime: e.target.value,
                              closeTime: dayWorkingHours?.closeTime || "20:00",
                              breakStartTime: dayWorkingHours?.breakStartTime,
                              breakEndTime: dayWorkingHours?.breakEndTime,
                            });
                          }}
                        />
                        <span className="text-gray-500">to</span>
                        <Input 
                          type="time" 
                          defaultValue={dayWorkingHours?.closeTime || "20:00"}
                          className="text-sm"
                          onChange={(e) => {
                            handleWorkingHoursSubmit(index, {
                              isOpen: dayWorkingHours?.isOpen ?? true,
                              openTime: dayWorkingHours?.openTime || "09:00",
                              closeTime: e.target.value,
                              breakStartTime: dayWorkingHours?.breakStartTime,
                              breakEndTime: dayWorkingHours?.breakEndTime,
                            });
                          }}
                        />
                        <div className="flex items-center">
                          <Checkbox 
                            checked={dayWorkingHours?.isOpen ?? true}
                            onCheckedChange={(checked) => {
                              handleWorkingHoursSubmit(index, {
                                isOpen: checked,
                                openTime: dayWorkingHours?.openTime || "09:00",
                                closeTime: dayWorkingHours?.closeTime || "20:00",
                                breakStartTime: dayWorkingHours?.breakStartTime,
                                breakEndTime: dayWorkingHours?.breakEndTime,
                              });
                            }}
                          />
                          <span className="text-sm text-gray-600 ml-2">Open</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Service Form Modal */}
      {showServiceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <h2 className="text-xl font-semibold">
                {editingService ? "Edit Service" : "Add New Service"}
              </h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleServiceSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="service-name">Service Name</Label>
                  <Input 
                    id="service-name" 
                    name="name" 
                    defaultValue={editingService?.name}
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="service-description">Description</Label>
                  <Textarea 
                    id="service-description" 
                    name="description" 
                    rows={3}
                    defaultValue={editingService?.description || ""}
                  />
                </div>
                <div>
                  <Label htmlFor="service-price">Price (₹)</Label>
                  <Input 
                    id="service-price" 
                    name="price" 
                    type="number" 
                    step="0.01"
                    defaultValue={editingService?.price}
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="service-duration">Duration (minutes)</Label>
                  <Input 
                    id="service-duration" 
                    name="duration" 
                    type="number"
                    defaultValue={editingService?.duration}
                    required 
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
                  >
                    {createServiceMutation.isPending || updateServiceMutation.isPending 
                      ? "Saving..." 
                      : editingService ? "Update" : "Create"
                    }
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowServiceForm(false);
                      setEditingService(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
