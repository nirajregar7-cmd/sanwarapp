import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Shield, Target, X } from "lucide-react";

interface LocationPermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAllow: () => void;
  onDeny: () => void;
}

export default function LocationPermissionDialog({
  isOpen,
  onClose,
  onAllow,
  onDeny
}: LocationPermissionDialogProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleAllow = async () => {
    setIsRequesting(true);
    try {
      await onAllow();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDeny = () => {
    onDeny();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <DialogTitle className="text-lg font-semibold">
                Enable Location Access
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-sm text-gray-600 mt-2">
            We'd like to show you salons near your location for a better experience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <Target className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>Find salons within 30km of your location</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Navigation className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>See distance and directions to each salon</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Shield className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>Your location data stays private and secure</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleAllow}
              disabled={isRequesting}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isRequesting ? (
                <>
                  <Navigation className="h-4 w-4 mr-2 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Allow Location
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleDeny}
              disabled={isRequesting}
              className="flex-1"
            >
              Show All India Salons
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Choosing "Show All India Salons" will display salons across the country. You can change location settings anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}