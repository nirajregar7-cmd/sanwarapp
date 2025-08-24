import { MapPin, Navigation, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/useGeolocation";

interface LocationStatusIndicatorProps {
  onRequestLocation?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

export default function LocationStatusIndicator({
  onRequestLocation,
  showActions = true,
  compact = false
}: LocationStatusIndicatorProps) {
  const { position, error, loading, isSupported } = useGeolocation();

  if (!isSupported) {
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-700">
        <AlertCircle className="h-3 w-3 mr-1" />
        Location not supported
      </Badge>
    );
  }

  if (loading) {
    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
        <Navigation className="h-3 w-3 mr-1 animate-spin" />
        Getting location...
      </Badge>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 ${compact ? 'text-sm' : ''}`}>
        <Badge variant="destructive" className="bg-red-100 text-red-700">
          <AlertCircle className="h-3 w-3 mr-1" />
          Location access denied
        </Badge>
        {showActions && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRequestLocation}
            className="text-xs"
          >
            Try again
          </Button>
        )}
      </div>
    );
  }

  if (position) {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-700">
        <CheckCircle className="h-3 w-3 mr-1" />
        Location found
        {position.accuracy && (
          <span className="ml-1 text-xs opacity-75">
            (±{Math.round(position.accuracy)}m)
          </span>
        )}
      </Badge>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${compact ? 'text-sm' : ''}`}>
      <Badge variant="secondary" className="bg-gray-100 text-gray-700">
        <MapPin className="h-3 w-3 mr-1" />
        Location disabled
      </Badge>
      {showActions && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRequestLocation}
          className="text-xs"
        >
          <Navigation className="h-3 w-3 mr-1" />
          Enable
        </Button>
      )}
    </div>
  );
}