import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Star, MapPin, Phone, Clock, CreditCard } from "lucide-react";
import { TimeSlotPicker } from "@/components/TimeSlotPicker";
import { BookingModal } from "@/components/BookingModal";
import { apiRequest } from "@/lib/queryClient";
import type { Salon, Service, TimeSlot } from "@shared/schema";

export default function SalonDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const { data: salon, isLoading: salonLoading } = useQuery({
    queryKey: ["/api/salons", id],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${id}`);
      if (!response.ok) throw new Error("Failed to fetch salon");
      return response.json() as Salon;
    },
    enabled: !!id,
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/salons", id, "services"],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${id}/services`);
      if (!response.ok) throw new Error("Failed to fetch services");
      return response.json() as Service[];
    },
    enabled: !!id,
  });

  const { data: timeSlots, isLoading: timeSlotsLoading, refetch: refetchTimeSlots } = useQuery({
    queryKey: ["/api/salons", id, "time-slots", selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${id}/time-slots?date=${selectedDate}`);
      if (!response.ok) throw new Error("Failed to fetch time slots");
      return response.json() as TimeSlot[];
    },
    enabled: !!id && !!selectedDate,
  });

  const bookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      return apiRequest("POST", "/api/bookings", bookingData);
    },
    onSuccess: () => {
      toast({
        title: "Booking Successful",
        description: "Your appointment has been booked successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my"] });
      refetchTimeSlots();
      setShowBookingModal(false);
      setSelectedTimeSlot(null);
      setSelectedService(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBooking = () => {
    if (!selectedTimeSlot || !selectedService) {
      toast({
        title: "Missing Information",
        description: "Please select both a time slot and service.",
        variant: "destructive",
      });
      return;
    }
    setShowBookingModal(true);
  };

  const confirmBooking = async (paymentId: string) => {
    if (!selectedTimeSlot || !selectedService || !salon) return;

    const bookingData = {
      salonId: salon.id,
      serviceId: selectedService.id,
      timeSlotId: selectedTimeSlot.id,
      date: selectedDate,
      startTime: selectedTimeSlot.startTime,
      endTime: selectedTimeSlot.endTime,
      totalAmount: selectedService.price,
      paymentId,
      paymentStatus: "completed",
      status: "confirmed",
    };

    bookingMutation.mutate(bookingData);
  };

  if (salonLoading || servicesLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Salon not found</h1>
        <p className="text-gray-600">The salon you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Salon Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <img 
            src={salon.imageUrl || "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80"} 
            alt={salon.name} 
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{salon.name}</h1>
            <div className="flex items-center text-yellow-500 mt-1">
              <Star className="h-5 w-5 fill-current" />
              <span className="ml-1 text-gray-600">
                {salon.averageRating ? Number(salon.averageRating).toFixed(1) : "New"}
                {salon.totalReviews && salon.totalReviews > 0 && (
                  <span> ({salon.totalReviews} reviews)</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Salon Info */}
        <div className="space-y-6">
          {/* About */}
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold">About</h3>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                {salon.description || "Premium salon offering cutting-edge styling and beauty treatments."}
              </p>
            </CardContent>
          </Card>

          {/* Services & Pricing */}
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold">Services & Pricing</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {services?.map((service) => (
                  <div 
                    key={service.id} 
                    className={`flex justify-between items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedService?.id === service.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedService(service)}
                  >
                    <div>
                      <span className="font-medium">{service.name}</span>
                      {service.description && (
                        <span className="text-gray-500 text-sm block">{service.description}</span>
                      )}
                      <span className="text-gray-500 text-sm block">{service.duration} min</span>
                    </div>
                    <span className="font-semibold text-primary">₹{service.price}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact & Location */}
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold">Contact & Location</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-gray-600">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                  <span>{salon.address}</span>
                </div>
                {salon.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{salon.phone}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <span>Mon-Sun: 9:00 AM - 8:00 PM</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Panel */}
        <div className="lg:sticky lg:top-4">
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold">Book Appointment</h3>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Selection */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Select Date</Label>
                <Input 
                  type="date" 
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Service Selection */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Select Service</Label>
                <Select 
                  value={selectedService?.id || ""} 
                  onValueChange={(value) => {
                    const service = services?.find(s => s.id === value);
                    setSelectedService(service || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a service..." />
                  </SelectTrigger>
                  <SelectContent>
                    {services?.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - ₹{service.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Time Slots */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">Available Time Slots</Label>
                <TimeSlotPicker
                  timeSlots={timeSlots || []}
                  selectedTimeSlot={selectedTimeSlot}
                  onTimeSlotSelect={setSelectedTimeSlot}
                  isLoading={timeSlotsLoading}
                />
              </div>

              {/* Booking Summary */}
              {selectedTimeSlot && selectedService && (
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Booking Summary</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{new Date(selectedDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <span>{selectedTimeSlot.startTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service:</span>
                        <span>{selectedService.name}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-gray-900 border-t pt-1 mt-2">
                        <span>Total:</span>
                        <span>₹{selectedService.price}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button 
                className="w-full bg-accent hover:bg-accent/90" 
                onClick={handleBooking}
                disabled={!selectedTimeSlot || !selectedService || bookingMutation.isPending}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {bookingMutation.isPending ? "Processing..." : "Book & Pay Now"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onConfirm={confirmBooking}
        booking={{
          salon: salon.name,
          service: selectedService?.name || "",
          date: selectedDate,
          time: selectedTimeSlot?.startTime || "",
          amount: selectedService?.price || "0",
        }}
      />
    </div>
  );
}
