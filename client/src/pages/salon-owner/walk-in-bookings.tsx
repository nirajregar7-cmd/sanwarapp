import { useState } from "react";
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
import { insertWalkInBookingSchema, type Salon, type Service, type Staff, type Booking } from "@shared/schema";
import { z } from "zod";
import {
  UserPlus, Clock, Phone, CreditCard, Calendar, DollarSign,
  Smartphone, Globe, Star, TrendingUp, MessageSquare, Bell,
  BarChart3, Zap, ShieldCheck, Users, Search, Gift, ChevronRight
} from "lucide-react";
import { format } from "date-fns";

type WalkInBookingData = z.infer<typeof insertWalkInBookingSchema>;

const CONNECTION_METHODS = [
  {
    icon: Globe,
    color: "bg-blue-50 text-blue-600",
    border: "border-blue-200",
    title: "Online Salon Listing",
    description: "Get your salon listed on Sanwar's marketplace and reach thousands of customers searching for salons near them — 24/7, without any effort.",
  },
  {
    icon: Smartphone,
    color: "bg-purple-50 text-purple-600",
    border: "border-purple-200",
    title: "Real-Time Slot Booking",
    description: "Customers book appointments directly into your available slots. No calls, no confusion — just confirmed bookings straight to your dashboard.",
  },
  {
    icon: Bell,
    color: "bg-orange-50 text-orange-600",
    border: "border-orange-200",
    title: "Instant Booking Notifications",
    description: "Get notified the moment a customer books, cancels, or reschedules. Stay on top of your appointments with real-time SMS and email alerts.",
  },
  {
    icon: BarChart3,
    color: "bg-green-50 text-green-600",
    border: "border-green-200",
    title: "Business Analytics & Insights",
    description: "Track revenue, popular services, peak hours, and staff performance. Make smart business decisions using your own Sanwar dashboard data.",
  },
  {
    icon: MessageSquare,
    color: "bg-teal-50 text-teal-600",
    border: "border-teal-200",
    title: "Direct Customer Messaging",
    description: "Chat directly with customers via Sanwar's built-in messaging system. Answer questions, share updates, and build lasting relationships.",
  },
  {
    icon: Star,
    color: "bg-yellow-50 text-yellow-600",
    border: "border-yellow-200",
    title: "Reviews & Ratings Platform",
    description: "Collect genuine reviews from real customers. A strong star rating on Sanwar builds trust and brings in more walk-ins and bookings.",
  },
  {
    icon: Gift,
    color: "bg-pink-50 text-pink-600",
    border: "border-pink-200",
    title: "Promotional Offers & Discounts",
    description: "Create and publish special offers, festival discounts, and loyalty rewards to attract new customers and retain regulars.",
  },
  {
    icon: Users,
    color: "bg-indigo-50 text-indigo-600",
    border: "border-indigo-200",
    title: "Staff Management System",
    description: "Assign services to specific staff members, generate individual time slots, and give customers the choice to book their preferred stylist.",
  },
  {
    icon: Search,
    color: "bg-red-50 text-red-600",
    border: "border-red-200",
    title: "Location-Based Discovery",
    description: "Customers nearby discover your salon automatically using Sanwar's geolocation search. Show up when people search 'salons near me' in your city.",
  },
  {
    icon: TrendingUp,
    color: "bg-emerald-50 text-emerald-600",
    border: "border-emerald-200",
    title: "Revenue Growth & Payments",
    description: "Accept online payments, track earnings, and grow your monthly revenue. Sanwar's platform helps you convert more visitors into paying customers.",
  },
];

export default function WalkInBookings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSalonId, setSelectedSalonId] = useState<string>("");

  const { data: salons = [], isLoading: salonsLoading } = useQuery<Salon[]>({
    queryKey: ["/api/user/salons"],
    enabled: !!user,
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/salons", selectedSalonId, "services"],
    enabled: !!selectedSalonId,
  });

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/salons", selectedSalonId, "staff"],
    enabled: !!selectedSalonId,
  });

  const { data: walkInBookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: [`/api/walk-in-bookings/${selectedSalonId}`],
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

  const createWalkInMutation = useMutation({
    mutationFn: async (data: WalkInBookingData) => {
      return await apiRequest("POST", "/api/walk-in-bookings", data);
    },
    onSuccess: () => {
      toast({
        title: "Walk-in Customer Added",
        description: "The walk-in customer has been successfully added to your bookings.",
      });
      form.reset({
        isWalkIn: true,
        walkInPaymentMethod: "cash",
        date: format(new Date(), "yyyy-MM-dd"),
        startTime: format(new Date(), "HH:mm"),
        status: "confirmed",
        paymentStatus: "completed",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/walk-in-bookings/${selectedSalonId}`] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to Add Walk-in", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: WalkInBookingData) => {
    if (!selectedSalonId) {
      toast({ title: "Please Select a Salon", description: "Select a salon before adding walk-in customers.", variant: "destructive" });
      return;
    }
    const selectedService = services.find((s: Service) => s.id === data.serviceId);
    if (selectedService) {
      const [hours, minutes] = data.startTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + selectedService.duration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      data.endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
      data.totalAmount = selectedService.price.toString();
    }
    data.salonId = selectedSalonId;
    createWalkInMutation.mutate(data);
  };

  if (salonsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Walk-in Customers</h1>
              <p className="text-sm text-gray-500">Add and track customers who visit without prior booking</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

        {/* Walk-in Form + Recent List */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Add Walk-in Form */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="h-5 w-5 text-primary" />
                Add Walk-in Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label className="text-sm font-medium mb-1.5 block">Select Salon</Label>
                <Select value={selectedSalonId} onValueChange={setSelectedSalonId}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Choose a salon..." />
                  </SelectTrigger>
                  <SelectContent>
                    {salons.map((salon) => (
                      <SelectItem key={salon.id} value={salon.id}>{salon.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {salons.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">No salons found. Create a salon first.</p>
                )}
              </div>

              {selectedSalonId && (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={form.control} name="walkInCustomerName" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">Customer Name</FormLabel>
                          <FormControl><Input placeholder="Full name" {...field} className="h-9" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="walkInCustomerPhone" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">Phone</FormLabel>
                          <FormControl><Input placeholder="Phone number" {...field} className="h-9" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="serviceId" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Service</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name} — ₹{service.price} ({service.duration} min)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {staff.length > 0 && (
                      <FormField control={form.control} name="staffId" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">Staff Member (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Any staff" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">No specific staff</SelectItem>
                              {staff.map((member) => (
                                <SelectItem key={member.id} value={member.id}>{member.name} — {member.role}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={form.control} name="date" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">Date</FormLabel>
                          <FormControl><Input type="date" {...field} className="h-9" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="startTime" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">Start Time</FormLabel>
                          <FormControl><Input type="time" {...field} className="h-9" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="walkInPaymentMethod" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">💵 Cash</SelectItem>
                            <SelectItem value="card">💳 Card</SelectItem>
                            <SelectItem value="upi">📱 UPI</SelectItem>
                            <SelectItem value="online">🌐 Online</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="notes" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Any notes about the service..." {...field} value={field.value || ""} rows={2} className="resize-none" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <Button type="submit" className="w-full h-10" disabled={createWalkInMutation.isPending || servicesLoading}>
                      {createWalkInMutation.isPending ? "Adding..." : "Add Walk-in Customer"}
                    </Button>
                  </form>
                </Form>
              )}

              {!selectedSalonId && salons.length > 0 && (
                <div className="text-center py-6 text-gray-400">
                  <UserPlus className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Select a salon above to start adding walk-ins</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Walk-ins */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                Recent Walk-ins
                {selectedSalonId && (
                  <span className="ml-auto text-xs font-normal bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {walkInBookings.length} total
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedSalonId ? (
                <div className="text-center py-10 text-gray-400">
                  <Clock className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Select a salon to view walk-in history</p>
                </div>
              ) : bookingsLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}
                </div>
              ) : walkInBookings.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <UserPlus className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No walk-in customers added yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {walkInBookings.map((booking) => (
                    <div key={booking.id} className="p-3 border rounded-xl bg-white hover:border-primary/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-sm text-gray-900">{booking.walkInCustomerName}</h4>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3" />{booking.walkInCustomerPhone}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          booking.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{booking.date}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{booking.startTime}–{booking.endTime}</span>
                        <span className="flex items-center gap-1 font-semibold text-green-600"><DollarSign className="h-3 w-3" />₹{booking.totalAmount}</span>
                        <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />{(booking.walkInPaymentMethod || '').toUpperCase()}</span>
                      </div>
                      {booking.notes && (
                        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-2 py-1.5 mt-2">{booking.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 10 Ways to Connect with Sanwar */}
        <div className="rounded-2xl overflow-hidden border bg-white shadow-sm">
          <div className="bg-gradient-to-r from-primary to-purple-600 px-6 py-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">10 Ways Sanwar Grows Your Salon</h2>
                <p className="text-white/80 text-sm">Connect your salon to the Sanwar platform and unlock these powerful benefits</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {CONNECTION_METHODS.map((method, index) => {
                const Icon = method.icon;
                return (
                  <div
                    key={index}
                    className={`relative p-4 rounded-xl border-2 ${method.border} bg-white hover:shadow-md transition-all group`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-xl ${method.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-400">#{index + 1}</span>
                          <h3 className="text-sm font-semibold text-gray-900 leading-tight">{method.title}</h3>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{method.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-purple-50 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Ready to grow your salon business?</p>
                  <p className="text-xs text-gray-500">Complete your salon profile and start getting online bookings today</p>
                </div>
              </div>
              <Button className="flex items-center gap-2 whitespace-nowrap" onClick={() => window.location.href = '/owner/dashboard'}>
                Go to Dashboard <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
