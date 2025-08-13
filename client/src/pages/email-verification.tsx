import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Mail, Shield, CheckCircle2, Timer, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { OtpInput } from "@/components/OtpInput";

// Email verification form schema
const emailVerificationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  userType: z.enum(["salon_owner", "brand_owner"], {
    required_error: "Please select a business type",
  }),
});

// OTP verification form schema
const otpVerificationSchema = z.object({
  otp: z.string().min(1, "Please enter your verification code"),
});

type EmailVerificationForm = z.infer<typeof emailVerificationSchema>;
type OtpVerificationForm = z.infer<typeof otpVerificationSchema>;

export default function EmailVerification() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/email-verification/:userType?");
  const { toast } = useToast();
  const { registerMutation } = useAuth();
  
  const [step, setStep] = useState<"email" | "otp">("email");
  const [verificationData, setVerificationData] = useState<{
    email: string;
    userType: string;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [pendingRegistrationData, setPendingRegistrationData] = useState<any>(null);

  // Load pending registration data from sessionStorage
  useEffect(() => {
    const storedData = sessionStorage.getItem("pendingRegistration");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setPendingRegistrationData(parsedData);
      } catch (error) {
        console.error("Failed to parse pending registration data:", error);
      }
    }
  }, []);

  // Email verification form
  const emailForm = useForm<EmailVerificationForm>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: {
      email: "",
      userType: "salon_owner",
    },
  });

  // Update form with pending registration data when available
  useEffect(() => {
    if (pendingRegistrationData) {
      emailForm.setValue("email", pendingRegistrationData.email);
      emailForm.setValue("userType", pendingRegistrationData.userType);
    } else if (params?.userType) {
      emailForm.setValue("userType", params.userType as "salon_owner" | "brand_owner");
    }
  }, [pendingRegistrationData, params?.userType, emailForm]);

  // OTP verification form
  const otpForm = useForm<OtpVerificationForm>({
    resolver: zodResolver(otpVerificationSchema),
    defaultValues: {
      otp: "",
    },
    resetOptions: {
      keepDirtyValues: false,
    },
  });

  // Reset OTP form when step changes to OTP
  useEffect(() => {
    if (step === "otp") {
      otpForm.reset({ otp: "" });
    }
  }, [step, otpForm]);

  // Send email verification OTP mutation
  const sendOtpMutation = useMutation({
    mutationFn: async (data: EmailVerificationForm) => {
      const response = await apiRequest("POST", "/api/auth/send-email-verification", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send verification email");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      setVerificationData({
        email: variables.email,
        userType: variables.userType,
      });
      setStep("otp");
      setTimeLeft(600); // Reset timer
      toast({
        title: "Verification Email Sent",
        description: "Please check your email for the verification code.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send Email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Verify OTP mutation
  const verifyOtpMutation = useMutation({
    mutationFn: async (data: OtpVerificationForm) => {
      const response = await apiRequest("POST", "/api/auth/verify-email-otp", {
        email: verificationData?.email,
        otp: data.otp,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to verify OTP");
      }
      return response.json();
    },
    onSuccess: () => {
      console.log("OTP verification successful, pending registration data:", pendingRegistrationData);
      
      toast({
        title: "Email Verified Successfully!",
        description: "Taking you to your salon dashboard...",
      });
      
      // If we have pending registration data, proceed with registration
      if (pendingRegistrationData) {
        registerMutation.mutate(pendingRegistrationData, {
          onSuccess: (data) => {
            // Clear the stored registration data
            sessionStorage.removeItem("pendingRegistration");
            
            let successMessage = "Welcome to Sanwar! Your business account has been created successfully";
            if (data.referralUsed) {
              successMessage += " Your referral has been applied!";
            }
            
            toast({
              title: "Account Created!",
              description: successMessage,
            });
            
            // Redirect to home page after successful registration
            // The auth system will automatically redirect to the right dashboard
            setLocation("/");
          },
          onError: (error: any) => {
            toast({
              title: "Registration Failed",
              description: error.message || "Failed to create account after verification",
              variant: "destructive",
            });
          },
        });
      } else {
        // No pending registration data - redirect to auth page to complete registration
        toast({
          title: "Email Verified Successfully!",
          description: "Redirecting to complete your business registration...",
        });
        // Add a small delay for better UX
        setTimeout(() => {
          setLocation(`/auth?email=${verificationData?.email}&userType=${verificationData?.userType}&verified=true`);
        }, 1500);
      }
    },
    onError: (error: Error) => {
      console.log("OTP verification error:", error.message);
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Timer countdown effect
  useEffect(() => {
    if (step === "otp" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const userTypeDisplay = {
    salon_owner: "Salon Owner",
    brand_owner: "Brand Owner",
  };

  if (step === "email") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl">Business Email Verification</CardTitle>
            <CardDescription>
              Verify your email address to secure your business account registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit((data) => sendOtpMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your.business@email.com"
                          {...field}
                          className="pl-10"
                        />
                      </FormControl>
                      <Mail className="absolute left-3 top-9 w-4 h-4 text-gray-400" />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={emailForm.control}
                  name="userType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Type</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                        >
                          <option value="salon_owner">Salon Owner</option>
                          <option value="brand_owner">Brand Owner</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    We'll send a 6-digit verification code to your email address. This helps us ensure that only legitimate business owners can register.
                  </AlertDescription>
                </Alert>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={sendOtpMutation.isPending}
                >
                  {sendOtpMutation.isPending ? "Sending..." : "Send Verification Code"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <Button variant="link" onClick={() => setLocation("/login")} className="p-0">
                  Sign In
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Enter Verification Code</CardTitle>
          <CardDescription>
            We've sent a 6-digit code to<br />
            <strong>{verificationData?.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...otpForm}>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-red-500">Verification Code</label>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-center text-lg tracking-widest font-mono ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  data-testid="otp-input"
                  autoComplete="one-time-code"
                  id="otp-simple"
                />
                {otpForm.formState.errors.otp && (
                  <p className="text-sm text-red-500 mt-1">Please enter your verification code</p>
                )}
              </div>

              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Timer className="w-4 h-4" />
                <span>Time remaining: {formatTime(timeLeft)}</span>
              </div>

              <Button 
                onClick={async () => {
                  const otpInput = document.getElementById('otp-simple') as HTMLInputElement;
                  const otpValue = otpInput?.value || '';
                  if (otpValue.length === 6) {
                    verifyOtpMutation.mutate({ 
                      otp: otpValue
                    });
                  } else {
                    toast({
                      title: "Invalid OTP",
                      description: "Please enter a 6-digit verification code",
                      variant: "destructive",
                    });
                  }
                }}
                className="w-full" 
                disabled={verifyOtpMutation.isPending || timeLeft <= 0}
                data-testid="verify-button"
              >
                {verifyOtpMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </Button>
            </div>
          </Form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Didn't receive the code?
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                if (verificationData) {
                  sendOtpMutation.mutate({
                    email: verificationData.email,
                    userType: verificationData.userType as "salon_owner" | "brand_owner",
                  });
                }
              }}
              disabled={sendOtpMutation.isPending || timeLeft > 540} // Allow resend after 1 minute
              className="w-full"
            >
              Resend Code
            </Button>
            <Button 
              variant="link" 
              onClick={() => setStep("email")} 
              className="w-full"
            >
              Change Email Address
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}