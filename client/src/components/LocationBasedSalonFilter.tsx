import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Navigation, Filter, RotateCcw } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";

interface LocationBasedSalonFilterProps {
  onLocationChange: (location: { lat: number; lng: number } | null) => void;
  onRadiusChange: (radius: number) => void;
  currentRadius: number;
  salonCount: number;
  isLoading: boolean;
}

export default function LocationBasedSalonFilter({
  onLocationChange,
  onRadiusChange,
  currentRadius,
  salonCount,
  isLoading
}: LocationBasedSalonFilterProps) {
  const {
    position,
    error,
    loading,
    requestLocation,
    clearLocation,
    isSupported
  } = useGeolocation();
  const [hasRequestedOnce, setHasRequestedOnce] = useState(false);
  const [tempRadius, setTempRadius] = useState(currentRadius);

  const handleLocationRequest = async () => {
    if (!hasRequestedOnce) {
      setHasRequestedOnce(true);
    }
    await requestLocation();
  };

  // Update parent when location changes
  useEffect(() => {
    if (position) {
      onLocationChange(position);
    }
  }, [position, onLocationChange]);

  // Update tempRadius when currentRadius changes
  useEffect(() => {
    setTempRadius(currentRadius);
  }, [currentRadius]);

  const radiusOptions = [
    { value: 5, label: "5 km" },
    { value: 10, label: "10 km" },
    { value: 20, label: "20 km" },
    { value: 30, label: "30 km" },
    { value: 50, label: "50 km" },
    { value: 100, label: "100 km" }
  ];

  if (!isSupported) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-yellow-800">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">Location services not supported by your browser</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Navigation className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-gray-900">Location-Based Discovery</h3>
          </div>
          {position && (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              {salonCount} nearby salon{salonCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Location Status */}
        <div className="space-y-3">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800">{error.message}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleLocationRequest}
                  disabled={loading}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : position ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    Location found (±{position.accuracy ? Math.round(position.accuracy) : '?'}m accuracy)
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    clearLocation();
                    onLocationChange(null);
                  }}
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={handleLocationRequest}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Navigation className="h-4 w-4 mr-2 animate-spin" />
                  Getting Your Location...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Find Salons Near Me
                </>
              )}
            </Button>
          )}
        </div>

        {/* Radius Selector */}
        {position && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <label className="text-sm font-medium text-gray-700">Search Radius</label>
            </div>
            <div className="flex space-x-2">
              <Select
                value={tempRadius.toString()}
                onValueChange={(value) => setTempRadius(parseInt(value))}
                data-testid="select-radius"
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {radiusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => onRadiusChange(tempRadius)}
                disabled={tempRadius === currentRadius}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-apply-radius"
              >
                Apply
              </Button>
            </div>
            {tempRadius !== currentRadius && (
              <p className="text-xs text-gray-500">
                Click Apply to search within {tempRadius}km radius
              </p>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && position && (
          <div className="text-center py-2">
            <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Searching nearby salons...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}