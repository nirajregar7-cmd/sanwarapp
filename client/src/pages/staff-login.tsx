import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { ArrowLeft, Smartphone, Loader2, Shield, CheckCircle, Sparkles } from "lucide-react";

export default function StaffLogin() {
  const { toast } = useToast();
  const { staff, isAuthenticated, sendOtpMutation, verifyOtpMutation } = useStaffAuth();
  const [, setLocation] = useLocation();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);

  if (isAuthenticated && staff) {
    setLocation("/staff-dashboard");
    return null;
  }

  const handleSendOtp = () => {
    if (!phone || phone.length < 10) {
      toast({ title: "Invalid phone", description: "Enter a valid mobile number", variant: "destructive" });
      return;
    }
    sendOtpMutation.mutate(phone, {
      onSuccess: () => {
        setStep("otp");
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) { clearInterval(timer); return 0; }
            return prev - 1;
          });
        }, 1000);
      },
    });
  };

  const handleVerifyOtp = () => {
    if (!otp || otp.length < 4) {
      toast({ title: "Invalid OTP", description: "Enter the full OTP code", variant: "destructive" });
      return;
    }
    verifyOtpMutation.mutate({ phone, otp });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3">
        <Link href="/"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
            Sanwar
          </span>
        </div>
        <div className="ml-auto text-xs text-gray-500">Staff Portal</div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Login</h1>
            <p className="text-sm text-gray-500 mt-1">
              {step === "phone"
                ? "Enter your registered mobile number"
                : `Enter OTP sent to ${phone}`}
            </p>
          </div>

          {step === "phone" ? (
            <div className="space-y-4">
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="tel"
                  placeholder="Enter mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="pl-10 h-12 text-lg text-center tracking-wider"
                  maxLength={10}
                />
              </div>
              <Button
                onClick={handleSendOtp}
                disabled={sendOtpMutation.isPending || phone.length < 10}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-700 hover:to-pink-600 text-white font-semibold"
              >
                {sendOtpMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Send OTP"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-12 text-2xl text-center tracking-[0.5em] font-mono"
                  maxLength={6}
                  autoFocus
                />
              </div>
              <Button
                onClick={handleVerifyOtp}
                disabled={verifyOtpMutation.isPending || otp.length < 6}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-700 hover:to-pink-600 text-white font-semibold"
              >
                {verifyOtpMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verify & Login
                  </>
                )}
              </Button>
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-500">
                    Resend OTP in {countdown}s
                  </p>
                ) : (
                  <button
                    onClick={handleSendOtp}
                    disabled={sendOtpMutation.isPending}
                    className="text-sm text-indigo-600 font-medium hover:text-indigo-700 disabled:opacity-50"
                  >
                    {sendOtpMutation.isPending ? "Sending..." : "Resend OTP"}
                  </button>
                )}
              </div>
              <button
                onClick={() => { setStep("phone"); setOtp(""); }}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
              >
                Change phone number
              </button>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              Your salon owner must add you as staff with your mobile number before you can login.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
