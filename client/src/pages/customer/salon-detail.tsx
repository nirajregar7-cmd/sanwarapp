import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Star, MapPin, Phone, Clock, Users, Calendar as CalendarIcon,
  Scissors, Heart, Share2, CheckCircle, IndianRupee, User
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Salon, Service, Staff, WorkingHours, TimeSlot, Review } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedService, setSelectedService] = useState<string>("");
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  // Fetch salon details
  const { data: salon, isLoading: salonLoading } = useQuery<Salon>({
    queryKey: [`/api/salons/${salonId}`],
    enabled: !!salonId,
  });

  // Fetch salon services
  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: [`/api/salons/${salonId}/services`],
    enabled: !!salonId,
  });

  // Fetch salon staff
  const { data: staff = [], isLoading: staffLoading } = useQuery<Staff[]>({
    queryKey: [`/api/salons/${salonId}/staff`],
    enabled: !!salonId,
  });

  // Fetch salon reviews
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: [`/api/salons/${salonId}/reviews`],
    enabled: !!salonId,
  });

  // Fetch working hours
  const { data: workingHours = [], isLoading: hoursLoading } = useQuery<WorkingHours[]>({
    queryKey: [`/api/salons/${salonId}/working-hours`],
    enabled: !!salonId,
  });

  // Fetch available time slots for selected date and service
  const { data: timeSlots = [] } = useQuery<TimeSlot[]>({
    queryKey: [`/api/salons/${salonId}/time-slots`, selectedDate?.toISOString().split('T')[0], selectedService],
    enabled: !!salonId && !!selectedDate && !!selectedService,
  });

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      serviceId: "",
      staffId: "",
      date: new Date(),
      timeSlotId: "",
    },
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      if (!isAuthenticated) {
        throw new Error("Please log in to book an appointment");
      }
      return apiRequest(`/api/bookings`, "POST", {
        salonId,
        serviceId: data.serviceId,
        staffId: data.staffId || null,
        timeSlotId: data.timeSlotId,
        date: data.date.toISOString().split('T')[0],
      });
    },
    onSuccess: () => {
      toast({
        title: "Booking Confirmed!",
        description: "Your appointment has been successfully booked. You'll receive a confirmation shortly.",
      });
      setBookingDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salonId}/time-slots`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookingFormData) => {
    bookingMutation.mutate(data);
  };

  if (salonLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
            <div className="h-6 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
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
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Heart className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
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

            {/* Staff */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Our Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                {staffLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="space-y-1">
                          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : staff.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {staff.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                          <AvatarImage src={member.photoUrl || ""} alt={member.name} />
                          <AvatarFallback>
                            <User className="h-5 w-5 sm:h-6 sm:w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{member.name}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{member.role}</p>
                          <div className="flex items-center mt-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-gray-500 ml-1">
                              {member.rating ? Number(member.rating).toFixed(1) : "New"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">Staff information coming soon</p>
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
                          <div className="flex items-center">
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
                            <span className="ml-2 font-medium">Customer Review</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "Recently"}
                          </span>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No reviews yet. Be the first to review!</p>
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
                    <Button asChild className="w-full">
                      <Link href="/api/login">
                        Log In to Book
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" size="lg">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Book Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Book Your Appointment</DialogTitle>
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
                                        {service.name} - ₹{service.price}
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
                            name="staffId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Preferred Staff (Optional)</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Any available staff" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {staff.map((member) => (
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
                                  disabled={(date) => date < new Date() || date.getDay() === 0}
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
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {timeSlots.length > 0 ? (
                                      timeSlots.map((slot) => (
                                        <Button
                                          key={slot.id}
                                          type="button"
                                          variant={field.value === slot.id ? "default" : "outline"}
                                          size="sm"
                                          className="text-xs sm:text-sm"
                                          onClick={() => field.onChange(slot.id)}
                                          disabled={!slot.isAvailable}
                                        >
                                          {slot.startTime}
                                        </Button>
                                      ))
                                    ) : (
                                      <p className="col-span-2 sm:col-span-3 text-sm text-gray-500 text-center py-4">
                                        No available slots for this date
                                      </p>
                                    )}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

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
                              </div>
                            </div>
                          )}

                          <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={bookingMutation.isPending}
                          >
                            {bookingMutation.isPending ? "Booking..." : "Confirm Booking"}
                          </Button>
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
                    {workingHours.map((hours) => (
                      <div key={hours.id} className="flex justify-between">
                        <span className="capitalize">{hours.dayOfWeek}</span>
                        <span>
                          {hours.isOpen 
                            ? `${hours.openTime} - ${hours.closeTime}` 
                            : "Closed"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Hours not specified</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}