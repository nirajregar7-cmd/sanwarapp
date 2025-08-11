import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, DollarSign, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const emergencyBookingSchema = z.object({
  salonId: z.string().min(1, "Salon is required"),
  serviceId: z.string().min(1, "Service is required"), 
  preferredDate: z.string().min(1, "Preferred date is required"),
  preferredStartTime: z.string().optional(),
  preferredEndTime: z.string().optional(),
  emergencyReason: z.string().min(1, "Please explain why this is urgent"),
  maxEmergencyCharge: z.string().min(1, "Maximum extra charge is required"),
  customerPhone: z.string().min(10, "Valid phone number is required"),
  notificationPreference: z.enum(["sms", "call", "app"]).default("app"),
});

type EmergencyBookingForm = z.infer<typeof emergencyBookingSchema>;

interface EmergencyBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salon?: any;
  service?: any;
  selectedDate?: string;
}

export function EmergencyBookingModal({
  open,
  onOpenChange,
  salon,
  service,
  selectedDate,
}: EmergencyBookingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<EmergencyBookingForm>({
    resolver: zodResolver(emergencyBookingSchema),
    defaultValues: {
      salonId: salon?.id || "",
      serviceId: service?.id || "",
      preferredDate: selectedDate || "",
      notificationPreference: "app",
      emergencyReason: "",
      maxEmergencyCharge: "",
      customerPhone: "",
    },
  });

  const onSubmit = async (data: EmergencyBookingForm) => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/emergency-booking/waitlist", {
        ...data,
        maxEmergencyCharge: parseFloat(data.maxEmergencyCharge),
      });

      toast({
        title: "Emergency Booking Request Submitted",
        description: "We'll notify you as soon as a slot becomes available!",
      });

      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to submit emergency booking request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const emergencyChargePercentage = salon?.emergencyChargeValue || 50;
  const basePrice = service?.price ? parseFloat(service.price) : 0;
  const estimatedEmergencyCharge = (basePrice * emergencyChargePercentage) / 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Emergency Booking Request
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Emergency Booking Info */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-600" />
                How Emergency Booking Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Same-Day Priority</p>
                  <p className="text-xs text-gray-600">Get instant booking when all regular slots are full</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <DollarSign className="h-4 w-4 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Premium Pricing</p>
                  <p className="text-xs text-gray-600">
                    Extra charge: +{emergencyChargePercentage}% (₹{estimatedEmergencyCharge.toFixed(0)} estimated)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Limited Availability</p>
                  <p className="text-xs text-gray-600">Subject to salon capacity and staff availability</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Details */}
          {salon && service && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Booking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Salon:</span>
                  <span className="text-sm">{salon.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Service:</span>
                  <span className="text-sm">{service.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Duration:</span>
                  <span className="text-sm">{service.duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Base Price:</span>
                  <span className="text-sm">₹{basePrice}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Emergency Fee:</span>
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    +₹{estimatedEmergencyCharge.toFixed(0)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Emergency Booking Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="emergencyReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Why is this urgent? *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please explain why you need an emergency booking today..."
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="preferredStartTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredEndTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred End Time</FormLabel>
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
                name="maxEmergencyCharge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Extra Charge You're Willing to Pay (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 500"
                        {...field}
                        min="0"
                        step="1"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-gray-600">
                      This helps salons prioritize your request. Estimated: ₹{estimatedEmergencyCharge.toFixed(0)}
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone *</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="Your phone number for urgent contact"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notificationPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How should we contact you?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select notification preference" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="app">App Notification</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="call">Phone Call</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {isSubmitting ? "Submitting..." : "Submit Emergency Request"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}