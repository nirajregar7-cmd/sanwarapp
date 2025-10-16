import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { QRCodeSVG } from "qrcode.react";
import { Gift, CheckCircle, Sparkles, CreditCard } from "lucide-react";

const enrollmentSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  serviceEnjoyed: z.string().min(3, "Please tell us which service you enjoyed"),
  discountPercentage: z.number().min(10).max(20),
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

export default function DiscountEnrollment() {
  const { salonId } = useParams<{ salonId: string }>();
  const { toast } = useToast();
  const [step, setStep] = useState<'welcome' | 'details' | 'confirmation' | 'payment'>('welcome');
  const [selectedDiscount, setSelectedDiscount] = useState<10 | 20 | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<string>("");

  // Fetch salon details
  const { data: salon, isLoading: salonLoading } = useQuery({
    queryKey: [`/api/salons/${salonId}`],
  });

  // Fetch salon account for UPI
  const { data: salonAccount } = useQuery({
    queryKey: [`/api/salons/${salonId}/account`],
    enabled: step === 'confirmation' || step === 'payment',
  });

  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      serviceEnjoyed: "",
      discountPercentage: selectedDiscount || 10,
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async (data: EnrollmentFormData) => {
      return await apiRequest('POST', '/api/discount-cards/enroll', {
        ...data,
        salonId,
      });
    },
    onSuccess: async (response: Response) => {
      const data = await response.json();
      setEnrollmentId(data.id);
      setStep('confirmation');
      toast({
        title: "Discount Card Created!",
        description: "Check your email for your Sanwar discount card",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create discount card",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EnrollmentFormData) => {
    enrollMutation.mutate(data);
  };

  if (salonLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Salon Not Found</CardTitle>
            <CardDescription>
              The salon you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Powered by Sanwar Header */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-600">
            Powered by <span className="font-bold text-purple-600">Sanwar</span>
          </p>
        </div>
        {/* Welcome Step - Choose Discount */}
        {step === 'welcome' && (
          <Card className="border-2 border-purple-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Gift className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-2xl">Welcome to {salon.name}!</CardTitle>
              <CardDescription className="text-base">
                Thank you for choosing us! Get an exclusive discount on your next visit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-center mb-4">
                  Choose your discount for next visit:
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    size="lg"
                    variant={selectedDiscount === 10 ? "default" : "outline"}
                    className={`h-32 flex flex-col gap-2 ${selectedDiscount === 10 ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                    onClick={() => setSelectedDiscount(10)}
                    data-testid="button-select-10-discount"
                  >
                    <Sparkles className="h-8 w-8" />
                    <span className="text-3xl font-bold">10%</span>
                    <span className="text-sm">OFF</span>
                  </Button>
                  <Button
                    size="lg"
                    variant={selectedDiscount === 20 ? "default" : "outline"}
                    className={`h-32 flex flex-col gap-2 ${selectedDiscount === 20 ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                    onClick={() => setSelectedDiscount(20)}
                    data-testid="button-select-20-discount"
                  >
                    <Sparkles className="h-8 w-8" />
                    <span className="text-3xl font-bold">20%</span>
                    <span className="text-sm">OFF</span>
                  </Button>
                </div>
              </div>

              {selectedDiscount && (
                <Button
                  size="lg"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => {
                    form.setValue('discountPercentage', selectedDiscount);
                    setStep('details');
                  }}
                  data-testid="button-continue-to-details"
                >
                  Continue with {selectedDiscount}% Discount
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Details Step - Collect Customer Info */}
        {step === 'details' && (
          <Card className="border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-purple-600" />
                Your Discount Details
                <Badge className="bg-purple-600">{selectedDiscount}% OFF</Badge>
              </CardTitle>
              <CardDescription>
                Please provide your details to receive your Sanwar discount card
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your name" 
                            {...field}
                            data-testid="input-customer-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="your@email.com" 
                            type="email" 
                            {...field}
                            data-testid="input-customer-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="9876543210" 
                            type="tel" 
                            {...field}
                            data-testid="input-customer-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serviceEnjoyed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Which service did you enjoy?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="e.g., Haircut, Facial, Massage..." 
                            {...field}
                            data-testid="input-service-enjoyed"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep('welcome')}
                      className="flex-1"
                      data-testid="button-back-to-discount"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={enrollMutation.isPending}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      data-testid="button-submit-enrollment"
                    >
                      {enrollMutation.isPending ? "Processing..." : "Get My Discount Card"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Confirmation Step */}
        {step === 'confirmation' && (
          <Card className="border-2 border-green-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">Success!</CardTitle>
              <CardDescription className="text-base">
                Your Sanwar discount card is ready! We've sent it to your email and WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="font-semibold text-lg mb-2">Your Discount Card Details:</p>
                <div className="space-y-1 text-sm">
                  <p>✨ {selectedDiscount}% OFF on your next visit</p>
                  <p>📧 Confirmation sent to {form.getValues('customerEmail')}</p>
                  <p>📱 WhatsApp message sent to {form.getValues('customerPhone')}</p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  To complete the process, please make a small payment to the salon owner:
                </p>
                {salonAccount?.upiId ? (
                  <a
                    href={`upi://pay?pa=${salonAccount.upiId}&pn=${encodeURIComponent(salon.name)}&cu=INR`}
                    className="block"
                  >
                    <Button
                      size="lg"
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      data-testid="button-proceed-to-payment"
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      Proceed to Payment
                    </Button>
                  </a>
                ) : (
                  <Button
                    size="lg"
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => setStep('payment')}
                    data-testid="button-proceed-to-payment"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Proceed to Payment
                  </Button>
                )}
                <p className="text-xs text-gray-500 mt-3">
                  {salonAccount?.upiId ? (
                    <>UPI ID: <span className="font-semibold">{salonAccount.upiId}</span></>
                  ) : (
                    'Payment details not available'
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Step - Show UPI QR */}
        {step === 'payment' && (
          <Card className="border-2 border-purple-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Complete Payment</CardTitle>
              <CardDescription>
                Scan the QR code below to pay the salon owner directly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {salonAccount?.upiId ? (
                <>
                  <div className="flex justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                      <QRCodeSVG
                        value={`upi://pay?pa=${salonAccount.upiId}&pn=${encodeURIComponent(salon.name)}&cu=INR`}
                        size={250}
                        level="H"
                        includeMargin={true}
                      />
                      <div className="text-center mt-3">
                        <p className="text-sm text-gray-600">UPI ID:</p>
                        <p className="font-semibold">{salonAccount.upiId}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <p className="font-semibold text-green-800">
                      Thank you for your payment!
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Your {selectedDiscount}% discount card is active and ready to use on your next visit
                    </p>
                  </div>
                </>
              ) : (
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <p className="text-yellow-800">
                    Payment details not available. Please contact the salon directly.
                  </p>
                </div>
              )}

              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  data-testid="button-back-to-home"
                >
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Powered by Sanwar Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            Powered by <span className="font-bold text-purple-600">Sanwar</span> - Smart Salon Booking Platform
          </p>
        </div>
      </div>
    </div>
  );
}
