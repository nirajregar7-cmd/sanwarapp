import { useState } from "react";
import { AlertTriangle, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmergencyBookingModal } from "./EmergencyBookingModal";

interface EmergencyBookingBannerProps {
  salon: any;
  service: any;
  selectedDate: string;
  hasAvailableSlots: boolean;
}

export function EmergencyBookingBanner({
  salon,
  service,
  selectedDate,
  hasAvailableSlots,
}: EmergencyBookingBannerProps) {
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === today;

  // Only show emergency booking for today when no slots are available
  if (!isToday || hasAvailableSlots) {
    return null;
  }

  return (
    <>
      <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-orange-800">All Slots Full?</h3>
                <Zap className="h-4 w-4 text-orange-600" />
              </div>
              <p className="text-sm text-orange-700 mb-3">
                Need an urgent appointment today? Request an emergency booking with same-day priority!
              </p>
              
              <div className="flex items-center gap-4 mb-3 text-xs text-orange-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Same-day service</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>+50% emergency fee</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Subject to availability</span>
                </div>
              </div>

              <Button
                onClick={() => setShowEmergencyModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white"
                size="sm"
              >
                Request Emergency Booking
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <EmergencyBookingModal
        open={showEmergencyModal}
        onOpenChange={setShowEmergencyModal}
        salon={salon}
        service={service}
        selectedDate={selectedDate}
      />
    </>
  );
}