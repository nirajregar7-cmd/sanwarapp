import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Users, Target, Loader2 } from "lucide-react";

interface ReferralData {
  code: string;
  referrer: {
    id: string;
    firstName: string;
    userType: string;
  } | null;
  referralType: string;
  isValid: boolean;
}

interface ReferralCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ReferralCodeInput({ value, onChange, disabled, className }: ReferralCodeInputProps) {
  const [debouncedCode, setDebouncedCode] = useState(value);

  // Debounce the referral code input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCode(value);
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  // Fetch referral data when code changes
  const { data: referralData, isLoading, error } = useQuery<ReferralData>({
    queryKey: ["/api/referral", debouncedCode],
    enabled: debouncedCode.length >= 4, // Only query if code is reasonable length
    retry: false,
  });

  const getReferralTypeDisplay = (type: string) => {
    switch (type) {
      case "customer_to_customer":
        return { label: "Customer Referral", icon: Users, color: "blue" };
      case "customer_to_shopkeeper":
        return { label: "Shopkeeper Referral", icon: Target, color: "green" };
      case "shopkeeper_milestone":
        return { label: "Milestone Referral", icon: Target, color: "purple" };
      default:
        return { label: "Referral", icon: Users, color: "gray" };
    }
  };

  const showValidation = debouncedCode.length >= 4;
  const isValid = referralData?.isValid && !error;
  const isInvalid = (error || (referralData && !referralData.isValid)) && !isLoading;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="referralCode">
          Referral Code <span className="text-gray-500">(Optional)</span>
        </Label>
        <div className="relative">
          <Input
            id="referralCode"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            placeholder="Enter referral code"
            disabled={disabled}
            className={className}
            maxLength={10}
          />
          {showValidation && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              ) : isValid ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : isInvalid ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Referral Information Card */}
      {showValidation && !isLoading && referralData && (
        <Card className={isValid ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20" : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"}>
          <CardContent className="p-4">
            {isValid ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Valid Referral Code
                  </span>
                </div>
                
                {referralData.referrer && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-700 dark:text-green-300">
                        Referred by: <span className="font-medium">{referralData.referrer.firstName}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {(() => {
                        const typeDisplay = getReferralTypeDisplay(referralData.referralType);
                        const Icon = typeDisplay.icon;
                        return (
                          <>
                            <Icon className="h-4 w-4" />
                            <Badge variant="secondary" className={`bg-${typeDisplay.color}-100 text-${typeDisplay.color}-800 dark:bg-${typeDisplay.color}-900 dark:text-${typeDisplay.color}-200`}>
                              {typeDisplay.label}
                            </Badge>
                          </>
                        );
                      })()}
                    </div>

                    <div className="text-xs text-green-600 dark:text-green-400 mt-2">
                      {referralData.referralType === "customer_to_customer" && (
                        "You'll help your referrer progress towards their 10-customer milestone!"
                      )}
                      {referralData.referralType === "customer_to_shopkeeper" && (
                        "Your referrer will earn a free booking credit when you sign up!"
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800 dark:text-red-200">
                  Invalid or expired referral code
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {showValidation && !isLoading && error && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Could not validate referral code
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}