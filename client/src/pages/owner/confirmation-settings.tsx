import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, Settings, DollarSign, Percent } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SalonSettings {
  id: string;
  confirmationAmount: number; // in paise
  adminRevenueShare: number;
  shopkeeperRevenueShare: number;
}

export default function ConfirmationSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmationFee, setConfirmationFee] = useState<string>("3"); // in rupees for display

  // Fetch current salon settings
  const { data: salonSettings, isLoading } = useQuery({
    queryKey: ["/api/owner/salon-settings"],
    queryFn: async () => {
      const response = await fetch("/api/owner/salon-settings");
      if (!response.ok) throw new Error("Failed to fetch salon settings");
      return response.json() as SalonSettings;
    },
  });

  // Update confirmation fee mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { confirmationAmount: number }) => {
      return apiRequest("POST", "/api/owner/salon-settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Confirmation fee has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/salon-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const feeInPaise = Math.round(parseFloat(confirmationFee) * 100);
    
    if (feeInPaise < 100 || feeInPaise > 50000) { // ₹1 to ₹500 range
      toast({
        title: "Invalid Amount",
        description: "Confirmation fee must be between ₹1 and ₹500",
        variant: "destructive",
      });
      return;
    }

    updateSettingsMutation.mutate({ confirmationAmount: feeInPaise });
  };

  // Set initial value when data loads
  if (salonSettings && confirmationFee === "3") {
    setConfirmationFee((salonSettings.confirmationAmount / 100).toString());
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto" data-testid="confirmation-settings-page">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Confirmation Fee Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Customer Confirmation Fee
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              How It Works
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Customers pay this amount when booking to confirm their appointment</li>
              <li>• Remaining service amount is paid at your salon</li>
              <li>• 80% of confirmation fee goes to your bank account</li>
              <li>• 20% goes to platform for processing and support</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="confirmationFee">Confirmation Fee (₹)</Label>
              <Input
                id="confirmationFee"
                type="number"
                min="1"
                max="500"
                step="0.01"
                value={confirmationFee}
                onChange={(e) => setConfirmationFee(e.target.value)}
                placeholder="Enter confirmation fee"
                data-testid="input-confirmation-fee"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Amount between ₹1 and ₹500 that customers pay to confirm booking
              </p>
            </div>

            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-900 dark:text-green-100">
                    Your Share: 80%
                  </span>
                </div>
                <p className="text-sm text-green-800 dark:text-green-200">
                  ₹{((parseFloat(confirmationFee) || 0) * 0.8).toFixed(2)} per booking
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="w-4 h-4 text-gray-600" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    Platform Share: 20%
                  </span>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  ₹{((parseFloat(confirmationFee) || 0) * 0.2).toFixed(2)} per booking
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              className="w-full"
              data-testid="button-save-settings"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </form>

          <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              Important Notes
            </h4>
            <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
              <li>• Changes take effect immediately for new bookings</li>
              <li>• Existing bookings maintain their original confirmation fee</li>
              <li>• Revenue is automatically split and processed daily</li>
              <li>• Ensure your bank details are verified for automatic transfers</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}