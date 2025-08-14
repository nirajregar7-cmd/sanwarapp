import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PaymentCallback() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/payment-callback');
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Processing your payment...');

  useEffect(() => {
    const processPaymentCallback = async () => {
      try {
        // Get all parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('order_id');
        const orderToken = urlParams.get('order_token');
        const salonId = urlParams.get('salon_id');
        const serviceId = urlParams.get('service_id');
        const timeSlotId = urlParams.get('time_slot_id');
        const date = urlParams.get('date');
        const staffId = urlParams.get('staff_id');
        const notes = urlParams.get('notes');
        const referralId = urlParams.get('referral_id');

        console.log('Payment callback parameters:', {
          orderId, salonId, serviceId, timeSlotId, date, staffId, notes, referralId
        });

        if (!orderId || !salonId || !serviceId || !timeSlotId || !date) {
          console.error('Missing required parameters:', { orderId, salonId, serviceId, timeSlotId, date });
          throw new Error('Missing required booking parameters in callback');
        }

        // Verify payment with backend
        const response = await fetch('/api/bookings/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            orderId,
            salonId,
            serviceId,
            timeSlotId,
            date,
            staffId: staffId || null,
            notes: notes ? decodeURIComponent(notes) : null,
            referralCodeData: referralId ? { id: referralId } : null
          }),
        });

        if (!response.ok) {
          throw new Error('Payment verification failed');
        }

        const result = await response.json();
        
        setStatus('success');
        setMessage('Payment successful! Your booking has been confirmed.');
        
        toast({
          title: "Payment Successful",
          description: "Your booking has been confirmed successfully!",
        });

        // Redirect to bookings page after 3 seconds
        setTimeout(() => {
          setLocation('/bookings');
        }, 3000);

      } catch (error) {
        console.error('Payment callback error:', error);
        setStatus('failed');
        setMessage(error instanceof Error ? error.message : 'Payment processing failed');
        
        toast({
          title: "Payment Failed",
          description: "There was an issue processing your payment.",
          variant: "destructive",
        });
      }
    };

    processPaymentCallback();
  }, [setLocation, toast]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin text-blue-500" />}
            {status === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
            {status === 'failed' && <XCircle className="h-6 w-6 text-red-500" />}
            Payment {status === 'loading' ? 'Processing' : status === 'success' ? 'Successful' : 'Failed'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">{message}</p>
          
          {status === 'success' && (
            <div className="text-sm text-gray-500">
              Redirecting to your bookings in 3 seconds...
            </div>
          )}
          
          {status === 'failed' && (
            <div className="space-y-2">
              <Button 
                onClick={() => setLocation('/')} 
                variant="outline"
                className="w-full"
              >
                Back to Home
              </Button>
              <Button 
                onClick={() => setLocation('/bookings')} 
                className="w-full"
              >
                View My Bookings
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}