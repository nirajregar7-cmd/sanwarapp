import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Smartphone, Loader2, Shield, CheckCircle, Sparkles, ArrowLeft, UserPlus, LogIn } from "lucide-react";

export const PROFESSIONAL_TOKEN_KEY = "sanwar_professional_token";

export function useProfessionalAuth() {
  const token = localStorage.getItem(PROFESSIONAL_TOKEN_KEY);
  return {
    token,
    isAuthenticated: !!token,
    logout: () => localStorage.removeItem(PROFESSIONAL_TOKEN_KEY),
    getHeaders: () => token ? { Authorization: `Bearer ${token}` } : {},
  };
}

export default function ProfessionalLogin() {
  const { toast } = useToast();
  const { isAuthenticated } = useProfessionalAuth();
  const [, setLocation] = useLocation();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [pendingIsNew, setPendingIsNew] = useState(false);

  useEffect(() => {
    if (isAuthenticated) setLocation("/professional-dashboard");
  }, [isAuthenticated]);

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((p) => { if (p <= 1) { clearInterval(timer); return 0; } return p - 1; });
    }, 1000);
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast({ title: "Invalid number", description: "Enter a valid 10-digit mobile number", variant: "destructive" });
      return;
    }
    if (mode === "signup" && !name.trim()) {
      toast({ title: "Name required", description: "Please enter your full name", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const url = mode === "signup" ? "/api/professional/register-otp" : "/api/professional/send-otp";
      const body = mode === "signup" ? { fullName: name, phone } : { phone };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setStep("otp");
      setPendingIsNew(!!data.isNew);
      startCountdown();
      if (data.otp) setDevOtp(data.otp);
      toast({ title: "OTP Sent!", description: `OTP sent to ${phone}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      toast({ title: "Invalid OTP", description: "Enter the full OTP code", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/professional/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");
      localStorage.setItem(PROFESSIONAL_TOKEN_KEY, data.token);
      toast({ title: mode === "signup" ? "Account created! 🎉" : "Welcome back!", description: "Logged in successfully." });
      // New signup goes to complete profile, existing login goes to dashboard
      setLocation(pendingIsNew ? "/staff-registration" : "/professional-dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep("form");
    setOtp("");
    setDevOtp(null);
    setPendingIsNew(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3">
        <Link href="/professional-portal">
          <ArrowLeft className="w-5 h-5 text-gray-600 cursor-pointer" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Sanwar
          </span>
        </div>
        <div className="ml-auto text-xs text-gray-500">Professional Portal</div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Mode toggle */}
          {step === "form" && (
            <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
              <button
                onClick={() => { setMode("login"); resetForm(); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${mode === "login" ? "bg-white shadow text-indigo-700" : "text-gray-500 hover:text-gray-700"}`}
              >
                <LogIn className="w-4 h-4" /> Login
              </button>
              <button
                onClick={() => { setMode("signup"); resetForm(); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${mode === "signup" ? "bg-white shadow text-indigo-700" : "text-gray-500 hover:text-gray-700"}`}
              >
                <UserPlus className="w-4 h-4" /> Sign Up
              </button>
            </div>
          )}

          {/* Icon & title */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {step === "otp" ? "Enter OTP" : mode === "signup" ? "Create Account" : "Professional Login"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {step === "otp"
                ? `OTP sent to +91 ${phone}`
                : mode === "signup"
                ? "Register to create your professional profile"
                : "Enter your registered mobile number"}
            </p>
          </div>

          {/* Dev OTP hint */}
          {devOtp && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <p className="text-xs text-amber-700 font-medium">Dev OTP: <span className="font-bold text-amber-900 text-xl tracking-widest">{devOtp}</span></p>
            </div>
          )}

          {step === "form" ? (
            <div className="space-y-3">
              {mode === "signup" && (
                <Input
                  placeholder="Your Full Name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl"
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                />
              )}
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="tel"
                  placeholder="10-digit mobile number *"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="pl-10 h-12 rounded-xl tracking-wider text-center"
                  maxLength={10}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                />
              </div>
              <Button
                onClick={handleSendOtp}
                disabled={loading || phone.length < 10 || (mode === "signup" && !name.trim())}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send OTP"}
              </Button>

              <p className="text-center text-xs text-gray-400 pt-1">
                {mode === "login"
                  ? <>Don't have an account? <button onClick={() => setMode("signup")} className="text-indigo-600 font-semibold hover:underline">Sign Up</button></>
                  : <>Already registered? <button onClick={() => setMode("login")} className="text-indigo-600 font-semibold hover:underline">Login</button></>
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="h-12 text-2xl text-center tracking-[0.5em] font-mono rounded-xl"
                maxLength={6}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
              />
              <Button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 4}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <><CheckCircle className="w-4 h-4 mr-2" /> Verify & {mode === "signup" ? "Create Account" : "Login"}</>
                )}
              </Button>
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-500">Resend in {countdown}s</p>
                ) : (
                  <button onClick={handleSendOtp} disabled={loading} className="text-sm text-indigo-600 font-medium hover:underline">
                    Resend OTP
                  </button>
                )}
              </div>
              <button onClick={resetForm} className="w-full text-center text-sm text-gray-500 hover:text-gray-700">
                ← Go back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
