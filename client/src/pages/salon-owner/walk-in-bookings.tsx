import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertWalkInBookingSchema } from "@shared/schema";
import { z } from "zod";
import { UserPlus, Clock, Phone, CreditCard, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

type WalkInBookingData = z.infer<typeof insertWalkInBookingSchema>;

export default function WalkInBookings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSalonId, setSelectedSalonId] = useState<string>("");

  // Get user's salons
  const { data: salons = [], isLoading: salonsLoading } = useQuery({
    queryKey: ["/api/user/salons"],
    enabled: !!user,
  });

  // Get services for selected salon
  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/salons", selectedSalonId, "services"],
    enabled: !!selectedSalonId,
  });

  // Get staff for selected salon
  const { data: staff = [] } = useQuery({
    queryKey: ["/api/salons", selectedSalonId, "staff"],
    enabled: !!selectedSalonId,
  });

  // Get walk-in bookings for selected salon
  const { data: walkInBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/salons", selectedSalonId, "walk-in-bookings"],
    enabled: !!selectedSalonId,
  });

  const form = useForm<WalkInBookingData>({
    resolver: zodResolver(insertWalkInBookingSchema),
    defaultValues: {
      isWalkIn: true,
      walkInPaymentMethod: "cash",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: format(new Date(), "HH:mm"),
      status: "confirmed",
      paymentStatus: "completed",
    },
  });

  // Create walk-in booking mutation
  const createWalkInMutation = useMutation({
    mutationFn: async (data: WalkInBookingData) => {
      return await apiRequest("POST", "/api/walk-in-bookings", data);
    },
    onSuccess: () => {
      toast({
        title: "Walk-in Customer Added",
        description: "The walk-in customer has been successfully added to your bookings.",
      });
      form.reset();
      queryClient.invalidateQueries({
        queryKey: ["/api/salons", selectedSalonId, "walk-in-bookings"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Walk-in",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WalkInBookingData) => {
    if (!selectedSalonId) {
      toast({
        title: "Please Select a Salon",
        description: "You must select a salon before adding walk-in customers.",
        variant: "destructive",
      });
      return;
    }

    // Calculate end time based on service duration
    const selectedService = services.find(s => s.id === data.serviceId);
    if (selectedService) {
      const [hours, minutes] = data.startTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + selectedService.duration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      data.endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
      data.totalAmount = selectedService.price;
    }

    data.salonId = selectedSalonId;
    createWalkInMutation.mutate(data);
  };

  if (salonsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading your salons...</div>
      </div>
    );
  }

  if (!salons.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              No Salons Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You need to create a salon first before managing walk-in customers.
            </p>
            <Button className="w-full" onClick={() => window.location.href = '/'}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Walk-in Customers</h1>
          <p className="text-muted-foreground">
            Add customers who visited your salon without online booking
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Add Walk-in Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Walk-in Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Salon Selection */}
            <div className="mb-4">
              <Label htmlFor="salon-select">Select Salon</Label>
              <Select 
                value={selectedSalonId} 
                onValueChange={setSelectedSalonId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a salon..." />
                </SelectTrigger>
                <SelectContent>
                  {salons.map((salon: any) => (
                    <SelectItem key={salon.id} value={salon.id}>
                      {salon.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSalonId && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="walkInCustomerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter customer name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="walkInCustomerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="serviceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {services.map((service: any) => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name} - ₹{service.price} ({service.duration} min)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {staff.length > 0 && (
                    <FormField
                      control={form.control}
                      name="staffId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Staff Member (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select staff member" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">No specific staff</SelectItem>
                              {staff.map((member: any) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.name} - {member.role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="walkInPaymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any additional notes about the service..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createWalkInMutation.isPending || servicesLoading}
                  >
                    {createWalkInMutation.isPending ? "Adding..." : "Add Walk-in Customer"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Walk-in Bookings List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Walk-ins
              {selectedSalonId && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({walkInBookings.length} total)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedSalonId ? (
              <p className="text-muted-foreground text-center py-8">
                Select a salon to view walk-in bookings
              </p>
            ) : bookingsLoading ? (
              <p className="text-center py-8">Loading walk-in bookings...</p>
            ) : walkInBookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No walk-in customers added yet
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {walkInBookings.map((booking: any) => (
                  <div key={booking.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{booking.walkInCustomerName}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {booking.walkInCustomerPhone}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {booking.date}
                        </p>
                        <p className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {booking.startTime} - {booking.endTime}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ₹{booking.totalAmount}
                        </span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {booking.walkInPaymentMethod.toUpperCase()}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        booking.status === 'completed' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>

                    {booking.notes && (
                      <p className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                        {booking.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}