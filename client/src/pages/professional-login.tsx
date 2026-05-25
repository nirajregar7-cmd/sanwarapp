import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Smartphone, Loader2, Shield, CheckCircle, Sparkles, ArrowLeft, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const PROFESSIONAL_TOKEN_KEY = "sanwar_professional_token";

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

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);

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
    setLoading(true);
    try {
      const res = await fetch("/api/professional/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setStep("otp");
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
      toast({ title: "Welcome back!", description: "Logged in successfully." });
      setLocation("/professional-dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
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
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Professional Login</h1>
            <p className="text-sm text-gray-500 mt-1">
              {step === "phone"
                ? "Enter your registered mobile number to continue"
                : `Enter the OTP sent to +91 ${phone}`}
            </p>
          </div>

          {devOtp && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <p className="text-xs text-amber-700 font-medium">Dev Mode OTP: <span className="font-bold text-amber-900 text-lg">{devOtp}</span></p>
            </div>
          )}

          {step === "phone" ? (
            <div className="space-y-4">
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="pl-10 h-12 text-lg text-center tracking-wider"
                  maxLength={10}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                />
              </div>
              <Button
                onClick={handleSendOtp}
                disabled={loading || phone.length < 10}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send OTP"}
              </Button>
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative text-center text-xs text-gray-400 bg-white px-2 w-fit mx-auto">or</div>
              </div>
              <Link href="/staff-registration">
                <Button variant="outline" className="w-full h-11 rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                  <UserPlus className="w-4 h-4 mr-2" /> Register as a New Professional
                </Button>
              </Link>
              <p className="text-center text-xs text-gray-400 mt-2">
                Your mobile number must match your registration profile.
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
                className="h-12 text-2xl text-center tracking-[0.5em] font-mono"
                maxLength={6}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
              />
              <Button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 4}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <><CheckCircle className="w-4 h-4 mr-2" /> Verify & Login</>
                )}
              </Button>
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-500">Resend OTP in {countdown}s</p>
                ) : (
                  <button onClick={handleSendOtp} disabled={loading} className="text-sm text-indigo-600 font-medium hover:underline">
                    Resend OTP
                  </button>
                )}
              </div>
              <button onClick={() => { setStep("phone"); setOtp(""); setDevOtp(null); }} className="w-full text-center text-sm text-gray-500 hover:text-gray-700">
                Change phone number
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
