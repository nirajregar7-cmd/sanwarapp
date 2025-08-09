import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Gift } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface ReferralCodeInputProps {
  onCodeApplied: (codeData: any) => void;
  onCodeRemoved: () => void;
  appliedCode?: any;
  disabled?: boolean;
}

export function ReferralCodeInput({ 
  onCodeApplied, 
  onCodeRemoved, 
  appliedCode, 
  disabled = false 
}: ReferralCodeInputProps) {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState("");

  const validateCode = async () => {
    if (!code.trim()) {
      setError("Please enter a referral code");
      return;
    }

    setIsValidating(true);
    setError("");

    try {
      const response = await apiRequest("POST", "/api/validate-referral", {
        code: code.trim().toUpperCase(),
        userId: user?.id
      });
      
      const codeData = await response.json();
      
      if (response.ok && codeData.valid) {
        onCodeApplied(codeData);
        setCode("");
      } else {
        setError(codeData.error || "Invalid referral code");
      }
    } catch (error) {
      console.error("Error validating referral code:", error);
      setError("Failed to validate referral code");
    } finally {
      setIsValidating(false);
    }
  };

  const removeCode = () => {
    setCode("");
    setError("");
    onCodeRemoved();
  };

  const getDiscountText = (codeData: any) => {
    if (codeData.discountType === 'free') {
      return "FREE BOOKING";
    } else if (codeData.discountType === 'percentage') {
      return `${codeData.discountValue}% OFF`;
    } else if (codeData.discountType === 'fixed') {
      return `₹${codeData.discountValue} OFF`;
    }
    return "DISCOUNT APPLIED";
  };

  if (appliedCode) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-800">Referral Code Applied!</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeCode}
              disabled={disabled}
              className="text-green-600 hover:text-green-700"
            >
              Remove
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {appliedCode.code}
            </Badge>
            <Badge variant="default" className="bg-green-600">
              {getDiscountText(appliedCode)}
            </Badge>
          </div>
          {appliedCode.description && (
            <p className="text-sm text-green-700">{appliedCode.description}</p>
          )}
          <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Discount will be applied to your booking</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Have a Referral Code?
        </CardTitle>
        <CardDescription>
          Enter your referral code to get discounts or free bookings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <Label htmlFor="referral-code">Referral Code</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="referral-code"
                placeholder="Enter code (e.g., FREEBOOK)"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    validateCode();
                  }
                }}
                disabled={disabled || isValidating}
                className={error ? "border-red-300" : ""}
              />
              <Button
                onClick={validateCode}
                disabled={disabled || isValidating || !code.trim()}
                size="default"
              >
                {isValidating ? "Checking..." : "Apply"}
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="text-xs text-gray-500">
            <p>• Referral codes can provide free bookings or discounts</p>
            <p>• Each code can only be used once per customer</p>
            <p>• Codes are case-insensitive</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}