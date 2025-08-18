import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { X, CreditCard } from "lucide-react";
import { initiateCashfreePayment, CashfreeOrderData } from "@/lib/payment";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentId: string) => void;
  booking: {
    salon: string;
    service: string;
    date: string;
    time: string;
    amount: string;
  };
  orderData?: CashfreeOrderData;
  customerDetails?: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  };
}

export function BookingModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  booking, 
  orderData, 
  customerDetails 
}: BookingModalProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Handle pay-at-salon alternative
  const handlePayAtSalon = async () => {
    if (!orderData) return;
    
    try {
      setIsProcessing(true);
      
      // Create booking without online payment
      const response = await fetch('/api/bookings/create-pay-at-salon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId: orderData.orderId,
          // Extract booking details from orderData
          salonId: orderData.salonId,
          serviceId: orderData.serviceId, 
          timeSlotId: orderData.timeSlotId,
          date: orderData.date,
          staffId: orderData.staffId,
          notes: 'Pay at salon - Online payment alternative'
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Booking Confirmed!",
          description: "Your booking is confirmed. Please pay at the salon.",
        });
        onConfirm(result.id);
      } else {
        throw new Error('Failed to create booking');
      }
    } catch (error) {
      console.error('Pay-at-salon booking failed:', error);
      toast({
        title: "Booking Failed",
        description: "Unable to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const handlePayment = async () => {
    if (!orderData || !customerDetails) {
      toast({
        title: "Payment Error",
        description: "Missing payment details. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      await initiateCashfreePayment({
        orderData,
        customerDetails,
        onSuccess: (paymentDetails) => {
          toast({
            title: "Payment Successful",
            description: "Your payment has been processed successfully!",
          });
          
          // Extract payment ID from Cashfree response
          const paymentId = paymentDetails.paymentId || paymentDetails.transactionId || orderData.orderId;
          onConfirm(paymentId);
        },
        onFailure: (error) => {
          console.error('Payment failed:', error);
          
          // Show pay-at-salon option if payment fails
          if (error.showPayAtSalonOption) {
            toast({
              title: "Payment Issues?",
              description: "Having trouble with online payment? You can book and pay at the salon instead!",
              variant: "default",
              action: (
                <button 
                  onClick={() => handlePayAtSalon()}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Book & Pay at Salon
                </button>
              )
            });
          } else {
            toast({
              title: "Payment Failed",
              description: error.message || "There was an error processing your payment. Please try again.",
              variant: "destructive",
            });
          }
          setIsProcessing(false);
        }
      });
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast({
        title: "Payment Error",
        description: "Unable to start payment process. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Confirm Booking</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Booking Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-3">Booking Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Salon:</span>
                <span className="font-medium">{booking.salon}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Service:</span>
                <span className="font-medium">{booking.service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{new Date(booking.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">{booking.time}</span>
              </div>
              <div className="flex justify-between text-base font-semibold border-t pt-2 mt-3">
                <span>Total Amount:</span>
                <span className="text-primary">₹{booking.amount}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <h3 className="font-medium mb-3">Payment Method</h3>
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">Credit/Debit Card</p>
                  <p className="text-sm text-gray-600">Secure payment via Cashfree</p>
                </div>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="text-xs text-gray-500">
            <p>
              By proceeding with this booking, you agree to our terms and conditions. 
              Cancellation policy applies.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-accent hover:bg-accent/90" 
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay ₹{booking.amount}
                  </>
                )}
              </Button>
            </div>
            
            {/* Alternative Pay at Salon Option */}
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-2">Having payment issues?</div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handlePayAtSalon}
                disabled={isProcessing}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                Book Now & Pay at Salon
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
