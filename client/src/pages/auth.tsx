import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Scissors, Users, Eye, EyeOff, Gift } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";


// Enhanced AuthPage with email/password authentication
const AuthPageEnhanced = () => {
  const [activeTab, setActiveTab] = useState("signin");
  const [userType, setUserType] = useState<"customer" | "salon_owner" | "brand_owner">("customer");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    mobileNumber: "",
    referralCode: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (activeTab === "signin") {
        // Login
        const response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        if (response.ok) {
          toast({
            title: "Login Successful",
            description: "Welcome back!",
          });
          window.location.href = "/";
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
          toast({
            title: "Registration Successful",
            description: "Please check your email for verification.",
          });
          navigate(`/email-verification/${userType}`);
        } else {
          const data = await response.json();
          setError(data.error || "Registration failed");
        }
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
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



            {/* OR CONTINUE WITH EMAIL */}
            <div className="text-center">
              <div className="text-sm text-gray-500 font-medium">OR CONTINUE WITH EMAIL</div>
            </div>

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
                  <div className="relative mt-1">
                    <Input 
                      id="referralCode"
                      placeholder="Enter referral code (if you have one)"
                      className="rounded-lg pr-10"
                      value={formData.referralCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, referralCode: e.target.value }))}
                      data-testid="input-referralCode"
                    />
                    <Gift className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Have a referral code? Enter it to get special benefits during registration!</p>
                </div>
              )}

              <Button 
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full font-semibold py-4 rounded-lg transition-all duration-200 disabled:opacity-50 ${
                  activeTab === "signin" 
                    ? "bg-gray-800 text-white hover:bg-gray-900" 
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                data-testid={activeTab === "signin" ? "button-signin" : "button-signup"}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {activeTab === "signin" ? "Signing In..." : "Create Account"}
                  </>
                ) : (
                  activeTab === "signin" ? "Sign In" : "Create Account"
                )}
              </Button>

              {activeTab === "signin" && (
                <div className="text-center">
                  <Link href="/forgot-password" className="text-sm text-purple-600 hover:text-purple-700">
                    Forgot your password?
                  </Link>
                </div>
              )}

              {activeTab === "signup" && (
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    By continuing, you agree to our{" "}
                    <span className="text-purple-600">Terms of Service</span> and{" "}
                    <span className="text-purple-600">Privacy Policy</span>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function AuthPage() {
  // Check if we should show the enhanced version or the legacy version
  const urlParams = new URLSearchParams(window.location.search);
  const enhanced = urlParams.get('enhanced') === 'true';
  
  if (enhanced || true) { // Always use enhanced for now
    return <AuthPageEnhanced />;
  }
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    userType: "customer" as "customer" | "salon_owner" | "brand_owner",
    brandName: "",
    referralCode: "",
  });
  
  const [returnTo, setReturnTo] = useState<string | null>(null);

  // Get referral code and returnTo from URL on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    const userType = urlParams.get('type');
    const returnToParam = urlParams.get('returnTo');
    
    if (refCode) {
      setRegisterForm(prev => ({ ...prev, referralCode: refCode }));
      setActiveTab("register"); // Switch to register tab if referral code present
    }
    
    if (userType && (userType === "customer" || userType === "salon_owner" || userType === "brand_owner")) {
      setRegisterForm(prev => ({ ...prev, userType: userType as "customer" | "salon_owner" | "brand_owner" }));
    }
    
    if (returnToParam) {
      setReturnTo(returnToParam);
    }
  }, []);

  // Redirect if user is already logged in
  useEffect(() => {
    if (!isLoading && user) {
      // Redirect to returnTo path if specified, otherwise home
      setLocation(returnTo || "/");
    }
  }, [user, isLoading, setLocation, returnTo]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate(loginForm, {
      onSuccess: () => {
        toast({
          title: "Welcome back!",
          description: "You've been logged in successfully",
        });
        // Redirect to returnTo path if specified, otherwise home
        setLocation(returnTo || "/");
      },
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.email || !registerForm.password || !registerForm.firstName || !registerForm.userType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (registerForm.userType === "brand_owner" && !registerForm.brandName) {
      toast({
        title: "Missing Brand Name",
        description: "Please provide your brand name",
        variant: "destructive",
      });
      return;
    }

    if (registerForm.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    // For business accounts (salon_owner or brand_owner), redirect to email verification first
    if (registerForm.userType === "salon_owner" || registerForm.userType === "brand_owner") {
      // Store the registration data in sessionStorage to retrieve after email verification
      sessionStorage.setItem("pendingRegistration", JSON.stringify(registerForm));
      
      toast({
        title: "Email Verification Required",
        description: "Business accounts require email verification for security.",
      });
      
      // Redirect to email verification with pre-filled user type
      setLocation(`/email-verification/${registerForm.userType}`);
      return;
    }

    // For customer accounts, proceed with direct registration
    registerMutation.mutate(registerForm, {
      onSuccess: (data) => {
        let successMessage = "Welcome to Sanwar! Your account has been created successfully";
        if (data.referralUsed) {
          successMessage += " Your referral has been applied!";
        }
        
        toast({
          title: "Account Created!",
          description: successMessage,
        });
        // Redirect to returnTo path if specified, otherwise home
        setLocation(returnTo || "/");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
        <div className="animate-pulse">
          <div className="w-96 h-96 bg-white/20 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome to Sanwar</h1>
          <p className="text-sm sm:text-base text-white/90">Your smart salon booking platform</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 text-center pb-4 sm:pb-6">
            <CardTitle className="text-xl sm:text-2xl">Get Started</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                {/* Social Login Options */}
                <div className="space-y-4">
                  <SocialLoginButtons userType="customer" isLogin={true} />
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-muted-foreground">
                        Or continue with email
                      </span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      disabled={loginMutation.isPending}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        disabled={loginMutation.isPending}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {loginMutation.isError && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {loginMutation.error?.message || "Login failed. Please try again."}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Signing In..." : "Sign In"}
                  </Button>
                  
                  <div className="text-center">
                    <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-primary">
                      Forgot your password?
                    </Link>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                {/* User Type Selection First */}
                <div className="space-y-3">
                  <Label>I am a:</Label>
                  <RadioGroup
                    value={registerForm.userType}
                    onValueChange={(value) => 
                      setRegisterForm({ ...registerForm, userType: value as "customer" | "salon_owner" | "brand_owner" })
                    }
                    className="grid grid-cols-1 gap-3"
                  >
                    <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50">
                      <RadioGroupItem value="customer" id="customer" />
                      <Label htmlFor="customer" className="flex items-center cursor-pointer">
                        <Users className="w-4 h-4 mr-2" />
                        Customer
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50">
                      <RadioGroupItem value="salon_owner" id="salon_owner" />
                      <Label htmlFor="salon_owner" className="flex items-center cursor-pointer">
                        <Scissors className="w-4 h-4 mr-2" />
                        Salon Owner
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50">
                      <RadioGroupItem value="brand_owner" id="brand_owner" />
                      <Label htmlFor="brand_owner" className="flex items-center cursor-pointer">
                        <Gift className="w-4 h-4 mr-2" />
                        Brand Owner (Multiple Salons)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Social Login Options */}
                <div className="space-y-4">
                  <SocialLoginButtons userType={registerForm.userType} isLogin={false} />
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-muted-foreground">
                        Or continue with email
                      </span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        placeholder="First name"
                        value={registerForm.firstName}
                        onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                        disabled={registerMutation.isPending}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Last name"
                        value={registerForm.lastName}
                        onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                        disabled={registerMutation.isPending}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email *</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Enter your email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      disabled={registerMutation.isPending}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password (min. 6 characters)"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        disabled={registerMutation.isPending}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Password must be at least 6 characters long
                    </p>
                  </div>

                  {/* Brand Name Field - only show for brand owners */}
                  {registerForm.userType === "brand_owner" && (
                    <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Label htmlFor="brandName">Brand Name *</Label>
                      <Input
                        id="brandName"
                        placeholder="e.g., StyleCut, BeautyHub, etc."
                        value={registerForm.brandName}
                        onChange={(e) => setRegisterForm({ ...registerForm, brandName: e.target.value })}
                        disabled={registerMutation.isPending}
                        required
                      />
                      <p className="text-xs text-blue-600">
                        This will be used to group all your salon branches under one brand
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          id="referralCode"
                          placeholder="Enter referral code (if you have one)"
                          value={registerForm.referralCode}
                          onChange={(e) => setRegisterForm({ ...registerForm, referralCode: e.target.value.toUpperCase() })}
                          disabled={registerMutation.isPending}
                          className="pr-10"
                        />
                        <Gift className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      Have a referral code? Enter it to get special benefits during registration!
                    </p>
                  </div>

                  {registerMutation.isError && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {registerMutation.error?.message || "Registration failed. Please try again."}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center text-sm text-gray-500">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}