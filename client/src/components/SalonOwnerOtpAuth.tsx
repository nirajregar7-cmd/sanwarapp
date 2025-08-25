import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Phone, MessageSquare, ArrowLeft } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

interface SalonOwnerOtpAuthProps {
  onBack: () => void;
  onSuccess: () => void;
}

type AuthStep = 'phone' | 'otp';
type AuthType = 'registration' | 'login';

export default function SalonOwnerOtpAuth({ onBack, onSuccess }: SalonOwnerOtpAuthProps) {
  const [step, setStep] = useState<AuthStep>('phone');
  const [authType, setAuthType] = useState<AuthType>('registration');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const { toast } = useToast();

  // Send OTP mutation
  const sendOtpMutation = useMutation({
    mutationFn: async (data: {
      phone: string;
      type: AuthType;
      firstName?: string;
      lastName?: string;
      email?: string;
    }) => {
      const response = await fetch('/api/salon-owner/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send OTP');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setOtpExpiresAt(data.expiresAt);
      setStep('otp');
      toast({
        title: 'OTP Sent',
        description: `OTP has been sent to ${phone}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Verify OTP mutation
  const verifyOtpMutation = useMutation({
    mutationFn: async (data: { phone: string; otp: string; type: AuthType }) => {
      const response = await fetch('/api/salon-owner/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify OTP');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update auth state
      queryClient.setQueryData(['/api/auth/user'], data.user);
      toast({
        title: 'Success',
        description: data.message,
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your phone number',
        variant: 'destructive',
      });
      return;
    }

    if (authType === 'registration') {
      if (!firstName.trim() || !email.trim()) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }
    }

    sendOtpMutation.mutate({
      phone,
      type: authType,
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      email: email.trim() || undefined,
    });
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter the OTP',
        variant: 'destructive',
      });
      return;
    }

    verifyOtpMutation.mutate({
      phone,
      otp: otp.trim(),
      type: authType,
    });
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Limit to 10 digits for Indian numbers
    const limitedDigits = digits.slice(0, 10);
    
    return limitedDigits;
  };

  if (step === 'phone') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-0 h-auto text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-purple-600" />
                Salon Owner {authType === 'registration' ? 'Registration' : 'Login'}
              </CardTitle>
              <CardDescription>
                {authType === 'registration' 
                  ? 'Create your salon owner account with OTP verification'
                  : 'Login to your salon owner account with OTP verification'
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant={authType === 'registration' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAuthType('registration')}
              className="flex-1"
            >
              Register
            </Button>
            <Button
              type="button"
              variant={authType === 'login' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAuthType('login')}
              className="flex-1"
            >
              Login
            </Button>
          </div>

          {authType === 'registration' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                    data-testid="input-firstname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                    data-testid="input-lastname"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  data-testid="input-email"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                +91
              </span>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                placeholder="Enter 10-digit phone number"
                className="rounded-l-none"
                maxLength={10}
                data-testid="input-phone"
              />
            </div>
            <p className="text-xs text-gray-500">
              We'll send you an OTP to verify your phone number
            </p>
          </div>

          <Button
            onClick={handleSendOtp}
            disabled={sendOtpMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700"
            data-testid="button-send-otp"
          >
            {sendOtpMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send OTP
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep('phone')}
            className="p-0 h-auto text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              Verify OTP
            </CardTitle>
            <CardDescription>
              Enter the OTP sent to +91{phone}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp">Enter OTP</Label>
          <Input
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit OTP"
            maxLength={6}
            className="text-center text-lg font-mono tracking-widest"
            data-testid="input-otp"
          />
        </div>

        {otpExpiresAt && (
          <p className="text-xs text-gray-500 text-center">
            OTP expires at {new Date(otpExpiresAt).toLocaleTimeString()}
          </p>
        )}

        <div className="space-y-2">
          <Button
            onClick={handleVerifyOtp}
            disabled={verifyOtpMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700"
            data-testid="button-verify-otp"
          >
            {verifyOtpMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify & {authType === 'registration' ? 'Register' : 'Login'}
          </Button>

          <Button
            variant="outline"
            onClick={handleSendOtp}
            disabled={sendOtpMutation.isPending}
            className="w-full"
            data-testid="button-resend-otp"
          >
            {sendOtpMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Resend OTP
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}