import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Eye, EyeOff, Users, Scissors, Gift, Check, X, Smartphone, ArrowLeft, Home } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SalonOwnerOtpAuth from "@/components/SalonOwnerOtpAuth";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("signin");
  const [userType, setUserType] = useState<"customer" | "salon_owner" | "brand_owner">("customer");
  const [showOtpAuth, setShowOtpAuth] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    mobileNumber: "",
    referralCode: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [location, navigate] = useLocation();
  const [referralCodeStatus, setReferralCodeStatus] = useState<{
    status: 'idle' | 'validating' | 'valid' | 'invalid';
    message: string;
  }>({ status: 'idle', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (activeTab === "signin") {
        // Login
        if (!formData.email || !formData.password) {
          setError("Email and password are required");
          return;
        }

        const response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Login successful:", data);
          navigate("/");
          window.location.reload();
        } else {
          const data = await response.json();
          setError(data.error || "Login failed");
        }
      } else {
        // Register
        if (!formData.firstName) {
          setError("First name is required");
          return;
        }
        if (!formData.mobileNumber) {
          setError("Mobile number is required");
          return;
        }

        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.mobileNumber,
            userType: userType,
            referralCode: formData.referralCode,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Registration successful:", data);
          
          // Clear any existing onboarding status for new users
          localStorage.removeItem(`sanwar_onboarding_${userType}`);
          localStorage.removeItem(`sanwar_onboarding_${userType}_completed_at`);
          localStorage.removeItem(`sanwar_onboarding_${userType}_skipped_at`);
          
          // Mark that this is a fresh signup to trigger onboarding
          localStorage.setItem(`sanwar_onboarding_${userType}_fresh_signup`, 'true');
          
          navigate("/");
          window.location.reload();
        } else {
          const data = await response.json();
          setError(data.error || "Registration failed");
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleValidateReferralCode = async () => {
    if (!formData.referralCode.trim()) {
      setReferralCodeStatus({ status: 'invalid', message: 'Please enter a referral code' });
      return;
    }

    setReferralCodeStatus({ status: 'validating', message: 'Checking referral code...' });

    try {
      const response = await fetch("/api/validate-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: formData.referralCode.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setReferralCodeStatus({ 
          status: 'valid', 
          message: `✓ Valid code! Referred by ${data.referrerName}. You'll get ${data.bonusAmount} bonus credits!`
        });
      } else {
        setReferralCodeStatus({ 
          status: 'invalid', 
          message: data.message || 'Invalid referral code'
        });
      }
    } catch (error) {
      setReferralCodeStatus({ 
        status: 'invalid', 
        message: 'Error validating referral code. Please try again.'
      });
    }
  };
  
  // Handle OTP auth success
  const handleOtpAuthSuccess = () => {
    navigate("/");
    window.location.reload();
  };

  // Show OTP authentication for salon owners
  if (showOtpAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 px-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Welcome to Sanwar</h1>
            <p className="text-white/90 text-lg">Your smart salon booking platform</p>
          </div>
          <SalonOwnerOtpAuth
            onBack={() => setShowOtpAuth(false)}
            onSuccess={handleOtpAuthSuccess}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to Sanwar</h1>
          <p className="text-white/90 text-lg">Your smart salon booking platform</p>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-3xl">
          <CardHeader className="text-center pb-6">
            {/* Back to Home Link */}
            <div className="mb-4">
              <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm transition-colors" data-testid="link-back-home-card">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span>Back to Home</span>
              </Link>
            </div>
            
            <CardTitle className="text-2xl font-bold text-gray-900">
              Get Started
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Sign in to your account or create a new one
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Toggle between Sign In and Sign Up */}
            <div className="flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setActiveTab("signin")}
                className={`flex-1 py-3 px-6 rounded-full text-sm font-medium transition-colors ${
                  activeTab === "signin"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveTab("signup")}
                className={`flex-1 py-3 px-6 rounded-full text-sm font-medium transition-colors ${
                  activeTab === "signup"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Role Selection for Sign Up */}
            {activeTab === "signup" && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">I am a:</h3>
                <RadioGroup 
                  value={userType} 
                  onValueChange={(value) => setUserType(value as "customer" | "salon_owner" | "brand_owner")}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-3 p-2">
                    <RadioGroupItem value="customer" id="customer" />
                    <Users className="h-4 w-4 text-gray-600" />
                    <Label htmlFor="customer" className="flex-1 cursor-pointer text-sm">
                      Customer
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-2">
                    <RadioGroupItem value="salon_owner" id="salon_owner" />
                    <Scissors className="h-4 w-4 text-gray-600" />
                    <Label htmlFor="salon_owner" className="flex-1 cursor-pointer text-sm">
                      Salon Owner
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-2">
                    <RadioGroupItem value="brand_owner" id="brand_owner" />
                    <Gift className="h-4 w-4 text-gray-600" />
                    <Label htmlFor="brand_owner" className="flex-1 cursor-pointer text-sm">
                      Brand Owner (Multiple Salons)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}


            {/* Email/Password Form */}
            <div className="space-y-4">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {activeTab === "signup" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                        First Name *
                      </Label>
                      <Input 
                        id="firstName"
                        placeholder="First name"
                        className="mt-1 rounded-lg"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        data-testid="input-firstName"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                        Last Name
                      </Label>
                      <Input 
                        id="lastName"
                        placeholder="Last name"
                        className="mt-1 rounded-lg"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        data-testid="input-lastName"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email {activeTab === "signup" ? "*" : ""}
                </Label>
                <Input 
                  id="email"
                  type="email" 
                  placeholder="Enter your email"
                  className="mt-1 rounded-lg"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  data-testid="input-email"
                />
              </div>

              {activeTab === "signup" && (
                <div>
                  <Label htmlFor="mobileNumber" className="text-sm font-medium text-gray-700">
                    Mobile Number *
                  </Label>
                  <Input 
                    id="mobileNumber"
                    type="tel" 
                    placeholder="Enter your mobile number"
                    className="mt-1 rounded-lg"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobileNumber: e.target.value }))}
                    data-testid="input-mobileNumber"
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password {activeTab === "signup" ? "*" : ""}
                </Label>
                <div className="relative mt-1">
                  <Input 
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={activeTab === "signup" ? "Create a password (min. 6 characters)" : "Enter your password"}
                    className="rounded-lg"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    data-testid="input-password"
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {activeTab === "signup" && (
                  <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
                )}
              </div>

              {activeTab === "signup" && (
                <div>
                  <Label htmlFor="referralCode" className="text-sm font-medium text-gray-700">
                    Referral Code (Optional)
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <div className="relative flex-1">
                      <Input 
                        id="referralCode"
                        placeholder="Enter referral code (if you have one)"
                        className={`rounded-lg pr-10 ${
                          referralCodeStatus.status === 'valid' ? 'border-green-500 bg-green-50' :
                          referralCodeStatus.status === 'invalid' ? 'border-red-500 bg-red-50' : ''
                        }`}
                        value={formData.referralCode}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, referralCode: e.target.value }));
                          setReferralCodeStatus({ status: 'idle', message: '' });
                        }}
                        data-testid="input-referralCode"
                      />
                      {referralCodeStatus.status === 'validating' ? (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                        </div>
                      ) : referralCodeStatus.status === 'valid' ? (
                        <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
                      ) : referralCodeStatus.status === 'invalid' ? (
                        <X className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-600" />
                      ) : (
                        <Gift className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={handleValidateReferralCode}
                      disabled={!formData.referralCode.trim() || referralCodeStatus.status === 'validating'}
                      className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                      data-testid="button-apply-referral"
                    >
                      {referralCodeStatus.status === 'validating' ? 'Checking...' : 'Apply Code'}
                    </Button>
                  </div>
                  {referralCodeStatus.message && (
                    <p className={`text-xs mt-1 ${
                      referralCodeStatus.status === 'valid' ? 'text-green-600' : 
                      referralCodeStatus.status === 'invalid' ? 'text-red-600' : 
                      'text-gray-500'
                    }`}>
                      {referralCodeStatus.message}
                    </p>
                  )}
                  {!referralCodeStatus.message && (
                    <p className="text-xs text-gray-500 mt-1">Have a referral code? Enter it to get special benefits during registration!</p>
                  )}
                </div>
              )}

              <Button 
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full font-semibold py-4 rounded-lg transition-all duration-200 disabled:opacity-50 border-0 ${
                  activeTab === "signin" 
                    ? "bg-gray-200 text-gray-900 hover:bg-gray-300" 
                    : "bg-transparent text-gray-900 hover:bg-gray-50"
                }`}
                data-testid={activeTab === "signin" ? "button-signin" : "button-signup"}
              >
                {loading ? (
                  <>
                    <div className={`animate-spin rounded-full h-4 w-4 border-b-2 mr-2 ${
                      activeTab === "signin" ? "border-gray-900" : "border-white"
                    }`}></div>
                    {activeTab === "signin" ? "Signing In..." : "Create Account"}
                  </>
                ) : (
                  activeTab === "signin" ? "Sign In" : "Create Account"
                )}
              </Button>

              {activeTab === "signin" && (
                <div className="space-y-4">
                  {/* Forgot Password */}
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Having trouble signing in?</p>
                    <Link href="/forgot-password" className="text-sm font-medium text-purple-600 hover:text-purple-700" data-testid="link-forgot-password">
                      Forgot your password?
                    </Link>
                  </div>
                  
                  {/* Register Prompt */}
                  <div className="text-center p-3 border border-purple-200 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-700 mb-2">Don't have an account yet?</p>
                    <button
                      onClick={() => setActiveTab("signup")}
                      className="text-sm font-medium text-purple-600 hover:text-purple-700 underline"
                      data-testid="button-switch-to-signup"
                    >
                      Register now
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "signup" && (
                <div className="space-y-4">
                  {/* Terms */}
                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      By continuing, you agree to our{" "}
                      <span className="text-purple-600">Terms of Service</span> and{" "}
                      <span className="text-purple-600">Privacy Policy</span>
                    </p>
                  </div>
                  
                  {/* Sign In Prompt */}
                  <div className="text-center p-3 border border-gray-200 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 mb-2">Already have an account?</p>
                    <button
                      onClick={() => setActiveTab("signin")}
                      className="text-sm font-medium text-purple-600 hover:text-purple-700 underline"
                      data-testid="button-switch-to-signin"
                    >
                      Sign in now
                    </button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}